// 驗證入口（FR-015）：讀題庫 + Curriculum 圖 → 執行 US1/US2/US3/US4 全部 Gate → 人可讀輸出 → exit code。
// 純度界線：process.exit 只在此入口；problem.ts / curriculum.ts 的函式無副作用（供 runtime / Gate 安全 import）。
import { loadCurriculum, validateCurriculum } from "../src/compiler/curriculum.js";
import {
  getProblemsForConcept,
  loadProblemBank,
  makeProblemExists,
  validateProblemBank,
} from "../src/compiler/problem.js";
import type { ProblemViolation } from "../src/types/problem.js";

function formatProblemViolation(v: ProblemViolation): string {
  const loc = v.field ? `${v.subject}.${v.field}` : v.subject;
  const target = v.target ? ` → ${v.target}` : "";
  return `  [${v.severity}] ${v.rule} ${loc}${target}：${v.message}`;
}

function main(): void {
  const { graph } = loadCurriculum({
    modulesPath: "curriculum/modules.json",
    conceptsDir: "concepts",
  });
  const { bank, loadViolations } = loadProblemBank("data/problem-bank.json");

  const bankViolations: ProblemViolation[] = [...loadViolations, ...validateProblemBank(bank, graph)];

  // US2：走訪 graph.concepts，對每個 Concept 跑前向題數守門（FR-007/008）。
  const forwardErrors: string[] = [];
  for (const concept of graph.concepts.values()) {
    try {
      getProblemsForConcept(concept.id, concept.leetcode, bank);
    } catch (err) {
      forwardErrors.push((err as Error).message);
    }
  }

  const curriculumResult = validateCurriculum(graph, {
    mode: "stub",
    problemExists: makeProblemExists(bank),
  });

  const errors = bankViolations.filter((v) => v.severity === "error");
  const warnings = bankViolations.filter((v) => v.severity === "warning");
  const curriculumErrors = curriculumResult.violations.filter((v) => v.severity === "error");
  const curriculumWarnings = curriculumResult.violations.filter((v) => v.severity === "warning");

  if (bankViolations.length > 0) {
    console.log("Problem Bank 違規清單：");
    for (const v of bankViolations) console.log(formatProblemViolation(v));
  }
  if (forwardErrors.length > 0) {
    console.log("\n前向查找守門錯誤：");
    for (const msg of forwardErrors) console.log(`  [error] ${msg}`);
  }
  if (curriculumResult.violations.length > 0) {
    console.log("\nCurriculum 違規清單（含 leetcode 存在性）：");
    for (const v of curriculumResult.violations) {
      const loc = v.field ? `${v.subject}.${v.field}` : v.subject;
      const target = v.target ? ` → ${v.target}` : "";
      console.log(`  [${v.severity}] ${v.rule} ${loc}${target}：${v.message}`);
    }
  }
  if (curriculumResult.skipped.length > 0) {
    console.log("\n略過的檢查（skipped）：");
    for (const s of curriculumResult.skipped) console.log(`  - ${s.check}：${s.reason}`);
  }

  const totalErrors = errors.length + forwardErrors.length + curriculumErrors.length;
  const totalWarnings = warnings.length + curriculumWarnings.length;

  console.log(
    `\n摘要：${bank.byId.size} 題、${totalErrors} 個 error、${totalWarnings} 個 warning。`,
  );

  if (totalErrors > 0) {
    console.error(`\n✗ 驗證失敗：${totalErrors} 個 error。`);
    process.exit(1);
  }
  console.log("\n✓ 驗證通過。");
  process.exit(0);
}

main();
