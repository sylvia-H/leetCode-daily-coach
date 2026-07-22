---
description: "Task list for Problem Bank (003-problem-bank)"
---

# Tasks: Problem Bank（題庫 schema／資料、Concept ↔ Problem 逆向對應、slug 一致性）

**Input**: Design documents from `specs/003-problem-bank/`
**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、[data-model.md](./data-model.md)、[contracts/](./contracts/)

**Tests**: 本專案憲章 §22.2「測試優先」與 spec SC-004 要求**每一種違規類型皆有單元測試**，故本 Feature
**包含測試任務**（非可選）。外部呼叫無（純資料層），不需 mock。

**Organization**: 依 User Story 分階段；US1/US2 為 P1、US3/US4 為 P2。R1 遷移（改 F1 walking-skeleton 的
runtime 線）為原子性 green-build 單元，置於 Foundational（Phase 2）。

## Format: `[ID] [P?] [Story] Description`

- **[P]**：可平行（不同檔案、無未完成相依）
- **[Story]**：US1 / US2 / US3 / US4；Setup / Foundational / Polish 無 Story 標籤

## Path Conventions

單一專案（plan.md Structure Decision）：`src/`、`tests/`、`scripts/`、`data/` 於 repo root。

---

## Phase 1: Setup（Shared Infrastructure）

**Purpose**: 建立 F3 型別地基（所有 Story 共用）。

- [X] T001 [P] 在 `src/types/problem.ts` 定義 F3 型別：`Difficulty`、`ReviewPriority`、`ProblemMeta`、`ProblemBankFile`、`ProblemBank`（`byId` / `byPattern`）、`ProblemViolationRule`、`ProblemViolation`（依 [data-model.md](./data-model.md) §1/§2/§4/§5；`ProblemMeta` MUST NOT 含任何內容欄位）

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: R1 遷移的原子單元——把 F1 舊題庫形態換成 spec §12.1 單一形態，並讓 build 與既有測試套件維持綠燈。
**⚠️ CRITICAL**: 完成前任何 User Story 都不能開始；本階段結束時整個測試套件 MUST 全綠。

- [X] T002 [P] 遷移 `data/problem-bank.json` 為 §12.1 題號 key 物件 seed：9 題 {1,26,27,283,303,560,11,125,167}，每題含 `id/slug/title/url/difficulty/patterns`（`patterns` 指向既有 Topic/Concept id），**移除** `conceptProblems` 與 `whyThisPattern`/`hint` 等內容欄位（[contracts/problem-bank-schema.md](./contracts/problem-bank-schema.md) §4；FR-004）
- [X] T003 [P] 遷移 `tests/fixtures/problem-bank.json` 為新 schema（合法 bank），並新增非法 fixtures 目錄 `tests/fixtures/problem-bank/`（missing-field、bad-difficulty、bad-review-priority、key-id-mismatch、patterns-empty、slug-mismatch、too-many、unknown-id、dangling-pattern、bad-json）
- [X] T004 重寫 `src/compiler/problem.ts` 模組骨架：`loadProblemBank(path)` 解析 JSON、忽略底線前綴 key、建 `byId` 與 `byPattern`（題號升冪）索引、檔缺失/非法 JSON 回 `bank-load` violation（不 throw）；**實作 `getProblemsForConcept` 的 happy-path**（`leetcodeIds=[]`→`[]`、全部命中→與宣告**同序**的 `ProblemMeta[]`）以維持 Phase 2 綠燈（F1 demo `[167,125,11]` 需能解析成 `ProblemMeta[]`；守門分支 `>3` / `unknown-leetcode` throw **延到 T011**），並匯出 `getProblemsByPattern` / `makeProblemExists` 之簽章（[contracts/problem-module-api.md](./contracts/problem-module-api.md)；純函式、無 `process.exit`）
- [X] T005 在 `src/compiler/lesson.ts` 置入 F1-local `whyThisPattern`/`hint` 常數表（demo 三題 167/125/11，標註「F1 seed，F5/F7 Overlay 取代」）與 demo `leetcodeIds = [167,125,11]`；`compile()` **先 `loadProblemBank(problemBankPath)` 取得 `bank`** 再呼叫 `getProblemsForConcept(conceptId, leetcodeIds, bank)` 取 `ProblemMeta[]`，配上述常數表組成 `Lesson.problems`（**`loadViolations` 在 runtime 路徑的處置**：F1 demo bank 恆合法，若出現 `error` 級 violation 則 fail loud throw、MUST NOT 靜默；[research.md](./research.md) R1；不改 `articles/two-pointer/002-left-right-pointer.md`）
- [X] T006 重寫 `tests/unit/problem.test.ts` 對齊新模組契約（baseline：load + 基本前/反查），並確認 `tests/unit/lesson.test.ts`、`tests/unit/dry-run.test.ts` 仍綠（僅在 compile 產出形狀改變時才調整期望值）
- [X] T007 [P] 在既有 `tests/unit/zero-llm.test.ts` 補一條斷言，確認 `src/compiler/problem.ts` **落在全樹掃描清單內**（防未來重構把 `src/compiler/` 漏掉），沿用既有全域 `@google/genai` 掃描涵蓋 F3 模組（FR-012）；**不新增第二份全樹掃描檔**（避免與既有測試重複）

**Checkpoint**: `npm run build` 通過、`npm test` 全綠、F1 walking-skeleton 的 compile/render 行為不變。

---

## Phase 3: User Story 1 - 逐題 schema 驗證（Priority: P1）🎯 MVP

**Goal**: `loadProblemBank` 對每一筆題目做 schema 驗證，違規時產生**指名題號與欄位**的 `error` 級 violation。

**Independent Test**: 給合法與各類非法題庫 fixture（缺欄位、型別錯、`difficulty`/`review_priority` 值域、key≠id），驗證器逐一正確接受/拒絕且每個拒絕指名題號與欄位。

- [X] T008 [P] [US1] 在 `src/compiler/problem.ts`（或同檔內）以 `zod` 定義 `ProblemMeta` schema：必填 `id/slug/title/url/difficulty/patterns`、型別、`difficulty` enum、`review_priority` enum、選配欄位型別；以 `.strict()`（或等價）拒絕未知欄位以擋內容欄位混入（FR-004、[data-model.md](./data-model.md) §1）
- [X] T009 [US1] 將 per-entry schema 驗證 + `key == id` 檢查接入 `loadProblemBank`，蒐集 `schema-missing-field`/`schema-type`/`difficulty-range`/`review-priority-range`/`key-id-mismatch`/`patterns-empty` violations（穩定排序；FR-001/002/003、data-model §1）
- [X] T010 [P] [US1] 新增 `tests/unit/problem-bank-validate.test.ts`：每一 US1 違規規則各一案 + `bank-load`（檔缺/壞 JSON）+ 一份全合法 bank 產出零 violation（US1 Acceptance 1–4、SC-004）

**Checkpoint**: US1 可獨立驗收；`npm run build` + `npm test` 綠。

---

## Phase 4: User Story 2 - 前向查得題目 + 題數守門（含空題合法）（Priority: P1）

**Goal**: 由 Concept 的 `leetcode[]` 前向解析為題目 metadata；**有題** Concept 強制 1~3、`leetcode: []` 回空不報錯；違反 fail loud 指名。

**Independent Test**: 給 F2 stub Concept 與 seed 題庫，確認有題 Concept 解析出 1~3 題、空題 Concept 回空；注入「題號不在題庫」「題數 4」皆拋指名成因的錯誤。

- [X] T011 [US2] 在 `src/compiler/problem.ts` 為 `getProblemsForConcept(conceptId, leetcodeIds, bank)` **補上守門分支**（happy-path 空陣列→`[]`、命中→**同序** `ProblemMeta[]` 已於 T004 交付且維持不變）：`>3`→throw `problem-count-range`（指名 conceptId/題數）、id 不在 `bank.byId`→throw `unknown-leetcode`（指名 conceptId/缺漏題號）；並實作 `makeProblemExists(bank)`（[contracts/problem-module-api.md](./contracts/problem-module-api.md)、data-model §3；FR-007/008、§12.1）
- [X] T012 [P] [US2] 新增 `tests/unit/problem-lookup.test.ts`（前向）：正常 1~3 同序；`leetcode:[]`→`[]` 不 throw；`>3` 與 `unknown-leetcode` 皆 throw 且訊息指名（US2 Acceptance 1–4、SC-001/004）
- [X] T013 [P] [US2] 新增 `tests/unit/leetcode-existence.test.ts`：把 `makeProblemExists(bank)` 注入 `validateCurriculum(graph, { problemExists })`，驗證 leetcode 存在性由 `skipped` 轉為實際執行、既有 stub Concept 的 `leetcode` 參照全通過（FR-009、SC-005、US2 Acceptance 5）。**與既有 `tests/unit/leetcode-pluggable.test.ts` 分工**：後者以 mock predicate 測介面行為（skipped ↔ `dangling-leetcode`），本檔以**真實 seed bank + 真實 stub Concept** 端到端驗 SC-005，兩者互補、勿合併或互刪

**Checkpoint**: US1 + US2（兩個 P1）皆可獨立驗收——F3 核心價值達成。

---

## Phase 5: User Story 3 - 反查 Pattern + patterns 參照完整（Priority: P2）

**Goal**: 由 Topic/Concept id 反查題目（確定性順序）；題庫每筆 `patterns` 皆指向存在的 Curriculum 節點。

**Independent Test**: 以某 pattern 反查列出全部標記該 pattern 的題目（升冪 id）；注入 `patterns` 指向不存在 id 的題目，確認產生指名的懸空參照 violation。

- [X] T014 [US3] 在 `src/compiler/problem.ts` 實作 `getProblemsByPattern(patternId, bank)`（題號升冪）與 `validateProblemBank(bank, graph)` 的 `dangling-pattern` 檢查（`patterns` 每項 ∈ `graph.topics.keys() ∪ graph.concepts.keys()`）＋難度覆蓋缺口 `warning`（FR-006/010/011、[research.md](./research.md) R5/R6、data-model §1/§4）
- [X] T015 [P] [US3] 在 `tests/unit/problem-lookup.test.ts` 加反查案例（升冪 determinism、無對應回 `[]`）並在 `tests/unit/problem-bank-validate.test.ts` 加 `dangling-pattern` 案例（US3 Acceptance 1–2、SC-002/004/007）

**Checkpoint**: US1–US3 皆可獨立驗收。

---

## Phase 6: User Story 4 - url 與 slug 一致（Priority: P2）

**Goal**: 題庫每筆 `url` 內 slug 與 `slug` 欄位一致，避免死鏈。

**Independent Test**: 一致者通過；注入 `url` 與 `slug` 不符（或非 LeetCode 網域）的題目，確認產生指名的 slug 不一致 violation。

- [X] T016 [US4] 在 `loadProblemBank` 的 per-entry 驗證加入 `slug-url-mismatch`：以 `^https?://leetcode\.com/problems/([^/]+)/?$` 擷取 slug 與 `slug` 欄位比對，無法擷取或不相等→指名 `error`（FR-005、data-model §1、[contracts/problem-bank-schema.md](./contracts/problem-bank-schema.md) §3）
- [X] T017 [P] [US4] 在 `tests/unit/problem-bank-validate.test.ts` 加 slug 案例：一致者通過；mismatch 與非 LeetCode url 皆產生指名 `slug-url-mismatch`（US4 Acceptance 1–2、SC-003/004）

**Checkpoint**: US1–US4 全部可獨立驗收。

---

## Phase 7: Polish & Cross-Cutting Concerns（CI Gate 入口，FR-015）

**Purpose**: 交付 CI 可呼叫的驗證入口並併入既有工程 Gate。

- [ ] T018 新增 `scripts/validate-problem-bank.ts`（比照 `scripts/validate-curriculum.ts`）：`loadCurriculum` 取圖 + `loadProblemBank` 載庫 + `validateProblemBank(bank, graph)` + 走訪 `graph.concepts` 跑前向守門 + `validateCurriculum(graph, { problemExists: makeProblemExists(bank) })` → 人可讀輸出 → 有 `error` 則 `process.exit(1)`（`process.exit` 只在此入口；FR-013/015、[contracts/problem-module-api.md](./contracts/problem-module-api.md) CI 節、R7/R8）
- [ ] T019 [P] 在 `package.json` `scripts` 加 `"validate:problem-bank": "tsx scripts/validate-problem-bank.ts"`
- [ ] T020 在 `.github/workflows/ci.yml` 於 `Validate curriculum` 步驟後新增 `- name: Validate problem bank` / `run: npm run validate:problem-bank`
- [ ] T021 依 [quickstart.md](./quickstart.md) 執行驗收：`npm run build`、`npm test`、`npm run validate:problem-bank`（確認 leetcode 存在性不再 `skipped`）、連跑兩次確認輸出一致（SC-005/007）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**：無相依，立即開始。
- **Foundational（Phase 2）**：依賴 Setup；**BLOCKS 所有 User Story**；結束時套件全綠（R1 遷移原子完成）。
- **User Stories（Phase 3–6）**：皆依賴 Foundational。US1→US2 建議循 P1 順序先做；US3/US4（P2）在 Foundational 後即可與其他 Story 平行。
- **Polish（Phase 7）**：依賴 US1–US4 中所需的驗證器與 `makeProblemExists` 完成（T009/T011/T014/T016）。

### User Story Dependencies

- **US1（P1）**：Foundational 後即可；無跨 Story 相依。
- **US2（P1）**：Foundational 後即可；`getProblemsForConcept` 與 `makeProblemExists` 落在此。
- **US3（P2）**：Foundational 後即可；`validateProblemBank`/反查落在此。
- **US4（P2）**：Foundational 後即可；slug 檢查併入 loader。
- 注意：US1/US3/US4 的實作皆編輯同一檔 `src/compiler/problem.ts`（單模組，FR-014），故其**實作任務**彼此為順序關係（非 [P]）；各 Story 的**測試任務**為不同檔，標 [P]。

### Within Each User Story

- 實作（validator/lookup）→ 該 Story 測試；測試檔與實作檔不同，可平行撰寫。
- Story 完成再進下一優先級。

### Parallel Opportunities

- Setup 的 T001 與 Foundational 的資料/fixture 任務 T002、T003、T007 可平行（不同檔）。
- 各 Story 測試任務（T010、T012、T013、T015、T017）與其實作任務不同檔，可平行撰寫。
- Foundational 完成後，US3/US4 可與 US1/US2 由不同人平行推進（實作需協調 `problem.ts` 合併順序）。

---

## Parallel Example: Foundational（Phase 2）

```bash
# 可同時進行（不同檔案）：
Task: "T002 遷移 data/problem-bank.json 為新 seed"
Task: "T003 遷移 tests/fixtures/problem-bank.json + 新增非法 fixtures"
Task: "T007 在既有 tests/unit/zero-llm.test.ts 補 problem.ts 涵蓋斷言"
# T004（重寫 problem.ts）→ T005（改 lesson.ts）→ T006（改 problem.test.ts）為順序（相依 problem.ts 契約）
```

---

## Implementation Strategy

### MVP First

1. Phase 1 Setup → Phase 2 Foundational（**關鍵**：R1 遷移完成、套件全綠）。
2. Phase 3 US1（逐題 schema 驗證）→ **STOP & VALIDATE**：這是題庫事實可信度的地基（MVP）。
3. Phase 4 US2（前向查找 + 題數守門 + FR-009）→ 兩個 P1 齊備即達 F3 核心價值（§24 AC1 剩餘 + §22.5 F3 前向驗收）。

### Incremental Delivery

1. Setup + Foundational → 單一題庫形態就緒、F1 綠燈。
2. + US1 → 題庫可信度 Gate（MVP）。
3. + US2 → Concept→Problem 前向 + 題數守門 + F2 存在性落地。
4. + US3 → Problem→Pattern 反查 + 參照完整。
5. + US4 → slug 死鏈 Gate。
6. + Polish → CI Gate 入口併入 `ci.yml`。

### 依 CLAUDE.md 分段 commit

每完成一個 Phase 或 User Story（實作＋測試）即建立一個 commit，掛 `feat(003-problem-bank): …`（type 依該段主要性質：
資料/schema/查找能力為 `feat`；純鷹架/重跑為 `chore`；CI 為 `ci`；建置設定為 `build`），並把該段的 `tasks.md`
勾選併入同一 commit。

---

## Notes

- [P] = 不同檔、無相依；同編輯 `src/compiler/problem.ts` 的實作任務彼此非 [P]。
- Foundational 是 R1 遷移的原子單元——不可只做一半就進 Story（會讓 build 紅燈）。
- 題庫為人工維護參照資料，F3 **不建生成器**（Out of Scope）。
- 每一種違規類型皆 MUST 有單元測試（SC-004）；查找 determinism（升冪）MUST 有測試（SC-007）。
