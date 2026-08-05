# Data Model: Pages Publish

本文件定義 F9 新增的**衍生 view 型別**（全部由既有真實來源純函式導出，本 Feature 不新增任何持久化欄位，
呼應 research.md R11 與 spec FR-014／FR-017）。既有實體（`AppState`／`TrackState`／`HistoryEntry`、
`CurriculumGraph`／`ConceptNode`、`TrackSchedule`／`SessionPlan`、`ArticleContent`）不變、不擴充，僅列出
本 Feature 讀取的既有欄位子集以標明資料來源。

## 0. 既有真實來源（唯讀，本 Feature 不修改其 schema）

| 型別 | 檔案 | 本 Feature 讀取的欄位 |
| --- | --- | --- |
| `AppState` / `TrackState` | `src/state/state-store.ts` | `currentSessionIndex`、`completedAt`、`completedConceptIds`（R8：解鎖集合來源）、`history`（R10／feed 來源，FR-015） |
| `CurriculumGraph` / `ConceptNode` | `src/types/curriculum.ts` | `concepts`（Map）、`ordinalOf`（R9 排序）、`modules`、`topics`；`ConceptNode.articlePath`（全文頁取用 Article 檔案位置的必要欄位，與 `lesson.ts` `compileConcept()` 同一來源） |
| `TrackSchedule` / `SessionPlan` | `src/types/schedule.ts` | `sessions[].type`／`sessionIndex`／`conceptId`（R10 標籤判斷） |
| `ArticleContent` | `src/compiler/content.ts` | `meta`、`challenge`（R2 結構化重建）、`rawContent`（R12：對此欄位重新呼叫既有 export 函式 `parseSections()`，取回 `Complexity`／`TypeScript Corner`／`Python Corner`／`Tomorrow Preview`，以及各自獨立的 `Concept`／`Thinking`／`Pattern Recognition`／`Common Mistakes`——**MUST NOT** 使用 `conceptBody`，該欄位是 F7 為字數 Gate 合併的單一字串，非全文頁用途）——經 `loadArticle`／`readArticleCached` 取得 |
| `ProblemBank` | `src/types/problem.ts` | `byId`（R2 查回 title／url／difficulty） |

## 1. `TrackProgressView`（儀表板每個已啟用 Track 一筆）

```ts
type TrackStatus = "not-started" | "in-progress" | "completed";

interface LastSessionView {
  sessionIndex: number;
  type: SessionType;              // "concept" | "practice" | "review" | "challenge" | "rest"
  pushedAt: string;                // ISO 8601，取自 HistoryEntry.pushedAt
  conceptId?: string;              // 僅 type === "concept" 時存在
  conceptTitle?: string;           // 同上；由 conceptId 查 graph.concepts 取得
  articleUrl?: string;             // 同上；僅當該 concept 已依 FR-006 解鎖（必然為真，見 research R10）
}

interface TrackProgressView {
  track: Track;
  status: TrackStatus;             // completedAt 存在 → "completed"；history 為空 → "not-started"；否則 "in-progress"
  completedConceptCount: number;   // completedConceptIds.length
  totalConceptCount: number;       // graph.concepts.size（三軌共用同一份 DAG，憲章 VI）
  lastSession?: LastSessionView;   // status === "not-started" 時不存在
  currentOrdinalConceptId?: string; // research R9：completedConceptIds 中 ordinal 最大者，供課綱視圖標記
}
```

**不變式**：
- `status === "completed"` ⇔ `TrackState.completedAt` 非空（§19 既有不變式，本 Feature 不重新定義）。
- `status === "not-started"` ⇔ `TrackState.history.length === 0`（尚無任何成功推播記錄，FR-004）。
- `lastSession` 存在時，`type !== "concept"` ⇒ `conceptId`／`conceptTitle`／`articleUrl` 三者皆不存在
  （research R10：MUST NOT 虛構所屬 Concept）。

## 2. `CurriculumEntryView`（課綱順序視圖，每個 Concept 一筆，FR-005／FR-005a）

```ts
interface CurriculumEntryView {
  conceptId: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
  topicId: string;
  topicTitle: string;
  unlocked: boolean;                // conceptId ∈ 三軌 completedConceptIds 聯集（research R8）
  articleUrl?: string;              // 僅 unlocked 時存在；FR-005a：MUST NOT 對 unlocked=false 產生此欄位
  atTrackPositions: Track[];        // 有哪些已啟用 Track 目前的 currentOrdinalConceptId 落在此 Concept
}
```

**不變式（對應 FR-005a 的零 404 保證）**：
- `unlocked === false` ⇒ `articleUrl === undefined`。渲染層 MUST 僅在 `articleUrl` 存在時輸出 `<a href>`，
  否則僅輸出純文字標題 + 「未解鎖」標示。
- 全序排列鍵：`(moduleIndex, topicIndex, localOrder, conceptId)`（research R9，與 `cmpOrdinal` 一致）。
- `unlocked` 對同一份 `state.json` 輸入是單調的：後續執行只會讓更多 entry 變為 `true`，MUST NOT 出現
  已解鎖又變回未解鎖的情形（research R8 的聯集特性保證）。

## 3. `ArticlePageView`（全文閱讀頁，每個已解鎖 Concept 一筆，FR-006／FR-007）

```ts
interface ArticlePageSection {
  name: string;      // 固定區塊名稱之一（見 §3 順序）
  html: string;       // marked.parse() 輸出
}

interface ArticlePageProblem {
  id: number;
  title: string;              // Problem Bank 帶入（MUST NOT 由 LLM 生成，spec §5／§11）
  url: string;                 // 同上
  difficulty: "Easy" | "Medium" | "Hard"; // 同上
  whyThisPattern: string;      // Article 條目
  hint?: string;               // Article 條目
}

interface ArticlePageView {
  conceptId: string;
  title: string;
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  sections: ArticlePageSection[];   // 依固定順序，見下
  problems: ArticlePageProblem[];    // 依題號升冪排序；article.challenge 的全部題號（不限特定 Track 課表子集）
  takeaway: string;
}
```

**固定區塊順序（research R2，MUST 依此序渲染，對應 spec §10「閱讀用」列表）**：
`Concept → Thinking → Pattern Recognition → Common Mistakes → Complexity → TypeScript Corner →
Python Corner → Tomorrow Preview`（`Today's Challenge` 由 `problems` 欄位結構化呈現，不併入
`sections`；`Takeaway` 獨立成欄位；`Digest`／`TypeScript Tip`／`Python Tip` 不呈現，見 research R2）。

**資料來源（research R12）**：上述 8 段的原文一律由 `parseSections(article.rawContent)`（重新呼叫
`content.ts` 既有 export 函式）取得，逐段各自經 `marked.parse()` 轉 HTML 後填入 `sections[]`；MUST NOT
使用 `article.conceptBody`（F7 為字數 Gate 合併的單一字串，會遺失四段各自的標題與順序），也 MUST NOT
擴充 `ArticleContent` 型別新增欄位。

**不變式**：
- `problems` 中任一項目的 `id` MUST 存在於 Problem Bank（`readArticleCached` 解析階段已保證
  `article.challenge` 的題號皆來自合法解析，Problem Bank 查無對應時比照既有 `buildConceptProblems`
  的 fail-loud 規則拋出具名錯誤，不靜默省略——全文頁與 Discord Lesson 共用同一條「查無題號即失敗」的
  資料完整性保證）。
- 純函式：同一 `ArticleContent` + 同一 Problem Bank 快照 ⇒ 同一 `ArticlePageView`（SC-007）。

## 4. `FeedItemView` / `FeedView`（FR-008／FR-015／FR-016）

```ts
interface FeedItemView {
  conceptId: string;
  title: string;               // Concept 標題
  url: string;                  // 全文閱讀頁完整 URL；亦作為 guid（research R4）
  pubDate: string;              // ISO 8601，取自對應 HistoryEntry.pushedAt
}

type FeedScope =
  | { kind: "site" }
  | { kind: "track"; track: Track };

interface FeedView {
  scope: FeedScope;
  items: FeedItemView[];        // 依 pubDate 遞減排序（最新在前，RSS 慣例）
}
```

**資料來源與不變式（呼應 FR-015／FR-016）**：
- **Per-Track feed**（`scope.kind === "track"`）：`items` 一律由該 Track `state.json` 的 `history` 陣列
  導出，MUST 只收錄帶 `conceptId` 的項目（`HistoryEntry.conceptId !== undefined`）；`pubDate` 取自對應
  `HistoryEntry.pushedAt`；項目數上限 = `HISTORY_LIMIT`（現行 30）。此常數 MUST 由
  `src/state/state-store.ts` **import** 取得——該常數目前為未 export 的私有 const，故實作 MUST 先將其改為
  `export const HISTORY_LIMIT`（見 [tasks.md](./tasks.md) T000）。MUST NOT 在 `src/pages/**` 另行宣告
  一個 30：FR-016 明訂「MUST NOT 另行實作獨立的保留機制」，兩份各自獨立的常數會讓調整 history 上限時
  feed 上限不連動（spec FR-016／research R8）。
- **全站 feed**（`scope.kind === "site"`）：`items` = 三個已知 Track 的 per-Track feed 項目聯集，依
  `conceptId` 去重（同一 Concept 若被多軌各自推播過，取**最早**的 `pubDate`），再依 `pubDate` 排序後
  取前 30 筆（上限與 per-Track 一致，spec Assumptions）。
- 兩種 feed 皆 MUST NOT 引用任何本次執行的「產生時間」（wall-clock）；每個項目的時間戳只能是
  `history` 中真實記錄的 `pushedAt`（SC-007 byte-identical 的必要條件）。
- `guid` = `url`（`isPermaLink="true"`），故 `conceptId` 全域唯一即保證 `guid` 唯一（FR-009）。

## 5. `SiteBuildInput` / `SiteOutput`（純函式邊界，供 `scripts/build-pages.ts` 呼叫）

```ts
interface SiteBuildInput {
  deps: CompilerDeps;               // 由 loadCompilerDeps() 原封傳入，提供 graph / bank / schedules /
                                    // readArticle / articleCache。buildSite 內部一律以既有 export 函式
                                    // readArticleCached(articlePath, conceptId, deps) 取得 ArticleContent，
                                    // 與 compile(track, sessionIndex, deps) 走同一條讀檔路徑並共用
                                    // articleCache（200+ 篇文章只解析一次）。
                                    // MUST NOT 在 SiteBuildInput 另外宣告名為 readArticle 的欄位：
                                    // CompilerDeps.readArticle 的型別是 (path: string) => string
                                    // （原始檔案內容），與本 Feature 需要的 ArticleContent 不同，
                                    // 同名不同型會造成實作誤用。
                                    // buildSite 只消費 graph / bank / schedules / readArticle /
                                    // articleCache；CompilerDeps 其餘欄位（overlays / problemOrigins /
                                    // reflectionBank / encouragement）MUST NOT 被讀取。
  state: AppState;
  enabledTracks: Track[];          // 供區分「目前啟用」與「僅存在於 state 但已停用」（僅影響儀表板顯示，
                                    // 不影響 R8 的解鎖集合計算——後者涵蓋 state 中全部已知 Track）。
                                    // 由呼叫端（scripts/build-pages.ts）以 parseWebhooks(env) 算出，
                                    // MUST NOT 呼叫 loadConfig()（見 research R13：零 Track 時
                                    // loadConfig() 會 throw，與零 Track Edge Case 的預期行為衝突）
  baseUrl: string;                  // research R7；MUST 以此參數化，MUST NOT 內建寫死網址
}

/** relative output path → file content（純函式輸出；I/O 寫檔由 scripts/build-pages.ts 負責）。 */
type SiteOutput = Map<string, string>;

function buildSite(input: SiteBuildInput): SiteOutput;
```

**測試建構方式**：單元測試 MUST 以既有的 `tests/helpers/compiler.ts` `makeCompilerDeps(input)` 建構
`deps`（與既有 Lesson Compiler 測試同一套 helper），MUST NOT 另造一份平行的 deps 建構器。

**輸出檔案清單（固定命名，供 FR-013 穩定網址）**：

| 路徑 | 內容 |
| --- | --- |
| `index.html` | 儀表板（`TrackProgressView` × 已啟用 Track 數 + `CurriculumEntryView[]`） |
| `articles/{conceptId}.html` | 每個 `unlocked === true` 的 Concept 各一份（`ArticlePageView`） |
| `feed.xml` | 全站 feed |
| `feed-foundation.xml` / `feed-interview-ready.xml` / `feed-interview-mastery.xml` | per-Track feed，**僅為 `state.tracks` 中已知的 Track 產生**（kebab-case 對應 `Track` 值）。判準 MUST NOT 使用 `enabledTracks`：Track 被停用（移除 webhook）後，其既有 feed 訂閱者 MUST NOT 因此收到 404；而從未出現在 state 中的 Track 本就沒有任何 `history` 可導出。此判準與 [feed-contract.md](./contracts/feed-contract.md) §1、[tasks.md](./tasks.md) T021、[quickstart.md](./quickstart.md) §1 一致 |

**核心不變式（SC-007）**：`buildSite` MUST 為純函式——不讀當下時間、不讀環境變數、不做隨機取樣；同一
`SiteBuildInput` 呼叫兩次 MUST 得到 `SiteOutput` 的兩個 Map 中，相同鍵對應完全相同的字串內容。
