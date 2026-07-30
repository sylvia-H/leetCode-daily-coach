// F7 題庫擴充（Q1 / R5，contracts/problem-bank-population.md）：驗證 Stage 1 提出的候選 leetcode
// 題號並填入事實 metadata。事實（id/slug/title/url/difficulty）一律由本檔從權威來源（快照優先、
// 線上 GraphQL metadata 補齊）帶入，MUST NOT 由 LLM 生成、MUST NOT 抓取題目描述（§5）。
// 純合併/驗證邏輯（collectCandidates/resolveMetadata/mergeIntoBank）與檔案 I/O/network 分離，
// 供單測不需真打網路。process.exit 只在 main()。
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadCurriculum } from "../src/compiler/curriculum.js";
import type { ProblemBankFile, ProblemMeta } from "../src/types/problem.js";

export type LeetcodeDifficulty = "Easy" | "Medium" | "Hard";

export interface LeetcodeIndexEntry {
  slug: string;
  title: string;
  difficulty: LeetcodeDifficulty;
}

export type LeetcodeIndex = Record<string, LeetcodeIndexEntry>;

export interface CandidateSource {
  conceptId: string;
  topicId: string;
  leetcodeIds: number[];
}

export type PopulateViolationRule = "leetcode-count-range" | "leetcode-duplicate" | "leetcode-invalid";

export interface PopulateViolation {
  rule: PopulateViolationRule;
  conceptId?: string;
  leetcodeId?: number;
  message: string;
}

/**
 * 蒐集全部候選題號（§12.1 守門：每 Concept 1–3 題、不得重複），並建立 leetcodeId → 引用它的
 * topicId 集合（供合併時填 `patterns`，R5）。`leetcode: []`（無題目觀念課）為一等合法狀態，不報錯。
 */
export function collectCandidates(sources: CandidateSource[]): {
  byId: Map<number, Set<string>>;
  violations: PopulateViolation[];
} {
  const byId = new Map<number, Set<string>>();
  const violations: PopulateViolation[] = [];

  for (const source of sources) {
    const { conceptId, topicId, leetcodeIds } = source;
    if (leetcodeIds.length > 3) {
      violations.push({
        rule: "leetcode-count-range",
        conceptId,
        message: `Concept「${conceptId}」候選題號 ${leetcodeIds.length} 個，超過上限 3 個`,
      });
      continue;
    }
    const seen = new Set<number>();
    let hasDuplicate = false;
    for (const id of leetcodeIds) {
      if (seen.has(id)) {
        hasDuplicate = true;
        violations.push({
          rule: "leetcode-duplicate",
          conceptId,
          leetcodeId: id,
          message: `Concept「${conceptId}」候選題號重複：${id}`,
        });
        continue;
      }
      seen.add(id);
    }
    if (hasDuplicate) continue;
    for (const id of leetcodeIds) {
      const topics = byId.get(id);
      if (topics) topics.add(topicId);
      else byId.set(id, new Set([topicId]));
    }
  }

  return { byId, violations };
}

/** 只取 metadata（title/titleSlug/difficulty），MUST NOT 取得或儲存題目描述文字（§5）。 */
export type MetadataFetcher = (id: number) => Promise<LeetcodeIndexEntry | undefined>;

export interface ResolveResult {
  /** 快照補齊後的新索引（含既有 + 本次新解析）。 */
  index: LeetcodeIndex;
  resolved: Map<number, LeetcodeIndexEntry>;
  violations: PopulateViolation[];
}

/**
 * 依「靜態快照優先、線上驗證補齊」解析候選題號的 metadata（R5）。快照命中即用；未命中則呼叫
 * `fetchMetadata`（線上 GraphQL）；線上仍查無 ⇒ `leetcode-invalid`（驅動 Stage 1 重生，不憑空編造）。
 */
export async function resolveMetadata(
  ids: number[],
  index: LeetcodeIndex,
  fetchMetadata: MetadataFetcher,
): Promise<ResolveResult> {
  const updatedIndex: LeetcodeIndex = { ...index };
  const resolved = new Map<number, LeetcodeIndexEntry>();
  const violations: PopulateViolation[] = [];

  for (const id of ids) {
    const key = String(id);
    const existing = updatedIndex[key];
    if (existing) {
      resolved.set(id, existing);
      continue;
    }
    const fetched = await fetchMetadata(id);
    if (!fetched) {
      violations.push({
        rule: "leetcode-invalid",
        leetcodeId: id,
        message: `候選題號 ${id} 查無有效 metadata（快照未命中，線上查詢亦無此題）`,
      });
      continue;
    }
    updatedIndex[key] = fetched;
    resolved.set(id, fetched);
  }

  return { index: updatedIndex, resolved, violations };
}

export function buildProblemUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

/**
 * 併入題庫（immutable）：既有題號 MUST NOT 被覆蓋，除非 `--force`；只新增缺漏題號（R5）。
 * `patterns` 取引用該題號的全部 topicId（去重排序）；供 `validateProblemBank` 以 topic/concept id
 * 驗證合法性。
 */
export function mergeIntoBank(
  bank: ProblemBankFile,
  resolved: Map<number, LeetcodeIndexEntry>,
  patternsById: Map<number, Set<string>>,
  options: { force?: boolean } = {},
): ProblemBankFile {
  const next: ProblemBankFile = { ...bank };
  for (const [id, entry] of resolved) {
    const key = String(id);
    if (next[key] && !options.force) continue;
    const patterns = [...(patternsById.get(id) ?? [])].sort();
    const meta: ProblemMeta = {
      id,
      slug: entry.slug,
      title: entry.title,
      url: buildProblemUrl(entry.slug),
      difficulty: entry.difficulty,
      patterns,
    };
    next[key] = meta;
  }
  return next;
}

// ── I/O 邊界（本機執行；main() 才呼叫，供 CLI 使用） ─────────────────────────

function readJsonFile<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJsonFile(path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

/** 線上補齊：LeetCode 公開 GraphQL 端點，只取 title/titleSlug/difficulty（不取 content，§5）。 */
export async function fetchLeetCodeMetadata(id: number): Promise<LeetcodeIndexEntry | undefined> {
  const query = `query problemsetQuestionList($filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: ""
      limit: 1
      filters: $filters
    ) {
      questions: data {
        title
        titleSlug
        difficulty
      }
    }
  }`;
  const response = await fetch("https://leetcode.com/graphql/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { filters: { searchKeywords: String(id) } } }),
  });
  if (!response.ok) return undefined;
  const json = (await response.json()) as {
    data?: { problemsetQuestionList?: { questions?: { title: string; titleSlug: string; difficulty: string }[] } };
  };
  const hit = json.data?.problemsetQuestionList?.questions?.[0];
  if (!hit) return undefined;
  return { slug: hit.titleSlug, title: hit.title, difficulty: hit.difficulty as LeetcodeDifficulty };
}

const BANK_PATH = "data/problem-bank.json";
const INDEX_PATH = "data/leetcode-index.json";

async function main(): Promise<void> {
  const force = process.argv.includes("--force");

  const { graph } = loadCurriculum({ modulesPath: "curriculum/modules.json", conceptsDir: "concepts" });
  const sources: CandidateSource[] = [...graph.concepts.values()].map((c) => ({
    conceptId: c.id,
    topicId: c.topic,
    leetcodeIds: c.leetcode,
  }));

  const { byId, violations: candidateViolations } = collectCandidates(sources);
  if (candidateViolations.length > 0) {
    for (const v of candidateViolations) console.error(`✗ [${v.rule}] ${v.message}`);
    process.exit(1);
  }

  const bank = readJsonFile<ProblemBankFile>(BANK_PATH, {});
  const index = readJsonFile<LeetcodeIndex>(INDEX_PATH, {});

  const idsToResolve = force ? [...byId.keys()] : [...byId.keys()].filter((id) => !bank[String(id)]);
  const { index: updatedIndex, resolved, violations: resolveViolations } = await resolveMetadata(
    idsToResolve,
    index,
    fetchLeetCodeMetadata,
  );

  if (resolveViolations.length > 0) {
    for (const v of resolveViolations) console.error(`✗ [${v.rule}] ${v.message}`);
    process.exit(1);
  }

  const mergedBank = mergeIntoBank(bank, resolved, byId, { force });
  writeJsonFile(INDEX_PATH, updatedIndex);
  writeJsonFile(BANK_PATH, mergedBank);

  console.log(`✓ 題庫擴充完成：新增/更新 ${resolved.size} 個題號（快照 ${INDEX_PATH} 已同步）`);
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith("populate-problem-bank.ts")) {
  main();
}
