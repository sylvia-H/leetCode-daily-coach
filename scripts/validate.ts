// 內容 Gate CLI 入口（contracts/gate-contract.md §3）：loadCompilerDeps() → runContentGate() →
// 逐筆列印 → 彙總 → exit code。process.exit 與檔案 I/O 只允許出現在本檔；純函式判斷全在
// src/compiler/gate.ts。MUST 可在無任何環境變數與 API key 的情況下執行（無 webhook、無
// GEMINI_API_KEY），本檔全程未讀取任何環境變數。
import { loadCompilerDeps } from "../src/compiler/lesson.js";
import { runContentGate, type GateViolation } from "../src/compiler/gate.js";

function formatViolation(v: GateViolation): string {
  const track = v.track ?? "(全域)";
  const session = v.sessionIndex !== undefined ? `#${v.sessionIndex}` : "";
  const subject = v.subject ? ` ${v.subject}` : "";
  return `${track} ${session} [${v.rule}]${subject}: ${v.message}`.replace(/\s+/g, " ").trim();
}

function main(): void {
  // loadCompilerDeps() 本身即 F2 validateCurriculum 的呼叫點（error 級即拋，data-model.md §3）；
  // 載入層失敗（DAG / 題庫 / 課表 / Overlay 任一）在此收攏為一筆可讀輸出而非未捕捉例外堆疊，
  // 使本指令在任何失敗情境下皆有一致的人可讀輸出格式與非零 exit code。
  let deps;
  try {
    deps = loadCompilerDeps();
  } catch (err) {
    console.error(`✗ 內容 Gate 無法執行（素材載入失敗）：${(err as Error).message}`);
    process.exit(1);
  }

  const { violations, compiled, total } = runContentGate({ deps });

  for (const v of violations) {
    console.log(formatViolation(v));
  }

  if (violations.length > 0) {
    console.error(`\n✗ 內容 Gate 未通過：${violations.length} 筆違規（已編譯 ${compiled} / ${total} 筆 Lesson）`);
    process.exit(1);
  }

  console.log(`\n✓ 內容 Gate 通過：${total} 筆 Lesson（3 Track × 各課表全部 Session）`);
  process.exit(0);
}

main();
