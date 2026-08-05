# Contract: RSS Feed 序列化

**Feature**: 009-pages-publish | **實作位置**: `src/pages/feed.ts`
**對應**: FR-008／FR-009／FR-015／FR-016、research R3／R4

---

## 1. 格式：RSS 2.0（research R3 定案，非 Atom）

每份 feed（全站 1 份 + **每個 `state.tracks` 中已知的 Track** 1 份，非 `enabledTracks`——見
[data-model.md](../data-model.md) §5 輸出檔案清單）為一份獨立的 RSS 2.0 XML 文件，`Content-Type` 由
GitHub Pages 依副檔名 `.xml` 提供，不需額外設定。

## 2. Channel 層級元素

| 元素 | 值 | 等級 |
| --- | --- | --- |
| `<title>` | 全站：「LeetCode Daily Coach」；per-Track：「LeetCode Daily Coach · {track 顯示名稱}」 | MUST |
| `<link>` | 對應 `index.html` 的完整 URL | MUST |
| `<description>` | 固定文案，說明本 feed 範疇（全站／該 Track） | MUST |
| `<language>` | `zh-TW` | SHOULD |

## 3. Item 元素（每個 `FeedItemView` 一筆）

| 元素 | 值 | 等級 |
| --- | --- | --- |
| `<title>` | `FeedItemView.title`（HTML/XML entity escape） | MUST |
| `<link>` | `FeedItemView.url` | MUST |
| `<guid isPermaLink="true">` | `FeedItemView.url`（與 `<link>` 相同值，research R4） | MUST |
| `<pubDate>` | `FeedItemView.pubDate` 轉為 RFC 822 格式（RSS 2.0 規定格式，非原始 ISO 8601 字串） | MUST |

## 4. 排序與截斷（FR-016）

| 要求 | 等級 |
| --- | --- |
| `items` MUST 依 `pubDate` **遞減**排序後輸出（最新項目在前，reader 慣例） | MUST |
| 每份 feed 的項目數 MUST 截斷至上限（現行 30）。此上限 MUST 由 `src/state/state-store.ts` **import** `HISTORY_LIMIT` 取得（該常數目前未 export，實作 MUST 先改為 `export const`，見 [tasks.md](../tasks.md) T000）；MUST NOT 在 `src/pages/**` 另行宣告一個 30——FR-016 明訂「MUST NOT 另行實作獨立的保留機制」 | MUST |
| 截斷 MUST 保留「最新的 N 筆」（依 `pubDate` 排序後取前 N），MUST NOT 隨機或依插入序截斷 | MUST |

## 5. 穩定性與去重（FR-009／FR-010）

| 要求 | 等級 |
| --- | --- |
| 同一 `conceptId` 在同一份 feed 中 MUST 至多出現一次 | MUST |
| 全站 feed 去重時，同一 `conceptId` 被多軌各自推播過 ⇒ 取三者中最早的 `pubDate`（不變更 `conceptId` 對應的 `guid`） | MUST |
| 項目被滾動移除後，`items` 中仍保留的項目其 `<guid>` MUST 與移除前完全相同的字串 | MUST |
| 連續兩次呼叫（輸入不變）MUST 產出逐 byte 相同的 XML（含元素順序、屬性順序、空白） | MUST |

## 6. XML Escape

| 要求 | 等級 | 理由 |
| --- | --- | --- |
| `<title>` 等文字節點 MUST 對 `& < > ' "` 做 XML entity escape | MUST | Concept 標題等內容雖為凍結產物，仍是外部檔案輸入 |
| MUST NOT 使用 CDATA 包裹以規避 escape（除非該欄位本就允許任意 HTML，本專案的 `<title>` 為純文字，不需要） | MUST | 避免兩套跳脫策略並存造成不一致 |

## 7. 反向約束

| MUST NOT | 理由 |
| --- | --- |
| 引入第三方 RSS/XML 產生器套件（如 `feed`、`rss`） | 本專案僅需 3～4 份簡單 XML，手寫序列化函式即可，避免新增相依（憲章 XVI 精神） |
| 在 item 中輸出任何「建置時間」欄位 | 破壞 SC-007 byte-identical；`pubDate` 只能來自 `history` 中真實的 `pushedAt` |
| 為 feed 新增 `<lastBuildDate>` 等會隨執行時間變動的 channel 層級欄位 | 同上，會讓兩次無變更執行的輸出不再逐 byte 相同 |
