// F2 Curriculum 型別入口（純型別，MUST NOT 含 runtime import）。
// 供 src/compiler/schema.ts、src/compiler/curriculum.ts 與未來 F5 Lesson Compiler 共用。
// 欄位對齊 docs/spec.md §16.1（ConceptNode）與本 Feature data-model.md §3 / §4。

// ── 骨架（curriculum/modules.json 的手寫來源真相） ──────────────────────────

/** modules.json 的 Topic 條目（Module 下的次層分組）。 */
export interface TopicSkeleton {
  id: string;
  title: string;
}

/** modules.json 的 Module 條目（= docs/spec.md §8.2 的一個 Level）。 */
export interface ModuleSkeleton {
  id: string;
  title: string;
  /** 0–15，MUST 等於 modules 陣列索引（宣告序 = level）。 */
  level: number;
  /** 至少 1 個；順序即 Module 內 Topic 宣告序。 */
  topics: TopicSkeleton[];
}

/** modules.json 檔案根結構。 */
export interface CurriculumSkeleton {
  version: number;
  modules: ModuleSkeleton[];
}

// ── in-memory 圖節點 ────────────────────────────────────────────────────────

/** 骨架載入後的 Module 節點（附宣告序索引）。 */
export interface ModuleNode extends ModuleSkeleton {
  /** modules 陣列中的宣告序索引（= level）。 */
  moduleIndex: number;
}

/** 骨架載入後的 Topic 節點（附所屬 Module 與 Module 內宣告序）。 */
export interface TopicNode extends TopicSkeleton {
  moduleId: string;
  /** 所屬 Module 的 topics 陣列索引。 */
  topicIndex: number;
}

/** Concept 的 in-memory 形態（對齊 docs/spec.md §16.1，另加 pattern/complexity label 與 localOrder）。 */
export interface ConceptNode {
  id: string;
  title: string;
  module: string;
  topic: string;
  difficulty: "easy" | "medium";
  estimatedMinutes: number;
  patternLabel: string;
  complexityLabel: string;
  prerequisite: string[];
  next: string[];
  learningGoal: string[];
  exitCriteria: string[];
  leetcode: number[];
  tags: string[];
  /** 檔名 NNN（Topic 內排序用局部序號，§8.4）。 */
  localOrder: number;
  /** concepts/{topic}/{NNN}-{slug}.md（F2 填）。 */
  skeletonPath: string;
  /** 由 skeletonPath 推導的 articles/{topic}/{NNN}-{slug}.md（F5 讀 Full Article）。 */
  articlePath: string;
  /** Concept 檔實際所在的資料夾名（供 validateCurriculum 比對 topic == 資料夾名，FR-013）。 */
  dirName: string;
}

/**
 * 前向依賴 / 孤兒起點判定共用的確定性全序（R7 / FR-015 / FR-016）。
 * 排序鍵：moduleIndex → topicIndex → localOrder(NNN) → id。
 */
export interface Ordinal {
  moduleIndex: number;
  topicIndex: number;
  localOrder: number;
  id: string;
}

/** 由骨架與全部 Concept 建成的課程圖。 */
export interface CurriculumGraph {
  /** 保序（宣告序）。 */
  modules: ModuleNode[];
  /** topicId → 節點（附 moduleId、宣告序）。 */
  topics: Map<string, TopicNode>;
  /** conceptId → 節點（建立時偵測 id 碰撞）。 */
  concepts: Map<string, ConceptNode>;
  /** conceptId → 全序（前向依賴與孤兒起點共用，R7）。 */
  ordinalOf: Map<string, Ordinal>;
}

// ── 驗證結果 ────────────────────────────────────────────────────────────────

/** 違規規則枚舉（data-model.md §4；每一類至少一個單元測試）。 */
export type ViolationRule =
  | "schema-missing-field"
  | "schema-type"
  | "schema-id-format"
  | "leetcode-format"
  | "skeleton-shape"
  | "dangling-ref"
  | "dangling-leetcode"
  | "cycle"
  | "self-dependency"
  | "forward-dependency"
  | "orphan"
  | "edge-inconsistency"
  | "duplicate-id"
  | "granularity-range"
  | "empty-curriculum"
  | "duplicate-edge";

export type Severity = "error" | "warning";

/** 一筆具名違規（fail loud 的載體）。 */
export interface Violation {
  rule: ViolationRule;
  severity: Severity;
  /** 違規主體：conceptId / moduleId / topicId / 檔案路徑。 */
  subject: string;
  /** 違規欄位（schema 類）或主體種類（duplicate-id 用 concept/module/topic）。 */
  field?: string;
  /** 關聯對象：前向依賴 / 懸空參照的目標 id 等。 */
  target?: string;
  /** 人可讀、具名。 */
  message: string;
}

/** 被延後 / 略過的檢查（如 leetcode 存在性 deferred-to-F3，FR-023）。 */
export interface SkippedCheck {
  check: string;
  reason: string;
}

/** 一次驗證的結論。 */
export interface ValidationResult {
  /** 無 error 級 violation 即 true。 */
  ok: boolean;
  /** 穩定排序（R5）。 */
  violations: Violation[];
  /** ok 時的 canonical 拓樸序（FR-011）。 */
  topoOrder?: string[];
  /** 例：leetcode 存在性 deferred-to-F3。 */
  skipped: SkippedCheck[];
}

/** validateCurriculum 的選項。 */
export interface ValidateOptions {
  /** 預設 'stub'（下限類規則於 stub 豁免，full 強制）。 */
  mode?: "stub" | "full";
  /** 提供時啟用 leetcode 存在性檢查；缺省則列入 skipped（FR-023）。 */
  problemExists?: (leetcodeId: number) => boolean;
}
