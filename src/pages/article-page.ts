// ArticlePageView 導出 + HTML 渲染（research R2／R12、site-build-contract.md §4）。
// 固定區塊 MUST NOT 使用 ArticleContent.conceptBody（F7 為字數 Gate 合併的單一字串），
// 一律重新呼叫既有 export 函式 parseSections(article.rawContent) 取回各自獨立的區塊原文。
import { Marked } from "marked";
import { parseSections, type ArticleContent } from "../compiler/content.js";
import type { ProblemBank } from "../types/problem.js";
import { escapeHtml, renderPage } from "./html.js";

export interface ArticlePageSection {
  name: string;
  html: string;
}

export interface ArticlePageProblem {
  id: number;
  title: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard";
  whyThisPattern: string;
  hint?: string;
}

export interface ArticlePageView {
  conceptId: string;
  title: string;
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  sections: ArticlePageSection[];
  problems: ArticlePageProblem[];
  takeaway: string;
}

// data-model.md §3：固定區塊順序（Today's Challenge 由 problems 欄位結構化呈現，不併入 sections）。
// F12 Phase 0 起：`TypeScript Corner` / `Python Corner` 已自 §10 移除，改由 `TypeScript Tip` /
// `Python Tip` 承擔語言實戰內容，且 Discord 與本頁**共用同一份 Tip**——故此處**呈現** Tip（推翻
// F9 research R2 第 3 點的「Tips 不在全文頁重複呈現」）。`Digest` 仍不呈現：它是 Concept /
// Thinking / Pattern Recognition 的濃縮，與本頁前三段重複。
// site-build-contract.md §3：頁面 MUST NOT 內嵌任何 JavaScript。marked 自 v5 起移除內建 sanitize，
// 預設讓 markdown 中的 raw HTML 原樣穿透；凍結 Article 雖為自產內容，仍是本模組唯一未經 escapeHtml()
// 的外部檔案輸入面。故建一個專用實例（MUST NOT 改動全域 marked 設定），把 html token（block 與 inline
// 共用此 hook）一律 escape 成純文字——既關掉注入面，也讓散文中的 `Set<number>` 這類文字如實顯示，
// 而非被瀏覽器當成未知標籤吃掉。code fence 內容不走此 hook，既有渲染不受影響。
const articleMarked = new Marked({
  renderer: {
    html(html: string): string {
      return escapeHtml(html);
    },
  },
});

const SECTION_ORDER = [
  "Concept",
  "Thinking",
  "Pattern Recognition",
  "Common Mistakes",
  "Complexity",
  "TypeScript Tip",
  "Python Tip",
  "Tomorrow Preview",
] as const;

function buildSections(article: ArticleContent): ArticlePageSection[] {
  const sectionMap = parseSections(article.rawContent);
  return SECTION_ORDER.map((name) => {
    const raw = sectionMap.get(name);
    if (raw === undefined || raw.trim() === "") {
      // 理論上不會發生：parseArticle 已在 Compiler 讀取階段對缺席固定區塊 fail loud（見
      // src/compiler/content.ts READING_SECTIONS 驗證）。發生代表呼叫端未通過既有 Gate。
      throw new Error(`全文閱讀頁缺少必要區塊：${name}（conceptId=${article.meta.id}）`);
    }
    return { name, html: articleMarked.parse(raw) as string };
  });
}

function buildProblems(article: ArticleContent, bank: ProblemBank): ArticlePageProblem[] {
  const ids = [...article.challenge.keys()].sort((a, b) => a - b);
  return ids.map((id) => {
    const meta = bank.byId.get(id);
    if (!meta) {
      throw new Error(`全文閱讀頁：題號不在 Problem Bank：${id}（conceptId=${article.meta.id}）`);
    }
    const entry = article.challenge.get(id)!;
    const problem: ArticlePageProblem = {
      id: meta.id,
      title: meta.title,
      url: meta.url,
      difficulty: meta.difficulty,
      whyThisPattern: entry.whyThisPattern,
    };
    if (entry.hint !== undefined) problem.hint = entry.hint;
    return problem;
  });
}

export function buildArticlePageView(article: ArticleContent, bank: ProblemBank): ArticlePageView {
  return {
    conceptId: article.meta.id,
    title: article.meta.title,
    patternLabel: article.meta.patternLabel,
    complexityLabel: article.meta.complexityLabel,
    estimatedMinutes: article.meta.estimatedMinutes,
    sections: buildSections(article),
    problems: buildProblems(article, bank),
    takeaway: article.takeaway,
  };
}

function renderProblem(problem: ArticlePageProblem): string {
  const hintHtml = problem.hint !== undefined ? `<p class="hint">Hint: ${escapeHtml(problem.hint)}</p>` : "";
  return `<li>
<a href="${escapeHtml(problem.url)}">${escapeHtml(problem.title)}</a>
<span class="badge">${escapeHtml(problem.difficulty)}</span>
<p>${escapeHtml(problem.whyThisPattern)}</p>
${hintHtml}
</li>`;
}

export function renderArticlePage(view: ArticlePageView): string {
  const sectionsHtml = view.sections
    .map((section) => `<section>\n<h2>${escapeHtml(section.name)}</h2>\n${section.html}\n</section>`)
    .join("\n");

  const problemsHtml =
    view.problems.length > 0
      ? `<ol>${view.problems.map(renderProblem).join("\n")}</ol>`
      : "<p>本篇未涵蓋任何課表題號。</p>";

  const body = `<h1>${escapeHtml(view.title)}</h1>
<p><span class="badge">${escapeHtml(view.patternLabel)}</span> <span class="badge">${escapeHtml(view.complexityLabel)}</span> · 預估 ${view.estimatedMinutes} 分鐘</p>
${sectionsHtml}
<section>
<h2>Today's Challenge</h2>
${problemsHtml}
</section>
<section>
<h2>Takeaway</h2>
<p>${escapeHtml(view.takeaway)}</p>
</section>`;

  return renderPage({ title: view.title, bodyHtml: body });
}
