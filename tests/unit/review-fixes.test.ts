// 針對 code review findings 的回歸測試：每一條都對應一個「修好之前會靜默通過」的情境。
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseArticle } from "../../src/compiler/content.js";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";
import { loadTrackSchedule } from "../../src/compiler/schedule.js";
import { checkBudget } from "../../src/renderer/budget.js";
import { render } from "../../src/renderer/discord.js";
import type { SessionPlan } from "../../src/types/schedule.js";
import { makeArticleMarkdown, makeCompilerDeps, makeProblem } from "../helpers/compiler.js";
import { makeLesson } from "../helpers/lesson.js";

describe("課表載入 schema 驗證（findings #1）", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "schedule-schema-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function write(content: unknown): void {
    writeFileSync(join(dir, "foundation.json"), JSON.stringify(content), "utf-8");
  }

  it("缺 sessions 欄位 ⇒ 載入即 fail loud，不讓壞結構穿透到 Gate", () => {
    write({ track: "foundation", targetLevel: "easy" });
    expect(() => loadTrackSchedule("foundation", dir)).toThrow(/不符 schema/);
  });

  it("Session 的 type 不在五種之內 ⇒ fail loud", () => {
    write({ track: "foundation", targetLevel: "easy", sessions: [{ sessionIndex: 1, type: "quiz" }] });
    expect(() => loadTrackSchedule("foundation", dir)).toThrow(/不符 schema/);
  });

  it("concept Session 缺 conceptId ⇒ fail loud", () => {
    write({ track: "foundation", targetLevel: "easy", sessions: [{ sessionIndex: 1, type: "concept" }] });
    expect(() => loadTrackSchedule("foundation", dir)).toThrow(/conceptId/);
  });

  it("track 欄位與檔名對應的 Track 不符 ⇒ fail loud", () => {
    write({ track: "interviewReady", targetLevel: "easy", sessions: [] });
    expect(() => loadTrackSchedule("foundation", dir)).toThrow(/不符/);
  });

  it("合法課表 ⇒ 正常載入", () => {
    write({
      track: "foundation",
      targetLevel: "easy",
      sessions: [{ sessionIndex: 1, type: "concept", conceptId: "alpha", problemIds: [1] }],
    });
    expect(loadTrackSchedule("foundation", dir).sessions).toHaveLength(1);
  });
});

describe("compile 未知 Session type（findings #2）", () => {
  it("課表帶進 union 之外的 type ⇒ 指名根因 fail loud，MUST NOT 回傳 undefined", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha" }],
      schedules: { foundation: [{ sessionIndex: 1, type: "quiz" } as unknown as SessionPlan] },
      articles: { "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha" }) },
    });
    expect(() => compile("foundation", 1, deps)).toThrow(/未知的 Session type：quiz/);
  });
});

describe("Article 快取的 id 一致性（findings #4）", () => {
  it("兩個 Concept 指向同一個 articlePath ⇒ 第二次編譯仍以 article-id-mismatch fail loud", () => {
    const sharedPath = "articles/test-topic/001-shared.md";
    const deps = makeCompilerDeps({
      concepts: [
        { id: "alpha", title: "Alpha", localOrder: 1, articlePath: sharedPath },
        { id: "beta", title: "Beta", localOrder: 2, articlePath: sharedPath },
      ],
      schedules: {
        foundation: [
          { sessionIndex: 1, type: "concept", conceptId: "alpha" },
          { sessionIndex: 2, type: "concept", conceptId: "beta" },
        ],
      },
      articles: { [sharedPath]: makeArticleMarkdown({ id: "alpha", title: "Alpha" }) },
    });

    expect(compile("foundation", 1, deps).type).toBe("concept");
    expect(() => compile("foundation", 2, deps)).toThrow(/article-id-mismatch/);
  });
});

describe("Today's Challenge 條目解析（findings #5、#7）", () => {
  const HEAD = `---
id: alpha
title: Alpha
module: test-module
topic: test-topic
pattern_label: P
complexity_label: O(n)
estimated_minutes: 10
exit_criteria:
  - c1
---
`;

  const SECTIONS = [
    "Concept",
    "Thinking",
    "Pattern Recognition",
    "Common Mistakes",
    "Complexity",
    "Digest",
    "TypeScript Tip",
    "Python Tip",
    "TypeScript Corner",
    "Python Corner",
    "Takeaway",
    "Tomorrow Preview",
  ]
    .map((name) => `\n## ${name}\n\n內容。\n`)
    .join("");

  function article(challenge: string): string {
    return `${HEAD}${SECTIONS}\n## Today's Challenge\n\n${challenge}\n`;
  }

  it("條目被段落切成兩個 list 時，兩個 list 的題目都解析得到", () => {
    const parsed = parseArticle(
      article("- **303** · 前綴和\n\n說明段落夾在中間。\n\n- **560** · 前綴和 + Hash"),
      "alpha",
      "x.md",
    );
    expect([...parsed.challenge.keys()].sort((a, b) => a - b)).toEqual([303, 560]);
  });

  it("同一條目的多個段落都併入 whyThisPattern，不只取第一段", () => {
    const parsed = parseArticle(article("- **303** · 第一段說明\n\n  第二段補充說明"), "alpha", "x.md");
    const why = parsed.challenge.get(303)?.whyThisPattern ?? "";
    expect(why).toContain("第一段說明");
    expect(why).toContain("第二段補充說明");
  });

  it("題號為空白 ⇒ fail loud（MUST NOT 靜默註冊成 0）", () => {
    // marked 不把只含空白的粗體視為 strong，故此例由「缺少題號開頭」那條攔下；
    // 重點是條目不得靜默通過（過去 Number(" ") === 0 會讓它註冊成題號 0）。
    expect(() => parseArticle(article("- ** ** · 說明文字"), "alpha", "x.md")).toThrow(/article-challenge-format/);
  });

  it("題號為指數記法 ⇒ fail loud（MUST NOT 靜默變成 1000）", () => {
    expect(() => parseArticle(article("- **1e3** · 說明文字"), "alpha", "x.md")).toThrow(/不是合法正整數/);
  });

  it("題號帶正號 ⇒ fail loud", () => {
    expect(() => parseArticle(article("- **+167** · 說明文字"), "alpha", "x.md")).toThrow(/不是合法正整數/);
  });
});

describe("Reflection / 鼓勵語的逐區塊預算（findings #6）", () => {
  it("review 的 reflectionQuestion 超過 300 字 ⇒ checkBudget 不通過", () => {
    const lesson = makeLesson({
      type: "review",
      reviewConcepts: [{ id: "a", title: "A" }],
      reflectionQuestion: "問".repeat(301),
    });
    const [message] = render(lesson);
    const report = checkBudget(message!);
    expect(report.ok).toBe(false);
    expect(report.items.find((i) => i.name === "reflectionQuestion")?.over).toBe(true);
  });

  it("rest 的 encouragement 超過 200 字 ⇒ checkBudget 不通過", () => {
    const lesson = makeLesson({ type: "rest", encouragement: "語".repeat(201) });
    const [message] = render(lesson);
    const report = checkBudget(message!);
    expect(report.ok).toBe(false);
    expect(report.items.find((i) => i.name === "encouragement")?.over).toBe(true);
  });

  // slot⇄field parity：Renderer 放進 embed 的每一段可變長度文字都 MUST 有對應 slot，
  // 否則該段落完全逃過逐區塊預算（BudgetSlots 的不變式）。
  it("五種版面的每個 embed field 值都能在 budgetSlots 中找到（固定文案除外）", () => {
    // 例外只給「非教材自由文字」：固定標籤，以及由 Compiler 依課表生成的複習清單
    // （長度由 rhythm 週長與 Concept 標題決定，不是作者可寫長的段落）。
    const FIXED_TEXTS = new Set(["Pattern X", "O(n)", "20 分鐘"]);
    const EXEMPT_FIELDS = new Set(["📚 本週涵蓋"]);
    const lessons = [
      makeLesson({
        type: "concept",
        concept: {
          id: "a",
          title: "A",
          digest: "digest",
          tsTip: "ts",
          pyTip: "py",
          takeaway: "take",
          exitCriteria: ["c1"],
          patternLabel: "Pattern X",
          complexityLabel: "O(n)",
          estimatedMinutes: 20,
          articlePath: "x.md",
        },
        path: { current: "A" },
        overlayNotes: "補充",
        problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy", whyThisPattern: "why" }],
      }),
      makeLesson({
        type: "review",
        reviewConcepts: [{ id: "a", title: "A" }],
        reflectionQuestion: "反思問題",
        problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy" }],
      }),
      makeLesson({ type: "rest", encouragement: "加油！" }),
    ];

    for (const lesson of lessons) {
      for (const message of render(lesson)) {
        const slotValues = new Set<string>();
        for (const value of Object.values(message.budgetSlots)) {
          if (typeof value === "string") slotValues.add(value);
          else if (Array.isArray(value)) for (const v of value) slotValues.add(v);
        }
        for (const embed of message.embeds) {
          for (const field of embed.fields ?? []) {
            if (FIXED_TEXTS.has(field.value) || EXEMPT_FIELDS.has(field.name)) continue;
            const covered = [...slotValues].some((slot) => field.value === slot || field.value.includes(slot));
            expect(covered, `${lesson.type} 的 field「${field.name}」未登記 budgetSlot`).toBe(true);
          }
        }
      }
    }
  });
});

describe("F8 素材的最小結構 schema（findings #10）", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "f8-material-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reflection-bank.json 是合法 JSON 但不是物件 ⇒ fail loud（MUST NOT 當成缺席）", () => {
    const path = join(dir, "reflection-bank.json");
    writeFileSync(path, JSON.stringify("我是字串"), "utf-8");
    expect(() => loadCompilerDeps({ reflectionBankPath: path })).toThrow(/不符 schema/);
  });

  it("encouragement.json 是空陣列 ⇒ fail loud", () => {
    const path = join(dir, "encouragement.json");
    writeFileSync(path, JSON.stringify([]), "utf-8");
    expect(() => loadCompilerDeps({ encouragementPath: path })).toThrow(/不符 schema/);
  });
});

describe("題庫查得到但 Article 無條目時仍不失敗（既有 FR-030 行為守衛）", () => {
  it("practice Session 反查不到條目 ⇒ 省略 whyThisPattern 而非拋錯", () => {
    const deps = makeCompilerDeps({
      concepts: [{ id: "alpha", title: "Alpha", leetcode: [1] }],
      problems: [makeProblem({ id: 1 }), makeProblem({ id: 2 })],
      schedules: {
        foundation: [
          { sessionIndex: 1, type: "concept", conceptId: "alpha" },
          { sessionIndex: 2, type: "practice", problemIds: [1] },
        ],
      },
      articles: {
        "articles/test-topic/001-alpha.md": makeArticleMarkdown({ id: "alpha", challenge: [{ id: 2, why: "w" }] }),
      },
    });
    const lesson = compile("foundation", 2, deps);
    expect(lesson.problems[0]?.whyThisPattern).toBeUndefined();
  });
});
