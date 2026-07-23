// `Lesson` 為以 `type` 為判別子的 discriminated union（src/types/lesson.ts）。測試在斷言
// 類型專屬欄位前 MUST 先收斂型別——這些 helper 讓「型別不符」在測試裡就以明確訊息失敗，
// 而不是靠 `as` 硬轉、把型別漂移藏起來。
import type {
  ConceptLesson,
  Lesson,
  LessonConcept,
  PracticeLesson,
  Problem,
  RestLesson,
  ReviewLesson,
  Track,
} from "../../src/types/lesson.js";

function narrow<T extends Lesson>(lesson: Lesson, types: readonly Lesson["type"][]): T {
  if (!types.includes(lesson.type)) {
    throw new Error(`預期 ${types.join(" / ")} 類 Lesson，實際為 ${lesson.type}`);
  }
  return lesson as T;
}

export function asConcept(lesson: Lesson): ConceptLesson {
  return narrow<ConceptLesson>(lesson, ["concept"]);
}

export function asPractice(lesson: Lesson): PracticeLesson {
  return narrow<PracticeLesson>(lesson, ["practice", "challenge"]);
}

export function asReview(lesson: Lesson): ReviewLesson {
  return narrow<ReviewLesson>(lesson, ["review"]);
}

export function asRest(lesson: Lesson): RestLesson {
  return narrow<RestLesson>(lesson, ["rest"]);
}

// ── Lesson fixture builders ────────────────────────────────────────────────

interface LessonBaseFields {
  sessionIndex: number;
  track: Track;
  color: number;
  problems: Problem[];
}

/**
 * 某一種 Session 類型的 fixture 種子：類型專屬欄位 MUST 齊備（由 union 逐一檢查），
 * 共通欄位可省略而取用預設值。
 */
export type LessonSeed<T extends Lesson = Lesson> = T extends Lesson
  ? Omit<T, keyof LessonBaseFields> & Partial<LessonBaseFields>
  : never;

const BASE: LessonBaseFields = { sessionIndex: 1, track: "foundation", color: 0x2ecc71, problems: [] };

export function makeLesson(seed: LessonSeed): Lesson {
  return { ...BASE, ...seed } as Lesson;
}

export function makeLessonConcept(overrides: Partial<LessonConcept> = {}): LessonConcept {
  return {
    id: "alpha",
    title: "Alpha",
    digest: "digest",
    tsTip: "ts",
    pyTip: "py",
    takeaway: "take",
    exitCriteria: ["c1", "c2"],
    patternLabel: "Pattern X",
    complexityLabel: "O(n)",
    estimatedMinutes: 20,
    articlePath: "articles/x/001-alpha.md",
    ...overrides,
  };
}

export function makeConceptLesson(overrides: Partial<ConceptLesson> = {}): ConceptLesson {
  const concept = overrides.concept ?? makeLessonConcept();
  return {
    ...BASE,
    type: "concept",
    concept,
    path: { current: concept.title },
    ...overrides,
  };
}
