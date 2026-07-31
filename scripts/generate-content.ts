// F7 Stage 2 入口（contracts/stage2-content.md）：讀凍結 Skeleton → LLM 展開 Full Article →
// 品質 Gate 逐關 → 重生 ≤3 → 凍結。process.exit / 檔案寫入 / LLM 呼叫只在本檔與 scripts/lib/。
// Stage 2 MUST NOT 寫入 concepts/**（只讀凍結 Skeleton、只寫 articles/**，FR-024）——
// assembleArticleMarkdown 為純函式，結構欄位一律從 Skeleton 複製、MUST NOT 交給 LLM 決定
// （tests/unit/no-structure-mutation.test.ts 守）。
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import matter from "gray-matter";
import { loadCurriculum } from "../src/compiler/curriculum.js";
import { CONCEPT_BODY_MAX_CHARS, countConceptBodyChars, runContentGate } from "../src/compiler/gate.js";
import { loadCompilerDeps } from "../src/compiler/lesson.js";
import { checkTraditionalChinese } from "../src/compiler/traditional-chinese.js";
import {
  ARTICLE_BUDGET_LIMITS,
  EXIT_CRITERIA_COUNT_MAX,
  EXIT_CRITERIA_ITEM_MAX,
  EXIT_CRITERIA_TOTAL_MAX,
  PROBLEM_ENTRY_MAX,
} from "../src/renderer/budget.js";
import { EXIT_CRITERIA_PREFIX, renderProblemEntry } from "../src/renderer/discord.js";
import { getProblemsForConcept, loadProblemBank } from "../src/compiler/problem.js";
import { parseArticle } from "../src/compiler/content.js";
import type { ConceptNode } from "../src/types/curriculum.js";
import type { ProblemBank } from "../src/types/problem.js";
import {
  hashContent,
  readManifestFile,
  rebuildManifest,
  saveManifest,
  shouldSkip,
  upsertConcept,
  type Manifest,
} from "./lib/checkpoint.js";
import { createLlmClient, type LlmClient } from "./lib/llm-client.js";
import {
  buildStage2Prompt,
  buildStage2ResponseSchema,
  REQUIRED_ARTICLE_TEXT_FIELDS,
  type DraftArticleResponse,
  type DraftChallengeEntry,
} from "./lib/prompts/stage2-content.js";
import { buildSelfCheckPrompt, type SelfCheckResponse } from "./lib/prompts/self-check.js";
import {
  checkCodeBlocks,
  checkToolchain,
  createRealExecutor,
  extractCodeBlocks,
  findSectionsWithoutCode,
} from "./run-code-blocks.js";

const MODULES_PATH = "curriculum/modules.json";
const CONCEPTS_DIR = "concepts";
const PROBLEM_BANK_PATH = "data/problem-bank.json";
export const MAX_REGEN = 3;

export interface SkeletonBudgetViolation {
  conceptId: string;
  reason: string;
}

/**
 * 凍結 Skeleton 的 `exit_criteria` 預算前置檢查（§10.2 / §14.5）。
 *
 * ## 為何 MUST 在批次開始前檢查，而非放進 per-article Gate
 *
 * `exit_criteria` 由 `assembleArticleMarkdown` **從 Skeleton 原樣複製**進 Article frontmatter，
 * DraftArticleResponse 型別根本不含此欄位——**LLM 對它零影響力**（FR-024）。若把它塞進
 * `runPerArticleGate`，每篇會白白重生 3 次卻永遠修不好，最後標成 needsHumanReview，與
 * `checkToolchain` 擋的「Python 佔位程式」屬同一類「結構性問題偽裝成內容有錯」。
 *
 * 正確處置是**在任何 LLM 呼叫之前**一次驗完全部 Skeleton 並 fail loud：這類違規只能靠修 Skeleton
 * 或調整預算判準解決（實測 2026-07-31：116 條超過舊上限 60，導致批次末 Gate 261 筆違規中有 219 筆
 * 出自此處，而 165 篇 Article 全部無辜）。
 */
export function checkFrozenSkeletonBudgets(
  concepts: Iterable<Pick<ConceptNode, "id" | "exitCriteria">>,
): SkeletonBudgetViolation[] {
  const violations: SkeletonBudgetViolation[] = [];
  for (const node of concepts) {
    const items = node.exitCriteria;
    if (items.length > EXIT_CRITERIA_COUNT_MAX) {
      violations.push({
        conceptId: node.id,
        reason: `exit_criteria 共 ${items.length} 條，超過上限 ${EXIT_CRITERIA_COUNT_MAX} 條`,
      });
    }
    items.forEach((text, i) => {
      const len = [...text].length;
      if (len > EXIT_CRITERIA_ITEM_MAX) {
        violations.push({
          conceptId: node.id,
          reason: `exit_criteria[${i}] ${len} 字元，超過單條上限 ${EXIT_CRITERIA_ITEM_MAX}`,
        });
      }
    });
    // 總長 MUST 以 render 後的形態量測（含 checklist 前綴與換行），與 checkBudget 的量測對象一致。
    const rendered = items.map((t) => `${EXIT_CRITERIA_PREFIX}${t}`).join("\n");
    const total = [...rendered].length;
    if (total > EXIT_CRITERIA_TOTAL_MAX) {
      violations.push({
        conceptId: node.id,
        reason: `exit_criteria 合計 ${total} 字元，超過上限 ${EXIT_CRITERIA_TOTAL_MAX}`,
      });
    }
  }
  return violations;
}

export interface SkeletonFrontmatterForArticle {
  id: string;
  title: string;
  module: string;
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  exitCriteria: string[];
  leetcode: number[];
}

/** 剝除 LLM 回應可能夾帶的 ``` fence 後取 JSON 字面（Stage 2 各處共用）。 */
function stripJsonFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

// 欄位清單改由 stage2-content.ts 單一來源提供（見該處註解）：schema 的 required 與此處的逐欄
// 驗證 MUST 是同一份，否則「schema 要求了、解析端不驗」之類的落差極難察覺。

/**
 * 剝除 ``` fence 後解析為 DraftArticleResponse；形狀不符即具名 throw（由 generateOneConcept 接住、
 * 算成一次重生）。
 *
 * 逐欄驗證（而非只驗 challenge 後整包 cast）是必要的：`assembleArticleMarkdown` 會把欄位直接
 * 字串插值進文章，缺欄位時插進去的是字面字串 `undefined`——`requireSection` 找得到區塊、字數與
 * 繁中判準也全部放行，最後真的會推上 Discord。與 Stage 1 `normalizeDraftConcept` 的 fail loud
 * 標準一致。
 */
export function parseDraftArticleResponse(raw: string): DraftArticleResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`stage2-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("stage2-parse-error：LLM 回應不是 JSON 物件");
  }
  const obj = parsed as Partial<DraftArticleResponse> & Record<string, unknown>;

  const missing = REQUIRED_ARTICLE_TEXT_FIELDS.filter(
    (field) => typeof obj[field] !== "string" || (obj[field] as string).trim() === "",
  );
  if (missing.length > 0) {
    throw new Error(`stage2-parse-error：LLM 回應缺少必要區塊欄位（或為空字串）：${missing.join(", ")}`);
  }

  if (!Array.isArray(obj.challenge)) {
    throw new Error("stage2-parse-error：LLM 回應缺少 challenge 陣列");
  }
  obj.challenge.forEach((entry, i) => {
    const e = entry as Partial<DraftChallengeEntry> | null;
    if (typeof e?.id !== "number" || !Number.isInteger(e.id)) {
      throw new Error(`stage2-parse-error：challenge 第 ${i + 1} 筆的 id 不是整數：${JSON.stringify(entry)}`);
    }
    if (typeof e.whyThisPattern !== "string" || e.whyThisPattern.trim() === "") {
      throw new Error(`stage2-parse-error：challenge 第 ${i + 1} 筆（題號 ${e.id}）缺少 whyThisPattern`);
    }
    if (e.hint !== undefined && typeof e.hint !== "string") {
      throw new Error(`stage2-parse-error：challenge 第 ${i + 1} 筆（題號 ${e.id}）的 hint 不是字串`);
    }
  });

  return obj as DraftArticleResponse;
}

/**
 * DraftArticleResponse → Full Article markdown。結構欄位（id/title/module/pattern_label/
 * complexity_label/estimated_minutes/exit_criteria/題號集合）一律從 Skeleton 複製，DraftArticleResponse
 * 型別本身不含這些欄位——LLM 在型別層就無法覆寫（FR-024）。題號集合不符（新增/刪除/替換）即 throw，
 * 觸發上層重生，而非靜默接受。
 */
export function assembleArticleMarkdown(skeleton: SkeletonFrontmatterForArticle, draft: DraftArticleResponse): string {
  const draftIds = draft.challenge.map((c) => c.id);
  if (new Set(draftIds).size !== draftIds.length) {
    throw new Error(`article-structure-violation：challenge 題號重複：${draftIds.join(",")}`);
  }
  const draftIdSet = new Set(draftIds);
  const skeletonIdSet = new Set(skeleton.leetcode);
  const sameSet =
    draftIdSet.size === skeletonIdSet.size && [...skeletonIdSet].every((id) => draftIdSet.has(id));
  if (!sameSet) {
    throw new Error(
      `article-structure-violation：challenge 題號集合（${[...draftIdSet].join(",")}）與 Skeleton leetcode（${skeleton.leetcode.join(",")}）不一致——LLM 展開 MUST NOT 新增/刪除/替換題號`,
    );
  }

  const frontmatter = {
    id: skeleton.id,
    title: skeleton.title,
    module: skeleton.module,
    pattern_label: skeleton.patternLabel,
    complexity_label: skeleton.complexityLabel,
    estimated_minutes: skeleton.estimatedMinutes,
    exit_criteria: skeleton.exitCriteria,
  };

  const challengeMd =
    skeleton.leetcode.length > 0
      ? skeleton.leetcode
          .map((id) => {
            const entry = draft.challenge.find((c) => c.id === id)!;
            const hintLine = entry.hint ? `\n  - Hint: ${entry.hint}` : "";
            return `- **${id}** · ${entry.whyThisPattern}${hintLine}`;
          })
          .join("\n")
      // 「無題目觀念課」（spec §12.1）：MUST NOT 生出假的條目。舊版寫死 `- **1** · 佔位條目`，
      // 「1」會被讀者當成題號 1（Two Sum）——27 個 Concept 都會有這個誤導。改為一句說明散文：
      // requireSection 只要求區塊非空，parseChallengeEntries 對「有內容但無 list 條目」回傳空 Map。
      : "本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。";

  const body = [
    "## Concept",
    "",
    draft.concept,
    "",
    "## Thinking",
    "",
    draft.thinking,
    "",
    "## Pattern Recognition",
    "",
    draft.patternRecognition,
    "",
    "## Common Mistakes",
    "",
    draft.commonMistakes,
    "",
    "## Complexity",
    "",
    draft.complexity,
    "",
    "## Digest",
    "",
    draft.digest,
    "",
    "## TypeScript Tip",
    "",
    draft.tsTip,
    "",
    "## Python Tip",
    "",
    draft.pyTip,
    "",
    "## TypeScript Corner",
    "",
    draft.tsCorner,
    "",
    "## Python Corner",
    "",
    draft.pyCorner,
    "",
    "## Takeaway",
    "",
    draft.takeaway,
    "",
    "## Tomorrow Preview",
    "",
    draft.tomorrowPreview,
    "",
    "## Today's Challenge",
    "",
    challengeMd,
    "",
  ].join("\n");

  return matter.stringify(body, frontmatter);
}

function isSkeletonFrozen(allowDirty: boolean): boolean {
  if (allowDirty) return true;
  try {
    const status = execFileSync("git", ["status", "--porcelain", "--", CONCEPTS_DIR], { encoding: "utf-8" });
    return status.trim() === "";
  } catch {
    // git 不可用（例如非 repo 環境）：保守起見視為未凍結，要求明確 --allow-dirty。
    return false;
  }
}

function toSkeletonFrontmatter(node: ConceptNode): SkeletonFrontmatterForArticle {
  return {
    id: node.id,
    title: node.title,
    module: node.module,
    patternLabel: node.patternLabel,
    complexityLabel: node.complexityLabel,
    estimatedMinutes: node.estimatedMinutes,
    exitCriteria: node.exitCriteria,
    leetcode: node.leetcode,
  };
}

interface GateFailure {
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
async function runPerArticleGate(
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

/**
 * 剝除 ``` fence 後解析 self-check 回應；形狀不符即具名 throw。
 *
 * 不可對 `JSON.parse` 的結果直接 cast 後取 `response.issues.length`：LLM 回非 JSON、或回了 JSON
 * 但漏掉 `issues`，都會在此炸出例外；`runSelfCheck` 又是整批產線迴圈裡的一次呼叫，未接住就是整批
 * Stage 2 以 unhandled rejection 中止（連批次末 Gate 都不會跑到）。解析失敗語意上等同「這次審稿
 * 不可信」，應算成一次重生，而非讓產線死掉。
 */
export function parseSelfCheckResponse(raw: string): SelfCheckResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`self-check-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as Partial<SelfCheckResponse> | null;
  if (typeof obj !== "object" || obj === null || typeof obj.confident !== "boolean") {
    throw new Error("self-check-parse-error：LLM 回應缺少布林欄位 confident");
  }
  if (!Array.isArray(obj.issues) || obj.issues.some((i) => typeof i !== "string")) {
    throw new Error("self-check-parse-error：LLM 回應缺少字串陣列欄位 issues");
  }
  return { confident: obj.confident, issues: obj.issues };
}

async function runSelfCheck(llmClient: LlmClient, node: ConceptNode, markdown: string): Promise<GateFailure | undefined> {
  const prompt = buildSelfCheckPrompt({
    conceptId: node.id,
    title: node.title,
    patternLabel: node.patternLabel,
    complexityLabel: node.complexityLabel,
    articleMarkdown: markdown,
  });

  let response: SelfCheckResponse;
  try {
    response = parseSelfCheckResponse(await llmClient.generate(prompt));
  } catch (err) {
    // LLM 呼叫本身失敗（額度耗盡、網路）或回應形狀不符：一律降級為一次 Gate 失敗，交給重生迴圈。
    return { reason: `self-check：${(err as Error).message}` };
  }

  if (!response.confident || response.issues.length > 0) {
    return { reason: `self-check：${response.issues.join("; ") || "低信心"}` };
  }
  return undefined;
}

export async function generateOneConcept(
  llmClient: LlmClient,
  node: ConceptNode,
  authorHints: string,
  bank: ProblemBank,
): Promise<{ markdown?: string; failure?: GateFailure; attempts: number }> {
  const skeleton = toSkeletonFrontmatter(node);
  let lastFailure: GateFailure | undefined;

  for (let attempt = 1; attempt <= MAX_REGEN; attempt++) {
    const prompt = buildStage2Prompt({
      conceptId: node.id,
      title: node.title,
      patternLabel: node.patternLabel,
      complexityLabel: node.complexityLabel,
      learningGoal: node.learningGoal,
      exitCriteria: node.exitCriteria,
      authorHints,
      candidateProblems: node.leetcode.map((id) => ({ id })),
      // 首次無回饋；重生時帶上一次被 Gate 擋下的具名原因（俚語位置、缺失區塊、程式碼錯誤訊息…
      // 都已足夠具體，可直接作為修正指示）。少了這個，重生只是重擲同一顆骰子（見 Stage2PromptInput）。
      retryFeedback: lastFailure?.reason,
    });

    let markdown: string;
    try {
      const raw = await llmClient.generate(prompt, buildStage2ResponseSchema());
      const draft = parseDraftArticleResponse(raw);
      markdown = assembleArticleMarkdown(skeleton, draft);
    } catch (err) {
      lastFailure = { reason: (err as Error).message };
      continue;
    }

    const gateFailure = await runPerArticleGate(markdown, node, bank);
    if (gateFailure) {
      lastFailure = gateFailure;
      continue;
    }

    const selfCheckFailure = await runSelfCheck(llmClient, node, markdown);
    if (selfCheckFailure) {
      lastFailure = selfCheckFailure;
      continue;
    }

    return { markdown, attempts: attempt };
  }

  return { failure: lastFailure, attempts: MAX_REGEN };
}

function extractAuthorHints(skeletonRaw: string): string {
  return matter(skeletonRaw).content;
}

function parseOnlyFlag(argv: string[]): Set<string> | undefined {
  const idx = argv.indexOf("--only");
  if (idx < 0 || !argv[idx + 1]) return undefined;
  return new Set(argv[idx + 1]!.split(","));
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const allowDirty = process.argv.includes("--allow-dirty");
  const only = parseOnlyFlag(process.argv);

  if (!isSkeletonFrozen(allowDirty)) {
    console.error("✗ Skeleton 未定稿：工作目錄 concepts/** 有未提交變更，請先完成 outline 定稿並 commit（或明確帶 --allow-dirty，僅供開發用）。");
    process.exit(1);
    return;
  }

  // 工具鏈前置檢查 MUST 在任何 LLM 呼叫之前：環境沒裝 Python 時，每篇文章的 Python 區塊都會
  // execution-failed 並各重生 3 次，165 篇的批次會白燒 2～4 天才發現是環境問題（見 checkToolchain）。
  const toolchainFailures = await checkToolchain(createRealExecutor());
  if (toolchainFailures.length > 0) {
    console.error("✗ 工具鏈前置檢查未通過，未呼叫任何 LLM（教材程式碼將無法實測，批次不予開始）：");
    for (const f of toolchainFailures) console.error(`  [${f.lang}] ${f.detail}`);
    process.exit(1);
    return;
  }

  const { graph } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });

  // Skeleton 預算前置檢查，同樣 MUST 在任何 LLM 呼叫之前（理由見 checkFrozenSkeletonBudgets）：
  // exit_criteria 由 Skeleton 原樣帶入，重生無法修正，放進 per-article Gate 只會白燒重生額度。
  const skeletonViolations = checkFrozenSkeletonBudgets(graph.concepts.values());
  if (skeletonViolations.length > 0) {
    console.error(
      `✗ 凍結 Skeleton 的 exit_criteria 預算檢查未通過（${skeletonViolations.length} 筆），未呼叫任何 LLM——` +
        `此類違規 MUST 由修正 Skeleton 或調整 §14.5 判準解決，重生 Article 無效：`,
    );
    for (const v of skeletonViolations) console.error(`  [${v.conceptId}] ${v.reason}`);
    process.exit(1);
    return;
  }

  const { bank, loadViolations: bankViolations } = loadProblemBank(PROBLEM_BANK_PATH);
  const bankErrors = bankViolations.filter((v) => v.severity === "error");
  if (bankErrors.length > 0) {
    console.error(`✗ 題庫載入失敗，未呼叫任何 LLM：${bankErrors.map((v) => v.message).join("; ")}`);
    process.exit(1);
    return;
  }

  let llmClient: LlmClient;
  try {
    llmClient = createLlmClient(process.env);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
    return;
  }

  // manifest 遺失（.cache/ 為 gitignored 快取，換機器/清快取後即不存在）**或損毀**（寫入中途被
  // 打斷留下半截 JSON）：兩者都由掃描現存 concepts/** + articles/** 重建，避免把已凍結產物誤判為
  // 缺漏而重工（R4、FR-019/020）。此處 MUST 用 readManifestFile 而非 loadManifest——後者把損毀
  // 一併降級為空 manifest，會讓全部已凍結 Article 被重新生成並覆蓋。
  let manifest: Manifest =
    readManifestFile() ??
    rebuildManifest(
      [...graph.concepts.values()].map((node) => ({
        conceptId: node.id,
        skeletonContent: readFileSync(node.skeletonPath, "utf-8"),
        productExists: existsSync(node.articlePath),
      })),
    );
  let anyNeedsHumanReview = false;

  for (const node of graph.concepts.values()) {
    if (only && !only.has(node.id)) continue;

    const skeletonRaw = readFileSync(node.skeletonPath, "utf-8");
    const skeletonHash = hashContent(skeletonRaw);
    const articleExists = existsSync(node.articlePath);

    if (shouldSkip({ skeletonHash, productExists: articleExists, manifestEntry: manifest.concepts[node.id], force })) {
      continue;
    }

    const authorHints = extractAuthorHints(skeletonRaw);
    const { markdown, failure, attempts } = await generateOneConcept(llmClient, node, authorHints, bank);

    if (markdown) {
      mkdirSync(dirname(node.articlePath), { recursive: true });
      writeFileSync(node.articlePath, markdown, "utf-8");
      manifest = upsertConcept(manifest, node.id, {
        skeletonHash,
        skeletonFrozen: true,
        articleFrozen: true,
        gatePassed: true,
        needsHumanReview: false,
        regenCount: attempts,
      });
      console.log(`✓ ${node.id}（第 ${attempts} 次嘗試通過）`);
    } else {
      anyNeedsHumanReview = true;
      manifest = upsertConcept(manifest, node.id, {
        skeletonHash,
        skeletonFrozen: true,
        articleFrozen: false,
        gatePassed: false,
        needsHumanReview: true,
        regenCount: MAX_REGEN,
      });
      console.error(`✗ ${node.id}：重生 ${MAX_REGEN} 次仍未通過 Gate，標記 needsHumanReview（${failure?.reason ?? "未知原因"}）`);
    }
    saveManifest(manifest);
  }

  // 批次末：對全 Track × 全 Session 執行完整編譯/render/預算 Gate（重用每日 runtime 同一顆 Compiler）。
  let batchViolationCount = 0;
  try {
    const deps = loadCompilerDeps();
    const result = runContentGate({ deps });
    batchViolationCount = result.violations.length;
    for (const v of result.violations) {
      console.error(`✗ [批次末 Gate][${v.rule}] track=${v.track ?? "-"} session=${v.sessionIndex ?? "-"}：${v.message}`);
    }
  } catch (err) {
    console.error(`✗ 批次末 Gate 無法執行（素材載入失敗）：${(err as Error).message}`);
    batchViolationCount = 1;
  }

  if (anyNeedsHumanReview || batchViolationCount > 0) {
    process.exit(1);
    return;
  }
  console.log("✓ Stage 2 完成：全部 Concept 通過品質 Gate 並凍結，批次末 Gate 零違規。");
  process.exit(0);
}

if (process.argv[1]?.endsWith("generate-content.ts")) {
  main();
}
