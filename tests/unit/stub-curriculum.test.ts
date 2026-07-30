import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCurriculum, validateCurriculum } from "../../src/compiler/curriculum.js";

const ROOT = process.cwd();

function loadReal(): ReturnType<typeof loadCurriculum> {
  return loadCurriculum({
    modulesPath: join(ROOT, "curriculum", "modules.json"),
    conceptsDir: join(ROOT, "concepts"),
  });
}

/**
 * 對「已凍結的正式課綱」做端到端 smoke test。
 *
 * 本檔原為 F2「stub 交付驗證」（US4 / SC-001），斷言 5 個 stub Concept 的固定 topoOrder，並檢查每個
 * 檔案含「F2 stub seed」註記。F7 課綱定稿（16 Module / 165 Concept）後 stub 已不存在，那兩條斷言的
 * **主體本身消失**，故移除；其餘三條（可載入且零違規、驗證具確定性、無題庫時 leetcode 檢查列入
 * skipped）驗的是與內容規模無關的性質，保留並改以結構性斷言表達，不再硬編 Concept id。
 */
describe("已凍結課綱的端到端驗證（原 F2 stub 交付驗證，F7 定稿後改為驗證正式課綱）", () => {
  it("真實 curriculum/modules.json + concepts/** 在 stub 模式下 0 error、ok=true", () => {
    const { graph, loadViolations } = loadReal();
    expect(loadViolations.filter((v) => v.severity === "error")).toHaveLength(0);
    const result = validateCurriculum(graph, { mode: "stub" });
    expect(result.violations.filter((v) => v.severity === "error")).toHaveLength(0);
    expect(result.ok).toBe(true);
  });

  it("topoOrder 涵蓋全部 Concept，且每個 Concept 皆排在其 prerequisite 之後（合法拓樸序）", () => {
    // 原斷言硬編 5 個 stub id；改以「拓樸序的定義」表達，課綱增修不需再改測試。
    const { graph } = loadReal();
    const { topoOrder } = validateCurriculum(graph, { mode: "stub" });
    expect(topoOrder).toHaveLength(graph.concepts.size);
    expect(new Set(topoOrder).size).toBe(topoOrder.length); // 無重複

    const positionOf = new Map(topoOrder.map((id, i) => [id, i]));
    for (const node of graph.concepts.values()) {
      for (const prereq of node.prerequisite) {
        expect(positionOf.get(prereq)!, `${node.id} 的 prerequisite ${prereq} 應排在它之前`).toBeLessThan(
          positionOf.get(node.id)!,
        );
      }
    }
  });

  it("第一個 Concept 屬於 Level 0 的 Module 且無前置依賴（課綱起點）", () => {
    const { graph } = loadReal();
    const { topoOrder } = validateCurriculum(graph, { mode: "stub" });
    const first = graph.concepts.get(topoOrder[0]!)!;
    expect(graph.modules.find((m) => m.id === first.module)?.level).toBe(0);
    expect(first.prerequisite).toEqual([]);
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
});
