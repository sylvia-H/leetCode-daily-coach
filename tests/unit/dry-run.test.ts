import { existsSync, mkdtempSync, rmSync } from "node:fs";
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
    const { writeFileSync } = await import("node:fs");
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
