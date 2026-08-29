# 產線缺陷清單（F12 Phase 1 查證產物）

本檔記錄 **`scripts/` 產線本身**的缺陷——不是教材內容的缺陷。教材可以靠 F12 逐篇修好，
但**產線不修，將來任何一次重跑都會原樣重現同樣的錯誤**。

> 為何獨立成檔：這些發現來自 Phase 1 的 agent 回報與主控的逐項查證，屬跨 Feature 的技術債，
> 不應只存在於對話紀錄裡（CLAUDE.md：跨 Feature 決策 MUST 落地到真實來源）。

---

## D1 · Stage 2 prompt 從未收到 `next`，Tomorrow Preview 全是模型編的

**狀態**：🟢 已修復（2026-08-29）／**Phase 2 實測有效**
**嚴重度**：高——14 篇抽樣中 **13 篇** 的 Tomorrow Preview 與 Skeleton 的 `next` 不符。

### 證據

| Concept | Skeleton `next` | 舊教材 Tomorrow Preview |
| --- | --- | --- |
| `two-pointer-container-water` | `two-pointer-trapping-rain-water` | 「明天探討 3Sum」（3Sum 是**更早**的課） |
| `array-in-place-deduplication` | `array-move-zeroes` | 「Fast-Slow Pointers 延伸至鏈結串列」 |
| `array-move-zeroes` | **（空清單）** | 「明天將進入 Two Pointers 延伸應用」——**憑空發明一課** |
| `hash-table-concept-introduction` | `hash-table-frequency-counting` | 「明日將深入探討 Two Pointers」 |
| `hash-table-frequency-counting` | `hash-table-complement-lookup` | 「明天我們將探討 Two Pointers Pattern」 |

（Phase 1 的 14 篇中只有 `array-two-pointers-sliding` 原本是對的。）

### 根因

`scripts/lib/prompts/stage2-content.ts` 的 `Stage2PromptInput` 欄位為：
`conceptId` / `title` / `patternLabel` / `complexityLabel` / `learningGoal` / `exitCriteria` /
`authorHints` / `candidateProblems` / `retryFeedback`。

**沒有 `next`。** prompt 內文也沒有任何關於 Tomorrow Preview 該寫什麼的指示
（該檔唯一提到 `next` 的地方是檔頭註解，說結構欄位不交給 LLM 決定）。

模型拿不到「下一課是什麼」，只能依上下文編一個聽起來合理的主題；而**沒有任何 Gate 判準
檢查 Tomorrow Preview 的內容**——只要該區塊非空就過關。

### 已實施的修復

1. `Stage2PromptInput` 新增 `nextConcepts: Stage2NextConcept[]`（id / title / patternLabel），
   `buildStage2Prompt` 於「候選題目」後列出「後繼 Concept（**tomorrowPreview 的唯一依據**）」。
2. prompt 新增規則 6：後繼非空 ⇒ MUST 預告其中一門且敘述與其 title／Pattern 相符；
   後繼為空 ⇒ MUST 寫成收尾語且 **MUST NOT 點名任何 Concept**；
   MUST NOT 提及不在後繼清單內的主題（**含課程中更早出現過的**——實測最常見的錯誤樣態）。
3. `generate-content.ts` 於呼叫端以 `graph.concepts.get()` 解析 `node.next` 後傳入
   （`generateOneConcept` 維持不讀 graph，保住可測性）。
4. `buildSelfCheckPrompt` 新增第 4 項檢查，帶入後繼 title 做語意比對。
5. 迴歸測試 `tests/unit/stage2-tomorrow-preview.test.ts`（7 項）鎖住上述契約。

### 為何 MUST NOT 加機械 Gate（實測後否決）

以「Tomorrow Preview 是否含後繼 title 的顯著詞」對 Phase 1 那 14 篇人工核對過的教材實測：
13 篇有後繼者命中 12 篇，**唯一未命中的 `array-in-place-removal` 其實寫對了**——它把後繼
`array-in-place-deduplication` 整句以中文表達（「已排序陣列的原地去重」），未出現英文 title 詞。

約 **8% 的假陽性**會擋下正確教材並逼出無謂重生（額度是產線瓶頸）。故語意比對交給 self-check，
**MUST NOT 上這條正則判準**。若日後要改為硬性 Gate，MUST 先改 prompt 強制英文 title 出現，
再以同一份真值集重測命中率。

### Phase 2 實測驗證（2026-08-29）

修復後產出的第一批（Phase 2，8 篇）：Tomorrow Preview 對 Skeleton `next` **8/8 全數命中**，
含 `next` 為空的 `hash-table-design-lru-cache` 正確寫成收尾語且未點名任何 Concept。
對照 Phase 1 的 13/14 錯誤，D1 視為已關閉；後續批次仍由 reviewer 逐篇複查，不再另設機械 Gate。

（註：本批 8 篇的**舊**教材另有 7 篇 Preview 錯誤，樣態與 Phase 1 一致，佐證根因判斷正確。）

### 原修復方向（存查）

1. `Stage2PromptInput` 加 `next`（至少 id + title + patternLabel）。
2. `buildStage2Prompt` 明示：Tomorrow Preview MUST 只依 `next` 撰寫；`next` 為空時
   MUST 寫成系列收尾語，MUST NOT 點名任何 Concept。
3. `scripts/generate-content.ts` 呼叫端傳入 `node.next` 對應的 ConceptNode 資料。
4. Gate：可行性待驗證。教材保留英文技術術語，故「Tomorrow Preview 是否提及 `next` 的
   title 顯著詞」在機械上**可能**可檢；MUST 先拿 Phase 1 已寫好的 14 篇實測命中率再決定，
   **MUST NOT 憑猜想上一條脆弱的正則判準**（假陰性會擋掉正確教材、假陽性給假安全感）。
   若機械判準不可靠，改由 `runSelfCheck` 增加一個提問項。

---

## D2 · 教材與題庫的錯誤會互相傳染，且交叉驗證抓不到

**狀態**：🟡 已知限制，`generate-quiz-bank.ts` 檔頭已自承，但 Phase 1 提供了實例
**嚴重度**：中

Phase 1 查證出 3 起 quiz 缺陷，其中兩起顯示錯誤的傳播路徑：

1. `two-pointer-container-water` item[5]：「等高時同時移動兩端會漏解」為偽。
   窮舉 203,276 組（含首尾等高 50,004 組）不一致組數為 **0**。
2. `hash-table-sliding-window-distinct` item[0]：標定「先加入 Set、再判斷重複」，
   在 TypeScript / Python 上**不可實作**（`add` 對重複值是靜默 no-op），且與同卷
   item[1] / item[2] 互相矛盾。**舊教材 Thinking 段有同一錯誤** ⇒ 錯誤自教材傳染至題庫。
3. `hash-table-sliding-window-frequency` item[2]：標定「頻率歸零**必須**刪鍵」，
   與**同一課教材的 Common Mistakes**「刪鍵是常見錯誤」正面矛盾。實際為策略相依
   （整表相等比較必須刪；`matched` 計數器不必刪），四個選項無一無條件成立。

**教訓**：教材與題庫由同一模型、依同一份理解生成，交叉驗證又是同家族盲答——三道關卡
**不是獨立事件**。跨模型家族的審查才抓得到這類錯誤（Phase 1 即由 Fable 抓出 Gemini 的錯）。

### 修復方向

短期無程式修法；長期若要重建交叉驗證的價值，MUST 改用**不同廠商**的模型盲答。
此事涉及憲章 XVI（Free-tier Only）與技術約束的 LLM SDK 條款，MUST 走憲章修訂程序。

---

## D3 · quiz `longest-option-bias` 的敘述性要求對 agent 無效

**狀態**：🟢 已於 Phase 1 收尾修正（`agent-brief.md`）
**嚴重度**：低（已有機械 Gate 擋下）

Phase 1 有 agent 自評「正解非**顯著**最長」而放行，實際 7 題中 6 題違規——
`isAnswerUniqueLongestOption` **沒有容差**，正解只要比其餘三項都長 1 個字元就算。
已把 brief 改為逐題可驗證的敘述並附自驗腳本。

**通則**：凡是「模型無法自我核算」的量（字元數、比例、長度關係），敘述性要求一律無效，
MUST 給可執行的檢查腳本。此結論與 `generate-content.ts` 的 `BUDGET_RETRY_GUIDANCE`
docblock 記載的實測教訓一致。

---

## D4 · quiz explanation 的產線洩漏與複製

**狀態**：🔴 未修復
**嚴重度**：中——`hash-table` 兩課合計 14 題受影響，且是**整卷一致**的樣態，非零星失誤。

### 證據（Phase 2 查證）

| Concept | 樣態 | 範圍 |
| --- | --- | --- |
| `hash-table-longest-consecutive-sequence` | `explanation[4]` 是**學習目標句**（產線輸入洩漏到輸出），不是該錯項的解釋 | items[2]–[7]，6 題 |
| `hash-table-design-lru-cache` | `explanation[0]` 是**正解選項逐字複製**，不是「為何正確」的結論句 | 全部 8 題 |

「整卷一致」是關鍵：這不是模型偶爾偷懶，是 prompt 對 `explanation` 各段職責的定義不足，
模型在缺乏明確指示時退化為填充。

### Phase 3 追加證據：確定性行為，非抽樣觀察

| Concept | 模組 | 樣態 | 範圍 |
| --- | --- | --- | --- |
| `error-driven-refinement` | programming-mindset | `explanation[0]` 是正解選項逐字複製 | 全部 8 題 |
| `string-sliding-window-variable` | string | 同上 | 全部 9 題 |

連同 Phase 2 的 `hash-table-design-lru-cache`（8/8），**三個模組、兩個 Phase、三個不同 agent**
各自獨立讀到的既有題庫都是同一句式。已可排除「單卷失誤」，判定為產線的確定性行為。

**Phase 4 再擴大**：該批 10 個 Concept 的**舊**題庫，10 卷**全部**是同一句式（reviewer 獨立複核）。
累計樣本 **14 個 Concept / 4 模組 / 3 個 Phase**，無一例外。確定性判定完全坐實。

**優先度上調**：這是目前唯一「已確認為系統性、且有可靠機械判準」的缺陷。
D1 因假陽性風險而否決了機械 Gate，D4 沒有這個問題——字串比對不需語意猜測。

### 根因假設（MUST 先驗證再動手）

`scripts/generate-quiz-bank.ts` 的 prompt 未逐段定義 `explanation[0]`（正解結論）與
`explanation[i]`（第 i 個錯項為何錯）的職責，且 Gate 只檢查段數與長度，**不檢查內容是否為
選項或輸入的複製**。

### 修復方向

1. prompt 逐段定義 `explanation` 各元素的職責，並明示 MUST NOT 複製選項原文、
   MUST NOT 出現 learning goal / exit criteria 的原句。
2. Gate 可加**機械判準**（與 D1 不同，這裡的判準是可靠的）：
   `explanation[i]` 與對應選項字串的正規化後相等或高度重疊 ⇒ 違規；
   `explanation` 任一段與該 Concept 的 `learningGoal` / `exitCriteria` 原句相等 ⇒ 違規。
   兩者都是字串比對，無語意猜測，假陽性風險低。

---

## D5 · `quiz-traditional-chinese` 對「划」誤報

**狀態**：🟡 已知誤報，**刻意不修**
**嚴重度**：低

Phase 2 收批時，`array-prefix-sum-basic` item[3] 的「不划算」被判為簡體字而中止合併。
「划算」「划船」在台灣正體本來就寫「划」，此為**假陽性**。

**為何不放寬**：「划」在「计划 → 計劃」語境確實是簡體形。把「划」加進白名單，
會讓「規划」「策划」這類真違規全數漏網——而那才是機器翻譯教材最常見的錯誤樣態。
以一次改寫措辭的成本（1 個 agent 呼叫、16 秒）換取檢查的嚴格度，划得來。

**處置慣例**：日後再遇此誤報，一律**改寫措辭**（如「得不償失」「不值得」），
MUST NOT 放寬 `quiz-traditional-chinese` 的字元表。

---

## D6 · Tomorrow Preview 的「明天」在字面上不總是成立

**狀態**：🟡 待處理（用語問題，非事實錯誤）
**嚴重度**：低

Phase 2 的 Opus reviewer 觀察到：foundation track 在 concept 課之間穿插
challenge / review / practice 槽，因此「明天我們將…」的「明天」對該 Track 未必為真——
下一個 concept 課可能在數日之後。三個 Track 的插槽密度不同，同一份教材正文卻共用
（憲章：Shared Knowledge, Different Tracks），所以**無法靠 Track 分歧解決**。

### 修復方向

Stage 2 prompt 的 Tomorrow Preview 規則改為要求**不綁定時間的措辭**
（「接下來」「下一課」而非「明天」）。此為純 prompt 措辭調整，
不影響既有 Gate，亦不需要重跑已凍結的教材——待下次改動 `stage2-content.ts` 時順手納入。

### ⚠️ F12 修不掉這一條（Phase 4 澄清）

**D6 的修法是改產線 prompt，但 F12 不走產線**——F12 是 agent 直接修訂教材檔案，
`stage2-content.ts` 改了也影響不到 F12 的產出。故 **D6 在 F12 各批的教材中會持續存在**，
Phase 4 的 reviewer 確認該批 10 篇仍全面使用「明天」。

這是刻意的取捨：D6 是**全庫規模的措辭問題**，零星修補會造成同一篇內部不一致，
卻要為每一句多付一次 agent 回合。正確的收斂方式是 F12 全部跑完後，
以一次機械替換統一處理（「明天」→「下一課」、「昨天」→「上一課」），
或在最後一批的 brief 中統一要求。**MUST NOT 在個別批次零星修補。**

---

## D7 · 課綱層的配題重複：兩課用同一題、同一測資教同一件事

**狀態**：🔴 未修復，且**不屬於 F12 範圍**（要動 `curriculum/`，非教材）
**嚴重度**：中——影響學習體驗，且後一課讀起來像倒退。

### 證據（Phase 3 reviewer 查出）

`hash-table-sliding-window-frequency`（較早的 session）與 `string-sliding-window-fixed`
（較晚的 session）：

- **同一題** LeetCode 438，同時列為兩課的 Today's Challenge。
- **同一組測資** `"cbaebabacd"` / `"abc"`。
- **同一條迴圈不變式**。
- 前一課還多教了 **matched 計數器**；後一課只教整表比對——**後一課教的方法更粗**。

兩課的依賴關係本身是正當的：`concepts/string/005-string-sliding-window-fixed.md` 的
`prerequisite` 明列 `hash-table-sliding-window-frequency`。**問題不在 DAG，在配題與內容切分。**

### 已做的止血（Phase 3）

`string-sliding-window-fixed` 補上一句誠實定位：先修課的 matched 計數器是同一副骨架的常數優化，
本課先用整表比對把不變式講清楚。這讓「倒退感」變成「刻意的鋪陳」，但**沒有解決重複本身**。

### 修復方向（MUST NOT 在 F12 處理）

1. Problem Bank 的 Concept ↔ Problem 對應加一條檢查：同一題號被多個 Concept 列為
   Today's Challenge 時 MUST 報告（是否允許重複由人判斷，但不該無聲發生）。
2. 課綱層決定兩課的分工：或讓後一課直接以前一課的解法為起點只講差異，
   或替後一課換一題。**此決策 MUST 落地到 `docs/spec.md` 與 `curriculum/`**（CLAUDE.md 跨 Feature 決策規則）。

---

## D8 · `gate:code` 擋不住死斷言：能跑且不拋錯的假測試完美通過

**狀態**：🔴 未修復
**嚴重度**：中高——這是機械 Gate 的**結構性盲區**，不是零星漏網。

### 證據（Phase 3、4 查證）

`gate:code` 實測每段 Tip 程式碼「能執行且斷言不拋錯」。**一個永真的斷言完美滿足這個條件。**
實際查到的樣態：

| 樣態 | 實例 |
| --- | --- |
| 函式永遠回傳 `true`，斷言必過 | `computational-thinking-basics` 舊 TS Tip |
| 斷言硬編在函式本體內，只對示範輸入成立 | `loop-invariant-thinking` 舊 Tip（`assert max_val == 5`）、`mental-model-variables` 舊雙 Tip |
| 斷言寫在 `return` 之後的路徑，永不執行 | `hash-table-longest-consecutive-sequence` 舊 Tip |
| 條件永假 | `string-linear-scan` 舊 Tip（`s[i] === ""`） |
| 斷言為常數事實，與程式碼邏輯無關 | `array-memory-layout` 舊 TS Tip（`2*4===8`） |
| 斷言不覆蓋正文最強調的陷阱 | `string-anagram-grouping` 新 TS Tip（`join("")` 仍會通過，已於 Phase 4 修正） |

**教材是教「如何論證正確性」的**，卻用一個無法失敗的斷言示範——這比沒有斷言更糟，
因為它給了假的安全感。

### 為何機械 Gate 抓不到（現況）

`gate:code` 是黑箱執行：跑得動、不拋錯就過。它**看不到斷言與程式碼邏輯之間有沒有關係**。

### 修復方向（有可行的機械判準，但比 D4 弱）

1. **變異測試（最可靠，成本最高）**：對每段 Tip 程式碼做簡單變異（改動一個運算子／常數／
   刪掉一行），變異後斷言**仍然通過**即代表斷言無效。可只做「刪除最後一個非斷言語句」
   這一種最廉價的變異，就能抓到上表多數樣態。
2. **靜態啟發式（廉價，會有假陰性）**：斷言的期望值若是字面常數、且該常數同時硬編在
   函式本體內 ⇒ 標記為可疑；斷言出現在 `return` 之後 ⇒ 直接違規。
3. **brief 層（已部分實施）**：Phase 4 起在 agent prompt 明列此樣態，實測有效——
   reviewer 逐一驗算 20 個 code block 確認新版未重蹈覆轍。但這只治新寫的，治不了產線重跑。

---

## D9 · Today's Challenge 的 Hint 沒有任何正確性驗證

**狀態**：🔴 未修復
**嚴重度**：中——Hint 直接推播給學員，錯的 Hint 會讓人照著撞牆並懷疑自己。

### 證據（Phase 4 查證）

舊版 `two-pointer-three-sum-basic` 的 Today's Challenge 對 **Two Sum** 給的 Hint 是
「排序搭配相向雙指標」。**該題要求回傳原始索引，排序會打亂索引——這個方法解不了那一題。**

同批另一例：`string-pattern-matching-basic` 對 686 的 Hint 寫「答案只會是這兩個次數之一」，
**漏了無解（-1）的情形**，學員照此推導會以為必定有解。

### 為何抓不到

`gate:code` 只實測 **Tip 的程式碼**。Hint 是散文，**沒有任何 Gate 驗它是否真的能導向正解**——
只要區塊存在且長度合規就過。題號、連結、難度由 Problem Bank 帶入（憲章 XV 保證），
但「這個提示對不對」完全沒人把關。

### 修復方向

無廉價的機械判準（要驗 Hint 正確性等於要解那題）。可行的是：

1. **產線層**：`generate-content.ts` 的 self-check 增加一項——「你給的 Hint 所描述的方法，
   是否真的能產生該題要求的輸出格式？」特別點名**回傳索引 vs 回傳值**這類會被排序破壞的需求。
2. **審查層（已實施）**：Phase 4 起列入 Opus reviewer 的必查清單，實測有效。
   F12 之後若無 reviewer，此缺陷會回到無人把關的狀態。
