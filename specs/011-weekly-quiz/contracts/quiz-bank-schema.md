# Contract: 題庫檔格式與品質 Gate

**Feature**: 011-weekly-quiz | **對象**：`data/quiz-bank.json`、`src/compiler/quiz.ts`、
`scripts/generate-quiz-bank.ts`

本契約釘死題庫的**檔案格式**、**Gate 判準**、**交叉驗證**與**生成端契約**。生成端、Compiler（runtime）、
CI Gate（`runContentGate`）MUST 依同一份 schema 與同一組上限常數，MUST NOT 各自實作（憲章 IX）。

---

## 1. 檔案格式

```json
{
  "version": 1,
  "byConcept": {
    "two-pointer-technique": [
      {
        "stem": "在已排序陣列中尋找兩數之和時，Two Pointer 相較於暴力雙迴圈的關鍵優勢是什麼？",
        "options": [
          "利用陣列已排序的單調性，每步排除一側區間，複雜度降至 O(n)",
          "不需要額外記憶體",
          "可以處理未排序陣列",
          "一定比雜湊表解法更快"
        ],
        "answerIndex": 0,
        "explanation": [
          "Two Pointer 靠排序帶來的單調性每步排除一側，將 O(n²) 降為 O(n)。",
          "正解成立：左右指標各自單調移動、每步比較後必排除至少一側候選，故整體只掃描一次陣列。",
          "「不需要額外記憶體」不是關鍵優勢：暴力解法本身也不需要，這不是兩者的差異點。",
          "「可以處理未排序陣列」錯誤：Two Pointer 依賴排序後的單調性，未排序時該性質不成立。",
          "「一定比雜湊表解法更快」錯誤：雜湊表解法同為 O(n) 且免排序，兩者複雜度同級，不能宣稱「一定」更快。"
        ]
      }
    ]
  }
}
```

- `version`：固定 `1`。
- `byConcept`：key MUST 為 `graph.concepts` 的 id；value 為 `QuizItem[]`（3–10 題，宣告序即
  `selectQuizItem` 的穩定索引，見 [quiz-selection.md](./quiz-selection.md)）。
- **陣列本身 MAY 為空**（同 F8 `ReflectionBank` 的既有理由）：空集合是 FR-007 的降級路徑之一，
  schema MUST NOT 用 `min(1)`。
- `options` **恰 4 個**、`answerIndex ∈ {0,1,2,3}`、`explanation` **恰 5 個**（見 §3）。
- key 的排列 MUST 為 `ordinalOf` 全序（`moduleIndex → topicIndex → localOrder → id`），
  同輸入 → byte-identical 輸出。
- 序列化：`JSON.stringify(obj, null, 2) + "\n"`。

---

## 2. 載入語意（`src/compiler/quiz.ts`，Compiler 與 Gate 共用）

| 情境 | 行為 |
| --- | --- |
| 檔案不存在 | 回傳 `undefined` ⇒ Compiler 全部 review Session 省略 `quizItems`（FR-008）；**流程 MUST NOT 失敗** |
| 檔案存在但非合法 JSON | **throw**（具名：`quiz-bank 壞檔：{path}`） |
| 檔案存在但不符 schema | **throw**（具名，含 zod issue 路徑與訊息） |
| 檔案存在、schema 合法、但某 Concept 缺 key 或陣列為空 | 該 Concept 略過（FR-007，runtime 降級）；由 Gate 的 `quiz-count-range` 擋下，不會進到正式推播 |

「壞檔 MUST NOT 降級為缺席」沿用 `loadOptionalMaterial` 既有語意，不改。

---

## 3. Gate 判準（`checkQuizBank()`）

**計數口徑（全文一致，MUST）**：`QuizViolationRule` 共 **13 個**，其中 **12 個由 `checkQuizBank()` 輸出**，
`quiz-schema` 這 1 個由 §2 的載入層 throw 實現。凡提及數量處一律採此說法。
（rule 10～12 為 2026-08-07 實測後新增，rule 13 為同日確定性重排（§5.2a）導入時新增，見各列的理由欄。）

**判準的兩個層級（MUST 區分）**：
- **逐題判準**（rule 2–6、8–9、13）：對象是單一 `QuizItem`，可在草稿階段直接判。
- **集合層判準**（rule 7、10、11、12）：對象是**該 Concept 的整個題目集合**，MUST 在交叉驗證丟棄題目
  **之後**、以**存活集合**為對象執行（FR-013a）。在草稿階段先判會用錯集合——交叉驗證會改變題數、
  正解位置分布與選項長度分布，草稿通過不代表存活集合通過。生成端 MUST 於存活集合上重跑一次
  完整 `checkQuizBank`，**MUST NOT 只判題數下限就寫入**（實測 2026-08-07：正因只判了 `<3`
  而未重判上限，3 個 Concept 帶著 11～12 題寫進題庫，直到批次末 Gate 才爆出、已無法在該 Concept
  的重生迴圈內修正）。

純函式，輸入 `{ quizBank?, graph }`，輸出具名違規陣列。**對 `byConcept` 的每一個陣列元素逐一檢查**
（不依賴課表是否實際選中該題，理由見 research R3——單一 Concept 最多只有 3 個索引會被
`compile()→render()` 觸達，題數 >3 時題庫內未被觸達的題目完全不會經過 runtime `checkBudget`）。

```ts
export type QuizViolationRule =
  | "quiz-schema"              // ★ 由 §2 的載入層 throw 實現，非本函式輸出（同 material-schema 的既有註記）
  | "quiz-unknown-concept"
  | "quiz-option-prefix"
  | "quiz-option-cross-reference"
  | "quiz-conclusion-length"
  | "quiz-item-budget"
  | "quiz-traditional-chinese"
  | "quiz-count-range"
  | "quiz-duplicate"
  | "quiz-leetcode-id"
  | "quiz-answer-position-bias"
  | "quiz-answer-position-coverage"
  | "quiz-longest-option-bias";

export interface QuizViolation {
  rule: QuizViolationRule;
  /** 素材座標：`quiz-bank:{conceptId}[{i}]` 或 `quiz-bank:{conceptId}`。 */
  subject: string;
  message: string;
}

export function checkQuizBank(input: { quizBank?: QuizBank; graph: CurriculumGraph }): QuizViolation[];
```

| # | rule | 判準 | 依據 |
| --- | --- | --- | --- |
| 1 | `quiz-schema` | zod strict 解析失敗 —— **由 §2 載入層 throw 實現，不是本函式輸出** | FR-010 |
| 2 | `quiz-unknown-concept` | `byConcept` 的 key 不存在於 `graph.concepts` | FR-010 |
| 3 | `quiz-option-prefix` | 任一 `options[i]` 匹配 `/^[A-D][.、)]\s*/` | FR-006 |
| 4 | `quiz-conclusion-length` | `explanation[0]` code point 長度 > 80 | FR-006 |
| 5 | `quiz-item-budget` | 模擬呈現長度（data-model.md §3 公式：`renderQuizItemBody(toReviewQuizItem(...))` + `QUIZ_URL_RESERVE_CHARS` 120）> `QUIZ_BUDGET_LIMITS.quizItem`（**570**） | FR-014 |
| 6 | `quiz-traditional-chinese` | `checkTraditionalChinese` 對 `stem + options + explanation` 合併文本有任一違規 | §11 |
| 7 | `quiz-count-range` | `byConcept[id].length` 不在 `[3,10]` | FR-005／FR-010a |
| 8 | `quiz-duplicate` | 同一 Concept 內兩題 `stem` 逐字相同 | FR-010／FR-016 |
| 9 | `quiz-leetcode-id` | `stem + options + explanation` 合併文本命中 `/leetcode\.com\/problems/i` 或 `/(LeetCode｜力扣)\s*[#第]?\s*\d+/i`（題號 / 題目連結轉載） | FR-010／§5／§11 |
| 10 | `quiz-answer-position-bias` | **集合層**：該 Concept 內任一 `answerIndex` 的出現次數佔比 > **50%**（`QUIZ_BIAS_MAX_SHARE`）；題數 < **4**（`QUIZ_BIAS_MIN_ITEMS`）時不套用 | FR-010b |
| 11 | `quiz-longest-option-bias` | **集合層**：該 Concept 內「正解恰為該題**唯一**最長選項」的題數佔比 > **50%**；題數 < 4 時不套用 | FR-010b |
| 12 | `quiz-answer-position-coverage` | **集合層**：正解實際用到的位置數 < **3**（`QUIZ_POSITION_COVERAGE_MIN`）；題數 ≥ **8**（`QUIZ_POSITION_FULL_COVERAGE_ITEMS`）時 MUST 用滿 **4** 個位置。題數 < 4 時不套用 | FR-010b |
| 13 | `quiz-option-cross-reference` | 任一 `options[i]` 出現參照其他選項或位置的寫法（「以上皆是」「以上皆非」「上述選項都…」「同選項 A」「A 和 B 都…」）。**這是 §5.2a 確定性重排的前提條件**：選項順序會被重排，這類寫法重排後必然語意錯亂且錯得無聲無息 | §5.2a |

**rule 12 與 rule 10 為何都需要（互補而非重複）**：rule 10 的佔比上限只約束「最集中的那一格」——
一份 `A=50% B=50% C=0 D=0` 的題庫完全通過 rule 10，但 C／D 兩格從未出現，猜答空間仍被砍半。
實測（2026-08-07，242 題全庫）：**A 佔 66.9%、B 26.4%、C 6.2%、D 僅 1 題（0.4%）**——模型幾乎
從不把正解放在最後一格，這是佔比判準看不見的第二種系統性偏誤。**分層而非一律要求四格**：`n=4`
時要求用滿四格等於「每格恰一題」，交叉驗證丟掉任一題就必然違規、過於脆弱；`n≥8` 時四格各至少
一題相當寬鬆（期望各兩題）。實測攔截 27/31，且刻意平衡的手寫對照組（分布 2/3/2/3）通過。

**rule 10～12 的存在理由（MUST NOT 移除或放寬至接近隨機期望值）**：實測（2026-08-07，
`array-two-pointers-variable`）產出的 10 題**全數通過當時既有的 9 條判準**，卻有 **80% 正解落在 B、
90% 正解是該題唯一最長選項**——學習者只要「一律選最長的 B」就能得 80 分而完全不必理解內容。
本題庫的全部價值在於**誠實的自我訊號**（SC-001～SC-003 的共同前提），這種題目量測不到任何東西，
等同素材失效卻無任何徵兆。同批 31 個已產出 Concept 以此判準複驗為 **31/31 違規**，證實這是
**系統性偏誤而非個案**。

**為何這三條可以是結構性判準**（與 checklists/prompt-design.md CHK006／018 那批不同）：三者皆為
**純計數**，不需要把 Stage A 的面向清單持久化為中繼產物（那正是當初否決補 Gate 的理由，research R6），
故成本極低而收益明確。**MUST NOT 只靠 prompt 敘述防範**——spec Q14 已實證敘述性要求無法穩定落實，
且此偏誤是「把正解寫得比干擾項完整」這種下意識行為，連人工撰寫也會發生。

**刻意不納入 Gate 的一項偏誤：「絕對化用詞只出現在干擾項」**。實測同批 242 題有 **54.1%** 的題目
呈現此樣態（干擾項充斥「完全不需要」「必然」「永遠」「只能」「絕對」而正解從不使用），學習者
只要刪掉語氣最強的選項就能大幅提高命中率，看似是理想的第四條判準。**但校準顯示它不是好壞的
鑑別器**：刻意平衡撰寫的手寫對照組在同一指標上是 **70%**，比被判定為劣質的那批更高。根因是
「過度一般化」本來就是**優良干擾項的合法設計**（用來測試學習者是否知道例外），把它機械化禁止
會與正確的出題原則衝突。故此項 **MUST 僅以 prompt 規則處置**（要求干擾項具備實質觀念錯誤、
而非靠極端修飾語製造錯誤），**MUST NOT 加入 `checkQuizBank`**。此段記錄的是「已評估並否決」，
MUST NOT 被後人當成遺漏而補上。

**門檻取 50% 的理由**：隨機均勻分派下，正解位置與「唯一最長」的期望佔比皆約 **25%**；取 50% 留有
一倍餘裕，只攔明顯的系統性偏誤。**MUST NOT 收緊到接近 25%**——那會讓正常抽樣波動頻繁觸發重生、
白燒免費層額度。「唯一最長」而非「並列最長」是刻意的：若有其他選項與正解等長，長度就不構成
可利用的線索。

**⚠️ 修正（2026-08-07）：「50% 留有一倍餘裕故不會誤殺」只對 rule 11 成立，對 rule 10／12 不成立。**
rule 11 是單一二項分布（`p≈0.25`），n=7 時誤殺率約 **7%**，判準健康。但 rule 10 取的是四格的
**最大值**、rule 12 取的是**覆蓋數**，兩者在 n=4～10 這種小樣本下即使 `answerIndex` 完全均勻隨機
也頻繁違規：

| 題數 n | rule 10 誤殺 | rule 12 誤殺 | 合計約 |
| --- | --- | --- | --- |
| 4 | 20% | 34% | ~45% |
| 5 | 41% | 18% | ~50% |
| 7 | 27%（4/7 = 57%） | 5% | ~30% |
| 8 | 11% | **38%**（需滿四格） | ~42% |
| 10 | 14% | 22% | ~32% |

`MAX_REGEN = 3` 之下，**純統計噪音就會讓約 4%–12% 的 Concept 被誤判為 `needsHumanReview`**
（實測 2026-08-07 首跑：5 個 Concept 中 4 個因 rule 10／11／12 耗盡 3 輪）。這不是門檻鬆緊問題，
是**樣本量問題**——放寬門檻只會連真實偏誤一起放過。故位置類的 rule 10／12 **MUST NOT 靠重生達成**，
改由 §5.2a 的確定性重排在寫入前保證；兩條保留為 CI 守衛（見 §5.2a 末段）。rule 11 是**內容**問題
（把正解寫得比干擾項完整），重排改不了，**MUST 繼續由 prompt 與重生迴圈處置**。

**rule 9 的判準邊界（MUST）**：只攔「LeetCode／力扣 + 數字」與題目連結兩種樣式，**MUST NOT** 擴大為
「文本中不得出現任何數字」——複雜度（`O(n²)`）、陣列索引、題目情境中的數值都是合法且必要的內容，
過寬的判準會攔下大量好題並逼出無意義的重生。反向的漏網（模型只寫「Two Sum 這題」而不帶題號）
不在結構性判準的能力範圍內，與 FR-016 已明文承認的語意層限制同類，MUST NOT 以擴大正則來假裝覆蓋。

**映射進 `GateViolation`**（`src/compiler/gate.ts`）：`rule` 固定 `quiz-invalid`，
`subject` MUST 為 `` `${v.rule}@${v.subject}` ``，`message` 沿用 `v.message`。**`GateRule` 只新增
`quiz-invalid` 這一個、MUST NOT 為每條判準各開一個**——素材違規對 Gate 的意義一致（擋下、非零
exit code），細分留在 `QuizViolationRule`。

**違規訊息 MUST 指名根因**：哪一個 Concept、第幾則、實際值 / 上限。**MUST NOT 自動截斷**：
任一項不通過即擋下（生成期觸發重生、CI 期以非零 exit code 結束）。

---

## 4. 獨立二次作答交叉驗證（FR-013，僅生成期，不進 `checkQuizBank`）

```
盲答輸入 = { stem, options }           // MUST NOT 附帶 answerIndex／explanation（FR-013）
盲答輸出 = { answerIndex: number }     // 結構化輸出，見 §5.3
判定     = 盲答輸出.answerIndex === 題庫標記.answerIndex ? 通過 : 丟棄重生
```

- 每一題 MUST 執行一次獨立 LLM 呼叫（`scripts/lib/prompts/quiz-cross-check.ts`），
  **MUST NOT** 與生成該題的呼叫共用同一次對話上下文（獨立性要求）。
- 不通過 ⇒ 針對該題所屬**面向**（見 §5.2）重出一題（換考核角度），**重生的題 MUST 再次通過本驗證**，
  MUST NOT 直接入庫。
- per-Concept 總生成輪數上限 **3 輪**（初次 + 最多 2 次補生成，FR-013）。
- **基礎設施失敗 MUST NOT 計入該 3 輪上限**（FR-013，CHK014）：交叉驗證呼叫本身失敗——
  HTTP／API 錯誤、逾時、429、回應無法解析為 `QuizCrossCheckResponse`——屬基礎設施層失敗，
  MUST 走 F7 既有的 RPM 節流與 429 指數退避 + jitter 重試路徑（`scripts/lib/throttle.ts` 等既有工具），
  **MUST NOT** 計入內容重生輪數。理由：3 輪上限的語意是「這個 Concept 出不出得了 3 道通過驗證的題」，
  把網路抖動算進去等於用基礎設施狀況去判定內容品質，會誤觸 FR-010a 的具名失敗與 `needsHumanReview`。
  基礎設施重試**耗盡後**，才將該題視為本輪未通過（回到內容路徑：丟棄重生）。
- **已知限制**：同模型家族可能有相關性錯誤，非 100% 正確性保證，MUST 記錄於產線文件
  （本契約 + `scripts/generate-quiz-bank.ts` **檔頭註解**——後者為 T032 的交付項之一，
  MUST NOT 只寫在契約而讓讀程式碼的人看不到）。

---

## 5. 生成端契約（`scripts/generate-quiz-bank.ts`）

### 5.1 CLI

```
npm run generate:quiz-bank -- [--force] [--only <conceptId>,...]
npm run generate:quiz-bank -- --rebalance-only
```

- `--force`：唯一覆蓋冪等的路徑（§20.4）。
- `--only`：逗號分隔的 Concept id。
- `--rebalance-only`：對**已凍結**的題庫就地重跑 §5.2a 的正解位置重排，**零 LLM 呼叫、零 manifest
  變動**（重排不改題數也不改 Skeleton 雜湊，跳過條件不受影響），完成後 MUST 立刻以 `checkQuizBank`
  複驗、有違規即非零 exit code。用途：位置指派邏輯調整後讓既有題庫跟上，不必 `--force` 整批重生。
  此路徑 **MUST NOT** 建構 `LlmClient`（缺 `GEMINI_API_KEY` 亦 MUST 可執行）。
- **缺 `GEMINI_API_KEY` MUST fail-fast**（`createLlmClient` 建構期即拋），且**不寫任何檔案**。

### 5.2 兩階段流程（FR-016，Concept 為續跑單位，research R6）

```
for each concept in ordinalOf 全序:
  if shouldSkip(...) → continue                          // data-model.md §10

  for attempt in 1..3:
    // Stage A：面向列舉（MUST NOT 於 prompt 提及任何題數或面向數字，含上限，FR-016）
    aspects = LLM(buildQuizAspectsPrompt(buildAspectsInput(concept, graph)))   // 輸入組裝見 §5.6

    // Stage B：據面向出題（每面向 ≥1 題，同面向 MAY 多角度出題；MUST NOT 提及題數/面向數字）
    draft = LLM(buildQuizItemsPrompt(concept, aspects), responseSchema)

    // 逐題結構性檢查 MUST 復用 checkQuizBank，MUST NOT 另寫一份（憲章 IX）
    f = checkQuizBank({ quizBank: { version: 1, byConcept: { [concept.id]: draft.items } }, graph })
          .filter(v => !SET_LEVEL_RULES.has(v.rule))    // 集合層判準留到交叉驗證後（FR-013a）
    if f.length > 0 → retryFeedback = f.map(v => v.message); continue

    survivors = []
    for item in draft.items:
      crossCheck = LLM(buildQuizCrossCheckPrompt(item.stem, item.options))   // §4，不含正解
      if crossCheck.answerIndex === item.answerIndex → survivors.push(item)
      else → 針對該題面向重出一題（換角度），MUST 再次通過交叉驗證才計入 survivors

    if survivors.length < 3 → lastFailure = "存活題數不足 3"; continue        // 訊息較貼近產線語境

    // §5.2a：正解位置的確定性重排。MUST 在交叉驗證之後（題數已定）、集合層 Gate 之前（Gate 檢查的
    // MUST 是最終要寫入的內容）。
    balanced = rebalanceAnswerPositions(concept.id, survivors)

    // 集合層判準 MUST 以**最終集合**為對象重跑完整 checkQuizBank（FR-013a）：涵蓋題數上限（>10）
    // 與 rule 11。rule 10／12 此時已由重排保證通過，重跑是防禦性複驗（憲章 IX：判準只有一顆實作，
    // MUST NOT 因「理應通過」就跳過）。MUST NOT 只判下限就寫入——見 §3「判準的兩個層級」的實測教訓。
    g = checkQuizBank({ quizBank: { version: 1, byConcept: { [concept.id]: balanced } }, graph })
    if g.length > 0 → retryFeedback = g.map(v => v.message); continue
    → 通過，寫入 byConcept[concept.id] = balanced，checkpoint 標記 frozen/gatePassed

  3 次皆不過（含「驗證後仍 <3 題」）→ 標記 needsHumanReview，**不寫入該 Concept**，
    繼續下一個 Concept（FR-010a：MUST 一次列出全部不足量的 Concept，MUST NOT 遇到第一個即中止）

批次末：loadCompilerDeps() → runContentGate()（含 checkQuizBank 的全庫結構檢查）
若有任一 needsHumanReview 或批次末違規 → 非零 exit code
```

**執行順序 MUST 為**（FR-013a）：生成 → 交叉驗證 → 丟棄不一致者 → 補生成 → 補生成的題再驗 →
**最後才執行全部集合層判準**（題數上下限、兩條猜答偏誤）。**MUST NOT** 顛倒順序（顛倒會讓
「生成恰 3 題 → 題數合格 → 交叉驗證棄 1 題 → 入庫 2 題」無人察覺，SC-003 靜默失效）。

**逐題結構性檢查 MUST 復用 `checkQuizBank`（憲章 IX，MUST NOT 另立 `structuralGate`）**：生成端把當輪草稿
包成一份**單一 Concept 的臨時 `QuizBank`**（`{ version: 1, byConcept: { [concept.id]: draft.items } }`）
餵給 `src/compiler/quiz.ts` 匯出的同一顆 `checkQuizBank`，並**只在此階段濾掉集合層判準**
（`SET_LEVEL_RULES` = `quiz-count-range` / `quiz-answer-position-bias` / `quiz-longest-option-bias`；
其執行時機由 FR-013a 移到交叉驗證後）。理由：生成端與 CI Gate 若各寫一份逐題判準，兩者必然漂移，
屆時「生成期放行、CI 擋下」極難查（同 §14.5 對預算常數單一來源的既有教訓）。`quiz-schema` 這一條
在生成端由 Stage B 的 `responseSchema` 與 zod 解析承擔，不需另行呼叫。

**集合層判準一律只有一個落點**：交叉驗證後以**存活集合**重跑一次完整 `checkQuizBank`（見上方流程），
**MUST NOT** 在草稿階段提前判定；批次末的 `runContentGate` 對已寫入的題庫全量重跑完整 12 條判準，
為最後一道。**生成端 MUST NOT 只判 `survivors.length < 3` 就寫入**——那會讓題數上限與兩條猜答偏誤
完全逃過生成期把關，只能在批次末以整批非零 exit 的形式爆出（實測 2026-08-07 的實際故障模式）。

### 5.2a 正解位置的確定性重排（`scripts/lib/quiz-balance.ts`）

**正解落在哪一格不帶任何語意**，因此 MUST NOT 交給 LLM 決定再由 Gate 事後拒絕——那是一個
「取樣＋拒絕」機制，在 n=4～10 的樣本量下誤殺率高達 23%–45%（數字與推導見 §3 的修正段）。
改為在寫入前以確定性演算法重排，讓 rule 10／12 **由建構保證通過**。

```ts
// 純函式：無 I/O、無隨機源、無時間依賴。PRNG 種子 = FNV-1a(conceptId) ⇒ 同輸入 → byte-identical。
export function buildBalancedTargets(count: number, seed: number): number[];
export function moveAnswerTo(item: QuizItem, target: 0 | 1 | 2 | 3): QuizItem;
export function rebalanceAnswerPositions(conceptId: string, items: QuizItem[]): QuizItem[];
```

MUST 遵守的四項不變量：

1. **干擾項 MUST 維持原相對順序**。`explanation[2]`–`[4]` 的契約是「依序說明其餘三個選項**在 `options`
   中的出現順序**各自為何不成立」；只要三個干擾項相對順序不變，這份對應自動維持正確，
   **MUST NOT 一併重排 `explanation`**。若日後改成任意置換選項，**MUST 同步置換 `explanation[2..4]`**，
   否則詳解會對錯選項且無任何徵兆。
2. **四格次數最多相差 1**，且餘數格 MUST 由旋轉輪流承擔（`count` 非 4 的倍數時，A MUST NOT 恆為最多）。
3. **MUST 洗牌，MUST NOT 用 `i % 4`**。固定輪替雖同樣平衡，卻讓「第幾題 → 正解在第幾格」變成可
   預測規律；題庫會經 Pages 全文公開，那等於把「一律選 A」換成一個更好猜的規律，比原偏誤更糟。
4. **MUST 為確定性**：種子只綁 `conceptId`，`Math.random()` / `Date` MUST NOT 出現（憲章「生成物
   同輸入 → byte-identical」）。重排 MUST 為冪等（同一份題庫重跑 `--rebalance-only` 逐位元不變）。

**前提條件**：選項必須能獨立閱讀。由 §3 rule 13（`quiz-option-cross-reference`）在 Gate 層強制，
並於 Stage B prompt 明文要求——**兩者 MUST 同時存在**，MUST NOT 只靠 prompt（spec Q14 已實證）。

**rule 10／12 MUST NOT 因此移除**：對產線產出它們此後恆真，但仍是防「手改題庫」「未來新增其他
題目來源」「重排邏輯本身被改壞」的 CI 守衛，成本為純計數。移除等於拆掉唯一的回歸偵測。

**Stage B prompt 的對應修改（MUST 同步）**：既有「正解 MUST 用滿四個位置、刻意選沒用過的位置」
這條規則 MUST 改為「位置由系統重排、不必也 MUST NOT 花心思分散」——留著會與重排機制矛盾，
並白白佔用模型對**選項品質**（rule 11 才是真正需要它注意的地方）的注意力。

### 5.3 交叉驗證回應 schema

```ts
// scripts/lib/prompts/quiz-cross-check.ts
export interface QuizCrossCheckResponse {
  answerIndex: 0 | 1 | 2 | 3;
}
```

結構化輸出（`responseSchema`），MUST NOT 走敘述性 JSON（同 F7 對「LLM 手寫 JSON 不穩定」的既有教訓）。

### 5.4 冪等與續跑

- `.cache/quiz-manifest.json`（data-model.md §10）；跳過條件見同節。
- `inputHash` = **Concept Skeleton 內容雜湊**（`hashFile(node.skeletonPath)`，FR-015），
  **MUST NOT** 用 Article 雜湊（Article 為 LLM 產物每次重生皆變，會造成大量假性失效）。
- 中斷後重跑 MUST 從缺漏的 Concept 繼續，**已通過 Gate 的 Concept 零重複 LLM 呼叫**（SC-008 同義精神）。
- manifest 遺失／損毀 ⇒ 由現存 `quiz-bank.json` 反推重建（既有 Concept 視為已凍結且過 Gate），
  MUST NOT 降級為空 manifest 後覆蓋全部題庫。

### 5.5 Stage A 的輸入組裝（`buildAspectsInput`）

FR-016 要求面向取材涵蓋 Author Hints 的四段與鄰居區辨點，但 **`ConceptNode` 不含 Skeleton 正文**
（只有 `learningGoal` / `exitCriteria` / `prerequisite` / `next` / `skeletonPath` 等 frontmatter 欄位）。
故 Stage A 的 prompt 輸入 MUST 由生成腳本先組裝：

```ts
export interface QuizAspectsInput {
  concept: ConceptNode;                       // learning_goal / exit_criteria 直接取自既有欄位
  /** 由 node.skeletonPath 讀入後切出的 Author Hints 段落，key 為段落標題。 */
  authorHints: {
    核心觀念: string;
    Pattern辨識線索: string;
    Thinking: string;
    CommonMistakes: string;
  };
  /** prerequisite / next 鄰居的 { id, title, learningGoal }，只供「區辨點」使用。 */
  neighbors: { prerequisite: ConceptBrief[]; next: ConceptBrief[] };
}
```

- **讀檔與切段 MUST 發生在 `scripts/generate-quiz-bank.ts`**（唯一 I/O 點），
  `scripts/lib/prompts/quiz-aspects.ts` 維持**純字串組裝**（§ Structure Decision 的既有歸屬）。
- **`TypeScript 重點` / `Python 重點` 兩段 MUST NOT 進入 `authorHints`**（FR-016：排除語言 API 記誦類考題）
  ——在**輸入組裝時就不放進去**，MUST NOT 只靠 prompt 敘述性地要求模型忽略（Q14 已實證敘述性要求不可靠）。
- 缺段（某標題不存在）⇒ 該欄位為空字串，**MUST NOT** 中止；其後果依 FR-016 落入
  「交叉驗證後存活題數 <3 ⇒ FR-010a 具名失敗」既有路徑，MUST NOT 另立降級規則。
- `neighbors` MUST 只傳 `id` / `title` / `learningGoal`，**MUST NOT** 傳鄰居的 Author Hints 全文
  ——降低模型把鄰居正題整體搬入的誘因（FR-016，實測曾出現此越界）。

### 5.6 邊界

- 生成腳本 MUST NOT 寫入 `concepts/**`、`articles/**`、`schedules/**`、`curriculum/**`（同 FR-027／SC-009 精神）。
- `@google/genai` 只出現在 `scripts/` 依賴路徑（憲章 VIII，`tests/unit/no-llm-in-src.test.ts` 守）。
- `daily.yml` MUST NOT 含 `GEMINI_API_KEY`（`tests/unit/daily-no-llm-key.test.ts` 守，本 Feature 不改此測試的判準對象）。
- **生成 prompt 中 MUST NOT 出現任何題數或面向數的數字**（含上限，FR-016）——上限 10 僅為
  §3 rule 7 的 code-side 保險絲，MUST NOT 寫進 prompt（research 已實測：數字一旦出現在 prompt
  就會被當成目標而非上限，見 spec Q14）。
