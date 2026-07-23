import { describe, expect, it } from "vitest";
import { runContentGate } from "../../src/compiler/gate.js";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";

describe("runContentGate — happy path（US3、quickstart §1）", () => {
  it("以真實素材執行，violations 為空且 compiled === total", () => {
    const deps = loadCompilerDeps();
    const result = runContentGate({ deps });

    expect(result.violations).toEqual([]);
    expect(result.compiled).toBe(result.total);
  });

  it("total 等於三份課表 Session 數總和", () => {
    const deps = loadCompilerDeps();
    const result = runContentGate({ deps });
    const expectedTotal =
      deps.schedules.foundation.sessions.length +
      deps.schedules.interviewReady.sessions.length +
      deps.schedules.interviewMastery.sessions.length;
    expect(result.total).toBe(expectedTotal);
  });

  it("runContentGate 為純函式：連續呼叫兩次結果相同", () => {
    const deps = loadCompilerDeps();
    const first = runContentGate({ deps });
    const second = runContentGate({ deps });
    expect(second).toEqual(first);
  });
});
