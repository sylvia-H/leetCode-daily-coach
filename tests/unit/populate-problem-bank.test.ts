import { describe, expect, it } from "vitest";
import {
  buildProblemUrl,
  collectCandidates,
  mergeIntoBank,
  resolveMetadata,
  type CandidateSource,
  type LeetcodeIndex,
  type MetadataFetcher,
} from "../../scripts/populate-problem-bank.js";
import type { ProblemBankFile } from "../../src/types/problem.js";

describe("collectCandidates（§12.1 守門：1–3 題/不重複）", () => {
  it("正常蒐集：每 Concept 1–3 題，patterns 依 topicId 聚合", () => {
    const sources: CandidateSource[] = [
      { conceptId: "array-traversal", topicId: "array", leetcodeIds: [1, 2] },
      { conceptId: "two-sum-variant", topicId: "hash-table", leetcodeIds: [1] },
    ];
    const { byId, violations } = collectCandidates(sources);
    expect(violations).toEqual([]);
    expect(byId.get(1)).toEqual(new Set(["array", "hash-table"]));
    expect(byId.get(2)).toEqual(new Set(["array"]));
  });

  it("leetcode: []（無題目觀念課）合法，不報錯", () => {
    const { byId, violations } = collectCandidates([{ conceptId: "c", topicId: "t", leetcodeIds: [] }]);
    expect(violations).toEqual([]);
    expect(byId.size).toBe(0);
  });

  it("超過 3 題 → leetcode-count-range 違規，該 Concept 全部候選被跳過", () => {
    const { byId, violations } = collectCandidates([
      { conceptId: "c", topicId: "t", leetcodeIds: [1, 2, 3, 4] },
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: "leetcode-count-range", conceptId: "c" });
    expect(byId.size).toBe(0);
  });

  it("同一 Concept 內重複題號 → leetcode-duplicate 違規", () => {
    const { violations } = collectCandidates([{ conceptId: "c", topicId: "t", leetcodeIds: [1, 1] }]);
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatchObject({ rule: "leetcode-duplicate", conceptId: "c", leetcodeId: 1 });
  });
});

describe("resolveMetadata（R5：快照優先、線上補齊、查無驅動重生）", () => {
  it("快照命中 → 直接採用，不呼叫 fetch", async () => {
    const index: LeetcodeIndex = { "1": { slug: "two-sum", title: "Two Sum", difficulty: "Easy" } };
    const fetchMetadata: MetadataFetcher = async () => {
      throw new Error("不應被呼叫");
    };
    const { resolved, violations, index: nextIndex } = await resolveMetadata([1], index, fetchMetadata);
    expect(violations).toEqual([]);
    expect(resolved.get(1)).toEqual(index["1"]);
    expect(nextIndex).toEqual(index);
  });

  it("快照未命中 → 呼叫線上 fetch 補齊並寫回索引", async () => {
    const fetchMetadata: MetadataFetcher = async (id) =>
      id === 42 ? { slug: "answer-to-everything", title: "Answer", difficulty: "Medium" } : undefined;
    const { resolved, violations, index } = await resolveMetadata([42], {}, fetchMetadata);
    expect(violations).toEqual([]);
    expect(resolved.get(42)).toEqual({ slug: "answer-to-everything", title: "Answer", difficulty: "Medium" });
    expect(index["42"]).toEqual({ slug: "answer-to-everything", title: "Answer", difficulty: "Medium" });
  });

  it("線上仍查無 → leetcode-invalid 具名錯誤（驅動 Stage 1 重生），不憑空編造", async () => {
    const fetchMetadata: MetadataFetcher = async () => undefined;
    const { resolved, violations } = await resolveMetadata([999], {}, fetchMetadata);
    expect(resolved.size).toBe(0);
    expect(violations).toEqual([
      { rule: "leetcode-invalid", leetcodeId: 999, message: expect.stringContaining("999") },
    ]);
  });
});

describe("mergeIntoBank（既有題號不覆蓋，除非 --force）", () => {
  it("新增缺漏題號，url 由 slug 組成", () => {
    const bank: ProblemBankFile = {};
    const resolved = new Map([[1, { slug: "two-sum", title: "Two Sum", difficulty: "Easy" as const }]]);
    const patternsById = new Map([[1, new Set(["array", "hash-table"])]]);
    const merged = mergeIntoBank(bank, resolved, patternsById);
    expect(merged["1"]).toEqual({
      id: 1,
      slug: "two-sum",
      title: "Two Sum",
      url: "https://leetcode.com/problems/two-sum/",
      difficulty: "Easy",
      patterns: ["array", "hash-table"],
    });
  });

  it("既有題號不覆蓋（無 --force）", () => {
    const bank: ProblemBankFile = {
      "1": { id: 1, slug: "two-sum", title: "Two Sum", url: buildProblemUrl("two-sum"), difficulty: "Easy", patterns: ["array"] },
    };
    const resolved = new Map([[1, { slug: "two-sum-renamed", title: "Renamed", difficulty: "Medium" as const }]]);
    const merged = mergeIntoBank(bank, resolved, new Map([[1, new Set(["array"])]]));
    expect(merged["1"]).toEqual(bank["1"]);
  });

  it("--force → 覆蓋既有題號", () => {
    const bank: ProblemBankFile = {
      "1": { id: 1, slug: "two-sum", title: "Two Sum", url: buildProblemUrl("two-sum"), difficulty: "Easy", patterns: ["array"] },
    };
    const resolved = new Map([[1, { slug: "two-sum", title: "Two Sum Updated", difficulty: "Easy" as const }]]);
    const merged = mergeIntoBank(bank, resolved, new Map([[1, new Set(["array", "new-topic"])]]), { force: true });
    expect(merged["1"]?.title).toBe("Two Sum Updated");
    expect(merged["1"]?.patterns).toEqual(["array", "new-topic"]);
  });
});
