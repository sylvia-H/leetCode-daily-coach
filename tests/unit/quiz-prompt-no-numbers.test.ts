// CHK012（checklists/prompt-design.md）：靜態掃描 quiz-aspects.ts 與 quiz-items.ts 匯出的 prompt
// 模板字串，斷言其中不含代表題數或面向數的數字樣式，將 FR-016「MUST NOT 出現任何題數或面向數字」
// 從人工審閱 prompt 原始碼升級為可自動測試的判準。
//
// 測試策略：以不含任何數字的樣本輸入呼叫兩個 build*Prompt()，任何在輸出中出現的數字必然來自模板
// 本身（非注入內容）。掃描規則刻意排除結構性數字（如「4 個選項」「5 段」「≤80 字」「0-based」
// 「string[4]」型別標註）——這些是題目本身的恰定形狀，不是「出幾題」或「幾個面向」的數量指示。
import { describe, expect, it } from "vitest";
import { buildQuizAspectsPrompt } from "../../scripts/lib/prompts/quiz-aspects.js";
import { buildQuizItemsPrompt } from "../../scripts/lib/prompts/quiz-items.js";

// 「N 題」「第 N 題」「N 個面向」「第 N 個面向」樣式（数字緊鄰「題」或「面向/aspect」）。
const QUESTION_COUNT_PATTERN = /\d+\s*(题|題)/;
const ASPECT_COUNT_PATTERN = /(第\s*)?\d+\s*(个|個)?\s*(面向|aspect)/i;

describe("prompt 模板 MUST NOT 出現代表題數或面向數的數字樣式（CHK012、FR-016）", () => {
  it("quiz-aspects.ts 的 buildQuizAspectsPrompt 模板不含題數／面向數字", () => {
    const prompt = buildQuizAspectsPrompt({
      concept: {
        id: "concept-id",
        title: "概念標題",
        learningGoal: ["學習目標一", "學習目標二"],
        exitCriteria: ["驗收條件一"],
      },
      authorHints: {
        核心觀念: "核心觀念說明",
        Pattern辨識線索: "辨識線索說明",
        Thinking: "思考過程說明",
        CommonMistakes: "常見錯誤說明",
      },
      neighbors: {
        prerequisite: [{ id: "prereq-id", title: "前置概念", learningGoal: ["前置目標"] }],
        next: [{ id: "next-id", title: "後續概念", learningGoal: ["後續目標"] }],
      },
    });
    expect(prompt).not.toMatch(QUESTION_COUNT_PATTERN);
    expect(prompt).not.toMatch(ASPECT_COUNT_PATTERN);
  });

  it("quiz-items.ts 的 buildQuizItemsPrompt 模板不含題數／面向數字", () => {
    const prompt = buildQuizItemsPrompt({
      conceptId: "concept-id",
      conceptTitle: "概念標題",
      aspects: ["面向甲說明", "面向乙說明", "面向丙說明"],
    });
    expect(prompt).not.toMatch(QUESTION_COUNT_PATTERN);
    expect(prompt).not.toMatch(ASPECT_COUNT_PATTERN);
  });

  it("retryFeedback 為 undefined 時（首次嘗試）模板同樣不含題數／面向數字", () => {
    const aspectsPrompt = buildQuizAspectsPrompt({
      concept: { id: "c", title: "T", learningGoal: ["g"], exitCriteria: ["e"] },
      authorHints: { 核心觀念: "a", Pattern辨識線索: "b", Thinking: "c", CommonMistakes: "d" },
      neighbors: { prerequisite: [], next: [] },
    });
    const itemsPrompt = buildQuizItemsPrompt({ conceptId: "c", conceptTitle: "T", aspects: ["面向"] });
    expect(aspectsPrompt).not.toMatch(QUESTION_COUNT_PATTERN);
    expect(aspectsPrompt).not.toMatch(ASPECT_COUNT_PATTERN);
    expect(itemsPrompt).not.toMatch(QUESTION_COUNT_PATTERN);
    expect(itemsPrompt).not.toMatch(ASPECT_COUNT_PATTERN);
  });
});
