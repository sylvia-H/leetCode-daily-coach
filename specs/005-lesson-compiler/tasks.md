---
description: "Task list for 005-lesson-compiler"
---

# Tasks: Lesson Compiler、全 Session 類型 Renderer 與內容 CI Gate

**Input**: Design documents from `specs/005-lesson-compiler/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、
[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**Tests**: **必要**——憲章「測試優先（spec §22.2）」點名本 Feature 的多項邏輯（Full Article 固定區塊解析、
Lesson Compiler determinism、Overlay 疊加不取代、Renderer 純函式性與 Discord 限制含 6,000 總長、教材品質
Gate）MUST 有單元測試。故測試任務為 MUST，非選配。

**Organization**: 依 User Story 分組，每組可獨立實作與驗證。

## Format: `[ID] [P?] [Story] Description`

- **[P]**：可平行（不同檔案、無未完成相依）
- **[Story]**：US1–US5，對應 spec.md 的 User Story
- 路徑慣例：單一專案，`src/` / `scripts/` / `tests/` / `articles/` 位於 repo 根目錄

---

## Phase 1: Setup（共用基礎）

**Purpose**: 讓後續任務有可執行的入口與測試落點；本 Feature **無新增相依**（plan.md Technical Context）。

- [X] T001 在 `package.json` 的 `scripts` 新增 `"validate:content": "tsx scripts/validate.ts"`（FR-026；本機與 CI 同一條指令）
- [X] T002 [P] 建立測試素材目錄 `tests/fixtures/articles/`（放置各類錯誤形態的 Article fixture，內容於各 Story 階段補入）

---

## Phase 2: Foundational（阻擋所有 Story 的前置）

**Purpose**: 型別、解析器、載入器與既有模組的型別適配。**這批不完成，任何 Story 都無法開始，且 `tsc` 會紅。**

**⚠️ CRITICAL**: T003 改動 `Lesson` 型別後，`src/renderer/**` 與 `src/main.ts` 會立即型別不符——
T010／T011 MUST 於同一批完成，維持 build 綠燈。

- [X] T003 更新 `src/types/lesson.ts`：`Lesson` 支援五種 Session 類型（`concept?` / `path?` 轉選配、`color` 上移至頂層、新增 `reviewConcepts?` / `overlayNotes?` / `reflectionQuestion?` / `encouragement?`、`Problem.whyThisPattern` 轉選配），並新增 `ReviewConcept` / `BudgetSlots` / `RenderedMessage`（data-model.md §2、§5）
- [X] T004 擴充 `src/compiler/content.ts` 的固定區塊解析：`docs/spec.md` §10 全部固定區塊皆必備且非空（閱讀用 8 區塊 + 推播用 4 區塊 + `Today's Challenge`），缺漏拋出指名區塊名稱與 articlePath 的錯誤；未列於契約的 `##` 區塊允許存在但忽略（contracts/article-format.md §3）
- [X] T005 於 `src/compiler/content.ts` 新增 `Today's Challenge` 逐題條目解析：以 `marked` lexer token 走訪巢狀 list，取 `**{id}**` → `whyThisPattern`（去除前導 `·` / `-` / `—` 與空白，MUST 非空）與巢狀 `Hint:` / `Hint：` → `hint`；同題號重複即拋錯；輸出 `Map<number, ArticleChallengeEntry>`（contracts/article-format.md §4、data-model.md §1）
- [X] T006 於 `src/compiler/content.ts` 補齊 `MODULE_COLORS`：涵蓋 `curriculum/modules.json` 全部 16 個 Module，並保留單一 fallback 中性色供未知 Module 與非 concept 類 Session 使用（FR-018、SC-010）
- [X] T007 重寫 `src/compiler/schedule.ts`：移除 F1 硬編 `SESSION_PLANS` 與 `getPathLabels`，改為載入 `schedules/{track}.json`（F4 生成物）並提供 `sessionIndex → SessionPlan`；`sessionIndex` 非 1..N 整數即拋出含 track / sessionIndex / 課表長度的錯誤（FR-002、FR-003、FR-029）
- [X] T008 [P] 新增 `src/compiler/overlay.ts`：以 F4 `parseTrackOverlay` 載入 `overlays/{track}.json`，並提供 `conceptId → extraNotesMarkdown` 的查詢；**檔案不存在 ⇒ 空 Overlay 不失敗、存在但不符 schema ⇒ fail loud**（contracts/lesson-contract.md §1 對照表）。**MUST NOT 提供 `extraProblemIds` 的取用點**——選題類欄位已於 F4 生成階段套入課表，Compiler 不消費（research R6、FR-009）
- [X] T009 於 `src/compiler/lesson.ts` 實作 `loadCompilerDeps(paths?)`：載入 DAG（跑 `validateCurriculum`，error 級即拋）、Problem Bank、三份課表、三份 Overlay、選配 F8 素材（**檔案不存在 ⇒ 缺席不失敗；存在但不符 schema ⇒ fail loud**，兩者 MUST NOT 走同一條路徑），並建立每 Track 的 `ProblemOrigin`（`problemId → 首次引入的 conceptId`，依 sessionIndex 遞增先到先得，並列時以 `ordinalOf` 決勝）與 `articleCache`（data-model.md §3、§4、research R2/R3）
- [X] T010 改寫 `src/renderer/discord.ts` 與 `src/renderer/budget.ts` 至新契約：`render(lesson)` 回傳 `RenderedMessage[]`、`budgetSlots` 與 embeds 共用同一份字串實例；`checkBudget(message)` 改由 slot 檢查逐區塊預算（移除 `PROBLEM_BULLET` 反解析與 `embeds[0..2]` 位置假設），結構性上限與總量仍於同一次呼叫檢查。**本任務只搬遷機制，concept 版面輸出行為維持不變**（contracts/renderer-contract.md §1、§4、research R10）。**同批更新既有 `tests/unit/renderer.test.ts` 與 `tests/unit/budget.test.ts` 至新契約**（原斷言依賴 `render → embeds` 與反解析式預算，改契約後必然紅燈；data-model.md §7）
- [X] T011 適配 `src/main.ts`：於 `run()` 起始呼叫 `loadCompilerDeps()` 一次並注入 `compile`；push 路徑改為逐則 `RenderedMessage` 檢查預算後依序 post；DRY_RUN 預覽逐則輸出 embeds 與 BudgetReport（contracts/renderer-contract.md §5）。**同批更新既有 `tests/unit/dry-run.test.ts` 與 `tests/unit/run-tracks.test.ts`**（兩者斷言 F1 的單則 post 流程與 DRY_RUN 輸出形態；data-model.md §7）
- [X] T012 [P] 新增 `tests/helpers/compiler.ts`：建構測試用 `CompilerDeps`（可注入合成 DAG / 課表 / Overlay / `readArticle`），供各 Story 的單元測試共用
- [X] T013 [P] 建立 stub fixture Article `articles/programming-mindset/001-time-space-complexity.md` 與 `articles/programming-mindset/002-reading-the-problem.md`：§10 全部固定區塊、frontmatter（`id` / `title` / `module` / `pattern_label` / `complexity_label` / `estimated_minutes` / `exit_criteria` ≤6 條且每條 ≤60）、真實可讀繁中內容、`Today's Challenge` 涵蓋三份課表用到的題號（spec Assumptions、contracts/article-format.md）
- [X] T014 [P] 建立 stub fixture Article `articles/array/001-array-traversal.md`、`articles/array/002-in-place-operations.md`、`articles/array/003-prefix-sum.md`：規格同 T013。**逐篇比對三份課表**確認條目涵蓋該 Concept 被排入的**全部**題號——`array-traversal` MUST 含 `1 / 26 / 27`（27 為 `foundation` 課表經 F4 Overlay 加題後的既有題號）、`in-place-operations` MUST 含 `27 / 283`、`prefix-sum` MUST 含 `303 / 560`（`303` 用於 foundation/interviewReady、`560` 用於 interviewReady/interviewMastery）

**Checkpoint**: `npm run build` 與既有 `npm test` 綠燈；素材齊備，五個 Story 可開始。

---

## Phase 3: User Story 1 - 由真實素材編譯出任意一堂課 (Priority: P1) 🎯 MVP

**Goal**: `compile(track, sessionIndex, deps)` 對 `concept` 類 Session 由課表 + Article + 題庫 + DAG 組出完整
`Lesson`，不再依賴任何 F1 硬編常數。

**Independent Test**: 對 `foundation` / `sessionIndex = 4` 編譯，`Lesson` 各欄位皆源自真實素材；連續編譯
10 次序列化結果 byte-identical；`sessionIndex` 越界拋出具名錯誤。

### Tests for User Story 1 ⚠️（先寫、先失敗）

- [X] T015 [P] [US1] `tests/unit/article-parse.test.ts`：固定區塊缺漏（`Digest` / `Python Tip` / `Today's Challenge`）、frontmatter 欄位缺漏、`exit_criteria` 非陣列、`id` 與 conceptId 不符、條目缺 `whyThisPattern`、同題號重複——各自拋出指名成因的錯誤（data-model.md §1 驗證規則表）
- [X] T016 [P] [US1] `tests/unit/compile-concept.test.ts`：concept Lesson 各欄位來源正確（教材欄位取自 Article、題號/標題/連結/難度取自 Problem Bank、`color` 取自 Module 色表）；`leetcode: []` 的無題目觀念課編出 `problems: []` 且不報錯
- [X] T017 [P] [US1] `tests/unit/compile-path.test.ts`：以合成多前置／多後繼 DAG 驗證 `prev` 取 `ordinalOf` 最大者、`next` 取最小者；無前置／無後繼時對應欄位省略（research R4）
- [X] T018 [P] [US1] `tests/unit/compile-determinism.test.ts`：同一 `(track, sessionIndex)` 連續 compile 10 次，`JSON.stringify` 全等（SC-003）
- [X] T019 [P] [US1] `tests/unit/compile-errors.test.ts`：`sessionIndex` 為 0 / 負數 / 非整數 / 超出 N、`conceptId` 不在 DAG、Article 檔案缺漏、課表題號在條目中缺漏——各自拋出含 track / sessionIndex / 主體的錯誤（contracts/lesson-contract.md §4）

### Implementation for User Story 1

- [X] T020 [US1] 於 `src/compiler/lesson.ts` 重寫 `compile(track, sessionIndex, deps)` 主流程：取 `SessionPlan` → 依 `type` 分派（本階段只實作 `concept`，其餘暫拋「尚未支援」）→ 組 `Lesson`（FR-001、FR-002、FR-010 的 concept 部分）
- [X] T021 [US1] 於 `src/compiler/lesson.ts` 實作 concept 教材組裝：依 `ConceptNode.articlePath` 經 `deps.readArticle` + `articleCache` 解析，`id` 與 `conceptId` 不符即 fail loud；`patternLabel` / `complexityLabel` 原樣帶入不改寫（FR-004、FR-005）
- [X] T022 [US1] 於 `src/compiler/lesson.ts` 實作題目組裝：題號 / 標題 / 連結 / 難度自 Problem Bank 帶入（沿用 F3 `getProblemsForConcept`，題數守門不另立語意），`whyThisPattern` / `hint` 取自本篇 `Today's Challenge`；對齊規則為**單向包含**（課表題號 ⊆ 條目，缺漏即失敗；條目較多不報錯）（FR-006、FR-007）
- [X] T023 [US1] 於 `src/compiler/lesson.ts` 實作 `derivePath()`：由 DAG `prerequisite` / `next` 取「最接近者」，以 F2 `ordinalOf` 全序決勝（FR-008、research R4）
- [X] T024 [US1] 移除 `src/compiler/lesson.ts` 的 `DEMO_LEETCODE_IDS` 與 `DEMO_PROBLEM_CONTENT` 常數表及其相關分支（FR-029）
- [X] T025 [US1] 更新既有 `tests/unit/lesson.test.ts` / `tests/unit/schedule.test.ts` / `tests/unit/content.test.ts` 至新契約（移除對 F1 硬編課表與 demo 常數的斷言）

**Checkpoint**: US1 可獨立驗證——quickstart §2 的單堂編譯與 determinism 檢查通過。

---

## Phase 4: User Story 2 - 五種 Session 類型都有可推播的版面 (Priority: P1)

**Goal**: `practice` / `challenge` / `review` / `rest` 皆可編譯並 render 出結構正確的訊息。

**Independent Test**: 對 `foundation` 的 sessionIndex 3 / 5 / 6 / 7 各編譯 + render，embeds 結構符合
contracts/renderer-contract.md §2，且不含空字串或佔位段落。

### Tests for User Story 2 ⚠️

- [X] T026 [P] [US2] `tests/unit/compile-types.test.ts`：四種非 concept 類型的 `Lesson` 形狀符合 data-model.md §2 型別不變式（`rest` 恆無題目、`review` 的 `reviewConcepts` 非空、非 concept 類無 `concept` / `path`）
- [X] T027 [P] [US2] `tests/unit/compile-review.test.ts`：`reviewConcepts` 由 `reviewRange` 推導且涵蓋範圍內全部 `concept` Session；`reviewRange` 缺席或範圍內無 concept ⇒ fail loud（FR-011、spec Edge Cases）
- [X] T028 [P] [US2] `tests/unit/compile-problem-origin.test.ts`：practice / challenge 的題目說明取自「引入該題的 Concept Article」；同題被多 Concept 引用取課表較早者；**「查無來源」的兩種狀態皆省略 `whyThisPattern` 且皆不失敗**——(a) `ProblemOrigin` 無此題號、(b) 反查到 conceptId 但該 Article 的 `Today's Challenge` 無此題號條目（FR-030、research R3）
- [X] T029 [P] [US2] `tests/unit/renderer-types.test.ts`：五種版面的 embeds 結構逐欄位斷言（非 snapshot）；缺席內容一律**欄位不存在**而非空字串（contracts/renderer-contract.md §2）

### Implementation for User Story 2

- [X] T030 [US2] 於 `src/compiler/lesson.ts` 實作 `practice` / `challenge` 分支：題目自課表 `problemIds` + Problem Bank，說明經 `ProblemOrigin` 反查取得；`problemIds` 缺席 ⇒ `problems: []` 仍產出可推播 Lesson；**MUST NOT 重新選題**（FR-009 challenge 條款、FR-010、FR-030）
- [X] T031 [US2] 於 `src/compiler/lesson.ts` 實作 `review` 分支：依 `reviewRange` 推導 `reviewConcepts`；`problems` 取該 Session 的 `problemIds`（目前為空）；`reflectionQuestion` 僅在 F8 素材就緒時填入（FR-011、FR-031）
- [X] T032 [US2] 於 `src/compiler/lesson.ts` 實作 `rest` 分支：`problems: []`；`encouragement` 僅在 F8 素材就緒時填入（FR-010、FR-031）
- [X] T033 [US2] 於 `src/renderer/discord.ts` 新增 `practice` / `challenge` 版面（題目為主 + 固定版面文案）與其 `budgetSlots`（contracts/renderer-contract.md §2）
- [X] T034 [US2] 於 `src/renderer/discord.ts` 新增 `review` 版面（`📚 本週涵蓋` / 選配 `🤔 Reflection` / 選配 `🎯 Challenge`，缺席即省略該 field）與 `rest` 版面（固定文案 + 選配鼓勵語）
- [X] T035 [US2] 於 `src/renderer/discord.ts` 的 concept 版面補上 `📎 Track 補充` Embed（`overlayNotes` 存在時才輸出）與其預算 slot（contracts/renderer-contract.md §2；套用邏輯屬 US5）

**Checkpoint**: US1 + US2 皆可獨立驗證；quickstart §3 的五類型檢查通過。

---

## Phase 5: User Story 3 - CI Gate 對全 Track × 全 Session 完整編譯與限制檢查 (Priority: P1)

**Goal**: 一條指令對 3 Track × 全部 Session 完整編譯 + render + 限制檢查，違規一次全報並以非零 exit code 結束。

**Independent Test**: `npm run validate:content` 通過 39 筆；注入三種不同成因的破壞後，一次列出三筆違規、
彙總正確、exit code 非零。

### Tests for User Story 3 ⚠️

- [X] T036 [P] [US3] `tests/unit/gate.test.ts`（happy path）：以真實素材執行 `runContentGate`，`violations` 為空且 `compiled === total`；`total` 等於三份課表 Session 數總和
- [X] T037 [P] [US3] `tests/unit/gate-violations.test.ts`：注入多筆不同成因（Digest 超預算、Article 缺區塊、`conceptId` 斷鏈）⇒ **一次回報全部**、不於第一筆中止、排序穩定（track → sessionIndex → rule → subject）；空課表 ⇒ `schedule-empty`（FR-022、FR-024）

### Implementation for User Story 3

- [X] T038 [US3] 新增 `src/compiler/gate.ts`：`runContentGate(input): GateResult` 純函式——逐 Track × 逐 Session `compile` → `render` → 逐則 `checkBudget`，例外與超限一律轉為結構化 `GateViolation`；無 `process.exit` / `console` / 檔案 I/O（data-model.md §6、contracts/gate-contract.md §1）
- [X] T039 [US3] 於 `src/compiler/gate.ts` 實作違規排序與 `schedule-empty` 守衛（contracts/gate-contract.md §2）
- [X] T040 [US3] 新增 `scripts/validate.ts`：`loadCompilerDeps()` → `validateCurriculum`（error 轉 `curriculum-invalid` 並繼續）→ `runContentGate` → 逐筆列印 `{track} #{sessionIndex} [{rule}] {subject}: {message}` → 彙總 → `process.exit(0|1)`；**唯一的 I/O 與 exit 位置**（FR-022、FR-024、contracts/gate-contract.md §3）
- [X] T041 [US3] 新增 `.github/workflows/content-gate.yml`：`pull_request` / `push` 對 `concepts/**`、`articles/**`、`data/**`、`schedules/**`、`overlays/**`、`curriculum/**`、`src/**`（及本檔）觸發；Node 24；`npm ci` → `npm run build` → `npm test` → `npm run validate:content`；**不引用任何 secret、不含 TS/Python 程式碼實測**（FR-025、FR-027、FR-028、contracts/gate-contract.md §4）

**Checkpoint**: quickstart §1 的通過與四種失敗路徑皆符合預期。

---

## Phase 6: User Story 4 - Renderer 是可信賴的純函式 (Priority: P2)

**Goal**: 版面擴充後仍維持純函式、Track 無感、預算與結構性上限由同一顆函式把關，並補齊拆訊息 fallback。

**Independent Test**: 同一 `Lesson` 連續 render deep-equal；換三個 Track embeds 結構零差異；import 掃描只見型別；
超長 fixture 逐一觸發每個預算項與結構性上限。

### Tests for User Story 4 ⚠️

- [ ] T042 [P] [US4] `tests/unit/renderer-purity.test.ts`：連續 render deep-equal；同 Lesson 換三個 Track 結構與內容零差異；**import 掃描**斷言 `src/renderer/**` 只有型別 import（無 `node:fs` / compiler / state）（FR-015、FR-017、SC-004）
- [ ] T043 [P] [US4] 擴充 `tests/unit/budget.test.ts`：每個預算項（`digest` / `tsTip` / `pyTip` / `problem[i]` / `problems.count` / `exitCriteria` 含條數與單條長度 / `takeaway` / `pathFooter` / `overlayNotes`）與每個結構性上限（title / description / fields 數 / field name / value / embeds 數）各有觸發案例；`total` 與 `total.hard`（6,000）各有獨立斷言；長度以 code point 計（emoji 案例）
- [ ] T044 [P] [US4] `tests/unit/renderer-split.test.ts`：總長 ≤5,500 回傳單則；超過時依 embed 邊界確定性拆為兩則且 `budgetSlots` 隨其 embed 移動；拆後仍超限或單一 embed 自身超限 ⇒ 回報違規而非再拆、**不截斷**（FR-020、research R11）

### Implementation for User Story 4

- [ ] T045 [US4] 於 `src/renderer/discord.ts` 實作拆訊息 fallback：先組單則 → 超過 5,500 時依 embed 邊界原序切為至多兩則；embed 內部不切分（contracts/renderer-contract.md §3）
- [ ] T046 [US4] 於 `src/renderer/budget.ts` 補齊 `overlayNotes`（≤400）與 `exitCriteria` 的條數（≤6）／單條長度（≤60）檢查項（data-model.md §5、`docs/spec.md` §10.2）
- [ ] T047 [US4] 於 `src/compiler/gate.ts` 與 `src/main.ts` 確認多則訊息路徑：Gate 對每則各跑 `checkBudget` 並逐項列出超限明細；main 逐則檢查後依序 post（contracts/renderer-contract.md §5）

**Checkpoint**: AC7 與 §14.5 全部限制皆有測試把關。

---

## Phase 7: User Story 5 - Track 差異只由課表與 Overlay 疊加 (Priority: P2)

**Goal**: 三軌共用同一份教材正文；Track 的題目差異**完全來自各自課表**（Overlay `extraProblemIds` 已於 F4
生成階段凍結進課表），Track 專屬補充說明以 `extraNotesMarkdown` 疊加進入 Lesson。

**Independent Test**: 同一 Concept 三軌編譯教材欄位全等；逐 Session 比對 `Lesson.problems` 的題號序**完全
等於**課表 `problemIds`（Compiler 未增刪重排）；`foundation` 的 `overlayNotes` 有值而 `interviewReady` 無，
且兩軌 Digest 一字未動。

### Tests for User Story 5 ⚠️

- [ ] T048 [P] [US5] `tests/unit/overlay-apply.test.ts`：`extraNotesMarkdown` 進 `overlayNotes` 且 Digest 不變；Overlay 指向未涵蓋 Concept ⇒ fail loud；**`extraProblemIds` 與 per-Concept `challengeDifficulty` 皆不被消費**——以合成 Overlay 宣告一個不在課表 `problemIds` 中的題號，斷言 `Lesson.problems` **不變**（FR-009、research R6）
- [ ] T049 [P] [US5] `tests/unit/overlay-load.test.ts`：Overlay 檔不存在 ⇒ 空 Overlay 不失敗；存在但不符 schema ⇒ fail loud。**同檔涵蓋 F8 素材的相同對照**：`data/reflection-bank.json` / `data/encouragement.json` 不存在 ⇒ 缺席不失敗、存在但不符 schema ⇒ fail loud（FR-031、contracts/lesson-contract.md §1 對照表）
- [ ] T050 [P] [US5] `tests/unit/shared-content.test.ts`：同一 `conceptId` 於三個 Track 編譯，`concept` 的 digest / tsTip / pyTip / takeaway / exitCriteria 全等；**逐 Track 逐 Session 斷言 `Lesson.problems` 的題號序完全等於課表 `problemIds`**（SC-005、憲章 VI、US5 AS-2）

### Implementation for User Story 5

- [ ] T051 [US5] 於 `src/compiler/lesson.ts` 套用 Overlay：`extraNotesMarkdown` → `Lesson.overlayNotes`（僅 concept 類）、指向未涵蓋 Concept ⇒ fail loud；**MUST NOT 取代任何核心欄位**，且 **MUST NOT 消費 `extraProblemIds` 或 `challengeDifficulty`**（選題已於 F4 生成階段凍結進課表；FR-009、research R6）

**Checkpoint**: 全部五個 Story 皆可獨立驗證。

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T052 移除孤兒教材 `articles/two-pointer/002-left-right-pointer.md`（不對應任何 DAG Concept 且格式已過時；內容可由 git 歷史取回）（FR-029、research R8）
- [ ] T053 [P] 擴充 `tests/unit/zero-llm.test.ts` 的掃描範圍至 `src/compiler/gate.ts`、`src/compiler/overlay.ts` 與 `scripts/validate.ts`（憲章 VIII、FR-013）；併加一條斷言：`scripts/validate.ts` 與 Gate 路徑 MUST NOT 讀取任何 API key／webhook 環境變數（SC-007 的自動化把關，取代純手動驗證）
- [ ] T054 [P] `tests/unit/debt-cleanup.test.ts`：掃描 `src/**` 確認 `SESSION_PLANS` / `getPathLabels` / `DEMO_LEETCODE_IDS` / `DEMO_PROBLEM_CONTENT` 皆已不存在（FR-029、SC-009）
- [ ] T055 依 [quickstart.md](./quickstart.md) 逐節走完 §1–§8 驗收（含失敗路徑注入與復原、DRY_RUN 版面預覽、`$LASTEXITCODE` 檢查）
- [ ] T056 執行 `npm run build` + `npm test` + `npm run validate:curriculum` + `npm run validate:problem-bank` + `npm run validate:schedule` + `npm run validate:content` 全綠回歸（對齊 `ci.yml` 與 `content-gate.yml` 的完整步驟），並勾選 [checklists/compiler.md](./checklists/compiler.md) 中與實作相關的驗證

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**：無相依，可立即開始
- **Phase 2 Foundational**：依賴 Setup；**阻擋全部 Story**（型別 + 解析器 + 載入器 + 既有模組適配）
- **Phase 3–7 User Stories**：全部依賴 Phase 2 完成
- **Phase 8 Polish**：依賴 US1–US5 完成

### User Story Dependencies

| Story | 依賴 | 說明 |
| --- | --- | --- |
| US1（P1） | Phase 2 | 無其他 Story 相依，MVP |
| US2（P1） | Phase 2、US1 的 `compile` 骨架（T020） | 其餘四種 type 分派掛在同一個 `compile` 上 |
| US3（P1） | Phase 2、US1＋US2（Gate 需全部類型可編譯） | 否則 Gate 無法對全 Session 通過 |
| US4（P2） | Phase 2（T010 已搬遷機制） | 可與 US5 平行 |
| US5（P2） | Phase 2、US1 的題目組裝（T022） | 可與 US4 平行 |

> **實務排序建議**：US1 → US2 → US3 為一條主線（MVP 到 Gate 綠燈）；US4 / US5 可在 US2 完成後平行進行，
> 但 **US3 的最終驗收要等 US4／US5 併入**（Gate 會實際跑到 Overlay 與拆訊息路徑）。

### Within Each User Story

- 測試先寫、先確認失敗，再實作
- 型別／解析器 → 組裝邏輯 → 版面 → 入口
- 每個 Story 完成後即可獨立驗證，再進下一個

### Parallel Opportunities

- Phase 1：T002 可與 T001 平行
- Phase 2：T008 / T012 / T013 / T014 互不相干可平行；T004 → T005 → T006 為同檔序列；T010 → T011 為序列
- 各 Story 的測試任務（標 [P]）皆為不同檔案，可一次全開
- Phase 8：T053 / T054 可平行

---

## Parallel Example: User Story 1

```bash
# 一次啟動 US1 的全部測試任務（不同檔案、互不相干）：
Task: "tests/unit/article-parse.test.ts"
Task: "tests/unit/compile-concept.test.ts"
Task: "tests/unit/compile-path.test.ts"
Task: "tests/unit/compile-determinism.test.ts"
Task: "tests/unit/compile-errors.test.ts"
```

```bash
# Phase 2 的可平行任務：
Task: "src/compiler/overlay.ts"
Task: "tests/helpers/compiler.ts"
Task: "articles/programming-mindset/*.md"
Task: "articles/array/*.md"
```

---

## Implementation Strategy

### MVP First（US1）

1. Phase 1 Setup
2. Phase 2 Foundational（**關鍵**，阻擋全部 Story）
3. Phase 3 US1
4. **停下驗證**：quickstart §2（單堂編譯 + determinism）
5. 此時 Compiler 已能由真實素材產出 Lesson——F1 的硬編路徑正式退場

### Incremental Delivery

1. Setup + Foundational → build 綠燈、素材齊備
2. + US1 → 單堂課可編譯（MVP）
3. + US2 → 五種類型皆可推播
4. + US3 → Gate 綠燈（**M2 的 F5 部分達成**）
5. + US4 → 純函式性與 §14.5 全限制有測試把關（AC7）
6. + US5 → Track 差異只走 Overlay（AC5 的 F5 面向）
7. + Polish → 債清償、回歸、quickstart 驗收

### Commit 策略（依 CLAUDE.md）

`/speckit-implement` MUST 依 Phase / User Story 分段 commit，scope 為 `005-lesson-compiler`：

| 階段 | 建議 type |
| --- | --- |
| Phase 1 Setup | `build` |
| Phase 2 Foundational | `refactor`（型別與模組搬遷）＋ `feat`（stub Article 為課程增量） |
| Phase 3 US1 | `feat` |
| Phase 4 US2 | `feat` |
| Phase 5 US3 | `feat`（Gate 能力）＋ `ci`（workflow） |
| Phase 6 US4 | `feat` |
| Phase 7 US5 | `feat` |
| Phase 8 Polish | `chore` |

各段的 `tasks.md` 勾選併入該段 commit；全部跑完不再另外彙總。

---

## Notes

- [P] = 不同檔案、無未完成相依
- 憲章「測試優先」點名的邏輯**一律有對應測試任務**：Article 解析（T015）、Compiler determinism（T018）、
  Overlay 疊加不取代（T048/T050）、Renderer 純函式性與 Discord 限制含 6,000 總長（T042/T043）、
  教材品質 Gate（T036/T037）
- **選題一律在生成階段定案（`docs/spec.md` §13.4 / §16.3）**：Compiler MUST NOT 加題、選題或截斷題目。
  `Lesson.problems` 恆等於課表 `problemIds`；每 Session ≤3 題由 F4 生成端保證，Gate 的 `problems.count`
  只是兜底
- **不得**在 workflow 留下無驗證力的程式碼實測空殼（FR-028）——TS/Python 實測屬 F7
- 本機驗證版面一律 `DRY_RUN=true`，MUST NOT 打真實 Discord webhook
