// F8：無題槽跳過（FR-014e/f/g/g1，contracts/schedule-revision.md §2）。
// practice / challenge 算出空 problemIds 時 MUST 跳過（不產生 Session、不消耗 sessionIndex）；
// review MUST 一律產生；跳過後 reviewRange 仍正確涵蓋該週全部 concept Session。
import { describe, expect, it } from "vitest";
import { generateAllSchedules } from "../../src/compiler/schedule-generator.js";
import { buildBank, makeOverlays, makeParamsFile, makeProblem } from "../helpers/schedule.js";
import { buildGraph, skeletonOf, type ConceptSpec } from "../helpers/curriculum.js";

describe("無題槽跳過（F8 FR-014e/f/g/g1）", () => {
  const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);
  const specs: ConceptSpec[] = [
    { id: "c0", module: "m0", topic: "t0", localOrder: 1 }, // leetcode 預設空
    { id: "c1", module: "m0", topic: "t0", localOrder: 2 },
  ];
  const graph = buildGraph(specs, skeleton);
  const bank = buildBank([]); // 空題庫 ⇒ practice / challenge 候選池必為空
  const params = makeParamsFile({
    foundation: {
      maxLevel: 0,
      rhythm: ["concept", "concept", "practice", "challenge", "review"],
    },
  });
  const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
  const foundation = schedules.foundation;

  it("practice 空池 → 不產生 Session、不消耗 sessionIndex", () => {
    expect(foundation.sessions.filter((s) => s.type === "practice")).toHaveLength(0);
  });

  it("challenge 空池 → 不產生 Session、不消耗 sessionIndex", () => {
    expect(foundation.sessions.filter((s) => s.type === "challenge")).toHaveLength(0);
  });

  it("review 仍一律產生，sessionIndex 於跳過後連續無缺口", () => {
    const reviews = foundation.sessions.filter((s) => s.type === "review");
    expect(reviews).toHaveLength(1);
    // rhythm 5 槽：concept(1) concept(2) practice(跳過) challenge(跳過) review(3)
    expect(foundation.sessions.map((s) => [s.sessionIndex, s.type])).toEqual([
      [1, "concept"],
      [2, "concept"],
      [3, "review"],
    ]);
  });

  it("跳過後 reviewRange 仍正確涵蓋該週全部 concept Session", () => {
    const review = foundation.sessions.find((s) => s.type === "review");
    expect(review?.reviewRange).toEqual([1, 2]);
  });

  it("practice-no-problem 與 challenge-no-problem 的 subject 為 week-N-slot-M（非 session-N），且可互相區分", () => {
    const practiceWarning = violations.find((v) => v.rule === "practice-no-problem");
    const challengeWarning = violations.find((v) => v.rule === "challenge-no-problem");
    expect(practiceWarning?.subject).toBe("foundation:week-1-slot-3");
    expect(challengeWarning?.subject).toBe("foundation:week-1-slot-4");
    expect(practiceWarning?.severity).toBe("warning");
    expect(challengeWarning?.severity).toBe("warning");
  });

  it("review 無題時發出 review-no-problem，subject 沿用 session-N（review 為真實存在的 Session）", () => {
    const reviewWarning = violations.find((v) => v.rule === "review-no-problem");
    expect(reviewWarning?.subject).toBe("foundation:session-3");
    expect(reviewWarning?.severity).toBe("warning");
  });

  it("已引入 Concept 清單與已用 challenge 題號集合不受跳過影響（下一輪仍照常累積判斷）", () => {
    // 兩個 Concept 皆已被引入（即使 challenge 因無題被跳過，累積仍需正常運作，於後續 Concept
    // 有題時的 challenge 選取才不會漏算已引入範圍）——以第二個 Track 混一顆有題 Concept 驗證。
    const specsWithProblem: ConceptSpec[] = [
      { id: "c0", module: "m0", topic: "t0", localOrder: 1 },
      { id: "c1", module: "m0", topic: "t0", localOrder: 2, leetcode: [1] },
    ];
    const graph2 = buildGraph(specsWithProblem, skeleton);
    const bank2 = buildBank([makeProblem({ id: 1, difficulty: "Easy" })]);
    const params2 = makeParamsFile({
      foundation: {
        maxLevel: 0,
        challengeDifficulty: "Easy",
        rhythm: ["concept", "concept", "challenge", "review"],
      },
    });
    const { schedules: s2 } = generateAllSchedules({ graph: graph2, bank: bank2, params: params2, overlays: makeOverlays() });
    const challenge = s2.foundation.sessions.find((s) => s.type === "challenge");
    expect(challenge?.problemIds).toEqual([1]);
  });
});
