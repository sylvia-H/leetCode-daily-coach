import { describe, expect, it } from "vitest";
import { render } from "../../src/renderer/discord.js";
import type { Lesson } from "../../src/types/lesson.js";

function baseLesson(overrides: Partial<Lesson>): Lesson {
  return {
    sessionIndex: 1,
    type: "concept",
    track: "foundation",
    color: 0x2ecc71,
    problems: [],
    ...overrides,
  };
}

describe("render — 五種版面的欄位結構（US2、contracts/renderer-contract.md §2）", () => {
  it("concept：主 Embed 的 fields 逐一符合 Pattern/複雜度/預估時間/TypeScript Tip/Python Tip", () => {
    const lesson = baseLesson({
      type: "concept",
      concept: {
        id: "alpha",
        title: "Alpha",
        digest: "digest",
        tsTip: "ts",
        pyTip: "py",
        takeaway: "take",
        exitCriteria: ["c1", "c2"],
        patternLabel: "Pattern X",
        complexityLabel: "O(n)",
        estimatedMinutes: 20,
        articlePath: "articles/x/001-alpha.md",
      },
      path: { current: "Alpha" },
    });
    const [message] = render(lesson);
    const mainEmbed = message!.embeds[0]!;
    expect(mainEmbed.title).toBe("📚 Session 1 · Alpha");
    expect(mainEmbed.description).toBe("digest");
    const fieldMap = Object.fromEntries((mainEmbed.fields ?? []).map((f) => [f.name, f.value]));
    expect(fieldMap["Pattern"]).toBe("Pattern X");
    expect(fieldMap["複雜度"]).toBe("O(n)");
    expect(fieldMap["預估時間"]).toBe("20 分鐘");
    expect(fieldMap["TypeScript Tip"]).toBe("ts");
    expect(fieldMap["Python Tip"]).toBe("py");
  });

  it("concept：無 problems 時題目 Embed 整個省略（陣列長度減一，而非空 embed）", () => {
    const withProblems = baseLesson({
      type: "concept",
      concept: {
        id: "a",
        title: "A",
        digest: "d",
        tsTip: "t",
        pyTip: "p",
        takeaway: "tk",
        exitCriteria: ["c"],
        patternLabel: "P",
        complexityLabel: "O(1)",
        estimatedMinutes: 5,
        articlePath: "x.md",
      },
      path: { current: "A" },
      problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy" }],
    });
    const withoutProblems = { ...withProblems, problems: [] };
    const withCount = render(withProblems)[0]!.embeds.length;
    const withoutCount = render(withoutProblems)[0]!.embeds.length;
    expect(withoutCount).toBe(withCount - 1);
  });

  it("concept：overlayNotes 存在時輸出「📎 Track 補充」Embed，缺席時不存在該 Embed", () => {
    const concept = {
      id: "a",
      title: "A",
      digest: "d",
      tsTip: "t",
      pyTip: "p",
      takeaway: "tk",
      exitCriteria: ["c"],
      patternLabel: "P",
      complexityLabel: "O(1)",
      estimatedMinutes: 5,
      articlePath: "x.md",
    };
    const withNotes = render(baseLesson({ type: "concept", concept, path: { current: "A" }, overlayNotes: "補充內容" }))[0]!;
    const withoutNotes = render(baseLesson({ type: "concept", concept, path: { current: "A" } }))[0]!;
    expect(withNotes.embeds.some((e) => e.title === "📎 Track 補充" && e.description === "補充內容")).toBe(true);
    expect(withoutNotes.embeds.some((e) => e.title === "📎 Track 補充")).toBe(false);
  });

  it("practice：單一 Embed，title 含「練習」", () => {
    const lesson = baseLesson({ type: "practice" });
    const [message] = render(lesson);
    expect(message!.embeds).toHaveLength(1);
    expect(message!.embeds[0]?.title).toContain("練習");
  });

  it("challenge：單一 Embed，title 含「Challenge」", () => {
    const lesson = baseLesson({ type: "challenge" });
    const [message] = render(lesson);
    expect(message!.embeds).toHaveLength(1);
    expect(message!.embeds[0]?.title).toContain("Challenge");
  });

  it("review：📚 本週涵蓋 一律存在且列出每個 reviewConcept；Reflection/Challenge 缺席時整個 field 不存在", () => {
    const lesson = baseLesson({
      type: "review",
      reviewConcepts: [
        { id: "a", title: "A" },
        { id: "b", title: "B" },
      ],
    });
    const [message] = render(lesson);
    const fields = message!.embeds[0]?.fields ?? [];
    const coverage = fields.find((f) => f.name === "📚 本週涵蓋");
    expect(coverage?.value).toBe("- A\n- B");
    expect(fields.find((f) => f.name === "🤔 Reflection")).toBeUndefined();
    expect(fields.find((f) => f.name === "🎯 Challenge")).toBeUndefined();
  });

  it("review：reflectionQuestion 與 problems 皆存在時各自輸出對應 field", () => {
    const lesson = baseLesson({
      type: "review",
      reviewConcepts: [{ id: "a", title: "A" }],
      reflectionQuestion: "你學到了什麼？",
      problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy" }],
    });
    const [message] = render(lesson);
    const fields = message!.embeds[0]?.fields ?? [];
    expect(fields.find((f) => f.name === "🤔 Reflection")?.value).toBe("你學到了什麼？");
    expect(fields.find((f) => f.name === "🎯 Challenge")?.value).toContain("[1. T]");
  });

  it("rest：description 為固定文案（非空字串）；無 encouragement 時 fields 不存在", () => {
    const lesson = baseLesson({ type: "rest" });
    const [message] = render(lesson);
    expect(message!.embeds[0]?.description?.length).toBeGreaterThan(0);
    expect(message!.embeds[0]?.fields).toBeUndefined();
  });

  it("rest：有 encouragement 時附加恰好一個 field，值為該鼓勵語", () => {
    const lesson = baseLesson({ type: "rest", encouragement: "加油！" });
    const [message] = render(lesson);
    expect(message!.embeds[0]?.fields).toHaveLength(1);
    expect(message!.embeds[0]?.fields?.[0]?.value).toBe("加油！");
  });

  it("省略一律代表欄位不存在，MUST NOT 出現空字串或佔位符", () => {
    const lesson = baseLesson({ type: "rest" });
    const [message] = render(lesson);
    const embed = message!.embeds[0]!;
    expect(embed.fields).not.toEqual([]);
    expect(embed.fields).toBeUndefined();
  });
});
