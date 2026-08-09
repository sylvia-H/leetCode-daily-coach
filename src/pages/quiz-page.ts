// F11 quiz/{conceptId}.html 視圖與 render（與 article-page.ts 同構，pages-quiz.md §3）。
// 純函式、無 I/O；正解與詳解以原生 <details><summary> 呈現（零 JS，site-build-contract.md §3）。
import type { QuizItem } from "../compiler/quiz.js";
import type { ConceptNode } from "../types/curriculum.js";
import { escapeHtml, renderPage } from "./html.js";

export interface QuizPageItem {
  stem: string;
  options: [string, string, string, string];
  answerLabel: "A" | "B" | "C" | "D";
  /** 完整 5 段（Pages 用，區別於 Discord 只用 explanation[0]）。 */
  explanation: [string, string, string, string, string];
}

export interface QuizPageView {
  conceptId: string;
  title: string;
  items: QuizPageItem[];
}

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function answerLabelOf(index: 0 | 1 | 2 | 3): "A" | "B" | "C" | "D" {
  return OPTION_LABELS[index];
}

export function buildQuizPageView(node: ConceptNode, items: QuizItem[]): QuizPageView {
  return {
    conceptId: node.id,
    title: node.title,
    // 同一 Concept 的多題 MUST 依宣告序呈現，不重排（pages-quiz.md §3）。
    items: items.map((item) => ({
      stem: item.stem,
      options: item.options,
      answerLabel: answerLabelOf(item.answerIndex),
      explanation: item.explanation,
    })),
  };
}

function renderQuizPageItem(item: QuizPageItem): string {
  const optionsHtml = item.options
    .map((opt, i) => `<li>${OPTION_LABELS[i]}. ${escapeHtml(opt)}</li>`)
    .join("\n");
  const explanationHtml = item.explanation.map((seg) => `<p>${escapeHtml(seg)}</p>`).join("\n");
  return `<li>
<p>${escapeHtml(item.stem)}</p>
<ul>
${optionsHtml}
</ul>
<details>
<summary>顯示解答</summary>
<p>正解：${item.answerLabel}</p>
${explanationHtml}
</details>
</li>`;
}

export function renderQuizPage(view: QuizPageView): string {
  const itemsHtml = view.items.map((item) => renderQuizPageItem(item)).join("\n");
  const body = `<h1>${escapeHtml(view.title)} · 小測</h1>
<ol>
${itemsHtml}
</ol>`;

  return renderPage({ title: `${view.title} · 小測`, bodyHtml: body });
}
