// 課表生成／驗證／序列化的單一實作（FR-017）：CI Gate（validate-schedule.ts）、生成入口
// （generate-schedule.ts）、未來 F5 runtime / F6 pipeline 共用同一顆。純函式：無 process.exit、
// 無檔案 I/O（讀寫只在 scripts/ 入口）。
import type { ConceptNode, CurriculumGraph, Ordinal } from "../types/curriculum.js";
import type { SessionType, Track } from "../types/lesson.js";
import type { ProblemBank } from "../types/problem.js";
import type {
  ScheduleViolation,
  SessionPlan,
  TrackOverlay,
  TrackParam,
  TrackParamsFile,
  TrackSchedule,
} from "../types/schedule.js";
import { cmpViolation, violation } from "./schedule-violation.js";

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
  const violations: ScheduleViolation[] = [];
  const levelOf = new Map(graph.modules.map((m) => [m.id, m.level]));

  // module 懸空時，maxLevel 路徑的 level 查不到、moduleAllowlist 路徑的 id 對不上——兩者都會把該
  // Concept 從三份課表靜默剔除（0 違規、CI 全綠、重生成亦一致），教材無聲流失。F2 的 validateCurriculum
  // 會以 dangling-ref 攔下此狀況，但 generateAllSchedules 是可被 F5 / F6 直接餵圖的純函式，故在此
  // 獨立 fail loud（§4-15）。
  for (const c of graph.concepts.values()) {
    if (!levelOf.has(c.module)) {
      violations.push(
        violation(
          "unknown-module",
          `${track}:${c.id}`,
          `Concept ${c.id} 的 module「${c.module}」不存在於 modules.json，無法判定是否納入 Track ${track} 的涵蓋子集`,
          { field: "module", target: c.module },
        ),
      );
    }
  }

  const coveredIds = new Set<string>();
  if (param.moduleAllowlist) {
    const allow = new Set(param.moduleAllowlist);
    for (const c of graph.concepts.values()) {
      if (allow.has(c.module)) coveredIds.add(c.id);
    }
  } else {
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

/**
 * practice 槽題目選取（US4 / R5）：當週已引入 Concept 的過濾題目聯集，升冪 id（確定性）。
 * Overlay 的 `extraProblemIds` 亦納入聯集——否則同一份 Overlay 在 concept 槽生效、在同週 practice 槽
 * 失效，違反「Overlay 疊加不取代」的一致性（FR-009）。懸空題號已由 validateOverlay 具名回報，
 * 此處靜默排除以免把已知非法題號寫進生成物（與 selectConceptProblems 同一策略）。
 */
function unionProblems(
  concepts: ConceptNode[],
  difficulties: readonly string[],
  bank: ProblemBank,
  overlay: TrackOverlay,
): number[] {
  const allowed = new Set(difficulties);
  const ids = new Set<number>();
  for (const concept of concepts) {
    for (const id of concept.leetcode) {
      const meta = bank.byId.get(id);
      if (meta && allowed.has(meta.difficulty)) ids.add(id);
    }
    for (const id of overlay.byConcept[concept.id]?.extraProblemIds ?? []) {
      if (bank.byId.has(id)) ids.add(id);
    }
  }
  return [...ids].sort((a, b) => a - b);
}

/**
 * challenge 槽題目選取（US4 / R5）：候選池為**該 challenge 槽之前已引入**的 Concept 的題目
 * （取符合 `challengeDifficulty` 者）——池限於已引入 Concept 才不會讓使用者在第 5 天收到一題屬於
 * 明天才教的 Concept 的「挑戰題」（validateSchedule 的 forward-dependency 只看 conceptId，抓不到
 * 由 problemIds 造成的前向引用）。取尚未被前面任一 challenge 用過的最小 id；全部用過時退回池中
 * 最小 id（不致因題庫耗盡而讓 challenge 槽突然消失）。純函式、無隨機源，同輸入 → 同輸出。
 */
function selectChallengeProblem(
  introduced: ConceptNode[],
  challengeDifficulty: string,
  bank: ProblemBank,
  used: ReadonlySet<number>,
): number | undefined {
  let min: number | undefined;
  let minUnused: number | undefined;
  for (const concept of introduced) {
    for (const id of concept.leetcode) {
      const meta = bank.byId.get(id);
      if (!meta || meta.difficulty !== challengeDifficulty) continue;
      if (min === undefined || id < min) min = id;
      if (!used.has(id) && (minUnused === undefined || id < minUnused)) minUnused = id;
    }
  }
  return minUnused ?? min;
}

/**
 * 週節奏攤課（US4 / R4）：每 `rhythm.length`（7）Session 一輪，`concept` 槽依序消耗涵蓋佇列；
 * 佇列取空時該槽跳過（不消耗 sessionIndex），該輪其餘槽位（practice/review/challenge/rest）
 * 正常產出，於該輪跑完處自然收尾（不填充、不跨輪）。`reviewRange` = 本輪 [weekStartIndex,
 * reviewSessionIndex-1]（含第一週）。
 */
function emitSessions(
  track: Track,
  covered: ConceptNode[],
  param: TrackParam,
  bank: ProblemBank,
  overlay: TrackOverlay,
): { sessions: SessionPlan[]; violations: ScheduleViolation[] } {
  const sessions: SessionPlan[] = [];
  const violations: ScheduleViolation[] = [];

  // 無 concept 槽時佇列永遠不被消耗，下方 while 會無限成長至 OOM。schema 層已以 param-invalid 擋下
  // （validateRhythm），此處為純函式被直接呼叫（測試 / F5 / F6）時的 fail-fast 防線。
  if (!param.rhythm.includes("concept")) {
    return {
      sessions,
      violations: [
        violation(
          "param-invalid",
          `${track}:rhythm`,
          `Track ${track} 的 rhythm 不含任何 concept 槽，涵蓋 Concept 永遠無法排入`,
          { field: "rhythm" },
        ),
      ],
    };
  }

  const introduced: ConceptNode[] = [];
  const usedChallengeIds = new Set<number>();
  let qi = 0;
  let sessionIndex = 1;

  while (qi < covered.length) {
    const weekStartIndex = sessionIndex;
    const weekConcepts: ConceptNode[] = [];
    for (const slotType of param.rhythm) {
      if (slotType === "concept") {
        if (qi >= covered.length) continue; // 涵蓋佇列已空：跳過本槽，不消耗 sessionIndex（R4 補充決策）
        const concept = covered[qi]!;
        qi++;
        const problemIds = selectConceptProblems(concept, param.problemDifficulties, bank, overlay.byConcept[concept.id]);
        sessions.push(buildSession(sessionIndex, "concept", { conceptId: concept.id, problemIds }));
        weekConcepts.push(concept);
        introduced.push(concept);
        sessionIndex++;
      } else if (slotType === "practice") {
        const problemIds = unionProblems(weekConcepts, param.problemDifficulties, bank, overlay);
        sessions.push(buildSession(sessionIndex, "practice", { problemIds }));
        sessionIndex++;
      } else if (slotType === "review") {
        sessions.push(buildSession(sessionIndex, "review", { reviewRange: [weekStartIndex, sessionIndex - 1] }));
        sessionIndex++;
      } else if (slotType === "challenge") {
        const id = selectChallengeProblem(introduced, param.challengeDifficulty, bank, usedChallengeIds);
        if (id === undefined) {
          // FR-015a 明文「過濾後為空為一等合法、無 fallback」，故不 fail loud；但無題的 challenge 會讓
          // F5 Renderer 推出一則沒有任何題目連結的「今日挑戰」，通常代表該 Track 的 challengeDifficulty
          // 與題庫難度分布對不上。以 warning 留下訊號而不擋 CI（stub 題庫無 Hard 題為 FR-018 預期狀態）。
          violations.push(
            violation(
              "challenge-no-problem",
              `${track}:session-${sessionIndex}`,
              `challenge Session（#${sessionIndex}）在已引入 Concept 中找不到難度為 ${param.challengeDifficulty} 的題目，將產出無題目的挑戰日`,
              { severity: "warning", field: "challengeDifficulty" },
            ),
          );
        } else {
          usedChallengeIds.add(id);
        }
        sessions.push(buildSession(sessionIndex, "challenge", { problemIds: id !== undefined ? [id] : [] }));
        sessionIndex++;
      } else {
        sessions.push(buildSession(sessionIndex, "rest"));
        sessionIndex++;
      }
    }
  }

  return { sessions, violations };
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

    const { sessions, violations: emitViolations } = emitSessions(track, covered, param, input.bank, overlay);
    violations.push(...emitViolations);

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

  violations.push(...checkReviewCoverage(schedule));
  violations.sort(cmpViolation);
  return violations;
}

/**
 * 每個 concept Session MUST 至少被一個 review 的 `reviewRange` 涵蓋（US4 / §13.2 週複習的實質要求）。
 * `review-range-invalid` 只驗單一區間本身是否越界，抓不到「涵蓋不足」——review 若排在某個 concept 槽
 * 之前，該 concept 就永遠落在 [weekStart, review−1]（FR-013）之外、整份課表沒有任何一天複習到它。
 * 此規則即為擋下該排法的護欄（根因在 rhythm，schema 層的 validateRhythm 會先具名回報）。
 */
function checkReviewCoverage(schedule: TrackSchedule): ScheduleViolation[] {
  const ranges = schedule.sessions
    .filter((s) => s.type === "review" && s.reviewRange)
    .map((s) => s.reviewRange!);
  const violations: ScheduleViolation[] = [];
  for (const session of schedule.sessions) {
    if (session.type !== "concept") continue;
    const covered = ranges.some(([start, end]) => start <= session.sessionIndex && session.sessionIndex <= end);
    if (!covered) {
      violations.push(
        violation(
          "review-coverage-gap",
          `${schedule.track}:session-${session.sessionIndex}`,
          `concept Session（#${session.sessionIndex}${session.conceptId ? `，${session.conceptId}` : ""}）未被任何 review 的 reviewRange 涵蓋，該 Concept 永遠不會被複習`,
        ),
      );
    }
  }
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

/**
 * determinism drift 檢查（US5 / R10）：committed 檔內容與重新生成的 `serializeSchedule` 輸出逐位元組
 * 比對；純函式供 `scripts/validate-schedule.ts` 與單元測試共用（避免 CI 與測試各自手比字串）。
 */
export function checkDrift(track: Track, committed: string, freshlyGenerated: string): ScheduleViolation[] {
  if (committed === freshlyGenerated) return [];
  return [
    violation(
      "determinism-drift",
      track,
      `schedules/${TRACK_FILE_NAME[track]} 與重新生成結果不一致（determinism drift，可能為手改生成物或輸入未同步重新生成）`,
    ),
  ];
}

export { cmpViolation } from "./schedule-violation.js";
