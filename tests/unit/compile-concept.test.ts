import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";
import { makeArticleMarkdown, makeCompilerDeps, makeProblem } from "../helpers/compiler.js";

const ARTICLE_PATH = "articles/test-topic/001-alpha.md";

describe("compile — concept Lesson 欄位來源（US1）", () => {
  it("concept.* 取自 Article、problems 取自 Problem Bank + Today's Challenge、color 取自 Module 色表", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha", module: "array", leetcode: [1] }],
      problems: [makeProblem({ id: 1, title: "Two Sum", difficulty: "Easy" })],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] }] },
      articles: {
        [ARTICLE_PATH]: makeArticleMarkdown({
          id: "alpha",
          title: "Alpha",
          module: "array",
          digest: "Alpha 的 Digest",
          challenge: [{ id: 1, why: "why alpha", hint: "hint alpha" }],
        }),
      },
    });

    const lesson = compile("foundation", 1, deps);
    expect(lesson.type).toBe("concept");
    expect(lesson.concept?.id).toBe("alpha");
    expect(lesson.concept?.title).toBe("Alpha");
    expect(lesson.concept?.digest).toBe("Alpha 的 Digest");
    expect(lesson.problems).toEqual([
      {
        id: 1,
        title: "Two Sum",
        url: "https://leetcode.com/problems/problem-1/",
        difficulty: "Easy",
        whyThisPattern: "why alpha",
        hint: "hint alpha",
      },
    ]);
    expect(typeof lesson.color).toBe("number");
  });

  it("leetcode: [] 的無題目觀念課編出 problems: [] 且不報錯", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
      articles: { [ARTICLE_PATH]: makeArticleMarkdown({ id: "alpha" }) },
    });

    const lesson = compile("foundation", 1, deps);
    expect(lesson.problems).toEqual([]);
  });

  it("frontmatter 的 pattern_label / complexity_label 原樣帶入不改寫", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha", patternLabel: "Weird Label!", complexityLabel: "O(weird)" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
      articles: {
        [ARTICLE_PATH]: makeArticleMarkdown({ id: "alpha", patternLabel: "Weird Label!", complexityLabel: "O(weird)" }),
      },
    });

    const lesson = compile("foundation", 1, deps);
    expect(lesson.concept?.patternLabel).toBe("Weird Label!");
    expect(lesson.concept?.complexityLabel).toBe("O(weird)");
  });
});
