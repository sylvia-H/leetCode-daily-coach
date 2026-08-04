// F8 素材選取純函式的不變式（contracts/review-selection.md §3/§4，research R5/R6）：
// I1-I4 為 Reflection 問題選取，I5-I9 為鼓勵語選取。全部案例皆以 material.ts 的純函式直接驗證
// （不經 compile()），並額外釘死「三軌共用同一份素材輸入、選取邏輯無 per-track 分支」（FR-013、憲章 VI）。
import { describe, expect, it } from "vitest";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";
import {
  reviewOrdinalOf,
  resolveReviewTopic,
  selectEncouragement,
  selectReflectionQuestion,
  type EncouragementPool,
  type ReflectionBank,
} from "../../src/compiler/material.js";
import { makeGraph, makeSchedule } from "../helpers/compiler.js";
import type { Track } from "../../src/types/lesson.js";

const TRACKS: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

// 6 個 review，各涵蓋前一輪的 2 個 concept（同一 Topic），reviewRange 依序 [1,2]/[3,4]/…/[9,10]，
// review 落在每輪最後一個 sessionIndex（3,6,9,...,18）。
function makeReflectionFixture() {
  const graph = makeGraph(
    Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, topic: "test-topic", localOrder: i + 1 })),
  );
  const sessions: { sessionIndex: number; type: "concept" | "review"; conceptId?: string; reviewRange?: [number, number] }[] = [];
  let sessionIndex = 1;
  for (let round = 0; round < 6; round++) {
    const start = sessionIndex;
    sessions.push({ sessionIndex: sessionIndex++, type: "concept", conceptId: `c${round * 2}` });
    sessions.push({ sessionIndex: sessionIndex++, type: "concept", conceptId: `c${round * 2 + 1}` });
    sessions.push({ sessionIndex: sessionIndex++, type: "review", reviewRange: [start, sessionIndex - 2] });
  }
  const schedule = makeSchedule("foundation", sessions as never);
  return { graph, schedule };
}

describe("Reflection 問題選取（FR-011，contracts/review-selection.md §3）", () => {
  const { graph, schedule } = makeReflectionFixture();
  const bank: ReflectionBank = {
    version: 1,
    byTopic: { "test-topic": ["Q0", "Q1", "Q2", "Q3", "Q4", "Q5"] },
  };
  const reviewIndices = schedule.sessions.filter((s) => s.type === "review").map((s) => s.sessionIndex);

  it("I1：同一 (track, sessionIndex) 永遠選到同一則", () => {
    const first = selectReflectionQuestion({ bank, schedule, graph, track: "foundation", sessionIndex: reviewIndices[2]! });
    const second = selectReflectionQuestion({ bank, schedule, graph, track: "foundation", sessionIndex: reviewIndices[2]! });
    expect(first).toBe(second);
  });

  it("I2：單一 Track 內，同一 Topic 的第 1..L 次 review 取得 L 則互異問題（L = 池大小 6）", () => {
    const questions = reviewIndices.map((idx) =>
      selectReflectionQuestion({ bank, schedule, graph, track: "foundation", sessionIndex: idx }),
    );
    expect(new Set(questions).size).toBe(6);
  });

  it("I4：三軌在同一 Topic 的同一出現序數取得不同問題（trackOffset 互異）", () => {
    const firstOccurrence = reviewIndices[0]!;
    const perTrack = TRACKS.map((track) =>
      selectReflectionQuestion({ bank, schedule, graph, track, sessionIndex: firstOccurrence }),
    );
    expect(new Set(perTrack).size).toBe(TRACKS.length);
  });

  it("跨 Module 的「取最早引入者」決勝：reviewRange 橫跨兩個 Topic 時取 sessionIndex 較小者所屬 Topic", () => {
    const crossGraph = makeGraph([
      { id: "early", module: "m0", topic: "topic-a", localOrder: 1 },
      { id: "late", module: "m0", topic: "topic-b", localOrder: 1 },
    ]);
    // makeGraph 固定單一 test-topic，改用手刻 schedule + 自訂 graph 驗證歸屬規則本身
    crossGraph.topics.set("topic-a", { id: "topic-a", title: "A", moduleId: "test-module", topicIndex: 0 });
    crossGraph.topics.set("topic-b", { id: "topic-b", title: "B", moduleId: "test-module", topicIndex: 1 });
    const crossSchedule = makeSchedule("foundation", [
      { sessionIndex: 1, type: "concept", conceptId: "early" },
      { sessionIndex: 2, type: "concept", conceptId: "late" },
      { sessionIndex: 3, type: "review", reviewRange: [1, 2] },
    ]);
    const topicId = resolveReviewTopic(crossSchedule, crossGraph, [1, 2]);
    expect(topicId).toBe("topic-a"); // sessionIndex 1（early）早於 sessionIndex 2（late）
  });

  it("reviewRange 內無 concept Session ⇒ undefined（Compiler 省略 reflectionQuestion）", () => {
    const emptyRangeSchedule = makeSchedule("foundation", [
      { sessionIndex: 1, type: "concept", conceptId: "c0" },
      { sessionIndex: 2, type: "review", reviewRange: [5, 5] }, // 範圍內無 concept
    ]);
    const topicId = resolveReviewTopic(emptyRangeSchedule, graph, [5, 5]);
    expect(topicId).toBeUndefined();
    const q = selectReflectionQuestion({ bank, schedule: emptyRangeSchedule, graph, track: "foundation", sessionIndex: 2 });
    expect(q).toBeUndefined();
  });

  it("三軌共用同一份素材輸入：同一個 ReflectionBank 實例驅動三軌選取，差異只來自 trackOffset（FR-013、憲章 VI）", () => {
    // 選取函式的簽章本身不含任何 per-track 分支欄位（bank 對三軌完全相同）——以三軌各自呼叫
    // 同一個 bank 實例、僅 track 參數不同，佐證其行為差異完全由 trackOffset 導出。
    const idx = reviewIndices[1]!;
    for (const track of TRACKS) {
      const q = selectReflectionQuestion({ bank, schedule, graph, track, sessionIndex: idx });
      expect(bank.byTopic["test-topic"]).toContain(q);
    }
  });
});

describe("鼓勵語選取（FR-012，contracts/review-selection.md §4）", () => {
  const graph = makeGraph([{ id: "c0", topic: "test-topic", localOrder: 1 }]);
  const REVIEW_COUNT = 32;
  const sessions: { sessionIndex: number; type: "concept" | "review"; conceptId?: string }[] = [
    { sessionIndex: 1, type: "concept", conceptId: "c0" },
  ];
  for (let i = 0; i < REVIEW_COUNT; i++) sessions.push({ sessionIndex: 2 + i, type: "review" });
  const schedule = makeSchedule("foundation", sessions as never);
  const pool: EncouragementPool = { version: 1, quotes: Array.from({ length: 30 }, (_, i) => `Q${i}`) };
  const reviewIndices = schedule.sessions.filter((s) => s.type === "review").map((s) => s.sessionIndex);

  it("I5：同一 (track, sessionIndex) 永遠選到同一則", () => {
    const a = selectEncouragement({ pool, schedule, track: "foundation", sessionIndex: reviewIndices[3]! });
    const b = selectEncouragement({ pool, schedule, track: "foundation", sessionIndex: reviewIndices[3]! });
    expect(a).toBe(b);
  });

  it("I6：同一 Track 連續 N 個 review 取得 N 則互異語錄（N ≤ 池大小）", () => {
    const quotes = reviewIndices.slice(0, 10).map((idx) => selectEncouragement({ pool, schedule, track: "foundation", sessionIndex: idx }));
    expect(new Set(quotes).size).toBe(10);
  });

  it("I7：連續 30 個 review 互異（SC-002）", () => {
    const quotes = reviewIndices.slice(0, 30).map((idx) => selectEncouragement({ pool, schedule, track: "foundation", sessionIndex: idx }));
    expect(new Set(quotes).size).toBe(30);
  });

  it("I8：相鄰兩個 review 不同一則", () => {
    for (let i = 0; i < reviewIndices.length - 1; i++) {
      const a = selectEncouragement({ pool, schedule, track: "foundation", sessionIndex: reviewIndices[i]! });
      const b = selectEncouragement({ pool, schedule, track: "foundation", sessionIndex: reviewIndices[i + 1]! });
      expect(a).not.toBe(b);
    }
  });

  it("I9：三軌在同一 reviewOrdinal 取得不同語錄", () => {
    const idx = reviewIndices[0]!;
    const perTrack = TRACKS.map((track) => selectEncouragement({ pool, schedule, track, sessionIndex: idx }));
    expect(new Set(perTrack).size).toBe(TRACKS.length);
  });

  it("reviewOrdinalOf 對非 review 的 sessionIndex 回傳 -1（防禦性）", () => {
    expect(reviewOrdinalOf(schedule, 1)).toBe(-1);
  });
});

describe("對真實課表與真實素材的驗收（T060、SC-002、SC-010）", () => {
  const deps = loadCompilerDeps();
  if (!deps.reflectionBank || !deps.encouragement) {
    throw new Error("fixture 失效：data/reflection-bank.json / data/encouragement.json 應已凍結存在");
  }
  const reflectionBank = deps.reflectionBank;
  const encouragementPool = deps.encouragement;

  for (const track of TRACKS) {
    it(`${track}：連續 30 個 review 的鼓勵語互異（SC-002）`, () => {
      const reviewIndices = deps.schedules[track].sessions
        .filter((s) => s.type === "review")
        .map((s) => s.sessionIndex)
        .slice(0, 30);
      expect(reviewIndices.length).toBeGreaterThanOrEqual(30);
      const quotes = reviewIndices.map((idx) =>
        selectEncouragement({ pool: encouragementPool, schedule: deps.schedules[track], track, sessionIndex: idx }),
      );
      expect(new Set(quotes).size).toBe(30);
    });

    it(`${track}：單一 Track 內同一則 Reflection 問題被選中次數 ≤ 1（SC-010）`, () => {
      const reviews = deps.schedules[track].sessions.filter((s) => s.type === "review");
      const questions = reviews.map((s) =>
        selectReflectionQuestion({
          bank: reflectionBank,
          schedule: deps.schedules[track],
          graph: deps.graph,
          track,
          sessionIndex: s.sessionIndex,
        }),
      );
      const defined = questions.filter((q): q is string => q !== undefined);
      const counts = new Map<string, number>();
      for (const q of defined) counts.set(q, (counts.get(q) ?? 0) + 1);
      const overSelected = [...counts.entries()].filter(([, count]) => count > 1);
      expect(overSelected, `重複被選中的問題：${JSON.stringify(overSelected)}`).toEqual([]);
    });

    it(`${track}：全部 review Session 皆具備非空 reflectionQuestion 與 encouragement`, () => {
      const reviews = deps.schedules[track].sessions.filter((s) => s.type === "review");
      for (const s of reviews) {
        const q = selectReflectionQuestion({
          bank: reflectionBank,
          schedule: deps.schedules[track],
          graph: deps.graph,
          track,
          sessionIndex: s.sessionIndex,
        });
        const e = selectEncouragement({ pool: encouragementPool, schedule: deps.schedules[track], track, sessionIndex: s.sessionIndex });
        expect(q, `review #${s.sessionIndex} 缺 reflectionQuestion`).toBeTruthy();
        expect(e, `review #${s.sessionIndex} 缺 encouragement`).toBeTruthy();
      }
    });
  }
});
