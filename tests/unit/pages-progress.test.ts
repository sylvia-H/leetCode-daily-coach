// FR-004／research R10：TrackProgressView 三種狀態；最近一次推播為非 concept 類 Session 時
// 呈現固定標籤且 MUST NOT 虛構 conceptId／conceptTitle／articleUrl。
import { describe, expect, it } from "vitest";
import { buildTrackProgress } from "../../src/pages/curriculum-view.js";
import { makeGraph, makeSchedule } from "../../tests/helpers/compiler.js";
import type { TrackState } from "../../src/state/state-store.js";

const BASE_URL = "https://example.github.io/leetcode-daily-coach";

function makeTrackState(overrides: Partial<TrackState> = {}): TrackState {
  return {
    currentSessionIndex: 1,
    lastPushAt: null,
    completedConceptIds: [],
    history: [],
    ...overrides,
  };
}

describe("buildTrackProgress（FR-004／research R10）", () => {
  it("history 為空 ⇒ status 為 not-started，lastSession 不存在", () => {
    const graph = makeGraph([{ id: "concept-a" }]);
    const schedule = makeSchedule("foundation", []);
    const view = buildTrackProgress("foundation", makeTrackState(), graph, schedule, BASE_URL);
    expect(view.status).toBe("not-started");
    expect(view.lastSession).toBeUndefined();
  });

  it("completedAt 非空 ⇒ status 為 completed", () => {
    const graph = makeGraph([{ id: "concept-a" }]);
    const schedule = makeSchedule("foundation", []);
    const trackState = makeTrackState({ completedAt: "2026-08-01T00:00:00.000Z" });
    const view = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(view.status).toBe("completed");
  });

  it("history 非空且未完課 ⇒ status 為 in-progress", () => {
    const graph = makeGraph([{ id: "concept-a" }]);
    const schedule = makeSchedule("foundation", [{ sessionIndex: 1, type: "concept", conceptId: "concept-a" }]);
    const trackState = makeTrackState({
      completedConceptIds: ["concept-a"],
      history: [{ sessionIndex: 1, conceptId: "concept-a", pushedAt: "2026-08-01T00:00:00.000Z" }],
    });
    const view = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(view.status).toBe("in-progress");
  });

  it("最近一次為 concept 類 Session 時，lastSession 帶正確的 conceptId／conceptTitle／articleUrl", () => {
    const graph = makeGraph([{ id: "concept-a", title: "Concept A" }]);
    const schedule = makeSchedule("foundation", [{ sessionIndex: 1, type: "concept", conceptId: "concept-a" }]);
    const trackState = makeTrackState({
      completedConceptIds: ["concept-a"],
      history: [{ sessionIndex: 1, conceptId: "concept-a", pushedAt: "2026-08-01T00:00:00.000Z" }],
    });
    const view = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(view.lastSession).toEqual({
      sessionIndex: 1,
      type: "concept",
      pushedAt: "2026-08-01T00:00:00.000Z",
      conceptId: "concept-a",
      conceptTitle: "Concept A",
      articleUrl: `${BASE_URL}/articles/concept-a.html`,
    });
  });

  it("最近一次為 review 類 Session 時，type 為 review 且 MUST NOT 帶 conceptId／conceptTitle／articleUrl", () => {
    const graph = makeGraph([{ id: "concept-a" }]);
    const schedule = makeSchedule("foundation", [{ sessionIndex: 2, type: "review", reviewRange: [1, 1] }]);
    const trackState = makeTrackState({
      history: [{ sessionIndex: 2, pushedAt: "2026-08-02T00:00:00.000Z" }],
    });
    const view = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(view.lastSession?.type).toBe("review");
    expect(view.lastSession).not.toHaveProperty("conceptId");
    expect(view.lastSession).not.toHaveProperty("conceptTitle");
    expect(view.lastSession).not.toHaveProperty("articleUrl");
  });

  it("最近一次為 practice／challenge 類 Session 時同樣不虛構 Concept", () => {
    const graph = makeGraph([{ id: "concept-a" }]);
    const schedule = makeSchedule("foundation", [{ sessionIndex: 3, type: "challenge" }]);
    const trackState = makeTrackState({
      history: [{ sessionIndex: 3, pushedAt: "2026-08-03T00:00:00.000Z" }],
    });
    const view = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(view.lastSession?.type).toBe("challenge");
    expect(view.lastSession).not.toHaveProperty("conceptId");
  });

  it("currentOrdinalConceptId 為 completedConceptIds 中 DAG 全序最大者", () => {
    const graph = makeGraph([
      { id: "a", localOrder: 1 },
      { id: "b", localOrder: 2 },
      { id: "c", localOrder: 3 },
    ]);
    const schedule = makeSchedule("foundation", []);
    const trackState = makeTrackState({ completedConceptIds: ["a", "c", "b"] });
    const view = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(view.currentOrdinalConceptId).toBe("c");
  });

  it("completedConceptIds 為空時 currentOrdinalConceptId 不存在", () => {
    const graph = makeGraph([{ id: "a" }]);
    const schedule = makeSchedule("foundation", []);
    const view = buildTrackProgress("foundation", makeTrackState(), graph, schedule, BASE_URL);
    expect(view.currentOrdinalConceptId).toBeUndefined();
  });

  it("completedConceptCount／totalConceptCount 正確帶入", () => {
    const graph = makeGraph([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const schedule = makeSchedule("foundation", []);
    const trackState = makeTrackState({ completedConceptIds: ["a", "b"] });
    const view = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(view.completedConceptCount).toBe(2);
    expect(view.totalConceptCount).toBe(3);
  });

  it("純函式：同輸入呼叫兩次得到 deep-equal 結果", () => {
    const graph = makeGraph([{ id: "concept-a" }]);
    const schedule = makeSchedule("foundation", [{ sessionIndex: 1, type: "concept", conceptId: "concept-a" }]);
    const trackState = makeTrackState({
      completedConceptIds: ["concept-a"],
      history: [{ sessionIndex: 1, conceptId: "concept-a", pushedAt: "2026-08-01T00:00:00.000Z" }],
    });
    const first = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    const second = buildTrackProgress("foundation", trackState, graph, schedule, BASE_URL);
    expect(first).toEqual(second);
  });
});
