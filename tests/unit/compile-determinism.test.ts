import { describe, expect, it } from "vitest";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";
import { render } from "../../src/renderer/discord.js";

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

  // F8（SC-004、US1 Acceptance 2）：review Session 重複編譯並 render 100 次，embeds 必須逐位元組一致
  // ——含同一則 Reflection、同一則鼓勵語、同一題 Challenge（若素材檔已凍結存在，兩則欄位皆非空；
  // 素材檔缺席時欄位省略，determinism 依然成立，兩種情境本測試皆涵蓋）。
  it("review Session 重複編譯並 render 100 次，embeds byte-identical（含 Reflection／鼓勵語／Challenge）", () => {
    const deps = loadCompilerDeps();
    const reviewSession = deps.schedules.foundation.sessions.find((s) => s.type === "review");
    if (!reviewSession) throw new Error("fixture 失效：foundation 課表找不到任何 review Session");

    const first = JSON.stringify(render(compile("foundation", reviewSession.sessionIndex, deps)));
    for (let i = 0; i < 100; i++) {
      const again = JSON.stringify(render(compile("foundation", reviewSession.sessionIndex, deps)));
      expect(again).toBe(first);
    }
  });
});
