import { describe, expect, it } from "vitest";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";
import { render } from "../../src/renderer/discord.js";
import { makeArticleMarkdown, makeCompilerDeps } from "../helpers/compiler.js";

describe("compile — determinism（SC-003）", () => {
  it("同一 (track, sessionIndex) 連續 compile 10 次，JSON.stringify 全等", () => {
    const deps = loadCompilerDeps();
    const first = JSON.stringify(compile("foundation", 4, deps));
    for (let i = 0; i < 10; i++) {
      expect(JSON.stringify(compile("foundation", 4, deps))).toBe(first);
    }
  });

  it("跨多種 Session 類型（concept/practice/challenge/review/rest）皆具確定性", () => {
    const deps = loadCompilerDeps();
    for (const sessionIndex of [1, 3, 5, 6, 7]) {
      const first = JSON.stringify(compile("foundation", sessionIndex, deps));
      const second = JSON.stringify(compile("foundation", sessionIndex, deps));
      expect(second).toBe(first);
    }
  });

  // F8（SC-004、US1 Acceptance 2）：review Session 重複編譯並 render 100 次，embeds 必須逐位元組一致
  // ——含同一則 Reflection、同一則鼓勵語、同一題 Challenge（若素材檔已凍結存在，兩則欄位皆非空；
  // 素材檔缺席時欄位省略，determinism 依然成立，兩種情境本測試皆涵蓋）。
  it("review Session 重複編譯並 render 100 次，embeds byte-identical（含 Reflection／鼓勵語／Challenge）", () => {
    const deps = loadCompilerDeps();
    const reviewSession = deps.schedules.foundation.sessions.find((s) => s.type === "review");
    if (!reviewSession) throw new Error("fixture 失效：foundation 課表找不到任何 review Session");

    const first = JSON.stringify(render(compile("foundation", reviewSession.sessionIndex, deps)));
    for (let i = 0; i < 100; i++) {
      const again = JSON.stringify(render(compile("foundation", reviewSession.sessionIndex, deps)));
      expect(again).toBe(first);
    }
  });

  // F11（不變式 I3、SC-002）：既有 fixture 不含 quizBank，小測路徑不會被觸達——此為唯一含
  // quizBank 的 determinism 自動化落點（quiz-selection.md §2 I3）。
  it("含 quizBank 的 review Session 重複 compile + render 兩次，byte-identical（SC-002）", () => {
    const concepts = [
      { id: "alpha", title: "Alpha", localOrder: 1, topic: "test-topic" },
      { id: "beta", title: "Beta", localOrder: 2, topic: "test-topic" },
    ];
    const articles = {
      "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }),
      "articles/test-topic/002-beta.md": makeArticleMarkdown({ id: "beta" }),
    };
    const quizItem = {
      stem: "stem",
      options: ["a", "b", "c", "d"] as [string, string, string, string],
      answerIndex: 0 as const,
      explanation: ["結論", "正解", "選2", "選3", "選4"] as [string, string, string, string, string],
    };
    const deps = makeCompilerDeps({
      concepts,
      schedules: {
        foundation: [
          { sessionIndex: 1, type: "concept", conceptId: "alpha" },
          { sessionIndex: 2, type: "concept", conceptId: "beta" },
          { sessionIndex: 3, type: "review", reviewRange: [1, 2] },
        ],
      },
      articles,
      quizBank: { version: 1, byConcept: { alpha: [quizItem, quizItem, quizItem], beta: [quizItem, quizItem, quizItem] } },
      pagesBaseUrl: "https://example.github.io/leetcode-daily-coach",
    });

    const first = JSON.stringify(render(compile("foundation", 3, deps)));
    const second = JSON.stringify(render(compile("foundation", 3, deps)));
    expect(second).toBe(first);
  });
});
