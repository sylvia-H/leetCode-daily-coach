// curriculum/track-params.json 與 overlays/{track}.json 的 zod schema 驗證。
// 只做 schema 層（型別 / 值域 / 長度 / 已知欄位）＋ 需要外部資料（modules 範圍、檔名對應 Track）的
// 輕量交叉檢查；「byConcept key 是否為該 Track 已涵蓋 Concept」「extraProblemIds 是否存在於 Problem
// Bank」等需先算出涵蓋子集才能判定的規則歸 schedule-generator.ts（FR-006）。
import { z } from "zod";
import type { Track } from "../types/lesson.js";
import type {
  ScheduleViolation,
  ScheduleViolationRule,
  TrackOverlay,
  TrackParamsFile,
} from "../types/schedule.js";

const DIFFICULTY_ENUM = z.enum(["Easy", "Medium", "Hard"]);
const SESSION_TYPE_ENUM = z.enum(["concept", "practice", "review", "challenge", "rest"]);
const TRACK_ENUM = z.enum(["foundation", "interviewReady", "interviewMastery"]);

interface CustomParams {
  rule: ScheduleViolationRule;
}

function withCustomIssue(ctx: z.RefinementCtx, path: (string | number)[], message: string, rule: ScheduleViolationRule): void {
  ctx.addIssue({ code: z.ZodIssueCode.custom, path, message, params: { rule } satisfies CustomParams });
}

/** 依 zod issue 分類為 F4 具名規則（data-model.md §5）。 */
function classifyIssue(issue: z.ZodIssue): { rule: ScheduleViolationRule; field?: string } {
  if (issue.code === "unrecognized_keys") {
    return { rule: "schema-type", field: issue.keys.join(",") };
  }
  const field = issue.path.length > 0 ? issue.path.join(".") : undefined;
  if (issue.code === "invalid_type" && issue.received === "undefined") {
    return { rule: "schema-missing-field", field };
  }
  if (issue.code === "custom") {
    const params = (issue as z.ZodIssue & { params?: CustomParams }).params;
    if (params?.rule) return { rule: params.rule, field };
  }
  const last = String(issue.path[issue.path.length - 1] ?? "");
  if ((last === "rhythm" || last === "problemDifficulties") && (issue.code === "too_small" || issue.code === "too_big")) {
    return { rule: "param-invalid", field };
  }
  return { rule: "schema-type", field };
}

function cmpViolation(a: ScheduleViolation, b: ScheduleViolation): number {
  return (
    a.rule.localeCompare(b.rule) ||
    a.subject.localeCompare(b.subject) ||
    (a.field ?? "").localeCompare(b.field ?? "")
  );
}

// ── curriculum/track-params.json ────────────────────────────────────────────

export interface ModuleRangeInput {
  id: string;
  level: number;
}

function makeTrackParamSchema(moduleIds: Set<string>, maxModuleLevel: number) {
  return z
    .object({
      targetLevel: z.enum(["easy", "medium", "hard"]),
      maxLevel: z.number().int(),
      moduleAllowlist: z.array(z.string()).optional(),
      problemDifficulties: z.array(DIFFICULTY_ENUM).min(1),
      challengeDifficulty: DIFFICULTY_ENUM,
      rhythm: z.array(SESSION_TYPE_ENUM).length(7),
    })
    .strict()
    .superRefine((val, ctx) => {
      if (val.maxLevel < 0 || val.maxLevel > maxModuleLevel) {
        withCustomIssue(
          ctx,
          ["maxLevel"],
          `maxLevel（${val.maxLevel}）超出 modules.json 宣告的 level 範圍（0..${maxModuleLevel}）`,
          "param-invalid",
        );
      }
      if (val.moduleAllowlist) {
        for (const id of val.moduleAllowlist) {
          if (!moduleIds.has(id)) {
            withCustomIssue(ctx, ["moduleAllowlist"], `moduleAllowlist 含不存在的 module id：${id}`, "param-invalid");
          }
        }
      }
      if (!val.rhythm.includes("review") || !val.rhythm.includes("rest")) {
        withCustomIssue(ctx, ["rhythm"], "rhythm MUST 含至少一個 review 與一個 rest", "param-invalid");
      }
    });
}

function makeTrackParamsFileSchema(moduleIds: Set<string>, maxModuleLevel: number) {
  const trackParamSchema = makeTrackParamSchema(moduleIds, maxModuleLevel);
  return z
    .object({
      version: z.number().int(),
      tracks: z
        .object({
          foundation: trackParamSchema,
          interviewReady: trackParamSchema,
          interviewMastery: trackParamSchema,
        })
        .strict(),
    })
    .strict();
}

export interface ParsedTrackParamsFile {
  file?: TrackParamsFile;
  violations: ScheduleViolation[];
}

/** 純函式：解析 curriculum/track-params.json；modules 提供 maxLevel 範圍與 moduleAllowlist 存在性判準。 */
export function parseTrackParamsFile(raw: unknown, modules: ModuleRangeInput[]): ParsedTrackParamsFile {
  const moduleIds = new Set(modules.map((m) => m.id));
  const maxModuleLevel = modules.reduce((max, m) => Math.max(max, m.level), 0);
  const schema = makeTrackParamsFileSchema(moduleIds, maxModuleLevel);
  const result = schema.safeParse(raw);
  if (result.success) return { file: result.data as TrackParamsFile, violations: [] };

  const violations: ScheduleViolation[] = result.error.issues.map((issue) => {
    const { rule, field } = classifyIssue(issue);
    return {
      rule,
      severity: "error" as const,
      subject: "curriculum/track-params.json",
      field,
      message: `track-params.json ${field ?? "(root)"}：${issue.message}`,
    };
  });
  violations.sort(cmpViolation);
  return { violations };
}

// ── overlays/{track}.json ───────────────────────────────────────────────────

const conceptOverlaySchema = z
  .object({
    extraProblemIds: z.array(z.number().int()).optional(),
    extraNotesMarkdown: z.string().optional(),
    challengeDifficulty: DIFFICULTY_ENUM.optional(),
  })
  .strict();

function makeTrackOverlaySchema(expectedTrack: Track) {
  return z
    .object({
      track: TRACK_ENUM,
      byConcept: z.record(z.string(), conceptOverlaySchema),
    })
    .strict()
    .superRefine((val, ctx) => {
      if (val.track !== expectedTrack) {
        withCustomIssue(
          ctx,
          ["track"],
          `overlay 的 track（${val.track}）與檔名對應 Track（${expectedTrack}）不符`,
          "param-invalid",
        );
      }
    });
}

export interface ParsedTrackOverlay {
  overlay?: TrackOverlay;
  violations: ScheduleViolation[];
}

/** 純函式：解析 overlays/{track}.json；expectedTrack 為檔名對應的 Track，用於偵測 track 欄位不符。 */
export function parseTrackOverlay(raw: unknown, expectedTrack: Track): ParsedTrackOverlay {
  const schema = makeTrackOverlaySchema(expectedTrack);
  const result = schema.safeParse(raw);
  if (result.success) return { overlay: result.data as TrackOverlay, violations: [] };

  const violations: ScheduleViolation[] = result.error.issues.map((issue) => {
    const { rule, field } = classifyIssue(issue);
    return {
      rule,
      severity: "error" as const,
      subject: `overlays/${expectedTrack}`,
      field,
      message: `overlays/${expectedTrack}.json ${field ?? "(root)"}：${issue.message}`,
    };
  });
  violations.sort(cmpViolation);
  return { violations };
}
