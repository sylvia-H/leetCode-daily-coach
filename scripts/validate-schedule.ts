// CI Gate 入口（FR-016/017、R10）：以同一顆生成器重生成三份課表於記憶體 → 內建 Gate 全 Track →
// 與 committed schedules/{track}.json 逐位元組比對（determinism drift）→ 人可讀輸出 → exit code。
// 純度界線：process.exit 只在此入口；輸入載入與生成器皆與 generate-schedule.ts 共用同一實作（非雙軌，FR-017）。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkDrift,
  generateAllSchedules,
  serializeSchedule,
  TRACK_FILE_NAME,
  TRACKS,
} from "../src/compiler/schedule-generator.js";
import { violation } from "../src/compiler/schedule-violation.js";
import type { ScheduleViolation } from "../src/types/schedule.js";
import { formatViolation, loadGenerateInput } from "./schedule-io.js";

function main(): void {
  const { input, violations: inputViolations } = loadGenerateInput();
  if (!input) {
    console.error("輸入未通過驗證：");
    for (const v of inputViolations) console.error(formatViolation(v));
    process.exit(1);
  }

  const { schedules, violations } = generateAllSchedules(input);

  const driftViolations: ScheduleViolation[] = [];
  for (const track of TRACKS) {
    const path = join("schedules", TRACK_FILE_NAME[track]);
    let committed: string;
    try {
      committed = readFileSync(path, "utf-8");
    } catch (err) {
      driftViolations.push(
        violation("determinism-drift", track, `${path} 無法讀取：${(err as Error).message}`),
      );
      continue;
    }
    driftViolations.push(...checkDrift(track, committed, serializeSchedule(schedules[track])));
  }

  const allViolations = [...inputViolations, ...violations, ...driftViolations];
  const errors = allViolations.filter((v) => v.severity === "error");

  if (allViolations.length > 0) {
    console.log("違規清單：");
    for (const v of allViolations) console.log(formatViolation(v));
  }

  console.log(`\n摘要：${errors.length} 個 error、${allViolations.length - errors.length} 個 warning。`);

  if (errors.length > 0) {
    console.error(`\n✗ 驗證失敗：${errors.length} 個 error。`);
    process.exit(1);
  }
  console.log("\n✓ 驗證通過。");
  process.exit(0);
}

main();
