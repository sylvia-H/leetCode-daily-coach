// F7 Gate 缺口補強（2026-07-31）：per-article Gate 原本只驗 digest/tsTip/pyTip/takeaway，
// exit_criteria 與逐題預算都要等批次末的全課表 Gate 才爆出——165 篇跑完 2～4 天後才發現。
// 本檔守兩件事：
//   1. exit_criteria 屬 **Skeleton 衍生**，MUST 在批次開始前一次驗完（重生無法修正）
//   2. 逐題預算屬 **LLM 可控**，量測對象 MUST 是 renderer 的 renderProblemEntry 輸出
import { describe, expect, it } from "vitest";
import { checkFrozenSkeletonBudgets } from "../../scripts/generate-content.js";
import {
  EXIT_CRITERIA_COUNT_MAX,
  EXIT_CRITERIA_ITEM_MAX,
  PROBLEM_ENTRY_MAX,
} from "../../src/renderer/budget.js";
import { renderProblemEntry } from "../../src/renderer/discord.js";

describe("checkFrozenSkeletonBudgets — Skeleton 衍生欄位的批次前置檢查", () => {
  it("全部合規 → 無違規", () => {
    const violations = checkFrozenSkeletonBudgets([
      { id: "c1", exitCriteria: ["能說明 Two Pointers 的收斂條件", "能寫出 while left < right 的迴圈"] },
    ]);
    expect(violations).toEqual([]);
  });

  it("單條超過上限 → 具名指出 conceptId 與索引", () => {
    const violations = checkFrozenSkeletonBudgets([
      { id: "c1", exitCriteria: ["a".repeat(EXIT_CRITERIA_ITEM_MAX + 1)] },
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.conceptId).toBe("c1");
    expect(violations[0]?.reason).toContain("exit_criteria[0]");
  });

  it("條數超過上限 → 回報條數違規", () => {
    const violations = checkFrozenSkeletonBudgets([
      { id: "c1", exitCriteria: Array.from({ length: EXIT_CRITERIA_COUNT_MAX + 1 }, () => "短句") },
    ]);
    expect(violations.some((v) => v.reason.includes("超過上限"))).toBe(true);
  });

  it("實際課綱最長值 107 字元 MUST 不違規（迴歸守衛）", () => {
    expect(checkFrozenSkeletonBudgets([{ id: "c1", exitCriteria: ["a".repeat(107)] }])).toEqual([]);
  });

  it("多個 Concept 各自回報，MUST NOT 只回報第一個", () => {
    const long = "a".repeat(EXIT_CRITERIA_ITEM_MAX + 1);
    const violations = checkFrozenSkeletonBudgets([
      { id: "c1", exitCriteria: [long] },
      { id: "c2", exitCriteria: ["正常"] },
      { id: "c3", exitCriteria: [long] },
    ]);
    expect(violations.map((v) => v.conceptId)).toEqual(["c1", "c3"]);
  });
});

describe("逐題預算：量測對象為 renderProblemEntry 的輸出", () => {
  // 實測 problem[0](449/350)：只量 whyThisPattern 會低估——title / url / difficulty 由程式帶入，
  // 但一樣計入 Discord 字元預算，故 MUST 以 render 後的完整字串量測。
  it("render 後的長度包含 title / url / difficulty，明顯大於 whyThisPattern 本身", () => {
    const why = "b".repeat(200);
    const rendered = renderProblemEntry({
      id: 3,
      title: "Longest Substring Without Repeating Characters",
      url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      difficulty: "Medium",
      whyThisPattern: why,
    });
    expect([...rendered].length).toBeGreaterThan([...why].length + 100);
  });

  it("whyThisPattern 過長時 render 結果會超過 PROBLEM_ENTRY_MAX", () => {
    const rendered = renderProblemEntry({
      id: 3,
      title: "Longest Substring Without Repeating Characters",
      url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      difficulty: "Medium",
      whyThisPattern: "b".repeat(300),
      hint: "h".repeat(50),
    });
    expect([...rendered].length).toBeGreaterThan(PROBLEM_ENTRY_MAX);
  });
});
