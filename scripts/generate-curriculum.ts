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
// curriculum/modules.json 目前每個 Module 恰為 1 個 Topic，故 Topic 顆粒度（5–12）與 Module
// 顆粒度（10–30，全量模式強制）在本 repo 現況下是同一個數字：下限取兩者交集 10，才不會讓 LLM
// 合法地依 Topic 下限（5）起草卻落入 Module 下限（10）違規，白白浪費一輪額度（見 src/compiler/curriculum.ts）。
const TOPIC_MIN_CONCEPTS = 10;
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

function requireString(value: unknown, topicId: string, index: number, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`stage1-parse-error：Topic「${topicId}」第 ${index + 1} 個 concept 缺少必要欄位 ${field}`);
  }
  return value;
}

function requireEnum<T extends string>(value: unknown, topicId: string, index: number, field: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw new Error(
      `stage1-parse-error：Topic「${topicId}」第 ${index + 1} 個 concept 的 ${field} 不是合法值（${allowed.join("/")}）：${JSON.stringify(value)}`,
    );
  }
  return value as T;
}

function requirePositiveNumber(value: unknown, topicId: string, index: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`stage1-parse-error：Topic「${topicId}」第 ${index + 1} 個 concept 的 ${field} 不是正數：${JSON.stringify(value)}`);
  }
  return value;
}

// LLM 偶爾把「只有一個元素」的陣列欄位（如 next）直接回傳成單一純量（"foo" 而非 ["foo"]），
// 即使 prompt 已明講 MUST 為陣列——這裡多容忍一層，把純量包成單元素陣列，而非直接視為空陣列
// 悄悄丟棄這筆依賴（實測踩過：漏收 next 會讓 DAG 少一條邊卻不易察覺，直到很後面才報 orphan）。
function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.trim() !== "") return [value];
  return [];
}

function asNumberArray(value: unknown): number[] {
  if (Array.isArray(value)) return value.filter((v): v is number => typeof v === "number");
  if (typeof value === "number") return [value];
  return [];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * 把 LLM 回應的單一 concept 正規化為 DraftConcept：必要純量欄位（slug/title/difficulty/
 * estimated_minutes/pattern_label/complexity_label）缺漏或型別不符即具名 throw（fail loud，
 * 觸發該 Topic 重新起草，不進一步往下污染檔案）；陣列欄位（prerequisite/next/learning_goal/
 * exit_criteria/leetcode_candidates/tags/author_hints.leetcode_hints）與 author_hints 各文字
 * 欄位在缺漏/型別不符時安全預設為空陣列/空字串——這些欄位語意上可合法為空（例如 Topic 首個
 * Concept 沒有 prerequisite），真的留白會被下游 F2 zod Gate 以 `schema-missing-field` 報出，
 * 不需要在此提前擋下；此處只需保證 `conceptToMarkdown`／`matter.stringify` 不會因為收到
 * `undefined` 而以難以理解的 YAML dump 例外崩潰（研究 R-fix：實測 Gemini 偶爾漏欄位）。
 */
export function normalizeDraftConcept(raw: unknown, topicId: string, index: number): DraftConcept {
  const obj = (raw ?? {}) as Partial<DraftConcept> & Record<string, unknown>;
  const hintsRaw = (obj.author_hints ?? {}) as Partial<DraftConcept["author_hints"]> & Record<string, unknown>;

  // LLM 有時仍會把識別欄位命名為 "id"（貼近最終 frontmatter 欄位名）而非 prompt 要求的
  // "slug"——與其每次都靠加強措辭賭它聽話，不如在解析邊界多接受這個別名，兩者對本檔而言
  // 語意完全等價（都是這個 concept 的 kebab-case 識別碼）。
  const slugRaw = typeof obj.slug === "string" ? obj.slug : obj.id;

  try {
    return {
      slug: requireString(slugRaw, topicId, index, "slug"),
      title: requireString(obj.title, topicId, index, "title"),
      difficulty: requireEnum(obj.difficulty, topicId, index, "difficulty", ["easy", "medium"] as const),
      estimated_minutes: requirePositiveNumber(obj.estimated_minutes, topicId, index, "estimated_minutes"),
      pattern_label: requireString(obj.pattern_label, topicId, index, "pattern_label"),
      complexity_label: requireString(obj.complexity_label, topicId, index, "complexity_label"),
      prerequisite: asStringArray(obj.prerequisite),
      next: asStringArray(obj.next),
      learning_goal: asStringArray(obj.learning_goal),
      exit_criteria: asStringArray(obj.exit_criteria),
      leetcode_candidates: asNumberArray(obj.leetcode_candidates),
      tags: asStringArray(obj.tags),
      author_hints: {
        core_idea: asString(hintsRaw.core_idea),
        pattern_recognition: asString(hintsRaw.pattern_recognition),
        thinking: asString(hintsRaw.thinking),
        common_mistakes: asString(hintsRaw.common_mistakes),
        ts_notes: asString(hintsRaw.ts_notes),
        py_notes: asString(hintsRaw.py_notes),
        leetcode_hints: Array.isArray(hintsRaw.leetcode_hints)
          ? hintsRaw.leetcode_hints.filter(
              (h): h is DraftConcept["author_hints"]["leetcode_hints"][number] =>
                typeof (h as { id?: unknown } | null)?.id === "number" &&
                typeof (h as { whyThisPattern?: unknown } | null)?.whyThisPattern === "string",
            )
          : [],
      },
    };
  } catch (err) {
    // 診斷輔助（不改變錯誤語意，只附加原始物件實際長什麼樣）：LLM 若用了不同的欄位命名
    // （例如把 slug 取名 id），光看「缺少欄位 X」猜不出實際命名為何，須看到原始 keys 才好對症下藥。
    const preview = JSON.stringify(obj).slice(0, 500);
    throw new Error(`${(err as Error).message}\n  收到的原始物件（前 500 字）：${preview}`);
  }
}

/** 正規化整批回應（保留原陣列順序，逐一 throw 具名錯誤而非攔截後靜默丟棄壞資料）。 */
export function normalizeDraftConcepts(concepts: unknown[], topicId: string): DraftConcept[] {
  return concepts.map((c, i) => normalizeDraftConcept(c, topicId, i));
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
  const response = parseDraftResponse(raw);
  // 正規化在此（draftTopic 而非 parseDraftResponse）進行：需要 topicId 組出具名錯誤訊息，
  // 且必須在 main() 迴圈寫檔前**完成於同一個 try/catch 保護範圍內**——若驗證延後到寫檔迴圈才做，
  // 前面幾個 concept 已寫入磁碟、才在寫到第 N 個時 throw，會讓該 Topic 目錄留下不完整的殘檔，
  // 且因目錄已非空，續跑判斷會誤以為此 Topic 已起草完成而跳過重試。
  return normalizeDraftConcepts(response.concepts, topicId);
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
