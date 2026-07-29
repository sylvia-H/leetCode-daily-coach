# Implementation Plan: 兩階段內容產線（全量課綱起草＋大綱定稿 → 全文展開）＋品質 Gate＋節流／續跑

**Branch**: `007-content-generation` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-content-generation/spec.md`

## Summary

F7 是**一次性 build-time 內容工程**：以 LLM 批次生成全部 16 個 Module、≥150 個 Concept 的完整課綱與教材，
過自動 Gate 凍結入庫，取代 F2/F5 種子與 F4 種子課表，讓 F6 每日管線推播的是真實成體系課程。整條產線唯一的
常態性人工介入是 `curriculum/outline.md` 一次性定稿（憲章 XVII）。技術取向沿用既有分層與純度界線：

- **Stage 1（`scripts/generate-curriculum.ts`）**：LLM 批次起草 Concept frontmatter + Author Hints（**對應題目
  只提候選題號**，Q1）→ 呼叫**題庫擴充步驟**（`scripts/populate-problem-bank.ts`）驗證題號並填入 metadata →
  重用 F2 `src/compiler/curriculum.ts` 結構 Gate → 產 `curriculum/outline.md` → **人工定稿 commit 凍結**。
- **Stage 2（`scripts/generate-content.ts`）**：讀凍結 Skeleton → LLM 依 Author Hints 展開 §10 固定區塊 Full
  Article（每段程式碼**自帶內嵌斷言**，Q2）→ 品質 Gate（程式碼實測 + 結構/schema + 繁中機器判準 + 字元預算 +
  完整編譯/render + LLM self-check）→ **每篇自動重生上限 3 次**（Q3），過關才凍結至 `articles/**`。
- **課表（既有 `scripts/generate-schedule.ts`）**：課綱凍結後對正式 DAG 生成三份 ~180-Session 課表（determinism），
  更新 `curriculum/track-params.json` 的涵蓋深度使課表達全長。
- **CI 承接**：`content-gate.yml` 補入 TS/Python 程式碼**編譯 + 斷言執行**步驟（F5 定案由本 Feature 承接）。

**純度與單一 Gate 界線**：`@google/genai` 與一切 LLM 呼叫 / process spawn / `process.exit` / 檔案寫入只在
`scripts/`；`src/` 維持零 LLM SDK。Stage 2 品質 Gate 的「完整編譯 + render + 字元預算」重用每日 runtime 的同一顆
`src/compiler` / `src/renderer`（憲章 IX，FR-011）；新增的**純內容檢查**（繁中判準、觀念本體字數、Article 區塊
完整性）加入 `src/compiler` 的 Gate 路徑，使 `content-gate.yml` 於 CI 一併把關；LLM self-check 為生成期專屬、
不進 CI。

## Technical Context

**Language/Version**: strict TypeScript 5.5（`tsc` → `node dist/...`），Node.js 24。教材程式碼實測另用 Python 3.x + `pytest`（僅 Gate）。

**Primary Dependencies**: **新增 `@google/genai`（devDependency，只在 `scripts/` 依賴路徑，僅 build-time；模型
`gemini-3.1-flash-lite`，憲章釘死）**。既有 `zod`（frontmatter/JSON schema）、`gray-matter` + `marked`（Skeleton/
Article 解析）續用。題目 metadata 取得用 Node 內建 `fetch`。無其他新增 runtime 相依（`src/` 相依不變）。

**Storage**: 版本控制的檔案。**產物**＝`concepts/**`（Skeleton）、`articles/**`（Full Article）、
`curriculum/outline.md`、`data/problem-bank.json`（擴充後）、`schedules/{track}.json` × 3。**續跑 checkpoint**
＝以「凍結產物是否存在 + Skeleton 內容雜湊」推導（見 research R4），checkpoint manifest 置於 `.cache/`（gitignored，
非教材產物）。

**Testing**: `vitest`——對**純函式**單元測試（繁中偵測器、CJK 佔比、觀念本體字數、題庫擴充的驗證/合併邏輯、
節流/退避排程器、checkpoint 續跑判斷、outline 序列化）；外部呼叫（Gemini、LeetCode metadata `fetch`）以 mock 測。
**教材程式碼實測（TS `tsc`+`vitest`/`tsx`、Python `pytest`）只在 Gate/CI 跑**（憲章工作流程）。

**Target Platform**: **build-time 執行環境**——本機（Windows/PowerShell，Node 24）或手動 `workflow_dispatch`
（可選的 `content.yml`，帶 `GEMINI_API_KEY` Secret）；**MUST NOT 進 `daily.yml`**。每日 runtime 完全不受本 Feature
影響（只換凍結素材）。

**Project Type**: 單一專案；build-time CLI 腳本群（composition root 手寫，無框架、無 HTTP server、無常駐）。

**Performance Goals**: 全量 ≈600–800 次 LLM 呼叫，**分 2–4 天批次完成**（一次性成本）；受 Gemini 免費層
~10–15 RPM / 每日 250–1,500 次請求約束，靠 RPM 節流 + 429 退避 + checkpoint 續跑吸收。單篇品質 Gate（含程式碼
實測）為秒級。**節流／退避參數（釘定，FR-017/018）**：RPM 預設 **10**（`RPM_LIMIT` 可覆寫）；指數退避 base **1s**、
上限 **60s**、全抖動 jitter、**重試上限 6**；非暫時性 4xx MUST 直接失敗、不進退避（實作於 `scripts/lib/throttle.ts`，T005）。

**Constraints**: build-time only（`daily.yml` MUST NOT 含 `GEMINI_API_KEY`）；`@google/genai` MUST NOT 被 `src/`
import；題號/連結/難度由程式帶入、MUST NOT 由 LLM 生成、MUST NOT 抓題目描述（§5）；生成物過 Gate 才凍結、
凍結後定版；`generate-schedule.ts` byte-identical；字元預算 ≤5,500 且超限 MUST NOT 截斷；繁中機器可驗；
觀念本體 ≤2,000 字；缺 `GEMINI_API_KEY` MUST fail-fast。

**Scale/Scope**: 16 Module（Level 0–15）、≥150 Concept、3 Track × ~180 Session。本 Feature 產物取代全部種子
（SC-001：0 殘留）。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

逐條對照 `.specify/memory/constitution.md`（v1.0.1）：

| 原則 | 判定 | 說明 |
| --- | --- | --- |
| I. Concept-first, Problem-second | ✅ PASS | Full Article 依 §10 固定區塊生成（觀念先行），題目只帶題號/why/hint；版面順序由 F5 Renderer 決定，本 Feature 不改版面。 |
| II. One Concept per Session | ✅ PASS | Stage 1 顆粒度規範（Topic 5–12 / Module 10–30）由結構 Gate 守；觀念本體 >2,000 字 MUST 拆分（Edge Case）。 |
| III. Small Learning Steps | ✅ PASS | 顆粒度 Gate 禁止為縮短課程合併 Concept。 |
| IV. Deterministic Curriculum | ✅ PASS（見下註） | LLM 僅在 **build-time 一次性起草**課綱，經**人工定稿 + 凍結**後即固定、版本控制；IV 禁止的是**凍結後/runtime 的動態重排**（§20.1 明確允許 Stage 1 起草）。順序以宣告序（modules → topic → 檔名 NNN）決定，非 LLM runtime 產生。 |
| V. Curriculum as DAG | ✅ PASS | 結構 Gate 重用 F2 `curriculum.ts`：無環/無前向依賴/無孤兒/雙向一致/參照完整，違規即擋、不進定稿。 |
| VI. Shared Knowledge, Different Tracks | ✅ PASS | 每個 Concept **單一份** Article（`articles/**`）；三軌共用正文，分歧只在課表涵蓋深度（track-params）+ 題目難度帶（Overlay）+ Challenge + 頻道。MUST NOT 複製三份正文。 |
| VII. LLM Authors Once, Not Daily | ✅ PASS | 本 Feature 即此原則的實作：build-time 生成 → CI Gate → 凍結；LLM MUST NOT 於每日 runtime 生成/篡改。 |
| VIII. Zero-LLM Daily Runtime | ✅ PASS | `@google/genai` 只在 `scripts/`；`daily.yml` 不含 LLM 金鑰。**新增守門單元測試**：掃描 `src/**` 不 import `@google/genai`、`daily.yml` LLM 金鑰出現次數為 0。 |
| IX. Build-time over Runtime／單一 Compiler | ✅ PASS | Stage 2 Gate 的完整編譯/render/字元預算 import 每日 runtime 同一顆 `src/compiler`/`src/renderer`（FR-011）；新增純內容檢查加入同一 Gate 路徑，CI 與生成期共用，MUST NOT 建平行解析。 |
| X. Language-specific Learning | ✅ PASS | 固定區塊含 `TypeScript Tip` / `Python Tip`，區塊完整性 Gate 守；程式碼須自帶斷言並實測。 |
| XI. Renderer Knows Nothing About Curriculum | ✅ PASS | 本 Feature 不動 Renderer；只生成餵給 Compiler 的凍結素材。 |
| XII. Deterministic & Reproducible Delivery | ✅ PASS | 凍結素材 → 每日 runtime 純函式渲染不變；`generate-schedule.ts` byte-identical；題庫擴充後 commit 凍結可重現。 |
| XIII. Generated Artifacts Are Frozen | ✅ PASS | 產物過 Gate 才凍結；冪等（不覆蓋已凍結且未變更 Skeleton，除非 `--force`）；`schedules/**` 由生成器產、MUST NOT 手改。 |
| XIV. Secrets Never in Repo | ✅ PASS | `GEMINI_API_KEY` 走環境變數/Secrets、MUST NOT 入庫；題目 metadata 抓取只取公開 metadata。 |
| XV. Fault Isolation & Fail Loud | ✅ PASS | 缺金鑰 fail-fast；Gate 擋下 + 重生 3 次後標記待人工（記錄、不靜默凍結）；單篇升級不阻斷其餘 Concept；429 退避而非中止。 |
| XVI. Free-tier Only | ✅ PASS | Gemini 免費層 + RPM 節流 + 退避 + 續跑；無付費、無常駐、無新增 runtime infra。 |
| XVII. One Human Checkpoint | ✅ PASS（核心） | 唯一常態人工介入＝`outline.md` 定稿；Stage 2 只有「Gate 反覆擋/self-check 低信心」的**例外**介入，MUST NOT 成為常態關卡。 |

**結論**：無違反、無需 Complexity Tracking 條目。**唯一需說明的判定是 IV**——見上表註；此為 §20.1 既有裁決
（Stage 1 build-time 起草合法，禁止的是凍結後動態重排），非本 plan 的單方裁量。

## Project Structure

### Documentation (this feature)

```text
specs/007-content-generation/
├── plan.md              # 本檔
├── research.md          # Phase 0：技術決策（含 Q1–Q4 落地方式）
├── data-model.md        # Phase 1：Skeleton/Article/題庫/outline/checkpoint/生成設定 的資料契約
├── quickstart.md        # Phase 1：Stage 1 → 定稿 → Stage 2 → 課表 → Gate 的執行/驗證流程
├── contracts/
│   ├── stage1-curriculum.md      # generate-curriculum.ts CLI 契約（輸入/旗標/輸出/結構 Gate/exit）
│   ├── stage2-content.md         # generate-content.ts CLI 契約（品質 Gate 各關/重生/凍結/exit）
│   ├── problem-bank-population.md # Q1：候選題號 → 驗證 → metadata 填入 → 凍結 契約
│   └── content-quality-gate.md   # Stage 2 Gate 組成 + content-gate.yml 程式碼實測步驟契約
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks 產出（非本指令）
```

### Source Code (repository root)

```text
scripts/
├── generate-curriculum.ts    # 🆕 Stage 1 入口：LLM 起草 → populate → 結構 Gate → outline.md（process.exit 只在此）
├── generate-content.ts       # 🆕 Stage 2 入口：讀 Skeleton → LLM 展開 → 品質 Gate → 重生≤3 → 凍結
├── populate-problem-bank.ts  # 🆕 Q1：驗證候選題號 + 抓 metadata → 併入 data/problem-bank.json（純合併邏輯抽出可測）
├── run-code-blocks.ts        # 🆕 抽 Article 程式碼 → 暫存 → tsc+vitest / pytest 斷言（本機 Stage 2 與 CI 共用）
├── lib/                       # 🆕 scripts 專屬（可 import @google/genai）
│   ├── llm-client.ts             #   Gemini 包裝：模型釘死、RPM 節流、429 退避+jitter、build-time only
│   ├── throttle.ts               #   RPM 節流 + 指數退避+jitter（純邏輯，可 mock 時鐘單測）
│   ├── checkpoint.ts             #   續跑/冪等：產物存在 + Skeleton 雜湊比對（純邏輯，單測）
│   ├── prompts/                  #   Stage 1 / Stage 2 / self-check prompt 模板
│   └── outline.ts                #   outline.md 序列化（純函式，單測）
├── generate-schedule.ts      # 既有（F4）：課綱凍結後對正式 DAG 執行；本 Feature 不改邏輯
└── validate*.ts / validate.ts # 既有：validate.ts 內容 Gate CLI（新增純內容檢查沿用此入口）

src/compiler/
├── content.ts                # ✏️ 已解析 Article 固定區塊；新增/沿用區塊完整性判定供 Gate 引用
├── gate.ts                   # ✏️ runContentGate 增純內容檢查（繁中判準、觀念本體字數）——CI 與生成期共用
├── traditional-chinese.ts    # 🆕 純函式：簡體偵測 + CJK 佔比（排除程式碼區塊/行內英文術語）
└── **                        # 其餘不變（curriculum.ts 結構 Gate 由 Stage 1 重用）

curriculum/
├── track-params.json         # ✏️ maxLevel/targetLevel 調整為全量涵蓋深度（US3，使課表達 ~180 Session）
└── outline.md                # 🆕 Stage 1 產出、人工定稿物（唯一人工檢查點）

concepts/**, articles/**, schedules/**, data/problem-bank.json  # ✏️ 種子由全量生成物取代（SC-001）

.github/workflows/
├── content-gate.yml          # ✏️ 補入 run-code-blocks.ts 程式碼實測步驟（TS/Python 編譯+斷言）
└── content.yml               # 🆕（可選）手動 workflow_dispatch 跑產線；帶 GEMINI_API_KEY Secret

tests/unit/                   # 🆕 繁中偵測/CJK、題庫合併、節流退避、checkpoint、outline、守門（src 無 LLM SDK）
.cache/                       # 🆕 checkpoint manifest（gitignored）
```

**Structure Decision**: 沿用單一專案結構。**新增 `scripts/lib/`** 收納可 import `@google/genai` 的產線邏輯，
使「LLM SDK 只在 `scripts/`」在檔案佈局上一眼可辨、並讓「`src/` 無 LLM SDK」可用掃描測試守住。純內容檢查
（繁中判準、字數）放 `src/compiler/` 而非 `scripts/`，是為了讓 CI `content-gate.yml` 與生成期 Stage 2 共用同一顆
Gate（憲章 IX），避免雙軌。程式碼實測抽為 `scripts/run-code-blocks.ts` 供本機 Stage 2 與 CI 共同呼叫（單一實作）。

## Complexity Tracking

> Constitution Check（前後兩次）全數 PASS，無需正當化條目。

## Post-Design Constitution Re-Check

Phase 1 設計完成後重新對照，**判定不變（全數 PASS）**。設計過程確立的四項自我約束值得記錄：

| 設計決定 | 對應原則 | 效果 |
| --- | --- | --- |
| `@google/genai` 與 LLM 呼叫全數集中於 `scripts/lib/`，`src/` 零 LLM SDK，並以掃描單元測試守住 | VIII | 「每日 runtime 零 LLM」成為機器可驗約束而非承諾 |
| 題目事實 metadata 一律由 `populate-problem-bank.ts` 從權威來源帶入，LLM 只提候選題號 | XIV / §5 | 事實不由 LLM 生成；Stage 1 結構 Gate 的「題號存在性」成為此約束的守門 |
| Stage 2 Gate 的編譯/render/預算 import 每日 runtime 同一顆 Compiler；純內容檢查亦入同一 Gate 路徑 | IX | 「Gate 通過 ⇒ runtime 不因內容失敗」；CI 與生成期不雙軌 |
| 冪等以「產物存在 + Skeleton 雜湊」推導，`--force` 才覆蓋；重生上限 3 次後 fail loud 標記待人工 | XIII / XV / XVII | 續跑不重工、不覆寫凍結物；不合格不靜默凍結；例外介入不變成常態關卡 |
