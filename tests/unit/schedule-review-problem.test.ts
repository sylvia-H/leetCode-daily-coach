// F8：review 槽選題（FR-016–FR-020a、research R3/R4，contracts/schedule-revision.md §3）。
// 候選池 = 課表已寫入的 weekProblemIds（MUST NOT 重算）；排序鍵＝難度（Easy<Medium<Hard）＋同難度
// 題號升冪；對同週 challenge 題號軟排除；候選池為空則省略欄位並警告。
import { describe, expect, it } from "vitest";
import { generateAllSchedules } from "../../src/compiler/schedule-generator.js";
import { buildBank, makeOverlays, makeParamsFile, makeProblem } from "../helpers/schedule.js";
import { buildGraph, skeletonOf, type ConceptSpec } from "../helpers/curriculum.js";

const skeleton = skeletonOf([{ id: "m0", topics: ["t0"] }]);

describe("review 槽選題（F8 FR-016–FR-020a）", () => {
  it("最低難度優先，同難度取最小題號（challengeDifficulty 不影響此結果）", () => {
    const specs: ConceptSpec[] = [
      { id: "c0", module: "m0", topic: "t0", localOrder: 1, leetcode: [10] },
      { id: "c1", module: "m0", topic: "t0", localOrder: 2, leetcode: [5] },
      { id: "c2", module: "m0", topic: "t0", localOrder: 3, leetcode: [3] },
    ];
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([
      makeProblem({ id: 10, difficulty: "Medium" }),
      makeProblem({ id: 5, difficulty: "Easy" }),
      makeProblem({ id: 3, difficulty: "Easy" }),
    ]);
    const params = makeParamsFile({
      foundation: {
        maxLevel: 0,
        problemDifficulties: ["Easy", "Medium"],
        challengeDifficulty: "Hard", // 刻意設為不相干值，驗證 review 選題不受影響
        rhythm: ["concept", "concept", "concept", "review"],
      },
    });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const review = schedules.foundation.sessions.find((s) => s.type === "review");
    expect(review?.problemIds).toEqual([3]); // Easy 中最小 id（非 Medium 的 10，也非 Easy 的 5）
  });

  it("軟排除同週 challenge 題號：候選池排除後仍非空 → 取排除後的最小者", () => {
    const specs: ConceptSpec[] = [
      { id: "c0", module: "m0", topic: "t0", localOrder: 1, leetcode: [7] },
      { id: "c1", module: "m0", topic: "t0", localOrder: 2, leetcode: [9] },
    ];
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([
      makeProblem({ id: 7, difficulty: "Easy" }),
      makeProblem({ id: 9, difficulty: "Easy" }),
    ]);
    const params = makeParamsFile({
      foundation: {
        maxLevel: 0,
        problemDifficulties: ["Easy"],
        challengeDifficulty: "Easy",
        rhythm: ["concept", "concept", "challenge", "review"],
      },
    });
    const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const challenge = schedules.foundation.sessions.find((s) => s.type === "challenge");
    const review = schedules.foundation.sessions.find((s) => s.type === "review");
    expect(challenge?.problemIds).toEqual([7]); // challenge 取最小 id
    expect(review?.problemIds).toEqual([9]); // review 排除 7 後只剩 9
    expect(violations.some((v) => v.rule === "review-challenge-duplicate")).toBe(false);
  });

  it("軟排除後池變空、原池非空 → 退回原池並標記 review-challenge-duplicate", () => {
    const specs: ConceptSpec[] = [{ id: "c0", module: "m0", topic: "t0", localOrder: 1, leetcode: [7] }];
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([makeProblem({ id: 7, difficulty: "Easy" })]);
    const params = makeParamsFile({
      foundation: {
        maxLevel: 0,
        problemDifficulties: ["Easy"],
        challengeDifficulty: "Easy",
        rhythm: ["concept", "challenge", "review"],
      },
    });
    const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const challenge = schedules.foundation.sessions.find((s) => s.type === "challenge");
    const review = schedules.foundation.sessions.find((s) => s.type === "review");
    expect(challenge?.problemIds).toEqual([7]);
    expect(review?.problemIds).toEqual([7]); // 唯一候選與 challenge 撞號，退回允許重複
    const warning = violations.find((v) => v.rule === "review-challenge-duplicate");
    expect(warning?.severity).toBe("warning");
    expect(warning?.subject).toBe(`foundation:session-${review!.sessionIndex}`);
  });

  it("候選池為空 → 省略 problemIds（非 []）並標記 review-no-problem", () => {
    const specs: ConceptSpec[] = [{ id: "c0", module: "m0", topic: "t0", localOrder: 1 }]; // leetcode 預設空
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([]);
    const params = makeParamsFile({
      foundation: { maxLevel: 0, rhythm: ["concept", "review"] },
    });
    const { schedules, violations } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    const review = schedules.foundation.sessions.find((s) => s.type === "review");
    expect(review?.problemIds).toBeUndefined();
    expect("problemIds" in review!).toBe(false);
    expect(violations.some((v) => v.rule === "review-no-problem")).toBe(true);
  });

  it("review 的 problemIds 長度恆為 1 或缺席（不可能為 0 長度陣列或 >1）", () => {
    const specs: ConceptSpec[] = [
      { id: "c0", module: "m0", topic: "t0", localOrder: 1, leetcode: [1, 2, 3] },
    ];
    const graph = buildGraph(specs, skeleton);
    const bank = buildBank([
      makeProblem({ id: 1, difficulty: "Easy" }),
      makeProblem({ id: 2, difficulty: "Easy" }),
      makeProblem({ id: 3, difficulty: "Easy" }),
    ]);
    const params = makeParamsFile({
      foundation: { maxLevel: 0, problemDifficulties: ["Easy"], rhythm: ["concept", "review"] },
    });
    const { schedules } = generateAllSchedules({ graph, bank, params, overlays: makeOverlays() });
    for (const s of schedules.foundation.sessions) {
      if (s.type !== "review") continue;
      expect(s.problemIds === undefined || s.problemIds.length === 1).toBe(true);
    }
  });
});
