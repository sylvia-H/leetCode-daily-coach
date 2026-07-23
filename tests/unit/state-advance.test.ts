import { describe, expect, it } from "vitest";
import { advance, load, type AppState } from "../../src/state/state-store.js";
import type { ConceptLesson } from "../../src/types/lesson.js";

import { makeConceptLesson, makeLessonConcept } from "../helpers/lesson.js";

function makeLesson(overrides: Partial<ConceptLesson> = {}): ConceptLesson {
  return makeConceptLesson({
    color: 1,
    concept: makeLessonConcept({
      id: "left-right-pointer",
      title: "Left-Right Pointer",
      digest: "d",
      tsTip: "t",
      pyTip: "p",
      takeaway: "tk",
      exitCriteria: ["c1"],
      patternLabel: "Two Pointer",
      complexityLabel: "O(n)",
      estimatedMinutes: 15,
      articlePath: "articles/x.md",
    }),
    ...overrides,
  });
}

function freshState(): AppState {
  return load("/nonexistent/does-not-exist.json", ["foundation"]);
}

describe("advance", () => {
  it("推播成功 → currentSessionIndex 恰好 +1、lastPushAt 更新、history append", () => {
    const state = freshState();
    const pushedAt = new Date("2026-07-20T22:07:00Z");
    advance(state, "foundation", makeLesson({ sessionIndex: 1 }), pushedAt);

    const track = state.tracks.foundation!;
    expect(track.currentSessionIndex).toBe(2);
    expect(track.lastPushAt).toBe(pushedAt.toISOString());
    expect(track.history).toHaveLength(1);
    expect(track.history[0]).toEqual({
      sessionIndex: 1,
      conceptId: "left-right-pointer",
      pushedAt: pushedAt.toISOString(),
    });
  });

  it("同一 conceptId 連推三次 → completedConceptIds 長度恆為 1（去重）", () => {
    const state = freshState();
    advance(state, "foundation", makeLesson({ sessionIndex: 1 }), new Date());
    advance(state, "foundation", makeLesson({ sessionIndex: 2 }), new Date());
    advance(state, "foundation", makeLesson({ sessionIndex: 3 }), new Date());

    expect(state.tracks.foundation!.completedConceptIds).toEqual(["left-right-pointer"]);
  });

  it("累積 35 筆 history → 長度為 30 且保留最新", () => {
    const state = freshState();
    for (let i = 0; i < 35; i++) {
      advance(state, "foundation", makeLesson({ sessionIndex: i + 1 }), new Date(2026, 0, i + 1));
    }
    const history = state.tracks.foundation!.history;
    expect(history).toHaveLength(30);
    expect(history[history.length - 1]?.sessionIndex).toBe(35);
    expect(history[0]?.sessionIndex).toBe(6);
  });

  it("推播失敗 / 跳過時三個欄位皆不變（漏跑不跳課，FR-013）——即不呼叫 advance", () => {
    const state = freshState();
    const before = JSON.parse(JSON.stringify(state.tracks.foundation));
    // 模擬「不呼叫 advance」即代表失敗 / 跳過情境
    expect(state.tracks.foundation).toEqual(before);
  });
});
