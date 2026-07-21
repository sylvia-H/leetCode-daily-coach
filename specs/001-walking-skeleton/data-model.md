# Phase 1 Data Model: Walking Skeleton（001-walking-skeleton）

**Date**: 2026-07-20 | **Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

本文件定義本 Feature 的實體、欄位與驗證規則。型別命名與 `docs/spec.md` §16 一致——本 Feature 實作的是
§16 的**子集**，欄位名稱刻意不變，讓 F2–F5 只需**補欄位**而非改名。

---

## 實體總覽與資料流

```
articles/**.md ──(content.ts)──┐
data/problem-bank.json ─(problem.ts)─┤
src/compiler/schedule.ts ─(schedule.ts)─┴──(lesson.ts)──► Lesson ──(renderer)──► DiscordEmbed[]
                                                            ▲
state.json ──(state-store.ts)──► TrackState.currentSessionIndex
```

`Lesson` 是 Compiler 與 Renderer 之間的**唯一介面**（憲章 XI）：Renderer 只 import `src/types/lesson.ts`，
不觸及左側任何來源。

---

## 1. Track

```ts
type Track = "foundation" | "interviewReady" | "interviewMastery";
```

- 固定處理順序：`foundation` → `interviewReady` → `interviewMastery`（FR-009）
- **啟用判定**：對應的 `DISCORD_WEBHOOK_URL_*` 環境變數非空白字串（FR-008）
- 本 Feature 驗收只啟用 `foundation`，但迴圈以多 Track 形態實作（spec Assumptions）

---

## 2. SessionPlan（課表項目）

```ts
type SessionType = "concept" | "practice" | "review" | "challenge" | "rest";

interface SessionPlan {
  sessionIndex: number;   // 1-based
  type: SessionType;      // 本 Feature 恆為 "concept"
  conceptId?: string;     // type === "concept" 時必填
}
```

**本 Feature 的實例**（硬編於 `src/compiler/schedule.ts`，FR-002）：

| sessionIndex | type | conceptId |
|---|---|---|
| 1 | concept | `left-right-pointer` |
| 2 | concept | `left-right-pointer` |
| 3 | concept | `left-right-pointer` |

**驗證規則**：
- `sessionIndex` MUST ≥ 1
- 查無對應 `sessionIndex`（>3）→ 拋出可辨識的「課表用盡」錯誤，由呼叫方轉為該 Track 失敗（research R8）
- 三筆共用同一 `conceptId` 是刻意設計（spec Assumptions），MUST NOT 被視為資料錯誤

---

## 3. PathLabels（學習路徑對照，F1 臨時）

```ts
interface PathLabels {
  prev?: string;   // 缺席代表不顯示「昨天」
  current: string;
  next?: string;
}
```

**本 Feature 的實例**（硬編於 `src/compiler/schedule.ts`，FR-007a）：

| sessionIndex | prev | current | next |
|---|---|---|---|
| 1 | *(無)* | Left-Right Pointer | Fast-Slow Pointer |
| 2 | Left-Right Pointer | Fast-Slow Pointer | Sliding Window |
| 3 | Fast-Slow Pointer | Sliding Window | Prefix Sum |

**驗證規則**：
- 第 1 課 MUST 無 `prev`；第 3 課 MUST 有 `next`（FR-007a）
- 三筆的 `current` MUST 互不相同（FR-007a 明訂不得三課同字串）——以單元測試斷言

> ⚠️ 此表與 `SessionPlan.conceptId` **刻意脫鉤**：三個 Session 的教材相同（同一 `conceptId`），
> 但學習路徑標籤不同，用途純為版面觀感驗證。F2 接上 DAG 後兩者會合一，此表隨之刪除。

---

## 4. Problem（題目）

```ts
interface Problem {
  id: number;              // LeetCode 題號
  title: string;           // 官方英文標題
  url: string;             // https://leetcode.com/problems/{slug}/
  difficulty: "Easy" | "Medium" | "Hard";
  whyThisPattern: string;  // 為什麼適合此 Pattern（自撰，非轉載）
  hint?: string;           // 預生成、凍結
}
```

**來源**：`data/problem-bank.json`（FR-003a）。本 Feature 含 3 題，皆對應 `left-right-pointer`。

**檔案結構**：
```jsonc
{
  "problems": [
    { "id": 167, "title": "...", "url": "...", "difficulty": "Medium",
      "whyThisPattern": "...", "hint": "..." }
  ],
  "conceptProblems": { "left-right-pointer": [167, 125, 11] }
}
```

**驗證規則**：
- 本 Feature MUST NOT 對此檔做 schema 驗證（FR-003a；屬 F3）
- 查無 `conceptId` 對應、或對應的題號在 `problems` 中不存在 → 該 Track 失敗（fail loud，不靜默略過）
- 每個 Concept 對應 **1～3 題**（FR-007）；超過 3 題 → 該 Track 失敗
- `id` / `title` / `url` / `difficulty` MUST 原樣輸出，MUST NOT 由程式改寫（憲章「不轉載」條款）

---

## 5. ArticleContent（教材解析結果）

`compiler/content.ts` 解析 `articles/**.md` 後的中間產物——**不進 `Lesson`**，由 `lesson.ts` 取用。

```ts
interface ArticleContent {
  meta: ArticleMeta;       // 來自 frontmatter
  digest: string;          // 推播用區塊（markdown 原文）
  tsTip: string;
  pyTip: string;
  takeaway: string;
  exitCriteria: string[];  // 由 frontmatter 取得（§10.1）
}

interface ArticleMeta {
  id: string;              // conceptId，MUST 與 SessionPlan.conceptId 一致
  title: string;
  module: string;          // 決定 embed 顏色
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  exitCriteria: string[];
}
```

**解析範圍（FR-004a）**：只解析**推播用區塊** `Digest` / `TypeScript Tip` / `Python Tip` / `Takeaway`。
閱讀用區塊（`Concept` / `Thinking` / `Pattern Recognition` / `Common Mistakes` / `Complexity` /
`TypeScript Corner` / `Python Corner` / `Today's Challenge` / `Tomorrow Preview`）MUST 存在於檔案中
但**不被解析**（留待 F5）。

**驗證規則（FR-004b）**：
- 缺少任一**推播用**區塊 → 拋出指名該區塊的錯誤，該 Track 失敗；MUST NOT 以空字串帶過
- 缺少任一 frontmatter 欄位 → 同上
- **MUST NOT** 對 frontmatter 做型別 / 值域 schema 驗證（屬 F2）——只檢查「存在且非空」
- `meta.id` 與請求的 `conceptId` 不符 → 該 Track 失敗

詳細的區塊契約見 [contracts/article-format.md](./contracts/article-format.md)。

---

## 6. Lesson（Compiler → Renderer 的唯一介面）

```ts
interface Lesson {
  sessionIndex: number;
  type: SessionType;                // 本 Feature 恆為 "concept"
  track: Track;
  concept: {
    id: string;
    title: string;
    moduleColor: number;            // Discord embed 色碼（十進位整數）
    digest: string;
    tsTip: string;
    pyTip: string;
    takeaway: string;
    exitCriteria: string[];
    patternLabel: string;
    complexityLabel: string;
    estimatedMinutes: number;
    articlePath: string;            // 全文位置（本 Feature 不輸出至版面，供 F9）
  };
  problems: Problem[];              // 1～3 筆
  path: PathLabels;
}
```

**與 `docs/spec.md` §16.4 的差異**（皆為本 Feature 未進入的範圍，欄位名不變）：
- `concept` 在 §16.4 為選填（其他 Session 類型不需要）；本 Feature 恆為 concept 類，故必填
- 未實作 `encouragement`（rest 用，F8）、`reflectionQuestion`（review 用，F8）

**不變式（MUST，以單元測試把關）**：
- `Lesson` 所有欄位皆為既有凍結內容，MUST NOT 有任何欄位需 runtime 生成（FR-004、憲章 VIII）
- 同一 `(track, sessionIndex)` → 逐欄位相同的 `Lesson`（determinism）
- Renderer 對同一 `Lesson` → 逐字元相同的 embeds（SC-010）

---

## 7. TrackState / AppState（進度狀態）

```ts
interface HistoryEntry {
  sessionIndex: number;
  conceptId: string;
  pushedAt: string;        // ISO 8601 UTC
}

interface TrackState {
  currentSessionIndex: number;   // 下一個要推的 Session（1-based）
  lastPushAt: string | null;     // ISO 8601 UTC；null = 從未推播
  completedConceptIds: string[]; // MUST 去重
  history: HistoryEntry[];       // 滾動保留最近 30 筆
}

interface AppState {
  tracks: Record<Track, TrackState>;   // 部分存在即可，缺者自動補建
}
```

**初始值**（FR-015 自動補建、FR-024 樣板）：
```jsonc
{ "currentSessionIndex": 1, "lastPushAt": null, "completedConceptIds": [], "history": [] }
```

### 狀態轉移

僅有**一種**會改變 `TrackState` 的事件：**該 Track 推播成功**。

| 觸發 | `currentSessionIndex` | `lastPushAt` | `completedConceptIds` | `history` |
|---|---|---|---|---|
| 推播成功 | `+1` | 設為本次推播時刻 | 加入本課 `conceptId`（**已存在則不重複加入**） | append 一筆，超過 30 筆時**捨棄最舊** |
| 推播失敗 | 不變 | 不變 | 不變 | 不變 |
| 同日去重跳過 | 不變 | 不變 | 不變 | 不變 |
| DRY_RUN | 不變（且完全不存檔） | 不變 | 不變 | 不變 |

**驗證規則**：
- `currentSessionIndex` MUST 只在該 Track 推播成功後 +1（FR-013）——漏跑不跳課
- `completedConceptIds` MUST 去重（spec Edge Cases；本 Feature 三課共用同一 concept，此規則必然被觸發）
- `history` 上限 30 筆，滾動保留（FR-014）
- 全部 Track 處理完後**只存檔一次**（FR-016）
- state.json 解析失敗 → 全域失敗且**不覆寫**原檔（spec Edge Cases、research R8）
- 已成功 Track 的變更 MUST 保存，不因其他 Track 失敗而回滾（憲章 XV）

完整 JSON 契約見 [contracts/state-schema.md](./contracts/state-schema.md)。

---

## 8. Config（執行設定）

```ts
interface Config {
  webhooks: Partial<Record<Track, string>>;  // 只含已啟用者
  stateFile: string;
  dryRun: boolean;
  force: boolean;
}
```

**驗證規則**：
- `webhooks` 為空 → 全域失敗，訊息明確指出「未設定任何 Track 的 webhook」（FR-023、spec Edge Cases）
- `stateFile` 未設定 → 全域失敗（`DRY_RUN` 時亦然，維持設定檢查的一致性）
- `dryRun` / `force` 以嚴格字串比對解析（research R6）
- Config 的任何欄位 MUST NOT 被寫入日誌全文——webhook URL 含機密，日誌只印 Track 名稱（憲章 XIV）

完整環境變數契約見 [contracts/cli-contract.md](./contracts/cli-contract.md)。

---

## 實體關係圖

```
Config ──決定──► 啟用的 Track[]
                    │
                    ├──► TrackState（每 Track 一份，AppState.tracks）
                    │        └─ currentSessionIndex ──┐
                    │                                 ▼
                    └──► Lesson ◄── SessionPlan ── conceptId ──► ArticleContent
                              ▲                          │
                              │                          └──► Problem[]（conceptProblems 對應）
                              └── PathLabels（依 sessionIndex）
```
