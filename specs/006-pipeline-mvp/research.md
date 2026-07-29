# Phase 0 Research: 006-pipeline-mvp

**Date**: 2026-07-24 | **Plan**: [plan.md](./plan.md)

Technical Context 無 NEEDS CLARIFICATION（技術選型已由憲章「技術與資源約束」釘死，本 Feature 零新增相依）。
以下 11 項為實作前必須定案的設計決策；spec 的 Clarifications 已定案者標註來源，其餘由本文件裁決。

---

## R1：完課的判定條件與判定位置

**Decision**：在 `run()` 的逐 Track 迴圈中，**per-track 日期 guard 之後、`compileLesson` 之前**插入完課檢查。
判定式為 `currentSessionIndex > max(schedule.sessions[].sessionIndex)`，資料取自已載入的
`deps.schedules[track]`。

**Rationale**：

- 放在 guard 之後：今天已推過的軌本來就該直接 `skipped`，不需要也不應該重算完課。
- 放在 compile 之前：`getSessionPlan()` 對超出範圍會拋「sessionIndex 超出課表範圍」，若靠**捕捉錯誤字串**
  來辨識完課，等於用錯誤訊息當控制流，一旦 F5 改文案就會靜默退回「視為失敗」的舊行為。
- 用 `max(sessionIndex)` 而非 `sessions.length` 或 `find()` 失敗：**課表中間缺號**（生成器產出異常）
  MUST 仍是該軌的失敗（紅色告警），只有「走過終點」才是完課。`length` 在缺號時會誤判，`find()` 失敗
  則無法區分兩者。
- **空課表 MUST 先於判定式擋下**（2026-07-29 code review 後補）：`sessions` 為空時 `max(...)` 無定義，
  以 `reduce(..., 0)` 的初始值 `0` 代入會讓任何 `currentSessionIndex ≥ 1` 都「超出最大值」，使課表
  產物異常靜默走進完課終態並寫入 `completedAt`（修好課表後仍需人工清狀態）。空課表與中間缺號同屬
  生成物異常，MUST 一致地判為該軌失敗。

**Alternatives considered**：

| 方案 | 否決理由 |
| --- | --- |
| 捕捉 compile 拋出的「超出課表範圍」錯誤 | 以錯誤訊息做控制流；且無法區分「缺號」與「走完」 |
| 在 `compile()` 內回傳特殊 `Lesson` 型別 | 汙染 F5 的 `Lesson` 契約（本 Feature Out of Scope 明列不改 F5） |
| 由 StateStore 在 `load()` 時判定 | StateStore 不該認識課表（會新增一條「狀態層讀內容」的相依） |

---

## R2：`completedAt` 的欄位形狀與寫入時機

**Decision**：`TrackState.completedAt?: string | null`（ISO 8601）。**缺席或 `null` 皆代表未完課**。
於「首次偵測到完課且完課通知送出成功」後就地寫入，由既有的**單次 `save()`** 落盤。
**`lastPushAt` 與 `history` / `completedConceptIds` 一律不動**（完課不是一次推播）。

**Rationale**：選填欄位讓現有 `state` 分支的 `state.json` 不需遷移即可載入（向後相容，`docs/spec.md` §19
已定）。不動 `lastPushAt` 是為了保住它「最後一次真正推課的時間」這個單一語意——若讓完課通知也更新它，
日期 guard 與 history 的語意會與「推了一課」混淆，而完課後的跳過已完全由 `completedAt` 負責。

**通知失敗時 MUST NOT 寫入 `completedAt`**：否則使用者永遠收不到完課通知（下次執行會靜默跳過）。
此情境比照該軌失敗處理（紅色告警 + 計入非零 exit code），下次執行會重試發送。

**Alternatives considered**：以 `currentSessionIndex === length + 1` 隱式推導完課（否決：無法表達「已通知」
這個一次性事實，補跑時會重複發送）；新增 `status: "active" | "completed"` 列舉（否決：多一個與
`completedAt` 重疊的真相來源，且不向後相容）。

**2026-07-29 修訂（FR-022b，code review 後）**：`completedAt` 存在但 `currentSessionIndex` **未超出**
課表最大 `sessionIndex` 時，MUST 自動清除該欄位（`clearCompleted()`，只刪鍵）並照常續推。原設計要求
「程式一律不自動清除、僅由 runbook 要求人工處理」，但三軌在 F7 課綱進來前必然完課，而 F7 把課表由
各 13 課延長到約 180 課後，殘留的 `completedAt` 會讓三軌**每天靜默跳過、exit 0、零訊息**——沉默失敗
（憲章 XV）。原理由「狀態層不認識課表」只適用於 `state-store.ts`：判定發生在 `main.ts`，該處本就持有
`deps.schedules[track]`，`clearCompleted()` 仍只負責刪鍵。自動解除的觸發條件僅限「不變式已被違反」，
MUST NOT 擴大為其他進度自動修正；停用某軌的正規手段仍是移除 webhook 設定，故不會誤傷刻意停課。

---

## R3：完課通知的產生位置與顏色

**Decision**（spec Clarification 4 已定案歸屬，此處補實作細節）：在 `src/renderer/alert.ts` **同一檔案**
新增 `renderCompletionNotice(track: Track): DiscordEmbed[]`，顏色用綠色 `3066993`（`0x2ECC71`），
標題採「🎉 課程完成 · {track}」。不經過 `compile()` / `render()`，不需要 `Lesson`。

**Rationale**：FR-019a 要求「與告警相同的單一通知實作」。同檔並列讓「流程層通知只有這一處」在實體檔案
層面可驗（`grep` 得到單一來源），也避免為單一 Embed 新增模組。顏色語意與紅色 `15158332` 明確對比。
`alert.ts` 位於 `renderer/` 但只 import 型別，仍符合憲章 XI。

**Alternatives considered**：新增 `src/renderer/notice.ts`（否決：把兩種通知拆到兩檔，反而弱化「單一實作」
的可驗性）；沿用 `renderAlert` 只改顏色參數（否決：標題「⚠️ 推播失敗」語意錯誤，且會讓呼叫端得傳
兩個彼此耦合的參數）。

---

## R4：完課檢查與 `DRY_RUN` / `FORCE` 的交互

**Decision**：

| 情境 | `DRY_RUN=true` | `FORCE=true` | 一般 |
| --- | --- | --- | --- |
| 已有 `completedAt` | log `completed (skipped)`，不發送 | **仍跳過**（force 只繞過日期 guard） | 靜默跳過 |
| 超出課表且無 `completedAt` | log「would send completion notice」，**不寫** `completedAt` | 發送 + 寫入 | 發送 + 寫入 |

**Rationale**：`FORCE` 的既有語意是「繞過同日去重」（`docs/spec.md` §21.1），不是「重播已完課的課程」；
讓 force 重發完課通知只會製造重複打擾，而真正要重來的維運操作是編輯 `state.json`（見 R9）。
`DRY_RUN` 一律不推播、不寫狀態，沿用 F1 既有裁決。

---

## R5：端到端測試的替身邊界與組織方式

**Decision**（spec Clarification 3 已定案邊界）：新增 `tests/e2e/`，以 `vi.stubGlobal("fetch", recorder)`
為**唯一替身**；`run(env, { webhookOptions: { sleep, random } })` 僅注入重試等待與 jitter（消除測試耗時
與不確定性，非行為替身）。**MUST NOT** 於 `tests/e2e/` 內出現 `pushTrack`。

**Rationale**：`WebhookClient` 的重試／退避／`Retry-After`／4xx 不重試／部分推播判定全在 `fetch` 之上，
是 US4 最需要證據的一段；注入 client 替身會把它整段跳過。真實 `state.json` 寫入以
`mkdtempSync` 產生的暫存目錄承接（既有測試已是此模式）。

**守門機制**：新增一筆掃描測試，斷言 `tests/e2e/**` 的原始碼**不含** `pushTrack` 字樣（SC-006 可機驗）。

---

## R6：AC5（共用教材、難度分歧）的固定 fixture

**Decision**：以 Concept **`prefix-sum`** 為斷言對象——三軌的 seed 課表中它都落在 **sessionIndex 9**，
且題目難度帶不同：

| Track | sessionIndex | problemIds（難度） |
| --- | --- | --- |
| foundation | 9 | `303`（Easy） |
| interviewReady | 9 | `303`（Easy）、`560`（Medium） |
| interviewMastery | 9 | `560`（Medium） |

斷言：三軌 Lesson 的 `concept.digest` / `tsTip` / `pyTip` / `takeaway` / `exitCriteria` **逐字相同**，
而 `problems` 的難度集合互不相同。

**Rationale**：需要一個「三軌同時存在且難度確實分歧」的 Concept。`array-traversal` / `in-place-operations`
在 interviewMastery 無題目（題庫無 Hard 題），無法展示「難度帶不同」；`prefix-sum` 是唯一三軌皆有題且
難度帶分歧者。

**風險與處置**：此 fixture 依賴 seed 課表，F7 全量課表進來後 sessionIndex 會變動。測試 MUST 以
**「在三份課表中尋找同一 conceptId 的 concept 類 Session」** 的方式取得索引，MUST NOT 硬編 `9`——
硬編會讓 F7 一換課表就紅燈，而 `prefix-sum` 本身在正式課綱中仍會存在。若未來找不到符合條件的
Concept，測試 MUST 明確失敗（而非靜默跳過），以免 AC5 失去證據。

---

## R7：US1 Scenario 3「三軌 Session 類型不同」的測法

**Decision**：seed 課表三軌的**同一 index 類型完全相同**（1 concept / 3 practice / 5 challenge /
6 review / 7 rest / 8 concept…），故此情境 MUST 以**三軌不同 `currentSessionIndex`** 造出：
`foundation=3`（practice）、`interviewReady=5`（challenge）、`interviewMastery=8`（concept），
斷言三則訊息版面類型不同且各自通過預算檢查。

**修訂（2026-07-24 checklist 後）**：原訂 `interviewMastery=7`（rest）與 spec US1-2 的 `3 / 5 / 8`
不一致，已統一為 **`3 / 5 / 8`**——spec 為真實來源，且 index 8 的 concept 是**結構最完整的版面**
（可能拆成多則訊息、預算最緊、含 Digest／TS/Python Tip／path／Exit Criteria／Takeaway 全部區塊），
對「不交叉錯送 + 內容對應自己 index」的驗證價值高於 rest。
rest / review 版面的覆蓋由 F5 既有測試與 `content-gate.yml` 的全量編譯負責，本 Feature 不重複建置。

**修訂（2026-07-29 `/speckit-analyze` 後）**：上段原寫「index 8 的 concept …**含題目難度帶**」，
與 seed 課表事實不符，已更正如上。實測 seed 課表，`3 / 5 / 8` 這三個 Session 的 `problemIds`
**皆為空集合**：

| Track | sessionIndex | type | conceptId | problemIds |
| --- | --- | --- | --- | --- |
| foundation | 3 | practice | — | `[]` |
| interviewReady | 5 | challenge | — | `[]` |
| interviewMastery | 8 | concept | `in-place-operations` | `[]` |

故 `3 / 5 / 8` 情境**只能**驗證「版面類型分歧 + 不交叉錯送 + 預算通過」，**MUST NOT** 在此情境斷言
題目內容或難度帶（會必然紅燈）。**難度帶的證據一律由 R6 的 `prefix-sum`（index 9）情境承擔**——
該處三軌 `problemIds` 分別為 `[303]` / `[303, 560]` / `[560]`，難度集合 {Easy} / {Easy, Medium} /
{Medium} 三者互異，是 seed 素材中唯一可展示 AC5 的 Concept。

**Rationale**：這同時覆蓋了 US1 Scenario 2（各軌走自己的進度）與 Scenario 3（類型分歧），且不需要
偽造課表——偽造會讓測試離開「真實素材」的前提（FR-001）。

---

## R8：`state` 分支現況的處置（F1 殘留進度）

**Decision**：MVP 上線前，依 runbook 把 `state` 分支的 `state.json` **重置為三軌初始值**
（`currentSessionIndex: 1`、`lastPushAt: null`、`completedConceptIds: []`、`history: []`），
以一次人工 commit 完成，**不寫程式**。

**Rationale**：現況 `foundation` 為 `currentSessionIndex: 4`，且 `history` / `completedConceptIds` 記的是
F1 硬編 demo 時期的 `left-right-pointer`（同一 conceptId 連續三筆），與真實課表內容不符。留著會讓 AC2
的「Session 1 課程」無法在 foundation 觀察到，也讓 history 成為誤導性資料。重置本身就是 FR-023 runbook
「調整某軌進度」操作的第一次實地演練（一石二鳥）。

**Alternatives considered**：寫一支遷移腳本（否決：一次性操作不值得長期維護，且違反「state 只經 StateStore
讀寫、不新增平行工具」的精神）；保留現況只補 `interviewReady` / `interviewMastery`（否決：foundation 的
history 仍是假資料，AC4 的觀察會被雜訊干擾）。

---

## R9：runbook 的交付位置與分工

**Decision**：新增 **`docs/runbook.md`**（日常維運），與既有 `docs/setup-guide.md`（一次性環境建置）分工：
setup-guide 回答「第一次怎麼把系統立起來」，runbook 回答「立起來之後每天怎麼操作與排查」。
runbook 首段 MUST 交叉連結 setup-guide，避免使用者找錯文件。

**內容清單（FR-023）**：啟用／暫停／續播一個 Track、調整某軌進度（含清除 `completedAt`）、手動補推
（`force`）、預覽版面（`dry_run`）、`state` 分支的人工編輯流程、**每日排程實際跑 `develop`**、
推播失敗時的排查起點（Actions log → 告警 Embed → `state.json` diff）。

**Rationale**：兩份文件的讀者情境（一次性 vs. 反覆查閱）與生命週期不同；合併會讓日常查閱得先跳過
一次性章節。

---

## R10：`daily.yml` 的預設分支正名（FR-024）

**Decision**：把 `Checkout main` step 更名為 `Checkout default branch (develop)` 並加註解說明
「`schedule` 事件只執行預設分支上的 workflow；本 repo 預設分支為 `develop`」。**不加 `ref:` 參數**
（`actions/checkout` 預設取觸發 workflow 的 ref，正是我們要的）。另需人工確認 GitHub repo 設定的
Default branch 為 `develop`（`origin/HEAD` 現況即指向 `develop`），此確認列入 `acceptance.md`。

**Rationale**：現行 step 名稱「Checkout main」與實際行為不符，是上線後最容易誤導排查的一處。加上
`ref: develop` 反而有害——它會讓 `workflow_dispatch` 從其他分支手動觸發時仍抓 `develop` 的內容，
使測試與正式行為分歧。

---

## R11：實機驗收紀錄的形式（FR-027）

**Decision**：`specs/006-pipeline-mvp/acceptance.md`，每條 AC 一個小節，欄位為
「操作步驟 / 預期結果 / 實際觀察 / Actions run 連結 / `- [ ]` 勾選」。由 implement 階段建立**空白模板**，
由維運者實機執行後填寫。內容 MUST NOT 含 webhook URL 或金鑰（以既有 secrets 掃描測試的同一手法守住）。

**Rationale**：M3 的完成判定必須落在可檢查的產物上，否則「驗收過了」只存在於對話裡。放在 Feature 目錄
（而非 `docs/`）是因為它是**一次性的里程碑證據**，不是長期維運文件——後者是 `docs/runbook.md`。

---

## 決策速查

| # | 決策 | 影響檔案 |
| --- | --- | --- |
| R1 | 完課判定 = `currentSessionIndex > max(sessionIndex)`，置於 guard 後、compile 前；**空課表 MUST 判為該軌失敗** | `src/main.ts` |
| R2 | `completedAt?: string \| null`；通知成功才寫；不動 `lastPushAt` / `history`；**課表延長 ⇒ 自動 `clearCompleted()`（FR-022b）** | `src/state/state-store.ts`、`src/main.ts` |
| R3 | `renderCompletionNotice()` 與 `renderAlert()` 同檔，綠色 `3066993` | `src/renderer/alert.ts` |
| R4 | force 不繞過完課；dry-run 不寫 `completedAt` | `src/main.ts` |
| R5 | E2E 唯一替身 = 全域 `fetch`；掃描測試禁止 `pushTrack` | `tests/e2e/**`、`tests/helpers/fetch-recorder.ts` |
| R6 | AC5 fixture = `prefix-sum`（動態查索引，不硬編） | `tests/e2e/three-tracks.test.ts` |
| R7 | 類型分歧以三軌不同 index（**3 / 5 / 8**）造出 | `tests/e2e/three-tracks.test.ts` |
| R8 | 上線前人工重置 `state` 分支為三軌初始值 | `state` 分支（無程式） |
| R9 | 新增 `docs/runbook.md`，與 `setup-guide.md` 分工 | `docs/runbook.md` |
| R10 | checkout step 正名，不加 `ref:` | `.github/workflows/daily.yml` |
| R11 | `acceptance.md` 勾選表為 Feature 完成條件 | `specs/006-pipeline-mvp/acceptance.md` |
