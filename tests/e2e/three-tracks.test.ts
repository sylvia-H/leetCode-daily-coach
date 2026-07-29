// US1（P1）：三個頻道各自收到自己 Track 的今日課程（AC2 / AC5 / AC6）。
// 唯一替身為全域 fetch（contracts/e2e-harness.md §1）；compile / render / checkBudget / WebhookClient /
// StateStore 全部為真實實作，素材為 repo 內真實的 curriculum / 題庫 / 課表 / Overlay / Article。
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRACK_ORDER } from "../../src/config.js";
import { compile, loadCompilerDeps, type CompilerDeps } from "../../src/compiler/lesson.js";
import { checkBudget } from "../../src/renderer/budget.js";
import { render } from "../../src/renderer/discord.js";
import { run } from "../../src/main.js";
import type { ConceptLesson, Track } from "../../src/types/lesson.js";
import { createFetchRecorder, type FetchRecorder } from "../helpers/fetch-recorder.js";

const WEBHOOK_URLS: Record<Track, string> = {
  foundation: "https://discord.com/api/webhooks/1000/foundation-hook",
  interviewReady: "https://discord.com/api/webhooks/2000/interview-ready-hook",
  interviewMastery: "https://discord.com/api/webhooks/3000/interview-mastery-hook",
};

// 注入僅限消除耗時與 jitter（FR-002a）：MUST NOT 改變重試次數、錯誤分類或任何分支判斷。
const fastRetry = { sleep: async () => undefined, random: () => 0 };

function baseEnv(stateFile: string): Record<string, string> {
  return {
    DISCORD_WEBHOOK_URL_FOUNDATION: WEBHOOK_URLS.foundation,
    DISCORD_WEBHOOK_URL_INTERVIEW_READY: WEBHOOK_URLS.interviewReady,
    DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY: WEBHOOK_URLS.interviewMastery,
    STATE_FILE: stateFile,
  };
}

function writeState(stateFile: string, indexes: Record<Track, number>): void {
  const tracks: Record<string, unknown> = {};
  for (const track of TRACK_ORDER) {
    tracks[track] = {
      currentSessionIndex: indexes[track],
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    };
  }
  writeFileSync(stateFile, JSON.stringify({ tracks }));
}

/** R6/FR-004：MUST NOT 硬編 sessionIndex，動態從課表查出指定 conceptId 的 concept 類 Session。 */
function findSessionIndexForConcept(deps: CompilerDeps, track: Track, conceptId: string): number {
  const session = deps.schedules[track].sessions.find((s) => s.type === "concept" && s.conceptId === conceptId);
  if (!session) {
    throw new Error(`fixture 失效：track=${track} 課表中找不到 conceptId=${conceptId} 的 concept Session`);
  }
  return session.sessionIndex;
}

describe("US1: 三個頻道各自收到自己 Track 的今日課程（AC2 / AC5 / AC6）", () => {
  let dir: string;
  let stateFile: string;
  let recorder: FetchRecorder;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "three-tracks-"));
    stateFile = join(dir, "state.json");
    recorder = createFetchRecorder();
    recorder.install();
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // R7（2026-07-29 修訂版）：3 / 5 / 8 造出 practice / challenge / concept 三種版面。
  const TYPE_SCENARIO_INDEXES: Record<Track, number> = { foundation: 3, interviewReady: 5, interviewMastery: 8 };

  it("三軌各自的請求數與目標 URL 完全對應，則數為 render() 產出的 1:1，且無交叉錯送（FR-003 / SC-001）", async () => {
    writeState(stateFile, TYPE_SCENARIO_INDEXES);
    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    const deps = loadCompilerDeps();
    let expectedTotal = 0;
    for (const track of TRACK_ORDER) {
      const lesson = compile(track, TYPE_SCENARIO_INDEXES[track], deps);
      const expectedMessages = render(lesson);
      expectedTotal += expectedMessages.length;

      const requests = recorder.requestsFor(WEBHOOK_URLS[track]);
      expect(requests).toHaveLength(expectedMessages.length);
      // 無交叉錯送：該軌收到的每則訊息之 embeds 均與該軌自己 render() 的輸出逐一對應。
      expect(requests.map((r) => r.embeds)).toEqual(expectedMessages.map((m) => m.embeds));
    }
    expect(recorder.requests).toHaveLength(expectedTotal);
  });

  it("各軌訊息內容對應自己的 currentSessionIndex，版面類型互不相同且各自通過預算檢查（US1-2 / US1-3）", async () => {
    writeState(stateFile, TYPE_SCENARIO_INDEXES);
    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    const deps = loadCompilerDeps();
    const serializedEmbeds: string[] = [];
    for (const track of TRACK_ORDER) {
      const lesson = compile(track, TYPE_SCENARIO_INDEXES[track], deps);
      const messages = render(lesson);
      for (const message of messages) {
        expect(checkBudget(message).ok).toBe(true);
      }
      serializedEmbeds.push(JSON.stringify(messages.map((m) => m.embeds)));
    }
    // 三軌版面類型互不相同（practice / challenge / concept）。此情境的 problemIds 依 research R7
    // 修訂皆為空集合，MUST NOT 在此斷言題目內容或難度帶——難度帶的證據由下方 prefix-sum 情境承擔。
    expect(new Set(serializedEmbeds).size).toBe(3);
  });

  it("AC5：prefix-sum 三軌正文逐字相同、題目難度帶不同（FR-004 / SC-007，sessionIndex 動態查得不硬編）", async () => {
    const deps = loadCompilerDeps();
    const conceptIndexes = {} as Record<Track, number>;
    for (const track of TRACK_ORDER) {
      conceptIndexes[track] = findSessionIndexForConcept(deps, track, "prefix-sum");
    }
    writeState(stateFile, conceptIndexes);

    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    const lessons = TRACK_ORDER.map((track) => compile(track, conceptIndexes[track], deps) as ConceptLesson);
    for (const lesson of lessons) {
      expect(lesson.type).toBe("concept");
      expect(lesson.concept.id).toBe("prefix-sum");
    }

    const [foundationLesson, interviewReadyLesson, interviewMasteryLesson] = lessons;
    for (const field of ["digest", "tsTip", "pyTip", "takeaway"] as const) {
      expect(foundationLesson!.concept[field]).toBe(interviewReadyLesson!.concept[field]);
      expect(interviewReadyLesson!.concept[field]).toBe(interviewMasteryLesson!.concept[field]);
    }
    expect(foundationLesson!.concept.exitCriteria).toEqual(interviewReadyLesson!.concept.exitCriteria);
    expect(interviewReadyLesson!.concept.exitCriteria).toEqual(interviewMasteryLesson!.concept.exitCriteria);

    const difficultySets = lessons.map((lesson) => JSON.stringify([...new Set(lesson.problems.map((p) => p.difficulty))].sort()));
    expect(new Set(difficultySets).size).toBe(3);

    // 確認真的透過完整推播鏈路送達：posted embeds 與 render() 輸出逐一對應。
    for (const [i, track] of TRACK_ORDER.entries()) {
      const requests = recorder.requestsFor(WEBHOOK_URLS[track]);
      expect(requests.map((r) => r.embeds)).toEqual(render(lessons[i]!).map((m) => m.embeds));
    }
  });

  it("執行環境無任何 LLM 金鑰時端到端仍成功，且被攔截請求的目標主機集合僅含 webhook 網域（FR-005 / AC6 / US1-5）", async () => {
    const env = baseEnv(stateFile);
    expect("GEMINI_API_KEY" in env).toBe(false);
    writeState(stateFile, TYPE_SCENARIO_INDEXES);

    const exitCode = await run(env, { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    const hosts = new Set(recorder.requests.map((r) => new URL(r.url).host));
    expect(hosts).toEqual(new Set(["discord.com"]));
  });

  it("【驗證既有】Track 依固定順序處理：foundation → interviewReady → interviewMastery（FR-006 回歸測試）", async () => {
    writeState(stateFile, TYPE_SCENARIO_INDEXES);
    const exitCode = await run(baseEnv(stateFile), { webhookOptions: fastRetry });
    expect(exitCode).toBe(0);

    const orderedUrls = recorder.requests.map((r) => r.url);
    const firstIndexOf = (url: string) => orderedUrls.indexOf(url);
    expect(firstIndexOf(WEBHOOK_URLS.foundation)).toBeLessThan(firstIndexOf(WEBHOOK_URLS.interviewReady));
    expect(firstIndexOf(WEBHOOK_URLS.interviewReady)).toBeLessThan(firstIndexOf(WEBHOOK_URLS.interviewMastery));
  });
});
