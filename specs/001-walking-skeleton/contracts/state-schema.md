# Contract: `state.json` 結構與推進規則

**Feature**: 001-walking-skeleton
**位置**: 專用 `state` 分支的 `state.json`，經 `STATE_FILE` 環境變數指向
**唯一存取者**: `src/state/state-store.ts`（憲章：MUST NOT 另建平行狀態）

---

## 1. JSON 結構

```jsonc
{
  "tracks": {
    "foundation": {
      "currentSessionIndex": 1,          // 下一個要推的 Session（1-based）
      "lastPushAt": null,                // ISO 8601 UTC；null = 從未推播
      "completedConceptIds": [],         // 去重
      "history": []                      // 滾動保留最近 30 筆
    },
    "interviewReady":   { "currentSessionIndex": 1, "lastPushAt": null, "completedConceptIds": [], "history": [] },
    "interviewMastery": { "currentSessionIndex": 1, "lastPushAt": null, "completedConceptIds": [], "history": [] }
  }
}
```

`history` 元素：
```jsonc
{ "sessionIndex": 1, "conceptId": "left-right-pointer", "pushedAt": "2026-07-20T22:07:31Z" }
```

此結構即 FR-024 要交付的初始樣板（`docs/state.template.json`）。

---

## 2. 讀取契約

```ts
load(stateFile: string): AppState
```

| 情境 | 行為 |
|---|---|
| 檔案存在且 JSON 合法 | 正常載入 |
| 檔案**不存在** | 回傳空的 `{ tracks: {} }`，不報錯（後續由自動補建處理） |
| JSON **解析失敗** | **全域失敗**：拋錯 → exit≠0，且 **MUST NOT 覆寫原檔**（避免毀掉唯一權威狀態） |
| JSON 合法但**欄位語意損毀** | **同上，比照解析失敗處理**（見下方「欄位語意驗證」） |
| 缺少某個已啟用 Track | 以初始值自動補建（FR-015）：`currentSessionIndex: 1`、`lastPushAt: null` |
| 含未啟用 Track 的資料 | **原樣保留**，MUST NOT 刪除（該 Track 可能只是暫時停用） |

> `lastPushAt: null` ⇒ 日期 guard 放行 ⇒ 下一次執行即推播 Session 1。

### 欄位語意驗證（MUST，`docs/spec.md` §19）

「調整進度的官方方式」就是人工編輯這份檔案（FR-018），手誤屬**可預期的常態輸入**。故 `load` MUST
在回傳前驗證每一個出現在檔案中的**已知 Track**（含未啟用者——它仍會被 `save` 重新序列化）：

| 欄位 | 規則 | 少了驗證會發生什麼 |
|---|---|---|
| `currentSessionIndex` | MUST 為 **≥ 1 的整數** | 字串值在 `advance` 會被 `+= 1` **字串串接**（`"3"` → `"31"`）並靜默寫回，毀掉唯一權威狀態 |
| `lastPushAt` | MUST 為 `null` **或可解析的日期字串** | 不可解析值會讓日期 guard 的 `Intl` 換算丟 `RangeError`，且該處在 try 之外 → **整輪中止、失敗隔離失效** |
| `completedConceptIds` | MUST 為陣列 | `.includes` / `.push` 於推進時丟 TypeError |
| `history` | MUST 為陣列 | 同上 |

- 任一項不合法 → **全域失敗**，錯誤訊息 MUST **指名該 Track 與該欄位**。因中止點在逐 Track 迴圈之前，
  `save` 不會被呼叫，原檔自然得以保全。
- 此為**結構性驗證**，非 zod 的型別 / 值域 schema 驗證（後者屬 F2）。
- 日期 MUST 以執行環境的解析能力為準（`Date.parse` 不為 `NaN` 即放行），**MUST NOT** 僅因非嚴格
  ISO 8601 就判定損毀——例如 `"2026-07-20 06:07"` 於 V8 可解析，MUST 視為合法。

---

## 3. 推進契約

```ts
advance(track: Track, lesson: Lesson, pushedAt: Date): void   // 只在推播成功後呼叫
```

| 欄位 | 變更 |
|---|---|
| `currentSessionIndex` | `+1` |
| `lastPushAt` | 設為 `pushedAt` 的 ISO 8601 UTC 字串 |
| `completedConceptIds` | 加入 `lesson.concept.id`；**已存在則不重複加入**（去重，MUST） |
| `history` | append `{ sessionIndex, conceptId, pushedAt }`；長度超過 **30** 時捨棄最舊 |

**MUST NOT 呼叫 `advance` 的情況**：推播失敗、同日去重跳過、`DRY_RUN`。

---

## 4. 存檔契約

```ts
save(stateFile: string, state: AppState): void
```

| 要求 | 說明 |
|---|---|
| **單次存檔** | 全部 Track 處理完畢後只呼叫**一次**（FR-016）；MUST NOT 每 Track 存一次 |
| **DRY_RUN 不存檔** | `DRY_RUN=true` 時 MUST 完全不呼叫 `save`（SC-007：狀態分支新增提交數 0） |
| **部分成功仍存檔** | 已成功 Track 的變更 MUST 保存，不因其他 Track 失敗而回滾（憲章 XV） |
| **格式穩定** | 以 2 空格縮排 + 結尾換行序列化，使 `state` 分支的 diff 可讀且穩定 |
| **Track 鍵順序固定** | 依 `foundation` → `interviewReady` → `interviewMastery` 序列化，避免無意義 diff |

**提交責任**：`save` 只寫檔案。`git add / commit / pull --rebase --autostash / push` 與重試迴圈
由 `daily.yml` 的 workflow step 執行（research R5、FR-017）。

**重試契約（FR-017，MUST）**：

| 項目 | 值 |
|---|---|
| 重試上限 | **3 次**（首次 push 失敗後最多再嘗試 3 輪 `pull --rebase --autostash` + `push`） |
| 每輪動作 | `git pull --rebase --autostash origin state` → `git push origin state` |
| 耗盡後 | 該 step 以非零狀態結束 → 觸發 `if: failure()` 的純文字兜底通知（cli-contract §6） |
| MUST NOT | 無限重試；或以 `--force` push 覆蓋他人變更（會毀掉唯一權威狀態） |

---

## 5. 分支紀律（憲章 XIII / 分支紀律）

| 規則 | 說明 |
|---|---|
| `state.json` MUST 只 commit 至 **`state` 分支** | MUST NOT 進 `main` / `develop`（SC-009 直接驗收） |
| `state` 分支為 **orphan branch** | 一次性初始化，步驟見 `docs/setup-guide.md`（FR-024） |
| 主分支上只有**樣板** | `docs/state.template.json`，非執行時讀取的檔案 |
| 調整進度的官方方式 | **人工編輯 `state` 分支的 `state.json`** 並 commit；MUST NOT 另設「起始課數」設定項（FR-018） |
| `.gitignore` | MUST 排除本機 dry run 產生的 `.state/`，避免誤入主分支 |

---

## 6. 單元測試必覆蓋項（憲章「測試優先」）

- 推播成功 → `currentSessionIndex` 恰好 +1
- 推播失敗 → 三個欄位皆不變（漏跑不跳課，FR-013）
- 同一 `conceptId` 連推三次 → `completedConceptIds` 長度恆為 1（去重）
- `history` 累積 35 筆 → 長度為 30 且保留最新者
- state 中缺少某已啟用 Track → 自動補建為初始值
- state 中含未啟用 Track → 原樣保留
- JSON 損毀 → 拋錯且原檔未被改動
- **欄位語意損毀（JSON 合法）→ 拋出指名該 Track 與該欄位的錯誤，且原檔未被改動**
  （`currentSessionIndex` 為字串 / 0 / 非整數、`lastPushAt` 不可解析、`completedConceptIds` 或
  `history` 非陣列；另含**反向案例**：V8 可解析的寬鬆日期格式 MUST 放行）
- **存檔失敗（路徑不可寫）→ 發出全域紅色告警且以 exit 1 結束，例外 MUST NOT 逸出**
- `DRY_RUN` 流程 → `save` 完全未被呼叫
