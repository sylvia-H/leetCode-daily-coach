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
import { parseArticle } from "../src/compiler/content.js";
import type { ConceptNode } from "../src/types/curriculum.js";
import {
  DEFAULT_MANIFEST_PATH,
  hashContent,
  loadManifest,
  rebuildManifest,
  saveManifest,
  shouldSkip,
  upsertConcept,
  type Manifest,
} from "./lib/checkpoint.js";
import { createLlmClient, type LlmClient } from "./lib/llm-client.js";
import { buildStage2Prompt, type DraftArticleResponse } from "./lib/prompts/stage2-content.js";
import { buildSelfCheckPrompt, type SelfCheckResponse } from "./lib/prompts/self-check.js";
import { checkCodeBlocks, createRealExecutor, extractCodeBlocks } from "./run-code-blocks.js";

const MODULES_PATH = "curriculum/modules.json";
const CONCEPTS_DIR = "concepts";
export const MAX_REGEN = 3;

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

/** 剝除 ``` fence 後解析為 DraftArticleResponse；形狀不符即具名 throw。 */
export function parseDraftArticleResponse(raw: string): DraftArticleResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`stage2-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as Partial<DraftArticleResponse>;
  if (!Array.isArray(obj.challenge)) {
    throw new Error("stage2-parse-error：LLM 回應缺少 challenge 陣列");
  }
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
      : "- **1** · 佔位條目（本篇未涵蓋任何課表題號）";

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

/** 逐關快檢（結構/字數 → 繁中 → 程式碼實測 → 題目正確性），失敗即回傳第一個失敗原因。 */
async function runPerArticleGate(
  markdown: string,
  node: ConceptNode,
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

  return undefined;
}

async function runSelfCheck(llmClient: LlmClient, node: ConceptNode, markdown: string): Promise<GateFailure | undefined> {
  const prompt = buildSelfCheckPrompt({
    conceptId: node.id,
    title: node.title,
    patternLabel: node.patternLabel,
    complexityLabel: node.complexityLabel,
    articleMarkdown: markdown,
  });
  const raw = await llmClient.generate(prompt);
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const response = JSON.parse(cleaned) as SelfCheckResponse;
  if (!response.confident || response.issues.length > 0) {
    return { reason: `self-check：${response.issues.join("; ") || "低信心"}` };
  }
  return undefined;
}

export async function generateOneConcept(
  llmClient: LlmClient,
  node: ConceptNode,
  authorHints: string,
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
    });

    let markdown: string;
    try {
      const raw = await llmClient.generate(prompt);
      const draft = parseDraftArticleResponse(raw);
      markdown = assembleArticleMarkdown(skeleton, draft);
    } catch (err) {
      lastFailure = { reason: (err as Error).message };
      continue;
    }

    const gateFailure = await runPerArticleGate(markdown, node);
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

  let llmClient: LlmClient;
  try {
    llmClient = createLlmClient(process.env);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
    return;
  }

  const { graph } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });

  // manifest 遺失（.cache/ 為 gitignored 快取，換機器/清快取後即不存在）：由掃描現存
  // concepts/** + articles/** 重建，避免把已凍結產物誤判為缺漏而重工（R4、FR-019/020）。
  let manifest: Manifest = existsSync(DEFAULT_MANIFEST_PATH)
    ? loadManifest()
    : rebuildManifest(
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
    const { markdown, failure, attempts } = await generateOneConcept(llmClient, node, authorHints);

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
