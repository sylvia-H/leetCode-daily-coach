import { describe, expect, it } from "vitest";
import { CONCEPT_BODY_MAX_CHARS, countConceptBodyChars, runContentGate } from "../../src/compiler/gate.js";
import { makeArticleMarkdown, makeCompilerDeps } from "../helpers/compiler.js";

describe("runContentGate 擴充（F7 US2：繁中判準 + 觀念本體字數，FR-008/010.2）", () => {
  it("繁中判準違規（簡體字）→ traditional-chinese 違規", () => {
    const article = makeArticleMarkdown({ id: "c1" }).replace(
      "## Concept\n\n測試用內容。",
      "## Concept\n\n这是国家推薦的一段完全用簡體字撰寫的觀念說明段落，理應被繁中判準攔下。",
    );
    const deps = makeCompilerDeps({
      concepts: [{ id: "c1" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "c1", problemIds: [] }] },
      articles: { "articles/test-topic/001-c1.md": article },
    });

    const result = runContentGate({ deps });
    expect(result.violations.some((v) => v.rule === "traditional-chinese" && v.subject === "c1")).toBe(true);
  });

  it("觀念本體超過 2,000 字 → concept-body-too-long 違規", () => {
    const longBody = "繁體中文內容測試段落。".repeat(250); // 遠超過 2000 字
    const article = makeArticleMarkdown({ id: "c1" }).replace(
      "## Concept\n\n測試用內容。",
      `## Concept\n\n${longBody}`,
    );
    const deps = makeCompilerDeps({
      concepts: [{ id: "c1" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "c1", problemIds: [] }] },
      articles: { "articles/test-topic/001-c1.md": article },
    });

    const result = runContentGate({ deps });
    expect(result.violations.some((v) => v.rule === "concept-body-too-long" && v.subject === "c1")).toBe(true);
  });

  it("正常繁中、字數合理的 Article → 無 traditional-chinese / concept-body-too-long 違規", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "c1" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "c1", problemIds: [] }] },
      articles: { "articles/test-topic/001-c1.md": makeArticleMarkdown({ id: "c1" }) },
    });

    const result = runContentGate({ deps });
    expect(result.violations.filter((v) => v.rule === "traditional-chinese" || v.rule === "concept-body-too-long")).toEqual(
      [],
    );
  });

  it("同一 Article 被多個 Track/Session 引用時，繁中/字數違規只回報一次（三軌共用正文）", () => {
    const article = makeArticleMarkdown({ id: "c1" }).replace(
      "## Concept\n\n測試用內容。",
      "## Concept\n\n這裡混入唯一一個国字（其餘皆為正確繁體中文內容），其他部分完全正常。",
    );
    const deps = makeCompilerDeps({
      concepts: [{ id: "c1" }],
      schedules: {
        foundation: [{ sessionIndex: 1, type: "concept", conceptId: "c1", problemIds: [] }],
        interviewReady: [{ sessionIndex: 1, type: "concept", conceptId: "c1", problemIds: [] }],
      },
      articles: { "articles/test-topic/001-c1.md": article },
    });

    const result = runContentGate({ deps });
    expect(result.violations.filter((v) => v.rule === "traditional-chinese")).toHaveLength(1);
  });
});

describe("runContentGate 擴充（F11：quiz-invalid，data-model.md §8）", () => {
  it("違規 quizBank ⇒ 回報 rule === 'quiz-invalid' 且 subject 具 '{原rule}@' 前綴", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "c1" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "c1", problemIds: [] }] },
      articles: { "articles/test-topic/001-c1.md": makeArticleMarkdown({ id: "c1" }) },
      quizBank: { version: 1, byConcept: { "unknown-concept": [] } },
    });

    const result = runContentGate({ deps });
    const quizViolations = result.violations.filter((v) => v.rule === "quiz-invalid");
    expect(quizViolations.length).toBeGreaterThan(0);
    expect(quizViolations.every((v) => (v.subject ?? "").includes("@quiz-bank:unknown-concept"))).toBe(true);
    expect(quizViolations.some((v) => (v.subject ?? "").startsWith("quiz-unknown-concept@"))).toBe(true);
  });

  it("合法 quizBank（或缺席）⇒ 無 quiz-invalid 違規", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "c1" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "concept", conceptId: "c1", problemIds: [] }] },
      articles: { "articles/test-topic/001-c1.md": makeArticleMarkdown({ id: "c1" }) },
    });

    const result = runContentGate({ deps });
    expect(result.violations.filter((v) => v.rule === "quiz-invalid")).toEqual([]);
  });
});

describe("countConceptBodyChars（近似字數計算）", () => {
  it("排除 fenced/行內 code 與 markdown 標記符號", () => {
    const body = "# 標題\n\n**重點**：使用 `O(n)` 走訪。\n\n```typescript\nconst a = 1;\n```";
    const count = countConceptBodyChars(body);
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(body.length);
  });

  it("CONCEPT_BODY_MAX_CHARS 為 2000", () => {
    expect(CONCEPT_BODY_MAX_CHARS).toBe(2000);
  });
});
