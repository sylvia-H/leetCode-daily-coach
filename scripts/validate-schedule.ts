// CI Gate 入口（FR-016/017、R10）：以同一顆生成器重生成三份課表於記憶體 → 內建 Gate 全 Track →
// 與 committed schedules/{track}.json 逐位元組比對（determinism drift）→ 人可讀輸出 → exit code。
// 純度界線：process.exit 只在此入口；schedule-generator.ts 為純函式（與 generate-schedule.ts 共用同一顆，
// 非雙軌，FR-017）。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCurriculum, validateCurriculum } from "../src/compiler/curriculum.js";
import { loadProblemBank, makeProblemExists } from "../src/compiler/problem.js";
import {
  checkDrift,
  generateAllSchedules,
  serializeSchedule,
  TRACK_FILE_NAME,
  TRACKS,
} from "../src/compiler/schedule-generator.js";
import { parseTrackOverlay, parseTrackParamsFile } from "../src/compiler/schedule-schema.js";
import type { Track } from "../src/types/lesson.js";
import type { ScheduleViolation, TrackOverlay } from "../src/types/schedule.js";

function formatViolation(v: ScheduleViolation): string {
  const loc = v.field ? `${v.subject}.${v.field}` : v.subject;
  const target = v.target ? ` → ${v.target}` : "";
  return `  [${v.severity}] ${v.rule} ${loc}${target}：${v.message}`;
}

function main(): void {
  const { graph, loadViolations } = loadCurriculum({
    modulesPath: "curriculum/modules.json",
    conceptsDir: "concepts",
  });
  const { bank } = loadProblemBank("data/problem-bank.json");
  const curriculumResult = validateCurriculum(graph, { mode: "stub", problemExists: makeProblemExists(bank) });
  const curriculumErrors = [...loadViolations, ...curriculumResult.violations].filter(
    (v) => v.severity === "error",
  );
  if (curriculumErrors.length > 0) {
    console.error("Curriculum 未通過驗證，中止：");
    for (const v of curriculumErrors) console.error(`  [error] ${v.rule} ${v.subject}：${v.message}`);
    process.exit(1);
  }

  const paramsRaw = JSON.parse(readFileSync("curriculum/track-params.json", "utf-8")) as unknown;
  const modules = graph.modules.map((m) => ({ id: m.id, level: m.level }));
  const { file: params, violations: paramsViolations } = parseTrackParamsFile(paramsRaw, modules);

  const overlays = {} as Record<Track, TrackOverlay>;
  const overlayViolations: ScheduleViolation[] = [];
  for (const track of TRACKS) {
    const raw = JSON.parse(readFileSync(join("overlays", TRACK_FILE_NAME[track]), "utf-8")) as unknown;
    const { overlay, violations } = parseTrackOverlay(raw, track);
    overlayViolations.push(...violations);
    if (overlay) overlays[track] = overlay;
  }

  const schemaErrors = [...paramsViolations, ...overlayViolations];
  if (schemaErrors.length > 0 || !params) {
    console.error("Track 參數 / Overlay 未通過 schema 驗證：");
    for (const v of schemaErrors) console.error(formatViolation(v));
    process.exit(1);
  }

  const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays });

  const driftViolations: ScheduleViolation[] = [];
  for (const track of TRACKS) {
    const path = join("schedules", TRACK_FILE_NAME[track]);
    let committed: string;
    try {
      committed = readFileSync(path, "utf-8");
    } catch (err) {
      driftViolations.push({
        rule: "determinism-drift",
        severity: "error",
        subject: track,
        message: `${path} 無法讀取：${(err as Error).message}`,
      });
      continue;
    }
    driftViolations.push(...checkDrift(track, committed, serializeSchedule(schedules[track])));
  }

  const allViolations = [...violations, ...driftViolations];
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
