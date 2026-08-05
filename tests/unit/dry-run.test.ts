import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/main.js";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";
import { pastEndSessionIndex } from "../helpers/real-schedule.js";

describe("DRY_RUN 模式", () => {
  let dir: string;
  let stateFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "dry-run-"));
    stateFile = join(dir, "state.json");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const env = (extra: Record<string, string> = {}) => ({
    DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
    STATE_FILE: stateFile,
    ...extra,
  });

  it("DRY_RUN=true → fetch 完全未被呼叫、save 完全未被呼叫（SC-007）", async () => {
    const exitCode = await run(env({ DRY_RUN: "true" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(existsSync(stateFile)).toBe(false);
    expect(exitCode).toBe(0);
  });

  it("今天已推播過仍完整輸出渲染結果，不被跳過（FR-021a）", async () => {
    writeFileSync(
      stateFile,
      JSON.stringify({
        tracks: {
          foundation: {
            currentSessionIndex: 1,
            lastPushAt: new Date().toISOString(),
            completedConceptIds: [],
            history: [],
          },
        },
      }),
    );

    await run(env({ DRY_RUN: "true" }));

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((args) =>
      String(args[0]),
    );
    expect(logCalls.some((line) => line.includes("foundation") && !line.includes("skipped"))).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("DRY_RUN 與 FORCE 同時為真 → 行為與單獨 DRY_RUN 相同，不因衝突失敗（FR-021b）", async () => {
    const exitCode = await run(env({ DRY_RUN: "true", FORCE: "true" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(existsSync(stateFile)).toBe(false);
    expect(exitCode).toBe(0);
  });

  // F6 FR-022（cli-contract.md §1，取代本測試原有的 F1 假設）：sessionIndex 超出課表範圍不再是
  // compile 組裝失敗，而是完課終態——DRY_RUN 下只輸出「would send completion notice」日誌，
  // 不發送、不寫狀態，且 MUST NOT 計入非零 exit code（courses complete ≠ 故障）。
  it("課表走完（sessionIndex 超出範圍）→ DRY_RUN 下只輸出完課預覽日誌，不推播、不視為失敗", async () => {
    // sessionIndex MUST 由真實課表長度導出，MUST NOT 硬編——原本寫死的 99 在 F1 / F5 種子課表確實
    // 超出範圍，但 F7 正式課表已有 243 個 Session（長度是導出值，spec §13.5），99 反而落在範圍內，
    // 使本測試不再測到「完課終態」而是普通推播。
    const beyondEnd = pastEndSessionIndex(loadCompilerDeps(), "foundation");
    const raw = JSON.stringify({
      tracks: {
        foundation: { currentSessionIndex: beyondEnd, lastPushAt: null, completedConceptIds: [], history: [] },
      },
    });
    writeFileSync(stateFile, raw);

    const exitCode = await run(env({ DRY_RUN: "true" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(exitCode).toBe(0);
    // 預覽模式 MUST NOT 寫 state：原檔須逐字節不變
    expect(readFileSync(stateFile, "utf-8")).toBe(raw);

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((args) =>
      String(args[0]),
    );
    expect(logCalls.some((line) => line.includes("foundation") && line.includes("would send completion notice"))).toBe(
      true,
    );
  });

  it("log 印出完整 embeds（格式化 JSON）與逐項預算明細", async () => {
    await run(env({ DRY_RUN: "true" }));

    const logCalls = (console.log as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((args) =>
      String(args[0]),
    );
    const joined = logCalls.join("\n");
    expect(joined).toContain("Session");
    expect(joined).toMatch(/digest/);
    expect(joined).toMatch(/total/);
  });
});
