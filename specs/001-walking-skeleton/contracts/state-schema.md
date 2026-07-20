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
| 缺少某個已啟用 Track | 以初始值自動補建（FR-015）：`currentSessionIndex: 1`、`lastPushAt: null` |
| 含未啟用 Track 的資料 | **原樣保留**，MUST NOT 刪除（該 Track 可能只是暫時停用） |

> `lastPushAt: null` ⇒ 日期 guard 放行 ⇒ 下一次執行即推播 Session 1。

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
- `DRY_RUN` 流程 → `save` 完全未被呼叫
