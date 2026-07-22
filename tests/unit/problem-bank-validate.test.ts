import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadProblemBank, validateProblemBank } from "../../src/compiler/problem.js";
import { buildGraph } from "../helpers/curriculum.js";

const FIXTURES_DIR = join(process.cwd(), "tests", "fixtures", "problem-bank");
const LEGAL_BANK = join(process.cwd(), "tests", "fixtures", "problem-bank.json");

function loadFixture(name: string) {
  return loadProblemBank(join(FIXTURES_DIR, `${name}.json`));
}

describe("loadProblemBank：逐題 schema 驗證（US1）", () => {
  it("全合法 bank 產出零 violation", () => {
    const { loadViolations } = loadProblemBank(LEGAL_BANK);
    expect(loadViolations).toHaveLength(0);
  });

  it("題庫檔不存在 → bank-load", () => {
    const { loadViolations, bank } = loadProblemBank(join(FIXTURES_DIR, "no-such-file.json"));
    expect(bank.byId.size).toBe(0);
    expect(loadViolations).toEqual([expect.objectContaining({ rule: "bank-load", severity: "error" })]);
  });

  it("非法 JSON → bank-load，指名檔案", () => {
    const { loadViolations } = loadFixture("bad-json");
    expect(loadViolations).toHaveLength(1);
    expect(loadViolations[0]).toMatchObject({ rule: "bank-load", severity: "error" });
    expect(loadViolations[0]!.subject).toContain("bad-json.json");
  });

  it("缺必填欄位（patterns）→ schema-missing-field，指名題號與欄位", () => {
    const { loadViolations } = loadFixture("missing-field");
    expect(loadViolations).toEqual([
      expect.objectContaining({ rule: "schema-missing-field", subject: "1", field: "patterns" }),
    ]);
  });

  it("型別錯誤（id 非 number）→ schema-type", () => {
    const { loadViolations } = loadFixture("bad-type");
    expect(loadViolations).toEqual([
      expect.objectContaining({ rule: "schema-type", subject: "1", field: "id" }),
    ]);
  });

  it("difficulty 非法值 → difficulty-range", () => {
    const { loadViolations } = loadFixture("bad-difficulty");
    expect(loadViolations).toEqual([
      expect.objectContaining({ rule: "difficulty-range", subject: "1", field: "difficulty" }),
    ]);
  });

  it("review_priority 非法值 → review-priority-range", () => {
    const { loadViolations } = loadFixture("bad-review-priority");
    expect(loadViolations).toEqual([
      expect.objectContaining({ rule: "review-priority-range", subject: "1", field: "review_priority" }),
    ]);
  });

  it("題庫 key 與條目 id 不符 → key-id-mismatch", () => {
    const { loadViolations } = loadFixture("key-id-mismatch");
    expect(loadViolations).toEqual([
      expect.objectContaining({ rule: "key-id-mismatch", subject: "27", target: "26" }),
    ]);
  });

  it("patterns 為空陣列 → patterns-empty", () => {
    const { loadViolations } = loadFixture("patterns-empty");
    expect(loadViolations).toEqual([
      expect.objectContaining({ rule: "patterns-empty", subject: "1", field: "patterns" }),
    ]);
  });

  it("未知欄位（內容欄位混入，如 description）被 .strict() 拒絕 → schema-type（FR-004）", () => {
    const { loadViolations } = loadFixture("unknown-field");
    expect(loadViolations).toEqual([expect.objectContaining({ rule: "schema-type", subject: "1" })]);
  });
});

describe("validateProblemBank：patterns 參照完整性（US3）", () => {
  it("patterns 皆指向存在的 Topic/Concept id → 零 violation", () => {
    const { bank } = loadProblemBank(LEGAL_BANK);
    const violations = validateProblemBank(bank, buildGraph([]));
    expect(violations).toHaveLength(0);
  });

  it("patterns 指向不存在的 id → dangling-pattern，指名題號與無效 pattern id", () => {
    const { bank } = loadFixture("dangling-pattern");
    const violations = validateProblemBank(bank, buildGraph([]));
    expect(violations).toEqual([
      expect.objectContaining({
        rule: "dangling-pattern",
        subject: "1",
        target: "nonexistent-topic-xyz",
      }),
    ]);
  });
});
