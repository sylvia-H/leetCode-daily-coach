---
description: "Task list for 002-curriculum-schema"
---

# Tasks: Curriculum Schema（Curriculum 骨架、Concept frontmatter schema、DAG 建置與驗證）

**Input**: Design documents from `/specs/002-curriculum-schema/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: **必要**（非選配）。憲章 v1.0.1「開發工作流程與品質把關 › 測試優先」與 `docs/spec.md` §22.2
明列本 Feature 適用的關鍵邏輯 MUST 有單元測試：**DAG 驗證（拓樸排序 / 無環 / 無前向依賴 / 參照完整）**、
**Concept frontmatter schema**。故每個 User Story 皆採「先測試、後實作」。

**Organization**: 依 User Story 分組。US1（schema）為可獨立交付的最小切片；US2 補上 DAG 完整性驗證即達
本 Feature 里程碑（§24 AC1）；US3 加顆粒度 Gate；US4 交付真實骨架與 stub 並端到端驗證。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無未完成相依）
- **[Story]**: 對應 spec.md 的 User Story（US1–US4）；Setup / Foundational / Polish 無 Story 標籤
- 每個任務皆含確切檔案路徑

## Path Conventions

單一專案，repo root 下的 `curriculum/`、`concepts/`、`src/`、`scripts/`、`tests/`
（結構見 [plan.md](./plan.md) § Project Structure）。**環境**：Windows / PowerShell、npm、Node.js 24。
`src/types/`、`src/compiler/`、`tests/unit/`、`tests/fixtures/` 已由 F1 建立。

---

## Phase 1: Setup（相依與目錄）

**Purpose**: 加入 F2 的相依與 §17 新目錄。產物為永久資產（`zod` schema、`curriculum/`、`concepts/`、`scripts/`）。

- [X] T001 修改 `package.json`：dependencies 新增 `zod`（^3.23）；devDependencies 新增 `tsx`；scripts 新增 `"validate:curriculum": "tsx scripts/validate-curriculum.ts"`。**MUST NOT** 加入 `@google/genai`（憲章 VIII）。接著執行 `npm install` 更新 `package-lock.json` 並**一併 commit**（CI 以 `npm ci` 安裝，缺 lockfile 會直接失敗）
- [X] T002 [P] 建立新目錄骨架：`curriculum/`、`concepts/programming-mindset/`、`concepts/array/`（資料夾名 == topic id；主 Topic 沿用 Module id，clarify 2026-07-21）、`scripts/`，以及 `tests/fixtures/curriculum/` 下的 `valid/`、`cycle/`、`forward-dep/`、`dangling-ref/`、`orphan/`、`dup-id/`、`bad-frontmatter/`、`edge-inconsistency/`、`duplicate-edge/`、`empty/`、`granularity/`、`skeleton-shape/`

---

## Phase 2: Foundational（阻斷性前置）

**Purpose**: 所有 User Story 共用的型別入口。

**⚠️ CRITICAL**: 本階段完成前，任何 User Story 都無法開始。

- [X] T003 建立 `src/types/curriculum.ts`：定義 `ModuleSkeleton` / `TopicSkeleton` / `ModuleNode` / `TopicNode` / `ConceptNode`（**欄位對齊 `docs/spec.md` §16.1**，含 `localOrder` / `skeletonPath` / `articlePath`）/ `CurriculumGraph` / `ValidationResult` / `Violation` / `ViolationRule`（union 枚舉，**MUST 涵蓋 [data-model.md](./data-model.md) §4 全部 15 類，含 `skeleton-shape`**，FR-001c）/ `ValidateOptions` / `SkippedCheck`。**此檔 MUST 為純型別、不含 runtime import**（供 schema / curriculum / 未來 F5 Compiler 共用型別入口）

---

## Phase 3: User Story 1 - Concept metadata 可確定性驗證 (Priority: P1) 🎯 MVP

**Goal**: 任一 Concept frontmatter 與 `modules.json` 的 metadata 可被 schema 確定性驗證：合規接受，
不合規則指名違規的 Concept / 欄位 / 規則（fail loud），MUST NOT 靜默帶過。

**Independent Test**: 給合法 + 各類非法 frontmatter fixture，`schema.test.ts` 確認逐一正確接受 / 拒絕，
每個拒絕皆指名違規欄位（對應 SC-003）。

- [X] T004 [P] [US1] 建立 schema 測試素材於 `tests/fixtures/curriculum/bad-frontmatter/`：合法基準一份 + 逐類缺陷（缺 `pattern_label`、`difficulty: hard`、`estimated_minutes` 非正整數、`id` 非 kebab-case、`leetcode` 含非正整數）
- [X] T005 [US1] 撰寫 `tests/unit/schema.test.ts`：`conceptFrontmatterSchema` 接受合法、對每類非法回傳具名 `Violation`（`schema-missing-field` / `schema-type` / `schema-id-format` / `leetcode-format`，SC-003）；`modulesSchema` 逐條驗 **M1–M7**（[contracts/modules-schema.md](./contracts/modules-schema.md)）——M1 `version` 整數（`schema-type`）、M3 `id` kebab（`schema-id-format`）、M4 `topic.id` 跨 Module 全域唯一（`duplicate-id`）、**M2 `modules` 長度非 16**、**M5 `level` ≠ 陣列索引**、**M6 某 module 無 topic**、**M7 `title` 為空**——**M2 / M5 / M6 / M7 四項 MUST 回傳 `skeleton-shape` 而非 `granularity-range`**（FR-001c，兩者語意分離）；**並斷言「`module.id` 與其主 `topic.id` 同名（如 module `array` + topic `array`）MUST NOT 觸發 `duplicate-id`」**（FR-002 識別空間分離）
- [X] T006 [US1] 實作 `src/compiler/schema.ts`：匯出 `KEBAB_SLUG` 常數；以 `zod` 定義 `conceptFrontmatterSchema`（§10.1 全欄位、型別 / 值域）與 `modulesSchema`；`parseConceptFrontmatter(raw, path)` / `parseModules(raw)` 以 `safeParse` 收集**全部** issue → 映射為具名 `Violation`（FR-004/005/006/007/008；`leetcode` 僅驗正整數格式，FR-023）。**骨架結構類 issue（M2 / M5 / M6 / M7）MUST 映射為 `skeleton-shape`**（`error`、不受 `mode` 影響，FR-001c）。**此檔 MUST NOT 做任何參照完整性檢查**（不比對骨架、不比對資料夾名——全歸 `validateCurriculum`，FR-013 定案 2026-07-22）。契約見 [contracts/concept-frontmatter-schema.md](./contracts/concept-frontmatter-schema.md)

**Checkpoint**: US1 可獨立驗收——`npm test` 中 `schema.test.ts` 全綠，Concept / modules metadata 的 schema 契約成立。

---

## Phase 4: User Story 2 - 整份 Curriculum 建成合法 DAG (Priority: P1) ⭐ 里程碑 AC1

**Goal**: 讀 `modules.json` + 全部 Concept → 建 in-memory DAG → 驗證可拓樸排序、無環、無前向依賴、
`prerequisite`/`next`/`module`/`topic` 參照完整、除起點外無孤兒；任一項不成立明確報錯。

**Independent Test**: 合法 stub 課程通過並輸出確定拓樸序；分別注入環 / 前向依賴 / 懸空參照 / 孤兒 / 自我依賴 /
重複邊 → 各自具名報錯（對應 SC-001 / SC-002）。

**Dependency**: 依賴 US1（`schema.ts` 的 parse）與 Foundational（型別）。

- [X] T007 [P] [US2] 建立 DAG 測試素材：`tests/fixtures/curriculum/valid/`（最小合法 `modules.json` + concepts）、`cycle/`、`forward-dep/`、`dangling-ref/`（prerequisite / next / module / topic **及 `topic` 與所在資料夾名不符**各一，FR-013）、`orphan/`（含**邊界案例**：Level 0 某 Topic 的第 2 個 Concept 無前人 → MUST 報 `orphan`；該 Topic 的首個 Concept → MUST 免除）、`dup-id/`（Concept id / `module.id` / `topic.id` 三種主體各一）、`edge-inconsistency/`、`duplicate-edge/`、`empty/`（**兩種情境**：目錄存在但 0 個 Concept、以及 `concepts/` 目錄不存在，U2 定案 2026-07-22）、`skeleton-shape/`（`modules` 長度非 16、`level` ≠ 索引、module 無 topic、`title` 為空 各一）
- [X] T008 [P] [US2] 撰寫 `tests/unit/curriculum-load.test.ts`：`loadCurriculum` 讀 `modules.json` + `concepts/**` → 產出節點圖與 **schema 類 `loadViolations`**；斷言確定性排序（先排序再處理，R5）、檔名 `NNN` 正確擷取為 `localOrder`、`skeletonPath` 與所在資料夾名正確記入節點（供後續第 3 步比對）；`concepts/` 目錄不存在與目錄為空皆導向 `empty-curriculum`、`message` 可區分兩者（U2）。
      **⚠️ 職責邊界斷言（FR-013 定案 2026-07-22）**：MUST 斷言 `loadCurriculum` **不產生任何 `dangling-ref`**——即使餵入 `module`/`topic` 懸空或 `topic` 與資料夾名不符的 fixture，參照類違規也只能由 `validateCurriculum` 產出（防止雙軌，SC-007）
- [X] T009 [P] [US2] 撰寫 `tests/unit/dag-validate.test.ts`：`dangling-ref`（**四種來源**：`prerequisite` / `next` / `module`·`topic` 不存在或 topic 不屬該 module / **`topic` ≠ 所在資料夾名**——全部 MUST 由 `validateCurriculum` 產出，FR-013）、`cycle`、`self-dependency`、`forward-dependency`（宣告序全序，R7）、`edge-inconsistency`（雙向不一致，error，FR-017）、`duplicate-edge`（去重為 warning、**`ok` 仍為 true**，FR-018）、`empty-curriculum`（空 Concept 集合；**`stub` / `full` 兩模式皆 error**，FR-010a）各自具名報錯；合法課程 0 error（SC-001 / SC-002）。
      **`orphan` 需三組斷言**（FR-016 合法起點定義）：(a) Level 0 各 Topic 的**首個** Concept（`NNN` 最小）無 prerequisite → **免除**；(b) Level 0 同一 Topic 的**第 2 個**以後 Concept 無前人且不被 next 提及 → `orphan`；(c) Level 1+ 的任一無連結 Concept → `orphan`
- [X] T010 [P] [US2] 撰寫 `tests/unit/topo-order.test.ts`：合法圖可線性化、輸出 canonical `topoOrder`（Kahn + `ordinal` tie-break）；同一輸入重複驗證 100 次，`violations` 排序與 `topoOrder` 逐次逐字元一致（SC-005 / FR-025）
- [X] T011 [US2] 實作 `src/compiler/curriculum.ts` 的 `loadCurriculum()` + 建圖：以 `fs` + `gray-matter` 讀檔、呼叫 `parseConceptFrontmatter`、以 `Map` 建節點並偵測 `duplicate-id`；擷取檔名 `NNN` 為 `localOrder`、記錄 `skeletonPath` 與所在資料夾名；建 `ordinalOf` 全序（moduleIndex → topicIndex → NNN → id，R7）；所有走訪先依全序排序（R5）。
      **⚠️ 職責邊界（FR-013 定案 2026-07-22）**：本函式 **MUST NOT** 實作任何參照完整性檢查——不比對 `module`/`topic` 是否存在於骨架、不比對 `topic` 與資料夾名。它只回傳 `{ graph, loadViolations }`，其中 `loadViolations` **僅含 schema 類**。全部 `dangling-ref` 由 T012 的 `validateCurriculum` 第 3 步單一負責（避免雙軌，SC-007）。契約見 [contracts/curriculum-validation-contract.md](./contracts/curriculum-validation-contract.md)
- [X] T012 [US2] 實作 `src/compiler/curriculum.ts` 的 `validateCurriculum(graph, options?)` 圖層規則，**依 [contracts/curriculum-validation-contract.md](./contracts/curriculum-validation-contract.md) 的固定順序**：空課程守衛（`empty-curriculum`，error，兩模式皆強制，命中即回傳；**目錄不存在與目錄為空同類別、訊息可區分**，FR-010a / U2）→ **參照完整（第 3 步：`module`/`topic` 存在且 topic 隸屬該 module、`topic` == 所在資料夾名、`prerequisite`/`next` 存在 → `dangling-ref`；此為參照檢查的唯一實作處，FR-013）** → `duplicate-edge` 正規化 → 雙向一致（FR-017）→ 無環 / 自我依賴（Kahn + DFS 回溯構環節點）→ 無前向依賴（`ordinal` 比較）→ 無孤兒（**合法起點 = `ordinal.moduleIndex === 0` 且為該 Topic 內 `NNN` 最小者**，與前向依賴共用同一份 `ordinal`，FR-016）→ 產出 canonical `topoOrder`；`violations` 收集式回報並以 `(rule, subject, field)` 穩定排序（FR-010～016、FR-025）。**此函式無 `process.exit` / 無副作用**（供 runtime / Gate 安全 import，FR-024）

**Checkpoint**: US1 + US2 完成即達 **§24 AC1**——DAG 驗證（無環 / 無前向依賴 / 參照完整）對合法 stub 課程通過、對缺陷具名報錯。

---

## Phase 5: User Story 3 - 顆粒度與唯一性結構 Gate（供 F7 重用）(Priority: P2)

**Goal**: 機器化檢查顆粒度（Topic / Module Concept 數、總數）與 `id` 全域唯一性，並以 `mode`（stub | full）
區分強制層級、以可插拔 `problemExists` 處理 `leetcode` 存在性；全部為 `validateCurriculum` 的同一顆實作
（供 F7 Stage 1 Gate 重用）。

**Independent Test**: 違反顆粒度的 fixture 各自具名報錯；顆粒度規則可在無完整 150+ Concept 課程下以 fixture
獨立驗證每條（SC-004）；無 Problem Bank 時 `leetcode` 存在性列 `skipped`、格式仍驗（SC-006）。

**Dependency**: 依賴 US2（`validateCurriculum` 骨架）。

- [X] T013 [P] [US3] 建立顆粒度測試素材於 `tests/fixtures/curriculum/granularity/`：Topic Concept 數超上限（13）、Module Concept 數超上限（31）、`topic.id` 跨 Module 重複，以及**閉區間邊界素材**——Topic 恰 5 / 恰 12、Module 恰 10 / 恰 30
- [X] T014 [P] [US3] 撰寫 `tests/unit/granularity-gate.test.ts`：上限（Topic ≤12 / Module ≤30）與唯一性**兩模式皆強制**；下限（總數 ≥150 / Module ≥10 / Topic ≥5）**僅 `full` 強制**；`stub` 模式下空 Module / Topic 不觸發下限錯誤（FR-019/020/021、SC-004）。
      **並補閉區間邊界斷言**（FR-019）：Topic 恰 5、恰 12、Module 恰 10、恰 30 → **通過（0 個 `granularity-range`）**；Topic 4 / 13、Module 9 / 31 → 報錯。下限邊界於 `full` 模式驗、上限邊界兩模式皆驗
- [X] T015 [P] [US3] 撰寫 `tests/unit/leetcode-pluggable.test.ts`：未提供 `problemExists` → `leetcode` 存在性列 `skipped`（deferred-to-F3）、`ok` 不受影響、格式仍驗；提供 `problemExists` 且題號缺失 → `dangling-leetcode` 報錯（FR-023、SC-006）
- [X] T016 [US3] 擴充 `src/compiler/curriculum.ts` 的 `validateCurriculum`：新增顆粒度 Gate（依 `options.mode` 套上/下限與唯一性，**比較一律用閉區間** `n < min` / `n > max`，R8 / FR-019）與可插拔 `leetcode` 存在性（有 `problemExists` → 檢查，缺失記 `dangling-leetcode`（error）；無 → 記入 `ValidationResult.skipped`）；更新 `ValidateOptions`（`mode` 預設 `'stub'`）。契約見 [contracts/curriculum-validation-contract.md](./contracts/curriculum-validation-contract.md)

**Checkpoint**: 結構 Gate 完備且為單一實作，F7 Stage 1 只需傳 `{ mode:'full', problemExists }` 重用（FR-022）。

---

## Phase 6: User Story 4 - 骨架定稿 + stub 端到端驗證 (Priority: P3)

**Goal**: 交付完整 16-Level 的 `curriculum/modules.json` 骨架與 Level 0 + Level 1 的 stub Concept，
並以驗證入口對真實資料端到端跑通（綠燈）。

**Independent Test**: 對交付的 stub 課程執行完整驗證流程 → 全部通過、輸出確定拓樸序；重複執行結果一致
（對應 SC-001 / US4）。

**Dependency**: 依賴 US1 + US2 + US3 的驗證實作。

- [ ] T017 [US4] 撰寫 `curriculum/modules.json`：完整 16 個 Module（Level 0 Programming Mindset ～ Level 15 Dynamic Programming）與各 Module 的 Topic；`level` == 陣列索引、`id` kebab-case、`topic.id` 跨 Module 全域唯一（clarify Q1 / Q2；[contracts/modules-schema.md](./contracts/modules-schema.md)）。**Topic 命名依慣例**：每個 Module 的第一個（主）Topic id 沿用該 Module 的 id，需細分時才增列其他 Topic（clarify 2026-07-21；modules-schema § 命名慣例）。Module 順序凍結。
      **並記載凍結紀律（FR-001b）**：於 `curriculum/README.md`（或 `modules.json` 旁的註記檔）明載「Module 身分與順序嚴格凍結、MUST NOT 於後續 Feature 重排或增刪；Topic 清單為 F2 骨架，F7 若需在不改 Module 順序前提下調整，MUST 走『改 `modules.json` → 重跑驗證 → review diff → commit』」，使該紀律可被後續 Feature 追溯（JSON 不支援註解，故另立說明檔）
- [ ] T018 [US4] 撰寫 `concepts/programming-mindset/` 的 Level 0 stub Concept：`001-time-space-complexity.md`（**該 Topic 的合法起點**——`NNN` 最小、無 `prerequisite`，免除孤兒判定）、`002-reading-the-problem.md`（**非起點，MUST 宣告 `prerequisite: [time-space-complexity]`，且 001 的 `next` MUST 含之**——否則依 FR-016 會被判 `orphan`）——frontmatter 依 §10.1 + Author Hints 提示段；每檔頂端**MUST 加註「F2 stub seed，F7 內容產線上線後由生成物取代」**（FR-027）。
      **⚠️ 跨 Module 回指邊（U1 定案 2026-07-22）**：`002-reading-the-problem.md` 的 **`next` MUST 含 `array-traversal`**（T019 的 `concepts/array/001` 會宣告 `prerequisite: [reading-the-problem]`）。此邊跨越 T018 / T019 兩個檔案，兩端 MUST 同時宣告才滿足 FR-017 雙向一致——**故 T018 與 T019 不再標記 [P]，MUST 由同一人接續完成**，否則必觸發 `edge-inconsistency`（error）
- [ ] T019 [US4] 撰寫 `concepts/array/` 的 Level 1 stub Concept：`001-array-traversal.md`、`002-in-place-operations.md`、`003-prefix-sum.md`——**全部三檔皆非起點**（Level 1），`prerequisite` 需串成鏈（**001 MUST 宣告 `prerequisite: [reading-the-problem]`**，對造端的 `next` 由 T018 補上；002/003 指向前一個），`next` 與對造端**雙向一致**（避免 `edge-inconsistency` 與 `orphan`）；同樣加註 seed 臨時性（FR-027）。**接續 T018 完成**（共用跨 Module 回指邊，見 T018）
- [ ] T020 [US4] 實作 `scripts/validate-curriculum.ts`：讀 `curriculum/modules.json` + `concepts/**` → `loadCurriculum` → `validateCurriculum(graph, { mode:'stub' })` → 人可讀印出每筆 violation 與 `skipped` + summary → 有 error 則 `process.exit(1)` 否則 `exit(0)`（FR-028；[contracts/curriculum-validation-contract.md](./contracts/curriculum-validation-contract.md) § 執行入口）
- [ ] T021 [US4] 撰寫 `tests/unit/stub-curriculum.test.ts`：對交付的真實 `curriculum/modules.json` + `concepts/**` 執行 `loadCurriculum` + `validateCurriculum(stub)` → `ok === true`、0 個 error violation、`topoOrder` 確定；斷言每個 stub 檔含 seed 臨時性註記（US4 AC1 / AC3）

**Checkpoint**: `npm run validate:curriculum` 對真實 stub 課程 exit 0；整條「骨架 → schema → DAG → 顆粒度」鏈路綠燈。

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: 整體驗收、交棒紀律確認，並建立 CI 工程 Gate（FR-028a）。

- [ ] T022 執行 `npm run build`、`npm test`、`npm run validate:curriculum`，確認：`tsc` 無誤、全部單元測試綠、驗證入口 exit 0（[quickstart.md](./quickstart.md) 主要驗收路徑）
- [ ] T023 [P] 撰寫 `tests/unit/zero-llm-curriculum.test.ts`（或擴充既有守衛）：斷言 `src/compiler/schema.ts` 與 `src/compiler/curriculum.ts` 的相依集合**不含** `@google/genai`（憲章 VIII）；並確認 `validateCurriculum` 被 import 時無副作用（不觸發 `process.exit` / I/O）
- [ ] T024 [P] 確認交棒紀律：F1 未被本 Feature 改動執行路徑（僅 clarify 回寫的註解）；`concepts/**` 每檔 seed 註記齊備；`curriculum/modules.json` 為手寫骨架（非生成物）。更新本檔勾選與 [checklists/](./checklists/)（如適用）
- [ ] T025 [P] **查核 SC-007（單一實作、無平行驗證）**：確認 DAG / 顆粒度 / schema 規則在 `src/**` 與 `scripts/**` 中**僅一處實作**——`scripts/validate-curriculum.ts` MUST 只 `import` 並呼叫 `loadCurriculum` / `validateCurriculum`，MUST NOT 自行重寫任何檢查邏輯；測試檔亦 MUST NOT 重新實作規則（只呼叫與斷言）。以程式碼審視 + `grep` 確認無第二份拓樸排序 / 顆粒度門檻常數。**並確認參照完整性只實作於 `validateCurriculum`**（`loadCurriculum` 內無任何 `dangling-ref` 產出，FR-013）
- [ ] T026 **建立 `.github/workflows/ci.yml`（FR-028a / SC-008）**：`on: [push, pull_request]`；`ubuntu-latest` + `actions/setup-node@v4`（`node-version: 24`、`cache: npm`）→ `npm ci` → `npm run build` → `npm test` → `npm run validate:curriculum`；任一步失敗即 CI 失敗。**MUST NOT 加入任何 secrets**（本 workflow 不需 Discord / Gemini 憑證，憲章 VIII / XIV）；**MUST NOT 改動既有 `daily.yml`**。驗收：刻意讓一個測試失敗 → CI 紅燈；還原 → 綠燈。已回寫 `docs/spec.md` §17 目錄結構與 §21.3（兩道 Gate 職責分離）

---

## Dependencies & Execution Order

- **Setup（T001–T002）** → **Foundational（T003）** → 之後才可進入任何 User Story。
- **US1（T004–T006）**：依賴 Foundational。**可獨立交付（MVP）**。
- **US2（T007–T012）**：依賴 US1（parse）。完成後即達 **AC1**。`curriculum.ts` 由 T011 → T012 循序（同檔）。
- **US3（T013–T016）**：依賴 US2。T016 續改 `curriculum.ts`（同檔，接於 T012 之後）。
- **US4（T017–T021）**：依賴 US1 + US2 + US3 的驗證實作。
- **Polish（T022–T026）**：全部完成後。T026（`ci.yml`）MUST 在 T022 本機三項驗收全綠之後才建立，
  避免一開 CI 就紅燈。

**同檔序列限制**：`src/compiler/curriculum.ts` 由 T011 → T012 → T016 依序修改（不可平行）。

**跨檔耦合限制（U1 定案 2026-07-22）**：T018 與 T019 共用一條跨 Module 的雙向依賴邊
（`reading-the-problem` ⇄ `array-traversal`），**MUST 循序完成、不可平行**，否則必觸發 `edge-inconsistency`。

## Parallel Opportunities

- **Setup**：T002 與 T001 完成後可獨立（T002 為純建目錄，[P]）。
- **US1 測試素材與測試**：T004（fixtures）[P]。
- **US2 測試群**：T007（fixtures）、T008 / T009 / T010（不同測試檔）皆 [P]，可先寫齊再實作 T011 / T012。
- **US3 測試群**：T013 / T014 / T015 [P]。
- **US4 內容**：T017（modules.json）先於 T021 e2e；**T018 → T019 循序**（共用跨 Module 雙向邊，不可平行）。
- **Polish**：T023 / T024 / T025 [P]；T026（`ci.yml`）接於 T022 之後。

## Independent Test Criteria（每個 Story）

- **US1**：`schema.test.ts` 對合法 / 各類非法 frontmatter 與 `modules.json` 逐一正確判定並具名報錯；骨架結構錯誤回 `skeleton-shape`（非 `granularity-range`）。
- **US2**：合法 stub 課程 DAG 驗證 0 error 並輸出確定拓樸序；環 / 前向依賴 / 懸空參照（含 `topic` ≠ 資料夾名）/ 孤兒 / 自我依賴 / 重複邊各自具名報錯（AC1）；`loadCurriculum` 不產出任何 `dangling-ref`。
- **US3**：顆粒度上限 / 唯一性兩模式強制、下限僅 full；`leetcode` 存在性無題庫時列 `skipped`、格式仍驗。
- **US4**：真實 stub 課程 `npm run validate:curriculum` exit 0、`stub-curriculum.test.ts` 綠、seed 註記齊備。

## Implementation Strategy

- **MVP = US1（T001–T006）**：交付 Concept / modules metadata 的 schema 契約，即為可獨立驗收的最小切片。
- **里程碑 = US1 + US2**：達 `docs/spec.md` §24 **AC1**（DAG 驗證通過），本 Feature 的核心交付。
- **完整 F2 = + US3 + US4 + Polish**：顆粒度 Gate（供 F7 重用）、真實骨架 / stub 端到端綠燈，
  並以 `ci.yml` 把「build + test + 課程驗證」納入 push / PR 自動把關（T026）。
- 全程零 LLM、不改每日 runtime；`validateCurriculum` 為單一實作，F3 / F5 / F7 直接重用（FR-022 / FR-024）。
