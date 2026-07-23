// 生成入口（FR-001/017、R1）：讀 Curriculum + Problem Bank + Track 參數 + Overlay → generateAllSchedules
// → 有 error 印具名違規、非零 exit、不寫檔；無 error 寫三份 schedules/{track}.json、印摘要、exit 0。
// 純度界線：process.exit 與檔案 I/O 只在此入口；schedule-generator.ts 為純函式（供 CI / F5 / F6 安全 import）。
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadCurriculum, validateCurriculum } from "../src/compiler/curriculum.js";
import { loadProblemBank, makeProblemExists } from "../src/compiler/problem.js";
import {
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
    console.error("Curriculum 未通過驗證，中止生成：");
    for (const v of curriculumErrors) console.error(`  [error] ${v.rule} ${v.subject}：${v.message}`);
    process.exit(1);
  }

  const paramsRaw = JSON.parse(readFileSync("curriculum/track-params.json", "utf-8")) as unknown;
  const modules = graph.modules.map((m) => ({ id: m.id, level: m.level }));
  const { file: params, violations: paramsViolations } = parseTrackParamsFile(paramsRaw, modules);

  const overlays = {} as Record<Track, TrackOverlay>;
  const overlayViolations: ScheduleViolation[] = [];
  for (const track of TRACKS) {
    const path = join("overlays", TRACK_FILE_NAME[track]);
    const raw = JSON.parse(readFileSync(path, "utf-8")) as unknown;
    const { overlay, violations } = parseTrackOverlay(raw, track);
    overlayViolations.push(...violations);
    if (overlay) overlays[track] = overlay;
  }

  const schemaErrors = [...paramsViolations, ...overlayViolations];
  if (schemaErrors.length > 0 || !params) {
    console.error("Track 參數 / Overlay 未通過 schema 驗證，中止生成：");
    for (const v of schemaErrors) console.error(formatViolation(v));
    process.exit(1);
  }

  const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays });
  const errors = violations.filter((v) => v.severity === "error");

  if (errors.length > 0) {
    console.error("課表生成違規，未寫檔：");
    for (const v of violations) console.error(formatViolation(v));
    process.exit(1);
  }

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
