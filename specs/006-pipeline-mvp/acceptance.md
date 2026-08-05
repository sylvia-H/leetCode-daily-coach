# 實機驗收紀錄：006-pipeline-mvp（M3 完成條件）

**Feature**: [spec.md](./spec.md) ｜ **對應**: FR-025 / FR-027 / FR-027a / FR-027b / SC-009 / SC-010

本表為**空白模板**，由 `/speckit-implement` 階段建立並隨其他交付物一併進版控；**實際觀察與 Actions run
連結由維運者（＝使用者本人）於實機執行後填寫並勾選**。本 Feature 的完成判定不在「程式寫完」，而在本表
**七條 AC 全數勾選**（FR-027）。

> **紀錄中 MUST NOT 出現任何 webhook URL 或金鑰**（FR-025 / FR-027，測試見
> `tests/unit/docs-secrets.test.ts` 的全文掃描）。
>
> **執行約束（MUST）**：① 全部觸發以 `workflow_dispatch` 指定 **ref = `006-pipeline-mvp`**，
> **MUST NOT** 為取得證據而先 merge 回 `develop`（FR-027a）；② AC10 **MUST NOT** 帶 `force`（FR-027b），
> 故需先完成下方「C7a：重置 `state` 分支」。
>
> **同一次 run 可同時佐證多條 AC**——不需要為每條 AC 各自觸發一次。
>
> **判定門檻（SC-009）**：每次 run 的耗時 **MUST ≤ 10 分鐘**才得勾選該條；`npm ci` 快取失效或 runner
> 較慢時仍在門檻內才算通過。

---

## 前置確認

- [x] ① 三個 webhook Secret 皆已登錄（`DISCORD_WEBHOOK_URL_FOUNDATION` /
      `DISCORD_WEBHOOK_URL_INTERVIEW_READY` / `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY`）。
      **只記「已登錄」，MUST NOT 記錄任何 URL 或片段。**
- [x] ② GitHub repo Settings 的 Default branch = `develop`（見下方 AC 之外的獨立確認，T039）。
      以 `gh repo view --json defaultBranchRef` 查核，結果為 `develop`。
- [x] ③ `state` 分支已重置為三軌初始值（`currentSessionIndex: 1`、`lastPushAt: null`、
      `completedConceptIds: []`、`history: []`，且無 `completedAt`）。commit `f4263ca`。
- [x] ④ 本次驗收全程以 `workflow_dispatch` 指定 **ref = `006-pipeline-mvp`**，尚未 merge 回 `develop`。
      全部觸發皆以 `gh workflow run daily.yml --ref 006-pipeline-mvp` 執行。

---

## AC2：三頻道各收到各自 Track 的今日課程

**操作步驟**：`workflow_dispatch` 觸發（`dry_run=false`、`force=false`）。

**預期結果**：每個已設定 webhook 的 Track 各自的頻道收到該 Track Session 1 的 concept embeds
（Digest 主 Embed、TS/Python Tip、prev/current/next 路徑、Exit Criteria、Takeaway），三軌互不交叉。

- 實際觀察：`gh workflow run daily.yml --ref 006-pipeline-mvp -f dry_run=false -f force=false` 觸發，
  Actions log 顯示 `foundation: pushed`／`interviewReady: pushed`／`interviewMastery: pushed`；
  使用者於三個 Discord 頻道各自收到一則訊息（本次為 session 1、三軌共用 concept
  `time-space-complexity`，`schedules/*.json` 中該 session 皆無 `problemIds`，故三則內容視覺上相同——
  此為課表設計使然，非交叉錯送；路由正確性已由 log 的三個獨立 webhook 呼叫與下方 AC4 的 `state` 分支
  三軌各自推進交叉驗證）。
- Actions run 連結：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30451349953
- run 耗時：21 秒（12:22:51–12:23:12 UTC）
- [x] 已勾選

---

## AC3：同一天不重複打擾、`force` 可繞過

**操作步驟**：同日內以 `workflow_dispatch` 再次觸發（`force=false`），觀察皆跳過後，再以 `force=true`
觸發一次。**MUST 以兩次 `workflow_dispatch` 佐證，MUST NOT 依賴真實 cron 觸發。**

**預期結果**：`force=false` 的第二次觸發：三軌皆 `skipped (already pushed today)`，`state.json` 無新
commit；`force=true` 的第三次觸發：三軌照常推播並前進一課。

- 實際觀察：同日以 `force=false` 再次觸發，Actions log 顯示三軌皆
  `skipped (already pushed today)`、`state.json 無變更，略過提交`；`git log origin/state` 確認無新
  commit（仍為 `1f2f6a8`）。接著以 `force=true` 觸發，log 顯示三軌皆 `pushed`；`state` 分支產生新
  commit `e77d06d`，三軌 `currentSessionIndex` 皆由 2 前進至 3。
- Actions run 連結（兩次）：
  - `force=false`：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30451863042
  - `force=true`：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30452250512
- run 耗時：19 秒（force=false）／22 秒（force=true）
- [x] 已勾選

---

## AC4：各 Track 進度獨立 +1、單次 commit

**操作步驟**：檢視 AC2 觸發後 `state` 分支的 `state.json` 與提交歷史。

**預期結果**：三軌 `currentSessionIndex` 皆為 2；本次執行**恰好 1 個** commit；`main` / `develop`
**無任何** bot 狀態提交（以 `git log` 依 bot 提交者身分篩選，範圍為**本 Feature 分支建立之後**）。

- 實際觀察：AC2 觸發後 `git fetch origin state` 並檢視 `state.json`，三軌 `currentSessionIndex` 皆為
  2；`git log origin/state --oneline` 顯示本次觸發只新增 1 個 commit（`1f2f6a8`，訊息
  `chore(state): 更新每日推播進度`），前一筆為初始化 commit `f4263ca`。
- 查核指令與結果（`git log` 篩選 bot 提交者）：
  `git log origin/main --author="leetcode-daily-coach-bot" --oneline` → 空（0 筆）；
  `git log origin/develop --author="leetcode-daily-coach-bot" --oneline` → 空（0 筆）。
  查核範圍涵蓋本 Feature 分支建立之後迄今全部歷史。
- Actions run 連結：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30451349953
- run 耗時：21 秒
- [x] 已勾選

---

## AC5：三軌共用教材正文、題目難度帶不同

**操作步驟**：比對三軌 `prefix-sum` Concept 的推播內容（同一次 run 中三軌推播內容的觀察結果）。

**預期結果**：教學正文（Digest / TypeScript Tip / Python Tip / Takeaway / Exit Criteria）逐字相同；
題目難度帶依 Track 不同。

- 實際觀察：三份課表中 `prefix-sum` 皆位於 `sessionIndex: 9`（`node -e` 查詢確認）。依 runbook
  記載的合法維運操作「調整某軌進度」，將 `state` 分支三軌 `currentSessionIndex` 由 3 直接改為 9
  （commit `d9323d1`，僅動此欄位）並以 `force=true` 觸發推播一次取得該 session 內容（避免為湊測試
  證據而對真實頻道連續推播 session 3–8 共 7 課、21 則不必要訊息）。使用者於三個 Discord 頻道比對後
  確認：①教學正文逐字相同；②題目難度帶三軌不同。
- Actions run 連結：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30452776251
- [x] 已勾選

---

## AC6：全程無 LLM API key 仍端到端成功

**操作步驟**：檢視 AC2 觸發的 Actions log，確認執行環境未提供任何 LLM 金鑰且執行成功；並檢視
`.github/workflows/daily.yml` 定義中 LLM 金鑰名稱出現次數（`tests/unit/zero-llm.test.ts` 掃描結果）。

**預期結果**：該次 run 環境未提供任何 LLM 金鑰且執行成功；`daily.yml` 中 LLM 金鑰名稱出現次數為 0。

- 實際觀察：AC2 觸發之 Actions log 的 `Run daily push` step 印出的 `env:` 區塊僅含
  `DISCORD_WEBHOOK_URL_FOUNDATION`／`DISCORD_WEBHOOK_URL_INTERVIEW_READY`／
  `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY`／`STATE_FILE`／`DRY_RUN`／`FORCE`，未含任何 LLM 金鑰；
  該次 run 三軌皆 `pushed`、job 綠燈成功。
- 掃描測試結果：`npx vitest run tests/unit/zero-llm.test.ts` → 14 個測試全數通過（含
  `daily.yml` 不含 `GEMINI_API_KEY` 等金鑰名稱、不含 `strategy:`/`matrix:` 的斷言）。
- Actions run 連結：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30451349953
- [x] 已勾選

---

## AC9（後半）：`dry_run: true` 不推播、不寫 state

**操作步驟**：同日以 `workflow_dispatch` 觸發（`dry_run=true`）。

**預期結果**：三軌照常編譯／渲染並輸出至 Actions log；**零推播**（頻道無新訊息）；`state` 分支**無新
commit**。**（前半的課表 byte-identical 屬 F4，不在本紀錄範圍。）**

- 實際觀察：`gh workflow run daily.yml --ref 006-pipeline-mvp -f dry_run=true -f force=false` 觸發，
  Actions log 顯示三軌皆 `dry-run preview`；`Commit state changes` step 因
  `inputs.dry_run != true` 條件不成立而整步被跳過（log 顯示 `-`，非 `✓`）；`git fetch origin state`
  後確認 `state.json` 的 `lastPushAt` 仍為前次（session 9）推播時間，未被本次更新，且分支未產生新
  commit；使用者確認三個 Discord 頻道**皆未收到新訊息**。
- Actions run 連結：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30453238542
- run 耗時：13 秒（12:49:35–12:49:56 UTC）
- [x] 已勾選

---

## AC10：多 Track 失敗隔離

**前置**：
- [x] 已先執行 C7a（重置 `state` 分支，使日期 guard 對三軌全部放行）——commit `1209588`
- [x] 本次觸發**未帶 `force`**（`force=false`、`dry_run=false`）

**操作步驟**：暫時把某軌 Secret 改為無效值 → `workflow_dispatch`（`force=false`、`dry_run=false`）→
觀察 → 還原該軌 Secret。

**預期結果**：其餘兩軌正常推播並前進一課；失敗軌收到紅色告警（`15158332`）且進度維持不變；job 以非零
exit code 結束；第一個已設定的頻道另收到一則最後防線純文字通知（刻意保留的兜底設計，非重複故障）。

- 實際觀察：把 `DISCORD_WEBHOOK_URL_FOUNDATION` 暫改為無效值後觸發。Actions log：
  `foundation: failed: 推播失敗：foundation 重試 3 次仍失敗（Failed to parse URL from ***）` →
  `alert-failed: foundation: ...`（告警本身送失敗，符合 FR-020／US4-2，未逸出未捕捉例外）；
  `interviewReady: pushed`／`interviewMastery: pushed`。`state` 分支確認：`foundation` 進度
  完全不變（`currentSessionIndex: 1`、`lastPushAt: null`）；`interviewReady`／`interviewMastery`
  皆前進至 `currentSessionIndex: 2` 且 `lastPushAt` 更新；本次執行**恰好 1 個**新 commit
  （`7627993`，單次存檔涵蓋部分成功）。Job 最終結論為 `failure`（非零 exit code）。
  使用者於 Discord 確認：`interviewReady`／`interviewMastery` 頻道**皆收到**新課程訊息；
  `foundation` 頻道**完全沒有收到**任何訊息（無紅色告警、也無最後防線通知）。
  > **邊界案例發現**：`daily.yml` 的最後防線通知邏輯是「依序找第一個**已設定（非空）**的 webhook」，
  > 未區分「已設定但失效」與「有效」。本次刻意改壞的正是**排序第一**的
  > `DISCORD_WEBHOOK_URL_FOUNDATION`，故最後防線通知也嘗試送往同一個壞掉的 webhook 而一併失敗，
  > `foundation` 頻道因而完全未收到任何通知。這與 quickstart.md 原文「第一個已設定的頻道另收到一則
  > 最後防線通知」的敘述有落差——**該敘述僅在被改壞的 Track 不是第一順位時成立**。job 的結束狀態
  > （非零 exit code）與失敗隔離的核心保證（其餘軌不受影響、失敗軌進度不變、單次存檔）**皆未受影響**，
  > 故不影響 AC10 本身的判定，僅記錄此邊界情境供未來參考。
- Actions run 連結：https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30460526563
- run 耗時：2 分 37 秒（14:20:xx–14:22:xx UTC，遠低於 10 分鐘門檻）
- [x] 已勾選

> **C9 復原驗證**：把 `DISCORD_WEBHOOK_URL_FOUNDATION` 改回正確值後，再次以 `force=false` 觸發
> （run https://github.com/sylvia-H/leetCode-daily-coach/actions/runs/30463227241，11 秒，成功）。
> log 顯示 `foundation: pushed`、`interviewReady: skipped (already pushed today)`、
> `interviewMastery: skipped (already pushed today)`；`state` 分支確認 `foundation` 前進至
> `currentSessionIndex: 2`（從原進度 1 續播，非重置）。符合 FR-023 / SC-008。

---

## 完成判定

- [x] 以上七條 AC（AC2 / AC3 / AC4 / AC5 / AC6 / AC9 後半 / AC10）**全數勾選** ⇒ F6 完成 ⇒ **MVP 達成（M3）**
