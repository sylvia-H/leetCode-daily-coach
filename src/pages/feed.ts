// FeedItemView／FeedView 導出 + RSS 2.0 XML 序列化（research R3／R4、feed-contract.md）。
// 純函式，不讀 Date.now()；上限一律 import HISTORY_LIMIT（MUST NOT 另行宣告一個 30，FR-016）。
import { HISTORY_LIMIT, type TrackState } from "../state/state-store.js";
import type { CurriculumGraph } from "../types/curriculum.js";
import type { Track } from "../types/lesson.js";
import { escapeXml } from "./html.js";

export interface FeedItemView {
  conceptId: string;
  title: string;
  url: string;
  pubDate: string;
}

export type FeedScope = { kind: "site" } | { kind: "track"; track: Track };

export interface FeedView {
  scope: FeedScope;
  items: FeedItemView[];
}

function articleUrl(baseUrl: string, conceptId: string): string {
  return `${baseUrl}/articles/${conceptId}.html`;
}

function sortByPubDateDesc(items: FeedItemView[]): FeedItemView[] {
  return [...items].sort((a, b) => (a.pubDate < b.pubDate ? 1 : a.pubDate > b.pubDate ? -1 : 0));
}

/** feed-contract.md §1／§4／§5：per-track feed 只收錄該 Track history 中帶 conceptId 的項目。 */
export function buildTrackFeed(
  track: Track,
  trackState: TrackState,
  graph: CurriculumGraph,
  baseUrl: string,
): FeedView {
  const seen = new Set<string>();
  const items: FeedItemView[] = [];

  for (const entry of trackState.history) {
    if (entry.conceptId === undefined) continue;
    if (seen.has(entry.conceptId)) continue; // 同一 conceptId 至多出現一次（FR-009／FR-010）
    const node = graph.concepts.get(entry.conceptId);
    if (!node) continue; // 防禦性：history 中的 conceptId 理論上必存在於目前 DAG
    seen.add(entry.conceptId);
    items.push({
      conceptId: entry.conceptId,
      title: node.title,
      url: articleUrl(baseUrl, entry.conceptId),
      pubDate: entry.pushedAt,
    });
  }

  return { scope: { kind: "track", track }, items: sortByPubDateDesc(items).slice(0, HISTORY_LIMIT) };
}

/** 全站 feed = 三軌 feed 項目依 conceptId 去重（取最早 pubDate）後的聯集，同上限截斷。 */
export function buildSiteFeed(trackFeeds: FeedView[]): FeedView {
  const byConceptId = new Map<string, FeedItemView>();
  for (const feed of trackFeeds) {
    for (const item of feed.items) {
      const existing = byConceptId.get(item.conceptId);
      if (!existing || item.pubDate < existing.pubDate) {
        byConceptId.set(item.conceptId, item);
      }
    }
  }
  const items = sortByPubDateDesc([...byConceptId.values()]).slice(0, HISTORY_LIMIT);
  return { scope: { kind: "site" }, items };
}

/** ISO 8601 → RFC 822（RSS 2.0 <pubDate> 規定格式）。輸入為既有記錄的時間戳，非讀取當下時間。 */
function toRfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

export interface FeedChannelMeta {
  title: string;
  link: string;
  description: string;
}

function serializeItem(item: FeedItemView): string {
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <pubDate>${toRfc822(item.pubDate)}</pubDate>
    </item>`;
}

export function serializeFeed(view: FeedView, channel: FeedChannelMeta): string {
  const itemsXml = view.items.map(serializeItem).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>zh-TW</language>
${itemsXml}
  </channel>
</rss>
`;
}
