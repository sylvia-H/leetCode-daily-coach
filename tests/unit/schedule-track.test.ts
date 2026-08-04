import { describe, expect, it } from "vitest";
import { generateAllSchedules, TRACKS } from "../../src/compiler/schedule-generator.js";
import {
  buildBank,
  buildMultiLevelGraph,
  emptyOverlay,
  makeOverlays,
  makeParamsFile,
  makeProblem,
} from "../helpers/schedule.js";

/**
 * 本區塊驗證的是**生成器的分歧邏輯**，故一律使用 fixture，MUST NOT 讀真實的 `concepts/**`
 * 與 `curriculum/track-params.json`。
 *
 * 為何從真實資料改為 fixture（F7 定案 2026-07-31）：舊版以 `loadRealGenerateInput()` 讀活的課綱與
 * 參數，於是「三軌是否分歧」這種邏輯性質被綁死在「當下凍結的內容剛好長什麼樣」。F7 課綱定稿後
 * 三軌改為不同 `maxLevel`（§13.5），舊斷言「三份課表 conceptId 序完全相同」立刻失效——但失效的是
 * 斷言方式，不是被測邏輯。改用 fixture 才能穩定表達意圖，且不會每次調整課綱參數就得改測試。
 */
describe("三 Track 共用教材、難度帶分歧（US3 / SC-005）", () => {
  /** c0(m0/level0) → c1(m1/level1) → c2(m2/level2)，供 maxLevel 切出不同深度。 */
  function fixture(): { graph: ReturnType<typeof buildMultiLevelGraph>; bank: ReturnType<typeof buildBank> } {
    const graph = buildMultiLevelGraph();
    graph.concepts.get("c0")!.leetcode = [1, 26];
    graph.concepts.get("c1")!.leetcode = [303, 560];
    const bank = buildBank([
      makeProblem({ id: 1, difficulty: "Easy", patterns: ["m0"] }),
      makeProblem({ id: 26, difficulty: "Easy", patterns: ["m0"] }),
      makeProblem({ id: 27, difficulty: "Easy", patterns: ["m0"] }),
      makeProblem({ id: 303, difficulty: "Easy", patterns: ["m1"] }),
      makeProblem({ id: 560, difficulty: "Medium", patterns: ["m1"] }),
    ]);
    return { graph, bank };
  }

  it("涵蓋深度不同時，較淺 Track 的 conceptId 序 MUST 為較深 Track 的前綴（共用同一份 DAG，0 教材複製）", () => {
    // 憲章 VI：三軌共用教材與 DAG，分歧只在課表 / 難度帶 / 頻道。深度不同時，較淺者理應是較深者的
    // 前綴——若不是前綴，代表某軌用了不同的 Concept 順序，等同於複製出第二份課程結構。
    const { graph, bank } = fixture();
    const { schedules } = generateAllSchedules({
      graph,
      bank,
      params: makeParamsFile({
        foundation: { maxLevel: 0 },
        interviewReady: { maxLevel: 1 },
        interviewMastery: { maxLevel: 2 },
      }),
      overlays: makeOverlays(),
    });
    const seqOf = (t: (typeof TRACKS)[number]): string[] =>
      schedules[t].sessions.map((s) => s.conceptId).filter((id): id is string => id !== undefined);

    const shallow = seqOf("foundation");
    const mid = seqOf("interviewReady");
    const deep = seqOf("interviewMastery");

    expect(mid.slice(0, shallow.length)).toEqual(shallow);
    expect(deep.slice(0, mid.length)).toEqual(mid);
    // 深度確實遞增（否則三者相同時，前綴檢查會空洞地通過）
    expect(shallow.length).toBeLessThan(mid.length);
    expect(mid.length).toBeLessThan(deep.length);
  });

  it("同一 Concept 依 Track 難度帶分歧（c1 的 [303 Easy, 560 Medium] 各取所需）", () => {
    const { graph, bank } = fixture();
    const { schedules } = generateAllSchedules({
      graph,
      bank,
      params: makeParamsFile({
        foundation: { problemDifficulties: ["Easy"] },
        interviewReady: { problemDifficulties: ["Easy", "Medium"] },
        interviewMastery: { problemDifficulties: ["Medium", "Hard"] },
      }),
      overlays: makeOverlays(),
    });
    const problemIdsOf = (track: (typeof TRACKS)[number]): number[] =>
      schedules[track].sessions.find((s) => s.conceptId === "c1")?.problemIds ?? [];

    expect(problemIdsOf("foundation")).toEqual([303]);
    expect(problemIdsOf("interviewReady")).toEqual([303, 560]);
    expect(problemIdsOf("interviewMastery")).toEqual([560]);
  });

  it("Overlay 的 extraProblemIds MUST 疊加而非取代 Core 題目", () => {
    const { graph, bank } = fixture();
    const { schedules } = generateAllSchedules({
      graph,
      bank,
      params: makeParamsFile({ foundation: { problemDifficulties: ["Easy"] } }),
      overlays: makeOverlays({
        foundation: { track: "foundation", byConcept: { c0: { extraProblemIds: [27] } } },
      }),
    });
    expect(schedules.foundation.sessions.find((s) => s.conceptId === "c0")?.problemIds).toEqual([1, 26, 27]);
  });

  it("合法 fixture 輸入 → 無 error 級違規", () => {
    const { graph, bank } = fixture();
    const { violations } = generateAllSchedules({
      graph,
      bank,
      params: makeParamsFile(),
      overlays: makeOverlays(),
    });
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
    // 空題庫下 practice/challenge/review 三槽必然無題，會留下對應的 warning 訊號（F8 FR-014e/f）；
    // 此案例要驗的是無 error、且違規全部落在已知的「無題」warning rule 集合內。
    const knownNoProblemRules = new Set(["practice-no-problem", "challenge-no-problem", "review-no-problem"]);
    expect(violations.filter((v) => v.severity === "error")).toEqual([]);
    expect(violations.every((v) => v.severity === "warning")).toBe(true);
    expect(violations.every((v) => knownNoProblemRules.has(v.rule))).toBe(true);
  });
});
