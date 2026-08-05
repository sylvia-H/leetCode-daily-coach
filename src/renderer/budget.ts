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
 * ## tsTip / pyTip 由 450 → 650 → 800（F7 兩次放寬，皆定案於 2026-07-31）
 *
 * **第一次（450 → 650）**：這兩個區塊 MUST 內含一個 fenced code block **加上**說明文字，450 字元
 * 實測過緊——第一批產出為 561 / 532，且內容並不浮濫，是「寫得剛好」的長度。強壓只會逼出兩種壞結果：
 * 把程式碼砍到失去示範價值，或反覆重生浪費免費層額度。
 *
 * **第二次（650 → 800）**：起因是 Stage 2 prompt 新增「code block MUST self-contained」要求後，
 * 出現了 650 定案當時**不存在的成本**。教材片段會被單獨存檔編譯，沒有 LeetCode 平台環境，故凡涉及
 * `ListNode` / `TreeNode` 的 Concept MUST 在區塊內自行定義型別。實測（linked-list-cycle-start-node，
 * 修正後首篇通過者）：tsTip 共 432 字元，其中 `class ListNode` 定義獨佔 **210 字元**——這段對讀者
 * 有用（複製即可執行）卻無教學增量，等於先扣掉三分之一預算才輪到真正的示範與解說。
 *
 * 後果是 5 篇 linked-list / tree / graph 教材卡在 697～727 / 650（各超 47～77），且它們在 prompt
 * 修正前的失敗原因是 TS2304 / IndentationError 而非長度——是被自足性要求推過線的，不是內容浮濫。
 * 此處 MUST NOT 誤診為「Concept 顆粒度過大而需拆課綱」：165 個 Concept 中僅 1 個碰到觀念本體 2,000
 * 上限且只超 29 字（1.5%），若顆粒度真有問題會系統性顯現；而重跑 Stage 1 需重走 T021 人工核可
 * （憲章 XVII）並使 165 篇 Skeleton 雜湊全變、觸發全量重生，代價與「5 篇各超 50～80 字」完全不成比例。
 *
 * 放寬仍安全：concept Session 各 slot 上限加總為 digest 900 + tsTip 800 + pyTip 800 +
 * exitCriteria 400 + takeaway 120 + problems 3×350 + pathFooter 200 + overlayNotes 400 = **4,670**，
 * 距自訂總量上限 5,500 仍有 830 餘裕、距 Discord 硬限 6,000 有 1,330；實測最大 727 亦留 73 緩衝。
 * 總量檢查（`total` / `total.hard`）照舊把關，故單項放寬不會讓整則訊息失控。
 */
export const ARTICLE_BUDGET_LIMITS = {
  digest: 900,
  tsTip: 800,
  pyTip: 800,
  takeaway: 120,
} as const;

/**
 * `exit_criteria` 單條上限（§10.2 / §14.5）。**由 60 放寬為 110（F7 定案 2026-07-31）**。
 *
 * 原值 60 是由「整體 ≤400」除以「≤6 條」反推的均分值，而非對內容本身量過的判準。F7 全量課綱凍結後
 * 實測，這個反推值與現實嚴重不符：273 條 `exit_criteria` 中有 **116 條（42.5%）超標**，涉及
 * **93 / 165 個 Concept（56.4%）**，最長一條 107 字元。超標率過半代表問題出在判準、不是內容失控。
 *
 * 根因是中英文的字元密度差異：`exit_criteria` MUST 為英文完整句子（§11 技術術語保留英文），而 60
 * 字元的英文只夠寫十來個單字——「Can write a recursive function that reverses the rest of the list
 * and fixes pointer directions on unwinding」這種把驗收標準講清楚的句子必然破表。同樣 60 字元的
 * 中文資訊量是英文的數倍，沿用同一個數字等於對英文欄位隱性加嚴。
 *
 * 放寬是安全的，**總量預算完全不受影響**：真正的封頂是「整體 ≤400」與「≤6 條」，兩者皆未更動，
 * 且實測全 165 個 Concept 的整體長度最大僅 **197 / 400**、條數最大僅 **2 / 6**，離上限都很遠。
 * 換言之單條上限在此是被整體上限吸收的次級限制，放寬它不會讓 §14.5 的 5,500 總量鬆動。
 *
 * MUST NOT 改以「手改 93 個已凍結 Skeleton」解決——`concepts/**` 是生成物、依憲章 XIII 不得手改，
 * 而重跑 Stage 1 會使 165 篇 Article 的 Skeleton 雜湊全變、觸發全量重生（再燒兩天免費層額度），
 * 代價與收益完全不成比例。
 */
export const EXIT_CRITERIA_ITEM_MAX = 110;

/** `exitCriteria` 全部條目合計上限與條數上限（§14.5）。與單條上限同為具名常數，供產線前置檢查沿用。 */
export const EXIT_CRITERIA_TOTAL_MAX = 400;
export const EXIT_CRITERIA_COUNT_MAX = 6;

/**
 * 單一題目條目（render 後的 `• [id. title](url)\n  難度 · why · Hint: …`）上限（§14.5）。
 *
 * 具名匯出是為了讓 Stage 2 的 per-article Gate 能沿用同一數字：`whyThisPattern` / `hint` 由 LLM 產生、
 * 重生可修，但題目的 title / url / difficulty 由程式帶入，故長度 MUST 以 render 後的完整字串量測
 * （實測 problem[0] 449/350 只在批次末才爆出，per-article Gate 當時完全沒驗這項）。
 */
export const PROBLEM_ENTRY_MAX = 350;

/**
 * Reflection / 鼓勵語逐則上限（FR-029、research R9，contracts/material-schema.md §4）。
 * **單一來源**：`checkBudget`（render 後）、`src/compiler/material.ts` 的 `checkMaterials`
 * （素材層）、`scripts/generate-materials.ts` 的 per-batch 檢查 MUST 全部 import 此常數，
 * MUST NOT 出現第二處字面值。
 */
export const MATERIAL_BUDGET_LIMITS = {
  reflectionQuestion: 300,
  encouragement: 200,
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
    items.push(
      makeItem("reflectionQuestion", codePointLength(budgetSlots.reflectionQuestion), MATERIAL_BUDGET_LIMITS.reflectionQuestion),
    );
  }
  if (budgetSlots.encouragement !== undefined) {
    items.push(makeItem("encouragement", codePointLength(budgetSlots.encouragement), MATERIAL_BUDGET_LIMITS.encouragement));
  }
  if (budgetSlots.takeaway !== undefined) {
    items.push(makeItem("takeaway", codePointLength(budgetSlots.takeaway), ARTICLE_BUDGET_LIMITS.takeaway));
  }
  if (budgetSlots.pathFooter !== undefined) {
    items.push(makeItem("pathFooter", codePointLength(budgetSlots.pathFooter), 200));
  }
  if (budgetSlots.exitCriteria !== undefined) {
    items.push(makeItem("exitCriteria", codePointLength(budgetSlots.exitCriteria), EXIT_CRITERIA_TOTAL_MAX));
    const lines = budgetSlots.exitCriteria.split("\n").filter((line) => line.length > 0);
    items.push(makeItem("exitCriteria.count", lines.length, EXIT_CRITERIA_COUNT_MAX));
    lines.forEach((line, i) => {
      const text = line.startsWith(EXIT_CRITERIA_PREFIX) ? line.slice(EXIT_CRITERIA_PREFIX.length) : line;
      items.push(makeItem(`exitCriteria[${i}]`, codePointLength(text), EXIT_CRITERIA_ITEM_MAX));
    });
  }
  if (budgetSlots.problems !== undefined) {
    budgetSlots.problems.forEach((entry, i) => {
      items.push(makeItem(`problem[${i}]`, codePointLength(entry), PROBLEM_ENTRY_MAX));
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
