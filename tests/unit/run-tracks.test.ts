import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
});
