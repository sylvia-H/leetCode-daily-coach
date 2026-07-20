import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadArticle, moduleColor } from "../../src/compiler/content.js";

const FIXTURES = join(process.cwd(), "tests", "fixtures");

describe("loadArticle", () => {
  it("正確解析四個必要正文區塊與 frontmatter metadata（含 Exit Criteria）", () => {
    const article = loadArticle(join(FIXTURES, "article-valid.md"), "fixture-concept");

    expect(article.meta.id).toBe("fixture-concept");
    expect(article.meta.title).toBe("Fixture Concept");
    expect(article.meta.module).toBe("fixture-module");
    expect(article.meta.patternLabel).toBe("Fixture Pattern");
    expect(article.meta.complexityLabel).toBe("O(1)");
    expect(article.meta.estimatedMinutes).toBe(5);
    expect(article.meta.exitCriteria).toEqual(["條件一", "條件二"]);

    expect(article.digest).toContain("Digest 內容");
    expect(article.takeaway).toContain("一句話帶走");
  });

  it("程式碼區塊內含 '## ' 字樣時不得誤判區塊邊界（research R1）", () => {
    const article = loadArticle(join(FIXTURES, "article-valid.md"), "fixture-concept");

    expect(article.tsTip).toContain("function foo(): number");
    expect(article.tsTip).toContain("這段文字在程式碼區塊之後，仍屬於 TypeScript Tip 區塊");
    expect(article.pyTip).toContain("def foo():");
    // 註解裡的 "## " 不應被誤判為新區塊標題，因此 tsTip/pyTip 不應互相污染
    expect(article.tsTip).not.toContain("def foo()");
  });

  it("缺任一必要區塊時拋出指名該區塊的錯誤（FR-004b）", () => {
    expect(() => loadArticle(join(FIXTURES, "article-missing-digest.md"), "fixture-concept")).toThrow(
      /Digest/,
    );
  });

  it("出現未知區塊時忽略且不失敗（FR-004c）", () => {
    const article = loadArticle(join(FIXTURES, "article-unknown-section.md"), "fixture-concept");
    expect(article.digest).toContain("Digest 內容");
  });

  it("frontmatter 的 id 與請求的 conceptId 不符時拋錯", () => {
    expect(() => loadArticle(join(FIXTURES, "article-valid.md"), "other-concept")).toThrow(/id/);
  });
});

describe("moduleColor", () => {
  it("同一 module 連續查詢恆得同一色（確定性）", () => {
    const a = moduleColor("two-pointer");
    const b = moduleColor("two-pointer");
    expect(a).toBe(b);
    expect(typeof a).toBe("number");
  });

  it("未知 module 回傳明確定義的預設色，且不拋錯（FR-007c）", () => {
    expect(() => moduleColor("never-heard-of-this-module")).not.toThrow();
    expect(typeof moduleColor("never-heard-of-this-module")).toBe("number");
  });
});
