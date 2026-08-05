import { describe, expect, it } from "vitest";
import { validateCurriculum } from "../../src/compiler/curriculum.js";
import type { ValidateOptions, ViolationRule } from "../../src/types/curriculum.js";
import { buildGraph, type ConceptSpec } from "../helpers/curriculum.js";

function rules(specs: ConceptSpec[], opts?: ValidateOptions): ViolationRule[] {
  return validateCurriculum(buildGraph(specs), opts).violations.map((v) => v.rule);
}

// Level 0 主 Topic 起點（免除孤兒）。
const START: ConceptSpec = {
  id: "start",
  module: "programming-mindset",
  topic: "programming-mindset",
  localOrder: 1,
  prerequisite: [],
};

describe("validateCurriculum — 圖層規則（SC-001 / SC-002）", () => {
  it("合法課程：0 error、ok=true、可輸出 topoOrder", () => {
    const graph = buildGraph([
      { ...START, next: ["t"] },
      { id: "t", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: ["start"], next: [] },
    ]);
    const r = validateCurriculum(graph);
    expect(r.ok).toBe(true);
    expect(r.violations.filter((v) => v.severity === "error")).toHaveLength(0);
    expect(r.topoOrder).toEqual(["start", "t"]);
  });

  describe("dangling-ref 四種來源（FR-013，皆由 validateCurriculum 產出）", () => {
    it("prerequisite 懸空", () => {
      expect(rules([{ ...START, prerequisite: ["ghost"] }])).toContain("dangling-ref");
    });
    it("next 懸空", () => {
      expect(rules([{ ...START, next: ["ghost"] }])).toContain("dangling-ref");
    });
    it("module / topic 不存在於骨架", () => {
      const specs: ConceptSpec[] = [
        { ...START, next: ["bad"] },
        { id: "bad", module: "ghost-module", topic: "ghost-topic", localOrder: 1, prerequisite: ["start"] },
      ];
      expect(rules(specs)).toContain("dangling-ref");
    });
    it("topic 與所在資料夾名不符", () => {
      const specs: ConceptSpec[] = [
        { ...START, next: ["m"] },
        { id: "m", module: "array", topic: "array", dirName: "wrong-folder", localOrder: 1, prerequisite: ["start"] },
      ];
      expect(rules(specs)).toContain("dangling-ref");
    });
  });

  it("cycle：A ⇄ B 依賴成環 → cycle", () => {
    const specs: ConceptSpec[] = [
      { id: "a", module: "programming-mindset", topic: "programming-mindset", localOrder: 1, prerequisite: ["b"], next: ["b"] },
      { id: "b", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: ["a"], next: ["a"] },
    ];
    expect(rules(specs)).toContain("cycle");
  });

  it("self-dependency：Concept 依賴自己 → self-dependency", () => {
    expect(rules([{ ...START, prerequisite: ["start"], next: ["start"] }])).toContain("self-dependency");
  });

  it("forward-dependency：prerequisite 指向宣告序晚於自己者（R7）", () => {
    const specs: ConceptSpec[] = [
      { ...START, prerequisite: ["later"], next: ["later"] },
      { id: "later", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: [], next: ["start"] },
    ];
    expect(rules(specs)).toContain("forward-dependency");
  });

  it("edge-inconsistency：A.next∋B 但 B.prerequisite∌A → error（不自動補齊，FR-017）", () => {
    const specs: ConceptSpec[] = [
      { ...START, next: ["b"] },
      { id: "b", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: [], next: [] },
    ];
    expect(rules(specs)).toContain("edge-inconsistency");
  });

  it("duplicate-edge：同一 Concept 重複依賴 id → warning，ok 仍為 true（FR-018）", () => {
    const graph = buildGraph([
      { ...START, next: ["t"] },
      { id: "t", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: ["start", "start"], next: [] },
    ]);
    const r = validateCurriculum(graph);
    const dup = r.violations.find((v) => v.rule === "duplicate-edge");
    expect(dup?.severity).toBe("warning");
    expect(r.ok).toBe(true);
  });

  it("empty-curriculum：空 Concept 集合，stub / full 兩模式皆 error（FR-010a）", () => {
    for (const mode of ["stub", "full"] as const) {
      const r = validateCurriculum(buildGraph([]), { mode });
      const empty = r.violations.find((v) => v.rule === "empty-curriculum");
      expect(empty?.severity).toBe("error");
      expect(r.ok).toBe(false);
    }
  });

  describe("orphan 三組斷言（FR-016 合法起點定義）", () => {
    it("(a) Level 0 各 Topic 的首個 Concept（NNN 最小）無 prerequisite → 免除", () => {
      expect(rules([{ ...START, next: [] }])).not.toContain("orphan");
    });
    it("(b) Level 0 同一 Topic 的第 2 個 Concept 無前人且不被 next 提及 → orphan", () => {
      const specs: ConceptSpec[] = [
        { ...START, next: [] },
        { id: "second", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: [], next: [] },
      ];
      const violations = validateCurriculum(buildGraph(specs)).violations;
      const orphan = violations.find((v) => v.rule === "orphan");
      expect(orphan?.subject).toBe("second");
    });
    it("(c) Level 1+ 的任一無連結 Concept → orphan", () => {
      const specs: ConceptSpec[] = [
        { id: "lonely", module: "array", topic: "array", localOrder: 1, prerequisite: [], next: [] },
      ];
      expect(rules(specs)).toContain("orphan");
    });
  });
});
