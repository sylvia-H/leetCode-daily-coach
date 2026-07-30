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

/**
 * §14.5 中**由 Article 本身決定**的逐區塊上限（與 Track / 課表無關）。
 *
 * 抽成具名常數是為了讓 Stage 2 的 per-article Gate 能在**不組出 RenderedMessage 的情況下**沿用
 * 同一組數值——`checkBudget` 需要完整的 `RenderedMessage`（要有課表與 Track 脈絡），生成單篇文章時
 * 拿不到。實測教訓：per-article Gate 原本完全沒驗預算，超標只在批次末的全課表 Gate 才會爆出，
 * 等於 165 篇跑完 2～4 天後才發現。
 *
 * MUST 是唯一來源：兩處各寫一份數字必然漂移，屆時「生成期放行、CI 擋下」會非常難查。
 *
 * ## tsTip / pyTip 由 450 放寬為 650（F7 定案 2026-07-31）
 *
 * 這兩個區塊 MUST 內含一個 fenced code block **加上**說明文字，450 字元實測過緊——第一批產出為
 * 561 / 532，且內容並不浮濫，是「寫得剛好」的長度。強壓只會逼出兩種壞結果：把程式碼砍到失去
 * 示範價值，或反覆重生浪費免費層額度。
 *
 * 放寬是安全的：concept Session 各 slot 上限加總為 digest 900 + tsTip 650 + pyTip 650 +
 * exitCriteria 400 + takeaway 120 + problems 3×350 + pathFooter 200 + overlayNotes 400 = **4,370**，
 * 距自訂總量上限 5,500 仍有 1,130 餘裕、距 Discord 硬限 6,000 有 1,630。總量檢查（`total` /
 * `total.hard`）照舊把關，故單項放寬不會讓整則訊息失控。
 */
export const ARTICLE_BUDGET_LIMITS = {
  digest: 900,
  tsTip: 650,
  pyTip: 650,
  takeaway: 120,
} as const;

// 獨立純函式（憲章 IX）：對單一 RenderedMessage 同時檢查逐區塊預算、結構性上限與總量，
// 供 runtime 與 scripts/validate.ts 共用同一顆實作。budgetSlots 由 render() 提供，
// 值 MUST 是放進 embeds 的同一份字串實例，故此處不再反解析 embeds（research R10）。
export function checkBudget(message: RenderedMessage): BudgetReport {
  const { embeds, budgetSlots } = message;
  const items: BudgetItem[] = [];

  if (budgetSlots.digest !== undefined) {
    items.push(makeItem("digest", codePointLength(budgetSlots.digest), ARTICLE_BUDGET_LIMITS.digest));
  }
  if (budgetSlots.tsTip !== undefined) {
    items.push(makeItem("tsTip", codePointLength(budgetSlots.tsTip), ARTICLE_BUDGET_LIMITS.tsTip));
  }
  if (budgetSlots.pyTip !== undefined) {
    items.push(makeItem("pyTip", codePointLength(budgetSlots.pyTip), ARTICLE_BUDGET_LIMITS.pyTip));
  }
  if (budgetSlots.overlayNotes !== undefined) {
    items.push(makeItem("overlayNotes", codePointLength(budgetSlots.overlayNotes), 400));
  }
  // Reflection / 鼓勵語（docs/spec.md §14.5，F5 定案）：素材由 F8 灌入，但預算 MUST 現在就存在——
  // 否則 F8 的第一批素材會在完全沒有逐區塊把關的情況下上線。
  if (budgetSlots.reflectionQuestion !== undefined) {
    items.push(makeItem("reflectionQuestion", codePointLength(budgetSlots.reflectionQuestion), 300));
  }
  if (budgetSlots.encouragement !== undefined) {
    items.push(makeItem("encouragement", codePointLength(budgetSlots.encouragement), 200));
  }
  if (budgetSlots.takeaway !== undefined) {
    items.push(makeItem("takeaway", codePointLength(budgetSlots.takeaway), ARTICLE_BUDGET_LIMITS.takeaway));
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
