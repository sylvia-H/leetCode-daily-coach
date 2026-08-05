// feed-contract.md：per-track feed 只收錄該 Track history 中帶 conceptId 的項目；依 pubDate 遞減
// 排序、截斷至 HISTORY_LIMIT（MUST 由 state-store.ts import）；同一 conceptId 至多出現一次；
// guid 穩定；XML entity escape、不使用 CDATA。
import { describe, expect, it } from "vitest";
import { buildSiteFeed, buildTrackFeed, serializeFeed } from "../../src/pages/feed.js";
import { HISTORY_LIMIT, type TrackState } from "../../src/state/state-store.js";
import { makeGraph } from "../../tests/helpers/compiler.js";

const BASE_URL = "https://example.github.io/leetcode-daily-coach";

function makeTrackState(overrides: Partial<TrackState> = {}): TrackState {
  return {
    currentSessionIndex: 1,
    lastPushAt: null,
    completedConceptIds: [],
    history: [],
    ...overrides,
  };
}

describe("buildTrackFeed（feed-contract.md §1／§4／§5）", () => {
  it("只收錄該 Track history 中帶 conceptId 的項目（非 concept 類 Session 不產生項目）", () => {
    const graph = makeGraph([{ id: "concept-a", title: "Concept A" }]);
    const trackState = makeTrackState({
      history: [
        { sessionIndex: 1, conceptId: "concept-a", pushedAt: "2026-08-01T00:00:00.000Z" },
        { sessionIndex: 2, pushedAt: "2026-08-02T00:00:00.000Z" }, // review/practice，無 conceptId
      ],
    });
    const feed = buildTrackFeed("foundation", trackState, graph, BASE_URL);
    expect(feed.items).toHaveLength(1);
    expect(feed.items[0]?.conceptId).toBe("concept-a");
  });

  it("依 pubDate 遞減排序（最新在前）", () => {
    const graph = makeGraph([{ id: "a" }, { id: "b" }, { id: "c" }]);
    const trackState = makeTrackState({
      history: [
        { sessionIndex: 1, conceptId: "a", pushedAt: "2026-08-01T00:00:00.000Z" },
        { sessionIndex: 2, conceptId: "b", pushedAt: "2026-08-03T00:00:00.000Z" },
        { sessionIndex: 3, conceptId: "c", pushedAt: "2026-08-02T00:00:00.000Z" },
      ],
    });
    const feed = buildTrackFeed("foundation", trackState, graph, BASE_URL);
    expect(feed.items.map((i) => i.conceptId)).toEqual(["b", "c", "a"]);
  });

  it("截斷至 HISTORY_LIMIT（與 state-store.ts 的 history 上限同源）", () => {
    const concepts = Array.from({ length: HISTORY_LIMIT + 10 }, (_, i) => ({ id: `c${i}` }));
    const graph = makeGraph(concepts);
    const history = concepts.map((c, i) => ({
      sessionIndex: i + 1,
      conceptId: c.id,
      pushedAt: `2026-08-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
    }));
    const trackState = makeTrackState({ history });
    const feed = buildTrackFeed("foundation", trackState, graph, BASE_URL);
    expect(feed.items.length).toBeLessThanOrEqual(HISTORY_LIMIT);
  });

  it("guid（= url）在項目被滾動移除後，仍保留項目的 guid 維持相同字串", () => {
    const graph = makeGraph([{ id: "a" }, { id: "b" }]);
    const before = buildTrackFeed(
      "foundation",
      makeTrackState({
        history: [
          { sessionIndex: 1, conceptId: "a", pushedAt: "2026-08-01T00:00:00.000Z" },
          { sessionIndex: 2, conceptId: "b", pushedAt: "2026-08-02T00:00:00.000Z" },
        ],
      }),
      graph,
      BASE_URL,
    );
    const after = buildTrackFeed(
      "foundation",
      makeTrackState({
        history: [{ sessionIndex: 2, conceptId: "b", pushedAt: "2026-08-02T00:00:00.000Z" }],
      }),
      graph,
      BASE_URL,
    );
    const beforeB = before.items.find((i) => i.conceptId === "b");
    const afterB = after.items.find((i) => i.conceptId === "b");
    expect(afterB?.url).toBe(beforeB?.url);
  });

  it("url 指向全文閱讀頁完整 URL", () => {
    const graph = makeGraph([{ id: "concept-a" }]);
    const trackState = makeTrackState({
      history: [{ sessionIndex: 1, conceptId: "concept-a", pushedAt: "2026-08-01T00:00:00.000Z" }],
    });
    const feed = buildTrackFeed("foundation", trackState, graph, BASE_URL);
    expect(feed.items[0]?.url).toBe(`${BASE_URL}/articles/concept-a.html`);
  });

  it("純函式：同輸入呼叫兩次得到 deep-equal 結果", () => {
    const graph = makeGraph([{ id: "a" }]);
    const trackState = makeTrackState({
      history: [{ sessionIndex: 1, conceptId: "a", pushedAt: "2026-08-01T00:00:00.000Z" }],
    });
    const first = buildTrackFeed("foundation", trackState, graph, BASE_URL);
    const second = buildTrackFeed("foundation", trackState, graph, BASE_URL);
    expect(first).toEqual(second);
  });
});

describe("buildSiteFeed（feed-contract.md §5）", () => {
  it("同一 conceptId 被多軌各自推播過時，去重取最早的 pubDate", () => {
    const graph = makeGraph([{ id: "shared" }]);
    const foundationFeed = buildTrackFeed(
      "foundation",
      makeTrackState({ history: [{ sessionIndex: 1, conceptId: "shared", pushedAt: "2026-08-05T00:00:00.000Z" }] }),
      graph,
      BASE_URL,
    );
    const readyFeed = buildTrackFeed(
      "interviewReady",
      makeTrackState({ history: [{ sessionIndex: 1, conceptId: "shared", pushedAt: "2026-08-01T00:00:00.000Z" }] }),
      graph,
      BASE_URL,
    );
    const siteFeed = buildSiteFeed([foundationFeed, readyFeed]);
    expect(siteFeed.items).toHaveLength(1);
    expect(siteFeed.items[0]?.pubDate).toBe("2026-08-01T00:00:00.000Z");
  });

  it("涵蓋三軌聯集且不重複", () => {
    const graph = makeGraph([{ id: "a" }, { id: "b" }]);
    const foundationFeed = buildTrackFeed(
      "foundation",
      makeTrackState({ history: [{ sessionIndex: 1, conceptId: "a", pushedAt: "2026-08-01T00:00:00.000Z" }] }),
      graph,
      BASE_URL,
    );
    const masteryFeed = buildTrackFeed(
      "interviewMastery",
      makeTrackState({ history: [{ sessionIndex: 1, conceptId: "b", pushedAt: "2026-08-02T00:00:00.000Z" }] }),
      graph,
      BASE_URL,
    );
    const siteFeed = buildSiteFeed([foundationFeed, masteryFeed]);
    expect(siteFeed.items.map((i) => i.conceptId).sort()).toEqual(["a", "b"]);
  });
});

describe("serializeFeed（RSS 2.0，feed-contract.md）", () => {
  const channel = { title: "LeetCode Daily Coach", link: `${BASE_URL}/index.html`, description: "全站最新課程發佈" };

  it("輸出合法 RSS 2.0 XML，含 channel 層級元素", () => {
    const xml = serializeFeed({ scope: { kind: "site" }, items: [] }, channel);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<rss version=\"2.0\">");
    expect(xml).toContain(`<title>${channel.title}</title>`);
    expect(xml).toContain(`<link>${channel.link}</link>`);
  });

  it("item 含 title／link／guid（isPermaLink=true，與 link 相同）／pubDate（RFC 822）", () => {
    const xml = serializeFeed(
      {
        scope: { kind: "track", track: "foundation" },
        items: [
          {
            conceptId: "concept-a",
            title: "Concept A",
            url: `${BASE_URL}/articles/concept-a.html`,
            pubDate: "2026-08-01T00:00:00.000Z",
          },
        ],
      },
      channel,
    );
    expect(xml).toContain("<title>Concept A</title>");
    expect(xml).toContain(`<link>${BASE_URL}/articles/concept-a.html</link>`);
    expect(xml).toContain(`<guid isPermaLink="true">${BASE_URL}/articles/concept-a.html</guid>`);
    expect(xml).toMatch(/<pubDate>\w{3}, \d{2} \w{3} \d{4} \d{2}:\d{2}:\d{2} GMT<\/pubDate>/);
  });

  it("文字節點經 XML entity escape，不使用 CDATA", () => {
    const xml = serializeFeed(
      {
        scope: { kind: "site" },
        items: [
          {
            conceptId: "xss",
            title: "<script>&\"'</script>",
            url: `${BASE_URL}/articles/xss.html`,
            pubDate: "2026-08-01T00:00:00.000Z",
          },
        ],
      },
      channel,
    );
    expect(xml).not.toContain("<script>&\"'</script>");
    expect(xml).not.toContain("CDATA");
    expect(xml).toContain("&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;");
  });

  it("連續兩次呼叫（輸入不變）產出逐 byte 相同的 XML", () => {
    const view = {
      scope: { kind: "site" as const },
      items: [
        { conceptId: "a", title: "A", url: `${BASE_URL}/articles/a.html`, pubDate: "2026-08-01T00:00:00.000Z" },
      ],
    };
    expect(serializeFeed(view, channel)).toBe(serializeFeed(view, channel));
  });
});
