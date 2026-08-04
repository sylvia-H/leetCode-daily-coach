import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "../../src/renderer/discord.js";
import type { ConceptLesson, Problem } from "../../src/types/lesson.js";
import { makeConceptLesson, makeLesson, makeLessonConcept } from "../helpers/lesson.js";

const PROBLEMS: Problem[] = [
  {
    id: 167,
    title: "Two Sum II",
    url: "https://leetcode.com/problems/x/",
    difficulty: "Medium",
    whyThisPattern: "why",
    hint: "hint text",
  },
  {
    id: 125,
    title: "Valid Palindrome",
    url: "https://leetcode.com/problems/y/",
    difficulty: "Easy",
    whyThisPattern: "why 2",
  },
];

function makeLessonFixture(overrides: Partial<ConceptLesson> = {}): ConceptLesson {
  return makeConceptLesson({
    color: 0x3498db,
    concept: makeLessonConcept({
      id: "left-right-pointer",
      title: "Left-Right Pointer",
      digest: "Digest 內容",
      tsTip: "ts tip",
      pyTip: "py tip",
      takeaway: "一句話帶走",
      exitCriteria: ["條件一", "條件二"],
      patternLabel: "Two Pointer",
      complexityLabel: "O(n) / O(1)",
      estimatedMinutes: 15,
      articlePath: "articles/two-pointer/002-left-right-pointer.md",
    }),
    path: { prev: "Array Traversal", current: "Left-Right Pointer", next: "Fast-Slow Pointer" },
    problems: PROBLEMS,
    ...overrides,
  });
}

describe("render — 純函式性（憲章 XI / XII）", () => {
  it("同一 Lesson 渲染 100 次逐字元相同（SC-010）", () => {
    const lesson = makeLessonFixture();
    const first = JSON.stringify(render(lesson));
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(render(lesson))).toBe(first);
    }
  });

  it("只有 track 欄位不同的兩個 Lesson → embeds 完全相同（Track 不決定版面）", () => {
    const a = render(makeLessonFixture({ track: "foundation" }));
    const b = render(makeLessonFixture({ track: "interviewMastery" }));
    expect(a).toEqual(b);
  });

  it("不修改輸入物件", () => {
    const lesson = makeLessonFixture();
    const snapshot = JSON.parse(JSON.stringify(lesson));
    render(lesson);
    expect(lesson).toEqual(snapshot);
  });

  it("缺 hint 時省略該段與其分隔符", () => {
    const lesson = makeLessonFixture();
    const messages = render(lesson);
    const problemDescription = messages[0]!.embeds[1]?.description ?? "";
    expect(problemDescription).toContain("Hint: hint text");
    expect(problemDescription).not.toMatch(/Valid Palindrome[\s\S]*Hint/);
  });

  it("path.prev 缺席時省略「昨天」整行；path.next 缺席時省略「明天」整行", () => {
    const lesson = makeLessonFixture({ path: { current: "Left-Right Pointer" } });
    const messages = render(lesson);
    const pathValue = messages[0]!.embeds[2]?.fields?.find((f) => f.name === "🧭 學習路徑")?.value ?? "";
    expect(pathValue).not.toContain("昨天");
    expect(pathValue).not.toContain("明天");
    expect(pathValue).toContain("今天  Left-Right Pointer");
  });

  it("觀念相關內容先於題目（憲章 I）：主 Embed 為第一個、題目 Embed 為第二個", () => {
    const messages = render(makeLessonFixture());
    const embeds = messages[0]!.embeds;
    expect(embeds[0]?.title).toContain("Session");
    expect(embeds[1]?.title).toContain("Today's Challenge");
  });

  it("budgetSlots 的值與放進 embeds 的字串為同一份實例", () => {
    const lesson = makeLessonFixture();
    const [message] = render(lesson);
    expect(message!.budgetSlots.digest).toBe(lesson.concept.digest);
    expect(message!.embeds[0]?.description).toBe(lesson.concept.digest);
  });

  it("src/renderer/discord.ts 的 import 集合只含 src/types/lesson.ts（憲章 XI 的編譯期約束）", () => {
    const source = readFileSync(join(process.cwd(), "src", "renderer", "discord.ts"), "utf-8");
    const importPaths = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    expect(importPaths.length).toBeGreaterThan(0);
    for (const path of importPaths) {
      expect(path).toBe("../types/lesson.js");
    }
  });
});

describe("render — 五種 Session 類型（US2）", () => {
  it("practice：無 concept/path，有題時題目清單附加於固定提示文案之後", () => {
    const lesson = makeLesson({ type: "practice", problems: PROBLEMS });
    const [message] = render(lesson);
    expect(message!.embeds).toHaveLength(1);
    expect(message!.embeds[0]?.description).toContain("Two Sum II");
  });

  it("practice：無題時仍有非空的固定提示文案", () => {
    const lesson = makeLesson({ type: "practice", problems: [] });
    const [message] = render(lesson);
    expect(message!.embeds[0]?.description?.trim()).not.toBe("");
  });

  it("challenge：與 practice 同版面但標題不同", () => {
    const lesson = makeLesson({ type: "challenge", problems: PROBLEMS });
    const [message] = render(lesson);
    expect(message!.embeds[0]?.title).toContain("Challenge");
  });

  it("review：📚 本週涵蓋 一定存在；Reflection / Challenge 缺席時省略對應 field", () => {
    const lesson = makeLesson({
      type: "review",
      problems: [],
      reviewConcepts: [
        { id: "array-traversal", title: "Array Traversal" },
        { id: "in-place-operations", title: "In-place Operations" },
      ],
    });
    const [message] = render(lesson);
    const fieldNames = message!.embeds[0]?.fields?.map((f) => f.name) ?? [];
    expect(fieldNames).toContain("📚 本週涵蓋");
    expect(fieldNames).not.toContain("🤔 Reflection");
    expect(fieldNames).not.toContain("🎯 Challenge");
  });

  it("review：四段全部存在時，順序恆為 本週涵蓋→Reflection→Challenge→一句話（FR-021/FR-022）", () => {
    const lesson = makeLesson({
      type: "review",
      problems: PROBLEMS,
      reviewConcepts: [{ id: "array-traversal", title: "Array Traversal" }],
      reflectionQuestion: "這週你最常在哪一步卡住？",
      encouragement: "做得很好，繼續保持！",
    });
    const [message] = render(lesson);
    const fieldNames = message!.embeds[0]?.fields?.map((f) => f.name) ?? [];
    expect(fieldNames).toEqual(["📚 本週涵蓋", "🤔 Reflection", "🎯 Challenge", "💬 一句話"]);
  });

  it("review：鼓勵語缺席時該段省略，其餘三段順序不變", () => {
    const lesson = makeLesson({
      type: "review",
      problems: PROBLEMS,
      reviewConcepts: [{ id: "array-traversal", title: "Array Traversal" }],
      reflectionQuestion: "這週你最常在哪一步卡住？",
    });
    const [message] = render(lesson);
    const fieldNames = message!.embeds[0]?.fields?.map((f) => f.name) ?? [];
    expect(fieldNames).toEqual(["📚 本週涵蓋", "🤔 Reflection", "🎯 Challenge"]);
    expect(fieldNames).not.toContain("💬 一句話");
  });

  // F8（rest 槽移除，FR-014c）：三份正式課表已無 rest Session，validate.ts 的全課表編譯不再涵蓋
  // buildRestBlocks 這條路徑；以下兩個測試為其唯一覆蓋來源，MUST NOT 移除。
  it("rest：固定文案 + 無 encouragement 時省略該 field", () => {
    const lesson = makeLesson({ type: "rest", problems: [] });
    const [message] = render(lesson);
    expect(message!.embeds[0]?.description?.trim()).not.toBe("");
    expect(message!.embeds[0]?.fields).toBeUndefined();
  });

  it("rest：有 encouragement 時附加一個 field", () => {
    const lesson = makeLesson({ type: "rest", problems: [], encouragement: "做得很好，繼續保持！" });
    const [message] = render(lesson);
    expect(message!.embeds[0]?.fields?.[0]?.value).toBe("做得很好，繼續保持！");
  });

  it("非 concept 類型：embeds 不含 concept / path 相關內容，且 lesson.track 不影響結構", () => {
    const a = render(makeLesson({ type: "rest", problems: [], track: "foundation" }));
    const b = render(makeLesson({ type: "rest", problems: [], track: "interviewMastery" }));
    expect(a).toEqual(b);
  });
});
