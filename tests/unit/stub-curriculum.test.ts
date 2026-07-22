import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCurriculum, validateCurriculum } from "../../src/compiler/curriculum.js";

const ROOT = process.cwd();

function loadReal() {
  return loadCurriculum({
    modulesPath: join(ROOT, "curriculum", "modules.json"),
    conceptsDir: join(ROOT, "concepts"),
  });
}

describe("交付的 stub 課程端到端驗證（US4 / SC-001）", () => {
  it("真實 curriculum/modules.json + concepts/** 在 stub 模式下 0 error、ok=true", () => {
    const { graph, loadViolations } = loadReal();
    expect(loadViolations.filter((v) => v.severity === "error")).toHaveLength(0);
    const result = validateCurriculum(graph, { mode: "stub" });
    expect(result.violations.filter((v) => v.severity === "error")).toHaveLength(0);
    expect(result.ok).toBe(true);
  });

  it("輸出確定的 topoOrder（Level 0 → Level 1 的宣告序）", () => {
    const { graph } = loadReal();
    const result = validateCurriculum(graph, { mode: "stub" });
    expect(result.topoOrder).toEqual([
      "time-space-complexity",
      "reading-the-problem",
      "array-traversal",
      "in-place-operations",
      "prefix-sum",
    ]);
  });

  it("重複驗證結果一致（確定性，SC-005）", () => {
    const a = validateCurriculum(loadReal().graph, { mode: "stub" });
    const b = validateCurriculum(loadReal().graph, { mode: "stub" });
    expect(JSON.stringify(a.topoOrder)).toBe(JSON.stringify(b.topoOrder));
  });

  it("leetcode 存在性在無 Problem Bank 時列入 skipped（deferred-to-F3）", () => {
    const result = validateCurriculum(loadReal().graph, { mode: "stub" });
    expect(result.skipped.some((s) => s.check.includes("leetcode") && /F3/.test(s.reason))).toBe(true);
  });

  it("每個 stub Concept 檔含 seed 臨時性註記（FR-027 / US4 AC3）", () => {
    const { graph } = loadReal();
    expect(graph.concepts.size).toBeGreaterThan(0);
    for (const node of graph.concepts.values()) {
      const raw = readFileSync(join(ROOT, node.skeletonPath), "utf-8");
      expect(raw, `${node.skeletonPath} 應含 F2 stub seed 註記`).toMatch(/F2 stub seed/);
    }
  });
});
