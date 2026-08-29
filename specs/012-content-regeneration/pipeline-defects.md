# 產線缺陷清單（F12 Phase 1 查證產物）

本檔記錄 **`scripts/` 產線本身**的缺陷——不是教材內容的缺陷。教材可以靠 F12 逐篇修好，
但**產線不修，將來任何一次重跑都會原樣重現同樣的錯誤**。

> 為何獨立成檔：這些發現來自 Phase 1 的 agent 回報與主控的逐項查證，屬跨 Feature 的技術債，
> 不應只存在於對話紀錄裡（CLAUDE.md：跨 Feature 決策 MUST 落地到真實來源）。

---

## D1 · Stage 2 prompt 從未收到 `next`，Tomorrow Preview 全是模型編的

**狀態**：🟢 已修復（2026-08-29）
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
