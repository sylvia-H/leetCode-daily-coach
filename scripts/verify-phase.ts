// F12：一個 Phase 的完整驗證序列，收斂成單一指令與單段摘要。
//
// 為何需要：orchestrator 逐步跑五~八道檢查時，每道的完整輸出都會進入它的 context；
// 18 個 Phase 累積下來是純粹的浪費。本檔依序執行同一批檢查，**只在失敗時印出該步輸出**，
// 成功時每步只印一行。憲章 IX：MUST NOT 自行實作任何判準——全部委派給既有腳本。
//
// MUST NOT 透過 npm / npx 呼叫子步驟：Windows 上 `npm.cmd` 經 execFileSync 會 ENOENT
// （本 repo 於 run-code-blocks.ts 已踩過並記錄），故一律以 process.execPath 直呼 tsx/vitest 進入點。
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const TSX = require_.resolve("tsx/cli");
const VITEST = require_.resolve("vitest/vitest.mjs");

interface Step {
  name: string;
  cmd: string;
  args: string[];
  /** 期望輸出為空（用於 git 凍結路徑檢查）；非空即失敗。 */
  expectEmpty?: boolean;
}

function parseArgs(argv: string[]): { ids: string; quizDir?: string; skipFull: boolean } {
  let ids = "";
  let quizDir: string | undefined;
  let skipFull = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--only") ids = argv[++i] ?? "";
    else if (a.startsWith("--only=")) ids = a.slice(7);
    else if (a === "--quiz") quizDir = argv[++i];
    else if (a.startsWith("--quiz=")) quizDir = a.slice(7);
    else if (a === "--skip-full") skipFull = true;
  }
  return { ids, quizDir, skipFull };
}

function buildSteps(ids: string, quizDir: string | undefined, skipFull: boolean): Step[] {
  const steps: Step[] = [
    { name: "a. article 逐篇 Gate", cmd: process.execPath, args: [TSX, "scripts/gate-articles.ts", "--only", ids, "--skip-quiz"] },
  ];
  if (quizDir) {
    steps.push(
      { name: "b. quiz 合併預檢（dry-run）", cmd: process.execPath, args: [TSX, "scripts/merge-quiz-fragments.ts", quizDir, "--dry-run"] },
      { name: "c. quiz 正式合併", cmd: process.execPath, args: [TSX, "scripts/merge-quiz-fragments.ts", quizDir] },
    );
  }
  steps.push(
    { name: "d. article + quiz 複驗", cmd: process.execPath, args: [TSX, "scripts/gate-articles.ts", "--only", ids] },
    // 結構凍結：MUST 為空。這是 schedules 維持 byte-identical、state.json 不受影響的唯一保證。
    { name: "e. 結構凍結檢查", cmd: "git", args: ["status", "--porcelain", "--", "concepts", "schedules", "curriculum", "data/problem-bank.json"], expectEmpty: true },
  );
  if (!skipFull) {
    steps.push(
      { name: "f. npm test", cmd: process.execPath, args: [VITEST, "run"] },
      { name: "g. validate:content", cmd: process.execPath, args: [TSX, "scripts/validate.ts"] },
      { name: "h. gate:code", cmd: process.execPath, args: [TSX, "scripts/run-code-blocks.ts"] },
    );
  }
  return steps;
}

function main(): void {
  const { ids, quizDir, skipFull } = parseArgs(process.argv.slice(2));
  if (!ids) {
    console.error("用法：npm run verify:phase -- --only <id1,id2,...> [--quiz <fragments-dir>] [--skip-full]");
    process.exit(2);
  }
  const steps = buildSteps(ids, quizDir, skipFull);
  const count = ids.split(",").filter(Boolean).length;
  console.log(`Phase 驗證：${count} 個 Concept${quizDir ? "（含 quiz 合併）" : ""}\n`);

  for (const step of steps) {
    const started = Date.now();
    let out = "";
    try {
      out = execFileSync(step.cmd, step.args, { encoding: "utf-8", stdio: "pipe" });
    } catch (err) {
      const e = err as { stdout?: string; stderr?: string; message: string };
      console.error(`✗ ${step.name}\n`);
      console.error([e.stdout, e.stderr].filter(Boolean).join("\n").trim() || e.message);
      console.error(`\n✗ Phase 驗證中止於「${step.name}」，後續步驟未執行。`);
      process.exit(1);
    }
    if (step.expectEmpty && out.trim() !== "") {
      console.error(`✗ ${step.name} — 期望為空，實際有輸出：\n${out}`);
      console.error("\n⚠️ 凍結路徑遭改動：schedules 已非 byte-identical，state.json 可能受影響。MUST 先還原。");
      process.exit(1);
    }
    console.log(`✓ ${step.name}（${((Date.now() - started) / 1000).toFixed(1)}s）`);
  }
  console.log(`\n✓ Phase 驗證全數通過（${steps.length} 道檢查）。`);
}

if (process.argv[1]?.endsWith("verify-phase.ts")) {
  main();
}
