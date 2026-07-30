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
