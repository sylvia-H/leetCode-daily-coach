// F12（憲章 XVII 一次性重生例外）：把各 agent 產出的 per-concept quiz 片段併回 data/quiz-bank.json。
//
// 為何需要片段再合併：quiz-bank.json 是 2MB 單檔，一批 4 個 agent 並行直接寫必然互相覆蓋。
// 各 agent 只寫 <fragments>/<conceptId>.json，由本檔統一併入。
//
// 憲章 IX：MUST NOT 自行實作序列化或位置重排——序列化重用 generate-quiz-bank.ts 的
// serializeQuizBank（含 Curriculum 宣告序），正解位置重用 quiz-balance.ts 的
// rebalanceAnswerPositions（確定性、以 conceptId 為種子），品質判準重用 checkQuizBank。
// 任何一處自己拼一份，都會與產線和 CI 漂移。
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { z } from "zod";
import { loadCurriculum } from "../src/compiler/curriculum.js";
import { checkQuizBank, quizBankSchema, type QuizBank, type QuizItem } from "../src/compiler/quiz.js";
import { serializeQuizBank } from "./generate-quiz-bank.js";
import { writeFileAtomic } from "./lib/checkpoint.js";
import { rebalanceAnswerPositions } from "./lib/quiz-balance.js";

const QUIZ_BANK_PATH = join("data", "quiz-bank.json");

/** 片段檔形狀：{ "items": QuizItem[] }。逐題 schema 借道 quizBankSchema，不另宣告一份。 */
const fragmentSchema = z.object({ items: z.array(z.unknown()) }).strict();

/**
 * 片段內容 → QuizItem[]（純函式，匯出供單測）。schema 一律借道 quizBankSchema，
 * MUST NOT 另宣告一份逐題 schema——那必然與產線和 CI 漂移（憲章 IX）。
 */
export function parseFragmentItems(raw: unknown, conceptId: string, label: string): QuizItem[] {
  const outer = fragmentSchema.safeParse(raw);
  if (!outer.success) {
    throw new Error(`${label}：片段外層形狀不符（需 { "items": [...] }）`);
  }
  const probe = quizBankSchema.safeParse({ version: 1, byConcept: { [conceptId]: outer.data.items } });
  if (!probe.success) {
    const issue = probe.error.issues[0];
    throw new Error(`${label}：題目 schema 不符 — ${issue?.path.join(".")} ${issue?.message}`);
  }
  return probe.data.byConcept[conceptId] as QuizItem[];
}

function parseFragment(path: string, conceptId: string): QuizItem[] {
  return parseFragmentItems(JSON.parse(readFileSync(path, "utf-8")), conceptId, basename(path));
}

function main(): void {
  const dir = process.argv[2];
  if (!dir || !existsSync(dir)) {
    console.error("用法：npx tsx scripts/merge-quiz-fragments.ts <fragments-dir> [--dry-run]");
    process.exit(2);
  }
  const dryRun = process.argv.includes("--dry-run");

  const { graph, loadViolations } = loadCurriculum({
    modulesPath: join("curriculum", "modules.json"),
    conceptsDir: "concepts",
  });
  if (loadViolations.some((v) => v.severity === "error")) {
    console.error("Curriculum 載入失敗，中止合併。");
    process.exit(1);
  }

  const existing = quizBankSchema.parse(JSON.parse(readFileSync(QUIZ_BANK_PATH, "utf-8"))) as QuizBank;
  const byConcept: Record<string, QuizItem[]> = { ...existing.byConcept };

  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error(`${dir} 內沒有任何 .json 片段。`);
    process.exit(1);
  }

  const merged: string[] = [];
  for (const file of files) {
    const conceptId = basename(file, ".json");
    if (!graph.concepts.has(conceptId)) {
      console.error(`✗ ${conceptId}：Curriculum 中沒有此 Concept，中止（片段檔名 MUST 等於 conceptId）`);
      process.exit(1);
    }
    const before = existing.byConcept[conceptId]?.length ?? 0;
    let items: QuizItem[];
    try {
      items = parseFragment(join(dir, file), conceptId);
    } catch (err) {
      console.error(`✗ ${(err as Error).message}`);
      process.exit(1);
    }
    if (before > 0 && items.length !== before) {
      console.error(`✗ ${conceptId}：題數 ${items.length} 與既有 ${before} 不符（brief 要求維持相同題數）`);
      process.exit(1);
    }
    // 正解位置由建構保證（quiz-bank-schema.md §5.2a）：MUST 在寫入前、Gate 之前重排。
    byConcept[conceptId] = rebalanceAnswerPositions(conceptId, items);
    merged.push(conceptId);
    console.log(`  ${conceptId}：${before} → ${items.length} 題（已重排正解位置）`);
  }

  const violations = checkQuizBank({ quizBank: { version: 1, byConcept }, graph }).filter((v) =>
    merged.some((id) => v.subject.includes(id)),
  );
  for (const v of violations) console.error(`✗ ${v.rule}@${v.subject}：${v.message}`);
  if (violations.length > 0) {
    console.error(`\n✗ ${violations.length} 項 quiz 違規，未寫檔。`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`\n✓ dry-run：${merged.length} 個 Concept 全數通過，未寫檔。`);
    return;
  }
  writeFileAtomic(QUIZ_BANK_PATH, serializeQuizBank(byConcept, graph));
  console.log(`\n✓ 已併入 ${merged.length} 個 Concept 至 ${QUIZ_BANK_PATH}，品質 Gate 零違規。`);
}

// 執行守衛：MUST 有，否則單測 import 本檔即會真的合併並寫入 data/quiz-bank.json。
if (process.argv[1]?.endsWith("merge-quiz-fragments.ts")) {
  main();
}
