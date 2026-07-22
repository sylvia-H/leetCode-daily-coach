import { describe, expect, it } from "vitest";
import { validateCurriculum } from "../../src/compiler/curriculum.js";
import { buildGraph, type ConceptSpec } from "../helpers/curriculum.js";

// 一條合法的線性課程：pm(start) → pm(second) → array(a1)。宣告序即合法拓樸序。
const SPECS: ConceptSpec[] = [
  { id: "start", module: "programming-mindset", topic: "programming-mindset", localOrder: 1, prerequisite: [], next: ["second"] },
  { id: "second", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: ["start"], next: ["a1"] },
  { id: "a1", module: "array", topic: "array", localOrder: 1, prerequisite: ["second"], next: [] },
];

describe("topoOrder（FR-011 / SC-005）", () => {
  it("合法圖可線性化，輸出 canonical topoOrder（Kahn + ordinal tie-break）", () => {
    const r = validateCurriculum(buildGraph(SPECS));
    expect(r.ok).toBe(true);
    expect(r.topoOrder).toEqual(["start", "second", "a1"]);
  });

  it("確定性：重複驗證 100 次，violations 排序與 topoOrder 逐次逐字元一致（SC-005 / FR-025）", () => {
    const baseline = validateCurriculum(buildGraph(SPECS));
    const baselineJson = JSON.stringify({ v: baseline.violations, t: baseline.topoOrder });
    for (let i = 0; i < 100; i++) {
      const r = validateCurriculum(buildGraph(SPECS));
      expect(JSON.stringify({ v: r.violations, t: r.topoOrder })).toBe(baselineJson);
    }
  });

  it("多個同層 Concept 時 tie-break 用 ordinal（宣告序）而非插入序，確定", () => {
    // 反序插入，仍應以宣告序（moduleIndex→topicIndex→NNN）輸出
    const reversed = [...SPECS].reverse();
    const r = validateCurriculum(buildGraph(reversed));
    expect(r.topoOrder).toEqual(["start", "second", "a1"]);
  });
});
