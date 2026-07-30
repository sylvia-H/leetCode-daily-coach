import { describe, expect, it } from "vitest";
import { MAX_REGEN, generateOneConcept } from "../../scripts/generate-content.js";
import { shouldSkip } from "../../scripts/lib/checkpoint.js";
import { createLlmClient, type GenAiLike } from "../../scripts/lib/llm-client.js";
import { Throttle } from "../../scripts/lib/throttle.js";
import type { ConceptNode } from "../../src/types/curriculum.js";

function fakeConceptNode(): ConceptNode {
  return {
    id: "c1",
    title: "C1",
    module: "m",
    topic: "t",
    difficulty: "easy",
    estimatedMinutes: 10,
    patternLabel: "Pattern",
    complexityLabel: "O(n)",
    prerequisite: [],
    next: [],
    learningGoal: ["目標"],
    exitCriteria: ["條件"],
    leetcode: [1],
    tags: [],
    localOrder: 1,
    skeletonPath: "concepts/t/001-c1.md",
    articlePath: "articles/t/001-c1.md",
    dirName: "t",
  };
}

// 程式碼區塊皆缺斷言（無 throw/assert）：checkCodeBlocks 在呼叫真實編譯器/直譯器前就判定
// missing-assertion，不需要本機真的裝 tsc/python 即可穩定重現「Gate 持續擋下」情境。
function badDraftResponse(): Record<string, unknown> {
  return {
    concept: "這是一段完全正常且充分的繁體中文觀念說明內容。",
    thinking: "這是一段完全正常的繁體中文思考說明內容。",
    patternRecognition: "這是一段完全正常的繁體中文辨識線索說明。",
    commonMistakes: "這是一段完全正常的繁體中文常見錯誤說明。",
    complexity: "時間複雜度 O(n)，空間複雜度 O(1)。",
    tsCorner: "```typescript\nconst x = 1 + 1;\nconsole.log(x);\n```",
    pyCorner: "```python\nx = 1 + 1\nprint(x)\n```",
    tomorrowPreview: "明日預告內容。",
    digest: "摘要內容。",
    tsTip: "```typescript\nconst y = 2;\nconsole.log(y);\n```",
    pyTip: "```python\ny = 2\nprint(y)\n```",
    takeaway: "一句話帶走。",
    challenge: [{ id: 1, whyThisPattern: "適合原因" }],
  };
}

describe("needs-human-review（FR-012：重生 3 次仍不過 → 標記、繼續其餘、非零 exit）", () => {
  it("Gate 持續擋下（缺斷言）→ 恰好重生 MAX_REGEN 次後回報失敗，每次都重新呼叫 LLM 展開", async () => {
    let callCount = 0;
    const genAiFactory = (): GenAiLike => ({
      models: {
        generateContent: async () => {
          callCount++;
          return { text: JSON.stringify(badDraftResponse()) };
        },
      },
    });
    const llmClient = createLlmClient(
      { GEMINI_API_KEY: "key" },
      { genAiFactory, throttle: new Throttle({ rpmLimit: Infinity }) },
    );

    const result = await generateOneConcept(llmClient, fakeConceptNode(), "author hints");

    expect(result.markdown).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(result.failure?.reason).toContain("missing-assertion");
    expect(callCount).toBe(MAX_REGEN);
  });

  it("needsHumanReview 篇章重跑時 MUST 重新嘗試：shouldSkip 對未過 Gate 者恆回傳 false（不永久靜默跳過）", () => {
    const skip = shouldSkip({
      skeletonHash: "hash-x",
      productExists: false,
      manifestEntry: {
        skeletonHash: "hash-x",
        skeletonFrozen: true,
        articleFrozen: false,
        gatePassed: false,
        needsHumanReview: true,
        regenCount: 3,
      },
    });
    expect(skip).toBe(false);
  });
});

describe("重生時把 Gate 失敗原因回饋進 prompt（避免重擲同一顆骰子）", () => {
  it("第 2 次起的 prompt MUST 含上一次的失敗原因", async () => {
    // 實測：第一篇文章連續兩次因俚語「寫扣」被擋、第三次才過。額度是免費層批次的瓶頸，
    // 每篇多打兩次會讓 165 篇的批次從 2～4 天變成 6～12 天。
    const prompts: string[] = [];
    const llmClient = createLlmClient(
      { GEMINI_API_KEY: "key" },
      {
        genAiFactory: () => ({
          models: {
            generateContent: async (args: { contents: string }) => {
              prompts.push(args.contents);
              // 永遠回不合法 JSON → 每次都失敗，便於觀察三次 prompt 的差異
              return { text: "{ not valid json" };
            },
          },
        }),
        throttle: new Throttle({ rpmLimit: Infinity }),
      },
    );

    await generateOneConcept(llmClient, fakeConceptNode(), "hints");

    expect(prompts).toHaveLength(3);
    expect(prompts[0]).not.toContain("上一次產出未通過品質 Gate");
    expect(prompts[1]).toContain("上一次產出未通過品質 Gate");
    expect(prompts[1]).toContain("stage2-parse-error");
    expect(prompts[2]).toContain("上一次產出未通過品質 Gate");
  });
});
