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

### Session 2026-07-29

- Q: 實機驗收（`acceptance.md` 七條）與 merge 回 `develop` 的時點如何協調（`schedule` 只跑預設分支，
  但 FR-027 要求全勾選才算完成）？ → A: **merge 前於 feature branch 以 `workflow_dispatch` 完成全部七條**
  並勾選，全勾選後才 merge；`workflow_dispatch` 可指定任意 ref，七條 AC 皆可取得真實證據（AC3 的
  「同日第二次跳過」以兩次 dispatch 佐證）。FR-024 的預設分支要求僅需**文件化確認**，MUST NOT 為了
  取得證據而先行 merge 或等待一次真實 cron
- Q: 狀態檔**存在但無法解析**（空字串／純空白／非 JSON）該歸「空狀態」還是「全域性失敗」？ → A:
  **只有「檔案不存在」視為空狀態**；檔案存在但空字串／純空白／非 JSON／schema 不符一律判為
  **解析失敗＝全域性失敗**（非零結束、不覆寫原檔）。理由：誤判為空狀態會使三軌進度重置回第 1 課並重推，
  屬資料損失級別的後果；fail-loud 且不覆寫才可人工修復（憲章 XV）
- Q: 狀態檔 `tracks` 中出現**不屬於三個已知 Track 的未知鍵**時如何處理？ → A: **判為欄位語意損毀 →
  全域性失敗**（補入 FR-031 封閉清單、Edge Cases）。理由：①與「值的手誤即全域失敗」保持一致（同為人工
  編輯錯誤）；②靜默忽略會使維運者的編輯意圖完全不生效卻毫無訊號（沉默失敗）；③中止點在迴圈之前，
  存檔不會發生，打錯的原檔因此得以保全——是唯一同時做到「大聲報錯」與「不動原檔」的選項
- Q: 某軌多則訊息推到一半失敗時，是否續送剩餘則？ → A: **立即中止該軌剩餘則（fail-fast）**——退避重試
  已耗盡才算該則失敗，代表該頻道當下大機率不可用，續送多半重複失敗並吃掉 SC-009 的時間預算；進度照常
  前進、發紅色告警、計入非零結束。告警文案 MUST 明示「本課進度已前進、不會補推」（FR-012）
- Q: AC10（失敗隔離）的實機驗收如何在正式頻道**安全**製造失敗？ → A: **當日尚未推播時**把某一軌的
  webhook Secret 暫改為無效值，手動 `workflow_dispatch`（**MUST NOT 帶 `force`**），觀察其餘兩軌正常
  推播、該軌紅色告警、整體非零結束後還原 Secret。副作用為零：失敗軌進度不變（FR-011）、還原後下次執行
  自動補推，健康軌收到的是當日本應收到的課而非重複推播。此程序 MUST 納入 runbook（FR-023）
- Q: 強制模式同一天重複執行會連續 +1（同日跳課），要加防護還是接受？ → A: **明確揭露並接受**——`force`
  的語意 MUST 維持單一的「繞過日期 guard、其餘照常」；加上「同日第二次不 +1」會讓 force 帶隱藏狀態，
  也會讓「一次補推兩課」這個正當操作變成不可能。改以 runbook 警示 + 明確回復路徑處理（FR-023b）

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
3. **Given** 某軌的多則訊息推到一半失敗（第一則已送達），**When** 處理該軌，**Then** 剩餘未送出的訊息
   **不再嘗試**，該軌進度**照常前進**（避免補跑重貼已送出的前段），同時發出紅色告警（文案明示
   「進度已前進、不會補推」）並計入非零結束狀態。
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
- **狀態檔中出現不屬於三個已知 Track 的未知鍵**（例：人工編輯時把 Track 名稱打錯）：MUST 判為**欄位語意
  損毀 → 全域性失敗**（FR-021 / FR-031），MUST NOT 靜默忽略、MUST NOT 於存檔時移除。理由：狀態檔的
  人工編輯是官方調整進度的方式，打錯鍵代表維運者的意圖**完全沒有生效**；靜默忽略會讓這個手誤數日無人
  發現（正是 FR-023a 所警告的沉默失敗）。此判定同時使原檔得以保全——中止點在逐 Track 迴圈之前，
  存檔不會被呼叫，打錯的內容原封留在 `state` 分支上供修正。
- **狀態檔存在但 `tracks` 為空物件（或缺少該鍵）**：與「狀態檔不存在」同樣處置——視為空狀態，所有啟用
  Track 以初始進度補建，不算失敗。此情境與「檔案不存在」MUST 有一致的結果。
- **暫停後重新啟用某 Track**：該軌**舊的最後推播時間會保留**，因此重新加回 webhook 設定後的第一次執行，
  日期 guard 依該時間判斷——若非當日台北日期即放行、當次即從原進度續播；若恰為當日（同日移除又加回）
  則跳過、隔日續播。兩者皆為正確行為，MUST NOT 因暫停而清除該時間。
- **除雙 cron 外的併發來源**（手動觸發與排程重疊、或兩次手動觸發重疊）：MUST 由**同一套**併發控制與
  提交衝突重試機制涵蓋，MUST NOT 為此另設機制；每日 workflow MUST 設定併發群組使同時觸發者排隊而非
  並行寫入 `state` 分支。
- **狀態檔不存在**（`state` 分支初次使用）：視為空狀態，所有啟用 Track 以初始進度補建，不算失敗。
  **「不存在」是唯一的寬容入口**——檔案存在但內容為**空字串／純空白／非 JSON／不符 schema**時
  MUST 判為解析失敗（全域性失敗，見 FR-021），MUST NOT 視為空狀態。理由：誤判為空狀態會使三軌進度
  重置回第 1 課並重推已上過的課。
- **排程觸發時預覽 / 強制旗標為空值**（`schedule` 事件不帶 workflow 輸入）：MUST 一律視為關閉，
  MUST NOT 因空值而失敗或誤判為開啟。
- **預覽與強制同時開啟**：以預覽為準——不推播、不寫狀態，MUST NOT 視為設定衝突而失敗。
- **三軌連續推播觸發 Discord 限流**：MUST 由既有的退避重試吸收；重試耗盡才計為該軌失敗。
- **某軌內容超出字元預算**：於推播前擋下並計為該軌失敗（MUST NOT 截斷內容送出）；預覽模式下仍完整輸出
  逐項明細供調整，不因此視為失敗。**「MUST NOT 截斷送出」的可觀測結果 MUST 為**：該軌**課程訊息的送出
  次數為 0**（只有紅色告警一則）、該軌計為失敗、進度不變。
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
  - **重試等待與抖動參數的注入亦不列入替身**，但 MUST 嚴格限於「消除測試耗時」：注入 MUST NOT 改變
    重試次數、錯誤分類或任何分支判斷。
- **FR-002b**: 端到端驗證的**攔截點 MUST 為單一且可稽核的機制**——攔截執行環境的**全域 HTTP 送出函式**，
  使「替身數為 1」可由「僅此一處被替換」直接判定。
  - **已知的隱含依賴 MUST 揭露**：此攔截方式成立的前提是推播用戶端**經由該全域函式送出請求**；日後若
    改用其他 HTTP 手段，攔截將失效而使端到端驗證變成空跑。故推播用戶端變更 HTTP 送出方式時
    MUST 同步檢視本項驗證是否仍然有效。
  - **MUST NOT 以本機假伺服器取代**：理由 MUST 於需求層留存——憲章第 XVI 條的「無本機 infra」（開 port
    帶來 CI 不穩定與環境相依），此為原則性約束而非可協商的實作偏好。
- **FR-002c**: 端到端驗證 MUST 納入 **CI 的阻擋性檢查**（與既有測試同一道指令執行，未通過即不得合併），
  MUST NOT 只作為本機手動驗證。
  - **執行時間**：端到端驗證 MUST 以「消除真實等待」（FR-002a）的方式維持在既有測試指令可接受的時間
    內；本 Feature MUST NOT 為此另設獨立的耗時門檻，但 MUST NOT 引入真實網路等待或固定睡眠。
  - **暫存資源清理**：驗證所用的暫存目錄與狀態檔 MUST 建立於執行環境的暫存區，MUST NOT 寫入 repo
    工作目錄、MUST NOT 殘留而汙染後續執行。
- **FR-002d**: 端到端驗證 MUST **直接使用每日 runtime 所用的同一組編譯 / 渲染 / 預算檢查實作**（憲章
  第 IX 條「Gate 與 runtime 共用同一顆 Compiler」的延伸），MUST NOT 為測試另建平行的編譯或渲染路徑。
- **FR-003**: 端到端驗證 MUST 斷言**每個 Track 的訊息只送往自己 Track 的頻道**（無交叉錯送），且訊息內容
  對應該軌自己的 `currentSessionIndex`。**斷言依據 MUST 為「被攔截請求的目標位址」與「該 Track 的
  webhook 設定值」的對應關係**（逐請求比對，非抽樣）。
  - 某課被拆成多則訊息時，**送出順序 MUST 與渲染產出的順序一致**，且此順序性 MUST 為需求層要求
    （攔截機制 MUST 依呼叫順序記錄以供斷言），MUST NOT 只是攔截工具剛好具備的能力。
- **FR-004**: MUST 驗證「同一 Concept 在不同 Track 的教學正文逐字相同、題目難度帶依 Track 不同」（AC5），
  以自動化方式比對至少一個橫跨多軌的 Concept。
  - **比對範圍 MUST 明確**：「教學正文」指 **Digest / TypeScript Tip / Python Tip / Takeaway /
    Exit Criteria** 這幾段；**MUST 排除**含 Track 名稱或進度資訊的欄位（如頁尾、標題），否則三軌必然
    不同而使斷言恆偽。
  - **「難度帶依 Track 不同」MUST 以題目難度欄位的值客觀比對**，MUST NOT 依賴人工判讀。
  - **Session 索引 MUST 由素材動態查得**，MUST NOT 把特定索引硬編進驗證；此為需求層要求而非實作偏好
    （素材由 F7 重生成後索引必然改變）。
  - **素材前提失效時的處置**：若日後不存在任何橫跨多軌且具備題目的 Concept，本項驗證 MUST 改為
    「修正素材或調整選取條件」，MUST NOT 放寬或刪除斷言。
- **FR-005**: MUST 驗證整條每日流程在**完全沒有任何 LLM API key** 的環境變數下端到端成功（AC6），且每日
  workflow 定義中 MUST NOT 出現任何 LLM 金鑰名稱。
  - **「任何 LLM 金鑰」MUST 為可掃描的明確集合**：現行唯一的 LLM 金鑰名稱為 `GEMINI_API_KEY`；掃描
    MUST 同時涵蓋**供應商識別字樣**（如 `GEMINI` / `GOOGLE_API_KEY` / `OPENAI` / `ANTHROPIC` /
    `API_KEY` 形態的環境變數名）。日後新增任何 LLM 供應商時 MUST 同步擴充此集合。
  - **「不存在任何對 LLM 服務的呼叫」MUST 有可機驗判準**：端到端驗證中**被攔截請求的目標主機集合
    MUST 只含 Discord 的 webhook 網域**，出現任何其他主機即為違反。
  - **憲章第 VIII 條「`src/` MUST NOT 匯入 LLM SDK」的驗證歸屬 MUST 明確**：該項由**既有的 CI Gate**
    負責，本 Feature MUST NOT 重複實作，但 MUST 於驗收時確認該 Gate 仍在 CI 中生效。

**逐 Track 處理與去重（既有行為的正式化與驗收）**

- **FR-006**: MUST 由**單一流程、單一執行序**依固定順序（`foundation → interviewReady → interviewMastery`）
  逐一處理啟用的 Track；MUST NOT 以平行工作分派多 Track（會競爭 `state` 分支）。
- **FR-007**: 「該 Track 的 webhook 有設定」即代表該 Track 啟用；MUST NOT 需要任何其他設定項或程式修改
  即可啟用 / 停用一個 Track。
- **FR-008**: 每個 Track MUST 各自進行 idempotency guard：將該軌 `lastPushAt` 換算為 **Asia/Taipei 日期**，
  等於今天即跳過該軌；各軌獨立判斷，互不影響。
- **FR-009**: 預覽模式 MUST 略過 guard（照常編譯、渲染並輸出，不推播、不寫狀態）；強制模式 MUST 繞過
  guard 但仍寫狀態；兩者同時開啟時 MUST 以預覽模式為準。強制模式的語意 MUST 維持**單一的「繞過日期
  guard、其餘照常」**——同一天多次強制執行 MUST 每次成功各前進一課（MUST NOT 內建「同日第二次不推進」
  之類的隱藏例外），其風險以 runbook 警示處理（FR-023b）。
  - **三者的優先序 MUST 為「預覽模式 > 強制模式 > 日期 guard」**，且此優先序 MUST 在需求、契約與
    Edge Cases 三處表述一致。
  - **預覽模式下 MUST NOT 發送任何通知**（紅色告警與課程完成通知**亦然**）——通知本身也是一次推播，
    預覽模式的定義即「不推播」。此要求與「照常編譯、渲染並輸出至執行記錄」**不衝突**：輸出的去處是
    執行記錄，不是頻道。
- **FR-010**: 排程觸發時未帶輸入值的旗標 MUST 一律解讀為關閉。

**狀態推進與提交**

- **FR-011**: 某 Track 的進度 MUST 只在**該軌推播成功後**前進一課並更新 `lastPushAt`；推播失敗的 Track
  進度 MUST 保持不變（漏跑不跳課）。**「前進一課」的精確語意為 `currentSessionIndex` 加 1**，
  MUST NOT 解讀為「跳到課表中下一個存在的 `sessionIndex`」（缺號屬生成物異常，見 Edge Cases）。
  **完課 MUST NOT 計為「推播成功」**——完課只寫完課時間，MUST NOT 前進 `currentSessionIndex`
  （FR-022）。本條的**唯一例外**是 FR-012 的部分推播。
- **FR-012**（**FR-011 的明示例外**，非對立規則）: 多則訊息推播到一半失敗（已有訊息送達）時，該軌進度
  MUST **照常前進**，同時發紅色告警並計入非零結束狀態。該軌剩餘未送出的訊息 MUST **立即中止、不再嘗試**
  （fail-fast，MUST NOT 續送）；告警文案 MUST 明示「本課進度已前進、不會補推」，避免維運者誤等自動補推。
- **FR-013**: 全部 Track 處理完畢後 MUST **單次存檔**，且已成功 Track 的進度 MUST 保存，MUST NOT 因其他
  Track 失敗而回滾。**「單次存檔」的精確語意為「一次執行至多發生一次存檔動作」**——三軌皆被跳過時
  仍照常存檔一次（寫出內容相同的檔案），預覽模式則為零次。
- **FR-013a**: **存檔失敗的後果 MUST 明確揭露並接受**：存檔屬全域性失敗（FR-021），此時該次執行已推播
  成功的 Track 其進度**不會落盤**，下一次執行會**重推同一課**（`lastPushAt` 未更新，日期 guard 放行）。
  本專案 MUST NOT 為此引入交易性寫入或補償機制（無此基礎設施，且與 free-tier 約束衝突）；此風險以
  「紅色告警 + 非零結束」讓維運者立即知情處理。
- **FR-014**: `history` MUST **per-Track 各自**滾動保留上限 30 筆（非三軌合計）；`completedConceptIds`
  MUST 於 concept 類 Session 去重追加。
- **FR-015**: 狀態檔 MUST 以**至多一個 commit** 提交至專用 `state` 分支；`main` / `develop` MUST NOT 出現
  任何狀態提交。預覽模式 MUST NOT 產生提交。**該次執行無任何進度變更時（例如三軌皆被跳過），提交步驟
  MUST 偵測到無變更並略過提交（commit 數為 0），MUST NOT 產生空 commit。**
- **FR-016**: 提交推送衝突 MUST 以「重新同步後重試」處理，上限 3 次；耗盡即以失敗結束，MUST NOT 強制覆寫。
  重試之間**不要求固定等待間隔**（衝突來源僅為相隔 30 分鐘的雙 cron 極罕見重疊，重新同步本身即為
  有效的間隔）；是否加入等待 MAY 由實作決定。
- **FR-017**: 狀態檔中已知但未啟用的 Track MUST 原樣保留（含完課時間欄位）；啟用但狀態檔中不存在的
  Track MUST 以初始進度自動補建。**自動補建的初始值全集 MUST 為**：`currentSessionIndex` = 1、
  最後推播時間 = 空、已完成 Concept 清單 = 空陣列、推播歷史 = 空陣列、**不含完課時間欄位**。

**失敗隔離與告警**

- **FR-018**: 單一 Track 的編譯 / 渲染 / 預算 / 推播失敗 MUST 記錄錯誤、對該軌頻道發紅色告警、**繼續處理
  其餘 Track**；全部處理完後若有任一失敗 MUST 以非零狀態結束。
  - **每軌至多一則告警**：任一步驟失敗即結束該軌處理（fail-fast），故單一 Track 在一次執行中
    MUST NOT 發出兩則以上的失敗告警。
  - **錯誤紀錄的去識別化**：寫入執行記錄的錯誤訊息與告警內文 MUST 一律通過 FR-019b 的遮蔽（執行記錄
    的規範見 FR-025a）。
- **FR-018a**: **非零結束狀態 MUST 釘死為 `1`**（MUST NOT 使用其他非零值），使 workflow 層得以據此分支。
  結束狀態只有兩個合法值：`0`（無任一 Track 失敗）與 `1`（任一 Track 失敗或全域性失敗）。
- **FR-019**: 告警版面 MUST 由推播程式以**單一實作**產生；全域性失敗發至第一個已設定的頻道。
  workflow 層 MAY 保留一道最後防線通知，但 MUST 為極簡純文字，MUST NOT 使用 Embed、MUST NOT 重述細節。
  - **「單一實作」的可稽核判準**：全部通知（Track 告警 / 全域告警 / 課程完成通知）MUST 由**同一個原始碼
    檔案**匯出的函式族產生；MUST NOT 新增第二個通知模組，MUST NOT 在 workflow 定義內另行拼組 Embed。
  - **「極簡純文字」的可判定界線**：最後防線通知的請求主體 MUST 只含一個文字欄位（不含 embeds 結構），
    內容 MUST 只有「失敗提示 + 本次執行的連結」，MUST NOT 重述失敗原因細節。
  - **最後防線通知的目標頻道**：MUST 為**第一個已設定的頻道**（與全域告警同一規則）；三軌皆未設定時
    MUST 只留錯誤紀錄而不視為新的失敗。
  - **與程式內全域告警重疊**：兩者可能於同一次執行同時發出（使用者多收一則純文字提示）。此重複
    MUST 明確視為**可接受的取捨**（優於靜默），MUST NOT 為消除重複而移除任一道。
  - **告警的發送方式**：通知 MUST 走與課程訊息**相同的推播路徑**（含既有的退避重試），MUST NOT 為告警
    另設 fail-fast 或另一套重試策略。
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
  可驗證的表述：告警發送 MUST 包在自身的錯誤攔截內且 **MUST NOT 重新拋出**。
  - **自我指涉情境**（失敗軌的 webhook 本身即無效，故告警必然也發不出去）MUST 有明確終局：留下
    「告警失敗」的錯誤紀錄、該軌仍計為失敗、其餘 Track 照常處理、整體以 `1` 結束。此時該軌**沒有任何
    使用者可見的訊息**，唯一的可觀測性來自執行記錄與非零結束狀態——此為已知且接受的極限。
- **FR-020a**: 全域性失敗發生時若**完全沒有任何已設定頻道**（告警無處可發），MUST 於執行記錄留下錯誤
  並以 `1` 結束；此情形 MUST NOT 被視為「無聲失敗」，亦 MUST NOT 因無法發送而改變結束狀態。
- **FR-021**: 全域性失敗（無任何 webhook 設定、狀態檔路徑未設定、狀態檔解析失敗或欄位語意損毀、
  **課程素材載入失敗**、存檔失敗）MUST 以非零狀態結束並發全域告警，且 MUST NOT 覆寫原狀態檔。
  其中「解析失敗」MUST 涵蓋**檔案存在但內容為空字串或純空白**的情形；僅「**檔案不存在**」得視為
  空狀態（見 Edge Cases）。
- **FR-021a**: 課程素材（DAG / 題庫 / 三份課表 / 三份 Overlay）MUST 於進入逐 Track 處理**之前**載入；
  載入失敗 MUST 歸類為全域性失敗（FR-021），MUST NOT 降級為逐 Track 失敗而對三個頻道各發一則同因告警。
- **FR-022**: 某 Track 的 `currentSessionIndex` **超出該軌課表的最大 `sessionIndex`** 時 MUST 視為該軌的
  **完課（終態）**而非失敗（課表**中間缺號**不適用本條，見 Edge Cases，MUST 判為該軌失敗）：
  首次偵測到 MUST 發一則**非紅色**的課程完成通知，並於該軌進度記錄**完課時間**；已記錄完課時間者 MUST 於
  其後每次執行一律**跳過**（不發訊息、不推進進度）。完課 MUST NOT 計入非零結束狀態、MUST NOT 中斷或影響
  其他 Track。預覽模式下 MUST 只輸出至執行記錄而不發送、不寫入完課時間。
  - **完課的狀態不變式（MUST）**：完課 MUST 只寫入完課時間，MUST NOT 更新 `lastPushAt`、MUST NOT 前進
    `currentSessionIndex`、MUST NOT 產生 `history` 條目、MUST NOT 追加 `completedConceptIds`——它不是
    一次推播。
  - **完課時間欄位的語意（MUST）**：該欄位為**選填**；**缺席或空值皆代表未完課**（向後相容既有狀態檔，
    MUST NOT 因缺此欄位而判定損毀）；一旦存在且非空即代表已完課。未設定時存檔 MUST NOT 憑空寫出該鍵。
  - **強制模式 MUST NOT 繞過完課跳過**：強制模式只繞過**日期 guard**；已記錄完課時間的 Track 在強制
    模式下 MUST 仍然跳過。
  - **憲章「Fail loud」的相容性說明**：完課不計失敗**不牴觸**憲章第 XV 條——「Fail loud」要求的是
    「故障 MUST NOT 靜默」，而完課是課程的**正常終局**而非故障。若沿用「視為失敗」，每日排程會對已完課
    頻道無限期重複發紅色告警並讓執行天天失敗，真正的故障反而會淹沒在雜訊中，那才是實質違反該條。
- **FR-022a**: 某 Track **連續多日失敗**時 MUST 維持**每日照常告警**的行為：MUST NOT 自動降低告警頻率、
  MUST NOT 自動暫停該 Track。理由：自動暫停會讓「斷課」變成無聲狀態（違反憲章 XV），且會在推播程式內
  引入一份不存在於狀態契約的隱藏狀態。暫停是維運者的顯式決定（移除該軌 webhook 設定，FR-007）。

**上線與維運**

- **FR-023**: MUST 交付一份**維運 runbook**（存放於 `docs/runbook.md`），涵蓋：啟用 / 暫停 / 續播一個
  Track、調整某軌進度、手動補推（強制模式）、預覽版面（預覽模式）、`state` 分支的初始化與人工編輯方式、
  每日排程實際執行的分支、**失敗隔離演練程序**（見 FR-027b），以及推播失敗時的排查起點。runbook
  MUST 只描述「不需改程式」即可完成的操作。此外 MUST 涵蓋下列各項：
  - **執行結局的判讀對照**：runbook MUST 列出執行記錄中各種結局字樣（已推播 / 跳過 / 已完課跳過 /
    完課 / 失敗 / 告警失敗）的**意義與應對動作**，使維運者不需讀原始碼即可判讀一次執行。
  - **排查起點的最小內容**：MUST 具體到「**看哪裡**（本次執行記錄的哪一段）、**找什麼**（該軌的結局
    字樣與失敗原因）、**下一步做什麼**（依原因分類的處置）」三段，MUST NOT 只寫一句概括要求。
  - **權限前提**：MUST 說明各項操作所需的權限（編輯 `state` 分支需 repo 推送權限；增刪 Secret 需 repo
    設定權限），避免維運者在缺權限時誤判為程式故障。
  - **`state` 分支不存在時的初始化步驟**（Assumptions 的「`state` 分支已存在」若不成立時的補救）。
  - **回復路徑**：改錯進度、誤刪 Secret、誤推狀態檔三種常見誤操作的回復方式。
  - **webhook URL 輪換與外洩處置**：於 Discord 重建 webhook → 更新對應 Secret → 確認下一次執行成功
    的完整程序（外洩時 MUST 以「重建並輪換」處理，MUST NOT 只刪除訊息）。
  - **示範值 MUST 為佔位示意**：runbook 內所有 Secret / webhook URL 的示範 MUST NOT 使用真實值。
- **FR-023a**: runbook MUST 另行明示**已完課 Track 的重新推播程序**：把該軌 `currentSessionIndex` 調回
  課表範圍內時 **MUST 一併清除該軌的完課時間欄位**，否則該軌仍會被靜默跳過。程式 MUST NOT 自動清除
  該欄位（狀態層不認識課表），故此規則 MUST 以「沉默失敗警告」的形式寫入 runbook。
- **FR-023b**: runbook MUST 以警示形式明示**強制模式的跳課風險**：同一台北日期內每成功強制推播一次，
  該軌 `currentSessionIndex` 即 +1，重複強制執行會使該軌**跳過未推播的課**；MUST 一併給出回復路徑
  （編輯 `state` 分支狀態檔的 `currentSessionIndex` 調回目標課次）。
- **FR-024**: 每日排程 workflow MUST 執行於 repo 的**預設分支 `develop`**；MUST 確認該分支即為 GitHub 設定
  的預設分支，並在 runbook 明示「程式與內容併入 `develop` 才會反映到每日推播」。MUST NOT 於 workflow 內
  另行 checkout 其他分支取用**程式或內容**（避免 workflow 定義與執行內容分屬不同分支）。**此項的驗收方式為
  文件化確認**（記錄當下 GitHub 預設分支設定，證據記入實機驗收紀錄），MUST NOT 以「等待一次真實 cron
  觸發」作為完成條件。
  - **與 `state` 分支 checkout 並不衝突**：上述限制的對象是「**程式與課程內容**」的取用來源。狀態檔位於
    專用 `state` 分支、checkout 至獨立路徑，屬**資料**而非程式，MUST 繼續獨立 checkout。兩者 MUST NOT
    被解讀為互相矛盾。
  - **併入 `main` 不影響每日推播**：runbook MUST 同時明示這一點（只說「併入 `develop` 才生效」不足以
    避免維運者誤以為併入 `main` 也有效）。
  - **預設分支日後被變更的風險 MUST 明確接受**：本專案 MUST NOT 為此新增偵測或防呆機制（GitHub 設定
    不在 repo 內、無零成本的可靠偵測手段）；改以 runbook 記載「變更預設分支會使每日推播改由新分支的
    workflow 執行」作為告知。
- **FR-025**: 三個 Track 的 webhook 設定 MUST 全部就位於執行環境的密鑰管理中，MUST NOT 出現在 repo 或任何
  產物中；MUST NOT 提交 `.env` 或任何金鑰。**「產物」的範圍 MUST 明確涵蓋**：repo 內任何檔案、**執行記錄
  （含每日 workflow 的完整 log）**、實機驗收紀錄、維運 runbook，以及推播出去的任何訊息內容。
- **FR-025a**: 執行記錄 MUST NOT 印出任何 Track 的 webhook URL（含成功路徑的診斷輸出與失敗路徑的錯誤
  訊息）。此要求 MUST 為本 Feature 的需求層約束，MUST NOT 只存在於契約文件——實機驗收紀錄所附的
  Actions 執行連結指向的是**完整 log**，若 log 含 URL，等同驗收紀錄本身洩漏金鑰（FR-027）。
- **FR-025b**: 一個 Track 的 webhook 設定**未設定**與**設定為空字串／純空白**MUST 一律視為**停用**該
  Track，兩者行為完全相同；MUST NOT 因空字串而判為設定錯誤或嘗試對空目標推播。
- **FR-026**: `state` 分支的狀態檔 MUST 已涵蓋三個 Track 的進度（缺漏者由自動補建處理），且其內容 MUST
  通過載入時的欄位語意驗證（可判定清單見 FR-031）。
- **FR-027**: MUST 交付一份**實機驗收紀錄**（`specs/006-pipeline-mvp/acceptance.md`），逐條列出
  AC2 / AC3 / AC4 / AC5 / AC6 / **AC9（後半：`dry_run: true` 執行不推播、不寫 state；前半的課表
  byte-identical 屬 F4，不在本紀錄範圍）** / AC10，每條含「操作步驟、預期結果、實際觀察、對應的
  Actions 執行連結」與勾選欄位。本 Feature MUST 於全部條目勾選後才視為完成；紀錄中 MUST NOT 出現
  任何 webhook URL 或金鑰（所附連結指向的 log 亦然，由 FR-025a 保證）。
  - **填寫者與時機 MUST 明確**：紀錄的**空白表格於實作階段建立**（與其他交付物一同進版控），
    **實際觀察與連結由維運者（＝使用者本人）於實機執行後填寫並勾選**，MUST NOT 成為無主文件。
  - **AC5 / AC6 的實機證據形式 MUST 明確**：AC5 以「同一次 run 中三軌推播內容的教學正文逐字相同、
    題目難度帶不同」的**觀察結果**佐證；AC6 以「該次 run 的環境**未提供任何 LLM 金鑰**且執行成功」
    佐證，並附每日 workflow 定義中 LLM 金鑰出現次數為 0 的掃描結果。兩者皆 MUST NOT 僅以宣稱陳述。
- **FR-027a**: 實機驗收 MUST 於 **merge 回 `develop` 之前**、在本 Feature 分支上以 `workflow_dispatch`
  （指定該分支為 ref）執行取得證據；七條 AC 全數勾選後才 merge。AC3 的「同日第二次觸發被跳過」MUST 以
  **兩次 `workflow_dispatch`** 佐證，MUST NOT 依賴真實 cron 觸發作為完成條件。
- **FR-027b**: AC10 的實機證據 MUST 以下列**零副作用程序**取得：於**當日尚未推播**時把某一軌的 webhook
  Secret 暫改為無效值 → `workflow_dispatch`（**MUST NOT 帶強制模式**，否則健康軌會重推並跳課）→ 觀察
  其餘兩軌正常推播且進度 +1、失敗軌收到紅色告警且進度不變、整體非零結束 → 還原 Secret（該軌於下次執行
  自動補推，MUST NOT 需要人工修改進度）。此程序 MUST 同時寫入 runbook（FR-023）。

### 可稽核判準與量測定義

本節把原本只存在於契約文件、卻是驗收所需的**可判定值與量測方式**升格為需求，使各條 FR / SC 不需回讀
契約即可客觀判定（2026-07-29 checklist 覆核後補列）。

- **FR-028（通知顏色的單一值）**: 紅色告警的 Embed 顏色 MUST 為 **`15158332`**；課程完成通知 MUST 為
  **`3066993`**。需求中的「紅色 / 非紅色」一律以這兩個值判定，MUST NOT 以排除式描述（「非紅色」）
  作為驗收依據。
- **FR-029（「發出告警」的機驗判準）**: 「某軌發出紅色告警」MUST 可由「該軌頻道收到一則顏色為
  `15158332` 的 Embed」客觀判定；「發出完課通知」同理以 `3066993` 判定。MUST NOT 僅以人工目視作為
  唯一證據。
- **FR-030（推播重試的引用來源）**: Edge Cases 所稱「既有的退避重試」MUST 明確指向 F5 已定案的策略：
  對 429 與 5xx 及網路層例外以**指數退避 + jitter 重試（預設 3 次，尊重 `Retry-After`，單次等待有上限）**，
  429 以外的 4xx MUST NOT 重試。故**單軌處理時間有上界**，不會無限拖累後續 Track 與 SC-009。
- **FR-031（狀態檔的欄位語意驗證清單）**: 觸發全域性失敗的「欄位語意損毀」MUST 為可判定的**封閉清單**：
  最外層非物件、`tracks` 非物件、任一 Track 進度非物件、`currentSessionIndex` 非 ≥1 的整數、
  `lastPushAt` 非空值且非可解析日期字串、`completedConceptIds` 非陣列、`history` 非陣列、
  完課時間欄位存在但非空值且非可解析日期字串、**`tracks` 中出現不屬於三個已知 Track 的未知鍵**。
  清單以外的內容差異 MUST NOT 判為損毀。
- **FR-032（時間換算的輸入來源）**: 日期 guard 的換算輸入 MUST 為狀態檔中 `lastPushAt` 的**帶時區
  ISO 8601 字串**（程式寫入時即為 UTC）；換算 MUST 以 **Asia/Taipei** 為目標時區。MUST NOT 以不帶時區的
  本地時間字串作為輸入，避免執行環境時區影響判斷。
- **FR-033（狀態契約的修訂範圍）**: 本 Feature 對狀態契約的修訂 MUST 限於「**新增一個選填欄位**（完課
  時間）」，其餘欄位語意、序列化順序與存取入口一律沿用既有契約。**向後相容 MUST 為可驗證的需求**：
  現行 `state` 分支上不含該欄位的狀態檔 MUST 能直接載入成功且不需遷移。

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
  Track 的課程訊息**，無交叉錯送、無遺漏（對應 AC2）。**「該課應有的則數」的判準 MUST 為「渲染該課所
  產出的訊息則數」**（即每則渲染產物恰對應一次送出，比值為 1:1），MUST NOT 需要回讀實作才能推導期望值。
- **SC-002**: 同一個台北日期內連續執行兩次，**第二次產生零次推播**、狀態檔內容**位元組相同**，且該次
  執行在 `state` 分支產生的 commit 數為 **0**（對應 AC3）。
- **SC-003**: 一次**確有進度變更**的執行後，成功推播的 Track 其進度**恰好前進 1 課**（`currentSessionIndex`
  +1 且 `lastPushAt` 更新），未推播的 Track 其 `currentSessionIndex` / `lastPushAt` / `history` /
  `completedConceptIds` **全部欄位變化量為 0**；三軌進度以**恰好 1 個 commit** 落在 `state` 分支，
  `main` / `develop` 上自本 Feature 起的 bot 狀態提交數為 **0**（對應 AC4）。**觀測方式**：以提交歷史
  依 bot 提交者身分篩選 `main` / `develop`，**時間範圍為本 Feature 分支建立之後至驗收當下**（本 Feature
  之前的歷史不在保證範圍）。
- **SC-004**: 令任一 Track 的推播固定失敗時，**其餘 Track 的成功率維持 100%** 且進度正常保存，整體以
  非零狀態結束並發出告警（對應 AC10）。**成功率的分母 MUST 為「該次執行中除被注入失敗者之外、實際
  進入推播處理的 Track 數」**（不含被日期 guard 或完課跳過者），分子為其中推播成功且進度已保存者。
- **SC-005**: 整條每日流程在**零個 LLM 金鑰**的環境下端到端成功；每日 workflow 定義中 LLM 金鑰出現次數
  為 **0**（對應 AC6）。**掃描的目標字串集合見 FR-005**（`GEMINI_API_KEY` 及供應商識別字樣），
  使本項可自動化且不致漏判。
- **SC-006**（覆蓋定義與 FR-002 一致：**FR-002 規定「三 Track 同時啟用」的最小情境，本條規定「結局路徑
  逐條覆蓋」的完整度**，兩者互補不重疊）: 端到端自動化驗證**不使用推播替身**（替身數僅 1：對外 HTTP
  呼叫邊界），且 `main` 流程的
  **8 條結局路徑各有至少 1 個 e2e 案例覆蓋、未覆蓋數為 0**——`SKIPPED`（日期 guard）／
  `SKIPPED (completed)`／`SUCCEEDED`／`COMPLETED`（首次完課）／`FAILED`（推播失敗）／
  `FAILED`（部分推播）／全域性失敗／`DRY_RUN` 預覽（清單與對應檔案見
  [contracts/e2e-harness.md](./contracts/e2e-harness.md) §3.1，`main` 新增結局路徑時 MUST 同步擴充該表）。
  **「替身數僅 1」的判準**：除全域 HTTP 送出函式外，端到端驗證的原始碼中 MUST NOT 出現任何替換受測
  行為的注入點——以「掃描端到端原始碼不含推播注入點名稱」為機驗下限，並以人工 review 確認無其他替換
  （單靠字樣掃描只能擋已知名稱，此侷限 MUST 明確承認）。
  **覆蓋的責任邊界**：端到端驗證覆蓋的是**代表性切片**（三軌各一課 + 各結局路徑），
  **全量課表逐課編譯的責任屬 F5 的內容 Gate**，MUST NOT 在本 Feature 重複執行全量編譯。
- **SC-007**: 至少一個橫跨多個 Track 的 Concept，其教學正文（**Digest / TypeScript Tip / Python Tip /
  Takeaway / Exit Criteria**，**排除**含 Track 名稱或進度資訊的頁尾與標題）在三軌推播內容中**逐字相同**，
  而題目難度帶**依 Track 不同**（以難度欄位值比對，對應 AC5）。
- **SC-008**: 維運者僅依 runbook（不閱讀原始碼、不修改程式）即可完成「啟用一個 Track、暫停一個 Track、
  把某軌進度改到指定課次、手動補推一次、預覽一次」五項操作，全部成功。**驗證方式為維運者本人的自我
  驗證**（本專案為單人維運，無第三方盲測條件），判定標準是**過程中未開啟任何原始碼檔案**；
  此五項操作 MUST 與 FR-023 的 runbook 涵蓋清單**逐項對應**（不驗未涵蓋者、不漏驗已涵蓋者）。
- **SC-009**: 一次完整的每日執行（`npm ci` → `tsc` → 推播 → 提交，即整個 workflow run 的耗時）
  **MUST ≤ 10 分鐘**（遠低於免費層配額；門檻於 2026-07-29 `/speckit-analyze` 後由「數分鐘內」收斂為
  可判定的數值，取 10 分鐘是為了讓 `npm ci` 快取失效或 runner 較慢時不至於誤判為驗收失敗），
  且未引入任何常駐服務或付費資源。
- **SC-010**: 實機驗收紀錄中 AC2 / AC3 / AC4 / AC5 / AC6 / AC9（後半）/ AC10 **七條全部勾選**
  （未勾選數為 0），每條各附至少一個真實 Actions 執行連結（**同一次 run 可同時佐證多條**）；
  紀錄中的金鑰／webhook URL 出現次數為 **0**。**掃描範圍為 `acceptance.md` 全文與 `docs/runbook.md` 全文**，
  方式為對 webhook URL 樣式與金鑰名稱（FR-005 的字串集合）做全文比對，可自動化執行。
- **SC-011**: 某 Track 走完課表後，該軌**僅收到一則**課程完成通知（**觀測窗口為「首次完課後再連續執行
  2 次」，其後每次執行的發送次數為 0**），且該情境下流程的結束狀態碼為 **0**（完課不計為失敗）。
  **本項的量測 MUST 在「該次執行不存在其他失敗軌」的條件下進行**，避免結束狀態被其他 Track 的失敗汙染。

## Assumptions

- **三軌內容為 F7 之前的種子課表（各 13 個 Session）**：本 Feature 的端到端驗收在此素材上進行；正式的
  180-Session 三軌課表由 F7 產出後直接沿用同一條流程，MUST NOT 需要修改本 Feature 的任何程式。
  此假設同時使端到端驗證所用的各軌 `currentSessionIndex` 前提（3 / 5 / 8）**必然落在課表範圍內**；
  素材縮短至 8 課以下時本前提即失效，屆時 MUST 調整前提值而非放寬斷言。
- **素材更新後的驗證維護契約**：F7 正式內容進來後，端到端驗證中一切與素材有關的取值 MUST 為**動態
  查得**（FR-004），故素材更新**不應**造成驗證失敗；若仍失敗，MUST 視為素材或驗證前提的真實問題並
  修正之，MUST NOT 以放寬斷言或刪除案例的方式規避。
- **端到端驗證的攔截前提**：以「攔截全域 HTTP 送出函式」為唯一替身，隱含假設推播用戶端經由該函式送出
  請求（FR-002b）。此假設目前成立；日後變更 HTTP 送出方式時 MUST 一併檢視驗證是否仍有效。
- **課表走完＝該 Track 的完課終態**（2026-07-24 clarify 定案，取代 F1「視為失敗」的既有裁決）：首次發一則
  非紅色完成通知並記錄完課時間，其後靜默跳過、不計失敗。此決策新增一個選填的「完課時間」欄位至 Track 進度，
  屬**跨 Feature 的狀態契約變更**，已回寫 `docs/spec.md`（§9.2 Track 生命週期、§18 Runtime Flow、
  §19 State Management 的 `completedAt`）。
- **M3 驗收包含實機驗證**：AC2 / AC3 / AC4 需要真實的 Discord webhook 與真實的 GitHub Actions 執行才能
  取得證據；自動化測試提供邏輯層保證，實機驗收提供上線證據，兩者皆為本 Feature 的完成條件。證據以
  `specs/006-pipeline-mvp/acceptance.md` 的勾選紀錄留存（FR-027，2026-07-24 clarify 定案）。
- **`state` 分支已存在**（F1 已初始化），本 Feature 只需補齊三軌進度，不需重建分支。
- **告警與推播共用同一個頻道**：本專案不另設告警頻道；某軌失敗時的告警發往該軌自己的頻道，全域失敗發往
  第一個已設定的頻道。**已知後果並接受**：紅色告警會與課程訊息混在同一個頻道、對學習者可見。此為
  free-tier 與單人使用情境下的刻意取捨（維運者與學習者是同一人），MUST NOT 為此新增告警頻道
  （見 Out of Scope）。
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
  **此項的可稽核判準**：本 Feature 的變更檔案清單中 **MUST NOT 出現 F5 的版面與解析實作檔案**；
  出現即視為越界，需回頭確認是否應改由 F5 處理。
- **課表生成器與 Overlay 規則**：屬 F4；本 Feature 不重跑或修改課表（除非端到端驗收揭露課表本身違規，
  屆時循「改 Curriculum → 重跑生成器 → review diff → commit」流程處理）。
- **新增告警頻道、通知管道或監控服務**：不在 free-tier 約束內的設計一律排除。

## Dependencies

- **F1 `001-walking-skeleton`**：CLI composition root、設定載入、StateStore、Webhook client、告警渲染、
  `daily.yml`（雙 cron / 手動觸發輸入 / 併發控制 / `state` 分支提交與重試 / 最後防線通知）。
  **本 Feature 對這些元件的關係 MUST 為「只消費、不修改」**——告警渲染與推播重試 / 退避的行為一律沿用
  F1 已定案且已驗證的實作（見 `specs/001-walking-skeleton/contracts/`）；唯一例外是本 Feature 明訂的
  狀態契約增量（FR-033 的選填完課時間欄位）與通知實作內的遮蔽行為（FR-019b）。
- **F5 `005-lesson-compiler`**：Lesson Compiler（任意 `(track, sessionIndex)` → `Lesson`）、全 Session 類型
  Renderer、字元預算檢查、內容 Gate。同樣為「只消費、不修改」。
- **F2 / F3 / F4**（間接）：Curriculum DAG、Problem Bank、三份課表與 Overlay。
- **外部**：Discord Webhook（三個頻道）、GitHub Actions。
  - **`state` 分支的寫入權限 MUST 列為明確依賴**：每日 workflow 的執行權杖 MUST 具備對本 repo 的
    內容寫入權限，否則提交步驟必然失敗。此前提 MUST NOT 停留在隱含假設。
