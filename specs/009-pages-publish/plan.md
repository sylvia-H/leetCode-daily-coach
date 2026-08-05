# Implementation Plan: Pages Publish — GitHub Pages 儀表板、全文閱讀與 RSS 訂閱

**Branch**: `009-pages-publish` | **Date**: 2026-08-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-pages-publish/spec.md`

## Summary

把「唯一權威狀態」`state.json` + 凍結課表 + 凍結 Article，重新渲染成一份公開的靜態網站
（儀表板 + 全文閱讀頁 + RSS feed），作為每日推播工作流程的完全隔離末段。`/speckit-clarify`
（2026-08-05）已就 5 個未決點定案，其中最關鍵的一項（Q3）把原本規劃的「文章版本記錄」機制整組移除
——發佈階段因此是**完全 stateless** 的純函式：不新增任何持久化檔案、不產生第二個 commit、feed 完全由
`state.json` 既有的 per-Track `history` 導出。

**技術路線**：

1. **純函式層（`src/pages/**`）**——`buildSite(input): SiteOutput`，由 `AppState` +
   `CurriculumGraph` + `TrackSchedule` + `ArticleContent` + Problem Bank 決定性導出儀表板 HTML、
   每個已解鎖 Concept 的全文閱讀頁 HTML、全站與 per-Track 的 RSS 2.0 feed。不新增 npm 相依，複用既有
   `marked`（markdown → HTML）。
2. **I/O 入口（`scripts/build-pages.ts`）**——讀環境變數（`STATE_FILE`／`PAGES_OUTPUT_DIR`／
   `PAGES_BASE_URL`／三個 `DISCORD_WEBHOOK_URL_*`，後者僅供 `parseWebhooks()` 判斷啟用與否，不建立
   webhook client，research R13）、呼叫既有 `loadCompilerDeps()`（回傳的 `CompilerDeps` 原封作為
   `SiteBuildInput.deps`）+ `state-store.ts` 的 `load()`、呼叫 `buildSite()`、寫檔至 `pages-dist/`
   （gitignored）。與 `scripts/generate-schedule.ts` 等既有腳本同形：唯一的 I/O／`process.exit` 邊界。
   同層另新增 `scripts/notify-pages-failure.ts` 作為 FR-017 通知的發送邊界。
3. **workflow 層（`.github/workflows/daily.yml` 新增 `pages` job）**——`gh api` 偵測 repo
   可見性（FR-001，完全在 workflow 層完成，不進 TypeScript；step 需 `GH_TOKEN`）→ 呼叫
   `npm run build:pages` → `actions/upload-pages-artifact` + `actions/deploy-pages`（job 需宣告
   `environment: github-pages`）。`needs: push` 但 `if: !cancelled()`（單一 Track 失敗不阻擋 Pages
   反映其餘 Track 的已 commit 進度；但使用者主動取消時不部署）；job 層 `continue-on-error: true`
   使其失敗不影響 workflow 最終結論（FR-017）；失敗時由 `scripts/notify-pages-failure.ts` 發琥珀色
   Discord 通知（組版複用 `src/renderer/alert.ts` 的顏色區分模式，新增 `renderPagesFailureNotice`）。

**Phase 0 的關鍵設計決策**（詳見 [research.md](./research.md)）：feed 格式定案 RSS 2.0（R3，spec 唯一
明文延後的技術選型）；全文閱讀頁 MUST 結構化重建 Today's Challenge（不可直接 dump markdown，R2）；
FR-006 的「解鎖集合」資料來源 MUST 為 `completedConceptIds` 聯集而非 `history` 聯集（R8，兩者在長期
運行下會產生不同結果，只有前者滿足「已解鎖不可倒退」）；repo 可見性偵測完全在 workflow 層（R5），
`src/`／`scripts/` 不呼叫任何 GitHub API；全文頁固定區塊 MUST 重新呼叫既有 `parseSections(rawContent)`
取得，不可用 `conceptBody`、不擴充 `ArticleContent`（R12）；`pages` job 的 `enabledTracks` MUST 由
`parseWebhooks()` 算出，MUST NOT 呼叫會在零 Track 時 throw 的 `loadConfig()`（R13）。

## Technical Context

**Language/Version**: TypeScript 5.5（strict）／Node.js 24（ESM，`"type": "module"`）

**Primary Dependencies**: `marked`（既有相依，新增用途：markdown → HTML 全文渲染，R1／R2）；Node 內建
`fs`（讀 state／寫站台產物）。**本 Feature 不新增任何 npm 相依**——刻意不引入 SSG 框架、RSS 產生器套件
（research R1／feed-contract.md §7）。

**Storage**: 唯讀消費既有真實來源（`state` 分支 `state.json`、`concepts/**`、`articles/**`、
`schedules/**`、`data/problem-bank.json`）；輸出至本機／CI 暫存的 `pages-dist/`（gitignored，
非真實來源，比照 `dist/`）。**本 Feature 不新增任何持久化狀態**（`/speckit-clarify` Q3 定案）。

**Testing**: `vitest`（`npm test`）；型別檢查 `npm run typecheck`。全部新增測試皆為純函式單元測試
（HTML／XML 字串斷言 + determinism 重複呼叫比對），無需 mock 網路——`gh api` 偵測與 Discord 通知發送
留在 workflow YAML／既有 `renderer/alert.ts` 測試模式內，不需要新的網路 mock 機制。

**Target Platform**: GitHub Actions（Ubuntu, Node 24，`daily.yml` 新增 job）＋ GitHub Pages（靜態
託管，`actions/upload-pages-artifact` + `actions/deploy-pages`）＋ 本機 Windows / PowerShell 可離線
執行 `build:pages` 驗證。

**Project Type**: 單一 TypeScript 專案（CLI + build-time scripts），非 monorepo、非常駐 web service
（Pages 本身是靜態託管，非本專案運行的伺服器）。

**Performance Goals**: 建置為一次性、無需最佳化的批次渲染——200+ 篇文章 + 3 份 feed，單次執行時間
MUST 遠低於 GitHub Actions job 逾時（預期 < 30 秒，純檔案讀寫與字串組裝，無網路等待）。

**Constraints**:
- 發佈階段 MUST 為完全 stateless（FR-014）：MUST NOT 新增任何持久化檔案、MUST NOT 產生第二個
  `state` 分支 commit。
- `buildSite` MUST 為純函式，同輸入 MUST 產出逐 byte 相同輸出（SC-007）。
- Pages 段失敗或跳過 MUST NOT 影響 `push` job、`state` 分支 commit 或 workflow 的最終 exit code
  （FR-011／FR-017）。
- `src/`／`scripts/` MUST NOT 呼叫任何 GitHub API 或引入 LLM SDK（既有 `no-llm-in-src.test.ts`／
  `daily-no-llm-key.test.ts` 自動涵蓋新檔案）。
- Free-tier only：僅 GitHub Actions + GitHub Pages（同帳號免費層）+ 既有 Discord Webhook，不新增
  任何付費服務。

**Scale/Scope**: 3 Track、目前約 165 個 Concept（F7/F8 累積）；長期上限視課表成長，全文頁數量隨解鎖
進度增加（FR-006）。新增檔案約 12～14 個（`src/pages/**` 6 個模組、`scripts/build-pages.ts`、
`scripts/notify-pages-failure.ts`、`daily.yml` 新增 job、`renderer/alert.ts` 擴充、
`state/state-store.ts` 的 `HISTORY_LIMIT` 改為 export）。

**未解 NEEDS CLARIFICATION**：無。spec 明文交給 plan 的唯一決策（feed 格式）已於
[research.md](./research.md) R3 定案。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**憲章版本**：v1.0.2（2026-07-30）。**Phase 0 前檢查：PASS。Phase 1 設計後複查：PASS（無新增違反）。**

| # | 原則 | 判定 | 本 Feature 如何滿足 |
| --- | --- | --- | --- |
| I | Concept-first, Problem-second | ✅ | 全文閱讀頁固定區塊順序（Concept → Thinking → … → Today's Challenge）與 Discord 版面同一順位邏輯，觀念先於題目（data-model.md §3） |
| II | One Concept per Session | ✅ | 不新增／不改動 concept 類 Session；一個 Concept 對應一份全文閱讀頁 |
| III | Small Learning Steps | ✅ | Curriculum 完全不動 |
| IV | Deterministic Curriculum | ✅ | 只讀既有課表，不參與排序決策；LLM 完全不參與本 Feature 任何路徑 |
| V | Curriculum as DAG | ✅ | 課綱視圖排序沿用既有 `ordinalOf` 全序（research R9），不重新定義 DAG 邏輯 |
| VI | Shared Knowledge, Different Tracks | ✅ | 全文閱讀頁不分 Track（三軌共用同一份 Article 正文）；解鎖判定利用「三軌共用 DAG」的特性做等價證明（research R8） |
| VII | LLM Authors Once, Not Daily | ✅ | 本 Feature 完全不涉及 LLM；渲染的是既有凍結產物 |
| VIII | Zero-LLM Daily Runtime | ✅ | `src/pages/**`／`scripts/build-pages.ts` 不 import `@google/genai`（`no-llm-in-src.test.ts` 守）；`daily.yml` 新增內容不含金鑰名稱（`daily-no-llm-key.test.ts` 守，見 contracts/workflow-integration.md §6） |
| IX | Build-time over Runtime | ✅ | `buildSite` 為確定性純函式；repo 可見性偵測（環境事實，非課程邏輯）刻意留在 workflow 層而非塞進 Compiler（research R5 的分工說明） |
| X | Language-specific Learning | ✅ | 全文閱讀頁完整呈現 TypeScript Corner／Python Corner（比 Discord 精簡版 Tips 更完整） |
| XI | Renderer Knows Nothing About Curriculum | ✅（見 contracts/site-build-contract.md §0 的範圍澄清） | 本原則規範 Discord Renderer；`buildSite` 是服務不同輸出的平行消費者，FR-005 明文要求它呈現課綱順序，兩者不衝突。單向依賴：`src/renderer/discord.ts`／`src/compiler/lesson.ts` MUST NOT import `src/pages/**` |
| XII | Deterministic & Reproducible Delivery | ✅ | `buildSite` 純函式性由 SC-007 + `tests/unit/pages-site-determinism.test.ts`（100 次重複呼叫比對）釘死；不讀時間、不隨機 |
| XIII | Generated Artifacts Are Frozen Once Committed | ✅ | `pages-dist/` 明確**不 commit**（gitignored，比照 `dist/`）；本 Feature 不產生任何需要凍結的新 artifact |
| XIV | Secrets Never in Repo | ✅ | 不新增任何 secret；`gh api` 用預設 `secrets.GITHUB_TOKEN`（GitHub Actions 內建，非本專案自訂 secret） |
| XV | Fault Isolation & Fail Loud | ✅ | `pages` job 獨立於 `push` job（`needs` + `if: !cancelled()`）；job 層 `continue-on-error` 隔離失敗；失敗由 `scripts/notify-pages-failure.ts` 發琥珀色告警（FR-017），區別於核心紅色告警 |
| XVI | Free-tier Only | ✅ | GitHub Pages 為同帳號 GitHub Actions 免費層的一部分，不新增付費服務；不新增 npm 相依 |
| XVII | One Human Checkpoint | ✅ | 完全自動化發佈，不新增任何人工審核關卡 |

**技術與資源約束**（憲章「Additional Constraints」）：無新選型衝突。composition root 不變（`scripts/
build-pages.ts` 是新增的一次性 CLI 入口，與既有 `generate-schedule.ts` 同形，不引入 DI 框架、不啟
HTTP server）；不新增環境變數命名於既有 Secrets 命名規則之外（`PAGES_BASE_URL`／`PAGES_OUTPUT_DIR`
為本 Feature 自訂的非 secret 環境變數，供 workflow 傳參，不涉及憲章「Secrets 命名固定」條款）。

**Complexity Tracking**：無需填寫（零違反）。

## Project Structure

### Documentation (this feature)

```text
specs/009-pages-publish/
├── plan.md                          # 本檔（/speckit-plan 輸出）
├── spec.md                          # 需求（既有，含 2026-08-05 Clarifications）
├── research.md                      # Phase 0：R1–R11 決策
├── data-model.md                    # Phase 1：衍生 view 型別、既有真實來源讀取範圍
├── quickstart.md                    # Phase 1：可執行的驗收腳本
├── contracts/
│   ├── site-build-contract.md       # buildSite 純函式契約 + HTML 渲染規則
│   ├── feed-contract.md             # RSS 2.0 序列化契約
│   └── workflow-integration.md      # daily.yml 新增 pages job 的契約
├── checklists/
│   └── requirements.md              # 既有，已於 clarify 後更新
└── tasks.md                         # Phase 2（/speckit-tasks 產出，非本命令）
```

### Source Code (repository root)

```text
src/
├── pages/
│   ├── site.ts                      # ★ 新增：buildSite() 組裝入口
│   ├── curriculum-view.ts           # ★ 新增：TrackProgressView / CurriculumEntryView 導出
│   ├── article-page.ts              # ★ 新增：ArticlePageView 導出 + HTML 渲染（含 Today's Challenge 結構化重建）
│   ├── feed.ts                      # ★ 新增：FeedView 導出 + RSS 2.0 XML 序列化
│   ├── dashboard.ts                 # ★ 新增：儀表板 HTML 渲染
│   └── html.ts                      # ★ 新增：共用 HTML/XML escape + layout helper
├── renderer/
│   └── alert.ts                     # 變更：新增 renderPagesFailureNotice（琥珀色，FR-017）
└── state/
    └── state-store.ts               # 變更：HISTORY_LIMIT 由私有 const 改為 export（feed 上限唯一來源，FR-016）

scripts/
├── build-pages.ts                   # ★ 新增：唯一 I/O / process.exit 入口，讀 env → 呼叫 buildSite → 寫檔
└── notify-pages-failure.ts          # ★ 新增：FR-017 通知的發送邊界（選第一個已設定 webhook → POST embeds）

tests/
└── unit/
    ├── pages-unlock.test.ts         # ★ 新增：解鎖集合聯集計算（research R8）
    ├── pages-progress.test.ts       # ★ 新增：TrackProgressView 三種狀態、非 concept 類今日課程標籤（R10）
    ├── pages-curriculum-view.test.ts # ★ 新增：課綱視圖排序、零 404（FR-005a）
    ├── pages-article.test.ts        # ★ 新增：全文閱讀頁固定區塊順序、Today's Challenge 結構化、escape
    ├── pages-feed.test.ts           # ★ 新增：RSS 排序/截斷/去重/escape/guid 穩定性
    ├── pages-site-determinism.test.ts # ★ 新增：SC-007，100 次重複呼叫 deep-equal
    ├── pages-dashboard.test.ts      # ★ 新增：儀表板三種 Track 狀態呈現、無時間戳
    ├── pages-stateless-guard.test.ts # ★ 新增：FR-014 守門——src/pages/** 不得出現檔案 I/O
    ├── notify-pages-failure.test.ts # ★ 新增：webhook 選擇順序、零 webhook 與發送失敗皆 exit 0
    └── alert.test.ts                # 變更：新增 renderPagesFailureNotice 案例（既有檔擴充）

.github/workflows/daily.yml          # 變更：新增 pages job（見 contracts/workflow-integration.md）
.gitignore                           # 變更：新增 pages-dist/
package.json                         # 變更：新增 "build:pages": "tsx scripts/build-pages.ts"
```

> **一次性前置設定（非程式碼）**：首次啟用前 MUST 於 GitHub **Settings → Pages → Source** 選擇
> **GitHub Actions**（見 contracts/workflow-integration.md §0）。屬環境設定，非常態性人工關卡，
> 不違反憲章 XVII。

**Structure Decision**：沿用既有單一專案結構，不新增頂層目錄。三條硬性歸屬（與 F7/F8 一致的既有分工）：

- **純函式進 `src/`**：`buildSite` 及其子模組必須是可被單元測試直接呼叫、不做 I/O 的純函式（憲章 IX），
  故獨立成 `src/pages/`，不與 `src/compiler/`（Lesson Compiler）混放——兩者服務不同的輸出契約
  （`Lesson` vs 靜態網站），但共用同一批底層讀取器（`loadCompilerDeps`、`state-store.ts`）。
- **I/O 與 `process.exit` 只在 `scripts/` 入口**：`build-pages.ts` 是唯一寫站台檔案、唯一讀環境變數的
  位置，與 `generate-schedule.ts`／`generate-materials.ts` 同形。
- **可見性偵測與部署完全留在 workflow YAML**：`gh api`、`actions/upload-pages-artifact`、
  `actions/deploy-pages` 不對應任何 `src/`／`scripts/` 程式碼（research R5）。

## 實作階段與依賴（供 `/speckit-tasks` 編排）

| Phase | 內容 | 依賴 | 對應需求 |
| --- | --- | --- | --- |
| **P1** | `src/pages/curriculum-view.ts`（解鎖集合、進度視圖、課綱視圖）＋ 單元測試 | — | FR-003～FR-006、FR-005a、research R8/R9/R10 |
| **P2** | `src/pages/article-page.ts`（全文閱讀頁結構化組裝）＋ 單元測試 | 無硬依賴，可與 P1 並行 | FR-006、FR-007、research R2 |
| **P3** | `src/pages/feed.ts`（RSS 2.0 序列化）＋ 單元測試 | P1（需要 `TrackProgressView`/`history` 導出邏輯） | FR-008～FR-010、FR-015、FR-016 |
| **P4** | `src/pages/dashboard.ts` + `src/pages/html.ts`（共用 escape/layout） | P1（消費其 view 型別） | FR-003、FR-004、FR-005、SC-001、SC-002 |
| **P5** | `src/pages/site.ts`（組裝 P1–P4 為 `buildSite`）＋ determinism 測試 | P1–P4 | SC-007 |
| **P6** | `scripts/build-pages.ts`（I/O 入口，含 R13 的 `enabledTracks` 判定）＋ `package.json` script | P5 | contracts/workflow-integration.md §3、research R13 |
| **P7** | `src/renderer/alert.ts` 新增 `renderPagesFailureNotice` ＋ `scripts/notify-pages-failure.ts` 發送邊界＋單元測試 | 無硬依賴，可與 P1–P6 並行 | FR-017 |
| **P8** | `.github/workflows/daily.yml` 新增 `pages` job（含 `environment: github-pages`、`gh api` 的 `GH_TOKEN`、傳入三個既有 `DISCORD_WEBHOOK_URL_*` secrets 供 R13 判定用途）＋ `.gitignore` 更新 | P6、P7 | FR-001、FR-011、FR-012、FR-017、research R13 |
| **P9** | 端到端驗收（quickstart.md 全部場景，含手動 workflow 觸發驗證失敗隔離） | P1–P8 | quickstart.md §1–§7 |

> **P1 是後續全部 Phase 的地基**：`TrackProgressView`／`CurriculumEntryView`／解鎖集合是 P2（判斷全文頁
> 是否存在）、P3（feed 資料來源部分依賴）、P4（儀表板消費）共用的資料層，MUST 最先完成並驗證
> research R8/R9/R10 的判定邏輯正確，避免其餘 Phase 建立在錯誤的解鎖/進度判定上重工。

### 測試落點對照

| 測試 | 檔案 | 釘死的東西 |
| --- | --- | --- |
| 解鎖集合聯集、單調性（不會倒退） | `tests/unit/pages-unlock.test.ts` | research R8、data-model.md §2 不變式 |
| Track 三種狀態（未開始／進行中／已完課）、非 concept 類今日課程標籤 | `tests/unit/pages-progress.test.ts` | FR-004、research R10 |
| 課綱視圖排序鍵、未解鎖項目無 `articleUrl` | `tests/unit/pages-curriculum-view.test.ts` | FR-005a、research R9 |
| 全文頁固定區塊順序、8 段各自獨立內容（非 `conceptBody` 合併字串）、Today's Challenge 結構化（含 Problem Bank 查無題號 fail loud）、HTML escape | `tests/unit/pages-article.test.ts` | research R2、R12、site-build-contract.md §4 |
| RSS 排序/截斷/去重/guid 穩定性/XML escape | `tests/unit/pages-feed.test.ts` | feed-contract.md 全部 |
| `buildSite` 100 次重複呼叫 deep-equal | `tests/unit/pages-site-determinism.test.ts` | SC-007 |
| 儀表板三種 Track 狀態、無時間戳、零 404 連結 | `tests/unit/pages-dashboard.test.ts` | SC-001、SC-002、FR-005a |
| `renderPagesFailureNotice` 顏色/文案/純函式性 | `tests/unit/alert.test.ts`（擴充） | FR-017 |
| 通知發送：webhook 選擇順序、零 webhook 與發送失敗皆 exit 0 | `tests/unit/notify-pages-failure.test.ts` | FR-017、workflow-integration.md §4.2 |
| `src/pages/**` 不得出現檔案 I/O（stateless 守門） | `tests/unit/pages-stateless-guard.test.ts` | FR-014、site-build-contract.md §7 |

既有守門測試自動涵蓋、無需另建：`no-llm-in-src.test.ts`（掃描整個 `src/`）與 `daily-no-llm-key.test.ts`
（掃描整份 `daily.yml`）已自動涵蓋本 Feature 新增的檔案與 workflow 內容。

## Complexity Tracking

> 無憲章違反，本節不適用。
