export type Track = "foundation" | "interviewReady" | "interviewMastery";
export type SessionType = "concept" | "practice" | "review" | "challenge" | "rest";

export interface Problem {
  id: number;
  title: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard";
  whyThisPattern?: string;
  hint?: string;
}

export interface PathLabels {
  prev?: string;
  current: string;
  next?: string;
}

export interface LessonConcept {
  id: string;
  title: string;
  digest: string;
  tsTip: string;
  pyTip: string;
  takeaway: string;
  exitCriteria: string[];
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  articlePath: string;
}

export interface ReviewConcept {
  id: string;
  title: string;
}

/**
 * `Lesson` 是 Compiler → Renderer 的唯一介面（contracts/lesson-contract.md §3）。
 * 以 `type` 為判別子的 discriminated union：每種 Session 類型「哪些欄位必然存在」由型別系統保證，
 * Renderer 因此不需要 `!` 斷言，也不會出現「concept 課卻沒有 concept」這種編譯得過的組合。
 */
interface LessonBase {
  sessionIndex: number;
  track: Track;
  color: number;
  problems: Problem[];
}

export interface ConceptLesson extends LessonBase {
  type: "concept";
  concept: LessonConcept;
  path: PathLabels;
  /** Overlay 唯一被消費的欄位；缺席即省略該段落（MUST NOT 為空字串）。 */
  overlayNotes?: string;
}

export interface PracticeLesson extends LessonBase {
  type: "practice" | "challenge";
}

export interface ReviewLesson extends LessonBase {
  type: "review";
  reviewConcepts: ReviewConcept[];
  /** F8 素材；缺席即省略（spec FR-031）。 */
  reflectionQuestion?: string;
}

export interface RestLesson extends LessonBase {
  type: "rest";
  /** F8 素材；缺席即省略（spec FR-031）。 */
  encouragement?: string;
}

export type Lesson = ConceptLesson | PracticeLesson | ReviewLesson | RestLesson;

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string };
  author?: { name: string };
  url?: string;
}

/**
 * render() 對 checkBudget 宣告「本則訊息實際放進 embeds 的可預算段落」。
 * **不變式**：Renderer 每放進 embed 的一段可變長度文字，MUST 同時登記對應 slot——否則該段落會完全
 * 逃過逐區塊預算（只剩 embed field 1024 與總量 5500 兜底）。此不變式由
 * `tests/unit/budget-slot-parity.test.ts` 強制。
 */
export interface BudgetSlots {
  digest?: string;
  tsTip?: string;
  pyTip?: string;
  exitCriteria?: string;
  takeaway?: string;
  pathFooter?: string;
  overlayNotes?: string;
  reflectionQuestion?: string;
  encouragement?: string;
  problems?: string[];
}

export interface RenderedMessage {
  embeds: DiscordEmbed[];
  budgetSlots: BudgetSlots;
}
