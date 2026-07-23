import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "../../src/renderer/discord.js";
import type { Lesson } from "../../src/types/lesson.js";

function listTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...listTsFiles(full));
    else if (entry.endsWith(".ts")) files.push(full);
  }
  return files;
}

function makeLesson(track: Lesson["track"]): Lesson {
  return {
    sessionIndex: 4,
    type: "concept",
    track,
    color: 0x2ecc71,
    concept: {
      id: "alpha",
      title: "Alpha",
      digest: "digest 內容",
      tsTip: "ts tip",
      pyTip: "py tip",
      takeaway: "一句話帶走",
      exitCriteria: ["條件一", "條件二"],
      patternLabel: "Pattern",
      complexityLabel: "O(n)",
      estimatedMinutes: 10,
      articlePath: "articles/x/001-alpha.md",
    },
    path: { prev: "Prev", current: "Alpha", next: "Next" },
    problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy", whyThisPattern: "why" }],
  };
}

describe("render — 純函式性（US4、SC-004）", () => {
  it("連續 render 同一 Lesson 100 次，deep-equal", () => {
    const lesson = makeLesson("foundation");
    const first = render(lesson);
    for (let i = 0; i < 100; i++) {
      expect(render(lesson)).toEqual(first);
    }
  });

  it("同一 Lesson 換三個 Track，除 track 欄位外 embeds/budgetSlots 結構與內容零差異", () => {
    const foundation = render(makeLesson("foundation"));
    const interviewReady = render(makeLesson("interviewReady"));
    const interviewMastery = render(makeLesson("interviewMastery"));
    expect(interviewReady).toEqual(foundation);
    expect(interviewMastery).toEqual(foundation);
  });

  it("不修改輸入的 Lesson 物件", () => {
    const lesson = makeLesson("foundation");
    const snapshot = JSON.parse(JSON.stringify(lesson));
    render(lesson);
    expect(lesson).toEqual(snapshot);
  });

  it("import 掃描：src/renderer/** 只含型別 import（無 node:fs / compiler / state）", () => {
    const dir = join(process.cwd(), "src", "renderer");
    const files = listTsFiles(dir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const source = readFileSync(file, "utf-8");
      const importPaths = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]!);
      for (const path of importPaths) {
        expect(path.startsWith("../types/") || path === "./discord.js", `${file} 不得 import「${path}」`).toBe(
          true,
        );
        expect(path).not.toMatch(/node:fs|compiler|state/);
      }
    }
  });
});
