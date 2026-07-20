import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { TRACK_ORDER } from "../config.js";
import type { Lesson, Track } from "../types/lesson.js";

const HISTORY_LIMIT = 30;

export interface HistoryEntry {
  sessionIndex: number;
  conceptId: string;
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

export function load(stateFile: string, enabledTracks: readonly Track[]): AppState {
  let state: AppState;

  if (!existsSync(stateFile)) {
    state = { tracks: {} };
  } else {
    const raw = readFileSync(stateFile, "utf-8");
    try {
      state = JSON.parse(raw) as AppState;
    } catch (cause) {
      throw new Error(`state.json 解析失敗（${stateFile}）：${(cause as Error).message}`, { cause });
    }
    if (!state.tracks) {
      state.tracks = {};
    }
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

  if (!trackState.completedConceptIds.includes(lesson.concept.id)) {
    trackState.completedConceptIds.push(lesson.concept.id);
  }

  trackState.history.push({
    sessionIndex: lesson.sessionIndex,
    conceptId: lesson.concept.id,
    pushedAt: pushedAt.toISOString(),
  });
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
