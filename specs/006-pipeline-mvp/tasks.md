# Tasks: 每日 Pipeline 端到端、多 Track 失敗隔離與 MVP 驗收

**Input**: Design documents from `specs/006-pipeline-mvp/`

**Prerequisites**: [plan.md](./plan.md)、[spec.md](./spec.md)、[research.md](./research.md)、
[data-model.md](./data-model.md)、[contracts/](./contracts/)、[quickstart.md](./quickstart.md)

**Tests**: 本 Feature **明確要求測試**——FR-002 的「不注入推播替身的端到端自動化驗證」是核心交付物之一，
SC-006 更以「替身數僅 1」為可量測結果。故測試任務為**必要**，非選用。

**Organization**: 任務依 User Story 分組，各 Story 可獨立實作與驗證。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可平行執行（不同檔案、無未完成相依）
- **[Story]**: 對應 spec.md 的 User Story（US1–US5）
- 每筆任務均含確切檔案路徑

## Path Conventions

單一專案結構（plan.md §Project Structure）：repo 根目錄下的 `src/`、`tests/`、`docs/`、
`.github/workflows/`。**零新增相依**；新增的唯一目錄為 `tests/e2e/`。

---

## ⚠️ 本 Feature 的實作紀律（開工前必讀）

1. **程式改動刻意極小**：F1／F5 已定案且已驗證的行為 **MUST NOT 重寫**。本 Feature 的程式增量為
   **下列五處**（2026-07-29 `/speckit-clarify` 與 `/speckit-analyze` 後由三處修訂為五處）：
   ① `state-store.ts` 的 `completedAt`／`markCompleted`（T014／T015）；
   ② `state-store.ts` 的 **`tracks` 未知鍵判為語意損毀**（T015a，FR-031）；
   ③ `alert.ts` 的完課通知＋webhook URL 遮蔽（T016／T024）；
   ④ `main.ts` 的完課檢查（T017／T018）；
   ⑤ `main.ts` 的**部分推播告警文案**（T028a，FR-012）與**日誌遮蔽**（T024a，FR-025a）。
   除此之外一律只補測試與文件。
2. **既有實作已滿足的需求只補測試與文件，不改程式**：FR-021a（素材載入失敗＝全域失敗）已由
   [main.ts:143-153](../../src/main.ts#L143-L153) 實作；FR-015 的「無變更不提交」與 FR-016 的「重試 3 次
   不強制覆寫」已由 [daily.yml](../../.github/workflows/daily.yml) 實作（T029a 補回歸測試）；
   FR-006 的固定處理順序已由 `TRACK_ORDER` 實作（T009a 補回歸測試）；**FR-010（排程觸發時未帶值的旗標
   一律視為關閉）已由 [config.ts](../../src/config.ts) 的 `parseBool` 實作，且
   [tests/unit/config.test.ts](../../tests/unit/config.test.ts) 已覆蓋空字串／未設定情境——本 Feature
   不再另立任務**。任務中標註 **【驗證既有】** 者一律只補測試與文件。
3. **`tests/e2e/**` 內 MUST NOT 出現 `pushTrack`**（e2e-harness §1），由 T004 的掃描測試機器守住
   （該掃描測試本身置於 `tests/unit/`，不在掃描範圍內；**T004 排在 Phase 3 的 T005 之後**，因為它同時
   斷言「掃描到的檔案數 > 0」）。
4. **本機 MUST NOT 打真實 webhook**（憲章）；e2e 一律用 `fetch` 攔截，手動驗證一律 `DRY_RUN=true`。
5. **`src/` 註解中的需求編號 MUST 標明所屬 Feature**（`F1 FR-020` / `F6 FR-022`…）：F1 與 F6 的
   FR / US / research 編號空間各自獨立且**已實際碰撞**（F1 FR-020＝日期 guard vs F6 FR-020＝告警自身
   失敗；F1 FR-021＝預覽／強制模式 vs F6 FR-021＝全域性失敗；F1 US4＝預覽模式 vs F6 US4＝失敗隔離；
   F1 research R9＝DRY_RUN 插入點 vs F6 R9＝runbook 交付位置）。既有註解已於 2026-07-29 統一補上前綴，
   T017／T018／T014／T015 新增的註解 MUST 沿用此慣例。

---

## Phase 1: Setup（基線確認）

**Purpose**: 確認動工前基線為綠燈，並讓 `tests/e2e/` 被既有工具鏈涵蓋（預期不需改設定）

- [ ] T001 於 repo 根目錄執行 `npm run build`、`npm run typecheck`、`npm test`、`npm run validate:content`，
      確認四項皆綠燈並記錄現況測試數，作為本 Feature 的回歸基準
- [ ] T002 建立 `tests/e2e/` 目錄，並確認 `vitest.config.ts` 的 `include` 與 `tsconfig.test.json` 的
      `include` 已涵蓋 `tests/e2e/**/*.test.ts`（plan.md 預期無需改設定；若實測未涵蓋才最小幅調整）

**Checkpoint**: 基線綠燈、`tests/e2e/` 已納入 `npm test` 與 `npm run typecheck` 的掃描範圍

---

## Phase 2: Foundational（阻塞性前置）

**Purpose**: 四個 P1 Story 的 e2e 全部依賴同一套攔截器，故攔截器 MUST 先就位；替身邊界的守門測試則須
**緊接在第一支 e2e 檔案之後**落地（見下方說明）

**⚠️ CRITICAL**: 本階段完成前，任何 User Story 的 e2e 任務都無法開始

- [ ] T003 依 [contracts/e2e-harness.md](./contracts/e2e-harness.md) §2 實作 `tests/helpers/fetch-recorder.ts`：
      `RecordedRequest { url, embeds }`、`requests`、`requestsFor(url)`、`failFor(url, status?)`、`install()`；
      預設回應 `{ ok: true, status: 204 }` 且具備 `headers.get()`（`WebhookClient` 會讀 `Retry-After`）；
      依呼叫順序記錄；MUST NOT 解讀或重組 embeds 內容

> **T004（守門測試）已移至 Phase 3，緊接在第一支 e2e 檔案（T005）之後**：它同時要求「不含 `pushTrack`」
> 與「掃描到的檔案數 > 0」，而本階段結束時 `tests/e2e/` 仍是空目錄（且 git 不追蹤空目錄），置於此處
> 必然紅燈。

**Checkpoint**: 攔截器可用 → 四個 P1 Story 可平行開工；替身邊界的守門測試隨第一支 e2e 檔案一併落地（T004）

---

## Phase 3: User Story 1 - 三個頻道各自收到自己 Track 的今日課程 (P1) 🎯 MVP

**Goal**: 在三軌同時啟用、各自不同進度的真實素材上，證明「三頻道各收各自課程、不交叉錯送、教材共用而
難度分歧、零 LLM 金鑰仍成功」

**Independent Test**: 三個 webhook 皆設定、`state.json` 三軌 `currentSessionIndex` 為 3 / 5 / 8，執行一次
推播並攔截對外請求：恰好三組請求、各自打到對應 Track 的 webhook、內容對應各自 `sessionIndex`；
`prefix-sum` 三軌正文逐字相同、題目難度帶不同

- [ ] T005 [US1] 建立 `tests/e2e/three-tracks.test.ts` 的共用夾具：三軌 webhook 環境變數、`mkdtempSync`
      暫存目錄的真實 `state.json`、`fetch-recorder` 安裝、`webhookOptions` 注入 `sleep`／`random` 以消除
      等待與 jitter；斷言三軌各自的請求數與**目標 URL 完全對應**、無交叉錯送（FR-003 / SC-001）。
      **則數判準依 SC-001 為 1:1**——各軌的請求數 MUST **恰等於** `render()` 對該課產出的訊息則數
      （直接以 `render(lesson).length` 為期望值，MUST NOT 硬編數字或回讀實作推導）。
      **注入僅限消除耗時**（FR-002a）：MUST NOT 改變重試次數、錯誤分類或任何分支判斷。
      **暫存資源 MUST 於 `afterEach` 清理**（FR-002c）——`mkdtempSync` 目錄用畢即刪，MUST NOT 寫入 repo
      工作目錄、MUST NOT 殘留
- [ ] T004 [US1] **（原 Phase 2，因排序缺陷移至此）**建立 `tests/unit/no-push-stub.test.ts`：掃描
      `tests/e2e/**` 全部原始碼，斷言**不含** `pushTrack` 字樣（SC-006 機驗；e2e-harness §1 的守門測試），
      並斷言掃描到的檔案數 > 0 以防空掃過關。**本任務 MUST 在 T005 之後執行**——`tests/e2e/` 至少要有
      一支檔案，「檔案數 > 0」才可能成立。**守門測試 MUST NOT 放在 `tests/e2e/`**——它自身必須含有待掃描
      字樣，置於掃描範圍內會自我命中而必然紅燈；置於 `tests/unit/` 亦使 `tests/e2e/` 維持「五個端到端
      檔案」的宣告（plan.md／quickstart.md／e2e-harness §3 一致）
- [ ] T006 [US1] 於 `tests/e2e/three-tracks.test.ts` 補「各軌訊息內容對應**自己的** `currentSessionIndex`」
      斷言：三軌設為 **3 / 5 / 8**（practice / challenge / concept 三種版面，research R7 修訂版），
      斷言三則訊息**版面類型互不相同**且各自通過預算檢查（US1-2 / US1-3）。
      **MUST NOT 在此情境斷言題目內容或難度帶**——seed 課表中這三個 Session 的 `problemIds` **皆為空集合**
      （`foundation@3` practice、`interviewReady@5` challenge、`interviewMastery@8` concept `in-place-operations`），
      難度帶的證據一律由 T007 的 `prefix-sum` 情境承擔
- [ ] T007 [US1] 於 `tests/e2e/three-tracks.test.ts` 補 AC5 斷言：**`conceptId` 釘死為 `prefix-sum`**
      （research R6 的固定 fixture），在三份課表中**動態查出**它各自的 `sessionIndex`（MUST NOT 硬編 `9`），
      斷言三軌 `digest`／`tsTip`／`pyTip`／`takeaway`／`exitCriteria` **逐字相同**、`problems` 難度集合
      互不相同；三份課表中任一份找不到該 Concept 時 MUST 明確失敗而非靜默跳過。
      **MUST NOT 改為「取第一個三軌共有的 Concept」**——seed 素材中該候選為 `time-space-complexity`，
      三軌 `problemIds` 皆為空集合，難度斷言必然失敗（FR-004 / SC-007）
- [ ] T008 [US1] 於 `tests/e2e/three-tracks.test.ts` 補「執行環境**無任何 LLM 金鑰**（含 `GEMINI_API_KEY`）
      時端到端成功」斷言，並斷言被攔截請求的目標主機集合僅含 webhook 網域（FR-005 / AC6 / US1-5）
- [ ] T009 [P] [US1] **【驗證既有】**於 `tests/unit/zero-llm.test.ts` 把既有的「`daily.yml` 不含
      `GEMINI_API_KEY`」斷言（現行 `zero-llm.test.ts` 已有）**擴充為金鑰名稱清單掃描**，斷言清單中每個
      名稱在 `.github/workflows/daily.yml` 的出現次數為 **0**（SC-005；清單至少含 `GEMINI_API_KEY`，
      並預留未來其他供應商金鑰名稱）。本任務只擴充既有測試，MUST NOT 改程式
- [ ] T009a [P] [US1] **【驗證既有】**補 FR-006 的兩項斷言（既有實作已滿足，本任務只補回歸測試）：
      ① 於 `tests/e2e/three-tracks.test.ts` 斷言被攔截請求的 Track **處理順序**為
      `foundation → interviewReady → interviewMastery`（`fetch-recorder` 依呼叫順序記錄，直接比對即可）；
      **另補 FR-003 的則間順序斷言**：同一課被拆成多則時，其送出順序 MUST 與 `render()` 產出的順序
      一致（此為需求層要求，非攔截工具剛好具備的能力；若 seed 素材中無多則的課，MUST 於 T028 的部分
      推播情境一併斷言而非略過）；
      ② 於 `tests/unit/zero-llm.test.ts`（或 T009 同一檔）斷言 `.github/workflows/daily.yml`
      **不含 `strategy:` / `matrix:`**——多 Track MUST NOT 平行分派（會競爭 `state` 分支，憲章與 FR-006）

**Checkpoint**: AC2 / AC5 / AC6 取得**自動化證據**（實機證據待 Phase 8）；US1 可獨立驗證

---

## Phase 4: User Story 2 - 同一天不重複打擾、漏跑不跳課 (P1)

**Goal**: 證明 per-track 日期 guard 以 Asia/Taipei 為準各自獨立判斷，且預覽／強制兩個旗標的交互符合契約

**Independent Test**: 同一台北日期內對同一份 state 連續執行兩次，第二次對已推播 Track 零請求且
`state.json` 位元組不變；把其中一軌 `lastPushAt` 改為昨天，第二次只有該軌被推播

- [ ] T010 [US2] 建立 `tests/e2e/guard-and-modes.test.ts`：同一台北日期內連續執行兩次，斷言第二次
      **零請求**且 `state.json` **位元組相同**（SC-002；以 `readFileSync` 前後比對 Buffer）
- [ ] T011 [US2] 於 `tests/e2e/guard-and-modes.test.ts` 補「三軌 `lastPushAt` 分別為今天／昨天／`null`」
      情境，斷言只有後兩軌被推播、foundation 被跳過（US2-2，各軌獨立判斷）
- [ ] T012 [US2] 於 `tests/e2e/guard-and-modes.test.ts` 補模式矩陣斷言：`FORCE=true` 繞過 guard 並**寫**
      狀態；`DRY_RUN=true` 不受 guard 阻擋、**零請求**、**不寫入狀態**；兩者同時開啟時以 **DRY_RUN 為準**
      （FR-009 / US2-3 / US2-5）。
      **「不寫入狀態」的斷言方式 MUST 依前提二選一**：① `STATE_FILE` 指向**該案例專屬、尚不存在**的暫存
      路徑時，斷言該檔**未被建立**；② 沿用 T010／T011 的既有 `state.json`（guard 情境本就要求檔案已存在，
      此時「不被建立」無從成立）時，斷言檔案內容**位元組相同**。MUST NOT 對已存在的夾具斷言「不被建立」
- [ ] T013 [US2] 於 `tests/e2e/guard-and-modes.test.ts` 補跨日邊界：`lastPushAt` 落在台北當日凌晨
      （對應 UTC 前一日）時 MUST 判定為「今天已推」而跳過（US2-4；時區換算以 Asia/Taipei 為準）

**Checkpoint**: AC3 取得自動化證據；US2 可獨立驗證

---

## Phase 5: User Story 3 - 各 Track 進度獨立推進、單次存檔與完課終態 (P1)

**Goal**: 交付 `completedAt` 狀態契約增量與完課終態行為，並證明「成功才 +1、失敗不動、單次存檔、
未知 Track 自動補建、未啟用 Track 原樣保留」

**Independent Test**: 三軌不同進度、令其中一軌失敗，執行後檢查成功兩軌各 +1 且 `lastPushAt` 更新、
失敗軌全部欄位變化量 0、`save()` 只發生一次；另備一軌 `currentSessionIndex` 超出課表，驗證完課終態

> **檔案相依提醒**：T014／T015 同改 `state-store.ts`（序列執行）；T017／T018 同改 `main.ts`（序列執行且
> 依賴 T014–T016 完成）。T016 改 `alert.ts`，可與 T014／T015 平行。

### 狀態契約與通知實作

- [ ] T014 [US3] 於 `src/state/state-store.ts` 為 `TrackState` 新增**選填** `completedAt?: string | null`，
      並延伸 `validateTrackState()`：欄位若存在 MUST 為 `null` 或 `Date.parse` 可解析的字串，違反即比照
      欄位語意損毀拋錯（全域失敗）；**欄位缺席不算違反**（向後相容，既有 `state` 分支不需遷移）；
      確認 `save()` 在未設定時 MUST NOT 憑空寫出該鍵（contracts/state-schema.md §1）
- [ ] T015 [US3] 於 `src/state/state-store.ts` 新增 `markCompleted(state, track, completedAt: Date): void`：
      **只**設定 `completedAt`，MUST NOT 動 `currentSessionIndex`／`lastPushAt`／`history`／
      `completedConceptIds`；就地修改 in-memory state，落盤由既有單次 `save()` 負責（state-schema.md §2）
- [ ] T015a [US3] 於 `src/state/state-store.ts` 的 `validateAppState()` 新增**未知 Track 鍵**檢查
      （FR-031、Edge Cases、`docs/spec.md` §19、state-schema.md §4）：`tracks` 中出現不屬於 `TRACK_ORDER`
      的鍵時 MUST **拋錯**（比照欄位語意損毀 ⇒ 全域性失敗：紅色告警 + exit 1 + **不覆寫原檔**）。
      **現行實作是靜默丟棄**——`validateAppState()` 只走訪 `TRACK_ORDER` 建表、`save()` 亦只寫出已知
      Track，故打錯的鍵會在存檔時被抹掉且維運者毫無訊號。錯誤訊息 MUST 指出實際的未知鍵名以利修正；
      MUST NOT 於 `save()` 端做任何移除或保留的特殊處理（中止點在迴圈之前，`save()` 本就不會被呼叫）
- [ ] T016 [P] [US3] 於 `src/renderer/alert.ts` 新增 `renderCompletionNotice(track: Track): DiscordEmbed[]`：
      綠色 `3066993`、標題 `🎉 課程完成 · {track}`、固定文案（告知本 Track 課程已全部推播完畢、其後不再
      推播，並指出想重新開始請依 runbook 編輯 `state.json`）；**純函式、不含時間戳**、只 import 型別、
      回傳恰好 1 個 embed；MUST NOT 含 webhook URL／金鑰／檔案系統路徑（notice-contract.md §2、research R3）

### `main.ts` 完課檢查

- [ ] T017 [US3] 於 `src/main.ts` 的逐 Track 迴圈中，**per-track 日期 guard 之後、`compileLesson` 之前**
      插入完課檢查：判定式為 `currentSessionIndex > max(deps.schedules[track].sessions[].sessionIndex)`；
      已有 `completedAt` 者靜默跳過（`{track}: skipped (completed)`）；`FORCE` **不繞過**完課跳過；
      課表**中間缺號**（未超出最大值）MUST 仍走該軌失敗路徑，MUST NOT 誤判為完課（research R1、
      cli-contract.md §1）
- [ ] T018 [US3] 於 `src/main.ts` 完成完課的三種結局處置：通知送出成功 → 呼叫 `markCompleted()` +
      日誌 `{track}: completed` + **不計入 `anyFailed`（exit 0）**；通知**發送失敗** → 轉入該軌失敗路徑
      （紅色告警 + 計入非零 exit code）且 **MUST NOT** 寫 `completedAt`（FR-019c）；`DRY_RUN` 下只輸出
      `{track}: would send completion notice (dry-run)` 或 `{track}: completed (skipped, dry-run)`，
      不發送、不寫狀態；完課路徑 **MUST NOT** 呼叫 `advance()`（cli-contract.md §1–§3）

### 單元與端到端驗證

- [ ] T019 [P] [US3] 於 `tests/unit/state-load.test.ts` 與 `tests/unit/state-save.test.ts` 補 `completedAt`
      單元測試：缺席／`null` 皆判為未完課、非法值視為語意損毀、未設定時序列化不寫出該鍵、未啟用 Track 的
      `completedAt` 原樣保留；另補 **FR-033 向後相容**斷言：以「不含 `completedAt` 的現行 `state.json`
      形狀」載入 MUST 成功且不需遷移
- [ ] T019a [P] [US3] 於 `tests/unit/state-load.test.ts` 補 **T015a 的未知鍵**單元測試（FR-031）：
      ① `tracks` 含未知鍵（如 `interviewready`）時 `load()` MUST 拋錯且錯誤訊息含該鍵名；
      ② 三個已知 Track 齊備時 MUST NOT 誤判；③ 拋錯後**原檔未被覆寫**（`save()` 未被呼叫）。
      並補 **FR-031 封閉清單**的邊界斷言：清單以外的內容差異（例如多餘的頂層鍵）MUST NOT 判為損毀
- [ ] T020 [P] [US3] 於 `tests/unit/state-advance.test.ts` 補 `markCompleted()` 單元測試：只動 `completedAt`、
      其餘四個欄位不變、完課 MUST NOT 產生 `history` 條目、MUST NOT 追加 `completedConceptIds`
      （data-model.md §1 不變式 3）
- [ ] T021 [P] [US3] 於 `tests/unit/alert.test.ts` 補 `renderCompletionNotice()` 契約測試：同一 `track` →
      **deep-equal** 的 embeds（純函式、無時間戳）、恰好 1 個 embed、顏色為 `3066993`、總長遠低於 6,000；
      並補一條斷言：完課通知的 embeds 文字中 **webhook URL 與檔案系統路徑的出現次數為 0**
      （FR-019b 要求遮蔽「適用於**全部**通知種類」；完課通知無自由文字參數，屬空成立，但此斷言讓該推論
      被機器記錄下來，日後若為完課通知加上任何動態文字即會紅燈）
- [ ] T022 [US3] 建立 `tests/e2e/state-advance.test.ts`：成功軌 `currentSessionIndex` **恰好 +1** 且
      `lastPushAt` 更新，失敗軌 `currentSessionIndex`／`lastPushAt`／`history`／`completedConceptIds`
      **全部欄位變化量為 0**（SC-003）；`history` 上限 30；concept 類才追加 `completedConceptIds`；
      未知啟用 Track 自動補建為初始值；未啟用 Track 原樣保留；**`save()` 只發生一次**（以
      `vi.mock("node:fs", …)` 搭配 `importActual` 的 **passthrough 包裝**計數佐證——依 FR-002a 屬觀測工具
      而非替身，MUST NOT 改寫回傳值或阻斷真實寫檔）。**MUST NOT 用 `vi.spyOn(fs, "writeFileSync")`**：
      `state-store.ts` 以具名匯入取用，而 ESM 的 `node:fs` namespace 唯讀，spy 裝不上也攔不到
      （e2e-harness §1）
- [ ] T023 [US3] 建立 `tests/e2e/completion.test.ts`：`currentSessionIndex` 超出課表 → **恰好一則綠色**
      通知、`completedAt` 寫入、`currentSessionIndex` **不變**、**exit 0**；**再次執行 → 零請求**（SC-011）；
      `DRY_RUN` 下不發送不寫入；通知發送失敗 → **不寫** `completedAt` 且 exit 1；課表**中間缺號**仍為
      該軌失敗（不誤判完課）

**Checkpoint**: AC4 與完課終態取得自動化證據；`state` 契約增量向後相容且已驗證

---

## Phase 6: User Story 4 - 單一 Track 出事不拖垮其他 Track (P1)

**Goal**: 證明失敗隔離、告警自身失敗不中斷、部分推播仍前進、全域性失敗不覆寫原檔；並補上告警內文的
祕密遮蔽（FR-019b，本 Feature 唯一的新增安全性實作）

**Independent Test**: 令三軌之一的對外請求固定失敗，其餘正常：其餘兩軌完成推播且進度保存、失敗軌收到
紅色告警且進度不動、整體以非零狀態結束

> **檔案相依提醒**：T024 與 T016 同改 `src/renderer/alert.ts`；若兩個 Story 平行進行，此二任務 MUST 序列。

- [ ] T024 [US4] 於 `src/renderer/alert.ts` 新增 Discord webhook URL 遮蔽的**純函式**並套用至
      `renderAlert()` 的 `reason`：組進 Embed **之前**把 webhook URL 樣式替換為 `[redacted]`；MUST 為通知
      實作的**內建行為**，MUST NOT 依賴呼叫端自律；MUST NOT 依賴特定錯誤來源的訊息格式
      （FR-019b、notice-contract.md §1.1、憲章 XIV）
- [ ] T024a [US4] 於 `src/main.ts` 把 T024 的遮蔽純函式**同時套用到執行記錄輸出**（FR-025a）：
      所有 `console.error` / `console.log` 印出的失敗原因 MUST 先經遮蔽再輸出——底層 `fetch` 例外訊息
      可能夾帶完整請求 URL，而**實機驗收紀錄所附的 Actions 連結指向的是完整 log**，log 洩漏等同驗收
      紀錄洩漏金鑰。遮蔽函式 MUST 由 `alert.ts` 匯出供 `main.ts` 共用，**MUST NOT 複製第二份實作**
      （FR-019「單一實作」）
- [ ] T025 [P] [US4] 於 `tests/unit/alert.test.ts` 補遮蔽單元測試：`reason` 內含完整 webhook URL 時，
      產出的 embeds 文字中 URL 出現次數為 **0**；遮蔽為純函式（同輸入 → 同輸出）；非 URL 文字不受影響
- [ ] T025a [P] [US4] 於 `tests/e2e/isolation.test.ts` 補 **T024a 的日誌遮蔽**斷言（FR-025a）：以
      `failFor()` 製造夾帶 webhook URL 的錯誤，攔截 `console.error` / `console.log` 輸出，斷言
      **webhook URL 在全部日誌文字中的出現次數為 0**
- [ ] T026 [US4] 建立 `tests/e2e/isolation.test.ts`：以 `failFor()` 令單軌請求固定失敗，斷言其餘兩軌
      成功率 100% 且進度保存、失敗軌收到**紅色**（`15158332`）告警且進度不變、exit code 為 **1**（SC-004）。
      **成功率的分母**依 SC-004 定義為「除被注入失敗者外、實際進入推播處理的 Track 數」（不含 guard／
      完課跳過者）。另補 **FR-018「每軌至多一則告警」**斷言：失敗軌收到的紅色告警則數**恰為 1**
      （任一步驟失敗即結束該軌，MUST NOT 出現兩則以上同軌告警）
- [ ] T027 [US4] 於 `tests/e2e/isolation.test.ts` 補「**告警本身也送不出去**」情境：斷言記錄
      `alert-failed: {track}: …`、其餘 Track 處理**不被中斷**、整體仍 exit 1，且告警失敗 MUST NOT 逸出
      成未捕捉例外（US4-2 / FR-020）
- [ ] T028 [US4] 於 `tests/e2e/isolation.test.ts` 補「**部分推播**」情境（第 2 則失敗、第 1 則已送達）：
      斷言該軌進度**照常前進**、發出紅色告警、exit 1（US4-3 / FR-012）。另補兩項 FR-012 的新增斷言：
      ① **剩餘則 MUST NOT 續送**——該軌的**課程訊息**請求數恰為「失敗那一則為止」（其後只剩告警那一則
      請求），MUST NOT 出現第 3 則以後的課程請求；② 告警內文**明示「進度已前進、不會補推」**（見 T028a）
- [ ] T028a [US4] 於 `src/main.ts` 調整 `PartialPushError` 的訊息（FR-012、notice-contract.md §1）：
      除既有的「推播中斷於第 X/Y 則」外，MUST **明示「本課進度已前進、不會補推」**——維運者若不知道
      state 已前進，會誤等明日自動補推而漏掉人工處置。**MUST NOT** 為此新增第二種告警版面或第二個通知
      函式（FR-019 單一實作）；只改 `reason` 文字
- [ ] T029 [US4] 於 `tests/e2e/isolation.test.ts` 補**全域性失敗**情境：以 `process.chdir()` 切換至缺少
      `schedules/` 的暫存目錄執行（`loadCompilerDeps()` 的 `DEFAULT_PATHS` 為 cwd 相對路徑，故此法可觸發），
      斷言 exit 1、**只發出一則**全域告警至第一個已設定的頻道（證明未降級為逐 Track 的三則同因告警）、
      且原 `state.json` **未被覆寫**（FR-021 / FR-021a **【驗證既有】**，main.ts 已實作，本任務只補回歸測試）。
      **cwd 是行程全域狀態**：MUST 在 `afterEach`（或 `try/finally`）還原原始 cwd，避免污染同檔其他案例；
      並確認 vitest 執行於 `pool: "forks"`（vitest 2.x 預設值——`worker_threads` 下 `process.chdir()` 不可用）
- [ ] T029b [US4] 於 `tests/e2e/isolation.test.ts` 補另兩種全域性失敗情境：
      ① **存檔失敗**（FR-013a／FR-021）——令 `STATE_FILE` 指向不可寫路徑，斷言 exit 1、發出全域告警、
      且**已成功推播的 Track 進度未落盤**（揭露「下次執行會重推同一課」的既定後果，MUST NOT 為此加入
      補償機制）；② **無任何已設定頻道**（FR-020a）——三軌 webhook 皆未設定時斷言 exit 1、**零對外請求**
      （告警無處可發）、且執行記錄留有錯誤訊息，MUST NOT 因無法發送而改變結束狀態
- [ ] T029a [P] [US4] **【驗證既有】**補 FR-015 / FR-016 的 workflow 層回歸斷言（`daily.yml` 已實作，
      本任務只補測試，MUST NOT 改 workflow）：於 `tests/unit/` 掃描 `.github/workflows/daily.yml`，斷言
      ① 提交 step 含**無變更偵測**（`git diff --cached --quiet` 且命中時 `exit 0`）——三軌皆跳過時
      commit 數為 0、不產生空 commit（FR-015）；② 推送重試上限為 **3**（`max_attempts=3`）且以
      `git pull --rebase --autostash` 重新同步，**不含 `--force` / `+HEAD:` 等強制覆寫**（FR-016）；
      ③ **最後防線通知 step 的 payload 為極簡純文字**——只含 `content` 鍵、**不含 `embeds`**
      （FR-019、cli-contract.md §4；此行為極易在日後被「順手改成 Embed 比較好看」而漂移，
      故 MUST 有回歸斷言）

**Checkpoint**: AC10 取得自動化證據；四個 P1 Story 全部完成 → 邏輯層 MVP 就緒

---

## Phase 7: User Story 5 - 維運者能啟用、暫停、調整任一 Track 的進度 (P2)

**Goal**: 交付上線與維運的三份產物（runbook／`daily.yml` 正名／驗收紀錄模板），讓 MVP 上線後的日常操作
不需要閱讀原始碼

**Independent Test**: 僅依 runbook、不看原始碼、不改程式完成五項操作（啟用／暫停／改進度／強制補推／預覽）

- [ ] T030 [P] [US5] 建立 `docs/runbook.md`（research R9）：首段交叉連結 `docs/setup-guide.md` 並說明分工；
      涵蓋啟用／暫停／續播一個 Track、調整某軌進度、手動補推（`force`）、預覽版面（`dry_run`）、
      `state` 分支的初始化與人工編輯方式、**每日排程實際執行於預設分支 `develop`（併入 `main` 不影響
      推播）**、推播失敗時的排查起點（Actions log → 告警 Embed → `state.json` diff）、以及各種結局日誌行
      （`pushed`／`skipped (already pushed today)`／`skipped (completed)`／`completed`／`failed`／
      `alert-failed`）的判讀方式（FR-023）。另 MUST 涵蓋兩項容易被誤判的行為：
      **（a）`force` 於同一天重複使用會讓該軌連續 `+1`（同日跳兩課）**——補推只需執行一次，重跑前先確認
      當日是否已補推過；**（b）最後防線通知的觸發範圍**——`daily.yml` 的該 step 條件為 `if: failure()`，
      **單一 Track 失敗（exit 1）也會觸發**，故失敗當天第一個已設定的頻道會同時收到紅色告警 Embed 與
      一則純文字通知，此為刻意保留的兜底設計，非重複故障
- [ ] T031 [US5] 於 `docs/runbook.md` 加入**沉默失敗警告**專節：讓已完課 Track 重新推播時，把
      `currentSessionIndex` 調回課表範圍內 **MUST 一併刪除該軌的 `completedAt`**，否則該軌仍會被靜默
      跳過；程式 MUST NOT 自動清除該欄位（狀態層不認識課表）（FR-023a、state-schema.md §3）
- [ ] T031a [US5] 於 `docs/runbook.md` 補齊 **FR-023 於 2026-07-29 新增的六項涵蓋要求**（原 T030 未涵蓋）：
      ① **權限前提**——編輯 `state` 分支需 repo 推送權限、增刪 Secret 需 repo 設定權限，缺權限時
      MUST NOT 誤判為程式故障；② **`state` 分支不存在時的初始化步驟**（Assumptions 的「分支已存在」
      若不成立時的補救）；③ **回復路徑**——改錯進度、誤刪 Secret、誤推狀態檔三種常見誤操作的回復方式；
      ④ **webhook URL 輪換與外洩處置**——於 Discord 重建 webhook → 更新對應 Secret → 確認下次執行成功；
      外洩時 MUST 以「重建並輪換」處理，**MUST NOT 只刪除訊息**；⑤ **AC10 失敗隔離演練程序**
      （FR-027b／quickstart C7a–C9：當日推播前或先重置 `state` 分支 → 暫改一軌 Secret 為無效值 →
      **不帶 `force`** 觸發 → 觀察後還原）；⑥ **預設分支變更的後果告知**——變更 GitHub Default branch
      會使每日推播改由新分支的 workflow 執行（本專案刻意不加偵測防呆，FR-024）。
      另 MUST 遵守 **FR-023「示範值為佔位示意」**：全篇 Secret／webhook URL 示範 MUST NOT 使用真實值
- [ ] T031b [US5] 於 `docs/runbook.md` 的「未知 Track 鍵」說明中，明示**手誤打錯 Track 名稱會使整次執行
      以全域性失敗中止**（FR-031／T015a）——這是刻意的 fail-loud 設計，原檔不會被覆寫，修正該鍵後
      重跑即可；MUST 與「調整某軌進度」小節相鄰，因為那是唯一會產生此手誤的操作
- [ ] T032 [P] [US5] 修改 `.github/workflows/daily.yml`：把 `Checkout main` step 更名為
      `Checkout default branch (develop)` 並加註解說明「`schedule` 事件只執行預設分支上的 workflow；
      本 repo 預設分支為 `develop`」；**MUST NOT 加 `ref:` 參數**（會讓手動觸發與正式行為分歧）
      （FR-024、research R10、cli-contract.md §4）
- [ ] T033 [P] [US5] 建立 `specs/006-pipeline-mvp/acceptance.md` **空白模板**（research R11）：每條 AC 一個
      小節，欄位為「操作步驟／預期結果／實際觀察／Actions run 連結／**run 耗時**／`- [ ]` 勾選」，涵蓋
      **AC2 / AC3 / AC4 / AC5 / AC6 / AC9（後半：`dry_run` 不推播、不寫 state；對應 quickstart C10）/
      AC10 共七條**，並註明同一次 run 可同時佐證多條；「run 耗時」欄位供 SC-009 佐證，且模板 MUST 明列
      **判定門檻為 ≤ 10 分鐘**（超過即該條不得勾選）。另 MUST 於模板開頭加一節「前置確認」，含三個
      獨立勾選項：**① 三個 webhook Secret 皆已登錄（`DISCORD_WEBHOOK_URL_FOUNDATION` /
      `_INTERVIEW_READY` / `_INTERVIEW_MASTERY`，只記「已登錄」，MUST NOT 記錄值）**、
      ② Default branch = `develop`（T039）、③ `state` 分支已重置為三軌初始值（T038）、
      **④ 本次驗收全程以 `workflow_dispatch` 指定 ref = `006-pipeline-mvp`，尚未 merge 回 `develop`
      （FR-027a）**。另 **AC10 條目 MUST 附兩個確認欄位**：「已先執行 C7a 重置 `state` 分支」與
      「本次觸發**未帶 `force`**」（FR-027b；兩者缺一則該條證據不成立）
      （FR-025 / FR-027 / FR-027a / FR-027b / SC-009 / SC-010）
- [ ] T034 [P] [US5] 新增祕密掃描測試（放入 `tests/unit/zero-llm.test.ts` 或新建
      `tests/unit/docs-secrets.test.ts`）：斷言 `docs/runbook.md` 與 `specs/006-pipeline-mvp/acceptance.md`
      中 Discord webhook URL 與金鑰值的出現次數為 **0**（FR-025 / FR-027 / SC-010）

**Checkpoint**: 維運文件與驗收模板就緒 → 可進入實機驗收

---

## Phase 8: Polish & 實機驗收（M3 完成條件）

**Purpose**: 清理重疊測試、跑完 quickstart 全套、完成實機驗收並留下證據

- [ ] T035 [P] 依 [contracts/e2e-harness.md](./contracts/e2e-harness.md) §4 檢視
      `tests/unit/run-tracks.test.ts`：**保留**以 `pushTrack` 替身製造難以由 `fetch` 觸發之例外形狀的
      分支覆蓋案例，且**保留的每個案例 MUST 於註解註明其「`fetch` 攔截無法觸發」的分支理由**
      （FR-001 可稽核條件 ②）；**刪除**無此理由、或與 e2e 重疊且無額外分支價值者，避免雙份維護
- [ ] T035a [P] 依 [contracts/e2e-harness.md](./contracts/e2e-harness.md) **§3.1** 逐條核對
      `main` 流程的 **8 條結局路徑**（`SKIPPED`／`SKIPPED (completed)`／`SUCCEEDED`／`COMPLETED`／
      `FAILED` 推播失敗／`FAILED` 部分推播／全域性失敗／`DRY_RUN` 預覽）**各有至少 1 個 e2e 案例**，
      未覆蓋數為 **0**；若 §3.1 的「覆蓋檔案」欄與實際落地的測試不符 MUST 更新該表（SC-006）
- [ ] T035b [P] 補兩項**可稽核性**核對（皆為 review 型，不新增相依）：
      ① **FR-002d**——確認 `tests/e2e/**` 匯入的 `compile`／`render`／`checkBudget` 與 `src/main.ts`
      為**同一組實作**（憲章 IX），MUST NOT 存在測試專用的平行解析或渲染路徑；
      ② **FR-019「單一實作」**——確認全部通知（Track 告警／全域告警／完課通知）皆由
      `src/renderer/alert.ts` **單一檔案**匯出的函式族產生，且 `.github/workflows/daily.yml` 內
      **未另行拼組 Embed**；核對結果記入本任務勾選即可，無須另建測試
- [ ] T036 執行 [quickstart.md](./quickstart.md) **A 段**全套（`npm run build`／`npm run typecheck`／
      `npm test`／`npm run validate:content`），確認四項綠燈且 `npm test` 已包含 `tests/e2e/` 的全部檔案
- [ ] T037 執行 [quickstart.md](./quickstart.md) **B 段**本機預覽（`DRY_RUN=true`、webhook 一律用
      `example.invalid`）：確認三軌各印出完整 embeds 與字元預算逐項明細、**無任何對外請求**、
      `STATE_FILE` 不被建立；另驗證完課版面（`currentSessionIndex` 設為 `99`）
- [ ] T038 依 [research.md](./research.md) R8 與 `docs/runbook.md`，把 `state` 分支的 `state.json`
      **人工重置為三軌初始值**（`currentSessionIndex: 1`、`lastPushAt: null`、`completedConceptIds: []`、
      `history: []`，且無 `completedAt`），以一次人工 commit 完成；此操作同時是 runbook「調整某軌進度」
      的第一次實地演練。**注意**：C 段中途的 **C7a 會再做一次相同的重置**（為了讓 AC10 得以在不帶
      `force` 的前提下取得證據），兩次重置是同一個正規操作、非重複工序
- [ ] T039 確認 GitHub repo Settings 的 **Default branch = `develop`**，並把確認結果記入
      `specs/006-pipeline-mvp/acceptance.md`（FR-024 / quickstart C1）
- [ ] T039a 確認 GitHub repo Settings → Secrets 中**三個 Track 的 webhook 皆已登錄**
      （`DISCORD_WEBHOOK_URL_FOUNDATION` / `DISCORD_WEBHOOK_URL_INTERVIEW_READY` /
      `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY`），勾選 `acceptance.md`「前置確認」的對應項；
      **MUST 只記錄「已登錄」的事實，MUST NOT 記錄任何 URL 或片段**。此為三軌實機驗收（AC2 / AC5 /
      AC10）的硬前提——缺任一項時 C2 只會有兩個頻道收到訊息，會被誤判為交叉錯送
      （FR-025 / quickstart C 段前置）
- [ ] T040 依 [quickstart.md](./quickstart.md) **C 段**（C2–**C10**，含新增的 **C7a**）完成實機驗收，
      逐條把「實際觀察 + Actions run 連結」填入 `specs/006-pipeline-mvp/acceptance.md` 並勾選七條 AC
      （**C10 即 AC9 後半的證據來源：`dry_run=true` 觸發 → 零推播、`state` 分支無新 commit**）；
      一併記錄各次 run 的耗時，**每次 run MUST ≤ 10 分鐘**才得勾選該條（SC-009）；紀錄中
      **MUST NOT 出現任何 webhook URL 或金鑰**（FR-027 / SC-009 / SC-010）。
      **兩項執行約束（MUST）**：① 全部觸發以 `workflow_dispatch` 指定 **ref = `006-pipeline-mvp`**，
      **MUST NOT 為取得證據而先 merge 回 `develop`**（FR-027a）；② **C8（AC10）MUST NOT 帶 `force`**，
      故 MUST 先做 C7a 重置 `state` 分支讓日期 guard 放行（FR-027b）。
      另補 **SC-003 後半的查核**：以 `git log` 依 bot 提交者身分（`leetcode-daily-coach-bot`）篩選
      `main` 與 `develop`，確認**自本 Feature 分支建立之後**的 bot 狀態提交數為 **0**，並把該查核指令
      與結果記入 `acceptance.md`（MUST NOT 僅以目視宣稱）
- [ ] T041 依 [quickstart.md](./quickstart.md) **D 段**完成維運操作驗證：僅依 `docs/runbook.md`、
      不看原始碼、不改程式完成五項操作（啟用／暫停／改進度／強制補推／預覽），五項全部成功（SC-008）
- [ ] T042 [P] 回填 `specs/006-pipeline-mvp/checklists/` 四份需求品質 checklist 中因本階段實作而確認的
      項目，並更新 `specs/006-pipeline-mvp/spec.md` 的 Status 為 Completed

**Checkpoint**: `acceptance.md` 七條 AC 全數勾選 → **F6 完成 ⇒ MVP 達成（M3）**

---

## Dependencies & Execution Order

### Phase 相依

- **Phase 1（Setup）**：無相依，立即可開始
- **Phase 2（Foundational）**：依賴 Phase 1 — **阻塞全部 User Story**
- **Phase 3–6（US1–US4，皆 P1）**：依賴 Phase 2；四者**彼此獨立**，可平行
- **Phase 7（US5，P2）**：依賴 Phase 2；文件類任務其實不依賴 e2e，可**與 Phase 3–6 完全平行**
- **Phase 8（Polish & 實機驗收）**：T035–T037 依賴 Phase 3–6；T038–T041 依賴 Phase 7 的 runbook 與
  acceptance 模板；**T040 是本 Feature 的完成條件**

### User Story 相依

- **US1 / US2 / US4（P1）**：僅依賴 Foundational，彼此無相依
- **US3（P1）**：僅依賴 Foundational；但**它是唯一改動 `state-store.ts` 與 `main.ts` 的 Story**
- **US5（P2）**：文件與 workflow，與四個 P1 Story 無程式相依

### 跨 Story 的檔案衝突（平行時必須注意）

| 檔案 | 涉及任務 | 處置 |
| --- | --- | --- |
| `src/renderer/alert.ts` | T016（US3 完課通知）、T024（US4 遮蔽） | **MUST 序列**，建議先 T016 再 T024 |
| `tests/unit/alert.test.ts` | T021（US3）、T025（US4） | **MUST 序列**，或分別置於不同 `describe` 後合併 |
| `src/main.ts` | T017、T018（US3）、T024a、T028a（US4） | **MUST 序列**；T024a 依賴 T024 的遮蔽函式先匯出 |
| `src/state/state-store.ts` | T014、T015、T015a（皆 US3） | 同 Story 內序列 |
| `tests/unit/state-load.test.ts` | T019、T019a（皆 US3） | 同 Story 內序列，或分置不同 `describe` |
| `tests/e2e/isolation.test.ts` | T026–T029b（皆 US4） | 同 Story 內序列（同一檔案） |
| `docs/runbook.md` | T030、T031、T031a、T031b（皆 US5） | 同 Story 內序列（同一檔案） |

### 平行機會

- **Phase 3–6 可四線同時進行**（四個 P1 Story 各自一支 e2e 檔案，互不衝突），僅需注意上表的
  `alert.ts` / `alert.test.ts` 衝突
- **Phase 7 全程可與 Phase 3–6 平行**（純文件與 workflow）
- 標 [P] 的任務：T009、T009a、T016、T019、T019a、T020、T021、T025、T025a、T029a、T030、T032、T033、
  T034、T035、T035a、T035b、T042
- **T004 例外**：雖屬 US1，但 MUST 在 T005 之後執行（需 `tests/e2e/` 至少有一支檔案），不可與 T005 平行

---

## Parallel Example: 四個 P1 Story 同時開工

```bash
# Phase 2 完成後，四線並行（各自獨立的 e2e 檔案）：
Task: "T005 三軌不交叉與目標 URL 對應 in tests/e2e/three-tracks.test.ts"     # US1
Task: "T010 同日去重與位元組不變 in tests/e2e/guard-and-modes.test.ts"        # US2
Task: "T014 completedAt 欄位與載入驗證 in src/state/state-store.ts"           # US3
Task: "T026 單軌失敗隔離 in tests/e2e/isolation.test.ts"                      # US4
Task: "T030 維運 runbook in docs/runbook.md"                                  # US5（P2，可同時）
```

```bash
# US3 內部的平行段（不同檔案）：
Task: "T019 completedAt 載入／儲存單元測試 in tests/unit/state-load.test.ts"
Task: "T020 markCompleted 單元測試 in tests/unit/state-advance.test.ts"
Task: "T021 renderCompletionNotice 契約測試 in tests/unit/alert.test.ts"
```

---

## Implementation Strategy

### MVP First（四個 P1 Story）

本 Feature 的特殊之處：**四個 Story 都是 P1**，因為 MVP 的定義就是「三頻道每日自動收到各自 Track 的
課程，且單軌故障不拖垮其他軌」。任一 Story 缺席都不構成可上線的 MVP。

1. Phase 1 → Phase 2（攔截器與守門測試就位）
2. Phase 3（US1）→ **STOP and VALIDATE**：AC2 / AC5 / AC6 的自動化證據到手，這是產品的存在理由
3. Phase 4–6（US2 / US3 / US4）→ AC3 / AC4 / AC10 補齊
4. Phase 7（US5）→ 上線與維運能力
5. Phase 8 → **實機驗收**（M3 完成條件，T040 全數勾選才算完成）

### 遞增交付

- **Phase 2 完成**：替身邊界已被機器守住，後續任何 e2e 都不可能偷用 `pushTrack`
- **Phase 3 完成**：MVP 的核心命題（三頻道各收各自課程）取得邏輯層證據
- **Phase 6 完成**：邏輯層 MVP 完整——AC2/3/4/5/6/10 全部有自動化證據
- **Phase 8 完成**：實機證據到位 → M3 里程碑達成

### Commit 節奏（依 CLAUDE.md 的 `/speckit-implement` 規則）

每完成一個 Phase 或一個 User Story 的實作＋測試即建立一個 commit，掛 `006-pipeline-mvp` scope，
type 依該段主要性質（e2e 測試段用 `test`、狀態契約與完課行為用 `feat`、runbook 與 acceptance 用 `docs`、
`daily.yml` 正名用 `ci`）；該段的 `tasks.md` 勾選併入該段 commit。

---

## Notes

- **[P] = 不同檔案、無未完成相依**；跨 Story 平行時務必先看〈跨 Story 的檔案衝突〉表
- **標【驗證既有】的任務只補測試與文件，MUST NOT 改程式**（T029 的 FR-021a、以及 daily.yml 既有的
  無變更不提交邏輯）
- **2026-07-29 `/speckit-analyze` 後新增的任務**：T015a／T019a（未知 Track 鍵，FR-031）、
  T024a／T025a（執行記錄遮蔽，FR-025a）、T028a（部分推播告警文案，FR-012）、T029b（存檔失敗與
  無頻道可發，FR-013a／FR-020a）、T031a／T031b（runbook 六項新增要求，FR-023）、T035b（FR-002d／
  FR-019 可稽核性核對）。其中 **T015a、T024a、T028a 為程式改動**，其餘為測試與文件
- 每個 User Story 皆可獨立完成與驗證；任一 Checkpoint 都可停下來單獨驗證該 Story
- 本 Feature 的完成判定不在「程式寫完」，而在 `acceptance.md` **七條 AC 全數勾選**（FR-027）
