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
  /**
   * F6 FR-022／R2：選填。該軌走完課表並成功發出完課通知的時間（ISO 8601）。
   * 缺席或 null ⇒ 未完課。存在且非 null ⇒ 該軌其後每次執行一律靜默跳過。
   */
  completedAt?: string | null;
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

// 註解中的需求編號一律標明所屬 Feature（見 `src/main.ts` 檔頭說明：F1 與 F6 的編號空間已實際碰撞）。
//
// 欄位語意驗證（F1 cli-contract.md §4、F1 state-schema.md §2）：JSON 合法但欄位語意損毀時，**比照「JSON
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

  // F6 FR-022／state-schema.md §1：completedAt 為選填欄位，缺席不算違反（向後相容）；
  // 存在時 MUST 為 null 或 Date.parse 可解析的字串，否則比照欄位語意損毀。
  if (
    "completedAt" in value &&
    value.completedAt !== null &&
    value.completedAt !== undefined &&
    (typeof value.completedAt !== "string" || Number.isNaN(Date.parse(value.completedAt)))
  ) {
    throw new Error(
      `state.json 內容損毀：Track「${track}」的 completedAt 必須是 null 或可解析的 ISO 8601 字串（實際值：${JSON.stringify(value.completedAt)}）`,
    );
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

  // F6 FR-031：tracks 中出現不屬於三個已知 Track 的鍵（例如人工編輯打錯字）MUST 判為欄位語意損毀
  // ⇒ 全域性失敗。現行實作原本會靜默丟棄未知鍵（下面迴圈只走訪 TRACK_ORDER），使維運者的手誤打錯
  // Track 名稱完全沒有訊號、且 save() 時會被悄悄抹除；fail loud 才能讓這個手誤被立即看見。
  const knownTracks = new Set<string>(TRACK_ORDER);
  const unknownKeys = Object.keys(rawTracks).filter((key) => !knownTracks.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(`state.json 內容損毀：tracks 含未知的 Track 鍵：${unknownKeys.join(", ")}`);
  }

  // 未啟用（但已知）的 Track 一律原樣保留，MUST NOT 刪除（F1 state-schema.md §2）。
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

// 只在該 Track 推播成功後呼叫（F1 FR-013：漏跑不跳課）。就地修改傳入的 state 物件；
// 呼叫方（main.ts）在全部 Track 處理完畢後負責單次呼叫 save()（F1 FR-016）。
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

// F6 FR-022／R2：只在「該軌 currentSessionIndex 超出課表最大 sessionIndex」且完課通知送出成功後呼叫。
// 只設定 completedAt；MUST NOT 動 currentSessionIndex / lastPushAt / history / completedConceptIds
// ——完課不是一次推播。就地修改 in-memory state，落盤由呼叫方單次 save() 負責。
export function markCompleted(state: AppState, track: Track, completedAt: Date): void {
  const trackState = state.tracks[track];
  if (!trackState) {
    throw new Error(`markCompleted 呼叫時找不到 Track「${track}」的既有進度（應已由 load() 自動補建）`);
  }
  trackState.completedAt = completedAt.toISOString();
}

// 只寫檔，不含任何 git 操作（F1 research R5）；git add/commit/push 由 daily.yml 的 workflow step 負責。
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
