import { describe, expect, it } from "vitest";
import { serializeOutline } from "../../scripts/lib/outline.js";
import { buildGraph, skeletonOf } from "../helpers/curriculum.js";

describe("serializeOutline（scripts/lib/outline.ts，R12 / data-model §2）", () => {
  it("同輸入 → byte-identical 輸出（determinism）", () => {
    const skel = skeletonOf([{ id: "m", topics: ["t"] }]);
    const graph = buildGraph(
      [
        { id: "b", module: "m", topic: "t", localOrder: 2, prerequisite: ["a"], leetcode: [1, 2] },
        { id: "a", module: "m", topic: "t", localOrder: 1, next: ["b"] },
      ],
      skel,
    );
    const out1 = serializeOutline(graph);
    const out2 = serializeOutline(graph);
    expect(out1).toBe(out2);
  });

  it("依 Module 宣告序（level）與 Topic 宣告序輸出，Concept 依 localOrder 排序", () => {
    const skel = skeletonOf([
      { id: "m2", topics: ["t2"] },
      { id: "m1", topics: ["t1"] },
    ]);
    const graph = buildGraph(
      [
        { id: "later", module: "m1", topic: "t1", localOrder: 2 },
        { id: "earlier", module: "m1", topic: "t1", localOrder: 1 },
        { id: "other", module: "m2", topic: "t2", localOrder: 1 },
      ],
      skel,
    );
    const out = serializeOutline(graph);
    // skeletonOf 依陣列順序賦予 level：m2 先宣告 → level 0；m1 → level 1
    const m2Index = out.indexOf("`m2`");
    const m1Index = out.indexOf("`m1`");
    const earlierIndex = out.indexOf("`earlier`");
    const laterIndex = out.indexOf("`later`");
    expect(m2Index).toBeGreaterThanOrEqual(0);
    expect(m1Index).toBeGreaterThan(m2Index);
    expect(earlierIndex).toBeGreaterThan(m1Index);
    expect(laterIndex).toBeGreaterThan(earlierIndex);
  });

  it("含 prerequisite/next/leetcode 候選題號的欄位；空值以 — 表示", () => {
    const skel = skeletonOf([{ id: "m", topics: ["t"] }]);
    const graph = buildGraph(
      [
        { id: "a", module: "m", topic: "t", localOrder: 1, next: ["b"], leetcode: [1, 2] },
        { id: "b", module: "m", topic: "t", localOrder: 2, prerequisite: ["a"] },
      ],
      skel,
    );
    const out = serializeOutline(graph);
    expect(out).toContain("| 1, 2 |");
    expect(out).toMatch(/\|\s+—\s+\|\s+—\s+\|\s*$/m);
  });

  it("每個 Topic 標題標註 Concept 數", () => {
    const skel = skeletonOf([{ id: "m", topics: ["t"] }]);
    const graph = buildGraph(
      [
        { id: "a", module: "m", topic: "t", localOrder: 1 },
        { id: "b", module: "m", topic: "t", localOrder: 2 },
        { id: "c", module: "m", topic: "t", localOrder: 3 },
      ],
      skel,
    );
    expect(serializeOutline(graph)).toContain("— 3 Concept");
  });
});
