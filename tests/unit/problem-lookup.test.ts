import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProblemsForConcept, loadProblemBank } from "../../src/compiler/problem.js";

const LEGAL_BANK = join(process.cwd(), "tests", "fixtures", "problem-bank.json");
const TOO_MANY_BANK = join(process.cwd(), "tests", "fixtures", "problem-bank", "too-many.json");
const UNKNOWN_ID_BANK = join(process.cwd(), "tests", "fixtures", "problem-bank", "unknown-id.json");

describe("getProblemsForConcept（US2：前向查找 + 題數守門）", () => {
  it("正常 1~3 題，回傳與宣告同序的 ProblemMeta[]", () => {
    const { bank } = loadProblemBank(LEGAL_BANK);
    const problems = getProblemsForConcept("demo-concept", [3, 1, 2], bank);
    expect(problems.map((p) => p.id)).toEqual([3, 1, 2]);
  });

  it("leetcode: [] → 回傳 []，不 throw（合法無題觀念課）", () => {
    const { bank } = loadProblemBank(LEGAL_BANK);
    expect(() => getProblemsForConcept("time-space-complexity", [], bank)).not.toThrow();
    expect(getProblemsForConcept("time-space-complexity", [], bank)).toEqual([]);
  });

  it("題數超過 3 → throw，訊息指名 conceptId 與題數（problem-count-range）", () => {
    const { bank } = loadProblemBank(TOO_MANY_BANK);
    expect(() => getProblemsForConcept("too-many-concept", [101, 102, 103, 104], bank)).toThrow(
      /problem-count-range/,
    );
    expect(() => getProblemsForConcept("too-many-concept", [101, 102, 103, 104], bank)).toThrow(
      /too-many-concept/,
    );
  });

  it("題號不存在於題庫 → throw，訊息指名 conceptId 與缺漏題號（unknown-leetcode）", () => {
    const { bank } = loadProblemBank(UNKNOWN_ID_BANK);
    expect(() => getProblemsForConcept("unknown-id-concept", [999], bank)).toThrow(/unknown-leetcode/);
    expect(() => getProblemsForConcept("unknown-id-concept", [999], bank)).toThrow(/999/);
  });
});
