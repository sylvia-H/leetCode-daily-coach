# Contract: 流程層通知（告警 + 完課通知）

**Feature**: 006-pipeline-mvp | **實作位置**: `src/renderer/alert.ts`（**單一檔案、單一實作**）
**對應**: FR-019 / FR-019a、`docs/spec.md` §9.2「通知的責任歸屬」、憲章 XI / XV

「通知」是**流程層訊息**，與課程訊息（`Lesson` → `render()`）分屬兩條路徑。通知 MUST NOT 經過
Lesson Compiler / Renderer，MUST NOT 為此構造不存在於課表的 `Lesson`。

---

## 1. 介面

```ts
// 既有（F1）
export function renderAlert(track: Track | null, reason: string): DiscordEmbed[];

// 新增（F6）
export function renderCompletionNotice(track: Track): DiscordEmbed[];
```

| 函式 | 顏色 | 標題 | 內文 |
| --- | --- | --- | --- |
| `renderAlert(track, reason)` | `15158332`（紅） | `⚠️ 推播失敗 · {track}` | `redact(reason)` |
| `renderAlert(null, reason)` | `15158332`（紅） | `⚠️ 推播失敗 · 全域` | `redact(reason)` |
| `renderCompletionNotice(track)` | `3066993`（綠） | `🎉 課程完成 · {track}` | 固定文案（見 §2） |

### 1.1 祕密遮蔽（FR-019b，`docs/spec.md` §9.2）

| 要求 | 等級 |
| --- | --- |
| 通知實作 MUST 在組進 Embed **之前**對 `reason` 做 Discord webhook URL 樣式遮蔽（替換為 `[redacted]`） | MUST |
| 遮蔽 MUST 為**通知實作的內建行為**，MUST NOT 依賴呼叫端自律不帶入 URL | MUST |
| 遮蔽 MUST NOT 依賴特定錯誤來源的訊息格式（底層 `fetch` / undici 例外不受本專案控制） | MUST |
| 遮蔽後任何通知 Embed 文字中 webhook URL 的出現次數 MUST 為 **0** | MUST |
| 遮蔽 MUST 為純函式且可單測（同一輸入 → 同一輸出） | MUST |

> **為何不改成「呼叫端不要帶入 URL」**：`reason` 絕大多數直接來自底層例外訊息，而底層例外是第三方
> 程式碼產生的。把責任放在呼叫端等於把「祕密不外洩」這條憲章 XIV 的硬約束交給自律維護，
> 每新增一個錯誤來源就多一個外洩機會。遮蔽放在**唯一的出口**（通知實作）才是可稽核的位置。

---

## 2. `renderCompletionNotice` 的內容契約

| 要求 | 等級 |
| --- | --- |
| 純函式：同一 `track` → **deep-equal** 的 embeds（無時間戳、無隨機、無 LLM） | MUST |
| 只 import 型別（`DiscordEmbed` / `Track`）；MUST NOT 讀檔、讀 state、讀課表 | MUST |
| 內文 MUST 告知「本 Track 的課程已全部推播完畢，其後不再推播」 | MUST |
| 內文 SHOULD 指出「想重新開始請依 runbook 編輯 `state.json`」 | SHOULD |
| MUST NOT 含 webhook URL、金鑰、檔案系統路徑 | MUST |
| 回傳恰好 1 個 embed，總長度 MUST 遠低於 Discord 6,000 硬限 | MUST |

**為何不含完課時間**：時間屬狀態（寫入 `completedAt`），放進訊息會破壞「同輸入 → 同輸出」的純函式性
（憲章 XII），也讓測試得凍結系統時間才能斷言。

---

## 3. 發送契約（呼叫端 `src/main.ts`）

| 通知 | 目標頻道 | 發送失敗時 | 計入 exit≠0 |
| --- | --- | --- | --- |
| Track 失敗告警 | 該 Track | 記 `alert-failed: {track}: …`，**不中斷其餘 Track** | ✅（該軌本就失敗） |
| 全域失敗告警 | **第一個已設定**的頻道 | 記 `alert-failed: 全域: …` | ✅ |
| 完課通知 | 該 Track | 該軌轉為 **FAILED**（紅色告警 + exit 1），**MUST NOT 寫 `completedAt`** | ✅ |

| 共同規則 | 等級 |
| --- | --- |
| 發送 MUST 包在自身 try/catch，MUST NOT 重新拋出（避免中斷迴圈） | MUST |
| `DRY_RUN=true` 下 MUST NOT 發送任何通知（告警亦然），只留日誌 | MUST |
| 通知 MUST 走與課程訊息**相同**的 `WebhookClient`（含重試 / 退避） | MUST |
| workflow 層的最後防線通知 MUST 為極簡純文字、MUST NOT 使用 embeds、MUST NOT 重述細節 | MUST |

---

## 4. 反向約束（防止實作漂移）

| MUST NOT | 理由 |
| --- | --- |
| 在 `daily.yml` 內另行拼組 Embed 通知 | 同一責任兩套實作，版面必然漂移（`docs/spec.md` §9.2） |
| 為完課新增第二個通知模組 | FR-019a 要求「單一實作」；分檔會讓「只有一處」不可驗 |
| 讓 `render()` / `compile()` 認識完課 | 汙染 F5 契約（本 Feature Out of Scope） |
