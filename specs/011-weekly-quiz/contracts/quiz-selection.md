# Contract: review Session 的小測選取與版面

**Feature**: 011-weekly-quiz | **對象**：`src/compiler/quiz.ts`、`src/compiler/lesson.ts`、
`src/renderer/discord.ts`

本契約釘死 review Session 的小測題目如何被**決定性**選中、以及版面如何呈現第五段。
全部選取函式 MUST 為純函式，MUST NOT 依賴時間、隨機源、檔案列舉序或環境變數。

---

## 1. 選取函式簽章（`src/compiler/quiz.ts`）

```ts
export function selectQuizItem(input: {
  bank: QuizBank;
  graph: CurriculumGraph;
  track: Track;
  conceptId: string;
}): QuizItem | undefined;
```

`trackOffset` 一律取 `TRACK_ORDER.indexOf(track)`（`src/config.ts`，值域 0 / 1 / 2）。

---

## 2. 選題公式（FR-003）

```
items       = bank.byConcept[conceptId]                      // 缺席或空陣列 ⇒ undefined（FR-007）
node        = graph.concepts.get(conceptId)                  // 防禦性；reviewConcepts 已保證存在於 DAG
trackOffset = TRACK_ORDER.indexOf(track)
index       = (node.localOrder + trackOffset) mod items.length
題目         = items[index]
```

**不變式**

| # | 不變式 | 由誰保證 |
| --- | --- | --- |
| I1 | 同一 `(track, conceptId)` 永遠選到同一題 | 純函式；索引由 `localOrder`（凍結課程結構欄位）與 `trackOffset` 唯一決定 |
| I2 | 三軌在同一 Concept 取得相異題目 | `trackOffset` 互異（0/1/2）且 `items.length ≥ 3`（`quiz-count-range` 保證，對應 SC-003） |
| I3 | 同一 `(track, sessionIndex)` 重複編譯 render 結果 byte-identical | I1 + `compileReview` 不含任何時間／隨機依賴（對應 SC-002）。**此不變式的驗證落點是 compile 層**（`tests/unit/compile-determinism.test.ts`），非 `selectQuizItem`——後者的簽章不含 `sessionIndex` |

**`localOrder` 的實際來源（MUST 依既有實作，勿另算）**：`ConceptNode.localOrder` 由
`src/compiler/curriculum.ts` 從 Skeleton **檔名的 `NNN-` 前綴**解析而得（`001-…` ⇒ `1`，**1-based**，
範圍為 `concepts/{dirName}/` 目錄；無前綴者為 `0`）。現行資料恰為「一個目錄對應一個 Topic、
編號自 `001` 連續」，故其值與「Topic 內序位」相同，但**真實來源是檔名**——檔名跳號時兩者即不相等，
測試 MUST 以檔名語意撰寫斷言。

**為何用 `localOrder` 而非 `ordinalOf` 或 DAG 全序名次**：`ordinalOf` 回傳複合鍵
`{moduleIndex, topicIndex, localOrder, id}`，僅供 `cmpOrdinal` 比較用，不是可取模的純量；
DAG 全序名次會使前段插入一個 Concept 導致其後全部 Concept 換題，`localOrder` 僅在其所屬
目錄的 Skeleton 檔案被重新編號時變動，影響面遠小得多（完整推導見 spec FR-003）。

**為何唯一變化軸是 Track**：三軌全部 Concept 皆恰好被 review 涵蓋 1 次、0 個從未被複習
（spec Q2 實測），per-Concept 不存在時間輪替維度（對比 F8 Reflection／Encouragement 的
`occurrence`/`reviewOrdinal` 兩個時間輪替軸都是為了處理「同一 Topic 被複習多次」而存在，
本 Feature 沒有這個需求）。

---

## 3. Compiler 填入（`compileReview`）

**本節為此段組裝的權威落點**（data-model.md §7 只記錄額外約束，MUST NOT 重複程式碼）。

```ts
if (deps.quizBank) {
  const quizItems: ReviewQuizItem[] = [];
  for (const c of reviewConcepts) {                          // 沿用既有順序（sessionIndex 升冪）
    const item = selectQuizItem({ bank: deps.quizBank, graph: deps.graph, track, conceptId: c.id });
    if (!item) continue;                                     // FR-007：該 Concept 略過
    const quizUrl = deps.pagesBaseUrl ? `${deps.pagesBaseUrl}/quiz/${c.id}.html` : undefined;
    quizItems.push(toReviewQuizItem(c.id, item, quizUrl));   // 唯一轉換點，data-model.md §3.1
  }
  if (quizItems.length > 0) lesson.quizItems = quizItems;
}
```

- **`toReviewQuizItem` MUST 為 `QuizItem → ReviewQuizItem` 的唯一實作**（`src/compiler/quiz.ts` 匯出）：
  `answerLabel = "ABCD"[item.answerIndex]`、`conclusion = item.explanation[0]`、`quizUrl` 未給即不設欄位。
  `checkQuizBank` 估算單題預算時呼叫同一個函式（不帶 `quizUrl`），**MUST NOT 各自組一份**（憲章 IX）。

- **MUST NOT 以空陣列填充**：全部略過 ⇒ 完全不設定 `lesson.quizItems`（`undefined`），
  Renderer 據此整段省略（沿用 `overlayNotes` 既有處置的空值慣例）。
- Compiler MUST NOT 於 runtime 決定「哪些 Concept 出題」——出題對象恆為 `reviewConcepts`
  （由既有 `reviewRange` 邏輯決定），本契約只決定「已知 Concept 選哪一題」。
- `quizUrl` 的存在與否完全由 `deps.pagesBaseUrl` 是否已設定決定（見
  [pages-quiz.md](./pages-quiz.md) §1／research R1），MUST NOT 檢查檔案系統或呼叫任何 API。

---

## 4. Renderer 版面（`buildReviewBlocks`）

**段落順序**（research R5 定案，五段，鼓勵語維持最後一段不變）：

```
📚 本週涵蓋 → 🤔 Reflection → 🎯 Challenge → ✍️ 本週小測 → 💬 一句話
```

單一 embed，新增 fields（依序，`quizItems` 缺席即整段省略）：

| field name | 來源 | 登記的 budget slot |
| --- | --- | --- |
| `✍️ 本週小測 (i/N) · {conceptTitle}`（每題一個 field，FR-009） | `quizItems[i]`（`renderQuizItemBody` + 連結） | `quizItems`（逐題） |

**單題 field value 組裝**（`renderQuizItemBody`，`src/renderer/discord.ts` 匯出的純函式，
與 [quiz-bank-schema.md](./quiz-bank-schema.md) §3 的 Gate 估算共用同一份呈現邏輯，憲章 IX）：

```
{stem}
A. {options[0]}
B. {options[1]}
C. {options[2]}
D. {options[3]}
||正解：{answerLabel} — {conclusion}{quizUrl ? ` · [完整詳解](${quizUrl})` : ""}||
```

- **代號由 Renderer 產生**（憲章 XI：呈現歸 Renderer；`options` 儲存純文字，不含前綴，FR-006）。
- **spoiler 語法 `||…||` 只包住「正解＋結論句＋連結」這一行**，題幹與選項明碼呈現（FR-002／FR-009，
  Discord 原生支援，無需額外用戶端互動）。
- `quizUrl` 缺席 ⇒ spoiler 內容省略連結片段，其餘不變（FR-012）。
- **slot⇄field 對等不變式（沿用 F8 既有慣例）**：每放進 embed 的一段可變長度文字 MUST 同時登記
  對應 slot；由 `tests/unit/budget-slot-parity.test.ts` 擴充覆蓋 `quizItems`。
- Renderer MUST 維持 stateless 純函式（憲章 XI）：MUST NOT 讀題庫 / Curriculum / Problem Bank / state，
  MUST NOT 使用 `!` 斷言取用類型專屬欄位。

### 4.1 預算

單題最大理論長度 ≈ 題幹 + 4 個選項 + spoiler（正解代號 + ≤80 字結論句 + 連結）
≤ `QUIZ_BUDGET_LIMITS.quizItem`（**570** = 內容 450 + 連結保留 120，FR-014）；整段合計 ≤
`QUIZ_BUDGET_LIMITS.quiz`（3000）。**兩格皆只計 field value，不含 field name**——後者由固定樣板
產生，其長度由既有的 `embed[i].field[j].name` ≤256 與 `total` ≤5,500 兜底。逐區塊與總量檢查一律
走既有的同一顆 `checkBudget`（`src/renderer/budget.ts`，登記方式見 data-model.md §4），
超限 MUST 視為失敗，MUST NOT 自動截斷。

review 段落最大理論長度（既有四段 ≈1,000 出頭，見 F8 review-selection.md §6.1）+ 小測段
（最壞情況 4 題 × 570 = 2,280）≈ **3,300 出頭**，距單則自訂上限 5,500 仍有餘裕。

> **口徑說明（本節為理論上限估算，MUST NOT 與 SC-004 的驗收基準混用）**：本節取「既有四段的
> **各 slot 上限加總** ≈1,000 出頭」與「`quizItem` 取滿 570」，回答的是「最壞情況會不會爆」；
> spec **SC-004 的驗收基準是實測值**——現行 review 實測 204～**612**、真實產出單題內容最長 362
> （啟用連結後最壞週次合計 1,892、總計 2,504）。兩組數字都正確，差別只在理論上限 vs 實測，
> **驗收一律以 SC-004 的實測基準為準**。
