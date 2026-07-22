import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProblemsForConcept, loadProblemBank } from "../../src/compiler/problem.js";

const FIXTURE_BANK = join(process.cwd(), "tests", "fixtures", "problem-bank.json");

describe("loadProblemBank（baseline）", () => {
  it("載入合法題庫，無 loadViolations，byId 索引齊備", () => {
    const { bank, loadViolations } = loadProblemBank(FIXTURE_BANK);
    expect(loadViolations).toHaveLength(0);
    expect(bank.byId.get(1)).toMatchObject({ id: 1, slug: "fixture-one", difficulty: "Easy" });
    expect(bank.byId.get(2)).toMatchObject({ id: 2, slug: "fixture-two" });
    expect(bank.byId.get(3)).toMatchObject({ id: 3, slug: "fixture-three" });
  });

  it("題庫檔不存在時回傳空 bank + bank-load violation（不 throw）", () => {
    const { bank, loadViolations } = loadProblemBank(join(process.cwd(), "tests", "fixtures", "no-such-bank.json"));
    expect(bank.byId.size).toBe(0);
    expect(loadViolations).toHaveLength(1);
    expect(loadViolations[0]).toMatchObject({ rule: "bank-load", severity: "error" });
  });
});

describe("getProblemsForConcept（baseline，前向查找）", () => {
  it("依 conceptId 與宣告題號取回同序 ProblemMeta[]", () => {
    const { bank } = loadProblemBank(FIXTURE_BANK);
    const problems = getProblemsForConcept("demo-concept", [2, 1], bank);
    expect(problems.map((p) => p.id)).toEqual([2, 1]);
    expect(problems[0]).toMatchObject({ id: 2, title: "Fixture Two" });
  });

  it("leetcode: [] 回傳空清單、不報錯（合法無題觀念課）", () => {
    const { bank } = loadProblemBank(FIXTURE_BANK);
    expect(getProblemsForConcept("empty-concept", [], bank)).toEqual([]);
  });
});
