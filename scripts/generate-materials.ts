// F8 Stage 3 入口（contracts/material-schema.md §5）：build-time 生成 Reflection 問題庫與鼓勵語錄池，
// 過品質 Gate 後凍結入 data/reflection-bank.json / data/encouragement.json。
// process.exit / 檔案寫入 / LLM 呼叫只在本檔與 scripts/lib/（唯一入口，同 generate-content.ts 的形狀）。
// MUST NOT 寫入 concepts/**、articles/**、schedules/**、curriculum/**（FR-027、SC-009）。
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadCurriculum } from "../src/compiler/curriculum.js";
import { runContentGate } from "../src/compiler/gate.js";
import { loadCompilerDeps } from "../src/compiler/lesson.js";
import { isProgressCoupled, orderedTopicIds, type EncouragementPool, type ReflectionBank } from "../src/compiler/material.js";
import { checkTraditionalChinese } from "../src/compiler/traditional-chinese.js";
import { MATERIAL_BUDGET_LIMITS } from "../src/renderer/budget.js";
import type { CurriculumGraph } from "../src/types/curriculum.js";
import { hashContent } from "./lib/checkpoint.js";
import { createLlmClient, type LlmClient } from "./lib/llm-client.js";
import {
  ENCOURAGEMENT_BATCH_KEY,
  readMaterialManifestFile,
  rebuildMaterialManifest,
  saveMaterialManifest,
  shouldSkipBatch,
  upsertBatch,
  type MaterialManifest,
} from "./lib/material-checkpoint.js";
import {
  buildEncouragementPrompt,
  buildEncouragementResponseSchema,
  ENCOURAGEMENT_QUOTES_TARGET,
  type DraftEncouragementBatch,
} from "./lib/prompts/encouragement.js";
import {
  buildReflectionBankPrompt,
  buildReflectionBankResponseSchema,
  REFLECTION_QUESTIONS_PER_TOPIC,
  type DraftReflectionBatch,
} from "./lib/prompts/reflection-bank.js";
import {
  buildReflectionSelfCheckPrompt,
  parseSelfCheckResponse,
  stripJsonFence,
  type SelfCheckResponse,
} from "./lib/prompts/self-check.js";

const MODULES_PATH = "curriculum/modules.json";
const CONCEPTS_DIR = "concepts";
const REFLECTION_BANK_PATH = "data/reflection-bank.json";
const ENCOURAGEMENT_PATH = "data/encouragement.json";
export const MAX_REGEN = 3;
/** 提示詞版本常數：inputHash 的一部分（research R11）。改動 prompt 語意時 MUST 遞增，使既有續跑
 * 快取的 inputHash 自然失配，續跑時重新生成而非誤判為「未變更」而跳過。 */
const PROMPT_VERSION = 1;

interface GateFailure {
  reason: string;
}

// ── 解析 LLM 回應（形狀不符即具名 throw，算成一次重生） ──────────────────────

function parseDraftReflectionBatch(raw: string): DraftReflectionBatch {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`reflection-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as Partial<DraftReflectionBatch> | null;
  if (
    typeof obj !== "object" ||
    obj === null ||
    !Array.isArray(obj.questions) ||
    obj.questions.some((q) => typeof q !== "string")
  ) {
    throw new Error("reflection-parse-error：LLM 回應缺少字串陣列欄位 questions");
  }
  return { questions: obj.questions };
}

function parseDraftEncouragementBatch(raw: string): DraftEncouragementBatch {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`encouragement-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as Partial<DraftEncouragementBatch> | null;
  if (
    typeof obj !== "object" ||
    obj === null ||
    !Array.isArray(obj.quotes) ||
    obj.quotes.some((q) => typeof q !== "string")
  ) {
    throw new Error("encouragement-parse-error：LLM 回應缺少字串陣列欄位 quotes");
  }
  return { quotes: obj.quotes };
}

// ── per-batch Gate（寫檔前的草稿檢查；批次末另跑 checkMaterials 的全庫配額檢查，見 main） ──────

/** 逐則預算 + 繁中 + 批內去重（Reflection 與 Encouragement 共用；重用同一顆判準，憲章 IX）。 */
function checkBatchTextQuality(texts: readonly string[], limit: number): string | undefined {
  for (const [i, text] of texts.entries()) {
    const len = Array.from(text).length;
    if (len > limit) return `第 ${i + 1} 則長度 ${len} 超過上限 ${limit}：「${text}」`;
    const tc = checkTraditionalChinese(text);
    if (!tc.ok) return `第 ${i + 1} 則繁中判準：${tc.violations.map((v) => v.message).join("; ")}`;
  }
  const seen = new Set<string>();
  for (const [i, text] of texts.entries()) {
    if (seen.has(text)) return `第 ${i + 1} 則與批內其他則完全重複：「${text}」`;
    seen.add(text);
  }
  return undefined;
}

function runReflectionBatchGate(draft: DraftReflectionBatch): GateFailure | undefined {
  if (draft.questions.length !== REFLECTION_QUESTIONS_PER_TOPIC) {
    return { reason: `則數 ${draft.questions.length}，須恰為 ${REFLECTION_QUESTIONS_PER_TOPIC}` };
  }
  const reason = checkBatchTextQuality(draft.questions, MATERIAL_BUDGET_LIMITS.reflectionQuestion);
  return reason ? { reason } : undefined;
}

function runEncouragementBatchGate(draft: DraftEncouragementBatch): GateFailure | undefined {
  if (draft.quotes.length !== ENCOURAGEMENT_QUOTES_TARGET) {
    return { reason: `則數 ${draft.quotes.length}，須恰為 ${ENCOURAGEMENT_QUOTES_TARGET}` };
  }
  const qualityReason = checkBatchTextQuality(draft.quotes, MATERIAL_BUDGET_LIMITS.encouragement);
  if (qualityReason) return { reason: qualityReason };
  for (const [i, text] of draft.quotes.entries()) {
    if (isProgressCoupled(text)) {
      return { reason: `第 ${i + 1} 則疑似綁定進度（含連結／平台名／題號樣式）：「${text}」` };
    }
  }
  return undefined;
}

async function runReflectionSelfCheck(
  llmClient: LlmClient,
  topicId: string,
  topicTitle: string,
  questions: string[],
): Promise<GateFailure | undefined> {
  const prompt = buildReflectionSelfCheckPrompt({ topicId, topicTitle, questions });
  let response: SelfCheckResponse;
  try {
    response = parseSelfCheckResponse(await llmClient.generate(prompt));
  } catch (err) {
    // 解析失敗語意上等同「這次審稿不可信」⇒ 算一次重生，MUST NOT 讓整批以 unhandled rejection 中止。
    return { reason: `self-check：${(err as Error).message}` };
  }
  if (!response.confident || response.issues.length > 0) {
    return { reason: `self-check：${response.issues.join("; ") || "低信心"}` };
  }
  return undefined;
}

export async function generateReflectionBatch(
  llmClient: LlmClient,
  topicId: string,
  topicTitle: string,
): Promise<{ questions?: string[]; failure?: GateFailure; attempts: number }> {
  let lastFailure: GateFailure | undefined;

  for (let attempt = 1; attempt <= MAX_REGEN; attempt++) {
    let draft: DraftReflectionBatch;
    try {
      const prompt = buildReflectionBankPrompt({ topicId, topicTitle, retryFeedback: lastFailure?.reason });
      const raw = await llmClient.generate(prompt, buildReflectionBankResponseSchema());
      draft = parseDraftReflectionBatch(raw);
    } catch (err) {
      lastFailure = { reason: (err as Error).message };
      continue;
    }

    const gateFailure = runReflectionBatchGate(draft);
    if (gateFailure) {
      lastFailure = gateFailure;
      continue;
    }

    const selfCheckFailure = await runReflectionSelfCheck(llmClient, topicId, topicTitle, draft.questions);
    if (selfCheckFailure) {
      lastFailure = selfCheckFailure;
      continue;
    }

    return { questions: draft.questions, attempts: attempt };
  }

  return { failure: lastFailure, attempts: MAX_REGEN };
}

export async function generateEncouragementBatch(
  llmClient: LlmClient,
): Promise<{ quotes?: string[]; failure?: GateFailure; attempts: number }> {
  let lastFailure: GateFailure | undefined;

  for (let attempt = 1; attempt <= MAX_REGEN; attempt++) {
    let draft: DraftEncouragementBatch;
    try {
      const prompt = buildEncouragementPrompt({ retryFeedback: lastFailure?.reason });
      const raw = await llmClient.generate(prompt, buildEncouragementResponseSchema());
      draft = parseDraftEncouragementBatch(raw);
    } catch (err) {
      lastFailure = { reason: (err as Error).message };
      continue;
    }

    const gateFailure = runEncouragementBatchGate(draft);
    if (gateFailure) {
      lastFailure = gateFailure;
      continue;
    }

    // FR-028b：語錄池 MUST NOT 跑 self-check（切題性判準不適用於與進度無關的通用語錄）。
    return { quotes: draft.quotes, attempts: attempt };
  }

  return { failure: lastFailure, attempts: MAX_REGEN };
}

// ── canonical 序列化（FR-009a，data-model.md §1）────────────────────────────

export function serializeReflectionBank(byTopic: Record<string, string[]>, graph: CurriculumGraph): string {
  const ordered: Record<string, string[]> = {};
  for (const topicId of orderedTopicIds(graph)) {
    if (byTopic[topicId] !== undefined) ordered[topicId] = byTopic[topicId];
  }
  const obj: ReflectionBank = { version: 1, byTopic: ordered };
  return `${JSON.stringify(obj, null, 2)}\n`;
}

export function serializeEncouragementPool(quotes: string[]): string {
  const obj: EncouragementPool = { version: 1, quotes };
  return `${JSON.stringify(obj, null, 2)}\n`;
}

function reflectionInputHash(topicId: string, topicTitle: string): string {
  return hashContent(`reflection-bank:v${PROMPT_VERSION}:${topicId}:${topicTitle}`);
}

function encouragementInputHash(): string {
  return hashContent(`encouragement:v${PROMPT_VERSION}:target=${ENCOURAGEMENT_QUOTES_TARGET}`);
}

// ── CLI ──────────────────────────────────────────────────────────────────

function parseOnlyFlag(argv: string[]): Set<string> | undefined {
  const idx = argv.indexOf("--only");
  if (idx < 0 || !argv[idx + 1]) return undefined;
  return new Set(argv[idx + 1]!.split(","));
}

function parseStageFlag(argv: string[]): "reflection" | "encouragement" | undefined {
  const idx = argv.indexOf("--stage");
  if (idx < 0) return undefined;
  const value = argv[idx + 1];
  if (value !== "reflection" && value !== "encouragement") {
    throw new Error(`--stage 僅接受 reflection 或 encouragement，收到：${value ?? "(缺值)"}`);
  }
  return value;
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const only = parseOnlyFlag(process.argv);
  let stage: "reflection" | "encouragement" | undefined;
  try {
    stage = parseStageFlag(process.argv);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
    return;
  }

  // 缺 GEMINI_API_KEY MUST fail-fast、不寫任何檔案（憲章 VIII、contracts/material-schema.md §5.1）：
  // 建構期即檢查，早於任何讀檔／寫檔動作。
  let llmClient: LlmClient;
  try {
    llmClient = createLlmClient(process.env);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
    return;
  }

  const { graph } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  const topicIds = orderedTopicIds(graph);

  const byTopic: Record<string, string[]> = existsSync(REFLECTION_BANK_PATH)
    ? (JSON.parse(readFileSync(REFLECTION_BANK_PATH, "utf-8")) as ReflectionBank).byTopic
    : {};
  let quotes: string[] = existsSync(ENCOURAGEMENT_PATH)
    ? (JSON.parse(readFileSync(ENCOURAGEMENT_PATH, "utf-8")) as EncouragementPool).quotes
    : [];

  // manifest 遺失（.cache/ 為 gitignored）或損毀：由現存素材檔反推重建，MUST NOT 降級為空 manifest
  // 後覆蓋全部素材（data-model.md §9）。
  let manifest: MaterialManifest =
    readMaterialManifestFile() ??
    rebuildMaterialManifest([
      ...topicIds.map((topicId) => ({
        key: topicId,
        inputHash: reflectionInputHash(topicId, graph.topics.get(topicId)!.title),
        batchExistsInFile: (byTopic[topicId]?.length ?? 0) > 0,
      })),
      {
        key: ENCOURAGEMENT_BATCH_KEY,
        inputHash: encouragementInputHash(),
        batchExistsInFile: quotes.length > 0,
      },
    ]);

  let anyNeedsHumanReview = false;
  const skippedBatches: string[] = [];

  if (stage === undefined || stage === "reflection") {
    for (const topicId of topicIds) {
      if (only && !only.has(topicId)) continue;
      const topicTitle = graph.topics.get(topicId)!.title;
      const inputHash = reflectionInputHash(topicId, topicTitle);
      const batchExistsInFile = (byTopic[topicId]?.length ?? 0) > 0;

      if (shouldSkipBatch({ inputHash, batchExistsInFile, manifestEntry: manifest.batches[topicId], force })) {
        skippedBatches.push(topicId);
        continue;
      }

      const { questions, failure, attempts } = await generateReflectionBatch(llmClient, topicId, topicTitle);
      if (questions) {
        byTopic[topicId] = questions;
        manifest = upsertBatch(manifest, topicId, {
          inputHash,
          frozen: true,
          gatePassed: true,
          needsHumanReview: false,
          regenCount: attempts,
        });
        saveMaterialManifest(manifest);
        mkdirSync(dirname(REFLECTION_BANK_PATH), { recursive: true });
        writeFileSync(REFLECTION_BANK_PATH, serializeReflectionBank(byTopic, graph), "utf-8");
        console.log(`✓ reflection:${topicId}（第 ${attempts} 次嘗試通過）`);
      } else {
        anyNeedsHumanReview = true;
        manifest = upsertBatch(manifest, topicId, {
          inputHash,
          frozen: false,
          gatePassed: false,
          needsHumanReview: true,
          regenCount: MAX_REGEN,
        });
        saveMaterialManifest(manifest);
        console.error(
          `✗ reflection:${topicId}：重生 ${MAX_REGEN} 次仍未通過 Gate，標記 needsHumanReview（${failure?.reason ?? "未知原因"}）`,
        );
      }
    }
  }

  if (stage === undefined || stage === "encouragement") {
    const key = ENCOURAGEMENT_BATCH_KEY;
    if (!only || only.has(key)) {
      const inputHash = encouragementInputHash();
      const batchExistsInFile = quotes.length > 0;

      if (shouldSkipBatch({ inputHash, batchExistsInFile, manifestEntry: manifest.batches[key], force })) {
        skippedBatches.push(key);
      } else {
        const { quotes: generated, failure, attempts } = await generateEncouragementBatch(llmClient);
        if (generated) {
          quotes = generated;
          manifest = upsertBatch(manifest, key, {
            inputHash,
            frozen: true,
            gatePassed: true,
            needsHumanReview: false,
            regenCount: attempts,
          });
          saveMaterialManifest(manifest);
          mkdirSync(dirname(ENCOURAGEMENT_PATH), { recursive: true });
          writeFileSync(ENCOURAGEMENT_PATH, serializeEncouragementPool(quotes), "utf-8");
          console.log(`✓ encouragement（第 ${attempts} 次嘗試通過）`);
        } else {
          anyNeedsHumanReview = true;
          manifest = upsertBatch(manifest, key, {
            inputHash,
            frozen: false,
            gatePassed: false,
            needsHumanReview: true,
            regenCount: MAX_REGEN,
          });
          saveMaterialManifest(manifest);
          console.error(
            `✗ encouragement：重生 ${MAX_REGEN} 次仍未通過 Gate，標記 needsHumanReview（${failure?.reason ?? "未知原因"}）`,
          );
        }
      }
    }
  }

  // FR-026a：MUST 輸出被跳過的批次清單（SC-008 的可觀測性要求）。
  console.log(`跳過的批次（已凍結且通過 Gate，零重複 LLM 呼叫）：${skippedBatches.length > 0 ? skippedBatches.join(", ") : "（無）"}`);

  // 批次末：對全 Track × 全 Session 執行完整內容 Gate（含 checkMaterials 的全庫配額檢查），
  // 重用每日 runtime 同一顆 Compiler / Gate（憲章 IX，research R8）。
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
  console.log("✓ Stage 3 完成：全部批次通過品質 Gate 並凍結，批次末 Gate 零違規。");
  process.exit(0);
}

if (process.argv[1]?.endsWith("generate-materials.ts")) {
  main();
}
