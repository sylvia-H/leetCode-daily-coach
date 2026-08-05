// research R2／R12、site-build-contract.md §4：全文閱讀頁固定區塊順序、8 段各自獨立內容
// （非 conceptBody 合併字串）、Today's Challenge 結構化重建、HTML escape。
import { describe, expect, it } from "vitest";
import { parseArticle } from "../../src/compiler/content.js";
import { buildArticlePageView, renderArticlePage } from "../../src/pages/article-page.js";
import { makeBank, makeProblem } from "../../tests/helpers/compiler.js";

const ARTICLE_PATH = "articles/test-topic/001-test-concept.md";

function makeRawArticle(overrides: { challenge?: string } = {}): string {
  const challenge =
    overrides.challenge ??
    `- **1** · why 1
  - Hint: hint 1
- **2** · why 2`;

  return `---
id: test-concept
title: Test Concept 標題
module: test-module
topic: test-topic
pattern_label: Pattern X
complexity_label: O(n)
estimated_minutes: 15
exit_criteria:
  - 條件一
---

## Concept

Concept 內容 A。

## Thinking

Thinking 內容 B。

## Pattern Recognition

Pattern 內容 C。

## Common Mistakes

Mistakes 內容 D。

## Complexity

Complexity 內容 E。

## Digest

Digest 內容。

## TypeScript Tip

ts tip。

## Python Tip

py tip。

## TypeScript Corner

TS Corner 內容 F。

## Python Corner

Python Corner 內容 G。

## Takeaway

一句話帶走。

## Tomorrow Preview

Tomorrow 內容 H。

## Today's Challenge

${challenge}
`;
}

function makeTestBank() {
  return makeBank([
    makeProblem({ id: 1, title: "Problem One", difficulty: "Easy" }),
    makeProblem({ id: 2, title: "Problem Two", difficulty: "Medium" }),
  ]);
}

describe("buildArticlePageView（research R2／R12）", () => {
  it("8 段固定區塊依序輸出，各自為獨立內容（非 conceptBody 合併字串）", () => {
    const article = parseArticle(makeRawArticle(), "test-concept", ARTICLE_PATH);
    const view = buildArticlePageView(article, makeTestBank());
    expect(view.sections.map((s) => s.name)).toEqual([
      "Concept",
      "Thinking",
      "Pattern Recognition",
      "Common Mistakes",
      "Complexity",
      "TypeScript Corner",
      "Python Corner",
      "Tomorrow Preview",
    ]);
    expect(view.sections[0]?.html).toContain("Concept 內容 A");
    expect(view.sections[1]?.html).toContain("Thinking 內容 B");
    expect(view.sections[4]?.html).toContain("Complexity 內容 E");
    expect(view.sections[7]?.html).toContain("Tomorrow 內容 H");
    // MUST NOT 出現合併字串（conceptBody 會把四段接在一起，不會各自獨立成 8 筆）
    expect(view.sections).toHaveLength(8);
  });

  it("Today's Challenge 為結構化題目清單，依題號升冪排序、含 title/url/difficulty", () => {
    const article = parseArticle(makeRawArticle(), "test-concept", ARTICLE_PATH);
    const view = buildArticlePageView(article, makeTestBank());
    expect(view.problems).toEqual([
      {
        id: 1,
        title: "Problem One",
        url: "https://leetcode.com/problems/problem-1/",
        difficulty: "Easy",
        whyThisPattern: "why 1",
        hint: "hint 1",
      },
      {
        id: 2,
        title: "Problem Two",
        url: "https://leetcode.com/problems/problem-2/",
        difficulty: "Medium",
        whyThisPattern: "why 2",
      },
    ]);
  });

  it("題號在 markdown 中非升冪出現時，problems 仍依題號升冪排序輸出", () => {
    const article = parseArticle(
      makeRawArticle({ challenge: "- **2** · why 2\n- **1** · why 1" }),
      "test-concept",
      ARTICLE_PATH,
    );
    const view = buildArticlePageView(article, makeTestBank());
    expect(view.problems.map((p) => p.id)).toEqual([1, 2]);
  });

  it("查無對應題號時 throw，不得靜默省略該題", () => {
    const article = parseArticle(
      makeRawArticle({ challenge: "- **999** · why 999" }),
      "test-concept",
      ARTICLE_PATH,
    );
    expect(() => buildArticlePageView(article, makeTestBank())).toThrow(/999/);
  });

  it("meta 欄位（title／patternLabel／complexityLabel／estimatedMinutes／takeaway）正確帶入", () => {
    const article = parseArticle(makeRawArticle(), "test-concept", ARTICLE_PATH);
    const view = buildArticlePageView(article, makeTestBank());
    expect(view.conceptId).toBe("test-concept");
    expect(view.title).toBe("Test Concept 標題");
    expect(view.patternLabel).toBe("Pattern X");
    expect(view.complexityLabel).toBe("O(n)");
    expect(view.estimatedMinutes).toBe(15);
    expect(view.takeaway).toBe("一句話帶走。");
  });

  it("純函式：同輸入呼叫兩次得到 deep-equal 結果", () => {
    const article = parseArticle(makeRawArticle(), "test-concept", ARTICLE_PATH);
    const bank = makeTestBank();
    const first = buildArticlePageView(article, bank);
    const second = buildArticlePageView(article, bank);
    expect(first).toEqual(second);
  });
});

describe("renderArticlePage", () => {
  it("含 8 段固定區塊與結構化 Today's Challenge 連結，不含 Digest／TypeScript Tip／Python Tip", () => {
    const article = parseArticle(makeRawArticle(), "test-concept", ARTICLE_PATH);
    const view = buildArticlePageView(article, makeTestBank());
    const html = renderArticlePage(view);

    expect(html).toContain("Concept 內容 A");
    expect(html).toContain("Tomorrow 內容 H");
    expect(html).toContain('href="https://leetcode.com/problems/problem-1/"');
    expect(html).toContain("Easy");
    expect(html).not.toContain("Digest 內容");
    expect(html).not.toContain("ts tip");
    expect(html).not.toContain("py tip");
  });

  it("動態文字（title／patternLabel／problem title／whyThisPattern／takeaway）皆經 HTML escape", () => {
    const article = parseArticle(
      makeRawArticle().replace("Test Concept 標題", "<b>XSS</b>"),
      "test-concept",
      ARTICLE_PATH,
    );
    const view = buildArticlePageView(article, makeTestBank());
    const html = renderArticlePage(view);
    expect(html).not.toContain("<b>XSS</b>");
    expect(html).toContain("&lt;b&gt;XSS&lt;/b&gt;");
  });

  it("為合法的 HTML5 文件（含 <!doctype html>）", () => {
    const article = parseArticle(makeRawArticle(), "test-concept", ARTICLE_PATH);
    const view = buildArticlePageView(article, makeTestBank());
    const html = renderArticlePage(view);
    expect(html.trim().toLowerCase().startsWith("<!doctype html>")).toBe(true);
  });

  it("純函式：同輸入呼叫兩次得到逐字元相同的輸出", () => {
    const article = parseArticle(makeRawArticle(), "test-concept", ARTICLE_PATH);
    const view = buildArticlePageView(article, makeTestBank());
    expect(renderArticlePage(view)).toBe(renderArticlePage(view));
  });
});
