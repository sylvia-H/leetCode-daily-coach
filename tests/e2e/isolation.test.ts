// US4（P1）：單一 Track 出事不拖垮其他 Track（AC10）。唯一替身為全域 fetch。
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRACK_ORDER } from "../../src/config.js";
import { run } from "../../src/main.js";
import type { Track } from "../../src/types/lesson.js";
import { createFetchRecorder, type FetchRecorder } from "../helpers/fetch-recorder.js";

const WEBHOOK_URLS: Record<Track, string> = {
  foundation: "https://discord.com/api/webhooks/1000/foundation-hook",
  interviewReady: "https://discord.com/api/webhooks/2000/interview-ready-hook",
  interviewMastery: "https://discord.com/api/webhooks/3000/interview-mastery-hook",
};

const ALERT_COLOR = 15158332;
// webhook-client.ts 的 DEFAULT_MAX_ATTEMPTS（含首次嘗試在內的總次數上限，F1 契約值）。
const DEFAULT_MAX_ATTEMPTS = 3;

const fastRetry = { sleep: async () => undefined, random: () => 0 };

function allWebhooksEnv(stateFile: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    DISCORD_WEBHOOK_URL_FOUNDATION: WEBHOOK_URLS.foundation,
    DISCORD_WEBHOOK_URL_INTERVIEW_READY: WEBHOOK_URLS.interviewReady,
    DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY: WEBHOOK_URLS.interviewMastery,
    STATE_FILE: stateFile,
    ...extra,
  };
}

function writeAllTracksState(stateFile: string): void {
  const tracks: Record<string, unknown> = {};
  for (const track of TRACK_ORDER) {
    tracks[track] = { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] };
  }
  writeFileSync(stateFile, JSON.stringify({ tracks }));
}

describe("US4: 單一 Track 出事不拖垮其他 Track（AC10 / SC-004）", () => {
  let dir: string;
  let stateFile: string;
  let recorder: FetchRecorder;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "isolation-"));
    stateFile = join(dir, "state.json");
    recorder = createFetchRecorder();
    recorder.install();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("單軌固定失敗 → 其餘兩軌成功率 100% 且進度保存、失敗軌收到恰好 1 則紅色告警且進度不變、exit 1（SC-004 / FR-018）", async () => {
    writeAllTracksState(stateFile);
    // 課程推播的重試耗盡後失敗，但隨後的告警送達成功（與 T027「連告警都送不出去」區隔）。
    recorder.failFor(WEBHOOK_URLS.interviewReady, undefined, { times: DEFAULT_MAX_ATTEMPTS });

    const exitCode = await run(allWebhooksEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(1);

    // 成功率分母：除被注入失敗者外、實際進入推播處理的 Track 數（此情境為 foundation / interviewMastery）。
    for (const track of ["foundation", "interviewMastery"] as const) {
      expect(recorder.requestsFor(WEBHOOK_URLS[track]).length).toBeGreaterThan(0);
    }

    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: Record<string, { currentSessionIndex: number; lastPushAt: string | null }>;
    };
    expect(saved.tracks.foundation?.currentSessionIndex).toBe(2);
    expect(saved.tracks.interviewMastery?.currentSessionIndex).toBe(2);
    // 失敗軌進度不變。
    expect(saved.tracks.interviewReady?.currentSessionIndex).toBe(1);
    expect(saved.tracks.interviewReady?.lastPushAt).toBeNull();

    // 失敗軌收到的紅色告警則數恰為 1（任一步驟失敗即結束該軌，MUST NOT 出現兩則以上同軌告警）。
    const interviewReadyRequests = recorder.requestsFor(WEBHOOK_URLS.interviewReady);
    const redAlerts = interviewReadyRequests.filter((r) => r.embeds.some((e) => e.color === ALERT_COLOR));
    expect(redAlerts).toHaveLength(1);
  });

  it("告警本身也送不出去 → 記錄 alert-failed、其餘 Track 處理不被中斷、整體仍 exit 1，且不逸出未捕捉例外（US4-2 / FR-020）", async () => {
    writeAllTracksState(stateFile);
    // 不帶 times：課程推播與隨後的告警皆固定失敗（連告警都送不出去）。
    recorder.failFor(WEBHOOK_URLS.interviewReady);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const exitCode = await run(allWebhooksEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(1);

    for (const track of ["foundation", "interviewMastery"] as const) {
      expect(recorder.requestsFor(WEBHOOK_URLS[track]).length).toBeGreaterThan(0);
    }

    const errorLines = errorSpy.mock.calls.map((args) => String(args[0]));
    expect(errorLines.some((line) => line.startsWith("alert-failed: interviewReady"))).toBe(true);
  });

  // F6 FR-025a（T024a）：console.error/log 印出的失敗原因 MUST 先經遮蔽再輸出。
  it("日誌遮蔽：webhook URL 在全部日誌文字中的出現次數為 0（FR-025a）", async () => {
    writeAllTracksState(stateFile);
    recorder.failFor(WEBHOOK_URLS.interviewReady);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await run(allWebhooksEnv(stateFile), { webhookOptions: fastRetry });

    const allLogText = [...errorSpy.mock.calls, ...logSpy.mock.calls].map((args) => String(args[0])).join("\n");
    expect(allLogText).not.toMatch(/discord(?:app)?\.com\/api\/webhooks/);
  });

  it("全域性失敗（素材載入失敗）→ exit 1、只發出一則全域告警、原 state.json 未被覆寫（FR-021 / FR-021a）", async () => {
    writeAllTracksState(stateFile);
    const before = readFileSync(stateFile);
    const originalCwd = process.cwd();
    const emptyDir = mkdtempSync(join(tmpdir(), "isolation-empty-cwd-"));

    try {
      process.chdir(emptyDir);
      const exitCode = await run(allWebhooksEnv(stateFile), { webhookOptions: fastRetry });
      expect(exitCode).toBe(1);

      // 只發出一則全域告警至第一個已設定的頻道（foundation），證明未降級為逐 Track 的三則同因告警。
      const redAlerts = recorder.requests.filter((r) => r.embeds.some((e) => e.color === ALERT_COLOR));
      expect(redAlerts).toHaveLength(1);
      expect(recorder.requestsFor(WEBHOOK_URLS.interviewReady)).toHaveLength(0);
      expect(recorder.requestsFor(WEBHOOK_URLS.interviewMastery)).toHaveLength(0);
    } finally {
      process.chdir(originalCwd);
      rmSync(emptyDir, { recursive: true, force: true });
    }

    expect(readFileSync(stateFile).equals(before)).toBe(true);
  });

  it("全域性失敗（存檔失敗）→ exit 1、發出全域告警，已成功推播的 Track 進度未落盤（FR-013a / FR-021）", async () => {
    const unwritableStateFile = join(dir, "missing-dir", "state.json");

    const exitCode = await run(allWebhooksEnv(unwritableStateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(1);
    expect(existsSync(unwritableStateFile)).toBe(false);

    const redAlerts = recorder.requests.filter((r) => r.embeds.some((e) => e.color === ALERT_COLOR));
    expect(redAlerts.length).toBeGreaterThan(0);
    expect(redAlerts[0]?.embeds[0]?.title).toContain("全域");
  });

  it("無任何已設定頻道 → exit 1、零對外請求，MUST NOT 因無法發送告警而改變結束狀態（FR-020a）", async () => {
    const exitCode = await run({ STATE_FILE: stateFile }, { webhookOptions: fastRetry });
    expect(exitCode).toBe(1);
    expect(recorder.requests).toHaveLength(0);
  });
});
