# Implementation Plan: Weekly Review 素材、鼓勵語錄池與 review 版面完善（含移除 rest 槽）

**Branch**: `008-review-extras` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-review-extras/spec.md`

## Summary

把 review Session 缺席的兩段素材補齊，讓 §15 明訂的四段版面真的長出來，並順手修掉兩個
在檢視 review 時才浮現的節奏缺陷。

**技術路線**：

1. **課表層（Foundational，MUST 先做）**——`track-params.json` 三軌 rhythm 移除 `rest`（7→6 槽）、
   `schedule-schema.ts` 放寬長度與 `rest` 必要性、`emitSessions` 跳過算不出題的
   `practice` / `challenge` 槽（不消耗 `sessionIndex`）、為 `review` 槽決定性選出一題 Challenge。
   三份課表重跑並 commit（**198 / 200 / 243** Session）。
2. **素材層**——新增 `data/reflection-bank.json`（16 Topic × 6 則）與 `data/encouragement.json`
   （36 則），由新的 build-time 腳本 `scripts/generate-materials.ts` 生成，沿用 F7 的
   節流／退避／續跑／self-check 機制，過 Gate 後凍結入庫。
3. **消費層**——新增 `src/compiler/material.ts`（schema + 決定性選取純函式 + `checkMaterials`），
   `compileReview` 填入 `reflectionQuestion` / `encouragement`，Renderer 的 review 分支補上
   `💬 一句話` 段（版面最後），素材 Gate 掛進既有的 `runContentGate`。

**Phase 0 的兩項關鍵發現**（詳見 [research.md](./research.md) R5 / R6）：spec 字面的
「以 `sessionIndex` 對池大小取模」在本專案的節奏下**數學上無法滿足 SC-002 / SC-010**
（三軌 rhythm 皆 6 槽、review 固定末槽 ⇒ `sessionIndex` 每次遞增 6，`mod 30` 只取得到 5 個相異值）。
輪替索引改用「review 序數 / Topic 出現序數 + Track 偏移」，仍是 `(track, sessionIndex)` 的純函式。

## Technical Context

**Language/Version**: TypeScript 5.5（strict）／Node.js 24（ESM，`"type": "module"`）

**Primary Dependencies**: `zod`（素材 schema）、`gray-matter` + `marked`（既有，本 Feature 不新增用途）、
Node 內建 `fetch`；build-time 專用 `@google/genai`（**僅 `scripts/`**，`src/` MUST NOT import）。
**本 Feature 不引入任何新的 runtime 相依。**

**Storage**: 檔案系統上的凍結產物（`data/*.json`、`schedules/*.json`、`curriculum/track-params.json`）
＋ `state` 分支的 `state.json`（唯一權威狀態，本 Feature **不改動其 schema**）
＋ `.cache/material-manifest.json`（gitignored 續跑快取，非真實來源）

**Testing**: `vitest`（`npm test`）；型別檢查 `npm run typecheck`（含 `tests/` 與 `scripts/`）。
外部呼叫（Gemini）以假物件替身測（沿用 `GenAiLike`），**MUST NOT 在測試中打真實 API 或 webhook**。

**Target Platform**: GitHub Actions（Ubuntu, Node 24）＋ 本機 Windows / PowerShell。
一次性 CLI（`node dist/main.js`），跑完即退，無常駐服務、無 DB、無 docker。

**Project Type**: 單一 TypeScript 專案（CLI + build-time scripts），非 monorepo、非 web service。

**Performance Goals**: 每日 runtime 不受影響（新增的選取為 O(課表長度) 的一次掃描，≤243 筆）；
CI Gate 對 **641 筆 Lesson**（198+200+243）完整編譯 + render + 預算檢查，維持現行量級。
素材產線共 **17 次 LLM 呼叫**（16 Topic + 1 語錄池，不含重生），遠低於 F7 的 165 篇。

**Constraints**:
- 每日 runtime **零 LLM**；`daily.yml` MUST NOT 含 `GEMINI_API_KEY`。
- Discord 單則訊息全部 embeds 文字總和 ≤ **5,500**；`reflectionQuestion` ≤ 300、
  `encouragement` ≤ 200、每題 ≤ 350（最多 3 題）。**MUST NOT 自動截斷**。
- 選取 MUST 為 `(track, sessionIndex)` 的純函式；Renderer MUST 為 stateless 純函式。
- 生成物凍結：`schedules/**`、`data/**` MUST NOT 手改，一律「改輸入 → 重跑 → review diff → commit」。
- Free-tier only：僅 GitHub Actions + Discord Webhook + Gemini 免費層（`gemini-3.5-flash-lite`，僅 build-time）。

**Scale/Scope**: 3 Track × 641 Session；16 Topic / 165 Concept / **351 題**（皆為 F7 凍結產物，本 Feature 不動）；
新增素材 96 則 Reflection + 36 則語錄。變更檔案約 20 個（見 [data-model.md](./data-model.md) §10）。

**未解 NEEDS CLARIFICATION**：無。spec 明文交給 plan 的唯一決策（FR-020a）已於
[research.md](./research.md) R4 定案；Phase 0 另發現並解決 R5 / R6 兩項不可實作的字面規則。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**憲章版本**：v1.0.2（2026-07-30）。**Phase 0 前檢查：PASS。Phase 1 設計後複查：PASS（無新增違反）。**

| # | 原則 | 判定 | 本 Feature 如何滿足 |
| --- | --- | --- | --- |
| I | Concept-first, Problem-second | ✅ | review 版面順序為「本週涵蓋 → Reflection → Challenge → 鼓勵語」，觀念與反思先於題目 |
| II | One Concept per Session | ✅ | 不新增／不改動 concept 類 Session |
| III | Small Learning Steps | ✅ | Curriculum 完全不動；移除 rest 只改 Session 編號，不合併任何 Concept |
| IV | Deterministic Curriculum | ✅ | 課程順序由 Curriculum + rhythm 決定；LLM 只產文字素材，MUST NOT 參與排序（SC-005 的 A4 釘死順序不變） |
| V | Curriculum as DAG | ✅ | DAG 與拓樸子序列驗證原封保留（contracts/schedule-revision.md §4 A3） |
| VI | Shared Knowledge, Different Tracks | ✅ | **三軌共用同一份素材檔**（FR-013）；差異只來自各自課表與 `trackOffset` |
| VII | LLM Authors Once, Not Daily | ✅ | 素材 build-time 生成 → 過 Gate → 凍結 commit |
| VIII | Zero-LLM Daily Runtime | ✅ | 新腳本只在 `scripts/`；`src/` 不 import `@google/genai`（`no-llm-in-src.test.ts` 守）；`daily.yml` 不含金鑰（`daily-no-llm-key.test.ts` 守）；SC-006 明確驗零金鑰路徑 |
| IX | Build-time over Runtime | ✅ | review 選題在**生成端**定案（FR-015）；素材 Gate 掛進**既有** `runContentGate`，CI 與生成腳本共用同一顆（research R8）；預算常數單一來源（research R9） |
| X | Language-specific Learning | ✅ | 不改動 concept 版面的 TS / Python Tip |
| XI | Renderer Knows Nothing About Curriculum | ✅ | Renderer 只讀 `Lesson`；素材由 Compiler 放入。新增的 `💬 一句話` 只是多一個 field，版面分派仍只依 `lesson.type` |
| XII | Deterministic & Reproducible Delivery | ✅ | 選取為 `(track, sessionIndex)` 純函式（contracts/review-selection.md §3–§4 的 I1–I9）；SC-004 以 100 次重複編譯釘死 |
| XIII | Generated Artifacts Are Frozen Once Committed | ✅ | 課表由生成器重跑（byte-identical，SC-005）；素材由腳本生成、可重生成，**不引入手工資產** |
| XIV | Secrets Never in Repo | ✅ | `GEMINI_API_KEY` 只走 `content.yml` 的 Secrets 與本機環境變數；不寫入任何檔案 |
| XV | Fault Isolation & Fail Loud | ✅ | 生成腳本單批失敗不阻斷其餘 Topic、以非零 exit code 收尾；跳過的槽、無題的 review、與 challenge 撞號皆有**具名 warning**（data-model.md §7）；Gate MUST NOT 自動截斷 |
| XVI | Free-tier Only | ✅ | 17 次 LLM 呼叫（vs F7 的 165 篇），不新增服務 |
| XVII | One Human Checkpoint | ✅ | 素材全由自動 Gate + LLM self-check 把關，**不新增常態性人工審核關卡**；唯一人工檢查點仍是課綱大綱定稿 |

**技術與資源約束**（憲章「Additional Constraints」）：無新選型。composition root 不變（不引入 DI 框架、不啟 HTTP server）；
schema 用 `zod`；測試用 `vitest`；模型維持 `gemini-3.5-flash-lite`；環境變數命名不新增
（`generate-materials.ts` 只讀既有的 `GEMINI_API_KEY` 與 F7 既有的 RPM 設定）。

**Complexity Tracking**：無需填寫（零違反）。

## Project Structure

### Documentation (this feature)

```text
specs/008-review-extras/
├── plan.md                          # 本檔（/speckit-plan 輸出）
├── spec.md                          # 需求（既有）
├── research.md                      # Phase 0：R1–R14 決策
├── data-model.md                    # Phase 1：實體、欄位、不變式、檔案清單
├── quickstart.md                    # Phase 1：可執行的驗收腳本
├── contracts/
│   ├── material-schema.md           # 素材檔格式 + Gate 判準 + 生成端契約
│   ├── review-selection.md          # 選取純函式 + 不變式 I1–I9 + 版面順序
│   └── schedule-revision.md         # 生成器修訂 + 課表重跑驗收 A1–A7
└── tasks.md                         # Phase 2（/speckit-tasks 產出，非本命令）
```

### Source Code (repository root)

```text
src/
├── compiler/
│   ├── material.ts                  # ★ 新增：素材 schema + 選取純函式 + checkMaterials
│   ├── lesson.ts                    # 變更：改用完整 schema；compileReview 填入兩素材欄位
│   ├── gate.ts                      # 變更：新增 material-invalid，開頭呼叫 checkMaterials
│   ├── schedule-generator.ts        # 變更：跳過無題槽、review 選題、warning subject
│   └── schedule-schema.ts           # 變更：rhythm 長度 .min(2).max(14)、移除 rest 必要性
├── renderer/
│   ├── budget.ts                    # 變更：抽出 MATERIAL_BUDGET_LIMITS
│   └── discord.ts                   # 變更：review 版面補 💬 一句話（最後一段）
└── types/
    ├── lesson.ts                    # 變更：ReviewLesson.encouragement
    └── schedule.ts                  # 變更：三個新 violation rule、rhythm 註解

scripts/
├── generate-materials.ts            # ★ 新增：素材產線入口（唯一 process.exit / 檔案寫入 / LLM 呼叫點）
├── generate-content.ts              # 變更：改 import 搬移後的 self-check helper（re-export 維持相容）
└── lib/
    ├── material-checkpoint.ts       # ★ 新增：MaterialManifest（批次為單位）
    ├── checkpoint.ts                # 變更：匯出原子寫入／讀檔 helper 供復用（行為不變）
    └── prompts/
        ├── reflection-bank.ts       # ★ 新增：Reflection 生成 prompt + response schema
        ├── encouragement.ts         # ★ 新增：語錄生成 prompt + response schema
        └── self-check.ts            # 變更：移入 stripJsonFence/parseSelfCheckResponse；新增 Reflection rubric

curriculum/track-params.json         # 變更：三軌 rhythm 移除 rest（7 → 6 槽）
schedules/{foundation,interview-ready,interview-mastery}.json   # 重生成：198 / 200 / 243
data/reflection-bank.json            # ★ 新增凍結產物（16 Topic × 6 則）
data/encouragement.json              # ★ 新增凍結產物（36 則）

tests/
├── unit/                            # 新增／擴充（FR-032 的九類，見下）
└── helpers/lesson.ts                # 變更：review fixture 支援 encouragement

.github/workflows/content.yml        # 變更：stage choice 新增 materials
package.json                         # 變更：新增 generate:materials
```

**Structure Decision**：沿用既有的單一專案結構，**不新增頂層目錄**。三條硬性歸屬：

- **純函式進 `src/`**：schema、選取、Gate 判準（`src/compiler/material.ts`）必須被 runtime、
  CI Gate、生成腳本三者共用（憲章 IX），故不得放在 `scripts/`——否則 `src/` 會反向依賴 `scripts/`。
- **I/O 與 `process.exit` 只在 `scripts/` 入口**：`generate-materials.ts` 是唯一寫素材檔、
  唯一呼叫 LLM、唯一 `process.exit` 的位置（與 `generate-schedule.ts` / `generate-content.ts` 同形）。
- **prompt 模組維持「純字串組裝」**：`scripts/lib/prompts/**` MUST NOT 做 I/O、MUST NOT runtime import
  `@google/genai`（response schema 以 `ResponseSchema` 字面值聯集宣告，沿用 F7 既有做法）。

## 實作階段與依賴（供 `/speckit-tasks` 編排）

spec 的 User Story 優先序是**價值序**；以下為**硬性實作依賴**，`/speckit-tasks` MUST 據此編排 Phase。

| Phase | 內容 | 依賴 | 對應需求 |
| --- | --- | --- | --- |
| **P0** | `state` 分支進度查證（research R14） | — | contracts/schedule-revision.md §5 |
| **P1** | 生成器與參數變更（rhythm、跳過無題槽、review 選題、warning rules）＋ 單元測試 | P0 | FR-014a/b/e/f/g、FR-015–FR-020a |
| **P2** | 重跑並 commit 三份課表（198/200/243），通過 A1–A7 | P1 | FR-014d、FR-019、SC-005、SC-012 |
| **P3a** | `src/compiler/material.ts`（schema + 選取 + `checkMaterials`）、`budget.ts` 常數抽出、Compiler 填入、Gate 接線 | P2（配額檢查與選取正確性只能對新課表驗證） | FR-001–FR-014、FR-028–FR-030 |
| **P3b** | Renderer review 版面 ＋ slot 對等測試（**可與 P3a 並行**，用 `tests/helpers/lesson.ts` 替身開發） | 無硬依賴 | FR-021–FR-025 |
| **P4** | 素材產線（prompts、self-check 搬移、checkpoint、`generate-materials.ts`）＋ 生成並 commit 素材 | P3a（要先有 Gate 才知道是否通過） | FR-026–FR-028b、SC-007/008/011 |
| **P5** | 端到端驗收（`DRY_RUN=true` 對真實課表、零金鑰 CI、SC 全項） | P2–P4 | quickstart.md §4–§7 |

> **P1 的四項變更 MUST 在同一階段完成**：它們全部改變 `generate-schedule.ts` 的輸出，
> 分批進行會產生多次全量課表 diff（spec「實作順序約束」①）。

### 測試落點（FR-032 的九類 + Phase 0 新增）

| 測試 | 檔案（建議） | 釘死的東西 |
| --- | --- | --- |
| rhythm 不含 rest 通過參數驗證；長度上下界 | `tests/unit/schedule-rhythm.test.ts`（擴充） | FR-014a/b、research R1 |
| 無題槽跳過（practice/challenge 不產生且不消耗 index；review 仍產生；跳過後 `reviewRange` 仍正確涵蓋該週全部 concept） | `tests/unit/schedule-skip-empty-slot.test.ts` | FR-014e/f |
| 跳過 warning 的 rule 與 subject 格式 | 同上 | research R2 |
| review 選題：最低難度優先、同難度最小題號、排除同週 challenge、軟排除退回、空池省略 | `tests/unit/schedule-review-problem.test.ts` | FR-016–FR-020a |
| 課表重跑 byte-identical | `tests/unit/schedule-generate.test.ts`（擴充） | FR-019、SC-005 |
| Reflection 選取的決定性與 Topic 對應（含跨 Module 的最早引入決勝） | `tests/unit/material-select.test.ts` | FR-011、I1–I4 |
| 鼓勵語輪替：連續 30 互異、相鄰不重複、三軌不同 | 同上 | FR-012、I5–I9 |
| 素材檔缺席／空集合的省略路徑；壞檔 fail loud | `tests/unit/material-load.test.ts` | FR-014、contracts/material-schema.md §2 |
| 素材 Gate 的 8 個具名 rule 全數攔截且指名根因（contracts/material-schema.md §3） | `tests/unit/material-gate.test.ts` | FR-028、SC-007 |
| review 版面四段順序、鼓勵語在最後、缺席即省略 | `tests/unit/renderer.test.ts`（擴充） | FR-021/022 |
| slot⇄field 對等不變式涵蓋 `encouragement` | `tests/unit/budget-slot-parity.test.ts`（既有全域專檔，F8 規劃期自 `review-fixes.test.ts` 純搬移） | FR-024 |
| **`rest` 的 compile / render 路徑**（現行課表已無此類 Session） | `tests/unit/compile-types.test.ts` / `renderer.test.ts`（擴充） | FR-014c、spec Edge Case |
| self-check 解析失敗算一次重生；3 次不過標記 needsHumanReview 且不凍結 | `tests/unit/material-generate.test.ts` | FR-028a/b、SC-011 |
| 續跑跳過已通過批次；`--force` 覆蓋 | 同上 | FR-026、SC-008 |

> **`rest` 的測試不是形式主義**：三份課表已無 `rest` Session，`validate.ts` 的全課表編譯**不再涵蓋**
> `compileRest` / `buildRestBlocks`。沒有單元測試，它們會退化成無人測到的死路徑，
> 未來想加回休息日時才發現已損壞（spec Edge Case 明文要求）。

## 規格修訂（Phase 0 發現，需併入 spec）

Phase 0 發現 spec 的兩條 FR 其**字面機制**與 Success Criteria 互斥，已於本次規劃定案修正
（詳見 research.md R5 / R6，contracts/review-selection.md §3–§4 有完整不變式）：

| FR | 原字面機制 | 問題 | 修訂後 |
| --- | --- | --- | --- |
| FR-012 | 「以 `sessionIndex` 對語錄池大小取模」 | rhythm 6 槽 ⇒ `sessionIndex` 步長恆為 6，`mod 30` 只取得到 **5** 個相異索引 ⇒ SC-002（連續 30 互異）不可能成立 | `(reviewOrdinal + trackOffset) mod quotes.length` |
| FR-011 | 「再以 `sessionIndex` 決定性輪替於該候選集之內」 | 同一 Topic 的 review 間距為 6 的倍數，`mod 6` 恆為同值 ⇒ **同一 Topic 每次推同一則** ⇒ SC-010 不可能成立 | `(topicOccurrence + trackOffset) mod pool.length` |

- 兩者**仍是 `(track, sessionIndex)` 的純函式**，FR-010 的決定性要求不受影響。
- 修訂只動「用什麼當輪替索引」，**不動任何 MUST 的意圖、不動任何 SC**。
- 已同步更新 `specs/008-review-extras/spec.md` 的 FR-011 / FR-012 條文。

### 後續：需求品質關卡（2026-08-01，`/speckit-checklist` 第二輪）

上述兩項之外，checklist 第二輪逐條複驗 47 項後另判定 **38 項不通過**並全部修訂完成，
其中三項與本 plan 的設計直接相關、**已回寫需求文件**：

| 發現 | 修訂 |
| --- | --- |
| FR-017 的無條件排除與 SC-001 互斥 | 新增 FR-017a（軟排除）／FR-017b（不排除 practice），與 research R4 一致 |
| FR-014 的「空集合即省略」與素材 schema 的 `min(1)` 互斥 | FR-014 改寫為三種降級情境並明訂 schema MUST 允許空集合；本 plan 的 [data-model.md](./data-model.md) §1/§2 與 [contracts/material-schema.md](./contracts/material-schema.md) §1 已同步 |
| rhythm 長度約束完全未被任何需求提及 | 新增 FR-014b1（範圍 2–14），與 research R1 一致 |

完整判定與落點見 [checklists/requirements.md](./checklists/requirements.md) 的「第二輪執行結果」。
`docs/spec.md` 亦修訂 9 處（§13.2 / §13.4 / §15 / §17 / §20.1 / §20.3 / §20.4）。

### 待辦：憲章原則 XII 的措辭澄清（`/speckit-analyze` 2026-08-02 發現，**尚未執行**）

憲章 v1.0.2 原則 XII 寫「鼓勵語 / Hint / Reflection 亦為 build-time 凍結素材，**依 `sessionIndex`
決定性輪替**」，而本 Feature 的 FR-012 明訂「**MUST NOT 改用 `sessionIndex` 對池大小取模**」。

- **實質不違反**：R5 / R6 的兩式仍是 `(track, sessionIndex)` 的純函式，決定性與可重現性反而更強
  （Constitution Check 判定 XII 為 ✅ 不變）。衝突僅存在於字面。
- **MUST NOT 在本 Feature 的實作 commit 中夾帶修改憲章**：憲章 Governance 規定修訂須先落地
  `docs/spec.md` §4、再同步憲章並更新版本號與 Sync Impact Report——那是一次獨立的
  `/speckit-constitution` PATCH（v1.0.3），不是 `/speckit-analyze` 或 `/fix-findings` 的產出。
- **建議措辭**（供該次 PATCH 使用）：將「依 `sessionIndex` 決定性輪替」改為
  「依**由 `sessionIndex` 決定的序數**（`reviewOrdinal` / `topicOccurrence`）決定性輪替
  （`docs/spec.md` §16.4）」，並同步 `docs/spec.md` §4 第 12 條與 CLAUDE.md 工程硬規則第 3 條的同句措辭。
- **不做的後果可接受但非零**：實作者若只讀憲章而未讀 §16.4，可能寫出 `sessionIndex % N`
  ——這正是 R5 / R6 證明會讓 SC-002 / SC-010 數學上不成立的寫法。`docs/spec.md` §16.4 與
  contracts/review-selection.md §3–§4 已各有一段明確反例推導作為防線。

## Complexity Tracking

> 無憲章違反，本節不適用。
