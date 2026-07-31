import { readFileSync } from "node:fs";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { assembleArticleMarkdown, type SkeletonFrontmatterForArticle } from "../../scripts/generate-content.js";
import type { DraftArticleResponse } from "../../scripts/lib/prompts/stage2-content.js";

function sampleSkeleton(overrides: Partial<SkeletonFrontmatterForArticle> = {}): SkeletonFrontmatterForArticle {
  return {
    id: "array-traversal",
    title: "Array Traversal",
    module: "array",
    patternLabel: "Linear Scan",
    complexityLabel: "O(n) / O(1)",
    estimatedMinutes: 12,
    exitCriteria: ["能用一次迴圈求極值"],
    leetcode: [1, 26],
    ...overrides,
  };
}

function sampleDraft(overrides: Partial<DraftArticleResponse> = {}): DraftArticleResponse {
  return {
    concept: "觀念內容",
    thinking: "思考內容",
    patternRecognition: "辨識線索",
    commonMistakes: "常見錯誤",
    complexity: "複雜度說明",
    tsCorner: "```typescript\nif (1 + 1 !== 2) throw new Error('x');\n```",
    pyCorner: "```python\nassert 1 + 1 == 2\n```",
    tomorrowPreview: "明日預告",
    digest: "摘要",
    tsTip: "```typescript\nif (1 !== 1) throw new Error('x');\n```",
    pyTip: "```python\nassert 1 == 1\n```",
    takeaway: "一句話",
    challenge: [
      { id: 1, whyThisPattern: "適合原因 1" },
      { id: 26, whyThisPattern: "適合原因 26", hint: "提示 26" },
    ],
    ...overrides,
  };
}

describe("assembleArticleMarkdown（FR-024：結構欄位 MUST 等於來源 Skeleton frontmatter）", () => {
  it("frontmatter 結構欄位一律從 Skeleton 複製，與 draft 內容無關", () => {
    const skeleton = sampleSkeleton();
    const markdown = assembleArticleMarkdown(skeleton, sampleDraft());
    const { data } = matter(markdown);

    expect(data.id).toBe(skeleton.id);
    expect(data.title).toBe(skeleton.title);
    expect(data.module).toBe(skeleton.module);
    expect(data.pattern_label).toBe(skeleton.patternLabel);
    expect(data.complexity_label).toBe(skeleton.complexityLabel);
    expect(data.estimated_minutes).toBe(skeleton.estimatedMinutes);
    expect(data.exit_criteria).toEqual(skeleton.exitCriteria);
  });

  it("Today's Challenge 題號集合恰為 Skeleton.leetcode（無新增/刪除/替換）", () => {
    const skeleton = sampleSkeleton({ leetcode: [1, 26] });
    const markdown = assembleArticleMarkdown(skeleton, sampleDraft());
    expect(markdown).toContain("**1**");
    expect(markdown).toContain("**26**");
  });

  it("draft.challenge 缺少 Skeleton 的某個題號 → article-structure-violation（LLM 不得刪除題號）", () => {
    const skeleton = sampleSkeleton({ leetcode: [1, 26] });
    const draft = sampleDraft({ challenge: [{ id: 1, whyThisPattern: "只給了一題" }] });
    expect(() => assembleArticleMarkdown(skeleton, draft)).toThrow("article-structure-violation");
  });

  it("draft.challenge 夾帶 Skeleton 沒有的額外題號 → article-structure-violation（LLM 不得新增題號）", () => {
    const skeleton = sampleSkeleton({ leetcode: [1] });
    const draft = sampleDraft({
      challenge: [
        { id: 1, whyThisPattern: "原本這題" },
        { id: 999, whyThisPattern: "額外夾帶的題號" },
      ],
    });
    expect(() => assembleArticleMarkdown(skeleton, draft)).toThrow("article-structure-violation");
  });

  it("draft.challenge 題號重複 → article-structure-violation", () => {
    const skeleton = sampleSkeleton({ leetcode: [1] });
    const draft = sampleDraft({
      challenge: [
        { id: 1, whyThisPattern: "第一次" },
        { id: 1, whyThisPattern: "重複第二次" },
      ],
    });
    expect(() => assembleArticleMarkdown(skeleton, draft)).toThrow("article-structure-violation");
  });

  it("Skeleton.leetcode 為空陣列（純觀念 Session）→ 產生佔位 Challenge 條目，不拋錯", () => {
    const skeleton = sampleSkeleton({ leetcode: [] });
    const draft = sampleDraft({ challenge: [] });
    expect(() => assembleArticleMarkdown(skeleton, draft)).not.toThrow();
  });

  it("DraftArticleResponse 型別本身不含 id/module/leetcode 等結構欄位（型別層即無法覆寫）", () => {
    const draft = sampleDraft();
    expect(draft).not.toHaveProperty("id");
    expect(draft).not.toHaveProperty("module");
    expect(draft).not.toHaveProperty("leetcode");
    expect(draft).not.toHaveProperty("prerequisite");
    expect(draft).not.toHaveProperty("next");
  });
});

describe("Stage 2 MUST NOT 寫入 concepts/**（只讀凍結 Skeleton、只寫 articles/**）", () => {
  it("scripts/generate-content.ts 內的 writeFileSync 呼叫皆不指向 concepts/** 路徑", () => {
    const src = readFileSync("scripts/generate-content.ts", "utf-8");
    const writeCalls = src.match(/writeFileSync\([^)]*\)/g) ?? [];
    expect(writeCalls.length).toBeGreaterThan(0);
    for (const call of writeCalls) {
      expect(call).not.toMatch(/CONCEPTS_DIR/);
      expect(call).not.toMatch(/concepts\//);
    }
  });
});

describe("assembleArticleMarkdown — 無題目觀念課（leetcode: []）", () => {
  it("MUST NOT 生出帶題號的假條目，改為說明散文（舊版 `- **1** ·` 會被讀成題號 1 Two Sum）", () => {
    const skeleton = sampleSkeleton({ leetcode: [] });
    const markdown = assembleArticleMarkdown(skeleton, sampleDraft({ challenge: [] }));
    const challengeSection = markdown.slice(markdown.indexOf("## Today's Challenge"));

    expect(challengeSection).not.toMatch(/^\s*-\s*\*\*\d+\*\*/m); // 無任何 `- **題號**` 條目
    expect(challengeSection).toContain("觀念課");
    expect(challengeSection.replace("## Today's Challenge", "").trim()).not.toBe(""); // 區塊非空
  });
});
