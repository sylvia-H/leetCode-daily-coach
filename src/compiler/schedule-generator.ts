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

  // 閉包驗證（US2 / R3 / FR-014a）：被涵蓋 Concept 的 prerequisite 若不在涵蓋集內即 fail loud，
  // 不靜默擴張宣告範圍。連續 maxLevel 切法天然閉包，僅 moduleAllowlist 跳號時才可能觸發。
  const violations: ScheduleViolation[] = [];
  for (const c of covered) {
    for (const p of c.prerequisite) {
      if (!coveredIds.has(p)) {
        violations.push(
          violation(
            "coverage-gap",
            `${track}:${c.id}`,
            `Track ${track} 涵蓋 Concept ${c.id} 的 prerequisite「${p}」不在涵蓋集內`,
            { field: "prerequisite", target: p },
          ),
        );
      }
    }
  }

  return { covered, coveredIds, violations };
}

/** Overlay 驗證（US3 / R7 / clarify Q4）：key 非涵蓋 Concept、extraProblemIds 懸空 → fail loud。 */
function validateOverlay(
  track: Track,
  overlay: TrackOverlay,
  coveredIds: Set<string>,
  bank: ProblemBank,
): ScheduleViolation[] {
  const violations: ScheduleViolation[] = [];
  for (const [conceptId, entry] of Object.entries(overlay.byConcept)) {
    if (!coveredIds.has(conceptId)) {
      violations.push(
        violation(
          "overlay-unknown-concept",
          `${track}:${conceptId}`,
          `overlays/${track} 的 byConcept key「${conceptId}」不是該 Track 已涵蓋的 Concept`,
        ),
      );
      continue;
    }
    for (const id of entry.extraProblemIds ?? []) {
      if (!bank.byId.has(id)) {
        violations.push(
          violation(
            "dangling-problem",
            `${track}:${conceptId}`,
            `overlays/${track} 的 extraProblemIds 含題庫不存在的題號：${id}`,
            { field: "extraProblemIds", target: String(id) },
          ),
        );
      }
    }
  }
  return violations;
}

/**
 * concept 槽題目選取（US3 / R5）：Concept `leetcode`（保留宣告序）依 Problem Bank `difficulty`
 * 過濾至該 Track `problemDifficulties`，再附加 overlay 的 `extraProblemIds`（去重、穩定序，
 * 只納入已通過 bank 存在性驗證的題號——懸空題號已由 validateOverlay 具名回報，此處靜默排除
 * 避免把已知非法題號寫進生成物）。過濾後為空（含 `leetcode: []`）為一等合法（FR-015a/FR-019）。
 */
function selectConceptProblems(
  concept: ConceptNode,
  difficulties: readonly string[],
  bank: ProblemBank,
  overlayEntry: TrackOverlay["byConcept"][string] | undefined,
): number[] {
  const allowed = new Set(difficulties);
  const core = concept.leetcode.filter((id) => {
    const meta = bank.byId.get(id);
    return meta !== undefined && allowed.has(meta.difficulty);
  });
  const seen = new Set(core);
  const appended: number[] = [];
  for (const id of overlayEntry?.extraProblemIds ?? []) {
    if (seen.has(id) || !bank.byId.has(id)) continue;
    seen.add(id);
    appended.push(id);
  }
  return [...core, ...appended];
}

export function generateAllSchedules(input: GenerateInput): GenerateResult {
  const schedules = {} as Record<Track, TrackSchedule>;
  const violations: ScheduleViolation[] = [];

  for (const track of TRACKS) {
    const param = input.params.tracks[track];
    const overlay = input.overlays[track];
    const { covered, coveredIds, violations: coverageViolations } = selectCoveredConcepts(
      track,
      input.graph,
      param,
    );
    violations.push(...coverageViolations);
    violations.push(...validateOverlay(track, overlay, coveredIds, input.bank));

    // US1：concept-only emit（US4 將以 rhythm 節奏取代本段落）；US3：附加難度過濾 + Overlay 題目。
    const sessions: SessionPlan[] = covered.map((c, i) =>
      buildSession(i + 1, "concept", {
        conceptId: c.id,
        problemIds: selectConceptProblems(c, param.problemDifficulties, input.bank, overlay.byConcept[c.id]),
      }),
    );

    const schedule: TrackSchedule = { track, targetLevel: param.targetLevel, sessions };
    schedules[track] = schedule;
    violations.push(...validateSchedule(schedule, input));
  }

  violations.sort(cmpViolation);
  return { schedules, violations };
}

/**
 * 對單一課表跑全部結構不變式（US2/US4/US5；schedule-schema.md「不變式」表）：純函式，
 * 供 generateAllSchedules 內建 Gate 與 CI 對 committed 檔重驗共用（FR-017，單一實作）。
 */
export function validateSchedule(schedule: TrackSchedule, input: GenerateInput): ScheduleViolation[] {
  const violations: ScheduleViolation[] = [];
  const track = schedule.track;
  const firstSeenAt = new Map<string, number>();

  for (const session of schedule.sessions) {
    if (session.type === "concept") {
      if (session.conceptId === undefined) {
        violations.push(
          violation(
            "one-concept-violation",
            `${track}:session-${session.sessionIndex}`,
            `concept Session（#${session.sessionIndex}）未引入任何 Concept`,
          ),
        );
      } else {
        const conceptId = session.conceptId;
        const node = input.graph.concepts.get(conceptId);
        if (!node) {
          violations.push(
            violation(
              "dangling-concept",
              `${track}:${conceptId}`,
              `Session #${session.sessionIndex} 的 conceptId 不存在於 DAG：${conceptId}`,
            ),
          );
        } else {
          for (const p of node.prerequisite) {
            const prereqSeenAt = firstSeenAt.get(p);
            if (prereqSeenAt === undefined || prereqSeenAt >= session.sessionIndex) {
              violations.push(
                violation(
                  "forward-dependency",
                  `${track}:${conceptId}`,
                  `Concept ${conceptId}（Session #${session.sessionIndex}）的 prerequisite「${p}」未在更前面的 Session 引入`,
                  { target: p },
                ),
              );
            }
          }
        }
        if (firstSeenAt.has(conceptId)) {
          violations.push(
            violation(
              "duplicate-concept",
              `${track}:${conceptId}`,
              `Concept ${conceptId} 被多個 concept Session 引入（重複於 Session #${session.sessionIndex}）`,
            ),
          );
        } else {
          firstSeenAt.set(conceptId, session.sessionIndex);
        }
      }
    } else if (session.type === "review") {
      const range = session.reviewRange;
      if (!range || !(range[0] <= range[1]) || range[1] >= session.sessionIndex || range[0] < 1) {
        violations.push(
          violation(
            "review-range-invalid",
            `${track}:session-${session.sessionIndex}`,
            `review Session（#${session.sessionIndex}）的 reviewRange ${range ? `[${range[0]}, ${range[1]}]` : "缺席"} 不合法`,
          ),
        );
      }
    }

    for (const id of session.problemIds ?? []) {
      if (!input.bank.byId.has(id)) {
        violations.push(
          violation(
            "dangling-problem",
            `${track}:session-${session.sessionIndex}`,
            `Session #${session.sessionIndex} 的 problemIds 含題庫不存在的題號：${id}`,
            { target: String(id) },
          ),
        );
      }
    }
  }

  violations.sort(cmpViolation);
  return violations;
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
