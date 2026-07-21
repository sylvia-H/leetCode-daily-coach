import { describe, expect, it } from "vitest";
import { getPathLabels, getSessionPlan } from "../../src/compiler/schedule.js";

describe("getSessionPlan", () => {
  it("三筆 Session 皆為 concept 類型，共用同一 conceptId", () => {
    for (let i = 1; i <= 3; i++) {
      const plan = getSessionPlan("foundation", i);
      expect(plan.type).toBe("concept");
      expect(plan.conceptId).toBe("left-right-pointer");
      expect(plan.sessionIndex).toBe(i);
    }
  });

  it("sessionIndex 超出硬編課表範圍時拋出可辨識的「課表用盡」錯誤", () => {
    expect(() => getSessionPlan("foundation", 4)).toThrow(/課表用盡/);
  });
});

describe("getPathLabels", () => {
  it("三筆 PathLabels 的 current 互不相同（FR-007a）", () => {
    const currents = [1, 2, 3].map((i) => getPathLabels(i).current);
    expect(new Set(currents).size).toBe(3);
  });

  it("第 1 課無 prev，第 3 課有 next", () => {
    expect(getPathLabels(1).prev).toBeUndefined();
    expect(getPathLabels(3).next).toBeDefined();
  });
});
