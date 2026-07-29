# Quickstart: 006-pipeline-mvp 驗證流程

**Date**: 2026-07-24 | **Plan**: [plan.md](./plan.md)

分三段：**A 本機自動化驗證**（每次改動都跑）、**B 本機預覽**（不打擾自己地看版面）、
**C 實機驗收**（M3 完成條件，證據寫入 [acceptance.md](./acceptance.md)）。

環境：Windows + PowerShell、Node.js 24、`npm ci` 已完成。

---

## A. 本機自動化驗證

```powershell
npm run build          # tsc（src/）
npm run typecheck      # tests/ 與 scripts/ 的型別
npm test               # vitest：tests/unit/** + tests/e2e/**
npm run validate:content   # F5 內容 Gate（全 Track × 全 Session 編譯 + 預算）
```

**預期**：全部通過。`npm test` 應包含 `tests/e2e/` 的五個檔案（見
[contracts/e2e-harness.md](./contracts/e2e-harness.md) §3）。

只跑端到端：

```powershell
npx vitest run tests/e2e
```

**這一步證明了什麼**：SC-001 / SC-002 / SC-003 / SC-004 / SC-006 / SC-007 / SC-011 的**邏輯層**保證——
三軌不交叉、同日去重、進度推進、失敗隔離、共用教材、完課終態，全部在真實 compile / render /
WebhookClient 鏈路上驗證，唯一替身是全域 `fetch`。

---

## B. 本機預覽（DRY_RUN，MUST NOT 打真實 webhook）

```powershell
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://example.invalid/hook/f"
$env:DISCORD_WEBHOOK_URL_INTERVIEW_READY = "https://example.invalid/hook/r"
$env:DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY = "https://example.invalid/hook/m"
$env:STATE_FILE = "$env:TEMP\ascent-state.json"
$env:DRY_RUN = "true"
npm run build; node dist/main.js
```

**預期**：三軌各印出完整 embeds（格式化 JSON）與字元預算逐項明細；**無任何對外請求**；
`$env:STATE_FILE` 不被建立。憲章明令本機 MUST NOT 對真實 webhook 測版面，故上面刻意使用
`example.invalid`（DRY_RUN 下不會被使用）。

驗證完課版面：把 `$env:STATE_FILE` 指向一份 `currentSessionIndex` 設為 `99` 的 `state.json`，
重跑後應看到 `would send completion notice (dry-run)`。

清理：

```powershell
Remove-Item Env:DRY_RUN, Env:STATE_FILE, Env:DISCORD_WEBHOOK_URL_FOUNDATION, `
  Env:DISCORD_WEBHOOK_URL_INTERVIEW_READY, Env:DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY
```

---

## C. 實機驗收（M3）

前置：三個 Discord 頻道與 webhook 已建立、三個 Secrets 已登錄（步驟見
[docs/setup-guide.md](../../docs/setup-guide.md)）、`state` 分支已依
[research.md](./research.md) R8 重置為三軌初始值。

> **執行分支（FR-027a，MUST）**：C 段全部以 `workflow_dispatch` 觸發，且 **ref 指定為本 Feature 分支
> `006-pipeline-mvp`**——**MUST NOT 為了取得驗收證據而先 merge 回 `develop`**。七條 AC 全數勾選後才
> merge（`workflow_dispatch` 可在任意分支上執行，故不需要等預設分支的 cron）。
> 唯一與預設分支有關的檢查是 C1，它只是**文件化確認**當下的 Default branch 設定。

| # | 操作 | 預期 | 對應 AC |
| --- | --- | --- | --- |
| C1 | 確認 GitHub repo Settings 的 Default branch = `develop` | 相符 | FR-024 |
| C2 | `workflow_dispatch` 觸發（`dry_run=false`、`force=false`） | 三個頻道各收到自己 Track 的 Session 1 課程；無交叉 | **AC2** |
| C3 | 檢視 Actions log | 無任何 LLM 呼叫、`daily.yml` 無 LLM 金鑰；job 綠燈 | **AC6** |
| C4 | 檢視 `state` 分支 | 三軌 `currentSessionIndex` 皆為 2；**恰好 1 個** commit；`main` / `develop` 無 bot commit | **AC4** |
| C5 | 同日再次 `workflow_dispatch`（`force=false`） | 三軌皆 `skipped (already pushed today)`；`state.json` 無新 commit | **AC3** |
| C6 | 同日以 `force=true` 觸發 | 三軌照常推播並寫狀態 | **AC3** |
| C7 | 比對三軌某個共同 Concept（如 `prefix-sum`）的訊息 | 教學正文逐字相同、題目難度帶不同 | **AC5** |
| **C7a** | **把 `state` 分支的 `state.json` 重置為三軌初始值**（`currentSessionIndex: 1`、`lastPushAt: null`、空陣列、無 `completedAt`），以一次人工 commit 完成 | 三軌 `lastPushAt` 皆為 `null` ⇒ 日期 guard 對三軌**全部放行** | **C8 的前置**（見下方註） |
| C8 | 暫時把某軌 Secret 改為無效值後觸發（**`force=false`、`dry_run=false`**） | 其餘兩軌正常推播並推進（`currentSessionIndex` → 2）；失敗軌收到**紅色**告警且進度**維持 1**；job **紅燈**；**第一個已設定的頻道另收到一則純文字的最後防線通知（預期行為，見下方註）** | **AC10** |
| C9 | 還原該軌 Secret | 下次執行從原進度續播（非重置為 1） | FR-023 / SC-008 |
| C10 | 同日以 `dry_run=true` 觸發 | 三軌照常編譯／渲染並輸出至 Actions log；**零推播**（頻道無新訊息）；`state` 分支**無新 commit** | **AC9（後半）** |

> **為何需要 C7a（FR-027b，MUST）**：AC10 的實機演練 **MUST NOT 帶 `force`**——帶了會讓兩個健康軌
> 重推當日已推過的課並各前進一課（同日跳課，`docs/spec.md` §21.1）。但 C2 / C6 當天已經推過，日期
> guard 會把三軌全部跳過而**取不到任何隔離證據**。重置 `state` 分支使 `lastPushAt` 回到 `null`，即可讓
> guard 放行、C8 在不帶 `force` 的前提下取得證據，**副作用為零**：失敗軌進度不變、還原 Secret 後
> （C9）下次執行自動補推，不需要人工修進度。此重置即 runbook 的「調整某軌進度」正規操作
> （與 [research.md](./research.md) R8 的初始化為同一動作），**MUST NOT** 視為為驗收硬湊的手段。
> 代價僅是三個頻道會再收到一次 Session 1，與 C6 的 `force` 重推同性質，屬可接受的驗收噪音。
>
> **C8 的最後防線通知說明**：`daily.yml` 的最後防線 step 條件為 `if: failure()`，只要 job 任一步驟失敗
> 就會觸發——包含「單軌失敗導致 `main.ts` exit 1」。因此 AC10 情境下，使用者會同時收到
> **失敗軌的紅色告警 Embed** 與**第一個已設定頻道的純文字通知**。這是刻意保留的兜底設計
> （`main.ts` 根本沒能啟動時仍有通知），**MUST NOT** 在驗收時判為異常。此行為 MUST 於
> [docs/runbook.md](../../docs/runbook.md) 一併明示（FR-023）。

每一列的實際觀察與 Actions run 連結 MUST 填入 [acceptance.md](./acceptance.md) 並勾選；
**全部勾選才視為本 Feature 完成**（FR-027）。紀錄中 MUST NOT 貼上 webhook URL。
**順帶記錄各次 run 的耗時**（Actions run 頁面即有）以佐證 SC-009——判定門檻為 **≤ 10 分鐘**，
超過即該條不得勾選。

---

## D. 維運操作驗證（SC-008）

僅依 [docs/runbook.md](../../docs/runbook.md)、**不看原始碼、不改程式**完成五項操作：

1. 啟用一個新 Track（加 Secret → 下次執行自動從第 1 課開始）
2. 暫停一個 Track（移除 Secret → 進度保留）
3. 把某軌進度改到指定課次（編輯 `state` 分支的 `state.json`；若該軌已完課，**同時刪除 `completedAt`**）
4. 手動補推一次（`force=true`）
5. 預覽一次（`dry_run=true`）

五項全部成功即滿足 SC-008。
