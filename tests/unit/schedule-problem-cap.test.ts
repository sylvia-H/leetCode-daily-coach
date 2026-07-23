// 每 Session 題數上限 ≤3（docs/spec.md §13.4 / §14.5，F5 定案 2026-07-23）：唯一套用點在生成端——
// Compiler / Renderer MUST NOT 截斷題目，故超出的部分必須在寫進 schedules/{track}.json 之前依確定性
// 規則（既有穩定序取前 3）捨去。本檔守住「生成端會截、committed 課表不會超標、超標會被具名攔下」。
import { describe, expect, it } from "vitest";
import { generateAllSchedules, validateSchedule, TRACKS } from "../../src/compiler/schedule-generator.js";
import {
  buildBank,
  buildMultiLevelGraph,
  loadRealGenerateInput,
  makeOverlays,
  makeParamsFile,
  makeProblem,
} from "../helpers/schedule.js";
import type { TrackSchedule } from "../../src/types/schedule.js";

const MAX = 3;

describe("每 Session 題數上限 ≤3（生成端唯一套用點）", () => {
  it("真實 stub 輸入生成的三份課表，任一 Session 皆 ≤3 題", () => {
    const { schedules } = generateAllSchedules(loadRealGenerateInput());
    for (const track of TRACKS) {
      for (const session of schedules[track].sessions) {
        expect((session.problemIds?.length ?? 0) <= MAX).toBe(true);
      }
    }
  });

  it("practice 槽的聯集超過 3 題時，依升冪穩定序取前 3", () => {
    const graph = buildMultiLevelGraph();
    graph.concepts.get("c0")!.leetcode = [11, 22];
    graph.concepts.get("c1")!.leetcode = [33, 44];
    const bank = buildBank([11, 22, 33, 44].map((id) => makeProblem({ id, difficulty: "Easy" })));
    const params = makeParamsFile({ foundation: { problemDifficulties: ["Easy"] } });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });

    // rhythm 第 3 槽為 practice，其週內已引入 c0（[11,22]）與 c1（[33,44]）⇒ 聯集 4 題 ⇒ 取前 3。
    const practice = schedules.foundation.sessions.find((s) => s.type === "practice");
    expect(practice?.problemIds).toEqual([11, 22, 33]);
  });

  it("concept 槽疊上 Overlay extraProblemIds 後超過 3 題時，取前 3（Core 優先保留）", () => {
    const graph = buildMultiLevelGraph();
    graph.concepts.get("c0")!.leetcode = [1, 2, 3];
    const bank = buildBank([1, 2, 3, 4].map((id) => makeProblem({ id, difficulty: "Easy" })));
    const params = makeParamsFile({ foundation: { problemDifficulties: ["Easy"] } });
    const overlays = makeOverlays({
      foundation: { track: "foundation", byConcept: { c0: { extraProblemIds: [4] } } },
    });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays });
    expect(schedules.foundation.sessions.find((s) => s.conceptId === "c0")?.problemIds).toEqual([1, 2, 3]);
  });

  it("課表被手改成 4 題時，validateSchedule 以 session-problem-overflow 具名攔下", () => {
    const input = loadRealGenerateInput();
    const tampered: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [{ sessionIndex: 1, type: "practice", problemIds: [1, 26, 27, 283] }],
    };
    const violations = validateSchedule(tampered, input);
    const hit = violations.find((v) => v.rule === "session-problem-overflow");
    expect(hit?.severity).toBe("error");
    expect(hit?.subject).toBe("foundation:session-1");
    expect(hit?.message).toContain("4 題");
  });
});
