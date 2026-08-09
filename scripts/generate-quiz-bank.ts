// F11 題庫產線入口（quiz-bank-schema.md §5）：build-time 生成 data/quiz-bank.json，
// 兩階段（面向列舉 → 據面向出題）＋ 獨立二次作答交叉驗證 ＋ 結構性 Gate 後過 Gate 凍結。
// process.exit / 檔案寫入 / LLM 呼叫 / 讀 node.skeletonPath 只在本檔（唯一 I/O 點，同
// generate-materials.ts 的形狀）。MUST NOT 寫入 concepts/**、articles/**、schedules/**、curriculum/**
// （quiz-bank-schema.md §5.6、FR-027、SC-009）。
//
// ⚠️ 交叉驗證的已知限制（FR-013 明文要求記錄於產線文件）：交叉驗證使用與生成同一模型家族
// （gemini-3.5-flash-lite）盲答，同模型家族可能對同一類錯誤有相關性（生成時的誤解也可能在盲答時
// 重演），故本機制 MUST NOT 被視為 100% 正確性保證，只是能攔下「答案本身有明顯歧義或錯誤」的
// 這一類問題。
//
// ⚠️ manifest 不追蹤 prompt 版本：跳過條件只綁 Concept Skeleton 雜湊（FR-015）。**改動本檔或
// scripts/lib/prompts/quiz-*.ts 的 prompt 內容後，直接重跑會因 Skeleton 未變而全部印出「跳過」、
// 零 LLM 呼叫、題庫一字不變**——prompt 迭代後 MUST 以 `--force`（可搭 `--only <conceptId>,...`）
// 重跑，否則會誤以為「調了 prompt 也沒用」。
import matter from "gray-matter";
import { loadCurriculum } from "../src/compiler/curriculum.js";
import { runContentGate } from "../src/compiler/gate.js";
import { loadCompilerDeps, loadOptionalMaterial } from "../src/compiler/lesson.js";
import {
  checkQuizBank,
  isAnswerUniqueLongestOption,
  quizBankSchema,
  QUIZ_BIAS_MAX_SHARE,
  QUIZ_BIAS_MIN_ITEMS,
  type QuizBank,
  type QuizItem,
  type QuizViolationRule,
} from "../src/compiler/quiz.js";
import type { ConceptNode, CurriculumGraph, Ordinal } from "../src/types/curriculum.js";
import { hashFile, writeFileAtomic } from "./lib/checkpoint.js";
import { createLlmClient, type LlmClient } from "./lib/llm-client.js";
import { rebalanceAnswerPositions } from "./lib/quiz-balance.js";
import {
  readQuizManifestFile,
  rebuildQuizManifest,
  saveQuizManifest,
  shouldSkipQuizConcept,
  upsertQuizConcept,
  type QuizManifest,
} from "./lib/quiz-checkpoint.js";
import {
  buildQuizAspectsPrompt,
  buildQuizAspectsResponseSchema,
  type QuizAspectsConceptBrief,
  type QuizAspectsInput,
} from "./lib/prompts/quiz-aspects.js";
import {
  buildQuizCrossCheckPrompt,
  buildQuizCrossCheckResponseSchema,
  parseQuizCrossCheckResponse,
} from "./lib/prompts/quiz-cross-check.js";
import {
  buildQuizItemsPrompt,
  buildQuizItemsResponseSchema,
  type DraftQuizItem,
} from "./lib/prompts/quiz-items.js";
import { stripJsonFence } from "./lib/prompts/self-check.js";

const MODULES_PATH = "curriculum/modules.json";
const CONCEPTS_DIR = "concepts";
const QUIZ_BANK_PATH = "data/quiz-bank.json";
export const MAX_REGEN = 3;
/** 單一 LLM 呼叫的基礎設施重試上限（解析失敗／逾時等，MUST NOT 計入 MAX_REGEN，FR-013、CHK014）。 */
const INFRA_RETRY_ATTEMPTS = 3;

/**
 * **集合層**判準：判斷對象是「該 Concept 的整個題目集合」而非單一題目，故 MUST 在交叉驗證丟棄
 * 題目之後、以存活集合為對象執行（FR-013a）。在草稿階段先判會用錯集合——交叉驗證可能改變題數、
 * 正解位置分布與選項長度分布，草稿通過不代表存活集合通過。兩條位置類判準另由
 * `rebalanceAnswerPositions` 於同一時點確定性滿足（quiz-bank-schema.md §5.2a）。
 */
const SET_LEVEL_RULES: ReadonlySet<QuizViolationRule> = new Set([
  "quiz-count-range",
  "quiz-answer-position-bias",
  "quiz-answer-position-coverage",
  "quiz-longest-option-bias",
]);

interface GenerateFailure {
  reason: string;
}

// ── ordinalOf 全序（cmpOrdinal 的私有複本，同 src/pages/**／src/compiler/material.ts 既有慣例） ──

function cmpOrdinal(a: Ordinal, b: Ordinal): number {
  return (
    a.moduleIndex - b.moduleIndex ||
    a.topicIndex - b.topicIndex ||
    a.localOrder - b.localOrder ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

function orderedConcepts(graph: CurriculumGraph): ConceptNode[] {
  return [...graph.concepts.values()].sort((a, b) => cmpOrdinal(graph.ordinalOf.get(a.id)!, graph.ordinalOf.get(b.id)!));
}

// ── Stage A 輸入組裝（唯一讀 node.skeletonPath 之處，quiz-bank-schema.md §5.5） ──────────────

const AUTHOR_HINT_LABELS = {
  "核心觀念": "核心觀念",
  "Pattern 辨識線索": "Pattern辨識線索",
  Thinking: "Thinking",
  "Common Mistakes": "CommonMistakes",
} as const;

/** 逐行解析 Author Hints 的 bullet list（`- {label}：{內容}`），支援換行續行。
 * TypeScript 重點／Python 重點 MUST NOT 被納入回傳（不在 AUTHOR_HINT_LABELS 之列，天然被排除）。 */
function parseAuthorHintBullets(content: string): Map<string, string> {
  const map = new Map<string, string>();
  let currentLabel: string | undefined;
  let buffer: string[] = [];

  const flush = () => {
    if (currentLabel !== undefined) map.set(currentLabel, buffer.join(" ").trim());
    buffer = [];
  };

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    const bulletMatch = /^-\s+([^：]+)：(.*)$/.exec(line);
    if (bulletMatch) {
      flush();
      currentLabel = bulletMatch[1]!.trim();
      buffer = [bulletMatch[2]!.trim()];
    } else if (currentLabel !== undefined && line !== "" && !line.startsWith("#")) {
      buffer.push(line);
    }
  }
  flush();
  return map;
}

function briefOf(graph: CurriculumGraph, conceptId: string): QuizAspectsConceptBrief | undefined {
  const node = graph.concepts.get(conceptId);
  if (!node) return undefined;
  return { id: node.id, title: node.title, learningGoal: node.learningGoal };
}

function buildAspectsInput(node: ConceptNode, graph: CurriculumGraph): QuizAspectsInput {
  const skeletonRaw = matter.read(node.skeletonPath).content;
  const bullets = parseAuthorHintBullets(skeletonRaw);
  return {
    concept: { id: node.id, title: node.title, learningGoal: node.learningGoal, exitCriteria: node.exitCriteria },
    authorHints: {
      核心觀念: bullets.get(AUTHOR_HINT_LABELS["核心觀念"]) ?? "",
      Pattern辨識線索: bullets.get(AUTHOR_HINT_LABELS["Pattern 辨識線索"]) ?? "",
      Thinking: bullets.get(AUTHOR_HINT_LABELS.Thinking) ?? "",
      CommonMistakes: bullets.get(AUTHOR_HINT_LABELS["Common Mistakes"]) ?? "",
    },
    neighbors: {
      prerequisite: node.prerequisite
        .map((id) => briefOf(graph, id))
        .filter((b): b is QuizAspectsConceptBrief => b !== undefined),
      next: node.next.map((id) => briefOf(graph, id)).filter((b): b is QuizAspectsConceptBrief => b !== undefined),
    },
  };
}

// ── 解析 LLM 回應（形狀不符即具名 throw，算成一次重生／基礎設施失敗） ──────────────────────

function parseDraftQuizAspects(raw: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`quiz-aspects-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as { aspects?: unknown } | null;
  if (
    typeof obj !== "object" ||
    obj === null ||
    !Array.isArray(obj.aspects) ||
    obj.aspects.length === 0 ||
    obj.aspects.some((a) => typeof a !== "string")
  ) {
    throw new Error("quiz-aspects-parse-error：LLM 回應缺少非空字串陣列欄位 aspects");
  }
  return obj.aspects;
}

function isValidDraftItem(item: unknown): item is DraftQuizItem {
  if (typeof item !== "object" || item === null) return false;
  const i = item as Partial<DraftQuizItem>;
  return (
    typeof i.stem === "string" &&
    Array.isArray(i.options) &&
    i.options.length === 4 &&
    i.options.every((o) => typeof o === "string") &&
    typeof i.answerIndex === "number" &&
    [0, 1, 2, 3].includes(i.answerIndex) &&
    Array.isArray(i.explanation) &&
    i.explanation.length === 5 &&
    i.explanation.every((e) => typeof e === "string") &&
    typeof i.aspect === "string"
  );
}

function parseDraftQuizItems(raw: string): DraftQuizItem[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`quiz-items-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as { items?: unknown } | null;
  if (typeof obj !== "object" || obj === null || !Array.isArray(obj.items) || !obj.items.every(isValidDraftItem)) {
    throw new Error("quiz-items-parse-error：LLM 回應的 items 陣列形狀不符");
  }
  return obj.items;
}

function toQuizItem(draft: DraftQuizItem): QuizItem {
  return {
    stem: draft.stem,
    options: draft.options as [string, string, string, string],
    answerIndex: draft.answerIndex as 0 | 1 | 2 | 3,
    explanation: draft.explanation as [string, string, string, string, string],
  };
}

/** 基礎設施重試（解析失敗／逾時等）：MUST NOT 計入 per-Concept 內容重生上限（MAX_REGEN，FR-013、CHK014）。
 * HTTP 層 429/5xx 重試已由 LlmClient 內部的 Throttle 承擔；此處額外處理「回應無法解析」這類
 * 非 HTTP 層失敗——重新呼叫一次 LLM 換取新的回應，而非直接判定內容不通過。 */
async function withInfraRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < INFRA_RETRY_ATTEMPTS; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

// ── 交叉驗證與換角度重出（quiz-bank-schema.md §4／§5.2） ─────────────────────────

/** 呼叫＋解析一併納入基礎設施重試（解析失敗與 HTTP 層失敗同屬「這次呼叫不可信」，MUST NOT
 * 只重試呼叫而讓解析失敗直接向上炸開）。重試耗盡後 MUST NOT 拋出——回到內容路徑，視為該題本輪
 * 交叉驗證未通過（quiz-bank-schema.md §4：「基礎設施重試耗盡後，才將該題視為本輪未通過」）。 */
async function crossCheckOne(llmClient: LlmClient, item: DraftQuizItem): Promise<boolean> {
  try {
    const response = await withInfraRetry(async () => {
      const raw = await llmClient.generate(
        buildQuizCrossCheckPrompt({ stem: item.stem, options: item.options as [string, string, string, string] }),
        buildQuizCrossCheckResponseSchema(),
      );
      return parseQuizCrossCheckResponse(raw);
    });
    return response.answerIndex === item.answerIndex;
  } catch {
    return false;
  }
}

/** 針對單一面向重出一題（換考核角度）。`feedback` 會成為 Stage B 的 retryFeedback，讓模型知道
 * 上一版哪裡不行。呼叫或解析失敗 ⇒ undefined（由呼叫端決定捨棄或保留原題）。 */
async function regenerateOneItem(
  llmClient: LlmClient,
  conceptId: string,
  conceptTitle: string,
  aspect: string,
  feedback?: string,
): Promise<DraftQuizItem | undefined> {
  try {
    const raw = await withInfraRetry(() =>
      llmClient.generate(
        buildQuizItemsPrompt({ conceptId, conceptTitle, aspects: [aspect], ...(feedback ? { retryFeedback: feedback } : {}) }),
        buildQuizItemsResponseSchema(),
      ),
    );
    return parseDraftQuizItems(raw)[0];
  } catch {
    return undefined;
  }
}

/** 逐題交叉驗證；不通過者針對其 aspect 重出一題（換角度），重生的題 MUST 再次通過交叉驗證才計入
 * survivors（不通過則捨棄，不再遞迴重試——下一輪 Concept 級重生仍有機會）。
 * 回傳 `DraftQuizItem[]` 而非 `QuizItem[]`：`aspect` MUST 保留到集合層修復階段
 * （`repairLongestOptionBias` 需要它才能對特定題重出），寫入題庫前才由 `toQuizItem` 剝除。 */
async function crossCheckAndRegenerate(
  llmClient: LlmClient,
  conceptId: string,
  conceptTitle: string,
  draftItems: DraftQuizItem[],
): Promise<DraftQuizItem[]> {
  const survivors: DraftQuizItem[] = [];
  for (const item of draftItems) {
    if (await crossCheckOne(llmClient, item)) {
      survivors.push(item);
      continue;
    }

    const regenItem = await regenerateOneItem(llmClient, conceptId, conceptTitle, item.aspect);
    if (!regenItem) continue; // 換角度重出仍失敗 ⇒ 此題捨棄，不計入 survivors
    if (await crossCheckOne(llmClient, regenItem)) {
      survivors.push(regenItem);
    }
  }
  return survivors;
}

/**
 * `quiz-longest-option-bias` 的**逐題**修復（quiz-bank-schema.md §5.2b）。
 *
 * **為何不直接讓整個 Concept 重生**：整輪重生要 Stage A + Stage B + 全部題的交叉驗證（n≈7 時約
 * 10 次呼叫），而且會把**已通過交叉驗證的好題一起丟掉**；實測 2026-08-07 全量跑到第 37 個 Concept
 * 時，19/37（51%）需要 2 輪以上，成本主要就花在這裡。改為只重出違規的那幾題，一輪約 4 次呼叫。
 *
 * **修復目標為隨機基準（25%）而非 Gate 上限（50%）**：修到剛好 50% 會讓題庫大量卡在擦邊值
 * （實測前 37 個 Concept 有 5 個恰為 50%），而「正解恆為最長」與「正解從不最長」是**同樣可利用**
 * 的線索，只是方向相反——真正要的是長度不帶訊號。故 MUST NOT 只修到剛好過關。
 *
 * **挑選順序 MUST 為確定性**：依「正解比次長選項多出的字元數」由大到小（同分以宣告序），
 * 先修最容易被長度看穿的題。MUST NOT 依賴 `Math.random()` 或物件列舉順序。
 *
 * **best-effort**：替換題 MUST 同時通過交叉驗證且本身不是唯一最長，否則保留原題（絕不倒退）。
 * 修完仍超標 ⇒ 由呼叫端的集合層 Gate 判本輪不通過，回到既有的 Concept 級重生路徑。
 */
async function repairLongestOptionBias(
  llmClient: LlmClient,
  conceptId: string,
  conceptTitle: string,
  survivors: DraftQuizItem[],
): Promise<DraftQuizItem[]> {
  if (survivors.length < QUIZ_BIAS_MIN_ITEMS) return survivors;

  const offenders = survivors.filter(isAnswerUniqueLongestOption);
  if (offenders.length / survivors.length <= QUIZ_BIAS_MAX_SHARE) return survivors; // 未超標 ⇒ 零呼叫

  // 修到隨機基準（四選一 ⇒ 25%）而非 Gate 上限。
  const target = Math.round(survivors.length * 0.25);
  const repairCount = offenders.length - target;

  /** 正解比「次長選項」多出的字元數；越大代表越容易用長度猜中。 */
  const margin = (item: DraftQuizItem): number => {
    const lengths = item.options.map((o) => [...o].length).sort((a, b) => b - a);
    return lengths[0]! - lengths[1]!;
  };

  const picked = survivors
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => isAnswerUniqueLongestOption(item))
    .sort((a, b) => margin(b.item) - margin(a.item) || a.index - b.index)
    .slice(0, repairCount);

  const repaired = [...survivors];
  for (const { item, index } of picked) {
    const replacement = await regenerateOneItem(
      llmClient,
      conceptId,
      conceptTitle,
      item.aspect,
      "上一版這一題的正解是四個選項中唯一最長的，學習者只要挑最長的就能猜對。" +
        "MUST 重出這一題，讓至少一個干擾項的篇幅不少於正解——補的 MUST 是實質的觀念內容，" +
        "MUST NOT 靠加上修飾語或贅詞灌長度。",
    );
    if (!replacement) continue; // 重出失敗 ⇒ 保留原題
    if (isAnswerUniqueLongestOption(replacement)) continue; // 沒改善 ⇒ 保留原題
    if (!(await crossCheckOne(llmClient, replacement))) continue; // 內容不可信 ⇒ 保留原題
    repaired[index] = replacement;
  }
  return repaired;
}

// ── per-Concept 生成（quiz-bank-schema.md §5.2 的完整流程） ──────────────────────

export async function generateQuizForConcept(
  llmClient: LlmClient,
  node: ConceptNode,
  graph: CurriculumGraph,
  /** 由呼叫端組裝（main() 的唯一 I/O 點，quiz-bank-schema.md §5.5）——本函式本身不讀檔，
   * 供單元測試以合成輸入直接驗證生成／重生／交叉驗證邏輯（同 generate-content.ts 的
   * generateOneConcept 對 authorHints 的既有處置）。 */
  aspectsInput: QuizAspectsInput,
): Promise<{ items?: QuizItem[]; failure?: GenerateFailure; attempts: number }> {
  let lastFailure: GenerateFailure | undefined;

  for (let attempt = 1; attempt <= MAX_REGEN; attempt++) {
    let aspects: string[];
    try {
      const raw = await withInfraRetry(() =>
        llmClient.generate(
          buildQuizAspectsPrompt({ ...aspectsInput, retryFeedback: lastFailure?.reason }),
          buildQuizAspectsResponseSchema(),
        ),
      );
      aspects = parseDraftQuizAspects(raw);
    } catch (err) {
      lastFailure = { reason: (err as Error).message };
      continue;
    }

    let draftItems: DraftQuizItem[];
    try {
      const raw = await withInfraRetry(() =>
        llmClient.generate(
          buildQuizItemsPrompt({ conceptId: node.id, conceptTitle: node.title, aspects, retryFeedback: lastFailure?.reason }),
          buildQuizItemsResponseSchema(),
        ),
      );
      draftItems = parseDraftQuizItems(raw);
    } catch (err) {
      lastFailure = { reason: (err as Error).message };
      continue;
    }

    // 逐題結構性檢查 MUST 復用 checkQuizBank（憲章 IX，MUST NOT 另寫一份 structuralGate）。
    // 此階段濾掉 SET_LEVEL_RULES——它們的判斷對象是「交叉驗證後的存活集合」而非草稿（FR-013a），
    // 在草稿階段先判會用錯集合：交叉驗證可能丟棄題目，改變題數與正解位置／長度分布。
    const tempBank: QuizBank = { version: 1, byConcept: { [node.id]: draftItems.map(toQuizItem) } };
    const structuralViolations = checkQuizBank({ quizBank: tempBank, graph }).filter(
      (v) => !SET_LEVEL_RULES.has(v.rule),
    );
    if (structuralViolations.length > 0) {
      lastFailure = { reason: structuralViolations.map((v) => v.message).join("; ") };
      continue;
    }

    const survivors = await crossCheckAndRegenerate(llmClient, node.id, node.title, draftItems);

    // FR-013a：集合層判準 MUST 在交叉驗證之後、以存活集合為對象執行，MUST NOT 顛倒順序。
    // 題數不足 3 單獨先判，訊息比 quiz-count-range 更貼近產線語境（指名是「交叉驗證後」不足）。
    if (survivors.length < 3) {
      lastFailure = { reason: `交叉驗證後存活題數不足 3（實際 ${survivors.length}）` };
      continue;
    }

    // quiz-longest-option-bias 的逐題修復（quiz-bank-schema.md §5.2b）：只重出違規的那幾題，
    // 保住已通過交叉驗證的好題。未超標時零呼叫。修完仍超標由下方集合層 Gate 判本輪不通過。
    const repaired = await repairLongestOptionBias(llmClient, node.id, node.title, survivors);

    // 正解位置的確定性重排（quiz-bank-schema.md §5.2a）：MUST 在交叉驗證與逐題修復之後、集合層
    // Gate 之前。之前 MUST NOT——那兩步會丟棄／替換題目而改變題數與內容，先排會排錯份數；
    // 之後 MUST NOT——那等於讓 Gate 檢查一份不是最終要寫入的內容。位置不帶語意，故 MUST NOT
    // 交給 LLM 決定再事後拒絕（靠重生達成均勻分布的誤殺率見 quiz-balance.ts 檔頭）。
    const balanced = rebalanceAnswerPositions(node.id, repaired.map(toQuizItem));

    // 對重排後的集合重跑**完整**判準：涵蓋題數上限（>10）與 quiz-longest-option-bias。少了這一步，
    // 違規內容會先被寫入題庫、直到批次末 runContentGate 才爆出來——屆時已無法在該 Concept 的重生
    // 迴圈內修正，只能整批非零 exit（實測 2026-08-07：3 個 Concept 產出 11～12 題就是這樣漏進檔案的）。
    // 兩條位置類判準此時已由 rebalanceAnswerPositions 保證通過，此處重跑是防禦性複驗（憲章 IX：
    // 判準只有一顆實作，MUST NOT 因「理應通過」就跳過）。
    const setLevelViolations = checkQuizBank({
      quizBank: { version: 1, byConcept: { [node.id]: balanced } },
      graph,
    });
    if (setLevelViolations.length > 0) {
      lastFailure = { reason: setLevelViolations.map((v) => v.message).join("; ") };
      continue;
    }

    return { items: balanced, attempts: attempt };
  }

  return { failure: lastFailure, attempts: MAX_REGEN };
}

// ── canonical 序列化（byConcept key 依 ordinalOf 全序，同輸入 → byte-identical） ──────────────

export function serializeQuizBank(byConcept: Record<string, QuizItem[]>, graph: CurriculumGraph): string {
  const ordered: Record<string, QuizItem[]> = {};
  for (const node of orderedConcepts(graph)) {
    if (byConcept[node.id] !== undefined) ordered[node.id] = byConcept[node.id]!;
  }
  const obj: QuizBank = { version: 1, byConcept: ordered };
  return `${JSON.stringify(obj, null, 2)}\n`;
}

// ── SC-010 統計（批次末，獨立於結構性 Gate 之外的觀察訊號，CHK004／CHK011） ───────────────────

function printSc010Stats(byConcept: Record<string, QuizItem[]>): void {
  const counts = Object.values(byConcept).map((items) => items.length);
  if (counts.length === 0) return;
  const at3Ratio = (counts.filter((c) => c === 3).length / counts.length) * 100;
  const avg = counts.reduce((a, c) => a + c, 0) / counts.length;
  console.log(`SC-010 統計：題數恰為 3 的 Concept 佔比 ${at3Ratio.toFixed(1)}%，全庫平均 ${avg.toFixed(2)} 題`);
  // 未達標 MUST NOT 視為非零 exit 的 CI 失敗條件——這是 prompt 設計品質的觀察訊號，與
  // checkQuizBank 的結構性 Gate 屬不同層級（T032 附註）。
  if (at3Ratio >= 40 || avg < 5) {
    console.warn("⚠️ SC-010 未達標（佔比 <40% 且平均 ≥5 才算達標）：MUST 視為 prompt 設計失敗並重新調整 quiz-aspects.ts / quiz-items.ts，MUST NOT 以補生成硬湊");
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────

function parseOnlyFlag(argv: string[]): Set<string> | undefined {
  const idx = argv.indexOf("--only");
  if (idx < 0 || !argv[idx + 1]) return undefined;
  return new Set(argv[idx + 1]!.split(","));
}

/**
 * `--rebalance-only`（quiz-bank-schema.md §5.1）：對**已凍結**的題庫就地重排正解位置，
 * **零 LLM 呼叫、零 manifest 變動**（重排不改題數也不改 Skeleton 雜湊，跳過條件不受影響）。
 * 用途：`quiz-balance.ts` 的位置指派邏輯調整後，讓既有題庫跟上而不必 `--force` 整批重生。
 */
function runRebalanceOnly(): number {
  const { graph } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  let bank: QuizBank | undefined;
  try {
    bank = loadOptionalMaterial(QUIZ_BANK_PATH, "quiz bank", quizBankSchema);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    return 1;
  }
  if (!bank) {
    console.error(`✗ ${QUIZ_BANK_PATH} 不存在，無可重排的題庫`);
    return 1;
  }

  const byConcept: Record<string, QuizItem[]> = {};
  for (const [conceptId, items] of Object.entries(bank.byConcept)) {
    byConcept[conceptId] = rebalanceAnswerPositions(conceptId, items);
  }
  writeFileAtomic(QUIZ_BANK_PATH, serializeQuizBank(byConcept, graph));
  console.log(`✓ 已重排 ${Object.keys(byConcept).length} 個 Concept 的正解位置（零 LLM 呼叫）`);

  // 重排後 MUST 立刻複驗：位置類判準理應由建構保證通過，但長度／題數等其餘判準不受重排影響，
  // 若原本就違規，此處 MUST 讓它以非零 exit code 現形，MUST NOT 靜默寫出。
  const violations = checkQuizBank({ quizBank: { version: 1, byConcept }, graph });
  for (const v of violations) console.error(`✗ ${v.rule}@${v.subject}：${v.message}`);
  return violations.length > 0 ? 1 : 0;
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const only = parseOnlyFlag(process.argv);

  if (process.argv.includes("--rebalance-only")) {
    process.exit(runRebalanceOnly());
    return;
  }

  // 缺 GEMINI_API_KEY MUST fail-fast、不寫任何檔案（憲章 VIII）：建構期即檢查。
  let llmClient: LlmClient;
  try {
    llmClient = createLlmClient(process.env);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
    return;
  }

  const { graph } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  const concepts = orderedConcepts(graph);

  let existingBank: QuizBank | undefined;
  try {
    existingBank = loadOptionalMaterial(QUIZ_BANK_PATH, "quiz bank", quizBankSchema);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}；MUST 先手動修復或刪除該檔再重跑（--force 不會繞過本檢查）`);
    process.exit(1);
    return;
  }
  const byConcept: Record<string, QuizItem[]> = existingBank?.byConcept ?? {};

  // manifest 遺失（.cache/ 為 gitignored）或損毀：由現存題庫反推重建，MUST NOT 降級為空 manifest
  // 後覆蓋全部題庫（data-model.md §10）。
  let manifest: QuizManifest =
    readQuizManifestFile() ??
    rebuildQuizManifest(
      concepts.map((node) => ({
        conceptId: node.id,
        skeletonHash: hashFile(node.skeletonPath),
        conceptExistsInFile: (byConcept[node.id]?.length ?? 0) > 0,
        itemCount: byConcept[node.id]?.length ?? 0,
      })),
    );

  let anyNeedsHumanReview = false;
  const needsHumanReviewIds: string[] = [];
  const skippedIds: string[] = [];

  for (const node of concepts) {
    if (only && !only.has(node.id)) continue;
    const skeletonHash = hashFile(node.skeletonPath);
    const conceptExistsInFile = (byConcept[node.id]?.length ?? 0) > 0;

    if (
      shouldSkipQuizConcept({ skeletonHash, conceptExistsInFile, manifestEntry: manifest.concepts[node.id], force })
    ) {
      skippedIds.push(node.id);
      continue;
    }

    const aspectsInput = buildAspectsInput(node, graph);
    const { items, failure, attempts } = await generateQuizForConcept(llmClient, node, graph, aspectsInput);
    if (items) {
      byConcept[node.id] = items;
      manifest = upsertQuizConcept(manifest, node.id, {
        skeletonHash,
        frozen: true,
        gatePassed: true,
        needsHumanReview: false,
        regenCount: attempts,
        itemCount: items.length,
      });
      saveQuizManifest(manifest);
      writeFileAtomic(QUIZ_BANK_PATH, serializeQuizBank(byConcept, graph));
      console.log(`✓ ${node.id}（第 ${attempts} 次嘗試通過，${items.length} 題）`);
    } else {
      // FR-010a：MUST 一次列出全部不足量 Concept，MUST NOT 遇到第一個即中止。
      anyNeedsHumanReview = true;
      needsHumanReviewIds.push(node.id);
      manifest = upsertQuizConcept(manifest, node.id, {
        skeletonHash,
        frozen: false,
        gatePassed: false,
        needsHumanReview: true,
        regenCount: MAX_REGEN,
        itemCount: byConcept[node.id]?.length ?? 0,
      });
      saveQuizManifest(manifest);
      console.error(`✗ ${node.id}：重生 ${MAX_REGEN} 次仍未通過（${failure?.reason ?? "未知原因"}），標記 needsHumanReview`);
    }
  }

  console.log(`跳過的 Concept（已凍結且通過 Gate，零重複 LLM 呼叫）：${skippedIds.length > 0 ? skippedIds.join(", ") : "（無）"}`);
  if (needsHumanReviewIds.length > 0) {
    console.error(`✗ 以下 Concept 標記 needsHumanReview：${needsHumanReviewIds.join(", ")}`);
  }

  printSc010Stats(byConcept);

  // 批次末：對全 Track × 全 Session 執行完整內容 Gate（含 checkQuizBank 的全庫結構檢查），
  // 重用每日 runtime 同一顆 Compiler / Gate（憲章 IX）。
  let batchViolationCount = 0;
  try {
    const deps = loadCompilerDeps();
    const result = runContentGate({ deps });
    batchViolationCount = result.violations.length;
    for (const v of result.violations) {
      console.error(`✗ [批次末 Gate][${v.rule}] ${v.subject ?? "-"}：${v.message}`);
    }
  } catch (err) {
    console.error(`✗ 批次末 Gate 無法執行：${(err as Error).message}`);
    batchViolationCount = 1;
  }

  if (anyNeedsHumanReview || batchViolationCount > 0) {
    process.exit(1);
    return;
  }
  console.log("✓ 題庫產線完成：全部 Concept 通過品質 Gate 並凍結，批次末 Gate 零違規。");
  process.exit(0);
}

if (process.argv[1]?.endsWith("generate-quiz-bank.ts")) {
  main();
}
