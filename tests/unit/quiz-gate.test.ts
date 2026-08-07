// F11 checkQuizBank() 的 8 個具名 rule（quiz-schema 由載入層 throw，覆蓋於 quiz-load.test.ts）：
// 逐一被攔截且訊息指名根因；quiz-count-range 對 >10 題 MUST 回報違規而非自動截斷（CHK021）；
// quiz-duplicate 只攔逐字相同；quiz-leetcode-id 攔得下三種樣式且不誤判正常數值（quiz-bank-schema.md §3）。
import { describe, expect, it } from "vitest";
import {
  checkQuizBank,
  toReviewQuizItem,
  QUIZ_BIAS_MAX_SHARE,
  QUIZ_BIAS_MIN_ITEMS,
  QUIZ_POSITION_COVERAGE_MIN,
  QUIZ_POSITION_FULL_COVERAGE_ITEMS,
  type QuizBank,
  type QuizItem,
  type QuizViolationRule,
} from "../../src/compiler/quiz.js";
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

  describe("quiz-answer-position-bias（rule 10）：正解位置過度集中", () => {
    function makeItems(answerIndices: (0 | 1 | 2 | 3)[]): QuizItem[] {
      return answerIndices.map((answerIndex, i) => makeItem({ stem: `題目變體 ${i}`, answerIndex }));
    }

    it("10 題中 8 題正解同位置（80% > 50%）⇒ 攔下並指名分布", () => {
      const bank = makeBank(makeItems([1, 1, 1, 1, 1, 1, 1, 1, 0, 2]));
      const violations = checkQuizBank({ quizBank: bank, graph });
      const v = violations.find((v) => v.rule === "quiz-answer-position-bias");
      expect(v).toBeDefined();
      expect(v?.message).toMatch(/80%/);
      expect(v?.message).toMatch(/B=8/);
      expect(v?.subject).toBe("quiz-bank:two-pointer-technique");
    });

    it("平均分散（最高 30%）⇒ 不攔", () => {
      const bank = makeBank(makeItems([0, 0, 1, 1, 1, 2, 2, 3, 3, 3]));
      expect(rulesOf(checkQuizBank({ quizBank: bank, graph }))).not.toContain("quiz-answer-position-bias");
    });

    it("恰好 50% ⇒ 不攔（門檻為「超過」而非「達到」）", () => {
      const bank = makeBank(makeItems([0, 0, 0, 0, 1, 2, 3, 3]));
      expect(rulesOf(checkQuizBank({ quizBank: bank, graph }))).not.toContain("quiz-answer-position-bias");
    });

    it("題數低於 QUIZ_BIAS_MIN_ITEMS 時不套用（樣本太小佔比無統計意義）", () => {
      const bank = makeBank(makeItems([1, 1, 1])); // 3 題全同位置 = 100%，但低於下界
      expect(rulesOf(checkQuizBank({ quizBank: bank, graph }))).not.toContain("quiz-answer-position-bias");
      expect(QUIZ_BIAS_MIN_ITEMS).toBe(4);
    });
  });

  describe("quiz-answer-position-coverage（rule 12）：正解位置覆蓋不足", () => {
    function makeItems(answerIndices: (0 | 1 | 2 | 3)[]): QuizItem[] {
      return answerIndices.map((answerIndex, i) => makeItem({ stem: `題目變體 ${i}`, answerIndex }));
    }

    it("僅用 2 個位置（4 題）⇒ 攔下並指名未使用的位置", () => {
      const violations = checkQuizBank({ quizBank: makeBank(makeItems([0, 0, 1, 1])), graph });
      const v = violations.find((v) => v.rule === "quiz-answer-position-coverage");
      expect(v).toBeDefined();
      expect(v?.message).toMatch(/只用到 2 個位置/);
      expect(v?.message).toMatch(/C、D/);
    });

    it("4～7 題用滿 3 個位置 ⇒ 不攔（n < 8 只需 QUIZ_POSITION_COVERAGE_MIN）", () => {
      const violations = checkQuizBank({ quizBank: makeBank(makeItems([0, 1, 2, 0, 1, 2, 0])), graph });
      expect(rulesOf(violations)).not.toContain("quiz-answer-position-coverage");
      expect(QUIZ_POSITION_COVERAGE_MIN).toBe(3);
    });

    it("≥8 題僅用 3 個位置 ⇒ 攔下（題數達下界時四個位置 MUST 全用到）", () => {
      const violations = checkQuizBank({ quizBank: makeBank(makeItems([0, 0, 1, 1, 2, 2, 0, 1])), graph });
      const v = violations.find((v) => v.rule === "quiz-answer-position-coverage");
      expect(v).toBeDefined();
      expect(v?.message).toMatch(/需 ≥4/);
      expect(QUIZ_POSITION_FULL_COVERAGE_ITEMS).toBe(8);
    });

    it("≥8 題用滿 4 個位置 ⇒ 不攔", () => {
      const violations = checkQuizBank({ quizBank: makeBank(makeItems([0, 1, 2, 3, 0, 1, 2, 3])), graph });
      expect(rulesOf(violations)).not.toContain("quiz-answer-position-coverage");
    });

    it("題數低於 QUIZ_BIAS_MIN_ITEMS 時不套用", () => {
      const violations = checkQuizBank({ quizBank: makeBank(makeItems([0, 0, 0])), graph });
      expect(rulesOf(violations)).not.toContain("quiz-answer-position-coverage");
    });

    it("與 quiz-answer-position-bias 互補：50/50 兩格分布通過佔比判準、但被覆蓋判準攔下", () => {
      // A=4 B=4：最高佔比恰 50%（不違反 bias），但 C／D 從未使用（違反 coverage）
      const violations = checkQuizBank({ quizBank: makeBank(makeItems([0, 0, 0, 0, 1, 1, 1, 1])), graph });
      expect(rulesOf(violations)).not.toContain("quiz-answer-position-bias");
      expect(rulesOf(violations)).toContain("quiz-answer-position-coverage");
    });
  });

  describe("quiz-longest-option-bias（rule 11）：正解過度集中於最長選項", () => {
    /** 正解為唯一最長選項的題（其餘選項明顯較短）。 */
    function longestAnswerItem(i: number): QuizItem {
      return makeItem({
        stem: `題目變體 ${i}`,
        options: ["短選項", "短選項乙", "短選項丙", "這是一個明顯比其他三個選項都長很多的正確答案"],
        answerIndex: 3,
      });
    }
    /** 四個選項等長的題（長度不構成線索）。 */
    function balancedItem(i: number): QuizItem {
      return makeItem({
        stem: `題目變體 ${i}`,
        options: ["長度相近的選項甲", "長度相近的選項乙", "長度相近的選項丙", "長度相近的選項丁"],
        answerIndex: (i % 4) as 0 | 1 | 2 | 3,
      });
    }

    it("8 題中 6 題正解為唯一最長選項（75% > 50%）⇒ 攔下", () => {
      const items = [...Array.from({ length: 6 }, (_, i) => longestAnswerItem(i)), balancedItem(6), balancedItem(7)];
      const violations = checkQuizBank({ quizBank: makeBank(items), graph });
      const v = violations.find((v) => v.rule === "quiz-longest-option-bias");
      expect(v).toBeDefined();
      expect(v?.message).toMatch(/75%/);
    });

    it("四個選項等長 ⇒ 不攔（長度不構成可利用線索）", () => {
      const items = Array.from({ length: 8 }, (_, i) => balancedItem(i));
      expect(rulesOf(checkQuizBank({ quizBank: makeBank(items), graph }))).not.toContain("quiz-longest-option-bias");
    });

    it("正解與其他選項並列最長 ⇒ 不計入偏誤（僅「唯一最長」才算線索）", () => {
      const tied = Array.from({ length: 8 }, (_, i) =>
        makeItem({
          stem: `題目變體 ${i}`,
          // 正解（index 0）與 index 1 並列最長
          options: ["這是一個比較長的選項內容", "這是一個比較長的選項內容乙", "短選項", "短選項乙"],
          answerIndex: 0,
        }),
      );
      // index 1 才是唯一最長 ⇒ 正解不是唯一最長 ⇒ 不計入
      expect(rulesOf(checkQuizBank({ quizBank: makeBank(tied), graph }))).not.toContain("quiz-longest-option-bias");
    });

    it("題數低於 QUIZ_BIAS_MIN_ITEMS 時不套用", () => {
      const items = Array.from({ length: 3 }, (_, i) => longestAnswerItem(i)); // 100% 但低於下界
      expect(rulesOf(checkQuizBank({ quizBank: makeBank(items), graph }))).not.toContain("quiz-longest-option-bias");
    });
  });

  it("QUIZ_BIAS_MAX_SHARE 為 0.5：MUST NOT 收緊到接近隨機期望值 25%（會因正常波動誤殺而白燒額度）", () => {
    expect(QUIZ_BIAS_MAX_SHARE).toBe(0.5);
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
