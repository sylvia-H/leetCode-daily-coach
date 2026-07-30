import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { conceptToMarkdown, parseDraftResponse } from "../../scripts/generate-curriculum.js";
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
