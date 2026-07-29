# Contract: `state.json` 結構增量（F6 修訂）

**Feature**: 006-pipeline-mvp
**基準**: [`specs/001-walking-skeleton/contracts/state-schema.md`](../../001-walking-skeleton/contracts/state-schema.md)
**唯一存取者**: `src/state/state-store.ts`（憲章：MUST NOT 另建平行狀態）

本檔**只描述 F6 的增量**；未提及的部分一律沿用 F1 契約，且**未被本檔修訂**。

---

## 1. 增量欄位：`completedAt`

```jsonc
{
  "tracks": {
    "foundation": {
      "currentSessionIndex": 14,
      "lastPushAt": "2026-08-05T22:07:31Z",   // 最後一次真正推課的時間；完課 MUST NOT 更新
      "completedConceptIds": ["prefix-sum"],
      "history": [],
      "completedAt": "2026-08-06T22:07:12Z"   // 🆕 選填。存在 ⇒ 該軌已完課、其後靜默跳過
    },
    "interviewReady":   { "currentSessionIndex": 9, "lastPushAt": null, "completedConceptIds": [], "history": [] }
    // ↑ 未完課的 Track MUST NOT 出現 completedAt 鍵（避免無語意 diff）
  }
}
```

| 規則 | 等級 |
| --- | --- |
| 欄位**缺席**或值為 `null` ⇒ 該軌**未完課** | MUST |
| 值存在且非 `null` ⇒ 該軌**已完課**，其後每次執行一律靜默跳過 | MUST |
| 值 MUST 為 `null` 或 `Date.parse` 可解析的字串；違反 ⇒ 比照欄位語意損毀（全域失敗、不覆寫原檔） | MUST |
| 未設定時 `save()` MUST NOT 寫出此鍵 | MUST |
| 未啟用 Track 的 `completedAt` MUST 原樣保留 | MUST |

**向後相容**：現行 `state` 分支的 `state.json` 不含此欄位，**不需遷移**即可載入。

---

## 2. 寫入契約

```ts
markCompleted(state: AppState, track: Track, completedAt: Date): void
```

| 要求 | 等級 |
| --- | --- |
| 只在「該軌 `currentSessionIndex` 超出課表最大 `sessionIndex`」且「完課通知**送出成功**」後呼叫 | MUST |
| 只設定 `completedAt`；MUST NOT 動 `currentSessionIndex` / `lastPushAt` / `history` / `completedConceptIds` | MUST |
| 就地修改 in-memory state；落盤由迴圈結束後的**單次** `save()` 負責 | MUST |
| `DRY_RUN=true` 時 MUST NOT 呼叫 | MUST |
| 完課通知發送失敗時 MUST NOT 呼叫（改走該軌失敗路徑，下次執行重試） | MUST |

`advance()` 的契約不變，且 **MUST NOT** 在完課路徑被呼叫。

---

## 3. 人工編輯契約（runbook 對應）

| 維運意圖 | 操作 |
| --- | --- |
| 讓已完課的 Track 重新推播 | 把 `currentSessionIndex` 改回課表範圍內，**並刪除該軌的 `completedAt`** |
| 只想暫停（保留進度） | 移除該軌 webhook Secret（不動 `state.json`） |
| 指定起點 / 跳課 | 只改 `currentSessionIndex` |

> 只改 `currentSessionIndex` 而未刪 `completedAt` ⇒ 該軌仍會被靜默跳過。程式 MUST NOT 自動清除
> `completedAt`（狀態層不認識課表，見 [research.md](../research.md) R1），故此規則 MUST 在
> `docs/runbook.md` 明示。

---

## 4. 未知 Track 鍵（F6 定案 2026-07-29）

| 規則 | 等級 |
| --- | --- |
| `tracks` 中出現**不屬於三個已知 Track 的鍵**（例：人工編輯時打成 `interviewready`）MUST 判為**欄位語意損毀 ⇒ 全域性失敗**（紅色告警 + exit 1 + 不覆寫原檔） | MUST |
| MUST NOT 靜默忽略該鍵 | MUST NOT |
| MUST NOT 於 `save()` 時移除該鍵 | MUST NOT |

> **理由**（spec Clarifications 2026-07-29、`docs/spec.md` §19）：人工編輯 `state.json` 是調整進度的
> **官方方式**，打錯 Track 名稱代表維運者的意圖**完全沒有生效**——靜默忽略會讓這個手誤數日無人察覺，
> 與「對**值**的手誤即判損毀」的既有裁決也不一致。且因中止點在逐 Track 迴圈之前、`save()` 不被呼叫，
> 打錯的內容原封留在 `state` 分支上供修正，是唯一同時做到「fail loud」與「不動原檔」的處置。
