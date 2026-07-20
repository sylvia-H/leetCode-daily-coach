import { existsSync, readFileSync } from "node:fs";
import type { Track } from "../types/lesson.js";

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
