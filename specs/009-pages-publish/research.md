# Phase 0 Research: Pages Publish

**輸入**：[spec.md](./spec.md)（已於 2026-08-05 完成 `/speckit-clarify`，5 題全部定案，含 Q3 對 FR-014～FR-017 的
重大簡化——發佈階段為完全 stateless，不新增任何跨執行狀態）。

本文件解決 spec 唯一明文延後的技術選型（feed 格式），並記錄本 Feature 為落地 spec 而必須做出、但不影響
任何 MUST/SHOULD 語意的實作決策。每項決策附「為何不選其他選項」，供 `/speckit-tasks` 與實作者對齊。

---

## R1：全文閱讀頁的產生方式——手刻 HTML 模板，不引入 SSG 框架

**Decision**：不引入 Next.js / Astro / 11ty 等靜態網站產生器。以純 TypeScript 模板函式（string 組裝）產生
HTML，複用既有相依 `marked`（`marked.parse()`）把 Article 的 markdown 區塊轉成 HTML；不新增任何 npm 相依。

**Rationale**：
- 憲章 XVI（Free-tier Only）與「composition root 手寫」的既有工程風格（`src/main.ts` 不引入 DI 框架）
  一致——3 個頁面類型（儀表板 / 全文 / feed）、200+ 篇靜態文章，規模不需要一套完整 SSG 的建置管線
  （bundler、路由、hydration 皆用不到，且會引入前端建置步驟這個本專案完全沒有的新面向）。
- `marked` 已是既有相依（`content.ts` 用於 `parseSections`），重用它做 markdown → HTML 零成本；
  新增 SSG 框架則是數十個間接相依與一條新的建置管線。
- 產出對象是**唯讀靜態頁面**，無需互動（Assumptions 已明訂知識圖譜視覺化不在本 Feature 範圍），
  純模板字串足以滿足 FR-002／FR-013。

**Alternatives considered**：
- Astro / 11ty：功能過剩，且需新增建置工具鏈與設定檔，與「零常駐、輕量 CLI」的專案定位不符。
- 純手寫 HTML 檔（無模板函式）：200+ 篇文章的重複結構無法用純手寫檔案维護，仍需程式產生。

---

## R2：全文閱讀頁的內容組裝——結構化重建，不直接輸出整份 markdown

**Decision**：全文閱讀頁 MUST NOT 對 `article.rawContent` 整份丟給 `marked.parse()`。改為：
1. 依 §10「閱讀用」固定區塊順序（Concept → Thinking → Pattern Recognition → Common Mistakes → Complexity
   → TypeScript Corner → Python Corner → Today's Challenge → Takeaway → Tomorrow Preview）逐段取用
   `parseSections()` 已切好的區塊原文，各自經 `marked.parse()` 轉 HTML。
2. `Today's Challenge` 段落 MUST NOT 直接渲染其 markdown 原文（該區塊依 article-format.md §4 只含
   `**{題號}**` + why + Hint，不含題目標題／連結／難度）。改為對 `article.challenge` 的**全部**題號（不只
   某個 Track 課表選中的子集，因為全文閱讀頁不綁定特定 Track）依題號排序，逐題向 Problem Bank 查回
   title／url／difficulty，組成結構化題目清單（與 `buildConceptProblems` 相同的資料形狀：
   `{ id, title, url, difficulty, whyThisPattern, hint? }`），複用既有的「題號/連結/難度由程式帶入」規則
   （spec §5、§11）。
3. `Digest` / `TypeScript Tip` / `Python Tip`（推播用精簡區塊）不在全文閱讀頁重複呈現——它們是「閱讀用」
   六段的濃縮版，全文頁已完整呈現閱讀用區塊，重複顯示精簡版只會製造版面雜訊。

**Rationale**：直接 dump markdown 會讓 Today's Challenge 只顯示裸題號（無標題無連結），對讀者毫無用處，
且題號連結若被誤植為 markdown 連結語法，會產生「LLM 生成的 LeetCode 連結」——違反 spec §5／§11「題號、
連結、難度 MUST 由程式帶入，MUST NOT 由 LLM 生成」的核心規則。結構化重建與 Lesson Compiler 既有的
`buildConceptProblems` 走同一條資料路徑，零額外風險。

**Alternatives considered**：整份 `rawContent` 丟給 `marked.parse()`——實作最省，但如上所述會產生不可點擊、
無標題的裸題號，且有把 LLM 產出的 markdown 連結語法誤當合法連結顯示的風險。

---

## R3：Feed 格式——RSS 2.0

**Decision**：採 RSS 2.0（非 Atom）。resolves spec Assumptions 明文延後的技術選型。

**Rationale**：Q3 決議（`/speckit-clarify` 2026-08-05）已移除文章版本記錄機制，feed 項目只需單一時間戳
（該 Track 的實際推播時間 `pushedAt`），不再需要 Atom 原生區分 `published`/`updated` 的理由已經消失
（spec Assumptions 已同步改寫）。RSS 2.0 的 `<pubDate>` + `<guid isPermaLink="true">` 已完整覆蓋 FR-009
（穩定唯一識別碼）與新 FR-015（單一時間戳），且格式更單純、reader 相容性同樣廣泛。

**Alternatives considered**：Atom——若日後版本記錄需求復活會更合適，但目前徒增複雜度（`<updated>` 需要一個
本專案不再產生的值）。

---

## R4：Feed 項目識別碼——採全文閱讀頁的完整 URL

**Decision**：`<guid isPermaLink="true">` 直接使用該 Concept 全文閱讀頁的完整 URL
（例：`https://{owner}.github.io/{repo}/articles/{conceptId}.html`）。

**Rationale**：URL 本身即天然穩定唯一（`conceptId` 全域唯一且不變，spec §26.1）；`isPermaLink="true"` 是
RSS 2.0 對「guid 即可直接開啟的網址」的標準語意，reader 可直接用作連結，一舉滿足 FR-009（穩定識別碼）與
User Story 3「可直接點進全文閱讀頁」。

**Alternatives considered**：自訂 tag URI（如 `tag:leetcode-daily-coach,2026:{conceptId}`）——更貼近 Atom
慣例，但本專案選了 RSS 2.0（R3），且 URL 已經滿足全部需求，沒有理由再發明一套識別碼格式。

---

## R5：Repo 公開／私有偵測——workflow 層的 `gh api`，不進 TypeScript 程式碼

**Decision**：FR-001 的偵測完全在 `daily.yml` 的新增 job 內以 GitHub CLI（runner 內建）完成：
`gh api repos/${{ github.repository }} --jq .private`，使用預設提供的 `secrets.GITHUB_TOKEN`
（`permissions: contents: read` 已足夠讀取此欄位）。`src/` 與 `scripts/` MUST NOT 呼叫任何 GitHub API。

> **實作必要條件**：該 step **MUST** 顯式設定 `env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`。GitHub
> Actions 內的 `gh` CLI 不會自動取用 `secrets.GITHUB_TOKEN`，未設定時直接報錯；依下方「安全預設為不
> 發佈」的設計，這會使 Pages **永遠無法發佈**且每日發出一則琥珀色通知。

**Rationale**：
- `github.event.repository.private` 在 `schedule` 觸發的事件負載中不可靠（`schedule` 事件的 payload
  是合成的、不保證包含完整 repository 物件），唯一穩定作法是主動呼叫 API。
- 保持 `src/`／`scripts/` 對外部服務的呼叫面不擴大——本專案目前只有 Discord webhook 一個外部依賴
  （憲章 IX 精神：確定性、可預先驗證的運算歸 `src/`；此處判斷 repo 可見性是**環境事實**，非課程邏輯，
  且需要 GitHub API 這個純 CI 環境才有的憑證，天然屬於 workflow 編排層，與「git commit / push 由
  workflow step 負責、非 TS 程式碼」的既有分工（`state-store.ts` 註解：「只寫檔，不含任何 git 操作」）
  一致。
- 偵測失敗（API 呼叫本身出錯，非「查到 private」）時，該 step 失敗，後續「確認為 public」的步驟因條件
  不成立而全部跳過——安全預設為**不發佈**（無法確認公開狀態時，不能冒然發佈，避免誤將私有內容公開），
  且此失敗會被歸為一般發佈失敗，觸發 FR-017 的琥珀色通知（區別於「確認為 private」的靜默跳過）。

**Alternatives considered**：把偵測寫成 `scripts/check-visibility.ts` 用 Node `fetch` 呼叫 GitHub API——
需要额外處理 token 注入、多一層可測但無實益的抽象，且與「`src/`／`scripts/` 只做確定性運算與檔案 I/O」
的既有分工不一致。

---

## R6：發佈機制——`actions/upload-pages-artifact` + `actions/deploy-pages`，單一 job、job 層 `continue-on-error`

**Decision**：在 `daily.yml` 新增一個 `pages` job（`needs: push`、
`if: !cancelled() && inputs.dry_run != true`、`environment: github-pages`），內部依序執行：`gh api`
偵測可見性 → （僅 public 時）`npm run build:pages`（新腳本，讀取已 checkout 的 `state` 分支與 repo
內容，輸出至 gitignored `pages-dist/`）→ `actions/configure-pages` →
`actions/upload-pages-artifact@v3`（`path: pages-dist`）→ `actions/deploy-pages@v4`。整個 job 設
`continue-on-error: true`；job 內最後一步 `if: failure()` 以 `scripts/notify-pages-failure.ts` 對第一個
已設定 webhook 發送琥珀色通知（FR-017）。

**Rationale**：
- `needs: push` 但 `if: !cancelled()`：`push` job 即使因部分 Track 失敗而以非零 exit 結束，`state.json`
  仍可能已成功 commit（憲章 XV 失敗隔離）；Pages MUST 反映「已 commit 的最新 state」（FR-002），故不能
  用預設的 `if: success()`（那會在任一 Track 失敗時整段跳過 Pages，即使其餘 Track 進度都已保存）。
  **但也不用 `always()`**：`always()` 會讓使用者主動取消 workflow 後仍發生一次對外站台部署，違反取消
  語意；`!cancelled()` 同樣涵蓋「失敗但已部分 commit」的情境（失敗 ≠ 取消），且與既有 `push` job 的
  「Commit state changes」step 已採用的 `!cancelled()` 慣例一致（`daily.yml` 該處留有同類陷阱的註解）。
- `dry_run: true` 時 `state.json` 未變更，執行 Pages 只會重跑出等價內容（SC-007 保證的 byte-identical
  特性），純屬浪費 CI 資源且容易誤導使用者「預覽模式也真的部署了」，故明確跳過。
- job 層 `continue-on-error: true` 讓整個 workflow run 的最終結論不受 Pages 失敗影響
  （FR-017「MUST NOT 改變當次 workflow 的 exit code」），同時 job 內部 step 仍會正常失敗／跳過，
  `if: failure()` 步驟因此能正確觸發。
- 單一 job（而非官方模板常見的 build/deploy 兩個 job）：官方拆兩個 job 是為了讓「建置」與「部署」能各自
  重跑、並讓部署保護規則只作用在後者（常見於多人協作、需要人工核准部署的場景）；本專案是單一使用者、
  每日全自動流程，沒有人工核准需求，拆兩個 job 只會多一層 artifact 傳遞的複雜度而無實益。
- **勘誤（2026-08-05）**：本節原先寫「拆兩個 job 是為了套用 `environment: github-pages`」，暗示不拆 job
  就不需要該宣告——此為誤述。`environment: github-pages` 是 `actions/deploy-pages` 對**執行部署的那個
  job** 的硬性要求（Pages 部署 API 據此授權），**與是否設定人工核准保護規則無關**。因此本專案的單一
  `pages` job **MUST** 自行宣告 `environment: github-pages`，見
  [workflow-integration.md](./contracts/workflow-integration.md) §1。另需注意 Pages 來源必須先於 repo
  設定中切換為「GitHub Actions」（一次性人工設定，見同檔 §0）。

**Alternatives considered**：獨立 workflow 檔（`pages.yml`）——但 FR-011／Assumptions 明訂「本 Feature
是既有每日推播工作流程新增的附加末段，而非獨立排程或獨立 workflow」，故不採用。

---

## R7：Pages 站台 Base URL——由 workflow context 動態組出，不寫死

**Decision**：`https://{repository_owner_lowercased}.github.io/{repo_name}` 由 `daily.yml` 在呼叫
`build:pages` 前，以 `github.repository_owner` 與 `github.event.repository.name`（或從 `github.repository`
拆分）組成，經環境變數 `PAGES_BASE_URL` 傳入建置腳本；`src/pages/**` 的純函式一律以參數接收 base URL，
MUST NOT 內建任何寫死的網址。

**Rationale**：避免把 owner/repo 名稱寫死在程式碼或測試 fixture 中；也讓 fork 或改名後的 repo 不需要改
程式碼即可正確運作。假設本專案未設定自訂網域（無 `CNAME` 檔，已確認 repo 根目錄不存在此檔），採用 GitHub
Pages 專案頁的預設網址規則；若日後加上自訂網域，只需改動這一個組裝點。

**Alternatives considered**：寫死於 `package.json` 或設定檔——多一個需要手動同步的設定點，且與「repo
context 已經有這個資訊」矛盾。

---

## R8：全域解鎖集合的計算——`completedConceptIds` 聯集，非 `history` 聯集

**Decision**：FR-006「至少已被三個 Track 其中一個實際推播過」的判定，資料來源 MUST 為三個 Track（含目前
未啟用但曾記錄於 `state.json` 者）`completedConceptIds` 的聯集——這是**不設數量上限**的完整累積清單
（`state-store.ts` `advance()`：`completedConceptIds` 只增不減、無 `HISTORY_LIMIT` 裁剪），而非受
30 筆上限拘束的 `history`。

**Rationale**：`history` 的 30 筆上限（FR-016 的 feed 上限來源）反映的是「近期推播事件流」，本就是為
feed 設計的有限窗口；`completedConceptIds` 才是「這個 Track 曾經解鎖過哪些 Concept」的完整權威記錄，且
早於本 Feature 就已存在、由 F1/F6 驗收（不受本 Feature 改動）。用 `history` 判定解鎖會在 Track 累積推播
超過 30 個 concept 類 Session 後，讓「更早解鎖的全文閱讀頁」被誤判為未解鎖並下架——這既違反 FR-006 的
單調性（已解鎖不應變回未解鎖），也會讓 SC-007 的 byte-identical 保證失去意義（同一批 state 資料在
`history` 滾動後產生更少的頁面）。

**證明兩者的等價範圍**：由於 Curriculum 為 DAG 且課表依拓樸序生成（憲章 V），`completedConceptIds` 的
新增順序天然對齊各 Concept 在 DAG 中的相對順序；「進度最快的 Track」等價於「`completedConceptIds` 集合
最大的 Track」，全站解鎖集合 = 三軌 `completedConceptIds` 聯集，此聯集在數學上就是「最快 Track 的完整
累積清單」（因為課綱共用同一份 DAG，較慢的 Track 的已解鎖集合必是較快 Track 已解鎖集合的子集——憲章 VI
「Shared Knowledge」保證）。

**Alternatives considered**：`history` 聯集（R8 原考慮方案）——如上，會在長期運行後產生解鎖倒退，
拒絕採用。

---

## R9：儀表板「目前進度位置」——以 DAG 全序（ordinal）標記，沿用既有比較器

**Decision**：每個已啟用 Track 在課綱順序視圖中的「目前位置」標記 = 該 Track `completedConceptIds` 中
DAG 全序（`graph.ordinalOf`）最大者；比較邏輯複用 `src/compiler/lesson.ts` 內部 `cmpOrdinal` 的排序鍵
（`moduleIndex → topicIndex → localOrder → id`），不重新定義一套新排序。

**Rationale**：`cmpOrdinal` 已是 Lesson Compiler 推導 prev/next path（`closestOrdinal`）驗證過的確定性
全序，直接複用可避免「課綱順序視圖」與「Lesson 的 prev/next 邏輯」出現兩套互相矛盾的順序定義。

---

## R10：「今日課程」對非 concept 類 Session 的呈現——固定中文標籤，不虛構 Concept

**Decision**：FR-004「今日課程標題與所屬 Concept」在該 Track 最近一次推播為 concept 類 Session 時，顯示
該 Concept 標題並連結至其全文閱讀頁（若已解鎖，必然已解鎖，因為它剛被推播過）；當最近一次為
review／practice／challenge 類 Session 時，顯示固定中文標籤（複習週／練習／挑戰）與該 Session 的
`sessionIndex`，MUST NOT 虛構一個「所屬 Concept」。

> **關於 `rest`**：`SessionType` 仍保留 `"rest"` 且 `schedule-generator.ts` 留有防禦性的 rest fallback
> 分支，但 F8（`008-review-extras`）移除 rest 槽後，三軌 `track-params.json` 的 rhythm 皆不含 rest，
> 現行三份 `schedules/*.json` 中 rest 出現 **0 次**。實作 SHOULD 為 `rest` 保留一個標籤（休息日）以維持
> `SessionType` 的窮舉完整性，但 MUST NOT 為此撰寫需要真實 rest 資料的驗收案例——該路徑目前不可達。

**Rationale**：`history` 項目對非 concept 類 Session 本就沒有 `conceptId`（`state-store.ts`
`HistoryEntry.conceptId` 為選填、僅 concept 類填入），沒有資料可虛構；FR-004 的「所屬 Concept」語意在
語境上自然只適用於 concept 類 Session（唯一真正「引入一個 Concept」的類型，憲章 II）。

---

## R11：輸出目錄與 `.gitignore`——`pages-dist/`，比照 `dist/` 不入庫

**Decision**：建置產物輸出至倉庫根目錄的 `pages-dist/`，加入 `.gitignore`（比照既有 `dist/`／`.cache/`
的「可重生成產物不入庫」慣例）。

**Rationale**：Pages 產物是**每次執行都重新產生**的衍生物（FR-014 stateless），與 `dist/`（`tsc` 編譯
輸出）同一性質，不應 commit；`actions/upload-pages-artifact` 直接讀取此目錄上傳，不需要落地到任何 git
分支。

---

## R12：全文閱讀頁固定區塊的資料來源——重新呼叫 `parseSections(rawContent)`，不擴充 `ArticleContent`

**Decision**：`src/pages/article-page.ts` 內部對 `article.rawContent`（`ArticleContent` 既有欄位）重新呼叫
`content.ts` 已 export 的 `parseSections()`，取回完整的區塊 Map，逐一取用 `Complexity`／`TypeScript Corner`／
`Python Corner`／`Tomorrow Preview`（`ArticleContent` 本身未保留這 4 段——`parseArticle()` 只驗證其存在後即
丟棄，見 `content.ts` `READING_SECTIONS` 驗證迴圈），以及 `Concept`／`Thinking`／`Pattern Recognition`／
`Common Mistakes` 四段各自獨立的原文（**MUST NOT** 使用 `ArticleContent.conceptBody`——該欄位是 F7 為 Gate
字數檢查特別合併的單一字串，用於全文頁會遺失各段獨立標題與順序）。**不修改 `src/compiler/content.ts` 或
`ArticleContent` 的型別**。

**Rationale**：
- `parseSections()` 已是 `content.ts` 的 export 函式（非新增相依），`rawContent` 也已是 `ArticleContent`
  既有欄位（供 F7 繁中機器判準使用），兩者組合即可零成本取回全部命名區塊，不需要在 `src/compiler/content.ts`
  新增欄位、不影響 Lesson Compiler 既有的 `ArticleContent` 契約與其既有測試。
- `conceptBody` 的合併是**刻意**的（供 §10.3 字數上限檢查），與全文頁需要「四段各自獨立渲染、各自標題」的
  需求是不同目的，兩者不可互換——沿用 `conceptBody` 會讓全文頁的 Concept/Thinking/Pattern
  Recognition/Common Mistakes 只呈現為一段無標題的合併文字，且完全遺漏 Complexity/TypeScript
  Corner/Python Corner/Tomorrow Preview 四段。

**Alternatives considered**：在 `ArticleContent` 新增 4 個欄位（`complexity`／`tsCorner`／`pyCorner`／
`tomorrowPreview`）——會擴大 Lesson Compiler 既有型別的職責範圍（該型別同時被 F5 Gate、F7 產線既有測試
依賴），且這 4 段只有 F9 全文頁需要，不值得為單一消費者擴充上游共用型別；重新呼叫既有 export 函式是更小
的變更面。

---

## R13：`pages` job 的 `enabledTracks` 判定——複用 `parseWebhooks()`，MUST NOT 呼叫 `loadConfig()`

**Decision**：`scripts/build-pages.ts` 需要 `SiteBuildInput.enabledTracks`（data-model.md §5）供儀表板
判斷「目前啟用」範圍（FR-003／FR-004、零 Track Edge Case）。此值由 `build-pages.ts` 直接呼叫既有
`src/config.ts` 的 `parseWebhooks(env)`（不拋錯，只讀三個 `DISCORD_WEBHOOK_URL_*` 是否有值）後
`TRACK_ORDER.filter(...)` 算出，**MUST NOT** 呼叫 `loadConfig(env)`——`loadConfig()` 在
`enabledTracks.length === 0` 時會 `throw`（`config.ts` 現行行為，服務於 `push` job「零 webhook 即失敗」的
語意），但這與 Pages 的零 Track Edge Case（MUST 呈現空的 Track 進度區塊，非錯誤）直接衝突。因此
`daily.yml` 的 `pages` job **MUST** 比照 `push` job 傳入三個 `DISCORD_WEBHOOK_URL_*` secrets 供
`build-pages.ts` 讀取（見 [workflow-integration.md](./contracts/workflow-integration.md) §3）；此三個
env var 在 `pages` job 內**僅用於判斷是否啟用**，不建立 webhook client、不發送任何 Discord 訊息。

**Rationale**：`enabledTracks` 是「目前啟用」與「僅存在於 state 但已停用」兩者呈現差異的唯一判準來源
（data-model.md §5 `SiteBuildInput.enabledTracks` 註解），而現有程式庫中唯一計算此值的邏輯就是
`parseWebhooks` + `TRACK_ORDER.filter`（`config.ts` `loadConfig()` 內部作法）；重新發明一套判定邏輯會
造成兩套「什麼是啟用」的定義同時存在的風險，故重用函式本身、但避開 `loadConfig()` 的零值 fail-fast 分支
（那是為 `push` job 設計的合理行為，不適用於 Pages）。

**Alternatives considered**：`pages` job 不取得 webhook secrets、一律把 `state.tracks` 中已知的三個
Track 都當作「已啟用」呈現——會讓零 Track Edge Case 的驗收（儀表板呈現空區塊）無法達成，且與 spec Edge
Cases 明文的「三個 webhook 皆未設定」情境定義矛盾，拒絕採用。

---

## 未解 NEEDS CLARIFICATION

無。spec 明文延後至 plan 階段的唯一決策（feed 格式）已於 R3 定案；其餘 R1–R2、R4–R13 皆為落地 spec 所需、
不影響任何 MUST/SHOULD 語意的實作細節決策。
