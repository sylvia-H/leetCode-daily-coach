// F6 FR-022 / FR-022b（2026-07-29 code review 後補）：完課判定的兩道守衛。
//  1. 空課表（sessions 為 0 個）MUST 判為該軌失敗，MUST NOT 誤判為完課。
//  2. completedAt 殘留但進度仍在課表範圍內 MUST 自動解除（clearCompleted 只刪鍵）。
// 空課表無法由真實凍結課表構造（三軌皆為 13 課的密集序列），且 e2e 只允許 fetch 一個替身
// （e2e-harness.md §2），故此案例以「替換 loadCompilerDeps 回傳的課表」在單元層驗證。
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CompilerDeps } from "../../src/compiler/lesson.js";
import { run } from "../../src/main.js";
import { clearCompleted, load as loadState, type AppState } from "../../src/state/state-store.js";

// vi.mock 由 vitest 提升至所有 import 之前；旗標本身在測試執行時才被讀取（工廠只在 import 時建立函式）。
let emptyFoundationSchedule = false;

vi.mock("../../src/compiler/lesson.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/compiler/lesson.js")>();
  return {
    ...actual,
    loadCompilerDeps: (...args: Parameters<typeof actual.loadCompilerDeps>): CompilerDeps => {
      const deps = actual.loadCompilerDeps(...args);
      if (!emptyFoundationSchedule) return deps;
      return {
        ...deps,
        schedules: {
          ...deps.schedules,
          foundation: { ...deps.schedules.foundation, sessions: [] },
        },
      };
    },
  };
});

const FOUNDATION_HOOK = "https://discord.com/api/webhooks/1000/foundation-hook";
const fastRetry = { sleep: async () => undefined, random: () => 0 };

describe("完課判定的守衛（FR-022 / FR-022b）", () => {
  let dir: string;
  let stateFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "completion-guard-"));
    stateFile = join(dir, "state.json");
    emptyFoundationSchedule = false;
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("課表為空 → 該軌失敗（紅色告警 + exit 1），MUST NOT 寫入 completedAt", async () => {
    emptyFoundationSchedule = true;
    writeFileSync(
      stateFile,
      JSON.stringify({
        tracks: { foundation: { currentSessionIndex: 3, lastPushAt: null, completedConceptIds: [], history: [] } },
      }),
    );
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204, headers: { get: () => null } });
    vi.stubGlobal("fetch", fetchMock);

    const exitCode = await run(
      { DISCORD_WEBHOOK_URL_FOUNDATION: FOUNDATION_HOOK, STATE_FILE: stateFile },
      { webhookOptions: fastRetry },
    );

    expect(exitCode).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { embeds: Array<{ color: number; description: string }> };
    // 紅色告警（15158332），而非綠色完課通知（3066993）。
    expect(body.embeds[0]?.color).toBe(15158332);
    expect(body.embeds[0]?.description).toContain("課表為空");

    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: { foundation: Record<string, unknown> };
    };
    expect("completedAt" in saved.tracks.foundation).toBe(false);
    // 失敗軌進度不變（漏跑不跳課）。
    expect(saved.tracks.foundation.currentSessionIndex).toBe(3);
  });

  it("clearCompleted 刪除 completedAt 鍵本身（非設為 null），且不動其餘欄位", () => {
    writeFileSync(
      stateFile,
      JSON.stringify({
        tracks: {
          foundation: {
            currentSessionIndex: 4,
            lastPushAt: "2026-08-06T22:07:31Z",
            completedConceptIds: ["prefix-sum"],
            history: [{ sessionIndex: 3, pushedAt: "2026-08-06T22:07:31Z" }],
            completedAt: "2026-08-07T22:07:12Z",
          },
        },
      }),
    );
    const state: AppState = loadState(stateFile, ["foundation"]);

    clearCompleted(state, "foundation");

    const trackState = state.tracks.foundation!;
    expect("completedAt" in trackState).toBe(false);
    expect(trackState.currentSessionIndex).toBe(4);
    expect(trackState.lastPushAt).toBe("2026-08-06T22:07:31Z");
    expect(trackState.completedConceptIds).toEqual(["prefix-sum"]);
    expect(trackState.history).toHaveLength(1);
  });

  it("clearCompleted 對不存在的 Track 進度 MUST 拋錯（不靜默建立）", () => {
    const state: AppState = { tracks: {} };
    expect(() => clearCompleted(state, "foundation")).toThrow(/找不到 Track/);
  });
});
