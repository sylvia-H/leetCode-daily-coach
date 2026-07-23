import { describe, expect, it } from "vitest";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";

describe("compile（真實素材，US1 MVP）", () => {
  const deps = loadCompilerDeps();

  it("同一 (track, sessionIndex) 連續呼叫產出逐欄位相同的 Lesson（determinism）", () => {
    const a = compile("foundation", 4, deps);
    const b = compile("foundation", 4, deps);
    expect(a).toEqual(b);
  });

  it("只有 track 不同時，concept / problems / path 完全相同（Track 不決定內容）", () => {
    const a = compile("foundation", 4, deps);
    const b = compile("interviewReady", 4, deps);
    expect(a.concept).toEqual(b.concept);
    expect(a.path).toEqual(b.path);
    expect(a.track).toBe("foundation");
    expect(b.track).toBe("interviewReady");
  });

  it("組出的 Lesson 含正確的 sessionIndex / type / 題數", () => {
    const lesson = compile("foundation", 4, deps);
    expect(lesson.sessionIndex).toBe(4);
    expect(lesson.type).toBe("concept");
    expect(lesson.problems.length).toBeGreaterThanOrEqual(1);
    expect(lesson.problems.length).toBeLessThanOrEqual(3);
  });

  it("sessionIndex 超出課表範圍時拋錯，不回傳半成品", () => {
    expect(() => compile("foundation", 999, deps)).toThrow();
  });

  it("不再依賴 F1 硬編 demo 題號（11/125/167 不應出現在真實素材編譯結果中）", () => {
    const lesson = compile("foundation", 4, deps);
    const ids = lesson.problems.map((p) => p.id);
    expect(ids).not.toContain(11);
    expect(ids).not.toContain(125);
    expect(ids).not.toContain(167);
  });
});
