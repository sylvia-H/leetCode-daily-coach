---
description: "Task list for 001-walking-skeleton"
---

# Tasks: Walking Skeleton（垂直切片：從課程內容到 Discord 的全鏈路打穿）

**Input**: Design documents from `/specs/001-walking-skeleton/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: **必要**（非選配）。憲章 v1.0.1「開發工作流程與品質把關 › 測試優先」與 `docs/spec.md` §22.2
明列本 Feature 適用的關鍵邏輯 MUST 有單元測試：教材固定區塊解析、Lesson Compiler determinism、
per-track idempotency guard（含跨日 / UTC 邊界）、狀態推進、多 Track 失敗隔離、
Renderer 純函式性與 Discord 限制（含 6,000 總長）。

**Organization**: 依 User Story 分組，各 Story 可獨立實作與驗收。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無未完成相依）
- **[Story]**: 對應 spec.md 的 User Story（US1–US4）
- 每個任務皆含確切檔案路徑

## Path Conventions

單一專案，repo root 下的 `src/`、`tests/`、`articles/`、`data/`、`docs/`、`.github/workflows/`
（結構見 [plan.md](./plan.md) § Project Structure）。

**環境**：Windows / PowerShell。套件管理用 npm，Node.js 24。

---

## Phase 1: Setup（工程鷹架）

**Purpose**: 建立整個專案的建置與測試基礎。本階段產物為**永久資產**，後續 Feature 在其上擴充。

- [X] T001 建立 `package.json`：`type: module`、npm scripts（`build` = `tsc`、`test` = `vitest run`、`test:watch` = `vitest`、`start` = `node dist/main.js`）、dependencies（`gray-matter`、`marked`）、devDependencies（`typescript`、`vitest`、`@types/node`）；**MUST NOT** 加入 `@google/genai` 或 `zod`（見 plan.md § Primary Dependencies）。接著執行 `npm install` 產生 `package-lock.json` 並**一併 commit**——`daily.yml`（T040）以 `npm ci` 安裝，缺 lockfile 會在 CI 第一步直接失敗
- [X] T002 [P] 建立 `tsconfig.json`：strict、`noUncheckedIndexedAccess`、target ES2022、module NodeNext、`outDir: dist`、`rootDir: src`
- [X] T003 [P] 建立 `vitest.config.ts`：include `tests/**/*.test.ts`、環境 node
- [X] T004 [P] 建立 `.gitignore`：`node_modules/`、`dist/`、`.state/`（本機 dry run 的 state checkout 目錄，MUST 排除以免誤入主分支）。**`package-lock.json` MUST NOT 被忽略**（T001、`npm ci` 相依）
- [X] T005 建立目錄骨架：`src/types/`、`src/compiler/`、`src/renderer/`、`src/discord/`、`src/state/`、`src/util/`、`tests/unit/`、`tests/fixtures/`、`articles/two-pointer/`、`data/`

---

## Phase 2: Foundational（阻斷性前置）

**Purpose**: 所有 User Story 共同依賴的核心骨架——型別入口、設定讀取、失敗隔離的執行流程、告警。

**⚠️ CRITICAL**: 本階段完成前，任何 User Story 都無法開始。

- [X] T006 建立 `src/types/lesson.ts`：`Track` / `SessionType` / `Problem` / `PathLabels` / `LessonConcept` / `Lesson` 型別。**此檔 MUST 不含任何 import**（純型別），使 Renderer 的相依集合在編譯期受限（憲章 XI）。契約見 [contracts/lesson-contract.md](./contracts/lesson-contract.md) §1
- [X] T007 [P] 撰寫 `tests/unit/config.test.ts`：`parseBool` 對 `"true"` / `"TRUE"` / `"false"` / `""` / `undefined` 的解析（**只有 `"true"` 為真**）；三個 webhook 皆空 → 拋設定錯誤；`STATE_FILE` 未設定 → 拋錯；已啟用 Track 的順序恆為 `foundation` → `interviewReady` → `interviewMastery`
- [X] T008 實作 `src/config.ts`：讀取六個環境變數 → `Config`；`parseBool` 採嚴格字串比對（research R6，避免 GitHub Actions 傳入字串 `"false"` 被判為真）；缺項 fail-fast 並指名缺少項目（FR-023）。契約見 [contracts/cli-contract.md](./contracts/cli-contract.md) §1
- [X] T009 [P] 撰寫 `tests/unit/alert.test.ts`：`renderAlert` 為純函式、`color` 為紅色 `15158332`、`description` 含失敗原因、輸出**不含** webhook URL；`track` 為 `null`（全域性失敗）→ `title` 為 `⚠️ 推播失敗 · 全域` 且其餘結構與 Track 版本一致（FR-010a）
- [X] T010 [P] 實作 `src/renderer/alert.ts`：`renderAlert(track: Track | null, reason)` → 紅色告警 embeds（純函式）。**此為本 Feature 唯一的告警版面實作**——單一 Track 失敗與全域性失敗共用同一顆，`daily.yml` MUST NOT 另行拼組 embed 告警（FR-010a）。契約見 [contracts/discord-embed-contract.md](./contracts/discord-embed-contract.md) §3
- [X] T011 [P] 撰寫 `tests/unit/state-load.test.ts`：檔案不存在 → 回傳空 `{ tracks: {} }` 不報錯；缺少已啟用 Track → 自動補建 `currentSessionIndex: 1` / `lastPushAt: null`（FR-015）；含未啟用 Track 的資料 → 原樣保留；JSON 損毀 → 拋錯且**原檔未被改動**
- [X] T012 實作 `src/state/state-store.ts` 的 `load()` 與 Track 自動補建（`advance` / `save` 留待 US2）。契約見 [contracts/state-schema.md](./contracts/state-schema.md) §2
- [X] T013 實作 `src/main.ts` composition root 骨架：手動組裝元件 → 決定已啟用 Track → **固定順序逐一處理（MUST NOT 平行）** → 每個 Track 以 try/catch 隔離 → 彙總 exit code（任一失敗 → 1）。全域性失敗（無 webhook / 無 `STATE_FILE` / state 解析失敗）在迴圈**之前**中止且不寫 state（research R8）。此時逐 Track 內部先呼叫 stub
- [X] T013a 於 `src/main.ts` 實作**全域性失敗告警**（FR-010a）：中止前呼叫 `renderAlert(null, reason)` 並 POST 至**第一個已設定的 webhook**（順序 `foundation` → `interviewReady` → `interviewMastery`），再 exit 1。**例外**：三個 webhook 皆未設定時無處可發，MUST 僅 log + exit 1（不構成無聲失敗）。行為表見 [contracts/cli-contract.md](./contracts/cli-contract.md) §4
- [X] T013b 於 `src/main.ts` 將**告警發送本身**包在獨立 `try/catch`（FR-010c）：告警送出失敗 MUST 記錄 `alert-failed: {track}: {reason}` 日誌、仍計為失敗，且該 `catch` **MUST NOT 重新拋出**——否則會中斷後續 Track 的處理
- [X] T014 撰寫 `tests/unit/run-tracks.test.ts`：以 mock 注入「第 1 個 Track 拋錯、第 2 個成功」→ 斷言**第 2 個仍被處理**、整體 exit code 為 1、失敗 Track 有發出告警（多 Track 失敗隔離，憲章 XV / FR-009）
- [X] T014a 於 `tests/unit/run-tracks.test.ts` 補**告警送不出去**的案例（FR-010c）：mock 成「第 1 個 Track 推播失敗**且其告警 POST 亦失敗**、第 2 個 Track 正常」→ 斷言第 2 個 Track **仍被處理並成功**、整體 exit code 為 1、log 中同時出現推播失敗與 `alert-failed` 兩筆錯誤紀錄、且**未拋出未捕捉例外**
- [X] T014b 於 `tests/unit/run-tracks.test.ts` 補**全域性失敗告警**的案例（FR-010a）：`STATE_FILE` 未設定 / state 解析失敗 → 斷言以 `null` 呼叫 `renderAlert` 並 POST 至第一個已設定 webhook、exit code 1、**未寫入 state**；三個 webhook 皆空 → 斷言**完全未呼叫 `fetch`**、僅 log + exit 1

**Checkpoint**: 骨架就緒——設定、失敗隔離、告警（含全域告警與告警自身失敗的處置）、狀態讀取皆可運作，
User Story 可開始。**告警版面此時已定於 `renderer/alert.ts` 一處**，後續 workflow 層 MUST NOT 另建一套。

---

## Phase 3: User Story 1 - 早上在 Discord 收到一堂真的課（Priority: P1）🎯 MVP

**Goal**: 打通 `教材檔 + 題庫 + 課表 → Lesson → embeds → Discord` 這條鏈路，讓學習者實際收到一則排版完整的課程訊息。

**Independent Test**: 設定一個 Track 的 webhook、進度為第 1 課，手動觸發一次 → 手機上收到訊息、內容可讀、連結可點（quickstart 步驟 C）。

### 內容素材（US1）

- [X] T015 [P] [US1] 撰寫手寫教材 `articles/two-pointer/002-left-right-pointer.md`：含 `docs/spec.md` §10 **全部**固定區塊，frontmatter 提供 `id` / `title` / `module` / `pattern_label` / `complexity_label` / `estimated_minutes` / `exit_criteria`（snake_case）。正文繁體中文、技術術語保留英文（FR-001a）。推播用區塊 MUST 落在 §14.5 預算內。檔頂加註臨時性標示與接手 Feature（**F7**，FR-001）。格式契約見 [contracts/article-format.md](./contracts/article-format.md)
- [X] T016 [P] [US1] 建立 `data/problem-bank.json`：3 題（`problems` 陣列 + `conceptProblems` 對照），欄位為題號 / 官方標題 / 連結 / 難度 / `whyThisPattern` / `hint`。**MUST 人工核對每個連結可正確開啟**（FR-003c）。標示僅涵蓋本 Feature 所需題目、F3 擴充（FR-003a）
- [X] T017 [P] [US1] 建立測試 fixtures：`tests/fixtures/article-valid.md`（完整）、`article-missing-digest.md`（缺必要區塊）、`article-unknown-section.md`（含未知區塊）、`problem-bank.json`（含正常 / 查無對應 / 超過 3 題三種情境）

### 教材解析與組裝（US1）

- [X] T018 [US1] 撰寫 `tests/unit/content.test.ts`：正確解析四個必要正文區塊（Digest / TypeScript Tip / Python Tip / Takeaway）與 frontmatter metadata（**含 Exit Criteria，取自 frontmatter 而非正文**）；**程式碼區塊內含 `## ` 字樣時不得誤判區塊邊界**（research R1 的核心風險）；缺任一必要區塊或 metadata → 拋出**指名該項目**的錯誤（FR-004b）；出現未知區塊 → 忽略且不失敗（FR-004c）；**`moduleColor` 對照（FR-007c）**：同一 module 連續查詢恆得同一色（確定性）、**未知 module → 回傳明確定義的預設色且不拋錯**
- [X] T019 [US1] 實作 `src/compiler/content.ts`：`gray-matter` 剝離 frontmatter → `marked.lexer` 掃描 `depth === 2` heading 切分區塊，以 token 的 `raw` 重組保留 markdown 原文；snake_case frontmatter → camelCase `ArticleMeta` 轉換；Module → `moduleColor` 常數對照表（含預設色，FR-007c）**置於此處而非 renderer**（憲章 XI，見 [contracts/lesson-contract.md](./contracts/lesson-contract.md) §3 R-5）
- [X] T020 [P] [US1] 撰寫 `tests/unit/problem.test.ts`：依 conceptId 取回 1～3 題；查無對應 / 題號不存在 / 題數 0 或 >3 → 拋**可辨識且訊息指名成因**的錯誤（FR-003b）
- [X] T021 [P] [US1] 實作 `src/compiler/problem.ts`：讀 `data/problem-bank.json`（路徑可注入以利測試）→ `getProblemsForConcept(conceptId)`；**只讀不做 schema 驗證**（FR-003a）。**此處為題數 1～3 的唯一權威守門點**（FR-003b）——錯誤型態與訊息只在此定義，`budget.ts` 的 `problems.count` 僅為 defense-in-depth，MUST NOT 另立一套題數錯誤
- [X] T022 [P] [US1] 實作 `src/compiler/schedule.ts`：硬編 3-Session 課表與「課程序號 → 前 / 今 / 後觀念名稱」對照表；對外 `getSessionPlan(track, sessionIndex)` / `getPathLabels(sessionIndex)`；序號超出範圍 → 拋**可辨識的「課表用盡」錯誤**。檔頂加註臨時性與接手 Feature（課表 → **F4**、路徑表 → **F2**）。資料見 [data-model.md](./data-model.md) §2 / §3
- [X] T023 [P] [US1] 撰寫 `tests/unit/schedule.test.ts`：三筆 `PathLabels` 的 `current` **互不相同**（FR-007a）；第 1 課無 `prev`、第 3 課有 `next`；`sessionIndex = 4` → 拋「課表用盡」錯誤
- [X] T024 [US1] 撰寫 `tests/unit/lesson.test.ts`：`compile(track, n)` **determinism**——同一 `(track, n)` 連續呼叫產出逐欄位相同的 `Lesson`；任一上游失敗時拋錯而**不回傳半成品**（FR-004b）
- [X] T025 [US1] 實作 `src/compiler/lesson.ts`：`compile(track, sessionIndex)` 串接 schedule → content → problem → pathLabels → 組出 `Lesson`。契約見 [contracts/lesson-contract.md](./contracts/lesson-contract.md) §2

### 渲染與字元預算（US1）

- [X] T026 [US1] 撰寫 `tests/unit/budget.test.ts`：計入欄位為 title + description + field name/value + footer/author（`url` / `color` 不計）；長度以 **Unicode code point** 計（含 emoji 的字串驗證）；逐區塊上限（Digest 900 / Tips 各 450 / 每題 350 / Exit Criteria 400 / Takeaway 120 / 學習路徑 200）；總量 5,500 與平台硬限 6,000；回傳**逐項明細**而非布林
- [X] T026a [US1] 於 `tests/unit/budget.test.ts` 補**平台結構性上限**測試（FR-006b，C2）：單 embed `title` >256、`description` >4,096、`fields` 數 >25、field `name` >256、field `value` >1,024、訊息 embed 數 >10 —— 每項各一則超限案例，斷言對應的 `BudgetItem` 出現在 `report.items` 中且 `over === true`、`report.ok === false`。**這些是平台會直接拒絕請求的硬限制，MUST 在同一次 `checkBudget` 呼叫中檢查**。另補 `problems.count > 3` 一則（defense-in-depth，主要守門在 T021）
- [X] T027 [US1] 實作 `src/renderer/budget.ts`：`checkBudget(embeds)` → `BudgetReport`（純函式），**同時涵蓋逐區塊預算、總量上限與平台結構性上限三類**，全部以同樣的 `BudgetItem` 形式進入 `report.items`（使 DRY_RUN 明細一併涵蓋，T051）。**MUST 為獨立純函式供 F5 的 Gate 共用同一顆實作**（憲章 IX）。契約見 [contracts/discord-embed-contract.md](./contracts/discord-embed-contract.md) §2
- [X] T028 [US1] 撰寫 `tests/unit/renderer.test.ts`：**同一 `Lesson` 渲染 100 次逐字元相同**（SC-010）；只有 `track` 欄位不同的兩個 `Lesson` → embeds 完全相同（Track 不決定版面，憲章 XI）；不修改輸入物件；缺 `hint` 時省略該段與其分隔符（FR-007b）；`path.prev` 缺席時省略「昨天」整行（FR-007a）；**斷言 `src/renderer/**` 的 import 集合只含 `src/types/lesson.ts`**（憲章 XI 的編譯期約束）
- [X] T029 [US1] 實作 `src/renderer/discord.ts`：`render(lesson)` → 固定 3 個 embeds（主 Embed / 題目 Embed / 收尾 Embed），順序寫死且**觀念先於題目**（FR-007、憲章 I）。版面規格見 [contracts/discord-embed-contract.md](./contracts/discord-embed-contract.md) §1

### 推播與接線（US1）

- [X] T030 [US1] 撰寫 `tests/unit/webhook-client.test.ts`：以 `vi.stubGlobal('fetch', ...)` 驗證 POST 的 URL、`Content-Type` 與 body `{ embeds }`；非 2xx → 拋錯且**錯誤訊息含 HTTP 狀態碼與 Track 名稱、不含 URL**（憲章 XIV）
- [X] T031 [US1] 實作 `src/discord/webhook-client.ts`：以 Node 內建 `fetch` POST embeds；依 Track 路由至對應 webhook；**本 Feature 不實作重試**（歸 F6，見 spec Out of Scope）
- [X] T032 [US1] 接線 `src/main.ts`：把 T013 的 stub 換成實際流程 `compile → render → checkBudget → post`；預算超限 MUST 在 `post` **之前**擋下並視為該 Track 失敗（FR-006）；課表用盡 / 教材缺區塊 / 題目資料不一致皆為**該 Track 失敗**（隔離後續行，spec Edge Cases）
- [X] T033 [US1] 在 `src/main.ts` 補上日誌：每個 Track 輸出結果行（`pushed` / `failed: {reason}`），**MUST NOT 印出 webhook URL**（[contracts/cli-contract.md](./contracts/cli-contract.md) §2）

**Checkpoint**: US1 完成——可手動觸發並在 Discord 收到一堂完整的課（quickstart A、C）。**此即 MVP**。

---

## Phase 4: User Story 2 - 學完一課後進度自動往前，且不會因故障而跳課（Priority: P2）

**Goal**: 推播成功後進度前進並保存至專用狀態分支；推播失敗則進度不動。

**Independent Test**: 連續觸發兩次（第二次繞過同日去重）→ 收到第 1、2 課；再模擬一次推播失敗 → 進度停在原地（quickstart 步驟 E、F）。

- [X] T034 [P] [US2] 建立 `docs/state.template.json`：三個 Track 的初始進度樣板（FR-024）。結構見 [contracts/state-schema.md](./contracts/state-schema.md) §1
- [X] T035 [US2] 撰寫 `tests/unit/state-advance.test.ts`：推播成功 → `currentSessionIndex` 恰好 +1、`lastPushAt` 更新、`history` append；推播失敗 / 跳過 → 三欄位皆不變（FR-013，漏跑不跳課）；同一 `conceptId` 連推三次 → `completedConceptIds` 長度恆為 1（**去重**，spec Edge Cases）；累積 35 筆 → `history` 長度為 30 且保留最新（FR-014）
- [X] T036 [US2] 實作 `src/state/state-store.ts` 的 `advance(track, lesson, pushedAt)`：依 [contracts/state-schema.md](./contracts/state-schema.md) §3 的轉移規則
- [X] T037 [US2] 撰寫 `tests/unit/state-save.test.ts`：全部 Track 處理完**只呼叫一次** `save`（FR-016）；序列化為 2 空格縮排 + 結尾換行、Track 鍵順序固定；部分 Track 失敗時**已成功 Track 的變更仍被保存**（憲章 XV）
- [X] T038 [US2] 實作 `src/state/state-store.ts` 的 `save(stateFile, state)`：只寫檔，**不含任何 git 操作**（research R5）
- [X] T039 [US2] 接線 `src/main.ts`：推播成功後呼叫 `advance`；全部 Track 處理完畢後**單次** `save`
- [X] T040 [US2] 建立 `.github/workflows/daily.yml`：`workflow_dispatch` 觸發、`permissions: contents: write`、`concurrency` 群組固定且 `cancel-in-progress: false`、checkout 兩個 ref（主分支 + `state` 分支至 `.state`）、`setup-node@v4` Node 24 + npm cache、`npm ci` → `npm run build` → `node dist/main.js`，env 傳入三個 webhook secrets 與 `STATE_FILE: .state/state.json`。**MUST NOT 含 `GEMINI_API_KEY`**（憲章 VIII）
- [X] T041 [US2] 於 `daily.yml` 新增 state 提交 step：於 `.state` 目錄 `git add / commit`，push 衝突以 `git pull --rebase --autostash origin state` + `git push` 重試，**重試上限固定 3 次**（FR-017），耗盡即以非零狀態結束該 step；**MUST NOT** 無限重試或 `--force` push。提交 MUST 只進 **`state` 分支**（FR-016、SC-009）。契約見 [contracts/state-schema.md](./contracts/state-schema.md) §4
- [X] T042 [US2] 於 `daily.yml` 新增 `if: failure()` 的**最後防線通知** step（FR-010b）：發至第一個已設定的 webhook secret（Foundation 優先，spec Assumptions），body **MUST 為極簡純文字** `{"content": "⚠️ daily workflow 失敗，詳見 Actions log：{run_url}"}`。**MUST NOT 使用 `embeds`、MUST NOT 重述失敗原因細節**——告警版面的唯一實作是 `renderer/alert.ts`（T010、FR-010a）。此 step 只涵蓋 `main.ts` **根本未執行**的情境（`npm ci` / `tsc` / checkout / setup-node 失敗）；與 `main.ts` 告警重疊時使用者會多收一則純文字提示，屬**可接受**的取捨。契約見 [contracts/cli-contract.md](./contracts/cli-contract.md) §6

**Checkpoint**: US1 + US2 完成——課程會推播、進度會前進且保存於 `state` 分支，失敗時進度不動。

---

## Phase 5: User Story 3 - 同一天不會被重複打擾（Priority: P3）

**Goal**: 雙排程下同一 Track 每日只推一次；強制模式可繞過。

**Independent Test**: 同一天內連續觸發兩次 → 第二次被跳過且進度未變；再以強制模式觸發 → 會推播（quickstart 步驟 D、E）。

- [X] T043 [P] [US3] 撰寫 `tests/unit/taipei-date.test.ts`：UTC `2026-07-19T15:59:59Z` → `2026-07-19`；UTC `2026-07-19T16:00:00Z` → `2026-07-20`（**跨日翻轉點**）；每日 cron 的 `22:07Z` 對應台北**次日**；涵蓋 research R2 列舉的全部邊界
- [X] T044 [P] [US3] 實作 `src/util/taipei-date.ts`：`toTaipeiDateString(date)` 以 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' })` 取得 `YYYY-MM-DD`（純函式，不讀系統時鐘）
- [X] T045 [US3] 撰寫 `tests/unit/idempotency-guard.test.ts`：`lastPushAt` 的台北日 == 今天 → 跳過該 Track 且**不視為失敗**（exit 0，FR-020）；台北日為昨天 → 正常推播；`lastPushAt` 為 `null`（新 Track）→ 放行；`FORCE=true` → 繞過 guard 但**照常寫入狀態**（FR-021）
- [X] T046 [US3] 於 `src/main.ts` 加入 per-track idempotency guard：置於逐 Track 流程的**最前**，略過條件為 `dryRun || force`（research R9——此單一條件式同時滿足 FR-021a 與 FR-021b）
- [X] T047 [US3] 於 `daily.yml` 補上雙 cron：`7 22 * * *`（台北 06:07 主推）與 `37 22 * * *`（台北 06:37 補跑），並新增 `workflow_dispatch` 的 `force` boolean input（default false）→ 以 env `FORCE` 傳入（FR-019）
- [X] T048 [US3] 於 `src/main.ts` 補上跳過時的日誌行 `skipped (already pushed today)`（[contracts/cli-contract.md](./contracts/cli-contract.md) §2）

**Checkpoint**: US1–US3 完成——雙排程去重與強制補推皆可運作。

---

## Phase 6: User Story 4 - 不打擾任何人也能先看到版面（Priority: P4）

**Goal**: 預覽模式完整跑完組裝與渲染並輸出至日誌，但不推播、不改動進度。

**Independent Test**: 以預覽模式觸發 → 日誌可見完整渲染結果，頻道無新訊息、進度未變（quickstart 步驟 B）。

- [X] T049 [US4] 撰寫 `tests/unit/dry-run.test.ts`：`DRY_RUN=true` → `fetch` **完全未被呼叫**、`save` **完全未被呼叫**（SC-007）；今天已推播過仍完整輸出渲染結果（**不被跳過**，FR-021a）；`DRY_RUN` 與 `FORCE` 同時為真 → 行為與單獨 `DRY_RUN` 相同且不因衝突失敗（FR-021b）
- [X] T050 [US4] 於 `src/main.ts` 加入預覽模式分支：置於 `checkBudget` **之後**、`post` **之前** `continue`（research R9 的流程順序）
- [X] T051 [US4] 於 `src/main.ts` 實作預覽輸出：以格式化 JSON 印出完整 embeds，並印出 `BudgetReport` 的**逐項明細**（項目名稱 / 實際字元數 / 上限 / 是否超限），粒度為 §14.5 的每一個預算項目（US4 Scenario 2）
- [X] T052 [US4] 於 `daily.yml` 新增 `workflow_dispatch` 的 `dry_run` boolean input（default false）→ 以 env `DRY_RUN` 傳入；並為 state 提交 step 加上 `if: inputs.dry_run != true`（SC-007：狀態分支新增提交數為 0）

**Checkpoint**: 全部 User Story 完成——四種模式組合皆符合 [contracts/cli-contract.md](./contracts/cli-contract.md) §3 的行為矩陣。

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T053 [P] 撰寫 `docs/setup-guide.md`（FR-024）：`state` 分支的 orphan 初始化步驟、Discord 頻道與 Webhook 取得、GitHub Actions Secrets 登錄、如何手動調整進度（FR-018）。步驟由使用者**手動執行一次**；**MUST NOT** 提供自動建立分支或頻道的程式。文件內只放佔位示意，**MUST NOT** 出現任何真實 webhook URL（憲章 XIV）
- [ ] T054 [P] 撰寫 `README.md`：專案定位、本機 dry run 指令（PowerShell）、指向 `docs/spec.md` 與 `docs/setup-guide.md`
- [ ] T055 [P] 新增 `tests/unit/zero-llm.test.ts`：斷言 `src/**` 的原始碼**不含** `@google/genai` import，且 `.github/workflows/daily.yml` **不含** `GEMINI_API_KEY` 字串（憲章 VIII、SC-008）
- [ ] T056 執行 `npm test` 確認全數通過，並確認憲章「測試優先」列舉的本 Feature 適用項目皆有對應測試
- [ ] T057 依 [quickstart.md](./quickstart.md) 步驟 A–I 實跑驗收（**含子步驟 B-2/B-3、G-2/G-3、I-2/I-3**）；步驟 C 的手機版面確認（SC-003）須明確回答「這讀起來像一堂課」；I-3 驗完 MUST 還原 `package.json`
- [ ] T058 依 [quickstart.md](./quickstart.md) 步驟 J 完成 SC-011 人工驗收：請一位未參與開發者只依 `docs/setup-guide.md` 操作，30 分鐘內完成環境建置並收到第一則訊息

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup（Phase 1）**：無相依，可立即開始
- **Foundational（Phase 2）**：依賴 Setup 完成——**阻斷所有 User Story**
- **User Stories（Phase 3–6）**：全部依賴 Foundational 完成
- **Polish（Phase 7）**：依賴全部 User Story 完成

### User Story Dependencies

本 Feature 為單一垂直切片，各 Story 是**同一條鏈路的漸進增強**，因此**依優先序循序實作**（非平行）：

- **US1（P1）**：Foundational 完成後即可開始。無其他 Story 相依 → **可獨立交付為 MVP**
- **US2（P2）**：依賴 US1（需要「推播成功」這個事件才能觸發進度推進）
- **US3（P3）**：依賴 US2（去重判斷讀的是 US2 寫入的 `lastPushAt`）
- **US4（P4）**：依賴 US1（需要渲染結果可輸出）；與 US2/US3 僅在 `main.ts` 的模式分支上交會

### Within Each User Story

- 測試任務排在對應實作任務**之前**，並 MUST 先確認測試失敗再實作
- 資料與 fixtures → 解析／組裝 → 渲染 → 推播 → `main.ts` 接線
- 每個 Story 完成後停下來依 quickstart 對應步驟驗收，再進入下一個

### Parallel Opportunities

- **Phase 1**：T002 / T003 / T004 可平行（不同檔案）
- **Phase 2**：T007（config 測試）、T009+T010（alert）、T011（state load 測試）三組彼此獨立
- **Phase 3**：T015 / T016 / T017 三份內容素材可平行；T020+T021（problem）與 T022+T023（schedule）可與 content 平行
- **Phase 5**：T043 / T044 可與 US3 其餘任務分開進行
- **Phase 7**：T053 / T054 / T055 可平行

> ⚠️ `src/main.ts` 由 T013 → T013a → T013b → T032 → T033 → T039 → T046 → T048 → T050 → T051
> 反覆修改，這些任務**彼此不可平行**（同一檔案）。
> 同理 `tests/unit/run-tracks.test.ts` 由 T014 → T014a → T014b 累加，
> `tests/unit/budget.test.ts` 由 T026 → T026a 累加。

---

## Parallel Example: User Story 1

```text
# 內容素材可同時進行（不同檔案、無相依）：
Task: T015 撰寫手寫教材 articles/two-pointer/002-left-right-pointer.md
Task: T016 建立 data/problem-bank.json
Task: T017 建立 tests/fixtures/ 的測試素材

# 解析層的三個模組亦可平行（各自獨立）：
Task: T020+T021 problem.ts 與其測試
Task: T022+T023 schedule.ts 與其測試
Task: T018+T019 content.ts 與其測試
```

---

## Implementation Strategy

### MVP First（僅 User Story 1）

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational（**關鍵——阻斷所有 Story**）
3. 完成 Phase 3: User Story 1
4. **停下來驗證**：依 quickstart 步驟 A、B、C 確認能收到一堂完整的課
5. 此時已可回答本 Feature 最重要的問題：「版面讀起來像不像一堂課」（SC-003）

### Incremental Delivery

1. Setup + Foundational → 骨架就緒
2. + US1 → 收到課程訊息（**MVP**，驗證版面與字元預算）
3. + US2 → 進度前進並保存至 `state` 分支（驗證狀態流程）
4. + US3 → 雙排程去重（驗證補跑機制）
5. + US4 → 預覽模式（開發期效率工具）
6. + Polish → 環境建置文件與完整驗收

### Commit 策略（依 CLAUDE.md）

`/speckit-implement` 執行時 MUST 依 Phase / User Story 分段 commit，scope 用完整 Feature 目錄名：

| 階段 | 建議 commit |
|---|---|
| Phase 1 | `build(001-walking-skeleton): 建立 TypeScript 專案鷹架與 vitest 設定` |
| Phase 2 | `feat(001-walking-skeleton): 建立設定讀取、失敗隔離骨架與狀態讀取` |
| Phase 3 | `feat(001-walking-skeleton): 打通教材解析、渲染與 Discord 推播鏈路` |
| Phase 4 | `feat(001-walking-skeleton): 實作進度推進與 state 分支保存流程` |
| Phase 5 | `feat(001-walking-skeleton): 加入雙 cron 排程與 per-track 同日去重` |
| Phase 6 | `feat(001-walking-skeleton): 加入預覽模式與字元預算明細輸出` |
| Phase 7 | `docs(001-walking-skeleton): 新增一次性環境建置說明與 README` |

該段的 `tasks.md` 勾選併入該段 commit；全部跑完後不再另外彙總。

---

## Notes

- [P] = 不同檔案、無相依，可平行
- 每個 Story 完成後停在 Checkpoint 驗收，再進入下一個
- 測試 MUST 先寫並確認失敗，再進行實作
- **本機驗證版面一律用 `DRY_RUN=true`**，MUST NOT 對真實 webhook 反覆測試（憲章「本機驗證」條款）
- 不使用 `--no-verify`、不跳過 hook；hook 失敗修根因
