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

**計數口徑（全文一致，MUST）**：`QuizViolationRule` 共 **8 個**，其中 **7 個由 `checkQuizBank()` 輸出**，
`quiz-schema` 這 1 個由 §2 的載入層 throw 實現。凡提及數量處一律採此說法。

純函式，輸入 `{ quizBank?, graph }`，輸出具名違規陣列。**對 `byConcept` 的每一個陣列元素逐一檢查**
（不依賴課表是否實際選中該題，理由見 research R3——單一 Concept 最多只有 3 個索引會被
`compile()→render()` 觸達，題數 >3 時題庫內未被觸達的題目完全不會經過 runtime `checkBudget`）。

```ts
export type QuizViolationRule =
  | "quiz-schema"              // ★ 由 §2 的載入層 throw 實現，非本函式輸出（同 material-schema 的既有註記）
  | "quiz-unknown-concept"
  | "quiz-option-prefix"
  | "quiz-conclusion-length"
  | "quiz-item-budget"
  | "quiz-traditional-chinese"
  | "quiz-count-range"
  | "quiz-duplicate";

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

**映射進 `GateViolation`**（`src/compiler/gate.ts`）：`rule` 固定 `quiz-invalid`，
`subject` MUST 為 `` `${v.rule}@${v.subject}` ``，`message` 沿用 `v.message`。**Gate 層不新增
8 個 `GateRule`**——素材違規對 Gate 的意義一致（擋下、非零 exit code），細分留在 `QuizViolationRule`。

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
```

- `--force`：唯一覆蓋冪等的路徑（§20.4）。
- `--only`：逗號分隔的 Concept id。
- **缺 `GEMINI_API_KEY` MUST fail-fast**（`createLlmClient` 建構期即拋），且**不寫任何檔案**。

### 5.2 兩階段流程（FR-016，Concept 為續跑單位，research R6）

```
for each concept in ordinalOf 全序:
  if shouldSkip(...) → continue                          // data-model.md §10

  for attempt in 1..3:
    // Stage A：面向列舉（MUST NOT 於 prompt 提及任何題數或面向數字，含上限，FR-016）
    aspects = LLM(buildQuizAspectsPrompt(concept))         // 取材：learning_goal／exit_criteria／
                                                            //   Author Hints 核心觀念/Pattern 辨識線索/
                                                            //   Thinking/Common Mistakes／prerequisite-next 區辨點
                                                            //  （MUST NOT 納入 TypeScript/Python 重點，FR-016）

    // Stage B：據面向出題（每面向 ≥1 題，同面向 MAY 多角度出題；MUST NOT 提及題數/面向數字）
    draft = LLM(buildQuizItemsPrompt(concept, aspects), responseSchema)

    f = structuralGate(draft)      // schema／代號前綴／explanation 恰 5 段／結論句 ≤80／預算／繁中
    if f → retryFeedback = f.reason; continue

    survivors = []
    for item in draft.items:
      crossCheck = LLM(buildQuizCrossCheckPrompt(item.stem, item.options))   // §4，不含正解
      if crossCheck.answerIndex === item.answerIndex → survivors.push(item)
      else → 針對該題面向重出一題（換角度），MUST 再次通過交叉驗證才計入 survivors

    if survivors.length < 3 → lastFailure = "存活題數不足 3"; continue        // FR-013a：題數檢查
                                                                              //   MUST 在交叉驗證後才做
    → 通過，寫入 byConcept[concept.id] = survivors，checkpoint 標記 frozen/gatePassed

  3 次皆不過（含「驗證後仍 <3 題」）→ 標記 needsHumanReview，**不寫入該 Concept**，
    繼續下一個 Concept（FR-010a：MUST 一次列出全部不足量的 Concept，MUST NOT 遇到第一個即中止）

批次末：loadCompilerDeps() → runContentGate()（含 checkQuizBank 的全庫結構檢查）
若有任一 needsHumanReview 或批次末違規 → 非零 exit code
```

**執行順序 MUST 為**（FR-013a）：生成 → 交叉驗證 → 丟棄不一致者 → 補生成 → 補生成的題再驗 →
**最後才檢查題數**。**MUST NOT** 顛倒順序（顛倒會讓「生成恰 3 題 → 題數合格 → 交叉驗證棄 1 題 →
入庫 2 題」無人察覺，SC-003 靜默失效）。

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

### 5.5 邊界

- 生成腳本 MUST NOT 寫入 `concepts/**`、`articles/**`、`schedules/**`、`curriculum/**`（同 FR-027／SC-009 精神）。
- `@google/genai` 只出現在 `scripts/` 依賴路徑（憲章 VIII，`tests/unit/no-llm-in-src.test.ts` 守）。
- `daily.yml` MUST NOT 含 `GEMINI_API_KEY`（`tests/unit/daily-no-llm-key.test.ts` 守，本 Feature 不改此測試的判準對象）。
- **生成 prompt 中 MUST NOT 出現任何題數或面向數的數字**（含上限，FR-016）——上限 10 僅為
  §3 rule 7 的 code-side 保險絲，MUST NOT 寫進 prompt（research 已實測：數字一旦出現在 prompt
  就會被當成目標而非上限，見 spec Q14）。
