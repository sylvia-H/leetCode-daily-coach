# Quickstart：Walking Skeleton 驗收指南

**Feature**: 001-walking-skeleton | **Plan**: [plan.md](./plan.md)

本文件是**驗收腳本**：照著跑一遍，即可逐條驗證 spec 的 SC-001～SC-011。
環境為 **Windows / PowerShell**（Bash 語法不可混用）。

> 實作細節不在此——見 [contracts/](./contracts/) 與 [data-model.md](./data-model.md)。

---

## 0. 前置需求

| 項目 | 說明 |
|---|---|
| Node.js 24 | 本機建議以 nvm 安裝 `24.x` |
| 一個 Discord 伺服器 | 需有建立頻道與 Webhook 的權限 |
| 一次性環境建置 | 依 `docs/setup-guide.md`（FR-024）完成 `state` 分支初始化與 Webhook 取得 |

```powershell
node -v          # 應為 v24.x
npm ci
npm run build
```

---

## A. 單元測試（最快的回歸驗證）

```powershell
npm test
```

**預期**：全數通過。涵蓋憲章「測試優先」在本 Feature 的適用範圍——教材固定區塊解析、
Compiler determinism、台北日期 guard（含跨日 / UTC 邊界）、狀態推進、多 Track 失敗隔離、
Renderer 純函式性與字元預算。

**對應**：SC-002（預算檢查 100% 通過）、SC-010（重複渲染 100 次逐字元相同）

---

## B. 預覽模式：不打擾任何人先看版面

```powershell
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://discord.com/api/webhooks/<id>/<token>"
$env:STATE_FILE = ".state/state.json"
$env:DRY_RUN = "true"
$env:FORCE = ""
npm start
```

**預期**：
- log 輸出完整的 3 個 embeds（格式化 JSON）
- log 輸出字元預算明細：逐區塊名稱 / 實際字元數 / 上限 / 是否超限，且 `total ≤ 5500`
- Discord 頻道**無**新訊息
- `.state/state.json` **未被改動**（`git -C .state status` 應為 clean）

**對應**：SC-007、SC-002、US4 Scenario 1／2

> 憲章明訂：本機驗證版面 MUST 用 `DRY_RUN=true`，MUST NOT 對真實 webhook 測試推播。
> 版面調整期間反覆跑此步驟，不消耗真實推播、不污染進度。

### B-2. 預覽模式不受同日去重影響

在 C 步驟成功推播**之後**，當天再跑一次 B。

**預期**：仍輸出完整渲染結果（**不**被跳過），頻道仍無新訊息、進度仍不變。
**對應**：FR-021a、US4 Scenario 3

### B-3. 預覽 + 強制 同時開啟

```powershell
$env:DRY_RUN = "true"; $env:FORCE = "true"; npm start
```

**預期**：行為與 B 完全相同——不推播、不寫 state、不因選項衝突而失敗。
**對應**：FR-021b、US4 Scenario 4

---

## C. 真實推播：收到第一堂課

```powershell
$env:DRY_RUN = "false"; $env:FORCE = "false"
npm start
```

**預期**：
- exit code `0`
- Discord 頻道收到 1 則訊息，含觀念精華、Pattern / 複雜度 / 預估時間、TypeScript 與 Python 要點、
  1～3 題可點連結、學習路徑、Exit Criteria、Takeaway
- `.state/state.json` 中 `foundation.currentSessionIndex` 由 `1` 變為 `2`，
  `lastPushAt` 有值，`completedConceptIds` 含 `left-right-pointer`，`history` 有 1 筆

**手動確認（在手機上）**：
- [ ] 每個題目連結皆可正確開啟對應 LeetCode 頁面
- [ ] 訊息中**不含**任何 LeetCode 題目的完整題敘
- [ ] 主要觀念段落不需捲動兩次以上即可讀完
- [ ] 一眼看得出「今天要做的題目是哪幾題」
- [ ] **「這讀起來像一堂課」——須明確回答**

**對應**：SC-001、SC-003、US1 全部 Scenario

---

## D. 同日去重

當天緊接著再跑一次 C。

**預期**：log 顯示該 Track `skipped (already pushed today)`、exit code `0`、
頻道**無**第二則訊息、`currentSessionIndex` 仍為 `2`。

**對應**：SC-004、US3 Scenario 1

---

## E. 進度依序前進，且課表用盡即 fail loud

以強制模式連跑，觀察課程序號：

```powershell
$env:FORCE = "true"
npm start    # 第 2 課
npm start    # 第 3 課
npm start    # 第 4 次 → 課表用盡
```

**預期**：
- 收到的三則訊息標題依序為 `Session 1` / `Session 2` / `Session 3`，不重複、不跳號
- 三則訊息的**學習路徑三行各不相同**（FR-007a），第 1 課無「昨天」一行
- 第 4 次執行：該 Track 收到**紅色告警** Embed、**不**推播課程、`currentSessionIndex` 停在 `4`、
  exit code `1`；**不**回頭重推第 1 課

**對應**：SC-005、US2 Scenario 1、US3 Scenario 3、spec Edge Cases（課表用盡）

---

## F. 推播失敗 → 進度不前進

暫時把 webhook 改為無效值（**不要**刪掉，刪掉會變成該 Track 未啟用）：

```powershell
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://discord.com/api/webhooks/000/invalid"
$env:FORCE = "true"
npm start
```

**預期**：exit code `1`、log 明確記錄失敗原因（含 HTTP 狀態碼，**不含** webhook URL）、
`currentSessionIndex` **完全不變**（0 課前進）。

告警本身也送不出去（webhook 無效）時，仍 MUST 留下錯誤日誌並以非零狀態結束——**不得無聲失敗**。

**對應**：SC-006、US2 Scenario 2、spec Edge Cases（告警送不出去）

---

## G. 設定錯誤 fail-fast

```powershell
Remove-Item Env:DISCORD_WEBHOOK_URL_FOUNDATION
npm start
```

**預期**：立即失敗、exit code `1`、訊息明確指出「未設定任何 Track 的 webhook」、
**不**推播、**不**改動 state。此情境**無處可發告警**，故頻道無任何訊息——僅 log + exit 1（FR-010a）。

再測另外兩種全域性失敗（此時 webhook **保持設定**）：

```powershell
# G-2：STATE_FILE 未設定
Remove-Item Env:STATE_FILE
npm start

# G-3：state.json 損毀
Set-Content .state/state.json "{ this is not json"
npm start
```

**預期（G-2 / G-3）**：exit code `1`、**不**推播課程訊息，但頻道 MUST 收到**一則紅色告警 Embed**
（`title` 為 `⚠️ 推播失敗 · 全域`），且 G-3 的 `state.json` **原檔未被覆寫**（`git -C .state diff` 應顯示
只有你手動改壞的那次變更，程式未再動它）。

> 此告警由 `main.ts` 呼叫 `renderAlert(null, ...)` 發出，與單一 Track 失敗**共用同一顆版面實作**（FR-010a）。

**對應**：SC-008 的前提、US1 Scenario 4、FR-023、FR-010a、spec Edge Cases（狀態檔損毀）

---

## H. 零 LLM 驗證

```powershell
Remove-Item Env:GEMINI_API_KEY -ErrorAction SilentlyContinue
npm start
```

**預期**：完整成功。並確認：
- `.github/workflows/daily.yml` 中**不存在** `GEMINI_API_KEY` 字串
- `src/**` 中**不存在** `@google/genai` 的 import

```powershell
Select-String -Path .github/workflows/daily.yml -Pattern "GEMINI_API_KEY"   # 應無結果
Select-String -Path src/*.ts,src/**/*.ts -Pattern "@google/genai"           # 應無結果
```

**對應**：SC-008、憲章 VIII

---

## I. GitHub Actions 端到端

1. 於 repo Settings → Secrets 登錄 `DISCORD_WEBHOOK_URL_FOUNDATION`
2. Actions → `leetcode-daily-coach` → Run workflow，勾選 `dry_run` → 檢查 log 有完整 render 結果，
   且 `state` 分支**無**新 commit
3. 再次 Run workflow，`dry_run` 不勾 → 頻道收到訊息，`state` 分支新增 1 個 commit
4. 確認 `main` 分支上**沒有**任何自動產生的 state commit

```powershell
git log main --oneline --author=coach-bot    # 應無結果
git log state --oneline                      # 應有 state 推進的 commit
```

**對應**：SC-009、US2 Scenario 5、FR-016

### I-2. state 分支提交衝突的重試（人工驗證，FR-017）

重試迴圈寫在 workflow shell 內、無自動化測試，故以人工方式驗一次：

1. 在 `state` 分支上**手動 push 一筆無關的 commit**（例如在 `state.json` 加一個註解欄位），
   製造 workflow 端的落後狀態
2. 立即以 `force` 觸發一次 workflow（不勾 `dry_run`）

**預期**：state 提交 step 的 log 中可見一次 `git pull --rebase --autostash` 後 push 成功；
**不**出現強制覆寫，且你手動 push 的那筆 commit **仍在** `state` 分支歷史中。

> 重試上限為 **3 次**；耗盡時該 step 以非零狀態結束並觸發 `if: failure()` 的純文字兜底通知。
> 此上限難以人工製造，確認 workflow 腳本中的迴圈次數寫死為 3 即可。

**對應**：FR-017、spec Edge Cases（狀態分支提交衝突）

### I-3. 最後防線通知（FR-010b）

暫時把 `package.json` 的 `build` script 改成必定失敗的指令（例如 `tsc --nonexistent-flag`），
push 後觸發一次 workflow，確認頻道收到**一則純文字**提示（**非** Embed）指向 Actions log，
驗完 MUST 還原 `package.json`。

**對應**：FR-010b

---

## J. 環境建置文件可被依循（人工驗收）

請一位**未參與開發**的使用者，只依 `docs/setup-guide.md` 操作，完成：
`state` 分支初始化 → Discord 頻道與 Webhook 取得 → Secrets 登錄 → 觸發並收到第一則課程訊息。

**預期**：30 分鐘內完成，過程中**不需詢問實作者**。

**對應**：SC-011、FR-024、FR-025

---

## 驗收對照表

| Success Criteria | 驗證步驟 |
|---|---|
| SC-001 3 分鐘內收到訊息、連結可開 | C |
| SC-002 總長 ≤ 5,500 且各區塊不超限 | A、B |
| SC-003 手機可讀性、像一堂課 | C（主觀確認） |
| SC-004 同日兩次觸發只收 1 則 | D |
| SC-005 序號 1/2/3 依序、第 4 次報錯 | E |
| SC-006 失敗時告警且進度不變 | F |
| SC-007 預覽模式 0 訊息 0 提交 | B |
| SC-008 無 LLM 憑證仍成功 | H |
| SC-009 主分支 0 個 state commit | I |
| SC-010 重複渲染 100 次相同 | A |
| SC-011 依文件 30 分鐘完成建置 | J |

### 補充：非 SC 但需人工驗證的需求

| 需求 | 驗證步驟 | 備註 |
|---|---|---|
| FR-010a 全域性失敗告警（共用 `renderAlert`） | G-2、G-3 | 三個 webhook 皆空時無處可發，屬預期 |
| FR-010b 最後防線純文字通知 | I-3 | 驗完 MUST 還原 `package.json` |
| FR-010c 告警送不出去仍續跑 | 單元測試 T014a | 難以人工製造，以 mock 覆蓋 |
| FR-017 提交衝突重試（上限 3 次） | I-2 | 上限本身以檢視腳本確認 |
