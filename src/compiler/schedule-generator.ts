// 課表生成／驗證／序列化的單一實作（FR-017）：CI Gate（validate-schedule.ts）、生成入口
// （generate-schedule.ts）、未來 F5 runtime / F6 pipeline 共用同一顆。純函式：無 process.exit、
// 無檔案 I/O（讀寫只在 scripts/ 入口）。
import type { ConceptNode, CurriculumGraph, Ordinal } from "../types/curriculum.js";
import type { SessionType, Track } from "../types/lesson.js";
import type { ProblemBank } from "../types/problem.js";
import type {
  ScheduleViolation,
  ScheduleViolationRule,
  SessionPlan,
  TrackOverlay,
  TrackParam,
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

function violation(
  rule: ScheduleViolationRule,
  subject: string,
  message: string,
  extra: { field?: string; target?: string } = {},
): ScheduleViolation {
  return { rule, severity: "error", subject, message, ...extra };
}

/** 沿用 F2 `Ordinal` 的確定性全序比較（moduleIndex→topicIndex→localOrder→id）；F2 未輸出此比較器，故於此複寫一份。 */
function cmpOrdinal(a: Ordinal, b: Ordinal): number {
  return (
    a.moduleIndex - b.moduleIndex ||
    a.topicIndex - b.topicIndex ||
    a.localOrder - b.localOrder ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** 依固定欄位序建構 SessionPlan；空 problemIds／未提供的 optional 欄位省略（R2）。 */
function buildSession(
  sessionIndex: number,
  type: SessionType,
  extra: { conceptId?: string; reviewRange?: [number, number]; problemIds?: number[] } = {},
): SessionPlan {
  const session: SessionPlan = { sessionIndex, type };
  if (extra.conceptId !== undefined) session.conceptId = extra.conceptId;
  if (extra.reviewRange !== undefined) session.reviewRange = extra.reviewRange;
  if (extra.problemIds !== undefined && extra.problemIds.length > 0) session.problemIds = extra.problemIds;
  return session;
}

interface CoverageResult {
  /** 依 F2 canonical ordinal（= topoOrder 子序列）排序的涵蓋 Concept（R3）。 */
  covered: ConceptNode[];
  coveredIds: Set<string>;
  violations: ScheduleViolation[];
}

/** 涵蓋子集選取（FR-014a）：maxLevel（含）或 moduleAllowlist，依 F2 canonical ordinal 排序取子序列（R3）。 */
function selectCoveredConcepts(track: Track, graph: CurriculumGraph, param: TrackParam): CoverageResult {
  const coveredIds = new Set<string>();
  if (param.moduleAllowlist) {
    const allow = new Set(param.moduleAllowlist);
    for (const c of graph.concepts.values()) {
      if (allow.has(c.module)) coveredIds.add(c.id);
    }
  } else {
    const levelOf = new Map(graph.modules.map((m) => [m.id, m.level]));
    for (const c of graph.concepts.values()) {
      const level = levelOf.get(c.module);
      if (level !== undefined && level <= param.maxLevel) coveredIds.add(c.id);
    }
  }

  const covered = [...coveredIds]
    .map((id) => graph.concepts.get(id)!)
    .sort((a, b) => cmpOrdinal(graph.ordinalOf.get(a.id)!, graph.ordinalOf.get(b.id)!));

  return { covered, coveredIds, violations: [] };
}

export function generateAllSchedules(input: GenerateInput): GenerateResult {
  const schedules = {} as Record<Track, TrackSchedule>;
  const violations: ScheduleViolation[] = [];

  for (const track of TRACKS) {
    const param = input.params.tracks[track];
    const { covered, violations: coverageViolations } = selectCoveredConcepts(track, input.graph, param);
    violations.push(...coverageViolations);

    // US1：concept-only emit（先驗證確定性生成鏈路；US4 將以 rhythm 節奏取代本段落）。
    const sessions: SessionPlan[] = covered.map((c, i) => buildSession(i + 1, "concept", { conceptId: c.id }));

    const schedule: TrackSchedule = { track, targetLevel: param.targetLevel, sessions };
    schedules[track] = schedule;
    violations.push(...validateSchedule(schedule, input));
  }

  violations.sort(cmpViolation);
  return { schedules, violations };
}

export function validateSchedule(_schedule: TrackSchedule, _input: GenerateInput): ScheduleViolation[] {
  return [];
}

/** canonical 序列化（R2）：固定欄位序、2-space、檔尾 `\n`；重建物件以保證欄位序不受呼叫端影響。 */
export function serializeSchedule(schedule: TrackSchedule): string {
  const canonical = {
    track: schedule.track,
    targetLevel: schedule.targetLevel,
    sessions: schedule.sessions.map((s) =>
      buildSession(s.sessionIndex, s.type, {
        conceptId: s.conceptId,
        reviewRange: s.reviewRange,
        problemIds: s.problemIds,
      }),
    ),
  };
  return JSON.stringify(canonical, null, 2) + "\n";
}

export { cmpViolation };
