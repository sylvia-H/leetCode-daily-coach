# Contract: 端到端驗證的替身邊界與斷言介面

**Feature**: 006-pipeline-mvp | **位置**: `tests/e2e/**`、`tests/helpers/fetch-recorder.ts`
**對應**: FR-002 / FR-003 / FR-004、SC-006、spec Clarification 3

---

## 1. 替身邊界（本 Feature 最關鍵的一條契約）

**「替身」的定義（FR-002a）**：指**替換受測行為**的實作（fake / stub / mock）。**不改變行為的觀測工具**
（記錄呼叫次數與參數、仍執行真實實作並回傳真實結果）**不算替身**——例如以 passthrough 包裝
`writeFileSync`、**真實實作照常執行**來斷言「存檔只發生一次」是允許的；一旦改寫回傳值或阻斷真實寫檔，
即成為替身而違反本契約。

| 元件 | 端到端測試中的狀態 | 等級 |
| --- | --- | --- |
| 全域 `fetch` | **唯一允許的替身**（`vi.stubGlobal`） | MUST |
| `WebhookClientOptions.sleep` / `random` | MAY 注入（消除等待與 jitter；非行為替身） | MAY |
| `node:fs` 的 **passthrough 包裝**（計數後呼叫 `importActual` 的真實 `writeFileSync`） | MAY 用於次數斷言（非替身，FR-002a） | MAY |
| `RunOptions.pushTrack` | **MUST NOT 出現在 `tests/e2e/**`** | MUST NOT |
| `compile` / `render` / `checkBudget` / `WebhookClient` / `StateStore` | 真實實作 | MUST |
| 課程素材（DAG / 題庫 / 課表 / Overlay / Article） | repo 內的真實檔案（非 fixture 目錄） | MUST |
| `state.json` | `mkdtempSync` 暫存目錄的真實檔案 | MUST |

> **MUST NOT 用 `vi.spyOn(fs, "writeFileSync")`**：`src/state/state-store.ts` 以**具名匯入**
> （`import { writeFileSync } from "node:fs"`）取用，而 ESM 的 `node:fs` namespace 為唯讀
> （實測：`Cannot assign to read only property 'writeFileSync'`），spy 既無法安裝、也攔不到已綁定的
> 具名匯入。正確做法是 `vi.mock("node:fs", …)` 搭配 `importActual` 的 passthrough 包裝——它仍是
> FR-002a 意義下的**觀測工具**（不改寫回傳值、不阻斷真實寫檔），MUST NOT 藉此改變任何行為。

**守門測試（SC-006 機驗）**：掃描 `tests/e2e/**` 原始碼，斷言不含 `pushTrack` 字樣。此測試 MUST 置於
**`tests/unit/no-push-stub.test.ts`**——它自身必須含有待掃描字樣，若放進 `tests/e2e/` 會落入自己的掃描
範圍而必然失敗。

**為何不用假 HTTP server**：唯一多覆蓋的是 Node 網路堆疊（本專案無自訂邏輯），代價是 CI 開 port 與
flaky 風險，且與憲章 XVI「無本機 infra」的精神相悖。

---

## 2. `fetch-recorder` 介面

```ts
interface RecordedRequest {
  url: string;            // 送往哪個 webhook（用來斷言不交叉錯送）
  embeds: DiscordEmbed[]; // 解析後的 body.embeds
}

interface FetchRecorder {
  requests: RecordedRequest[];
  requestsFor(url: string): RecordedRequest[];
  /** 讓指定 URL 的請求固定失敗（US4）。status 省略 ⇒ 模擬網路層丟出。 */
  failFor(url: string, status?: number): void;
  install(): void;   // vi.stubGlobal("fetch", …)
}
```

| 要求 | 等級 |
| --- | --- |
| 預設回應 MUST 為 `{ ok: true, status: 204 }`（Discord webhook 的實際成功回應） | MUST |
| 回應物件 MUST 具備 `headers.get()`（`WebhookClient` 會讀 `Retry-After`） | MUST |
| MUST 依呼叫順序記錄，供斷言「多則訊息依序送出」 | MUST |
| MUST NOT 解讀或重組 embeds 內容（保持透明記錄） | MUST |

---

## 3. 各 User Story 的最小斷言集

| 測試檔 | MUST 斷言 |
| --- | --- |
| `three-tracks.test.ts` | ① 三軌各自的請求數與**目標 URL 完全對應**（無交叉，FR-003）；② 各軌訊息內容對應**自己的** `currentSessionIndex`（R7：**3 / 5 / 8** 造出 practice / challenge / concept 三種版面，與 spec US1-2 一致；此三個 Session 的 `problemIds` **皆為空集合**，故此情境 **MUST NOT** 斷言題目內容或難度帶）；③ `prefix-sum` 三軌正文逐字相同、題目難度帶不同（FR-004 / SC-007，**`conceptId` 釘死為 `prefix-sum`**、僅 `sessionIndex` 動態查得，不硬編 `9`；MUST NOT 改成「取第一個三軌共有的 Concept」——seed 素材中該候選為 `time-space-complexity`，三軌 `problemIds` 皆為空，難度斷言必然失敗）；④ 執行環境**無任何 LLM 金鑰**仍成功（FR-005） |
| `guard-and-modes.test.ts` | 同日第二次執行 **零請求**且 `state.json` 位元組不變（SC-002）；三軌 `lastPushAt` 分別為今天 / 昨天 / `null` 時只推後兩軌；`FORCE` 繞過 guard 並寫狀態；`DRY_RUN` 不受 guard 阻擋、零請求、不建檔；台北凌晨（UTC 前一日）判為「今天已推」 |
| `state-advance.test.ts` | 成功軌 `currentSessionIndex` **恰好 +1**、失敗軌**變化量 0**；`history` 上限 30；concept 類才追加 `completedConceptIds`；未知啟用 Track 自動補建；未啟用 Track 原樣保留；**`save()` 只發生一次**（以 `vi.mock("node:fs")` 的 passthrough 包裝計數佐證，見 §1） |
| `isolation.test.ts` | 單軌固定失敗 → 其餘兩軌成功率 100% 且進度保存、失敗軌收到**紅色**告警且進度不變、exit code 1（SC-004）；告警本身失敗仍不中斷；部分推播（第 2 則失敗）→ 進度**照常前進** + 告警 + exit 1 |
| `completion.test.ts` | 超出課表 → **恰好一則綠色**通知、`completedAt` 寫入、`currentSessionIndex` 不變、**exit 0**；再次執行 → 零請求；`DRY_RUN` 下不發送不寫入；通知發送失敗 → 不寫 `completedAt` 且 exit 1；課表**中間缺號**仍為失敗（不誤判完課） |

---

## 3.1 `main` 流程的結局路徑清單（SC-006 的判準）

SC-006 後半原為「`main` 流程的分支覆蓋無遺漏路徑」——無覆蓋率工具亦無路徑定義，**不可客觀判定**
（checklist CHK009）。2026-07-29 `/speckit-analyze` 後改為**明列清單逐條對照**：下列 8 條結局路徑
**每條 MUST 至少有 1 個 e2e 案例覆蓋**（未覆蓋數為 0）。導入覆蓋率工具屬工具鏈決策，本 Feature
**MUST NOT** 為此新增相依（plan.md「零新增相依」）。

| # | 結局路徑 | 觸發條件 | 覆蓋檔案 |
| --- | --- | --- | --- |
| 1 | `SKIPPED`（日期 guard 命中） | `lastPushAt` 的台北日期＝今天，且非 dry-run／force | `guard-and-modes.test.ts` |
| 2 | `SKIPPED (completed)` | 該軌已有 `completedAt` | `completion.test.ts` |
| 3 | `SUCCEEDED` | compile／render／budget／post 全數成功 → `advance()` | `three-tracks.test.ts`、`state-advance.test.ts` |
| 4 | `COMPLETED`（首次完課） | `currentSessionIndex > max(sessionIndex)` 且通知送出成功 → `markCompleted()` | `completion.test.ts` |
| 5 | `FAILED`（推播失敗） | post 於第 1 則即失敗 → 紅色告警、進度不動 | `isolation.test.ts` |
| 6 | `FAILED`（部分推播） | 第 2 則以後失敗 → 紅色告警、進度**仍前進** | `isolation.test.ts` |
| 7 | 全域性失敗 | 素材／state 載入失敗或存檔失敗 → 單一全域告警、不覆寫原檔、exit 1 | `isolation.test.ts` |
| 8 | `DRY_RUN` 預覽 | 不受 guard 阻擋、零請求、不寫狀態 | `guard-and-modes.test.ts`、`completion.test.ts` |

> **維護契約**：日後 `src/main.ts` 新增任何結局路徑（新的 `continue` / 早退 / 例外分類）時，
> **MUST 同步在本表新增一列並補上對應的 e2e 案例**——清單是人工維護的，這一條是它唯一的防線。

---

## 4. 既有 `tests/unit/run-tracks.test.ts` 的定位

| 規則 | 等級 |
| --- | --- |
| MAY 保留作為分支覆蓋（`pushTrack` 替身可製造難以由 `fetch` 觸發的例外形狀） | MAY |
| MUST NOT 作為 AC2 / AC5 / AC10 的唯一證據 | MUST NOT |
| **保留的每個替身案例 MUST 於註解註明其「`fetch` 攔截無法觸發」的分支理由**；無理由者 MUST 刪除 | MUST（FR-001 的可稽核條件之一） |
| 與 e2e 重疊且無額外分支價值的案例 SHOULD 刪除，避免雙份維護 | SHOULD |
