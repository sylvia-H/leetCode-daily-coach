import { describe, expect, it } from "vitest";
import { checkBudget } from "../../src/renderer/budget.js";
import { PROBLEM_BULLET } from "../../src/renderer/discord.js";
import type { DiscordEmbed } from "../../src/types/lesson.js";

function makeLessonEmbeds(overrides: Partial<{ digest: string; tsTip: string; pyTip: string }> = {}): DiscordEmbed[] {
  return [
    {
      title: "📚 Session 1 · Left-Right Pointer",
      description: overrides.digest ?? "Digest 內容",
      color: 123456,
      fields: [
        { name: "Pattern", value: "Two Pointer", inline: true },
        { name: "複雜度", value: "O(n) / O(1)", inline: true },
        { name: "預估時間", value: "15 分鐘", inline: true },
        { name: "TypeScript Tip", value: overrides.tsTip ?? "ts tip" },
        { name: "Python Tip", value: overrides.pyTip ?? "py tip" },
      ],
    },
    {
      title: "🎯 Today's Challenge",
      description: "• [167. Two Sum II](https://leetcode.com/problems/x/)\n  Medium · why · Hint: h",
      color: 123456,
    },
    {
      color: 123456,
      fields: [
        { name: "🧭 學習路徑", value: "今天  Left-Right Pointer" },
        { name: "✅ Exit Criteria", value: "- [ ] 條件一" },
        { name: "💡 Takeaway", value: "一句話" },
      ],
    },
  ];
}

describe("checkBudget — 計算口徑與逐區塊上限", () => {
  it("計入 title/description/field name+value/footer/author，url/color 不計", () => {
    const embeds: DiscordEmbed[] = [
      { title: "T", description: "D", url: "https://example.com/should-not-count", color: 999 },
    ];
    const report = checkBudget(embeds);
    // "T" + "D" = 2 code points 計入 total；url 與 color 不計
    expect(report.total).toBe(2);
  });

  it("長度以 Unicode code point 計（emoji 不因 surrogate pair 被高估）", () => {
    const embeds: DiscordEmbed[] = [{ description: "📚" }];
    const report = checkBudget(embeds);
    expect(report.total).toBe(1);
  });

  it("回傳逐項明細而非布林，含 digest/tsTip/pyTip/exitCriteria/takeaway/pathFooter", () => {
    const report = checkBudget(makeLessonEmbeds());
    const names = report.items.map((i) => i.name);
    expect(names).toContain("digest");
    expect(names).toContain("tsTip");
    expect(names).toContain("pyTip");
    expect(names).toContain("exitCriteria");
    expect(names).toContain("takeaway");
    expect(names).toContain("pathFooter");
    expect(names).toContain("total");
    expect(report.ok).toBe(true);
  });

  it("digest 超過 900 時該項 over 為 true 且 report.ok 為 false", () => {
    const report = checkBudget(makeLessonEmbeds({ digest: "字".repeat(901) }));
    const digestItem = report.items.find((i) => i.name === "digest");
    expect(digestItem?.over).toBe(true);
    expect(report.ok).toBe(false);
  });

  it("總量超過 5500 或平台硬限 6000 時可由 totalLimit / hardLimit 判斷", () => {
    const report = checkBudget(makeLessonEmbeds());
    expect(report.totalLimit).toBe(5500);
    expect(report.hardLimit).toBe(6000);
  });
});

describe("checkBudget — 平台結構性上限（FR-006b）", () => {
  it("單 embed title 超過 256 → embed[0].title over 為 true", () => {
    const report = checkBudget([{ title: "x".repeat(257) }]);
    const item = report.items.find((i) => i.name === "embed[0].title");
    expect(item?.over).toBe(true);
    expect(report.ok).toBe(false);
  });

  it("單 embed description 超過 4096 → embed[0].description over 為 true", () => {
    const report = checkBudget([{ description: "x".repeat(4097) }]);
    const item = report.items.find((i) => i.name === "embed[0].description");
    expect(item?.over).toBe(true);
  });

  it("單 embed fields 數超過 25 → embed[0].fields.count over 為 true", () => {
    const fields = Array.from({ length: 26 }, (_, i) => ({ name: `f${i}`, value: "v" }));
    const report = checkBudget([{ fields }]);
    const item = report.items.find((i) => i.name === "embed[0].fields.count");
    expect(item?.over).toBe(true);
  });

  it("field name 超過 256 → embed[0].field[0].name over 為 true", () => {
    const report = checkBudget([{ fields: [{ name: "x".repeat(257), value: "v" }] }]);
    const item = report.items.find((i) => i.name === "embed[0].field[0].name");
    expect(item?.over).toBe(true);
  });

  it("field value 超過 1024 → embed[0].field[0].value over 為 true", () => {
    const report = checkBudget([{ fields: [{ name: "n", value: "x".repeat(1025) }] }]);
    const item = report.items.find((i) => i.name === "embed[0].field[0].value");
    expect(item?.over).toBe(true);
  });

  it("訊息 embed 數超過 10 → embeds.count over 為 true", () => {
    const embeds = Array.from({ length: 11 }, () => ({ title: "t" }));
    const report = checkBudget(embeds);
    const item = report.items.find((i) => i.name === "embeds.count");
    expect(item?.over).toBe(true);
  });

  it("problems.count 超過 3 為 defense-in-depth（主要守門在 compiler/problem.ts）", () => {
    const embeds = makeLessonEmbeds();
    embeds[1]!.description =
      "• [1. A](u)\n  Easy · w\n• [2. B](u)\n  Easy · w\n• [3. C](u)\n  Easy · w\n• [4. D](u)\n  Easy · w";
    const report = checkBudget(embeds);
    const item = report.items.find((i) => i.name === "problems.count");
    expect(item?.over).toBe(true);
    expect(report.ok).toBe(false);
  });
});

describe("checkBudget — 逐題切分不得靜默失效", () => {
  it("逐題切分使用與 renderer 同一顆 bullet 常數（版面調整無法單邊漂移）", () => {
    const embeds = makeLessonEmbeds();
    embeds[1]!.description = `${PROBLEM_BULLET}[167. Two Sum II](https://leetcode.com/problems/x/)\n  Medium · why`;

    const report = checkBudget(embeds);
    expect(report.items.find((i) => i.name === "problem[167]")).toBeDefined();
    expect(report.items.find((i) => i.name === "problems.parse")).toBeUndefined();
  });

  it("description 非空卻切不出任何一題 → problems.parse 標為 over 且 ok 為 false（fail loud）", () => {
    const embeds = makeLessonEmbeds();
    // 模擬未來把題目版面整段換成非 bullet 結構：舊行為會靜默略過逐題 350 與題數上限。
    embeds[1]!.description = "1. [167. Two Sum II](https://leetcode.com/problems/x/) — Medium · why";

    const report = checkBudget(embeds);
    const item = report.items.find((i) => i.name === "problems.parse");
    expect(item?.over).toBe(true);
    expect(report.ok).toBe(false);
  });

  it("題目 embed description 為空時不觸發 problems.parse", () => {
    const embeds = makeLessonEmbeds();
    embeds[1]!.description = "";
    const report = checkBudget(embeds);
    expect(report.items.find((i) => i.name === "problems.parse")).toBeUndefined();
  });
});

describe("checkBudget — 平台硬限 6,000", () => {
  it("total.hard 以實際 BudgetItem 存在，上限為 hardLimit", () => {
    const report = checkBudget(makeLessonEmbeds());
    const item = report.items.find((i) => i.name === "total.hard");
    expect(item).toBeDefined();
    expect(item?.limit).toBe(report.hardLimit);
    expect(item?.length).toBe(report.total);
  });

  it("總長超過 6,000 時 total.hard 亦為 over", () => {
    const report = checkBudget([{ description: "字".repeat(6001) }]);
    expect(report.items.find((i) => i.name === "total.hard")?.over).toBe(true);
  });
});
