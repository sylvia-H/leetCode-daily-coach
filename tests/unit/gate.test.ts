import { describe, expect, it } from "vitest";
import { runContentGate } from "../../src/compiler/gate.js";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";

// 三個案例都以真實素材跑全 Track × 全 Session 編譯（第三個跑兩次）：單獨跑約 0.5s、平常全套約 2～3s，
// 但本機負載高時曾到 6.8s（CI 跑者忙碌時同理），撞上 vitest 預設的 5s。只放寬時間上限，斷言不變。
const FULL_COMPILE_TIMEOUT_MS = 15_000;

describe("runContentGate — happy path（US3、quickstart §1）", () => {
  it("以真實素材執行，violations 為空且 compiled === total", { timeout: FULL_COMPILE_TIMEOUT_MS }, () => {
    const deps = loadCompilerDeps();
    const result = runContentGate({ deps });

    expect(result.violations).toEqual([]);
    expect(result.compiled).toBe(result.total);
  });

  it("total 等於三份課表 Session 數總和", { timeout: FULL_COMPILE_TIMEOUT_MS }, () => {
    const deps = loadCompilerDeps();
    const result = runContentGate({ deps });
    const expectedTotal =
      deps.schedules.foundation.sessions.length +
      deps.schedules.interviewReady.sessions.length +
      deps.schedules.interviewMastery.sessions.length;
    expect(result.total).toBe(expectedTotal);
  });

  it("runContentGate 為純函式：連續呼叫兩次結果相同", { timeout: FULL_COMPILE_TIMEOUT_MS }, () => {
    const deps = loadCompilerDeps();
    const first = runContentGate({ deps });
    const second = runContentGate({ deps });
    expect(second).toEqual(first);
  });
});
