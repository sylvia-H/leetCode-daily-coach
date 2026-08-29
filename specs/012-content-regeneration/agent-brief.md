# F12 教材重生 — Agent 作業 Brief（所有批次共用）

你是 **Claude Fable**，負責把既有教材**修訂**到更高品質。這份 brief 是所有批次的唯一指示來源。

專案根目錄（下稱 REPO）：`d:/F2E 前端工程/0 Side_Project/2026/leetcode-daily-coach`
**所有指令 MUST 在 REPO 目錄下執行。**

---

## 0. 你被指派的 Concept

呼叫你的訊息會列出你這批負責的 conceptId。完整清單與路徑見
`specs/012-content-regeneration/phase-NN.json`（欄位：`conceptId` / `skeleton` / `article` / `quizCount`）。

**只處理指派給你的那幾個，MUST NOT 碰其他 Concept 的檔案**——同批有其他 agent 並行作業。

---

## 1. 每個 Concept 的輸入

1. **Concept Skeleton**（權威來源）：`<skeleton>` 路徑。含 frontmatter 與 Author Hints。
2. **現有 Article**（你的修訂基底）：`<article>` 路徑。
3. **現有 quiz**：`data/quiz-bank.json` → `byConcept["<conceptId>"]`（**唯讀**，供你了解既有水準與找錯）。
4. **題目資料**：`data/problem-bank.json`，key 為題號字串。題號 / 標題 / 連結 / 難度
   **MUST 原樣沿用，MUST NOT 由你生成或更動**（憲章 XV）。

---

## 2. 產出

- **Article**：**直接覆寫** `<article>` 那個路徑的檔案。
- **Quiz**：寫到 `<QUIZ_OUT>/<conceptId>.json`（呼叫訊息會給 `<QUIZ_OUT>` 絕對路徑），格式：
  ```json
  { "items": [ /* QuizItem × N */ ] }
  ```
  **N MUST 等於 `phase-NN.json` 的 `quizCount`**（與既有題數相同）。
  **MUST NOT 直接改 `data/quiz-bank.json`**——那是 2MB 單檔，四個 agent 並行寫必然互相覆蓋。
  由主控在批次結束後合併並套用確定性正解位置重排。

### MUST NOT 觸碰

`concepts/**`、`schedules/**`、`curriculum/**`、`data/quiz-bank.json`、`data/problem-bank.json`、
`src/**`、`scripts/**`、`.github/**`、其他 agent 的 Concept。**不要執行任何 git 指令。**

---

## 3. 任務性質：修訂，不是重寫

以現有 Article 為底，**保留寫得好的段落**。針對這些問題改寫：

- **生硬 / 翻譯腔 / 語意不通的中文**（既有實例：「在分析演化時」應為演算法、「大量數額計算」）
- **用語 MUST 台灣慣用**：用「**指標**」不用「指針」；用「程式碼」不用「代碼」。
- **MUST NOT 使用 LaTeX**（`$...$`、`\times`、`\log`）——Discord 不渲染，會原樣顯示成亂碼。
  數學一律用純文字或行內 code：`(right - left) * min(h[left], h[right])`、`O(n log n)`。
- **教學深度**：既有教材的觀念本體中位數只用掉上限 2000 字的三到四成，普遍**只斷言不論證**。
  最該補的是「為什麼這個做法是對的」——貪婪為何安全、迴圈不變式是什麼、邊界為何這樣取。
  但 MUST NOT 為了灌字數而灌；寫到說清楚為止即可。

---

## 4. 事實核對清單（MUST 逐項執行）

既有教材**已知存在**下列類型的錯誤，且自動 Gate 抓不到。修訂時 MUST 逐項核對：

1. **Tomorrow Preview MUST 對照 Skeleton 的 `next`**。
   實例：`two-pointer-container-water` 的 Skeleton `next` 是 `two-pointer-trapping-rain-water`，
   但既有教材寫「明天將探討 3Sum」——而 3Sum 是更早的課。Tomorrow Preview MUST NOT 提到不在
   `next` 清單中的 Concept。
2. **對 prerequisite 的敘述 MUST 對照 Skeleton 的 `prerequisite`**。
3. **Today's Challenge 每題的「為何適合此 Pattern」MUST 誠實**。
   實例：既有教材把 344 Reverse String 說成「貪婪策略」，但它根本不是貪婪。
   **MUST NOT 為了硬套 Pattern 而寫錯**——說它真正示範的東西。
4. **既有 quiz 可能有正解標錯**。實例（已窮舉驗證）：`two-pointer-container-water` 的 item[5]
   宣稱「兩端等高時同時移動兩端會漏解」，這是**錯的**——等高時兩端的上限都已兌現，同時丟掉兩塊
   仍然正確。你重寫 quiz 時 MUST NOT 沿用既有題目的錯誤結論；**若發現既有題目有事實錯誤，
   MUST 在最終報告中具名指出**（哪個 index、錯在哪、正確答案是什麼）。
5. **錯字與斷字**（實例：`Container WithMost Water`）。

---

## 5. Article 硬性規格（違反即 Gate 擋下）

**frontmatter 逐字沿用現有檔案**（`id` / `title` / `module` / `pattern_label` /
`complexity_label` / `estimated_minutes` / `exit_criteria`），一個字元都不要改。

H2 區塊**名稱與順序固定**，全部必填、不得為空：

`Concept` → `Thinking` → `Pattern Recognition` → `Common Mistakes` → `Complexity` →
`Digest` → `TypeScript Tip` → `Python Tip` →
`Takeaway` → `Tomorrow Preview` → `Today's Challenge`

> **`TypeScript Corner` / `Python Corner` 已於 F12 Phase 0 移除**：語言實戰內容一律只寫
> `TypeScript Tip` / `Python Tip`（Discord 與 GitHub Pages 共用同一份）。若你在既有檔案裡
> 看到這兩段，**MUST 刪除**，MUST NOT 保留或重寫。語言特有陷阱的論述改寫進
> `Common Mistakes`（觀念本體 2000 字上限尚有餘裕），程式碼示範留在 Tip。

### 字元上限（code point 計）

| 對象 | 上限 |
| --- | --- |
| 觀念本體＝`Concept`+`Thinking`+`Pattern Recognition`+`Common Mistakes` 合計 | **2000**（計數前先剝除 code、再移除 `#*_>-` 與所有空白） |
| `Digest` 整段 | 900 |
| `TypeScript Tip` 整段（**含 fenced code**） | 800 |
| `Python Tip` 整段（**含 fenced code**） | 800 |
| `Takeaway` | **120**（一句話） |
| 每個 LeetCode 條目 render 後 | 350（`why` + `hint` 合計請 ≤ 250） |

### 程式碼區塊

`TypeScript Tip` / `Python Tip` **兩段各 MUST 至少一個 fenced code block**，且：

- **MUST 自帶斷言**：TypeScript 認 `throw` 或 `assert(` 或 `node:assert`；Python 認 `assert`。
- **MUST 真的能編譯並執行通過**。專案 `tsconfig.json` **有開 `noUncheckedIndexedAccess`**，
  索引存取要收斂型別（`arr[i]!` 或 `?? 0`），否則 Gate 會擋。
- 型別定義用最精簡寫法（`class TreeNode { constructor(public val: number) {} }`）。

### Today's Challenge 格式

```
- **11** · {為什麼這題適合此 Pattern}
  - Hint: {提示}
```

Skeleton `leetcode` 清單裡的**每一個題號都 MUST 出現**。若 `leetcode: []`（無題目觀念課），
寫一句說明散文即可，MUST NOT 生出假的佔位條目。

### 繁中判準

MUST NOT 出現簡體字；CJK 佔比（CJK ÷（CJK + 拉丁詞數））MUST ≥ 0.5；MUST NOT 用網路俚語
（如「寫扣」）。技術術語 / Pattern 名稱 / API / 程式碼保留英文。

---

## 6. Quiz 硬性規格

```json
{
  "stem": "題幹",
  "options": ["選項1", "選項2", "選項3", "選項4"],
  "answerIndex": 0,
  "explanation": ["結論句", "正解為何成立", "錯項A為何不成立", "錯項B為何不成立", "錯項C為何不成立"]
}
```

- `options` **恰 4 個**，MUST NOT 含 `A.` / `B、` 等代號前綴。
- `explanation` **恰 5 段**；`[0]` 是 **≤80 字**的結論句（推 Discord 用）；`[1]` 說明正解；
  `[2]`–`[4]` 逐一說明**其餘三個選項**為何不成立。
- 選項 MUST **各自獨立可讀**：MUST NOT 出現「以上皆是」「同選項 A」「A 和 B 都對」——
  下游會確定性重排選項順序，這類寫法重排後必然錯亂。
- **MUST NOT 出現 LeetCode 題號**（題幹 / 選項 / 詳解皆是）。
- 長度：`stem` ≤ 60、每個 `option` ≤ 55、`explanation[0]` ≤ 80（單題渲染上限 570 含連結保留 120）。
- **MUST NOT 讓正解成為該題「唯一最長」的選項**——判準是 `isAnswerUniqueLongestOption`，
  **沒有容差**：正解只要比其餘三項都長 1 個字元就算違規（集合層上限為過半題數）。
  ⚠️ Phase 1 實測：某 agent 自評「正解非唯一**顯著**最長」而放行，實際 7 題中 6 題違規——
  「顯著」是你想像出來的容差，判準裡沒有。干擾項要寫得跟正解一樣完整，或至少讓其中一項等長。
  **MUST 用下列腳本自驗到 `0/N`**（在 REPO 目錄執行，`<QUIZ_OUT>` 換成你的輸出目錄）：

  ```
  node -e "
  const fs=require('fs');const L=s=>Array.from(s).length;const D='<QUIZ_OUT>/';
  for(const f of fs.readdirSync(D).filter(x=>x.endsWith('.json'))){
    const items=JSON.parse(fs.readFileSync(D+f,'utf8')).items;
    const bad=items.filter(it=>{const l=it.options.map(L),m=Math.max(...l);
      return l[it.answerIndex]===m&&l.filter(x=>x===m).length===1;}).length;
    console.log(f, bad+'/'+items.length, bad===0?'OK':'FAIL');
  }"
  ```
- **`explanation` 每一段都 MUST 是真正的解釋**（⚠️ Phase 2 實測的整卷失效樣態）：
  - `[0]` MUST 是**結論句**，MUST NOT 是正解選項的逐字複製或改寫——
    `hash-table-design-lru-cache` 全部 8 題都犯了這條。
  - `[1]`–`[4]` MUST NOT 出現該 Concept 的 `learningGoal` / `exitCriteria` 原句——
    `hash-table-longest-consecutive-sequence` 有 6 題的 `[4]` 直接把學習目標句貼上來當錯項解釋。
  - 自驗方式：逐段問「這句話有沒有解釋到它該解釋的那個選項」。答不出來就是複製或填充。
- **MUST NOT 使用「划」字**（例：不划算）。`quiz-traditional-chinese` 會判為簡體字而擋下整批合併。
  這是 Gate 的已知假陽性（「划算」在台灣正體本就寫「划」），但我們刻意不放寬字元表——
  放寬會讓「規划」「策划」這類真違規漏網。請改用「得不償失」「不值得」「代價不成比例」等說法。
- **正解位置不用你操心**：下游 `rebalanceAnswerPositions` 會確定性重排，你照語意自然安排即可。
- 題目 MUST 涵蓋**不同面向**（定義／正確性論證／複雜度／邊界／常見誤解／實作細節），
  MUST NOT 全部在問同一件事。

---

## 7. 自我驗證（MUST 做，這是你交件前的最後一關）

改完**每一個** Concept 後，在 REPO 目錄執行：

```
npm run gate:articles -- --only <conceptId> --skip-quiz
```

這跑的是**與 CI 完全同一顆** Gate（結構 / 字數 / 繁中 / 逐區塊預算 / 程式碼實測 / 題目覆蓋
與預算）。**MUST 看到 `✓ <conceptId>` 才算完成**；失敗就照它印出的具名原因修，改到過為止。

`--skip-quiz` 是因為你的 quiz 還沒併進 `data/quiz-bank.json`。quiz 的檢查由主控在合併後執行。

你也可以一次驗多個：`npm run gate:articles -- --only id1,id2,id3 --skip-quiz`

---

## 8. 完成後回報

1. 每個 Concept 的 `gate:articles` 結果（MUST 貼出實際輸出）。
2. 每個 Concept 的觀念本體字數、`Digest` / `TS Tip` / `PY Tip` / `Takeaway` 字元數。
3. 每個 Concept 的 quiz 題數（MUST 等於 `quizCount`）。
4. **第 4 節事實核對清單的逐項結果**：Tomorrow Preview 有無修正、Today's Challenge 有無改寫、
   **既有 quiz 是否發現正解標錯**（具名到 index 與正確答案）。
5. 你認為既有教材最大的問題（每個 Concept 一兩句）。
