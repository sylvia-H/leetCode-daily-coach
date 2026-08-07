# Quickstart: 011-weekly-quiz 驗收指引

**Branch**: `011-weekly-quiz` | **Date**: 2026-08-06

本檔是**可執行的驗收腳本**，不是實作說明。實作細節見
[data-model.md](./data-model.md) 與 [contracts/](./contracts/)。
指令一律為 **PowerShell**（Windows），套件管理為 npm。

---

## 0. 前置

```powershell
node -v          # 需 24.x
npm ci
```

- **本機 MUST NOT 打真實 Discord webhook**：驗證版面一律 `DRY_RUN=true`。
- **題庫生成需要 `GEMINI_API_KEY`**；除該步驟外，以下全部指令 MUST 在**沒有任何 API key**
  的環境下成功（憲章 VIII）。

---

## 1. 題庫生成（build-time，需要金鑰）

```powershell
$env:GEMINI_API_KEY = "<your key>"
npm run generate:quiz-bank
```

**預期**

- 產出 `data/quiz-bank.json`（165 個 Concept，每個 3–10 題）。
- 每個 Concept 印出通過的嘗試次數；連續 3 次不過（含「交叉驗證後存活題數 < 3」）⇒ 印出
  `needsHumanReview`、**該 Concept 不寫入**、其餘 Concept 照常處理，批次以非零 exit code 結束（FR-010a）。
- 批次末自動跑 `runContentGate`（含 `checkQuizBank` 的全庫結構檢查），零違規才 exit 0。

### 1.1 冪等與續跑

```powershell
npm run generate:quiz-bank            # 第二次執行
```

**預期**：全部 Concept 印出「跳過」，**零 LLM 呼叫**，`data/quiz-bank.json` 內容不變（`git status` 乾淨）。

```powershell
npm run generate:quiz-bank -- --force --only two-pointer-technique
```

**預期**：只重生該 Concept。

### 1.2 SC-010（題數分布）

`npm run generate:quiz-bank` 於批次末**已自行計算並印出**此統計（T032）；未達標會印出具名警示，
但 **MUST NOT** 因此以非零 exit 中止（SC-010 是 prompt 設計品質的觀察訊號，與 `checkQuizBank`
的結構性 Gate 屬不同層級）。以下指令為獨立複核用：

```powershell
node -e "const b=require('./data/quiz-bank.json');const counts=Object.values(b.byConcept).map(a=>a.length);const at3=counts.filter(c=>c===3).length;console.log('題數恰為3的比例:', (at3/counts.length*100).toFixed(1)+'%');console.log('全庫平均:', (counts.reduce((a,c)=>a+c,0)/counts.length).toFixed(2));"
```

**預期**：恰為 3 的比例 < 40%，全庫平均 ≥ 5。未達標視為 prompt 設計失敗（FR-016）。

**未達標時的重跑 MUST 帶 `--force`**：manifest 只綁 Skeleton 雜湊（FR-015），改 prompt **不會**
使任何 Concept 失效，直接重跑會全部跳過、零 LLM 呼叫、題庫不變。建議先
`npm run generate:quiz-bank -- --force --only <少數 conceptId>` 驗證改動方向，再全庫 `--force`。

### 1.3 不觸碰其他生成物

```powershell
git status --porcelain -- concepts/ articles/ schedules/ curriculum/
```

**預期**：無輸出（FR-027 精神：題庫生成腳本不寫入其他既有生成物目錄）。

---

## 2. 零金鑰驗證（SC-006 延伸）

```powershell
Remove-Item Env:\GEMINI_API_KEY -ErrorAction SilentlyContinue
npm run build
npm run typecheck
npm test
npm run validate:content
```

**預期**：全部成功；`validate:content` 的輸出包含 `checkQuizBank` 的檢查結果（零違規）。

---

## 3. 版面驗收（US1）

```powershell
$env:DRY_RUN = "true"
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://discord.com/api/webhooks/0/dry-run"
node dist/main.js
```

**預期輸出**（挑一個 review Session 檢視；可先以 `FORCE=true` 搭配已知的 review `sessionIndex`）：
embed 依序含五段——`📚 本週涵蓋` / `🤔 Reflection` / `🎯 Challenge` / `✍️ 本週小測` / `💬 一句話`
（**小測在 Challenge 之後、鼓勵語之前**，research R5），且該週涵蓋幾個 Concept 就有幾個小測 field，
每個 field 明碼題幹與四選項、正解與結論句以 `||…||` 包住。過程中**無任何網路推播、不寫 state**。

### 3.1 逐段檢查（對照 Acceptance Scenarios）

| 檢查 | 預期 | 對應 |
| --- | --- | --- |
| 三軌各取一個 review Session 編譯 | `quizItems.length === reviewConcepts.length`（除非某 Concept 題庫缺席） | US1-1 |
| 同一 `(track, sessionIndex)` 重複編譯 render 100 次 | embeds byte-identical | US1-3 |
| 同一 Concept 三軌比對 | `quizItems` 中對應該 Concept 的 `stem` 三軌互異（題庫題數 ≥3 時） | US1-3 |
| 某 Concept 題庫無題 | 該 Concept 略過，其餘正常出題 | US1-4 |
| 題庫檔暫時改名後重跑 | 小測段整段省略，推播正常進行 | US1-5 |
| `PAGES_BASE_URL` 未設定 | 每題 spoiler 內容不含連結，其餘不變 | US1-6 |

> 前五項 MUST 以 `tests/unit/` 覆蓋，本節只是人工快照確認。

### 3.2 Spoiler 邊界檢查（SC-001）

```powershell
node -e "
const { render } = require('./dist/renderer/discord.js');
// 取一個含 quizItems 的 ReviewLesson 樣本（可用 tests/helpers/lesson.ts 的既有 fixture 擴充）呼叫 render()，
// 檢查每個小測 field 的 value 是否恰以 || 開頭於「正解：」那一行、題幹與選項不在 || 內。
"
```

**預期**：完整詳解（`explanation[1..4]`）不出現在任何 Discord field 中（只有 `explanation[0]` 經
spoiler 呈現）。

---

## 4. 題庫連結驗收（US1-2a）

```powershell
$env:PAGES_BASE_URL = "https://example.github.io/leetcode-daily-coach"
npm run build:pages
```

（其餘環境變數同既有 F9 quickstart：`STATE_FILE`、`PAGES_OUTPUT_DIR`。）

**預期**：`pages-dist/quiz/{conceptId}.html` 存在（僅 `unlockedIds` 範圍）；開啟後見到明碼題幹與
選項、`<details>` 展開後見到正解代號與完整 5 段 `explanation`，且 HTML 原始碼中無任何
`<script>` 標籤。

---

## 5. Gate 攔截驗證（對照 SC-008）

`QuizViolationRule` 共 **12 個**：11 個由 `checkQuizBank()` 輸出，`quiz-schema` 由載入層 throw
（計數口徑見 contracts/quiz-bank-schema.md §3）。逐一植入違規樣本後執行 `npm run validate:content`，
**預期每一項都被具名擋下、零自動截斷**。`quiz-schema`／`quiz-unknown-concept` 由單元測試覆蓋
（不在此以手改 `data/` 的方式植入，同 F8 quickstart §6 的既有慣例）：

| 樣本 | 預期 rule |
| --- | --- |
| 某選項加上 `A. ` 前綴 | `quiz-invalid` / `quiz-option-prefix` |
| `explanation[0]` 加長至 > 80 字元 | `quiz-invalid` / `quiz-conclusion-length` |
| 某題幹＋選項＋結論句合計加長至超過模擬呈現上限（內容 + `QUIZ_URL_RESERVE_CHARS` 120 > 570） | `quiz-invalid` / `quiz-item-budget` |
| 某則混入簡體字 | `quiz-invalid` / `quiz-traditional-chinese` |
| 刪到某 Concept 只剩 2 題 | `quiz-invalid` / `quiz-count-range`（指名需要幾則、實際幾則） |
| 複製一題到同一 Concept 內第二次 | `quiz-invalid` / `quiz-duplicate` |
| 某題幹改寫為含「LeetCode 1」或 `https://leetcode.com/problems/two-sum/` | `quiz-invalid` / `quiz-leetcode-id` |
| 把某 Concept（≥4 題）的多數題 `answerIndex` 改為同一值，使佔比 >50% | `quiz-invalid` / `quiz-answer-position-bias`（指名分布與佔比） |
| 把某 Concept（≥4 題）多數題的正解選項加長至唯一最長，使佔比 >50% | `quiz-invalid` / `quiz-longest-option-bias`（指名佔比） |
| 把某 Concept（≥8 題）的 `answerIndex` 全部集中到 3 個以內的位置 | `quiz-invalid` / `quiz-answer-position-coverage`（指名未使用的位置） |

> 驗完 MUST `git checkout -- data/quiz-bank.json` 還原。

---

## 6. 完成判準（對照 Success Criteria）

- [ ] SC-001 100% 的小測 embeds render 結果正解／結論句／連結封藏於 `||…||`，題幹選項不封藏，完整詳解不出現於訊息內
- [ ] SC-002 同一 `(track, sessionIndex)` 編譯 & render byte-identical
- [ ] SC-003 同一 Concept 三軌取到相異題目
- [ ] SC-004 review 全 embeds 字元總和（含小測段）≤5,500，`quizItem`≤570、`quiz`≤3,000 逐格通過
- [ ] SC-005 題庫或素材缺席時推播照常、零提示零告警
- [ ] SC-006 無 LLM API key 環境下推播不變
- [ ] SC-007 Pages 停用或 quiz 頁缺席時小測仍推出全部題目、僅省略連結
- [ ] SC-008 凍結入庫題目 100% 通過交叉驗證；`data/quiz-bank.json` 無題數 <3 的 Concept
- [ ] SC-009 Skeleton 未變更時重跑 byte-identical；單一 Concept 變更時僅該 Concept 重生
- [ ] SC-010 題數恰為 3 的 Concept 佔比 <40%，全庫平均 ≥5
- [ ] SC-011 課綱順序清單中，100% 已解鎖且題庫有題的 Concept 顯示「✍️ 小測」連結；未解鎖或無題者 0% 顯示；`buildSite()` 重複呼叫 byte-identical
