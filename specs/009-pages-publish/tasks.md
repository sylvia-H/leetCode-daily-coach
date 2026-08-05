# Tasks: Pages Publish — GitHub Pages 儀表板、全文閱讀與 RSS 訂閱

**Input**: Design documents from `/specs/009-pages-publish/`
**Prerequisites**: [plan.md](./plan.md)（必要）、[spec.md](./spec.md)（必要，User Story 優先序）、
[research.md](./research.md)（R1–R13）、[data-model.md](./data-model.md)、
[contracts/](./contracts/)（site-build-contract.md／feed-contract.md／workflow-integration.md）、
[quickstart.md](./quickstart.md)

**Tests**: 本 Feature 明確要求測試——plan.md「測試落點對照」表已逐一釘死 8 個測試檔案對應的不變式，
且憲章「測試優先」原則將 DAG／課表／Compiler determinism 等同類邏輯列為 MUST 有單元測試。以下每個
User Story 均含對應的 `tests/unit/pages-*.test.ts`，MUST 先寫、先失敗，再實作使其通過。

**Organization**: 依 User Story（P1／P2／P3，spec.md 優先序）分組，各自可獨立實作與驗收。

## Format: `[ID] [P?] [Story] Description`

- **[P]**：可平行執行（不同檔案、無待完成依賴）
- **[Story]**：對應 spec.md 的 User Story（US1／US2／US3）
- 每個任務皆含明確檔案路徑

## Path Conventions

沿用 plan.md 既定的單一專案結構（非 monorepo）：`src/pages/**`（純函式）、`src/renderer/alert.ts`（擴充）、
`scripts/build-pages.ts`（I/O 入口）、`tests/unit/**`、`.github/workflows/daily.yml`、根目錄
`.gitignore`／`package.json`。不新增頂層目錄、不新增 npm 相依（research R1）。

---

## Phase 1: Setup

**Purpose**：本 Feature 不新增任何 npm 相依、不新增建置管線（research R1）。此階段只有兩個動作：讓建置
產物不被誤 commit，以及把 feed 上限的唯一來源開放給 `src/pages/**` import。

- [X] T000 [P] 在 `src/state/state-store.ts` 將 `const HISTORY_LIMIT = 30` 改為
      `export const HISTORY_LIMIT = 30`（不改值、不改行為）。FR-016 明訂 feed 上限 MUST 與 `history`
      上限同源、MUST NOT 另行實作獨立的保留機制，而該常數目前為未 export 的私有 const，`src/pages/feed.ts`
      無法 import —— [feed-contract.md](./contracts/feed-contract.md) §4、
      [data-model.md](./data-model.md) §4
- [X] T001 [P] 在根目錄 `.gitignore` 新增 `pages-dist/`（比照既有 `dist/` 慣例，research R11）

**⚠️ 一次性人工前置（非程式碼任務，MUST 於 T013 的 workflow 首次實跑前完成）**：於 GitHub
**Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。未完成時
`actions/deploy-pages` 會失敗並每日觸發琥珀色通知 ——
[workflow-integration.md](./contracts/workflow-integration.md) §0

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**：全部三個 User Story 共用的地基——解鎖集合／Track 進度／課綱視圖的資料層（research
R8／R9／R10），以及 HTML/XML escape 共用工具與 Pages 失敗通知。plan.md 明文標註「P1 是後續全部 Phase
的地基，MUST 最先完成並驗證」。

**⚠️ CRITICAL**：本階段完成前不可開始任何 User Story 的實作任務。

- [X] T002 [P] 建立 `src/pages/html.ts`：共用 HTML/XML entity escape 函式（`& < > ' "`）與共用
      `<!doctype html>` 版面 helper（`<style>` 內嵌、不外連 CSS/JS）——
      [site-build-contract.md](./contracts/site-build-contract.md) §3
- [X] T003 [P] 撰寫 `tests/unit/pages-unlock.test.ts`（先寫、先失敗）：驗證解鎖集合 = 三個已知 Track
      （`state.tracks` 中存在者，不限 `enabledTracks`）`completedConceptIds` 的聯集；驗證聯集單調性
      （同一批遞增輸入不會讓已解鎖的 Concept 變回未解鎖）—— research R8、
      [data-model.md](./data-model.md) §2 不變式
- [X] T004 [P] 撰寫 `tests/unit/pages-curriculum-view.test.ts`（先寫、先失敗）：驗證 `CurriculumEntryView`
      排序鍵 `(moduleIndex, topicIndex, localOrder, conceptId)` 的**語意**與 `src/compiler/lesson.ts` 內部
      `cmpOrdinal` 一致（該函式在 `curriculum.ts`／`lesson.ts`／`material.ts` 各有一份未 export 的私有
      複本，`src/pages/**` MUST 比照此既有慣例自帶一份，MUST NOT 改動既有三個檔案——收斂重複比較器屬
      F9 範圍外的重構）；`Ordinal` MUST 取自 `graph.ordinalOf` 或既有 export 的 `computeOrdinal()`，
      MUST NOT 自行重算 module／topic 索引；驗證 `unlocked === false` 的項目 MUST NOT 帶 `articleUrl`
      欄位（FR-005a 零 404 保證）—— research R9、[data-model.md](./data-model.md) §2、
      [site-build-contract.md](./contracts/site-build-contract.md) §5
- [X] T005 [P] 撰寫 `tests/unit/pages-progress.test.ts`（先寫、先失敗）：驗證 `TrackProgressView` 三種
      狀態（`history.length===0` → not-started；`completedAt` 非空 → completed；否則 in-progress）；
      驗證最近一次推播為非 concept 類 Session 時呈現固定標籤且 MUST NOT 虛構 `conceptId`／
      `conceptTitle`／`articleUrl` —— FR-004、research R10、[data-model.md](./data-model.md) §1
- [X] T006 實作 `src/pages/curriculum-view.ts`：`TrackProgressView`／`CurriculumEntryView` 導出函式
      （解鎖集合聯集 R8、排序與零 404 保證 R9、三狀態與非 concept 標籤 R10），使 T003–T005 由紅轉綠
      （依賴 T003、T004、T005 已存在且失敗）
- [X] T007 [P] 擴充 `tests/unit/alert.test.ts`（先寫、先失敗）：驗證 `renderPagesFailureNotice` 的顏色
      與既有 `ALERT_COLOR`（紅）／`COMPLETION_COLOR`（綠）皆不同、內文明示「Pages 未更新，當日核心推播
      與 state 不受影響」、純函式且不含時間戳 —— FR-017、
      [workflow-integration.md](./contracts/workflow-integration.md) §4.1
- [X] T008 在 `src/renderer/alert.ts` 新增 `PAGES_FAILURE_COLOR = 0xf39c12` 與
      `export function renderPagesFailureNotice(): DiscordEmbed[]`，使 T007 由紅轉綠（依賴 T007）
- [X] T008a [P] 撰寫 `tests/unit/notify-pages-failure.test.ts`（先寫、先失敗）：驗證發送邊界依
      `TRACK_ORDER` 選出**第一個已設定**的 `DISCORD_WEBHOOK_URL_*`（以既有
      `tests/helpers/fetch-recorder.ts` 攔截請求，驗證 body 為 `{ embeds: renderPagesFailureNotice() }`）；
      驗證三個 webhook 皆未設定時不發任何請求且 exit code 0；驗證 fetch 拋錯時被 try/catch 吞下、
      exit code 仍為 0 —— FR-017、[workflow-integration.md](./contracts/workflow-integration.md) §4.2
- [X] T008b 實作 `scripts/notify-pages-failure.ts`：`renderPagesFailureNotice()` 只回傳 embeds、**本身
      不具發送能力**，本腳本是其唯一發送邊界（由 `daily.yml` 的 `if: failure()` step 以
      `npx tsx scripts/notify-pages-failure.ts` 呼叫）。MUST NOT 讀 `state.json`、MUST NOT 呼叫
      `buildSite()`、MUST NOT 呼叫任何 GitHub API。使 T008a 由紅轉綠（依賴 T008、T008a）

**Checkpoint**：地基就緒——`TrackProgressView`／`CurriculumEntryView`／解鎖集合與 HTML escape 皆已驗證
正確，後續三個 User Story 可以開始（依序或平行）。

---

## Phase 3: User Story 1 - 造訪儀表板查看三軌目前進度與今日課程 (Priority: P1) 🎯 MVP

**Goal**：學習者造訪公開網址，一畫面看到三個已啟用 Track 各自目前進度與今日課程標題。

**Independent Test**：在 state 分支已有至少一個 Track 進度記錄的情況下觸發一次本機建置
（`npm run build:pages`），開啟 `pages-dist/index.html` 驗證是否正確反映該 Track 的
`currentSessionIndex` 與最近一次推播內容，不依賴全文閱讀頁或 RSS 是否完成。

### Tests for User Story 1

- [X] T009 [P] [US1] 撰寫 `tests/unit/pages-dashboard.test.ts`（先寫、先失敗）：驗證三種 Track 狀態
      （尚未開始／進行中／已完課）呈現、頁面不含任何時間戳字串、未解鎖 Concept 在課綱視圖中零可點連結
      —— SC-001、SC-002、FR-005a

### Implementation for User Story 1

- [X] T010 [US1] 實作 `src/pages/dashboard.ts`：消費 `TrackProgressView[]` + `CurriculumEntryView[]`
      （T006）與 `html.ts`（T002）渲染儀表板 HTML，使 T009 由紅轉綠（依賴 T002、T006、T009）
- [X] T011 [US1] 實作 `src/pages/site.ts`：定義 `SiteBuildInput`（欄位為 `deps: CompilerDeps` +
      `state` + `enabledTracks` + `baseUrl`，**MUST NOT** 另立名為 `readArticle` 的欄位——會與
      `CompilerDeps.readArticle: (path) => string` 同名不同型）／`SiteOutput` 型別
      （[data-model.md](./data-model.md) §5）與 `buildSite(input): SiteOutput`；此階段先組裝
      `index.html`（呼叫 T006 + T010，其餘輸出鍵留待 US2／US3 擴充）（依賴 T006、T010）
- [X] T012 [US1] 實作 `scripts/build-pages.ts` 並在 `package.json` 新增 `"build:pages": "tsx
      scripts/build-pages.ts"`：讀 `STATE_FILE`／`PAGES_OUTPUT_DIR`／`PAGES_BASE_URL`（缺任一必要項
      fail-fast，非零 exit）；以 `parseWebhooks(env)`（`src/config.ts` 既有 export）+
      `TRACK_ORDER.filter(...)` 算出 `enabledTracks`，**MUST NOT** 呼叫 `loadConfig()`（research R13：
      零 enabledTracks 時 `loadConfig()` 會 throw，與零 Track Edge Case 衝突）；呼叫
      `loadCompilerDeps()` 並將回傳的 `CompilerDeps` **原封**作為 `SiteBuildInput.deps`（不拆解重組成
      graph／bank／schedules 三個欄位），以 `state-store.ts` 的 `load(stateFile, enabledTracks)` 取得
      `SiteBuildInput.state`；呼叫 `buildSite()`，將 `SiteOutput` 逐一寫入 `PAGES_OUTPUT_DIR`（依賴
      T011）
- [X] T013 [US1] 在 `.github/workflows/daily.yml` 新增 `pages` job：`needs: push`、
      **`if: !cancelled() && inputs.dry_run != true`**（**MUST NOT** 用 `always()`——那會讓使用者主動
      取消 workflow 後仍發生一次對外站台部署；`!cancelled()` 仍完整涵蓋「push job 失敗但已部分 commit」
      的 FR-012 情境，且與既有 `push` job 的 commit step 慣例一致）、`continue-on-error: true`、
      `permissions: {contents: read, pages: write, id-token: write}`、
      **`environment: {name: github-pages, url: ${{ steps.deployment.outputs.page_url }}}`**
      （`actions/deploy-pages` 的硬性要求，與人工核准保護規則無關）；步驟依序為 checkout → checkout
      state 分支 → setup-node + `npm ci` + `npm run build` → `gh api
      repos/${{ github.repository }} --jq .private` 偵測可見性（該 step **MUST** 設
      `env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`，否則 `gh` 直接報錯、可見性永遠無法確認）→ 僅 public
      時執行 `npm run build:pages` → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3`
      （`path: pages-dist`）→ `actions/deploy-pages@v4`（`id: deployment`）；並傳入既有三個
      `DISCORD_WEBHOOK_URL_FOUNDATION`／`DISCORD_WEBHOOK_URL_INTERVIEW_READY`／
      `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` secrets（供 `build-pages.ts` 判斷 `enabledTracks`
      與 `notify-pages-failure.ts` 選擇通知目標，research R13）；最後一步 `if: failure()` 執行
      `npx tsx scripts/notify-pages-failure.ts`（T008b）發送琥珀色通知 —— 全部依
      [workflow-integration.md](./contracts/workflow-integration.md)（依賴 T008b、T012）
- [X] T014 [US1] 依 [quickstart.md](./quickstart.md) §1–§2 手動驗收：本機執行 `npm run build:pages`
      （**MUST 依 quickstart §1 一併設定三個 `DISCORD_WEBHOOK_URL_*` 佔位值**，否則 `enabledTracks` 為空
      集合、儀表板不會出現任何 Track 區塊）產生 `pages-dist/index.html`；驗證 Track A（有推播歷史）／
      Track B（剛啟用）／Track C（已完課）三種狀態正確呈現，課綱順序列表同時列出已解鎖與未解鎖 Concept
      且未解鎖者無可點連結；並執行 quickstart §2 的 **SC-001 目視檢查**（桌面視窗不捲動即可見三軌進度與
      今日課程標題）與**零 Track Edge Case**（不設 webhook 變數重跑，儀表板呈現空 Track 區塊、課綱視圖
      仍完整、exit code 0）（依賴 T012）

**Checkpoint**：User Story 1（儀表板）可獨立完成本機建置與（若在 CI 環境）獨立發佈展示。

---

## Phase 4: User Story 2 - 從今日課程進入完整文章全文閱讀 (Priority: P2)

**Goal**：學習者從儀表板今日課程連結點進去，看到該 Concept 對應的完整 Article（含 Digest 之外的
完整內容），或直接持有網址造訪亦可正常呈現。

**Independent Test**：任選一個已產生 Full Article 的 Concept，直接開啟其全文閱讀頁 HTML 檔案，驗證
內容包含 Digest 之外的完整正文區塊，不需要先經過儀表板導覽。

### Tests for User Story 2

- [X] T015 [P] [US2] 撰寫 `tests/unit/pages-article.test.ts`（先寫、先失敗）：驗證 8 段固定順序
      （Concept → Thinking → Pattern Recognition → Common Mistakes → Complexity → TypeScript Corner
      → Python Corner → Tomorrow Preview）內容各自獨立、經 `parseSections(article.rawContent)`
      取得（**MUST NOT** 使用 `article.conceptBody`，research R12）；驗證 Today's Challenge 為結構化
      題目清單（依題號升冪、含 title/url/difficulty，查無對應題號時 throw，不得靜默省略）；驗證輸出
      HTML 皆經 entity escape —— research R2、R12、
      [site-build-contract.md](./contracts/site-build-contract.md) §4

### Implementation for User Story 2

- [X] T016 [US2] 實作 `src/pages/article-page.ts`：導出 `ArticlePageView` 建構函式 + HTML 渲染，內部對
      `article.rawContent` 呼叫既有 export 函式 `parseSections()` 取回 8 段固定區塊原文（各自經
      `marked.parse()`），對 `article.challenge` 全部題號依 id 升冪逐題向 Problem Bank 查回
      title／url／difficulty 組成結構化清單，使 T015 由紅轉綠（依賴 T002、T015）
- [X] T017 [US2] 擴充 `src/pages/site.ts` 的 `buildSite()`：對每個 `unlocked === true` 的 Concept（依
      T006 解鎖集合）以既有 export 函式 `readArticleCached(node.articlePath, node.id, input.deps)` 取得
      `ArticleContent`（與 `compile()` 同一條讀檔路徑、共用 `deps.articleCache`），交給 `article-page.ts`
      （T016）產生 `articles/{conceptId}.html` 並加入 `SiteOutput`（依賴 T006、T011、T016）
- [X] T018 [US2] 依 [quickstart.md](./quickstart.md) §3 手動驗收：從儀表板點擊「閱讀全文」一次點擊
      進入全文閱讀頁；驗證含 8 段固定區塊、Today's Challenge 為可點連結清單且含難度、不含
      Digest／TypeScript Tip／Python Tip；直接以檔案路徑開啟同一頁面驗證免登入（依賴 T017）

**Checkpoint**：User Story 1 與 2 皆可獨立運作——全文頁不需經過儀表板導覽也能正確呈現。

---

## Phase 5: User Story 3 - 透過 RSS/Atom 訂閱掌握新課程發佈 (Priority: P3)

**Goal**：訂閱者可訂閱「全站」或「特定 Track」的 RSS feed，依實際推播節奏收到新項目。

**Independent Test**：訂閱 feed 網址後比對其中項目數量與識別碼，可獨立驗證「新增項目」與「識別碼穩定
不重複」兩件事，不需要先驗證儀表板版面。

### Tests for User Story 3

- [X] T019 [P] [US3] 撰寫 `tests/unit/pages-feed.test.ts`（先寫、先失敗）：驗證 per-track feed 只收錄
      該 Track `history` 中帶 `conceptId` 的項目；驗證依 `pubDate` 遞減排序、截斷至
      `HISTORY_LIMIT`（**MUST 由 `src/state/state-store.ts` import，即 T000 開放的 export；MUST NOT 在
      `src/pages/**` 另宣告一個 30**——FR-016 明訂不得另行實作獨立的保留機制）；驗證同一 `conceptId`
      至多出現一次、全站 feed
      去重時取最早 `pubDate`；驗證 `guid`（= 全文頁完整 URL，`isPermaLink="true"`）在項目被滾動移除後
      對仍保留項目維持完全相同字串；驗證 XML entity escape、不使用 CDATA —— 
      [feed-contract.md](./contracts/feed-contract.md) 全部

### Implementation for User Story 3

- [X] T020 [US3] 實作 `src/pages/feed.ts`：導出 `FeedItemView`／`FeedView` 建構函式 + RSS 2.0 XML
      序列化（channel 層級元素、item 排序截斷去重、guid=url、XML escape），使 T019 由紅轉綠（依賴
      T002、T019）
- [X] T021 [US3] 擴充 `src/pages/site.ts` 的 `buildSite()`：產生全站 `feed.xml`（三軌 `history` 聯集
      去重）與**每個 `state.tracks` 中已知 Track**（判準 MUST 為 `state.tracks`，**MUST NOT** 為
      `enabledTracks`——Track 被停用後既有訂閱者不得收到 404）的 `feed-{track}.xml`（kebab-case 對應
      `Track` 值）並加入 `SiteOutput`（依賴 T006、T011、T020）
- [X] T022 [US3] 依 [quickstart.md](./quickstart.md) §4 手動驗收：per-track feed 項目數 ≤ 30 且
      `guid`/`link` 指向對應全文頁；新增不含 `conceptId` 的 history 項目後 feed 不變；新增帶
      `conceptId` 的項目後出現一筆新項目且既有 `guid` 不變；全站 `feed.xml` 涵蓋三軌聯集且不重複
      （依賴 T021）

**Checkpoint**：全部三個 User Story（儀表板／全文閱讀頁／RSS 訂閱）皆可獨立運作與驗收。

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**：跨三個 User Story 的整體不變式驗證與端到端失敗隔離驗收。

- [ ] T023 撰寫並執行 `tests/unit/pages-site-determinism.test.ts`：對完整組裝後的 `buildSite()`
      （T011＋T017＋T021 皆已完成）以同一 `SiteBuildInput` 呼叫 100 次，驗證 `SiteOutput` 全部鍵值
      逐 byte 相同（不讀 `Date.now()`／環境變數／隨機取樣）—— SC-007、
      [site-build-contract.md](./contracts/site-build-contract.md) §2（依賴 T011、T017、T021；
      **非 [P]**——同時依賴三個 Story 對 `site.ts` 的擴充全數完成）
- [ ] T023a [P] 撰寫並執行 `tests/unit/pages-stateless-guard.test.ts`：掃描 `src/pages/**` 全部檔案，
      驗證不出現 `node:fs`／`fs` 的 import，也不出現 `writeFileSync`／`readFileSync` 等檔案 I/O 呼叫
      （比照既有 `tests/unit/no-llm-in-src.test.ts` 的守門測試模式）—— FR-014 發佈階段完全 stateless、
      [site-build-contract.md](./contracts/site-build-contract.md) §7
- [ ] T024 依 [quickstart.md](./quickstart.md) §5 手動驗收：本機連續執行兩次 `npm run build:pages`，
      以 `Compare-Object` 比對兩次輸出目錄，確認零差異（SC-007）（依賴 T023）
- [ ] T024a 依 [quickstart.md](./quickstart.md) §6 手動驗收（需 CI 環境）：確認 `pages` job 與 `push`
      job 屬於同一個 workflow run、且在 `state` 分支 commit step 之後執行；該次 run 結束後**立即**開啟
      公開站台，確認呈現內容與該次 run 剛 commit 的 `state.json` 一致，全程無人工介入（SC-005、FR-012）
      （依賴 T013）
- [ ] T025 依 [quickstart.md](./quickstart.md) §7 手動驗收（需 CI 環境，`workflow_dispatch` 觸發並
      暫時破壞 `pages` job 某一步驟）：確認 `push` job 與 `state` 分支 commit 100% 正常完成、第一個
      已設定頻道收到琥珀色通知、workflow 最終結論不因 `pages` job 失敗而顯示失敗（SC-004、FR-011、
      FR-017）（依賴 T013）
- [ ] T026 依 [quickstart.md](./quickstart.md) §8 手動驗收（私有 repo 或模擬 `gh api` 回傳
      `"private": true"`）：確認 `build:pages` 未被執行、無任何部署動作、**無**琥珀色通知發出（FR-001）
      （依賴 T013）
- [ ] T027 執行 `npm test` 全量迴歸：確認既有 `tests/unit/no-llm-in-src.test.ts`（掃描整個 `src/`）與
      `tests/unit/daily-no-llm-key.test.ts`（掃描整份 `daily.yml`）自動涵蓋本 Feature 新增的檔案與
      workflow 內容並維持通過（憲章 VIII；依賴全部前述任務完成）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**：無依賴，可立即開始。T000（`HISTORY_LIMIT` 改為 export）MUST 早於 T020
  （`feed.ts` 需要 import 它）。
- **Foundational（Phase 2）**：依賴 Setup 完成——**封鎖全部 User Story**，MUST 最先完成
  （`TrackProgressView`／`CurriculumEntryView`／解鎖集合是 P2–P4 共用資料層，見 plan.md）。
- **User Stories（Phase 3–5）**：皆依賴 Foundational 完成。US1／US2／US3 彼此在「測試 + 模組實作」
  層級（T009/T015/T019 與 T010/T016/T020）互不相依，可平行推進；但三者都會擴充同一份
  `src/pages/site.ts`（T011 → T017 → T021），**此串接 MUST 依序完成**（同檔案疊加，避免合併衝突），
  建議順序為 US1 → US2 → US3（對齊 spec.md 的 P1/P2/P3 優先序），但技術上 US2／US3 的模組本體
  （T016、T020）可先行開發、只有各自對 `site.ts` 的擴充步驟需要排隊。
- **Polish（Final Phase）**：依賴 US1–US3 的 `site.ts` 擴充（T011/T017/T021）全數完成。

### User Story Dependencies

- **User Story 1（P1）**：Foundational 完成後即可開始，不依賴 US2／US3。
- **User Story 2（P2）**：Foundational 完成後即可開始模組實作（T015/T016）；對 `site.ts` 的擴充
  （T017）依實作順序排在 T011（US1）之後。
- **User Story 3（P3）**：Foundational 完成後即可開始模組實作（T019/T020）；對 `site.ts` 的擴充
  （T021）依實作順序排在 T017（US2）之後。

### Within Each User Story

- 測試 MUST 先寫、先失敗，再實作使其通過（T009→T010、T015→T016、T019→T020）。
- 資料層／渲染模組先於 `site.ts` 整合；`site.ts` 整合先於 `build-pages.ts`／workflow（僅 US1 涉及
  後兩者，因其為三個 Story 共用的單一入口）。
- 每個 Story 完成後即可獨立驗收（quickstart.md 對應章節），再進入下一優先序 Story。

### Parallel Opportunities

- Setup 的 T000、T001 可與任何其他任務平行（無相依）。
- Foundational 的 T002、T003、T004、T005、T007、T008a 可全部平行（不同檔案、無待完成依賴）。
- Foundational 完成後，US1／US2／US3 的**測試撰寫**（T009、T015、T019）三者可平行；三者的**模組
  實作**（T010、T016、T020）亦可平行（不同檔案）。
- 各 Story 對 `site.ts` 的擴充步驟（T011/T017/T021）**不可平行**（同檔案），須循序合併。

---

## Parallel Example: Foundational Phase

```bash
# 地基階段可同時開 6 個平行工作：
Task: "建立 src/pages/html.ts 共用 HTML/XML escape 與版面 helper"
Task: "撰寫 tests/unit/pages-unlock.test.ts"
Task: "撰寫 tests/unit/pages-curriculum-view.test.ts"
Task: "撰寫 tests/unit/pages-progress.test.ts"
Task: "擴充 tests/unit/alert.test.ts 新增 renderPagesFailureNotice 案例"
Task: "撰寫 tests/unit/notify-pages-failure.test.ts"
```

## Parallel Example: 三個 User Story 的測試與模組本體（Foundational 完成後）

```bash
# 三個 Story 的測試可同時開工：
Task: "撰寫 tests/unit/pages-dashboard.test.ts"
Task: "撰寫 tests/unit/pages-article.test.ts"
Task: "撰寫 tests/unit/pages-feed.test.ts"

# 三個 Story 的模組本體（測試轉綠後）亦可同時開工：
Task: "實作 src/pages/dashboard.ts"
Task: "實作 src/pages/article-page.ts"
Task: "實作 src/pages/feed.ts"

# 但三者對 src/pages/site.ts 的擴充步驟須排隊完成（同檔案）：
# site.ts（US1 初版）→ site.ts（US2 擴充）→ site.ts（US3 擴充）
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1：Setup（T000–T001）＋ 一次性人工設定（GitHub Settings → Pages → Source = GitHub Actions）
2. 完成 Phase 2：Foundational（T002–T008b，CRITICAL——封鎖全部 Story）
3. 完成 Phase 3：User Story 1（T009–T014）
4. **停下並驗證**：依 quickstart.md §1–§2 獨立驗收儀表板
5. 若在 CI 環境，`pages` job 此時已可將儀表板（含空的 `articles/`／`feed.xml` 佔位邏輯尚未存在，
   `SiteOutput` 此階段就是只含 `index.html`）發佈上線

### Incremental Delivery

1. 完成 Setup + Foundational → 地基就緒
2. 加入 User Story 1 → 獨立驗收 → 部署/展示（MVP！儀表板上線）
3. 加入 User Story 2 → 獨立驗收 → 部署/展示（全文閱讀頁上線）
4. 加入 User Story 3 → 獨立驗收 → 部署/展示（RSS 訂閱上線）
5. 執行 Phase 6 Polish：determinism 與失敗隔離的端到端驗證

### Parallel Team Strategy

多人協作時：

1. 團隊共同完成 Setup + Foundational
2. Foundational 完成後：
   - 開發者 A：User Story 1（含 `build-pages.ts`／workflow，三個 Story 共用的入口）
   - 開發者 B：User Story 2 的 `article-page.ts` 本體（T016，不需等 A 的 `site.ts` 初版）
   - 開發者 C：User Story 3 的 `feed.ts` 本體（T020，同上）
3. B、C 完成模組本體後，依序（US1 → US2 → US3）合併各自對 `site.ts` 的擴充步驟

---

## Notes

- 全部任務皆為單一 TypeScript 專案內的檔案異動，無 monorepo／多服務協調需求。
- `src/pages/**` MUST 為純函式（不讀 `Date.now()`／環境變數／隨機取樣），唯一 I/O／`process.exit`
  邊界是 `scripts/build-pages.ts`（憲章 IX，contracts/site-build-contract.md §2）。
- 三個 User Story 共用 `src/pages/site.ts` 與 `scripts/build-pages.ts` 這兩個整合點，是本 Feature
  唯一違反「Story 間零檔案衝突」預設假設之處；已在上方 Dependencies 明確標註排隊順序，不影響三個
  Story 各自的獨立可測試性（各自的資料層與渲染模組仍是完全獨立的檔案）。
- 完成每個任務或邏輯群組後 commit（依專案 CLAUDE.md 的 Conventional Commits 規範，scope 統一為
  `009-pages-publish`）。
