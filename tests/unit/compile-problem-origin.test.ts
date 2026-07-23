import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";
import { makeArticleMarkdown, makeCompilerDeps, makeProblem } from "../helpers/compiler.js";

describe("compile — practice/challenge 題目說明的 ProblemOrigin 反查（US2、research R3）", () => {
  const deps = makeCompilerDeps({
    concepts: [
      { id: "alpha", title: "Alpha", localOrder: 1, leetcode: [1, 2] },
      { id: "beta", title: "Beta", localOrder: 2, leetcode: [2, 3] },
    ],
    problems: [makeProblem({ id: 1 }), makeProblem({ id: 2 }), makeProblem({ id: 3 }), makeProblem({ id: 4 })],
    schedules: {
      foundation: [
        { sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] },
        { sessionIndex: 2, type: "concept", conceptId: "beta", problemIds: [2, 3] },
        { sessionIndex: 3, type: "practice", problemIds: [1, 2, 3, 4] },
      ],
    },
    articles: {
      // alpha 的 Today's Challenge 只涵蓋題號 1（未涵蓋 2），用於驗證「反查到 conceptId 但條目缺漏」的省略分支
      "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha", challenge: [{ id: 1, why: "alpha 的說明" }] }),
      // beta 的 Today's Challenge 同時涵蓋 2 與 3；題號 2 若被誤用 beta 的說明即代表「較早引入者」規則失效
      "articles/test-topic/002-beta.md": makeArticleMarkdown({
        id: "beta",
        challenge: [
          { id: 2, why: "beta 的說明（不應被使用，因為 2 由較早的 alpha 引入）" },
          { id: 3, why: "beta 的說明" },
        ],
      }),
    },
  });

  it("題號 1：反查到 alpha，Article 有條目 → 填入 whyThisPattern", () => {
    const lesson = compile("foundation", 3, deps);
    const p1 = lesson.problems.find((p) => p.id === 1);
    expect(p1?.whyThisPattern).toBe("alpha 的說明");
  });

  it("題號 3：反查到 beta（未被更早的 Concept 引入），Article 有條目 → 填入 whyThisPattern", () => {
    const lesson = compile("foundation", 3, deps);
    const p3 = lesson.problems.find((p) => p.id === 3);
    expect(p3?.whyThisPattern).toBe("beta 的說明");
  });

  it("題號 2：同時被 alpha（較早）與 beta 引入 → 取較早者 alpha；alpha 的 Article 無此題號條目 → 省略 whyThisPattern，不使用 beta 的說明", () => {
    const lesson = compile("foundation", 3, deps);
    const p2 = lesson.problems.find((p) => p.id === 2);
    expect(p2?.whyThisPattern).toBeUndefined();
    expect(p2?.hint).toBeUndefined();
  });

  it("題號 4：ProblemOrigin 無此題號（未被任何已排入的 Concept 引入）→ 省略 whyThisPattern，不失敗", () => {
    const lesson = compile("foundation", 3, deps);
    const p4 = lesson.problems.find((p) => p.id === 4);
    expect(p4).toBeDefined();
    expect(p4?.whyThisPattern).toBeUndefined();
  });

  it("查無來源的題目仍保留 id / title / url / difficulty 等 Problem Bank metadata", () => {
    const lesson = compile("foundation", 3, deps);
    const p4 = lesson.problems.find((p) => p.id === 4);
    expect(p4?.title).toBe("Problem 4");
    expect(p4?.difficulty).toBe("Easy");
  });
});
