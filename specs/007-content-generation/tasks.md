# Tasks: 兩階段內容產線（全量課綱起草＋大綱定稿 → 全文展開）＋品質 Gate＋節流／續跑

**Input**: Design documents from `specs/007-content-generation/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、
[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**Tests**: 本 Feature **明確要求測試**——憲章 §22.2 將「DAG 驗證、課表生成器 determinism、教材品質 Gate、
產線韌性（節流／退避／續跑／冪等）」列為關鍵邏輯 MUST 有單元測試；外部呼叫（Gemini、metadata `fetch`）以
mock 測；TS/Python 教材程式碼實測只在 Gate/CI 跑。故純函式的單元測試為**必要**，非選用。

**Organization**: 任務依 User Story 分組。US1→US2→US3 為 M3 內容交付的循序管線（US2 依賴 US1 凍結產物、
US3 依賴 US1 凍結 DAG）；US4（韌性）的共用 lib 置於 Foundational、其整合與行為測試在 US1/US2 腳本成形後進行；
US5（CI）為 P2。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無未完成相依）
- **[Story]**: 對應 spec.md 的 User Story（US1–US5）
- 每筆任務均含確切檔案路徑

## Path Conventions

單一專案結構（plan.md §Project Structure）：`scripts/`（含 `scripts/lib/`、`scripts/lib/prompts/`）、
`src/compiler/`、`tests/unit/`、`curriculum/`、`concepts/`、`articles/`、`schedules/`、`data/`、
`.github/workflows/`、`.cache/`（gitignored）。

---

## ⚠️ 本 Feature 的實作紀律（開工前必讀）

1. **純度界線（憲章 VIII）**：`@google/genai` 與一切 LLM 呼叫 / `process.exit` / 檔案寫入 **只允許在
   `scripts/`**；`src/` MUST NOT import LLM SDK（T010 掃描測試守住）。純內容檢查（繁中判準、字數）放
   `src/compiler/` 供 CI 與生成期共用；程式碼實測抽為 `scripts/run-code-blocks.ts` 供兩處共用（憲章 IX）。
2. **重用既有實作，不建平行（憲章 IX）**：Stage 1 結構 Gate 重用 F2 `src/compiler/curriculum.ts` + `schema.ts`；
   Stage 2 完整編譯 / render / 預算重用 F5 `runContentGate` / `src/renderer`。**MUST NOT 為產線另寫解析或版面。**
3. **事實不由 LLM 生成（憲章 XIV / §5）**：題號 / slug / title / url / difficulty 一律由 `populate-problem-bank.ts`
   從權威來源帶入；LLM 只提候選題號、只生成教學文字。
4. **本機 MUST NOT 打真實 LLM/Discord**：單元測試一律 mock Gemini SDK 與 metadata `fetch`；教材程式碼實測用
   暫存目錄，用後清理、不寫 repo。
5. **凍結流程（憲章 XIII / XVII）**：唯一常態人工介入是 outline.md 定稿（T020）；產物過 Gate 才凍結；
   `--force` 為唯一覆蓋路徑。生成物 MUST NOT 手改。
6. **`/speckit-implement` 依 Phase / User Story 分段 commit**（掛 `feat(007-content-generation): …` scope；
   type 依該段主要性質：新增能力用 `feat`、鷹架/相依用 `build`、CI 用 `ci`、純重跑產物用 `chore`）。

---

## Phase 1: Setup（相依與鷹架）

**Purpose**: 建立產線腳本的相依、npm scripts 與目錄鷹架

- [X] T001 於 [package.json](../../package.json) 新增 `@google/genai` 至 `devDependencies`，並註冊 npm scripts：`generate:curriculum`、`generate:content`、`populate:problem-bank`、`gate:code`（分別對應 `scripts/generate-curriculum.ts`、`generate-content.ts`、`populate-problem-bank.ts`、`run-code-blocks.ts`，以 `tsx` 執行）
- [X] T002 [P] 於 [.gitignore](../../.gitignore) 加入 `.cache/`（checkpoint manifest 為 gitignored 產線快取，非教材產物）
- [X] T003 [P] 建立目錄鷹架：`scripts/lib/`、`scripts/lib/prompts/`（放 Stage 1 / Stage 2 / self-check prompt 模板）
- [X] T004 確認 `tsconfig` / `vitest.config.ts` 的 include 涵蓋 `scripts/**` 與 `tests/unit/**`（typecheck 與測試可見新檔）；缺則補設定

---

## Phase 2: Foundational（阻斷所有 Story 的共用基礎）

**Purpose**: 所有 Story 都依賴的 LLM 呼叫層、節流/退避、checkpoint、憲章守門測試

**⚠️ CRITICAL**: 本階段完成前，US1/US2 的腳本無法安全呼叫 LLM

- [X] T005 實作 [scripts/lib/throttle.ts](../../scripts/lib/throttle.ts)：RPM 節流（間隔＝60000/RPM，預設 RPM=10、可環境變數覆寫）＋ 429/5xx/暫時性錯誤指數退避＋全抖動 jitter（base 1s、上限如 60s、重試上限預設 6）；非暫時性 4xx MUST 直接失敗；時鐘/sleep 以注入參數表示（research R3、FR-017/018）
- [X] T006 [P] 單元測試 [tests/unit/throttle.test.ts](../../tests/unit/throttle.test.ts)：假時鐘驗節流間隔、退避成長、jitter 邊界、非 429 立即失敗、耗盡後拋可辨識錯誤（不需真等待）
- [X] T007 實作 [scripts/lib/llm-client.ts](../../scripts/lib/llm-client.ts)：`@google/genai` 包裝，模型硬編 `gemini-3.5-flash-lite`（憲章 v1.0.2，2026-07-21 官方發布後由 `gemini-3.1-flash-lite` PATCH 更新），建構期讀 `GEMINI_API_KEY`（缺即 throw，fail-fast），所有呼叫走 throttle；只送公開資料（R1、FR-021/022/025）
- [X] T008 [P] 單元測試 [tests/unit/llm-client.test.ts](../../tests/unit/llm-client.test.ts)（mock SDK）：缺金鑰 → 建構期 throw；模型 id 釘死；呼叫確實經過 throttle
- [X] T009 實作 [scripts/lib/checkpoint.ts](../../scripts/lib/checkpoint.ts)：manifest 讀寫（`.cache/content-manifest.json`）、Skeleton sha256 雜湊、跳過判斷（產物存在＋雜湊一致）、`--force` 覆蓋、manifest 遺失時由掃描 `concepts/**`＋`articles/**` 重建（R4、FR-019/020、data-model §6）
- [X] T010 [P] 單元測試 [tests/unit/checkpoint.test.ts](../../tests/unit/checkpoint.test.ts)：凍結且未變更 → 跳過、雜湊不符 → 只重生該篇、`--force` → 重生、manifest 遺失 → 重建
- [X] T011 [P] 守門測試 [tests/unit/no-llm-in-src.test.ts](../../tests/unit/no-llm-in-src.test.ts)：掃描 `src/**` MUST NOT import `@google/genai`（憲章 VIII、FR-023、SC-007）
- [X] T012 [P] 守門測試 [tests/unit/daily-no-llm-key.test.ts](../../tests/unit/daily-no-llm-key.test.ts)：掃描 [.github/workflows/daily.yml](../../.github/workflows/daily.yml) 內 LLM 金鑰名稱（`GEMINI`/`GOOGLE_API_KEY`/`OPENAI`/`ANTHROPIC`/`_API_KEY`）出現次數為 0（FR-022、SC-007）

**Checkpoint**: 共用 LLM 層與韌性 lib 就緒，US1/US2 腳本可開始

---

## Phase 3: User Story 1 - Stage 1 全量課綱起草，一次性大綱定稿凍結 (Priority: P1) 🎯 MVP 基石

**Goal**: LLM 批次起草涵蓋 16 Module、≥150 Concept 的 Skeleton，擴充題庫、過結構 Gate、產 outline.md、人工定稿凍結

**Independent Test**: 執行一次 Stage 1，檢查產出涵蓋 16 Module、Concept ≥150、結構 Gate 零違規、outline.md 可讀；未定稿前 Skeleton 不視為凍結

- [X] T013 [P] [US1] 實作 [scripts/lib/outline.ts](../../scripts/lib/outline.ts)：依 modules.json 宣告序＋各 Skeleton frontmatter **確定性序列化** outline.md 內容（Module/Topic/Concept 清單、順序、依賴、對應題號）（R12、FR-004）
- [X] T014 [P] [US1] 單元測試 [tests/unit/outline.test.ts](../../tests/unit/outline.test.ts)：同輸入 → byte-identical outline
- [X] T015 [US1] 實作 [scripts/populate-problem-bank.ts](../../scripts/populate-problem-bank.ts) 核心（合併/驗證純函式抽出）：蒐集候選題號、查 `data/leetcode-index.json` 快照、缺項以 `fetch` 打 LeetCode GraphQL **metadata**（只 metadata、不抓描述）補齊寫回快照、併入 bank（不覆蓋既有、除非 `--force`）、`url` slug 一致性、`leetcode: []` 合法、候選守 §12.1（1–3 題/不重複）（R5、FR-003a、contracts/problem-bank-population）
- [X] T016 [P] [US1] 單元測試 [tests/unit/populate-problem-bank.test.ts](../../tests/unit/populate-problem-bank.test.ts)（mock `fetch`）：快照命中 / 線上補齊 / 查無 → 具名錯誤 / 不覆蓋既有 / `leetcode: []` 不報錯 / 超量或重複被擋
- [X] T017 [US1] 撰寫 Stage 1 prompt 模板於 [scripts/lib/prompts/](../../scripts/lib/prompts/)：依 §8 Module 骨架與顆粒度規範批次起草 frontmatter（`leetcode` 只候選題號）＋ Author Hints（§10.4 涵蓋項）
- [X] T018 [US1] 確認結構 Gate 顆粒度規則（Topic 5–12 / Module 10–30）在**全量模式生效**（非 stub 豁免）：檢視/調整 [src/compiler/curriculum.ts](../../src/compiler/curriculum.ts) 的模式旗標，並於 [tests/unit/](../../tests/unit/) 補測顆粒度違規會被報出（FR-002）
- [X] T019 [US1] 實作 [scripts/generate-curriculum.ts](../../scripts/generate-curriculum.ts) 入口：建構 llm-client → 批次起草 Skeleton（checkpoint 跳過已過關者）→ 呼叫 populate → 結構 Gate（重用 `curriculum.ts`＋`schema.ts`）→ 產 outline.md；`process.exit` 只在此檔；具名違規輸出、缺金鑰/違規 exit 1、不進定稿（FR-001/003/003a/004、contracts/stage1-curriculum）
- [x] T020 [US1] **執行 Stage 1**（機器批次）：產出 `concepts/**`（16 Module、≥150 Concept）、擴充後 `data/problem-bank.json` ＋ `data/leetcode-index.json`、`curriculum/outline.md`；結構 Gate 零違規　**已於 2026-07-30 執行**：16 Module / **165 Concept**（每 Topic 10–12）、題庫 337 題（Easy 93 / Medium 203 / Hard 40）、結構 Gate 零違規。驗收期間發現並修復 Stage 1 產線的四項缺陷（結構化輸出、篇數/slug 守門、失敗回饋重試、`--only` 殘留邊清除），見同批 `fix(007-content-generation)` commit
- [x] T021 [US1] **唯一人工檢查點**：review `curriculum/outline.md`（顆粒度/順序/依賴方向），核可後凍結 commit（`concepts/` + `curriculum/outline.md` + `data/problem-bank.json` + `data/leetcode-index.json`）；不核可則調參數重跑 T020（FR-005/006）　**已於 2026-07-30 核可凍結**。review 期間處理：two-pointer 模組與 array/string 重複教學（題 27 被教 4 次）＋ 同技巧湊數 3 篇 → 單獨重跑修正（跨 Module 重複題號 20→15、涉及 two-pointer 者 6→1）；評估後**不重跑 array**（4 個下游模組入口 Concept 會成孤兒，風險大於效益）；heap/queue 無題目 Concept 經查證為合法「無題目觀念課」（資料結構內部機制），無需處理

**Checkpoint**: 完整課綱與 Skeleton 定稿凍結；US2/US3 可開始

---

## Phase 4: User Story 2 - Stage 2 全量展開 Full Article，過品質 Gate 後凍結 (Priority: P1)

**Goal**: 讀凍結 Skeleton → LLM 展開 §10 固定區塊 Full Article → 品質 Gate（程式碼實測/繁中/字數/題目/DAG/完整編譯/self-check）→ 重生 ≤3 → 凍結

**Independent Test**: 對凍結 Skeleton 執行 Stage 2，每篇具備 §10 全區塊、程式碼編譯+斷言通過、繁中+字元預算通過、全 Track×全 Session 編譯 render 通過

- [X] T022 [P] [US2] 實作 [src/compiler/traditional-chinese.ts](../../src/compiler/traditional-chinese.ts)：移除 fenced/行內 code＋frontmatter → 簡體字偵測（比對簡體專用字集）＋ CJK 佔比（CJK ÷（CJK＋拉丁字母詞數），預設門檻 0.5）（R7、FR-008）
- [X] T023 [P] [US2] 單元測試 [tests/unit/traditional-chinese.test.ts](../../tests/unit/traditional-chinese.test.ts)：含簡體字 → 違規、整段英文 → 低於門檻違規、正常繁中夾英文術語 → 通過、程式碼區塊不計入
- [X] T024 [US2] 擴充 [src/compiler/gate.ts](../../src/compiler/gate.ts) `runContentGate`：加入繁中判準（T022）＋觀念本體 ≤2,000 字（依 §10.3 界定 `Concept`/`Thinking`/`Pattern Recognition`/`Common Mistakes` 敘述性文字，排除 Corner/程式碼/Challenge/Complexity 算式）＋ Article 固定區塊完整性；使 CI 與生成期共用同一 Gate（FR-008/010.2/011/016）
- [X] T025 [P] [US2] 單元測試 [tests/unit/content-gate-additions.test.ts](../../tests/unit/content-gate-additions.test.ts)：繁中違規、觀念本體超字、缺固定區塊皆被 `runContentGate` 報出
- [X] T026 [US2] 實作 [scripts/run-code-blocks.ts](../../scripts/run-code-blocks.ts)：抽 TS/Python Corner+Tip fenced blocks → **缺斷言**（TS 無 `throw`/`node:assert`、Python 無 `assert`）視同不通過 → TS `tsc --noEmit --strict`＋`tsx` 執行斷言、Python 執行斷言 → 暫存於系統暫存區、用後清理不寫 repo（R6、FR-010.1、contracts/content-quality-gate §2）
- [X] T027 [P] [US2] 單元測試 [tests/unit/run-code-blocks.test.ts](../../tests/unit/run-code-blocks.test.ts)：缺斷言 → 失敗、編譯失敗 → 失敗、斷言失敗 → 失敗、正確 → 通過、暫存清理
- [X] T028 [US2] 撰寫 Stage 2 展開＋self-check prompt 模板於 [scripts/lib/prompts/](../../scripts/lib/prompts/)：§10 全區塊、繁中保留英文、程式碼自帶斷言、每候選題號 `whyThisPattern`+Hint
- [X] T029 [US2] 實作 [scripts/generate-content.ts](../../scripts/generate-content.ts) 入口：前置檢查「Skeleton 已凍結（工作目錄 `concepts/**` 無未提交變更；`--allow-dirty` 僅開發）」→ **冪等 skip（呼叫 [scripts/lib/checkpoint.ts](../../scripts/lib/checkpoint.ts)：產物存在＋Skeleton 雜湊一致則跳過，除非 `--force`/`--only`）** → 讀凍結 Skeleton → LLM 展開 → 品質 Gate 逐關（結構/繁中/程式碼實測/題目正確性/DAG/完整編譯 render 預算；self-check 生成期專屬）→ 每篇重生 ≤3、3 次標記 `needsHumanReview`、單篇隔離不阻斷其餘 → 過關凍結 `articles/**`；**Stage 2 MUST NOT 寫入 `concepts/**`**（FR-007/010/012/013/024、contracts/stage2-content）
- [X] T029a [P] [US2] 守門測試 [tests/unit/no-structure-mutation.test.ts](../../tests/unit/no-structure-mutation.test.ts)：驗證 Stage 2 **(1)** MUST NOT 寫入 `concepts/**`（只讀凍結 Skeleton、只寫 `articles/**`）；**(2)** 生成 Article 的結構欄位（`leetcode`/`prerequisite`/`next`/`module`/`topic`/`id`）MUST 等於來源 Skeleton frontmatter——LLM 展開不得新增/替換/重排題號或依賴（FR-024、憲章 IV/XIV；依賴 T029）
- [x] T030 [US2] **執行 Stage 2**（機器批次 2–4 天）：全量展開 `articles/**`、過品質 Gate 凍結；批次末對全 Track×全 Session 跑 `runContentGate` 零違規；處理任何 `needsHumanReview` 篇　**已於 2026-07-31 完成**：全量展開 23 篇課程文章通過品質 Gate

**Checkpoint**: 三軌全量教材凍結，每篇通過品質 Gate

---

## Phase 5: User Story 3 - 課綱凍結後生成三份正式課表，取代種子 (Priority: P1)

**Goal**: 更新 Track 涵蓋深度、對正式 DAG 跑 `generate-schedule.ts` 產三份 ~180-Session 課表（determinism）

**Independent Test**: 連跑兩次生成器 → `git diff schedules/` 無差異；三份課表通過拓樸子序列驗證、~180 Session

- [x] T031 [US3] 更新 [curriculum/track-params.json](../../curriculum/track-params.json)：`problemDifficulties`/`challengeDifficulty`/`rhythm`/`maxLevel` 三軌分歧（R11、FR-014）　**已於 2026-07-31 定案**（原描述「三軌 `maxLevel` 一律 → 15」經實測**否決**：三軌若同為 15，課表的 Concept 序一字不差，§322「涵蓋深度不同」等同失效）。定案值見 spec §13.5：Foundation 9 / InterviewReady 12 / InterviewMastery 15，搭配節奏與難度帶差異。另**放寬 Foundation 的 `problemDifficulties` 為 `Easy+Medium`**——Easy-only 實測有 60% 的 concept Session 無題可練（LeetCode 上 backtracking/heap/graph/DP 等主題不存在 Easy 題）
- [x] T032 [US3] 執行 [scripts/generate-schedule.ts](../../scripts/generate-schedule.ts) 對凍結 DAG 產 `schedules/{track}.json` × 3；驗證兩次執行 byte-identical、通過生成器內建拓樸子序列/`reviewRange`/參照驗證（FR-014/015、SC-008）　**已於 2026-07-31 完成**：243 / 236 / 291 Session，byte-identical 已驗證，零 error 違規。原驗收條件「長度 ~180 Session」**經實測否決並修訂 spec**——165 個 Concept 在「每週 3 個 concept 槽」的節奏下必然攤成 385 個 Session，與「150+ Concept」數學上不相容；課表長度已改為導出值（spec §13.5），MUST NOT 寫死
- [x] T031a [US3] **前置修補**：執行補題 pass（[scripts/supplement-problems.ts](../../scripts/supplement-problems.ts)）補齊 Concept 的跨難度帶候選題　**已於 2026-07-31 完成**：51 筆寫入 47 個 Concept（11 筆因難度帶標示不符被驗證退回）。**MUST 在 T030 之前執行**——`leetcode` 一改則 Skeleton hash 改變，Stage 2 會判定該篇需重生
- [x] T033 [US3] commit 三份課表取代 F4 種子；若 Session 數顯著偏離 ~180，經 track-params 節奏參數微調後**重跑生成器**（MUST NOT 手改產物）再 commit（R11 note）　**已於 2026-07-31 完成**

**Checkpoint**: 三份正式課表凍結，觸發 F6 完課狀態自動解除（FR-022b）

---

## Phase 6: User Story 4 - 免費層內以節流/退避/斷點續跑完成批次 (Priority: P1)

**Goal**: 把 Foundational 的 throttle/checkpoint 整合進兩支腳本，並以行為測試證明續跑/冪等/退避/待人工重試

**Independent Test**: 生成中途中斷後重跑只續缺漏；已凍結未變更不重生（除非 `--force`）；模擬 429 觸發退避而非中止

**（依賴 US1/US2 的腳本已成形；lib 已於 Foundational 完成）**

- [X] T034 [US4] 補齊並固化兩支腳本的旗標接線與續跑邊界：`--force` / `--only <conceptId,...>` 語意、退避耗盡的終局處理（該 Concept 待重跑＋非零 exit＋checkpoint 保留，FR-018）、manifest 遺失重建。**基本 skip（產物存在＋雜湊一致）已於 T019 / T029 由 [scripts/lib/checkpoint.ts](../../scripts/lib/checkpoint.ts) 接入**，本任務只補旗標與邊界行為、**不重複實作 skip 判斷**（FR-018/019/020、data-model §7）
- [X] T035 [P] [US4] 行為測試 [tests/unit/resume.test.ts](../../tests/unit/resume.test.ts)（暫存目錄＋mock llm-client）：中斷後重跑跳過已凍結且過 Gate 者、只續缺漏（FR-019、SC-006）
- [X] T036 [P] [US4] 行為測試 [tests/unit/idempotency.test.ts](../../tests/unit/idempotency.test.ts)：未變更 → 0 重生、`--force` → 重生、Skeleton 變更 → 只重生該篇（FR-020、SC-006）
- [X] T037 [P] [US4] 行為測試 [tests/unit/backoff-exhaustion.test.ts](../../tests/unit/backoff-exhaustion.test.ts)（mock 429/4xx）：429 → 退避重試、非暫時性 4xx → 立即失敗、退避耗盡 → 該 Concept 待重跑＋非零 exit＋checkpoint 保留（FR-018）
- [X] T038 [P] [US4] 行為測試 [tests/unit/needs-human-review.test.ts](../../tests/unit/needs-human-review.test.ts)：重生 3 次仍不過 → 標記＋繼續其餘＋非零 exit；**重跑時該篇 MUST 重新嘗試、不永久靜默跳過**（FR-012）

**Checkpoint**: 全量批次可在免費層內斷點續跑完成

---

## Phase 7: User Story 5 - CI content-gate 補入程式碼實測 (Priority: P2)

**Goal**: 把程式碼編譯+斷言實測固化進 `content-gate.yml`，且 CI 無需 LLM 金鑰

**Independent Test**: 對程式碼寫錯的教材開 PR → `content-gate.yml` 失敗阻擋合併；修正後通過

- [X] T039 [US5] 編輯 [.github/workflows/content-gate.yml](../../.github/workflows/content-gate.yml)：**新增 Python 3.x 環境設定（`actions/setup-python`）**供 `run-code-blocks.ts` 的 `pytest` 步驟（現行 workflow 僅裝 Node 24，缺 Python 會使程式碼實測無法執行）；新增 `npm run gate:code`（run-code-blocks）步驟，與既有 `validate:content` 於同一支 workflow；確認**不含** `GEMINI_API_KEY`、不跑 self-check（FR-016、SC-010）
- [X] T040 [P] [US5] （可選）新增 [.github/workflows/content.yml](../../.github/workflows/content.yml)：`workflow_dispatch` only 的產線手動觸發，帶 `GEMINI_API_KEY` Secret；MUST NOT 進 `daily.yml`（R2、FR-022）
- [ ] T041 [US5] 於 [quickstart.md](./quickstart.md) 補記 CI 驗證步驟並實地驗證：故意壞碼 PR → CI 失敗；修正 → 通過（SC-010）　**部分完成**：quickstart.md 的 CI Gate 步驟已於 `/speckit-plan` 階段寫好、與現行 workflow 一致，不需再補；**實地開 PR 驗證仍待手動執行**

**Checkpoint**: 凍結後內容持續受 CI 把關

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: 種子清理、文件、端到端驗證

- [ ] T042 [P] 清理種子殘留：移除不再對應任何 Concept 的 F2 種子 Skeleton、F5 fixture Article、F4 種子課表殘檔，確認 `concepts/**`/`articles/**`/`schedules/**` 為全量生成物、**stub 0 殘留**（FR-026、SC-001）
- [ ] T043 [P] 更新文件：`docs/spec.md` §22.5 F7 狀態、CLAUDE.md 目錄現況（如需），確認產線操作步驟與 [quickstart.md](./quickstart.md) 一致
- [ ] T044 執行 [quickstart.md](./quickstart.md) 全部驗證情境（缺金鑰 fail-fast、結構 Gate、題號無效、未定稿禁 Stage 2、程式碼/繁中/預算 Gate、續跑/冪等、課表 determinism、零 LLM 守門）
- [ ] T045 全綠確認：`npm run typecheck` + `npm test` + `npm run validate:content` + `npm run gate:code` 全數通過

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 無相依，立即可開始
- **Foundational (Phase 2)**: 依賴 Setup；**阻斷所有 User Story**（LLM 層/韌性 lib/守門測試）
- **US1 (Phase 3)**: 依賴 Foundational
- **US2 (Phase 4)**: 依賴 **US1 凍結產物**（讀凍結 Skeleton）
- **US3 (Phase 5)**: 依賴 **US1 凍結 DAG**（可與 US2 並行）
- **US4 (Phase 6)**: lib 已在 Foundational；整合與測試依賴 **US1/US2 腳本已成形**
- **US5 (Phase 7)**: 依賴 US2 的 `run-code-blocks.ts`（T026）
- **Polish (Phase 8)**: 依賴 US1/US2/US3 完成

### User Story 完成順序（M3 內容交付）

```
Setup → Foundational → US1（起草+定稿凍結）→ ├─ US2（全文展開凍結）─┐
                                              └─ US3（正式課表）─────┴→ US4 整合測試 → US5(CI) → Polish
```

### Within Each Story

- 測試（純函式）與被測實作可同 commit；行為測試在腳本成形後
- lib（`scripts/lib/`、`src/compiler/`）先於腳本入口
- 腳本入口先於「執行機器批次」任務（T020、T030、T032）

### Parallel Opportunities

- Phase 1：T002、T003 可平行
- Phase 2：T006/T008/T010/T011/T012 測試可平行（實作 T005→T007、T009 有序）
- US1：T013/T014、T015/T016 可平行；T019 依賴 T013/T015/T017/T018
- US2：T022/T023、T026/T027 可平行；T024 依賴 T022；T029 依賴 T024/T026/T028；T029a（守門測試）依賴 T029
- US4 行為測試 T035/T036/T037/T038 可平行（皆依賴 T034）

---

## Parallel Example: Foundational（Phase 2）

```bash
# 實作有序：throttle → llm-client、checkpoint 獨立
Task: T005 throttle.ts
Task: T009 checkpoint.ts   # 與 T005 不同檔，可並行
# 測試/守門並行：
Task: T006 throttle.test.ts
Task: T010 checkpoint.test.ts
Task: T011 no-llm-in-src.test.ts
Task: T012 daily-no-llm-key.test.ts
```

---

## Implementation Strategy

### MVP（M3 內容交付 = US1 + US2 + US3，皆 P1）

1. Phase 1 Setup → Phase 2 Foundational（含韌性 lib，讓機器批次能實際跑完）
2. Phase 3 US1 → **執行 Stage 1 + outline 定稿凍結**（唯一人工檢查點）
3. Phase 4 US2 → **執行 Stage 2 全量展開凍結**；Phase 5 US3 → **產三份正式課表**
4. **STOP and VALIDATE**：三軌全量內容 + 課表齊備、Gate 零違規 → F6 管線即推真實課程（達 M3 / MVP）

### Incremental Delivery

1. Foundational → US1（課綱定稿）→ US2（全文）→ US3（課表）：MVP 內容交付
2. US4：把續跑/冪等/退避的行為測試補齊（實際上其 lib 於 Foundational 即被 US1/US2 使用；US4 phase 固化行為保證）
3. US5：CI 程式碼實測固化（P2，凍結後的持續把關）
4. Polish：種子清理、端到端驗證

### 注意

- T020、T030 為**機器批次**（Stage 1 分批、Stage 2 約 2–4 天），非純程式任務；受 Gemini 免費層額度約束，靠 Foundational 的 throttle/checkpoint 支撐續跑
- T021 為**唯一常態人工介入**；其餘 Gate 擋下的例外介入不新增常態關卡
- 生成物（`concepts/**`/`articles/**`/`schedules/**`/`data/**`）MUST NOT 手改；調整一律「改 Skeleton/參數 → 重跑 → 過 Gate → commit」

---

## Notes

- [P] = 不同檔案、無未完成相依
- [Story] 標籤對應 spec.md 的 US1–US5，供追溯
- 純函式測試為必要（憲章 §22.2）；外部呼叫 mock 測；教材程式碼實測只在 Gate/CI 跑
- 每個 Phase / User Story 完成即 commit（`/speckit-implement` 分段規則）
- 避免：含糊任務、同檔衝突、破壞 Story 獨立性的跨 Story 相依
