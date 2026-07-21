# Contract: CLI 執行契約（環境變數 / 模式 / exit code）

**Feature**: 001-walking-skeleton | **消費者**: `.github/workflows/daily.yml`、本機開發者

本 Feature 交付的是一支**一次性 CLI**：`node dist/main.js`。它沒有子指令、沒有旗標參數——
**全部輸入皆來自環境變數**（憲章：Secrets 只走環境變數；命名已於 spec §22.3 釘死）。

---

## 1. 環境變數

| 變數 | 必填 | 型別 | 說明 |
|---|---|---|---|
| `DISCORD_WEBHOOK_URL_FOUNDATION` | 至少三選一 | string | 設定即啟用 `foundation` Track，移除即停用 |
| `DISCORD_WEBHOOK_URL_INTERVIEW_READY` | 至少三選一 | string | 同上，對應 `interviewReady` |
| `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` | 至少三選一 | string | 同上，對應 `interviewMastery` |
| `STATE_FILE` | ✅ | string | `state.json` 路徑（workflow 中為 `.state/state.json`） |
| `DRY_RUN` | — | `"true"` \| 其他 | 預設 false。見 §3 |
| `FORCE` | — | `"true"` \| 其他 | 預設 false。見 §3 |

**MUST NOT 存在**：`GEMINI_API_KEY`（憲章 VIII；`daily.yml` 中不得出現此鍵）。

### 啟用判定（FR-008）

- 「非空」= `trim()` 後長度 > 0。只有空白字元視為未設定。
- 至少一個 webhook 非空 → 該組 Track 為「已啟用」，依固定順序處理：
  `foundation` → `interviewReady` → `interviewMastery`（FR-009）。
- 三者皆空 → **全域失敗**（見 §4）。

### 布林解析（research R6，MUST）

```
parseBool(v) := v?.trim().toLowerCase() === "true"
```

- `"true"` → `true`；`"false"` / `""` / `undefined` / 任何其他值 → `false`
- **理由**：GitHub Actions 的 boolean input 經 `env:` 傳入為字串；`schedule` 觸發時展開為空字串。
  直接用 JS truthiness 會讓 `"false"` 判為真，導致 dry run 意外變成真實推播。

---

## 2. 標準輸出（日誌）

日誌為人類可讀的純文字，寫入 stdout（錯誤寫 stderr）。**契約性要求**：

| 要求 | 說明 |
|---|---|
| MUST NOT 印出 webhook URL | 含機密（憲章 XIV）。只印 Track 名稱 |
| DRY_RUN 時 MUST 印出完整 render 結果 | US4 Scenario 1；embeds 以格式化 JSON 輸出 |
| DRY_RUN 時 MUST 印出字元預算明細 | US4 Scenario 2：逐區塊名稱、實際字元數、上限、是否超限 |
| 每個 Track MUST 印出結果行 | `pushed` / `skipped (already pushed today)` / `failed: {reason}` |
| 失敗 MUST 印出可辨識的原因 | 憲章 XV「Fail Loud」 |

---

## 3. 執行模式

三個布林維度的組合行為（FR-021 / FR-021a / FR-021b、research R9）：

| `DRY_RUN` | `FORCE` | 同日已推過 | 行為 |
|---|---|---|---|
| false | false | 否 | 正常推播 → 推進進度 → 存檔 |
| false | false | 是 | **跳過**該 Track（不視為失敗，exit 0） |
| false | true | 是 | 繞過去重，正常推播 → 推進進度 → 存檔 |
| **true** | false | 否 | compile + render + 預算檢查 → 輸出至 log；**不推播、不寫 state** |
| **true** | false | **是** | **同上**——DRY_RUN 自行略過去重判斷（FR-021a） |
| **true** | **true** | 任意 | **同上**——DRY_RUN 優先，MUST NOT 視為設定衝突（FR-021b） |

**實作要點**：guard 的略過條件為 `dryRun || force`；`dryRun` 為真時流程在推播前 `continue`，
故 `force` 的值不影響結果——兩條需求由同一行條件式滿足。

---

## 4. Exit Code 契約

| Exit | 條件 |
|---|---|
| `0` | 全部已啟用 Track 皆「推播成功」或「同日跳過」；或 DRY_RUN 全數渲染成功 |
| `1` | 至少一個 Track 失敗，或發生全域性失敗 |

### 全域性失敗（在逐 Track 迴圈**之前**中止，不推播、不寫 state）

- 三個 webhook 皆未設定 → 訊息須明確指出「未設定任何 Track 的 webhook」
- `STATE_FILE` 未設定
- `state.json` 讀取或 JSON 解析失敗 → **MUST NOT 覆寫**原檔
- `state.json` **欄位語意損毀**（JSON 合法但欄位不合法）→ 同上，見 state-schema.md「欄位語意驗證」

### 全域性失敗（在逐 Track 迴圈**之後**）

- **狀態存檔失敗**（`STATE_FILE` 路徑不可寫等）：MUST 發全域告警 + exit 1。
  MUST NOT 讓例外逸出 `run()`——否則會成為無告警的 unhandled rejection，且 `process.exit` 走不到
  （違反憲章 XV「Fail loud」）。

**全域性失敗的告警責任（FR-010a，MUST）**：`main.ts` 在中止前 MUST 呼叫 **`renderAlert`（同一顆）**
並 POST 至**第一個已設定的 webhook**（順序 `foundation` → `interviewReady` → `interviewMastery`），
再以 exit 1 結束。

| 全域性失敗情境 | 是否發告警 | 說明 |
|---|---|---|
| 三個 webhook 皆未設定 | ❌ 否 | 無處可發；僅 log + exit 1（**不構成無聲失敗**，FR-010a） |
| `STATE_FILE` 未設定 | ✅ 是 | 發至第一個已設定 webhook |
| `state.json` 解析失敗 | ✅ 是 | 同上；且 MUST NOT 覆寫原檔 |

> **MUST NOT** 由 `daily.yml` 自行拼組 embed 告警——同一責任兩套實作會使版面漂移（FR-010a）。
> workflow 只保留極簡純文字的最後防線通知，見 §6。

### 單一 Track 失敗（隔離，繼續處理其餘 Track；最終 exit 1）

- 課表用盡（`sessionIndex` 超出硬編課表範圍）
- 教材檔缺失、缺少推播用區塊、frontmatter 欄位缺失、`meta.id` 不符
- 題目查無對應、題數超過 3
- 字元預算超限（於送出**前**擋下）
- Discord POST 非 2xx 或連線錯誤

**每一個單一 Track 失敗 MUST**：對該 Track 頻道發紅色告警 Embed（若 webhook 可用）、記錄錯誤日誌、
不推進該 Track 進度、繼續下一個 Track。

**告警送出本身失敗時（FR-010c，MUST）**：
- MUST 記錄第二筆錯誤日誌（格式 `alert-failed: {track}: {reason}`），仍計為該 Track 失敗
- MUST **不**因告警失敗而拋出未捕捉例外中斷迴圈——後續 Track 照常處理
- 實作上：告警發送 MUST 包在自己的 `try/catch` 內，且該 `catch` MUST NOT 重新拋出

---

## 5. npm scripts 契約

| script | 指令 | 用途 |
|---|---|---|
| `build` | `tsc` | 編譯至 `dist/` |
| `test` | `vitest run` | 單元測試（CI 用） |
| `test:watch` | `vitest` | 開發用 |
| `start` | `node dist/main.js` | 執行（需先 build） |

本機 dry run（PowerShell）：
```powershell
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://discord.com/api/webhooks/xxx/yyy"
$env:STATE_FILE = ".state/state.json"
$env:DRY_RUN = "true"
npm run build; if ($?) { npm start }
```

> 憲章明訂：本機驗證版面 MUST 用 `DRY_RUN=true`，MUST NOT 對真實 webhook 測試推播。

---

## 6. Workflow 契約（`daily.yml`）

| 項目 | 值 |
|---|---|
| `schedule` cron | `7 22 * * *`（台北 06:07 主推）、`37 22 * * *`（台北 06:37 補跑） |
| `workflow_dispatch` inputs | `dry_run`（boolean, default false）、`force`（boolean, default false） |
| `permissions` | `contents: write`（push `state` 分支） |
| `concurrency` | group 固定、`cancel-in-progress: false`（避免兩個 cron 搶 `state` 分支） |
| checkout | 兩個 ref：主分支（程式與內容）+ `state` 分支（`path: .state`） |
| Node | `actions/setup-node@v4`、`node-version: 24`、`cache: npm` |
| **MUST NOT** | 使用 matrix 平行跑多 Track（會搶 `state` 分支）；傳入 `GEMINI_API_KEY` |

**state 提交責任**（research R5）：CLI **只寫檔**；`git add / commit / pull --rebase --autostash / push`
與重試迴圈由 workflow step 執行。**重試上限固定 3 次**（FR-017），耗盡即以非零狀態結束該 step。

**提交 step 的 `if:` 條件（MUST）**：`if: ${{ !cancelled() && inputs.dry_run != true }}`。
`!cancelled()` MUST 保留——`if:` 運算式若不含任何 status function，GitHub 會**隱式補上 `success()`**，
使「單一 Track 失敗 → `main.ts` exit 1」連帶跳過提交，讓已成功 Track 的進度無法寫入 `state` 分支
（違反 state-schema.md §4「部分成功仍存檔」與憲章 XV 的失敗隔離）。

**重試迴圈的 shell 語意（MUST）**：於 `set -e` 下，重試迴圈**本體**內的 `git pull --rebase --autostash`
失敗會直接中止整個 step，使剩餘重試預算失效、本地 commit 隨 runner 消失。故同步失敗 MUST 被容錯
（例如 `if ! git pull …; then git rebase --abort || true; fi`），讓迴圈跑滿 3 次重試。

**最後防線通知（FR-010b）**：`if: failure()` 的 step MUST 只發**極簡純文字**訊息
（body 為 `{"content": "..."}`，內容為一行「daily workflow 失敗，詳見 Actions log」＋ run 連結），
發至第一個已設定的 webhook secret。

| 規則 | 說明 |
|---|---|
| **MUST NOT 使用 `embeds`** | 版面渲染的唯一實作是 `renderer/alert.ts`（FR-010a） |
| **MUST NOT 重述失敗原因細節** | 原因由 `main.ts` 的告警負責；此處只是「程式沒能跑起來」的兜底 |
| 涵蓋情境 | `npm ci` / `tsc` / checkout / setup-node 失敗，即 `main.ts` 根本未執行的情況 |
| 重疊時的容忍 | `main.ts` 已發過告警又觸發此 step 時，使用者會收到一則多餘的純文字提示——**可接受**，優於靜默 |
