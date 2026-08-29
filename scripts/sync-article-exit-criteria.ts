// F12（憲章 XVII-2-2）：把 Skeleton 的 `exit_criteria` 同步進 `articles/**` 的 frontmatter。
//
// ## 為何需要本檔
//
// Article frontmatter 的 `exit_criteria` 由 `generate-content.ts` 的 `assembleArticleMarkdown`
// **從 Skeleton 原樣複製**而來，兩份副本長期沒有任何 Gate 比對（該 Gate 已於同一次改動補進
// `scripts/lib/article-gate.ts`）。2026-08-29 翻譯 114 個 Skeleton 的 `exit_criteria` 後，
// 165 篇 Article 仍存著英文舊值——而**推播讀的是 Article 那一份**（`src/compiler/lesson.ts` 用
// `article.meta.exitCriteria`），不同步等於翻譯白做。
//
// ## 為何是腳本而不是 agent
//
// 這是**機械複製**，不是內容工作：正確結果唯一且可驗證。派 agent 反而會改寫措辭、破壞
// 「逐字一致」這個 Gate 條件，且要燒額度。憲章 XIII 要求生成物的調整走「改來源 → 重跑生成器
// → review diff → commit」，本檔即扮演該生成器。
//
// ## 行尾處理
//
// `matter.stringify` 一律輸出 LF，但工作樹中有少數檔案是 CRLF（Phase 3 由 agent 手寫所致）。
// 本檔**保留各檔原有行尾**，避免產生與本次同步無關的整檔 diff。
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { loadCurriculum } from "../src/compiler/curriculum.js";

export interface SyncResult {
  conceptId: string;
  articlePath: string;
  before: string[];
  after: string[];
}

/** 純函式，供單測：回傳同步後的 markdown（若無需變更則回傳 undefined）。 */
export function syncExitCriteria(markdown: string, skeletonExitCriteria: string[]): string | undefined {
  const parsed = matter(markdown);
  const current = parsed.data.exit_criteria as unknown;
  const same =
    Array.isArray(current) &&
    current.length === skeletonExitCriteria.length &&
    current.every((v, i) => v === skeletonExitCriteria[i]);
  if (same) return undefined;

  const crlf = markdown.includes("\r\n");
  const next = matter.stringify(parsed.content, { ...parsed.data, exit_criteria: skeletonExitCriteria });
  return crlf ? next.replace(/\r?\n/g, "\r\n") : next;
}

function main(): void {
  const check = process.argv.includes("--check");

  const { graph, loadViolations } = loadCurriculum({
    modulesPath: join("curriculum", "modules.json"),
    conceptsDir: "concepts",
  });
  const loadErrors = loadViolations.filter((v) => v.severity === "error");
  if (loadErrors.length > 0) {
    console.error("Curriculum 載入失敗：");
    for (const v of loadErrors) console.error(`  ${v.rule} @ ${v.subject}：${v.message}`);
    process.exit(1);
  }

  const changed: SyncResult[] = [];
  for (const node of graph.concepts.values()) {
    const markdown = readFileSync(node.articlePath, "utf-8");
    const next = syncExitCriteria(markdown, node.exitCriteria);
    if (next === undefined) continue;
    changed.push({
      conceptId: node.id,
      articlePath: node.articlePath,
      before: (matter(markdown).data.exit_criteria as string[]) ?? [],
      after: node.exitCriteria,
    });
    if (!check) writeFileSync(node.articlePath, next, "utf-8");
  }

  if (changed.length === 0) {
    console.log(`✓ ${graph.concepts.size} 篇 Article 的 exit_criteria 皆與 Skeleton 一致`);
    return;
  }

  if (check) {
    console.error(`✗ ${changed.length} 篇 Article 的 exit_criteria 與 Skeleton 不一致：`);
    for (const c of changed) console.error(`  ${c.conceptId}（${c.articlePath}）`);
    console.error("執行 `npm run sync:exit-criteria` 修正。");
    process.exit(1);
  }

  console.log(`✓ 已同步 ${changed.length} / ${graph.concepts.size} 篇 Article 的 exit_criteria：`);
  for (const c of changed) console.log(`  ${c.conceptId}`);
}

if (process.argv[1]?.includes("sync-article-exit-criteria")) main();
