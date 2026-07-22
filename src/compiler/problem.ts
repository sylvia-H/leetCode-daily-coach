import { readFileSync } from "node:fs";
import type { ProblemBank, ProblemBankFile, ProblemMeta, ProblemViolation } from "../types/problem.js";

// F3 單一實作（FR-014）：CI Gate 與未來 F5 runtime 共用。除 loadProblemBank 讀檔外，
// 其餘為純函式、無副作用（無 process.exit、無其他 I/O）；process.exit 只在 scripts/validate-problem-bank.ts。

function bankLoadViolation(path: string, message: string): ProblemViolation {
  return { rule: "bank-load", severity: "error", subject: path, message };
}

function buildPatternIndex(byId: Map<number, ProblemMeta>): Map<string, ProblemMeta[]> {
  const byPattern = new Map<string, ProblemMeta[]>();
  const sorted = [...byId.values()].sort((a, b) => a.id - b.id);
  for (const meta of sorted) {
    for (const pattern of meta.patterns) {
      const list = byPattern.get(pattern);
      if (list) list.push(meta);
      else byPattern.set(pattern, [meta]);
    }
  }
  return byPattern;
}

/**
 * 讀取 + 索引題庫（Foundational 骨架：忽略底線前綴 key、建 byId/byPattern 升冪索引，
 * 檔缺失/非法 JSON 回 bank-load violation，不 throw）。
 * 逐題 schema 驗證（US1，schema-missing-field/schema-type/…）由本函式內的驗證步驟接手，見下方。
 */
export function loadProblemBank(path: string): { bank: ProblemBank; loadViolations: ProblemViolation[] } {
  const empty: ProblemBank = { byId: new Map(), byPattern: new Map() };

  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (err) {
    return { bank: empty, loadViolations: [bankLoadViolation(path, `題庫檔無法讀取：${(err as Error).message}`)] };
  }

  let file: ProblemBankFile;
  try {
    file = JSON.parse(raw) as ProblemBankFile;
  } catch (err) {
    return {
      bank: empty,
      loadViolations: [bankLoadViolation(path, `題庫檔無法解析為 JSON：${(err as Error).message}`)],
    };
  }

  const keys = Object.keys(file)
    .filter((key) => !key.startsWith("_"))
    .sort((a, b) => a.localeCompare(b));

  const byId = new Map<number, ProblemMeta>();
  for (const key of keys) {
    const meta = file[key] as ProblemMeta;
    byId.set(meta.id, meta);
  }

  return { bank: { byId, byPattern: buildPatternIndex(byId) }, loadViolations: [] };
}

// 題數合法性的唯一權威守門點（§12.1）：對宣告 ≥1 題的 Concept，題數 MUST 為 1~3；
// leetcodeIds 由 caller（CI Gate 走訪 graph、或 F5 Compiler）從 ConceptNode.leetcode 注入，
// 本函式不讀圖、不讀檔，為對 (ids, bank) 的純映射（R4）。
export function getProblemsForConcept(
  conceptId: string,
  leetcodeIds: number[],
  bank: ProblemBank,
): ProblemMeta[] {
  if (leetcodeIds.length === 0) return [];
  if (leetcodeIds.length > 3) {
    throw new Error(
      `problem-count-range：Concept「${conceptId}」宣告 ${leetcodeIds.length} 題，超過上限 3 題`,
    );
  }
  return leetcodeIds.map((id) => {
    const meta = bank.byId.get(id);
    if (!meta) {
      throw new Error(`unknown-leetcode：Concept「${conceptId}」引用的題號 ${id} 不存在於 Problem Bank`);
    }
    return meta;
  });
}
