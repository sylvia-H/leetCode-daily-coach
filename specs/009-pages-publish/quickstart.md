# Quickstart: Pages Publish 驗收指引

本指引驗證 F9 端到端可運作，對應 [spec.md](./spec.md) 的 User Story 1–3 與 Success Criteria。
執行前提：已完成 `npm ci`、`npm run build`；有一份可用的 `state.json`（可用
`tests/helpers/*` 既有 fixture 或本機手造的最小範例）。

## 1. 本機建置站台（不需要 GitHub Actions、不需要真實 repo）

```powershell
$env:STATE_FILE = "path\to\sample-state.json"
$env:PAGES_OUTPUT_DIR = "pages-dist"
$env:PAGES_BASE_URL = "https://example.github.io/leetcode-daily-coach"

# ⚠️ 這三個 MUST 設定，否則 enabledTracks 會是空集合、儀表板不會出現任何 Track 進度區塊
#    （research R13：build-pages.ts 以 parseWebhooks(env) 判斷「哪些 Track 目前啟用」）。
#    本階段**不會**發送任何 Discord 訊息，值只是佔位字串，僅供啟用判定使用。
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "local-dry-run-placeholder"
$env:DISCORD_WEBHOOK_URL_INTERVIEW_READY = "local-dry-run-placeholder"
$env:DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY = "local-dry-run-placeholder"

npm run build:pages
```

**預期**：`pages-dist/` 產生 `index.html`、`articles/{conceptId}.html`（每個已解鎖 Concept 一份）、
`feed.xml`、`feed-{track}.xml`（每個 `state.json` 中已知的 Track 一份）；exit code 0。

> **只驗證零 Track Edge Case 時**：改為**不設定**上述三個 webhook 變數重跑，預期儀表板呈現空的 Track
> 進度區塊、課綱順序視圖仍完整呈現（含解鎖狀態），且 exit code 仍為 0、不報錯。

## 2. User Story 1 驗收——儀表板反映三軌進度

1. 準備一份 `state.json`：Track A 有推播歷史（`history` 非空、未 `completedAt`）、Track B 剛啟用
   （`history` 為空）、Track C 已完課（`completedAt` 非空）。
2. 執行步驟 1 的建置指令。
3. 開啟 `pages-dist/index.html`：
   - Track A MUST 顯示目前進度位置與最近一次推播的 Session 標題／類型。
   - Track B MUST 顯示「尚未開始」，不得空白或報錯。
   - Track C MUST 顯示「已完課」，不得停留在「今日課程」欄位。
   - 課綱順序列表 MUST 同時列出已解鎖與未解鎖的 Concept；未解鎖者 MUST 為純文字、無可點連結。
   - **SC-001 目視檢查**：以桌面瀏覽器視窗（最大化，1920×1080 或以上）開啟，**不捲動**即可同時看到
     三個 Track 各自的目前進度與今日課程標題（課綱順序列表允許落在首屏之下）。

（對應 spec Acceptance Scenarios US1 #1–#3、FR-003／FR-004／FR-005／FR-005a、SC-001）

## 3. User Story 2 驗收——全文閱讀頁

1. 從步驟 2 的儀表板點擊任一已解鎖 Concept 的「閱讀全文」連結。
2. 驗證開啟的 `articles/{conceptId}.html`：
   - 含 Concept／Thinking／Pattern Recognition／Common Mistakes／Complexity／TypeScript Corner／
     Python Corner／Tomorrow Preview 全部區塊。
   - 「今日題目」為結構化清單（可點連結、含難度），非裸題號。
   - 不含 Digest／TypeScript Tip／Python Tip（推播精簡版）。
3. 直接以檔案路徑（模擬「先前分享取得的網址」）開啟同一頁面，驗證不需要任何登入或額外步驟。

（對應 spec Acceptance Scenarios US2 #1–#2、FR-006／FR-007）

## 4. User Story 3 驗收——RSS 訂閱

1. 開啟 `pages-dist/feed-{track}.xml`（任一 Track），確認：
   - 項目數 ≤ 30。
   - 每個項目的 `<guid isPermaLink="true">` 與 `<link>` 相同，且指向 `articles/{conceptId}.html`。
2. 修改 sample state：把該 Track 的 `history` 增加一筆**不含 `conceptId`** 的項目（模擬
   review／practice Session），重新建置，確認 feed 項目數量與內容**不變**（Edge Case：非 concept
   類 Session 不產生 feed 項目）。
3. 修改 sample state：把該 Track 的 `history` 增加一筆帶 `conceptId` 的新項目，重新建置，確認 feed
   出現一筆新項目、既有項目的 `guid` 不變。
4. 開啟 `pages-dist/feed.xml`（全站），確認涵蓋三軌已解鎖 Concept 的聯集，且同一 Concept 不重複出現。

（對應 spec Acceptance Scenarios US3 #1–#3、FR-008／FR-009／FR-010／FR-015／FR-016）

## 5. Determinism 驗收（SC-007）

```powershell
npm run build:pages
Copy-Item -Recurse pages-dist pages-dist-run1
npm run build:pages
Compare-Object (Get-ChildItem -Recurse pages-dist) (Get-ChildItem -Recurse pages-dist-run1)
```

**預期**：兩次輸出的每個檔案逐 byte 相同（無差異）。單元測試層級的等價驗證見
`tests/unit/pages-site-determinism.test.ts`。

## 6. 同一次執行內即完成發佈（SC-005，需在 CI 環境驗證）

**前置（一次性）**：GitHub **Settings → Pages → Build and deployment → Source** 已設為
**GitHub Actions**（見 [contracts/workflow-integration.md](./contracts/workflow-integration.md) §0）。
未完成此設定時 `deploy-pages` 會失敗並轉為 §7 的琥珀色通知情境。

1. 以 `workflow_dispatch` 觸發 `daily.yml`（`dry_run: false`），或等待一次正常的排程執行。
2. 確認 `pages` job 與 `push` job 屬於**同一個 workflow run**（同一 run id），且 `pages` job 在
   `push` job 的「Commit state changes」step 之後才開始。
3. 該次 run 結束後**立即**（不另外觸發任何 workflow、不等待下一個排程週期）開啟公開站台網址，
   確認儀表板呈現的三軌進度與該次 run 剛 commit 到 `state` 分支的 `state.json` 完全一致。
4. 確認整個過程沒有任何人工步驟介入。

（對應 spec SC-005、FR-012）

## 7. 失敗隔離驗收（SC-004，需在 CI 環境或以 workflow 手動觸發驗證）

1. 以 `workflow_dispatch` 觸發 `daily.yml`（`dry_run: false`），暫時讓 `pages` job 的某一步驟失敗
   （例如暫時破壞 `PAGES_BASE_URL`）。
2. 確認：`push` job 與 `state` 分支 commit 100% 正常完成、不受影響。
3. 確認：第一個已設定的 Discord 頻道收到琥珀色通知（區別於紅色核心失敗告警）。
4. 確認：該次 workflow run 的最終結論不因 `pages` job 失敗而顯示為失敗（`continue-on-error` 生效）。

（對應 spec SC-004、FR-011、FR-017、contracts/workflow-integration.md）

## 8. 私有 repo 自動跳過（FR-001）

1. 在測試用私有 repo（或本機模擬 `gh api` 回傳 `"private": true`）情境下觸發 `pages` job。
2. 確認：`build:pages` 未被執行、無任何部署動作、**無**琥珀色通知發出（區別於真正的發佈失敗）。
