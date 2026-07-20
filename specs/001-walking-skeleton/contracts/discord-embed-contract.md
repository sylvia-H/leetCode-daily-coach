# Contract: Discord Embeds 輸出與字元預算

**Feature**: 001-walking-skeleton
**生產者**: `src/renderer/discord.ts` + `src/renderer/budget.ts` | **消費者**: `src/discord/webhook-client.ts`、Discord API

---

## 1. 訊息結構（concept 類 Session）

一則訊息**固定 3 個 embeds**，順序寫死（research R7；對齊 `docs/spec.md` §14.6 mock）：

### Embed 1 — 主 Embed（今日課程）

| 欄位 | 內容 |
|---|---|
| `title` | `📚 Session {sessionIndex} · {concept.title}` |
| `description` | `concept.digest`（markdown 原文） |
| `color` | `concept.moduleColor` |
| `fields[0]` | name `Pattern`、value `concept.patternLabel`、`inline: true` |
| `fields[1]` | name `複雜度`、value `concept.complexityLabel`、`inline: true` |
| `fields[2]` | name `預估時間`、value `{estimatedMinutes} 分鐘`、`inline: true` |
| `fields[3]` | name `TypeScript Tip`、value `concept.tsTip`、`inline: false` |
| `fields[4]` | name `Python Tip`、value `concept.pyTip`、`inline: false` |

### Embed 2 — 題目 Embed

| 欄位 | 內容 |
|---|---|
| `title` | `🎯 Today's Challenge` |
| `description` | 逐題兩行；題數 1～3 |
| `color` | 同主 Embed |

每題格式（MUST NOT 轉載題敘，憲章「不轉載」條款）：
```
• [{id}. {title}]({url})
  {difficulty} · {whyThisPattern}[ · Hint: {hint}]
```
`hint` 缺席時省略該段（含分隔的 ` · `）。

### Embed 3 — 收尾 Embed

| 欄位 | 內容 |
|---|---|
| `color` | 同主 Embed |
| `fields[0]` | name `🧭 學習路徑`、value 見下 |
| `fields[1]` | name `✅ Exit Criteria`、value `- [ ] {每條}` 逐行 |
| `fields[2]` | name `💡 Takeaway`、value `concept.takeaway` |

學習路徑 value（`path.prev` / `path.next` 缺席時**整行省略**，FR-007a）：
```
昨天  {path.prev} ✓
今天  {path.current}
明天  {path.next}
```

---

## 2. 字元預算檢查

```ts
checkBudget(embeds: DiscordEmbed[]): BudgetReport

interface BudgetItem { name: string; length: number; limit: number; over: boolean; }
interface BudgetReport { items: BudgetItem[]; total: number; totalLimit: 5500; hardLimit: 6000; ok: boolean; }
```

### 計算口徑（research R3，MUST）

- **計入**：每個 embed 的 `title` + `description` + 每個 field 的 `name` + `value` + `footer.text` + `author.name`
- **不計入**：`url` / `color` / `image` / `thumbnail` / `timestamp`
- **長度單位**：Unicode **code point**（`Array.from(str).length`），非 UTF-16 code unit——
  版面含 emoji（📚🎯🧭✅💡），`str.length` 會高估

### 逐區塊預算（`docs/spec.md` §14.5、憲章「技術與資源約束」）

| item name | 對應 | 上限 |
|---|---|---|
| `digest` | Embed 1 `description` | 900 |
| `tsTip` | Embed 1 `TypeScript Tip` field value | 450 |
| `pyTip` | Embed 1 `Python Tip` field value | 450 |
| `problem[{id}]` | Embed 2 中該題的兩行 | 350（每題） |
| `problems.count` | 題數 | 3（**筆數**上限，非字元；**defense-in-depth**，見下方責任歸屬） |
| `exitCriteria` | Embed 3 checklist field value | 400 |
| `takeaway` | Embed 3 Takeaway field value | 120 |
| `pathFooter` | Embed 3 學習路徑 field value | 200 |
| **`total`** | 全部 embeds 計入欄位總和 | **5500**（自訂）／ 6000（平台硬限） |

### 題數的責任歸屬（FR-003b，MUST）

「題數 1～3」的**唯一權威守門點是 `compiler/problem.ts`**——查無對應 / 題號不存在 / 題數 0 或 >3
一律在組裝階段拋出可辨識錯誤。`checkBudget` 的 `problems.count` 僅為 defense-in-depth
（防止未來新增的組裝路徑繞過守門），MUST NOT 被當作主要判準，也 MUST NOT 在 `problem.ts`
之外另行定義題數的錯誤訊息與型態。

### 平台結構性上限（MUST 一併檢查，FR-006b）

這些是平台會**直接拒絕請求**的硬限制，MUST 與逐區塊預算在**同一次 `checkBudget` 呼叫**中檢查，
並以**同樣的 `BudgetItem` 形式**進入 `report.items`（使 DRY_RUN 的明細輸出一併涵蓋）：

| item name | 對應 | 上限 |
|---|---|---|
| `embed[{i}].title` | 單一 embed 標題 | 256 |
| `embed[{i}].description` | 單一 embed 描述 | 4,096 |
| `embed[{i}].fields.count` | 單一 embed 欄位數 | 25 |
| `embed[{i}].field[{j}].name` | 欄位名稱 | 256 |
| `embed[{i}].field[{j}].value` | 欄位值 | 1,024 |
| `embeds.count` | 單則訊息 embed 數 | 10 |

任一項 `over === true` → `report.ok === false` → 送出前擋下、該 Track 失敗（同逐區塊預算的處置）。

### 行為契約

| 情境 | 行為 |
|---|---|
| `ok === false` | **送出前**擋下（FR-006），該 Track 視為失敗 → 紅色告警 + exit≠0 |
| DRY_RUN | 印出**完整 `BudgetReport`**（逐區塊名稱 / 實際值 / 上限 / 是否超限），US4 Scenario 2 |
| 超限 | **MUST NOT 自動截斷**——靜默裁切內容違反憲章 XV「Fail Loud」 |

> **共用性要求（憲章 IX）**：`checkBudget` MUST 為獨立純函式，F5 的 `scripts/validate.ts`
> 對全 Track × 全 Session 預演時 MUST 呼叫**同一顆**，MUST NOT 另寫一套 Gate 版檢查。

---

## 3. 告警 Embed（失敗時）

```ts
renderAlert(track: Track | null, reason: string): DiscordEmbed[]
```

`track` 為 `null` 代表**全域性失敗**（非特定 Track），此時由 `main.ts` 發至第一個已設定的 webhook。

| 欄位 | `track` 為 Track | `track` 為 `null`（全域） |
|---|---|---|
| `title` | `⚠️ 推播失敗 · {track}` | `⚠️ 推播失敗 · 全域` |
| `description` | `reason`（人類可讀的失敗原因） | 同左 |
| `color` | `15158332`（紅色，對齊 `docs/spec.md` §21.2） | 同左 |

**要求**：
- 亦為純函式，`renderer/alert.ts`
- **本 Feature 唯一的告警版面實作**（FR-010a）：單一 Track 失敗與全域性失敗 MUST 共用此函式；
  `daily.yml` MUST NOT 自行拼組 embed 告警（其兜底通知為純文字，見 cli-contract §6）
- `reason` MUST NOT 含 webhook URL 或任何機密（憲章 XIV）——`webhook-client.ts` 產生錯誤訊息時
  MUST 只提及 Track 名稱與 HTTP 狀態碼，不回傳原始 URL
- 告警送出失敗時 MUST 記錄錯誤日誌（`alert-failed: {track}: {reason}`）、仍計為失敗，
  且 MUST NOT 中斷其餘 Track 的處理（FR-010c）

---

## 4. Webhook Client 契約

```ts
post(track: Track, embeds: DiscordEmbed[]): Promise<void>
```

- `POST {webhookUrl}`、`Content-Type: application/json`、body `{ "embeds": [...] }`
- 使用 Node 內建 `fetch`（憲章釘死；MUST NOT 引入 axios 等）
- 回應非 2xx → 拋出錯誤，訊息含 HTTP 狀態碼與 Track 名稱，**不含 URL**
- 本 Feature **不實作**自動重試（Discord 429 重試屬 F6 範圍；本 Feature 的雙 cron 已提供補跑機制）
