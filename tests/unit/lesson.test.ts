import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { compile } from "../../src/compiler/lesson.js";

const FIXTURES = join(process.cwd(), "tests", "fixtures");

describe("compile", () => {
  it("同一 (track, sessionIndex) 連續呼叫產出逐欄位相同的 Lesson（determinism）", () => {
    const a = compile("foundation", 1);
    const b = compile("foundation", 1);
    expect(a).toEqual(b);
  });

  it("只有 track 不同時，concept / problems / path 完全相同（Track 不決定內容）", () => {
    const a = compile("foundation", 2);
    const b = compile("interviewReady", 2);
    expect(a.concept).toEqual(b.concept);
    expect(a.problems).toEqual(b.problems);
    expect(a.path).toEqual(b.path);
    expect(a.track).toBe("foundation");
    expect(b.track).toBe("interviewReady");
  });

  it("組出的 Lesson 含正確的 sessionIndex / type / 題數", () => {
    const lesson = compile("foundation", 3);
    expect(lesson.sessionIndex).toBe(3);
    expect(lesson.type).toBe("concept");
    expect(lesson.problems.length).toBeGreaterThanOrEqual(1);
    expect(lesson.problems.length).toBeLessThanOrEqual(3);
  });

  it("課表用盡時拋錯，不回傳半成品", () => {
    expect(() => compile("foundation", 4)).toThrow(/課表用盡/);
  });

  it("教材缺區塊時拋錯，不回傳半成品（FR-004b）", () => {
    expect(() =>
      compile("foundation", 1, {
        articlePath: join(FIXTURES, "article-missing-digest.md"),
        problemBankPath: join(FIXTURES, "problem-bank.json"),
      }),
    ).toThrow();
  });
});
