// 課表載入器（F5）：讀 F4 生成物 schedules/{track}.json，取代 F1 硬編課表常數（FR-002、FR-029）。
// 讀檔集中於 loadAllSchedules（供 loadCompilerDeps 呼叫）；getSessionPlan 為純函式，供 compile() 使用。
import { readFileSync } from "node:fs";
import type { Track } from "../types/lesson.js";
import type { SessionPlan, TrackSchedule } from "../types/schedule.js";
import { TRACK_FILE_NAME } from "./schedule-generator.js";

export function loadTrackSchedule(track: Track, schedulesDir: string): TrackSchedule {
  const path = `${schedulesDir}/${TRACK_FILE_NAME[track]}`;
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (err) {
    throw new Error(`課表載入失敗：${path} 無法讀取（${(err as Error).message}）`);
  }
  try {
    return JSON.parse(raw) as TrackSchedule;
  } catch (err) {
    throw new Error(`課表載入失敗：${path} 無法解析為 JSON（${(err as Error).message}）`);
  }
}

export function loadAllSchedules(schedulesDir: string): Record<Track, TrackSchedule> {
  return {
    foundation: loadTrackSchedule("foundation", schedulesDir),
    interviewReady: loadTrackSchedule("interviewReady", schedulesDir),
    interviewMastery: loadTrackSchedule("interviewMastery", schedulesDir),
  };
}

// sessionIndex 非 1..N 範圍內的整數即 fail loud（FR-003），訊息含 track / sessionIndex / 課表長度。
export function getSessionPlan(track: Track, sessionIndex: number, schedule: TrackSchedule): SessionPlan {
  const plan = Number.isInteger(sessionIndex)
    ? schedule.sessions.find((s) => s.sessionIndex === sessionIndex)
    : undefined;
  if (!plan) {
    throw new Error(
      `sessionIndex 超出課表範圍：track=${track}, sessionIndex=${sessionIndex}, 課表長度=${schedule.sessions.length}`,
    );
  }
  return plan;
}
