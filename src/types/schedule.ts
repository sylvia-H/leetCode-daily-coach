// F4 Schedule Generator 型別入口（純型別，MUST NOT 含 runtime import）。
// 供 src/compiler/schedule-schema.ts、src/compiler/schedule-generator.ts 與未來 F5 Lesson Compiler 共用。
// 欄位對齊 docs/spec.md §16.2 / §16.3 與本 Feature data-model.md §1–§5。
import type { SessionType, Track } from "./lesson.js";
import type { Difficulty } from "./problem.js";

// ── 生成物：schedules/{track}.json（§16.2） ─────────────────────────────────

/** 課表中的一堂課。欄位序（canonical 序列化）：sessionIndex → type → conceptId? → reviewRange? → problemIds?（R2）。 */
export interface SessionPlan {
  sessionIndex: number;
  type: SessionType;
  /** type === 'concept' 時 MUST 存在；跨全課表每個 conceptId 至多出現一次。 */
  conceptId?: string;
  /** type === 'review' 時 MUST 存在：[weekStartIndex, reviewSessionIndex - 1]。 */
  reviewRange?: [number, number];
  /** concept / practice / challenge 可帶；空陣列於序列化時省略（不輸出 []／null）。 */
  problemIds?: number[];
}

/** 某 Track 的完整課表（生成物，MUST NOT 手寫）。 */
export interface TrackSchedule {
  track: Track;
  targetLevel: "easy" | "medium" | "hard";
  sessions: SessionPlan[];
}

// ── 輸入：curriculum/track-params.json（本 Feature 定形） ────────────────────

/** 單一 Track 的參數設定。 */
export interface TrackParam {
  targetLevel: "easy" | "medium" | "hard";
  /** 含；涵蓋 module.level ≤ maxLevel 的 Concept（FR-014a 主要機制）。 */
  maxLevel: number;
  /** 提供時取代 maxLevel 篩選；跳號可能觸發 coverage-gap。 */
  moduleAllowlist?: string[];
  /** 該 Track 難度帶（過濾 Problem Bank），非空。 */
  problemDifficulties: Difficulty[];
  /** challenge 槽選題難度。 */
  challengeDifficulty: Difficulty;
  /** 長度 2–14；MUST 含 ≥1 concept 與 ≥1 review。 */
  rhythm: SessionType[];
}

/** curriculum/track-params.json 檔根（TrackParams 概念的完整檔案型別）。 */
export interface TrackParamsFile {
  version: number;
  tracks: Record<Track, TrackParam>;
}

// ── 輸入：overlays/{track}.json（§16.3） ─────────────────────────────────────

/** 單一 Concept 的 Track 專屬加料；語意為疊加，MUST NOT 取代 Core Content。 */
export interface ConceptOverlay {
  /** 附加題目（疊加於過濾結果之後，不取代）；每項 MUST 存在於 Problem Bank。 */
  extraProblemIds?: number[];
  /** 疊加註記；本 Feature 僅驗結構，F5 消費。 */
  extraNotesMarkdown?: string;
  /**
   * per-Concept challenge 難度覆寫；本 Feature 僅驗型別/enum，rhythm 的 challenge 槽非
   * concept-bound、無實際套用點——與 TrackParam.challengeDifficulty（per-Track）不同，
   * 兩者的套用優先關係由 F5 定案（spec FR-009）。
   */
  challengeDifficulty?: Difficulty;
}

export interface TrackOverlay {
  track: Track;
  byConcept: Record<string, ConceptOverlay>;
}

// ── 違規模型（沿用 F2/F3 Violation 結構） ────────────────────────────────────

export type ScheduleViolationRule =
  | "schema-missing-field"
  | "schema-type"
  | "param-invalid"
  | "input-unreadable"
  | "coverage-gap"
  | "unknown-module"
  | "forward-dependency"
  | "one-concept-violation"
  | "duplicate-concept"
  | "review-range-invalid"
  | "review-coverage-gap"
  | "challenge-no-problem"
  | "practice-no-problem"
  | "review-no-problem"
  | "review-challenge-duplicate"
  | "dangling-concept"
  | "dangling-problem"
  | "overlay-unknown-concept"
  | "session-problem-overflow"
  | "determinism-drift";

export interface ScheduleViolation {
  rule: ScheduleViolationRule;
  severity: "error" | "warning";
  /** track / conceptId / sessionIndex / 檔案路徑。 */
  subject: string;
  field?: string;
  /** 關聯對象：被違反的 prerequisite / 缺漏題號 / 未涵蓋 conceptId 等。 */
  target?: string;
  message: string;
}
