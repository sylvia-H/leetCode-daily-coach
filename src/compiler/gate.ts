// 內容 Gate（F5 US3）：純函式，逐 Track × 逐 Session 執行 compile → render → checkBudget，
// 蒐集**全部**違規後一次回傳，不於第一筆中止（FR-024）。無 process.exit、無 console、無檔案 I/O
// （唯一 I/O 與 exit 位置在 scripts/validate.ts）。Gate 與每日 runtime import 同一顆
// compile / render / checkBudget（憲章 IX），不另寫平行的編譯或版面邏輯。
import { TRACK_ORDER } from "../config.js";
import { compile, type CompilerDeps } from "./lesson.js";
import { checkBudget } from "../renderer/budget.js";
import { render } from "../renderer/discord.js";
import type { Track } from "../types/lesson.js";

export type GateRule = "compile-error" | "render-error" | "budget-over" | "curriculum-invalid" | "schedule-empty";

export interface GateViolation {
  rule: GateRule;
  severity: "error";
  track?: Track;
  sessionIndex?: number;
  subject?: string;
  message: string;
}

export interface GateInput {
  deps: CompilerDeps;
}

export interface GateResult {
  violations: GateViolation[];
  compiled: number;
  total: number;
}

const TRACK_RANK: Record<Track, number> = Object.fromEntries(TRACK_ORDER.map((t, i) => [t, i])) as Record<
  Track,
  number
>;

function cmpGateViolation(a: GateViolation, b: GateViolation): number {
  return (
    (TRACK_RANK[a.track as Track] ?? -1) - (TRACK_RANK[b.track as Track] ?? -1) ||
    (a.sessionIndex ?? -1) - (b.sessionIndex ?? -1) ||
    a.rule.localeCompare(b.rule) ||
    (a.subject ?? "").localeCompare(b.subject ?? "") ||
    a.message.localeCompare(b.message)
  );
}

export function runContentGate(input: GateInput): GateResult {
  const { deps } = input;
  const violations: GateViolation[] = [];
  let compiled = 0;
  let total = 0;

  for (const track of TRACK_ORDER) {
    const schedule = deps.schedules[track];

    if (schedule.sessions.length === 0) {
      violations.push({
        rule: "schedule-empty",
        severity: "error",
        track,
        message: `Track「${track}」課表為空（0 個 Session），Gate 對此 Track 形同虛設`,
      });
      continue;
    }

    for (const session of schedule.sessions) {
      const sessionIndex = session.sessionIndex;
      total++;

      let lesson;
      try {
        lesson = compile(track, sessionIndex, deps);
      } catch (err) {
        violations.push({
          rule: "compile-error",
          severity: "error",
          track,
          sessionIndex,
          message: (err as Error).message,
        });
        continue;
      }
      compiled++;

      let messages;
      try {
        messages = render(lesson);
      } catch (err) {
        violations.push({
          rule: "render-error",
          severity: "error",
          track,
          sessionIndex,
          message: (err as Error).message,
        });
        continue;
      }

      messages.forEach((message, messageIndex) => {
        const report = checkBudget(message);
        if (!report.ok) {
          const overItems = report.items
            .filter((item) => item.over)
            .map((item) => `${item.name}(${item.length}/${item.limit})`)
            .join(", ");
          violations.push({
            rule: "budget-over",
            severity: "error",
            track,
            sessionIndex,
            subject: messages.length > 1 ? `message[${messageIndex}]` : undefined,
            message: `字元預算超限：${overItems}`,
          });
        }
      });
    }
  }

  violations.sort(cmpGateViolation);
  return { violations, compiled, total };
}
