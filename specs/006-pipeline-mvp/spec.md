# Feature Specification: 每日 Pipeline 端到端、多 Track 失敗隔離與 MVP 驗收

**Feature Branch**: `006-pipeline-mvp`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "feature 006-pipeline-mvp"

## 背景與目的

本 Feature 是 LeetCode Daily Coach 的第六個切片（對應 `docs/spec.md` §22.5 **F6**、§23 Phase 2、里程碑
**M3**），依賴 F1（`001-walking-skeleton`，CLI 骨架 / StateStore / Webhook client / `daily.yml` 雙 cron /
`state` 分支）與 F5（`005-lesson-compiler`，Lesson Compiler 與全 Session 類型 Renderer）。**本 Feature 完成
即達 MVP**——三個 Discord 頻道每日自動收到各自 Track 的課程。

前五個 Feature 交付的是**元件**：DAG、題庫、課表、Overlay、Compiler、Renderer、StateStore、Webhook client、
Actions workflow。本 Feature 交付的是**把這些元件在真實素材上接成一條每日跑得起來的產線，並完成 M3 驗收**。

**為什麼這仍是一個實質的 Feature（而非「已經做完了」）**：`src/main.ts` 目前確實已有 §18 的流程骨架
（逐 Track 迴圈、per-track 日期 guard、失敗隔離、狀態推進、單次存檔、DRY_RUN），但這條路徑**從未被真實素材
端到端執行或驗收過**：

- 現有 `run()` 的自動化測試（`tests/unit/run-tracks.test.ts`）**一律注入 `pushTrack` 替身**，因此
  「課表 → Compiler → Renderer → 預算檢查 → 逐則 POST → 狀態推進」這條真實鏈路在 `run()` 層**沒有任何
  覆蓋**；三個 Track **同時啟用**的情境也從未被測過（既有測試最多啟用兩軌，且皆為替身）。
- 三個 Track 的 webhook 從未同時設定過，因此 §24 **AC2**（三頻道各收到各自 Track 的課程）、**AC5**
  （教材共用、難度分歧）、**AC10**（失敗隔離）**尚未取得驗收證據**。
- `state` 分支的 `state.json` 目前只承載 F1 單軌驗證的殘留進度，尚未涵蓋三軌；**AC4**（各 Track 獨立 +1、
  單次 commit、`main` / `develop` 無 bot commit）尚未在三軌情境下驗收。
- 「維運者如何啟用 / 暫停 / 調整某個 Track 的進度」（§9.2 Track 生命週期語意）在程式中已有行為，但**沒有
  任何一份可照著操作的文件**；MVP 上線後這是唯一的日常操作介面。
- 每日排程 workflow 實際會在哪個分支上執行（GitHub 的 `schedule` 事件只跑**預設分支**上的 workflow），
  尚未確認與文件化，是上線前必須釘死的一項。

因此本 Feature 的核心產出是：**真實素材端到端的自動化驗收**（取代替身測試）、**三軌同時上線**、
**維運 runbook**，以及**M3 實機驗收**。程式面預期只有小幅補強，MUST NOT 為了「看起來有寫程式」而重寫
F1 / F5 已定案且已驗證的行為。

**對應驗收基準**：`docs/spec.md` §24 **AC2**（三頻道各收到各自 Track 的 concept embeds）、**AC3**（同日
第二次觸發被 guard 跳過、`force` 可繞過）、**AC4**（成功才 +1、單次 commit 至 `state` 分支）、**AC5**
（教材共用、難度分歧）、**AC6**（無任何 LLM key 下端到端成功）、**AC10**（多 Track 失敗隔離）；
§22.5 F6 驗收；里程碑 **M3**。

## Clarifications

### Session 2026-07-24

- Q: 某 Track 的課表走完（`currentSessionIndex` 超出課表長度）後的長期行為為何？ → A: 完課語意——該軌發一則**非紅色的「課程完成」通知**並在狀態中記錄完課時間；之後每日該軌一律視為「跳過」，不發訊息、不計失敗、不影響結束狀態碼
- Q: 每日排程 workflow 實際應執行於哪個分支？ → A: 維持 `develop` 為 GitHub 預設分支，`schedule` 事件即執行 `develop` 上的 `daily.yml`；程式與內容併入 `develop` 即生效，不另設「發布分支」同步手續
- Q: 端到端驗證的替身邊界（FR-002 的「攔截層級」）應設在哪一層？ → A: 僅攔截**對外 HTTP 呼叫邊界**；推播程式的分則切割、重試、退避與錯誤分類皆為真實路徑，不得以 Webhook 用戶端替身或本機假伺服器取代
- Q: 「課程完成通知」這個新版面由誰產生？ → A: 併入推播程式既有的**通知產生器單一實作**（與紅色告警同路徑，僅顏色與文案不同），不經過 Compiler／Renderer、不需要 `Lesson`，本 Feature MUST NOT 修改 F5 產物
- Q: M3 實機驗收的「完成證據」以什麼形式留存？ → A: 於 Feature 目錄留一份實機驗收紀錄（`specs/006-pipeline-mvp/acceptance.md`），逐條列 AC2 / AC3 / AC4 / AC5 / AC6 / AC10，實機執行後填入 Actions run 連結與觀察結果並勾選；全數勾選才算本 Feature 完成（**2026-07-24 checklist 覆核後追加 AC9 後半，共七條**）

### Session 2026-07-24（`/speckit-checklist` 覆核後的定案）

四份需求品質 checklist（resilience / state / ops / e2e）揭露了四項需求文字層的矛盾或缺口，決策如下：

- Q: `dry_run` 不推播、不寫 state（AC9 後半）是否納入實機驗收紀錄？ → A: **納入為第 7 條**——US3-4 本就引用 AC9，且驗證成本極低（手動 dispatch 一次 `dry_run=true`）。AC9 前半（課表 byte-identical）屬 F4，不在本紀錄範圍（FR-027 / SC-010）
- Q: 告警 `reason` 可能夾帶 webhook URL，如何防？ → A: **在通知實作內建遮蔽**（FR-019b）——底層 `fetch` 例外訊息不受本專案控制，把責任放在呼叫端等於讓憲章 XIV 靠自律維護；遮蔽放在唯一出口才可稽核。已回寫 `docs/spec.md` §9.2
- Q: 三軌 e2e 的 `currentSessionIndex` 前提統一為何？ → A: **3 / 5 / 8**（practice / challenge / concept），以 spec US1-2 為準；research R7 與 e2e-harness 的 `3 / 5 / 7` 同步修訂。理由：index 8 的 concept 是最重的版面（多則訊息、預算最緊），驗證價值高於 rest
- Q: e2e 以 spy 斷言「存檔只發生一次」是否違反「唯一替身」條款？ → A: **不違反**——FR-002a 定義「替身＝替換行為的實作」，不改變行為的觀測工具不列入，但 MUST NOT 改寫回傳值或阻斷真實副作用

另有三項無需決策、直接依既有實作與真實來源對齊的修訂：**課程素材載入失敗**歸類為全域性失敗
（FR-021 / FR-021a，回寫 `docs/spec.md` §9.2 / §18）、**「單次 commit」語意**收斂為「至多一個、
無變更時為 0」（FR-015 / SC-002 / SC-003，回寫 `docs/spec.md` §19）、**課表中間缺號** MUST 判為
該軌失敗而非完課（Edge Cases / FR-022）。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 三個頻道各自收到自己 Track 的今日課程 (Priority: P1)

學習者在三個 Discord 頻道分別訂閱 Foundation / InterviewReady / InterviewMastery。某日早晨，每個頻道各自
收到**該 Track 今日進度**的課程訊息：同一個 Concept 的教學正文三軌相同，但搭配的題目難度依 Track 而不同；
若某 Track 今天排的是 practice / challenge / review / rest，收到的就是該類型的版面。

**Why this priority**: 這是整個產品的存在理由，也是 MVP 的定義本身。沒有這條路徑跑通，前五個 Feature 的
產出都只是躺在 repo 裡的資料。

**Independent Test**: 在三個 webhook 皆設定、`state.json` 三軌各有不同 `currentSessionIndex` 的情況下執行
一次推播，攔截對外請求：檢查恰好有三組請求、各自打到對應 Track 的 webhook、內容對應各自的 `sessionIndex`，
且同一 Concept 在不同 Track 的教學正文相同、題目難度不同。

**Acceptance Scenarios**:

1. **Given** 三個 Track 的 webhook 皆已設定、`state.json` 中三軌 `currentSessionIndex` 分別為 1 / 1 / 1，
   **When** 執行一次每日推播，**Then** 三個頻道各收到自己 Track 的 Session 1 課程訊息，且每則訊息只送往
   自己 Track 的 webhook（MUST NOT 交叉送錯頻道）。
2. **Given** 三軌的 `currentSessionIndex` 分別為 3 / 5 / 8，**When** 執行一次推播，**Then** 各 Track 收到
   的是各自 `sessionIndex` 對應的那一堂課，彼此互不影響。
3. **Given** 某一天三軌排的 Session 類型不同（例如 concept / rest / review），**When** 執行推播，
   **Then** 各頻道收到對應類型的版面，且皆通過 Discord 字元預算檢查。
4. **Given** 同一個 Concept 出現在多個 Track 的課表中，**When** 比對三軌的推播內容，**Then** 教學正文
   （Digest / Tips / Takeaway / Exit Criteria）逐字相同，題目難度帶依 Track 不同（AC5）。
5. **Given** 執行環境**完全沒有任何 LLM API key**，**When** 執行整條每日流程，**Then** 流程端到端成功
   （AC6），且不存在任何對 LLM 服務的呼叫。

---

### User Story 2 - 同一天不重複打擾、漏跑不跳課 (Priority: P1)

雙 cron（台北 06:07 主推 / 06:37 補跑）每天會觸發兩次。學習者每天只應該收到一次課；若主推那次因為 GitHub
Actions 延遲或跳過而沒推成，補跑那次要能遞補，而不是讓那一課被跳過。

**Why this priority**: 與 US1 同等關鍵——重複推播會讓使用者關掉通知，跳課會讓課程 DAG 的循序漸進失效。
且此行為只在「多 Track、各軌 `lastPushAt` 不同」時才顯出獨立判斷的價值。

**Independent Test**: 在同一個台北日期內對同一份 state 連續執行兩次推播，第二次應對所有已推播的 Track
跳過且不產生任何對外請求；把其中一軌的 `lastPushAt` 改成昨天，第二次執行時只有該軌被推播。

**Acceptance Scenarios**:

1. **Given** 三軌今天都已推播成功，**When** 同一個台北日期內再次執行，**Then** 三軌皆被跳過、無任何推播
   請求、`state.json` 內容不變（AC3）。
2. **Given** foundation 今天已推、interviewReady 的 `lastPushAt` 為昨天、interviewMastery 從未推過
   （`lastPushAt` 為空），**When** 執行推播，**Then** 只有 interviewReady 與 interviewMastery 被推播，
   foundation 被跳過。
3. **Given** 三軌今天都已推播，**When** 以強制模式執行，**Then** guard 被繞過、三軌照常推播並寫入狀態（AC3）。
4. **Given** 某 Track 的 `lastPushAt` 落在台北時間的當日凌晨（對應 UTC 前一日），**When** 於同一台北日期
   執行，**Then** 該 Track 被判定為「今天已推」而跳過（時區換算 MUST 以 Asia/Taipei 日期為準，非 UTC 日期）。
5. **Given** 三軌今天都已推播，**When** 以預覽模式執行，**Then** guard **不**擋下——三軌照常編譯、渲染並
   輸出至執行記錄，但不推播、不寫入狀態。

---

### User Story 3 - 各 Track 進度獨立推進並單次提交至 state 分支 (Priority: P1)

推播成功的 Track 各自前進一課，失敗的 Track 停在原地等下次補推；全部 Track 處理完後，三軌的進度以**單一次
提交**寫進專用的 `state` 分支，主開發分支不會被 bot 的每日提交淹沒。

**Why this priority**: 狀態是本專案的唯一權威來源。推進錯誤會直接造成跳課或重複上課，而錯誤的提交位置會
汙染主分支歷史。

**Independent Test**: 準備三軌不同進度的 state，令其中一軌推播失敗，執行一次推播後檢查存檔內容：成功兩軌
`currentSessionIndex` 各 +1 且 `lastPushAt` 更新，失敗軌完全不變；檢查提交紀錄為單一次、落在 `state` 分支。

**Acceptance Scenarios**:

1. **Given** 三軌皆推播成功，**When** 流程結束，**Then** 三軌 `currentSessionIndex` 各 +1、`lastPushAt`
   各自更新、`history` 各追加一筆（滾動上限 30 筆）、`completedConceptIds` 於 concept 類 Session 追加該
   Concept，且存檔動作**只發生一次**（AC4）。
2. **Given** 其中一軌推播失敗、其餘成功，**When** 流程結束，**Then** 失敗軌的進度**完全不變**，成功軌的
   進度**照常保存**（MUST NOT 因任一軌失敗而整批回滾）。
3. **Given** 三軌進度已更新，**When** 每日流程的提交步驟執行，**Then** 產生**恰好一個** commit 且推送至
   `state` 分支；`main` 與 `develop` 上不存在任何 bot 的狀態提交（AC4）。
4. **Given** 預覽模式執行，**When** 流程結束，**Then** 不寫入狀態檔、不產生任何提交（AC9 後半）。
5. **Given** 狀態檔的提交推送遭遇衝突（雙 cron 極罕見重疊），**When** 提交步驟執行，**Then** 以重新同步後
   重試處理，最多 3 次；耗盡後以失敗結束，MUST NOT 強制覆寫他人變更。
6. **Given** 某個先前未出現在狀態檔中的 Track 被新啟用，**When** 執行推播，**Then** 該軌以初始進度自動
   補建（從第 1 課開始）並於當次推播，其餘 Track 不受影響。
7. **Given** 某 Track 的 `currentSessionIndex` 已超出其課表的最大 `sessionIndex` 且尚未記錄完課，**When** 執行推播，
   **Then** 該軌收到一則非紅色的課程完成通知、狀態檔記錄該軌的完課時間、`currentSessionIndex` 不前進、
   整體結束狀態不受影響；**再次執行**時該軌一律靜默跳過，不再發送任何訊息。

---

### User Story 4 - 單一 Track 出事不拖垮其他 Track (Priority: P1)

某天 InterviewReady 的頻道 webhook 被誤刪、或該軌的內容編譯失敗。學習者仍應在其餘兩個頻道正常收到課程，
並在出事的頻道（若還能發）看到一則紅色告警知道發生了什麼；當日的執行整體標記為失敗，以便被發現。

**Why this priority**: 與 US3 同列 P1——失敗隔離是憲章第 XV 條的核心行為，也是 §24 AC10 的獨立驗收項；
沒有它，一個小故障會讓三個頻道同時斷課。

**Independent Test**: 令三軌之一的對外請求固定失敗，其餘正常，執行一次推播並檢查：其餘兩軌完成推播且進度
保存、失敗軌收到紅色告警且進度不動、整體以非零狀態結束。

**Acceptance Scenarios**:

1. **Given** 三軌皆啟用、其中一軌的推播請求固定失敗，**When** 執行推播，**Then** 其餘兩軌照常推播並推進
   進度，失敗軌發出紅色告警且進度不變，整體以非零狀態結束（AC10）。
2. **Given** 失敗軌的**告警本身也送不出去**，**When** 執行推播，**Then** 記錄一筆告警失敗紀錄、其餘 Track
   的處理**不被中斷**，整體仍以非零狀態結束（告警失敗 MUST NOT 逸出成未捕捉例外）。
3. **Given** 某軌的多則訊息推到一半失敗（第一則已送達），**When** 處理該軌，**Then** 該軌進度**照常前進**
   （避免補跑重貼已送出的前段），同時發出紅色告警並計入非零結束狀態。
4. **Given** 全域性失敗（三軌 webhook 皆未設定、狀態檔路徑未設定、狀態檔解析失敗或欄位語意損毀、
   **課程素材載入失敗**、存檔失敗），**When** 執行，**Then** 直接以非零狀態結束、發全域告警至第一個
   已設定的頻道（若有），且**不覆寫**原狀態檔。
5. **Given** 每日流程的推播程式根本沒能啟動（相依安裝或建置失敗），**When** workflow 結束，**Then** 使用者
   仍收到一則極簡純文字的最後防線通知（MUST NOT 由 workflow 另行拼組 Embed 告警版面）。

---

### User Story 5 - 維運者能啟用、暫停、調整任一 Track 的進度 (Priority: P2)

MVP 上線後，維運者（＝使用者本人）需要能夠：新增一個 Track 開始推播、暫停某個 Track、把某個 Track 的進度
往回調或往前跳、在漏推當天手動補推、在調版面時預覽而不打擾自己。這些操作全部不應該需要改程式。

**Why this priority**: 沒有這份能力與文件，MVP 上線後任何一次小狀況都要重讀原始碼才知道怎麼處理；但它不
阻擋「每日自動推課」這個核心價值，故列 P2。

**Independent Test**: 依照 runbook 的步驟，在不修改任何程式碼的前提下完成：啟用一個新 Track、暫停一個
Track（其進度保留）、把一個 Track 的進度改到指定課次、手動觸發一次強制補推、執行一次預覽。

**Acceptance Scenarios**:

1. **Given** 某 Track 尚未設定 webhook，**When** 加上該 Track 的 webhook 設定並執行下一次推播，
   **Then** 該軌自動從第 1 課開始推播，**不需要**任何其他設定或程式修改。
2. **Given** 某 Track 正在推播中，**When** 移除其 webhook 設定，**Then** 該軌被略過、其進度**原樣保留**；
   重新加回設定後**從原進度續播**，MUST NOT 重置為第 1 課。
3. **Given** 維運者想讓某 Track 從第 20 課開始，**When** 依 runbook 編輯 `state` 分支的狀態檔並提交，
   **Then** 下一次執行即從該課開始，且**不存在**任何「起始課數」之類的平行設定項。
4. **Given** 維運者想在不推播的情況下檢視今天三軌的版面，**When** 依 runbook 以預覽模式手動觸發，
   **Then** 可在執行記錄看到完整的訊息內容與字元預算明細，且不推播、不寫狀態。

---

### Edge Cases

- **某 Track 的課表走完**（`currentSessionIndex` 超出該軌課表的最大 `sessionIndex`）：視為該 Track 的**終態「完課」**，
  非失敗——首次偵測到時發一則**非紅色的課程完成通知**並於該軌進度記錄完課時間；其後每日該軌一律視為
  **跳過**（不發任何訊息、不推進進度、不計入失敗、不影響結束狀態碼）。其餘 Track 不受影響。因目前三軌
  課表為 F7 之前的種子課表（各 13 課），此情境在正式內容進來之前會實際發生。
- **課表中間缺號**（`currentSessionIndex` 在課表中找不到對應 Session，但**未超出**該軌課表的最大
  `sessionIndex`）：MUST 判為**該軌失敗**（紅色告警 + 非零結束狀態），MUST NOT 誤判為完課——完課的
  判定條件是「超出課表最大 `sessionIndex`」，不是「找不到這一課」。
- **狀態檔中存在已知但未啟用的 Track**：MUST 原樣保留其進度（含完課時間欄位），MUST NOT 於存檔時刪除。
- **狀態檔不存在**（`state` 分支初次使用）：視為空狀態，所有啟用 Track 以初始進度補建，不算失敗。
- **排程觸發時預覽 / 強制旗標為空值**（`schedule` 事件不帶 workflow 輸入）：MUST 一律視為關閉，
  MUST NOT 因空值而失敗或誤判為開啟。
- **預覽與強制同時開啟**：以預覽為準——不推播、不寫狀態，MUST NOT 視為設定衝突而失敗。
- **三軌連續推播觸發 Discord 限流**：MUST 由既有的退避重試吸收；重試耗盡才計為該軌失敗。
- **某軌內容超出字元預算**：於推播前擋下並計為該軌失敗（MUST NOT 截斷內容送出）；預覽模式下仍完整輸出
  逐項明細供調整，不因此視為失敗。
- **每日排程實際執行的分支**：`schedule` 事件只會執行**預設分支**上的 workflow；本專案的預設分支為
  `develop`，因此程式與內容**併入 `develop` 才會反映到每日推播**（併入 `main` 不影響推播）。此事實
  MUST 在 runbook 中明示。

## Requirements *(mandatory)*

### Functional Requirements

**端到端串接與驗收（本 Feature 的新增工作）**

- **FR-001**: 每日流程 MUST 以**真實素材**（三份課表 + Concept 教材 + 題庫 + Overlay + DAG）走完
  「載入狀態 → 逐 Track 判斷 → 編譯 → 渲染 → 預算檢查 → 推播 → 推進狀態 → 單次存檔」全鏈路，
  MUST NOT 保留任何僅存在於測試替身中的路徑。**此約束以下列兩項可稽核條件落實**（原文為不可證偽的
  絕對式敘述，2026-07-29 `/speckit-analyze` 後補實判準）：**① 端到端驗證的原始碼中 MUST NOT 出現推播
  替身**（`tests/e2e/**` 不含 `pushTrack`，以掃描測試機器守住）；**② 既有以替身撰寫的測試中，每個保留
  的案例 MUST 註明其「無法由對外 HTTP 攔截觸發」的分支理由**，無理由者 MUST 刪除。
- **FR-002**: MUST 具備**不注入推播替身**的端到端自動化驗證，覆蓋「真實編譯 → 真實渲染 → 攔截層級的
  對外請求 → 真實狀態推進與存檔」；MUST 涵蓋**三個 Track 同時啟用**的情境。**唯一允許的替身是對外 HTTP
  呼叫邊界**（另 MAY 注入重試等待與抖動參數以消除測試耗時）；分則切割、重試、退避、限流與錯誤分類
  MUST 為真實路徑，MUST NOT 以 Webhook 用戶端替身或本機假伺服器取代。斷言 MUST 落在被攔截請求的
  目標頻道與內容上。既有以 `pushTrack` 替身撰寫的測試 MAY 保留作為分支覆蓋，但 MUST NOT 作為
  AC2 / AC5 / AC10 的唯一證據。
- **FR-002a**: 前條所稱**替身**指「**替換受測行為**的實作」（fake / stub / mock）。**不改變行為的觀測
  工具**（記錄呼叫次數與參數、但仍執行真實實作並回傳其真實結果）**不列入替身**，MAY 用於斷言
  「存檔只發生一次」這類次數性質的要求；此類觀測 MUST NOT 改寫回傳值、MUST NOT 阻斷真實副作用
  （檔案仍須真的被寫出）。
- **FR-003**: 端到端驗證 MUST 斷言**每個 Track 的訊息只送往自己 Track 的頻道**（無交叉錯送），且訊息內容
  對應該軌自己的 `currentSessionIndex`。
- **FR-004**: MUST 驗證「同一 Concept 在不同 Track 的教學正文逐字相同、題目難度帶依 Track 不同」（AC5），
  以自動化方式比對至少一個橫跨多軌的 Concept。
- **FR-005**: MUST 驗證整條每日流程在**完全沒有任何 LLM API key** 的環境變數下端到端成功（AC6），且每日
  workflow 定義中 MUST NOT 出現任何 LLM 金鑰名稱。

**逐 Track 處理與去重（既有行為的正式化與驗收）**

- **FR-006**: MUST 由**單一流程、單一執行序**依固定順序（`foundation → interviewReady → interviewMastery`）
  逐一處理啟用的 Track；MUST NOT 以平行工作分派多 Track（會競爭 `state` 分支）。
- **FR-007**: 「該 Track 的 webhook 有設定」即代表該 Track 啟用；MUST NOT 需要任何其他設定項或程式修改
  即可啟用 / 停用一個 Track。
- **FR-008**: 每個 Track MUST 各自進行 idempotency guard：將該軌 `lastPushAt` 換算為 **Asia/Taipei 日期**，
  等於今天即跳過該軌；各軌獨立判斷，互不影響。
- **FR-009**: 預覽模式 MUST 略過 guard（照常編譯、渲染並輸出，不推播、不寫狀態）；強制模式 MUST 繞過
  guard 但仍寫狀態；兩者同時開啟時 MUST 以預覽模式為準。
- **FR-010**: 排程觸發時未帶輸入值的旗標 MUST 一律解讀為關閉。

**狀態推進與提交**

- **FR-011**: 某 Track 的進度 MUST 只在**該軌推播成功後**前進一課並更新 `lastPushAt`；推播失敗的 Track
  進度 MUST 保持不變（漏跑不跳課）。
- **FR-012**: 多則訊息推播到一半失敗（已有訊息送達）時，該軌進度 MUST **照常前進**，同時發紅色告警並
  計入非零結束狀態。
- **FR-013**: 全部 Track 處理完畢後 MUST **單次存檔**，且已成功 Track 的進度 MUST 保存，MUST NOT 因其他
  Track 失敗而回滾。
- **FR-014**: `history` MUST 滾動保留上限 30 筆；`completedConceptIds` MUST 於 concept 類 Session 去重追加。
- **FR-015**: 狀態檔 MUST 以**至多一個 commit** 提交至專用 `state` 分支；`main` / `develop` MUST NOT 出現
  任何狀態提交。預覽模式 MUST NOT 產生提交。**該次執行無任何進度變更時（例如三軌皆被跳過），提交步驟
  MUST 偵測到無變更並略過提交（commit 數為 0），MUST NOT 產生空 commit。**
- **FR-016**: 提交推送衝突 MUST 以「重新同步後重試」處理，上限 3 次；耗盡即以失敗結束，MUST NOT 強制覆寫。
- **FR-017**: 狀態檔中已知但未啟用的 Track MUST 原樣保留；啟用但狀態檔中不存在的 Track MUST 以初始進度
  自動補建。

**失敗隔離與告警**

- **FR-018**: 單一 Track 的編譯 / 渲染 / 預算 / 推播失敗 MUST 記錄錯誤、對該軌頻道發紅色告警、**繼續處理
  其餘 Track**；全部處理完後若有任一失敗 MUST 以非零狀態結束。
- **FR-019**: 告警版面 MUST 由推播程式以**單一實作**產生；全域性失敗發至第一個已設定的頻道。
  workflow 層 MAY 保留一道最後防線通知，但 MUST 為極簡純文字，MUST NOT 使用 Embed、MUST NOT 重述細節。
- **FR-019a**: FR-022 的課程完成通知 MUST 由**與告警相同的單一通知實作**產生（僅顏色與文案不同的資訊性
  Embed），MUST NOT 經過 Compiler / Renderer、MUST NOT 為此構造不存在於課表的 `Lesson`，且 MUST NOT
  修改 F5 的版面或解析邏輯。
- **FR-019b**: 通知實作 MUST 對失敗原因文字做 **Discord webhook URL 樣式的遮蔽**後才組進 Embed，
  MUST NOT 依賴呼叫端自律不帶入 URL（底層 `fetch` 例外訊息不受本專案控制，可能夾帶完整請求 URL）。
  遮蔽 MUST 為通知實作的內建行為並適用於全部通知種類；任何通知的 Embed 文字中 webhook URL 的出現
  次數 MUST 為 0。
- **FR-019c**: 課程完成通知**發送失敗**時，該 Track MUST 轉為失敗路徑：發紅色告警、計入非零結束狀態、
  且 MUST NOT 記錄完課時間（留待下次執行重試）。
- **FR-020**: 告警本身送不出去時 MUST 另記錯誤、仍計為該次失敗，且 MUST NOT 中斷其餘 Track 的處理。
- **FR-021**: 全域性失敗（無任何 webhook 設定、狀態檔路徑未設定、狀態檔解析失敗或欄位語意損毀、
  **課程素材載入失敗**、存檔失敗）MUST 以非零狀態結束並發全域告警，且 MUST NOT 覆寫原狀態檔。
- **FR-021a**: 課程素材（DAG / 題庫 / 三份課表 / 三份 Overlay）MUST 於進入逐 Track 處理**之前**載入；
  載入失敗 MUST 歸類為全域性失敗（FR-021），MUST NOT 降級為逐 Track 失敗而對三個頻道各發一則同因告警。
- **FR-022**: 某 Track 的 `currentSessionIndex` **超出該軌課表的最大 `sessionIndex`** 時 MUST 視為該軌的
  **完課（終態）**而非失敗（課表**中間缺號**不適用本條，見 Edge Cases，MUST 判為該軌失敗）：
  首次偵測到 MUST 發一則**非紅色**的課程完成通知，並於該軌進度記錄**完課時間**；已記錄完課時間者 MUST 於
  其後每次執行一律**跳過**（不發訊息、不推進進度）。完課 MUST NOT 計入非零結束狀態、MUST NOT 中斷或影響
  其他 Track。預覽模式下 MUST 只輸出至執行記錄而不發送、不寫入完課時間。

**上線與維運**

- **FR-023**: MUST 交付一份**維運 runbook**，涵蓋：啟用 / 暫停 / 續播一個 Track、調整某軌進度、手動補推
  （強制模式）、預覽版面（預覽模式）、`state` 分支的初始化與人工編輯方式、每日排程實際執行的分支，
  以及推播失敗時的排查起點。runbook MUST 只描述「不需改程式」即可完成的操作。
- **FR-023a**: runbook MUST 另行明示**已完課 Track 的重新推播程序**：把該軌 `currentSessionIndex` 調回
  課表範圍內時 **MUST 一併清除該軌的完課時間欄位**，否則該軌仍會被靜默跳過。程式 MUST NOT 自動清除
  該欄位（狀態層不認識課表），故此規則 MUST 以「沉默失敗警告」的形式寫入 runbook。
- **FR-024**: 每日排程 workflow MUST 執行於 repo 的**預設分支 `develop`**；MUST 確認該分支即為 GitHub 設定
  的預設分支，並在 runbook 明示「程式與內容併入 `develop` 才會反映到每日推播」。MUST NOT 於 workflow 內
  另行 checkout 其他分支取用程式或內容（避免 workflow 定義與執行內容分屬不同分支）。
- **FR-025**: 三個 Track 的 webhook 設定 MUST 全部就位於執行環境的密鑰管理中，MUST NOT 出現在 repo 或任何
  產物中；MUST NOT 提交 `.env` 或任何金鑰。
- **FR-026**: `state` 分支的狀態檔 MUST 已涵蓋三個 Track 的進度（缺漏者由自動補建處理），且其內容 MUST
  通過載入時的欄位語意驗證。
- **FR-027**: MUST 交付一份**實機驗收紀錄**（`specs/006-pipeline-mvp/acceptance.md`），逐條列出
  AC2 / AC3 / AC4 / AC5 / AC6 / **AC9（後半：`dry_run: true` 執行不推播、不寫 state；前半的課表
  byte-identical 屬 F4，不在本紀錄範圍）** / AC10，每條含「操作步驟、預期結果、實際觀察、對應的
  Actions 執行連結」與勾選欄位。本 Feature MUST 於全部條目勾選後才視為完成；紀錄中 MUST NOT 出現
  任何 webhook URL 或金鑰。

### Key Entities

- **每日執行（Daily Run）**：一次跟完即退的流程。輸入為「啟用的 Track 集合 + 狀態檔 + 凍結內容 + 兩個旗標
  （預覽 / 強制）」，輸出為「零至三次推播 + 一次狀態存檔 + 結束狀態碼」。
- **Track 進度（Track State）**：每個 Track 一份，含「下一課序號、最後推播時間、已完成 Concept 清單、
  近期推播歷史（上限 30 筆）、完課時間（選填，未完課時不存在）」。唯一權威，只在該軌推播成功後前進。
- **推播結果（Push Outcome）**：每個 Track 每次執行的四種結局之一——**跳過**（guard 命中或該軌已完課）、
  **成功**（進度前進）、**完課**（首次走完課表：發非紅色完成通知並記錄完課時間，不計失敗）、**失敗**
  （告警 + 計入非零結束狀態；其中「部分推播」為失敗但進度仍前進的特例）。
- **通知（Notice）**：由推播程式單一實作產生的流程層訊息，分為**告警**（紅色；「單一 Track 失敗」與
  「全域性失敗」兩種歸屬）與**課程完成通知**（非紅色，僅於該軌首次走完課表時發出）。皆不經過
  Compiler / Renderer。
- **維運 Runbook**：面向維運者的操作手冊，描述在不改程式的前提下對 Track 生命週期與進度的全部操作。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 三個 Track 全部啟用後執行一次每日流程，**三個頻道各收到恰好一則（或該課應有的多則）自己
  Track 的課程訊息**，無交叉錯送、無遺漏（對應 AC2）。
- **SC-002**: 同一個台北日期內連續執行兩次，**第二次產生零次推播**、狀態檔內容**位元組相同**，且該次
  執行在 `state` 分支產生的 commit 數為 **0**（對應 AC3）。
- **SC-003**: 一次**確有進度變更**的執行後，成功推播的 Track 其進度**恰好前進 1 課**（`currentSessionIndex`
  +1 且 `lastPushAt` 更新），未推播的 Track 其 `currentSessionIndex` / `lastPushAt` / `history` /
  `completedConceptIds` **全部欄位變化量為 0**；三軌進度以**恰好 1 個 commit** 落在 `state` 分支，
  `main` / `develop` 上自本 Feature 起的 bot 狀態提交數為 **0**（對應 AC4）。
- **SC-004**: 令任一 Track 的推播固定失敗時，**其餘 Track 的成功率維持 100%** 且進度正常保存，整體以
  非零狀態結束並發出告警（對應 AC10）。
- **SC-005**: 整條每日流程在**零個 LLM 金鑰**的環境下端到端成功；每日 workflow 定義中 LLM 金鑰出現次數
  為 **0**（對應 AC6）。
- **SC-006**: 端到端自動化驗證**不使用推播替身**（替身數僅 1：對外 HTTP 呼叫邊界），且 `main` 流程的
  **8 條結局路徑各有至少 1 個 e2e 案例覆蓋、未覆蓋數為 0**——`SKIPPED`（日期 guard）／
  `SKIPPED (completed)`／`SUCCEEDED`／`COMPLETED`（首次完課）／`FAILED`（推播失敗）／
  `FAILED`（部分推播）／全域性失敗／`DRY_RUN` 預覽（清單與對應檔案見
  [contracts/e2e-harness.md](./contracts/e2e-harness.md) §3.1，`main` 新增結局路徑時 MUST 同步擴充該表）。
- **SC-007**: 至少一個橫跨多個 Track 的 Concept，其教學正文在三軌推播內容中**逐字相同**，而題目難度帶
  **依 Track 不同**（對應 AC5）。
- **SC-008**: 維運者僅依 runbook（不閱讀原始碼、不修改程式）即可完成「啟用一個 Track、暫停一個 Track、
  把某軌進度改到指定課次、手動補推一次、預覽一次」五項操作，全部成功。
- **SC-009**: 一次完整的每日執行（`npm ci` → `tsc` → 推播 → 提交，即整個 workflow run 的耗時）
  **MUST ≤ 10 分鐘**（遠低於免費層配額；門檻於 2026-07-29 `/speckit-analyze` 後由「數分鐘內」收斂為
  可判定的數值，取 10 分鐘是為了讓 `npm ci` 快取失效或 runner 較慢時不至於誤判為驗收失敗），
  且未引入任何常駐服務或付費資源。
- **SC-010**: 實機驗收紀錄中 AC2 / AC3 / AC4 / AC5 / AC6 / AC9（後半）/ AC10 **七條全部勾選**
  （未勾選數為 0），每條各附至少一個真實 Actions 執行連結（**同一次 run 可同時佐證多條**）；
  紀錄中的金鑰／webhook URL 出現次數為 **0**。
- **SC-011**: 某 Track 走完課表後，該軌**僅收到一則**課程完成通知（其後每日發送次數為 0），且該情境下
  流程的結束狀態碼為 **0**（完課不計為失敗）。

## Assumptions

- **三軌內容為 F7 之前的種子課表（各 13 個 Session）**：本 Feature 的端到端驗收在此素材上進行；正式的
  180-Session 三軌課表由 F7 產出後直接沿用同一條流程，MUST NOT 需要修改本 Feature 的任何程式。
- **課表走完＝該 Track 的完課終態**（2026-07-24 clarify 定案，取代 F1「視為失敗」的既有裁決）：首次發一則
  非紅色完成通知並記錄完課時間，其後靜默跳過、不計失敗。此決策新增一個選填的「完課時間」欄位至 Track 進度，
  屬**跨 Feature 的狀態契約變更**，已回寫 `docs/spec.md`（§9.2 Track 生命週期、§18 Runtime Flow、
  §19 State Management 的 `completedAt`）。
- **M3 驗收包含實機驗證**：AC2 / AC3 / AC4 需要真實的 Discord webhook 與真實的 GitHub Actions 執行才能
  取得證據；自動化測試提供邏輯層保證，實機驗收提供上線證據，兩者皆為本 Feature 的完成條件。證據以
  `specs/006-pipeline-mvp/acceptance.md` 的勾選紀錄留存（FR-027，2026-07-24 clarify 定案）。
- **`state` 分支已存在**（F1 已初始化），本 Feature 只需補齊三軌進度，不需重建分支。
- **告警與推播共用同一個頻道**：本專案不另設告警頻道；某軌失敗時的告警發往該軌自己的頻道，全域失敗發往
  第一個已設定的頻道。
- **推播程式的行為面（guard / 隔離 / 推進 / 重試 / 告警）已由 F1、F5 實作並通過單元測試**：本 Feature 的
  程式改動預期為小幅補強（若端到端驗證揭露缺口），MUST NOT 重寫已定案且已驗證的行為。
- **每日排程執行於 repo 預設分支 `develop`**（2026-07-24 clarify 定案）：`origin/HEAD` 現況即指向
  `develop`，本 Feature 只需確認並文件化，不調整預設分支、不新增發布分支同步流程。`main` 仍僅作為
  `develop` 的驗收合併去處，不參與每日推播。已回寫 `docs/spec.md` §21。

## Out of Scope

- **內容產線**（課綱起草、全文展開、品質 Gate、節流與斷點續跑）：屬 F7；本 Feature 不生成任何教材。
- **Weekly Reflection 題庫與鼓勵語錄池**：屬 F8；review / rest 版面在素材缺席時省略該段落的行為由 F5 定案。
- **GitHub Pages 儀表板 / 全文閱讀 / RSS**：屬 F9。
- **Discord Slash Commands、每週測驗、自適應推薦**：屬 F10。
- **Compiler / Renderer 的版面與解析邏輯變更**：屬 F5；本 Feature 只消費其產出，MUST NOT 另建第二套解析
  或渲染路徑。課程完成通知不屬此列——它是流程層通知，走推播程式既有的通知實作（FR-019a）。
- **課表生成器與 Overlay 規則**：屬 F4；本 Feature 不重跑或修改課表（除非端到端驗收揭露課表本身違規，
  屆時循「改 Curriculum → 重跑生成器 → review diff → commit」流程處理）。
- **新增告警頻道、通知管道或監控服務**：不在 free-tier 約束內的設計一律排除。

## Dependencies

- **F1 `001-walking-skeleton`**：CLI composition root、設定載入、StateStore、Webhook client、告警渲染、
  `daily.yml`（雙 cron / 手動觸發輸入 / 併發控制 / `state` 分支提交與重試 / 最後防線通知）。
- **F5 `005-lesson-compiler`**：Lesson Compiler（任意 `(track, sessionIndex)` → `Lesson`）、全 Session 類型
  Renderer、字元預算檢查、內容 Gate。
- **F2 / F3 / F4**（間接）：Curriculum DAG、Problem Bank、三份課表與 Overlay。
- **外部**：Discord Webhook（三個頻道）、GitHub Actions（排程與 `state` 分支寫入權限）。
