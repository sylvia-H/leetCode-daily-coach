// research R9／FR-005a／data-model.md §2：課綱視圖排序鍵語意與 cmpOrdinal 一致，
// unlocked === false 的項目 MUST NOT 帶 articleUrl（零 404 保證）。
import { describe, expect, it } from "vitest";
import { buildCurriculumEntries, type TrackProgressView } from "../../src/pages/curriculum-view.js";
import { makeGraph } from "../../tests/helpers/compiler.js";

const BASE_URL = "https://example.github.io/leetcode-daily-coach";

describe("buildCurriculumEntries（research R9／FR-005a）", () => {
  it("依 localOrder 升冪排序（同 module/topic 下）", () => {
    const graph = makeGraph([
      { id: "c-third", localOrder: 3 },
      { id: "a-first", localOrder: 1 },
      { id: "b-second", localOrder: 2 },
    ]);
    const entries = buildCurriculumEntries(graph, new Set(), [], BASE_URL);
    expect(entries.map((e) => e.conceptId)).toEqual(["a-first", "b-second", "c-third"]);
  });

  it("localOrder 相同時以 conceptId 字典序決勝（cmpOrdinal 語意）", () => {
    const graph = makeGraph([
      { id: "zeta", localOrder: 1 },
      { id: "alpha", localOrder: 1 },
    ]);
    const entries = buildCurriculumEntries(graph, new Set(), [], BASE_URL);
    expect(entries.map((e) => e.conceptId)).toEqual(["alpha", "zeta"]);
  });

  it("unlocked === false 的項目 MUST NOT 帶 articleUrl 欄位", () => {
    const graph = makeGraph([{ id: "locked-concept" }]);
    const entries = buildCurriculumEntries(graph, new Set(), [], BASE_URL);
    expect(entries[0]?.unlocked).toBe(false);
    expect(entries[0]).not.toHaveProperty("articleUrl");
  });

  it("unlocked === true 的項目 MUST 帶正確的 articleUrl", () => {
    const graph = makeGraph([{ id: "unlocked-concept" }]);
    const entries = buildCurriculumEntries(graph, new Set(["unlocked-concept"]), [], BASE_URL);
    expect(entries[0]?.unlocked).toBe(true);
    expect(entries[0]?.articleUrl).toBe(`${BASE_URL}/articles/unlocked-concept.html`);
  });

  it("atTrackPositions 反映哪些 Track 的 currentOrdinalConceptId 落在此 Concept", () => {
    const graph = makeGraph([{ id: "concept-a" }, { id: "concept-b" }]);
    const trackProgress: TrackProgressView[] = [
      {
        track: "foundation",
        status: "in-progress",
        completedConceptCount: 1,
        totalConceptCount: 2,
        currentOrdinalConceptId: "concept-a",
      },
    ];
    const entries = buildCurriculumEntries(graph, new Set(["concept-a"]), trackProgress, BASE_URL);
    const a = entries.find((e) => e.conceptId === "concept-a");
    const b = entries.find((e) => e.conceptId === "concept-b");
    expect(a?.atTrackPositions).toEqual(["foundation"]);
    expect(b?.atTrackPositions).toEqual([]);
  });

  it("moduleId／topicId／title 正確帶入", () => {
    const graph = makeGraph([{ id: "concept-a", title: "Concept A 標題" }]);
    const entries = buildCurriculumEntries(graph, new Set(), [], BASE_URL);
    expect(entries[0]).toMatchObject({
      conceptId: "concept-a",
      title: "Concept A 標題",
      moduleId: "test-module",
      moduleTitle: "Test Module",
      topicId: "test-topic",
      topicTitle: "Test Topic",
    });
  });

  it("純函式：同輸入呼叫兩次得到 deep-equal 結果", () => {
    const graph = makeGraph([{ id: "a" }, { id: "b" }]);
    const unlocked = new Set(["a"]);
    const first = buildCurriculumEntries(graph, unlocked, [], BASE_URL);
    const second = buildCurriculumEntries(graph, unlocked, [], BASE_URL);
    expect(first).toEqual(second);
  });
});
