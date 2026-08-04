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
