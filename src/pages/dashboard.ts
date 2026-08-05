// 儀表板 HTML 渲染（SC-001／SC-002／FR-003～FR-005／FR-005a）。消費 T006 的 TrackProgressView[] /
// CurriculumEntryView[]，純函式；MUST NOT 呈現任何時間戳字串（僅顯示 sessionIndex／type／標題）。
import type { CurriculumEntryView, LastSessionView, TrackProgressView } from "./curriculum-view.js";
import { escapeHtml, renderPage } from "./html.js";
import type { SessionType, Track } from "../types/lesson.js";

const TRACK_LABELS: Record<Track, string> = {
  foundation: "Foundation",
  interviewReady: "Interview Ready",
  interviewMastery: "Interview Mastery",
};

const NON_CONCEPT_SESSION_LABELS: Partial<Record<SessionType, string>> = {
  practice: "練習",
  review: "複習週",
  challenge: "挑戰",
  rest: "休息日",
};

function renderTodaySession(session: LastSessionView): string {
  if (session.type === "concept" && session.conceptTitle !== undefined && session.articleUrl !== undefined) {
    return `<a href="${escapeHtml(session.articleUrl)}">${escapeHtml(session.conceptTitle)}</a>`;
  }
  const label = NON_CONCEPT_SESSION_LABELS[session.type] ?? session.type;
  return escapeHtml(label);
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

function renderCurriculumEntry(entry: CurriculumEntryView): string {
  const inner =
    entry.unlocked && entry.articleUrl !== undefined
      ? `<a href="${escapeHtml(entry.articleUrl)}">${escapeHtml(entry.title)}</a>`
      : `${escapeHtml(entry.title)} <span class="badge">未解鎖</span>`;
  return `<li class="curriculum-entry${entry.unlocked ? "" : " locked"}">${inner}</li>`;
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
