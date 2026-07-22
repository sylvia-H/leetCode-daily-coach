import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCurriculum, validateCurriculum } from "../../src/compiler/curriculum.js";
import { loadProblemBank, makeProblemExists } from "../../src/compiler/problem.js";

const ROOT = process.cwd();

// FR-009 / SC-005：把 F2 預留的可插拔 problemExists 由 deferred-to-F3 stub 換成以真實 seed 題庫為
// 背景的實作，驗證既有 stub Concept 的 leetcode 參照全通過、skipped 轉為實際執行。
// 與 tests/unit/leetcode-pluggable.test.ts 分工：後者以 mock predicate 測介面行為（skipped ↔
// dangling-leetcode），本檔以真實 seed bank + 真實 stub Concept 端到端驗 SC-005，兩者互補、勿合併或互刪。
describe("makeProblemExists 注入 validateCurriculum（FR-009 / SC-005）", () => {
  it("真實 seed 題庫 + 真實 stub Concept：leetcode 存在性由 skipped 轉為實際執行且全數通過", () => {
    const { graph } = loadCurriculum({
      modulesPath: join(ROOT, "curriculum", "modules.json"),
      conceptsDir: join(ROOT, "concepts"),
    });
    const { bank, loadViolations } = loadProblemBank(join(ROOT, "data", "problem-bank.json"));
    expect(loadViolations).toHaveLength(0);

    const result = validateCurriculum(graph, { mode: "stub", problemExists: makeProblemExists(bank) });

    expect(result.skipped.some((s) => s.check.includes("leetcode"))).toBe(false);
    expect(result.violations.some((v) => v.rule === "dangling-leetcode")).toBe(false);
    expect(result.ok).toBe(true);
  });
});
