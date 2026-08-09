// F11 題庫載入語意（FR-007／FR-008、quiz-bank-schema.md §2）：整檔缺席 ⇒ undefined、不失敗；
// 某 Concept 缺 key 或陣列為空 ⇒ 合法（該 Concept 由 Gate 的 quiz-count-range 擋下，非載入層職責）；
// 壞檔／不符 schema ⇒ throw 具名錯誤，MUST NOT 降級為缺席（沿用 loadOptionalMaterial 既有語意）。
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadOptionalMaterial } from "../../src/compiler/lesson.js";
import { quizBankSchema } from "../../src/compiler/quiz.js";

describe("quiz-bank 載入（quiz-bank-schema.md §2）", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "quiz-load-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("檔案不存在 ⇒ undefined，不失敗（FR-008）", () => {
    const result = loadOptionalMaterial(join(dir, "missing.json"), "quiz bank", quizBankSchema);
    expect(result).toBeUndefined();
  });

  it("非合法 JSON ⇒ throw 具名錯誤", () => {
    const path = join(dir, "quiz-bank.json");
    writeFileSync(path, "{ not json");
    expect(() => loadOptionalMaterial(path, "quiz bank", quizBankSchema)).toThrow(/quiz bank 壞檔/);
  });

  it("version 錯誤 ⇒ throw（schema 不符）", () => {
    const path = join(dir, "quiz-bank.json");
    writeFileSync(path, JSON.stringify({ version: 2, byConcept: {} }));
    expect(() => loadOptionalMaterial(path, "quiz bank", quizBankSchema)).toThrow(/quiz bank 壞檔/);
  });

  it("options 不足 4 個 ⇒ throw", () => {
    const path = join(dir, "quiz-bank.json");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        byConcept: {
          c0: [{ stem: "s", options: ["a", "b", "c"], answerIndex: 0, explanation: ["1", "2", "3", "4", "5"] }],
        },
      }),
    );
    expect(() => loadOptionalMaterial(path, "quiz bank", quizBankSchema)).toThrow(/quiz bank 壞檔/);
  });

  it("explanation 不足 5 段 ⇒ throw", () => {
    const path = join(dir, "quiz-bank.json");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        byConcept: {
          c0: [{ stem: "s", options: ["a", "b", "c", "d"], answerIndex: 0, explanation: ["1", "2"] }],
        },
      }),
    );
    expect(() => loadOptionalMaterial(path, "quiz bank", quizBankSchema)).toThrow(/quiz bank 壞檔/);
  });

  it("answerIndex 超出 [0,3] ⇒ throw", () => {
    const path = join(dir, "quiz-bank.json");
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        byConcept: {
          c0: [{ stem: "s", options: ["a", "b", "c", "d"], answerIndex: 4, explanation: ["1", "2", "3", "4", "5"] }],
        },
      }),
    );
    expect(() => loadOptionalMaterial(path, "quiz bank", quizBankSchema)).toThrow(/quiz bank 壞檔/);
  });

  it("byConcept 某 Concept 陣列為空集合 ⇒ 合法（schema MUST NOT 用 min(1)，FR-007 降級路徑）", () => {
    const path = join(dir, "quiz-bank.json");
    writeFileSync(path, JSON.stringify({ version: 1, byConcept: { c0: [] } }));
    const result = loadOptionalMaterial(path, "quiz bank", quizBankSchema);
    expect(result).toEqual({ version: 1, byConcept: { c0: [] } });
  });

  it("byConcept 為空物件（缺全部 key）⇒ 合法", () => {
    const path = join(dir, "quiz-bank.json");
    writeFileSync(path, JSON.stringify({ version: 1, byConcept: {} }));
    const result = loadOptionalMaterial(path, "quiz bank", quizBankSchema);
    expect(result).toEqual({ version: 1, byConcept: {} });
  });
});
