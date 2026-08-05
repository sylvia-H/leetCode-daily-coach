// buildSite() 組裝入口（site-build-contract.md）：純函式，唯一被 scripts/build-pages.ts 呼叫。
// US1 組裝 index.html；US2 擴充 articles/*.html；feed*.xml（US3）由後續 Phase 擴充本檔案。
import { readArticleCached, type CompilerDeps } from "../compiler/lesson.js";
import { TRACK_ORDER } from "../config.js";
import type { AppState } from "../state/state-store.js";
import type { Track } from "../types/lesson.js";
import { buildArticlePageView, renderArticlePage } from "./article-page.js";
import { buildCurriculumEntries, buildTrackProgress, computeUnlockedConceptIds, type TrackProgressView } from "./curriculum-view.js";
import { renderDashboard, TRACK_LABELS } from "./dashboard.js";
import { buildSiteFeed, buildTrackFeed, serializeFeed, type FeedView } from "./feed.js";

export interface SiteBuildInput {
  /**
   * 由 loadCompilerDeps() 原封傳入（graph／bank／schedules／readArticle／articleCache）。
   * MUST NOT 另立名為 readArticle 的欄位——會與 CompilerDeps.readArticle 同名不同型
   * （data-model.md §5）。
   */
  deps: CompilerDeps;
  state: AppState;
  /** 目前啟用（有設定 webhook）的 Track；由呼叫端以 parseWebhooks(env) 算出。 */
  enabledTracks: Track[];
  baseUrl: string;
}

/** relative output path → file content；I/O 寫檔由 scripts/build-pages.ts 負責。 */
export type SiteOutput = Map<string, string>;

// data-model.md §5：per-track feed 檔名判準 MUST 為 state.tracks 中已知的 Track，MUST NOT 為
// enabledTracks——Track 被停用後既有訂閱者不得收到 404。
const TRACK_FEED_FILE: Record<Track, string> = {
  foundation: "feed-foundation.xml",
  interviewReady: "feed-interview-ready.xml",
  interviewMastery: "feed-interview-mastery.xml",
};

export function buildSite(input: SiteBuildInput): SiteOutput {
  const { deps, state, enabledTracks, baseUrl } = input;

  const unlockedIds = computeUnlockedConceptIds(state);

  const trackProgress: TrackProgressView[] = enabledTracks.map((track) => {
    const trackState = state.tracks[track];
    if (!trackState) {
      throw new Error(`buildSite：enabledTracks 中的 Track「${track}」在 state 中找不到對應進度`);
    }
    return buildTrackProgress(track, trackState, deps.graph, deps.schedules[track], baseUrl);
  });

  const curriculum = buildCurriculumEntries(deps.graph, unlockedIds, trackProgress, baseUrl);

  const output: SiteOutput = new Map();
  output.set("index.html", renderDashboard({ trackProgress, curriculum }));

  // FR-006／FR-007：每個 unlocked === true 的 Concept 各一份全文閱讀頁。
  for (const conceptId of unlockedIds) {
    const node = deps.graph.concepts.get(conceptId);
    if (!node) continue; // 防禦性：解鎖集合來自 completedConceptIds，理論上必存在於目前 DAG
    const article = readArticleCached(node.articlePath, node.id, deps);
    const view = buildArticlePageView(article, deps.bank);
    output.set(`articles/${conceptId}.html`, renderArticlePage(view));
  }

  // FR-008／FR-015／FR-016：per-track feed（僅 state.tracks 中已知的 Track，非 enabledTracks）+
  // 全站 feed（三軌聯集去重）。
  const knownTracks = TRACK_ORDER.filter((track) => state.tracks[track] !== undefined);
  const trackFeeds: FeedView[] = knownTracks.map((track) =>
    buildTrackFeed(track, state.tracks[track]!, deps.graph, baseUrl),
  );

  const indexUrl = `${baseUrl}/index.html`;
  knownTracks.forEach((track, i) => {
    const channel = {
      title: `LeetCode Daily Coach · ${TRACK_LABELS[track]}`,
      link: indexUrl,
      description: `LeetCode Daily Coach ${TRACK_LABELS[track]} Track 的最新課程發佈`,
    };
    output.set(TRACK_FEED_FILE[track], serializeFeed(trackFeeds[i]!, channel));
  });

  const siteFeed = buildSiteFeed(trackFeeds);
  output.set(
    "feed.xml",
    serializeFeed(siteFeed, {
      title: "LeetCode Daily Coach",
      link: indexUrl,
      description: "LeetCode Daily Coach 全站最新課程發佈",
    }),
  );

  return output;
}
