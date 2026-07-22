import { readFileSync } from "node:fs";
import { z } from "zod";
import type {
  ProblemBank,
  ProblemBankFile,
  ProblemMeta,
  ProblemViolation,
  ProblemViolationRule,
} from "../types/problem.js";

// F3 單一實作（FR-014）：CI Gate 與未來 F5 runtime 共用。除 loadProblemBank 讀檔外，
// 其餘為純函式、無副作用（無 process.exit、無其他 I/O）；process.exit 只在 scripts/validate-problem-bank.ts。

// US1（FR-001/002/003、data-model.md §1）：以 zod 定義逐題 schema，.strict() 拒絕未知欄位以擋
// 內容欄位混入（FR-004）。cross-field 檢查（key==id、slug-url 一致）於 zod 通過後另行處理。
const ProblemMetaSchema = z
  .object({
    id: z.number().int(),
    slug: z.string().min(1),
    title: z.string().min(1),
    url: z.string().min(1),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    patterns: z.array(z.string()).min(1),
    keywords: z.array(z.string()).optional(),
    review_priority: z.enum(["high", "medium", "low"]).optional(),
    estimated_minutes: z.number().optional(),
    lists: z.array(z.string()).optional(),
    companies: z.array(z.string()).optional(),
  })
  .strict();

function bankLoadViolation(path: string, message: string): ProblemViolation {
  return { rule: "bank-load", severity: "error", subject: path, message };
}

function cmpProblemViolation(a: ProblemViolation, b: ProblemViolation): number {
  return (
    a.rule.localeCompare(b.rule) ||
    a.subject.localeCompare(b.subject) ||
    (a.field ?? "").localeCompare(b.field ?? "")
  );
}

/** 依 zod issue 分類為 F3 具名規則（data-model.md §4）。 */
function classifyZodIssue(issue: z.ZodIssue): { rule: ProblemViolationRule; field?: string } {
  if (issue.code === "unrecognized_keys") {
    return { rule: "schema-type", field: issue.keys.join(",") };
  }
  const field = issue.path.length > 0 ? issue.path.join(".") : undefined;
  if (issue.code === "invalid_type" && issue.received === "undefined") {
    return { rule: "schema-missing-field", field };
  }
  if (field === "difficulty" && issue.code === "invalid_enum_value") {
    return { rule: "difficulty-range", field };
  }
  if (field === "review_priority" && issue.code === "invalid_enum_value") {
    return { rule: "review-priority-range", field };
  }
  if (field === "patterns" && issue.code === "too_small") {
    return { rule: "patterns-empty", field };
  }
  return { rule: "schema-type", field };
}

/** 逐題驗證：zod 形狀通過後，再檢查 key==id 一致性（FR-003）。 */
function validateEntry(key: string, raw: unknown): { meta?: ProblemMeta; violations: ProblemViolation[] } {
  const result = ProblemMetaSchema.safeParse(raw);
  if (!result.success) {
    const violations = result.error.issues.map((issue) => {
      const { rule, field } = classifyZodIssue(issue);
      return {
        rule,
        severity: "error" as const,
        subject: key,
        field,
        message: `題號 ${key} 的欄位 ${field ?? "(root)"} 違規：${issue.message}`,
      };
    });
    return { violations };
  }

  const meta = result.data as ProblemMeta;
  const violations: ProblemViolation[] = [];

  if (String(meta.id) !== key) {
    violations.push({
      rule: "key-id-mismatch",
      severity: "error",
      subject: key,
      field: "id",
      target: String(meta.id),
      message: `題庫 key「${key}」與條目 id（${meta.id}）不一致`,
    });
  }

  return { meta, violations };
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
  const violations: ProblemViolation[] = [];
  for (const key of keys) {
    const { meta, violations: entryViolations } = validateEntry(key, file[key]);
    violations.push(...entryViolations);
    if (meta) byId.set(meta.id, meta);
  }

  violations.sort(cmpProblemViolation);
  return { bank: { byId, byPattern: buildPatternIndex(byId) }, loadViolations: violations };
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
