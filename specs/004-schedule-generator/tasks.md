---
description: "Task list for 004-schedule-generator implementation"
---

# Tasks: Schedule Generator（課表生成器、三組 Track 參數與 Track Overlay）

**Input**: Design documents from `specs/004-schedule-generator/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/](./contracts/)

**Tests**: 本 Feature **要求測試**——spec §22.2「測試優先」與 SC-007/SC-008 明訂「每一類驗證規則至少一個單元測試 + determinism byte-identical 測試 + schema 合法/非法樣本」。故各 User Story 皆含測試任務（先寫測試、確認 FAIL 再實作）。

**Organization**: 依 User Story 分階段。F4 為單一生成器模組，US2–US5 在 US1 的管線上**增量增強**，但各 Story 以自己的測試檔獨立驗證其性質。

## Format: `[ID] [P?] [Story] Description`

- **[P]**：可並行（不同檔案、無未完成前置）
- **[Story]**：US1–US5（對應 spec User Stories）
- 每個任務含精確檔案路徑

## Path Conventions

單一專案（repo 根的 `src/` `scripts/` `tests/`）。既有 F1/F2/F3 模組不改（`src/compiler/schedule.ts` shim、`curriculum.ts`、`problem.ts`）。

---

## Phase 1: Setup（共享基礎）

**Purpose**: 專案入口與腳本

- [X] T001 在 [package.json](../../package.json) 的 `scripts` 新增 `generate:schedule`（`tsx scripts/generate-schedule.ts`）與 `validate:schedule`（`tsx scripts/validate-schedule.ts`）

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: 型別、輸入 schema、stub 輸入資料、生成器模組骨架——所有 User Story 的共同前置

**⚠️ CRITICAL**: 本階段完成前，任何 User Story 不得開始

- [X] T002 建立 `src/types/schedule.ts`：`SessionPlan` / `TrackSchedule` / `TrackParam` / `TrackParamsFile` / `ConceptOverlay` / `TrackOverlay` / `ScheduleViolation` / `ScheduleViolationRule`（純型別；`Track` / `SessionType` **import 自** `src/types/lesson.ts`，MUST NOT 重定義），欄位對齊 [data-model.md](./data-model.md) §1–§5
- [X] T003 [P] 建立 `curriculum/track-params.json`：三 Track stub 值（`foundation`/`interviewReady`/`interviewMastery`），對齊 [contracts/track-params-schema.md](./contracts/track-params-schema.md) 的 stub 表
- [X] T004 [P] 建立 `overlays/foundation.json`、`overlays/interview-ready.json`、`overlays/interview-mastery.json`：stub 值（含一筆 `extraProblemIds` 示例驗疊加路徑），對齊 [contracts/overlay-schema.md](./contracts/overlay-schema.md)
- [X] T005 建立 `src/compiler/schedule-schema.ts`：以 `zod` `.strict()` 解析 track-params 與 overlay 輸入 → 具名 `schema-missing-field` / `schema-type` / `param-invalid` 違規（分類器比照 F3 `classifyZodIssue`），純函式（依賴 T002）
- [X] T006 建立 `src/compiler/schedule-generator.ts` 骨架：`GenerateInput` / `GenerateResult`、Track↔檔名映射常數表（`interviewReady`→`interview-ready.json`）、`ScheduleViolation` 建構子 + 穩定排序器（比照 F2/F3 `cmpViolation`）、`generateAllSchedules` / `validateSchedule` / `serializeSchedule` 函式簽章（先空實作），純函式無 `process.exit`／無 I/O（依賴 T002）

**Checkpoint**: 基礎就緒——User Story 實作可開始

---

## Phase 3: User Story 1 - 確定性生成、同輸入 byte-identical（Priority: P1）🎯 MVP

**Goal**: `generate-schedule.ts` 依 DAG + track-params 確定性生成三份 `schedules/{track}.json`；同輸入 → byte-identical。

**Independent Test**: 連續執行生成器兩次，`git diff --exit-code schedules/` 為空；改動任一輸入後 diff 僅反映該變動。

### Tests for User Story 1 ⚠️（先寫、先 FAIL）

- [X] T007 [P] [US1] 建立 `tests/unit/schedule-generate.test.ts`：determinism——同 input 連續 `generateAllSchedules` 兩次字串相等、`serializeSchedule` 輸出穩定（含固定欄位序、檔尾 `\n`、LF）、無 `Date`/`Math.random` 依賴（SC-001）
- [X] T008 [P] [US1] 建立 `tests/unit/schedule-schema.test.ts`：track-params / overlay 的 zod 結構驗證——合法樣本通過、非法樣本（缺欄位 / 型別錯 / 未知欄位 / 非法 enum）被具名 `schema-*` 拒絕（SC-008）

### Implementation for User Story 1

- [X] T009 [US1] 在 `src/compiler/schedule-generator.ts` 實作**涵蓋子集選取**（依 `maxLevel` 或 `moduleAllowlist` 從 `graph.concepts` 篩選）+ 依 F2 canonical `topoOrder` 取子序列排序（本階段先 concept-only emit），對齊 [research.md](./research.md) R3（依賴 T006）
- [X] T010 [US1] 在 `src/compiler/schedule-generator.ts` 實作 **canonical `serializeSchedule`**：固定欄位序（`track→targetLevel→sessions`、`sessionIndex→type→conceptId?→reviewRange?→problemIds?`）、`JSON.stringify(_,null,2)` + 檔尾 `\n`、空 optional 省略，對齊 research R2（依賴 T006）
- [X] T011 [US1] 在 `src/compiler/schedule-generator.ts` 實作 `generateAllSchedules` 主流程（逐 Track：選取+排序 → emit concept sessions → serialize），回傳 `{ schedules, violations }`（依賴 T009、T010）
- [X] T012 [US1] 建立 `scripts/generate-schedule.ts` 入口：`loadCurriculum` + `validateCurriculum`（error 中止）→ `loadProblemBank` → 讀 `track-params.json` + `overlays/*`（經 T005 zod）→ `generateAllSchedules` → 有 error 印具名違規並非零 exit（**不寫檔**）→ 無 error 寫三檔 + 摘要 + exit 0（唯一 I/O + `process.exit`）（依賴 T011）
- [X] T013 [US1] 執行 `npm run generate:schedule` 生成並 commit `schedules/foundation.json`、`schedules/interview-ready.json`、`schedules/interview-mastery.json`（凍結產物）（依賴 T012）
  - ⚠️ **此階段產物為刻意的 concept-only 中間形態**：僅含 `concept` Session，尚不含 rhythm 的 review/rest/practice/challenge 與 `problemIds`，**暫不代表 FR-011 的最終樣貌**。US3（T021 加 `problemIds`）、US4（T026 補完整週節奏）將**重生成並重新 commit**；CI drift gate（T030）於 US5 才接線，故中間形態不會被紅燈攔截——屬增量交付的預期路徑。

**Checkpoint**: 執行生成器 → 三份確定性課表；重跑無 diff（MVP 可驗）

---

## Phase 4: User Story 2 - 合法拓樸子序列 + one-concept-per-session（Priority: P1）

**Goal**: 每份課表的 concept 出現序為共用 DAG 的合法拓樸子序列（無前向依賴）；每個 concept Session 恰引入一個新 Concept；涵蓋閉包缺前置即 fail loud。

**Independent Test**: 對每份課表，每個 concept Session 的 prereq 皆在更前 index；合成違序案例 fail loud。

### Tests for User Story 2 ⚠️

- [X] T014 [P] [US2] 建立 `tests/fixtures/schedule/` 合成 fixture：一個 ≥3 Level、含跨 Level prereq 的多-Level DAG（`modules.json` + `concepts/**`），以及一個 `moduleAllowlist` 跳號（缺前置）案例
  - 實作改採 `tests/helpers/schedule.ts` 的 `buildMultiLevelGraph()`（in-memory `buildGraph`），比照既有 `tests/unit/topo-order.test.ts` 的作法，等價於檔案型 fixture 但免除手寫 markdown frontmatter。
- [X] T015 [P] [US2] 建立 `tests/unit/schedule-topo.test.ts`：驗每個 concept Session 的 prereq 皆在更前 index（SC-002）、one-concept-per-session（SC-006）、`forward-dependency`/`duplicate-concept`/`coverage-gap` 具名 fail loud（用 T014 fixture）

### Implementation for User Story 2

- [X] T016 [US2] 在 `src/compiler/schedule-generator.ts` 實作 **prerequisite 閉包檢查**：被涵蓋 Concept 的前置若不在涵蓋集 → `coverage-gap`（error），對齊 research R3 / FR-014a（依賴 T009）
- [X] T017 [US2] 在 `validateSchedule` 實作 `forward-dependency`（子序列合法性）、`one-concept-violation`、`duplicate-concept`、`dangling-concept` 規則（依賴 T011）

**Checkpoint**: US1 + US2——生成物保證為合法拓樸子序列且每課恰一新觀念

---

## Phase 5: User Story 3 - 共用教材、難度帶分歧、Overlay 疊加不取代（Priority: P1）

**Goal**: 三 Track 引用同一批 Concept（0 複製）；`problemIds` 依 Track 難度帶分歧；Overlay `extraProblemIds` 疊加於 Core 之後（不取代）；Overlay 懸空 fail loud。

**Independent Test**: 三份課表 conceptId 序相同、同 Concept 的 problemIds 依 Track 不同；Overlay 疊加後 Core 過濾題目仍在；未涵蓋 Concept 的 Overlay key → fail loud。

### Tests for User Story 3 ⚠️

- [X] T018 [P] [US3] 建立 `tests/unit/schedule-track.test.ts`：三 Track conceptId 序相同（SC-005）、同 Concept problemIds 依 `problemDifficulties` 分歧、Overlay `extraProblemIds` 附加不取代（Core 仍在）、`overlay-unknown-concept` + `dangling-problem` fail loud、`challengeDifficulty` 僅驗型別/enum（不套用）

### Implementation for User Story 3

- [X] T019 [US3] 在 `src/compiler/schedule-generator.ts` 實作**題目選取**：以 Problem Bank `difficulty` 過濾 Concept `leetcode` 至該 Track `problemDifficulties`（保留宣告序），對齊 research R5 / FR-015a（依賴 T011）
- [X] T020 [US3] 實作 **Overlay 套用 + 驗證**：`extraProblemIds` 附加（去重、穩定序，不取代 Core）、`challengeDifficulty` 僅驗型別/enum（**不套用**；challenge 槽非 concept-bound，語意由 F5 消費，比照 `extraNotesMarkdown`）、`overlay-unknown-concept`（Overlay key 非涵蓋 Concept）與 `dangling-problem`（題號不存在）具名 fail loud，對齊 clarify Q4 / FR-008/009（依賴 T019）
- [X] T021 [US3] 執行 `npm run generate:schedule` 重生成含 `problemIds` 的三份課表並 commit（依賴 T019、T020）

**Checkpoint**: US1–US3——三 Track 共用教材、難度分歧、Overlay 疊加可驗（AC5）

---

## Phase 6: User Story 4 - 週節奏內建 review/rest 與 reviewRange（Priority: P2）

**Goal**: 依 rhythm 模板攤課（相對天數，每 7 一輪，內建 review/rest）；`reviewRange` 正確涵蓋本週（含第一週）；Concept 用盡自然收尾、不填充。

**Independent Test**: 每週含 review+rest；每個 review 的 `reviewRange` 起訖正確（第一週 `[1,3]`）；型別判定不讀日曆星期。

### Tests for User Story 4 ⚠️

- [X] T022 [P] [US4] 建立 `tests/unit/schedule-rhythm.test.ts`：每 7 Session 含 review+rest（SC-003 前提）、`reviewRange = [weekStart, reviewIndex-1]`（含第一週）、相對天數非日曆星期（FR-012）、Concept 用盡自然收尾不填充（FR-019）

### Implementation for User Story 4

- [X] T023 [US4] 在 `src/compiler/schedule-generator.ts` 以 rhythm 模板**取代 US1 的 concept-only emit**：7 槽逐週攤課（concept 槽消耗 topo 佇列；practice/challenge/review/rest 依模板；佇列取空於當週節奏走完自然收尾），對齊 research R4（依賴 T011）
- [X] T024 [US4] 實作 `reviewRange` 計算 + practice/challenge 槽 `problemIds` 選取（practice = 當週已引入 Concept 過濾題目聯集；challenge = 涵蓋 Concept 符合 `challengeDifficulty` 取 id 最小一題），對齊 research R4/R5（依賴 T023、T019）
- [X] T025 [US4] 在 `validateSchedule` 實作 `review-range-invalid` 規則（「rhythm 缺 review/rest」已由 T005 zod `param-invalid` 於**輸入端**把關，不另設輸出級 `rhythm-missing-rest-review`——避免雙重歸類，且末尾 partial week 本就可能不含 review/rest）（依賴 T023）
- [X] T026 [US4] 執行 `npm run generate:schedule` 重生成最終節奏形態課表並 commit（依賴 T023、T024）

**Checkpoint**: US1–US4——課表具完整週節奏與正確 reviewRange

---

## Phase 7: User Story 5 - 內建參照完整性 Gate 與 CI（Priority: P2）

**Goal**: 生成器彙整全部不變式、任一 error 具名 fail loud 且不寫半成品；CI `validate:schedule` 重生成並比對 committed 檔（determinism drift）。

**Independent Test**: 各違規類型（dangling / coverage-gap / overlay-unknown / review-range / forward-dependency / one-concept / param-invalid）皆 fail loud；手改生成物 → `determinism-drift` 非零 exit。

### Tests for User Story 5 ⚠️

- [ ] T027 [P] [US5] 建立 `tests/unit/schedule-gate.test.ts`：逐一驗每種 `ScheduleViolationRule` 具名 fail loud、`generateAllSchedules` 有 error 時 caller 不寫檔（無半成品）、違規清單穩定排序（SC-007）

### Implementation for User Story 5

- [ ] T028 [US5] 在 `src/compiler/schedule-generator.ts` 彙整 `validateSchedule` 全規則集 + 穩定排序，並確保 `generateAllSchedules` 完整回報全部違規、`ok=false` 語意（依賴 T017、T020、T025）
- [ ] T029 [US5] 建立 `scripts/validate-schedule.ts`（CI Gate 入口）：以同一顆生成器重生成於記憶體 → `validateSchedule` 全 Track → 讀 committed `schedules/{track}.json` 與 `serializeSchedule` 輸出**逐位元組比對** → 任一 error 或 `determinism-drift` 非零 exit（唯一 `process.exit`），對齊 research R10（依賴 T028、T026）
- [ ] T030 [US5] 於 [.github/workflows/ci.yml](../../.github/workflows/ci.yml) 在 `validate:problem-bank` 後新增一步 `npm run validate:schedule`（依賴 T029）
- [ ] T031 [P] [US5] 擴充 `tests/unit/zero-llm.test.ts`：加斷言 `src/compiler/schedule-generator.ts` 與 `src/compiler/schedule-schema.ts` 未 import `@google/genai`（憲章 VIII）（依賴 T006）

**Checkpoint**: US1–US5——完整 Gate + CI drift 守門，F4 功能完成

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 跨 Story 收尾與回歸保護

- [ ] T032 [P] 確認 F1 `tests/unit/schedule.test.ts` 仍綠（`src/compiler/schedule.ts` shim 未被本 Feature 更動），執行 `npm test` 全綠
- [ ] T033 [P] 執行 `npm run build`（`tsc`）零錯，確認 strict TS 無 `any` 逃逸
- [ ] T034 依 [quickstart.md](./quickstart.md) 場景 1–6 逐項驗收（含 determinism diff、手改觸發 drift、難度分歧、fail loud）
- [ ] T035 [P] 對照 [checklists/generator.md](./checklists/generator.md) 逐項確認需求已落地（特別 CHK006–017 Determinism 與難度帶/Overlay）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**：無前置，可立即開始
- **Foundational（Phase 2）**：依賴 Setup；**BLOCKS 所有 User Story**
- **User Stories（Phase 3–7）**：皆依賴 Foundational。F4 為單一生成器，**US2–US5 在 US1 的管線上增量增強**（非完全獨立），但各 Story 以自己的測試檔獨立驗證其性質：
  - US1（P1）：Foundational 後即可，交付 MVP（確定性生成）
  - US2（P1）：在 US1 選取/排序上加**驗證與閉包**（T016 依 T009、T017 依 T011）
  - US3（P1）：在 US1 管線上加**題目過濾 + Overlay**（依 T011）
  - US4（P2）：以 rhythm **取代 US1 的 concept-only emit**（依 T011、T019）
  - US5（P2）：**彙整**前述全部驗證 + CI（依 T017/T020/T025、T026）
- **Polish（Phase 8）**：依賴所需 User Story 完成

### Within Each User Story

- 測試先寫、確認 FAIL 再實作
- 生成邏輯 → 驗證規則 → 重生成產物（US3/US4 產物隨新增欄位重生成並 commit）

### Parallel Opportunities

- Setup 無 [P] 並行對象（單一任務）
- Foundational：T003、T004 可並行（stub 資料檔，與 T002/T005/T006 不同檔）
- 各 Story 內 [P] 測試檔可與其他 Story 的測試檔並行撰寫
- T031（zero-llm）僅依 T006，可在 US1 後任意時點並行
- Polish：T032、T033、T035 可並行

---

## Parallel Example: Foundational

```bash
# T003 與 T004 可同時進行（不同檔案）：
Task: "建立 curriculum/track-params.json（stub 值）"
Task: "建立 overlays/{foundation,interview-ready,interview-mastery}.json（stub 值）"
```

## Parallel Example: User Story 3 測試 + 其他 Story 測試

```bash
# 各 Story 的測試檔互不衝突，可並行撰寫：
Task: "tests/unit/schedule-track.test.ts（US3）"
Task: "tests/unit/schedule-rhythm.test.ts（US4）"
Task: "tests/unit/schedule-gate.test.ts（US5）"
```

---

## Implementation Strategy

### MVP First（User Story 1）

1. Phase 1 Setup → Phase 2 Foundational（BLOCKS 全部）
2. Phase 3 US1 → **STOP & VALIDATE**：`npm run generate:schedule` 產出三份確定性課表、重跑無 diff
3. 此即最小可用生成器（MVP）

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. + US1 → 確定性生成（MVP）
3. + US2 → 拓樸子序列保證
4. + US3 → 難度分歧 + Overlay（達成 AC5）
5. + US4 → 完整週節奏 + reviewRange
6. + US5 → 完整 Gate + CI drift 守門
7. 每個 Story 完成即可獨立驗其性質，不破壞前序

### 分段 commit（/speckit-implement）

依 CLAUDE.md：每完成一個 Phase / User Story 的實作＋測試建立一個 commit，掛 scope `feat(004-schedule-generator): …`（產物重跑類用 `chore`），該段 `tasks.md` 勾選併入該段 commit。

---

## Notes

- [P] = 不同檔案、無未完成前置
- F4 產物（`schedules/{track}.json`）於 US1/US3/US4 隨欄位增量**重生成並 commit**——每次都是「改邏輯 → 重跑 → review diff → commit」（憲章 XIII）
- 生成/驗證為**單一實作** `src/compiler/schedule-generator.ts`（FR-017）；`process.exit` 只在 `scripts/generate-schedule.ts` 與 `scripts/validate-schedule.ts`
- **不更動** F1 `src/compiler/schedule.ts` shim 與其 test（F5 才由生成物取代）
