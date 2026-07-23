import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { marked, type Token, type Tokens } from "marked";

export interface ArticleMeta {
  id: string;
  title: string;
  module: string;
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  exitCriteria: string[];
}

export interface ArticleChallengeEntry {
  problemId: number;
  whyThisPattern: string;
  hint?: string;
}

export interface ArticleContent {
  meta: ArticleMeta;
  digest: string;
  tsTip: string;
  pyTip: string;
  takeaway: string;
  challenge: Map<number, ArticleChallengeEntry>;
}

// 閱讀用固定區塊（docs/spec.md §10）：MUST 存在且非空，但不進 Lesson（Discord 不推全文，§14.5）。
// 缺漏代表教材不完整，F9 全文頁與 F7 產線都會受害，故與推播用區塊一併攔下（data-model.md §1）。
const READING_SECTIONS = [
  "Concept",
  "Thinking",
  "Pattern Recognition",
  "Common Mistakes",
  "Complexity",
  "TypeScript Corner",
  "Python Corner",
  "Tomorrow Preview",
] as const;

// 推播用固定區塊：進入 Lesson 的欄位（Today's Challenge 另行解析，見 parseChallengeEntries）。
const PUSH_SECTIONS = ["Digest", "TypeScript Tip", "Python Tip", "Takeaway"] as const;

const CHALLENGE_SECTION = "Today's Challenge";

// Module → Discord embed 色碼（十進位整數）的確定性對照表，涵蓋 curriculum/modules.json 全部 16 個
// Module（FR-018）。屬 Curriculum 知識，故置於 compiler/ 而非 renderer/（憲章 XI）。
const MODULE_COLORS: Record<string, number> = {
  "programming-mindset": 0x7f8c8d,
  array: 0x2ecc71,
  "hash-table": 0x1abc9c,
  string: 0xf1c40f,
  "two-pointer": 0x3498db,
  "binary-search": 0x2980b9,
  "sliding-window": 0xe67e22,
  stack: 0xd35400,
  queue: 0xc0392b,
  "linked-list": 0x8e44ad,
  tree: 0x27ae60,
  graph: 0x16a085,
  heap: 0xf39c12,
  backtracking: 0xe74c3c,
  "dfs-bfs": 0x2c3e50,
  "dynamic-programming": 0x9b59b6,
  "fixture-module": 0x9b59b6,
};
// 未知 Module 與非 concept 類 Session 共用的中性色（SC-010）。
export const DEFAULT_MODULE_COLOR = 0x95a5a6;

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

function requireSection(sections: Map<string, string>, name: string, articlePath: string): string {
  const value = sections.get(name);
  if (!value || value.trim() === "") {
    throw new Error(`教材缺少必要區塊：${name}（${articlePath}）`);
  }
  return value;
}

// article-format.md §1 允許（且本 Feature的教材與 fixtures 皆採用）frontmatter 前有一行
// 臨時性標示的 HTML 註解；gray-matter 要求 frontmatter 分隔線位於檔案最開頭，故先剝除該註解行。
function stripLeadingComment(raw: string): string {
  return raw.replace(/^\s*<!--[\s\S]*?-->\s*\n/, "");
}

function isTextToken(token: Token): token is Tokens.Text {
  return token.type === "text";
}

function isListToken(token: Token): token is Tokens.List {
  return token.type === "list";
}

function isStrongToken(token: Token): token is Tokens.Strong {
  return token.type === "strong";
}

/**
 * 取出 list item 內全部「承載 inline 內容」的 token 群組。marked 依 list 的鬆緊會把同一段內容
 * 分別 lex 成 `text` 或 `paragraph`，且多段落的 item 會產生**多個**群組——只取第一個會靜默丟掉
 * 後續段落的 whyThisPattern。
 */
function inlineGroups(item: Tokens.ListItem): Token[][] {
  return item.tokens
    .filter((t): t is Tokens.Text | Tokens.Paragraph => isTextToken(t) || t.type === "paragraph")
    .map((t) => (t.tokens ?? []) as Token[]);
}

function nestedListTokens(item: Tokens.ListItem): Tokens.List[] {
  return item.tokens.filter(isListToken);
}

// article-format.md §4：頂層 list item 以 `**{leetcodeId}**` 開頭，之後的文字即 whyThisPattern；
// 巢狀 list item 以 `Hint:` / `Hint：` 開頭者為 hint（至多一則，選配）。以 marked lexer token 走訪，
// 不需正則硬解整段文字（research R1）。
function parseChallengeEntries(markdown: string, articlePath: string): Map<number, ArticleChallengeEntry> {
  const tokens = marked.lexer(markdown) as Token[];
  // 段落或子標題會把條目切成**多個**頂層 list token；只讀第一個會讓後面的題目無聲消失，
  // 失敗會遠遠延後成「課表題號在 Article 條目中缺漏」（甚至在 practice/review 路徑下完全不報錯）。
  const listTokens = tokens.filter(isListToken);
  if (listTokens.length === 0) {
    throw new Error(`article-challenge-format：Today's Challenge 沒有可解析的條目（${articlePath}）`);
  }

  const entries = new Map<number, ArticleChallengeEntry>();

  for (const item of listTokens.flatMap((list) => list.items)) {
    const groups = inlineGroups(item);
    const strongToken = groups.flat().find(isStrongToken);
    if (!strongToken) {
      throw new Error(
        `article-challenge-format：Today's Challenge 條目缺少 **{題號}** 開頭（${articlePath}）`,
      );
    }
    // 題號 MUST 是純十進位數字：`Number()` 會把 " "、`1e3`、`+167` 都收成「合法整數」，
    // 讓打錯的行以「別的題號」或 0 悄悄註冊，錯誤現場因而消失。
    const idText = strongToken.text.trim();
    if (!/^\d+$/.test(idText) || Number(idText) <= 0) {
      throw new Error(
        `article-challenge-format：Today's Challenge 條目的題號不是合法正整數：「${strongToken.text}」（${articlePath}）`,
      );
    }
    const problemId = Number(idText);

    const rest = groups
      .map((group) =>
        group
          .filter((t) => t !== strongToken)
          .map((t) => t.raw)
          .join(""),
      )
      .filter((text) => text.trim() !== "")
      .join("\n\n");
    const whyThisPattern = rest.replace(/^[\s·\-—]+/, "").trim();
    if (!whyThisPattern) {
      throw new Error(
        `article-challenge-format：題號 ${problemId} 的 whyThisPattern 為空（${articlePath}）`,
      );
    }

    let hint: string | undefined;
    for (const hintItem of nestedListTokens(item).flatMap((list) => list.items)) {
      const hintText = (hintItem.tokens.find(isTextToken)?.text ?? hintItem.text).trim();
      const match = /^Hint[:：]\s*(.+)$/s.exec(hintText);
      if (match) {
        hint = match[1]!.trim();
        break;
      }
    }

    if (entries.has(problemId)) {
      throw new Error(
        `article-challenge-duplicate：題號 ${problemId} 在 Today's Challenge 中重複出現（${articlePath}）`,
      );
    }
    entries.set(problemId, hint !== undefined ? { problemId, whyThisPattern, hint } : { problemId, whyThisPattern });
  }

  return entries;
}

// 純函式版本（compile() 的讀檔邊界注入點，CompilerDeps.readArticle 已完成 I/O）：
// 供 lesson.ts 在不重新 readFileSync 的情況下解析已讀入的原始內容。
export function parseArticle(raw: string, conceptId: string, articlePath: string): ArticleContent {
  const { data, content } = matter(stripLeadingComment(raw));

  const id = requireMetaField(data, "id") as string;
  if (id !== conceptId) {
    throw new Error(`article-id-mismatch：教材 frontmatter 的 id（${id}）與請求的 conceptId（${conceptId}）不符`);
  }

  const exitCriteria = requireMetaField(data, "exit_criteria");
  // 結構性檢查（非 zod 的型別／值域 schema 驗證，後者仍屬 F2）：宣告為陣列的欄位 MUST 是陣列。
  // 少了這一道，YAML 純量會一路穿過組裝，直到 renderer 的 `.map()` 才以 TypeError 爆開，
  // 違反 article-format.md §2「拋出指名該欄位的錯誤」的錯誤契約。
  if (!Array.isArray(exitCriteria)) {
    throw new Error("article-field-type：教材 frontmatter 欄位 exit_criteria 必須是陣列（每條 Exit Criteria 各一個項目）");
  }

  const meta: ArticleMeta = {
    id,
    title: requireMetaField(data, "title") as string,
    module: requireMetaField(data, "module") as string,
    patternLabel: requireMetaField(data, "pattern_label") as string,
    complexityLabel: requireMetaField(data, "complexity_label") as string,
    estimatedMinutes: requireMetaField(data, "estimated_minutes") as number,
    exitCriteria: exitCriteria as string[],
  };

  const sections = parseSections(content);
  for (const name of READING_SECTIONS) {
    requireSection(sections, name, articlePath);
  }
  for (const name of PUSH_SECTIONS) {
    requireSection(sections, name, articlePath);
  }
  const challengeRaw = requireSection(sections, CHALLENGE_SECTION, articlePath);
  const challenge = parseChallengeEntries(challengeRaw, articlePath);

  return {
    meta,
    digest: sections.get("Digest") as string,
    tsTip: sections.get("TypeScript Tip") as string,
    pyTip: sections.get("Python Tip") as string,
    takeaway: sections.get("Takeaway") as string,
    challenge,
  };
}

// I/O 邊界：預設讀檔實作，供測試與非 compile() 呼叫路徑（如既有 content.test.ts）直接使用。
export function loadArticle(articlePath: string, conceptId: string): ArticleContent {
  const raw = readFileSync(articlePath, "utf-8");
  return parseArticle(raw, conceptId, articlePath);
}
