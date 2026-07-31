import { describe, expect, it } from "vitest";
import { parseArticle } from "../../src/compiler/content.js";
import { makeArticleMarkdown } from "../helpers/compiler.js";

const PATH = "articles/test-topic/001-fixture.md";

describe("parseArticle — 固定區塊缺漏", () => {
  it("缺少 Digest 拋出指名區塊名稱與 articlePath 的錯誤", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace("## Digest\n\nDigest 內容\n", "");
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/Digest/);
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(new RegExp(PATH.replace(/\//g, "\\/")));
  });

  it("缺少 Python Tip 拋出指名區塊名稱的錯誤", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace("## Python Tip\n\npy tip\n", "");
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/Python Tip/);
  });

  it("缺少 Today's Challenge 拋出指名區塊名稱的錯誤", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace(/## Today's Challenge[\s\S]*$/, "");
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/Today's Challenge/);
  });

  it("閱讀用固定區塊（如 Concept）缺漏亦拋錯（§10 全部固定區塊皆必備）", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace("## Concept\n\n測試用內容。\n", "");
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/Concept/);
  });
});

describe("parseArticle — frontmatter 欄位缺漏", () => {
  it("frontmatter 缺少必要欄位（module）拋出指名欄位的錯誤", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace(/module: test-module\n/, "");
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/module/);
  });

  it("exit_criteria 非陣列（純量字串）拋出指名該欄位的錯誤", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace(
      /exit_criteria:\n  - 條件一\n  - 條件二\n/,
      "exit_criteria: 條件一\n",
    );
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/exit_criteria/);
  });
});

describe("parseArticle — id 與 conceptId 不符", () => {
  it("frontmatter id 與請求的 conceptId 不符時拋錯", () => {
    const raw = makeArticleMarkdown({ id: "fixture" });
    expect(() => parseArticle(raw, "other-concept", PATH)).toThrow(/id/);
  });
});

describe("parseArticle — Today's Challenge 條目格式", () => {
  it("條目缺 whyThisPattern（僅有題號、無說明文字）拋出 article-challenge-format", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace(
      "- **1** · 佔位條目（本篇未涵蓋任何課表題號）",
      "- **1**",
    );
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/article-challenge-format/);
  });

  it("同一題號重複出現拋出 article-challenge-duplicate", () => {
    const raw = makeArticleMarkdown({
      id: "fixture",
      challenge: [
        { id: 1, why: "第一次出現" },
        { id: 1, why: "第二次出現，應視為重複" },
      ],
    });
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/article-challenge-duplicate/);
  });

  it("正確解析時 challenge 為以 problemId 為鍵的 Map，hint 選配", () => {
    const raw = makeArticleMarkdown({
      id: "fixture",
      challenge: [
        { id: 1, why: "說明一", hint: "提示一" },
        { id: 2, why: "說明二" },
      ],
    });
    const article = parseArticle(raw, "fixture", PATH);
    expect(article.challenge.get(1)).toEqual({ problemId: 1, whyThisPattern: "說明一", hint: "提示一" });
    expect(article.challenge.get(2)).toEqual({ problemId: 2, whyThisPattern: "說明二" });
  });
});

describe("parseArticle — 無題目觀念課的 Today's Challenge（spec §12.1 一等合法狀態）", () => {
  it("區塊有說明散文但無 list 條目 → challenge 為空 Map，MUST NOT 視為格式錯誤", () => {
    // 27 個「無題目觀念課」（leetcode: []）本來就沒有題目可列。舊版為了滿足「至少一個條目」
    // 的硬性要求，寫死 `- **1** · 佔位條目`——「1」會被讀成題號 1（Two Sum），對讀者是誤導。
    const raw = makeArticleMarkdown({ id: "fixture" }).replace(
      /## Today's Challenge\n\n[\s\S]*$/,
      "## Today's Challenge\n\n本篇為觀念課，沒有對應的 LeetCode 練習題。\n",
    );
    const article = parseArticle(raw, "fixture", PATH);
    expect(article.challenge.size).toBe(0);
  });

  it("區塊完全空白 → 仍為錯誤（requireSection 擋下，區塊不得為空）", () => {
    const raw = makeArticleMarkdown({ id: "fixture" }).replace(
      /## Today's Challenge\n\n[\s\S]*$/,
      "## Today's Challenge\n\n",
    );
    expect(() => parseArticle(raw, "fixture", PATH)).toThrow(/Today's Challenge/);
  });
});
