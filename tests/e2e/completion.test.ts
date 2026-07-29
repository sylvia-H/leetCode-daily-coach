// US3：完課終態（結局路徑 #2 SKIPPED (completed) 與 #4 COMPLETED，e2e-harness.md §3.1）。
// 唯一替身為全域 fetch。
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";
import { run } from "../../src/main.js";
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
    STATE_FILE: stateFile,
    ...extra,
  };
}

function beyondScheduleIndex(): number {
  const deps = loadCompilerDeps();
  const max = deps.schedules.foundation.sessions.reduce((m, s) => Math.max(m, s.sessionIndex), 0);
  return max + 1;
}

function writeSingleTrackState(stateFile: string, trackState: Record<string, unknown>): void {
  writeFileSync(stateFile, JSON.stringify({ tracks: { foundation: trackState } }));
}

describe("完課終態（US3 / FR-022）", () => {
  let dir: string;
  let stateFile: string;
  let recorder: FetchRecorder;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "completion-"));
    stateFile = join(dir, "state.json");
    recorder = createFetchRecorder();
    recorder.install();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it("currentSessionIndex 超出課表 → 恰好一則綠色通知、completedAt 寫入、currentSessionIndex 不變、exit 0", async () => {
    writeSingleTrackState(stateFile, {
      currentSessionIndex: beyondScheduleIndex(),
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    });

    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    const requests = recorder.requestsFor(WEBHOOK_URLS.foundation);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.embeds).toHaveLength(1);
    expect(requests[0]?.embeds[0]?.color).toBe(3066993);

    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: { foundation: { currentSessionIndex: number; completedAt?: string | null } };
    };
    const beyondIndex = beyondScheduleIndex();
    expect(saved.tracks.foundation.currentSessionIndex).toBe(beyondIndex);
    expect(saved.tracks.foundation.completedAt).toBeTruthy();
  });

  it("再次執行 → 零請求（SC-011：完課後靜默跳過）", async () => {
    writeSingleTrackState(stateFile, {
      currentSessionIndex: beyondScheduleIndex(),
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    });

    const firstExit = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(firstExit).toBe(0);
    expect(recorder.requests.length).toBeGreaterThan(0);

    const countBeforeSecond = recorder.requests.length;
    const secondExit = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(secondExit).toBe(0);
    expect(recorder.requests.length).toBe(countBeforeSecond);

    // 連續第 3 次同樣零請求，佐證 SC-011「其後每日發送次數為 0」的觀測窗口（連續執行 2 次）。
    const thirdExit = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(thirdExit).toBe(0);
    expect(recorder.requests.length).toBe(countBeforeSecond);
  });

  it("DRY_RUN 下不發送不寫入：已完課者只輸出日誌，超出課表且未完課者只輸出預覽日誌", async () => {
    writeSingleTrackState(stateFile, {
      currentSessionIndex: beyondScheduleIndex(),
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
      completedAt: "2026-08-06T22:07:12Z",
    });
    const before = readFileSync(stateFile);

    const exitCode = await run(baseEnv(stateFile, { DRY_RUN: "true" }), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);
    expect(recorder.requests).toHaveLength(0);
    expect(readFileSync(stateFile).equals(before)).toBe(true);
  });

  it("DRY_RUN 下超出課表且尚未完課：只輸出預覽日誌，不發送、不寫入 completedAt", async () => {
    writeSingleTrackState(stateFile, {
      currentSessionIndex: beyondScheduleIndex(),
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    });
    const before = readFileSync(stateFile);

    const exitCode = await run(baseEnv(stateFile, { DRY_RUN: "true" }), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);
    expect(recorder.requests).toHaveLength(0);
    expect(readFileSync(stateFile).equals(before)).toBe(true);
  });

  it("完課通知發送失敗 → 不寫 completedAt 且 exit 1（視為該軌失敗，FR-019c）", async () => {
    writeSingleTrackState(stateFile, {
      currentSessionIndex: beyondScheduleIndex(),
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    });
    recorder.failFor(WEBHOOK_URLS.foundation);

    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(1);

    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: { foundation: { completedAt?: string | null } };
    };
    expect(saved.tracks.foundation.completedAt ?? null).toBeNull();
  });

  // 判定式邊界（research R1）：currentSessionIndex 恰為 maxSessionIndex 時 MUST 走正常推播路徑，
  // 只有「嚴格大於」最大值才是完課——這個邊界測試同時佐證了「課表中間缺號」不會被誤判為完課的
  // 判定邏輯本身：完課檢查完全不知道某個 sessionIndex 是否真的存在於課表中，它只比較數字大小；
  // 缺號（≤ max 但查無此 Session）會與此處的合法值走同一條「非完課」分支，最終在 compile() 內部的
  // getSessionPlan() 拋錯而歸為該軌失敗——真實課表目前為密集序列（1..13 無缺號），無法在不竄改凍結
  // 課表產物的前提下於 e2e 建構真正的缺號案例，此分支已由 tests/unit/compile-errors.test.ts 對
  // getSessionPlan() 的單元測試涵蓋。
  // FR-022b：完課狀態的自動解除。真實情境是課表在完課後被延長（F7 課綱展開），在 e2e 中以「殘留的
  // completedAt + 仍在課表範圍內的進度」等價表達——判定看的就是這兩者的關係，而非課表如何變長。
  it("殘留 completedAt 但進度仍在課表範圍內 → 自動刪除 completedAt、照常推課、exit 0", async () => {
    writeSingleTrackState(stateFile, {
      currentSessionIndex: 1,
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
      completedAt: "2026-08-06T22:07:12Z",
    });

    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    // 收到的是課程訊息而非完課通知（顏色非綠色）。
    const requests = recorder.requestsFor(WEBHOOK_URLS.foundation);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.some((r) => r.embeds.some((e) => e.color === 3066993))).toBe(false);

    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: { foundation: Record<string, unknown> };
    };
    // MUST 刪鍵而非設為 null（state-schema.md §2.1）。
    expect("completedAt" in saved.tracks.foundation).toBe(false);
    expect(saved.tracks.foundation.currentSessionIndex).toBe(2);
    expect(saved.tracks.foundation.lastPushAt).not.toBeNull();
  });

  it("DRY_RUN 下的自動解除：不發送、不寫入（completedAt 原樣保留），仍輸出預覽", async () => {
    writeSingleTrackState(stateFile, {
      currentSessionIndex: 1,
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
      completedAt: "2026-08-06T22:07:12Z",
    });
    const before = readFileSync(stateFile);

    const exitCode = await run(baseEnv(stateFile, { DRY_RUN: "true" }), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);
    expect(recorder.requests).toHaveLength(0);
    expect(readFileSync(stateFile).equals(before)).toBe(true);
  });

  it("判定式邊界：sessionIndex 恰為最大值時走正常推播路徑而非完課（MUST 為嚴格大於）", async () => {
    const deps = loadCompilerDeps();
    const maxIndex = deps.schedules.foundation.sessions.reduce((m, s) => Math.max(m, s.sessionIndex), 0);
    writeSingleTrackState(stateFile, {
      currentSessionIndex: maxIndex,
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    });

    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);
    // 走正常推播路徑（非完課）：收到的是課程訊息而非完課通知（顏色非 3066993）。
    const requests = recorder.requestsFor(WEBHOOK_URLS.foundation);
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0]?.embeds.some((e) => e.color === 3066993)).toBe(false);
  });
});
