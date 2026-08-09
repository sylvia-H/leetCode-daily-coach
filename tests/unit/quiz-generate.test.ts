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

/** 正解為唯一最長選項的題（用於觸發 quiz-longest-option-bias）。 */
function longestAnswerDraftItem(aspect: string) {
  return {
    stem: `題幹（${aspect}）`,
    options: ["短", "短乙", "短丙", "這是一個明顯比其他三個選項都要長上許多的正確答案"],
    answerIndex: 3,
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

describe("generateQuizForConcept — 集合層判準以「交叉驗證後的存活集合」為對象（FR-013a）", () => {
  /** 產一輪：Stage A 面向 + Stage B 出題 + 逐題交叉驗證全數一致（+ 選填的逐題修復回應）。 */
  function oneAttempt(items: ReturnType<typeof draftItem>[], repairResponses: { text: string }[] = []) {
    return [
      { text: JSON.stringify({ aspects: items.map((it) => it.aspect) }) },
      { text: JSON.stringify({ items }) },
      ...items.map((it) => ({ text: JSON.stringify({ answerIndex: it.answerIndex }) })),
      ...repairResponses,
    ];
  }

  it("存活集合題數 >10 ⇒ 本輪不通過（quiz-count-range），MUST NOT 讓超量題目漏進題庫", async () => {
    const { graph, node } = makeNode();
    const items = Array.from({ length: 11 }, (_, i) => draftItem(`面向${i}`, (i % 4) as 0 | 1 | 2 | 3));
    const client = sequentialClient([...oneAttempt(items), ...oneAttempt(items), ...oneAttempt(items)]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(result.failure?.reason).toMatch(/需落在 \[3,10\] 區間/);
  });

  it("存活集合正解全部集中在同一位置 ⇒ 由確定性重排修正、第 1 輪即通過（MUST NOT 觸發重生）", async () => {
    const { graph, node } = makeNode();
    // 8 題全部正解在 index 0（重排前 100%，遠超 50%）。位置不帶語意，MUST NOT 靠重生賭模型
    // 下一輪突然變均勻——那在 n=8 時即使模型完全無偏誤也有約 4 成機率再次違規（quiz-balance.ts 檔頭）。
    const items = Array.from({ length: 8 }, (_, i) => draftItem(`面向${i}`, 0));
    const client = sequentialClient(oneAttempt(items));

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toHaveLength(8);
    expect(result.attempts).toBe(1);

    const counts = [0, 0, 0, 0];
    for (const item of result.items!) counts[item.answerIndex]!++;
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("正解過度集中於最長選項 ⇒ 逐題修復違規題、保住好題，第 1 輪即通過（§5.2b）", async () => {
    const { graph, node } = makeNode();
    // 8 題全部正解為唯一最長（100%）。修復目標為隨機基準 25% ⇒ round(8×0.25)=2，故修 6 題。
    const items = Array.from({ length: 8 }, (_, i) => longestAnswerDraftItem(`面向${i}`));
    // 每次修復 = 1 次重出 + 1 次交叉驗證；替換題四選項等長 ⇒ 不再是唯一最長。
    const repairs = Array.from({ length: 6 }, (_, i) => [
      { text: JSON.stringify({ items: [draftItem(`修復${i}`, 0)] }) },
      { text: JSON.stringify({ answerIndex: 0 }) },
    ]).flat();
    const client = sequentialClient(oneAttempt(items, repairs));

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toHaveLength(8);
    expect(result.attempts).toBe(1); // MUST NOT 觸發 Concept 級重生
    // 未被修復的 2 題 MUST 原樣保留（保住已通過交叉驗證的好題）。
    expect(result.items!.filter((it) => it.stem.startsWith("題幹（面向"))).toHaveLength(2);
  });

  it("修復未改善（重出的題仍是唯一最長）⇒ MUST 保留原題不倒退，最終仍由集合層 Gate 擋下", async () => {
    const { graph, node } = makeNode();
    const items = Array.from({ length: 8 }, (_, i) => longestAnswerDraftItem(`面向${i}`));
    // 6 次重出都回傳「仍是唯一最長」的題 ⇒ 一律拒收、保留原題，且 MUST NOT 再花交叉驗證呼叫。
    const repairs = Array.from({ length: 6 }, (_, i) => ({
      text: JSON.stringify({ items: [longestAnswerDraftItem(`重出${i}`)] }),
    }));
    const client = sequentialClient([
      ...oneAttempt(items, repairs),
      ...oneAttempt(items, repairs),
      ...oneAttempt(items, repairs),
    ]);

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toBeUndefined();
    expect(result.attempts).toBe(MAX_REGEN);
    expect(result.failure?.reason).toMatch(/正解過度集中於最長選項/);
  });

  it("未超標 ⇒ 修復階段零 LLM 呼叫（回應用盡即拋錯，故通過本身即為斷言）", async () => {
    const { graph, node } = makeNode();
    // 8 題四選項皆等長 ⇒ 無唯一最長，佔比 0%。
    const items = Array.from({ length: 8 }, (_, i) => draftItem(`面向${i}`, 0));
    const client = sequentialClient(oneAttempt(items)); // 未預留任何修復回應

    const result = await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    expect(result.items).toHaveLength(8);
  });

  it("失敗原因 MUST 回饋進下一輪的 Stage B prompt（讓模型知道要修正什麼）", async () => {
    const { graph, node } = makeNode();
    // 用 longest-option-bias 當觸發源：位置類判準已由重排消化，只剩內容類判準會真正驅動重生。
    const items = Array.from({ length: 8 }, (_, i) => longestAnswerDraftItem(`面向${i}`));
    const repairs = Array.from({ length: 6 }, (_, i) => ({
      text: JSON.stringify({ items: [longestAnswerDraftItem(`重出${i}`)] }),
    }));
    const prompts: string[] = [];
    let i = 0;
    const responses = [
      ...oneAttempt(items, repairs),
      ...oneAttempt(items, repairs),
      ...oneAttempt(items, repairs),
    ];
    const client = makeClient(() => ({
      models: {
        generateContent: async (args: { contents: string }) => {
          prompts.push(args.contents);
          return responses[i++]!;
        },
      },
    }));

    await generateQuizForConcept(client, node, graph, fakeAspectsInput());
    // 第二輪的 Stage B prompt MUST 含上一輪的違規原因
    expect(prompts.some((p) => p.includes("正解過度集中於最長選項"))).toBe(true);
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
