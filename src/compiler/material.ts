// F8 素材（Reflection 問題庫 / 鼓勵語錄池）的 schema、決定性選取純函式與品質 Gate 判準
// （data-model.md §1/§1.1/§2、contracts/material-schema.md、contracts/review-selection.md）。
// Compiler（runtime）、CI Gate（runContentGate）、生成腳本（scripts/generate-materials.ts）三者
// MUST 共用同一份（憲章 IX），MUST NOT 各自實作。純函式：無 I/O、無隨機源、無時間依賴。
import { z } from "zod";
import { TRACK_ORDER } from "../config.js";
import { MATERIAL_BUDGET_LIMITS } from "../renderer/budget.js";
import { checkTraditionalChinese } from "./traditional-chinese.js";
import type { CurriculumGraph, Ordinal } from "../types/curriculum.js";
import type { Track } from "../types/lesson.js";
import type { TrackSchedule } from "../types/schedule.js";

// ── 型別（data-model.md §1/§2） ──────────────────────────────────────────────

export interface ReflectionBank {
  version: 1;
  /** key = curriculum/modules.json 的 topics[].id；宣告序即輪替序。陣列本身 MAY 為空（FR-014）。 */
  byTopic: Record<string, string[]>;
}

export interface EncouragementPool {
  version: 1;
  /** 宣告序即輪替序。陣列本身 MAY 為空（FR-014）。 */
  quotes: string[];
}

/** data-model.md §1.1：rule 名稱具名到型別層級，MUST NOT 只寫進 message（SC-007）。 */
export type MaterialViolationRule =
  | "material-schema" // ★ 由載入層 throw 實現，非 checkMaterials() 的輸出（contracts/material-schema.md §3 註記）
  | "material-unknown-topic"
  | "material-budget"
  | "material-traditional-chinese"
  | "material-duplicate"
  | "material-pool-size"
  | "material-progress-coupled"
  | "material-quota";

export interface MaterialViolation {
  rule: MaterialViolationRule;
  /** 素材座標：`reflection-bank:{topicId}[{i}]`、`reflection-bank:{topicId}`、`encouragement[{i}]` 或 `encouragement`。 */
  subject: string;
  message: string;
}

// ── zod schema（contracts/material-schema.md §1；陣列 MAY 為空，MUST NOT 用 min(1)，否則與 FR-014 的
// 降級路徑互斥） ────────────────────────────────────────────────────────────

export const reflectionBankSchema = z
  .object({
    version: z.literal(1),
    byTopic: z.record(z.string(), z.array(z.string().min(1))),
  })
  .strict();

export const encouragementPoolSchema = z
  .object({
    version: z.literal(1),
    quotes: z.array(z.string().min(1)),
  })
  .strict();

// ── Topic 宣告序（Module 宣告序 → Module 內 Topic 宣告序；供素材 canonical 序列化與配額計算共用） ──

export function orderedTopicIds(graph: CurriculumGraph): string[] {
  const moduleIndexOf = new Map(graph.modules.map((m) => [m.id, m.moduleIndex]));
  return [...graph.topics.values()]
    .sort(
      (a, b) =>
        (moduleIndexOf.get(a.moduleId) ?? 0) - (moduleIndexOf.get(b.moduleId) ?? 0) || a.topicIndex - b.topicIndex,
    )
    .map((t) => t.id);
}

// ── Topic 歸屬（FR-011，contracts/review-selection.md §2） ──────────────────

function cmpOrdinal(a: Ordinal, b: Ordinal): number {
  return (
    a.moduleIndex - b.moduleIndex ||
    a.topicIndex - b.topicIndex ||
    a.localOrder - b.localOrder ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** review Session 依 reviewRange 解析出的歸屬 Topic：取範圍內 sessionIndex 最小的 concept Session
 * 所屬 Concept 的 topic；並列（防禦性；sessionIndex 唯一故實際不可達）以 ordinalOf 全序決勝。
 * 範圍內無 concept Session ⇒ undefined。MUST NOT 依賴 JSON 鍵序或雜湊。 */
export function resolveReviewTopic(
  schedule: TrackSchedule,
  graph: CurriculumGraph,
  reviewRange: readonly [number, number],
): string | undefined {
  const [start, end] = reviewRange;
  let best: { conceptId: string; sessionIndex: number; ordinal: Ordinal } | undefined;
  for (const s of schedule.sessions) {
    if (s.type !== "concept" || s.conceptId === undefined) continue;
    if (s.sessionIndex < start || s.sessionIndex > end) continue;
    const ordinal = graph.ordinalOf.get(s.conceptId);
    if (!ordinal) continue;
    if (
      !best ||
      s.sessionIndex < best.sessionIndex ||
      (s.sessionIndex === best.sessionIndex && cmpOrdinal(ordinal, best.ordinal) < 0)
    ) {
      best = { conceptId: s.conceptId, sessionIndex: s.sessionIndex, ordinal };
    }
  }
  if (!best) return undefined;
  return graph.concepts.get(best.conceptId)?.topic;
}

/** 該 Track 課表中，本 review Session 在全部 review Session（依 sessionIndex 升冪）中的 0-based 序位。 */
export function reviewOrdinalOf(schedule: TrackSchedule, sessionIndex: number): number {
  const reviewIndices = schedule.sessions
    .filter((s) => s.type === "review")
    .map((s) => s.sessionIndex)
    .sort((a, b) => a - b);
  return reviewIndices.indexOf(sessionIndex);
}

// ── 選取純函式（research R5/R6，contracts/review-selection.md §3/§4） ────────

/**
 * Reflection 問題選取：`index = (topicOccurrence + trackOffset) mod pool.length`。
 * topicOccurrence = 同 Track 中 sessionIndex 更小、且歸屬同一 Topic 的 review Session 數（0-based）。
 * MUST NOT 改用 sessionIndex 對池大小取模（research R6：會讓同一 Topic 每次都推同一則）。
 */
export function selectReflectionQuestion(input: {
  bank: ReflectionBank;
  schedule: TrackSchedule;
  graph: CurriculumGraph;
  track: Track;
  sessionIndex: number;
}): string | undefined {
  const { bank, schedule, graph, track, sessionIndex } = input;
  const session = schedule.sessions.find((s) => s.sessionIndex === sessionIndex && s.type === "review");
  if (!session?.reviewRange) return undefined;
  const topicId = resolveReviewTopic(schedule, graph, session.reviewRange);
  if (topicId === undefined) return undefined;
  const pool = bank.byTopic[topicId];
  if (!pool || pool.length === 0) return undefined;

  let occurrence = 0;
  for (const s of schedule.sessions) {
    if (s.type !== "review" || s.sessionIndex >= sessionIndex || !s.reviewRange) continue;
    if (resolveReviewTopic(schedule, graph, s.reviewRange) === topicId) occurrence++;
  }

  const trackOffset = TRACK_ORDER.indexOf(track);
  return pool[(occurrence + trackOffset) % pool.length];
}

/**
 * 鼓勵語選取：`index = (reviewOrdinal + trackOffset) mod quotes.length`。
 * MUST NOT 改用 sessionIndex 對池大小取模（research R5：三軌 rhythm 步長固定會讓整輪只用得到
 * 少數幾則，SC-002 數學上不可能成立）。
 */
export function selectEncouragement(input: {
  pool: EncouragementPool;
  schedule: TrackSchedule;
  track: Track;
  sessionIndex: number;
}): string | undefined {
  const { pool, schedule, track, sessionIndex } = input;
  if (pool.quotes.length === 0) return undefined;
  const k = reviewOrdinalOf(schedule, sessionIndex);
  if (k < 0) return undefined;
  const trackOffset = TRACK_ORDER.indexOf(track);
  return pool.quotes[(k + trackOffset) % pool.quotes.length];
}

// ── 品質 Gate（contracts/material-schema.md §3） ─────────────────────────────

function codePointLength(text: string): number {
  return Array.from(text).length;
}

/** Reflection 與 Encouragement 共用的三項判準：預算、繁中、（呼叫端另行處理）重複。 */
function checkBudgetAndChinese(text: string, subject: string, limit: number): MaterialViolation[] {
  const violations: MaterialViolation[] = [];
  const length = codePointLength(text);
  if (length > limit) {
    violations.push({
      rule: "material-budget",
      subject,
      message: `「${subject}」長度 ${length} 字元，超過上限 ${limit}：「${text}」`,
    });
  }
  const tc = checkTraditionalChinese(text);
  for (const v of tc.violations) {
    violations.push({ rule: "material-traditional-chinese", subject, message: `${subject}：${v.message}` });
  }
  return violations;
}

/** 重複偵測：比對範圍由呼叫端決定 entries 涵蓋的集合（Reflection 為跨 Topic 全庫，語錄池為池內，兩者 MUST NOT 互相比對）。 */
function checkDuplicates(entries: readonly { text: string; subject: string }[]): MaterialViolation[] {
  const violations: MaterialViolation[] = [];
  const firstSeenAt = new Map<string, string>();
  for (const { text, subject } of entries) {
    const first = firstSeenAt.get(text);
    if (first !== undefined) {
      violations.push({
        rule: "material-duplicate",
        subject,
        message: `「${subject}」與「${first}」內容完全重複：「${text}」`,
      });
    } else {
      firstSeenAt.set(text, subject);
    }
  }
  return violations;
}

/** research R13：零誤判的機械樣態——不比對 Concept id / title 清單（會誤殺一般性詞彙）。 */
function isProgressCoupled(text: string): boolean {
  if (/https?:\/\//i.test(text)) return true;
  if (/\[[^\]]*\]\([^)]*\)/.test(text)) return true;
  if (/leetcode/i.test(text)) return true;
  if (/#\d+/.test(text)) return true;
  return false;
}

/** contracts/material-schema.md §3.1：配額 = 該 Topic 在三份課表中依歸屬規則被選中的最大次數。 */
function computeReviewTopicCounts(
  schedules: Record<Track, TrackSchedule>,
  graph: CurriculumGraph,
): Map<string, Map<Track, number>> {
  const counts = new Map<string, Map<Track, number>>();
  for (const track of TRACK_ORDER) {
    const schedule = schedules[track];
    for (const s of schedule.sessions) {
      if (s.type !== "review" || !s.reviewRange) continue;
      const topicId = resolveReviewTopic(schedule, graph, s.reviewRange);
      if (topicId === undefined) continue;
      let byTrack = counts.get(topicId);
      if (!byTrack) {
        byTrack = new Map();
        counts.set(topicId, byTrack);
      }
      byTrack.set(track, (byTrack.get(track) ?? 0) + 1);
    }
  }
  return counts;
}

function checkQuota(
  bank: ReflectionBank,
  schedules: Record<Track, TrackSchedule>,
  graph: CurriculumGraph,
): MaterialViolation[] {
  const violations: MaterialViolation[] = [];
  const counts = computeReviewTopicCounts(schedules, graph);
  for (const topicId of orderedTopicIds(graph)) {
    const byTrack = counts.get(topicId);
    if (!byTrack) continue; // FR-003a：該 Topic 未在任何課表的 review 中出現 ⇒ requiredQuota = 0 ⇒ 合法
    let maxTrack: Track | undefined;
    let maxCount = 0;
    for (const track of TRACK_ORDER) {
      const c = byTrack.get(track) ?? 0;
      if (c > maxCount) {
        maxCount = c;
        maxTrack = track;
      }
    }
    if (maxCount === 0) continue;
    const actual = bank.byTopic[topicId]?.length ?? 0;
    if (actual < maxCount) {
      violations.push({
        rule: "material-quota",
        subject: `reflection-bank:${topicId}`,
        message: `Topic「${topicId}」需要至少 ${maxCount} 則（由 Track「${maxTrack}」的 review 選取次數導出），reflection-bank.json 實際只有 ${actual} 則`,
      });
    }
  }
  return violations;
}

function checkReflectionBank(
  bank: ReflectionBank,
  schedules: Record<Track, TrackSchedule>,
  graph: CurriculumGraph,
): MaterialViolation[] {
  const violations: MaterialViolation[] = [];
  const entries: { text: string; subject: string }[] = [];

  for (const [topicId, questions] of Object.entries(bank.byTopic)) {
    if (!graph.topics.has(topicId)) {
      violations.push({
        rule: "material-unknown-topic",
        subject: `reflection-bank:${topicId}`,
        message: `reflection-bank.json 的 Topic key「${topicId}」不存在於 curriculum/modules.json`,
      });
    }
    questions.forEach((text, i) => {
      const subject = `reflection-bank:${topicId}[${i}]`;
      entries.push({ text, subject });
      violations.push(...checkBudgetAndChinese(text, subject, MATERIAL_BUDGET_LIMITS.reflectionQuestion));
    });
  }

  violations.push(...checkDuplicates(entries)); // 跨 Topic 全庫比對（FR-005）
  violations.push(...checkQuota(bank, schedules, graph));
  return violations;
}

function checkEncouragementPool(pool: EncouragementPool): MaterialViolation[] {
  const violations: MaterialViolation[] = [];
  if (pool.quotes.length < 30) {
    violations.push({
      rule: "material-pool-size",
      subject: "encouragement",
      message: `語錄池僅 ${pool.quotes.length} 則，低於下限 30（FR-007）`,
    });
  }

  const entries = pool.quotes.map((text, i) => ({ text, subject: `encouragement[${i}]` }));
  for (const { text, subject } of entries) {
    violations.push(...checkBudgetAndChinese(text, subject, MATERIAL_BUDGET_LIMITS.encouragement));
    if (isProgressCoupled(text)) {
      violations.push({
        rule: "material-progress-coupled",
        subject,
        message: `語錄疑似綁定進度（含連結／平台名／題號樣式）：「${text}」`,
      });
    }
  }
  violations.push(...checkDuplicates(entries)); // 池內比對（FR-009），MUST NOT 與 Reflection 互相比對

  return violations;
}

/**
 * 素材品質 Gate（contracts/material-schema.md §3）：純函式，供 `runContentGate` 與
 * `scripts/generate-materials.ts` 共用（憲章 IX）。素材缺席時回傳空陣列（缺席合法，FR-014）。
 * `material-schema` MUST NOT 在此檢查——由載入層 throw 實現（見 §3 註記），本函式收到的已是
 * 通過 zod strict 的型別，型別上不可能觀察到 schema 違規。
 */
export function checkMaterials(input: {
  reflectionBank?: ReflectionBank;
  encouragement?: EncouragementPool;
  schedules: Record<Track, TrackSchedule>;
  graph: CurriculumGraph;
}): MaterialViolation[] {
  const violations: MaterialViolation[] = [];
  if (input.reflectionBank) {
    violations.push(...checkReflectionBank(input.reflectionBank, input.schedules, input.graph));
  }
  if (input.encouragement) {
    violations.push(...checkEncouragementPool(input.encouragement));
  }
  return violations;
}
