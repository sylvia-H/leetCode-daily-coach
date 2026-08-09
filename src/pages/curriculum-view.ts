// TrackProgressView／CurriculumEntryView 導出（research R8／R9／R10、data-model.md §1／§2）。
// 純函式，不讀 Date.now()／環境變數，唯讀消費 AppState／CurriculumGraph／TrackSchedule。
import { TRACK_ORDER } from "../config.js";
import type { QuizBank } from "../compiler/quiz.js";
import type { AppState, TrackState } from "../state/state-store.js";
import type { CurriculumGraph, Ordinal } from "../types/curriculum.js";
import type { SessionType, Track } from "../types/lesson.js";
import type { TrackSchedule } from "../types/schedule.js";

export type TrackStatus = "not-started" | "in-progress" | "completed";

export interface LastSessionView {
  sessionIndex: number;
  type: SessionType;
  pushedAt: string;
  conceptId?: string;
  conceptTitle?: string;
  articleUrl?: string;
}

export interface TrackProgressView {
  track: Track;
  status: TrackStatus;
  completedConceptCount: number;
  totalConceptCount: number;
  lastSession?: LastSessionView;
  currentOrdinalConceptId?: string;
}

export interface CurriculumEntryView {
  conceptId: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  topicId: string;
  topicTitle: string;
  unlocked: boolean;
  articleUrl?: string;
  /** F11（FR-017、pages-quiz.md §6）：僅 unlocked 且題庫有題時賦值，同 quiz/{conceptId}.html 產出範圍判準。 */
  quizUrl?: string;
  atTrackPositions: Track[];
}

// site-build-contract.md §5：`cmpOrdinal` 在 curriculum.ts／lesson.ts／material.ts 各有一份未 export
// 的私有複本，`src/pages/**` 比照此既有慣例自帶一份（不 export、不改動既有三個檔案）。
function cmpOrdinal(a: Ordinal, b: Ordinal): number {
  return (
    a.moduleIndex - b.moduleIndex ||
    a.topicIndex - b.topicIndex ||
    a.localOrder - b.localOrder ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** research R8：解鎖集合 = 三個已知 Track（state.tracks 中存在者，不限 enabledTracks）的聯集。 */
export function computeUnlockedConceptIds(state: AppState): Set<string> {
  const unlocked = new Set<string>();
  for (const track of TRACK_ORDER) {
    const trackState = state.tracks[track];
    if (!trackState) continue;
    for (const id of trackState.completedConceptIds) unlocked.add(id);
  }
  return unlocked;
}

/** research R9：Track「目前進度位置」= completedConceptIds 中 DAG 全序最大者。 */
function computeCurrentOrdinalConceptId(
  completedConceptIds: string[],
  graph: CurriculumGraph,
): string | undefined {
  let best: { id: string; ordinal: Ordinal } | undefined;
  for (const id of completedConceptIds) {
    const ordinal = graph.ordinalOf.get(id);
    if (!ordinal) continue; // 防禦性：不應發生，DAG 之外的 id 不影響其餘計算
    if (!best || cmpOrdinal(ordinal, best.ordinal) > 0) {
      best = { id, ordinal };
    }
  }
  return best?.id;
}

function articleUrlFor(baseUrl: string, conceptId: string): string {
  return `${baseUrl}/articles/${conceptId}.html`;
}

/** research R10：最近一次推播的呈現——concept 類帶完整資訊，非 concept 類 MUST NOT 虛構所屬 Concept。 */
function buildLastSession(
  trackState: TrackState,
  graph: CurriculumGraph,
  schedule: TrackSchedule,
  baseUrl: string,
): LastSessionView | undefined {
  const lastEntry = trackState.history.at(-1);
  if (!lastEntry) return undefined;

  const plan = schedule.sessions.find((s) => s.sessionIndex === lastEntry.sessionIndex);
  const type: SessionType = plan?.type ?? (lastEntry.conceptId !== undefined ? "concept" : "rest");

  const view: LastSessionView = {
    sessionIndex: lastEntry.sessionIndex,
    type,
    pushedAt: lastEntry.pushedAt,
  };

  if (type === "concept" && lastEntry.conceptId !== undefined) {
    const node = graph.concepts.get(lastEntry.conceptId);
    if (node) {
      view.conceptId = node.id;
      view.conceptTitle = node.title;
      view.articleUrl = articleUrlFor(baseUrl, node.id);
    }
  }

  return view;
}

/** FR-004／research R10：某已啟用 Track 的儀表板進度視圖。 */
export function buildTrackProgress(
  track: Track,
  trackState: TrackState,
  graph: CurriculumGraph,
  schedule: TrackSchedule,
  baseUrl: string,
): TrackProgressView {
  const status: TrackStatus =
    trackState.completedAt !== undefined && trackState.completedAt !== null
      ? "completed"
      : trackState.history.length === 0
        ? "not-started"
        : "in-progress";

  const view: TrackProgressView = {
    track,
    status,
    completedConceptCount: trackState.completedConceptIds.length,
    totalConceptCount: graph.concepts.size,
  };

  const currentOrdinalConceptId = computeCurrentOrdinalConceptId(trackState.completedConceptIds, graph);
  if (currentOrdinalConceptId !== undefined) view.currentOrdinalConceptId = currentOrdinalConceptId;

  const lastSession = buildLastSession(trackState, graph, schedule, baseUrl);
  if (lastSession !== undefined) view.lastSession = lastSession;

  return view;
}

/** FR-005／FR-005a：課綱順序視圖，全部 Concept 各一筆，依 DAG 全序排列。 */
export function buildCurriculumEntries(
  graph: CurriculumGraph,
  unlockedIds: Set<string>,
  trackProgress: TrackProgressView[],
  baseUrl: string,
  quizBank: QuizBank | undefined,
): CurriculumEntryView[] {
  const positionsByConcept = new Map<string, Track[]>();
  for (const progress of trackProgress) {
    if (progress.currentOrdinalConceptId === undefined) continue;
    const list = positionsByConcept.get(progress.currentOrdinalConceptId);
    if (list) list.push(progress.track);
    else positionsByConcept.set(progress.currentOrdinalConceptId, [progress.track]);
  }

  const entries: CurriculumEntryView[] = [];
  for (const node of graph.concepts.values()) {
    const topic = graph.topics.get(node.topic);
    const moduleNode = graph.modules.find((m) => m.id === node.module);
    const unlocked = unlockedIds.has(node.id);

    const entry: CurriculumEntryView = {
      conceptId: node.id,
      title: node.title,
      moduleId: node.module,
      moduleTitle: moduleNode?.title ?? node.module,
      topicId: node.topic,
      topicTitle: topic?.title ?? node.topic,
      unlocked,
      atTrackPositions: positionsByConcept.get(node.id) ?? [],
    };
    if (unlocked) entry.articleUrl = articleUrlFor(baseUrl, node.id);
    if (unlocked && quizBank?.byConcept[node.id]?.length) {
      entry.quizUrl = `${baseUrl}/quiz/${node.id}.html`;
    }
    entries.push(entry);
  }

  entries.sort((a, b) => cmpOrdinal(graph.ordinalOf.get(a.conceptId)!, graph.ordinalOf.get(b.conceptId)!));
  return entries;
}
