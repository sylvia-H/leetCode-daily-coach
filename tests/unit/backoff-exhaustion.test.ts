import { describe, expect, it } from "vitest";
import { MAX_REGEN, generateOneConcept } from "../../scripts/generate-content.js";
import { createLlmClient, type GenAiLike } from "../../scripts/lib/llm-client.js";
import { Throttle } from "../../scripts/lib/throttle.js";
import type { ConceptNode } from "../../src/types/curriculum.js";
import type { ProblemBank } from "../../src/types/problem.js";

// 題號 1 的最小題庫替身：per-article Gate 的逐題預算檢查需由 Problem Bank 取得 title/url/difficulty。
const fakeBank: ProblemBank = {
  byId: new Map([[1, { id: 1, slug: "two-sum", title: "Two Sum", url: "https://leetcode.com/problems/two-sum/", difficulty: "Easy" as const, patterns: [] }]]),
  byPattern: new Map(),
};

function fakeConceptNode(overrides: Partial<ConceptNode> = {}): ConceptNode {
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
    leetcode: [],
    tags: [],
    localOrder: 1,
    skeletonPath: "concepts/t/001-c1.md",
    articlePath: "articles/t/001-c1.md",
    dirName: "t",
    ...overrides,
  };
}

function fakeClock() {
  let now = 0;
  return { now: () => now, sleep: async (ms: number) => { now += ms; } };
}

describe("backoff-exhaustion（FR-018：429 退避重試、非暫時性 4xx 立即失敗、耗盡後待重跑）", () => {
  it("429 連續失敗 → Throttle 內部指數退避重試至耗盡，該次外層嘗試視為失敗（不視為 needsHumanReview 專屬的品質問題）", async () => {
    const clock = fakeClock();
    let genAiCalls = 0;
    const genAiFactory = (): GenAiLike => ({
      models: {
        generateContent: async () => {
          genAiCalls++;
          throw Object.assign(new Error("rate limited"), { status: 429 });
        },
      },
    });
    const throttle = new Throttle({
      rpmLimit: Infinity,
      maxRetries: 2,
      now: clock.now,
      sleep: clock.sleep,
      random: () => 0,
    });
    const llmClient = createLlmClient({ GEMINI_API_KEY: "key" }, { genAiFactory, throttle });

    const result = await generateOneConcept(llmClient, fakeConceptNode(), "author hints", fakeBank, []);

    expect(result.markdown).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(result.failure?.reason).toContain("throttle-exhausted");
    // 每次外層嘗試（MAX_REGEN 次）各自耗盡 Throttle 的內部重試（maxRetries+1 次呼叫）
    expect(genAiCalls).toBe(MAX_REGEN * (2 + 1));
  });

  it("非暫時性 4xx（如 400）→ Throttle 不重試、立即拋錯，每次外層嘗試只呼叫一次 LLM", async () => {
    let genAiCalls = 0;
    const genAiFactory = (): GenAiLike => ({
      models: {
        generateContent: async () => {
          genAiCalls++;
          throw Object.assign(new Error("bad request"), { status: 400 });
        },
      },
    });
    const llmClient = createLlmClient(
      { GEMINI_API_KEY: "key" },
      { genAiFactory, throttle: new Throttle({ rpmLimit: Infinity, maxRetries: 5 }) },
    );

    const result = await generateOneConcept(llmClient, fakeConceptNode(), "author hints", fakeBank, []);

    expect(result.markdown).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(genAiCalls).toBe(MAX_REGEN);
  });
});
