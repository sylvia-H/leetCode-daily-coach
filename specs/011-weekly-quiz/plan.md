# Implementation Plan: Weekly Quiz — 每週自評測驗（spoiler 自評）

**Branch**: `011-weekly-quiz` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-weekly-quiz/spec.md`

## Summary

每週 review Session 新增第五段「✍️ 本週小測」：該週涵蓋的每個 Concept 各出恰 1 題選擇題，
題幹與選項明碼呈現、正解與一句結論封在 Discord spoiler（`||…||`）內，完整詳解與該 Concept
全部題目改放 GitHub Pages 的新頁面 `quiz/{conceptId}.html`。

**技術路線**：

1. **題庫層（build-time，新產物）**——新增 `data/quiz-bank.json`（以 Concept id 為 key，
   每 Concept 3–10 題），由新腳本 `scripts/generate-quiz-bank.ts` 生成：兩階段
   （列面向 → 據面向出題，MUST NOT 在 prompt 提及任何題數數字）＋獨立二次作答交叉驗證
   （盲答比對，不一致即丟棄重生，per-Concept 上限 3 輪）＋結構性 Gate（`checkQuizBank`）。
   沿用 F7 的節流／退避／續跑機制，綁 Concept Skeleton 雜湊（不綁 Article）判斷是否需要重生。
2. **消費層（runtime，零 LLM）**——新增 `src/compiler/quiz.ts`（schema + `selectQuizItem`
   決定性選取純函式 + `checkQuizBank`），`compileReview` 為該週每個 Concept 各選一題填入
   `ReviewLesson.quizItems`，Renderer 在既有四段之後（Challenge 之後、鼓勵語之前）新增小測段，
   素材 Gate 掛進既有 `runContentGate`。
3. **Pages 層（新頁面）**——`src/pages/quiz-page.ts` 產出 `quiz/{conceptId}.html`
   （與 `articles/{conceptId}.html` 同構、僅 `unlockedIds` 範圍），正解與完整詳解以原生
   `<details>` 呈現（零 JS）。

**Phase 0 的三項關鍵發現**（詳見 [research.md](./research.md)）：
(R1) Discord 小測連結需要 Pages Base URL，但 spec 明文「daily workflow 推播機制零改」——
沿用既有 `PAGES_BASE_URL` 環境變數、本 Feature **不修改 `daily.yml`**，變數缺席即全部題目
省略連結（完全向下相容的起始狀態）。
(R3) 既有 `runContentGate` 的逐 Session compile→render→checkBudget 迴圈**不足以**驗完整份
題庫——單一 Concept 一生只會被 3 個 Track 各選中一次，題數 >3 時題庫中未被選中的題目永遠不會
經過 runtime `checkBudget`，故需要獨立的全量結構性 Gate（`checkQuizBank`）。
(R5) FR-002「於第四段（Challenge 後）附加第五段」的插入點採「Challenge 之後、鼓勵語之前」，
使 F8 既有不變式「鼓勵語 MUST 為最後一段」維持成立，不需要撤銷該規則。

## Technical Context

**Language/Version**: TypeScript 5.5（strict）／Node.js 24（ESM，`"type": "module"`）

**Primary Dependencies**: `zod`（題庫 schema）；Node 內建 `fetch`；build-time 專用
`@google/genai`（**僅 `scripts/`**，`src/` MUST NOT import）。**本 Feature 不引入任何新的
runtime 相依**（Pages 頁面沿用既有 `marked`/`gray-matter` 依賴路徑，quiz 頁不需要 markdown
解析——題幹/選項/詳解皆為純文字，僅需既有的 `escapeHtml`）。

**Storage**: 檔案系統上的凍結產物（`data/quiz-bank.json`）＋ `state` 分支的 `state.json`
（唯一權威狀態，本 Feature **不改動其 schema**）＋ `.cache/quiz-manifest.json`
（gitignored 續跑快取，非真實來源）

**Testing**: `vitest`（`npm test`）；型別檢查 `npm run typecheck`（含 `tests/` 與 `scripts/`）。
外部呼叫（Gemini）以假物件替身測（沿用 `GenAiLike`），**MUST NOT 在測試中打真實 API 或 webhook**。

**Target Platform**: GitHub Actions（Ubuntu, Node 24）＋ 本機 Windows / PowerShell。
一次性 CLI（`node dist/main.js`），跑完即退，無常駐服務、無 DB、無 docker。

**Project Type**: 單一 TypeScript 專案（CLI + build-time scripts），非 monorepo、非 web service。

**Performance Goals**: 每日 runtime 不受影響（`selectQuizItem` 為 O(1) 純函式，`compileReview`
每個 Concept 增加一次 O(1) 查找）；CI Gate 對既有 641 筆 Lesson 的既有壓力不變
（quiz 欄位隨 review Lesson 一起 compile/render/checkBudget，無額外遍歷），另新增
`checkQuizBank` 對 **165 個 Concept × 3–10 題（約 1,000–1,300 題）** 的一次性結構掃描
（純記憶體運算，非 LLM 呼叫）。題庫生成約 **1,500 次 LLM 呼叫**（165 次列面向 + 約 200 次出題批次
【Stage B 為**每個 Concept 一次批次呼叫**產出全部題目，200 已含重生輪】 + 約 1,150 次盲答驗證
【**每題各一次**】，spec Assumptions ③）。**MUST NOT 沿用初估的 2,500**——該數字把出題批次誤記為
每題一次（1,150），與 contracts/quiz-bank-schema.md §5.2 的單次批次流程矛盾。

**Constraints**:
- 每日 runtime **零 LLM**；`daily.yml` MUST NOT 含 `GEMINI_API_KEY`（本 Feature 不修改
  `daily.yml`，此約束自動維持）。
- Discord 單則訊息全部 embeds 文字總和 ≤ **5,500**；新增 `quizItem` ≤**570**（單題 field value，
  = 內容 450 + 連結保留 120）、`quiz` ≤3,000（整段合計）。**MUST NOT 自動截斷**。
  素材層 Gate 估算單題長度時 MUST 一律假設連結存在且佔滿 `QUIZ_URL_RESERVE_CHARS`（**120**，
  實測最壞 111），使 Gate 恆嚴格於 runtime（憲章 IX；初訂的 90／450 已於 2026-08-07 更正，
  見 research R3）。
- 選題 MUST 為 `(track, conceptId)` 的純函式；Renderer MUST 為 stateless 純函式。
- 生成物凍結：`data/quiz-bank.json` MUST NOT 手改，一律「改 Skeleton → 重跑 → review diff → commit」。
- Free-tier only：僅 GitHub Actions + Discord Webhook + Gemini 免費層（`gemini-3.5-flash-lite`，僅 build-time）。
- **MUST NOT 改動**：Curriculum DAG、三份課表、Article 正文、`daily.yml`（research R1 已定案
  以既有環境變數承接、零 workflow 變更）。

**Scale/Scope**: 3 Track × 641 Session（不變）；165 個 Concept，新增題庫約 1,000–1,300 題；
新增 Pages 頁面數 = `unlockedIds` 大小（隨進度增長，上限 165）。變更檔案約 18 個（見
[data-model.md](./data-model.md) §11）。

**未解 NEEDS CLARIFICATION**：無。spec Q1–Q14 已解決全部題庫設計問題；Phase 0 另發現並解決
Pages 連結來源（R1）、Gate 覆蓋完整性（R3）、版面插入點（R5）三項 plan 階段技術問題。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**憲章版本**：v1.0.2（2026-07-30）。**Phase 0 前檢查：PASS。Phase 1 設計後複查：PASS（無新增違反）。**

| # | 原則 | 判定 | 本 Feature 如何滿足 |
| --- | --- | --- | --- |
| I | Concept-first, Problem-second | ✅ | 小測是「觀念驗收」而非新增刷題管道；版面順序觀念／複習段落仍先於題目段落 |
| II | One Concept per Session | ✅ | 不新增／不改動 concept 類 Session；小測只掛在既有 review Session |
| III | Small Learning Steps | ✅ | Curriculum 完全不動 |
| IV | Deterministic Curriculum | ✅ | 選題公式 `(localOrder+trackOffset) mod itemCount` 為純函式，LLM 只產生題庫內容，MUST NOT 參與排序或選題（FR-003a：索引 runtime 現算，MUST NOT 固化） |
| V | Curriculum as DAG | ✅ | DAG 完全不動，`localOrder` 為既有欄位 |
| VI | Shared Knowledge, Different Tracks | ✅ | **三軌共用同一份題庫檔**（FR-001）；差異只來自各自課表涵蓋的 Concept 與 `trackOffset` |
| VII | LLM Authors Once, Not Daily | ✅ | 題庫 build-time 生成 → 交叉驗證 → 結構 Gate → 凍結 commit |
| VIII | Zero-LLM Daily Runtime | ✅ | 新腳本只在 `scripts/`；`src/` 不 import `@google/genai`（`no-llm-in-src.test.ts` 守）；`daily.yml` 不修改、不含金鑰 |
| IX | Build-time over Runtime | ✅ | 選題在**生成端**只決定「題目內容」，索引選取在 Compiler 現算但為零 LLM 純函式；題庫結構 Gate 掛進**既有** `runContentGate`，CI 與生成腳本共用同一顆（research R2/R3）；預算常數單一來源 |
| X | Language-specific Learning | ✅ | 不改動 concept 版面的 TS / Python Tip；小測題目本身依 research R2 排除語言 API 記誦類考題（FR-016） |
| XI | Renderer Knows Nothing About Curriculum | ✅ | Renderer 只讀 `Lesson`；題目由 Compiler 放入 `ReviewLesson.quizItems`。`quiz-page.ts` 是 Pages 的平行消費者、非 Discord Renderer，不受此原則規範（同 F9 site-build-contract.md §0 的既有立場） |
| XII | Deterministic & Reproducible Delivery | ✅ | 選取為 `(track, conceptId)` 純函式（quiz-selection.md I1–I3）；render 為 stateless 純函式 |
| XIII | Generated Artifacts Are Frozen Once Committed | ✅ | `data/quiz-bank.json` 由生成腳本產出、可重生成，綁 Skeleton 雜湊（FR-015），**不引入手工資產** |
| XIV | Secrets Never in Repo | ✅ | `GEMINI_API_KEY` 只走 `content.yml` 的 Secrets 與本機環境變數；`PAGES_BASE_URL` 非機密（公開 URL），不需 Secrets |
| XV | Fault Isolation & Fail Loud | ✅ | 生成腳本單一 Concept 失敗不阻斷其餘 Concept、以非零 exit code 收尾（FR-010a 一次列出全部不足量 Concept）；題庫／Pages 缺席時 Discord 推播零告警靜默省略（FR-008，刻意的「非核心素材缺席」降級，非需要告警的失敗） |
| XVI | Free-tier Only | ✅ | 約 1,500 次 LLM 呼叫（vs F7 165 篇 × 多次呼叫的同量級），不新增服務 |
| XVII | One Human Checkpoint | ✅ | 題庫全由自動 Gate + 交叉驗證把關，**不新增常態性人工審核關卡**（FR-010a 的人工介入是失敗後例外，非常態關卡，同 F8 既有立場） |

**技術與資源約束**（憲章「Additional Constraints」）：無新選型。composition root 不變；
schema 用 `zod`；測試用 `vitest`；模型維持 `gemini-3.5-flash-lite`；環境變數新增 **一個**
選填項 `PAGES_BASE_URL`（沿用 F9 既有名稱，非新命名，`src/config.ts` 新增讀取但不列為必要項）。

**Complexity Tracking**：無需填寫（零違反）。

## Project Structure

### Documentation (this feature)

```text
specs/011-weekly-quiz/
├── plan.md                          # 本檔（/speckit-plan 輸出）
├── spec.md                          # 需求（既有，含 Q1–Q14 Clarifications）
├── research.md                      # Phase 0：R1–R8 決策
├── data-model.md                    # Phase 1：實體、欄位、不變式、檔案清單
├── quickstart.md                    # Phase 1：可執行的驗收腳本
├── contracts/
│   ├── quiz-bank-schema.md          # 題庫檔格式 + Gate 判準 + 交叉驗證 + 生成端契約
│   ├── quiz-selection.md            # 選取純函式 + 不變式 I1–I3 + 版面順序
│   └── pages-quiz.md                # Pages 連結來源（daily.yml 零改）+ quiz 頁結構
└── tasks.md                         # Phase 2（/speckit-tasks 產出，非本命令）
```

### Source Code (repository root)

```text
src/
├── compiler/
│   ├── quiz.ts                      # ★ 新增：題庫 schema + selectQuizItem + checkQuizBank
│   ├── lesson.ts                    # 變更：CompilerDeps/CompilerPaths 擴充；compileReview 填入 quizItems
│   └── gate.ts                      # 變更：新增 quiz-invalid，開頭呼叫 checkQuizBank
├── renderer/
│   ├── budget.ts                    # 變更：新增 QUIZ_BUDGET_LIMITS、QUIZ_URL_RESERVE_CHARS
│   └── discord.ts                   # 變更：review 版面補「✍️ 本週小測」段（Challenge 後、鼓勵語前）；匯出 renderQuizItemBody
├── pages/
│   ├── quiz-page.ts                 # ★ 新增：QuizPageView 導出 + HTML 渲染（<details> 呈現正解）
│   └── site.ts                      # 變更：buildSite() 對 unlockedIds 額外輸出 quiz 頁
├── config.ts                        # 變更：Config.pagesBaseUrl（選填，讀 PAGES_BASE_URL）
├── main.ts                          # 變更：run() 併入 deps.pagesBaseUrl
└── types/
    └── lesson.ts                    # 變更：ReviewLesson.quizItems、ReviewQuizItem、BudgetSlots.quizItems

scripts/
├── generate-quiz-bank.ts            # ★ 新增：題庫產線入口（唯一 process.exit / 檔案寫入 / LLM 呼叫點）
├── generate-content.ts              # 不變
└── lib/
    ├── quiz-checkpoint.ts           # ★ 新增：QuizManifest（Concept 為單位，綁 Skeleton 雜湊）
    └── prompts/
        ├── quiz-aspects.ts          # ★ 新增：Stage A 面向列舉 prompt + response schema
        ├── quiz-items.ts            # ★ 新增：Stage B 據面向出題 prompt + response schema
        └── quiz-cross-check.ts      # ★ 新增：獨立二次作答交叉驗證 prompt + 解析（復用 self-check.ts 的 stripJsonFence）

data/quiz-bank.json                  # ★ 新增凍結產物（165 Concept × 3–10 題）

tests/
├── unit/                            # 新增／擴充（見下「測試落點」）
└── helpers/lesson.ts                # 變更：review fixture 支援 quizItems

package.json                         # 變更：新增 generate:quiz-bank script
.github/workflows/content.yml        # 變更：stage choice 新增 quiz-bank
```

**daily.yml 不在此清單中**——本 Feature 刻意不修改（research R1）。

**Structure Decision**：沿用既有的單一專案結構，**不新增頂層目錄**。三條硬性歸屬（沿用 F8 已定案的分類原則）：

- **純函式進 `src/`**：schema、選取、Gate 判準（`src/compiler/quiz.ts`）必須被 runtime、
  CI Gate、生成腳本三者共用（憲章 IX），故不得放在 `scripts/`。
- **I/O 與 `process.exit` 只在 `scripts/` 入口**：`generate-quiz-bank.ts` 是唯一寫題庫檔、
  唯一呼叫 LLM、唯一 `process.exit` 的位置（與 `generate-materials.ts` 同形）。
- **prompt 模組維持「純字串組裝」**：`scripts/lib/prompts/quiz-*.ts` MUST NOT 做 I/O、
  MUST NOT runtime import `@google/genai`（response schema 以 `ResponseSchema` 字面值聯集宣告）。

**額外歸屬（本 Feature 新增的判準）**：

- **Pages 消費者進 `src/pages/`**：`quiz-page.ts` 與既有 `article-page.ts` 同層，維持
  「Pages 為 Discord Renderer 的平行消費者、單向依賴」既有邊界（site-build-contract.md §0）。
- **`PAGES_BASE_URL` 的讀取只在 composition root（`src/main.ts`）與 `src/config.ts`**：
  `loadCompilerDeps()` 的既有邊界「只讀檔案系統、不讀環境變數」維持不變，`pagesBaseUrl`
  以事後併入 `CompilerDeps` 的方式傳遞（data-model.md §5 已註明理由）。

## 實作階段與依賴（供 `/speckit-tasks` 編排）

spec 的 User Story 優先序是價值序（僅 US1 一個 Story）；以下為**硬性實作依賴**，
`/speckit-tasks` MUST 據此編排 Phase。

| Phase | 內容 | 依賴 | 對應需求 |
| --- | --- | --- | --- |
| **P1** | `src/compiler/quiz.ts`（schema + `selectQuizItem` + `checkQuizBank`）＋ `budget.ts` 常數 ＋ 單元測試（用 fixture 題庫，不需真實生成） | — | FR-001／FR-003／FR-003a／FR-005／FR-006／FR-010／FR-010a／FR-014 |
| **P2** | `CompilerDeps`／`CompilerPaths`／`Config` 擴充；`compileReview` 填入 `quizItems`；`src/main.ts` 併入 `pagesBaseUrl`；Gate 接線（`quiz-invalid`） | P1 | FR-002／FR-004／FR-007／FR-008／FR-012（連結部分） |
| **P3** | Renderer 版面（`buildReviewBlocks` 新段落）＋ slot 對等測試（**可與 P1/P2 並行**，用 `tests/helpers/lesson.ts` 替身開發）。**⚠️ `renderQuizItemBody` 例外**：它被 `checkQuizBank` 共用（憲章 IX），故屬 P1／Phase 2 而非本階段——見 [tasks.md](./tasks.md) T006 與該檔 Phase 2 的澄清框 | **T006（`renderQuizItemBody`）屬 P1**；其餘（版面插入）無硬依賴 | FR-002／FR-009／SC-001／SC-004 |
| **P4** | `src/pages/quiz-page.ts` ＋ `buildSite()` 整合 ＋ determinism 測試 | P2（需要 `CompilerDeps.quizBank` 型別就位） | FR-011／FR-012（Pages 端）／SC-007 |
| **P5** | 題庫產線（prompts、`quiz-checkpoint.ts`、交叉驗證、`generate-quiz-bank.ts`）＋ 生成並 commit 真實題庫 | P1（要先有 Gate 才知道是否通過） | FR-013／FR-013a／FR-015／FR-016／SC-008／SC-009／SC-010 |
| **P6** | 端到端驗收（`DRY_RUN=true` 對真實課表、零金鑰 CI、SC 全項） | P1–P5 | quickstart.md §2–§6 |

### 測試落點

| 測試 | 檔案（建議） | 釘死的東西 |
| --- | --- | --- |
| 選題公式的決定性與三軌互異 | `tests/unit/quiz-select.test.ts` | FR-003、quiz-selection.md I1–I3 |
| 題庫缺席／某 Concept 缺題的降級路徑；壞檔 fail loud | `tests/unit/quiz-load.test.ts` | FR-007／FR-008、quiz-bank-schema.md §2 |
| Gate 的 9 個具名 rule 全數攔截且指名根因（8 個由 `checkQuizBank` 輸出，`quiz-schema` 由載入層 throw） | `tests/unit/quiz-gate.test.ts`（`quiz-schema` 在 `quiz-load.test.ts`） | quiz-bank-schema.md §3、SC-008 |
| review 版面五段順序、小測在 Challenge 後鼓勵語前、缺席即省略 | `tests/unit/renderer.test.ts`（擴充） | research R5、FR-002 |
| slot⇄field 對等不變式涵蓋 `quizItems` | `tests/unit/budget-slot-parity.test.ts`（擴充） | FR-009 |
| `quizItem`/`quiz` 預算檢查（含連結長度） | `tests/unit/budget.test.ts`（擴充） | FR-014、SC-004 |
| `pagesBaseUrl` 缺席／存在對 `quizUrl` 的影響 | `tests/unit/compile-review.test.ts`（擴充或新增） | FR-012、pages-quiz.md §1 |
| quiz 頁視圖組裝、`<details>` 結構、escape | `tests/unit/pages-quiz-page.test.ts` | FR-011、pages-quiz.md §3 |
| `buildSite` 對 quiz 頁的 determinism 與 unlockedIds 範圍 | `tests/unit/pages-site-determinism.test.ts`（擴充） | pages-quiz.md §2／§4 |
| 交叉驗證：一致即通過、不一致觸發重生、3 輪耗盡標記 needsHumanReview | `tests/unit/quiz-generate.test.ts` | FR-013／FR-013a／FR-010a |
| 續跑跳過已通過 Concept；`--force` 覆蓋；Skeleton 雜湊變更觸發重生 | 同上 | FR-015、SC-009 |
| `no-llm-in-src.test.ts` / `daily-no-llm-key.test.ts` 既有測試維持通過（不需修改判準對象） | 既有檔案 | 憲章 VIII |

## 待併入 spec 的 Phase 0 修訂

| FR | 原字面 | 問題 | 修訂後 |
| --- | --- | --- | --- |
| FR-002 | 「於第四段（Challenge 後）附加第五段」（插入點有兩種讀法） | 若插入在鼓勵語之後，會與 F8 既有不變式「鼓勵語 MUST 為最後一段」（FR-022）衝突，需先廢止該規則但 spec 無此意圖 | 明訂插入點為 Challenge 之後、鼓勵語之前（research R5）；五段順序：本週涵蓋／Reflection／Challenge／小測／鼓勵語 |
| （新增，非修改既有 FR） | spec 未指明 Discord 連結如何取得 Pages Base URL | 若比照 Pages job 做可見性偵測，需修改 `daily.yml`，牴觸「daily workflow 推播機制零改」 | 沿用既有 `PAGES_BASE_URL` 環境變數（research R1），本 Feature 不修改 `daily.yml`；變數缺席即全部省略連結，為本 Feature 的驗收基準狀態 |
| FR-011 | 「MUST 為**每個** Concept 產出一頁完整題庫頁」 | 與 research R7 定案的「僅 `unlockedIds`」直接衝突；**此項於 2026-08-07 `/speckit-analyze` 才發現漏列本表、漏回寫 spec** | 明訂僅對 `unlockedIds` 且題庫中有題的 Concept 產出，與 `articles/{conceptId}.html` 同構；已回寫 spec FR-011 與 `docs/spec.md` §15 |
| FR-014（數值） | `quizItem` ≤450、`QUIZ_URL_RESERVE_CHARS` 90 | 兩個數字皆未計入 spoiler 內 Pages 連結的實際長度（最壞 111），使 Gate 寬鬆於 runtime（違憲章 IX），且實測最長題目在啟用連結後即超標 | `quizItem` ≤**570**（內容 450 + 連結 120）、reserve **120**；已回寫 spec FR-014／SC-004 與 `docs/spec.md` §14.5（research R3） |

上述修訂已同步至本 plan、`data-model.md`、`contracts/`，並已於 `/speckit-tasks` 前正式回寫
`specs/011-weekly-quiz/spec.md`（FR-002、FR-012）與 `docs/spec.md` §15（**修正該節原本誤植的
段落順序**——原文列為「Encouragement 第四段、Quiz 第五段」，直接違反 F8 FR-022「鼓勵語 MUST 為
最後一段」；已更正為「Quiz 第四段、Encouragement 最後一段」，與本表決策一致）。

## Complexity Tracking

> 無憲章違反，本節不適用。
