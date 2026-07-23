import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";
import { makeArticleMarkdown, makeCompilerDeps, makeProblem } from "../helpers/compiler.js";

describe("compile — 錯誤契約（US1、contracts/lesson-contract.md §4）", () => {
  const baseDeps = makeCompilerDeps({
    concepts: [{ id: "alpha", title: "Alpha", leetcode: [1] }],
    problems: [makeProblem({ id: 1 })],
    schedules: {
      foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] }],
    },
    articles: {
      "articles/test-topic/001-alpha.md": makeArticleMarkdown({
        id: "alpha",
        challenge: [{ id: 1, why: "why alpha" }],
      }),
    },
  });

  it("sessionIndex 為 0 時拋錯，訊息含 track 與 sessionIndex", () => {
    expect(() => compile("foundation", 0, baseDeps)).toThrow(/foundation/);
    expect(() => compile("foundation", 0, baseDeps)).toThrow(/sessionIndex=0/);
  });

  it("sessionIndex 為負數時拋錯", () => {
    expect(() => compile("foundation", -1, baseDeps)).toThrow();
  });

  it("sessionIndex 為非整數時拋錯", () => {
    expect(() => compile("foundation", 1.5, baseDeps)).toThrow();
  });

  it("sessionIndex 超出課表長度時拋錯，訊息含課表長度", () => {
    expect(() => compile("foundation", 99, baseDeps)).toThrow(/課表長度=1/);
  });

  it("conceptId 不在 DAG 中時拋錯，訊息含 track / sessionIndex / conceptId", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "not-in-dag" }] },
      articles: {},
    });
    expect(() => compile("foundation", 1, deps)).toThrow(/not-in-dag/);
  });

  it("Article 檔案不存在（readArticle 拋錯）時 compile 亦拋錯", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
      articles: {}, // 未提供 alpha 的內容 → readArticle 內建 fail loud
    });
    expect(() => compile("foundation", 1, deps)).toThrow(/找不到路徑對應的 article 內容/);
  });

  it("課表題號在 Article 條目中缺漏時拋錯，訊息含題號（FR-006 單向包含）", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha", leetcode: [1, 2] }],
      problems: [makeProblem({ id: 1 }), makeProblem({ id: 2 })],
      schedules: {
        foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1, 2] }],
      },
      articles: {
        "articles/test-topic/001-alpha.md": makeArticleMarkdown({
          id: "alpha",
          challenge: [{ id: 1, why: "只涵蓋題號 1" }],
        }),
      },
    });
    expect(() => compile("foundation", 1, deps)).toThrow(/題號=2/);
  });

  it("條目多於課表題號時不視為錯誤（單向包含允許條目較多）", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha", leetcode: [1] }],
      problems: [makeProblem({ id: 1 }), makeProblem({ id: 2 })],
      schedules: {
        foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] }],
      },
      articles: {
        "articles/test-topic/001-alpha.md": makeArticleMarkdown({
          id: "alpha",
          challenge: [
            { id: 1, why: "課表用到的題號" },
            { id: 2, why: "課表沒用到，但條目仍存在" },
          ],
        }),
      },
    });
    expect(() => compile("foundation", 1, deps)).not.toThrow();
  });

  it("review Session 缺少 reviewRange 時拋錯", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "review" }] },
      articles: {},
    });
    expect(() => compile("foundation", 1, deps)).toThrow(/reviewRange/);
  });

  it("review Session 的 reviewRange 內無任何 concept Session 時拋錯", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: {
        foundation: [
          { sessionIndex: 1, type: "rest" },
          { sessionIndex: 2, type: "review", reviewRange: [1, 1] },
        ],
      },
      articles: {},
    });
    expect(() => compile("foundation", 2, deps)).toThrow(/reviewRange/);
  });
});
