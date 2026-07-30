import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { conceptToMarkdown, normalizeDraftConcept, normalizeDraftConcepts, parseDraftResponse } from "../../scripts/generate-curriculum.js";
import type { DraftConcept } from "../../scripts/lib/prompts/stage1-curriculum.js";

function sampleDraft(overrides: Partial<DraftConcept> = {}): DraftConcept {
  return {
    slug: "array-traversal",
    title: "Array Traversal",
    difficulty: "easy",
    estimated_minutes: 12,
    pattern_label: "Linear Scan",
    complexity_label: "O(n) / O(1)",
    prerequisite: [],
    next: ["in-place-operations"],
    learning_goal: ["能以單次線性走訪處理一維陣列"],
    exit_criteria: ["能用一次迴圈求極值"],
    leetcode_candidates: [1, 26],
    tags: ["array", "traversal"],
    author_hints: {
      core_idea: "一次走訪維護狀態",
      pattern_recognition: "需要對每個元素做一次處理",
      thinking: "先想清楚要維護什麼累積狀態",
      common_mistakes: "忘記處理邊界",
      ts_notes: "善用 for...of",
      py_notes: "善用 enumerate",
      leetcode_hints: [
        { id: 1, whyThisPattern: "單次走訪配合 hash map" },
        { id: 26, whyThisPattern: "原地移動指標" },
      ],
    },
    ...overrides,
  };
}

describe("parseDraftResponse（Stage 1 LLM 回應解析）", () => {
  it("解析合法 JSON（含 concepts 陣列）", () => {
    const raw = JSON.stringify({ concepts: [sampleDraft()] });
    const result = parseDraftResponse(raw);
    expect(result.concepts).toHaveLength(1);
    expect(result.concepts[0]?.slug).toBe("array-traversal");
  });

  it("剝除 ```json fence 後解析", () => {
    const raw = "```json\n" + JSON.stringify({ concepts: [] }) + "\n```";
    expect(parseDraftResponse(raw).concepts).toEqual([]);
  });

  it("非合法 JSON → 具名 stage1-parse-error", () => {
    expect(() => parseDraftResponse("not json at all")).toThrow("stage1-parse-error");
  });

  it("缺 concepts 陣列 → 具名 stage1-parse-error", () => {
    expect(() => parseDraftResponse(JSON.stringify({ foo: "bar" }))).toThrow("stage1-parse-error");
  });
});

describe("normalizeDraftConcept（防禦 LLM 回應漏欄位，避免 conceptToMarkdown/gray-matter 對 undefined 崩潰）", () => {
  it("完整且合法的回應：原樣通過（不遺失任何欄位）", () => {
    const raw = sampleDraft();
    const result = normalizeDraftConcept(raw, "array", 0);
    expect(result).toEqual(raw);
  });

  it("缺少必要純量欄位（如 pattern_label）→ 具名 stage1-parse-error（觸發該 Topic 重新起草）", () => {
    const raw = { ...sampleDraft(), pattern_label: undefined };
    expect(() => normalizeDraftConcept(raw, "array", 2)).toThrow(/stage1-parse-error.*array.*第 3 個.*pattern_label/);
  });

  it("difficulty 不是 easy/medium → 具名 stage1-parse-error", () => {
    const raw = { ...sampleDraft(), difficulty: "hard" };
    expect(() => normalizeDraftConcept(raw, "array", 0)).toThrow(/stage1-parse-error.*difficulty/);
  });

  it("estimated_minutes 缺漏或非正數 → 具名 stage1-parse-error", () => {
    expect(() => normalizeDraftConcept({ ...sampleDraft(), estimated_minutes: undefined }, "array", 0)).toThrow(
      /stage1-parse-error.*estimated_minutes/,
    );
    expect(() => normalizeDraftConcept({ ...sampleDraft(), estimated_minutes: -1 }, "array", 0)).toThrow(
      /stage1-parse-error.*estimated_minutes/,
    );
  });

  it("prerequisite/next/tags/learning_goal/exit_criteria/leetcode_candidates 缺漏 → 安全預設為空陣列（不崩潰，語意上合法為空）", () => {
    const raw = sampleDraft() as unknown as Record<string, unknown>;
    delete raw.prerequisite;
    delete raw.next;
    delete raw.tags;
    delete raw.learning_goal;
    delete raw.exit_criteria;
    delete raw.leetcode_candidates;
    const result = normalizeDraftConcept(raw, "array", 0);
    expect(result.prerequisite).toEqual([]);
    expect(result.next).toEqual([]);
    expect(result.tags).toEqual([]);
    expect(result.learning_goal).toEqual([]);
    expect(result.exit_criteria).toEqual([]);
    expect(result.leetcode_candidates).toEqual([]);
    // 正規化後可安全序列化（原本這正是造成 YAMLException 的實測崩潰情境）
    expect(() => conceptToMarkdown(result, "array", "array")).not.toThrow();
  });

  it("author_hints 整段缺漏 → 安全預設為空字串/空陣列（不崩潰）", () => {
    const raw = { ...sampleDraft(), author_hints: undefined };
    const result = normalizeDraftConcept(raw, "array", 0);
    expect(result.author_hints).toEqual({
      core_idea: "",
      pattern_recognition: "",
      thinking: "",
      common_mistakes: "",
      ts_notes: "",
      py_notes: "",
      leetcode_hints: [],
    });
    expect(() => conceptToMarkdown(result, "array", "array")).not.toThrow();
  });

  it("author_hints 內單一欄位缺漏（如 core_idea）→ 該欄位預設空字串，其餘保留", () => {
    const raw = sampleDraft();
    const hints = { ...raw.author_hints } as Record<string, unknown>;
    delete hints.core_idea;
    const result = normalizeDraftConcept({ ...raw, author_hints: hints }, "array", 0);
    expect(result.author_hints.core_idea).toBe("");
    expect(result.author_hints.thinking).toBe(raw.author_hints.thinking);
  });

  it("normalizeDraftConcepts：整批處理，保留順序，任一筆缺必要欄位即整批 throw（該 Topic 不寫入任何檔案）", () => {
    const good = sampleDraft({ slug: "a" });
    const bad = { ...sampleDraft({ slug: "b" }), title: undefined };
    expect(() => normalizeDraftConcepts([good, bad], "array")).toThrow("stage1-parse-error");
  });
});

describe("conceptToMarkdown（DraftConcept → Skeleton markdown）", () => {
  it("產出可被 gray-matter 解析回相同 frontmatter 欄位", () => {
    const draft = sampleDraft();
    const markdown = conceptToMarkdown(draft, "array", "array");
    const { data, content } = matter(markdown);

    expect(data).toMatchObject({
      id: "array-traversal",
      title: "Array Traversal",
      module: "array",
      topic: "array",
      difficulty: "easy",
      estimated_minutes: 12,
      pattern_label: "Linear Scan",
      complexity_label: "O(n) / O(1)",
      prerequisite: [],
      next: ["in-place-operations"],
      leetcode: [1, 26],
      tags: ["array", "traversal"],
    });
    expect(content).toContain("## Author Hints");
    expect(content).toContain("題號 1 為何適合此 Pattern：單次走訪配合 hash map");
    expect(content).toContain("題號 26 為何適合此 Pattern：原地移動指標");
  });

  it("leetcode_candidates 為空陣列時 frontmatter.leetcode 亦為空陣列（一等合法狀態）", () => {
    const draft = sampleDraft({ leetcode_candidates: [], author_hints: { ...sampleDraft().author_hints, leetcode_hints: [] } });
    const { data } = matter(conceptToMarkdown(draft, "array", "array"));
    expect(data.leetcode).toEqual([]);
  });
});
