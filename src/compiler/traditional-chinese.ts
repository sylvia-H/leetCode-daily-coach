// F7 繁中機器判準（Q4 / R7，contracts/content-quality-gate.md §1）：純函式，CI 與生成期 Gate 共用
// （憲章 IX，不另建平行判斷）。1) 移除 fenced/行內 code 與 frontmatter 得散文文本；2) 簡體字偵測
// （比對簡體專用字集）；3) CJK 佔比（CJK ÷（CJK + 拉丁字母詞數）），低於門檻視為英文過多/疑似未譯。

export type TraditionalChineseRule = "simplified-char" | "cjk-ratio-low";

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
