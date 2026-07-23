// 生成入口（FR-001/017、R1）：讀 Curriculum + Problem Bank + Track 參數 + Overlay → generateAllSchedules
// → 有 error 印具名違規、非零 exit、不寫檔；無 error 寫三份 schedules/{track}.json、印摘要、exit 0。
// 純度界線：process.exit 只在此入口；輸入載入走 scripts/schedule-io.ts（與 CI Gate 同一路徑，非雙軌）；
// schedule-generator.ts 為純函式（供 CI / F5 / F6 安全 import）。
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  generateAllSchedules,
  serializeSchedule,
  TRACK_FILE_NAME,
  TRACKS,
} from "../src/compiler/schedule-generator.js";
import { formatViolation, loadGenerateInput } from "./schedule-io.js";

function main(): void {
  const { input, violations: inputViolations } = loadGenerateInput();
  if (!input) {
    console.error("輸入未通過驗證，中止生成：");
    for (const v of inputViolations) console.error(formatViolation(v));
    process.exit(1);
  }

  const { schedules, violations } = generateAllSchedules(input);
  const allViolations = [...inputViolations, ...violations];
  const errors = allViolations.filter((v) => v.severity === "error");

  if (allViolations.length > 0) {
    console.error(errors.length > 0 ? "課表生成違規，未寫檔：" : "課表生成警告：");
    for (const v of allViolations) console.error(formatViolation(v));
  }
  if (errors.length > 0) process.exit(1);

  mkdirSync("schedules", { recursive: true });
  for (const track of TRACKS) {
    const path = join("schedules", TRACK_FILE_NAME[track]);
    writeFileSync(path, serializeSchedule(schedules[track]), "utf-8");
    console.log(`✓ ${path}（${schedules[track].sessions.length} 個 Session）`);
  }

  console.log("\n✓ 生成完成。");
  process.exit(0);
}

main();
