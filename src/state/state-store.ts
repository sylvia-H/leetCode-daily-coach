import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { TRACK_ORDER } from "../config.js";
import type { Lesson, Track } from "../types/lesson.js";

const HISTORY_LIMIT = 30;

export interface HistoryEntry {
  sessionIndex: number;
  /** 僅 concept 類 Session 有值；其餘四種 Session 類型無 conceptId 可記（F5 五種類型）。 */
  conceptId?: string;
  pushedAt: string;
}

export interface TrackState {
  currentSessionIndex: number;
  lastPushAt: string | null;
  completedConceptIds: string[];
  history: HistoryEntry[];
}

export interface AppState {
  tracks: Partial<Record<Track, TrackState>>;
}

function initialTrackState(): TrackState {
  return {
    currentSessionIndex: 1,
    lastPushAt: null,
    completedConceptIds: [],
    history: [],
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// 欄位語意驗證（cli-contract.md §4、state-schema.md §2）：JSON 合法但欄位語意損毀時，**比照「JSON
// 解析失敗」視為全域失敗**——拋錯後由 main.ts 發全域告警並 exit≠0，且因中止點在逐 Track 迴圈之前，
// save() 不會被呼叫，原檔得以保全（MUST NOT 覆寫唯一權威狀態）。
// 這是結構性驗證，非 zod 的型別／值域 schema 驗證（zod 屬 F2）。
function validateTrackState(track: Track, value: unknown): TrackState {
  if (!isPlainObject(value)) {
    throw new Error(`state.json 內容損毀：Track「${track}」的進度必須是物件`);
  }

  const { currentSessionIndex, lastPushAt, completedConceptIds, history } = value;

  // 字串型的 currentSessionIndex 在 advance() 會被 `+= 1` 當成字串串接（"3" → "31"）並寫回檔案，
  // 造成無聲的進度毀損，故 MUST 在載入時擋下。
  if (!Number.isInteger(currentSessionIndex) || (currentSessionIndex as number) < 1) {
    throw new Error(
      `state.json 內容損毀：Track「${track}」的 currentSessionIndex 必須是 ≥ 1 的整數（實際值：${JSON.stringify(currentSessionIndex)}）`,
    );
  }
  // 不可解析的 lastPushAt 會讓日期 guard 的 Intl 格式化丟出 RangeError，故 MUST 在載入時擋下。
  if (lastPushAt !== null && (typeof lastPushAt !== "string" || Number.isNaN(Date.parse(lastPushAt)))) {
    throw new Error(
      `state.json 內容損毀：Track「${track}」的 lastPushAt 必須是 null 或可解析的 ISO 8601 字串（實際值：${JSON.stringify(lastPushAt)}）`,
    );
  }
  if (!Array.isArray(completedConceptIds)) {
    throw new Error(`state.json 內容損毀：Track「${track}」的 completedConceptIds 必須是陣列`);
  }
  if (!Array.isArray(history)) {
    throw new Error(`state.json 內容損毀：Track「${track}」的 history 必須是陣列`);
  }

  return value as unknown as TrackState;
}

function validateAppState(parsed: unknown): AppState {
  if (!isPlainObject(parsed)) {
    throw new Error("state.json 內容損毀：最外層必須是物件");
  }

  const rawTracks = parsed.tracks;
  if (rawTracks === undefined || rawTracks === null) {
    return { tracks: {} };
  }
  if (!isPlainObject(rawTracks)) {
    throw new Error("state.json 內容損毀：tracks 必須是物件");
  }

  // 未啟用（但已知）的 Track 一律原樣保留，MUST NOT 刪除（state-schema.md §2）。
  const tracks: Partial<Record<Track, TrackState>> = {};
  for (const track of TRACK_ORDER) {
    const entry = rawTracks[track];
    if (entry !== undefined) {
      tracks[track] = validateTrackState(track, entry);
    }
  }
  return { tracks };
}

export function load(stateFile: string, enabledTracks: readonly Track[]): AppState {
  let state: AppState;

  if (!existsSync(stateFile)) {
    state = { tracks: {} };
  } else {
    const raw = readFileSync(stateFile, "utf-8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (cause) {
      throw new Error(`state.json 解析失敗（${stateFile}）：${(cause as Error).message}`, { cause });
    }
    state = validateAppState(parsed);
  }

  for (const track of enabledTracks) {
    if (!state.tracks[track]) {
      state.tracks[track] = initialTrackState();
    }
  }

  return state;
}

// 只在該 Track 推播成功後呼叫（FR-013：漏跑不跳課）。就地修改傳入的 state 物件；
// 呼叫方（main.ts）在全部 Track 處理完畢後負責單次呼叫 save()（FR-016）。
export function advance(state: AppState, track: Track, lesson: Lesson, pushedAt: Date): void {
  const trackState = state.tracks[track];
  if (!trackState) {
    throw new Error(`advance 呼叫時找不到 Track「${track}」的既有進度（應已由 load() 自動補建）`);
  }

  trackState.currentSessionIndex += 1;
  trackState.lastPushAt = pushedAt.toISOString();

  // `Lesson` 為 discriminated union：只有 concept 類 Session 帶得出 conceptId。
  const conceptId = lesson.type === "concept" ? lesson.concept.id : undefined;
  if (conceptId !== undefined && !trackState.completedConceptIds.includes(conceptId)) {
    trackState.completedConceptIds.push(conceptId);
  }

  const historyEntry: HistoryEntry = { sessionIndex: lesson.sessionIndex, pushedAt: pushedAt.toISOString() };
  if (conceptId !== undefined) historyEntry.conceptId = conceptId;
  trackState.history.push(historyEntry);
  if (trackState.history.length > HISTORY_LIMIT) {
    trackState.history = trackState.history.slice(trackState.history.length - HISTORY_LIMIT);
  }
}

// 只寫檔，不含任何 git 操作（research R5）；git add/commit/push 由 daily.yml 的 workflow step 負責。
export function save(stateFile: string, state: AppState): void {
  const orderedTracks: Partial<Record<Track, TrackState>> = {};
  for (const track of TRACK_ORDER) {
    const trackState = state.tracks[track];
    if (trackState) {
      orderedTracks[track] = trackState;
    }
  }

  const serialized = `${JSON.stringify({ tracks: orderedTracks }, null, 2)}\n`;
  writeFileSync(stateFile, serialized, "utf-8");
}
