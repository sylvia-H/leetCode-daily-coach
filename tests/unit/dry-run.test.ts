import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/main.js";

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

  it("組裝失敗時仍完全不推播（告警亦是推播），僅記錄日誌並以 exit 1 結束", async () => {
    // 課表用盡（sessionIndex 超出硬編範圍）→ compile 拋錯。舊行為會走進共用 catch，
    // 對真實 webhook POST 一則紅色告警，違反 cli-contract.md §3「不推播」。
    const raw = JSON.stringify({
      tracks: {
        foundation: { currentSessionIndex: 99, lastPushAt: null, completedConceptIds: [], history: [] },
      },
    });
    writeFileSync(stateFile, raw);

    const exitCode = await run(env({ DRY_RUN: "true" }));

    expect(fetch).not.toHaveBeenCalled();
    expect(exitCode).toBe(1);
    // 預覽模式 MUST NOT 寫 state：原檔須逐字節不變
    expect(readFileSync(stateFile, "utf-8")).toBe(raw);

    const errorCalls = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((args) =>
      String(args[0]),
    );
    expect(errorCalls.some((line) => line.includes("foundation") && line.includes("failed"))).toBe(true);
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
