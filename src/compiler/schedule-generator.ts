// 課表生成／驗證／序列化的單一實作（FR-017）：CI Gate（validate-schedule.ts）、生成入口
// （generate-schedule.ts）、未來 F5 runtime / F6 pipeline 共用同一顆。純函式：無 process.exit、
// 無檔案 I/O（讀寫只在 scripts/ 入口）。
import type { CurriculumGraph } from "../types/curriculum.js";
import type { Track } from "../types/lesson.js";
import type { ProblemBank } from "../types/problem.js";
import type {
  ScheduleViolation,
  TrackOverlay,
  TrackParamsFile,
  TrackSchedule,
} from "../types/schedule.js";

export const TRACKS: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

/** Track id ↔ 生成物檔名（單一常數表，data-model.md §2）。 */
export const TRACK_FILE_NAME: Record<Track, string> = {
  foundation: "foundation.json",
  interviewReady: "interview-ready.json",
  interviewMastery: "interview-mastery.json",
};

export interface GenerateInput {
  graph: CurriculumGraph;
  bank: ProblemBank;
  params: TrackParamsFile;
  overlays: Record<Track, TrackOverlay>;
}

export interface GenerateResult {
  schedules: Record<Track, TrackSchedule>;
  violations: ScheduleViolation[];
}

/** 沿用 F2/F3 的具名違規排序慣例（rule → subject → field），使違規清單本身亦 determinism。 */
function cmpViolation(a: ScheduleViolation, b: ScheduleViolation): number {
  return (
    a.rule.localeCompare(b.rule) ||
    a.subject.localeCompare(b.subject) ||
    (a.field ?? "").localeCompare(b.field ?? "")
  );
}

export function generateAllSchedules(_input: GenerateInput): GenerateResult {
  throw new Error("generateAllSchedules: 尚未實作（US1 補上）");
}

export function validateSchedule(_schedule: TrackSchedule, _input: GenerateInput): ScheduleViolation[] {
  return [];
}

export function serializeSchedule(_schedule: TrackSchedule): string {
  throw new Error("serializeSchedule: 尚未實作（US1 補上）");
}

export { cmpViolation };
