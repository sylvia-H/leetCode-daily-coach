import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "../../src/renderer/discord.js";
import type { Lesson } from "../../src/types/lesson.js";

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    sessionIndex: 1,
    type: "concept",
    track: "foundation",
    concept: {
      id: "left-right-pointer",
      title: "Left-Right Pointer",
      moduleColor: 0x3498db,
      digest: "Digest 內容",
      tsTip: "ts tip",
      pyTip: "py tip",
      takeaway: "一句話帶走",
      exitCriteria: ["條件一", "條件二"],
      patternLabel: "Two Pointer",
      complexityLabel: "O(n) / O(1)",
      estimatedMinutes: 15,
      articlePath: "articles/two-pointer/002-left-right-pointer.md",
    },
    problems: [
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
    ],
    path: { prev: "Array Traversal", current: "Left-Right Pointer", next: "Fast-Slow Pointer" },
    ...overrides,
  };
}

describe("render — 純函式性（憲章 XI / XII）", () => {
  it("同一 Lesson 渲染 100 次逐字元相同（SC-010）", () => {
    const lesson = makeLesson();
    const first = JSON.stringify(render(lesson));
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(render(lesson))).toBe(first);
    }
  });

  it("只有 track 欄位不同的兩個 Lesson → embeds 完全相同（Track 不決定版面）", () => {
    const a = render(makeLesson({ track: "foundation" }));
    const b = render(makeLesson({ track: "interviewMastery" }));
    expect(a).toEqual(b);
  });

  it("不修改輸入物件", () => {
    const lesson = makeLesson();
    const snapshot = JSON.parse(JSON.stringify(lesson));
    render(lesson);
    expect(lesson).toEqual(snapshot);
  });

  it("缺 hint 時省略該段與其分隔符", () => {
    const lesson = makeLesson();
    const embeds = render(lesson);
    const problemDescription = embeds[1]?.description ?? "";
    expect(problemDescription).toContain("Hint: hint text");
    expect(problemDescription).not.toMatch(/Valid Palindrome[\s\S]*Hint/);
  });

  it("path.prev 缺席時省略「昨天」整行；path.next 缺席時省略「明天」整行", () => {
    const lesson = makeLesson({ path: { current: "Left-Right Pointer" } });
    const embeds = render(lesson);
    const pathValue = embeds[2]?.fields?.find((f) => f.name === "🧭 學習路徑")?.value ?? "";
    expect(pathValue).not.toContain("昨天");
    expect(pathValue).not.toContain("明天");
    expect(pathValue).toContain("今天  Left-Right Pointer");
  });

  it("觀念相關內容先於題目（憲章 I）：主 Embed 為第一個、題目 Embed 為第二個", () => {
    const embeds = render(makeLesson());
    expect(embeds[0]?.title).toContain("Session");
    expect(embeds[1]?.title).toContain("Today's Challenge");
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
