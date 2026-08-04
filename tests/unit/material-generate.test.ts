// F8 Stage 3 生成腳本（contracts/material-schema.md §5.2/§5.3/§5.4）：以 GenAiLike 假物件替身測試，
// MUST NOT 打真實 API（憲章 VIII）。涵蓋 self-check 解析失敗的重生語意、3 次不過的
// needsHumanReview、續跑跳過（shouldSkipBatch）、--force 覆蓋，以及 canonical 序列化（FR-009a）。
import { describe, expect, it } from "vitest";
import {
  MAX_REGEN,
  generateEncouragementBatch,
  generateReflectionBatch,
  serializeEncouragementPool,
  serializeReflectionBank,
} from "../../scripts/generate-materials.js";
import { shouldSkipBatch } from "../../scripts/lib/material-checkpoint.js";
import { createLlmClient, type GenAiLike } from "../../scripts/lib/llm-client.js";
import { Throttle } from "../../scripts/lib/throttle.js";
import { REFLECTION_QUESTIONS_PER_TOPIC } from "../../scripts/lib/prompts/reflection-bank.js";
import { ENCOURAGEMENT_QUOTES_TARGET } from "../../scripts/lib/prompts/encouragement.js";
import { makeGraph } from "../helpers/compiler.js";

function makeClient(genAiFactory: () => GenAiLike) {
  return createLlmClient({ GEMINI_API_KEY: "key" }, { genAiFactory, throttle: new Throttle({ rpmLimit: Infinity }) });
}

function validQuestions(n = REFLECTION_QUESTIONS_PER_TOPIC): string[] {
  return Array.from({ length: n }, (_, i) => `這週你在第 ${i + 1} 個地方卡住了嗎？發生了什麼事？`);
}

function validQuotes(n = ENCOURAGEMENT_QUOTES_TARGET): string[] {
  return Array.from({ length: n }, (_, i) => `慢慢來也沒關係，重點是持續往前走（第 ${i} 則）。`);
}

describe("generateReflectionBatch — self-check 解析失敗算一次重生，不造成 unhandled rejection", () => {
  it("第一次 self-check 回應非合法 JSON → 觸發重生，第二次通過", async () => {
    let call = 0;
    const client = makeClient(() => ({
      models: {
        generateContent: async (args: { contents: string }) => {
          call++;
          // 奇數次呼叫是草稿生成，偶數次是 self-check（每次嘗試各打兩次）
          if (call % 2 === 1) {
            return { text: JSON.stringify({ questions: validQuestions() }) };
          }
          if (call === 2) {
            return { text: "{ not valid json" }; // self-check 解析失敗
          }
          return { text: JSON.stringify({ confident: true, issues: [] }) };
        },
      },
    }));

    const result = await generateReflectionBatch(client, "array", "Array");
    expect(result.questions).toHaveLength(REFLECTION_QUESTIONS_PER_TOPIC);
    expect(result.attempts).toBe(2);
  });
});

describe("generateReflectionBatch — 3 次不過 Gate 仍未通過 → needsHumanReview（不寫入該批）", () => {
  it("則數恆錯（5 則）→ 恰好重生 MAX_REGEN 次後回報失敗", async () => {
    let call = 0;
    const client = makeClient(() => ({
      models: {
        generateContent: async () => {
          call++;
          return { text: JSON.stringify({ questions: validQuestions(5) }) }; // 少一則，per-batch Gate 擋下
        },
      },
    }));

    const result = await generateReflectionBatch(client, "array", "Array");
    expect(result.questions).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(result.failure?.reason).toMatch(/則數 5，須恰為 6/);
    expect(call).toBe(MAX_REGEN); // 每次嘗試皆呼叫草稿生成；Gate 未過不會再打 self-check
  });
});

describe("generateEncouragementBatch — MUST NOT 跑 self-check（FR-028b）", () => {
  it("草稿一次通過 Gate 即回傳，全程只呼叫一次 LLM（無 self-check 呼叫）", async () => {
    let call = 0;
    const client = makeClient(() => ({
      models: {
        generateContent: async () => {
          call++;
          return { text: JSON.stringify({ quotes: validQuotes() }) };
        },
      },
    }));

    const result = await generateEncouragementBatch(client);
    expect(result.quotes).toHaveLength(ENCOURAGEMENT_QUOTES_TARGET);
    expect(result.attempts).toBe(1);
    expect(call).toBe(1);
  });

  it("含 URL 的語錄 → material-progress-coupled 同源判準擋下，3 次不過標記失敗", async () => {
    const client = makeClient(() => ({
      models: {
        generateContent: async () => ({
          text: JSON.stringify({ quotes: [...validQuotes(35), "今天休息一下 https://example.com 看看"] }),
        }),
      },
    }));

    const result = await generateEncouragementBatch(client);
    expect(result.quotes).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(result.failure?.reason).toMatch(/疑似綁定進度/);
  });
});

describe("shouldSkipBatch — 續跑跳過已通過批次；--force 一律不跳（research R11）", () => {
  const entry = { inputHash: "hash-a", frozen: true, gatePassed: true, needsHumanReview: false, regenCount: 1 };

  it("inputHash 相符 + 已凍結 + 已過 Gate + 素材檔存在 ⇒ 跳過（零重複 LLM 呼叫）", () => {
    expect(shouldSkipBatch({ inputHash: "hash-a", batchExistsInFile: true, manifestEntry: entry })).toBe(true);
  });

  it("--force ⇒ 一律不跳，即使其餘條件皆符合", () => {
    expect(shouldSkipBatch({ inputHash: "hash-a", batchExistsInFile: true, manifestEntry: entry, force: true })).toBe(false);
  });

  it("inputHash 不符（prompt 版本或 Topic 標題已變更）⇒ 不跳過", () => {
    expect(shouldSkipBatch({ inputHash: "hash-b", batchExistsInFile: true, manifestEntry: entry })).toBe(false);
  });

  it("素材檔中該批不存在 ⇒ 不跳過（即使 manifest 記錄已過 Gate）", () => {
    expect(shouldSkipBatch({ inputHash: "hash-a", batchExistsInFile: false, manifestEntry: entry })).toBe(false);
  });

  it("manifest 無此批次記錄 ⇒ 不跳過", () => {
    expect(shouldSkipBatch({ inputHash: "hash-a", batchExistsInFile: true })).toBe(false);
  });
});

describe("canonical 序列化（FR-009a）：2-space 縮排、檔尾恰一個 \\n、byTopic key 序為 Module→Topic 宣告序", () => {
  it("serializeReflectionBank：key 序依 orderedTopicIds，非字典序或插入序；同輸入連跑兩次 byte-identical", () => {
    const graph = makeGraph([
      { id: "c0", module: "test-module", topic: "test-topic", localOrder: 1 },
    ]);
    // 手動追加第二個 Topic（topicIndex 1），刻意以「字典序較前」的 key 名稱插入相反序，
    // 驗證輸出序不是字典序也不是插入序，而是 topicIndex 宣告序。
    graph.topics.set("aaa-topic", { id: "aaa-topic", title: "AAA", moduleId: "test-module", topicIndex: 1 });
    const byTopic = { "aaa-topic": ["Q-aaa"], "test-topic": ["Q-test"] }; // 插入序：aaa-topic 先
    const text = serializeReflectionBank(byTopic, graph);

    expect(text.endsWith("\n")).toBe(true);
    expect(text).not.toMatch(/\r/);
    const parsed = JSON.parse(text) as { byTopic: Record<string, string[]> };
    // test-topic（topicIndex 0）MUST 先於 aaa-topic（topicIndex 1），即使字典序與插入序皆相反。
    expect(Object.keys(parsed.byTopic)).toEqual(["test-topic", "aaa-topic"]);

    const text2 = serializeReflectionBank(byTopic, graph);
    expect(text2).toBe(text);
  });

  it("serializeEncouragementPool：2-space 縮排、檔尾恰一個 \\n、同輸入連跑兩次 byte-identical", () => {
    const text = serializeEncouragementPool(["加油", "慢慢來"]);
    expect(text.endsWith("\n")).toBe(true);
    expect(text.endsWith("\n\n")).toBe(false);
    expect(text).toContain('  "version": 1');
    expect(serializeEncouragementPool(["加油", "慢慢來"])).toBe(text);
  });
});
