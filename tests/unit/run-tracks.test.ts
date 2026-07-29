import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PartialPushError, run } from "../../src/main.js";
import type { Lesson } from "../../src/types/lesson.js";

function makeLesson(): Lesson {
  return {
    sessionIndex: 1,
    type: "concept",
    track: "foundation",
    color: 1,
    concept: {
      id: "left-right-pointer",
      title: "Left-Right Pointer",
      digest: "d",
      tsTip: "t",
      pyTip: "p",
      takeaway: "tk",
      exitCriteria: ["c1"],
      patternLabel: "Two Pointer",
      complexityLabel: "O(n)",
      estimatedMinutes: 15,
      articlePath: "articles/x.md",
    },
    problems: [],
    path: { current: "Left-Right Pointer" },
  };
}

describe("run — 多 Track 失敗隔離", () => {
  let dir: string;
  let stateFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "run-tracks-"));
    stateFile = join(dir, "state.json");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // webhook 重試不該讓測試真的等待（且斷言不該受 jitter 影響）。
  const fastRetry = { sleep: async () => undefined, random: () => 0 };

  const baseEnv = () => ({
    DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
    DISCORD_WEBHOOK_URL_INTERVIEW_READY: "https://discord.com/api/webhooks/2/bbb",
    STATE_FILE: stateFile,
  });

  it("第 1 個 Track 拋錯、第 2 個成功 → 第 2 個仍被處理、exit code 1、失敗 Track 有發出告警", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    let secondCalled = false;
    const exitCode = await run(baseEnv(), {
      webhookOptions: fastRetry,
      pushTrack: async (track) => {
        if (track === "foundation") {
          throw new Error("推播失敗：HTTP 500");
        }
        secondCalled = true;
        return makeLesson();
      },
    });

    expect(secondCalled).toBe(true);
    expect(exitCode).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://discord.com/api/webhooks/1/aaa");
    const body = JSON.parse(init.body as string) as { embeds: Array<{ title: string }> };
    expect(body.embeds[0]?.title).toBe("⚠️ 推播失敗 · foundation");
  });

  it("第 1 個 Track 推播失敗且其告警 POST 亦失敗 → 第 2 個仍被處理並成功，exit 1，且未拋出未捕捉例外", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    let secondCalled = false;
    const exitCode = await run(baseEnv(), {
      webhookOptions: fastRetry,
      pushTrack: async (track) => {
        if (track === "foundation") {
          throw new Error("推播失敗：HTTP 500");
        }
        secondCalled = true;
        return makeLesson();
      },
    });

    expect(secondCalled).toBe(true);
    expect(exitCode).toBe(1);

    const errorCalls = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.map(
      (args) => String(args[0]),
    );
    expect(errorCalls.some((line) => line.includes("foundation: failed"))).toBe(true);
    expect(errorCalls.some((line) => line.startsWith("alert-failed: foundation"))).toBe(true);
  });

  it("全域性失敗（STATE_FILE 缺失）→ 以 null 呼叫 renderAlert 並 POST 至第一個已設定 webhook、exit 1、未寫入 state", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const pushTrack = vi.fn();
    const exitCode = await run(
      {
        DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
      },
      { pushTrack, webhookOptions: fastRetry },
    );

    expect(exitCode).toBe(1);
    expect(pushTrack).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://discord.com/api/webhooks/1/aaa");
    const body = JSON.parse(init.body as string) as { embeds: Array<{ title: string }> };
    expect(body.embeds[0]?.title).toBe("⚠️ 推播失敗 · 全域");
  });

  it("全域性失敗（state.json 損毀）→ 發全域告警、exit 1、原檔未被覆寫", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);
    const broken = "{ not json";
    writeFileSync(stateFile, broken);

    const pushTrack = vi.fn();
    const exitCode = await run(baseEnv(), { pushTrack, webhookOptions: fastRetry });

    expect(exitCode).toBe(1);
    expect(pushTrack).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // 【保留理由】contracts/e2e-harness.md §4：真實 seed 素材（39 筆 Lesson）目前渲染總字數最大僅
  // 1,201（遠低於 5,500 拆訊息門檻），render() 從未把任何一課拆成 2 則訊息，故 PartialPushError
  // 分支在現行真實素材下無法由 tests/e2e/** 唯一允許的 fetch 替身觸發——只能靠 pushTrack 替身直接
  // 拋出來製造這個例外形狀。2026-07-29 與使用者確認：沿用本案例覆蓋，e2e 不為此人工湊出多則訊息。
  it("多則訊息推播到一半失敗 → state 仍前進（避免補跑重發已送出的前段），但 exit 1 且有告警", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const lesson = makeLesson();
    const exitCode = await run(
      { DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa", STATE_FILE: stateFile },
      {
        webhookOptions: fastRetry,
        pushTrack: async () => {
          throw new PartialPushError(lesson, 1, 2, new Error("推播失敗：HTTP 500"));
        },
      },
    );

    expect(exitCode).toBe(1);
    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: { foundation: { currentSessionIndex: number; lastPushAt: string | null } };
    };
    expect(saved.tracks.foundation.currentSessionIndex).toBe(2);
    expect(saved.tracks.foundation.lastPushAt).not.toBeNull();

    const errorCalls = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((args) =>
      String(args[0]),
    );
    expect(errorCalls.some((line) => line.includes("partial push"))).toBe(true);

    // F6 T028a／FR-012：告警內文 MUST 明示「本課進度已前進、不會補推」，避免維運者誤等自動補推。
    const [, alertInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const alertBody = JSON.parse(alertInit.body as string) as { embeds: Array<{ description: string }> };
    expect(alertBody.embeds[0]?.description).toContain("本課進度已前進、不會補推");
  });

  it("三個 webhook 皆空 → 完全未呼叫 fetch，僅 log + exit 1", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const pushTrack = vi.fn();
    const exitCode = await run({ STATE_FILE: stateFile }, { pushTrack, webhookOptions: fastRetry });

    expect(exitCode).toBe(1);
    expect(pushTrack).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
