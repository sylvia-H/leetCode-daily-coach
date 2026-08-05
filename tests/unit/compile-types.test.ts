import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";
import { makeArticleMarkdown, makeCompilerDeps, makeProblem } from "../helpers/compiler.js";
import { asReview } from "../helpers/lesson.js";

describe("compile — 四種非 concept 類型的 Lesson 形狀（US2、data-model.md §2 型別不變式）", () => {
  const deps = makeCompilerDeps({
    concepts: [
      { id: "alpha", title: "Alpha", leetcode: [1] },
      { id: "beta", title: "Beta", leetcode: [2] },
    ],
    problems: [makeProblem({ id: 1 }), makeProblem({ id: 2 })],
    schedules: {
      foundation: [
        { sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] },
        { sessionIndex: 2, type: "concept", conceptId: "beta", problemIds: [2] },
        { sessionIndex: 3, type: "practice", problemIds: [1, 2] },
        { sessionIndex: 4, type: "challenge", problemIds: [1] },
        { sessionIndex: 5, type: "review", reviewRange: [1, 4] },
        { sessionIndex: 6, type: "rest" },
        { sessionIndex: 7, type: "practice" },
      ],
    },
    articles: {
      "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha", challenge: [{ id: 1, why: "why 1" }] }),
      "articles/test-topic/002-beta.md": makeArticleMarkdown({ id: "beta", challenge: [{ id: 2, why: "why 2" }] }),
    },
  });

  it("practice：無 concept / path 欄位", () => {
    const lesson = compile("foundation", 3, deps);
    expect(lesson.type).toBe("practice");
    expect("concept" in lesson).toBe(false);
    expect("path" in lesson).toBe(false);
  });

  it("practice：problemIds 缺席時 problems 為空陣列，仍是合法 Lesson", () => {
    const lesson = compile("foundation", 7, deps);
    expect(lesson.problems).toEqual([]);
  });

  it("challenge：無 concept / path 欄位", () => {
    const lesson = compile("foundation", 4, deps);
    expect(lesson.type).toBe("challenge");
    expect("concept" in lesson).toBe(false);
    expect("path" in lesson).toBe(false);
  });

  it("review：reviewConcepts 非空，無 concept / path 欄位", () => {
    const lesson = compile("foundation", 5, deps);
    expect(lesson.type).toBe("review");
    expect(asReview(lesson).reviewConcepts.length).toBeGreaterThan(0);
    expect("concept" in lesson).toBe(false);
    expect("path" in lesson).toBe(false);
  });

  // F8（rest 槽移除，FR-014c）：三份正式課表已無 rest Session，validate.ts 的全課表編譯不再涵蓋
  // compileRest 這條路徑；本檔為其唯一覆蓋來源，MUST NOT 移除。
  it("rest：problems 恆為空陣列，無 concept / path 欄位", () => {
    const lesson = compile("foundation", 6, deps);
    expect(lesson.type).toBe("rest");
    expect(lesson.problems).toEqual([]);
    expect("concept" in lesson).toBe(false);
    expect("path" in lesson).toBe(false);
  });

  it("color 於所有類型皆存在（非 concept 類為中性色）", () => {
    for (const sessionIndex of [3, 4, 5, 6]) {
      expect(typeof compile("foundation", sessionIndex, deps).color).toBe("number");
    }
  });
});
