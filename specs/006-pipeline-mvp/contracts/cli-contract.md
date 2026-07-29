# Contract: CLI 執行契約增量（F6 修訂）

**Feature**: 006-pipeline-mvp
**基準**: [`specs/001-walking-skeleton/contracts/cli-contract.md`](../../001-walking-skeleton/contracts/cli-contract.md)
**消費者**: `.github/workflows/daily.yml`、維運者（`docs/runbook.md`）

環境變數、布林解析（`parseBool`）、Track 啟用判定、固定處理順序**全部不變**。本檔只列 F6 增量。

---

## 1. 完課終態的模式矩陣（新增）

| `DRY_RUN` | `FORCE` | 該軌狀態 | 行為 | 日誌行 | exit 影響 |
| --- | --- | --- | --- | --- | --- |
| false | false | 已有 `completedAt` | 靜默跳過 | `{track}: skipped (completed)` | 無 |
| false | **true** | 已有 `completedAt` | **仍跳過**（force 只繞過日期 guard） | `{track}: skipped (completed)` | 無 |
| false | any | 超出課表、無 `completedAt` | 發完課通知 + 寫 `completedAt` | `{track}: completed` | 無（**exit 0**） |
| false | any | 超出課表、通知發送失敗 | 視為該軌失敗，**不寫** `completedAt` | `{track}: failed: {reason}` | **exit 1** |
| **true** | any | 已有 `completedAt` | 只輸出日誌 | `{track}: completed (skipped, dry-run)` | 無 |
| **true** | any | 超出課表、無 `completedAt` | 只輸出日誌，**不發送、不寫狀態** | `{track}: would send completion notice (dry-run)` | 無 |

**判定條件（MUST）**：`currentSessionIndex > max(schedule.sessions[].sessionIndex)`。
課表**中間缺號**（`find()` 失敗但未超出最大值）MUST 仍為**該軌失敗**（紅色告警 + exit 1），
MUST NOT 誤判為完課。

**檢查順序（MUST）**：per-track 日期 guard → 完課檢查 → compile / render / budget → post。

---

## 2. exit code 語意（修訂）

| 情境 | exit code |
| --- | --- |
| 全部啟用 Track 皆為 `SKIPPED` / `COMPLETED` / `SUCCEEDED` 的任意組合 | **0** |
| 任一 Track `FAILED`（含完課通知發送失敗） | 1 |
| 全域性失敗（無 webhook / `STATE_FILE` 缺失 / state 解析或語意損毀 / 存檔失敗 / 素材載入失敗） | 1 |

> **F1 相對變更**：「課表走完」由 exit 1 改為 **exit 0**（`docs/spec.md` §9.2 / §18，F6 定案）。
>
> **非零值 MUST 釘死為 `1`**（spec FR-018a）：結束狀態只有 `0` / `1` 兩個合法值，使 workflow 端可據此分支。

**「state 解析或語意損毀」的範圍（F6 定案 2026-07-29，spec FR-031 / Edge Cases）**：

| 情境 | 判定 |
| --- | --- |
| `STATE_FILE` 指向的檔案**不存在** | 視為空狀態（**唯一的寬容入口**），不算失敗 |
| 檔案存在但內容為**空字串／純空白／非 JSON** | 解析失敗 ⇒ 全域性失敗 |
| 檔案存在但 `tracks` 為**空物件或缺此鍵** | 視為空狀態，與「檔案不存在」結果一致 |
| `tracks` 含**不屬於三個已知 Track 的未知鍵** | 語意損毀 ⇒ 全域性失敗（MUST NOT 靜默忽略、MUST NOT 於 `save()` 移除） |
| 欄位語意違反 FR-031 封閉清單任一款 | 語意損毀 ⇒ 全域性失敗 |

全域性失敗一律 **MUST NOT 覆寫原狀態檔**（中止點在逐 Track 迴圈之前，`save()` 不被呼叫）。

---

## 3. 日誌契約（新增行）

| 行 | 時機 |
| --- | --- |
| `{track}: completed` | 首次完課且通知送出成功 |
| `{track}: skipped (completed)` | 已有 `completedAt` |
| `{track}: completed (skipped, dry-run)` / `{track}: would send completion notice (dry-run)` | DRY_RUN 下的兩種完課情境 |

既有行（`pushed` / `skipped (already pushed today)` / `failed: {reason}` / `alert-failed: …`）不變。
所有日誌 MUST NOT 印出 webhook URL（憲章 XIV）。

---

## 4. Workflow 契約（FR-024）

| 要求 | 等級 |
| --- | --- |
| `schedule` 事件執行 **repo 預設分支（`develop`）** 上的 `daily.yml` | MUST（GitHub 行為，不可設定） |
| 程式碼 checkout step MUST NOT 指定 `ref:`（取觸發 workflow 的 ref） | MUST |
| step 名稱 MUST 反映實際分支語意（不得叫 `Checkout main`） | MUST |
| `daily.yml` 中 LLM 金鑰名稱出現次數 = **0** | MUST（憲章 VIII、SC-005） |
| `state` 分支 checkout 至 `.state`、`STATE_FILE=.state/state.json` | MUST（不變） |
| 存檔提交 step 的 `if: ${{ !cancelled() && inputs.dry_run != true }}` | MUST 保留（失敗隔離；註解已說明理由） |
| 提交前 MUST 偵測無變更（`git diff --cached --quiet`）並略過提交——三軌皆跳過時 commit 數為 **0**，MUST NOT 產生空 commit | MUST（不變；FR-015 澄清） |
| 最後防線通知 MUST 維持極簡純文字（`{"content": …}`），MUST NOT 使用 embeds | MUST（不變） |
