// I/O 入口（唯一寫站台檔案、唯一讀環境變數的位置，與 generate-schedule.ts 同形，
// workflow-integration.md §3）：讀環境變數 → loadCompilerDeps() + state-store.load()
// → buildSite() → 寫入 PAGES_OUTPUT_DIR。MUST NOT 呼叫任何 GitHub API（可見性偵測已在 workflow 層完成）。
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadCompilerDeps } from "../src/compiler/lesson.js";
import { type EnvLike, parseWebhooks, TRACK_ORDER } from "../src/config.js";
import { buildSite, type SiteBuildInput } from "../src/pages/site.js";
import { load as loadState } from "../src/state/state-store.js";

function requireEnv(env: EnvLike, key: string): string {
  const value = env[key]?.trim();
  if (!value) {
    console.error(`設定錯誤：未設定 ${key}`);
    process.exit(1);
  }
  return value;
}

function main(): void {
  const stateFile = requireEnv(process.env, "STATE_FILE");
  const outputDir = requireEnv(process.env, "PAGES_OUTPUT_DIR");
  const baseUrl = requireEnv(process.env, "PAGES_BASE_URL");

  // research R13：MUST NOT 呼叫 loadConfig()——它在零 enabledTracks 時會 throw，
  // 與 Pages 的零 Track Edge Case（MUST 呈現空的 Track 進度區塊）衝突。
  const webhooks = parseWebhooks(process.env);
  const enabledTracks = TRACK_ORDER.filter((track) => webhooks[track]);

  const deps = loadCompilerDeps();
  const state = loadState(stateFile, enabledTracks);

  const input: SiteBuildInput = { deps, state, enabledTracks, baseUrl };
  const output = buildSite(input);

  for (const [relativePath, content] of output) {
    const fullPath = join(outputDir, relativePath);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
  }

  console.log(`✓ Pages 建置完成：${output.size} 個檔案輸出至 ${outputDir}`);
}

main();
