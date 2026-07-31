// 測試專用：對**真實素材**（凍結的 concepts/ + articles/ + schedules/）做動態查詢。
//
// ## 為何需要這一層
//
// F1 / F5 時代的測試直接硬編 `sessionIndex: 4`、conceptId `prefix-sum` / `time-space-complexity`，
// 那些值來自當時的種子課表。F7 的 T031 / T032 以正式課綱重新生成三份課表後（三軌 maxLevel 9/12/15、
// 節奏各異、Session 數 243/236/291），這些常數全部失效——7 個測試同時變紅，而且失敗訊息看起來像
// 產品壞了，實際只是 fixture 過期。
//
// 課綱本來就會再變（新增 Concept、調整節奏都會位移 sessionIndex），所以測試 MUST 從課表**查**出所需
// 的 Session，MUST NOT 再硬編任何 index。查不到時 MUST fail loud 並指出是 fixture 假設失效，
// 而非讓斷言在下游以難以理解的形式爆掉。
import type { CompilerDeps } from "../../src/compiler/lesson.js";
import type { Track } from "../../src/types/lesson.js";

/** 查出某 conceptId 在該 Track 課表中的 concept Session index。查無即 fail loud。 */
export function sessionIndexOfConcept(deps: CompilerDeps, track: Track, conceptId: string): number {
  const session = deps.schedules[track].sessions.find((s) => s.type === "concept" && s.conceptId === conceptId);
  if (!session) {
    throw new Error(`fixture 失效：track=${track} 的課表中找不到 conceptId=${conceptId} 的 concept Session`);
  }
  return session.sessionIndex;
}

/** 該 Track 課表中第 n 個（1-based）concept 類 Session 的 conceptId。用於「不在意是哪一課、只要是觀念課」的情境。 */
export function nthConceptId(deps: CompilerDeps, track: Track, n = 1): string {
  const conceptSessions = deps.schedules[track].sessions.filter((s) => s.type === "concept");
  const session = conceptSessions[n - 1];
  if (!session?.conceptId) {
    throw new Error(`fixture 失效：track=${track} 的課表不足 ${n} 個 concept Session`);
  }
  return session.conceptId;
}

/** 指定 sessionIndex 的 conceptId（該 Session MUST 為 concept 類）。 */
export function conceptIdAt(deps: CompilerDeps, track: Track, sessionIndex: number): string {
  const session = deps.schedules[track].sessions.find((s) => s.sessionIndex === sessionIndex);
  if (session?.type !== "concept" || !session.conceptId) {
    throw new Error(`fixture 失效：track=${track} 的 session ${sessionIndex} 不是 concept 類`);
  }
  return session.conceptId;
}

/**
 * 找出**三軌課表皆涵蓋**的 conceptId，供跨 Track 比對「共用同一份教材正文」（憲章 VI）。
 *
 * 三軌 `maxLevel` 為 9 / 12 / 15，涵蓋範圍是包含關係，故較淺的 Foundation 所涵蓋者必為三軌交集；
 * 但仍逐一驗證而非假設，涵蓋規則若日後改動即在此 fail loud。
 *
 * `requireProblems` 為 true 時只回傳有題目的 Concept——`leetcode: []` 的「無題目觀念課」佔約 16%
 * （spec §13.5），拿它去斷言題目相關行為會得到空陣列而非有意義的失敗。
 */
export function findConceptInAllTracks(deps: CompilerDeps, requireProblems = false): string {
  const tracks: Track[] = ["foundation", "interviewReady", "interviewMastery"];
  for (const session of deps.schedules.foundation.sessions) {
    if (session.type !== "concept" || !session.conceptId) continue;
    if (requireProblems && (session.problemIds?.length ?? 0) === 0) continue;
    const inAll = tracks.every((t) =>
      deps.schedules[t].sessions.some((s) => s.type === "concept" && s.conceptId === session.conceptId),
    );
    if (!inAll) continue;
    if (requireProblems) {
      const allHaveProblems = tracks.every((t) =>
        deps.schedules[t].sessions.some(
          (s) => s.type === "concept" && s.conceptId === session.conceptId && (s.problemIds?.length ?? 0) > 0,
        ),
      );
      if (!allHaveProblems) continue;
    }
    return session.conceptId;
  }
  throw new Error(
    `fixture 失效：找不到三軌課表皆涵蓋${requireProblems ? "、且三軌皆有題目" : ""}的 concept`,
  );
}

/** 超出該 Track 課表範圍的 sessionIndex（完課終態測試用）。MUST NOT 硬編常數——課表長度是導出值（spec §13.5）。 */
export function pastEndSessionIndex(deps: CompilerDeps, track: Track): number {
  return deps.schedules[track].sessions.length + 1;
}
