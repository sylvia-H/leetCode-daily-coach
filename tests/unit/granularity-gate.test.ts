import { describe, expect, it } from "vitest";
import { validateCurriculum } from "../../src/compiler/curriculum.js";
import type { Violation } from "../../src/types/curriculum.js";
import { buildGraph, repeatConcepts, skeletonOf } from "../helpers/curriculum.js";

function granularity(violations: Violation[], field: string, subject?: string): Violation[] {
  return violations.filter(
    (v) => v.rule === "granularity-range" && v.field === field && (subject === undefined || v.subject === subject),
  );
}

describe("granularity gate（FR-019 / FR-021 / SC-004）", () => {
  it("Topic 超上限（13）→ granularity-range（field topic），兩模式皆報", () => {
    const g = () => buildGraph(repeatConcepts("m", "t", 13), skeletonOf([{ id: "m", topics: ["t"] }]));
    for (const mode of ["stub", "full"] as const) {
      const v = validateCurriculum(g(), { mode }).violations;
      expect(granularity(v, "topic", "t")).toHaveLength(1);
    }
  });

  it("Module 超上限（31）→ granularity-range（field module），兩模式皆報", () => {
    const specs = [
      ...repeatConcepts("m", "t1", 11),
      ...repeatConcepts("m", "t2", 11),
      ...repeatConcepts("m", "t3", 9),
    ];
    const skel = skeletonOf([{ id: "m", topics: ["t1", "t2", "t3"] }]);
    for (const mode of ["stub", "full"] as const) {
      const v = validateCurriculum(buildGraph(specs, skel), { mode }).violations;
      expect(granularity(v, "module", "m")).toHaveLength(1);
    }
  });

  it("下限類（Topic <5 / Module <10）僅 full 強制、stub 豁免", () => {
    // module m：t1=4（<5）、t2=6 → module 10（≥10）。full 應報 t1 topic 下限；stub 不報
    const specs = [...repeatConcepts("m", "t1", 4), ...repeatConcepts("m", "t2", 6)];
    const skel = skeletonOf([{ id: "m", topics: ["t1", "t2"] }]);
    const full = validateCurriculum(buildGraph(specs, skel), { mode: "full" }).violations;
    expect(granularity(full, "topic", "t1")).toHaveLength(1);
    const stub = validateCurriculum(buildGraph(specs, skel), { mode: "stub" }).violations;
    expect(granularity(stub, "topic", "t1")).toHaveLength(0);
  });

  it("Module <10（9）→ full 報 module 下限；stub 不報", () => {
    const specs = repeatConcepts("m", "t", 9); // topic 9（5..12 ok），module 9（<10）
    const skel = skeletonOf([{ id: "m", topics: ["t"] }]);
    expect(granularity(validateCurriculum(buildGraph(specs, skel), { mode: "full" }).violations, "module", "m")).toHaveLength(1);
    expect(granularity(validateCurriculum(buildGraph(specs, skel), { mode: "stub" }).violations, "module", "m")).toHaveLength(0);
  });

  it("stub 模式：空 Module / Topic（0 Concept）不觸發下限錯誤", () => {
    // 只有 pm 一個起點，其餘 15 Module 空；stub 不應對空 Module/Topic 報 granularity-range
    const g = buildGraph([{ id: "start", module: "programming-mindset", topic: "programming-mindset", localOrder: 1, prerequisite: [] }]);
    const v = validateCurriculum(g, { mode: "stub" }).violations;
    expect(v.filter((x) => x.rule === "granularity-range")).toHaveLength(0);
  });

  describe("閉區間邊界（FR-019）", () => {
    it("Topic 恰 12（上限）→ 通過（無 topic granularity-range），兩模式", () => {
      const g = () => buildGraph(repeatConcepts("m", "t", 12), skeletonOf([{ id: "m", topics: ["t"] }]));
      for (const mode of ["stub", "full"] as const) {
        expect(granularity(validateCurriculum(g(), { mode }).violations, "topic", "t")).toHaveLength(0);
      }
    });

    it("Topic 恰 5（下限）→ full 通過（無 topic granularity-range）", () => {
      // module 需 ≥10 以免 module 下限干擾：t1=5、t2=5 → module 10
      const specs = [...repeatConcepts("m", "t1", 5), ...repeatConcepts("m", "t2", 5)];
      const skel = skeletonOf([{ id: "m", topics: ["t1", "t2"] }]);
      const v = validateCurriculum(buildGraph(specs, skel), { mode: "full" }).violations;
      expect(granularity(v, "topic", "t1")).toHaveLength(0);
      expect(granularity(v, "topic", "t2")).toHaveLength(0);
    });

    it("Module 恰 10（下限）→ full 通過（無 module granularity-range）", () => {
      const specs = repeatConcepts("m", "t", 10); // topic 10 ok、module 10
      const skel = skeletonOf([{ id: "m", topics: ["t"] }]);
      expect(granularity(validateCurriculum(buildGraph(specs, skel), { mode: "full" }).violations, "module", "m")).toHaveLength(0);
    });

    it("Module 恰 30（上限）→ 通過（無 module granularity-range），兩模式", () => {
      const specs = [
        ...repeatConcepts("m", "t1", 10),
        ...repeatConcepts("m", "t2", 10),
        ...repeatConcepts("m", "t3", 10),
      ];
      const skel = skeletonOf([{ id: "m", topics: ["t1", "t2", "t3"] }]);
      for (const mode of ["stub", "full"] as const) {
        expect(granularity(validateCurriculum(buildGraph(specs, skel), { mode }).violations, "module", "m")).toHaveLength(0);
      }
    });

    it("Topic 4 / 13、Module 9 / 31 → 報錯（超出端點才報）", () => {
      // 13 上限、4 下限(full)、31 上限、9 下限(full) 已於上面涵蓋；此處補 Topic 4 full 邊界
      const specs = [...repeatConcepts("m", "t1", 4), ...repeatConcepts("m", "t2", 6)];
      const skel = skeletonOf([{ id: "m", topics: ["t1", "t2"] }]);
      expect(granularity(validateCurriculum(buildGraph(specs, skel), { mode: "full" }).violations, "topic", "t1")).toHaveLength(1);
    });
  });

  it("full 模式：Concept 總數 <150 → granularity-range（field total）", () => {
    const specs = repeatConcepts("m", "t", 10);
    const skel = skeletonOf([{ id: "m", topics: ["t"] }]);
    const v = validateCurriculum(buildGraph(specs, skel), { mode: "full" }).violations;
    expect(granularity(v, "total")).toHaveLength(1);
  });
});
