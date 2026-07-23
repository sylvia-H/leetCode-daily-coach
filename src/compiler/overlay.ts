// Overlay 載入器（F5）：讀 F4 生成物 overlays/{track}.json。檔案不存在 ⇒ 空 Overlay 不失敗；
// 存在但不符 schema ⇒ fail loud（contracts/lesson-contract.md §1 對照表）。
//
// MUST NOT 提供 extraProblemIds 的取用點：選題類欄位已於 F4 generate-schedule.ts 套入課表並凍結
// （research R6、docs/spec.md §16.3），Compiler 只消費 extraNotesMarkdown（FR-009）。
import { existsSync, readFileSync } from "node:fs";
import type { Track } from "../types/lesson.js";
import type { TrackOverlay } from "../types/schedule.js";
import { TRACK_FILE_NAME } from "./schedule-generator.js";
import { parseTrackOverlay } from "./schedule-schema.js";

export function loadTrackOverlay(track: Track, overlaysDir: string): TrackOverlay {
  const path = `${overlaysDir}/${TRACK_FILE_NAME[track]}`;
  if (!existsSync(path)) {
    return { track, byConcept: {} };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    throw new Error(`overlay 載入失敗：${path} 無法解析為 JSON（${(err as Error).message}）`);
  }

  const { overlay, violations } = parseTrackOverlay(raw, track);
  if (!overlay) {
    throw new Error(`overlay 載入失敗：${path} 不符 schema：${violations.map((v) => v.message).join("; ")}`);
  }
  return overlay;
}

export function loadAllOverlays(overlaysDir: string): Record<Track, TrackOverlay> {
  return {
    foundation: loadTrackOverlay("foundation", overlaysDir),
    interviewReady: loadTrackOverlay("interviewReady", overlaysDir),
    interviewMastery: loadTrackOverlay("interviewMastery", overlaysDir),
  };
}

// Compiler 唯一消費的 Overlay 欄位：疊加不取代（FR-009）。
export function getOverlayNotes(overlay: TrackOverlay, conceptId: string): string | undefined {
  return overlay.byConcept[conceptId]?.extraNotesMarkdown;
}
