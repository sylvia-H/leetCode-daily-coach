# Tasks: Weekly Review 素材、鼓勵語錄池與 review 版面完善（含移除 rest 槽）

**Feature**: `008-review-extras` | **Date**: 2026-08-02

**Input**: Design documents from `specs/008-review-extras/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、
[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**Tests**: **包含測試任務**。spec FR-032 與 `docs/spec.md` §22.2 明文要求本 Feature 的九類邏輯
MUST 有單元測試，plan.md「測試落點」已釘死落點檔名，故測試為交付範圍的一部分而非選配。

**Organization**: 任務依 User Story 分組。但 spec「實作順序約束」與 plan「實作階段與依賴」明訂
**User Story 優先序是價值序、不是實作依賴序**——課表層（P1/P2）為硬性前置，故置於 Phase 2 Foundational。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無未完成依賴）
- **[Story]**: 該任務所屬的 User Story（US1 / US2 / US3）；Setup / Foundational / Polish 無此標籤
- 每一任務都標明確切檔案路徑

## Path Conventions

單一 TypeScript 專案（非 monorepo）：`src/`、`scripts/`、`tests/`、`curriculum/`、`data/`、
`schedules/` 皆位於 repo root。指令一律 **PowerShell**、套件管理 **npm**。

---

## Phase 1: Setup（前置查證與基線）

**Purpose**: 建立可比對的綠燈基線，並完成課表重跑前唯一具時效性的前置查證。

- [X] T001 查證 `state` 分支進度：執行 `git fetch origin state` 與 `git show origin/state:state.json`，確認三軌 `currentSessionIndex` ≤ 3，並把查證結果與日期追加至 `specs/008-review-extras/research.md` R14 的「查證紀錄」表；若 > 3 MUST 先依 `docs/spec.md` §9.2「指定起點」流程換算校正後才進入 Phase 2（contracts/schedule-revision.md §5）
  > **最近一次查證 2026-08-02：三軌 `currentSessionIndex: 1`、`history: []`（分支已重置，從未推播）** ⇒ 前提成立。本任務為**秒級指令**，MUST NOT 誤解為需要等待——「3 天餘裕」指的是 cron 每天 +1、從 1 起算要三天才會越過門檻，不是等待期。若距上次查證未再跨日，重跑一次確認即可收掉本任務。
- [X] T002 建立綠燈基線：於 repo root 依序執行 `npm ci`、`npm run build`、`npm run typecheck`、`npm test`、`npm run validate:schedule`、`npm run validate:content` 全數通過，並記下現行三份 `schedules/*.json` 的 Session 數作為 Phase 2 的比對起點。**F7 凍結基準為 243 / 236 / 291**（實測值，即 T018 比對用的 `db3f594` 上的內容）；spec Clarifications 提到的 208 / 202 / 249 是「已移除 rest 槽、尚未跳過無題槽」的**中間推算值**，不存在於任何 commit，MUST NOT 當成基線

- [X] T002a 提交**規劃期已完成但尚未 commit 的產物**，使 T002 的綠燈基線建立在已提交的樹上：`specs/008-review-extras/**`（新增）、`docs/spec.md`（F8 決策回寫）、`specs/005-lesson-compiler/{contracts/renderer-contract.md,data-model.md}`（parity 測試落點改指向）、`tests/unit/budget-slot-parity.test.ts`（**目前為 untracked**）、`tests/unit/review-fixes.test.ts`（parity 區塊搬出後的殘留註記）、`.specify/feature.json`、`CLAUDE.md`。type 依主要性質分兩個 commit（規格文件 `docs`、測試檔搬移 `test`），scope `008-review-extras`
  > **為何需要獨立任務**：parity 測試搬移（T035 / T044 的前提檔）在規劃期即完成，但 `tests/unit/budget-slot-parity.test.ts` 仍是 untracked——沒有這一步，T019 之後的任一次 `git checkout` / `git stash` 都可能讓它連同 `docs/spec.md` 的 F8 決策回寫一起消失，而**這些內容不在任何一個實作任務的檔案清單裡**。

**Checkpoint**: 基線綠燈且 state 前提成立 → 可開始改動生成器

---

## Phase 2: Foundational（Blocking Prerequisites）

**Purpose**: 課表層變更（rhythm、跳過無題槽、review 選題）＋ 三份課表重跑 ＋ 素材共用底座。
對應 plan 的 **P0 / P1 / P2** 與 spec「實作順序約束」的 **①②**。

**⚠️ CRITICAL**: 本 Phase 完成前，任何 User Story 都不得開始。
T003–T008 的四項生成器變更 **MUST 在同一階段完成**——它們全部改變 `generate-schedule.ts` 的輸出，
分批進行會產生多次全量課表 diff（spec「實作順序約束」①）。

### 2A. 參數層與型別

- [X] T003 [P] 放寬 rhythm schema 於 `src/compiler/schedule-schema.ts`：`rhythm` 由 `.length(7)` 改為 `.min(2).max(14)`；`validateRhythm` 移除「MUST 含至少一個 `rest`」檢查，保留「≥1 concept」「≥1 review」「第一個 practice 晚於第一個 concept」「最後一個 review 不早於最後一個 concept」四條，違規仍以既有 `param-invalid` 回報（FR-014b/FR-014b1、research R1、contracts/schedule-revision.md §1）
  - 補記（審查後修訂）：另補第五條「第一個 review 晚於第一個 concept」——`["review","concept","review"]` 過得了前四條卻生出 `reviewRange = [1, 0]` 的空區間，§2.4 的「reviewRange 恆非空」原本只是對現行三軌 rhythm 的假設，此條升級為參數層強制（contracts/schedule-revision.md §1）
- [X] T004 [P] 新增三個違規 rule 於 `src/types/schedule.ts`：`practice-no-problem`、`review-no-problem`、`review-challenge-duplicate`（皆 warning 級），並把 `rhythm` 的註解由「長度 7；MUST 含 ≥1 review 與 ≥1 rest」改為「長度 2–14；MUST 含 ≥1 concept 與 ≥1 review」（data-model.md §7）
- [X] T005 移除三軌 rest 槽於 `curriculum/track-params.json`：`foundation` / `interviewReady` / `interviewMastery` 的 `rhythm` 各刪去末槽 `"rest"`（7 → 6 槽），`targetLevel` / `maxLevel` / `problemDifficulties` / `challengeDifficulty` 一律不動（FR-014a、data-model.md §5）

### 2B. 生成器變更（同一檔案，MUST 依序）

- [X] T006 於 `src/compiler/schedule-generator.ts` 的 `emitSessions` 加入輪次與槽位追蹤：1-based `weekNumber`（每進入一輪 +1，與該輪實際產出幾筆 Session 無關）、1-based `slotPosition`（rhythm 陣列位置），並累積 `weekProblemIds`（該週 concept Session 實際寫入課表的 `problemIds` 聯集）與 `weekChallengeIds`（該週 challenge 槽選用的題號）（FR-014g1、contracts/schedule-revision.md §2）
- [X] T007 於 `src/compiler/schedule-generator.ts` 實作無題槽跳過：`practice` 的 `unionProblems` 為空、或 `challenge` 的 `selectChallengeProblem` 回傳 undefined 時，MUST 不產生 Session 且不消耗 `sessionIndex`（`continue`），並各自發出具名 warning（`practice-no-problem` / 既有語意調整後的 `challenge-no-problem`），subject MUST 為 `{track}:week-{weekNumber}-slot-{slotPosition}`；已引入 Concept 清單與已用 challenge 題號集合 MUST 照常維持（FR-014e/g/g1、research R2）
- [X] T008 於 `src/compiler/schedule-generator.ts` 新增 `selectReviewProblem` 並於 `review` 槽寫入 `problemIds`：候選池取 `weekProblemIds`（MUST NOT 由 `concept.leetcode` 重算）、排序鍵為「難度 Easy<Medium<Hard，同難度題號升冪」取第一題、對 `weekChallengeIds` 行**軟排除**（排除後空且原池非空 ⇒ 退回原池並 warn `review-challenge-duplicate`）、候選池為空 ⇒ 省略 `problemIds` 並 warn `review-no-problem`（subject 用 `{track}:session-{sessionIndex}`）；`review` 槽 MUST 一律產生（FR-015–FR-018、FR-020、research R3/R4、contracts/schedule-revision.md §3）

### 2C. 課表層測試

- [X] T009 [P] 擴充 `tests/unit/schedule-schema.test.ts`：rhythm 長度 1 與 15 被 schema 擋下、2 與 14 通過、不含 `rest` 的 6 槽 rhythm 通過解析（FR-014b1）
- [X] T010 [P] 擴充 `tests/unit/schedule-rhythm.test.ts`：`validateRhythm` 對不含 `rest` 的 rhythm 不再違規；四條保留約束各自的違規案例仍被擋下（FR-014b）
- [X] T011 [P] 新增 `tests/unit/schedule-skip-empty-slot.test.ts`：practice / challenge 空池不產生 Session 且不消耗 `sessionIndex`（後續 Session 編號連續）、review 空池仍產生、跳過後 `reviewRange` 仍正確涵蓋該週全部 concept Session、warning 的 rule 與 `week-N-slot-M` subject 格式正確且能區分 practice 與 challenge（FR-014e/f/g/g1）
- [X] T012 [P] 新增 `tests/unit/schedule-review-problem.test.ts`：最低難度優先、同難度取最小題號、軟排除同週 challenge、排除後空池退回原池並發 `review-challenge-duplicate`、候選池為空時省略欄位（非 `[]`）並發 `review-no-problem`、review `problemIds` 長度恆為 1 或缺席、`challengeDifficulty` 未被 review 槽使用（FR-016–FR-020a）
- [X] T013 [P] 擴充 `tests/unit/compile-types.test.ts`：直接以 rest 類 `SessionPlan` 驗證 `compileRest` 的編譯路徑（含 `encouragement` 填入），確保三份課表已無 rest Session 後該路徑不退化為死路徑（FR-014c、spec Edge Case）
- [X] T014 [P] 擴充 `tests/unit/renderer.test.ts`：以 `RestLesson` 測試替身驗證 `buildRestBlocks` 的版面與 `encouragement` slot 登記維持不變（FR-014c）
  > **T013 / T014 的覆蓋大部分已存在**（[compile-types.test.ts:20](../../tests/unit/compile-types.test.ts#L20) 已用 rest 類 `SessionPlan` 走 `compileRest`；[renderer.test.ts:155](../../tests/unit/renderer.test.ts#L155) 與 [renderer-types.test.ts:132](../../tests/unit/renderer-types.test.ts#L132) 已測 `buildRestBlocks` 含 `encouragement`）。**本任務 MUST NOT 重寫等價測試**，只需：(a) 確認上述既有斷言在課表已無 rest Session 後仍有效；(b) 在檔案內補上一行註記，說明「三份正式課表已無 rest Session，`validate.ts` 的全課表編譯不再涵蓋此路徑，本檔為其唯一覆蓋來源」，使後續維護者不會誤刪。若確認後無缺口，本任務即以該註記收尾。
- [X] T014a **更新既有測試中因本 Phase 而失效的斷言**（MUST 與 T003 / T007 同批完成，否則 T019 無法在綠燈下 commit）：
  - [tests/unit/schedule-schema.test.ts:45](../../tests/unit/schedule-schema.test.ts#L45) `"rhythm 長度非 7 → param-invalid"` 的 fixture 為 `["concept","review","rest"]`（長度 3），放寬為 `.min(2).max(14)` 後**合法** ⇒ 斷言必失敗。MUST 改寫為長度 **1 與 15** 的違規案例（與 T009 的邊界測試合併，避免兩份重疊），並把測試名稱由「非 7」改為「超出 2–14 範圍」
  - 同檔 `"rhythm 缺 review 或 rest → param-invalid"` 的**名稱**已過時（`rest` 不再必要）；fixture（7 個 concept）仍會因缺 `review` 而違規，故斷言可留，但名稱 MUST 改為「缺 review」
  - [tests/unit/schedule-track.test.ts:155](../../tests/unit/schedule-track.test.ts#L155) `expect(violations.every((v) => v.rule === "challenge-no-problem")).toBe(true)` 在空題庫下會因新增的 `practice-no-problem` / `review-no-problem` 而失敗。MUST 改為斷言「**全部違規皆為 warning 級**」＋「rule 集合 ⊆ 三個已知的無題 rule」——該案例原本要驗的是「無 error」，不是「只有一種 warning」
  > **MUST NOT 藉此放寬任何 Gate 或驗證條件**：以上三處都是 fixture／斷言措辭隨規則變更而更新，**不得**順手降低 `severity` 判定或移除任何既有違規檢查。

### 2D. 課表重跑與驗收（spec「實作順序約束」②）

- [X] T015 執行 `npm run generate:schedule` 重生 `schedules/foundation.json`、`schedules/interview-ready.json`、`schedules/interview-mastery.json`，並保留生成器輸出的摘要與 warning 清單供 T016 比對
- [X] T016 驗收 A1/A3/A5/A6/A7：Session 數為 **198 / 200 / 243**；`npm run validate:schedule` 零 error（拓樸子序列、`review-range-invalid`、`review-coverage-gap`、`forward-dependency`、`duplicate-concept`、`dangling-*`、`session-problem-overflow`）；三份課表中 `problemIds` 為空的 practice / challenge Session 數為 0；每個跳過與每個無題 review 都有對應 warning；每個 review 的 `problemIds` 長度 ∈ {缺席, 1}。數字不符 MUST 先查明課綱／參數／生成器哪一項與預期不同，**MUST NOT 調整生成器去湊數字**（FR-014d、SC-012、contracts/schedule-revision.md §4）
- [X] T017 驗收 A2 determinism：擴充 `tests/unit/schedule-generate.test.ts` 釘死「同輸入連跑兩次 byte-identical」，並實機重跑 `npm run generate:schedule` 後確認 `git diff --stat schedules/` 無輸出（FR-019、SC-005）
- [X] T018 驗收 A4 教學內容不變：以測試（建議置於 `tests/unit/schedule-generate.test.ts` 或新增 `tests/unit/schedule-concept-order.test.ts`）比對新舊三份課表的 `sessions.filter(type === "concept").map(conceptId)` 序列完全相等，舊版取自 F7 基準 commit `db3f594`；**MUST NOT 只靠目視 diff**（SC-005、contracts/schedule-revision.md §4）
- [X] T019 提交 Phase 2A–2D 的階段 commit（`curriculum/track-params.json`、`src/compiler/schedule-schema.ts`、`src/compiler/schedule-generator.ts`、`src/types/schedule.ts`、三份 `schedules/*.json`、對應測試），type 依主要性質（生成器能力增量為 `feat`），scope 為 `008-review-extras`

### 2E. 素材共用底座（阻擋 US1 與 US2）

- [X] T020 [P] 抽出預算常數於 `src/renderer/budget.ts`：新增 `export const MATERIAL_BUDGET_LIMITS = { reflectionQuestion: 300, encouragement: 200 } as const`，`checkBudget` 改用之，移除原字面值 `300` / `200`（FR-029、research R9）
- [X] T021 新增 `src/compiler/material.ts`：`ReflectionBank`（`{ version: 1, byTopic: Record<string, string[]> }`）與 `EncouragementPool`（`{ version: 1, quotes: string[] }`）的 zod strict schema 與型別；陣列 MUST 允許為空（**MUST NOT 用 `min(1)`**，否則與 FR-014 的降級路徑互斥），每則字串 MUST 非空（data-model.md §1/§2、contracts/material-schema.md §1）
- [X] T022 收斂 `src/compiler/lesson.ts` 的 `CompilerDeps`：`reflectionBank?: unknown` / `encouragement?: unknown` 改為 `ReflectionBank` / `EncouragementPool`，刪除 F5 的骨架 `REFLECTION_BANK_SHAPE` / `ENCOURAGEMENT_SHAPE` 改用 `material.ts` 的完整 schema；`loadOptionalMaterial` 的既有語意（缺席 ⇒ `undefined`；壞檔／不符 schema ⇒ throw）**維持不變**（data-model.md §4、contracts/material-schema.md §2）
- [X] T023 [P] 新增 `tests/unit/material-load.test.ts`：三種降級情境（整檔缺席、集合為空、缺某 Topic 的 key）皆回傳 `undefined` 或省略且不失敗；非合法 JSON 與不符 schema 皆 throw 具名錯誤（MUST NOT 降級為缺席）（FR-014、contracts/material-schema.md §2）
- [X] T024 [P] 擴充 `tests/unit/budget.test.ts`：`checkBudget` 的 `reflectionQuestion` / `encouragement` 上限 MUST 取自 `MATERIAL_BUDGET_LIMITS`（斷言方式：以該常數的值組出剛好過關與剛好超標的字串，確認判定隨常數而動，而非隨字面值），且**這兩個 slot** 的上限在 `src/` 與 `scripts/` 內 MUST NOT 出現第二處字面值（FR-029）
  > **MUST NOT 對全檔做 `300` / `200` 的字面掃描**：`src/renderer/budget.ts` 的 `pathFooter` 上限本來就是字面值 `200`（§14.5 的另一個 slot，與素材無關），全檔掃描必然誤判。斷言對象是「這兩個 slot 的上限來源」，不是「檔案裡不准出現這兩個數字」。

**Checkpoint**: 三份新課表已凍結、素材底座就位 → US1 / US2 可平行開始

---

## Phase 3: User Story 1 - 週複習日收到完整三段（Priority: P1）🎯 MVP

**Goal**: review Session 的前三段（本週涵蓋 / Reflection / Challenge）全部長出來，
內容全部來自凍結產物，過程零 LLM。

**Independent Test**: 對三個 Track 各取一個 review Session，以測試替身素材編譯並 render，
確認 embeds 同時含「📚 本週涵蓋」「🤔 Reflection」「🎯 Challenge」三段，且 `reflectionQuestion`
來自 `byTopic[歸屬 Topic]`、`problems` 來自課表 `problemIds`；重複編譯 byte-identical。

> **本 Phase 的測試以 `tests/helpers/lesson.ts` 與 fixture 素材開發**，不等待 Phase 5 的真實素材檔；
> 對真實素材的端到端驗收在 Phase 6。Renderer 的三段版面 F5 已就位（`buildReviewBlocks`），
> 本 Phase 只補測試與缺口，不重寫版面。

### US1 實作

- [X] T025 [US1] 實作 `resolveReviewTopic(schedule, graph, reviewRange)` 於 `src/compiler/material.ts`：取 `reviewRange` 內 `sessionIndex` 最小的 concept Session 所屬 Concept 的 topic，並列時以 §16.1 的 `ordinalOf` 全序決勝，範圍內無 concept Session ⇒ `undefined`；MUST NOT 依賴 JSON 鍵序或雜湊（FR-011、contracts/review-selection.md §2）
- [X] T026 [US1] 實作 `selectReflectionQuestion(input)` 於 `src/compiler/material.ts`：`index = (topicOccurrence + trackOffset) mod pool.length`，`topicOccurrence` 為同 Track 中 `sessionIndex` 更小且歸屬同一 Topic 的 review Session 數（0-based），`trackOffset = TRACK_ORDER.indexOf(track)`；缺 Topic key 或池為空 ⇒ `undefined`。**MUST NOT 改用 `sessionIndex` 取模**（FR-011、research R6、contracts/review-selection.md §3）
- [X] T027 [US1] 於 `src/compiler/lesson.ts` 的 `compileReview` 填入 `reflectionQuestion`：僅在素材存在且 `trim() !== ""` 時設值（MUST NOT 以空字串填充）；review 的 `problems` 一律來自課表 `problemIds` 經 `buildOriginProblems`，**MUST NOT 於 runtime 選題**（FR-010、FR-015、contracts/review-selection.md §5）
- [X] T028 [US1] 實作 `checkMaterials(input)` 於 `src/compiler/material.ts` 的共用與 Reflection 判準。**先宣告回傳型別**：`MaterialViolationRule`（8 個具名 rule 的聯集）與 `MaterialViolation { rule, subject, message }`（data-model.md §1.1）——rule 名稱 MUST 具名到型別層級，**MUST NOT 只寫進 `message`**（否則 SC-007 只能靠子字串比對，改一次措辭即靜默失效）。判準：`material-budget`（取自 `MATERIAL_BUDGET_LIMITS`，code point 計）、`material-traditional-chinese`（沿用 `src/compiler/traditional-chinese.ts` 的同一預設門檻）、`material-duplicate`、`material-unknown-topic`、`material-quota`（配額＝該 Topic 依 T025 規則在三份課表中被選中的最大次數，訊息 MUST 指出需要幾則／實際幾則／哪一個 Track 造成最大值；**`requiredQuota === 0` 的 Topic 缺鍵或空陣列皆為合法，MUST NOT 擋下**——FR-014.3 的明文例外）；素材缺席 ⇒ 回傳空陣列；MUST NOT 自動截斷（FR-002–FR-005、FR-014、FR-028、contracts/material-schema.md §3）
  > **前三項為 Reflection 與 Encouragement 的共用判準，MUST 於本任務一次寫成並同時套用於 `quotes`**（`material-budget` 走 `MATERIAL_BUDGET_LIMITS.encouragement`、`material-traditional-chinese` 同一函式、`material-duplicate` 於 `quotes` 內比對）。T039 只補**語錄池專屬**的兩個 rule（`material-pool-size` / `material-progress-coupled`），**MUST NOT** 重寫共用判準。`material-duplicate` 的比對範圍不同 MUST 分別實作：Reflection 為**跨 Topic 全庫**、語錄池為池內；兩者 MUST NOT 互相比對（一則反思問題與一則語錄字面相同並非違規）。
  > **`material-schema` 不在本任務的實作範圍**：它由既有載入層（`loadOptionalMaterial`）的 throw 實現，`checkMaterials` 收到的已是解析後的型別，**MUST NOT 為它保留永遠不成立的檢查分支**（contracts/material-schema.md §3 註記）。
  > **⚠️ 硬性前置：T015–T019 MUST 已完成。** `material-quota` 的配額是**三份課表的導出值**，
  > 在舊課表（rest 未移除、無題槽未跳過）上計算會得到基於 243/236/291 的錯誤配額，
  > 而且**不會有任何錯誤訊號**——Gate 照樣通過，只是門檻錯了，最終靜默生成不足或過多的問題。
  > 配額 MUST 由 Gate 依當時的三份課表**即時計算**，MUST NOT 寫死為常數（FR-003b）；
  > 現行課綱下的最大次數 4 僅為觀察值。此為本 Feature 唯一「錯了也不會報錯」的失效點。
- [X] T029 [US1] 於 `src/compiler/gate.ts` 新增 `GateRule = "material-invalid"`（**只新增這一個**，8 個細分留在 `MaterialViolationRule`）並在 `runContentGate()` 最前段呼叫 `checkMaterials`，逐筆映射為 `GateViolation`：`subject` MUST 為 `` `${v.rule}@${v.subject}` ``（例：`material-budget@reflection-bank:array[3]`）、`message` 沿用、`track` / `sessionIndex` 留空；**不新增獨立 CLI**（FR-030、research R8、data-model.md §8）

### US1 測試

- [X] T030 [P] [US1] 新增 `tests/unit/material-select.test.ts` 的 Reflection 區塊：不變式 I1–I4（同一 `(track, sessionIndex)` 恆同一則、同 Topic 前 L 次互異、三軌同一出現序數不同則）、跨 Module 的「取最早引入者」決勝、`reviewRange` 無 concept 時回傳 undefined（FR-011、contracts/review-selection.md §3）；並斷言**三軌共用同一份素材輸入**——同一個 `ReflectionBank` / `EncouragementPool` 實例即可驅動三軌的選取，選取函式 MUST NOT 有 per-track 的素材路徑、分支或欄位，Track 差異只來自 `trackOffset`（FR-013、憲章 VI）
- [X] T031 [P] [US1] 新增 `tests/unit/material-gate.test.ts` 的 Reflection 區塊：`material-budget`（超預算）、`material-traditional-chinese`（簡體字）、`material-duplicate`（跨 Topic 重複）、`material-unknown-topic`（未知 Topic key）、`material-quota`（某 Topic 則數低於計算配額）各自被具名擋下且訊息指名根因——**斷言 MUST 比對 `MaterialViolation.rule` 欄位（或 `GateViolation.subject` 的 `{rule}@` 前綴），MUST NOT 用 `message` 的子字串比對**；`material-schema` 則斷言**載入層對壞檔／不符 schema 會 throw**（非 Gate 違規，見 contracts §3 註記）；另 MUST 有一項「`requiredQuota === 0` 的 Topic 缺鍵／空陣列 ⇒ Gate 通過」的案例（FR-014.3 例外）；素材缺席時 Gate 通過（FR-028、SC-007）。**`material-schema` 與 `material-unknown-topic` 只在此以單元測試覆蓋**——quickstart §6 的人工樣本不含這兩項（SC-007）。**配額案例 MUST 以合成的小型課表 fixture 驗證計算式本身**（避免把「4」這個現行觀察值烘焙進測試）；另 MUST 有一項對 `tests/helpers/real-schedule.ts` 真實課表的檢查，斷言配額由重跑後的 198/200/243 導出而非硬編（FR-003b）
  > **實算對照基準（2026-08-02 對 F7 凍結課表算出，供 `material-quota` 除錯用）**——review 的週分組不因 F8 的
  > 移除 rest／跳過無題槽而改變（兩者都不影響哪些 concept 落在同一輪），故**新課表應算出同一組配額**：
  >
  > | 需求 | Topic |
  > | --- | --- |
  > | **4** | `programming-mindset`、`string`、`sliding-window`、`queue`、`linked-list` |
  > | **3** | `array`、`hash-table`、`two-pointer`、`binary-search`、`stack`、`tree`、`heap`、`dfs-bfs`、`dynamic-programming` |
  > | **2** | `graph`、`backtracking` |
  >
  > 三軌各自的最大值為 **Foundation 4 / InterviewReady 3 / InterviewMastery 3**，全域 max = **4**，
  > 生成的 6 則有 50% 餘裕。
  > **本表 MUST NOT 被寫進測試斷言**（FR-003b：配額是導出值，硬編就失去「課綱一改即指名不足處」的作用）——
  > 它的用途是**實作時的對照**：真實課表若算出與此明顯不同的配額，先查是課綱／課表變了，還是
  > `resolveReviewTopic` 的歸屬規則寫錯了。這是本 Feature 唯一「錯了也不會報錯」的失效點，
  > 有一組已知正確答案可比，才不必等到素材生成完才發現門檻算歪。
- [X] T032 [P] [US1] 擴充 `tests/helpers/lesson.ts`：review fixture 支援指定 `reflectionQuestion` 與 `problems`，供 Renderer 與預算測試以純替身開發
- [X] T033 [P] [US1] 擴充 `tests/unit/compile-review.test.ts`：三軌各一個 review Session 編譯後 `reviewConcepts` 非空、`reflectionQuestion` 非空、`problems.length === 1`；素材缺席時欄位省略且不失敗（US1 Acceptance 1、FR-014）
- [X] T034 [P] [US1] 擴充 `tests/unit/renderer.test.ts`：review embed 依序含「📚 本週涵蓋」「🤔 Reflection」「🎯 Challenge」，任一素材缺席時整段省略且不留空欄位或佔位字串（FR-021）
- [X] T035 [P] [US1] 擴充 `tests/unit/budget-slot-parity.test.ts`（**檔案已存在**，見下方搬移說明）：review 版面每一段可變長度文字（`reflectionQuestion`、`problems`）都有對應登記的 budget slot，並通過逐區塊上限與單則 ≤ 5,500 的總量檢查（FR-024、FR-025、US1 Acceptance 4）
  > **`📚 本週涵蓋`（`reviewConcepts`）MUST NOT 被要求登記 slot**：它是 `docs/spec.md` §14.5 明文例外的「由 Compiler 依課表生成的清單」，由 embed field value ≤1024 與總長兜底（FR-024、contracts/review-selection.md §6）。既有測試的 `EXEMPT_FIELDS` 已釘死此例外，**MUST NOT 移除**。
  > **檔案來源（已於 F8 規劃期完成，非實作任務）**：`tests/unit/budget-slot-parity.test.ts` 由 `tests/unit/review-fixes.test.ts` **純搬移**而來（行為未變更）——該不變式涵蓋全部版面類型、屬全域不變式，不該住在「某一輪 findings 的回歸測試」檔內。`docs/spec.md` §14.5 與 `specs/005-lesson-compiler` 的兩份契約已同步改指向本檔。**本 Feature 的實作只在其上追加斷言，MUST NOT 再搬動它。**

**Checkpoint**: US1 的三段在測試替身素材下完整長出且通過預算檢查

---

## Phase 4: User Story 2 - 週複習日結尾收到一句輪替的鼓勵（Priority: P2）

**Goal**: review 版面結尾長出「💬 一句話」，逐個 review 輪替、決定性、三軌互異。

**Independent Test**: 對同一 Track 連續 30 個 review Session 編譯，取得 30 則互不相同的鼓勵語；
同一 `(track, sessionIndex)` 重複編譯恆同一則；素材檔缺席時該段自動省略且流程不失敗。

**Dependency**: 與 US1 無硬依賴（素材檔與選取邏輯完全獨立）；
僅 `checkMaterials` 與 `buildReviewBlocks` 與 US1 同檔，實作時需注意併入順序。

> **⚡ 版面子集（T036 / T040 / T043 / T044）無任何硬依賴，MUST NOT 等 Phase 2 或 Phase 5。**
> Renderer 是 `Lesson` 的 stateless 純函式（憲章 XI）——它讀不到課表、也讀不到素材檔，
> 一切資料由 Compiler 放進 `Lesson`。用 `tests/helpers/lesson.ts` 的測試替身即可完整開發與驗收，
> **可與 Phase 2 的課表重跑、Phase 3 的 T028 配額 Gate 同時進行**（plan P3b）。
> 唯一需要等待的是 Phase 6 對真實課表的端到端快照（T062）。
> 串成一條線只會白白拉長工期，不會換到任何正確性。
>
> 素材端子集（T037 / T038 / T039 / T041 / T042 / T045）則依賴 Phase 2E 的共用底座（T021 / T022）。

### US2 實作

- [X] T036 [US2] 於 `src/types/lesson.ts` 為 `ReviewLesson` 新增 `encouragement?: string`；`RestLesson.encouragement` 與 `SessionType` 的 `"rest"` **保留不刪**（FR-010、FR-014c、data-model.md §3）
- [X] T037 [US2] 實作 `reviewOrdinalOf(schedule, sessionIndex)` 與 `selectEncouragement(input)` 於 `src/compiler/material.ts`：`index = (reviewOrdinal + trackOffset) mod quotes.length`，`reviewOrdinal` 為該 Track 全部 review Session 依 `sessionIndex` 升冪的 0-based 序位；池為空 ⇒ `undefined`。**MUST NOT 改用 `sessionIndex` 對池大小取模**（FR-012、research R5、contracts/review-selection.md §4）
- [X] T038 [US2] 於 `src/compiler/lesson.ts` 的 `compileReview` 填入 `encouragement`（同 T027 的空字串處置）；`compileRest` 既有的 `encouragement` 填入路徑 MUST 保留不動（FR-010、FR-014c）
- [X] T039 [US2] 於 `src/compiler/material.ts` 的 `checkMaterials` 補上 Encouragement **專屬**判準：`material-pool-size`（`quotes.length < 30`）與 `material-progress-coupled`（命中 `http(s)://`／markdown 連結語法／`LeetCode` 不分大小寫／`#\d+` 題號樣式）；**MUST NOT 比對 Concept id 或 title 清單**（FR-007、FR-008、research R13）
  > **共用判準（`material-budget` / `material-traditional-chinese` / `material-duplicate`）已由 T028 一併套用於 `quotes`，本任務 MUST NOT 重寫**；本任務只加上表列的兩個語錄池專屬 rule。若 T028 尚未完成，本任務 MUST 等它——兩者同檔同函式。
- [X] T040 [US2] 於 `src/renderer/discord.ts` 的 `buildReviewBlocks` 補上「💬 一句話」field：MUST 為**最後一段**（Challenge 之後），MUST 同時登記 `slots.encouragement`，缺席即整段省略；`buildRestBlocks` 不變；Renderer 維持 stateless 純函式，MUST NOT 讀素材檔（FR-021–FR-023、contracts/review-selection.md §6）

### US2 測試

- [X] T041 [P] [US2] 擴充 `tests/unit/material-select.test.ts` 的鼓勵語區塊：不變式 I5–I9（同一輸入恆同一則、連續 N 個互異、連續 30 個互異、相鄰不重複、三軌同一 `reviewOrdinal` 互異）（FR-012、SC-002）
- [X] T042 [P] [US2] 擴充 `tests/unit/material-gate.test.ts`：語錄池 29 則被 `material-pool-size` 擋下、含 URL／`LeetCode`／`#123` 的語錄被 `material-progress-coupled` 擋下、超 200 字元被 `material-budget` 擋下、重複語錄被 `material-duplicate` 擋下（FR-028、SC-007）
- [X] T043 [P] [US2] 擴充 `tests/unit/renderer.test.ts`：review embed 四段順序為「📚 本週涵蓋 → 🤔 Reflection → 🎯 Challenge → 💬 一句話」，鼓勵語 MUST NOT 出現在 Reflection 與 Challenge 之間；`encouragement` 缺席時該段省略（FR-022、US2 Acceptance 5）
- [X] T044 [P] [US2] 擴充 `tests/unit/budget-slot-parity.test.ts`：`encouragement` 亦登記對應 slot，並驗證四段合計（300 + 350×1 + 200 + 涵蓋清單）仍 ≤ 5,500（FR-024、US2 Acceptance 4）
- [X] T045 [P] [US2] 擴充 `tests/unit/compile-review.test.ts`：`encouragement` 非空且存在於語錄池中；同一 Track 連續 N 個 review 取得 N 則互異（US2 Acceptance 1–3）

**Checkpoint**: US1 與 US2 皆可獨立通過測試，review 四段版面在替身素材下完整

---

## Phase 5: User Story 3 - 素材可重生成、可驗證、且不污染每日 runtime（Priority: P3）

**Goal**: 素材由 build-time 腳本生成、過 Gate、凍結入庫；重跑冪等、中斷可續、零 runtime LLM。
本 Phase 產出 US1 / US2 消費的**真實素材檔**。

**Independent Test**: 無 `GEMINI_API_KEY` 的環境下 `DRY_RUN=true` 流程與 CI Gate 皆成功；
帶 key 重跑腳本時已凍結批次 100% 被跳過、`concepts/**` 與 `articles/**` 檔案雜湊零變更。

**Dependency**: 依賴 Phase 3（要先有 `checkMaterials` 與 `runContentGate` 接線才知道素材是否通過）。

### US3 產線基礎設施

- [X] T046 [P] [US3] 於 `scripts/lib/checkpoint.ts` 把原子寫入（`.tmp` + `rename`）與讀檔抽為不綁 `Manifest` 型別的 helper 並匯出，既有 `Manifest` API 行為 MUST 不變（research R11、Assumptions）
- [X] T047 [US3] 把 `stripJsonFence` 與 `parseSelfCheckResponse` 由 `scripts/generate-content.ts` 搬至 `scripts/lib/prompts/self-check.ts`（純搬移、無行為變更）（research R10）
- [X] T048 [US3] 於 `scripts/generate-content.ts` 改為 import 搬移後的 helper 並 **re-export** 以維持既有測試相容（research R10）
- [X] T049 [US3] 於 `scripts/lib/prompts/self-check.ts` 新增 `buildReflectionSelfCheckPrompt(input)`，rubric **恰為兩項**：(1) 批內是否有任兩則在問同一件事（僅措辭不同）；(2) 是否有任一則可用單一字詞或「是／否」回答；**MUST NOT 納入「切題性」**；回應型別沿用既有 `SelfCheckResponse`（FR-028a/b、contracts/material-schema.md §5.3）
- [X] T050 [P] [US3] 新增 `scripts/lib/prompts/reflection-bank.ts`：每 Topic 6 則的生成 prompt 與 `ResponseSchema` 字面值；MUST 為純字串組裝（MUST NOT 做 I/O、MUST NOT runtime import `@google/genai`）；prompt MUST 明確約束繁體中文、≤300 字元、開放式提問（FR-003、FR-004）
- [X] T051 [P] [US3] 新增 `scripts/lib/prompts/encouragement.ts`：36 則語錄的生成 prompt 與 `ResponseSchema`；prompt MUST 明確約束繁體中文、≤200 字元、不得含連結／平台名／題號／Concept 綁定（FR-007、FR-008、research R12）
- [X] T052 [US3] 新增 `scripts/lib/material-checkpoint.ts`：`MaterialBatchCheckpoint` / `MaterialManifest`（key = `topicId` 或字面值 `"encouragement"`），落於 `.cache/material-manifest.json`，跳過條件為「已存在於素材檔 且 `inputHash` 相符 且 `frozen && gatePassed`」，`--force` 一律不跳；MUST 復用 T046 的原子寫入；manifest 遺失／損毀 ⇒ 由現存素材檔反推重建，MUST NOT 降級為空 manifest 後覆蓋素材（FR-026、research R11、data-model.md §9）
- [X] T053 [US3] 新增 `scripts/generate-materials.ts`：CLI 支援 `--force` / `--only <topicId|encouragement>,...` / `--stage reflection|encouragement`；Stage A 逐 Topic 生成（per-batch Gate：schema／預算／繁中／批內去重／則數 == 6 → self-check → 最多 3 次重生 → 3 次不過標記 `needsHumanReview` 且**不寫入該批**、不中斷其餘 Topic）；Stage B 語錄池單批 36 則（**不跑 self-check**）；批次末呼叫 `runContentGate()`；素材以 canonical 形式序列化（`JSON.stringify(obj, null, 2) + "\n"`，`byTopic` key 依 `modules.json` 的 Module → Topic 宣告序）；缺 `GEMINI_API_KEY` MUST fail-fast 且不寫任何檔案；任一 `needsHumanReview` 或批次末違規 ⇒ 非零 exit code；MUST 輸出被跳過的批次清單；MUST NOT 寫入 `concepts/**`、`articles/**`、`schedules/**`、`curriculum/**`（FR-009a、FR-026、FR-026a、FR-027、FR-028a、contracts/material-schema.md §5）
- [X] T054 [P] [US3] 於 `package.json` 新增 `"generate:materials": "tsx scripts/generate-materials.ts"`
- [X] T055 [P] [US3] 於 `.github/workflows/content.yml` 的 `stage` choice 新增 `materials` 選項並接上 `npm run generate:materials`；`GEMINI_API_KEY` 只出現於此手動觸發的 workflow（FR-031）

### US3 測試與素材凍結

- [X] T056 [P] [US3] 新增 `tests/unit/material-generate.test.ts`（以 `GenAiLike` 假物件替身，MUST NOT 打真實 API）：self-check 解析失敗算一次重生且不造成 unhandled rejection、3 次不過標記 `needsHumanReview` 且該批不寫入、其餘批次照常完成、整體以非零 exit code 收尾；續跑跳過已通過批次（零重複呼叫）、`--force` 覆蓋、`--only` 只跑指定批次（FR-026、FR-028a/b、SC-008、SC-011）；並驗證 **canonical 序列化**（FR-009a）：對合成的 `ReflectionBank` / `EncouragementPool` 呼叫序列化路徑，斷言輸出為 2-space 縮排、檔尾恰一個 `\n`、`byTopic` 的 key 序等於 `modules.json` 的「Module 宣告序 → Module 內 Topic 宣告序」（**MUST NOT 為字典序或插入序**），且同一輸入連跑兩次 byte-identical
  > **此項不是形式主義**：SC-008 的「重跑零 diff」與 FR-026 的「不覆蓋未變更產物」都以 canonical 序列化為前提——鍵序一漂移，每次重跑都會產生假 diff，兩者皆無從觀測。
- [X] T057 [US3] 帶 `GEMINI_API_KEY` 執行 `npm run generate:materials`，產出並凍結 `data/reflection-bank.json`（16 Topic × 6 則）與 `data/encouragement.json`（36 則），review diff 後 commit（type `feat`、scope `008-review-extras`）
- [X] T058 [US3] 驗證 SC-008 與 SC-009：再次執行 `npm run generate:materials` 確認全部批次印出「跳過」且 `git status` 對 `data/` 乾淨；`git status --porcelain -- concepts/ articles/` 無輸出（SC-008、SC-009、quickstart §3.1/§3.2）
  > **SC-009 有兩個查驗，本任務只涵蓋第一個**（產線執行後 worktree 乾淨）。第二個——「Feature 併入前，該分支相對於 F7 基準對這兩個目錄的 diff 為空」——落在 T065，見該任務。兩者不可互相取代：worktree 乾淨只證明「這一次執行沒改」，不證明「整個 Feature 期間沒改」。

**Checkpoint**: 真實素材已凍結入庫，三個 User Story 全部可對真實資料驗收

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 對真實課表與真實素材的端到端驗收，以及 quickstart 的完整走查。

- [X] T059 [P] 擴充 `tests/unit/compile-determinism.test.ts`：同一 `(track, sessionIndex)` 的 review Session 重複編譯並 render 100 次，embeds byte-identical（含同一則 Reflection、同一則鼓勵語、同一題 Challenge）（SC-004、US1 Acceptance 2）
- [X] T060 [P] 新增對真實課表與真實素材的驗證（建議置於 `tests/unit/material-select.test.ts`，沿用 `tests/helpers/real-schedule.ts`）：三軌各自連續 30 個 review 的鼓勵語互異（SC-002）；單一 Track 內同一則 Reflection 問題被選中次數為 1（SC-010）；三軌 review Session 全部具備非空 `reflectionQuestion` 與 `encouragement`
- [X] T061 執行 quickstart §4 零金鑰驗證：移除 `GEMINI_API_KEY` 後 `npm run build`、`npm run typecheck`、`npm test`、`npm run validate:curriculum`、`npm run validate:problem-bank`、`npm run validate:schedule`、`npm run validate:content` 全數通過，且 `validate:content` 印出 **641 筆 Lesson**（SC-003、SC-006、FR-030）
- [X] T062 執行 quickstart §5 版面驗收：`DRY_RUN=true` 執行 `node dist/main.js`，挑一個 review Session 確認 embed 依序含四段且鼓勵語在最後；並執行 §5.2 的素材檔改名降級測試（改名後 `validate:content` 仍通過、段落省略）（US1/US2 Independent Test、FR-014）
- [X] T063 執行 quickstart §6 Gate 攔截驗證：逐一植入六個違規樣本（Reflection >300 ⇒ `material-budget`、語錄含簡體字 ⇒ `material-traditional-chinese`、跨 Topic 重複 ⇒ `material-duplicate`、某 Topic 刪至 1 則 ⇒ `material-quota`、語錄含 URL ⇒ `material-progress-coupled`、語錄池刪至 29 則 ⇒ `material-pool-size`），確認每一項都被 `material-invalid` 具名擋下且零自動截斷，驗完 `git checkout -- data/` 還原。**這六個樣本涵蓋 8 個 rule 中的 6 個**，另兩個（`material-schema` / `material-unknown-topic`）由 T031 的單元測試覆蓋（SC-007）
- [X] T064 確認 SC-001 與 SC-012 的可追溯性：對三份課表統計 Challenge 段省略的 review Session，確認 100% 落在**該週涵蓋 Concept 全無題目**的情境，且每一筆都有對應具名 warning；`problemIds` 為空的 practice / challenge Session 數為 0（SC-001、SC-012）
  > **預期落點（2026-08-02 對 F7 課表實算，review 數不因 F8 修訂而變，故對新課表同樣成立）**：
  > Foundation **4** 筆（w1/w2/w3 `programming-mindset` ＋ **w28 `queue`**）、InterviewReady **3** 筆
  > （w1/w2 ＋ **w21 `stack`+`queue`**）、InterviewMastery **3** 筆（w1/w2 ＋ **w28 `tree`**）。
  > **判準是「該週 Concept 是否全部無題」，MUST NOT 用「是否落在課程開頭」代替**——全課綱 27 個
  > `leetcode: []` 純觀念 Concept 中有 17 個散在 `programming-mindset` 之外，上列三筆課程中段的省略
  > **是合法的**，用開頭與否判斷會把它們誤判為缺陷（SC-001 的落點表）。
- [X] T065 收尾：勾選 [quickstart.md](./quickstart.md) §7 的 SC-001–SC-012 完成判準，確認 `docs/spec.md` 與 `.specify/memory/constitution.md` 的跨 Feature 決策已全部落地無矛盾，並建立最終階段 commit。**MUST 併入 SC-009 的第二個查驗**（T058 未涵蓋）：執行 `git diff --stat db3f594 -- concepts/ articles/` 確認**無輸出**，證明整個 Feature 期間相對 F7 基準對這兩個目錄零變更（SC-009）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup**：無依賴，可立即開始。T001 具時效性，MUST 在 Phase 2D 之前重新執行過。
  T002a MUST 在 T002 之前（讓綠燈基線建立在已提交的樹上）。
- **Phase 2 Foundational**：依賴 Phase 1；**阻擋全部 User Story**。
  - 2A → 2B → 2D 為硬序（參數與 schema 先放寬，生成器才跑得動；生成器改完才重跑課表）
  - 2C 可與 2B 交錯（TDD 風格），但 MUST 在 2D 之前全綠
  - 2E 與 2A–2D 無硬依賴，**可平行進行**
- **Phase 3 US1**：素材端（T025–T029、T030–T031、T033）依賴 Phase 2 全部完成
  ——**T028 的 `material-quota` 尤其 MUST 在 T015–T019 之後**（配額是三份新課表的導出值，
  在舊課表上算會靜默得到錯誤門檻）。版面端（T032 / T034 / T035）無硬依賴，見下。
- **Phase 4 US2**：素材端（T037–T039、T041/T042/T045）依賴 Phase 2E 的共用底座；
  版面端（T036 / T040 / T043 / T044）無硬依賴；**與 US1 無硬依賴，可平行**
- **版面任務（跨 US1/US2）**：T032、T034、T035、T036、T040、T043、T044 **不依賴課表重跑，
  也不依賴素材檔**，可自 Phase 2 起隨時並行推進（Renderer 為純函式，以測試替身開發）
- **Phase 5 US3**：依賴 Phase 3（`checkMaterials` 與 Gate 接線必須先存在）
- **Phase 6 Polish**：依賴 Phase 2–5 全部完成

### User Story Dependencies

- **US1（P1）**：Phase 2 後即可開始；不依賴 US2 / US3 的程式碼。其**真實素材**由 Phase 5 提供，
  故 Phase 3 內以 fixture 開發與測試，真實資料驗收落在 Phase 6。
- **US2（P2）**：Phase 2 後即可開始；素材檔與選取邏輯完全獨立於 US1。與 US1 共用
  `src/compiler/material.ts`、`src/compiler/lesson.ts`、`src/renderer/discord.ts`、
  `tests/unit/renderer.test.ts` 四個檔案，同時進行時需注意併入順序（非邏輯依賴）。
- **US3（P3）**：依賴 US1 的 Gate；產出 US1 / US2 消費的真實素材。

### Within Each User Story

- 純函式（`material.ts`）→ Compiler 填入 → Renderer 版面 → 測試
- 測試檔標 [P] 者彼此獨立，可平行撰寫

### Parallel Opportunities

- **Phase 2A**：T003、T004 可平行（不同檔案）
- **Phase 2C**：T009–T014 六個測試檔全部可平行；**T014a 不可平行**——它改的是 T009 同一個檔案（`schedule-schema.test.ts`）與 T007 的行為結果，MUST 在 T003 / T007 落地後、T019 之前完成
- **Phase 2E**：T020、T023、T024 可平行；T021 → T022 為序
- **Phase 2E 整組可與 2A–2D 平行**（不同檔案、無共用符號）
- **Phase 3 測試**：T030–T035 六項可平行
- **Phase 4 測試**：T041–T045 五項可平行
- **Phase 5**：T046、T050、T051 可平行；T054、T055、T056 可平行
- **版面任務可與 Phase 2 同時開跑**：T032、T034、T035、T036、T040、T043、T044 用
  `tests/helpers/lesson.ts` 替身開發，不等課表重跑、不等素材生成
- **Phase 3 與 Phase 4 可由不同人平行推進**（注意四個共用檔案的併入順序）
- **Phase 6**：T059、T060 可平行；T061–T064 為人工走查，建議依序

---

## Parallel Example: Phase 2C（課表層測試）

```bash
# 六個測試檔互不相干，可同時撰寫：
Task: "擴充 tests/unit/schedule-schema.test.ts 的 rhythm 長度邊界"
Task: "擴充 tests/unit/schedule-rhythm.test.ts 的 validateRhythm 放寬"
Task: "新增 tests/unit/schedule-skip-empty-slot.test.ts"
Task: "新增 tests/unit/schedule-review-problem.test.ts"
Task: "擴充 tests/unit/compile-types.test.ts 的 compileRest 覆蓋"
Task: "擴充 tests/unit/renderer.test.ts 的 buildRestBlocks 覆蓋"
```

> **T014a 不在上列**：它更新的是 `schedule-schema.test.ts`（與 T009 同檔）與 `schedule-track.test.ts`
> 中因 T003 / T007 而失效的既有斷言，**MUST 序列化執行**，MUST NOT 與 T009 同時改同一個檔案。

## Parallel Example: Phase 3（US1 測試）

```bash
Task: "新增 tests/unit/material-select.test.ts 的 Reflection 不變式 I1–I4"
Task: "新增 tests/unit/material-gate.test.ts 的 Reflection 違規（material-budget / -traditional-chinese / -duplicate / -unknown-topic / -quota / -schema）"
Task: "擴充 tests/helpers/lesson.ts 的 review fixture"
Task: "擴充 tests/unit/compile-review.test.ts"
Task: "擴充 tests/unit/renderer.test.ts 的三段順序"
Task: "擴充 tests/unit/budget-slot-parity.test.ts（既有全域 parity 專檔）"
```

---

## Implementation Strategy

### MVP First（US1）

1. Phase 1 Setup（T001–T002a）——T001 的 state 查證 MUST 執行並記錄，但**不是關鍵路徑**：`state` 分支已於 2026-08-02 重置（三軌 index 1、`history: []`、從未推播），越過門檻的最壞後果只是「重看一課」，且自重置起有 3 天餘裕（research R14 查證紀錄）
2. Phase 2 Foundational（T003–T024，含 T014a）——四項生成器變更同批完成，課表一次重跑；
   **T014a 的既有測試斷言更新 MUST 與生成器變更同批**，否則 T019 的階段 commit 會停在紅燈
3. **STOP and VALIDATE**：T016–T018 的 A1–A7 驗收全綠才繼續
4. Phase 3 US1（T025–T035）
5. Phase 5 的 T050 + T053 + T057 的 Reflection 半邊（`--stage reflection`）——US1 需要真實 `data/reflection-bank.json` 才能端到端驗收
6. **STOP and VALIDATE**：quickstart §5.1 前兩列

> **MVP 的最小範圍是「Phase 1 + Phase 2 + Phase 3 + Reflection 素材生成」**。
> 三段中的 Review 與 Challenge 在 Phase 2 結束時即成立，Reflection 需要素材檔才完整。

### Incremental Delivery

1. Phase 1 + 2 → 課表層就緒（review 已有 Challenge、rest 已移除、無空槽）
2. + Phase 3 → US1 完整（review 前三段）→ 可推播驗收
3. + Phase 4 → US2 完整（四段版面）
4. + Phase 5 → US3 完整（素材可重生成、可驗證）
5. + Phase 6 → M4 驗收

### Parallel Team Strategy

**Phase 2 進行期間**（不必等它完成）：

- 開發者 B 可立即開始版面端 T036 → T040 → T043 → T044（純函式 + 測試替身，零依賴）

**Phase 2 完成後**：

- 開發者 A：Phase 3 素材端（T025 → T026 → T027 → T028 → T029）
- 開發者 B：Phase 4 素材端（T037 → T038 → T039）＋ 回頭補 US1 的版面測試 T032/T034/T035
- 兩者匯合後由任一人推進 Phase 5（US3 依賴 US1 的 Gate）

---

## Notes

- **commit 節奏**：依 CLAUDE.md，`/speckit-implement` MUST 依 Phase / User Story 分段 commit，
  scope 一律 `008-review-extras`；`tasks.md` 的勾選併入該段 commit。
- **生成物 MUST NOT 手改**：`schedules/**` 與 `data/**` 一律「改輸入 → 重跑 → review diff → commit」。
- **本機 MUST NOT 打真實 Discord webhook**：版面驗證一律 `DRY_RUN=true`。
- **測試 MUST NOT 打真實 LLM / webhook**：外部呼叫一律以假物件替身（`GenAiLike`、`fetch-recorder`）。
- **課表長度是導出值**：198 / 200 / 243 是驗收比對用的預期輸出，不符時查根因，
  MUST NOT 調整生成器去湊數字。
- **`rest` 的測試不是形式主義**：三份課表已無 rest Session，`validate.ts` 不再涵蓋
  `compileRest` / `buildRestBlocks`，T013 / T014 是它們唯一的覆蓋來源。
  （該覆蓋**大部分已存在於既有測試**，T013 / T014 以「確認 + 留下不可誤刪的註記」收尾，
  MUST NOT 重寫等價測試。）
- **課表層變更會弄紅兩個既有測試**：`schedule-schema.test.ts` 的「rhythm 長度非 7」與
  `schedule-track.test.ts` 的「全部 warning 都是 `challenge-no-problem`」在 T003 / T007 之後必然失敗。
  T014a 專責更新這兩處的 fixture 與斷言措辭，**MUST NOT 藉此放寬任何 Gate 或驗證條件**。
- **本 Feature 唯一「錯了也不會報錯」的點是 T028 的 `material-quota`**：配額在舊課表上算
  一樣會通過 Gate，只是門檻錯了。故 T028 對 T015–T019 的依賴是硬性的，不是排程偏好。
- **版面任務不排在素材之後**：Renderer 是純函式，用測試替身即可完整驗收；
  把它串在課表重跑或素材生成之後只會拉長工期，換不到任何正確性（plan P3b）。
