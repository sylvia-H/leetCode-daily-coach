import { describe, expect, it } from "vitest";
import { generateAllSchedules, validateSchedule } from "../../src/compiler/schedule-generator.js";
import { buildBank, buildMultiLevelGraph, makeOverlays, makeParamsFile } from "../helpers/schedule.js";
import type { TrackSchedule } from "../../src/types/schedule.js";

describe("涵蓋子集 + 拓樸子序列（US2 / SC-002 / FR-014a）", () => {
  const graph = buildMultiLevelGraph();
  const bank = buildBank([]);

  it("maxLevel 連續切法天然閉包，涵蓋序為 ordinal 子序列，無 coverage-gap", () => {
    const params = makeParamsFile({
      foundation: { maxLevel: 1 },
      interviewReady: { maxLevel: 2 },
      interviewMastery: { maxLevel: 2 },
    });
    const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    expect(schedules.foundation.sessions.map((s) => s.conceptId)).toEqual(["c0", "c1"]);
    expect(schedules.interviewReady.sessions.map((s) => s.conceptId)).toEqual(["c0", "c1", "c2"]);
    expect(violations.filter((v) => v.rule === "coverage-gap")).toEqual([]);
  });

  it("每個 concept Session 的 prerequisite 皆在更前 index（一次通過生成即合法拓樸子序列）", () => {
    const params = makeParamsFile({ foundation: { maxLevel: 2 } });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const indexOf = new Map(schedules.foundation.sessions.map((s) => [s.conceptId, s.sessionIndex]));
    for (const session of schedules.foundation.sessions) {
      if (session.type !== "concept" || !session.conceptId) continue;
      const node = graph.concepts.get(session.conceptId)!;
      for (const p of node.prerequisite) {
        expect(indexOf.get(p)).toBeLessThan(session.sessionIndex);
      }
    }
  });

  it("moduleAllowlist 跳號（缺前置）→ coverage-gap（fail loud，不靜默擴張涵蓋範圍）", () => {
    const params = makeParamsFile({ interviewMastery: { maxLevel: 2, moduleAllowlist: ["m0", "m2"] } });
    const { violations } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const gap = violations.find((v) => v.rule === "coverage-gap" && v.subject === "interviewMastery:c2");
    expect(gap).toBeDefined();
    expect(gap?.target).toBe("c1");
  });
});

describe("validateSchedule 結構不變式（US2 / SC-006~007，合成違規案例）", () => {
  const graph = buildMultiLevelGraph();
  const bank = buildBank([]);
  const input = { graph, bank, params: makeParamsFile(), overlays: makeOverlays() };

  it("forward-dependency：合成違序案例（c1 排在 c0 之前）fail loud", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [
        { sessionIndex: 1, type: "concept", conceptId: "c1" },
        { sessionIndex: 2, type: "concept", conceptId: "c0" },
      ],
    };
    const violations = validateSchedule(schedule, input);
    expect(violations.some((v) => v.rule === "forward-dependency" && v.subject === "foundation:c1")).toBe(true);
  });

  it("duplicate-concept：同一 conceptId 被兩個 concept Session 引入 fail loud", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [
        { sessionIndex: 1, type: "concept", conceptId: "c0" },
        { sessionIndex: 2, type: "concept", conceptId: "c0" },
      ],
    };
    const violations = validateSchedule(schedule, input);
    expect(violations.some((v) => v.rule === "duplicate-concept")).toBe(true);
  });

  it("dangling-concept：conceptId 不存在於 DAG fail loud", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [{ sessionIndex: 1, type: "concept", conceptId: "no-such-concept" }],
    };
    const violations = validateSchedule(schedule, input);
    expect(violations.some((v) => v.rule === "dangling-concept")).toBe(true);
  });

  it("one-concept-violation：concept Session 缺 conceptId fail loud", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [{ sessionIndex: 1, type: "concept" }],
    };
    const violations = validateSchedule(schedule, input);
    expect(violations.some((v) => v.rule === "one-concept-violation")).toBe(true);
  });

  it("合法課表（無違規）回傳空陣列", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [
        { sessionIndex: 1, type: "concept", conceptId: "c0" },
        { sessionIndex: 2, type: "concept", conceptId: "c1" },
      ],
    };
    expect(validateSchedule(schedule, input)).toEqual([]);
  });
});
