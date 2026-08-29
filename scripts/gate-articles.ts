// F12（憲章 XVII 一次性重生例外 §1）：逐篇重驗既有 articles/** 的 CLI。
//
// 為何需要本檔：`npm run validate:content` 跑全課表（三軌 641 個 Session 編譯 + render）、
// `npm run gate:code` 對全部 165 篇實測 660 個 code block（實測約 13 分鐘）。重生活動一批只動
// 4～14 篇，逐批跑全庫等於把絕大多數時間花在重驗沒動過的檔案上，18 個 Phase 累積數小時。
//
// 憲章 IX：本檔 MUST NOT 自行實作任何判準——一律呼叫 scripts/lib/article-gate.ts 的
// runPerArticleGate（與 generate-content.ts 產線同一顆），quiz 走 src/compiler/quiz.ts 的
// checkQuizBank。任何「差不多的」平行檢查都會與 CI 漂移，屆時出現「本機過、CI 擋」的落差。
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCurriculum } from "../src/compiler/curriculum.js";
import { loadProblemBank } from "../src/compiler/problem.js";
import { checkQuizBank, quizBankSchema, type QuizBank } from "../src/compiler/quiz.js";
import type { ConceptNode } from "../src/types/curriculum.js";
import { runPerArticleGate } from "./lib/article-gate.js";

const QUIZ_PATH = join("data", "quiz-bank.json");

function parseArgs(argv: string[]): { ids: string[]; all: boolean; skipQuiz: boolean } {
  const ids: string[] = [];
  let all = false;
  let skipQuiz = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--all") all = true;
    else if (a === "--skip-quiz") skipQuiz = true;
    else if (a === "--only") ids.push(...(argv[++i] ?? "").split(",").map((x) => x.trim()).filter(Boolean));
    else if (a.startsWith("--only=")) ids.push(...a.slice(7).split(",").map((x) => x.trim()).filter(Boolean));
    else ids.push(a);
  }
  return { ids, all, skipQuiz };
}

async function main(): Promise<void> {
  const { ids, all, skipQuiz } = parseArgs(process.argv.slice(2));
  if (ids.length === 0 && !all) {
    console.error("用法：npm run gate:articles -- --only <conceptId[,conceptId...]> [--skip-quiz]");
    console.error("      npm run gate:articles -- --all");
    process.exit(2);
  }

  const { graph, loadViolations } = loadCurriculum({
    modulesPath: join("curriculum", "modules.json"),
    conceptsDir: "concepts",
  });
  const loadErrors = loadViolations.filter((v) => v.severity === "error");
  if (loadErrors.length > 0) {
    console.error("Curriculum 載入失敗，無法定位 Article：");
    for (const v of loadErrors) console.error(`  ${v.rule} @ ${v.subject}：${v.message}`);
    process.exit(1);
  }
  const { bank } = loadProblemBank(join("data", "problem-bank.json"));

  const targets: ConceptNode[] = all
    ? [...graph.concepts.values()]
    : ids.map((id) => {
        const node = graph.concepts.get(id);
        if (!node) {
          console.error(`unknown-concept：Curriculum 中沒有 Concept「${id}」`);
          process.exit(1);
        }
        return node;
      });

  let failed = 0;
  for (const node of targets) {
    if (!existsSync(node.articlePath)) {
      console.error(`✗ ${node.id}：找不到教材 ${node.articlePath}`);
      failed++;
      continue;
    }
    const markdown = readFileSync(node.articlePath, "utf-8");
    const failure = await runPerArticleGate(markdown, node, bank);
    if (failure) {
      console.error(`✗ ${node.id}\n    ${failure.reason.replace(/\n/g, "\n    ")}`);
      failed++;
    } else {
      console.log(`✓ ${node.id}`);
    }
  }

  // Quiz：checkQuizBank 是全庫判準（同一個 Concept 的題目集合層面才驗得出位置偏誤），
  // 故整份載入後只回報落在本次目標 Concept 上的違規，避免被無關 Concept 的既有違規淹沒。
  if (!skipQuiz && existsSync(QUIZ_PATH)) {
    const parsed = quizBankSchema.safeParse(JSON.parse(readFileSync(QUIZ_PATH, "utf-8")));
    if (!parsed.success) {
      console.error(`✗ quiz-schema：${parsed.error.issues[0]?.message ?? "schema 不符"}`);
      failed++;
    } else {
      const targetIds = new Set(targets.map((n) => n.id));
      const violations = checkQuizBank({ quizBank: parsed.data as QuizBank, graph }).filter((v) =>
        [...targetIds].some((id) => v.subject.includes(id)),
      );
      for (const v of violations) console.error(`✗ quiz ${v.rule}：${v.message}`);
      if (violations.length > 0) failed += violations.length;
      else console.log(`✓ quiz（${targetIds.size} 個 Concept 的題目全數通過）`);
    }
  }

  const label = all ? "全庫" : `${targets.length} 個 Concept`;
  if (failed > 0) {
    console.error(`\n✗ ${label}：${failed} 項未通過`);
    process.exit(1);
  }
  console.log(`\n✓ ${label}：全數通過`);
}

await main();
