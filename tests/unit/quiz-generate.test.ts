// F11 題庫產線生成邏輯（quiz-bank-schema.md §4／§5.2）：以 GenAiLike 假物件替身測試，
// MUST NOT 打真實 API（憲章 VIII）。涵蓋交叉驗證一致/不一致、3 輪耗盡的 needsHumanReview、
// 基礎設施失敗的重試語意（MUST NOT 計入內容重生上限）、續跑跳過／--force／Skeleton 雜湊變更、
// manifest 反推重建，以及 canonical 序列化。
import { describe, expect, it } from "vitest";
import { MAX_REGEN, generateQuizForConcept, serializeQuizBank } from "../../scripts/generate-quiz-bank.js";
import { rebuildQuizManifest, shouldSkipQuizConcept } from "../../scripts/lib/quiz-checkpoint.js";
import type { QuizAspectsInput } from "../../scripts/lib/prompts/quiz-aspects.js";
import { createLlmClient, type GenAiLike } from "../../scripts/lib/llm-client.js";
import { Throttle } from "../../scripts/lib/throttle.js";
import type { QuizItem } from "../../src/compiler/quiz.js";
import { makeGraph } from "../helpers/compiler.js";

function makeClient(genAiFactory: () => GenAiLike) {
  return createLlmClient({ GEMINI_API_KEY: "key" }, { genAiFactory, throttle: new Throttle({ rpmLimit: Infinity }) });
}

function fakeAspectsInput(): QuizAspectsInput {
  return {
    concept: { id: "c1", title: "C1", learningGoal: ["目標"], exitCriteria: ["條件"] },
    authorHints: { 核心觀念: "核心", Pattern辨識線索: "線索", Thinking: "思考", CommonMistakes: "錯誤" },
    neighbors: { prerequisite: [], next: [] },
  };
}

function makeNode() {
  const graph = makeGraph([{ id: "c1", localOrder: 1 }]);
  return { graph, node: graph.concepts.get("c1")! };
}

function draftItem(aspect: string, answerIndex = 0) {
  return {
    stem: `題幹（${aspect}）`,
    options: ["選項一", "選項二", "選項三", "選項四"],
    answerIndex,
    explanation: ["結論", "正解說明", "選2說明", "選3說明", "選4說明"],
    aspect,
  };
}

/** 依序回應的假 LLM：每次呼叫回傳陣列中下一筆（依序取用，用完即拋錯以利測試發現漏配置）。 */
function sequentialClient(responses: { text: string }[]) {
  let i = 0;
  return makeClient(() => ({
    models: {
      generateContent: async () => {
        if (i >= responses.length) throw new Error(`sequentialClient：呼叫次數超過預先配置的 ${responses.length} 筆回應`);
        return responses[i++]!;
      },
    },
  }));
}

describe("generateQuizForConcept — 交叉驗證一致即通過", () => {
  it("Stage A/B 各一次呼叫、逐題交叉驗證皆一致 ⇒ 全數存活，attempts=1", async () => {
    const { graph, node } = makeNode();
    const client = sequentialClient([
      { text: JSON.stringify({ aspects: ["面向甲", "面向乙", "面向丙"] }) },
      {
        text: JSON.stringify({
          items: [draftItem("面向甲", 0), draftItem("面向乙", 0), draftItem("面向丙", 0)],
        }),
      },
      { text: JSON.stringify({ answerIndex: 0 }) }, // 交叉驗證 item0：一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // 交叉驗證 item1：一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // 交叉驗證 item2：一致
    ]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toHaveLength(3);
    expect(result.attempts).toBe(1);
  });
});

describe("generateQuizForConcept — 不一致觸發重生（針對該題面向重出、換角度，再驗）", () => {
  it("item0 交叉驗證不一致 ⇒ 針對其面向重出一題並再驗，通過後計入 survivors", async () => {
    const { graph, node } = makeNode();
    const client = sequentialClient([
      { text: JSON.stringify({ aspects: ["面向甲", "面向乙", "面向丙"] }) },
      {
        text: JSON.stringify({
          items: [draftItem("面向甲", 0), draftItem("面向乙", 0), draftItem("面向丙", 0)],
        }),
      },
      { text: JSON.stringify({ answerIndex: 1 }) }, // 交叉驗證 item0：不一致（正解 0，盲答 1）
      { text: JSON.stringify({ items: [draftItem("面向甲", 0)] }) }, // 換角度重出一題（僅面向甲）
      { text: JSON.stringify({ answerIndex: 0 }) }, // 重生題交叉驗證：一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // 交叉驗證 item1：一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // 交叉驗證 item2：一致
    ]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toHaveLength(3);
    expect(result.attempts).toBe(1);
  });

  it("重生題再次不一致 ⇒ 該題捨棄不計入 survivors（不再遞迴重試）", async () => {
    const { graph, node } = makeNode();
    const client = sequentialClient([
      { text: JSON.stringify({ aspects: ["面向甲", "面向乙", "面向丙", "面向丁"] }) },
      {
        text: JSON.stringify({
          items: [draftItem("面向甲", 0), draftItem("面向乙", 0), draftItem("面向丙", 0), draftItem("面向丁", 0)],
        }),
      },
      { text: JSON.stringify({ answerIndex: 1 }) }, // item0 不一致
      { text: JSON.stringify({ items: [draftItem("面向甲", 0)] }) }, // 重出一題
      { text: JSON.stringify({ answerIndex: 1 }) }, // 重生題仍不一致 ⇒ 捨棄
      { text: JSON.stringify({ answerIndex: 0 }) }, // item1 一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // item2 一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // item3 一致
    ]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    // 4 題中 1 題（面向甲）被捨棄，存活 3 題（仍 ≥3，本輪通過）
    expect(result.items).toHaveLength(3);
    expect(result.attempts).toBe(1);
  });
});

describe("generateQuizForConcept — 3 輪皆不過（含驗證後仍 <3 題）⇒ needsHumanReview，不寫入該 Concept", () => {
  it("每輪存活題數恆為 2（<3）⇒ 恰好重生 MAX_REGEN 次後回報失敗", async () => {
    const { graph, node } = makeNode();
    const oneAttempt = [
      { text: JSON.stringify({ aspects: ["面向甲", "面向乙"] }) },
      { text: JSON.stringify({ items: [draftItem("面向甲", 0), draftItem("面向乙", 0)] }) },
      { text: JSON.stringify({ answerIndex: 0 }) }, // item0 一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // item1 一致
    ];
    const client = sequentialClient([...oneAttempt, ...oneAttempt, ...oneAttempt]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(result.failure?.reason).toMatch(/存活題數不足 3/);
  });
});

describe("generateQuizForConcept — 基礎設施失敗（交叉驗證拋錯／回應無法解析）走退避重試，MUST NOT 計入內容重生上限", () => {
  it("交叉驗證第一次回應非法 JSON，重試後成功 ⇒ 該 Concept 仍在第 1 輪通過（regenCount 不增加）", async () => {
    const { graph, node } = makeNode();
    const client = sequentialClient([
      { text: JSON.stringify({ aspects: ["面向甲", "面向乙", "面向丙"] }) },
      {
        text: JSON.stringify({
          items: [draftItem("面向甲", 0), draftItem("面向乙", 0), draftItem("面向丙", 0)],
        }),
      },
      { text: "{ not valid json" }, // item0 交叉驗證：基礎設施失敗（解析錯誤）
      { text: JSON.stringify({ answerIndex: 0 }) }, // 基礎設施重試後成功：一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // item1 一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // item2 一致
    ]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toHaveLength(3);
    // 關鍵斷言：基礎設施失敗的重試發生在同一輪內，MUST NOT 使 attempts（regenCount）增加。
    expect(result.attempts).toBe(1);
  });

  it("交叉驗證持續拋錯直到基礎設施重試耗盡 ⇒ 視為本輪未通過（觸發換角度重出），MUST NOT 使整個生成流程崩潰", async () => {
    const { graph, node } = makeNode();
    const client = sequentialClient([
      { text: JSON.stringify({ aspects: ["面向甲", "面向乙", "面向丙"] }) },
      {
        text: JSON.stringify({
          items: [draftItem("面向甲", 0), draftItem("面向乙", 0), draftItem("面向丙", 0)],
        }),
      },
      { text: "{ not valid json" }, // item0 交叉驗證：3 次皆解析失敗（基礎設施重試耗盡）
      { text: "{ not valid json" },
      { text: "{ not valid json" },
      { text: JSON.stringify({ items: [draftItem("面向甲", 0)] }) }, // 換角度重出
      { text: JSON.stringify({ answerIndex: 0 }) }, // 重生題交叉驗證一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // item1 一致
      { text: JSON.stringify({ answerIndex: 0 }) }, // item2 一致
    ]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toHaveLength(3);
    expect(result.attempts).toBe(1);
  });
});

describe("shouldSkipQuizConcept — 續跑跳過已通過 Concept；--force 一律不跳；Skeleton 雜湊變更觸發重生", () => {
  const entry = { skeletonHash: "hash-a", frozen: true, gatePassed: true, needsHumanReview: false, regenCount: 1, itemCount: 5 };

  it("skeletonHash 相符 + 已凍結 + 已過 Gate + 題庫中存在 ⇒ 跳過（零重複 LLM 呼叫）", () => {
    expect(shouldSkipQuizConcept({ skeletonHash: "hash-a", conceptExistsInFile: true, manifestEntry: entry })).toBe(true);
  });

  it("--force ⇒ 一律不跳，即使其餘條件皆符合", () => {
    expect(
      shouldSkipQuizConcept({ skeletonHash: "hash-a", conceptExistsInFile: true, manifestEntry: entry, force: true }),
    ).toBe(false);
  });

  it("skeletonHash 不符（Skeleton 已變更）⇒ 不跳過，該 Concept 重生", () => {
    expect(shouldSkipQuizConcept({ skeletonHash: "hash-b", conceptExistsInFile: true, manifestEntry: entry })).toBe(false);
  });

  it("題庫中該 Concept 不存在 ⇒ 不跳過（即使 manifest 記錄已過 Gate）", () => {
    expect(shouldSkipQuizConcept({ skeletonHash: "hash-a", conceptExistsInFile: false, manifestEntry: entry })).toBe(false);
  });

  it("manifest 無此 Concept 記錄 ⇒ 不跳過", () => {
    expect(shouldSkipQuizConcept({ skeletonHash: "hash-a", conceptExistsInFile: true })).toBe(false);
  });
});

describe("rebuildQuizManifest — manifest 遺失時由現存題庫反推重建（data-model.md §10）", () => {
  it("既有 Concept 視為已凍結且過 Gate；needsHumanReview/regenCount 重置為 false/0", () => {
    const manifest = rebuildQuizManifest([
      { conceptId: "c1", skeletonHash: "hash-c1", conceptExistsInFile: true, itemCount: 5 },
      { conceptId: "c2", skeletonHash: "hash-c2", conceptExistsInFile: false, itemCount: 0 },
    ]);
    expect(manifest.concepts.c1).toEqual({
      skeletonHash: "hash-c1",
      frozen: true,
      gatePassed: true,
      needsHumanReview: false,
      regenCount: 0,
      itemCount: 5,
    });
    expect(manifest.concepts.c2?.frozen).toBe(false);
    expect(manifest.concepts.c2?.gatePassed).toBe(false);
  });
});

describe("serializeQuizBank — canonical 序列化（byConcept key 依 ordinalOf 全序，byte-identical）", () => {
  it("key 序依 ordinalOf 全序，非字典序或插入序；同輸入連跑兩次 byte-identical", () => {
    const graph = makeGraph([
      { id: "c-third", localOrder: 3 },
      { id: "a-first", localOrder: 1 },
      { id: "b-second", localOrder: 2 },
    ]);
    const item: QuizItem = {
      stem: "s",
      options: ["a", "b", "c", "d"],
      answerIndex: 0,
      explanation: ["1", "2", "3", "4", "5"],
    };
    // 插入序刻意與 ordinalOf 全序相反。
    const byConcept = { "c-third": [item], "a-first": [item], "b-second": [item] };
    const text = serializeQuizBank(byConcept, graph);

    expect(text.endsWith("\n")).toBe(true);
    expect(text.endsWith("\n\n")).toBe(false);
    expect(text).not.toMatch(/\r/);
    const parsed = JSON.parse(text) as { byConcept: Record<string, unknown> };
    expect(Object.keys(parsed.byConcept)).toEqual(["a-first", "b-second", "c-third"]);

    const text2 = serializeQuizBank(byConcept, graph);
    expect(text2).toBe(text);
  });
});
