// F7 繁中機器判準（Q4 / R7，contracts/content-quality-gate.md §1）：純函式，CI 與生成期 Gate 共用
// （憲章 IX，不另建平行判斷）。1) 移除 fenced/行內 code 與 frontmatter 得散文文本；2) 簡體字偵測
// （比對簡體專用字集）；3) CJK 佔比（CJK ÷（CJK + 拉丁字母詞數）），低於門檻視為英文過多/疑似未譯。

export type TraditionalChineseRule = "simplified-char" | "cjk-ratio-low" | "slang-term";

export interface TraditionalChineseViolation {
  rule: TraditionalChineseRule;
  message: string;
  /** simplified-char 專屬：偵測到的字元與其在散文文本中的位置。 */
  char?: string;
  index?: number;
}

export interface TraditionalChineseResult {
  ok: boolean;
  violations: TraditionalChineseViolation[];
  /** CJK ÷（CJK + 拉丁字母詞數），供除錯與微調門檻參考。 */
  cjkRatio: number;
}

/** 門檻預設 0.5（寬鬆設計）：英文技術術語計入分母但不因此失敗（research R7）。 */
export const DEFAULT_CJK_RATIO_THRESHOLD = 0.5;

/**
 * 教材 MUST NOT 使用的網路俚語（音譯用字）。**刻意極小且精準**，不追求窮舉——俚語無法列舉完全，
 * 此處只收「實測真的出現、且在教材語境下必為誤用」的樣態，避免誤殺正常用語。
 *
 * 實測起因：Stage 2 產出的第一篇文章用了 6 次「寫扣」（把 code 音譯為「扣」的台式網路俚語），
 * 散見於 Concept / Pattern Recognition / Common Mistakes / Digest 四個區塊。既有的繁中判準只驗
 * 簡繁與 CJK 佔比，對「是繁體、但用語不適合教材」完全無感。而只靠 prompt 約束對這類系統性
 * 偏差不可靠（本 Feature 已反覆驗證：篇數、缺欄位、程式碼 fence 都是加了機器檢查才真正解決）。
 *
 * MUST 只匹配動詞搭配（寫/敲/打 + 扣），不可單獨匹配「扣」——「折扣」「扣除」「扣分」皆為正常用語。
 */
const SLANG_PATTERNS: { pattern: RegExp; suggestion: string }[] = [
  { pattern: /[寫敲打]扣/g, suggestion: "「扣」為 code 的音譯俚語，教材請改用「程式碼」或保留英文 code" },
];

/**
 * 簡體專用字集（bundled，非窮舉）：僅收錄「簡體寫法與繁體字形完全不同、且該簡體字形在正式繁中
 * MUST NOT 出現」的常見字，避免誤殺繁簡共用字形（如「一」「人」）。涵蓋範圍足以攔下常見簡體
 * 段落誤植；非涵蓋全部簡化字的完整轉換表（OpenCC 之類殺雞用牛刀，見 research R7 Alternatives）。
 */
const SIMPLIFIED_ONLY_CHARS = new Set(
  (
    "国学会这说对时还没门从与义东车长电点汇华号网图组织经结给处让觉认识应该现实际动态达过" +
    "问题谁语话记讲计划广产变转归备环观类声卫医药万数习练简单双传统继续联络显页层构设术员" +
    "队导师张阅读写体独强战亲围绕库总统龙凤"
  ).split(""),
);

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function stripFencedCode(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, "");
}

function stripInlineCode(markdown: string): string {
  return markdown.replace(/`[^`\n]*`/g, "");
}

/** 移除 frontmatter + fenced/行內 code，得到供判準分析的純散文文本。 */
export function stripNonProse(markdown: string): string {
  return stripInlineCode(stripFencedCode(stripFrontmatter(markdown)));
}

/**
 * 繁中機器判準（純函式）：對整段 markdown 判斷是否含簡體字、CJK 佔比是否達門檻。
 * 違規 ⇒ Gate 擋下、重生（生成期）；CI 只讀不重生。
 */
export function checkTraditionalChinese(
  markdown: string,
  threshold: number = DEFAULT_CJK_RATIO_THRESHOLD,
): TraditionalChineseResult {
  const prose = stripNonProse(markdown);
  const violations: TraditionalChineseViolation[] = [];

  for (let i = 0; i < prose.length; i++) {
    const ch = prose[i]!;
    if (SIMPLIFIED_ONLY_CHARS.has(ch)) {
      violations.push({
        rule: "simplified-char",
        char: ch,
        index: i,
        message: `偵測到簡體字「${ch}」（散文文本位置 ${i}）`,
      });
    }
  }

  for (const { pattern, suggestion } of SLANG_PATTERNS) {
    // 每個 pattern 的 lastIndex 在共用的 /g regex 上會累積，MUST 逐次重置才不會漏掉後續出現位置。
    pattern.lastIndex = 0;
    for (const match of prose.matchAll(pattern)) {
      violations.push({
        rule: "slang-term",
        char: match[0],
        index: match.index,
        message: `偵測到不適合教材的俚語「${match[0]}」（散文文本位置 ${match.index}）：${suggestion}`,
      });
    }
  }

  const cjkCount = (prose.match(/[一-鿿]/g) ?? []).length;
  const latinWordCount = (prose.match(/[A-Za-z]+/g) ?? []).length;
  const denom = cjkCount + latinWordCount;
  const cjkRatio = denom === 0 ? 1 : cjkCount / denom;

  if (denom > 0 && cjkRatio < threshold) {
    violations.push({
      rule: "cjk-ratio-low",
      message: `CJK 佔比 ${(cjkRatio * 100).toFixed(1)}% 低於門檻 ${(threshold * 100).toFixed(0)}%（英文過多或疑似未譯段落）`,
    });
  }

  return { ok: violations.length === 0, violations, cjkRatio };
}
