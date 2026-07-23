import { describe, expect, it } from "vitest";
import { checkBudget } from "../../src/renderer/budget.js";
import { render } from "../../src/renderer/discord.js";
import type { Lesson } from "../../src/types/lesson.js";

function codePointLength(s: string | undefined): number {
  return s ? Array.from(s).length : 0;
}

function totalOf(embeds: ReturnType<typeof render>[number]["embeds"]): number {
  return embeds.reduce((sum, embed) => {
    let t = codePointLength(embed.title) + codePointLength(embed.description);
    for (const f of embed.fields ?? []) t += codePointLength(f.name) + codePointLength(f.value);
    return sum + t;
  }, 0);
}

function makeConceptLesson(overrides: { digest?: string; why?: string } = {}): Lesson {
  return {
    sessionIndex: 1,
    type: "concept",
    track: "foundation",
    color: 1,
    concept: {
      id: "alpha",
      title: "Alpha",
      digest: overrides.digest ?? "digest",
      tsTip: "ts",
      pyTip: "py",
      takeaway: "take",
      exitCriteria: ["c1"],
      patternLabel: "P",
      complexityLabel: "O(n)",
      estimatedMinutes: 5,
      articlePath: "x.md",
    },
    path: { current: "Alpha" },
    problems: [{ id: 1, title: "T", url: "https://x/", difficulty: "Easy", whyThisPattern: overrides.why ?? "why" }],
  };
}

describe("render — 拆訊息 fallback（US4、research R11）", () => {
  it("總長 ≤5,500 時回傳單一 RenderedMessage", () => {
    const lesson = makeConceptLesson();
    const messages = render(lesson);
    expect(messages).toHaveLength(1);
  });

  it("總長超過 5,500 時依 embed 邊界拆為兩則，budgetSlots 隨其 embed 移動", () => {
    const lesson = makeConceptLesson({ digest: "d".repeat(3000), why: "w".repeat(3000) });
    const messages = render(lesson);

    expect(messages).toHaveLength(2);
    expect(totalOf(messages[0]!.embeds)).toBeLessThanOrEqual(5500);

    // 第一則含 digest/tsTip/pyTip（主 Embed），不含 problems（題目 Embed 移到第二則）
    expect(messages[0]!.budgetSlots.digest).toBeDefined();
    expect(messages[0]!.budgetSlots.problems).toBeUndefined();

    // 第二則含 problems 與結尾欄位，不含 digest
    expect(messages[1]!.budgetSlots.problems).toBeDefined();
    expect(messages[1]!.budgetSlots.digest).toBeUndefined();
    expect(messages[1]!.budgetSlots.exitCriteria).toBeDefined();

    // embeds 依原序分布，兩則合計仍是全部 embeds（主 + 題目 + 結尾 = 3，本情境無 overlayNotes）
    const totalEmbedCount = messages[0]!.embeds.length + messages[1]!.embeds.length;
    expect(totalEmbedCount).toBe(3);
  });

  it("拆分後每一則各自跑 checkBudget，可各自判斷是否仍超限", () => {
    const lesson = makeConceptLesson({ digest: "d".repeat(3000), why: "w".repeat(3000) });
    const messages = render(lesson);
    const reports = messages.map((m) => checkBudget(m));
    expect(reports).toHaveLength(2);
  });

  it("最多兩則：單一 embed 自身已超過 5,500 時不再切分，整篇留在第一則交由 checkBudget 回報違規", () => {
    const lesson = makeConceptLesson({ digest: "d".repeat(6000) });
    const messages = render(lesson);

    expect(messages.length).toBeLessThanOrEqual(2);
    // 主 Embed（含超長 digest）必定完整出現在第一則，不被攔腰截斷
    expect(messages[0]!.embeds[0]?.description?.length).toBe(6000);

    const report = checkBudget(messages[0]!);
    expect(report.ok).toBe(false);
  });

  it("MUST NOT 截斷任何內容：拆分後逐一 embed 的文字與拆分前完全相同", () => {
    const lesson = makeConceptLesson({ digest: "d".repeat(3000), why: "w".repeat(3000) });
    const messages = render(lesson);
    const allEmbeds = messages.flatMap((m) => m.embeds);
    expect(allEmbeds[0]?.description).toBe("d".repeat(3000));
    const problemEmbed = allEmbeds.find((e) => e.title === "🎯 Today's Challenge");
    expect(problemEmbed?.description).toContain("w".repeat(3000));
  });
});
