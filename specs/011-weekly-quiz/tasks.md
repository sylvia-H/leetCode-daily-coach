# Tasks: Weekly Quiz — 每週自評測驗（spoiler 自評）

**Feature**: `011-weekly-quiz` | **Date**: 2026-08-07

**Input**: Design documents from `specs/011-weekly-quiz/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、
[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**Tests**: **包含測試任務**。`docs/spec.md` §22.2 明文要求 DAG／Gate／課表 determinism／
Compiler determinism／狀態推進等關鍵邏輯 MUST 有單元測試；本 Feature 新增的選題純函式、
Gate 判準、交叉驗證重生邏輯屬同一類別，plan.md「測試落點」已釘死落點檔名，故測試為交付範圍
的一部分而非選配。

**Organization**: spec 只有 **一個 User Story（US1，P1）**。任務依 plan.md「實作階段與依賴」
（P1–P6）分組：P1 為硬性前置（Foundational），P2–P6 共同交付 US1 的驗收標準，其中 P3
（Renderer）對 P1/P2 無執行順序依賴，可平行推進。

## Format: `[ID] [P?] [Story] Description`

- **[P]**：可平行執行（不同檔案、無未完成依賴）
- **[Story]**：任務所屬 User Story（本 Feature 僅 `US1`）；Setup / Foundational / Polish 無此標籤
- 每一任務都標明確切檔案路徑

## Path Conventions

單一 TypeScript 專案（非 monorepo）：`src/`、`scripts/`、`tests/`、`data/` 皆位於 repo root。
指令一律 **PowerShell**、套件管理 **npm**。

---

## Phase 1: Setup

**Purpose**: 建立可比對的綠燈基線，並確認實作前的規格回寫確實已落地。

- [X] T001 建立綠燈基線：於 repo root 依序執行 `npm ci`、`npm run build`、`npm run typecheck`、
  `npm test`、`npm run validate:content` 全數通過，記錄現況作為後續比對基準
- [X] T002 **驗證**（非提交）實作前的規格回寫已全部落地——原任務要求「提交尚未 commit 的規格文件」，
  但該批文件已於 `1f6ae72`／`abffb91`／`1e38af7` 提交完畢、worktree 乾淨，照原文執行只會產生空 commit。
  改為逐項核對：`docs/spec.md` §14.5 含 `quizItem` **570** 與 `QUIZ_URL_RESERVE_CHARS` **120**、
  §15 的段落順序為 **Quiz 第四段／Encouragement 最後一段**（原誤植為 Encouragement 第四、Quiz 第五，
  直接違反 F8 FR-022）、F11 段含 `quiz-leetcode-id` 判準；`specs/011-weekly-quiz/spec.md` 含 FR-002
  插入點與 FR-012 連結來源機制、FR-011 的 `unlockedIds` 範圍。任一項缺失才需補回寫並以 type `docs`、
  scope `011-weekly-quiz` 單獨 commit（與實作 commit 分開，同 F8 T002a 慣例）

**Checkpoint**: 基線綠燈、規格文件與 `docs/spec.md` 已核對一致 → 可開始 Foundational

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: 題庫的型別、schema、決定性選取、結構性 Gate 判準（plan.md P1）——這是 Compiler
整合（P2）、Pages（P4）、產線（P5）共同依賴的底座；FR-001／FR-003／FR-003a／FR-005／FR-006／
FR-010／FR-010a／FR-014。

**⚠️ CRITICAL**: 本 Phase 完成前，P2（compiler 整合）、P4（Pages）、P5（產線）不得開始。

> **與 plan.md 的一處澄清**：plan.md 將 Renderer（P3）列為「無硬依賴、可與 P1/P2 並行」，
> 但 `checkQuizBank` 的 `quiz-item-budget` 判準依 `data-model.md` §3 MUST 呼叫 Renderer 匯出的
> `renderQuizItemBody`（憲章 IX：Gate 與 runtime 共用同一份呈現邏輯）——因此 `renderQuizItemBody`
> 本身（純字串組裝、不依賴 QuizBank／Curriculum 型別）**必須先於 `checkQuizBank` 完成**，故排入
> 本 Phase 而非 Phase 3B；Renderer 真正「無硬依賴」的部分是**版面插入**（`buildReviewBlocks` 的
> 段落順序），那才排入 Phase 3B。

- [X] T003 [P] 新增 `ReviewQuizItem` 型別與 `ReviewLesson.quizItems?` / `BudgetSlots.quizItems?`
  欄位於 `src/types/lesson.ts`（data-model.md §4；`quizItems` 空陣列與缺席同義，MUST NOT 以空
  陣列填充）
- [X] T004 [P] 新增 `QuizItem` / `QuizBank` / `QuizViolationRule` / `QuizViolation` 型別與 zod
  strict schema 於 `src/compiler/quiz.ts`（data-model.md §1）：`options` 恰 4 個非空字串、
  `answerIndex ∈ [0,3]`、`explanation` 恰 5 個非空字串；`byConcept` 陣列本身 **MAY 為空，
  schema MUST NOT 用 `min(1)`**（同 F8 `ReflectionBank` 既有理由，FR-007 的降級路徑）
- [X] T005 [P] 新增 `QUIZ_BUDGET_LIMITS = { quizItem: 570, quiz: 3000 }` 與
  `QUIZ_URL_RESERVE_CHARS = 120` 常數於 `src/renderer/budget.ts`（data-model.md §3、FR-014）；
  `checkBudget` 改為 import 此常數，MUST NOT 出現第二處字面值。
  `checkBudget` 對 `budgetSlots.quizItems` 的登記方式 MUST 比照既有 `problems`：逐題
  `quizItem[i]` ≤570，另加一個彙總項 `quiz`（各題長度加總）≤3000（data-model.md §4）；
  **兩者皆只計 field value，不含 field name**
  > **數值來源（MUST NOT 自行調低）**：570 = 內容 450（實測最長 362 + 24% 餘裕）+ 連結保留 120；
  > 120 = 實測最壞連結 111（base URL 47 + `/quiz/` 6 + 最長 conceptId 42 + `.html` 5 + 裝飾 11）
  > 取整。reserve **MUST NOT 低於實際最壞值**——低估會使 Gate 寬鬆於 runtime，出現「CI 過、
  > 正式推播才爆」，違反憲章 IX（research R3 的 2026-08-07 修訂）
- [X] T006 [depends on T003] 實作並匯出 `renderQuizItemBody` 純函式於 `src/renderer/discord.ts`：
  `{stem}\nA. {options[0]}\nB. {options[1]}\nC. {options[2]}\nD. {options[3]}\n||正解：{answerLabel}
  — {conclusion}{quizUrl ? " · [完整詳解](url)" : ""}||`（quiz-selection.md §4）；此函式 MUST 同時
  被本 Phase 的 `checkQuizBank`（無實際 url，估算用）與 Phase 3B 的 `buildReviewBlocks`（有實際
  url）共用（憲章 IX），MUST NOT 各自實作一份
- [X] T007 [depends on T004] 實作 `selectQuizItem(input): QuizItem | undefined` 純函式於
  `src/compiler/quiz.ts`：`index = (node.localOrder + trackOffset) mod items.length`，
  `trackOffset = TRACK_ORDER.indexOf(track)`；`bank` 缺該 Concept 或陣列為空 ⇒ `undefined`
  （FR-003、FR-003a：MUST NOT 固化進 `schedules/**` 或 `data/quiz-bank.json`，contracts/quiz-selection.md §1–2）。
  **`localOrder` 為 `ConceptNode` 既有欄位、值來自 Skeleton 檔名 `NNN-` 前綴（1-based，目錄範圍）**
  ——直接使用該欄位，**MUST NOT 自行推算「Topic 內序位」**（FR-003 已更正定義）
- [X] T007a [depends on T003, T004] 實作並匯出 `toReviewQuizItem(conceptId, item, quizUrl?): ReviewQuizItem`
  純函式於 `src/compiler/quiz.ts`（data-model.md §3.1）：`answerLabel = "ABCD"[item.answerIndex]`、
  `conclusion = item.explanation[0]`、`quizUrl` 未給即不設該欄位。**此為 `QuizItem → ReviewQuizItem`
  的唯一轉換點**，MUST 同時被 T016 的 `compileReview`（有 url）與 T008 的 `checkQuizBank`（無 url，
  估算用）呼叫；MUST NOT 在兩處各組一份（憲章 IX：Gate 與 runtime 共用同一份邏輯）
- [X] T008 [depends on T004, T005, T006, T007a] 實作 `checkQuizBank(input): QuizViolation[]` 於
  `src/compiler/quiz.ts`，對 `byConcept` **每一個陣列元素逐一檢查**（不依賴課表是否選中，
  research R3）：`quiz-unknown-concept` / `quiz-option-prefix`（`/^[A-D][.、)]\s*/`）/
  `quiz-conclusion-length`（`explanation[0]` >80）/ `quiz-item-budget`（呼叫 T006 的
  `renderQuizItemBody(toReviewQuizItem(conceptId, item))` + `QUIZ_URL_RESERVE_CHARS` 保守估計，
  **MUST NOT 自行拼裝 `answerLabel`／`conclusion`**）/ `quiz-traditional-chinese`
  （復用既有 `checkTraditionalChinese`）/ `quiz-count-range`（陣列長度 ∉ [3,10]）/
  `quiz-duplicate`（`stem` 逐字相同）/ `quiz-leetcode-id`（`stem + options + explanation` 合併文本
  命中 `/leetcode\.com\/problems/i` 或 `/(LeetCode|力扣)\s*[#第]?\s*\d+/i`）。`quiz-schema` 由 §2
  載入層 throw 實現，非本函式輸出（quiz-bank-schema.md §3、data-model.md §1.1、FR-010／FR-010a）
  > **`quiz-leetcode-id` 的必要性**：§5／§11 與憲章「技術與資源約束」明訂題號 / 連結 / 難度 MUST 由
  > 程式從 Problem Bank 帶入、MUST NOT 由 LLM 生成，而小測題三個欄位全是 LLM 產物。判準 MUST 只攔
  > 「LeetCode／力扣 + 數字」與題目連結，**MUST NOT 擴大為「不得出現任何數字」**——複雜度、索引、
  > 情境數值皆為合法內容（quiz-bank-schema.md §3 rule 9 的邊界說明）
  > **CHK021 對應（checklists/prompt-design.md）**：`quiz-count-range` 在題數 **>10** 時 MUST
  > 回報違規並擋下整個 Concept，**MUST NOT 自動截斷或挑選保留哪些題**——FR-005「上限為保險絲」
  > 的語意是「讓失控可見」而非「自動修剪」，測試 T011 MUST 明確斷言陣列未被截斷。
- [X] T009 [depends on T004] 於 `src/compiler/lesson.ts`（或 `quiz.ts` 匯出、供 `loadCompilerDeps`
  呼叫）比照既有 `loadOptionalMaterial(path, label, schema)` 語意載入 `data/quiz-bank.json`：
  檔案不存在 ⇒ `undefined`；非合法 JSON 或不符 schema ⇒ throw 具名錯誤（quiz-bank-schema.md §2）
- [X] T010 [P] 新增 `tests/unit/quiz-select.test.ts`：不變式 **I1／I2**（同一 `(track, conceptId)`
  恆選同一題、三軌 `trackOffset` 互異取到相異題目）；`bank` 缺 Concept 或陣列為空 ⇒ `undefined`
  （FR-003、quiz-selection.md §2）。**I3（同一 `(track, sessionIndex)` byte-identical）不在本檔**
  ——`selectQuizItem` 的簽章不含 `sessionIndex`，該不變式屬 compile 層，落點見 T018a
- [X] T011 [P] 新增 `tests/unit/quiz-gate.test.ts`：`checkQuizBank()` 輸出的 **8 條**
  `QuizViolationRule` 逐一被攔截且訊息指名根因（Concept、第幾則、實際值／上限）；第 9 條
  `quiz-schema` 由載入層 throw、覆蓋在 T012（計數口徑見 quiz-bank-schema.md §3）；**額外斷言題數 >10
  時回報 `quiz-count-range` 而非靜默截斷陣列**（CHK021）；`quiz-duplicate` 只攔逐字相同、同面向多題
  不誤判為重複（FR-016）；**`quiz-leetcode-id` 攔得下「LeetCode 1 / 力扣第 42 題 / leetcode.com/problems/…」
  三種樣式，且 MUST 斷言含 `O(n²)`、`nums[3]`、情境數值的正常題目不被誤判**（守住 rule 9 不得擴大為
  「不得出現任何數字」的邊界）。
  **另 MUST 斷言 `QUIZ_URL_RESERVE_CHARS` ≥ 實際最壞連結長度**（以最長 conceptId + 一個代表性
  base URL 實算 `` ` · [完整詳解](${url})` `` 的 code point 長度比對），釘死「Gate 恆嚴格於 runtime」
  這條憲章 IX 的方向性——初訂的 90 正是因無此斷言而低估（research R3 修訂）
- [X] T012 [P] 新增 `tests/unit/quiz-load.test.ts`：檔案缺席 ⇒ `undefined`（不失敗）；某 Concept
  缺 key 或陣列為空 ⇒ 該 Concept 略過（由 Gate 擋下，不在 runtime 失敗）；壞檔／不符 schema ⇒
  throw 具名錯誤（quiz-bank-schema.md §2）

**Checkpoint**: `src/compiler/quiz.ts` 與 `renderQuizItemBody` 就位且通過測試 → Phase 3
的各子系統可平行開始

---

## Phase 3: User Story 1 - 每週自評確認本週觀念掌握（Priority: P1）🎯 MVP

**Goal**: 每週 review Session 於 Challenge 之後、鼓勵語之前新增「✍️ 本週小測」段——該週涵蓋的
每個 Concept 各出恰 1 題，題幹與選項明碼、正解與一句結論封於 spoiler，並連結至 Pages 上的
完整題庫頁；題庫由 build-time 產線生成並通過交叉驗證與結構性 Gate。

**Independent Test**: 對三個 Track 各取一個 review Session 編譯並 render，確認 embeds 含
「✍️ 本週小測」段、題數等於該週涵蓋 Concept 數、正解與結論句封於 `||…||`、完整詳解不出現於
Discord；同一 Concept 三軌互異；題庫或 Pages 缺席時分別降級但不影響其餘四段推播。

### 3A. Compiler 整合（plan P2；依賴 Phase 2）

- [ ] T013 [US1] 擴充 `CompilerDeps`（`quizBank?: QuizBank`、`pagesBaseUrl?: string`）與
  `CompilerPaths`（`quizBankPath: "data/quiz-bank.json"`）於 `src/compiler/lesson.ts`
  （data-model.md §5）
- [ ] T014 [P] [US1] 擴充 `Config.pagesBaseUrl?: string` 於 `src/config.ts`：
  `loadConfig` 讀取 `env.PAGES_BASE_URL?.trim() || undefined`；**不列為必要欄位**，缺席不影響
  既有 fail-fast 條件（data-model.md §6、research R1）
- [ ] T015 [US1] [depends on T014] `src/main.ts` 的 `run()` 於 `loadCompilerDeps()` 後併入
  `deps.pagesBaseUrl = config.pagesBaseUrl`（data-model.md §6）
- [ ] T016 [US1] [depends on T007, T007a, T013] `compileReview` 組裝 `quizItems` 於
  `src/compiler/lesson.ts`：依 `reviewConcepts` 既有順序逐一呼叫 `selectQuizItem`，缺題 Concept
  略過（FR-007）；`quizUrl = deps.pagesBaseUrl ? "${deps.pagesBaseUrl}/quiz/${conceptId}.html" :
  undefined`（FR-012）；轉換一律走 T007a 的 `toReviewQuizItem(c.id, item, quizUrl)`，
  **MUST NOT 就地拼裝 `answerLabel`／`conclusion`**；全部略過 ⇒ **不設定** `lesson.quizItems`
  （MUST NOT 以空陣列填充，contracts/quiz-selection.md §3）
- [ ] T017 [US1] [depends on T008] 於 `src/compiler/gate.ts` 新增 `GateRule = "quiz-invalid"`
  （只新增這一個，9 個細分留在 `QuizViolationRule`），`runContentGate` 開頭比照
  `checkMaterials` 的既有呼叫方式多呼叫一次 `checkQuizBank({ quizBank: deps.quizBank, graph })`，
  `subject` 映射為 `` `${v.rule}@${v.subject}` ``（data-model.md §8）
- [ ] T018 [P] [US1] 擴充 `tests/unit/compile-review.test.ts`：`quizItems.length ===
  reviewConcepts.length`（除非某 Concept 題庫缺席）；`pagesBaseUrl` 缺席／存在對 `quizUrl` 的
  影響；某 Concept 題庫無題時該 Concept 略過、其餘正常；題庫檔缺席時 `quizItems` 整體不設定
  （FR-002／FR-004／FR-007／FR-008／FR-012）
- [ ] T018a [P] [US1] 擴充 `tests/unit/compile-determinism.test.ts`：以含 `quizBank` 的 deps
  fixture，對同一 `(track, sessionIndex)` 的 review Session **重複 compile + render 兩次，
  斷言結果 byte-identical**（不變式 I3、**SC-002**）。**此為 SC-002 唯一的自動化落點**——既有
  determinism 測試的 fixture 不含 `quizBank`，小測路徑不會被觸達；T041 的人工快照 MUST NOT
  作為 SC-002 的唯一保證（quiz-selection.md §2 I3）
- [ ] T019 [P] [US1] 擴充 `tests/unit/content-gate-additions.test.ts`：注入違規 `quizBank`
  fixture，斷言 `runContentGate` 回報 `rule === "quiz-invalid"` 且 `subject` 具 `{原rule}@` 前綴
  （data-model.md §8）

### 3B. Renderer 版面（plan P3；僅依賴 Phase 2 的 T006，可與 3A/3C/3D 平行）

- [ ] T020 [P] [US1] `buildReviewBlocks` 新增「✍️ 本週小測」段於 `src/renderer/discord.ts`：
  插入於 Challenge 之後、鼓勵語**之前**（五段順序：本週涵蓋／Reflection／Challenge／小測／
  鼓勵語，research R5、FR-002），每題一個 field（field name 含 `(i/N) · {conceptTitle}`，
  value 呼叫 T006 的 `renderQuizItemBody`）；`quizItems` 缺席或空 ⇒ 整段省略；Renderer 維持
  stateless 純函式，MUST NOT 讀題庫／Curriculum／state（quiz-selection.md §4）。
  **同時 MUST 登記 `slots.quizItems`（逐題的 field value 原字串）並在 `mergeSlots()` 併入該欄位**
  ——`render()` 是靠 `mergeSlots` 把各 Block 的 slot 收攏後才交給 `checkBudget`，漏改 `mergeSlots`
  會讓小測段**完全逃過逐區塊預算**（`buildReviewBlocks` 旁的既有註解正是在警告這件事），
  且 CI 與 runtime 都不會有任何徵兆。T022 的 slot⇄field 對等測試 MUST 能攔下此漏
- [ ] T021 [P] [US1] 擴充 `tests/helpers/lesson.ts` 的 review fixture 使其支援 `quizItems`
  （plan.md 檔案清單已列，供 T021／T022／T023 共用），並擴充 `tests/unit/renderer.test.ts`：五段順序含「✍️ 本週小測」；spoiler
  邊界（僅「正解：{代號} — {結論句}[ · 連結]」封於 `||…||`，題幹與四選項明碼，完整
  `explanation[1..4]` 不出現）；`quizItems` 缺席時整段省略且不留空欄位（SC-001、US1 Acceptance
  1–2）
- [ ] T022 [P] [US1] 擴充 `tests/unit/budget-slot-parity.test.ts`：`quizItems` 逐題登記對應
  budget slot（FR-009、quiz-selection.md §4）
- [ ] T023 [P] [US1] 擴充 `tests/unit/budget.test.ts`：`quizItem` ≤570（含連結）、`quiz` ≤3000
  （全部小測題合計）逐格檢查隨 `QUIZ_BUDGET_LIMITS` 常數而動，非隨字面值；並斷言 `quizItem[i]`
  與彙總項 `quiz` 兩者皆只計 field value、不含 field name（FR-014、SC-004、data-model.md §4）

### 3C. Pages 題庫頁（plan P4；依賴 T013 的 `CompilerDeps.quizBank` 型別）

- [ ] T024 [US1] [depends on T013] 新增 `src/pages/quiz-page.ts`：`QuizPageItem` /
  `QuizPageView` / `buildQuizPageView(node, items)` / `renderQuizPage(view)`；正解與完整 5 段
  `explanation` 以原生 `<details><summary>顯示解答</summary>…</details>` 呈現（零 JS，
  site-build-contract.md §3）；動態文字 MUST 經 `escapeHtml`；沿用既有 `renderPage()` 外殼
  （pages-quiz.md §3）
- [ ] T025 [US1] [depends on T024] `buildSite()` 整合於 `src/pages/site.ts`：既有
  `for (const conceptId of unlockedIds)` 迴圈內，`deps.quizBank?.byConcept[conceptId]` 非空時
  額外 `output.set('quiz/${conceptId}.html', renderQuizPage(...))`（僅 `unlockedIds` 範圍，
  非全部 165 個，research R7、pages-quiz.md §4）
- [ ] T026 [P] [US1] 新增 `tests/unit/pages-quiz-page.test.ts`：視圖組裝正確、`<details>`
  結構存在、HTML entity escape、同一 Concept 多題依宣告序呈現不重排（pages-quiz.md §3）
- [ ] T027 [P] [US1] 擴充 `tests/unit/pages-site-determinism.test.ts`：同一 `SiteBuildInput`
  呼叫兩次 `quiz/*.html` byte-identical；範圍限 `unlockedIds`（pages-quiz.md §4）
- [ ] T027a [US1] [depends on T025] 課綱順序清單掛 quiz 連結（FR-017、Q15、pages-quiz.md §6）：
  `src/pages/curriculum-view.ts` 的 `CurriculumEntryView` 新增 `quizUrl?: string`；
  `buildCurriculumEntries()` 新增 `quizBank: QuizBank | undefined` 參數，
  `unlocked && quizBank?.byConcept[node.id]?.length` 為真時賦值
  `${baseUrl}/quiz/${node.id}.html`（與 §1 Discord 端拼接規則一致，MUST NOT 另立格式）；
  `src/pages/dashboard.ts` 的 `renderCurriculumEntry` 新增 `renderQuizLink()`，`quizUrl` 缺席時
  回傳空字串；`src/pages/html.ts` 的 `SHARED_STYLE` 新增 `.divider` / `.quiz-chip`（底色
  `color-mix(in srgb, currentColor 12%, transparent)`，MUST NOT 寫死色號）；`src/pages/site.ts`
  呼叫 `buildCurriculumEntries()` 改傳入 `deps.quizBank`。**範圍 MUST NOT 觸及**
  `LastSessionView` / `renderTodaySession`（今日課程欄位維持現狀）
- [ ] T027b [P] [US1] [depends on T027a] 擴充
  `tests/unit/pages-curriculum-view.test.ts`：`quizUrl` 僅在「已解鎖且題庫非空」時賦值，
  `quizBank` 缺席時全部 `quizUrl` 為 `undefined`，URL 拼接與 Discord 端一致；擴充
  `tests/unit/pages-dashboard.test.ts`：`quizUrl` 缺席時無 `.divider` / `.quiz-chip` 輸出、
  出現時 HTML 結構與 escape 正確；`LastSessionView` / `renderTodaySession` 相關既有測試
  斷言不變（今日課程欄位不受影響）

### 3D. 題庫產線（plan P5；依賴 Phase 2 的 `checkQuizBank`）

- [ ] T028 [P] [US1] 新增 `scripts/lib/prompts/quiz-aspects.ts`：Stage A 面向列舉 prompt +
  `ResponseSchema`；取材範圍 MUST 涵蓋 `learning_goal`／`exit_criteria`／Author Hints 核心觀念／
  Pattern 辨識線索／Thinking／Common Mistakes 四段／`prerequisite`-`next` 鄰居區辨點，
  **MUST NOT** 納入 TypeScript／Python 重點，**MUST NOT** 於 prompt 出現任何題數或面向數字
  （含上限）（FR-016、quiz-bank-schema.md §5.2／§5.6）。
  **輸入契約（MUST，quiz-bank-schema.md §5.5）**：`ConceptNode` **不含 Skeleton 正文**，故本函式吃的是
  `QuizAspectsInput`（`concept` + 已切段的 `authorHints` 四段 + `neighbors` 的 `{id,title,learningGoal}`），
  **讀 `node.skeletonPath` 與切出 Author Hints 段落由 T032 的 `generate-quiz-bank.ts` 負責**（唯一 I/O 點），
  本模組維持純字串組裝。**`TypeScript 重點`／`Python 重點` MUST 在輸入組裝時就不放進來**，
  MUST NOT 只在 prompt 裡敘述性地要求模型忽略（Q14 已實證敘述性要求不可靠）
- [ ] T029 [P] [US1] 新增 `scripts/lib/prompts/quiz-items.ts`：Stage B 據面向出題 prompt +
  `ResponseSchema`；同一面向 MAY 從不同考核角度出多題，**MUST NOT** 出現任何題數／面向數字；
  `options` MUST NOT 含代號前綴；`explanation` MUST 要求恰 5 段結構（結論句／正解成立原因／
  其餘三選項各自為何不成立）；**MUST 明文禁止在題幹／選項／詳解中提及 LeetCode 題號或題目連結**
  （§5／§11：題號 MUST 由程式從 Problem Bank 帶入；prompt 為第一道、`quiz-leetcode-id` 為第二道）
  （FR-006、FR-010、FR-016）
- [ ] T030 [P] [US1] 新增 `scripts/lib/prompts/quiz-cross-check.ts`：盲答 prompt（只送
  `stem`+`options`，MUST NOT 附 `answerIndex`／`explanation`）+ 解析為
  `{ answerIndex: 0|1|2|3 }`（結構化輸出）；復用 `self-check.ts` 既有的 `stripJsonFence`，
  不沿用 `SelfCheckResponse` 形狀（quiz-bank-schema.md §4／§5.3、research R8）
- [ ] T031 [US1] 新增 `scripts/lib/quiz-checkpoint.ts`：`QuizConceptCheckpoint`
  （`skeletonHash`／`frozen`／`gatePassed`／`needsHumanReview`／`regenCount`／`itemCount`）與
  `QuizManifest`，落於 `.cache/quiz-manifest.json`；跳過條件為「已存在於 `quiz-bank.json` 且
  `skeletonHash` 相符且 `frozen && gatePassed`」，`--force` 一律不跳；復用
  `scripts/lib/checkpoint.ts` 既有的 `hashFile`／`writeFileAtomic`／`readJsonCheckpoint`；
  manifest 遺失／損毀 ⇒ 由現存 `quiz-bank.json` 反推重建，MUST NOT 降級為空 manifest 後覆蓋
  （data-model.md §10、FR-015）
- [ ] T032 [US1] [depends on T028, T029, T030, T031, T008] 新增 `scripts/generate-quiz-bank.ts`：
  CLI（`--force`／`--only <conceptId>,...`；缺 `GEMINI_API_KEY` fail-fast 且不寫任何檔案）；
  **讀 `node.skeletonPath` 並切出 Author Hints 四段、組出 T028 的 `QuizAspectsInput`**（唯一 I/O 點，
  quiz-bank-schema.md §5.5）；對每個 Concept（`ordinalOf` 全序）執行最多 3 輪：Stage A → Stage B →
  結構性 Gate（**MUST 復用 `checkQuizBank`**：把當輪草稿包成單一 Concept 的臨時 `QuizBank` 傳入，
  並只在此階段濾掉 `quiz-count-range`；**MUST NOT 另寫一份 `structuralGate`**，憲章 IX，
  quiz-bank-schema.md §5.2）→ 逐題交叉驗證 → 不一致者針對其
  面向重出一題（換角度）並再驗 → **存活題數 <3 才視為本輪不過**（題數檢查 MUST 在交叉驗證後才
  執行，MUST NOT 顛倒順序，FR-013a）；3 輪皆不過 ⇒ 標記 `needsHumanReview`、**不寫入該
  Concept**、繼續下一個（**MUST 一次列出全部**不足量 Concept，MUST NOT 遇到第一個即中止，
  FR-010a）；批次末呼叫 `runContentGate()`；任一 `needsHumanReview` 或批次末違規 ⇒ 非零
  exit code；MUST NOT 寫入 `concepts/**`／`articles/**`／`schedules/**`／`curriculum/**`
  （quiz-bank-schema.md §5.2、FR-013／FR-013a／FR-010a）。
  **另有三項具名交付**：
  (1) **檔頭註解 MUST 記載交叉驗證的已知限制**——同模型家族可能產生相關性錯誤，此機制**非 100%
  正確性保證**（FR-013 明文要求記錄於產線文件；只寫在 contract 而不寫在程式碼，讀 code 的人看不到）；
  (2) **CLI 說明 MUST 點明「manifest 不追蹤 prompt 版本」**——跳過條件只綁 Skeleton 雜湊（FR-015），
  故 prompt 迭代後**必須**以 `--force`（可搭 `--only`）重跑，否則會全部跳過而看似「改了沒效果」
  （T039、CHK020）；
  (3) **基礎設施失敗 MUST NOT 計入 3 輪內容重生上限**——交叉驗證呼叫的 API 錯誤／逾時／429／
  回應無法解析，一律走 F7 既有的節流與退避重試，耗盡後才視為該題本輪未通過（FR-013、
  quiz-bank-schema.md §4；把網路抖動計入內容輪數會誤觸 `needsHumanReview`）
  > **CHK004／CHK011／CHK020 對應（checklists/prompt-design.md 的低成本修正）**：批次末除了
  > `runContentGate` 之外，本任務 MUST 額外計算並印出 **SC-010 統計**——題數恰為 3 的 Concept
  > 佔比、全庫平均題數（把 quickstart.md §1.2 原本的手動 `node -e` 指令收斂為腳本內建輸出）。
  > 未達標（佔比 ≥40% 或平均 <5）MUST 印出具名警示，但 **MUST NOT** 視為非零 exit 的 CI 失敗
  > 條件——SC-010 是「prompt 設計品質」的觀察訊號，與 `checkQuizBank` 的結構性 Gate 判準
  > 屬不同層級，兩者的失敗語意 MUST 分開回報，避免把「prompt 該調整了」與「資料損毀」混為一談。
- [ ] T033 [P] [US1] `package.json` 新增 `"generate:quiz-bank": "tsx scripts/generate-quiz-bank.ts"`
- [ ] T034 [P] [US1] `.github/workflows/content.yml` 接上新 stage（**三處都要改，缺一即綠燈空跑**）：
  (a) `stage` choice 新增 `quiz-bank` 選項；
  (b) **新增執行 step**「Run Stage 4（generate:quiz-bank）」，比照既有三個 stage 的寫法：
  `if: ${{ inputs.stage == 'quiz-bank' }}`、轉發 `--force`／`--only`、`env: GEMINI_API_KEY`；
  (c) `上傳產線輸出供人工檢視` 的 `path:` 清單追加 `data/quiz-bank.json`。
  另更新 `only` 欄位描述的比對單位說明（`stage=quiz-bank` 填 **Concept id**）。
  > **理由**：既有三個 stage 各自對應一個 `if:` step，只加 choice 而不加 step 會讓該選項跑完
  > 什麼都沒做卻 exit 0——正是該 workflow 自身註解已警告的「綠燈但空跑」失敗模式
- [ ] T035 [P] [US1] 新增 `tests/unit/quiz-generate.test.ts`（以 `GenAiLike` 假物件替身，
  **MUST NOT** 打真實 API）：交叉驗證一致 ⇒ 存活、不一致 ⇒ 針對面向重出且再驗；**替身模擬
  交叉驗證呼叫拋錯／回傳無法解析的內容 ⇒ 走退避重試且 `regenCount` 不增加**（FR-013 的基礎設施
  失敗不計入 3 輪，CHK014）；3 輪耗盡
  （含「驗證後仍 <3 題」）⇒ `needsHumanReview` 且該 Concept 不寫入、其餘 Concept 照常處理、
  整體非零 exit；續跑跳過已通過 Concept（零重複 LLM 呼叫）；`--force` 覆蓋；Skeleton 雜湊
  變更觸發該 Concept 重生、其餘不受影響；manifest 遺失時由現存題庫反推重建（FR-013／FR-013a／
  FR-010a／FR-015、SC-008／SC-009）
- [ ] T036 [P] [US1] 新增 `tests/unit/quiz-prompt-no-numbers.test.ts`（CHK012 對應）：靜態掃描
  `quiz-aspects.ts` 與 `quiz-items.ts` 匯出的 prompt 模板字串，斷言其中不含代表題數或面向數的
  數字樣式（排除程式碼本身的型別標註／縮排／版本號等非 prompt 內容），將 FR-016「MUST NOT
  出現任何題數或面向數字」從人工審閱 prompt 原始碼升級為可自動測試的判準

**Checkpoint**: 至此 US1 的四個子系統（Compiler／Renderer／Pages／產線）皆已實作並通過測試
替身驗證；下一步需要真實 `GEMINI_API_KEY` 產出真實題庫

### 3E. 真實題庫生成與端到端驗收（plan P6；需要 `GEMINI_API_KEY`，人工執行）

- [ ] T037 [US1] 執行 `npm run generate:quiz-bank`（quickstart.md §1）：產出並凍結
  `data/quiz-bank.json`（165 個 Concept、每個 3–10 題），review diff 後 commit（type `feat`，
  scope `011-weekly-quiz`）
- [ ] T038 [US1] 驗證冪等與續跑（quickstart.md §1.1）：二次執行 `npm run generate:quiz-bank`
  全部印出「跳過」且零 LLM 呼叫；`npm run generate:quiz-bank -- --force --only
  <conceptId>` 只重生指定 Concept（SC-009）
- [ ] T039 [US1] 驗證 SC-010（quickstart.md §1.2）：確認凍結後題數恰為 3 的 Concept 佔比 <40%、
  全庫平均 ≥5；未達標則回到 T028／T029 調整 prompt 設計後重跑，**MUST NOT** 以補生成硬湊
  （SC-010）。
  > **重跑 MUST 帶 `--force`（CHK020 的落地）**：manifest 的失效判準只綁 Skeleton 雜湊（FR-015），
  > **改 prompt 不會使任何 Concept 失效**——直接 `npm run generate:quiz-bank` 會全部印出「跳過」、
  > 零 LLM 呼叫、題庫一字不變，看起來像「調了 prompt 也沒用」。故 prompt 迭代後 MUST 以
  > `-- --force`（全庫）或 `-- --force --only <ids>`（未達標子集）重跑；先以少數 Concept 的
  > `--force --only` 驗證 prompt 改動方向再全庫重跑，避免一次燒掉整批免費層額度
- [ ] T040 [US1] 執行 quickstart.md §2 零金鑰驗證：移除 `GEMINI_API_KEY` 後 `npm run build`、
  `npm run typecheck`、`npm test`、`npm run validate:content` 全數成功，`validate:content`
  輸出含 `checkQuizBank` 的檢查結果（SC-006）
- [ ] T041 [US1] 執行 quickstart.md §3 版面驗收：`DRY_RUN=true` 執行 `node dist/main.js`，
  取一個 review Session 確認五段順序、`quizItems.length === reviewConcepts.length`、同一
  `(track, sessionIndex)` 重複編譯 100 次 byte-identical、同一 Concept 三軌 `stem` 互異、
  某 Concept 題庫無題時略過、題庫檔暫時改名後小測段整段省略且推播正常、`PAGES_BASE_URL`
  未設定時連結全省略（US1 Acceptance 1–6、SC-001／SC-002／SC-003／SC-005）
- [ ] T042 [US1] 執行 quickstart.md §4 題庫連結驗收：設定 `PAGES_BASE_URL` 後
  `npm run build:pages`，確認 `pages-dist/quiz/{conceptId}.html`（僅 `unlockedIds` 範圍）存在、
  `<details>` 展開可見正解與完整 5 段 `explanation`、無任何 `<script>` 標籤（US1 Acceptance
  2a、SC-007）
- [ ] T043 [US1] 執行 quickstart.md §5 Gate 攔截驗證：逐一植入 7 個違規樣本（代號前綴／結論句
  超長／單題超預算／簡體字／題數 <3／逐字重複／LeetCode 題號），確認每一項皆被具名擋下且零自動
  截斷，驗完 `git checkout -- data/quiz-bank.json` 還原（SC-008）
- [ ] T044 [US1] 勾選 quickstart.md §6 完成判準 SC-001–SC-010，確認 `docs/spec.md` 與
  `.specify/memory/constitution.md` 對本 Feature 的跨 Feature 決策已全部落地無矛盾（呼應
  Phase 1 T002 的回寫，含 §15 段落順序的更正）

**Checkpoint**: US1 對真實課表與真實題庫端到端可驗收，M5（Pages／週測 milestone）就緒

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T045 [P] 確認既有 `tests/unit/no-llm-in-src.test.ts`／`tests/unit/daily-no-llm-key.test.ts`
  維持通過（不需修改判準對象）：`src/` 不 import `@google/genai`，`daily.yml` 不含
  `GEMINI_API_KEY`（憲章 VIII、data-model.md §11 邊界清單）
- [ ] T046 收尾：建立最終階段 commit，勾選 `tasks.md` 對應項目；確認 `specs/011-weekly-quiz/
  checklists/prompt-design.md` 中標記為「低成本修正」的四項（SC-010 執行者、prompt 靜態掃描、
  題數上限非截斷語意）已透過 T032／T036／T011 的實作與測試收斂；並確認 `/speckit-analyze`
  （2026-08-07）列出的 spec/contract 修訂（`quizItem` 570、reserve 120、FR-011 的 `unlockedIds`
  範圍、`localOrder` 檔名語意）在程式碼中**無殘留舊值**（全域搜尋 `450`／`90`／「0-based」確認）。
  **第二次 `/speckit-analyze`（2026-08-07）的四項亦 MUST 逐一確認已落地**：
  (a) `QuizViolationRule` 含 `quiz-leetcode-id` 且測試涵蓋（含「不得誤攔 `O(n²)`／索引數值」的反向斷言）；
  (b) `mergeSlots()` 已併入 `quizItems`（否則兩格預算形同虛設）；
  (c) `generate-quiz-bank.ts` 的逐題結構檢查是**呼叫 `checkQuizBank`**、無自寫的第二份判準
  （全域搜尋確認無 `structuralGate` 之類的平行實作）；
  (d) prompt 模組未從 `authorHints` 收到 `TypeScript 重點`／`Python 重點` 兩段

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**：無依賴，可立即開始
- **Phase 2 Foundational**：依賴 Phase 1；**阻擋 3A／3C／3D**（3B 的 `buildReviewBlocks` 版面
  插入本身無依賴，但需要 T006 才能真正呼叫 `renderQuizItemBody`，故實務上仍建議在 Phase 2
  後開始）
  - T003 → T004/T005（型別先行）→ T006（依賴 T003）→ T007/T007a → T008（依賴 T004/T005/T006/T007a）→ T009
  - T010–T012 三個測試檔可與 T007–T009 交錯（TDD 風格），但 MUST 在 Phase 2 結束前全綠
- **Phase 3A（Compiler）**：依賴 Phase 2 全部完成（T007／T008／T006）
- **Phase 3B（Renderer）**：僅依賴 T006；可與 3A／3C／3D 平行
- **Phase 3C（Pages）**：依賴 T013（`CompilerDeps.quizBank` 型別就位）
- **Phase 3D（產線）**：依賴 Phase 2 的 T008（`checkQuizBank`，產線批次末靠它把關）
- **Phase 3E（真實生成與端到端）**：依賴 3A／3B／3C／3D 全部完成，且需要 `GEMINI_API_KEY`
- **Phase 4 Polish**：依賴 Phase 1–3 全部完成

### User Story Dependencies

本 Feature 僅一個 User Story（US1），無跨 Story 依賴。3A–3D 四個子系統彼此間僅有 3C 依賴
3A 的型別（T013），其餘可平行推進。

### Within Each Sub-system

- 型別／schema → 純函式 → Gate／整合 → 測試
- 標 `[P]` 的測試檔彼此獨立，可平行撰寫

### Parallel Opportunities

- **Phase 2**：T003／T004／T005 可平行；T010／T011／T012 三個測試檔可平行
- **Phase 3A/3B/3C/3D 整組可平行**（不同人／不同時段），僅 3C 需等 T013
- **Phase 3A 內**：T014 可與 T013 平行；T018／T018a／T019 可平行
- **Phase 3B 內**：T021／T022／T023 可平行（T020 完成後）
- **Phase 3C 內**：T026 可提早以合成 fixture 開發，不必等 T025；T027 需等 T025
- **Phase 3D 內**：T028／T029／T030 可平行；T033／T034 可平行；T035／T036 可平行
- **Phase 3E**：T040–T043 之间除 T038 需先於 T039（先冪等驗證、再統計）外，其餘可依人力交錯
  進行，但**全部需在 T037 之後**（需要真實題庫）

---

## Parallel Example: Phase 2（Foundational）

```bash
# 三個型別/常數檔案互不相干，可同時撰寫：
Task: "新增 ReviewQuizItem 型別於 src/types/lesson.ts"
Task: "新增 QuizItem/QuizBank/QuizViolationRule 型別於 src/compiler/quiz.ts"
Task: "新增 QUIZ_BUDGET_LIMITS 常數於 src/renderer/budget.ts"

# 三個測試檔互不相干：
Task: "新增 tests/unit/quiz-select.test.ts"
Task: "新增 tests/unit/quiz-gate.test.ts"
Task: "新增 tests/unit/quiz-load.test.ts"
```

## Parallel Example: Phase 3（四個子系統）

```bash
Task: "3A Compiler 整合：CompilerDeps 擴充 + compileReview 組裝 quizItems + Gate 接線"
Task: "3B Renderer 版面：buildReviewBlocks 新增小測段"
Task: "3D 題庫產線：三個 prompt 模組 + quiz-checkpoint.ts + generate-quiz-bank.ts"
# 3C 需等 3A 的 T013 完成後才開始
```

---

## Implementation Strategy

### MVP First（US1，本 Feature 唯一 Story）

1. Phase 1 Setup（T001–T002）
2. Phase 2 Foundational（T003–T012）——**關鍵路徑**：`renderQuizItemBody` 與
   `checkQuizBank` 就位前，其餘子系統無法完整測試
3. **STOP and VALIDATE**：Phase 2 全綠才繼續
4. Phase 3A–3D 四個子系統平行推進（以測試替身開發，不等真實題庫）
5. Phase 3E：需要 `GEMINI_API_KEY` 產出真實題庫並完成端到端驗收
6. **STOP and VALIDATE**：quickstart.md §6 完成判準 SC-001–SC-010 全數勾選

### Incremental Delivery

1. Phase 1 + 2 → 選題與 Gate 底座就緒
2. + Phase 3A/3B（替身素材）→ Discord 版面可視覺驗收（`DRY_RUN=true`）
3. + Phase 3C（替身素材）→ Pages 題庫頁可視覺驗收
4. + Phase 3D + 3E → 真實題庫凍結入庫，端到端驗收，M5 milestone 達成

### Parallel Team Strategy

**Phase 2 完成後**：

- 開發者 A：Phase 3A（Compiler 整合）→ 完成後接續 3C（Pages，依賴 3A 的型別）
- 開發者 B：Phase 3B（Renderer 版面，僅依賴 T006，可立即開始）
- 開發者 C：Phase 3D（題庫產線，僅依賴 T008，可與 A/B 同時開始）
- 三者匯合後由任一人執行 Phase 3E（需要 `GEMINI_API_KEY`，建議由能存取金鑰者執行）

---

## Notes

- **commit 節奏**：依 CLAUDE.md，`/speckit-implement` MUST 依 Phase 分段 commit，scope 一律
  `011-weekly-quiz`；`tasks.md` 的勾選併入該段 commit。
- **生成物 MUST NOT 手改**：`data/quiz-bank.json` 一律「改 Skeleton → 重跑 → review diff →
  commit」。
- **本機 MUST NOT 打真實 Discord webhook**：版面驗證一律 `DRY_RUN=true`。
- **測試 MUST NOT 打真實 LLM／webhook**：外部呼叫一律以假物件替身（`GenAiLike`）。
- **`checkQuizBank` 依賴 `renderQuizItemBody`（Phase 2 對 plan.md P1/P3 分工的澄清）**：
  plan.md 原將 Renderer 列為對 P1/P2「無硬依賴」，但那指的是**版面插入邏輯**；`renderQuizItemBody`
  這個純字串組裝函式因被 Gate 共用，實際上是 Phase 2 的一部分，已在本檔的 T006 更正排序。
- **SC-010 與 `checkQuizBank` 是两个不同層級的檢查**（T032 附註）：前者是 prompt 設計品質的
  統計訊號（未達標印警示、不中止 CI），後者是結構性 Gate（未過即擋下入庫、非零 exit）——
  MUST NOT 把兩者的失敗語意混在一起回報。
- **本 Feature 唯一「錯了也不易察覺」的點是 FR-013a 的執行順序**（T032）：題數檢查 MUST 在
  交叉驗證之後才做；顛倒順序會讓「生成恰 3 題 → 題數合格 → 驗證棄 1 題 → 入庫 2 題」靜默通過，
  使 SC-003 的三軌互異失效。
- **checklists/prompt-design.md 的殘留缺口（2026-08-07 由使用者定調：接受風險 + spec 明文承認）**：
  CHK001／006／007／018（敘述性 MUST 缺乏結構性 Gate 對應，如「換考核角度」「鄰居不可搬正題」）
  與 CHK002／013／016／017／019（鄰居缺席／Author Hints 缺段的邊界）**確定不新增結構性 Gate 規則**
  ——補 Gate 需將 Stage A 的面向清單持久化為中繼產物，與 research R6 已定案的續跑粒度衝突，代價
  高於收益。**對應的落地動作已完成**：spec FR-016 已新增「防線完整性的已知限制」與「六段 Author
  Hints／鄰居齊備為現況實測而非不變式；不足時 MUST 落入 FR-010a 既有的『存活題數 <3 ⇒ 具名失敗、
  不入庫』路徑，MUST NOT 另立降級規則」兩條，`docs/spec.md` 亦同步。CHK012（prompt 數字靜態掃描）
  是這批裡唯一可自動化者，已由 T036 覆蓋。實作時若在 T037 的真實生成中觀察到這些情境實際發生，
  MUST 回報。
