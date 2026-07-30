import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import matter from "gray-matter";
import { afterEach, describe, expect, it } from "vitest";
import { validModules } from "../helpers/curriculum.js";
import {
  conceptToMarkdown,
  draftTopicWithRetry,
  filterPriorConceptIds,
  normalizeDraftConcept,
  normalizeDraftConcepts,
  ordinalIsBefore,
  parseDraftResponse,
  patchConceptEdgeField,
  repairReciprocalEdges,
  type KnownConceptPosition,
} from "../../scripts/generate-curriculum.js";
import { createLlmClient, type GenAiLike } from "../../scripts/lib/llm-client.js";
import { Throttle } from "../../scripts/lib/throttle.js";
import type { Ordinal } from "../../src/types/curriculum.js";
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

describe("draftTopicWithRetry（同 Topic 內重試，實測「string」Topic 踩過的偶發 JSON 語法錯誤）", () => {
  function fakeGenAi(generateContent: GenAiLike["models"]["generateContent"]): GenAiLike {
    return { models: { generateContent } };
  }

  it("第一次就成功 → 不重試，回傳 concepts", async () => {
    const validRaw = JSON.stringify({ concepts: [sampleDraft()] });
    let calls = 0;
    const llmClient = createLlmClient(
      { GEMINI_API_KEY: "key" },
      {
        genAiFactory: () =>
          fakeGenAi(async () => {
            calls++;
            return { text: validRaw };
          }),
        throttle: new Throttle({ rpmLimit: Infinity }),
      },
    );

    const result = await draftTopicWithRetry(llmClient, "array", "Array", "array", "Array", []);

    expect(result.concepts).toHaveLength(1);
    expect(result.error).toBeUndefined();
    expect(calls).toBe(1);
  });

  it("前兩次回應是壞掉的 JSON，第三次才合法 → 重試後成功（同一 Topic 內解決，不需整批重跑）", async () => {
    const validRaw = JSON.stringify({ concepts: [sampleDraft()] });
    let calls = 0;
    const llmClient = createLlmClient(
      { GEMINI_API_KEY: "key" },
      {
        genAiFactory: () =>
          fakeGenAi(async () => {
            calls++;
            return { text: calls < 3 ? "{ not valid json" : validRaw };
          }),
        throttle: new Throttle({ rpmLimit: Infinity }),
      },
    );

    const result = await draftTopicWithRetry(llmClient, "array", "Array", "array", "Array", []);

    expect(result.concepts).toHaveLength(1);
    expect(calls).toBe(3);
  });

  it("重試耗盡（MAX_DRAFT_ATTEMPTS 次皆失敗）→ 回傳 error，不 throw（供呼叫端單篇隔離）", async () => {
    let calls = 0;
    const llmClient = createLlmClient(
      { GEMINI_API_KEY: "key" },
      {
        genAiFactory: () =>
          fakeGenAi(async () => {
            calls++;
            return { text: "{ not valid json" };
          }),
        throttle: new Throttle({ rpmLimit: Infinity }),
      },
    );

    const result = await draftTopicWithRetry(llmClient, "string", "String", "string", "String", []);

    expect(result.concepts).toBeUndefined();
    expect(result.error).toContain("stage1-parse-error");
    expect(calls).toBe(3);
  });
});

describe("filterPriorConceptIds（priorConceptIds 只含宣告序不晚於目前 Topic 者，防 forward-dependency）", () => {
  function known(entries: Record<string, KnownConceptPosition>): Map<string, KnownConceptPosition> {
    return new Map(Object.entries(entries));
  }

  it("排除宣告序更晚的 Module（實測踩過：programming-mindset 把 array 的 Concept 當 prerequisite）", () => {
    const map = known({
      "time-space-complexity": { moduleIndex: 0, topicIndex: 0 },
      "array-traversal": { moduleIndex: 1, topicIndex: 0 },
    });
    // 目前正在起草 module 0（programming-mindset）的 topic 0
    expect(filterPriorConceptIds(map, 0, 0)).toEqual(["time-space-complexity"]);
  });

  it("同 Module 但宣告序更晚的 Topic 也排除", () => {
    const map = known({
      "a": { moduleIndex: 0, topicIndex: 0 },
      "b": { moduleIndex: 0, topicIndex: 1 },
    });
    expect(filterPriorConceptIds(map, 0, 0)).toEqual(["a"]);
  });

  it("同 Module 同 Topic（既存 stub）納入，因為屬於「本次一起草」的同一個 Topic", () => {
    const map = known({ "existing-one": { moduleIndex: 0, topicIndex: 0 } });
    expect(filterPriorConceptIds(map, 0, 0)).toEqual(["existing-one"]);
  });

  it("宣告序更早的 Module 全數納入", () => {
    const map = known({
      "a": { moduleIndex: 0, topicIndex: 0 },
      "b": { moduleIndex: 1, topicIndex: 0 },
    });
    expect(filterPriorConceptIds(map, 2, 0)).toEqual(["a", "b"]);
  });
});

describe("patchConceptEdgeField（雙向邊補齊：既存 Concept 的 next 反映新篇的 prerequisite）", () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function writeConceptFile(path: string, next: string): void {
    writeFileSync(
      path,
      [
        "---",
        "id: existing-one",
        "title: Existing One",
        "module: m",
        "topic: t",
        "difficulty: easy",
        "estimated_minutes: 10",
        "pattern_label: P",
        "complexity_label: O(n)",
        "prerequisite: []",
        next,
        "learning_goal:\n  - g",
        "exit_criteria:\n  - e",
        "leetcode: []",
        "tags: []",
        "---",
        "",
        "## Author Hints",
        "",
        "- 保留這段本文，補邊時不應被更動",
      ].join("\n"),
      "utf-8",
    );
  }

  it("既存 Concept 的 next 缺少新篇 id → 補上（保留其餘欄位與本文不變）", () => {
    dir = mkdtempSync(join(tmpdir(), "patch-next-test-"));
    const filePath = join(dir, "001-existing-one.md");
    writeConceptFile(filePath, "next: []");

    patchConceptEdgeField(filePath, "next", ["new-concept"]);

    const parsed = matter(readFileSync(filePath, "utf-8"));
    expect(parsed.data.next).toEqual(["new-concept"]);
    expect(parsed.data.id).toBe("existing-one"); // 其餘欄位不變
    expect(parsed.content).toContain("保留這段本文，補邊時不應被更動");
  });

  it("既存 Concept 的 next 已含新篇 id → 不重複新增（冪等）", () => {
    dir = mkdtempSync(join(tmpdir(), "patch-next-test-"));
    const filePath = join(dir, "001-existing-one.md");
    writeConceptFile(filePath, "next: [new-concept]");

    patchConceptEdgeField(filePath, "next", ["new-concept"]);

    const parsed = matter(readFileSync(filePath, "utf-8"));
    expect(parsed.data.next).toEqual(["new-concept"]);
  });

  it("實測踩過的崩潰：F2 stub 種子帶有 frontmatter 之前的 <!-- --> 前導註解，patch 後 frontmatter MUST NOT 被降級為純文字內文", () => {
    dir = mkdtempSync(join(tmpdir(), "patch-next-test-"));
    const filePath = join(dir, "001-existing-one.md");
    writeFileSync(
      filePath,
      [
        "<!-- F2 stub seed，F7 內容產線上線後由生成物取代（FR-027） -->",
        "---",
        "id: existing-one",
        "title: Existing One",
        "module: m",
        "topic: t",
        "difficulty: easy",
        "estimated_minutes: 10",
        "pattern_label: P",
        "complexity_label: O(n)",
        "prerequisite: []",
        "next: []",
        "learning_goal:\n  - g",
        "exit_criteria:\n  - e",
        "leetcode: []",
        "tags: []",
        "---",
        "",
        "## Author Hints",
        "",
        "- 保留這段本文，補邊時不應被更動",
      ].join("\n"),
      "utf-8",
    );

    patchConceptEdgeField(filePath, "next", ["new-concept"]);

    const parsed = matter(readFileSync(filePath, "utf-8"));
    // 修好前：gray-matter 找不到落在字串開頭的 ---，整份 frontmatter 被誤判為純文字，
    // 所有欄位（id/title/...）因而從 parsed.data 消失。
    expect(parsed.data.id).toBe("existing-one");
    expect(parsed.data.title).toBe("Existing One");
    expect(parsed.data.next).toEqual(["new-concept"]);
    expect(parsed.content).toContain("保留這段本文，補邊時不應被更動");
  });
});

describe("ordinalIsBefore（純函式，Ordinal 嚴格早於比較）", () => {
  function ord(overrides: Partial<Ordinal> = {}): Ordinal {
    return { moduleIndex: 0, topicIndex: 0, localOrder: 0, id: "x", ...overrides };
  }

  it("moduleIndex 較小 → true", () => {
    expect(ordinalIsBefore(ord({ moduleIndex: 0 }), ord({ moduleIndex: 1 }))).toBe(true);
  });
  it("moduleIndex 較大 → false", () => {
    expect(ordinalIsBefore(ord({ moduleIndex: 1 }), ord({ moduleIndex: 0 }))).toBe(false);
  });
  it("同 module，topicIndex 較小 → true", () => {
    expect(ordinalIsBefore(ord({ topicIndex: 0 }), ord({ topicIndex: 1 }))).toBe(true);
  });
  it("同 module 同 topic，localOrder 較小 → true", () => {
    expect(ordinalIsBefore(ord({ localOrder: 1 }), ord({ localOrder: 2 }))).toBe(true);
  });
  it("完全相同（自我比較）→ false", () => {
    expect(ordinalIsBefore(ord(), ord())).toBe(false);
  });
});

describe("repairReciprocalEdges（雙向邊補齊：實測全量跑 15 個 Topic 才踩到的同批次內部不一致）", () => {
  let dir: string;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  function writeMinimalConcept(
    conceptsDir: string,
    nnn: string,
    id: string,
    prerequisite: string[],
    next: string[],
  ): void {
    const topicDir = join(conceptsDir, "programming-mindset");
    mkdirSync(topicDir, { recursive: true });
    writeFileSync(
      join(topicDir, `${nnn}-${id}.md`),
      [
        "---",
        `id: ${id}`,
        `title: ${id}`,
        "module: programming-mindset",
        "topic: programming-mindset",
        "difficulty: easy",
        "estimated_minutes: 10",
        "pattern_label: P",
        "complexity_label: O(n)",
        `prerequisite: [${prerequisite.join(", ")}]`,
        `next: [${next.join(", ")}]`,
        "learning_goal:\n  - g",
        "exit_criteria:\n  - e",
        "leetcode: []",
        "tags: []",
        "---",
        "",
        "## Author Hints",
        "",
        "- x",
      ].join("\n"),
      "utf-8",
    );
  }

  function readConceptData(conceptsDir: string, nnn: string, id: string): Record<string, unknown> {
    const raw = readFileSync(join(conceptsDir, "programming-mindset", `${nnn}-${id}.md`), "utf-8");
    return matter(raw).data;
  }

  it("prerequisite 正確指向較早的 Concept，但對方 next 未反映 → 補上（即使同屬一次批次起草）", () => {
    dir = mkdtempSync(join(tmpdir(), "repair-edges-test-"));
    const modulesPath = join(dir, "modules.json");
    const conceptsDir = join(dir, "concepts");
    writeFileSync(modulesPath, JSON.stringify(validModules()), "utf-8");

    writeMinimalConcept(conceptsDir, "001", "concept-a", [], []);
    writeMinimalConcept(conceptsDir, "002", "concept-b", ["concept-a"], []);

    repairReciprocalEdges(modulesPath, conceptsDir);

    expect(readConceptData(conceptsDir, "001", "concept-a").next).toEqual(["concept-b"]);
  });

  it("next 正確指向較晚的 Concept，但對方 prerequisite 未反映 → 補上", () => {
    dir = mkdtempSync(join(tmpdir(), "repair-edges-test-"));
    const modulesPath = join(dir, "modules.json");
    const conceptsDir = join(dir, "concepts");
    writeFileSync(modulesPath, JSON.stringify(validModules()), "utf-8");

    writeMinimalConcept(conceptsDir, "001", "concept-c", [], ["concept-d"]);
    writeMinimalConcept(conceptsDir, "002", "concept-d", [], []);

    repairReciprocalEdges(modulesPath, conceptsDir);

    expect(readConceptData(conceptsDir, "002", "concept-d").prerequisite).toEqual(["concept-c"]);
  });

  it("方向不合法（會構成 forward-dependency）→ 不代為修復，留給 Gate 攔下", () => {
    dir = mkdtempSync(join(tmpdir(), "repair-edges-test-"));
    const modulesPath = join(dir, "modules.json");
    const conceptsDir = join(dir, "concepts");
    writeFileSync(modulesPath, JSON.stringify(validModules()), "utf-8");

    // concept-e（較早）卻把宣告序更晚的 concept-f 列為 prerequisite：方向不合法
    writeMinimalConcept(conceptsDir, "001", "concept-e", ["concept-f"], []);
    writeMinimalConcept(conceptsDir, "002", "concept-f", [], []);

    repairReciprocalEdges(modulesPath, conceptsDir);

    // 不應該把 concept-e 補進 concept-f 的 next（那會讓 concept-f 也產生反向的不合法邊）
    expect(readConceptData(conceptsDir, "002", "concept-f").next).toEqual([]);
  });

  it("邊已雙向一致 → 不重複寫入、不觸碰檔案", () => {
    dir = mkdtempSync(join(tmpdir(), "repair-edges-test-"));
    const modulesPath = join(dir, "modules.json");
    const conceptsDir = join(dir, "concepts");
    writeFileSync(modulesPath, JSON.stringify(validModules()), "utf-8");

    writeMinimalConcept(conceptsDir, "001", "concept-g", [], ["concept-h"]);
    writeMinimalConcept(conceptsDir, "002", "concept-h", ["concept-g"], []);

    repairReciprocalEdges(modulesPath, conceptsDir);

    expect(readConceptData(conceptsDir, "001", "concept-g").next).toEqual(["concept-h"]);
    expect(readConceptData(conceptsDir, "002", "concept-h").prerequisite).toEqual(["concept-g"]);
  });
});

describe("normalizeDraftConcept：實測 Gemini 回應形態（真實踩過的兩個偏差）", () => {
  it("識別欄位用 \"id\" 而非 prompt 要求的 \"slug\" → 仍能正確解析為 slug", () => {
    const raw = { ...sampleDraft(), slug: undefined, id: "mindset-divide-and-conquer" } as Record<string, unknown>;
    delete raw.slug;
    const result = normalizeDraftConcept(raw, "programming-mindset", 0);
    expect(result.slug).toBe("mindset-divide-and-conquer");
  });

  it("next 回傳單一字串（非陣列）→ 正規化為單元素陣列，不悄悄丟棄依賴", () => {
    const raw = { ...sampleDraft(), next: "mindset-brute-force" };
    const result = normalizeDraftConcept(raw, "programming-mindset", 0);
    expect(result.next).toEqual(["mindset-brute-force"]);
  });

  it("prerequisite 回傳單一字串（非陣列）→ 正規化為單元素陣列", () => {
    const raw = { ...sampleDraft(), prerequisite: "some-prior-concept" };
    const result = normalizeDraftConcept(raw, "programming-mindset", 0);
    expect(result.prerequisite).toEqual(["some-prior-concept"]);
  });

  it("leetcode_candidates 回傳單一數字（非陣列）→ 正規化為單元素陣列", () => {
    const raw = { ...sampleDraft(), leetcode_candidates: 42 };
    const result = normalizeDraftConcept(raw, "programming-mindset", 0);
    expect(result.leetcode_candidates).toEqual([42]);
  });

  it("重現實測案例：只有 id/title/prerequisite/next/difficulty/leetcode_candidates/author_hints（缺 estimated_minutes 等）→ 具名 stage1-parse-error 指名第一個缺漏的必要欄位", () => {
    const minimal = {
      id: "mindset-divide-and-conquer",
      title: "Divide and Conquer: Breaking Down Complexity",
      prerequisite: [],
      next: "mindset-brute-force",
      difficulty: "easy",
      leetcode_candidates: [],
      author_hints: {
        core_idea: "將複雜問題拆解為可解決的子問題。",
        pattern_recognition: "問題規模龐大且無法一眼看出解答時。",
        thinking: "思考如何將問題一分為二或多個獨立的小部分。",
        common_mistakes: "試圖一次解決所有細節，導致邏輯混亂。",
        ts_notes: "善用 Interface 定義子任務的輸入輸出。",
        py_notes: "利用函數模組化拆解邏輯。",
        leetcode_hints: [],
      },
    };
    expect(() => normalizeDraftConcept(minimal, "programming-mindset", 0)).toThrow(/stage1-parse-error.*estimated_minutes/);
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
