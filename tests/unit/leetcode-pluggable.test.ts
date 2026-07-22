import { describe, expect, it } from "vitest";
import { validateCurriculum } from "../../src/compiler/curriculum.js";
import { buildGraph, type ConceptSpec } from "../helpers/curriculum.js";

// 合法的 2-node 課程，start 帶 leetcode 題號。
function validWithLeetcode(leetcode: number[]): ConceptSpec[] {
  return [
    { id: "start", module: "programming-mindset", topic: "programming-mindset", localOrder: 1, prerequisite: [], next: ["t"], leetcode },
    { id: "t", module: "programming-mindset", topic: "programming-mindset", localOrder: 2, prerequisite: ["start"], next: [], leetcode: [] },
  ];
}

describe("leetcode 可插拔存在性（FR-023 / SC-006）", () => {
  it("未提供 problemExists → 存在性列入 skipped（deferred-to-F3）、ok 不受影響", () => {
    const r = validateCurriculum(buildGraph(validWithLeetcode([1, 2])));
    expect(r.ok).toBe(true);
    const skip = r.skipped.find((s) => s.check.includes("leetcode"));
    expect(skip).toBeDefined();
    expect(skip?.reason).toMatch(/F3/);
    expect(r.violations.some((v) => v.rule === "dangling-leetcode")).toBe(false);
  });

  it("提供 problemExists 且題號缺失 → dangling-leetcode 報錯", () => {
    const r = validateCurriculum(buildGraph(validWithLeetcode([1, 2])), {
      problemExists: (id) => id === 1, // 2 不存在
    });
    const bad = r.violations.find((v) => v.rule === "dangling-leetcode");
    expect(bad).toBeDefined();
    expect(bad?.severity).toBe("error");
    expect(bad?.target).toBe("2");
    expect(r.ok).toBe(false);
  });

  it("提供 problemExists 且全部存在 → 無 dangling-leetcode、無 skipped leetcode 項", () => {
    const r = validateCurriculum(buildGraph(validWithLeetcode([1, 2])), {
      problemExists: () => true,
    });
    expect(r.violations.some((v) => v.rule === "dangling-leetcode")).toBe(false);
    expect(r.skipped.some((s) => s.check.includes("leetcode"))).toBe(false);
    expect(r.ok).toBe(true);
  });
});
