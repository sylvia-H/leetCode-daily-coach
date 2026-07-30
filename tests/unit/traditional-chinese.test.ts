import { describe, expect, it } from "vitest";
import { checkTraditionalChinese } from "../../src/compiler/traditional-chinese.js";

describe("checkTraditionalChinese（R7 / FR-008，繁中機器判準）", () => {
  it("含簡體字 → simplified-char 違規", () => {
    const result = checkTraditionalChinese("这是国家推薦的解題思路，請仔細閱讀本段落內容並理解其中的觀念與意涵。");
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.rule === "simplified-char")).toBe(true);
  });

  it("整段英文（CJK 佔比為 0）→ cjk-ratio-low 違規", () => {
    const result = checkTraditionalChinese(
      "This is a fully English paragraph with no Chinese characters at all describing the sliding window pattern in detail.",
    );
    expect(result.ok).toBe(false);
    expect(result.violations.some((v) => v.rule === "cjk-ratio-low")).toBe(true);
    expect(result.cjkRatio).toBe(0);
  });

  it("正常繁中夾英文技術術語 → 通過（術語計入分母但門檻寬鬆）", () => {
    const result = checkTraditionalChinese(
      "使用 Sliding Window 技巧可以把暴力解法的時間複雜度從 O(n^2) 降到 O(n)，關鍵在於維護一個會隨著走訪動態伸縮的視窗範圍，並且正確地更新視窗邊界與累積狀態。",
    );
    expect(result.ok).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("程式碼區塊（fenced/行內）不計入判準：區塊內簡體字或英文皆被忽略", () => {
    const markdown = [
      "說明段落：以下範例示範走訪陣列的寫法，請仔細閱讀程式碼中的每一個步驟與註解說明。",
      "",
      "```typescript",
      "// 这是简体注释，不应影响判准 this is english inside fenced code",
      "function example() { return 1; }",
      "```",
      "",
      "行內程式碼 `这是简体` 也不應影響判準結果。",
    ].join("\n");
    const result = checkTraditionalChinese(markdown);
    expect(result.ok).toBe(true);
  });

  it("frontmatter 不計入判準", () => {
    const markdown = [
      "---",
      "id: 这是简体但在frontmatter",
      "title: Example",
      "---",
      "",
      "這是一段完全正常、內容充分的繁體中文散文，理應通過繁中機器判準的全部檢查項目。",
    ].join("\n");
    const result = checkTraditionalChinese(markdown);
    expect(result.ok).toBe(true);
  });

  it("門檻可調：提高門檻可讓原本通過的段落轉為違規", () => {
    const markdown = "使用 Sliding Window 與 Two Pointer 搭配 Hash Map 可以有效降低時間複雜度。";
    const lenient = checkTraditionalChinese(markdown, 0.3);
    const strict = checkTraditionalChinese(markdown, 0.95);
    expect(lenient.ok).toBe(true);
    expect(strict.violations.some((v) => v.rule === "cjk-ratio-low")).toBe(true);
  });
});

describe("slang-term（教材 MUST NOT 使用網路俚語）", () => {
  // 實測：Stage 2 首篇文章用了 6 次「寫扣」（code 的音譯俚語）。既有判準只驗簡繁與 CJK 佔比，
  // 對「是繁體、但用語不適合教材」完全無感，故補上這道最小且精準的檢查。
  it("偵測到「寫扣」→ slang-term 違規並給出替代建議", () => {
    const result = checkTraditionalChinese("這不僅是寫扣前的重要心智模型。");
    expect(result.ok).toBe(false);
    const v = result.violations.find((x) => x.rule === "slang-term");
    expect(v?.char).toBe("寫扣");
    expect(v?.message).toContain("程式碼");
  });

  it("同一篇多處出現 → 逐一列出（/g regex 的 lastIndex MUST 重置，否則會漏報後續位置）", () => {
    const result = checkTraditionalChinese("一開始就想寫扣。停止直接寫扣的衝動。敲扣之前先想清楚。");
    expect(result.violations.filter((v) => v.rule === "slang-term")).toHaveLength(3);
  });

  it("MUST NOT 誤殺正常用語：折扣／扣除／扣分 皆不觸發", () => {
    const result = checkTraditionalChinese("這裡談的是折扣、扣除與扣分，都是正常用語。");
    expect(result.violations.filter((v) => v.rule === "slang-term")).toEqual([]);
  });

  it("俚語出現在 fenced code block 內 → 不觸發（stripNonProse 已剝除程式碼）", () => {
    const result = checkTraditionalChinese("正常敘述。\n\n```ts\n// 寫扣\n```\n");
    expect(result.violations.filter((v) => v.rule === "slang-term")).toEqual([]);
  });
});
