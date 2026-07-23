import { EXIT_CRITERIA_PREFIX } from "./discord.js";
import type { DiscordEmbed, RenderedMessage } from "../types/lesson.js";

export interface BudgetItem {
  name: string;
  length: number;
  limit: number;
  over: boolean;
}

export interface BudgetReport {
  items: BudgetItem[];
  total: number;
  totalLimit: 5500;
  hardLimit: 6000;
  ok: boolean;
}

const TOTAL_LIMIT = 5500;
const HARD_LIMIT = 6000;

function codePointLength(s: string | undefined): number {
  return s ? Array.from(s).length : 0;
}

function makeItem(name: string, length: number, limit: number): BudgetItem {
  return { name, length, limit, over: length > limit };
}

function countedTextLength(embed: DiscordEmbed): number {
  let total = codePointLength(embed.title) + codePointLength(embed.description);
  for (const field of embed.fields ?? []) {
    total += codePointLength(field.name) + codePointLength(field.value);
  }
  total += codePointLength(embed.footer?.text);
  total += codePointLength(embed.author?.name);
  return total;
}

// 獨立純函式（憲章 IX）：對單一 RenderedMessage 同時檢查逐區塊預算、結構性上限與總量，
// 供 runtime 與 scripts/validate.ts 共用同一顆實作。budgetSlots 由 render() 提供，
// 值 MUST 是放進 embeds 的同一份字串實例，故此處不再反解析 embeds（research R10）。
export function checkBudget(message: RenderedMessage): BudgetReport {
  const { embeds, budgetSlots } = message;
  const items: BudgetItem[] = [];

  if (budgetSlots.digest !== undefined) {
    items.push(makeItem("digest", codePointLength(budgetSlots.digest), 900));
  }
  if (budgetSlots.tsTip !== undefined) {
    items.push(makeItem("tsTip", codePointLength(budgetSlots.tsTip), 450));
  }
  if (budgetSlots.pyTip !== undefined) {
    items.push(makeItem("pyTip", codePointLength(budgetSlots.pyTip), 450));
  }
  if (budgetSlots.overlayNotes !== undefined) {
    items.push(makeItem("overlayNotes", codePointLength(budgetSlots.overlayNotes), 400));
  }
  if (budgetSlots.takeaway !== undefined) {
    items.push(makeItem("takeaway", codePointLength(budgetSlots.takeaway), 120));
  }
  if (budgetSlots.pathFooter !== undefined) {
    items.push(makeItem("pathFooter", codePointLength(budgetSlots.pathFooter), 200));
  }
  if (budgetSlots.exitCriteria !== undefined) {
    items.push(makeItem("exitCriteria", codePointLength(budgetSlots.exitCriteria), 400));
    const lines = budgetSlots.exitCriteria.split("\n").filter((line) => line.length > 0);
    items.push(makeItem("exitCriteria.count", lines.length, 6));
    lines.forEach((line, i) => {
      const text = line.startsWith(EXIT_CRITERIA_PREFIX) ? line.slice(EXIT_CRITERIA_PREFIX.length) : line;
      items.push(makeItem(`exitCriteria[${i}]`, codePointLength(text), 60));
    });
  }
  if (budgetSlots.problems !== undefined) {
    budgetSlots.problems.forEach((entry, i) => {
      items.push(makeItem(`problem[${i}]`, codePointLength(entry), 350));
    });
    // 兜底檢查（唯一套用點在生成端 generate-schedule.ts，docs/spec.md §13.4）：
    // 命中代表課表缺陷，MUST NOT 由 Compiler / Renderer 截斷（data-model.md §5）。
    items.push(makeItem("problems.count", budgetSlots.problems.length, 3));
  }

  // 平台結構性上限：這些是平台會直接拒絕請求的硬限制，MUST 與逐區塊預算在同一次呼叫中檢查。
  embeds.forEach((embed, i) => {
    items.push(makeItem(`embed[${i}].title`, codePointLength(embed.title), 256));
    items.push(makeItem(`embed[${i}].description`, codePointLength(embed.description), 4096));
    items.push(makeItem(`embed[${i}].fields.count`, embed.fields?.length ?? 0, 25));
    (embed.fields ?? []).forEach((field, j) => {
      items.push(makeItem(`embed[${i}].field[${j}].name`, codePointLength(field.name), 256));
      items.push(makeItem(`embed[${i}].field[${j}].value`, codePointLength(field.value), 1024));
    });
  });
  items.push(makeItem("embeds.count", embeds.length, 10));

  const total = embeds.reduce((sum, embed) => sum + countedTextLength(embed), 0);
  items.push(makeItem("total", total, TOTAL_LIMIT));
  // 平台硬限（6,000）：目前恆被更嚴格的自訂上限（5,500）涵蓋，但 MUST 以實際 BudgetItem 存在，
  // 否則 `hardLimit` 只是報表上的裝飾——日後放寬 TOTAL_LIMIT 時會失去這道真正的平台級後盾。
  items.push(makeItem("total.hard", total, HARD_LIMIT));

  const ok = items.every((item) => !item.over);

  return { items, total, totalLimit: TOTAL_LIMIT, hardLimit: HARD_LIMIT, ok };
}
