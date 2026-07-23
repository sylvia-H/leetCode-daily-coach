import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";
import { makeArticleMarkdown, makeCompilerDeps } from "../helpers/compiler.js";
import { asConcept } from "../helpers/lesson.js";

describe("compile — path 推導（US1、research R4）", () => {
  it("多前置 / 多後繼時取 ordinalOf 最接近者：prev 取最大者、next 取最小者", () => {
    const deps = makeCompilerDeps({
      concepts: [
        { id: "a", title: "A", localOrder: 1 },
        { id: "b", title: "B", localOrder: 2 },
        { id: "c", title: "C", localOrder: 3 },
        { id: "target", title: "Target", localOrder: 4, prerequisite: ["a", "b", "c"], next: ["d", "e"] },
        { id: "d", title: "D", localOrder: 5 },
        { id: "e", title: "E", localOrder: 6 },
      ],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "target" }] },
      articles: {
        "articles/test-topic/004-target.md": makeArticleMarkdown({ id: "target", title: "Target" }),
      },
    });

    const lesson = asConcept(compile("foundation", 1, deps));
    expect(lesson.path.current).toBe("Target");
    expect(lesson.path.prev).toBe("C");
    expect(lesson.path.next).toBe("D");
  });

  it("無 prerequisite 時省略 prev；無 next 時省略 next", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "solo", title: "Solo" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "solo" }] },
      articles: { "articles/test-topic/001-solo.md": makeArticleMarkdown({ id: "solo", title: "Solo" }) },
    });

    const lesson = asConcept(compile("foundation", 1, deps));
    expect(lesson.path.prev).toBeUndefined();
    expect(lesson.path.next).toBeUndefined();
    expect(lesson.path.current).toBe("Solo");
  });
});
