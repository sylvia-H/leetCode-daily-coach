import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";
import { makeArticleMarkdown, makeCompilerDeps, makeProblem } from "../helpers/compiler.js";

describe("compile — Overlay 套用（US5、research R6、FR-009）", () => {
  it("extraNotesMarkdown 進 overlayNotes 且 Digest 不變（疊加不取代）", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
      overlays: { foundation: { alpha: { extraNotesMarkdown: "Track 專屬補充說明" } } },
      articles: { "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha", digest: "原本的 Digest" }) },
    });

    const lesson = compile("foundation", 1, deps);
    expect(lesson.overlayNotes).toBe("Track 專屬補充說明");
    expect(lesson.concept?.digest).toBe("原本的 Digest");
  });

  it("Overlay 未涵蓋任何欄位時 overlayNotes 省略（不為空字串）", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
      articles: { "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }) },
    });

    const lesson = compile("foundation", 1, deps);
    expect(lesson.overlayNotes).toBeUndefined();
  });

  it("Overlay 指向該 Track 未涵蓋的 Concept 時，loadCompilerDeps 的第二道防線 fail loud", () => {
    expect(() =>
      makeCompilerDepsWithUncoveredOverlay(),
    ).toThrow(/未涵蓋/);
  });

  it("extraProblemIds 不被消費：合成 Overlay 宣告課表未排入的題號，Lesson.problems 仍完全等於課表 problemIds", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha", leetcode: [1] }],
      problems: [makeProblem({ id: 1 }), makeProblem({ id: 999 })],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] }] },
      overlays: { foundation: { alpha: { extraProblemIds: [999] } } },
      articles: {
        "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha", challenge: [{ id: 1, why: "w" }] }),
      },
    });

    const lesson = compile("foundation", 1, deps);
    expect(lesson.problems.map((p) => p.id)).toEqual([1]);
  });

  it("challengeDifficulty（per-Concept）不被消費：即使宣告亦不影響 Lesson 任何欄位", () => {
    const withOverride = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
      overlays: { foundation: { alpha: { challengeDifficulty: "Hard" } } },
      articles: { "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }) },
    });
    const withoutOverride = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
      articles: { "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }) },
    });

    expect(compile("foundation", 1, withOverride)).toEqual(compile("foundation", 1, withoutOverride));
  });
});

function makeCompilerDepsWithUncoveredOverlay() {
  return makeCompilerDeps({
    concepts: [{ id: "alpha", title: "Alpha" }],
    schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "alpha" }] },
    overlays: { foundation: { "not-scheduled-concept": { extraNotesMarkdown: "不該生效" } } },
    articles: { "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }) },
  });
}
