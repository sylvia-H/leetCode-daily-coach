// F8 素材品質 Gate（contracts/material-schema.md §3）：8 個具名 rule 逐一驗證。
// 斷言一律比對 MaterialViolation.rule 欄位，MUST NOT 用 message 子字串比對（避免改一次措辭就靜默失效）。
import { describe, expect, it } from "vitest";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";
import {
  checkMaterials,
  type EncouragementPool,
  type MaterialViolationRule,
  type ReflectionBank,
} from "../../src/compiler/material.js";
import { makeGraph, makeSchedule } from "../helpers/compiler.js";
import type { Track } from "../../src/types/lesson.js";
import type { TrackSchedule } from "../../src/types/schedule.js";

const TRACKS: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

function threeTrackSchedules(sessions: Parameters<typeof makeSchedule>[1]): Record<Track, TrackSchedule> {
  const out = {} as Record<Track, TrackSchedule>;
  for (const track of TRACKS) out[track] = makeSchedule(track, sessions);
  return out;
}

function rulesOf(rule: MaterialViolationRule, violations: ReturnType<typeof checkMaterials>) {
  return violations.filter((v) => v.rule === rule);
}

describe("checkMaterials — 素材缺席與 requiredQuota===0 的合法路徑", () => {
  const graph = makeGraph([{ id: "c0", topic: "test-topic", localOrder: 1 }]);
  // makeGraph 只自動註冊 "test-topic"；"unused-topic" 從未被任何 concept 引用，代表一個真實存在
  // 於課綱但本次課表完全沒選中的 Topic（requiredQuota 天然為 0），對齊 orderedTopicIds 的列舉來源。
  graph.topics.set("unused-topic", { id: "unused-topic", title: "Unused", moduleId: "test-module", topicIndex: 1 });
  const schedules = threeTrackSchedules([
    { sessionIndex: 1, type: "concept", conceptId: "c0" },
    { sessionIndex: 2, type: "review", reviewRange: [1, 1] },
  ]);

  it("兩份素材皆缺席 ⇒ Gate 通過（回傳空陣列）", () => {
    expect(checkMaterials({ schedules, graph })).toEqual([]);
  });

  it("requiredQuota === 0 的 Topic（從未被任何 review 選中）缺鍵或空陣列 ⇒ Gate 通過（FR-014.3 明文例外）", () => {
    // test-topic 的 quota（=1）另以足量問題滿足，隔離出「unused-topic 缺鍵／空陣列」單一變因。
    const missingKey: ReflectionBank = { version: 1, byTopic: { "test-topic": ["問題"] } };
    const emptyArray: ReflectionBank = { version: 1, byTopic: { "test-topic": ["問題"], "unused-topic": [] } };
    expect(rulesOf("material-quota", checkMaterials({ reflectionBank: missingKey, schedules, graph }))).toEqual([]);
    expect(rulesOf("material-quota", checkMaterials({ reflectionBank: emptyArray, schedules, graph }))).toEqual([]);
  });

  it("對照組：requiredQuota > 0 的 Topic（test-topic，確實被選中）空陣列 MUST 觸發 material-quota", () => {
    const bank: ReflectionBank = { version: 1, byTopic: { "test-topic": [] } };
    expect(rulesOf("material-quota", checkMaterials({ reflectionBank: bank, schedules, graph })).length).toBeGreaterThan(0);
  });
});

describe("checkMaterials — Reflection 六項判準", () => {
  const graph = makeGraph([
    { id: "c0", topic: "topic-a", localOrder: 1 },
    { id: "c1", topic: "topic-a", localOrder: 2 },
  ]);
  // makeGraph 只自動註冊 "test-topic"；checkQuota 經 orderedTopicIds(graph) 列舉 Topic，
  // 自訂 topic id MUST 手動註冊，否則配額檢查永遠不會走訪它（純屬測試 fixture 的限制，
  // 真實課綱由 modules.json 保證每個 concept.topic 皆已在 graph.topics 宣告）。
  graph.topics.set("topic-a", { id: "topic-a", title: "Topic A", moduleId: "test-module", topicIndex: 0 });
  const schedules = threeTrackSchedules([
    { sessionIndex: 1, type: "concept", conceptId: "c0" },
    { sessionIndex: 2, type: "concept", conceptId: "c1" },
    { sessionIndex: 3, type: "review", reviewRange: [1, 2] },
  ]);

  it("material-unknown-topic：byTopic key 不存在於 graph.topics", () => {
    const bank: ReflectionBank = { version: 1, byTopic: { "ghost-topic": ["問題"] } };
    const violations = checkMaterials({ reflectionBank: bank, schedules, graph });
    expect(rulesOf("material-unknown-topic", violations).length).toBeGreaterThan(0);
  });

  it("material-budget：單則超過 300 字元", () => {
    const bank: ReflectionBank = { version: 1, byTopic: { "topic-a": ["問".repeat(301)] } };
    const violations = checkMaterials({ reflectionBank: bank, schedules, graph });
    expect(rulesOf("material-budget", violations).length).toBeGreaterThan(0);
  });

  it("material-traditional-chinese：含簡體字", () => {
    const bank: ReflectionBank = { version: 1, byTopic: { "topic-a": ["这个问题你怎么解决的呢？"] } };
    const violations = checkMaterials({ reflectionBank: bank, schedules, graph });
    expect(rulesOf("material-traditional-chinese", violations).length).toBeGreaterThan(0);
  });

  it("material-duplicate：跨 Topic 全庫比對，完全相同文字視為重複", () => {
    const graph2 = makeGraph([{ id: "c0", topic: "topic-a", localOrder: 1 }]);
    graph2.topics.set("topic-b", { id: "topic-b", title: "B", moduleId: "test-module", topicIndex: 1 });
    const bank: ReflectionBank = {
      version: 1,
      byTopic: { "topic-a": ["這是重複的問題"], "topic-b": ["這是重複的問題"] },
    };
    const violations = checkMaterials({ reflectionBank: bank, schedules, graph: graph2 });
    expect(rulesOf("material-duplicate", violations).length).toBeGreaterThan(0);
  });

  it("material-quota：某 Topic 則數低於三份課表中依歸屬規則計算出的最大出現次數", () => {
    // topic-a 在三軌各出現 1 次（唯一 review），故 requiredQuota = 1；池為空必然不足。
    const bank: ReflectionBank = { version: 1, byTopic: { "topic-a": [] } };
    const violations = checkMaterials({ reflectionBank: bank, schedules, graph });
    const quotaViolations = rulesOf("material-quota", violations);
    expect(quotaViolations.length).toBeGreaterThan(0);
    expect(quotaViolations[0]?.message).toMatch(/需要至少 1 則/);
    expect(quotaViolations[0]?.message).toMatch(/實際只有 0 則/);
  });

  it("素材缺席時 Gate 通過（Reflection 未提供）", () => {
    expect(checkMaterials({ schedules, graph })).toEqual([]);
  });
});

describe("checkMaterials — Encouragement 六項判準", () => {
  const graph = makeGraph([{ id: "c0", topic: "test-topic", localOrder: 1 }]);
  const schedules = threeTrackSchedules([
    { sessionIndex: 1, type: "concept", conceptId: "c0" },
    { sessionIndex: 2, type: "review", reviewRange: [1, 1] },
  ]);
  const validPool = () => Array.from({ length: 30 }, (_, i) => `語錄第${i}則，繼續前進`);

  it("material-pool-size：少於 30 則", () => {
    const pool: EncouragementPool = { version: 1, quotes: validPool().slice(0, 29) };
    const violations = checkMaterials({ encouragement: pool, schedules, graph });
    expect(rulesOf("material-pool-size", violations).length).toBeGreaterThan(0);
  });

  it("material-budget：單則超過 200 字元", () => {
    const pool: EncouragementPool = { version: 1, quotes: [...validPool().slice(0, 29), "鼓".repeat(201)] };
    const violations = checkMaterials({ encouragement: pool, schedules, graph });
    expect(rulesOf("material-budget", violations).length).toBeGreaterThan(0);
  });

  it("material-traditional-chinese：含簡體字", () => {
    const pool: EncouragementPool = { version: 1, quotes: [...validPool().slice(0, 29), "这次没做完也没关系"] };
    const violations = checkMaterials({ encouragement: pool, schedules, graph });
    expect(rulesOf("material-traditional-chinese", violations).length).toBeGreaterThan(0);
  });

  it("material-duplicate：池內出現完全相同語錄", () => {
    const base = validPool();
    const pool: EncouragementPool = { version: 1, quotes: [...base, base[0]!] };
    const violations = checkMaterials({ encouragement: pool, schedules, graph });
    expect(rulesOf("material-duplicate", violations).length).toBeGreaterThan(0);
  });

  it("material-progress-coupled：含 URL／LeetCode／#題號 樣式", () => {
    const samples = [
      "今天休息一下，看看 https://example.com 也不錯",
      "偶爾卡關很正常，LeetCode 上大家都是這樣走過來的",
      "#123 這題別擔心，明天再試一次",
    ];
    for (const sample of samples) {
      const pool: EncouragementPool = { version: 1, quotes: [...validPool().slice(0, 29), sample] };
      const violations = checkMaterials({ encouragement: pool, schedules, graph });
      expect(rulesOf("material-progress-coupled", violations).length).toBeGreaterThan(0);
    }
  });

  it("素材缺席時 Gate 通過（Encouragement 未提供）", () => {
    expect(checkMaterials({ schedules, graph })).toEqual([]);
  });

  it("Reflection 與 Encouragement 的 material-duplicate 互不比對（同字面在兩份素材間重複不算違規）", () => {
    const reflectionBank: ReflectionBank = { version: 1, byTopic: { "test-topic": ["同樣的一句話"] } };
    const pool: EncouragementPool = { version: 1, quotes: [...validPool().slice(0, 29), "同樣的一句話"] };
    const violations = checkMaterials({ reflectionBank, encouragement: pool, schedules, graph });
    expect(rulesOf("material-duplicate", violations)).toEqual([]);
  });
});

describe("checkMaterials — material-schema 由載入層 throw 實現（非本函式輸出）", () => {
  it("素材檔不符 schema ⇒ 載入層 throw，checkMaterials 收到的必為合法型別，不會走到此分支", () => {
    expect(() =>
      loadCompilerDeps({ reflectionBankPath: "tests/fixtures/does-not-matter-nonexistent.json" }),
    ).not.toThrow(); // 檔案不存在 ⇒ 缺席，非壞檔；壞檔情境已於 tests/unit/material-load.test.ts 完整覆蓋
  });
});

describe("checkMaterials — 配額由真實課表導出而非硬編（FR-003b）", () => {
  it("對重跑後的真實三份課表（198/200/243）計算配額，且不同 Topic 之間配額確實不同", () => {
    const deps = loadCompilerDeps();
    // 合成一個「每個已知 Topic 都給 1 則」的極小 bank，必然到處觸發 material-quota——
    // 藉此讀出 checkMaterials 對真實課表算出的 requiredQuota 分布，證明它是計算值而非常數。
    const byTopic: Record<string, string[]> = {};
    for (const topicId of deps.graph.topics.keys()) byTopic[topicId] = [];
    const bank: ReflectionBank = { version: 1, byTopic };
    const violations = checkMaterials({ reflectionBank: bank, schedules: deps.schedules, graph: deps.graph });
    const quotaViolations = rulesOf("material-quota", violations);
    expect(quotaViolations.length).toBeGreaterThan(0);
    const requiredCounts = quotaViolations.map((v) => Number(v.message.match(/需要至少 (\d+) 則/)?.[1]));
    // 真實課綱下已知有 Topic 需要 4 則、也有 Topic 只需要 2-3 則（tasks.md T031 對照表）——
    // 若配額被寫死為常數，這裡只會看到單一數字；分布必須不只一種值才能證明是計算式。
    expect(new Set(requiredCounts).size).toBeGreaterThan(1);
  });
});
