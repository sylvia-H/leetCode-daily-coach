// 驗證入口（FR-028）：讀 curriculum/modules.json + concepts/** → 驗證 → 人可讀輸出 → exit code。
// 純度界線：process.exit 只在此入口；curriculum.ts 的函式無副作用（供 runtime / Gate 安全 import）。
import { loadCurriculum, validateCurriculum } from "../src/compiler/curriculum.js";
import type { Violation } from "../src/types/curriculum.js";

function formatViolation(v: Violation): string {
  const loc = v.field ? `${v.subject}.${v.field}` : v.subject;
  const target = v.target ? ` → ${v.target}` : "";
  return `  [${v.severity}] ${v.rule} ${loc}${target}：${v.message}`;
}

function main(): void {
  const { graph, loadViolations } = loadCurriculum({
    modulesPath: "curriculum/modules.json",
    conceptsDir: "concepts",
  });
  const result = validateCurriculum(graph, { mode: "stub" });
  const violations = [...loadViolations, ...result.violations];

  const errors = violations.filter((v) => v.severity === "error");
  const warnings = violations.filter((v) => v.severity === "warning");

  if (violations.length > 0) {
    console.log("違規清單：");
    for (const v of violations) console.log(formatViolation(v));
  }
  if (result.skipped.length > 0) {
    console.log("\n略過的檢查（skipped）：");
    for (const s of result.skipped) console.log(`  - ${s.check}：${s.reason}`);
  }

  console.log(
    `\n摘要：${graph.concepts.size} 個 Concept、${errors.length} 個 error、${warnings.length} 個 warning。`,
  );

  if (errors.length > 0) {
    console.error(`\n✗ 驗證失敗：${errors.length} 個 error。`);
    process.exit(1);
  }
  if (result.topoOrder) {
    console.log(`\n✓ 驗證通過。拓樸序：${result.topoOrder.join(" → ")}`);
  } else {
    console.log("\n✓ 驗證通過。");
  }
  process.exit(0);
}

main();
