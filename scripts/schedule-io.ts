// 生成入口（generate-schedule.ts）與 CI Gate（validate-schedule.ts）的**單一輸入載入路徑**。
// 兩支 script 若各留一份副本，日後只改其中一支（換 modulesPath、加一個輸入檔、改 validate mode）
// 就會讓 Gate 與生成器對「輸入」的認知分歧，drift 比對的不再是同一組輸入——CLAUDE.md 硬規則 4
// 明文禁止「Gate 一套解析、runtime 另一套」的雙軌實作。
//
// 純度界線：檔案 I/O 只在此（scripts/），且此處不呼叫 process.exit——回傳違規讓入口自行決定 exit code。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCurriculum, validateCurriculum } from "../src/compiler/curriculum.js";
import { loadProblemBank, makeProblemExists } from "../src/compiler/problem.js";
import { TRACK_FILE_NAME, TRACKS, type GenerateInput } from "../src/compiler/schedule-generator.js";
import { parseTrackOverlay, parseTrackParamsFile } from "../src/compiler/schedule-schema.js";
import { violation } from "../src/compiler/schedule-violation.js";
import type { Track } from "../src/types/lesson.js";
import type { ScheduleViolation, TrackOverlay } from "../src/types/schedule.js";

export { formatViolation } from "../src/compiler/schedule-violation.js";

export const TRACK_PARAMS_PATH = join("curriculum", "track-params.json");

export interface LoadedGenerateInput {
  /** 僅在 violations 無 error 時提供。 */
  input?: GenerateInput;
  violations: ScheduleViolation[];
}

/**
 * 讀取並解析 JSON。缺檔 / 壞 JSON 轉為具名 input-unreadable 違規，而非讓 ENOENT / SyntaxError
 * 以 uncaught exception 噴出 stack trace（原本輸入端沒有保護，卻對 schedules/*.json 有 try/catch，
 * 處理方式自相矛盾）。
 */
function readJson(path: string): { value?: unknown; violations: ScheduleViolation[] } {
  try {
    return { value: JSON.parse(readFileSync(path, "utf-8")) as unknown, violations: [] };
  } catch (err) {
    return {
      violations: [violation("input-unreadable", path, `${path} 無法讀取或解析為 JSON：${(err as Error).message}`)],
    };
  }
}

/** 載入 Curriculum DAG + Problem Bank + Track 參數 + 三份 Overlay，並跑完各層 schema 驗證。 */
export function loadGenerateInput(): LoadedGenerateInput {
  const { graph, loadViolations } = loadCurriculum({
    modulesPath: join("curriculum", "modules.json"),
    conceptsDir: "concepts",
  });
  const { bank } = loadProblemBank(join("data", "problem-bank.json"));
  const curriculumResult = validateCurriculum(graph, { mode: "stub", problemExists: makeProblemExists(bank) });
  const curriculumErrors = [...loadViolations, ...curriculumResult.violations].filter((v) => v.severity === "error");
  if (curriculumErrors.length > 0) {
    return {
      violations: curriculumErrors.map((v) =>
        violation("input-unreadable", v.subject, `Curriculum 未通過驗證（${v.rule}）：${v.message}`),
      ),
    };
  }

  const violations: ScheduleViolation[] = [];

  const params = readJson(TRACK_PARAMS_PATH);
  violations.push(...params.violations);
  const modules = graph.modules.map((m) => ({ id: m.id, level: m.level }));
  const parsedParams =
    params.value === undefined ? undefined : parseTrackParamsFile(params.value, modules);
  if (parsedParams) violations.push(...parsedParams.violations);

  const overlays = {} as Record<Track, TrackOverlay>;
  for (const track of TRACKS) {
    const path = join("overlays", TRACK_FILE_NAME[track]);
    const raw = readJson(path);
    violations.push(...raw.violations);
    if (raw.value === undefined) continue;
    const { overlay, violations: overlayViolations } = parseTrackOverlay(raw.value, track);
    violations.push(...overlayViolations);
    if (overlay) overlays[track] = overlay;
  }

  const file = parsedParams?.file;
  if (violations.some((v) => v.severity === "error") || !file || TRACKS.some((t) => !overlays[t])) {
    return { violations };
  }
  return { input: { graph, bank, params: file, overlays }, violations };
}
