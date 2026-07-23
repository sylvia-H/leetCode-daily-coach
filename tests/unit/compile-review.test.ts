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
});
