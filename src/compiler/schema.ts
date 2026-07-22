// Concept frontmatter 與 curriculum/modules.json 的 zod schema 驗證。
// 只做 schema 層（型別 / 值域 / 格式 / 骨架結構 / id 唯一性）；MUST NOT 做參照完整性
// （module/topic 是否存在、topic == 資料夾名——全歸 validateCurriculum，FR-013）。
import { z } from "zod";
import type { CurriculumSkeleton, Violation, ViolationRule } from "../types/curriculum.js";

/** kebab-case slug（§26.1）：小寫英數，以單一連字號分隔。 */
export const KEBAB_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** 完整 16-Level 骨架的固定 Module 數（Level 0–15）。 */
export const REQUIRED_MODULE_COUNT = 16;

// ── Concept frontmatter（§10.1，snake_case） ────────────────────────────────

const conceptFrontmatterSchema = z.object({
  id: z.string().regex(KEBAB_SLUG),
  title: z.string().min(1),
  module: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium"]),
  estimated_minutes: z.number().int().positive(),
  pattern_label: z.string().min(1),
  complexity_label: z.string().min(1),
  prerequisite: z.array(z.string().regex(KEBAB_SLUG)),
  next: z.array(z.string().regex(KEBAB_SLUG)),
  learning_goal: z.array(z.string().min(1)).min(1),
  exit_criteria: z.array(z.string().min(1)).min(1),
  leetcode: z.array(z.number().int().positive()),
  tags: z.array(z.string()),
});

export type ConceptFrontmatter = z.infer<typeof conceptFrontmatterSchema>;

/** 每個 Concept 欄位在「非缺失」情形下的違規類別（缺失一律 schema-missing-field）。 */
const CONCEPT_FIELD_RULE: Record<string, ViolationRule> = {
  id: "schema-id-format",
  title: "schema-missing-field",
  module: "schema-missing-field",
  topic: "schema-missing-field",
  difficulty: "schema-type",
  estimated_minutes: "schema-type",
  pattern_label: "schema-missing-field",
  complexity_label: "schema-missing-field",
  prerequisite: "schema-type",
  next: "schema-type",
  learning_goal: "schema-missing-field",
  exit_criteria: "schema-missing-field",
  leetcode: "leetcode-format",
  tags: "schema-type",
};

function isMissing(issue: z.ZodIssue): boolean {
  return issue.code === z.ZodIssueCode.invalid_type && issue.received === "undefined";
}

function conceptRule(issue: z.ZodIssue): ViolationRule {
  if (isMissing(issue)) return "schema-missing-field";
  const top = String(issue.path[0] ?? "");
  return CONCEPT_FIELD_RULE[top] ?? "schema-type";
}

export interface ParsedConcept {
  frontmatter?: ConceptFrontmatter;
  violations: Violation[];
}

export function parseConceptFrontmatter(raw: unknown, subject: string): ParsedConcept {
  const result = conceptFrontmatterSchema.safeParse(raw);
  if (result.success) return { frontmatter: result.data, violations: [] };

  const violations: Violation[] = result.error.issues.map((issue) => {
    const field = issue.path.length > 0 ? issue.path.join(".") : undefined;
    return {
      rule: conceptRule(issue),
      severity: "error" as const,
      subject,
      field,
      message: `Concept ${subject}${field ? ` 欄位 ${field}` : ""}：${issue.message}`,
    };
  });
  return { violations };
}

// ── curriculum/modules.json（M1–M7） ────────────────────────────────────────

const topicSchema = z.object({
  id: z.string().regex(KEBAB_SLUG),
  title: z.string().min(1),
});

const moduleSchema = z.object({
  id: z.string().regex(KEBAB_SLUG),
  title: z.string().min(1),
  level: z.number().int(),
  topics: z.array(topicSchema).min(1),
});

interface CustomParams {
  rule: ViolationRule;
  field?: string;
  subject?: string;
}

const modulesSchema = z
  .object({
    version: z.number().int(),
    modules: z.array(moduleSchema),
  })
  .superRefine((val, ctx) => {
    // M2：modules 長度 = 16（skeleton-shape，不受 mode 影響）
    if (val.modules.length !== REQUIRED_MODULE_COUNT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["modules"],
        message: `modules 長度必須為 ${REQUIRED_MODULE_COUNT}（Level 0–15），實際為 ${val.modules.length}`,
        params: { rule: "skeleton-shape" } satisfies CustomParams,
      });
    }
    // M5：level == 陣列索引
    val.modules.forEach((m, i) => {
      if (m.level !== i) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["modules", i, "level"],
          message: `module ${m.id} 的 level（${m.level}）必須等於陣列索引（${i}）`,
          params: { rule: "skeleton-shape", subject: m.id } satisfies CustomParams,
        });
      }
    });
    // M4-a：module.id 全域唯一
    const seenModule = new Set<string>();
    val.modules.forEach((m, i) => {
      if (seenModule.has(m.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["modules", i, "id"],
          message: `module.id 重複：${m.id}`,
          params: { rule: "duplicate-id", field: "module", subject: m.id } satisfies CustomParams,
        });
      }
      seenModule.add(m.id);
    });
    // M4-b：topic.id 跨全部 Module 全域唯一（module.id 與其主 topic.id 同名不算，不同識別空間）
    const seenTopic = new Set<string>();
    val.modules.forEach((m, mi) => {
      m.topics.forEach((t, ti) => {
        if (seenTopic.has(t.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["modules", mi, "topics", ti, "id"],
            message: `topic.id 跨 Module 重複：${t.id}`,
            params: { rule: "duplicate-id", field: "topic", subject: t.id } satisfies CustomParams,
          });
        }
        seenTopic.add(t.id);
      });
    });
  });

function moduleIssueRule(issue: z.ZodIssue): { rule: ViolationRule; field?: string; subject?: string } {
  if (issue.code === z.ZodIssueCode.custom) {
    const params = (issue as z.ZodIssue & { params?: CustomParams }).params;
    if (params?.rule) return { rule: params.rule, field: params.field, subject: params.subject };
  }
  const path = issue.path;
  if (path[0] === "version") return { rule: "schema-type" };
  const last = String(path[path.length - 1] ?? "");
  if (last === "id") {
    return { rule: issue.code === z.ZodIssueCode.invalid_string ? "schema-id-format" : "skeleton-shape" };
  }
  // title / level / topics 及其餘結構問題皆屬骨架結構錯誤
  return { rule: "skeleton-shape" };
}

export interface ParsedModules {
  skeleton?: CurriculumSkeleton;
  violations: Violation[];
}

export function parseModules(raw: unknown): ParsedModules {
  const result = modulesSchema.safeParse(raw);
  if (result.success) return { skeleton: result.data, violations: [] };

  const violations: Violation[] = result.error.issues.map((issue) => {
    const { rule, field, subject } = moduleIssueRule(issue);
    const path = issue.path.length > 0 ? issue.path.join(".") : "modules";
    return {
      rule,
      severity: "error" as const,
      subject: subject ?? `modules.json:${path}`,
      field: field ?? (issue.path.length > 0 ? path : undefined),
      message: `modules.json ${path}：${issue.message}`,
    };
  });
  return { violations };
}
