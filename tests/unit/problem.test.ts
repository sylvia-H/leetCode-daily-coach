import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getProblemsForConcept } from "../../src/compiler/problem.js";

const FIXTURE_BANK = join(process.cwd(), "tests", "fixtures", "problem-bank.json");

describe("getProblemsForConcept", () => {
  it("依 conceptId 取回 1～3 題，原樣帶入題號 / 標題 / 連結 / 難度", () => {
    const problems = getProblemsForConcept("fixture-concept", FIXTURE_BANK);
    expect(problems).toHaveLength(3);
    expect(problems[0]).toEqual({
      id: 1,
      title: "Fixture One",
      url: "https://leetcode.com/problems/fixture-one/",
      difficulty: "Easy",
      whyThisPattern: "why 1",
      hint: "hint 1",
    });
  });

  it("查無對應 conceptId 時拋出指名成因的錯誤（FR-003b）", () => {
    expect(() => getProblemsForConcept("no-such-concept", FIXTURE_BANK)).toThrow(/no-such-concept/);
  });

  it("對應題號在資料檔中不存在時拋錯", () => {
    expect(() => getProblemsForConcept("unknown-id-concept", FIXTURE_BANK)).toThrow(/999/);
  });

  it("題數為 0 時拋錯", () => {
    expect(() => getProblemsForConcept("empty-concept", FIXTURE_BANK)).toThrow(/empty-concept/);
  });

  it("題數超過 3 時拋錯", () => {
    expect(() => getProblemsForConcept("too-many-concept", FIXTURE_BANK)).toThrow(/too-many-concept/);
  });
});
