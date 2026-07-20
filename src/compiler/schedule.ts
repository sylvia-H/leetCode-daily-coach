// ⚠️ F1 臨時產物（FR-002）：硬編 3-Session 課表 + 學習路徑對照表。
// 課表本身 → F4（generate-schedule.ts 取代）；學習路徑對照表 → F2（DAG 的 prerequisite/next 取代）。
// 三個 Session 共用同一篇教材是刻意設計，見 spec.md Assumptions；MUST NOT 視為資料錯誤。
import type { PathLabels, SessionType, Track } from "../types/lesson.js";

export interface SessionPlan {
  sessionIndex: number;
  type: SessionType;
  conceptId?: string;
}

const CONCEPT_ID = "left-right-pointer";

const SESSION_PLANS: readonly SessionPlan[] = [
  { sessionIndex: 1, type: "concept", conceptId: CONCEPT_ID },
  { sessionIndex: 2, type: "concept", conceptId: CONCEPT_ID },
  { sessionIndex: 3, type: "concept", conceptId: CONCEPT_ID },
];

const PATH_LABELS: readonly PathLabels[] = [
  { current: "Left-Right Pointer", next: "Fast-Slow Pointer" },
  { prev: "Left-Right Pointer", current: "Fast-Slow Pointer", next: "Sliding Window" },
  { prev: "Fast-Slow Pointer", current: "Sliding Window", next: "Prefix Sum" },
];

export function getSessionPlan(_track: Track, sessionIndex: number): SessionPlan {
  const plan = SESSION_PLANS[sessionIndex - 1];
  if (!plan) {
    throw new Error(`課表用盡：sessionIndex ${sessionIndex} 超出本 Feature 的硬編課表範圍（1～3）`);
  }
  return plan;
}

export function getPathLabels(sessionIndex: number): PathLabels {
  const labels = PATH_LABELS[sessionIndex - 1];
  if (!labels) {
    throw new Error(`課表用盡：sessionIndex ${sessionIndex} 超出本 Feature 的硬編課表範圍（1～3）`);
  }
  return labels;
}
