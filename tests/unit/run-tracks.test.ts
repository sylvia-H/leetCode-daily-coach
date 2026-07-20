import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/main.js";

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
      pushTrack: async (track) => {
        if (track === "foundation") {
          throw new Error("推播失敗：HTTP 500");
        }
        secondCalled = true;
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
      pushTrack: async (track) => {
        if (track === "foundation") {
          throw new Error("推播失敗：HTTP 500");
        }
        secondCalled = true;
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
      { pushTrack },
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
    const exitCode = await run(baseEnv(), { pushTrack });

    expect(exitCode).toBe(1);
    expect(pushTrack).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("三個 webhook 皆空 → 完全未呼叫 fetch，僅 log + exit 1", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const pushTrack = vi.fn();
    const exitCode = await run({ STATE_FILE: stateFile }, { pushTrack });

    expect(exitCode).toBe(1);
    expect(pushTrack).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
