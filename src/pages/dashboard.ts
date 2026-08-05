// 儀表板 HTML 渲染（SC-001／SC-002／FR-003～FR-005／FR-005a）。消費 T006 的 TrackProgressView[] /
// CurriculumEntryView[]，純函式；MUST NOT 呈現任何時間戳字串（僅顯示 sessionIndex／type／標題）。
import type { CurriculumEntryView, LastSessionView, TrackProgressView } from "./curriculum-view.js";
import { escapeHtml, renderPage } from "./html.js";
import type { SessionType, Track } from "../types/lesson.js";

export const TRACK_LABELS: Record<Track, string> = {
  foundation: "Foundation",
  interviewReady: "Interview Ready",
  interviewMastery: "Interview Mastery",
};

// research R10：非 concept 類 Session 的固定標籤。`concept` 亦列入——當 concept 類 Session 的
// conceptId 缺席（課表重跑後該 sessionIndex 的 type 改變）或該 conceptId 已不在 DAG 時，fallback
// MUST NOT 讓未翻譯的英文 token 外洩到公開頁面（FR-004：MUST NOT 以誤導性文字呈現）。
const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  concept: "觀念課",
  practice: "練習",
  review: "複習週",
  challenge: "挑戰",
  rest: "休息日",
};

function renderTodaySession(session: LastSessionView): string {
  // research R10：concept 類顯示 Concept 標題並連結全文頁；其餘顯示固定中文標籤，一律附 sessionIndex。
  const prefix = `第 ${session.sessionIndex} 課 · `;
  if (session.type === "concept" && session.conceptTitle !== undefined && session.articleUrl !== undefined) {
    return `${prefix}<a href="${escapeHtml(session.articleUrl)}">${escapeHtml(session.conceptTitle)}</a>`;
  }
  return `${prefix}${escapeHtml(SESSION_TYPE_LABELS[session.type])}`;
}

function renderTrackCard(view: TrackProgressView): string {
  const label = TRACK_LABELS[view.track];

  if (view.status === "not-started") {
    return `<div class="track-card" data-status="not-started">
<h2>${escapeHtml(label)}</h2>
<p>尚未開始</p>
</div>`;
  }

  if (view.status === "completed") {
    return `<div class="track-card" data-status="completed">
<h2>${escapeHtml(label)}</h2>
<p>已完課</p>
<p>已解鎖 ${view.completedConceptCount} / ${view.totalConceptCount} 個 Concept</p>
</div>`;
  }

  const todayHtml = view.lastSession ? renderTodaySession(view.lastSession) : "";
  return `<div class="track-card" data-status="in-progress">
<h2>${escapeHtml(label)}</h2>
<p>已解鎖 ${view.completedConceptCount} / ${view.totalConceptCount} 個 Concept</p>
<p>今日課程：${todayHtml}</p>
</div>`;
}

// FR-005／site-build-contract.md §5：在課綱順序中標示各已啟用 Track 目前的進度位置。
// `atTrackPositions` 的順序由 buildCurriculumEntries 依 trackProgress（TRACK_ORDER）決定，此處不重排。
function renderTrackPositionMarker(tracks: Track[]): string {
  if (tracks.length === 0) return "";
  const labels = tracks.map((track) => TRACK_LABELS[track]).join(" / ");
  return ` <span class="badge track-marker">${escapeHtml(labels)} 目前位置</span>`;
}

function renderCurriculumEntry(entry: CurriculumEntryView): string {
  const inner =
    entry.unlocked && entry.articleUrl !== undefined
      ? `<a href="${escapeHtml(entry.articleUrl)}">${escapeHtml(entry.title)}</a>`
      : `${escapeHtml(entry.title)} <span class="badge">未解鎖</span>`;
  return `<li class="curriculum-entry${entry.unlocked ? "" : " locked"}">${inner}${renderTrackPositionMarker(entry.atTrackPositions)}</li>`;
}

export interface DashboardInput {
  trackProgress: TrackProgressView[];
  curriculum: CurriculumEntryView[];
}

export function renderDashboard(input: DashboardInput): string {
  const trackSection =
    input.trackProgress.length > 0
      ? input.trackProgress.map(renderTrackCard).join("\n")
      : "<p>目前沒有已啟用的 Track。</p>";

  const curriculumSection =
    input.curriculum.length > 0
      ? `<ol>${input.curriculum.map(renderCurriculumEntry).join("\n")}</ol>`
      : "<p>課綱尚無任何 Concept。</p>";

  const body = `<h1>LeetCode Daily Coach</h1>
<section id="tracks">
${trackSection}
</section>
<section id="curriculum">
<h2>課綱順序</h2>
${curriculumSection}
</section>`;

  return renderPage({ title: "LeetCode Daily Coach", bodyHtml: body });
}
