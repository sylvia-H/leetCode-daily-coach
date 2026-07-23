// F4 違規物件的單一建構與排序實作。schedule-schema.ts（輸入 schema 層）與 schedule-generator.ts
// （生成／驗證層）MUST 共用同一份——兩處各自複寫會讓「違規清單本身亦 determinism」的保證在其中一份
// 調整排序鍵時悄悄分歧。
import type { ScheduleViolation, ScheduleViolationRule } from "../types/schedule.js";

/** 沿用 F2/F3 的具名違規排序慣例（rule → subject → field），使違規清單本身亦 determinism。 */
export function cmpViolation(a: ScheduleViolation, b: ScheduleViolation): number {
  return (
    a.rule.localeCompare(b.rule) ||
    a.subject.localeCompare(b.subject) ||
    (a.field ?? "").localeCompare(b.field ?? "")
  );
}

/** 具名違規建構子；severity 預設 error（可選階段的訊號才用 warning）。 */
export function violation(
  rule: ScheduleViolationRule,
  subject: string,
  message: string,
  extra: { field?: string; target?: string; severity?: ScheduleViolation["severity"] } = {},
): ScheduleViolation {
  const { severity = "error", ...rest } = extra;
  return { rule, severity, subject, message, ...rest };
}

/** 人可讀的單行違規輸出；CI Gate 與生成入口共用同一格式（避免兩支 script 各印各的）。 */
export function formatViolation(v: ScheduleViolation): string {
  const loc = v.field ? `${v.subject}.${v.field}` : v.subject;
  const target = v.target ? ` → ${v.target}` : "";
  return `  [${v.severity}] ${v.rule} ${loc}${target}：${v.message}`;
}
