// US3（P1）：各 Track 進度獨立推進、單次存檔與完課終態（AC4）。唯一替身為全域 fetch；
// node:fs 的 writeFileSync 僅以 passthrough 包裝計數（觀測工具，非替身，FR-002a）——真實實作照常執行，
// MUST NOT 用 vi.spyOn(fs, "writeFileSync")：state-store.ts 以具名匯入取用，ESM node:fs namespace
// 唯讀，spy 既無法安裝也攔不到（e2e-harness.md §1）。
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/main.js";
import type { Track } from "../../src/types/lesson.js";
import { createFetchRecorder, type FetchRecorder } from "../helpers/fetch-recorder.js";

const counters = vi.hoisted(() => ({ writeFileSyncCalls: 0 }));

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    writeFileSync: (...args: Parameters<typeof actual.writeFileSync>) => {
      counters.writeFileSyncCalls++;
      return actual.writeFileSync(...args);
    },
  };
});

const WEBHOOK_URLS: Record<Track, string> = {
  foundation: "https://discord.com/api/webhooks/1000/foundation-hook",
  interviewReady: "https://discord.com/api/webhooks/2000/interview-ready-hook",
  interviewMastery: "https://discord.com/api/webhooks/3000/interview-mastery-hook",
};

const fastRetry = { sleep: async () => undefined, random: () => 0 };

describe("US3: 各 Track 進度獨立推進、單次存檔（AC4 / SC-003）", () => {
  let dir: string;
  let stateFile: string;
  let recorder: FetchRecorder;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "state-advance-"));
    stateFile = join(dir, "state.json");
    recorder = createFetchRecorder();
    recorder.install();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it(
    "成功軌 currentSessionIndex 恰好 +1 且追加 completedConceptIds；失敗軌全部欄位變化量 0；" +
      "未出現於既有 state 的啟用 Track 自動補建初始值並照常處理；save() 只發生一次",
    async () => {
      writeFileSync(
        stateFile,
        JSON.stringify({
          tracks: {
            foundation: { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] },
            interviewReady: { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] },
            // interviewMastery 故意缺席於既有 state：驗證啟用但未知（此處指「未出現於檔案」）Track 自動補建。
          },
        }),
      );
      recorder.failFor(WEBHOOK_URLS.interviewReady);

      counters.writeFileSyncCalls = 0;
      const exitCode = await run(
        {
          DISCORD_WEBHOOK_URL_FOUNDATION: WEBHOOK_URLS.foundation,
          DISCORD_WEBHOOK_URL_INTERVIEW_READY: WEBHOOK_URLS.interviewReady,
          DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY: WEBHOOK_URLS.interviewMastery,
          STATE_FILE: stateFile,
        },
        { webhookOptions: fastRetry },
      );

      expect(exitCode).toBe(1); // interviewReady 失敗
      expect(counters.writeFileSyncCalls).toBe(1);

      const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
        tracks: Record<
          string,
          {
            currentSessionIndex: number;
            lastPushAt: string | null;
            completedConceptIds: string[];
            history: unknown[];
          }
        >;
      };

      // 成功軌：session 1 在三軌皆為 concept 類（time-space-complexity）。
      expect(saved.tracks.foundation?.currentSessionIndex).toBe(2);
      expect(saved.tracks.foundation?.lastPushAt).not.toBeNull();
      expect(saved.tracks.foundation?.completedConceptIds).toContain("time-space-complexity");
      expect(saved.tracks.foundation?.history).toHaveLength(1);

      // 失敗軌：全部欄位變化量為 0（漏跑不跳課，FR-013／SC-003）。
      expect(saved.tracks.interviewReady).toEqual({
        currentSessionIndex: 1,
        lastPushAt: null,
        completedConceptIds: [],
        history: [],
      });

      // 未知啟用 Track 自動補建為初始值，並照常處理成功。
      expect(saved.tracks.interviewMastery?.currentSessionIndex).toBe(2);
      expect(saved.tracks.interviewMastery?.completedConceptIds).toContain("time-space-complexity");

      // history 上限 30 的滾動裁切已由 tests/unit/state-advance.test.ts 對純函式 advance() 直接驗證
      // （累積 35 筆 → 保留最新 30 筆）；e2e 層受限於真實課表僅 13 個 Session，同一軌不可能在單一
      // 執行序內真實累積超過 13 筆，故此不變式不在此重複驗證。
    },
  );

  it("未啟用 Track 原樣保留（不因未啟用而被 save() 抹除或修改）", async () => {
    writeFileSync(
      stateFile,
      JSON.stringify({
        tracks: {
          foundation: { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] },
          interviewMastery: {
            currentSessionIndex: 5,
            lastPushAt: "2026-07-01T00:00:00Z",
            completedConceptIds: ["prefix-sum"],
            history: [{ sessionIndex: 4, pushedAt: "2026-07-01T00:00:00Z" }],
          },
        },
      }),
    );

    const exitCode = await run(
      {
        DISCORD_WEBHOOK_URL_FOUNDATION: WEBHOOK_URLS.foundation,
        // interviewMastery / interviewReady webhook 未設定：未啟用。
        STATE_FILE: stateFile,
      },
      { webhookOptions: fastRetry },
    );

    expect(exitCode).toBe(0);
    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: Record<
        string,
        { currentSessionIndex: number; lastPushAt: string | null; completedConceptIds: string[]; history: unknown[] }
      >;
    };
    expect(saved.tracks.interviewMastery).toEqual({
      currentSessionIndex: 5,
      lastPushAt: "2026-07-01T00:00:00Z",
      completedConceptIds: ["prefix-sum"],
      history: [{ sessionIndex: 4, pushedAt: "2026-07-01T00:00:00Z" }],
    });
  });
});
