// 內容 Gate（F5 US3）：純函式，逐 Track × 逐 Session 執行 compile → render → checkBudget，
// 蒐集**全部**違規後一次回傳，不於第一筆中止（FR-024）。無 process.exit、無 console、無檔案 I/O
// （唯一 I/O 與 exit 位置在 scripts/validate.ts）。Gate 與每日 runtime import 同一顆
// compile / render / checkBudget（憲章 IX），不另寫平行的編譯或版面邏輯。
import { TRACK_ORDER } from "../config.js";
import { compile, type CompilerDeps } from "./lesson.js";
import { checkBudget } from "../renderer/budget.js";
import { render } from "../renderer/discord.js";
import { checkTraditionalChinese } from "./traditional-chinese.js";
import type { Track } from "../types/lesson.js";

export type GateRule =
  | "compile-error"
  | "render-error"
  | "budget-over"
  | "curriculum-invalid"
  | "schedule-empty"
  | "traditional-chinese"
  | "concept-body-too-long";

/** §10.3 觀念本體字數上限（F7 FR-008/FR-010.2）。 */
export const CONCEPT_BODY_MAX_CHARS = 2000;

/**
 * 觀念本體字數的近似計數：先剝除 fenced/行內 code（§10.3 排除程式碼），再移除 markdown 標記符號
 * （標題井號、粗體/斜體星號、清單槓）與空白，取剩餘字元數。近似值，非逐字元語言學斷詞。
 */
export function countConceptBodyChars(conceptBody: string): number {
  const withoutCode = conceptBody.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  const stripped = withoutCode.replace(/[#*_>-]/g, "").replace(/\s+/g, "");
  return stripped.length;
}

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
  // 同一 Article 可能被多個 Track/Session 引用（三軌共用正文，憲章 VI）；只在首次遇到時檢查一次，
  // 避免同一違規重複回報 3 次。
  const checkedArticlePaths = new Set<string>();

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

      if (lesson.type === "concept") {
        const articlePath = lesson.concept.articlePath;
        if (!checkedArticlePaths.has(articlePath)) {
          checkedArticlePaths.add(articlePath);
          const article = deps.articleCache?.get(articlePath);
          if (article) {
            const tc = checkTraditionalChinese(article.rawContent);
            for (const v of tc.violations) {
              violations.push({
                rule: "traditional-chinese",
                severity: "error",
                track,
                sessionIndex,
                subject: article.meta.id,
                message: v.message,
              });
            }
            const bodyChars = countConceptBodyChars(article.conceptBody);
            if (bodyChars > CONCEPT_BODY_MAX_CHARS) {
              violations.push({
                rule: "concept-body-too-long",
                severity: "error",
                track,
                sessionIndex,
                subject: article.meta.id,
                message: `觀念本體約 ${bodyChars} 字，超過上限 ${CONCEPT_BODY_MAX_CHARS} 字（§10.3）`,
              });
            }
          }
        }
      }

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
