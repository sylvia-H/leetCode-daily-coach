// SC-001／SC-002／FR-005a：儀表板三種 Track 狀態呈現、頁面不含任何時間戳字串、
// 未解鎖 Concept 在課綱視圖中零可點連結。
import { describe, expect, it } from "vitest";
import { renderDashboard } from "../../src/pages/dashboard.js";
import type { CurriculumEntryView, TrackProgressView } from "../../src/pages/curriculum-view.js";

const ISO_TIMESTAMP_PATTERN = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

describe("renderDashboard", () => {
  it("Track 尚未開始（not-started）顯示「尚未開始」，不報錯", () => {
    const trackProgress: TrackProgressView[] = [
      { track: "interviewReady", status: "not-started", completedConceptCount: 0, totalConceptCount: 10 },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).toContain("尚未開始");
  });

  it("Track 已完課（completed）顯示「已完課」，不呈現今日課程欄位", () => {
    const trackProgress: TrackProgressView[] = [
      { track: "interviewMastery", status: "completed", completedConceptCount: 10, totalConceptCount: 10 },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).toContain("已完課");
    expect(html).not.toContain("今日課程");
  });

  it("Track 進行中（in-progress）顯示目前進度與今日課程（concept 類，含可點連結）", () => {
    const trackProgress: TrackProgressView[] = [
      {
        track: "foundation",
        status: "in-progress",
        completedConceptCount: 3,
        totalConceptCount: 10,
        currentOrdinalConceptId: "concept-a",
        lastSession: {
          sessionIndex: 3,
          type: "concept",
          pushedAt: "2026-08-01T00:00:00.000Z",
          conceptId: "concept-a",
          conceptTitle: "Concept A 標題",
          articleUrl: "https://example.github.io/repo/articles/concept-a.html",
        },
      },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).toContain("今日課程");
    expect(html).toContain("Concept A 標題");
    expect(html).toContain('href="https://example.github.io/repo/articles/concept-a.html"');
  });

  it("今日課程為非 concept 類 Session 時顯示固定標籤，不虛構 Concept 連結", () => {
    const trackProgress: TrackProgressView[] = [
      {
        track: "foundation",
        status: "in-progress",
        completedConceptCount: 3,
        totalConceptCount: 10,
        lastSession: { sessionIndex: 4, type: "review", pushedAt: "2026-08-02T00:00:00.000Z" },
      },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).toContain("複習");
  });

  it("今日課程附上該 Session 的 sessionIndex（research R10）", () => {
    const trackProgress: TrackProgressView[] = [
      {
        track: "foundation",
        status: "in-progress",
        completedConceptCount: 3,
        totalConceptCount: 10,
        lastSession: {
          sessionIndex: 42,
          type: "concept",
          pushedAt: "2026-08-01T00:00:00.000Z",
          conceptId: "concept-a",
          conceptTitle: "Concept A 標題",
          articleUrl: "https://example.github.io/repo/articles/concept-a.html",
        },
      },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).toContain("第 42 課");
  });

  it("concept 類但缺 conceptTitle／articleUrl 時顯示中文標籤，MUST NOT 印出英文 token", () => {
    const trackProgress: TrackProgressView[] = [
      {
        track: "foundation",
        status: "in-progress",
        completedConceptCount: 3,
        totalConceptCount: 10,
        lastSession: { sessionIndex: 5, type: "concept", pushedAt: "2026-08-02T00:00:00.000Z" },
      },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).toContain("觀念課");
    expect(html).not.toMatch(/第 5 課 · concept/);
  });

  it("課綱視圖標示各已啟用 Track 目前的進度位置（FR-005／atTrackPositions）", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "here",
        title: "目前所在 Concept",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: true,
        articleUrl: "https://example.github.io/repo/articles/here.html",
        atTrackPositions: ["foundation", "interviewReady"],
      },
      {
        conceptId: "elsewhere",
        title: "其他 Concept",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: true,
        articleUrl: "https://example.github.io/repo/articles/elsewhere.html",
        atTrackPositions: [],
      },
    ];
    const html = renderDashboard({ trackProgress: [], curriculum });
    expect(html).toMatch(/目前所在 Concept[\s\S]{0,160}Foundation \/ Interview Ready 目前位置/);
    // 沒有 Track 落在此處的條目 MUST NOT 出現標記
    expect(html).not.toMatch(/其他 Concept[\s\S]{0,160}目前位置/);
  });

  it("頁面不含任何 ISO 8601 時間戳字串（不顯示 pushedAt 原文）", () => {
    const trackProgress: TrackProgressView[] = [
      {
        track: "foundation",
        status: "in-progress",
        completedConceptCount: 1,
        totalConceptCount: 5,
        lastSession: {
          sessionIndex: 1,
          type: "concept",
          pushedAt: "2026-08-01T00:00:00.000Z",
          conceptId: "concept-a",
          conceptTitle: "Concept A",
          articleUrl: "https://example.github.io/repo/articles/concept-a.html",
        },
      },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).not.toMatch(ISO_TIMESTAMP_PATTERN);
  });

  it("課綱視圖：未解鎖項目為純文字、無可點連結；已解鎖項目有連結", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "locked-concept",
        title: "未解鎖的 Concept",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: false,
        atTrackPositions: [],
      },
      {
        conceptId: "unlocked-concept",
        title: "已解鎖的 Concept",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: true,
        articleUrl: "https://example.github.io/repo/articles/unlocked-concept.html",
        atTrackPositions: [],
      },
    ];
    const html = renderDashboard({ trackProgress: [], curriculum });
    // 未解鎖項目的標題不得出現在任何 <a href> 標籤內
    expect(html).toMatch(/未解鎖的 Concept[\s\S]{0,80}未解鎖/);
    expect(html).not.toMatch(/<a[^>]*>[^<]*未解鎖的 Concept/);
    expect(html).toContain('href="https://example.github.io/repo/articles/unlocked-concept.html"');
  });

  it("零 Track 時（trackProgress 為空陣列）不報錯，課綱視圖仍完整輸出", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "c",
        title: "C",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: false,
        atTrackPositions: [],
      },
    ];
    expect(() => renderDashboard({ trackProgress: [], curriculum })).not.toThrow();
    const html = renderDashboard({ trackProgress: [], curriculum });
    expect(html).toContain("C");
  });

  it("Concept 標題內容經 HTML escape", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "xss",
        title: "<script>alert(1)</script>",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: false,
        atTrackPositions: [],
      },
    ];
    const html = renderDashboard({ trackProgress: [], curriculum });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("為合法的 HTML5 文件（含 <!doctype html>）", () => {
    const html = renderDashboard({ trackProgress: [], curriculum: [] });
    expect(html.trim().toLowerCase().startsWith("<!doctype html>")).toBe(true);
  });

  it("純函式：同輸入呼叫兩次得到逐字元相同的輸出", () => {
    const trackProgress: TrackProgressView[] = [
      { track: "foundation", status: "not-started", completedConceptCount: 0, totalConceptCount: 5 },
    ];
    const first = renderDashboard({ trackProgress, curriculum: [] });
    const second = renderDashboard({ trackProgress, curriculum: [] });
    expect(first).toBe(second);
  });
});

describe("renderDashboard — F11 課綱清單 quiz 連結（FR-017、SC-011、pages-quiz.md §6）", () => {
  it("quizUrl 存在時，輸出 .divider 與 .quiz-chip 連結", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "unlocked-concept",
        title: "已解鎖的 Concept",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: true,
        articleUrl: "https://example.github.io/repo/articles/unlocked-concept.html",
        quizUrl: "https://example.github.io/repo/quiz/unlocked-concept.html",
        atTrackPositions: [],
      },
    ];
    const html = renderDashboard({ trackProgress: [], curriculum });
    expect(html).toContain('<span class="divider">|</span>');
    expect(html).toContain('<a class="quiz-chip" href="https://example.github.io/repo/quiz/unlocked-concept.html">✍️ 小測</a>');
  });

  it("quizUrl 缺席時不輸出 .divider / .quiz-chip", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "unlocked-concept",
        title: "已解鎖的 Concept",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: true,
        articleUrl: "https://example.github.io/repo/articles/unlocked-concept.html",
        atTrackPositions: [],
      },
    ];
    const html = renderDashboard({ trackProgress: [], curriculum });
    const curriculumSection = html.slice(html.indexOf('<section id="curriculum">'));
    expect(curriculumSection).not.toContain("divider");
    expect(curriculumSection).not.toContain("quiz-chip");
  });

  it("未解鎖項目（無 articleUrl）即使帶 quizUrl 也不輸出連結（結構上 quizUrl 不會出現，但驗證呈現不誤觸）", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "locked-concept",
        title: "未解鎖的 Concept",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: false,
        atTrackPositions: [],
      },
    ];
    const html = renderDashboard({ trackProgress: [], curriculum });
    const curriculumSection = html.slice(html.indexOf('<section id="curriculum">'));
    expect(curriculumSection).not.toContain("quiz-chip");
  });

  it("quizUrl 動態文字經 escapeHtml", () => {
    const curriculum: CurriculumEntryView[] = [
      {
        conceptId: "xss",
        title: "T",
        moduleId: "m",
        moduleTitle: "M",
        topicId: "t",
        topicTitle: "T",
        unlocked: true,
        articleUrl: "https://example.github.io/repo/articles/xss.html",
        quizUrl: 'https://example.github.io/repo/quiz/xss.html?x="><script>alert(1)</script>',
        atTrackPositions: [],
      },
    ];
    const html = renderDashboard({ trackProgress: [], curriculum });
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("今日課程欄位（renderTodaySession／LastSessionView）不受本節變更影響", () => {
    const trackProgress: TrackProgressView[] = [
      {
        track: "foundation",
        status: "in-progress",
        completedConceptCount: 3,
        totalConceptCount: 10,
        lastSession: {
          sessionIndex: 3,
          type: "concept",
          pushedAt: "2026-08-01T00:00:00.000Z",
          conceptId: "concept-a",
          conceptTitle: "Concept A 標題",
          articleUrl: "https://example.github.io/repo/articles/concept-a.html",
        },
      },
    ];
    const html = renderDashboard({ trackProgress, curriculum: [] });
    expect(html).toContain("今日課程");
    expect(html).toContain("Concept A 標題");
    expect(html).not.toContain('<a class="quiz-chip"');
  });
});
