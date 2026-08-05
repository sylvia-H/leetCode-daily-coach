// F3 Problem Bank 型別入口（純型別，MUST NOT 含 runtime import）。
// 供 src/compiler/problem.ts 與未來 F5 Lesson Compiler 共用。
// 欄位對齊 docs/spec.md §12.1 與本 Feature data-model.md §1/§2/§4/§5。

export type Difficulty = "Easy" | "Medium" | "Hard";
export type ReviewPriority = "high" | "medium" | "low";

/** 一題 LeetCode 題目的參照性 metadata；MUST NOT 含任何題目敘述／內容欄位（FR-004、§5）。 */
export interface ProblemMeta {
  // ── 必填（FR-001） ──
  id: number;
  slug: string;
  title: string;
  url: string;
  difficulty: Difficulty;
  patterns: string[];

  // ── 選配（提供時才驗型別／值域；缺省合法） ──
  keywords?: string[];
  review_priority?: ReviewPriority;
  estimated_minutes?: number;
  lists?: string[];
  companies?: string[];
}

/** `data/problem-bank.json` 的檔案根結構：以 LeetCode 題號字串為 key 的物件（§12.1、§26.1）。 */
export type ProblemBankFile = Record<string, ProblemMeta>;

/** 載入後的 in-memory 題庫（查找以數值 id 為鍵；byPattern 為升冪 id 排序，R5）。 */
export interface ProblemBank {
  byId: Map<number, ProblemMeta>;
  byPattern: Map<string, ProblemMeta[]>;
}

/** F3 違規規則枚舉（data-model.md §4；每一類至少一個單元測試，SC-004）。 */
export type ProblemViolationRule =
  | "bank-load"
  | "schema-missing-field"
  | "schema-type"
  | "difficulty-range"
  | "review-priority-range"
  | "key-id-mismatch"
  | "patterns-empty"
  | "dangling-pattern"
  | "slug-url-mismatch"
  | "problem-count-range"
  | "duplicate-leetcode"
  | "unknown-leetcode";

/** 沿用 F2 `Violation` 結構（rule/severity/subject/field?/target?/message），擴充 F3 規則值域。 */
export interface ProblemViolation {
  rule: ProblemViolationRule;
  severity: "error" | "warning";
  /** 題號字串 / conceptId / 檔案路徑。 */
  subject: string;
  /** 違規欄位（schema 類）。 */
  field?: string;
  /** 關聯對象：無效 pattern id、缺漏題號等。 */
  target?: string;
  /** 人可讀、具名（fail loud，FR-013）。 */
  message: string;
}
