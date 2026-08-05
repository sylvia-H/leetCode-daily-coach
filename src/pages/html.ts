// 共用 HTML/XML entity escape 與版面 helper（site-build-contract.md §3）。
// 純函式、無 I/O；`src/pages/**` 全體共用同一份 escape 規則，避免各模組各自實作出現不一致。

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const ESCAPE_PATTERN = /[&<>"']/g;

/** HTML entity escape（`& < > " '`）。marked.parse() 的輸出已是 HTML，MUST NOT 對其再次呼叫。 */
export function escapeHtml(text: string): string {
  return text.replace(ESCAPE_PATTERN, (ch) => ESCAPE_MAP[ch]!);
}

/** XML entity escape 規則與 HTML 相同（五個字元皆為 XML 保留字元），供 feed.ts 重用同一份實作。 */
export function escapeXml(text: string): string {
  return escapeHtml(text);
}

const SHARED_STYLE = `
:root { color-scheme: light dark; }
* { box-sizing: border-box; }
body {
  font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
  line-height: 1.6;
}
h1, h2, h3 { line-height: 1.3; }
a { color: inherit; }
.track-card { border: 1px solid currentColor; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
.track-card[data-status="not-started"] { opacity: 0.7; }
.curriculum-entry.locked { opacity: 0.55; }
.badge { display: inline-block; border-radius: 0.25rem; padding: 0.1rem 0.5rem; font-size: 0.85em; border: 1px solid currentColor; }
section { margin-bottom: 2rem; }
`;

export interface PageLayoutInput {
  title: string;
  bodyHtml: string;
}

/** 每個輸出檔案的共用外殼：`<!doctype html>`、內嵌 `<style>`，不外連任何 CSS/JS（憲章 XVI）。 */
export function renderPage(input: PageLayoutInput): string {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(input.title)}</title>
<style>${SHARED_STYLE}</style>
</head>
<body>
${input.bodyHtml}
</body>
</html>
`;
}
