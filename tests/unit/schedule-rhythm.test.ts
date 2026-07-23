import { describe, expect, it } from "vitest";
import { generateAllSchedules } from "../../src/compiler/schedule-generator.js";
import { buildBank, loadRealGenerateInput, makeOverlays, makeParamsFile, makeProblem } from "../helpers/schedule.js";
import { buildGraph, skeletonOf, type ConceptSpec } from "../helpers/curriculum.js";

describe("週節奏攤課（US4 / FR-011~013，stub 5 Concept）", () => {
  const input = loadRealGenerateInput();
  const { schedules } = generateAllSchedules(input);
  const foundation = schedules.foundation;

  it("第一週（Session 1~7）含恰一個 review 與一個 rest，reviewRange = [1, 5]（涵蓋本週全部上課日）", () => {
    const week1 = foundation.sessions.filter((s) => s.sessionIndex <= 7);
    const reviews = week1.filter((s) => s.type === "review");
    const rests = week1.filter((s) => s.type === "rest");
    expect(reviews).toHaveLength(1);
    expect(rests).toHaveLength(1);
    expect(reviews[0]?.reviewRange).toEqual([1, 5]);
  });

  it("每個 concept Session 皆被某個 review 的 reviewRange 涵蓋（無「教了卻永不複習」的 Concept）", () => {
    const ranges = foundation.sessions
      .filter((s) => s.type === "review" && s.reviewRange)
      .map((s) => s.reviewRange!);
    for (const session of foundation.sessions) {
      if (session.type !== "concept") continue;
      expect(ranges.some(([start, end]) => start <= session.sessionIndex && session.sessionIndex <= end)).toBe(true);
    }
  });

  it("Concept 佇列（5 個）用盡後於當輪節奏走完處自然收尾，不填充湊滿 180", () => {
    // rhythm = [concept,concept,practice,concept,challenge,review,rest]，每輪 3 個 concept 槽（位置 0,1,3）；
    // 5 個 concept：第 1 輪排滿 3 個（time-space-complexity/reading-the-problem/array-traversal），
    // 第 2 輪排 2 個（in-place-operations/prefix-sum，槽 0,1）後佇列已空，槽 3 的 concept 落空、跳過
    // （不消耗 sessionIndex），practice/challenge/review/rest 仍正常跑完（13 = 7 + 6）。
    const conceptSessions = foundation.sessions.filter((s) => s.type === "concept");
    expect(conceptSessions).toHaveLength(5);
    expect(conceptSessions.map((s) => s.conceptId)).toEqual([
      "time-space-complexity",
      "reading-the-problem",
      "array-traversal",
      "in-place-operations",
      "prefix-sum",
    ]);
    // 第 2 輪仍完整跑完剩餘槽位（practice/review/challenge/rest），sessionIndex 連續無缺口
    const indices = foundation.sessions.map((s) => s.sessionIndex);
    expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => i + 1));
  });

  it("每個 review 的 reviewRange 皆落在本輪內、不越界不錯輪", () => {
    for (const session of foundation.sessions) {
      if (session.type !== "review" || !session.reviewRange) continue;
      const [start, end] = session.reviewRange;
      expect(start).toBeLessThanOrEqual(end);
      expect(end).toBeLessThan(session.sessionIndex);
    }
  });

  it("型別判定為相對天數（sessionIndex 對 7 取模），非日曆星期：同輸入重複生成型別序不變", () => {
    const types1 = generateAllSchedules(input).schedules.foundation.sessions.map((s) => s.type);
    const types2 = generateAllSchedules(input).schedules.foundation.sessions.map((s) => s.type);
    expect(types2).toEqual(types1);
  });
});

describe("刚好整除 rhythm 的 concept 佇列（無跳過槽情境）", () => {
  it("6 個 Concept（每輪 3 個）恰好跑滿 2 輪、無提前中止也無額外空輪", () => {
    const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);
    const specs: ConceptSpec[] = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`,
      module: "m0",
      topic: "t0",
      localOrder: i + 1,
    }));
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([]);
    const params = makeParamsFile({ foundation: { maxLevel: 0 } });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    expect(schedules.foundation.sessions).toHaveLength(14); // 2 輪 × 7
    expect(schedules.foundation.sessions.filter((s) => s.type === "concept")).toHaveLength(6);
    expect(schedules.foundation.sessions.filter((s) => s.type === "review")).toHaveLength(2);
    expect(schedules.foundation.sessions.filter((s) => s.type === "rest")).toHaveLength(2);
  });
});

describe("practice / challenge 槽題目選取（US4 / R5）", () => {
  it("practice 為當週已引入 Concept 的過濾題目聯集（升冪、確定性）", () => {
    const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);
    const specs: ConceptSpec[] = [
      { id: "c0", module: "m0", topic: "t0", localOrder: 1, leetcode: [2] },
      { id: "c1", module: "m0", topic: "t0", localOrder: 2, leetcode: [1] },
    ];
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([makeProblem({ id: 1, difficulty: "Easy" }), makeProblem({ id: 2, difficulty: "Easy" })]);
    const params = makeParamsFile({ foundation: { maxLevel: 0, problemDifficulties: ["Easy"] } });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const practice = schedules.foundation.sessions.find((s) => s.type === "practice");
    expect(practice?.problemIds).toEqual([1, 2]); // 聯集去重後升冪，非宣告序
  });

  it("challenge 取涵蓋 Concept 中符合 challengeDifficulty 的 id 最小一題；無符合則省略 problemIds", () => {
    const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);
    const specs: ConceptSpec[] = [
      { id: "c0", module: "m0", topic: "t0", localOrder: 1, leetcode: [5] },
      { id: "c1", module: "m0", topic: "t0", localOrder: 2, leetcode: [3] },
    ];
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([
      makeProblem({ id: 5, difficulty: "Medium" }),
      makeProblem({ id: 3, difficulty: "Medium" }),
    ]);
    const params = makeParamsFile({ foundation: { maxLevel: 0, challengeDifficulty: "Medium" } });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const challenge = schedules.foundation.sessions.find((s) => s.type === "challenge");
    expect(challenge?.problemIds).toEqual([3]);

    const paramsNoMatch = makeParamsFile({ foundation: { maxLevel: 0, challengeDifficulty: "Hard" } });
    const noMatch = generateAllSchedules({ graph, bank, params: paramsNoMatch, overlays: makeOverlays() });
    const challengeNoMatch = noMatch.schedules.foundation.sessions.find((s) => s.type === "challenge");
    expect(challengeNoMatch?.problemIds).toBeUndefined();
  });

  it("challenge 候選池限於該槽之前已引入的 Concept，且跨週不重複", () => {
    const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);
    // 每輪 3 個 concept 槽（0,1,3），challenge 在槽 4；6 個 Concept 恰好跑滿 2 輪。
    const specs: ConceptSpec[] = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`,
      module: "m0",
      topic: "t0",
      localOrder: i + 1,
      leetcode: [100 - i * 10], // c0→100, c1→90, ... c5→50（宣告序與 id 升冪相反，凸顯選 min id）
    }));
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank(specs.map((s) => makeProblem({ id: s.leetcode![0]!, difficulty: "Medium" })));
    const params = makeParamsFile({ foundation: { maxLevel: 0, challengeDifficulty: "Medium" } });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const challenges = schedules.foundation.sessions.filter((s) => s.type === "challenge");
    expect(challenges).toHaveLength(2);
    // 第 1 輪 challenge 只能取自 c0/c1/c2（題號 100/90/80）→ min 80；MUST NOT 取到第 2 輪才教的 50。
    expect(challenges[0]?.problemIds).toEqual([80]);
    // 第 2 輪池擴到全部，min 未用過者為 50（不重複第 1 輪的 80）。
    expect(challenges[1]?.problemIds).toEqual([50]);
  });

  it("challenge 找不到符合難度的題目 → challenge-no-problem warning（不擋 CI）", () => {
    const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);
    const graph = buildGraph([{ id: "c0", module: "m0", topic: "t0", localOrder: 1 }], skeleton);
    const params = makeParamsFile({ foundation: { maxLevel: 0, challengeDifficulty: "Hard" } });
    const { violations } = generateAllSchedules({ graph, bank: buildBank([]), params, overlays: makeOverlays() });
    const warnings = violations.filter((v) => v.rule === "challenge-no-problem");
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.every((v) => v.severity === "warning")).toBe(true);
    expect(violations.filter((v) => v.severity === "error")).toEqual([]);
  });

  it("practice 的聯集亦納入 Overlay 的 extraProblemIds（疊加語意不因 Session 型別而異）", () => {
    const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);
    const specs: ConceptSpec[] = [
      { id: "c0", module: "m0", topic: "t0", localOrder: 1, leetcode: [2] },
      { id: "c1", module: "m0", topic: "t0", localOrder: 2, leetcode: [1] },
    ];
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([
      makeProblem({ id: 1, difficulty: "Easy" }),
      makeProblem({ id: 2, difficulty: "Easy" }),
      makeProblem({ id: 7, difficulty: "Hard" }), // 難度帶外，只能靠 Overlay 進來
    ]);
    const params = makeParamsFile({ foundation: { maxLevel: 0, problemDifficulties: ["Easy"] } });
    const overlays = makeOverlays({
      foundation: { track: "foundation", byConcept: { c0: { extraProblemIds: [7] } } },
    });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays });
    const practice = schedules.foundation.sessions.find((s) => s.type === "practice");
    expect(practice?.problemIds).toEqual([1, 2, 7]);
  });
});
