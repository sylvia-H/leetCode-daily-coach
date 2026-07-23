import { describe, expect, it } from "vitest";
import {
  checkDrift,
  generateAllSchedules,
  serializeSchedule,
  validateSchedule,
} from "../../src/compiler/schedule-generator.js";
import { parseTrackOverlay, parseTrackParamsFile } from "../../src/compiler/schedule-schema.js";
import {
  buildBank,
  buildMultiLevelGraph,
  makeOverlays,
  makeParamsFile,
  makeProblem,
} from "../helpers/schedule.js";
import type { TrackSchedule } from "../../src/types/schedule.js";

describe("ScheduleViolationRule 逐一 fail loud（US5 / SC-007）", () => {
  const graph = buildMultiLevelGraph();
  const modules = graph.modules.map((m) => ({ id: m.id, level: m.level }));

  it("schema-missing-field：track-params.json 缺必填欄位", () => {
    const { violations } = parseTrackParamsFile({ version: 1, tracks: { foundation: {} } }, modules);
    expect(violations.some((v) => v.rule === "schema-missing-field")).toBe(true);
  });

  it("schema-type：overlay 含未知欄位（.strict）", () => {
    const { violations } = parseTrackOverlay({ track: "foundation", byConcept: {}, extra: 1 }, "foundation");
    expect(violations.some((v) => v.rule === "schema-type")).toBe(true);
  });

  it("param-invalid：maxLevel 超出 modules 範圍", () => {
    const { violations } = parseTrackParamsFile(makeParamsFile({ foundation: { maxLevel: 999 } }), modules);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("coverage-gap：moduleAllowlist 跳號缺前置", () => {
    const bank = buildBank([]);
    const params = makeParamsFile({ foundation: { moduleAllowlist: ["m0", "m2"] } });
    const { violations } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    expect(violations.some((v) => v.rule === "coverage-gap")).toBe(true);
  });

  it("overlay-unknown-concept：Overlay key 非該 Track 已涵蓋 Concept", () => {
    const bank = buildBank([]);
    const params = makeParamsFile({ foundation: { maxLevel: 0 } });
    const overlays = makeOverlays({ foundation: { track: "foundation", byConcept: { c2: {} } } });
    const { violations } = generateAllSchedules({ graph, bank, params, overlays });
    expect(violations.some((v) => v.rule === "overlay-unknown-concept")).toBe(true);
  });

  it("dangling-problem：Overlay extraProblemIds 指向題庫不存在題號", () => {
    const bank = buildBank([]);
    const params = makeParamsFile({ foundation: { maxLevel: 0 } });
    const overlays = makeOverlays({
      foundation: { track: "foundation", byConcept: { c0: { extraProblemIds: [9999] } } },
    });
    const { violations } = generateAllSchedules({ graph, bank, params, overlays });
    expect(violations.some((v) => v.rule === "dangling-problem")).toBe(true);
  });

  const input = { graph, bank: buildBank([makeProblem({ id: 1, difficulty: "Easy" })]), params: makeParamsFile(), overlays: makeOverlays() };

  it("forward-dependency：合成違序課表", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [
        { sessionIndex: 1, type: "concept", conceptId: "c1" },
        { sessionIndex: 2, type: "concept", conceptId: "c0" },
      ],
    };
    expect(validateSchedule(schedule, input).some((v) => v.rule === "forward-dependency")).toBe(true);
  });

  it("one-concept-violation：concept Session 缺 conceptId", () => {
    const schedule: TrackSchedule = { track: "foundation", targetLevel: "easy", sessions: [{ sessionIndex: 1, type: "concept" }] };
    expect(validateSchedule(schedule, input).some((v) => v.rule === "one-concept-violation")).toBe(true);
  });

  it("duplicate-concept：同一 conceptId 被兩個 concept Session 引入", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [
        { sessionIndex: 1, type: "concept", conceptId: "c0" },
        { sessionIndex: 2, type: "concept", conceptId: "c0" },
      ],
    };
    expect(validateSchedule(schedule, input).some((v) => v.rule === "duplicate-concept")).toBe(true);
  });

  it("dangling-concept：conceptId 不存在於 DAG", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [{ sessionIndex: 1, type: "concept", conceptId: "no-such" }],
    };
    expect(validateSchedule(schedule, input).some((v) => v.rule === "dangling-concept")).toBe(true);
  });

  it("review-range-invalid：reviewRange 越界（end >= sessionIndex）", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [{ sessionIndex: 1, type: "review", reviewRange: [1, 1] }],
    };
    expect(validateSchedule(schedule, input).some((v) => v.rule === "review-range-invalid")).toBe(true);
  });

  it("dangling-problem（validateSchedule 結構層）：problemIds 含題庫不存在題號", () => {
    const schedule: TrackSchedule = {
      track: "foundation",
      targetLevel: "easy",
      sessions: [{ sessionIndex: 1, type: "practice", problemIds: [9999] }],
    };
    expect(validateSchedule(schedule, input).some((v) => v.rule === "dangling-problem")).toBe(true);
  });

  it("determinism-drift：committed 檔與重生成結果不一致", () => {
    const schedule: TrackSchedule = { track: "foundation", targetLevel: "easy", sessions: [] };
    const freshlyGenerated = serializeSchedule(schedule);
    const tampered = freshlyGenerated.replace('"easy"', '"medium"');
    expect(checkDrift("foundation", tampered, freshlyGenerated).some((v) => v.rule === "determinism-drift")).toBe(
      true,
    );
    expect(checkDrift("foundation", freshlyGenerated, freshlyGenerated)).toEqual([]);
  });
});

describe("違規清單穩定排序 + 生成完整回報（US5 / SC-007）", () => {
  it("同一違規情境重複生成 100 次，violations 逐字元一致", () => {
    const graph = buildMultiLevelGraph();
    const bank = buildBank([]);
    const params = makeParamsFile({ foundation: { moduleAllowlist: ["m0", "m2"] } });
    const overlays = makeOverlays({ foundation: { track: "foundation", byConcept: { "no-such-id": {} } } });
    const baseline = JSON.stringify(generateAllSchedules({ graph, bank, params, overlays }).violations);
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(generateAllSchedules({ graph, bank, params, overlays }).violations)).toBe(baseline);
    }
  });

  it("有 error 時仍完整回報全部違規（不因單一 Track 出錯而漏報其他 Track）", () => {
    const graph = buildMultiLevelGraph();
    const bank = buildBank([]);
    const params = makeParamsFile({
      foundation: { moduleAllowlist: ["m0", "m2"] }, // coverage-gap
      interviewReady: {}, // 合法
    });
    const overlays = makeOverlays({
      interviewMastery: { track: "interviewMastery", byConcept: { "no-such-id": {} } }, // overlay-unknown-concept
    });
    const { violations } = generateAllSchedules({ graph, bank, params, overlays });
    expect(violations.some((v) => v.rule === "coverage-gap" && v.subject.startsWith("foundation"))).toBe(true);
    expect(
      violations.some((v) => v.rule === "overlay-unknown-concept" && v.subject.startsWith("interviewMastery")),
    ).toBe(true);
  });
});
