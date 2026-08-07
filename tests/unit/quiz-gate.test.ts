// F11 checkQuizBank() 的 8 個具名 rule（quiz-schema 由載入層 throw，覆蓋於 quiz-load.test.ts）：
// 逐一被攔截且訊息指名根因；quiz-count-range 對 >10 題 MUST 回報違規而非自動截斷（CHK021）；
// quiz-duplicate 只攔逐字相同；quiz-leetcode-id 攔得下三種樣式且不誤判正常數值（quiz-bank-schema.md §3）。
import { describe, expect, it } from "vitest";
import { checkQuizBank, toReviewQuizItem, type QuizBank, type QuizItem, type QuizViolationRule } from "../../src/compiler/quiz.js";
import { renderQuizItemBody } from "../../src/renderer/discord.js";
import { QUIZ_BUDGET_LIMITS, QUIZ_URL_RESERVE_CHARS } from "../../src/renderer/budget.js";
import { makeGraph } from "../helpers/compiler.js";

function makeItem(overrides: Partial<QuizItem> = {}): QuizItem {
  return {
    stem: "在已排序陣列中尋找兩數之和，Two Pointer 相較暴力雙迴圈的關鍵優勢是什麼？",
    options: ["利用排序後的單調性每步排除一側", "不需要額外記憶體", "可處理未排序陣列", "一定比雜湊表快"],
    answerIndex: 0,
    explanation: ["靠排序帶來的單調性每步排除一側，將 O(n²) 降為 O(n)。", "正解成立說明。", "選項2為何不成立。", "選項3為何不成立。", "選項4為何不成立。"],
    ...overrides,
  };
}

function makeBank(items: QuizItem[], conceptId = "two-pointer-technique"): QuizBank {
  return { version: 1, byConcept: { [conceptId]: items } };
}

function rulesOf(violations: { rule: QuizViolationRule }[]): QuizViolationRule[] {
  return violations.map((v) => v.rule);
}

describe("checkQuizBank（quiz-bank-schema.md §3）", () => {
  const graph = makeGraph([{ id: "two-pointer-technique", localOrder: 1 }]);

  it("quizBank 缺席 ⇒ 回傳空陣列", () => {
    expect(checkQuizBank({ graph })).toEqual([]);
  });

  it("quiz-unknown-concept：key 不存在於 curriculum", () => {
    const bank = makeBank([makeItem(), makeItem(), makeItem()], "unknown-concept-id");
    const violations = checkQuizBank({ quizBank: bank, graph });
    expect(rulesOf(violations)).toContain("quiz-unknown-concept");
    expect(violations.find((v) => v.rule === "quiz-unknown-concept")?.message).toMatch(/unknown-concept-id/);
  });

  it("quiz-option-prefix：options 含 A./B. 等代號前綴", () => {
    const bank = makeBank([
      makeItem({ options: ["A. 選項一", "選項二", "選項三", "選項四"] }),
      makeItem(),
      makeItem(),
    ]);
    const violations = checkQuizBank({ quizBank: bank, graph });
    const v = violations.find((v) => v.rule === "quiz-option-prefix");
    expect(v).toBeDefined();
    expect(v?.subject).toBe("quiz-bank:two-pointer-technique[0]");
  });

  it("quiz-conclusion-length：explanation[0] 超過 80 字元", () => {
    const longConclusion = "結".repeat(81);
    const bank = makeBank([makeItem({ explanation: [longConclusion, "a", "b", "c", "d"] }), makeItem(), makeItem()]);
    const violations = checkQuizBank({ quizBank: bank, graph });
    const v = violations.find((v) => v.rule === "quiz-conclusion-length");
    expect(v).toBeDefined();
    expect(v?.message).toMatch(/81/);
  });

  it("quiz-item-budget：模擬呈現長度（含連結保留）超過 570", () => {
    const longStem = "題".repeat(600);
    const bank = makeBank([makeItem({ stem: longStem }), makeItem(), makeItem()]);
    const violations = checkQuizBank({ quizBank: bank, graph });
    const v = violations.find((v) => v.rule === "quiz-item-budget");
    expect(v).toBeDefined();
    expect(v?.message).toMatch(new RegExp(String(QUIZ_BUDGET_LIMITS.quizItem)));
  });

  it("quiz-traditional-chinese：混入簡體字", () => {
    const bank = makeBank([makeItem({ stem: "这是一个简体字测试题干，用来验证繁体检查规则是否生效。" }), makeItem(), makeItem()]);
    const violations = checkQuizBank({ quizBank: bank, graph });
    expect(rulesOf(violations)).toContain("quiz-traditional-chinese");
  });

  it("quiz-count-range：題數 <3 時回報違規", () => {
    const bank = makeBank([makeItem(), makeItem()]);
    const violations = checkQuizBank({ quizBank: bank, graph });
    const v = violations.find((v) => v.rule === "quiz-count-range");
    expect(v).toBeDefined();
    expect(v?.message).toMatch(/2/);
  });

  it("quiz-count-range：題數 >10 時回報違規，MUST NOT 靜默截斷陣列（CHK021）", () => {
    const items = Array.from({ length: 11 }, (_, i) => makeItem({ stem: `題目變體 ${i}` }));
    const bank = makeBank(items);
    // 驗證陣列本身未被本函式修改／截斷
    expect(bank.byConcept["two-pointer-technique"]!.length).toBe(11);
    const violations = checkQuizBank({ quizBank: bank, graph });
    const v = violations.find((v) => v.rule === "quiz-count-range");
    expect(v).toBeDefined();
    expect(v?.message).toMatch(/11/);
    // 陣列仍是 11 筆，函式呼叫後未被修改
    expect(bank.byConcept["two-pointer-technique"]!.length).toBe(11);
  });

  it("quiz-duplicate：同一 Concept 內兩題 stem 逐字相同", () => {
    const item = makeItem();
    const bank = makeBank([item, { ...item }, makeItem({ stem: "另一道不同的題目" })]);
    const violations = checkQuizBank({ quizBank: bank, graph });
    const v = violations.find((v) => v.rule === "quiz-duplicate");
    expect(v).toBeDefined();
    expect(v?.subject).toBe("quiz-bank:two-pointer-technique[1]");
  });

  it("quiz-duplicate：同面向但不同措辭的多題 MUST NOT 被誤判為重複（FR-016）", () => {
    const bank = makeBank([
      makeItem({ stem: "題目角度一：Two Pointer 的關鍵優勢是什麼？" }),
      makeItem({ stem: "題目角度二：為何 Two Pointer 能將複雜度降為 O(n)？" }),
      makeItem({ stem: "題目角度三：Two Pointer 適用的前提條件是什麼？" }),
    ]);
    const violations = checkQuizBank({ quizBank: bank, graph });
    expect(rulesOf(violations)).not.toContain("quiz-duplicate");
  });

  describe("quiz-leetcode-id（quiz-bank-schema.md §3 rule 9）", () => {
    it("攔得下「LeetCode 1」樣式", () => {
      const bank = makeBank([makeItem({ stem: "這題和 LeetCode 1 的解法相同" }), makeItem(), makeItem()]);
      const violations = checkQuizBank({ quizBank: bank, graph });
      expect(rulesOf(violations)).toContain("quiz-leetcode-id");
    });

    it("攔得下「力扣第 42 題」樣式", () => {
      const bank = makeBank([makeItem({ stem: "這題是力扣第 42 題的變化" }), makeItem(), makeItem()]);
      const violations = checkQuizBank({ quizBank: bank, graph });
      expect(rulesOf(violations)).toContain("quiz-leetcode-id");
    });

    it("攔得下題目連結樣式", () => {
      const bank = makeBank([
        makeItem({ stem: "詳見 https://leetcode.com/problems/two-sum/ 的說明" }),
        makeItem(),
        makeItem(),
      ]);
      const violations = checkQuizBank({ quizBank: bank, graph });
      expect(rulesOf(violations)).toContain("quiz-leetcode-id");
    });

    it("MUST NOT 誤判 O(n²)、nums[3]、情境數值等正常內容", () => {
      const bank = makeBank([
        makeItem({
          stem: "此演算法複雜度為 O(n²)，考慮陣列 nums[3] = 5 的情境，第 2 輪迭代後結果為何？",
        }),
        makeItem(),
        makeItem(),
      ]);
      const violations = checkQuizBank({ quizBank: bank, graph });
      expect(rulesOf(violations)).not.toContain("quiz-leetcode-id");
    });
  });

  it("QUIZ_URL_RESERVE_CHARS MUST >= 實際最壞連結長度（憲章 IX：Gate 恆嚴格於 runtime）", () => {
    const worstBaseUrl = "https://sylvia-h.github.io/leetcode-daily-coach";
    const worstConceptId = "sliding-window-longest-substring-no-repeat";
    const quizUrl = `${worstBaseUrl}/quiz/${worstConceptId}.html`;
    const item = makeItem();
    const withoutUrl = renderQuizItemBody(toReviewQuizItem("c", item));
    const withUrl = renderQuizItemBody(toReviewQuizItem("c", item, quizUrl));
    const linkPartLength = Array.from(withUrl).length - Array.from(withoutUrl).length;
    expect(linkPartLength).toBeLessThanOrEqual(QUIZ_URL_RESERVE_CHARS);
  });
});
