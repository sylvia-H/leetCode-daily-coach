// F7 Stage 1 入口（contracts/stage1-curriculum.md）：LLM 批次起草 Skeleton → populate-problem-bank
// → 結構 Gate（重用 F2，全量模式）→ 產 curriculum/outline.md。process.exit / 檔案寫入 / LLM 呼叫
// 只在本檔與 scripts/lib/；純函式（parseDraftResponse/conceptToMarkdown）供單測，其餘為 I/O 邊界。
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { loadCurriculum, validateCurriculum } from "../src/compiler/curriculum.js";
import { loadProblemBank, makeProblemExists } from "../src/compiler/problem.js";
import type { Violation } from "../src/types/curriculum.js";
import type { ProblemBankFile } from "../src/types/problem.js";
import { createLlmClient, type LlmClient } from "./lib/llm-client.js";
import { serializeOutline } from "./lib/outline.js";
import { buildStage1Prompt, type DraftConcept, type DraftConceptResponse } from "./lib/prompts/stage1-curriculum.js";
import {
  collectCandidates,
  fetchLeetCodeMetadata,
  mergeIntoBank,
  resolveMetadata,
  type CandidateSource,
  type LeetcodeIndex,
} from "./populate-problem-bank.js";

const MODULES_PATH = "curriculum/modules.json";
const CONCEPTS_DIR = "concepts";
const OUTLINE_PATH = "curriculum/outline.md";
const BANK_PATH = "data/problem-bank.json";
const INDEX_PATH = "data/leetcode-index.json";
const TOPIC_MIN_CONCEPTS = 5;
const TOPIC_MAX_CONCEPTS = 12;

interface ModulesFile {
  modules: { id: string; title: string; topics: { id: string; title: string }[] }[];
}

/** 剝除 LLM 回應可能夾帶的 ``` fence，解析為 DraftConceptResponse；形狀不符即具名 throw。 */
export function parseDraftResponse(raw: string): DraftConceptResponse {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`stage1-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as { concepts?: unknown };
  if (!Array.isArray(obj.concepts)) {
    throw new Error("stage1-parse-error：LLM 回應缺少 concepts 陣列");
  }
  return { concepts: obj.concepts as DraftConcept[] };
}

/** DraftConcept → Skeleton markdown（frontmatter + Author Hints，§10.1/§10.4）。純函式，可單測。 */
export function conceptToMarkdown(draft: DraftConcept, moduleId: string, topicId: string): string {
  const frontmatter = {
    id: draft.slug,
    title: draft.title,
    module: moduleId,
    topic: topicId,
    difficulty: draft.difficulty,
    estimated_minutes: draft.estimated_minutes,
    pattern_label: draft.pattern_label,
    complexity_label: draft.complexity_label,
    prerequisite: draft.prerequisite,
    next: draft.next,
    learning_goal: draft.learning_goal,
    exit_criteria: draft.exit_criteria,
    leetcode: draft.leetcode_candidates,
    tags: draft.tags,
  };
  const h = draft.author_hints;
  const body = [
    "## Author Hints",
    "",
    `- 核心觀念：${h.core_idea}`,
    `- Pattern 辨識線索：${h.pattern_recognition}`,
    `- Thinking：${h.thinking}`,
    `- Common Mistakes：${h.common_mistakes}`,
    `- TypeScript 重點：${h.ts_notes}`,
    `- Python 重點：${h.py_notes}`,
    ...h.leetcode_hints.map((hint) => `- 題號 ${hint.id} 為何適合此 Pattern：${hint.whyThisPattern}`),
    "",
  ].join("\n");
  return matter.stringify(`\n${body}`, frontmatter);
}

function listExistingConceptFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();
}

function readJson<T>(path: string, fallback: T): T {
  return existsSync(path) ? (JSON.parse(readFileSync(path, "utf-8")) as T) : fallback;
}

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

function parseOnlyFlag(argv: string[]): Set<string> | undefined {
  const idx = argv.indexOf("--only");
  if (idx < 0 || !argv[idx + 1]) return undefined;
  return new Set(argv[idx + 1]!.split(","));
}

async function draftTopic(
  llmClient: LlmClient,
  moduleId: string,
  moduleTitle: string,
  topicId: string,
  topicTitle: string,
  priorConceptIds: string[],
): Promise<DraftConcept[]> {
  const prompt = buildStage1Prompt({
    moduleId,
    moduleTitle,
    topicId,
    topicTitle,
    minConcepts: TOPIC_MIN_CONCEPTS,
    maxConcepts: TOPIC_MAX_CONCEPTS,
    priorConceptIds,
  });
  const raw = await llmClient.generate(prompt);
  return parseDraftResponse(raw).concepts;
}

function formatViolation(v: Violation): string {
  const loc = v.field ? `${v.subject}.${v.field}` : v.subject;
  const target = v.target ? ` → ${v.target}` : "";
  return `  [${v.severity}] ${v.rule} ${loc}${target}：${v.message}`;
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  const only = parseOnlyFlag(process.argv);

  let llmClient: LlmClient;
  try {
    llmClient = createLlmClient(process.env);
  } catch (err) {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
    return;
  }

  if (!existsSync(MODULES_PATH)) {
    console.error(`✗ 素材載入失敗：${MODULES_PATH} 不存在`);
    process.exit(1);
    return;
  }
  const modulesFile = JSON.parse(readFileSync(MODULES_PATH, "utf-8")) as ModulesFile;

  const draftedConceptIds: string[] = [];
  for (const module of modulesFile.modules) {
    for (const topic of module.topics) {
      const dir = join(CONCEPTS_DIR, topic.id);
      const existingFiles = listExistingConceptFiles(dir);
      const shouldDraft = force ? true : only ? only.has(topic.id) : existingFiles.length === 0;
      if (!shouldDraft) continue;

      let concepts: DraftConcept[];
      try {
        concepts = await draftTopic(llmClient, module.id, module.title, topic.id, topic.title, draftedConceptIds);
      } catch (err) {
        console.error(`✗ Topic「${topic.id}」起草失敗：${(err as Error).message}`);
        process.exit(1);
        return;
      }

      mkdirSync(dir, { recursive: true });
      const startOrder = force ? 1 : existingFiles.length + 1;
      concepts.forEach((concept, i) => {
        const nnn = String(startOrder + i).padStart(3, "0");
        writeFileSync(join(dir, `${nnn}-${concept.slug}.md`), conceptToMarkdown(concept, module.id, topic.id), "utf-8");
        draftedConceptIds.push(concept.slug);
      });
    }
  }

  // populate-problem-bank：驗證候選題號並填入事實 metadata（Q1 / R5，MUST NOT 由 LLM 生成）
  const { graph: draftGraph } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  const sources: CandidateSource[] = [...draftGraph.concepts.values()].map((c) => ({
    conceptId: c.id,
    topicId: c.topic,
    leetcodeIds: c.leetcode,
  }));
  const { byId, violations: candidateViolations } = collectCandidates(sources);
  if (candidateViolations.length > 0) {
    for (const v of candidateViolations) console.error(`✗ [${v.rule}] ${v.message}`);
    process.exit(1);
    return;
  }

  const bank = readJson<ProblemBankFile>(BANK_PATH, {});
  const index = readJson<LeetcodeIndex>(INDEX_PATH, {});
  const idsToResolve = [...byId.keys()].filter((id) => !bank[String(id)]);
  const { index: updatedIndex, resolved, violations: resolveViolations } = await resolveMetadata(
    idsToResolve,
    index,
    fetchLeetCodeMetadata,
  );
  if (resolveViolations.length > 0) {
    for (const v of resolveViolations) console.error(`✗ [${v.rule}] ${v.message}`);
    process.exit(1);
    return;
  }
  writeJson(INDEX_PATH, updatedIndex);
  writeJson(BANK_PATH, mergeIntoBank(bank, resolved, byId));

  // 結構 Gate（重用 F2，全量模式，FR-002：顆粒度下限強制生效）
  const { bank: loadedBank } = loadProblemBank(BANK_PATH);
  const { graph, loadViolations } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  const result = validateCurriculum(graph, { mode: "full", problemExists: makeProblemExists(loadedBank) });
  const violations = [...loadViolations, ...result.violations];
  const errors = violations.filter((v) => v.severity === "error");

  if (errors.length > 0) {
    console.log("違規清單：");
    for (const v of violations) console.log(formatViolation(v));
    console.error(`\n✗ 結構 Gate 未通過：${errors.length} 個 error（不產 outline、不視為定稿）`);
    process.exit(1);
    return;
  }

  writeFileSync(OUTLINE_PATH, serializeOutline(graph), "utf-8");
  console.log(`✓ Stage 1 完成：${graph.concepts.size} 個 Concept，outline 已產出於 ${OUTLINE_PATH}`);
  console.log("下一步：人工 review outline.md（唯一人工檢查點），核可後 commit 凍結。");
  process.exit(0);
}

if (process.argv[1]?.endsWith("generate-curriculum.ts")) {
  main();
}
