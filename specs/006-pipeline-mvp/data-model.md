# Phase 1 Data Model: 006-pipeline-mvp

**Date**: 2026-07-24 | **Plan**: [plan.md](./plan.md) | **Research**: [research.md](./research.md)

本 Feature **不新增持久化實體**，只對唯一權威狀態 `state.json` 做一項向後相容的欄位擴充，並釘死三個
執行期（in-memory）概念的狀態機。內容側實體（`Lesson` / `SessionPlan` / `Problem`）沿用 F5，不重述。

---

## 1. 持久化實體：`TrackState`（增量）

`state` 分支 `state.json` → `tracks[track]`。唯一存取者仍為 `src/state/state-store.ts`。

| 欄位 | 型別 | 必填 | F6 變更 | 說明 |
| --- | --- | --- | --- | --- |
| `currentSessionIndex` | `number`（整數 ≥ 1） | ✅ | — | 下一個要推的 Session（1-based） |
| `lastPushAt` | `string \| null` | ✅ | — | ISO 8601；`null` = 從未推播。**完課不更新此欄** |
| `completedConceptIds` | `string[]` | ✅ | — | 去重追加，僅 concept 類 Session |
| `history` | `HistoryEntry[]` | ✅ | — | 滾動上限 30 |
| **`completedAt`** | `string \| null` | ❌ **選填** | 🆕 | 該軌走完課表並**成功發出**完課通知的時間。**缺席或 `null` ⇒ 未完課** |

**不變式（invariants）**：

1. `completedAt` 非空 ⇒ 該軌於其後每次執行一律靜默跳過（不編譯、不推播、不推進）。
2. `completedAt` 非空 ⇒ `currentSessionIndex > max(schedule.sessions[].sessionIndex)`。人工把
   `currentSessionIndex` 調回範圍內時 MUST 一併清除 `completedAt`（runbook 明示；程式不自動修正，
   避免狀態層依賴課表）。
3. 完課 MUST NOT 產生 `history` 條目、MUST NOT 追加 `completedConceptIds`——它不是一次推播。
4. 未啟用但已存在的 Track，其 `completedAt` 與其他欄位一樣**原樣保留**，MUST NOT 於 `save()` 時刪除。

**載入驗證（延伸 F1 的結構性驗證）**：`completedAt` 若存在，MUST 為 `null` 或 `Date.parse` 可解析的字串；
違反即比照欄位語意損毀 ⇒ 全域失敗（告警 + exit≠0 + 不覆寫原檔）。欄位**缺席不算違反**（向後相容）。

**序列化順序**：`save()` 既有的固定 Track 順序不變；`completedAt` 未設定時 MUST NOT 憑空寫出該鍵
（避免對現有 `state.json` 產生無語意的 diff）。

---

## 2. 執行期實體：Daily Run

一次 `run(env)` 的輸入與輸出。無持久化。

| 面向 | 內容 |
| --- | --- |
| 輸入 | `enabledTracks`（webhook 非空者）、`state.json`、凍結內容（DAG / 題庫 / 課表 / Overlay / Article）、`DRY_RUN` / `FORCE` |
| 輸出 | 0–3 軌的推播、**至多一次** `save()`、exit code（0 / 1） |
| 順序 | `foundation → interviewReady → interviewMastery`，單一執行序 |

---

## 3. 執行期實體：Push Outcome（每 Track 每次執行恰好一種）

```text
                    ┌─ guard 命中（今日已推，且非 dry-run/force） ──→ SKIPPED
                    │
                    ├─ completedAt 已存在 ─────────────────────────→ SKIPPED (completed)
  Track 進入迴圈 ───┤
                    ├─ currentSessionIndex > max(sessionIndex) ───→ COMPLETED ─→ 寫 completedAt
                    │                                                 └ 通知失敗 ─→ FAILED
                    ├─ compile/render/budget/post 成功 ───────────→ SUCCEEDED ─→ advance()
                    │
                    └─ 任一步驟失敗 ──────────────────────────────→ FAILED ─→ 紅色告警
                                                                      └ 部分推播 ─→ 仍 advance()
```

| 結局 | 進度變化 | 訊息 | 計入 exit≠0 |
| --- | --- | --- | --- |
| `SKIPPED` | 無 | 無 | ❌ |
| `SKIPPED (completed)` | 無 | 無 | ❌ |
| `COMPLETED` | 只寫 `completedAt` | 非紅色完課通知 ×1 | ❌ |
| `SUCCEEDED` | `currentSessionIndex++`、`lastPushAt`、`history`、`completedConceptIds` | 課程訊息 1–2 則 | ❌ |
| `FAILED` | 無（**部分推播**例外：照常前進） | 紅色告警（可能連告警都失敗） | ✅ |

**狀態轉移的唯一寫入點**：`SUCCEEDED` / 部分推播 → `advance()`；`COMPLETED` → `markCompleted()`。
兩者皆**就地修改** in-memory state，由迴圈結束後的**單次** `save()` 落盤（DRY_RUN 不落盤）。

---

## 4. 執行期實體：Notice（通知）

由 `src/renderer/alert.ts` 單一實作產生的流程層訊息，**不經過 Compiler / Renderer、不需要 `Lesson`**。

| 種類 | 產生函式 | 顏色 | 歸屬頻道 | 計入 exit≠0 |
| --- | --- | --- | --- | --- |
| Track 失敗告警 | `renderAlert(track, reason)` | 紅 `15158332` | 該 Track | ✅ |
| 全域失敗告警 | `renderAlert(null, reason)` | 紅 `15158332` | 第一個已設定的頻道 | ✅ |
| 課程完成通知 | `renderCompletionNotice(track)` 🆕 | 綠 `3066993` | 該 Track | ❌ |

**共同規則**：發送失敗 MUST 另記錯誤且 MUST NOT 中斷其餘 Track（包在自身 try/catch，不重新拋出）；
DRY_RUN 下一律只留日誌、不發送；**組進 Embed 前 MUST 對 `reason` 做 webhook URL 遮蔽**（FR-019b，
見 [notice-contract.md](./contracts/notice-contract.md) §1.1）。

---

## 5. 驗證來源對照

| 不變式 / 規則 | 來源 |
| --- | --- |
| `completedAt` 選填、缺席＝未完課 | `docs/spec.md` §19、FR-022 |
| 完課不計失敗、不影響其他 Track | `docs/spec.md` §9.2 / §18、FR-022 |
| 通知單一實作 | FR-019 / FR-019a、憲章 XI |
| 單次存檔、部分成功仍保存 | FR-013、憲章 XV |
| 未啟用 Track 原樣保留 | FR-017、`docs/spec.md` §19 |
