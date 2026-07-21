# Implementation Plan: Walking Skeleton（垂直切片：從課程內容到 Discord 的全鏈路打穿）

**Branch**: `001-walking-skeleton` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-walking-skeleton/spec.md`

## Summary

以**一篇手寫 Full Article + 一份硬編 3-Session 課表 + 3 題的最小 Problem Bank**為素材，打通
`排程 → 讀取進度 → 組裝 Lesson → 渲染 Discord embeds → 推播 → 推進進度並提交至 state 分支`
這條完整鏈路，並在真實 Discord 上驗證版面觀感、雙 cron 去重與 state 分支流程。

技術上是一支 **strict TypeScript 的一次性 CLI**（`node dist/main.js`，跑完即退）：`src/main.ts` 作為
composition root 手動組裝 `Config / StateStore / LessonCompiler / DiscordRenderer / DiscordWebhookClient`，
逐 Track 串行處理。本 Feature **不含任何 LLM 呼叫**，也不建立 DAG / schema 驗證 / 課表生成器。

本 Feature 同時建立**整個專案的工程鷹架**（`package.json` / `tsconfig.json` / vitest 設定 /
`.github/workflows/daily.yml`），後續 Feature 在此之上擴充而非重建。

## Technical Context

**Language/Version**: TypeScript 5.x（strict，`noUncheckedIndexedAccess` 開啟）→ `tsc` 編譯 → Node.js 24 執行

**Primary Dependencies**:
- `gray-matter`（教材 frontmatter 解析）
- `marked`（Markdown token 化，用於固定區塊切分——不轉 HTML，只用 lexer）
- Node 內建 `fetch`（undici；Discord Webhook POST）
- 開發期：`typescript`、`vitest`、`@types/node`
- **本 Feature 不引入 `zod`**（FR-004b 明訂不做 schema 驗證，屬 F2）；**不引入 `@google/genai`**（憲章 VIII）
- `package-lock.json` **MUST 一併 commit**：CI 以 `npm ci` 安裝，缺 lockfile 會在第一步就失敗

**Storage**: 純檔案。`state.json`（`state` 分支，經 `STATE_FILE` 指向）、`data/problem-bank.json`、
`articles/**.md`。無資料庫、無常駐服務。

**Testing**: `vitest`（單元測試）。外部呼叫（Discord）以 mock `fetch` 測；本機驗證版面一律 `DRY_RUN=true`。

**Target Platform**: GitHub Actions `ubuntu-latest` + Node 24（主要）；本機 Windows / PowerShell（開發與 dry run）

**Project Type**: 單一專案、一次性 CLI（single-shot batch job）。非 web service、無 HTTP server、無 DI 框架。

**Performance Goals**: 非效能導向。單次執行（1 Track）在 GitHub Actions 上 SHOULD 於 30 秒內完成
（含 npm ci / build 則 ≤ 3 分鐘，對應 SC-001 的「3 分鐘內收到」）。

**Constraints**:
- 單則 Discord 訊息全部 embeds 文字總和 ≤ 6,000（平台硬限）且 ≤ 5,500（自訂上限）；各區塊預算見憲章 §技術與資源約束
- 每日 runtime 零 LLM：`src/**` MUST NOT import `@google/genai`；`daily.yml` MUST NOT 含 `GEMINI_API_KEY`
- 所有「今天」判斷一律 Asia/Taipei 日曆日
- Renderer 為 stateless 純函式

**Scale/Scope**: 1 篇教材、3 個 Session、3 題、3 個 Track（驗收只啟用 Foundation）。
預估 production code ~700–900 行、測試 ~500–700 行。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

逐條對照憲章 v1.0.1：

| # | 原則 | 本 Feature 判定 | 說明 |
|---|---|---|---|
| I | Concept-first, Problem-second | ✅ PASS | 主 Embed（觀念）先於題目 Embed，順序寫死於 Renderer |
| II | One Concept per Session | ✅ PASS | 3 個 Session 皆為 concept 類，各只引入一個 Concept（本 Feature 三課共用同一篇，屬刻意設計，見 spec Assumptions） |
| III | Small Learning Steps | ➖ N/A | 無 Curriculum 顆粒度決策（F2） |
| IV | Deterministic Curriculum | ✅ PASS | 課表為硬編常數，順序固定；無任何動態排序 |
| V | Curriculum as DAG | ➖ N/A | 本 Feature 不建 DAG（F2）；學習路徑為硬編對照表（FR-007a） |
| VI | Shared Knowledge, Different Tracks | ✅ PASS | 只有一份教材正文；Track 僅為 `Lesson` 欄位與 webhook 路由 |
| VII | LLM Authors Once, Not Daily | ➖ N/A | 本 Feature 教材為人工手寫，無 LLM 參與 |
| VIII | Zero-LLM Daily Runtime | ✅ PASS | 無任何 LLM 相依；`daily.yml` 不含 `GEMINI_API_KEY`（FR-011 / SC-008 直接驗收） |
| IX | Build-time over Runtime | ⚠️ 部分偏離 | 本 Feature **不建立 CI Gate**（`content-gate.yml` 屬 F5）。字元預算檢查實作於 Compiler/Renderer 共用路徑，runtime 亦執行，故 F5 接上 Gate 時**共用同一顆實作**，不會產生雙軌。見 Complexity Tracking |
| X | Language-specific Learning | ✅ PASS | 版面含 TypeScript Tip 與 Python Tip 兩個 field（FR-007） |
| XI | Renderer Knows Nothing About Curriculum | ✅ PASS | `renderer/` 只 import `Lesson` 型別；以「不得 import compiler / state / fs」的單元測試與目錄相依約束把關 |
| XII | Deterministic & Reproducible Delivery | ✅ PASS | Renderer 純函式；SC-010（重複渲染 100 次逐字元相同）為直接驗收 |
| XIII | Generated Artifacts Are Frozen Once Committed | ⚠️ 需正當化 | 手寫教材將置於 `articles/**`（未來產線輸出路徑）；硬編課表**不得**置於 `schedules/*.json`。決策見 research.md R4 與 Complexity Tracking |
| XIV | Secrets Never in Repo | ✅ PASS | webhook URL 只經 Actions Secrets / 本機環境變數；repo 只留 `docs/` 的佔位示意 |
| XV | Fault Isolation & Fail Loud | ✅ PASS | 逐 Track try/catch、紅色告警 Embed、非零 exit code（FR-009 / FR-010）；多 Track 隔離**實作**於本 Feature，**驗收**留待 F6 |
| XVI | Free-tier Only | ✅ PASS | 僅 GitHub Actions + Discord Webhook + committed state.json |
| XVII | One Human Checkpoint | ➖ N/A | 無內容產線；FR-024 的一次性環境建置為 setup 動作，非常態性內容審核關卡 |

**技術與資源約束**：全數遵循（strict TS、手寫 composition root、`gray-matter` + `marked`、內建 `fetch`、
`vitest`、Node 24、固定的環境變數命名、字元預算、不轉載題目內容）。無 plan 階段另行選型。

**Gate 結論**：**通過**。兩項偏離（IX 部分、XIII）皆有明確正當化與收斂路徑，記錄於 Complexity Tracking。

### Post-Design Re-check（Phase 1 完成後）

重新逐條檢視後：判定不變，未因設計而新增違反。三項設計決策強化了合規性：

1. `src/renderer/` 僅相依 `src/types/lesson.ts`（型別），以測試斷言其模組相依集合 → 強化原則 XI。
2. 字元預算檢查（`renderer/budget.ts`）為**獨立純函式**，接受 embeds 陣列回傳明細，供 runtime 與未來
   F5 的 `scripts/validate.ts` 共用同一顆實作 → 收斂原則 IX 的偏離。
3. 教材解析（`compiler/content.ts`）從第一天就是**真的解析器**而非硬編（FR-004a），F5 只擴充解析區塊、
   不重寫呼叫方 → 避免日後產生雙軌。

## Project Structure

### Documentation (this feature)

```text
specs/001-walking-skeleton/
├── plan.md              # 本檔
├── research.md          # Phase 0 產出
├── data-model.md        # Phase 1 產出
├── quickstart.md        # Phase 1 產出
├── contracts/           # Phase 1 產出
│   ├── cli-contract.md          # 環境變數、執行模式、exit code
│   ├── article-format.md        # 手寫教材的固定區塊契約（解析器輸入）
│   ├── lesson-contract.md       # Compiler → Renderer 的唯一介面
│   ├── discord-embed-contract.md# Renderer 輸出結構與字元預算
│   └── state-schema.md          # state.json 結構與推進規則
├── checklists/
│   ├── requirements.md  # 已存在（/speckit-specify 產出）
│   └── content-handoff.md # 臨時產物交棒檢核（/speckit-checklist 產出）
└── tasks.md             # Phase 2 產出（/speckit-tasks，非本指令產生）
```

### Source Code (repository root)

```text
leetcode-daily-coach/
├── package.json                     # 新增：npm scripts（build / test / dry-run）
├── package-lock.json                # 新增：MUST commit——`daily.yml` 用 `npm ci`，無 lockfile 會直接失敗
├── tsconfig.json                    # 新增：strict TypeScript
├── vitest.config.ts                 # 新增
├── articles/
│   └── two-pointer/
│       └── 002-left-right-pointer.md   # F1 手寫教材（§10 全固定區塊；F7 產線接手後由生成物取代）
├── data/
│   └── problem-bank.json            # F1 最小題庫（3 題、§12.1 最小子集；F3 擴充）
├── docs/
│   ├── spec.md                      # 已存在
│   ├── setup-guide.md               # 新增（FR-024）：state 分支 / Discord / Secrets 一次性建置
│   └── state.template.json          # 新增（FR-024）：三 Track 初始進度樣板
├── src/
│   ├── main.ts                      # composition root：組裝 → 逐 Track run → exit code
│   ├── config.ts                    # 讀環境變數 → Config；缺項 fail-fast（FR-023）
│   ├── types/
│   │   └── lesson.ts                # Lesson / SessionPlan / Problem / Track 型別（Renderer 唯一相依）
│   ├── compiler/
│   │   ├── content.ts               # 讀 articles/**.md → 解析固定區塊（FR-004a/b）
│   │   ├── problem.ts               # 讀 data/problem-bank.json → Problem
│   │   ├── schedule.ts              # ⚠️ F1 臨時：硬編 3-Session 課表 + 學習路徑對照表（F4 取代）
│   │   └── lesson.ts                # compile(track, sessionIndex) → Lesson
│   ├── renderer/
│   │   ├── discord.ts               # render(Lesson) → embeds（純函式；只 import types/lesson）
│   │   ├── budget.ts                # 字元預算檢查（純函式；F5 的 Gate 共用同一顆）
│   │   └── alert.ts                 # 紅色告警 Embed（純函式）
│   ├── discord/
│   │   └── webhook-client.ts        # POST embeds / 送告警；依 Track 路由
│   ├── state/
│   │   └── state-store.ts           # 讀寫 state.json；per-track 進度推進
│   └── util/
│       └── taipei-date.ts           # Asia/Taipei 日曆日換算（idempotency guard 用）
├── tests/
│   ├── fixtures/                    # 教材 / 題庫的測試素材（正常與各種缺陷情境）
│   │   ├── article-valid.md
│   │   ├── article-missing-digest.md
│   │   ├── article-unknown-section.md
│   │   └── problem-bank.json
│   └── unit/
│       ├── config.test.ts
│       ├── alert.test.ts
│       ├── content.test.ts
│       ├── problem.test.ts
│       ├── schedule.test.ts
│       ├── lesson.test.ts
│       ├── renderer.test.ts
│       ├── budget.test.ts
│       ├── webhook-client.test.ts
│       ├── taipei-date.test.ts
│       ├── idempotency-guard.test.ts
│       ├── state-load.test.ts        # 載入 / 自動補建 / 損毀不覆寫
│       ├── state-advance.test.ts     # 推進 / 漏跑不跳課 / history 上限 / 去重
│       ├── state-save.test.ts        # 單次存檔 / 序列化穩定 / 部分成功仍存檔
│       ├── run-tracks.test.ts        # 失敗隔離、告警送不出去仍續跑（mock fetch）
│       ├── dry-run.test.ts
│       └── zero-llm.test.ts          # src/** 無 @google/genai、daily.yml 無 GEMINI_API_KEY
├── README.md                        # 新增：專案定位、本機 dry run 指令、文件索引
└── .github/workflows/
    └── daily.yml                    # 雙 cron + workflow_dispatch(dry_run/force) + state 分支 commit
```

**Structure Decision**: 採**單一專案、分層模組**結構，目錄命名與 `docs/spec.md` §17 的最終形態
**完全對齊**（`src/compiler` / `src/renderer` / `src/discord` / `src/state` / `scripts`），使 F2–F7 只需
**新增檔案或替換單一模組實作**，不需搬移目錄。與 §17 的差異僅有兩處，皆為本 Feature 尚未進入的範圍：
- 尚未建立 `curriculum/` `concepts/` `overlays/` `schedules/` `scripts/`（F2–F7）
- 新增 `src/types/lesson.ts`，讓 Renderer 有一個**不含任何實作相依**的型別入口，以在編譯期落實憲章 XI

## Complexity Tracking

> 僅記錄 Constitution Check 中需正當化的偏離。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **原則 IX（Build-time over Runtime）部分偏離**：本 Feature 不建立 CI Gate，字元預算只在 runtime 檢查 | CI Gate（`content-gate.yml` + `scripts/validate.ts`）需要「全 Track × 全 Session 預演」的能力，而全 Session 課表要到 F4 才存在；F1 只有 3 個 Session，Gate 的邊際價值極低 | 「在 F1 就建一個只跑 3 個 Session 的 Gate」被否決：F4/F5 上線後該 Gate 必須整個重寫（輸入從硬編常數換成生成課表），屬預先做白工。改以**把預算檢查抽成獨立純函式 `renderer/budget.ts`** 收斂風險——F5 的 `validate.ts` 直接呼叫同一顆函式，故不會出現「Gate 一套、runtime 另一套」的雙軌實作，原則 IX 的核心禁令未被違反 |
| **原則 XIII（生成物凍結）**：手寫教材置於 `articles/**`——該路徑在最終架構中是 LLM 產線的輸出目錄 | F1 的價值是打穿**真實**鏈路，含真實讀取路徑。若放在假路徑（如 `fixtures/`），F5/F7 必須改動 `compiler/content.ts` 的讀取邏輯，等於 F1 沒有驗證到真正要用的那條路徑 | 「放 `tests/fixtures/`」被否決：會讓 F1 驗到的是測試替身而非產品路徑。緩解措施：教材檔頂端 MUST 加註「F1 手寫種子內容，F7 產線上線後由生成物取代」；憲章 XIII 禁止的是「手改**既有生成物**」，而此處產線尚未存在、無生成物可改，屬種子內容而非違規手改 |
| **原則 XIII 相關**：硬編課表**不放** `schedules/*.json` | 憲章 XIII 明文「`schedules/{track}.json` MUST NOT 手寫」，無正當化空間 | 因此改置於 `src/compiler/schedule.ts` 的 TypeScript 常數（附臨時性註記，FR-002 要求）。此舉**不構成偏離**，列於此處僅為記錄取捨；F4 上線後改為讀 `schedules/*.json`，呼叫方介面 `getSessionPlan(track, sessionIndex)` 不變 |
