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

### Phase 14 新傳染路徑：舊題庫 → orchestrator 派件 prompt → 新教材

orchestrator 派件給 `heap-find-median-from-data-stream` 的作者時寫「直接依大小分邊會壞——給具體序列
反例」。這句話的來源正是該課**舊 quiz item[2] `explanation[3]`** 的偽命題（「依數值分流會使兩側數量
失去控制」）——orchestrator 讀舊題庫建立脈絡時把它當成事實吸收，再寫進 prompt。作者 B4 實測 3,000 組
（依值分邊 + 依大小搬頂 = 0 錯）後主動更正，reviewer S4 手推證實「依值分邊再依個數搬頂」是**正確**寫法，
壞的是「只看個數不看值」或「不做再平衡」的版本。

**教訓**：派件 prompt 裡的演算法命題 MUST 與 Common Mistakes 同等對待——寫不出具體反例就不要寫進 prompt；
orchestrator 從舊教材／舊題庫讀到的「常見錯誤」在證實之前 MUST 視為待驗證，MUST NOT 轉述給作者當前提。
若作者沒有實測的習慣，這條偽命題會原封不動進入新教材、再流入新 quiz，完成一次跨代傳染。

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

**Phase 6 發現第三、四種變體**（同一根因的不同表現）：

| 變體 | 實例 |
| --- | --- |
| **亂碼填充字串** | `binary-search-lower-bound` 舊卷 4 題的 `explanation[4]` 是 `aspectpiicidv`——`aspect` 正是 `quiz-aspects.ts` 裡「出題面向」的欄位名，研判為**產線內部識別項洩漏並被截斷** |
| **引述不存在的選項文字** | `binary-search-find-minimum-rotated` item[1]、`binary-search-matrix-search` item[4] 的 explanation 引述了選項裡根本沒有的敘述 |

**Phase 13 發現第五種變體（reviewer R4 查出）**：`graph-topological-sort-dfs` 舊卷 7 題共 21 段錯項
解釋，**全部**是「〈選項原文〉的說法錯誤，因為…」模板——把選項原文貼進來當主詞、後半才是一句
通用理由。同批 `graph-detect-cycle-directed` 舊卷 8/8、`graph-adjacency-matrix-representation`
舊卷 10/10 的 `explanation[0]` 逐字等於正解（graph 模組 +1）。

**Phase 14 再擴大（backtracking、heap 兩模組）**：`backtracking-core-concept-introduction` 舊卷
`explanation[0]` 5/5「正解為＋正解選項原文」、`[2]`–`[4]` 15/15 第五變體模板（跨模組再現）；
`heap-merge-k-sorted-lists` 6/6、`heap-find-median-from-data-stream` 7/7 複製正解；
`heap-array-representation` `[2]`–`[4]` 用「針對……的選項」模板；heap 006／010 多題。
累計樣本已涵蓋 **9 個模組**。

五種變體（複製正解／洩漏學習目標／亂碼填充／引述不存在的選項／選項原文當模板主詞）指向同一件事：
**`explanation` 各段的職責在產線 prompt 裡從未被定義**，模型在缺乏指示時各自退化成不同的填充策略。
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

### 全庫量化（Phase 7 開跑前普查，2026-08-29）

原本只記錄了一個案例，實際普查後規模大得多：**44 個題號被多個 Concept 共用**。

| 類型 | 題號數 | 判定 |
| --- | --- | --- |
| **模組內重複** | 23 | **多數可接受**——同一題用逐步更好的技巧再解一次，是刻意的教學設計。例：34 在 binary-search 出現 5 次（001/002/004/005/006），Phase 6 的 reviewer 確認 007 的 Hint 與 009 的正文逐字一致，銜接良好 |
| **跨模組重複** | **21** | **問題型**——學員在不同模組看到同一題配同一個觀念，而兩邊都不知道對方存在 |

跨模組重複中最嚴重的幾個：

| 題號 | 次數 | 模組 |
| --- | --- | --- |
| 3 | ×4 | hash-table / sliding-window / string（string 佔 2） |
| 104 | ×4 | dfs-bfs / queue / tree（tree 佔 2） |
| 438 | ×3 | hash-table / sliding-window / string |
| 994 | ×3 | dfs-bfs / graph / queue |
| 1 | ×3 | hash-table（×2）/ two-pointer |
| 387 | ×3 | hash-table / string（string 佔 2） |

**關鍵區分**：模組內重複 MUST NOT 一律視為缺陷——它可能正是「同一題、更好的解法」的教學安排。
真正要處理的是**跨模組**那 21 個。判準是：**後一課有沒有誠實承認學員見過這題？**
有承認並說明差異 ⇒ 可接受；當成第一次教 ⇒ 缺陷。

### F12 期間的止血作法

F12 無法改課綱，但可以要求教材**誠實定位**。Phase 7 起，orchestrator 在 agent prompt 中
直接列出「你這題已被哪幾個 Concept 用過、它們是否已重生」，並要求：
MUST 讀過既有課文、MUST 沿用其邊界慣例與術語、**MUST NOT 教得比先修課更粗**、MUST 誠實定位。

### 已做的止血（Phase 3）

`string-sliding-window-fixed` 補上一句誠實定位：先修課的 matched 計數器是同一副骨架的常數優化，
本課先用整表比對把不變式講清楚。這讓「倒退感」變成「刻意的鋪陳」，但**沒有解決重複本身**。

### Phase 10 新登錄的重複配題（供該課重生時帶入）

| 題號 | 先出現（較早） | 後出現（**舉證責任在此**） | 狀態 |
| --- | --- | --- | --- |
| 111 | `queue-shortest-path-unweighted`（queue，level 8） | `bfs-shortest-path-unweighted`（dfs-bfs/005，level 14） | 兩課主題幾乎相同（同為無權圖最短路、同 `complexity_label`）。dfs-bfs/005 重生時 MUST 誠實承認學員已在 queue/008 解過 111 且已學過同一套逐層擴散 |
| 203 | `linked-list-deletion-by-value-or-index`（004） | `linked-list-dummy-head-pattern`（005） | **本批已止血**：004 誠實鋪梗「明天的 Dummy Head 會把這個特例收編」，005 誠實承認昨天已解過並明講差別（刪頭特判整段消失） |

### 修復方向（MUST NOT 在 F12 處理）

1. Problem Bank 的 Concept ↔ Problem 對應加一條檢查：同一題號被多個 Concept 列為
   Today's Challenge 時 MUST 報告（是否允許重複由人判斷，但不該無聲發生）。
2. 課綱層決定兩課的分工：或讓後一課直接以前一課的解法為起點只講差異，
   或替後一課換一題。**此決策 MUST 落地到 `docs/spec.md` 與 `curriculum/`**（CLAUDE.md 跨 Feature 決策規則）。

---

### 新登錄（Phase 11 reviewer 查出）

| 題號 | 兩課 | 舉證責任 |
| --- | --- | --- |
| 23 | `linked-list-merge-two-sorted`（linked-list，第 10 模組）／`heap-merge-k-sorted-lists`（heap，第 13 模組） | 落在課序較晚的 **heap/008**：重生時 MUST 具名承認 linked-list 已用 23 教過兩條串列的合併，並說明 Min-Heap／分治的差異 |

本次重生的 011 已誠實鋪梗「k 條時交給 Min-Heap 或分治」，銜接良好，不需再改。

### 新登錄（Phase 12 reviewer 查出）

| 題號 | 先出現（較早） | 後出現（**舉證責任在此**） | 狀態 |
| --- | --- | --- | --- |
| 104 | `queue-bfs-level-order-traversal`（queue，level 8，三個 track 皆有） | `tree-maximum-depth-bottom-up`（tree/006，level 10）、`tree-maximum-depth-top-down`（tree/007，同批）、`dfs-recursive-implementation`（dfs-bfs/002，level 14，**最晚，舉證責任在它**） | **tree/006、007 本批已止血**：006 於 Concept 段承認 Queue BFS 已解過同一題（逐層擴散 vs 回溯聚合）；007 的 Challenge why 改寫為「此題你已見過兩次」。dfs-bfs/002 重生時 MUST 帶入本清單並誠實定位 |

Phase 12 作者的 prompt 未帶重複配題清單，作者無從得知——後續批次派件時 SHOULD 把本節
相關列一併帶入該 Concept 的 prompt。

### 新登錄（Phase 13 reviewer 查出；本批派件已首次帶入清單，實測有效）

| 題號 | 先出現（較早） | 後出現（**舉證責任在此**） | 狀態 |
| --- | --- | --- | --- |
| 200 | `graph-dfs-traversal`（graph/004，level 11） | `dfs-recursive-implementation`（dfs-bfs/002，level 14） | graph/004 本批已把 200 教滿（格子圖當隱式圖、visited 時機、四方向邊界）；dfs-bfs/002 重生時 MUST 帶入本篇路徑並誠實定位 |
| 323 | `graph-connected-components`（graph/006，level 11） | `graph-connected-components-count`（dfs-bfs/008，level 14） | graph/006 本批首次；dfs-bfs/008 重生時 MUST 誠實定位 |
| 994（第三次） | `queue-matrix-multi-source-bfs`（queue/009）→ `graph-bfs-traversal`（graph/005，**本批已止血**：why 具名承認 queue 模組已解過，並補其未展開的不變式論證） | `matrix-bfs-multi-directional`（dfs-bfs/007，level 14） | dfs-bfs/007 重生時 MUST 帶入前兩篇路徑 |
| 207（模組內） | `graph-detect-cycle-directed`（graph/008） | `graph-topological-sort-bfs-kahns`（graph/010，同批） | **本批已止血**：010 的 Challenge why 具名承認 008 已用三色法判過環，說明 Kahn 順便產出順序、以彈出計數判環 |

派件帶清單的作法自本批起為常態：orchestrator 於開批前以腳本掃 `concepts/**` 的 `leetcode`
交叉列出重複，寫進各作者 prompt。

### 新登錄（Phase 14）

| 題號 | 先出現（較早） | 後出現（**舉證責任在此**） | 狀態 |
| --- | --- | --- | --- |
| 215（模組內） | `heap-sift-down-extraction`（heap/004）——Skeleton 指派 215 且 Author Hints 明寫 size-k min-heap，本課只能教滿 | `heap-kth-largest-element`（heap/006，同批） | **本批已止血**：006 的 Concept 與 Challenge why 具名承認 004 已解過，今日抽象成「第 k 大 ⇒ 反向 k 元素 heap」Pattern 並延伸到串流版 703。課綱層問題：004 被迫把 006 的 learning_goal 教完 |
| 23 | `linked-list-merge-two-sorted`（linked-list/011，已重生） | `heap-merge-k-sorted-lists`（heap/008） | **本批已履行**（Phase 11 登錄的舉證責任）：008 具名承認、逐字沿用 011 的迴圈不變式與 dummy／tail 術語，只加 heap 專屬不變式與三種解法的複雜度推導，嚴格增量 |
| 78（模組內） | `backtracking-core-concept-introduction`（backtracking/001）——已用 `start` 模板教滿完整輸出與不重複論證 | `backtracking-subset-generation`（backtracking/002） | 002 重生時 MUST 帶入本篇路徑並誠實定位（差別只能是變形：去重、剪枝、迭代版） |

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

---

## D10 · 教材憑空捏造「常見錯誤」，且自己的示範程式碼就違反它

**狀態**：🔴 未修復
**嚴重度**：中高——這是**主動散布錯誤知識**，比缺漏嚴重。

### 證據（Phase 5 查證，兩例皆經窮舉證偽）

| Concept | 捏造的規則 | 事實 |
| --- | --- | --- |
| `two-pointer-container-water` | Common Mistakes：「等高時同時移動兩端會漏解」 | **偽**。三次獨立窮舉（Phase 1 的 203,276 組、作者的 335,916 組、reviewer 的 97,650 組）對照暴力法，不一致均為 **0** 組 |
| `two-pointer-trapping-rain-water` | Common Mistakes：「比較當前高度會導致計算失效」 | **偽**，且**同篇程式碼用的正是該寫法**。窮舉 97,655 組驗證三種變體全部正確 |
| `two-pointer-sort-array-by-parity` | Common Mistakes：「無限迭代」「空陣列越界」 | 兩條在其自身示範結構下都不可能發生 |
| `binary-search-rotated-duplicates`（舊） | 「照搬無重複模板會指標停滯、陷入無窮迴圈」 | **偽**。`mid ± 1` 更新下指標必前進；真正後果是判錯有序半、**安靜漏解**（`[1,0,1,1,1]` 找 0 可重現）。且該題四個選項無一正確 |
| `binary-search-matrix-search`（**Phase 6 新寫**） | 「少寫 `Math.floor` 會安靜地永遠為否」 | **偽**。兩層索引 `matrix[1.25][0]` **當場拋 TypeError** |
| `binary-search-inclusive-bounds`（**Phase 6 新寫**） | 「閉區間 `right = n` 在 JS 會安靜讀到 undefined、比出錯誤結果」 | **偽**。窮舉 7,392 組錯誤結果 **0**——`undefined` 參與比較恆為 false，只是多白跑幾輪。（Python 端拋 IndexError 的敘述正確） |

第一例是 **D2 的傳染源頭**：偽命題先寫進教材 Common Mistakes，再流入 quiz item[5]
（且該題原四個選項**無一正確**，正確答案根本不在選項裡）。

### 根因假設

Common Mistakes 是固定區塊，**prompt 要求「列出常見錯誤」但沒有要求「該錯誤必須真的會發生」**。
模型在想不出真實陷阱時會編一個聽起來合理的——而演算法命題的真偽無法靠語感判斷。
`gate:code` 只實測 Tip 的程式碼，**完全不驗 Common Mistakes 的敘述**。

### 修復方向

1. **prompt 層**：要求 Common Mistakes 的每一條 MUST 可被一個具體反例證實
   （「什麼輸入下、寫成什麼樣、會得到什麼錯誤結果」），MUST NOT 只寫抽象告誡。
   寫不出反例就不要列那一條。
2. **self-check 層**：新增提問——「你列的每一條 Common Mistake，能不能舉出一組具體輸入
   使該錯誤真的發生？若與本篇示範程式碼衝突，是哪一邊錯？」
3. **審查層（已實施）**：Phase 5 起在 agent prompt 附上已證偽的命題與窮舉數據，
   並要求「若推導出不同結論 MUST 先窮舉驗證再下筆」。實測有效——作者主動重驗後正面改寫，
   reviewer 再獨立驗一次。**但這只治已知的偽命題，治不了未知的。**

---

## D11 · 114 個 Concept 的 `exit_criteria` / `learning_goal` 是英文，會直接推播給中文學習者

**狀態**：🟢 **已修復（2026-08-29）**——經憲章修訂 v1.2.0（XVII-2-2）授權後翻譯完成
**嚴重度**：中——影響 165 個 Concept 中的 **114 個（69%）**。

### 證據（Phase 5 reviewer 查出）

`binary-search-core-concept` 的 frontmatter `exit_criteria` 為英文；
**backtracking / binary-search / graph / heap / stack / tree 等模組整批如此**。

**Exit Criteria 是 Discord 的獨立推播區塊**（spec §14.5 給它 ≤400 字元的獨立預算），
會原樣推給學習者。agent 依 brief「frontmatter 逐字沿用」照做是正確的——**問題在 Skeleton**。

此事牴觸 spec §11 的教材語言規範（教學文章以繁體中文撰寫，僅技術術語 / Pattern 名稱 /
API / 程式碼保留英文）。**整句英文的學習目標不屬於「技術術語」。**

### 為何 F12 修不掉

F12 明訂 MUST NOT 觸碰 `concepts/**`（Skeleton 是內容的真實來源）。
從 Phase 6 起，backtracking / graph / heap / stack / tree 等模組會持續產生同樣的教材。

### 需要的決策（MUST 由使用者裁定，MUST NOT 由 agent 自行決定）

依 CLAUDE.md 的跨 Feature 規則，此決策 **MUST 落地到 `docs/spec.md`**。選項：

1. **另立任務翻譯 114 個 Skeleton 的 frontmatter**——根治，但要動真實來源，
   且 F12 產出的教材需連帶複查（Exit Criteria 區塊的內容會變）。
2. **改推播版面不推 Exit Criteria**——最小改動，但等於承認該區塊沒有推播價值，
   應同步檢討它在 spec §10 / §14.5 的定位。
3. **維持現狀**——接受中文教材夾雜整句英文的學習目標。

**MUST NOT 在 F12 內以任何方式繞過**（例如讓 agent 在教材裡自行翻譯 frontmatter——
那會讓生成物與真實來源不一致，違反「Skeleton 是真實來源」）。

---

## D11 修復紀錄（2026-08-29）

### 查證：英文不是設計決策，是 Stage 1 的 prompt 缺漏

原本以為這是「spec §10.2 有意選了英文」，查證後推翻：

| 事實 | 證據 |
| --- | --- |
| `concepts/**` **從未被手改** | 只有 3 個 commit；唯一的修改 commit `07debd5` 是 **102 行純新增、0 刪除**，加的全是 `leetcode` 題號與 Author Hints |
| 分布是**模組層級的全有全無** | 5 個模組全中文（array／dfs-bfs／dynamic-programming／programming-mindset／two-pointer，51 個），11 個模組全英文（114 個）——這是「一個批次一個決定」的指紋 |
| **Stage 1 的 prompt 沒有指定語言** | 該 prompt 有 8 條編號 MUST 規則（篇數、單一觀念、前向依賴、難度、題號、必填欄位、回傳格式…），**沒有任何一條講語言**；欄位範例雖是中文，但**範例不是規則** |

故 spec §10.2 那句「`exit_criteria` 為英文完整句子（§11）」是 **F7 由部分樣本歸納**，
對 165 個 Concept 只成立於 69%。已於同一次改動更正該段。

### 處置（四件事，缺一不可）

1. **憲章 v1.1.0 → v1.2.0**：XVII 新增 `2-2` 例外之例外，授權在 F12 期間翻譯
   `learning_goal` / `exit_criteria`，並把**「MUST 同時修正 Stage 1 的 prompt」列為授權成立條件之一**
   ——否則只治標，產線重跑會重現。
2. **修根因**：`stage1-curriculum.ts` 新增規則 8（語言），明訂哪些欄位保留英文、哪些 MUST 繁中，
   並寫入「MUST NOT 只靠範例暗示」與 114/165 的實測證據。
3. **翻譯**：4 個 Fable agent 並行處理 114 個 Skeleton。主控**獨立驗證**（非採信 agent 自述）：
   結構欄位 0 改動、Author Hints 正文 0 改動、條數 0 改變。
4. **補 Gate + 同步器**：見下方 D12。

### 副作用：預算反而更寬鬆

| 指標 | 翻譯前（英文） | 翻譯後（繁中） | 上限 |
| --- | --- | --- | --- |
| `exit_criteria` 單條最長 | 107 | **70** | 110 |
| 全部合計最長 | 197 | **90** | 400 |
| 條數最多 | 2 | 2 | 6 |

spec §10.2 已註明：**MUST NOT** 因為改中文就把單條上限調回 60——那會重新製造 F7 解決過的問題。

### 翻譯時發現、但依「僅限語言合規」規則**刻意未改**的原文問題

授權明訂 MUST NOT 藉翻譯之便修改語意，故以下一律照譯並在此存查，待另立任務處理：

- `backtracking/001`：`learning_goal` 文法錯誤——`a implicit decision tree`（應為 `an`）。
- `binary-search/003`：`exit_criteria` 只有 1 條且寫死 JavaScript 的 `Math.floor(...)`，
  對 Python 學習者（`//`）不完全適用。
- `binary-search/010`：`exit_criteria` 寫 `row = mid / cols`，在 JS 應為整數除法。
- `stack/005`：`Understand operator precedence handling in postfix notation`——
  postfix（RPN）正是為了**消除** operator precedence 而存在，此條語意可疑。
- `tree/010`：`Compare left subtree's left with right subtree's right, and left with right`
  ——對稱檢查的正確配對是「左的 right 對右的 left」，後半句語意含混。
- `tree/007`：`Maintain and update a global or passed-down depth counter`——
  「global counter」與專案教材偏好的純函式遞迴風格有張力。
- `linked-list/004`：`Can correctly deallocate ... the target node reference`——
  本課程語言是 TS / Python（皆為 GC 語言），`deallocate` 並非學習者實際會做的操作。

---

## D12 · Article 與 Skeleton 的 `exit_criteria` 有兩份副本，卻沒有任何 Gate 比對

**狀態**：🟢 **已修復（2026-08-29）**
**嚴重度**：中——這是「靜默分歧」型缺陷，錯了不會有任何檢查失敗。

### 問題

`assembleArticleMarkdown` 把 Skeleton 的 `exit_criteria` **原樣複製**進 Article frontmatter，
於是同一份資料有兩個副本。而**推播讀的是 Article 那一份**
（`src/compiler/lesson.ts` 用 `article.meta.exitCriteria`，非 Curriculum 的）。

翻譯 114 個 Skeleton 時暴露此洞：**改了 Skeleton 而不動 Article，推播出去的仍是英文舊值，
且不會有任何 Gate 失敗**。同理，未來任何 Skeleton 的 `exit_criteria` 調整都會靜默失效。

### 修復

1. **Gate**：`scripts/lib/article-gate.ts` 的 `runPerArticleGate` 新增逐字比對
   （Article vs `node.exitCriteria`，條數／順序／內容全等）。掛在**產線與 `gate:articles` 共用的
   那一顆** Gate 上，符合憲章 IX「MUST NOT 另立平行判準」；`verify:phase` 因而自動涵蓋。
2. **同步器**：`scripts/sync-article-exit-criteria.ts`（`npm run sync:exit-criteria`），
   扮演憲章 XIII 要求的「改來源 → 重跑生成器 → review diff → commit」中的生成器。
   `--check` 模式供 CI／人工快速驗證。
3. **測試**：`tests/unit/sync-article-exit-criteria.test.ts`（6 項）釘死冪等性、
   只動 `exit_criteria`、以及**保留各檔原有行尾**（工作樹混用 LF / CRLF，正規化會產生無關的整檔 diff）。

### 為何同步用腳本而非 agent

這是**機械複製**，正確結果唯一且可驗證。派 agent 會改寫措辭、破壞「逐字一致」這個 Gate 條件，
且要燒額度。**凡是有唯一正確答案的搬運工作，MUST 用腳本，MUST NOT 用 LLM。**

---

## D13 · prompt 檔是 template literal，寫入反引號會靜默截斷字串

**狀態**：🟡 已知陷阱，已在本次踩過並修正；**無程式修法，靠紀律**
**嚴重度**：低（會被 `npm test` 擋下），但**誤判成本高**

### 事發經過（2026-08-29）

修 Stage 1 的語言規則時，把新規則寫成 markdown 風格並用反引號標記欄位名
（`` `title` ``／`` `O(n)` ``）。但 `scripts/lib/prompts/*.ts` 的 prompt 本體是
**JS template literal**——反引號直接把字串截斷，整個檔案語法錯誤。

**既有的 8 條規則全都刻意不用反引號**，改用「／」分隔與粗體，這個慣例沒有寫成註解，
所以很容易被後人（包含 agent）破壞。

### 為何誤判成本高

- `gate:articles`、`validate:content`、`gate:code` **全都不會發現**——它們不編譯 `scripts/lib/prompts/`。
- `npm test` 會擋，但輸出長這樣：**`Test Files 1 failed | 106 passed`，而 `Tests 925 passed` 且 0 failed**。
  失敗的是**檔案載入**（esbuild transform），不是任何一條斷言。
  在一堆 e2e 的 stdout／stderr 雜訊中，這行極易被當成無關訊息略過——
  真正的訊號是**測試總數少了 37**（962 → 925）。

### 紀律（MUST）

1. 編輯 `scripts/lib/prompts/**` 的 prompt 字串時，**MUST NOT 使用反引號**；
   欄位名用「／」分隔或粗體標示，程式碼片段直接寫裸文字（例：O(n)、bisect）。
2. 改完 **MUST 跑 `npx tsc --noEmit`**——它會立刻抓到，比 `npm test` 快且訊號明確。
3. 看 `npm test` 結果時，**MUST 同時核對測試總數**，不能只看 `failed` 是不是 0。
   「檔案載入失敗」會讓整批測試消失，卻不計入 failed。

---

## D14 · 授權 agent 執行驗算腳本 ⇒ 在 Windows 上會漏出吃滿 CPU 的孤兒行程

**狀態**：🟡 已建立防護（三層），但**根因是平台行為，無法「修掉」**
**嚴重度**：高——差點燒壞使用者的機器，且**完全沒有任何既有機制會發現**。

### 事發經過（2026-08-29 23:45–23:57）

Phase 7 的 Opus reviewer 被授權執行驗算腳本，它對 sliding-window 006–009 的程式碼區塊做突變測試。

| 時間 | 事件 |
| --- | --- |
| 23:41 | reviewer 啟動 |
| 23:45:35 | 第一個卡住的 `tsx` 行程 |
| 23:45:35 → 23:51:43 | 每隔約 30 秒累積一個，共 **10 個**，全部沒退出 |
| ≈ 23:56:45 | 使用者反映 CPU 快被吃爆，orchestrator 查證後強制終止 |

**代價**：10 個行程累積 **約 4,636 秒 CPU ≈ 77 分鐘**，而牆鐘只過了 11 分鐘——
等於持續壓滿約 **7 個核心**。

### 根因：`execSync` 的 timeout 在 Windows 上殺不掉孫行程

reviewer 的腳本**有寫 timeout**：

```js
cp.execSync(cmd, { cwd: REPO, stdio: 'pipe', timeout: 30000 })   // cmd = `npx tsx "<file>"`
```

**所以「agent 忘了加熔斷」不是原因——它加了。** 真正的問題是：

1. `execSync` 傳**字串**時，Node 會先開一個 `cmd.exe /d /s /c "npx tsx …"`。
2. 逾時只對**那層 shell** 發訊號。Windows 沒有 POSIX 的 process group，
   **孫行程（`npx` → `node` → tsx）不會跟著死**。
3. 突變體把 `while` 的比較運算子或視窗邊界數字改壞 ⇒ 滑動視窗**永不終止** ⇒
   每逾時一次漏一個孤兒，30 秒一個，節奏完全吻合。
4. **腳本把逾時的例外算成 `FAIL` = 突變被殺掉**（這在突變測試裡是標準慣例），
   於是 `mutation-report.json` 看起來完全正常，**reviewer 沒有任何異常訊號**。

### 為何沒有任何機制發現

| 層級 | 為何沒擋下 |
| --- | --- |
| agent 自己 | 它的腳本「正常結束」、報告乾淨，沒有任何錯誤 |
| orchestrator | **完全沒有檢查子行程的環節**——只等 agent 的完成通知，而通知不會提到它留下什麼 |
| Gate / 測試 | 全部只驗 repo 內容，與行程無關 |
| 前六個 Phase | 也跑過驗算腳本，**只是剛好沒事**，不是被擋下來 |

**是使用者發現的，不是流程發現的。**

### 三層防護（已實施）

1. **預設不給 reviewer 執行權**（最有效）。Phase 7 改派純閱讀 reviewer 後，
   仍查出 7 項 MINOR、並手算複核 25 條 Common Mistakes 全數成立——
   **對照組**：Phase 2、4 的 reviewer 本來就沒有執行權，一樣抓到 MAJOR 並判定準確。
   **執行權是 Phase 5 才加的，收益遠不如想像。**
2. **需要實跑時由 orchestrator 自己做**：單一腳本、全域操作計數熔斷、
   規模上限（長度 ≤ 8、總測資 ≤ 50k）、前景執行、用 `node` 直跑不經 `npx`／`tsx`、
   **不開子行程**（要比對變體就在同一行程內用函式變體）。
3. **每個 agent 結束後 MUST 檢查殘留行程**（這是唯一能接住「預防措施本身有 bug」的網）：
   ```powershell
   Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
     Where-Object { $_.CommandLine -like '*<repo-name>*' }
   ```

### 給 agent 的硬規則（若不得不授權執行）

- **MUST NOT 用 `execSync` / `exec` 搭配字串指令跑子行程**——Windows 上逾時只殺 shell。
  非用不可時 MUST 改 `spawn` 取得 PID，逾時以 `taskkill /PID <pid> /T /F` 殺整棵樹。
- 所有 while／遞迴 MUST 有操作計數熔斷；「疑似不終止」本身就是有效結論。
- 一次一個腳本、20 秒內結束、驗不了就回報「未能在資源限制內驗證」。

### 教訓

**「上一個 agent 自己想到要加防護」不等於有防護。** Phase 6 的 reviewer 主動用了熔斷計數器，
orchestrator 看到了卻只當成「它表現好」，沒有把它變成規則——換一個 agent，同樣的任務就出事。
**凡是靠 agent 自覺才成立的保障，MUST 寫成規則；規則擋不住的，MUST 有偵測層。**


### Phase 11 觀察：reviewer 取得改檔權後，紅線仍守住，但**提示層有反向壓力**

2026-09-02 改制後 reviewer 可讀可改、仍 MUST NOT 執行任何指令。首批 6 個 reviewer 中有 1 個
**自陳誤發了 2 次唯讀 Bash**（`node -e` 讀 `problem-bank.json`、一次 `echo`），皆瞬間結束、
未開背景行程，之後自行切回唯讀模式並在回報中主動揭露。

值得記的是它給的原因：**harness 的 auto 模式提示要求「盡量用 Bash 完成工作」**，與 prompt 的
零執行權紅線方向相反。這不是 agent 擅自越線，是兩層指示衝突。

**處置**：後續 reviewer 的 prompt MUST 把紅線寫成「包含 `node -e`／`cat`／`ls`／`echo` 在內的
任何一次 Bash 呼叫」，不能只寫「不要跑驗算腳本」——Phase 11 最後一個 reviewer 的 prompt 已改用
此措辭，該 reviewer 全程零 Bash。
收批時 orchestrator 仍 MUST 依第三層防護清點 `node.exe`（本批清點 20 個，累計 CPU 最高 39 秒，
全為 Claude Code／VSCode 常駐行程，無孤兒）。

---

## D15 · 時區測試的 sanity check 拿「現在」當基準，每天有 8 小時是紅的

**狀態**：🟢 **已修復（2026-08-30）**
**嚴重度**：中——潛伏至今，且**失敗窗口與本專案的推播時段重疊**。

### 發現經過

Phase 7 收批時 `npm test` 失敗，時間是台北 **00:39**。同一份測試在 Phase 6 收批（台北 23:0x）是通過的。
與 Phase 7 的教材內容完全無關。

`tests/e2e/guard-and-modes.test.ts` 的跨日邊界測試：

```ts
const boundaryISO = taipeiMidnightTodayISO();   // 台北今天午夜 → UTC 前一日 16:00
// 確認此 fixture 真的落在 UTC 前一日
expect(new Date(boundaryISO).getUTCDate()).not.toBe(new Date().getUTCDate());
```

### 根因

台北是 UTC+8，**台北午夜恆等於 UTC 前一日 16:00**——所以 fixture 本身永遠是跨日的。
但那行 sanity check 拿它跟**「現在」的 UTC 日期**比：

| 台北當下時間 | 現在的 UTC 日期 | 斷言結果 |
| --- | --- | --- |
| 08:00–23:59 | 已跳到今日 | 兩者不同 ⇒ **通過** |
| **00:00–07:59** | **仍停在前一日** | 兩者相同 ⇒ **失敗** |

實測佐證（2026-08-30 00:39:36 台北 = 2026-08-29T16:39:36Z）：
boundary 的 UTC 日期 29、現在的 UTC 日期 29 ⇒ 斷言失敗。

**它比對的是兩個不同的東西**：fixture 的跨日性質，與「此刻 UTC 有沒有跨過午夜」。

### 為何危險

失敗窗口是**台北 00:00–08:00**，而本專案的每日推播排在 **台北 06:07 / 06:37**（`daily.yml` 雙 cron）。
任何在那個時段觸發的 CI 都會踩到——**失敗窗口與產品的核心時段重疊**。

### 修法

改為比對**同一個時間點**的台北日期與 UTC 日期，這是恆真的不變式：

```ts
const boundaryTaipeiDay = toTaipeiDateString(new Date(boundaryISO));
const boundaryUtcDay = new Date(boundaryISO).toISOString().slice(0, 10);
expect(boundaryUtcDay).not.toBe(boundaryTaipeiDay);
```

### 通則

**測試的 sanity check MUST NOT 以「現在」為基準**，除非該測試就是在驗時間流逝。
凡是「確認這個 fixture 真的具備某性質」的檢查，MUST 只用 fixture 自身的資料推導——
拿外部可變狀態當基準，等於把測試的通過與否交給執行時機決定。
本專案是時區敏感系統（Asia/Taipei guard、UTC cron），這類錯誤 MUST 特別留意。

---

## D16 · Skeleton 的 Author Hints 內含**未經驗證的錯誤程式碼**，照抄即壞

**狀態**：🔴 未修復（Skeleton 屬 F12 結構凍結範圍，MUST NOT 在教材批次中修改）
**嚴重度**：中——Author Hints 是作者的權威輸入，錯誤會被直接抄進教材。

### 證據（Phase 11 reviewer B 查出）

`concepts/linked-list/009-linked-list-reversal-iterative.md` 的 Author Hints 給的 Python 一行反轉：

```python
(prev, curr, curr.next) = (curr, curr.next, prev)   # 壞的
```

Python 的 tuple assignment **右式先整體求值，左式再由左至右逐一指派**。第二個位置把 `curr` 改寫成
原本的 `curr.next` 之後，第三個位置的 `curr.next` 就寫到了**新的** curr 身上，原節點的 `next` 從未被反轉。
正確寫法 MUST 讓 `curr.next` 先於 `curr` 被指派。

作者（Fable）的教材版本順序是對的——但那是它**自己重寫**的結果，不是照 Hints 抄的。
換一個較被動的作者就會照抄，而 `gate:code` 只掃 `articles/**`、不掃 `concepts/**`，抄了也不會被擋。

### 通則

**Author Hints 的程式碼 MUST NOT 被視為已驗證**。F7 Stage 1 產 Skeleton 時未對 Hints 內的
fenced code block 跑任何實測，至今也沒有任何 Gate 覆蓋它。

### 處置

F12 不得改 Skeleton，本項登錄待 Skeleton 層另立任務時處理；屆時 SHOULD 一併把 `gate:code`
的掃描範圍擴及 `concepts/**` 的 fenced code block。

---

## D17 · Tip 的 800 字元預算與 D8 的斷言鑑別力互相排擠

**狀態**：🟡 已知限制，未處置
**嚴重度**：低——不產生錯誤內容，但會讓「補上具鑑別力的測資」在預算滿的篇章變成做不到。

### 證據（Phase 11 reviewer A 查出）

`linked-list-cycle-start-node` 的 TS Tip 已達 **798/800**、PY Tip 742/800。其測資 `a→b→c→b`（F=1）
**無法鑑別「先前進再比較」的錯誤寫法**——該錯法在此測資下同樣回傳正確答案；要抓它必須補一組
**F = 0**（head 即環起點）的案例，但字元餘裕不足以再放一組建構與斷言。reviewer 因此判定不改並具名回報。

同一批的 `linked-list-palindrome-check` 是相反的幸運案例：TS Tip 785/800 時，把既有偶數反例
`[1,2,2,1]` 改成 `[1,2,3,1]` 只花 +3 字元就補上了鑑別力（PY Tip 預算寬裕則用新增一行的方式補）。

### 通則

**D8 的「斷言要能殺掉突變」與 Tip 的 800 字元上限是同一份預算的競爭者**。預算緊時，
reviewer MUST 優先選擇「改測資」而非「加測資」（如上例 +3 字元）；真的補不上時
MUST 具名回報，MUST NOT 為了塞測資而砍掉示範碼本身。

若日後這類案例累積，SHOULD 檢討 Tip 預算（spec §14.5 的 450 是 Discord 側，
`agent-brief.md` §5 的 800 是 Pages 全文側，兩者可分開評估）。
