import { describe, expect, it } from "vitest";
import { EXIT_CRITERIA_ITEM_MAX, MATERIAL_BUDGET_LIMITS, checkBudget } from "../../src/renderer/budget.js";
import type { BudgetSlots, DiscordEmbed, RenderedMessage } from "../../src/types/lesson.js";

function makeMessage(overrides: Partial<BudgetSlots> = {}): RenderedMessage {
  const digest = overrides.digest ?? "Digest 內容";
  const tsTip = overrides.tsTip ?? "ts tip";
  const pyTip = overrides.pyTip ?? "py tip";
  const exitCriteria = overrides.exitCriteria ?? "- [ ] 條件一";
  const takeaway = overrides.takeaway ?? "一句話";
  const pathFooter = overrides.pathFooter ?? "今天  Left-Right Pointer";
  const problems = overrides.problems ?? ["• [167. Two Sum II](https://leetcode.com/problems/x/)\n  Medium · why · Hint: h"];

  const embeds: DiscordEmbed[] = [
    {
      title: "📚 Session 1 · Left-Right Pointer",
      description: digest,
      color: 123456,
      fields: [
        { name: "Pattern", value: "Two Pointer", inline: true },
        { name: "複雜度", value: "O(n) / O(1)", inline: true },
        { name: "預估時間", value: "15 分鐘", inline: true },
        { name: "TypeScript Tip", value: tsTip },
        { name: "Python Tip", value: pyTip },
      ],
    },
    { title: "🎯 Today's Challenge", description: problems.join("\n"), color: 123456 },
    {
      color: 123456,
      fields: [
        { name: "🧭 學習路徑", value: pathFooter },
        { name: "✅ Exit Criteria", value: exitCriteria },
        { name: "💡 Takeaway", value: takeaway },
      ],
    },
  ];

  return { embeds, budgetSlots: { digest, tsTip, pyTip, exitCriteria, takeaway, pathFooter, problems } };
}

describe("checkBudget — 計算口徑與逐區塊上限", () => {
  it("計入 title/description/field name+value/footer/author，url/color 不計", () => {
    const message: RenderedMessage = {
      embeds: [{ title: "T", description: "D", url: "https://example.com/should-not-count", color: 999 }],
      budgetSlots: {},
    };
    const report = checkBudget(message);
    expect(report.total).toBe(2);
  });

  it("長度以 Unicode code point 計（emoji 不因 surrogate pair 被高估）", () => {
    const report = checkBudget({ embeds: [{ description: "📚" }], budgetSlots: {} });
    expect(report.total).toBe(1);
  });

  it("回傳逐項明細而非布林，含 digest/tsTip/pyTip/exitCriteria/takeaway/pathFooter", () => {
    const report = checkBudget(makeMessage());
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
    const report = checkBudget(makeMessage({ digest: "字".repeat(901) }));
    const digestItem = report.items.find((i) => i.name === "digest");
    expect(digestItem?.over).toBe(true);
    expect(report.ok).toBe(false);
  });

  it("總量超過 5500 或平台硬限 6000 時可由 totalLimit / hardLimit 判斷", () => {
    const report = checkBudget(makeMessage());
    expect(report.totalLimit).toBe(5500);
    expect(report.hardLimit).toBe(6000);
  });

  it("budgetSlots 未提供的欄位（如 overlayNotes）不會出現對應項目", () => {
    const report = checkBudget(makeMessage());
    expect(report.items.find((i) => i.name === "overlayNotes")).toBeUndefined();
  });

  it("overlayNotes 存在時檢查其 ≤400 上限", () => {
    const message = makeMessage();
    message.budgetSlots.overlayNotes = "字".repeat(401);
    const report = checkBudget(message);
    const item = report.items.find((i) => i.name === "overlayNotes");
    expect(item?.over).toBe(true);
    expect(report.ok).toBe(false);
  });
});

describe("checkBudget — exitCriteria 條數與單條長度（§10.2）", () => {
  it("條數超過 6 → exitCriteria.count over 為 true", () => {
    const lines = Array.from({ length: 7 }, (_, i) => `- [ ] 條件${i}`);
    const report = checkBudget(makeMessage({ exitCriteria: lines.join("\n") }));
    const item = report.items.find((i) => i.name === "exitCriteria.count");
    expect(item?.over).toBe(true);
    expect(report.ok).toBe(false);
  });

  it("單條超過 110（剝除 '- [ ] ' 前綴後量測）→ 對應 exitCriteria[i] over 為 true", () => {
    const report = checkBudget(makeMessage({ exitCriteria: `- [ ] ${"字".repeat(111)}` }));
    const item = report.items.find((i) => i.name === "exitCriteria[0]");
    expect(item?.over).toBe(true);
    expect(item?.length).toBe(111);
  });

  // 迴歸守衛（F7 定案 2026-07-31 由 60 放寬為 110）：實際課綱有 116 條落在 60～107 之間，
  // 若上限被改回 60，這批已凍結 Skeleton 會有 93 個 Concept 全面失敗且無從修復（不得手改生成物）。
  it("單條 107（實際課綱最長值）MUST 不超標", () => {
    const report = checkBudget(makeMessage({ exitCriteria: `- [ ] ${"a".repeat(107)}` }));
    const item = report.items.find((i) => i.name === "exitCriteria[0]");
    expect(item?.over).toBe(false);
    expect(EXIT_CRITERIA_ITEM_MAX).toBe(110);
  });
});

describe("checkBudget — 逐題預算（budgetSlots.problems）", () => {
  it("每題各自檢查 ≤350，並檢查 problems.count ≤3", () => {
    const report = checkBudget(makeMessage({ problems: ["a".repeat(10), "b".repeat(351)] }));
    expect(report.items.find((i) => i.name === "problem[0]")?.over).toBe(false);
    expect(report.items.find((i) => i.name === "problem[1]")?.over).toBe(true);
    expect(report.items.find((i) => i.name === "problems.count")?.over).toBe(false);
  });

  it("problems.count 超過 3 為兜底檢查（主要守門在生成端 generate-schedule.ts）", () => {
    const report = checkBudget(makeMessage({ problems: ["a", "b", "c", "d"] }));
    const item = report.items.find((i) => i.name === "problems.count");
    expect(item?.over).toBe(true);
    expect(report.ok).toBe(false);
  });

  it("budgetSlots.problems 未提供時不檢查 problems.count", () => {
    const message = makeMessage();
    delete message.budgetSlots.problems;
    const report = checkBudget(message);
    expect(report.items.find((i) => i.name === "problems.count")).toBeUndefined();
  });
});

describe("checkBudget — 平台結構性上限", () => {
  it("單 embed title 超過 256 → embed[0].title over 為 true", () => {
    const report = checkBudget({ embeds: [{ title: "x".repeat(257) }], budgetSlots: {} });
    const item = report.items.find((i) => i.name === "embed[0].title");
    expect(item?.over).toBe(true);
    expect(report.ok).toBe(false);
  });

  it("單 embed description 超過 4096 → embed[0].description over 為 true", () => {
    const report = checkBudget({ embeds: [{ description: "x".repeat(4097) }], budgetSlots: {} });
    const item = report.items.find((i) => i.name === "embed[0].description");
    expect(item?.over).toBe(true);
  });

  it("單 embed fields 數超過 25 → embed[0].fields.count over 為 true", () => {
    const fields = Array.from({ length: 26 }, (_, i) => ({ name: `f${i}`, value: "v" }));
    const report = checkBudget({ embeds: [{ fields }], budgetSlots: {} });
    const item = report.items.find((i) => i.name === "embed[0].fields.count");
    expect(item?.over).toBe(true);
  });

  it("field name 超過 256 → embed[0].field[0].name over 為 true", () => {
    const report = checkBudget({ embeds: [{ fields: [{ name: "x".repeat(257), value: "v" }] }], budgetSlots: {} });
    const item = report.items.find((i) => i.name === "embed[0].field[0].name");
    expect(item?.over).toBe(true);
  });

  it("field value 超過 1024 → embed[0].field[0].value over 為 true", () => {
    const report = checkBudget({ embeds: [{ fields: [{ name: "n", value: "x".repeat(1025) }] }], budgetSlots: {} });
    const item = report.items.find((i) => i.name === "embed[0].field[0].value");
    expect(item?.over).toBe(true);
  });

  it("訊息 embed 數超過 10 → embeds.count over 為 true", () => {
    const embeds = Array.from({ length: 11 }, () => ({ title: "t" }));
    const report = checkBudget({ embeds, budgetSlots: {} });
    const item = report.items.find((i) => i.name === "embeds.count");
    expect(item?.over).toBe(true);
  });
});

describe("checkBudget — 平台硬限 6,000", () => {
  it("total.hard 以實際 BudgetItem 存在，上限為 hardLimit", () => {
    const report = checkBudget(makeMessage());
    const item = report.items.find((i) => i.name === "total.hard");
    expect(item).toBeDefined();
    expect(item?.limit).toBe(report.hardLimit);
    expect(item?.length).toBe(report.total);
  });

  it("總長超過 6,000 時 total.hard 亦為 over", () => {
    const report = checkBudget({ embeds: [{ description: "字".repeat(6001) }], budgetSlots: {} });
    expect(report.items.find((i) => i.name === "total.hard")?.over).toBe(true);
  });
});

describe("checkBudget — reflectionQuestion / encouragement 上限取自 MATERIAL_BUDGET_LIMITS（FR-029）", () => {
  it("reflectionQuestion 剛好等於上限不 over，超過 1 個字元即 over（隨常數而動，非隨字面值）", () => {
    const atLimit = checkBudget({
      embeds: [{}],
      budgetSlots: { reflectionQuestion: "字".repeat(MATERIAL_BUDGET_LIMITS.reflectionQuestion) },
    });
    expect(atLimit.items.find((i) => i.name === "reflectionQuestion")?.over).toBe(false);

    const overLimit = checkBudget({
      embeds: [{}],
      budgetSlots: { reflectionQuestion: "字".repeat(MATERIAL_BUDGET_LIMITS.reflectionQuestion + 1) },
    });
    expect(overLimit.items.find((i) => i.name === "reflectionQuestion")?.over).toBe(true);
    expect(overLimit.items.find((i) => i.name === "reflectionQuestion")?.limit).toBe(
      MATERIAL_BUDGET_LIMITS.reflectionQuestion,
    );
  });

  it("encouragement 剛好等於上限不 over，超過 1 個字元即 over（隨常數而動，非隨字面值）", () => {
    const atLimit = checkBudget({
      embeds: [{}],
      budgetSlots: { encouragement: "字".repeat(MATERIAL_BUDGET_LIMITS.encouragement) },
    });
    expect(atLimit.items.find((i) => i.name === "encouragement")?.over).toBe(false);

    const overLimit = checkBudget({
      embeds: [{}],
      budgetSlots: { encouragement: "字".repeat(MATERIAL_BUDGET_LIMITS.encouragement + 1) },
    });
    expect(overLimit.items.find((i) => i.name === "encouragement")?.over).toBe(true);
    expect(overLimit.items.find((i) => i.name === "encouragement")?.limit).toBe(MATERIAL_BUDGET_LIMITS.encouragement);
  });
});
