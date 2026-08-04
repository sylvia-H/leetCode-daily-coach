// curriculum/track-params.json、overlays/{track}.json 與 schedules/{track}.json 的 zod schema 驗證。
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
  TrackSchedule,
} from "../types/schedule.js";
import { cmpViolation } from "./schedule-violation.js";

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
      rhythm: z.array(SESSION_TYPE_ENUM).min(2).max(14),
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
      validateRhythm(val.rhythm, ctx);
    });
}

/**
 * rhythm 槽位順序約束：僅檢查「含 review」不足以擋下 schema-valid 卻生不出合法課表的排法，
 * 錯誤會延後到生成後才被 validateSchedule 攔下、且訊息指向 Session 而非真正的根因（rhythm 設定）。
 * 四條約束皆在此以 param-invalid 具名回報（F8 移除「MUST 含 rest」——rest 已非必要槽，data-model.md §5）：
 *  1. 至少一個 concept 槽——否則 emitSessions 的涵蓋佇列永遠不被消耗（無限迴圈）。
 *  2. 每個 practice 槽之前 MUST 有 concept 槽——否則該週 practice 拿到空的 weekConcepts。
 *  3. 最後一個 concept 槽 MUST 早於某個 review 槽——否則該 concept 落在 reviewRange
 *     （= [weekStart, review−1]，FR-013）之外，永遠不被複習（對應 validateSchedule 的
 *     review-coverage-gap；此處於參數層先擋，指名根因）。此條亦排除 review 落首槽的空區間。
 */
function validateRhythm(rhythm: readonly z.infer<typeof SESSION_TYPE_ENUM>[], ctx: z.RefinementCtx): void {
  if (!rhythm.includes("review")) {
    withCustomIssue(ctx, ["rhythm"], "rhythm MUST 含至少一個 review", "param-invalid");
  }
  if (!rhythm.includes("concept")) {
    withCustomIssue(ctx, ["rhythm"], "rhythm MUST 含至少一個 concept 槽，否則涵蓋 Concept 永遠無法排入", "param-invalid");
    return;
  }
  const firstConcept = rhythm.indexOf("concept");
  const firstPractice = rhythm.indexOf("practice");
  if (firstPractice >= 0 && firstPractice < firstConcept) {
    withCustomIssue(
      ctx,
      ["rhythm"],
      `rhythm 的第一個 practice 槽（第 ${firstPractice + 1} 槽）早於第一個 concept 槽（第 ${firstConcept + 1} 槽），該週 practice 將無題可練`,
      "param-invalid",
    );
  }
  const lastConcept = rhythm.lastIndexOf("concept");
  const lastReview = rhythm.lastIndexOf("review");
  if (lastReview >= 0 && lastReview < lastConcept) {
    withCustomIssue(
      ctx,
      ["rhythm"],
      `rhythm 的最後一個 review 槽（第 ${lastReview + 1} 槽）早於最後一個 concept 槽（第 ${lastConcept + 1} 槽），該 concept 將落在 reviewRange 之外、永遠不被複習`,
      "param-invalid",
    );
  }
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

// ── 生成物：schedules/{track}.json ──────────────────────────────────────────

// 課表雖為 generate-schedule.ts 的確定性生成物，載入端仍 MUST 驗 schema：手改／半寫入／舊版格式的檔案
// 若只做 `JSON.parse as TrackSchedule`，缺欄位會延後到 Gate 的 `schedule.sessions.length` 或 runtime 的
// render 才以 TypeError 爆開（脫離 per-Track try/catch），失去具名違規與失敗位置。
const sessionPlanSchema = z
  .object({
    sessionIndex: z.number().int().positive(),
    type: SESSION_TYPE_ENUM,
    conceptId: z.string().min(1).optional(),
    reviewRange: z.tuple([z.number().int(), z.number().int()]).optional(),
    problemIds: z.array(z.number().int().positive()).optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    // 型別不變式（data-model.md §1）：concept ⇒ conceptId、review ⇒ reviewRange。此處於載入層先擋；
    // compile() 內的同名檢查保留為第二道防線（compile 也接受非載入路徑構造的課表）。
    if (val.type === "concept" && val.conceptId === undefined) {
      withCustomIssue(
        ctx,
        ["conceptId"],
        `Session ${val.sessionIndex} 為 concept 但缺少 conceptId`,
        "schema-missing-field",
      );
    }
    if (val.type === "review" && val.reviewRange === undefined) {
      withCustomIssue(
        ctx,
        ["reviewRange"],
        `Session ${val.sessionIndex} 為 review 但缺少 reviewRange`,
        "schema-missing-field",
      );
    }
  });

function makeTrackScheduleSchema(expectedTrack: Track) {
  return z
    .object({
      track: TRACK_ENUM,
      targetLevel: z.enum(["easy", "medium", "hard"]),
      sessions: z.array(sessionPlanSchema),
    })
    .strict()
    .superRefine((val, ctx) => {
      if (val.track !== expectedTrack) {
        withCustomIssue(
          ctx,
          ["track"],
          `課表的 track（${val.track}）與檔名對應 Track（${expectedTrack}）不符`,
          "param-invalid",
        );
      }
    });
}

export interface ParsedTrackSchedule {
  schedule?: TrackSchedule;
  violations: ScheduleViolation[];
}

/** 純函式：解析 schedules/{track}.json；expectedTrack 為檔名對應的 Track，用於偵測 track 欄位不符。 */
export function parseTrackSchedule(raw: unknown, expectedTrack: Track): ParsedTrackSchedule {
  const schema = makeTrackScheduleSchema(expectedTrack);
  const result = schema.safeParse(raw);
  if (result.success) return { schedule: result.data as TrackSchedule, violations: [] };

  const violations: ScheduleViolation[] = result.error.issues.map((issue) => {
    const { rule, field } = classifyIssue(issue);
    return {
      rule,
      severity: "error" as const,
      subject: `schedules/${expectedTrack}`,
      field,
      message: `schedules/${expectedTrack}.json ${field ?? "(root)"}：${issue.message}`,
    };
  });
  violations.sort(cmpViolation);
  return { violations };
}
