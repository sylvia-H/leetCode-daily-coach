import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import matter from "gray-matter";
import { afterEach, describe, expect, it } from "vitest";
import {
  appendProblemsToSkeleton,
  buildSupplementPrompt,
  collectNeeds,
  findMissingBands,
  type DifficultyOf,
} from "../../scripts/supplement-problems.js";
import type { ConceptNode } from "../../src/types/curriculum.js";

/** 題號 → 難度的測試替身（對應真實題庫：27 Easy、239 Hard、739 Medium…）。 */
const difficultyOf: DifficultyOf = (id) =>
  ({ 26: "Easy", 27: "Easy", 239: "Hard", 739: "Medium", 704: "Medium" })[id] as ReturnType<DifficultyOf>;

// 回傳型別明確標註為 ConceptNode（不用 `as` 斷言）：漏欄位或型別不符會由 tsc 當場擋下，
// 而非在執行期才以難解的方式失敗。
function concept(overrides: Partial<ConceptNode> = {}): ConceptNode {
  return {
    id: "some-concept",
    title: "Some Concept",
    module: "array",
    topic: "array",
    difficulty: "easy",
    estimatedMinutes: 10,
    patternLabel: "Linear Scan",
    complexityLabel: "O(n) / O(1)",
    prerequisite: [],
    next: [],
    learningGoal: ["g"],
    exitCriteria: ["e"],
    leetcode: [27],
    tags: [],
    localOrder: 1,
    skeletonPath: "concepts/array/001-some-concept.md",
    articlePath: "articles/array/001-some-concept.md",
    dirName: "array",
    ...overrides,
  };
}

describe("findMissingBands（判斷 Concept 缺哪個難度帶）", () => {
  it("只有 Easy 題 → 缺 high（Medium/Hard 軌拿不到題）", () => {
    expect(findMissingBands([27], difficultyOf)).toEqual(["high"]);
  });

  it("只有 Medium 題 → 缺 low（Foundation 拿不到題）", () => {
    expect(findMissingBands([739], difficultyOf)).toEqual(["low"]);
  });

  it("只有 Hard 題 → 缺 low（Hard 屬 high 帶）", () => {
    expect(findMissingBands([239], difficultyOf)).toEqual(["low"]);
  });

  it("已跨兩帶 → 不缺", () => {
    expect(findMissingBands([27, 739], difficultyOf)).toEqual([]);
  });

  it("題號查不到難度（不在題庫）→ 視為未覆蓋任何帶", () => {
    expect(findMissingBands([99999], difficultyOf)).toEqual(["low", "high"]);
  });
});

describe("collectNeeds（掃出待補清單）", () => {
  it("`leetcode: []` 的「無題目觀念課」MUST 略過（spec §12.1 一等合法狀態，不得硬塞題目）", () => {
    const needs = collectNeeds([concept({ id: "mindset", leetcode: [] })], difficultyOf);
    expect(needs).toEqual([]);
  });

  it("已有 3 題（上限）→ 即使只落在單一帶也不再補（不得突破 §12.1 的 1–3 題）", () => {
    const needs = collectNeeds([concept({ leetcode: [27, 26, 739] })], difficultyOf);
    expect(needs).toEqual([]);
  });

  it("1 題且只落單帶 → 列入待補，slots = 2", () => {
    const needs = collectNeeds([concept({ leetcode: [739] })], difficultyOf);
    expect(needs).toHaveLength(1);
    expect(needs[0]?.missing).toEqual(["low"]);
    expect(needs[0]?.slots).toBe(2);
  });

  it("迴歸：difficultyOf 以函式傳入，不再用 ProblemBank↔ProblemBankFile 硬轉型", () => {
    // 初版誤用 `as unknown as ProblemBankFile` 把 loadProblemBank 的 `{ byId: Map }` 當成
    // plain object 取值，型別檢查被蓋掉、查值一律 undefined，導致 165 個 Concept 全被誤判為
    // 兩帶皆缺。此測試確保取值路徑由呼叫端明確提供。
    const viaMap = new Map<number, { difficulty: "Easy" | "Medium" | "Hard" }>([[27, { difficulty: "Easy" }]]);
    const fromMap: DifficultyOf = (id) => viaMap.get(id)?.difficulty;
    expect(findMissingBands([27], fromMap)).toEqual(["high"]);
  });
});

describe("buildSupplementPrompt（純函式，只組字串）", () => {
  it("列出現有題目與其難度，並標明要補的帶與可加題數", () => {
    const needs = collectNeeds([concept({ id: "stack-daily", leetcode: [739] })], difficultyOf);
    const prompt = buildSupplementPrompt("Stack", "stack", needs, difficultyOf);
    expect(prompt).toContain("stack-daily");
    expect(prompt).toContain("739(Medium)");
    expect(prompt).toContain("low = Easy 難度");
    expect(prompt).toContain("最多再加 2 題");
  });

  it("MUST 明講「沒有合適題目就別補」——遺漏遠比亂補好（避免湊數給不相干的題）", () => {
    const needs = collectNeeds([concept({ leetcode: [739] })], difficultyOf);
    const prompt = buildSupplementPrompt("Stack", "stack", needs, difficultyOf);
    expect(prompt).toContain("就不要為它補題");
    expect(prompt).toContain("遺漏遠比亂補好");
  });
});

describe("appendProblemsToSkeleton（純追加，不動既有欄位與正文）", () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function writeSkeleton(): string {
    dir = mkdtempSync(join(tmpdir(), "supplement-test-"));
    mkdirSync(join(dir, "array"), { recursive: true });
    const path = join(dir, "array", "001-some-concept.md");
    writeFileSync(
      path,
      [
        "---",
        "id: some-concept",
        "title: Some Concept",
        "module: array",
        "topic: array",
        "difficulty: easy",
        "estimated_minutes: 10",
        "pattern_label: Linear Scan",
        "complexity_label: O(n) / O(1)",
        "prerequisite: []",
        "next: []",
        "learning_goal:\n  - g",
        "exit_criteria:\n  - e",
        "leetcode:\n  - 27",
        "tags: []",
        "---",
        "",
        "## Author Hints",
        "",
        "- 核心觀念：原有的核心觀念",
        "- 題號 27 為何適合此 Pattern：原有的說明",
        "",
      ].join("\n"),
      "utf-8",
    );
    return path;
  }

  it("追加題號到 frontmatter 並在 Author Hints 尾端補上對應說明", () => {
    const path = writeSkeleton();
    appendProblemsToSkeleton(path, [{ id: 739, whyThisPattern: "單調堆疊的進階變化" }]);

    const { data, content } = matter(readFileSync(path, "utf-8"));
    expect(data.leetcode).toEqual([27, 739]);
    expect(content).toContain("- 題號 27 為何適合此 Pattern：原有的說明");
    expect(content).toContain("- 題號 739 為何適合此 Pattern：單調堆疊的進階變化");
    // 既有欄位與 Hints 原樣保留
    expect(data.id).toBe("some-concept");
    expect(data.pattern_label).toBe("Linear Scan");
    expect(content).toContain("- 核心觀念：原有的核心觀念");
  });

  it("題號已存在 → 不重複追加（冪等）", () => {
    const path = writeSkeleton();
    appendProblemsToSkeleton(path, [{ id: 27, whyThisPattern: "重複的" }]);
    const { data, content } = matter(readFileSync(path, "utf-8"));
    expect(data.leetcode).toEqual([27]);
    expect(content).not.toContain("重複的");
  });

  it("空清單 → 完全不動檔案", () => {
    const path = writeSkeleton();
    const before = readFileSync(path, "utf-8");
    appendProblemsToSkeleton(path, []);
    expect(readFileSync(path, "utf-8")).toBe(before);
  });
});
