// F11 正解位置確定性重排（quiz-bank-schema.md §5.2a、scripts/lib/quiz-balance.ts）：
// 釘死三件事——(1) 重排後 quiz-answer-position-bias／quiz-answer-position-coverage 由建構保證通過；
// (2) 干擾項相對順序不變（explanation[2..4] 的對應契約靠這個不變量維持）；
// (3) 決定性（同輸入 → 同輸出）且非可預測樣式（MUST NOT 退化成 i % 4）。
import { describe, expect, it } from "vitest";
import { buildBalancedTargets, moveAnswerTo, rebalanceAnswerPositions } from "../../scripts/lib/quiz-balance.js";
import { checkQuizBank, type QuizItem } from "../../src/compiler/quiz.js";
import { makeGraph } from "../helpers/compiler.js";

/** 四個等長選項、正解固定在 index 0，用以觀察重排效果（等長 ⇒ 不會誤觸 longest-option-bias）。 */
function makeItem(n: number): QuizItem {
  return {
    stem: `題幹${n}`,
    options: [`正解${n}`, `干擾甲${n}`, `干擾乙${n}`, `干擾丙${n}`],
    answerIndex: 0,
    explanation: [`結論${n}`, `正解說明${n}`, `說明甲${n}`, `說明乙${n}`, `說明丙${n}`],
  };
}

describe("rebalanceAnswerPositions — 位置類判準由建構保證通過（不再靠重生賭運氣）", () => {
  // n=4..10 涵蓋 quiz-count-range 的全部合法題數；每一個 n 都 MUST 無位置類違規。
  for (let n = 4; n <= 10; n++) {
    it(`${n} 題全部正解在同一位置（最差輸入）⇒ 重排後無 position-bias／position-coverage 違規`, () => {
      const conceptId = `concept-${n}`;
      const graph = makeGraph([{ id: conceptId, localOrder: 1 }]);
      const items = Array.from({ length: n }, (_, i) => makeItem(i));
      const balanced = rebalanceAnswerPositions(conceptId, items);

      const violations = checkQuizBank({
        quizBank: { version: 1, byConcept: { [conceptId]: balanced } },
        graph,
      });
      expect(violations.map((v) => v.rule)).not.toContain("quiz-answer-position-bias");
      expect(violations.map((v) => v.rule)).not.toContain("quiz-answer-position-coverage");
    });
  }

  it("重排前 100% 集中在 A 的輸入，重排後四格次數最多相差 1", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(i));
    const counts = [0, 0, 0, 0];
    for (const item of rebalanceAnswerPositions("two-pointer-technique", items)) counts[item.answerIndex]!++;
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});

describe("moveAnswerTo — 干擾項 MUST 維持原相對順序（explanation[2..4] 的對應契約）", () => {
  it("正解搬到任一位置，三個干擾項的相對順序皆不變", () => {
    const item = makeItem(1);
    for (const target of [0, 1, 2, 3] as const) {
      const moved = moveAnswerTo(item, target);
      expect(moved.options[moved.answerIndex]).toBe("正解1");
      expect(moved.options.filter((o) => o !== "正解1")).toEqual(["干擾甲1", "干擾乙1", "干擾丙1"]);
    }
  });

  it("正解已在目標位置 ⇒ 原樣回傳（MUST NOT 做無謂的重建）", () => {
    const item = makeItem(1);
    expect(moveAnswerTo(item, 0)).toBe(item);
  });

  it("選項多重集合與 stem／explanation 完全不變（重排 MUST NOT 改動任何文字）", () => {
    const item = makeItem(1);
    const moved = moveAnswerTo(item, 2);
    expect([...moved.options].sort()).toEqual([...item.options].sort());
    expect(moved.stem).toBe(item.stem);
    expect(moved.explanation).toEqual(item.explanation);
  });
});

describe("buildBalancedTargets — 決定性且非可預測樣式", () => {
  it("同 conceptId、同題數 ⇒ byte-identical（生成物可重現）", () => {
    const items = Array.from({ length: 7 }, (_, i) => makeItem(i));
    const a = rebalanceAnswerPositions("input-output-contract", items);
    const b = rebalanceAnswerPositions("input-output-contract", items);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("不同 conceptId ⇒ 位置指派不同（MUST NOT 讓全庫共用同一組樣式）", () => {
    const a = buildBalancedTargets(8, 1);
    const b = buildBalancedTargets(8, 2);
    expect(a).not.toEqual(b);
  });

  it("MUST NOT 退化成 i % 4 這種一眼可猜的固定輪替", () => {
    const naive = Array.from({ length: 8 }, (_, i) => i % 4);
    // 抽樣多個種子；若實作退化成固定輪替，這裡會全部相等。
    const seeds = [1, 2, 3, 5, 8, 13, 21, 34];
    expect(seeds.some((s) => JSON.stringify(buildBalancedTargets(8, s)) !== JSON.stringify(naive))).toBe(true);
  });

  it("任何題數下四格次數最多相差 1（餘數格由旋轉輪流承擔，A MUST NOT 恆為最多）", () => {
    for (let n = 3; n <= 10; n++) {
      for (const seed of [1, 7, 99, 12345]) {
        const counts = [0, 0, 0, 0];
        for (const t of buildBalancedTargets(n, seed)) counts[t]!++;
        expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
      }
    }
  });
});
