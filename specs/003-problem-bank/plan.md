# Implementation Plan: Problem Bank（題庫 schema／資料、Concept ↔ Problem 逆向對應、slug 一致性）

**Branch**: `003-problem-bank` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-problem-bank/spec.md`

## Summary

F3 交付**題目事實的唯一來源與其驗證／查找能力**：一份 spec §12.1 形態的 Problem Bank（`data/problem-bank.json`）、
一顆 CI Gate 與未來 F5 runtime **共用的單一** 載入／驗證／查找模組（`src/compiler/problem.ts`），以及一個
比照 F2 `validate:curriculum` 的 CI 驗證入口。核心能力：

- **US1** 逐題 schema 驗證（必填欄位、`difficulty`/`review_priority` 值域、key == `id`），fail loud 且指名。
- **US2** 由 Concept `leetcode[]` 前向查得題目 metadata；**有題 Concept** 強制 1~3 題數守門（§12.1 唯一權威守門點），
  合法 `leetcode: []` 觀念課回傳空清單不報錯（clarify 2026-07-22 定案）。
- **US3** 由 pattern 反查題目 + `patterns` 參照完整性（指向存在的 Topic/Concept id，無懸空）。
- **US4** `url` slug 與 `slug` 欄位一致（無死鏈）。
- **FR-009** 把 F2 預留的可插拔 `problemExists` 由 `deferred-to-F3` stub 換成以真實題庫為背景的實作。

**技術取向**：純函式（無 `process.exit`／無 I/O 於驗證與查找邏輯），`zod` 驗 JSON schema，沿用 F2 的
`Violation` 契約與驗證入口模式；零 LLM、零網路、確定性。

## Technical Context

**Language/Version**: strict TypeScript 5.5（`tsc` → `node`/`tsx`），Node.js 24。

**Primary Dependencies**: `zod`（JSON schema 驗證，已於 F2 引入）；Node 內建 `fs`（讀檔）。**無新增相依**。
測試 `vitest`；CI 驗證入口用 `tsx`（皆已存在）。

**Storage**: 版本控制的 JSON 檔 `data/problem-bank.json`（題號字串為 key 的物件；題目事實的唯一來源，
人工維護，F3 不建生成器）。需 F2 的 Curriculum 圖（in-memory，經 `loadCurriculum` 取得）以驗 `patterns` 參照與 `problemExists`。

**Testing**: `vitest`（單元）＋ `npm run validate:problem-bank`（CI Gate 入口，納入既有 `ci.yml`）。

**Target Platform**: GitHub Actions（Node 24）上跑的一次性 CLI／build-time Gate；純函式亦供 F5 runtime import。

**Project Type**: 單一專案 CLI／library（composition root 手寫，無框架、無 HTTP server）。

**Performance Goals**: N/A（seed 題庫 ~6–9 題，驗證與查找為 sub-ms）；硬性要求為**確定性**（同輸入→同輸出，違規清單與查找結果逐次一致）。

**Constraints**: 零 LLM（`src/` MUST NOT import `@google/genai`）、零網路（MUST NOT runtime 抓 LeetCode）、確定性；
載入／查找／驗證**單一實作**（FR-014，禁雙軌）；純函式無副作用，`process.exit` 只留在驗證入口；
Problem Bank schema MUST NOT 含任何題目敘述／內容欄位（FR-004、§5）。

**Scale/Scope**: F3 seed 恰好涵蓋 F2 stub 引用題號 {1,26,27,283,303,560} + F1 walking-skeleton 示範題 {11,125,167}；
難度僅 Easy/Medium（Hard 延到 F7，clarify 2026-07-22 定案）。全量 150+ Concept 題庫待 F7。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

逐條對照 `.specify/memory/constitution.md`（v1.0.1）與本 Feature 設計：

| 原則 | 判定 | 說明 |
| --- | --- | --- |
| VIII. Zero-LLM Daily Runtime | ✅ PASS | `src/compiler/problem.ts` 不 import `@google/genai`；FR-012 有 zero-llm 測試守衛（比照 `tests/unit/zero-llm.test.ts`）。 |
| IX. Build-time over Runtime／單一 Compiler | ✅ PASS（核心） | 載入／驗證／查找為**單一模組**，CI Gate 與 F5 runtime 共用；不建第二套解析。F1 舊 bank 形態屬臨時產物，本 Feature 收斂為單一 spec 形態（見 research R1）。 |
| XI. Renderer Knows Nothing | ✅ PASS | Renderer 不讀 Problem Bank；查找結果經 Compiler 進 `Lesson`。本 Feature 不動 Renderer。 |
| XIII. Generated Artifacts Frozen | ✅ PASS（不適用生成器） | Problem Bank 為**人工維護**的參照資料（§12.1，非 `schedules/**` 類生成物）；F3 明列不建生成器（Out of Scope）。 |
| XV. Fault Isolation & Fail Loud | ✅ PASS | 所有違規為結構化 `Violation`（rule/severity/subject/field?/target?/message），CI 入口有 error 即非零 exit。 |
| 測試優先（§22.2） | ✅ PASS | 每一種違規類型 + 前向/反向查找 + determinism 皆有單元測試（SC-004）。 |
| 技術釘死（§22.3） | ✅ PASS | `zod` 驗 schema、`vitest`、`tsx` 入口；無新框架、無新付費相依。 |
| 不轉載 LeetCode 內容（§5、§11） | ✅ PASS | Schema 只存 id/slug/title/url/difficulty/patterns 等參照 metadata；FR-004 禁內容欄位。 |

**結論**：無違反任一 MUST／MUST NOT。**Complexity Tracking 留空**（無需正當化的偏離）。

## Project Structure

### Documentation (this feature)

```text
specs/003-problem-bank/
├── plan.md              # 本檔（/speckit-plan 輸出）
├── research.md          # Phase 0：關鍵設計決策（R1–R7）
├── data-model.md        # Phase 1：ProblemMeta / ProblemBank / Violation 擴充 / 查找契約
├── quickstart.md        # Phase 1：驗證與查找的可執行驗收指引
├── contracts/
│   ├── problem-bank-schema.md   # data/problem-bank.json 的 JSON schema 契約（§12.1）
│   └── problem-module-api.md    # src/compiler/problem.ts 對外函式契約
├── checklists/
│   └── requirements.md  # 既有（spec 品質檢查）
└── tasks.md             # /speckit-tasks 產出（非本命令）
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── curriculum.ts        # 既有（F2）：Violation / ViolationRule / CurriculumGraph / TopicNode / ConceptNode
│   ├── lesson.ts            # 既有（F1）：Lesson / Problem（whyThisPattern/hint，compile 組裝形態，保留）
│   └── problem.ts           # 【新增】ProblemMeta（題庫參照 metadata，§12.1）+ ProblemBank + F3 違規規則
├── compiler/
│   ├── curriculum.ts        # 既有（F2）：loadCurriculum / validateCurriculum（本 Feature 為 problemExists 提供實作）
│   ├── problem.ts           # 【重寫】單一載入／驗證／查找模組（純函式；US1/US2/US3/US4 + makeProblemExists）
│   ├── lesson.ts            # 【小改】F1 walking-skeleton：改用新查找取 ProblemMeta，組進 Lesson.problems
│   └── schedule.ts          # 既有（F1 臨時）：本 Feature 視需要對齊 F1 demo concept 的 leetcode 來源
data/
└── problem-bank.json        # 【遷移】F1 舊形態 → §12.1 題號字串為 key 的物件（seed）

scripts/
├── validate-curriculum.ts   # 既有（F2）
└── validate-problem-bank.ts # 【新增】CI 驗證入口（比照 validate-curriculum：載圖 + 載庫 → 驗證 → 人可讀 → exit code）

tests/
├── fixtures/
│   ├── problem-bank.json                    # 【遷移】改為新 schema 的合法 fixture
│   └── problem-bank/**（新增非法 fixtures）  # 缺欄位/型別錯/difficulty 值域/key≠id/slug 不符/懸空 pattern/題數>3
└── unit/
    ├── problem-bank-validate.test.ts        # 【新增】US1/US3/US4 各違規類型
    ├── problem-lookup.test.ts               # 【新增】US2 前向（含空題合法）+ US3 反向 + determinism
    ├── leetcode-existence.test.ts           # 【新增】FR-009：makeProblemExists 接進 validateCurriculum，skipped→實際執行
    ├── problem.test.ts                      # 【遷移】既有，改對新契約
    └── zero-llm.test.ts                     # 【小改】既有全域掃描補一條 src/compiler/problem.ts 涵蓋斷言（FR-012）

.github/workflows/ci.yml     # 【小改】新增一步 `npm run validate:problem-bank`
package.json                 # 【小改】新增 script `validate:problem-bank`
```

**Structure Decision**: 沿用 F2 既定的單一專案結構與「純函式模組 + 薄驗證入口」分層。F3 的所有邏輯集中在
**單一模組** `src/compiler/problem.ts`（FR-014），型別放 `src/types/problem.ts`，CI 入口 `scripts/validate-problem-bank.ts`
持有唯一的 `process.exit`。不新增目錄層級、不引入框架。

## Complexity Tracking

> 無 Constitution 違規，本表留空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| —         | —          | —                                   |
