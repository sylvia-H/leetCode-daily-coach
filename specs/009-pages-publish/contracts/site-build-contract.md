# Contract: 站台建置純函式（`buildSite`）

**Feature**: 009-pages-publish | **實作位置**: `src/pages/**`（純函式，唯一被 `scripts/build-pages.ts`
呼叫）
**對應**: FR-002／FR-003～FR-007／FR-005a／FR-014／SC-007、憲章 IX（Build-time over Runtime）、
憲章 XI（Renderer 不知道 Curriculum——本契約刻意不套用此原則，見 §0 說明）

---

## 0. 與憲章 XI 的關係（不適用，非違反）

憲章 XI「Renderer 不知道 Curriculum」規範的是 **Discord Lesson Renderer**（`src/renderer/discord.ts`）：
它只認得 `Lesson`，不得讀 Curriculum／課表／state。`buildSite` 是**另一個渲染器**，服務完全不同的輸出
（公開網站，而非 Discord embeds），且 FR-002／FR-005 明文要求它必須呈現課綱順序與 Track 進度——這正是
Discord Renderer 被禁止知道的東西。兩者是同一 `Lesson Compiler` 產出鏈上的**平行消費者**，不是同一份
Renderer 被破壞原則。**不變式**：`buildSite` MUST NOT 反向修改 `AppState`／`CurriculumGraph`／
`TrackSchedule`（唯讀消費），且 MUST NOT 被 `src/compiler/lesson.ts` 或 `src/renderer/discord.ts` 引用
（單向依賴，避免 Discord 推播路徑意外牽扯進 Pages 邏輯）。

---

## 1. 介面

```ts
// src/pages/site.ts
export function buildSite(input: SiteBuildInput): SiteOutput;
```

型別定義見 [data-model.md](../data-model.md) §5。子模組建議切分（`/speckit-tasks` 可依此拆任務，非強制
單檔）：

| 模組 | 職責 |
| --- | --- |
| `src/pages/curriculum-view.ts` | `TrackProgressView`／`CurriculumEntryView` 導出（R8／R9／R10） |
| `src/pages/article-page.ts` | `ArticlePageView` 導出 + HTML 渲染（R2） |
| `src/pages/feed.ts` | `FeedItemView`／`FeedView` 導出 + RSS XML 序列化（R3／R4） |
| `src/pages/dashboard.ts` | 儀表板 HTML 渲染（消費 `TrackProgressView[]` + `CurriculumEntryView[]`） |
| `src/pages/html.ts` | 共用 HTML escape／layout helper（見 §3） |
| `src/pages/site.ts` | 上述模組的組裝入口，輸出 `SiteOutput`（唯一被 `scripts/build-pages.ts` 呼叫的函式） |

## 2. 純函式性（SC-007）

| 要求 | 等級 |
| --- | --- |
| `buildSite` 與其全部子函式 MUST NOT 讀 `Date.now()` / `new Date()`（不含輸入內已有的 ISO 字串） | MUST |
| MUST NOT 讀環境變數（`baseUrl` 等一律由呼叫端經 `SiteBuildInput` 參數傳入，research R7） | MUST |
| MUST NOT 做任何隨機取樣或依賴 `Map`/`Set` 疊代序以外的不穩定順序（輸出前一律顯式排序，見各 view 的
  排序鍵） | MUST |
| 同一 `SiteBuildInput`（deep-equal）呼叫兩次 MUST 得到兩個 `SiteOutput`，其中相同鍵的字串值逐 byte 相同 | MUST |
| `tests/unit/pages-site-determinism.test.ts` MUST 以「同輸入呼叫 100 次、全部 deep-equal」驗證此不變式（沿用 F8 `SC-004` 100 次重複編譯的既有驗證模式） | MUST |

## 3. HTML 渲染的共同規則

| 要求 | 等級 | 理由 |
| --- | --- | --- |
| 任何插入 HTML 的動態文字（Concept 標題、Module 名稱等）MUST 經 HTML entity escape（`&<>"'`） | MUST | Article／Curriculum 內容雖為凍結產物，仍是外部檔案輸入；escape 是防禦性最低成本，不可省略 |
| `marked.parse()` 的輸出（已是 HTML）MUST NOT 再次 escape | MUST | 重複 escape 會讓 `&amp;` 變 `&amp;amp;` |
| 頁面 MUST NOT 內嵌任何 JavaScript（純靜態展示，無需互動；Assumptions 已排除互動式知識圖譜） | MUST | 縮小攻擊面、維持零建置管線 |
| 頁面 `<head>` 的 `<style>` MUST 內嵌（不引入外部 CSS 檔案或 CDN） | MUST | 憲章 XVI：零額外請求、零 CDN 相依 |
| 每個輸出檔案 MUST 為合法獨立的 HTML5 文件（含 `<!doctype html>`），可直接以檔案系統路徑對應 URL 開啟 | MUST | FR-013 穩定網址 |

## 4. 全文閱讀頁的組裝規則（research R2）

| 要求 | 等級 |
| --- | --- |
| 固定區塊 MUST 依 [data-model.md](../data-model.md) §3 列出的順序渲染，缺席的區塊（理論上不會發生，`parseArticle` 已在 Compiler 讀取階段對缺席固定區塊 fail loud）MUST NOT 靜默省略——若發生視為呼叫端未通過既有 Gate，應 throw | MUST |
| `ArticleContent` MUST 由既有 export 函式 `readArticleCached(node.articlePath, node.id, input.deps)` 取得（與 `compile()` 同一條讀檔路徑、共用 `deps.articleCache`）；MUST NOT 在 `SiteBuildInput` 另立名為 `readArticle` 的欄位（會與 `CompilerDeps.readArticle: (path) => string` 同名不同型，見 [data-model.md](../data-model.md) §5） | MUST |
| 各區塊原文 MUST 由 `parseSections(article.rawContent)`（重新呼叫 `content.ts` 既有 export 函式，research R12）取得；MUST NOT 使用 `article.conceptBody`（F7 為字數 Gate 合併的單一字串），MUST NOT 為此在 `ArticleContent` 新增欄位 | MUST |
| `Today's Challenge` MUST NOT 直接渲染其 markdown 原文；MUST 改為對 `article.challenge` 全部題號（依 id 升冪）逐題向 Problem Bank 查回 title／url／difficulty，查無對應題號視為資料完整性錯誤並 throw（不得靜默省略該題） | MUST |
| `Digest`／`TypeScript Tip`／`Python Tip` MUST NOT 出現在全文閱讀頁 | MUST |

## 5. 課綱視圖與解鎖判定（research R8／R9）

| 要求 | 等級 |
| --- | --- |
| 解鎖集合 MUST 為三個已知 Track（`state.tracks` 中存在者，不限 `enabledTracks`）`completedConceptIds` 的聯集 | MUST |
| `CurriculumEntryView.unlocked === false` 的項目 MUST NOT 帶有 `articleUrl` 欄位（渲染層據此判斷是否輸出連結，FR-005a 零 404 保證） | MUST |
| 排序鍵 MUST 為 `(moduleIndex, topicIndex, localOrder, conceptId)`，語意與 `src/compiler/lesson.ts` 內部 `cmpOrdinal` **完全一致**。註：`cmpOrdinal` 在 `curriculum.ts`／`lesson.ts`／`material.ts` 各有一份**未 export 的私有複本**，`src/pages/**` MUST 比照此既有慣例自帶一份（不 export、不改動既有三個檔案）；此為 F9 範圍收斂的刻意決定，收斂重複比較器屬 F9 範圍外的重構 | MUST |
| 上述比較器所需的 `Ordinal` MUST 取自 `graph.ordinalOf`（既有欄位）或既有 export 函式 `computeOrdinal()`，MUST NOT 自行從 `ConceptNode` 重算 module／topic 索引 | MUST |
| Track 的「目前進度位置」標記 MUST 為該 Track `completedConceptIds` 中上述排序鍵最大者 | MUST |

## 6. Feed 序列化（research R3／R4，詳見 [feed-contract.md](./feed-contract.md)）

`buildSite` 對 feed 的職責僅止於產出 `FeedView`（資料層）；XML 序列化規則獨立於
[feed-contract.md](./feed-contract.md)，此處僅重申資料層不變式：

| 要求 | 等級 |
| --- | --- |
| Per-Track feed 的 `items` MUST 只含該 Track `history` 中帶 `conceptId` 的項目 | MUST |
| 全站 feed 的 `items` MUST 為三軌 feed 項目依 `conceptId` 去重（同一 Concept 取最早 `pubDate`）後的聯集 | MUST |
| 兩者 MUST 依上限截斷（現行 30，與 `HISTORY_LIMIT` 同源） | MUST |

## 7. 反向約束（防止實作漂移）

| MUST NOT | 理由 |
| --- | --- |
| 在 `src/pages/**` 內 import `@google/genai` 或呼叫任何網路 API | 憲章 VIII；既有 `tests/unit/no-llm-in-src.test.ts` 掃描整個 `src/` 樹，新檔案自動受檢，MUST NOT 另開豁免 |
| 在 `src/pages/**` 內讀取或寫入 `state` 分支以外的持久化狀態、或新增任何檔案作為「上次建置結果」的快取 | FR-014：發佈階段 MUST 為完全 stateless。此約束由 `tests/unit/pages-stateless-guard.test.ts` 自動守（掃描 `src/pages/**` 不得出現 `node:fs`／`fs` import 或 `writeFileSync`／`readFileSync`），比照既有 `no-llm-in-src.test.ts` 的守門測試模式 |
| 讓 `src/renderer/discord.ts` 或 `src/compiler/lesson.ts` import `src/pages/**` 任何模組 | 維持單向依賴，Discord 推播路徑不牽涉 Pages 邏輯 |
| 把 repo 可見性偵測（`gh api` 呼叫）寫進 `src/pages/**` 或 `scripts/build-pages.ts` | research R5：偵測完全在 workflow 層，`build-pages.ts` 被呼叫時即代表已確認為 public |
