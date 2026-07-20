import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { marked, type Token } from "marked";

export interface ArticleMeta {
  id: string;
  title: string;
  module: string;
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  exitCriteria: string[];
}

export interface ArticleContent {
  meta: ArticleMeta;
  digest: string;
  tsTip: string;
  pyTip: string;
  takeaway: string;
}

const REQUIRED_SECTIONS = ["Digest", "TypeScript Tip", "Python Tip", "Takeaway"] as const;

// Module → Discord embed 色碼（十進位整數）的確定性對照表。屬 Curriculum 知識，故置於 compiler/
// 而非 renderer/（憲章 XI，contracts/lesson-contract.md §3 R-5）。
const MODULE_COLORS: Record<string, number> = {
  "two-pointer": 0x3498db,
  array: 0x2ecc71,
  "sliding-window": 0xe67e22,
  "fixture-module": 0x9b59b6,
};
const DEFAULT_MODULE_COLOR = 0x95a5a6;

export function moduleColor(module: string): number {
  return MODULE_COLORS[module] ?? DEFAULT_MODULE_COLOR;
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function requireMetaField(data: Record<string, unknown>, key: string): unknown {
  const value = data[key];
  if (isEmptyValue(value)) {
    throw new Error(`教材缺少必要 frontmatter 欄位：${key}`);
  }
  return value;
}

function parseSections(markdown: string): Map<string, string> {
  const tokens = marked.lexer(markdown) as Token[];
  const raws = new Map<string, string[]>();
  let current: string | null = null;

  for (const token of tokens) {
    if (token.type === "heading" && (token as { depth: number }).depth === 2) {
      current = (token as { text: string }).text.trim();
      if (!raws.has(current)) {
        raws.set(current, []);
      }
      continue;
    }
    if (current !== null) {
      raws.get(current)?.push(token.raw);
    }
  }

  const sections = new Map<string, string>();
  for (const [name, parts] of raws) {
    sections.set(name, parts.join("").trim());
  }
  return sections;
}

function requireSection(sections: Map<string, string>, name: string): string {
  const value = sections.get(name);
  if (!value || value.trim() === "") {
    throw new Error(`教材缺少必要區塊：${name}`);
  }
  return value;
}

// article-format.md §1 允許（且本 Feature的教材與 fixtures 皆採用）frontmatter 前有一行
// 臨時性標示的 HTML 註解；gray-matter 要求 frontmatter 分隔線位於檔案最開頭，故先剝除該註解行。
function stripLeadingComment(raw: string): string {
  return raw.replace(/^\s*<!--[\s\S]*?-->\s*\n/, "");
}

export function loadArticle(articlePath: string, conceptId: string): ArticleContent {
  const raw = readFileSync(articlePath, "utf-8");
  const { data, content } = matter(stripLeadingComment(raw));

  const id = requireMetaField(data, "id") as string;
  if (id !== conceptId) {
    throw new Error(`教材 frontmatter 的 id（${id}）與請求的 conceptId（${conceptId}）不符`);
  }

  const meta: ArticleMeta = {
    id,
    title: requireMetaField(data, "title") as string,
    module: requireMetaField(data, "module") as string,
    patternLabel: requireMetaField(data, "pattern_label") as string,
    complexityLabel: requireMetaField(data, "complexity_label") as string,
    estimatedMinutes: requireMetaField(data, "estimated_minutes") as number,
    exitCriteria: requireMetaField(data, "exit_criteria") as string[],
  };

  const sections = parseSections(content);
  for (const name of REQUIRED_SECTIONS) {
    requireSection(sections, name);
  }

  return {
    meta,
    digest: sections.get("Digest") as string,
    tsTip: sections.get("TypeScript Tip") as string,
    pyTip: sections.get("Python Tip") as string,
    takeaway: sections.get("Takeaway") as string,
  };
}
