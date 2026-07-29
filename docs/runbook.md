# 日常維運 Runbook（FR-023）

本文件回答「系統立起來之後，每天怎麼操作與排查」；**第一次把系統立起來**（`state` 分支初始化、
Discord 頻道與 Webhook 取得、GitHub Actions Secrets 登錄）請見
[docs/setup-guide.md](./setup-guide.md)，那是一次性文件，本文件不重複其內容。

> **全篇 Secret／webhook URL 示範一律使用佔位示意**（如 `<your-webhook-url>`），**MUST NOT** 使用真實值
> （憲章 XIV、FR-025）。

---

## 目錄

1. [啟用 / 暫停 / 續播一個 Track](#1-啟用--暫停--續播一個-track)
2. [調整某軌進度](#2-調整某軌進度)
3. [沉默失敗警告：重新啟動已完課的 Track](#3-沉默失敗警告重新啟動已完課的-track)
4. [手動補推（force）](#4-手動補推force)
5. [預覽版面（dry_run）](#5-預覽版面dry_run)
6. [`state` 分支的初始化與人工編輯](#6-state-分支的初始化與人工編輯)
7. [每日排程實際執行分支](#7-每日排程實際執行分支)
8. [推播失敗時的排查起點](#8-推播失敗時的排查起點)
9. [執行結局的判讀對照](#9-執行結局的判讀對照)
10. [權限前提](#10-權限前提)
11. [回復路徑](#11-回復路徑)
12. [webhook URL 輪換與外洩處置](#12-webhook-url-輪換與外洩處置)
13. [AC10 失敗隔離演練程序](#13-ac10-失敗隔離演練程序)
14. [預設分支變更的後果](#14-預設分支變更的後果)

---

## 1. 啟用 / 暫停 / 續播一個 Track

三個 Track 是否啟用完全由對應的 GitHub Actions Secret 是否設定決定，**不需要改任何程式碼**：

| Track | Secret 名稱 |
| --- | --- |
| `foundation` | `DISCORD_WEBHOOK_URL_FOUNDATION` |
| `interviewReady` | `DISCORD_WEBHOOK_URL_INTERVIEW_READY` |
| `interviewMastery` | `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` |

- **啟用**：至 repository → Settings → Secrets and variables → Actions，新增對應 Secret（值為該
  Track 的 Discord webhook URL，取得方式見 [setup-guide.md Step 2](./setup-guide.md#step-2建立-discord-頻道與取得-webhook-url)）。
  下次執行會**自動從第 1 課開始**（`state.json` 若無此 Track 的既有進度，`load()` 會自動補建初始值）。
- **暫停**：移除（或清空）對應 Secret。該 Track 每次執行都會被跳過（因為 `enabledTracks` 不含它），
  `state.json` 中該軌的進度**原樣保留、不會被歸零**。
- **續播**：重新加回 Secret，下次執行會從**原進度**繼續（不是重置回第 1 課）。

未設定與設定為空字串／純空白字串，**一律視為停用**，行為完全相同。

---

## 2. 調整某軌進度

調整進度的**唯一官方方式**是直接編輯 `state` 分支的 `state.json`（見 [§6](#6-state-分支的初始化與人工編輯)
的編輯流程）：

```powershell
git fetch origin state
git checkout state
# 編輯 state.json，例如把 foundation.currentSessionIndex 改成想要的課程序號（1-based）
git add state.json
git commit -m "chore(state): 手動調整 foundation 進度"
git push origin state
git checkout develop
```

**MUST NOT** 另外新增「起始課數」之類的環境變數或設定項——`state` 分支的 `state.json` 是進度的
唯一權威來源。

> **手誤打錯 Track 名稱的後果（FR-031）**：`tracks` 鍵只認得 `foundation` / `interviewReady` /
> `interviewMastery` 三個名稱。若編輯時打錯字（例如 `interviewready` 少了大寫 R），下次執行會判定為
> **欄位語意損毀 ⇒ 全域性失敗**：該次執行完全不推播任何 Track、以非零狀態結束，且**原檔不會被覆寫**
> ——這是刻意的 fail-loud 設計，不是程式故障。修正拼字後重跑即可，打錯的內容仍完整保留在
> `state` 分支上供你核對。

若該軌**已經完課**（見 [§3](#3-沉默失敗警告重新啟動已完課的-track)），調整進度時 MUST 額外處理
`completedAt` 欄位，否則會遇到下一節描述的陷阱。

---

## 3. 沉默失敗警告：重新啟動已完課的 Track

某軌走完課表後，`state.json` 會多出一個 `completedAt` 欄位（完課通知成功送出的時間）。**只要這個欄位
存在，該軌其後每次執行都會被靜默跳過**（log 顯示 `{track}: skipped (completed)`），無論你把
`currentSessionIndex` 改成什麼。

> **⚠️ 陷阱**：如果你只改了 `currentSessionIndex`（例如想讓 `foundation` 從第 5 課重新開始）
> **卻忘記刪除 `completedAt`**，該軌會繼續被靜默跳過——`currentSessionIndex` 的變更完全不會生效，
> 而且**不會有任何錯誤訊息**，因為程式不認為這是故障。你只會發現「怎麼一直沒收到課程」。

正確做法：兩件事**一起做**（缺一不可）：

```jsonc
{
  "tracks": {
    "foundation": {
      "currentSessionIndex": 5,   // ← 改這裡
      "lastPushAt": "2026-08-06T22:07:31Z",
      "completedConceptIds": [...],
      "history": [...]
      // ↑ completedAt 欄位整個刪除（不是設成 null；缺席與 null 效果相同，刪除最乾淨）
    }
  }
}
```

程式**故意不自動清除**這個欄位——狀態層本身不認識課表，無法自行判斷「調整後的進度是否仍在完課狀態」，
這個判斷只有維運者知道意圖，所以刻意留給人工處理。

---

## 4. 手動補推（force）

`workflow_dispatch` 手動觸發時勾選 `force`（或直接設定環境變數 `FORCE=true`）會**繞過同日去重 guard**，
讓已在今天推播過的 Track 立即再推一次並前進一課。

- **`force` 不會繞過完課跳過**——已完課的 Track 即使 `force=true` 仍會被跳過（見 [§3](#3-沉默失敗警告重新啟動已完課的-track)，若想重新開始必須先按該節步驟編輯 `state.json`）。
- **`force` 不會繞過「無效設定」等全域性失敗**（例如三個 webhook 都沒設定）。

> **⚠️ 同日重複使用 `force` 的後果**：`force` 每次都會讓 `currentSessionIndex` **再 +1**。如果你今天已經
> 用 `force` 補推過一次，之後又**在同一天**再次觸發（無論是否又勾 `force`），該軌會**又前進一課**——
> 也就是同一天內連跳兩課。這是 `force` 語意的直接後果（單純繞過 guard，其餘照常），**MUST NOT** 依賴任何
> 隱藏的「同日只補推一次」保護。**補推只需要執行一次**——觸發前務必先確認今天是否已經補推過（看
> `state.json` 的 `lastPushAt` 是否已是今天，或查看 Actions 執行歷史）。

---

## 5. 預覽版面（dry_run）

`workflow_dispatch` 手動觸發時勾選 `dry_run`（或環境變數 `DRY_RUN=true`）：

- 三軌照常編譯、渲染並輸出完整 embeds（格式化 JSON）與字元預算逐項明細**至 Actions log**。
- **不會**對任何頻道發送任何訊息（課程訊息、失敗告警、完課通知皆不發送）。
- **不會**寫入 `state.json`（`state` 分支不會有新 commit）。
- `dry_run` 與 `force` 同時勾選時，以 **`dry_run` 為準**（完全不推播、不寫狀態）。

適合在調整內容或想確認某課版面時使用，**不會**打擾任何真實讀者。

---

## 6. `state` 分支的初始化與人工編輯

`state` 分支是一個**沒有共同歷史的 orphan branch**，只放 `state.json` 一個檔案（唯一權威狀態）。

**若 `state` 分支尚不存在**（例如全新環境、或 [Assumptions](../specs/006-pipeline-mvp/spec.md) 假設的
「分支已存在」不成立時），依 [setup-guide.md Step 1](./setup-guide.md#step-1初始化-state-分支orphan-branch)
的步驟初始化：

```powershell
git checkout --orphan state
git rm -rf .
Copy-Item docs\state.template.json state.json
git add state.json
git commit -m "chore(state): 初始化 state 分支"
git push origin state
git checkout develop
```

**日常人工編輯**（調整進度、清除 `completedAt`……）一律走同樣的流程：`fetch` → `checkout state` →
編輯 `state.json` → `commit` → `push` → 切回 `develop`。**MUST NOT** 手動編輯 `main` / `develop` 上的
任何檔案來影響狀態——`state.json` 只存在於 `state` 分支。

---

## 7. 每日排程實際執行分支

`.github/workflows/daily.yml` 的 `schedule` 事件（雙 cron）**只會執行 GitHub repo 設定的預設分支**上的
workflow 定義與程式碼——這是 GitHub Actions 的行為，不可由 workflow 檔案內部設定改變。本專案的預設分支
是 **`develop`**。

- **併入 `develop` 才會反映到每日推播**：新的 Concept、課表調整、程式修正，MUST 併入 `develop` 才會在
  下一次排程執行中生效。
- **併入 `main` 不影響每日推播**：`main` 只接受來自 `develop` 的合併，`schedule` 事件不會執行 `main` 上
  的任何內容。只把改動合併到 `main` 而未合併到 `develop`，不會有任何效果——這是最容易誤判的一點。
- `state` 分支的 checkout 是**獨立**的一步（checkout 至 `.state/`），與「程式碼／內容取用哪個分支」無關，
  兩者不衝突。

---

## 8. 推播失敗時的排查起點

三步驟排查法（依序）：

1. **看哪裡**：GitHub repo → Actions → 該次失敗的 workflow run 的 log。
2. **找什麼**：log 中每個 Track 各自的結局行（見 [§9](#9-執行結局的判讀對照)）——
   `{track}: failed: {reason}` 會指出失敗原因（webhook URL 已被遮蔽，不會出現在 log 中）；
   若整次執行只有一行不含 Track 名稱的錯誤訊息，代表是**全域性失敗**（config／state／素材載入或存檔
   失敗），本次執行完全沒有任何 Track 被處理。
3. **下一步做什麼**：
   - 若是**單一 Track 失敗**（其餘 Track 仍正常）：查看該 Track 收到的紅色告警 Embed 內容（若告警本身
     也送不出去，回頭看 log 的 `alert-failed: {track}: ...`），依錯誤原因判斷是否為暫時性（網路／
     Discord 限流，通常下次排程會自動恢復）或需要人工介入（webhook 已失效，見 [§12](#12-webhook-url-輪換與外洩處置)）。
   - 若是**全域性失敗**：對照 `state` 分支上的 `state.json`，確認是否有近期的手動編輯造成損毀
     （見 [§2](#2-調整某軌進度) 的未知鍵陷阱，或欄位型別錯誤）；若非人工編輯造成，檢查
     `DISCORD_WEBHOOK_URL_*` 三個 Secret 是否至少一個已設定、`STATE_FILE` 環境變數是否正確。
   - 若不確定，**先不要用 `force` 重跑**——`force` 只繞過同日去重，無法修正真正的故障原因。

---

## 9. 執行結局的判讀對照

不需要閱讀原始碼即可判讀一次執行的 log：

| log 字樣 | 意義 | 需要動作嗎 |
| --- | --- | --- |
| `{track}: pushed` | 該軌今天成功推播一課，進度已前進 | 否 |
| `{track}: skipped (already pushed today)` | 該軌今天已經推播過，本次略過（正常去重） | 否 |
| `{track}: skipped (completed)` | 該軌已完課，靜默略過 | 否（除非你正打算重新啟動它，見 [§3](#3-沉默失敗警告重新啟動已完課的-track)） |
| `{track}: completed` | 該軌**首次**走完課表，已發出完課通知並記錄完課時間 | 否，這是正常終局 |
| `{track}: completed (skipped, dry-run)` | 預覽模式下，該軌本應顯示已完課 | 否 |
| `{track}: would send completion notice (dry-run)` | 預覽模式下，該軌本應觸發完課通知 | 否 |
| `{track}: failed: {reason}` | 該軌本次推播失敗（進度不變，除非是部分推播） | 視情況，見 [§8](#8-推播失敗時的排查起點) |
| `alert-failed: {track}: ...` | 該軌的紅色告警本身也送不出去（連告警都失敗） | 是，該軌目前沒有任何使用者可見的失敗訊號，需主動查 Actions log |
| `alert-failed: 全域: ...` | 全域告警送不出去 | 是，同上 |
| （不含 Track 名稱的單行錯誤） | 全域性失敗，本次執行完全未處理任何 Track | 是，見 [§8](#8-推播失敗時的排查起點) |

**最後防線通知的觸發範圍**：`daily.yml` 的「最後防線通知」step 條件為 `if: failure()`，**單一 Track
失敗（exit 1）也會觸發它**。因此單一 Track 失敗當天，第一個已設定的頻道會**同時**收到該軌的紅色告警
Embed 與一則極簡純文字的最後防線通知——這是刻意保留的兜底設計（涵蓋「main.ts 根本沒能啟動」的情況），
**不是重複故障**，看到兩則訊息屬正常現象。

---

## 10. 權限前提

以下操作各自需要不同的 GitHub 權限，**缺乏權限時的失敗（例如 push 被拒絕、無法看到 Settings 頁面）
MUST NOT 誤判為程式故障**：

| 操作 | 所需權限 |
| --- | --- |
| 編輯 `state` 分支（調整進度、初始化） | repo 的**寫入（push）**權限 |
| 新增／刪除／修改 Secrets（啟用／暫停 Track、輪換 webhook） | repo 的**管理設定（Settings）**權限 |
| 確認／變更 Default branch | repo 的**管理設定（Settings）**權限 |
| 手動觸發 `workflow_dispatch` | repo 至少**寫入**權限（或 Actions 執行權限） |

若你不是本 repo 的管理者，請先確認自己是否有上述權限，再判斷「操作失敗」是權限問題還是真正的程式故障。

---

## 11. 回復路徑

常見的三種人工誤操作與回復方式：

| 誤操作 | 回復方式 |
| --- | --- |
| **改錯進度**（`currentSessionIndex` 改成錯的數字） | 依 [§2](#2-調整某軌進度) 的流程再編輯一次 `state.json` 改回正確值，重新 commit + push 至 `state` 分支 |
| **誤刪 Secret**（不小心移除了本要保留的 webhook Secret） | 重新新增同名 Secret、貼回原本的 webhook URL 值（若已遺失原值，需回 Discord 該頻道的整合設定重新複製，或依 [§12](#12-webhook-url-輪換與外洩處置) 重建） |
| **誤推狀態檔**（推送了不正確或過舊的 `state.json` 到 `state` 分支） | `state` 分支本身是一般 git 分支，可用 `git revert` 或再推一次修正版 `state.json` 覆蓋；由於每次執行前都會重新讀取 `state` 分支的最新內容，修正後下次執行即生效 |

---

## 12. webhook URL 輪換與外洩處置

若某 Track 的 webhook URL 疑似外洩（例如不小心貼到公開頻道、公開 issue 或 commit）：

1. 至 Discord 該頻道 → 整合設定 → **刪除舊 Webhook、建立一個新的 Webhook**（重建，取得新 URL）。
2. 至 GitHub repo Settings → Secrets，把對應的 `DISCORD_WEBHOOK_URL_*` 更新為新 URL。
3. 手動觸發一次 `workflow_dispatch`（建議先 `dry_run=true` 確認設定無誤，再正式觸發）確認下次執行成功。

**MUST 以「重建並輪換」處理，MUST NOT 只刪除外洩訊息**——已外洩的 webhook URL 本身就是可被任何人使用的
推播憑證，刪除訊息不會讓憑證失效，只有重建 webhook 才能讓舊 URL 失效。

---

## 13. AC10 失敗隔離演練程序

用於實機驗證「單一 Track 失敗不拖垮其他 Track」，**不影響真實學習者**（副作用為零）：

1. **C7a：重置 `state` 分支**為三軌初始值（`currentSessionIndex: 1`、`lastPushAt: null`，見
   [setup-guide.md](./setup-guide.md) 或 `docs/state.template.json`），使日期 guard 對三軌全部放行
   ——這一步是為了讓接下來的演練**不需要帶 `force`** 就能取得證據（`force` 會讓兩個健康軌也同日跳課，
   汙染驗證結果）。
2. **暫時把其中一軌的 Secret 改為無效值**（例如把 `DISCORD_WEBHOOK_URL_FOUNDATION` 改成一個不存在的
   URL）。
3. **觸發一次 `workflow_dispatch`**，**不帶 `force`**、**不帶 `dry_run`**。
4. **觀察**：其餘兩軌應正常推播並前進一課；被改壞的那一軌應收到紅色告警失敗（或若告警也送不出去，
   log 顯示 `alert-failed`）、進度維持不變；整體 job 應為紅燈（exit 1）；第一個仍正常設定的頻道會
   額外收到一則最後防線純文字通知（見 [§9](#9-執行結局的判讀對照) 的說明，屬正常兜底行為）。
5. **還原該軌 Secret** 為原本正確的 webhook URL。
6. 下次執行會從**原進度**自動續播（不需要任何額外操作，也不會重置回第 1 課）。

---

## 14. 預設分支變更的後果

若 GitHub repo Settings 的 Default branch 從 `develop` 改成其他分支，`schedule` 事件會改為執行**新
預設分支**上的 `daily.yml` 與程式碼——`develop` 上後續的任何改動將**不再**自動生效於每日推播。

本專案**刻意不為此新增偵測或防呆機制**：GitHub 的 Default branch 設定不在 repo 版本控制範圍內，也沒有
零成本的可靠偵測手段。若你打算變更 Default branch，請自行確認這個後果是你要的，變更後建議手動觸發一次
`workflow_dispatch` 確認實際執行內容與預期一致。
