// F7 補題 pass：為既有 Concept 補齊「跨難度帶」的候選題，使 §4-6 的 Track 分歧機制真正可行。
//
// ## 為何需要這支腳本
//
// spec §4-6 的設計是「三軌共用同一份教材，用**題目難度帶過濾**產生分歧」。該機制成立的前提是
// 每個 Concept 的候選題要**跨難度帶**——但 Stage 1 的 prompt 只要求「列出 1–3 個適合的題號」，
// 未要求涵蓋不同難度，模型自然只挑最貼合的那一題（實測 165 個 Concept 中 103 個只有 1 題，
// 且 71 個只有 Medium、49 個只有 Easy）。結果是難度帶過濾後大量 Session 無題可練：
// Foundation（Easy）65%、InterviewMastery（Medium+Hard）46% 的 concept Session 沒有任何題目。
//
// 本腳本以**純追加**方式修補：只擴充 frontmatter 的 `leetcode` 與 Author Hints 的題目說明，
// MUST NOT 更動 slug / prerequisite / next / 既有 Hints——課綱已定稿凍結（T021），重跑 Stage 1
// 會刷新全部 slug 並毀掉已凍結的結構。
//
// ## MUST 在 Stage 2 之前執行
//
// Article 內容含題目清單與逐題「為何適合此 Pattern」，故 `leetcode` 一改，Skeleton hash 就變，
// Stage 2 的冪等判斷會判定該篇需重生。先補題再展開全文，2–4 天的批次只需跑一次。
//
// 純度界線同 generate-curriculum.ts：LLM 呼叫 / 檔案寫入 / process.exit 只在 scripts/。
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import matter from "gray-matter";
import { loadCurriculum, stripLeadingComment, validateCurriculum } from "../src/compiler/curriculum.js";
import { loadProblemBank, makeProblemExists } from "../src/compiler/problem.js";
import type { ConceptNode, Violation } from "../src/types/curriculum.js";
import type { ProblemBankFile } from "../src/types/problem.js";
import { createLlmClient, type LlmClient, type ResponseSchema } from "./lib/llm-client.js";
import {
  collectCandidates,
  fetchLeetCodeMetadata,
  mergeIntoBank,
  resolveMetadata,
  type CandidateSource,
  type LeetcodeDifficulty,
  type LeetcodeIndex,
} from "./populate-problem-bank.js";

const MODULES_PATH = "curriculum/modules.json";
const CONCEPTS_DIR = "concepts";
const BANK_PATH = "data/problem-bank.json";
const INDEX_PATH = "data/leetcode-index.json";
/** spec §12.1：單一 Concept 的對應題數上限。補題 MUST NOT 突破。 */
const MAX_PROBLEMS_PER_CONCEPT = 3;
const MAX_ATTEMPTS = 3;

/**
 * 難度帶：與 `curriculum/track-params.json` 的 `problemDifficulties` 對應。補題目標是讓每個
 * 「已有題目」的 Concept 至少各有一題落在這兩個帶，三軌才都拿得到題。
 *
 * MUST NOT 對「天生無題」的 Concept（`leetcode: []`）補題：那是 Stage 1 判定此觀念無單一對應
 * 題目（如 Programming Mindset 的讀題、複雜度直覺），spec §12.1 明訂為一等合法狀態，
 * 硬塞題目會破壞該判斷。
 */
const BANDS = {
  low: ["Easy"] as LeetcodeDifficulty[],
  high: ["Medium", "Hard"] as LeetcodeDifficulty[],
};

interface SupplementNeed {
  concept: ConceptNode;
  /** 缺少的難度帶（可能同時缺兩個，但受 MAX_PROBLEMS_PER_CONCEPT 限制）。 */
  missing: ("low" | "high")[];
  /** 尚可追加的題數。 */
  slots: number;
}

/**
 * 題號 → 難度的查詢函式。
 *
 * 以函式而非題庫物件傳遞，是因為專案裡有兩種題庫表示：`loadProblemBank` 回傳的是索引後的
 * `ProblemBank`（`{ byId: Map, byPattern: Map }`），而磁碟上的 `data/problem-bank.json`
 * 是 `ProblemBankFile`（`Record<string, ProblemMeta>`）。兩者不可互換——初版誤用
 * `as unknown as` 硬轉，型別檢查被蓋掉、`bank[id]` 一律 undefined，導致每個 Concept 都被誤判為
 * 兩個難度帶都缺。抽成查詢函式後，呼叫端各自提供正確的取值方式，不再有轉型空間。
 */
export type DifficultyOf = (id: number) => LeetcodeDifficulty | undefined;

export interface SupplementCandidate {
  slug: string;
  id: number;
  whyThisPattern: string;
  band: "low" | "high";
}

/** 判斷某 Concept 缺哪些難度帶（純函式，可單測）。 */
export function findMissingBands(currentIds: readonly number[], difficultyOf: DifficultyOf): ("low" | "high")[] {
  const difficulties = currentIds.map(difficultyOf).filter((d): d is LeetcodeDifficulty => d !== undefined);
  const missing: ("low" | "high")[] = [];
  if (!difficulties.some((d) => BANDS.low.includes(d))) missing.push("low");
  if (!difficulties.some((d) => BANDS.high.includes(d))) missing.push("high");
  return missing;
}

/** 掃出需要補題的 Concept。`leetcode: []` 者一律略過（見 BANDS 註解）。 */
export function collectNeeds(concepts: readonly ConceptNode[], difficultyOf: DifficultyOf): SupplementNeed[] {
  const needs: SupplementNeed[] = [];
  for (const concept of concepts) {
    if (concept.leetcode.length === 0) continue;
    const slots = MAX_PROBLEMS_PER_CONCEPT - concept.leetcode.length;
    if (slots <= 0) continue;
    const missing = findMissingBands(concept.leetcode, difficultyOf);
    if (missing.length === 0) continue;
    needs.push({ concept, missing, slots });
  }
  return needs;
}

const SUPPLEMENT_SCHEMA: ResponseSchema = {
  type: "OBJECT",
  properties: {
    supplements: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          slug: { type: "STRING", description: "要補題的 Concept id（照樣抄回，不可更動）" },
          id: { type: "INTEGER", description: "LeetCode 題號" },
          band: { type: "STRING", enum: ["low", "high"], description: "此題所屬的難度帶" },
          whyThisPattern: { type: "STRING", description: "一句話說明此題為何適合該 Concept 的 Pattern（繁體中文）" },
        },
        required: ["slug", "id", "band", "whyThisPattern"],
      },
    },
  },
  required: ["supplements"],
};

/** 組補題 prompt。純函式（只組字串），可單測。 */
export function buildSupplementPrompt(
  moduleTitle: string,
  topicTitle: string,
  needs: readonly SupplementNeed[],
  difficultyOf: DifficultyOf,
): string {
  const lines = needs.map((n) => {
    const cur = n.concept.leetcode.map((id) => `${id}(${difficultyOf(id) ?? "?"})`).join(", ");
    const want = n.missing
      .map((b) => (b === "low" ? "low = Easy 難度" : "high = Medium 或 Hard 難度"))
      .join("、");
    return `- slug: ${n.concept.id}\n  觀念：${n.concept.title}（Pattern: ${n.concept.patternLabel}）\n  現有題目：${cur}\n  需要補：${want}（最多再加 ${n.slots} 題）`;
  });

  return `你是 LeetCode 課程的題目策展者。以下 Concept 目前的候選題只落在單一難度帶，導致不同難度的學習者拿不到適合自己的練習題。請為每個 Concept 補上缺少難度帶的 LeetCode 題目。

Module: ${moduleTitle}
Topic: ${topicTitle}

需要補題的 Concept：
${lines.join("\n")}

規則（MUST 遵守）：
1. 補的題目 MUST **真正適合該 Concept 的 Pattern**，是同一個解題技巧的不同難度版本或變化題。
   MUST NOT 只因為同屬這個 Module 就硬湊——寧可少補，也不要給不相干的題。
2. 每個 Concept 補的題數 MUST NOT 超過上面標示的「最多再加 N 題」。
3. band 欄位 MUST 正確標示該題的實際 LeetCode 難度帶：low = Easy；high = Medium 或 Hard。
   **標錯會被程式驗證擋下**（程式會從權威來源查證真實難度）。
4. MUST NOT 補上該 Concept 現有題目清單裡已有的題號。
5. **若這個 Concept 在該難度帶確實沒有合適的題目，就不要為它補題**——直接省略。
   例如單調堆疊求子陣列最小值總和、雙堆求資料流中位數、編輯距離 DP 這類主題，
   LeetCode 上本來就沒有 Easy 級的對應題，硬補只會給出不相干的題目。**遺漏遠比亂補好。**
6. whyThisPattern 用**繁體中文**寫一句話，說明此題為何適合這個 Concept 的 Pattern。
7. MUST NOT 自行編造題目的標題 / 連結 / 難度——你只需要提供題號，事實 metadata 由程式從權威來源帶入。

只回傳 JSON，不要有其他文字。`;
}

/**
 * 追加題號與對應的 Author Hint 到 Skeleton 檔（純追加，不動既有欄位與正文）。
 *
 * MUST 先 `stripLeadingComment` 才交給 gray-matter（與 generate-curriculum.ts 的
 * patchConceptEdgeField 同一理由：F2 種子檔的前置註解會讓 frontmatter 被誤判為內文）。
 */
export function appendProblemsToSkeleton(
  filePath: string,
  additions: readonly { id: number; whyThisPattern: string }[],
): void {
  if (additions.length === 0) return;
  const raw = readFileSync(filePath, "utf-8");
  const { data, content } = matter(stripLeadingComment(raw));
  const current = Array.isArray(data.leetcode)
    ? (data.leetcode as unknown[]).filter((v): v is number => typeof v === "number")
    : [];
  const fresh = additions.filter((a) => !current.includes(a.id));
  if (fresh.length === 0) return;

  const hintLines = fresh.map((a) => `- 題號 ${a.id} 為何適合此 Pattern：${a.whyThisPattern}`);
  // Author Hints 是條列，直接追加在尾端即可（Stage 2 以整段 content 為種子素材，不做結構解析）。
  const nextContent = `${content.replace(/\s+$/, "")}\n${hintLines.join("\n")}\n`;
  writeFileSync(filePath, matter.stringify(nextContent, { ...data, leetcode: [...current, ...fresh.map((a) => a.id)] }), "utf-8");
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

function formatViolation(v: Violation): string {
  const loc = v.field ? `${v.subject}.${v.field}` : v.subject;
  return `  [${v.severity}] ${v.rule} ${loc}：${v.message}`;
}

async function askForSupplements(
  llmClient: LlmClient,
  moduleTitle: string,
  topicTitle: string,
  needs: readonly SupplementNeed[],
  difficultyOf: DifficultyOf,
): Promise<SupplementCandidate[]> {
  const prompt = buildSupplementPrompt(moduleTitle, topicTitle, needs, difficultyOf);
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await llmClient.generate(prompt, SUPPLEMENT_SCHEMA);
      const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleaned) as { supplements?: unknown };
      if (!Array.isArray(parsed.supplements)) throw new Error("回應缺少 supplements 陣列");
      return parsed.supplements as SupplementCandidate[];
    } catch (err) {
      lastError = (err as Error).message;
      console.error(`  Topic「${topicTitle}」第 ${attempt}/${MAX_ATTEMPTS} 次補題失敗：${lastError}`);
    }
  }
  console.error(`  ✗ Topic「${topicTitle}」補題重試耗盡，跳過（既有內容未被觸碰）`);
  return [];
}

async function main(): Promise<void> {
  const only = parseOnlyFlag(process.argv);
  const dryRun = process.argv.includes("--dry-run");

  let llmClient: LlmClient | undefined;
  if (!dryRun) {
    try {
      llmClient = createLlmClient(process.env);
    } catch (err) {
      console.error(`✗ ${(err as Error).message}`);
      process.exit(1);
      return;
    }
  }

  const { bank } = loadProblemBank(BANK_PATH);
  const { graph } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  const concepts = [...graph.concepts.values()];

  const difficultyOf: DifficultyOf = (id) => bank.byId.get(id)?.difficulty;
  const allNeeds = collectNeeds(concepts, difficultyOf);
  const scoped = only ? allNeeds.filter((n) => only.has(n.concept.topic)) : allNeeds;

  console.log(`需要補題的 Concept：${scoped.length} 個（全課綱 ${allNeeds.length} 個）`);
  const byBand = { low: 0, high: 0 };
  for (const n of scoped) for (const b of n.missing) byBand[b]++;
  console.log(`  缺 Easy 題：${byBand.low} 個 ／ 缺 Medium/Hard 題：${byBand.high} 個`);

  if (dryRun) {
    for (const n of scoped.slice(0, 20)) {
      console.log(`  ${n.concept.id}（${n.concept.module}）現有 ${n.concept.leetcode.join(",")} → 缺 ${n.missing.join("+")}，可加 ${n.slots} 題`);
    }
    if (scoped.length > 20) console.log(`  …其餘 ${scoped.length - 20} 個略`);
    console.log("\n（--dry-run：僅列出待補清單，未呼叫 LLM、未寫檔）");
    process.exit(0);
    return;
  }

  // 依 Topic 批次送出（一個 Topic 一次呼叫）：逐 Concept 呼叫會用掉 129 次額度，
  // 依 Topic 批次只需 ~16 次，且同批內的題目不易互相重複。
  const byTopic = new Map<string, SupplementNeed[]>();
  for (const n of scoped) {
    const list = byTopic.get(n.concept.topic) ?? [];
    list.push(n);
    byTopic.set(n.concept.topic, list);
  }

  const accepted: SupplementCandidate[] = [];
  const rejected: string[] = [];

  for (const [topicId, needs] of byTopic) {
    const moduleTitle = graph.modules.find((m) => m.id === needs[0]!.concept.module)?.title ?? needs[0]!.concept.module;
    const proposals = await askForSupplements(llmClient!, moduleTitle, topicId, needs, difficultyOf);
    if (proposals.length === 0) continue;

    // 逐筆檢核提案的合法性（LLM 只提號，事實由程式驗證——憲章 XIV）。
    const needBySlug = new Map(needs.map((n) => [n.concept.id, n]));
    const perConcept = new Map<string, number>();
    for (const p of proposals) {
      const need = needBySlug.get(p.slug);
      if (!need) {
        rejected.push(`${p.slug}: 不在本 Topic 的待補清單內`);
        continue;
      }
      if (need.concept.leetcode.includes(p.id)) {
        rejected.push(`${p.slug} 題 ${p.id}: 已是現有題目`);
        continue;
      }
      const used = perConcept.get(p.slug) ?? 0;
      if (used >= need.slots) {
        rejected.push(`${p.slug} 題 ${p.id}: 超出可追加題數（上限 ${MAX_PROBLEMS_PER_CONCEPT} 題/Concept）`);
        continue;
      }
      perConcept.set(p.slug, used + 1);
      accepted.push(p);
    }
    console.log(`  ✓ Topic「${topicId}」：提案 ${proposals.length} 筆，通過初檢 ${proposals.length - rejected.length} 筆`);
  }

  if (accepted.length === 0) {
    console.log("沒有任何可採用的補題提案，未寫檔。");
    process.exit(0);
    return;
  }

  // 事實驗證：題號必須真實存在，且**實際難度必須落在提案宣稱的難度帶**（LLM 標錯帶就退回）。
  const index = readJson<LeetcodeIndex>(INDEX_PATH, {});
  const bankFile = readJson<ProblemBankFile>(BANK_PATH, {});
  const idsToResolve = [...new Set(accepted.map((a) => a.id))];
  let resolveResult: Awaited<ReturnType<typeof resolveMetadata>>;
  try {
    resolveResult = await resolveMetadata(idsToResolve, index, fetchLeetCodeMetadata);
  } catch (err) {
    console.error(`✗ 題目 metadata 解析失敗（LeetCode API 不可用）：${(err as Error).message}`);
    process.exit(1);
    return;
  }
  for (const v of resolveResult.violations) console.error(`  ✗ [${v.rule}] ${v.message}`);

  const verified = accepted.filter((a) => {
    const meta = resolveResult.resolved.get(a.id);
    if (!meta) return false;
    const ok = BANDS[a.band].includes(meta.difficulty);
    if (!ok) rejected.push(`${a.slug} 題 ${a.id}: 宣稱 ${a.band} 帶，實際難度為 ${meta.difficulty}`);
    return ok;
  });

  console.log(`\n通過事實驗證：${verified.length} 筆（退回 ${accepted.length - verified.length} 筆）`);
  for (const r of rejected.slice(0, 15)) console.log(`  退回：${r}`);

  if (verified.length === 0) {
    console.log("沒有通過驗證的補題，未寫檔。");
    process.exit(0);
    return;
  }

  // 寫入：先補 Skeleton（frontmatter + Author Hints），再更新題庫與索引。
  const bySlug = new Map<string, SupplementCandidate[]>();
  for (const v of verified) {
    const list = bySlug.get(v.slug) ?? [];
    list.push(v);
    bySlug.set(v.slug, list);
  }
  for (const [slug, adds] of bySlug) {
    const node = graph.concepts.get(slug);
    if (!node) continue;
    appendProblemsToSkeleton(node.skeletonPath, adds);
  }

  // 重新載入以取得補題後的完整候選集，再一併更新題庫（patterns 需反映新的 Concept 對應）。
  const { graph: updated } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  const sources: CandidateSource[] = [...updated.concepts.values()].map((c) => ({
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
  // 題庫 MUST 只收「真的被某個 Concept 引用」的題目。
  //
  // 為何要過濾（實測踩過）：`resolveResult.resolved` 含**全部**送去查證的候選，其中包含後續被
  // 難度帶檢核退回、未寫入任何 Concept 的提案。直接整包 merge 會讓那些題以 `patterns: []` 進入
  // 題庫（patterns 由 byId 推導，未被引用者查無對應），違反題庫 schema「patterns 非空」的約束，
  // 使 `loadProblemBank` **整個載入失敗**——連帶讓所有依賴題庫的編譯與測試一起爆掉。
  // 索引（leetcode-index.json）則相反：它是 metadata 快取，保留查過的題可省下未來的 API 呼叫。
  const referenced = new Map([...resolveResult.resolved].filter(([id]) => byId.has(id)));
  writeJson(INDEX_PATH, resolveResult.index);
  writeJson(BANK_PATH, mergeIntoBank(bankFile, referenced, byId));

  // 結構 Gate（重用 F2，全量模式）：補題後 MUST 重新驗證，確保題號存在性等不變式仍成立。
  const { bank: loadedBank } = loadProblemBank(BANK_PATH);
  const { graph: finalGraph, loadViolations } = loadCurriculum({ modulesPath: MODULES_PATH, conceptsDir: CONCEPTS_DIR });
  const result = validateCurriculum(finalGraph, { mode: "full", problemExists: makeProblemExists(loadedBank) });
  const violations = [...loadViolations, ...result.violations];
  const errors = violations.filter((v) => v.severity === "error");
  if (errors.length > 0) {
    console.error("\n違規清單：");
    for (const v of violations) console.error(formatViolation(v));
    console.error(`\n✗ 補題後結構 Gate 未通過：${errors.length} 個 error`);
    process.exit(1);
    return;
  }

  console.log(`\n✓ 補題完成：${verified.length} 筆已寫入 ${bySlug.size} 個 Concept，結構 Gate 通過。`);
  console.log("下一步：review diff，確認補的題目確實貼合該 Concept 的 Pattern，再 commit 凍結。");
  process.exit(0);
}

if (process.argv[1]?.endsWith("supplement-problems.ts")) {
  void main();
}
