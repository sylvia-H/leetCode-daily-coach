import { describe, expect, it } from "vitest";
import { generateAllSchedules, TRACKS } from "../../src/compiler/schedule-generator.js";
import {
  buildBank,
  buildMultiLevelGraph,
  emptyOverlay,
  loadRealGenerateInput,
  makeOverlays,
  makeParamsFile,
  makeProblem,
} from "../helpers/schedule.js";

describe("三 Track 共用教材、難度帶分歧（US3 / SC-005）", () => {
  const input = loadRealGenerateInput();
  const { schedules, violations } = generateAllSchedules(input);

  it("三份課表的 conceptId 序完全相同（0 教材複製）", () => {
    const sequences = TRACKS.map((t) => schedules[t].sessions.map((s) => s.conceptId));
    expect(sequences[1]).toEqual(sequences[0]);
    expect(sequences[2]).toEqual(sequences[0]);
  });

  it("同一 Concept（prefix-sum：leetcode [303 Easy, 560 Medium]）依 Track 難度帶分歧", () => {
    const problemIdsOf = (track: (typeof TRACKS)[number]) =>
      schedules[track].sessions.find((s) => s.conceptId === "prefix-sum")?.problemIds ?? [];
    expect(problemIdsOf("foundation")).toEqual([303]);
    expect(problemIdsOf("interviewReady")).toEqual([303, 560]);
    expect(problemIdsOf("interviewMastery")).toEqual([560]);
  });

  it("foundation Overlay 對 array-traversal 附加 extraProblemIds=[27]，Core（1,26）疊加不取代", () => {
    const problemIds = schedules.foundation.sessions.find((s) => s.conceptId === "array-traversal")?.problemIds;
    expect(problemIds).toEqual([1, 26, 27]);
  });

  it("無 error 級違規（stub 輸入為合法情境）", () => {
    expect(violations.filter((v) => v.severity === "error")).toEqual([]);
  });
});

describe("Overlay fail loud（US3 / clarify Q4，合成情境）", () => {
  const graph = buildMultiLevelGraph();

  it("overlay key 非該 Track 已涵蓋 Concept → overlay-unknown-concept", () => {
    const bank = buildBank([]);
    const params = makeParamsFile({ foundation: { maxLevel: 0 } }); // 僅涵蓋 c0
    const overlays = makeOverlays({
      foundation: { track: "foundation", byConcept: { c2: {} } }, // c2 屬 level2，未涵蓋
    });
    const { violations } = generateAllSchedules({ graph, bank, params, overlays });
    expect(violations.some((v) => v.rule === "overlay-unknown-concept" && v.subject === "foundation:c2")).toBe(
      true,
    );
  });

  it("extraProblemIds 指向題庫不存在題號 → dangling-problem，且不寫入最終 problemIds", () => {
    const bank = buildBank([]); // 空題庫：任何題號皆不存在
    const params = makeParamsFile({ foundation: { maxLevel: 0 } });
    const overlays = makeOverlays({
      foundation: { track: "foundation", byConcept: { c0: { extraProblemIds: [9999] } } },
    });
    const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays });
    expect(violations.some((v) => v.rule === "dangling-problem" && v.subject === "foundation:c0")).toBe(true);
    expect(schedules.foundation.sessions.find((s) => s.conceptId === "c0")?.problemIds).toBeUndefined();
  });

  it("extraProblemIds 合法題號附加於 Core 過濾結果之後（不取代、去重）", () => {
    const bank = buildBank([makeProblem({ id: 1, difficulty: "Easy" }), makeProblem({ id: 2, difficulty: "Easy" })]);
    const params = makeParamsFile({ foundation: { maxLevel: 0, problemDifficulties: ["Easy"] } });
    const overlays = makeOverlays({
      foundation: { track: "foundation", byConcept: { c0: { extraProblemIds: [2, 1] } } }, // 1 與 core 重複、2 為新增
    });
    const graphWithLeetcode = buildMultiLevelGraph();
    graphWithLeetcode.concepts.get("c0")!.leetcode = [1];
    const { schedules } = generateAllSchedules({ graph: graphWithLeetcode, bank, params, overlays });
    expect(schedules.foundation.sessions.find((s) => s.conceptId === "c0")?.problemIds).toEqual([1, 2]);
  });

  it("空 Overlay（byConcept: {}）合法，課表照常生成、無疊加", () => {
    const bank = buildBank([]);
    const params = makeParamsFile({ foundation: { maxLevel: 0 } });
    const overlays = makeOverlays({ foundation: emptyOverlay("foundation") });
    const { violations } = generateAllSchedules({ graph, bank, params, overlays });
    expect(violations).toEqual([]);
  });
});
