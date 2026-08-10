import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";
import { makeArticleMarkdown, makeCompilerDeps } from "../helpers/compiler.js";
import { asReview } from "../helpers/lesson.js";

describe("compile — review 分支（US2、FR-011）", () => {
  const deps = makeCompilerDeps({
    concepts: [
      { id: "alpha", title: "Alpha", localOrder: 1 },
      { id: "beta", title: "Beta", localOrder: 2 },
      { id: "gamma", title: "Gamma", localOrder: 3 },
    ],
    schedules: {
      foundation: [
        { sessionIndex: 1, type: "concept", conceptId: "alpha" },
        { sessionIndex: 2, type: "concept", conceptId: "beta" },
        { sessionIndex: 3, type: "rest" },
        { sessionIndex: 4, type: "concept", conceptId: "gamma" },
        { sessionIndex: 5, type: "review", reviewRange: [1, 4] },
      ],
    },
    articles: {
      "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }),
      "articles/test-topic/002-beta.md": makeArticleMarkdown({ id: "beta" }),
      "articles/test-topic/003-gamma.md": makeArticleMarkdown({ id: "gamma" }),
    },
  });

  it("reviewConcepts 由 reviewRange 推導，涵蓋範圍內全部 concept Session（依 sessionIndex 遞增）", () => {
    const lesson = asReview(compile("foundation", 5, deps));
    expect(lesson.reviewConcepts).toEqual([
      { id: "alpha", title: "Alpha" },
      { id: "beta", title: "Beta" },
      { id: "gamma", title: "Gamma" },
    ]);
  });

  it("reviewRange 只涵蓋部分 concept Session 時，reviewConcepts 只含該範圍內的", () => {
    const narrowDeps = makeCompilerDeps({
      concepts: [
        { id: "alpha", title: "Alpha", localOrder: 1 },
        { id: "beta", title: "Beta", localOrder: 2 },
      ],
      schedules: {
        foundation: [
          { sessionIndex: 1, type: "concept", conceptId: "alpha" },
          { sessionIndex: 2, type: "concept", conceptId: "beta" },
          { sessionIndex: 3, type: "review", reviewRange: [1, 1] },
        ],
      },
      articles: {
        "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }),
        "articles/test-topic/002-beta.md": makeArticleMarkdown({ id: "beta" }),
      },
    });
    const lesson = asReview(compile("foundation", 3, narrowDeps));
    expect(lesson.reviewConcepts).toEqual([{ id: "alpha", title: "Alpha" }]);
  });

  it("F8 素材未提供時 reflectionQuestion 省略（不填、不失敗）", () => {
    const lesson = asReview(compile("foundation", 5, deps));
    expect(lesson.reflectionQuestion).toBeUndefined();
  });

  it("F8 素材未提供時 encouragement 省略（不填、不失敗）", () => {
    const lesson = asReview(compile("foundation", 5, deps));
    expect(lesson.encouragement).toBeUndefined();
  });
});

describe("compile — review 分支的 F8 素材填入（US1 Acceptance 1、US2 Acceptance 1-3）", () => {
  function makeReviewSchedule(reviewSessionIndex: number) {
    return [
      { sessionIndex: 1, type: "concept" as const, conceptId: "alpha" },
      { sessionIndex: 2, type: "concept" as const, conceptId: "beta" },
      { sessionIndex: reviewSessionIndex, type: "review" as const, reviewRange: [1, 2] as [number, number] },
    ];
  }

  const articles = {
    "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }),
    "articles/test-topic/002-beta.md": makeArticleMarkdown({ id: "beta" }),
  };
  const concepts = [
    { id: "alpha", title: "Alpha", localOrder: 1, topic: "test-topic" },
    { id: "beta", title: "Beta", localOrder: 2, topic: "test-topic" },
  ];
  const reflectionBank = { version: 1 as const, byTopic: { "test-topic": ["問題一", "問題二", "問題三"] } };
  const encouragementPool = { version: 1 as const, quotes: Array.from({ length: 30 }, (_, i) => `語錄${i}`) };

  it("三軌各一個 review Session 編譯後 reviewConcepts 非空、reflectionQuestion 非空、problems.length === 1", () => {
    for (const track of ["foundation", "interviewReady", "interviewMastery"] as const) {
      const deps = makeCompilerDeps({
        concepts,
        problems: [
          { id: 1, slug: "t", title: "T", url: "https://x/", difficulty: "Easy", patterns: ["test-topic"] },
        ],
        schedules: {
          [track]: [
            { sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] },
            { sessionIndex: 2, type: "concept", conceptId: "beta" },
            { sessionIndex: 3, type: "review", reviewRange: [1, 2], problemIds: [1] },
          ],
        },
        articles,
        reflectionBank,
        encouragement: encouragementPool,
      });
      const lesson = asReview(compile(track, 3, deps));
      expect(lesson.reviewConcepts.length).toBeGreaterThan(0);
      expect(lesson.reflectionQuestion).toBeTruthy();
      expect(lesson.problems.length).toBe(1);
    }
  });

  it("encouragement 非空且存在於語錄池中", () => {
    const deps = makeCompilerDeps({
      concepts,
      schedules: { foundation: makeReviewSchedule(3) },
      articles,
      reflectionBank,
      encouragement: encouragementPool,
    });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.encouragement).toBeTruthy();
    expect(encouragementPool.quotes).toContain(lesson.encouragement);
  });

  it("同一 Track 連續 N 個 review 取得 N 則互異的 encouragement", () => {
    const sessions = [
      { sessionIndex: 1, type: "concept" as const, conceptId: "alpha" },
      { sessionIndex: 2, type: "concept" as const, conceptId: "beta" },
    ];
    for (let i = 3; i <= 12; i++) sessions.push({ sessionIndex: i, type: "review" as const, reviewRange: [1, 2] } as never);
    const deps = makeCompilerDeps({
      concepts,
      schedules: { foundation: sessions as never },
      articles,
      reflectionBank,
      encouragement: encouragementPool,
    });
    const quotes = Array.from({ length: 10 }, (_, i) => asReview(compile("foundation", i + 3, deps)).encouragement);
    expect(new Set(quotes).size).toBe(10);
  });
});

describe("compile — review 分支的 F11 小測組裝（FR-002／FR-004／FR-007／FR-008／FR-012）", () => {
  const concepts = [
    { id: "alpha", title: "Alpha", localOrder: 1, topic: "test-topic" },
    { id: "beta", title: "Beta", localOrder: 2, topic: "test-topic" },
  ];
  const articles = {
    "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }),
    "articles/test-topic/002-beta.md": makeArticleMarkdown({ id: "beta" }),
  };
  const schedules = {
    foundation: [
      { sessionIndex: 1, type: "concept" as const, conceptId: "alpha" },
      { sessionIndex: 2, type: "concept" as const, conceptId: "beta" },
      { sessionIndex: 3, type: "review" as const, reviewRange: [1, 2] as [number, number] },
    ],
  };
  function makeItem(stem: string) {
    return {
      stem,
      options: ["opt1", "opt2", "opt3", "opt4"] as [string, string, string, string],
      answerIndex: 0 as const,
      explanation: ["結論", "正解說明", "選2說明", "選3說明", "選4說明"] as [
        string,
        string,
        string,
        string,
        string,
      ],
    };
  }

  it("quizBank 缺席 ⇒ quizItems 整體不設定（FR-008）", () => {
    const deps = makeCompilerDeps({ concepts, schedules, articles });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.quizItems).toBeUndefined();
  });

  it("quizBank 存在且每個 Concept 皆有題 ⇒ quizItems.length === reviewConcepts.length", () => {
    const quizBank = {
      version: 1 as const,
      byConcept: {
        alpha: [makeItem("qa0"), makeItem("qa1"), makeItem("qa2")],
        beta: [makeItem("qb0"), makeItem("qb1"), makeItem("qb2")],
      },
    };
    const deps = makeCompilerDeps({ concepts, schedules, articles, quizBank });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.quizItems?.length).toBe(lesson.reviewConcepts.length);
  });

  it("某 Concept 題庫無題（陣列為空）⇒ 該 Concept 略過，其餘正常出題（FR-007）", () => {
    const quizBank = {
      version: 1 as const,
      byConcept: {
        alpha: [] as ReturnType<typeof makeItem>[],
        beta: [makeItem("qb0"), makeItem("qb1"), makeItem("qb2")],
      },
    };
    const deps = makeCompilerDeps({ concepts, schedules, articles, quizBank });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.quizItems?.map((q) => q.conceptId)).toEqual(["beta"]);
  });

  it("pagesBaseUrl 缺席 ⇒ 每題 quizUrl 皆為 undefined（FR-012）", () => {
    const quizBank = {
      version: 1 as const,
      byConcept: { alpha: [makeItem("qa0"), makeItem("qa1"), makeItem("qa2")] },
    };
    const deps = makeCompilerDeps({ concepts, schedules, articles, quizBank });
    const lesson = asReview(compile("foundation", 3, deps));
    for (const q of lesson.quizItems ?? []) expect(q.quizUrl).toBeUndefined();
  });

  it("pagesBaseUrl 存在 ⇒ quizUrl = `${pagesBaseUrl}/quiz/${conceptId}.html`（FR-012）", () => {
    const quizBank = {
      version: 1 as const,
      byConcept: { alpha: [makeItem("qa0"), makeItem("qa1"), makeItem("qa2")] },
    };
    const deps = makeCompilerDeps({
      concepts,
      schedules,
      articles,
      quizBank,
      pagesBaseUrl: "https://example.github.io/leetcode-daily-coach",
    });
    const lesson = asReview(compile("foundation", 3, deps));
    const alphaItem = lesson.quizItems?.find((q) => q.conceptId === "alpha");
    expect(alphaItem?.quizUrl).toBe("https://example.github.io/leetcode-daily-coach/quiz/alpha.html");
  });

  it("全部 Concept 皆無題 ⇒ quizItems 整體不設定（MUST NOT 以空陣列填充）", () => {
    const quizBank = { version: 1 as const, byConcept: {} };
    const deps = makeCompilerDeps({ concepts, schedules, articles, quizBank });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.quizItems).toBeUndefined();
  });

  it("pagesBaseUrl 缺席 ⇒ moreQuizzesUrl 不設定", () => {
    const quizBank = {
      version: 1 as const,
      byConcept: { alpha: [makeItem("qa0"), makeItem("qa1"), makeItem("qa2")] },
    };
    const deps = makeCompilerDeps({ concepts, schedules, articles, quizBank });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.moreQuizzesUrl).toBeUndefined();
  });

  it("pagesBaseUrl 存在且有出題 ⇒ moreQuizzesUrl = `${pagesBaseUrl}/`", () => {
    const quizBank = {
      version: 1 as const,
      byConcept: { alpha: [makeItem("qa0"), makeItem("qa1"), makeItem("qa2")] },
    };
    const deps = makeCompilerDeps({
      concepts,
      schedules,
      articles,
      quizBank,
      pagesBaseUrl: "https://example.github.io/leetcode-daily-coach",
    });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.moreQuizzesUrl).toBe("https://example.github.io/leetcode-daily-coach/");
  });

  it("pagesBaseUrl 存在但全部 Concept 皆無題 ⇒ moreQuizzesUrl 不設定（隨 quizItems 一併省略）", () => {
    const quizBank = { version: 1 as const, byConcept: {} };
    const deps = makeCompilerDeps({
      concepts,
      schedules,
      articles,
      quizBank,
      pagesBaseUrl: "https://example.github.io/leetcode-daily-coach",
    });
    const lesson = asReview(compile("foundation", 3, deps));
    expect(lesson.moreQuizzesUrl).toBeUndefined();
  });
});
