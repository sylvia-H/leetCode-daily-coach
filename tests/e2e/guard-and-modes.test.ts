// US2（P1）：同一天不重複打擾、漏跑不跳課（AC3）。唯一替身為全域 fetch。
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRACK_ORDER } from "../../src/config.js";
import { run } from "../../src/main.js";
import { toTaipeiDateString } from "../../src/util/taipei-date.js";
import type { Track } from "../../src/types/lesson.js";
import { createFetchRecorder, type FetchRecorder } from "../helpers/fetch-recorder.js";

const WEBHOOK_URLS: Record<Track, string> = {
  foundation: "https://discord.com/api/webhooks/1000/foundation-hook",
  interviewReady: "https://discord.com/api/webhooks/2000/interview-ready-hook",
  interviewMastery: "https://discord.com/api/webhooks/3000/interview-mastery-hook",
};

const fastRetry = { sleep: async () => undefined, random: () => 0 };

function baseEnv(stateFile: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    DISCORD_WEBHOOK_URL_FOUNDATION: WEBHOOK_URLS.foundation,
    DISCORD_WEBHOOK_URL_INTERVIEW_READY: WEBHOOK_URLS.interviewReady,
    DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY: WEBHOOK_URLS.interviewMastery,
    STATE_FILE: stateFile,
    ...extra,
  };
}

function writeState(stateFile: string, lastPushAtByTrack: Record<Track, string | null>): void {
  const tracks: Record<string, unknown> = {};
  for (const track of TRACK_ORDER) {
    tracks[track] = {
      currentSessionIndex: 1,
      lastPushAt: lastPushAtByTrack[track],
      completedConceptIds: [],
      history: [],
    };
  }
  writeFileSync(stateFile, JSON.stringify({ tracks }));
}

const todayISO = () => new Date().toISOString();
// Asia/Taipei 無 DST、固定 +8：從「現在」減 24 小時，台北日期必然落在前一個日曆日。
const yesterdayISO = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
// 台北當日凌晨（本地 00:00:00+08:00）：無論「現在」是台北當天幾點，此時刻的台北日期恆與「現在」同一天，
// 但換算為 UTC 必然是前一個日曆日（Taipei 00:00 = UTC 前一日 16:00）。
function taipeiMidnightTodayISO(): string {
  const dateStr = toTaipeiDateString(new Date());
  return new Date(`${dateStr}T00:00:00+08:00`).toISOString();
}

describe("US2: 同一天不重複打擾、漏跑不跳課（AC3）", () => {
  let dir: string;
  let stateFile: string;
  let recorder: FetchRecorder;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "guard-and-modes-"));
    stateFile = join(dir, "state.json");
    recorder = createFetchRecorder();
    recorder.install();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("同一台北日期內連續執行兩次，第二次零請求且 state.json 位元組相同（SC-002）", async () => {
    writeState(stateFile, { foundation: null, interviewReady: null, interviewMastery: null });

    const firstExit = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(firstExit).toBe(0);
    expect(recorder.requests.length).toBeGreaterThan(0);
    const afterFirst = readFileSync(stateFile);

    const countBeforeSecond = recorder.requests.length;
    const secondExit = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(secondExit).toBe(0);
    expect(recorder.requests.length).toBe(countBeforeSecond);

    const afterSecond = readFileSync(stateFile);
    expect(afterSecond.equals(afterFirst)).toBe(true);
  });

  it("三軌 lastPushAt 分別為今天／昨天／null 時，只有後兩軌被推播（US2-2，各軌獨立判斷）", async () => {
    writeState(stateFile, {
      foundation: todayISO(),
      interviewReady: yesterdayISO(),
      interviewMastery: null,
    });

    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    expect(recorder.requestsFor(WEBHOOK_URLS.foundation)).toHaveLength(0);
    expect(recorder.requestsFor(WEBHOOK_URLS.interviewReady).length).toBeGreaterThan(0);
    expect(recorder.requestsFor(WEBHOOK_URLS.interviewMastery).length).toBeGreaterThan(0);
  });

  it("台北凌晨（對應 UTC 前一日）MUST 判定為今天已推而跳過（US2-4，時區換算以 Asia/Taipei 為準）", async () => {
    const boundaryISO = taipeiMidnightTodayISO();
    // 確認此 fixture 真的落在 UTC 前一日，否則本測試沒有驗到跨日邊界。
    expect(new Date(boundaryISO).getUTCDate()).not.toBe(new Date().getUTCDate());

    writeState(stateFile, { foundation: boundaryISO, interviewReady: null, interviewMastery: null });

    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);
    expect(recorder.requestsFor(WEBHOOK_URLS.foundation)).toHaveLength(0);
  });

  describe("模式矩陣（FR-009 / US2-3 / US2-5）", () => {
    it("FORCE=true 繞過 guard 並寫入狀態（即使今日已推）", async () => {
      writeState(stateFile, { foundation: todayISO(), interviewReady: todayISO(), interviewMastery: todayISO() });

      const exitCode = await run(baseEnv(stateFile, { FORCE: "true" }), { webhookOptions: fastRetry });
      expect(exitCode).toBe(0);

      for (const track of TRACK_ORDER) {
        expect(recorder.requestsFor(WEBHOOK_URLS[track]).length).toBeGreaterThan(0);
      }
      const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
        tracks: Record<string, { currentSessionIndex: number }>;
      };
      for (const track of TRACK_ORDER) {
        expect(saved.tracks[track]?.currentSessionIndex).toBe(2);
      }
    });

    it("DRY_RUN=true 不受 guard 阻擋、零請求、不建立 STATE_FILE（前提①：全新未存在路徑）", async () => {
      const freshDir = mkdtempSync(join(tmpdir(), "guard-dry-run-"));
      const freshStateFile = join(freshDir, "state.json");
      try {
        expect(existsSync(freshStateFile)).toBe(false);

        const exitCode = await run(baseEnv(freshStateFile, { DRY_RUN: "true" }), { webhookOptions: fastRetry });
        expect(exitCode).toBe(0);
        expect(recorder.requests).toHaveLength(0);
        expect(existsSync(freshStateFile)).toBe(false);
      } finally {
        rmSync(freshDir, { recursive: true, force: true });
      }
    });

    it("DRY_RUN=true 與 FORCE=true 同時開啟時以 DRY_RUN 為準：零請求、state.json 內容位元組不變（前提②：沿用既有檔案）", async () => {
      writeState(stateFile, { foundation: todayISO(), interviewReady: todayISO(), interviewMastery: todayISO() });
      const before = readFileSync(stateFile);

      const exitCode = await run(baseEnv(stateFile, { DRY_RUN: "true", FORCE: "true" }), {
        webhookOptions: fastRetry,
      });
      expect(exitCode).toBe(0);
      expect(recorder.requests).toHaveLength(0);

      const after = readFileSync(stateFile);
      expect(after.equals(before)).toBe(true);
    });
  });
});
