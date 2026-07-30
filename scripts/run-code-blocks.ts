// F7 程式碼實測（Q2 / R6，contracts/content-quality-gate.md §2）：抽出 Article 的 TypeScript/Python
// Corner/Tip fenced code blocks，缺斷言即失敗；否則實際編譯 + 執行斷言。供本機 Stage 2 生成期與
// CI content-gate.yml 共用（憲章 IX，單一實作）。純抽取/判斷（extractCodeBlocks/hasAssertion/
// checkCodeBlocks）與實際 spawn 外部工具（tsc/tsx/python）分離，前者可在無 tsc/python 環境下單測
// （外部呼叫以 mock 測，教材程式碼實測只在 Gate/CI 跑）。
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import matter from "gray-matter";
import { parseSections } from "../src/compiler/content.js";

export type CodeLang = "typescript" | "python";

export interface CodeBlock {
  section: string;
  lang: CodeLang;
  code: string;
}

const TARGET_SECTIONS: { name: string; lang: CodeLang }[] = [
  { name: "TypeScript Corner", lang: "typescript" },
  { name: "TypeScript Tip", lang: "typescript" },
  { name: "Python Corner", lang: "python" },
  { name: "Python Tip", lang: "python" },
];

const FENCE_RE = /```(?:\w+)?\r?\n([\s\S]*?)```/g;

/**
 * 找出「區塊存在、卻沒有任何 fenced code block」的 Corner/Tip 區塊名稱。
 *
 * 為何 MUST 有這道檢查（實測踩過）：`extractCodeBlocks` 對這種情形只是抽不到東西、靜默略過，
 * 於是**整篇文章零區塊 → 零失敗 → 通過**，形成**真空通過**（vacuous pass）——比沒有 Gate 更危險，
 * 因為它會回報綠燈。實測 Stage 2 產出的第一篇文章，Corner 區塊把程式碼寫成單行純文字（無 fence、
 * 換行全失），生成期與 CI 的程式碼實測都毫無異狀地放行。
 *
 * §10 要求 TypeScript/Python 的 Corner 與 Tip 各自內含可執行且自帶斷言的 fenced code block，
 * 故「區塊在、fence 不在」一律視為缺陷。區塊本身不存在則不在此檢查範圍（由 §10 固定區塊解析負責）。
 */
export function findSectionsWithoutCode(articleMarkdown: string): string[] {
  const { content } = matter(articleMarkdown);
  const sections = parseSections(content);
  const missing: string[] = [];
  for (const { name } of TARGET_SECTIONS) {
    const raw = sections.get(name);
    if (raw === undefined) continue; // 區塊不存在：不屬本函式職責
    const hasCode = [...raw.matchAll(FENCE_RE)].some((m) => (m[1] ?? "").trim() !== "");
    if (!hasCode) missing.push(name);
  }
  return missing;
}

/** 抽出 Article 內 TypeScript/Python Corner/Tip 的 fenced code blocks（frontmatter 已由 gray-matter 剝除）。 */
export function extractCodeBlocks(articleMarkdown: string): CodeBlock[] {
  const { content } = matter(articleMarkdown);
  const sections = parseSections(content);
  const blocks: CodeBlock[] = [];

  for (const { name, lang } of TARGET_SECTIONS) {
    const raw = sections.get(name);
    if (!raw) continue;
    for (const match of raw.matchAll(FENCE_RE)) {
      const code = match[1] ?? "";
      if (code.trim() !== "") blocks.push({ section: name, lang, code });
    }
  }
  return blocks;
}

/**
 * 缺斷言即失敗判準（R6）：TS 認 `throw` 或 `node:assert`；Python 認 `assert`。
 *
 * `assert(` 前的 `(?<![.\w])` 是刻意的：`console.assert(false, …)` 在 Node **不會 throw**、程序仍以
 * exit 0 結束（本 repo 實測），若把它算成有效斷言，斷言為假的錯誤教材程式碼會直接通過關卡 3。
 * 同理排除 `foo.assert(` / `myassert(` 這類名稱相近但語意不明的呼叫。
 */
export function hasAssertion(lang: CodeLang, code: string): boolean {
  if (lang === "typescript") {
    return /\bthrow\b/.test(code) || /\bnode:assert\b/.test(code) || /(?<![.\w])assert\(/.test(code);
  }
  return /\bassert\b/.test(code);
}

export interface ExecResult {
  ok: boolean;
  detail?: string;
}

/** 實際 spawn tsc/tsx/python 的邊界；供 checkCodeBlocks 注入，測試以假物件替身（不需真環境）。 */
export interface CodeExecutor {
  runTypeScript(code: string): Promise<ExecResult>;
  runPython(code: string): Promise<ExecResult>;
}

export type BlockCheckReason = "missing-assertion" | "execution-failed";

export interface BlockCheckResult {
  section: string;
  lang: CodeLang;
  ok: boolean;
  reason?: BlockCheckReason;
  detail?: string;
}

/**
 * 逐一檢查 code blocks：缺斷言直接判不過（不呼叫 executor，省一次編譯/執行）；
 * 否則交給 executor 實測，結果原樣回報。純邏輯（executor 由呼叫端決定真假）。
 */
export async function checkCodeBlocks(blocks: CodeBlock[], executor: CodeExecutor): Promise<BlockCheckResult[]> {
  const results: BlockCheckResult[] = [];
  for (const block of blocks) {
    if (!hasAssertion(block.lang, block.code)) {
      results.push({ section: block.section, lang: block.lang, ok: false, reason: "missing-assertion" });
      continue;
    }
    const exec = block.lang === "typescript" ? await executor.runTypeScript(block.code) : await executor.runPython(block.code);
    results.push(
      exec.ok
        ? { section: block.section, lang: block.lang, ok: true }
        : { section: block.section, lang: block.lang, ok: false, reason: "execution-failed", detail: exec.detail },
    );
  }
  return results;
}

/**
 * 建立系統暫存目錄、執行 fn、finally 內清理（不論成功/失敗皆刪除，MUST NOT 殘留、MUST NOT 寫入 repo）。
 * 匯出供單測驗證清理行為，不需真的 spawn 任何外部工具。
 */
export function withTempDir<T>(prefix: string, fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Windows 的 Microsoft Store「App Execution Alias」佔位程式：`python.exe` / `python3.exe` 存在於
 * `%LOCALAPPDATA%\Microsoft\WindowsApps\`，但**未安裝 Python 時執行只會回 exit code 9009 且零輸出**
 * （本 repo 實測）。這會讓「直譯器根本不存在」偽裝成「教材程式碼執行失敗」，在 Stage 2 批次裡
 * 表現為每一篇的 Python 區塊都失敗——165 篇的批次可能因此白跑 2～4 天才被發現。
 */
const WINDOWS_COMMAND_NOT_FOUND_EXIT = 9009;

function runCommand(command: string, args: string[]): ExecResult {
  try {
    execFileSync(command, args, { stdio: "pipe" });
    return { ok: true };
  } catch (err) {
    const e = err as { stdout?: Buffer; stderr?: Buffer; message: string; status?: number; code?: string };
    const output = [e.stdout?.toString(), e.stderr?.toString()].filter(Boolean).join("\n").trim();

    // 直譯器不可用 MUST 與「程式碼本身有錯」明確區分：兩者的處置完全不同（前者是環境問題，
    // 重生再多次也不會過；後者才該觸發重生）。缺了這個區分，錯誤訊息會把人引導到完全錯誤的方向。
    const notFound = e.code === "ENOENT" || (e.status === WINDOWS_COMMAND_NOT_FOUND_EXIT && output === "");
    if (notFound) {
      return {
        ok: false,
        detail:
          `找不到可執行的 \`${command}\`（exit=${e.status ?? e.code}）。教材程式碼未被實際執行。\n` +
          `若在 Windows 上看到此訊息，多半是 PATH 指向 Microsoft Store 的佔位程式\n` +
          `（%LOCALAPPDATA%\\Microsoft\\WindowsApps\\${command}.exe），而非真正安裝的直譯器。\n` +
          `請安裝 Python 3.x 並確認 \`${command} --version\` 可正常輸出版本後再重跑。`,
      };
    }
    const status = e.status !== undefined ? `（exit=${e.status}）` : "";
    return { ok: false, detail: `${output || e.message}${status}` };
  }
}

// MUST NOT 透過 `npx` 呼叫 tsc/tsx：`npx` 在 Windows 實際上是 `npx.cmd`，`execFileSync` 未帶
// `shell: true` 會直接 ENOENT（本 repo 實測），而本專案宣告的主要環境就是 Windows；一旦 ENOENT，
// 每個 TypeScript 區塊都會被誤判為 `execution-failed`，Stage 2 白燒重生額度、`gate:code` 恆綠不了。
// 改為以 `process.execPath`（node 本身，跨平台皆為真正的執行檔）直接跑 node_modules 內已安裝的
// 進入點：不經 shell、無引號跳脫問題、也不會在 CI 觸發額外的套件下載。
const require_ = createRequire(import.meta.url);
const TSC_ENTRY = require_.resolve("typescript/bin/tsc");
const TSX_ENTRY = require_.resolve("tsx/cli");

/** 真實 executor：TS 以 `tsc --noEmit --strict` 型別檢查 + `tsx` 執行；Python 以 `python` 執行。 */
/**
 * 工具鏈前置檢查：用最小的合法片段實際跑一次 TypeScript 與 Python，確認直譯器/編譯器可用。
 *
 * 為何 MUST 在批次開始前跑（實測踩過）：本機 `python` 指向 Microsoft Store 佔位程式時，
 * 每篇文章的 Python 區塊都會 `execution-failed`，且訊息看起來像「教材程式碼有錯」。Stage 2 會為
 * 每篇重生 3 次才放棄——165 篇 × 3 次的額度與 2～4 天的批次時間全數浪費在一個裝好 Python 就能解決的
 * 環境問題上。用兩次極短的執行換取這個保證，划算得不成比例。
 */
export async function checkToolchain(executor: CodeExecutor): Promise<{ lang: CodeLang; detail: string }[]> {
  const probes: { lang: CodeLang; code: string }[] = [
    { lang: "typescript", code: 'const ok: number = 1;\nif (ok !== 1) throw new Error("toolchain probe failed");\n' },
    { lang: "python", code: 'ok = 1\nassert ok == 1, "toolchain probe failed"\n' },
  ];
  const failures: { lang: CodeLang; detail: string }[] = [];
  for (const probe of probes) {
    const result =
      probe.lang === "typescript" ? await executor.runTypeScript(probe.code) : await executor.runPython(probe.code);
    if (!result.ok) failures.push({ lang: probe.lang, detail: result.detail ?? "(無錯誤輸出)" });
  }
  return failures;
}

export function createRealExecutor(): CodeExecutor {
  return {
    async runTypeScript(code: string): Promise<ExecResult> {
      return withTempDir("f7-code-block-ts-", (dir) => {
        const file = join(dir, "snippet.ts");
        writeFileSync(file, code, "utf-8");
        const typeCheck = runCommand(process.execPath, [TSC_ENTRY, "--noEmit", "--strict", file]);
        if (!typeCheck.ok) return typeCheck;
        return runCommand(process.execPath, [TSX_ENTRY, file]);
      });
    },
    async runPython(code: string): Promise<ExecResult> {
      return withTempDir("f7-code-block-py-", (dir) => {
        const file = join(dir, "snippet.py");
        writeFileSync(file, code, "utf-8");
        return runCommand("python", [file]);
      });
    },
  };
}

function listArticleFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d).sort()) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".md")) out.push(full);
    }
  };
  walk(dir);
  return out;
}

async function main(): Promise<void> {
  const articlesDir = process.argv[2] ?? "articles";
  const files = listArticleFiles(articlesDir);
  const executor = createRealExecutor();
  let failures = 0;
  let totalBlocks = 0;

  for (const file of files) {
    const raw = readFileSync(file, "utf-8");

    // 先擋真空通過：區塊在、fence 不在時，下面的 extractCodeBlocks 會抽到 0 個區塊而「無異狀通過」。
    for (const section of findSectionsWithoutCode(raw)) {
      failures++;
      console.error(`✗ [missing-code-block] ${file} · ${section}：區塊內找不到 fenced code block`);
    }

    const blocks = extractCodeBlocks(raw);
    const results = await checkCodeBlocks(blocks, executor);
    totalBlocks += results.length;
    for (const r of results) {
      if (!r.ok) {
        failures++;
        console.error(`✗ [${r.reason}] ${file} · ${r.section}${r.detail ? `\n${r.detail}` : ""}`);
      }
    }
  }

  if (failures > 0) {
    console.error(`\n✗ 程式碼實測未通過：${failures} 個區塊失敗（共檢查 ${totalBlocks} 個區塊）`);
    process.exit(1);
  }
  console.log(`✓ 程式碼實測通過：${totalBlocks} 個區塊（編譯 + 斷言執行）`);
  process.exit(0);
}

if (process.argv[1]?.endsWith("run-code-blocks.ts")) {
  main();
}
