import { describe, expect, it } from "vitest";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";

describe("compile — determinism（SC-003）", () => {
  it("同一 (track, sessionIndex) 連續 compile 10 次，JSON.stringify 全等", () => {
    const deps = loadCompilerDeps();
    const first = JSON.stringify(compile("foundation", 4, deps));
    for (let i = 0; i < 10; i++) {
      expect(JSON.stringify(compile("foundation", 4, deps))).toBe(first);
    }
  });

  it("跨多種 Session 類型（concept/practice/challenge/review/rest）皆具確定性", () => {
    const deps = loadCompilerDeps();
    for (const sessionIndex of [1, 3, 5, 6, 7]) {
      const first = JSON.stringify(compile("foundation", sessionIndex, deps));
      const second = JSON.stringify(compile("foundation", sessionIndex, deps));
      expect(second).toBe(first);
    }
  });
});
