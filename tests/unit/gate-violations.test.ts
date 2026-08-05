import { describe, expect, it } from "vitest";
import { runContentGate } from "../../src/compiler/gate.js";
import { makeArticleMarkdown, makeCompilerDeps } from "../helpers/compiler.js";

describe("runContentGate — 多筆不同成因一次全報（US3、FR-022、FR-024）", () => {
  const deps = makeCompilerDeps({
    concepts: [
      { id: "digest-heavy", title: "Digest Heavy" },
      { id: "broken-article", title: "Broken Article" },
      { id: "healthy", title: "Healthy" },
    ],
    schedules: {
      foundation: [
        { sessionIndex: 1, type: "concept", conceptId: "digest-heavy" },
        { sessionIndex: 2, type: "concept", conceptId: "broken-article" },
        { sessionIndex: 3, type: "concept", conceptId: "ghost-not-in-dag" },
      ],
      interviewReady: [],
      interviewMastery: [{ sessionIndex: 1, type: "concept", conceptId: "healthy" }],
    },
    articles: {
      "articles/test-topic/001-digest-heavy.md": makeArticleMarkdown({
        id: "digest-heavy",
        digest: "字".repeat(901),
      }),
      "articles/test-topic/002-broken-article.md": makeArticleMarkdown({ id: "broken-article" }).replace(
        "## Python Tip\n\npy tip\n",
        "",
      ),
      "articles/test-topic/003-healthy.md": makeArticleMarkdown({ id: "healthy" }),
    },
  });

  const result = runContentGate({ deps });

  it("一次回報全部違規，不於第一筆中止", () => {
    expect(result.violations).toHaveLength(4);
  });

  it("Digest 超預算 → foundation #1 的 budget-over", () => {
    const v = result.violations.find((x) => x.track === "foundation" && x.sessionIndex === 1);
    expect(v?.rule).toBe("budget-over");
    expect(v?.message).toContain("digest");
  });

  it("Article 缺區塊 → foundation #2 的 compile-error", () => {
    const v = result.violations.find((x) => x.track === "foundation" && x.sessionIndex === 2);
    expect(v?.rule).toBe("compile-error");
    expect(v?.message).toContain("Python Tip");
  });

  it("conceptId 斷鏈 → foundation #3 的 compile-error", () => {
    const v = result.violations.find((x) => x.track === "foundation" && x.sessionIndex === 3);
    expect(v?.rule).toBe("compile-error");
    expect(v?.message).toContain("ghost-not-in-dag");
  });

  it("空課表 → interviewReady 的 schedule-empty", () => {
    const v = result.violations.find((x) => x.track === "interviewReady");
    expect(v?.rule).toBe("schedule-empty");
    expect(v?.sessionIndex).toBeUndefined();
  });

  it("排序穩定：track（TRACK_ORDER 序）→ sessionIndex → rule", () => {
    const order = result.violations.map((v) => `${v.track}:${v.sessionIndex ?? "-"}`);
    expect(order).toEqual(["foundation:1", "foundation:2", "foundation:3", "interviewReady:-"]);
  });

  it("compiled 只計入成功 compile 的筆數（healthy 與 digest-heavy 皆成功 compile）", () => {
    expect(result.compiled).toBe(2);
  });

  it("total 不含空課表 Track（interviewReady 貢獻 0）", () => {
    expect(result.total).toBe(4);
  });
});
