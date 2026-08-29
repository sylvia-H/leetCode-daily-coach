// F12（憲章 XVII 一次性重生例外 §1）：Stage 2 的 per-article Gate 由 generate-content.ts 抽出，
// 供「產線生成」與「逐篇重驗（scripts/gate-articles.ts）」共用同一顆實作。
// 憲章 IX：MUST NOT 另立平行判準——任何新的驗證入口一律 import 本檔，不得自行拼一套近似檢查。
// 純邏輯 + 對 run-code-blocks 的 executor 呼叫；不做 process.exit、不寫檔。
import { parseArticle } from "../../src/compiler/content.js";
import { CONCEPT_BODY_MAX_CHARS, countConceptBodyChars } from "../../src/compiler/gate.js";
import { getProblemsForConcept } from "../../src/compiler/problem.js";
import { checkTraditionalChinese } from "../../src/compiler/traditional-chinese.js";
import { ARTICLE_BUDGET_LIMITS, PROBLEM_ENTRY_MAX } from "../../src/renderer/budget.js";
import { renderProblemEntry } from "../../src/renderer/discord.js";
import type { ConceptNode } from "../../src/types/curriculum.js";
import type { ProblemBank } from "../../src/types/problem.js";
import {
  checkCodeBlocks,
  createRealExecutor,
  extractCodeBlocks,
  findSectionsWithoutCode,
} from "../run-code-blocks.js";

export interface GateFailure {
  reason: string;
}

/**
 * 預算超標時附加的**可執行**縮減指示（只用於重生回饋，MUST NOT 併入首次生成的 prompt）。
 *
 * ## 為何只給數字不夠
 *
 * 原本的回饋只有「tsTip 1002/800」。字元數是 LLM **無法自我驗證**的量——它沒辦法邊寫邊數，
 * 這在模型的操作語彙裡是不可執行的指令。實測 graph-detect-cycle-directed 連續 6 次嘗試
 * （兩輪各 3 次）穩定落在 895～908，等於在同一個分佈裡反覆抽樣，回饋完全沒有改變行為。
 *
 * 改給**數得出來**的結構性約束（行數、句數、具體寫法）才能真正收斂。上限本身不再放寬：實測
 * 326 個 Tip 樣本的中位數僅 344、超過 650 者僅 4 筆（1.2%）、超過 800 者 0 筆——800 對絕大多數
 * 教材綽綽有餘，超標的是離群值而非判準過緊，再往上加只會重演同一齣戲。
 *
 * ## 為何 MUST NOT 放進首次生成的 prompt
 *
 * 161 篇已通過的教材是在沒有這些額外約束下寫成的（中位數 344，遠低於上限）。把「≤15 行、≤2 句」
 * 變成常態要求，會讓本來寬裕的篇章被無謂地壓縮、損失示範價值。這是**針對超標才施加**的補救措施。
 */
const BUDGET_RETRY_GUIDANCE = [
  "具體做法（MUST 照做，只給字元數你無法自行核算）：",
  "1. 該區塊的 fenced code block MUST 壓到 **15 行以內**（含空行），只保留示範核心邏輯所需的最短程式碼。",
  "2. 該區塊的說明文字 MUST 壓到 **2 句以內**。",
  "3. 若區塊內含 ListNode / TreeNode 等型別定義，MUST 改用最精簡寫法——TypeScript 用 constructor",
  "   參數屬性一行帶過，例如：",
  "   class TreeNode { constructor(public val: number, public left: TreeNode | null = null, public right: TreeNode | null = null) {} }",
  "   Python 用 dataclass 或最短的 __init__，MUST NOT 為型別定義寫註解或額外方法。",
  "4. 型別定義與測試資料 MUST NOT 佔用超過區塊的三分之一——主角是示範的演算法本身。",
].join("\n");

/** 逐關快檢（結構/字數 → 繁中 → 程式碼實測 → 題目正確性），失敗即回傳第一個失敗原因。 */
export async function runPerArticleGate(
  markdown: string,
  node: ConceptNode,
  bank: ProblemBank,
): Promise<GateFailure | undefined> {
  let article;
  try {
    article = parseArticle(markdown, node.id, node.articlePath);
  } catch (err) {
    return { reason: `結構/schema：${(err as Error).message}` };
  }

  const bodyChars = countConceptBodyChars(article.conceptBody);
  if (bodyChars > CONCEPT_BODY_MAX_CHARS) {
    return { reason: `觀念本體 ${bodyChars} 字，超過上限 ${CONCEPT_BODY_MAX_CHARS} 字` };
  }

  // Article frontmatter 的 `exit_criteria` 由 `assembleArticleMarkdown` 從 Skeleton **原樣複製**而來，
  // 兩份副本過去**沒有任何 Gate 比對**——F12 於 2026-08-29 翻譯 114 個 Skeleton 的 `exit_criteria`
  // 時發現此洞：改了 Skeleton 而漏改 Article，推播出去的仍是舊值，且不會有任何檢查失敗。
  // 憲章 XVII-2-2 (ii) 因此把「MUST 有自動 Gate 保證兩者逐字一致」列為該次翻譯授權的成立條件。
  const skeletonEc = node.exitCriteria;
  const articleEc = article.meta.exitCriteria;
  if (articleEc.length !== skeletonEc.length || articleEc.some((v, i) => v !== skeletonEc[i])) {
    return {
      reason:
        `exit_criteria 與 Skeleton 不一致：Article 有 ${articleEc.length} 條、Skeleton 有 ${skeletonEc.length} 條` +
        `——Article frontmatter 的 exit_criteria MUST 逐字複製自 Skeleton（憲章 XVII-2-2），` +
        `MUST NOT 手改。首個差異：Article=${JSON.stringify(articleEc.find((v, i) => v !== skeletonEc[i]) ?? null)}` +
        ` / Skeleton=${JSON.stringify(skeletonEc.find((v, i) => v !== articleEc[i]) ?? null)}`,
    };
  }
  const tc = checkTraditionalChinese(article.rawContent);
  if (!tc.ok) {
    return { reason: `繁中判準：${tc.violations.map((v) => v.message).join("; ")}` };
  }

  // §14.5 逐區塊預算（文章層級）。MUST 在此擋下，MUST NOT 只依賴批次末的全課表 Gate——後者要等
  // 165 篇全部生成完才跑，超標會在 2～4 天的批次結束時才一次爆出（實測 tsTip 561 / pyTip 532，
  // 而 per-article Gate 原本完全沒驗預算，該篇一路放行）。上限見 ARTICLE_BUDGET_LIMITS 的放寬說明。
  // 上限取自 renderer 的 ARTICLE_BUDGET_LIMITS（唯一來源，憲章 IX：不另立平行判準）。
  const overBudget = (
    [
      ["digest", article.digest],
      ["tsTip", article.tsTip],
      ["pyTip", article.pyTip],
      ["takeaway", article.takeaway],
    ] as const
  )
    .map(([slot, text]) => ({ slot, len: [...text].length, limit: ARTICLE_BUDGET_LIMITS[slot] }))
    .filter((x) => x.len > x.limit);
  if (overBudget.length > 0) {
    return {
      reason:
        `字元預算超標（§14.5）：${overBudget.map((x) => `${x.slot} ${x.len}/${x.limit}`).join("、")}——請精簡，MUST NOT 期待後續被截斷。\n` +
        BUDGET_RETRY_GUIDANCE,
    };
  }

  // MUST 先擋「區塊在、fence 不在」：否則 extractCodeBlocks 抽到 0 個區塊，checkCodeBlocks 自然
  // 無失敗可報，整篇文章會以「程式碼實測通過」的姿態放行（真空通過，見 findSectionsWithoutCode）。
  const sectionsWithoutCode = findSectionsWithoutCode(markdown);
  if (sectionsWithoutCode.length > 0) {
    return { reason: `程式碼區塊缺失：${sectionsWithoutCode.join("、")} 內找不到 fenced code block` };
  }

  const blocks = extractCodeBlocks(markdown);
  const codeResults = await checkCodeBlocks(blocks, createRealExecutor());
  const failedBlock = codeResults.find((r) => !r.ok);
  if (failedBlock) {
    return { reason: `程式碼實測（${failedBlock.section}）：${failedBlock.reason} ${failedBlock.detail ?? ""}`.trim() };
  }

  for (const id of node.leetcode) {
    if (!article.challenge.has(id)) {
      return { reason: `題目正確性：Today's Challenge 缺少題號 ${id} 的條目` };
    }
  }

  // 逐題預算（§14.5，每題 ≤350）。與 exit_criteria 不同，`whyThisPattern` / `hint` **由 LLM 產生**，
  // 重生確實修得好，故屬 per-article Gate。量測對象 MUST 是 renderer 的 renderProblemEntry 輸出——
  // 題目 title / url / difficulty 由程式從 Problem Bank 帶入（憲章 XV），只量 LLM 那段會低估實際長度。
  // 實測教訓：problem[0](449/350) 一路放行到批次末的全課表 Gate 才爆出。
  for (const meta of getProblemsForConcept(node.id, node.leetcode, bank)) {
    const entry = article.challenge.get(meta.id)!;
    const rendered = renderProblemEntry({
      id: meta.id,
      title: meta.title,
      url: meta.url,
      difficulty: meta.difficulty,
      whyThisPattern: entry.whyThisPattern,
      ...(entry.hint !== undefined ? { hint: entry.hint } : {}),
    });
    const len = [...rendered].length;
    if (len > PROBLEM_ENTRY_MAX) {
      return {
        reason: `字元預算超標（§14.5）：題號 ${meta.id} 的條目 ${len}/${PROBLEM_ENTRY_MAX} 字元——請精簡 whyThisPattern／hint，MUST NOT 期待後續被截斷`,
      };
    }
  }

  return undefined;
}
