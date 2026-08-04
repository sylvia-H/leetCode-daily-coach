# Contract: review Session 的素材選取與版面

**Feature**: 008-review-extras | **對象**：`src/compiler/material.ts`、`src/compiler/lesson.ts`、`src/renderer/discord.ts`

本契約釘死 review Session 的兩項素材如何被**決定性**選中、以及版面如何呈現四段。
全部選取函式 MUST 為純函式，MUST NOT 依賴時間、隨機源、檔案列舉序或環境變數。

---

## 1. 選取函式簽章（`src/compiler/material.ts`）

```ts
/** review Session 依 reviewRange 解析出的歸屬 Topic；range 內無 concept Session ⇒ undefined。 */
export function resolveReviewTopic(
  schedule: TrackSchedule, graph: CurriculumGraph, reviewRange: [number, number],
): string | undefined;

/** 該 Track 課表中，本 review Session 在全部 review Session 中的 0-based 序位。 */
export function reviewOrdinalOf(schedule: TrackSchedule, sessionIndex: number): number;

export function selectReflectionQuestion(input: {
  bank: ReflectionBank; schedule: TrackSchedule; graph: CurriculumGraph;
  track: Track; sessionIndex: number;
}): string | undefined;

export function selectEncouragement(input: {
  pool: EncouragementPool; schedule: TrackSchedule; track: Track; sessionIndex: number;
}): string | undefined;
```

`trackOffset` 一律取 `TRACK_ORDER.indexOf(track)`（`src/config.ts`，值域 0 / 1 / 2）。

---

## 2. Topic 歸屬規則（FR-011）

```
候選 = schedule.sessions 中 type === "concept" 且 reviewRange[0] ≤ sessionIndex ≤ reviewRange[1]
歸屬 = 候選中 sessionIndex 最小者所屬 Concept 的 topic
並列（防禦性；sessionIndex 唯一故實際不可達）⇒ 以 §16.1 的 ordinalOf 全序決勝
候選為空 ⇒ undefined（Compiler 省略 reflectionQuestion）
```

- **「取最早引入者」為 MUST**：與 §14.3 既有的 `problemId → conceptId` 反查決勝規則同向。
  專案內若同時存在「取較早」與「取較晚」兩種方向，每一處都得回查文件。
- MUST NOT 依賴 JSON 鍵序、雜湊或任何不穩定來源。

---

## 3. Reflection 問題選取（FR-011 + research R6）

```
topicId = resolveReviewTopic(...)              // undefined ⇒ 省略
pool    = bank.byTopic[topicId]                // 缺 key 或空陣列 ⇒ 省略
occ     = |{ s ∈ schedule.sessions : s.type === "review"
             ∧ s.sessionIndex < sessionIndex
             ∧ resolveReviewTopic(s.reviewRange) === topicId }|      // 0-based
index   = (occ + trackOffset) mod pool.length
問題     = pool[index]
```

**不變式**

| # | 不變式 | 由誰保證 |
| --- | --- | --- |
| I1 | 同一 `(track, sessionIndex)` 永遠選到同一則 | 純函式（無時間／隨機／IO） |
| I2 | 單一 Track 內，同一 Topic 的第 1..L 次 review 取得 L 則**互異**問題（L = 池大小） | `occ` 步長恆為 1 |
| I3 | 單一 Track 走完整輪課程，任一問題被推播次數 **≤ 1**（SC-010；池大小 > 出現次數時必有數則從未被選中，故為上限而非等值） | I2 + `material-quota`（池大小 ≥ 最大出現次數） |
| I4 | 三軌在同一 Topic 的**同一出現序數**取得不同問題 | `trackOffset` 互異且池大小 ≥ 3 |

> **為何不用 `sessionIndex mod L`**：同一 Topic 的數個 review 其 `sessionIndex` 間距為 rhythm 長度
> （6）的倍數，`mod 6` 恆為同一值 ⇒ **同一 Topic 每次都推同一則**（Foundation 可連續 4 週重複）。
> 完整推導見 research R6。

---

## 4. 鼓勵語選取（FR-012 + research R5）

```
k     = reviewOrdinalOf(schedule, sessionIndex)     // 0-based
index = (k + trackOffset) mod pool.quotes.length
語錄   = pool.quotes[index]
```

**不變式**

| # | 不變式 | 由誰保證 |
| --- | --- | --- |
| I5 | 同一 `(track, sessionIndex)` 永遠選到同一則 | 純函式 |
| I6 | 同一 Track 連續 N 個 review 取得 N 則互異語錄（N ≤ 池大小） | `k` 步長恆為 1 |
| I7 | 連續 30 個 review 互異（SC-002） | I6 + `material-pool-size`（≥30） |
| I8 | 相鄰兩個 review 不同一則（FR-012） | I6 的特例（N = 2） |
| I9 | 三軌在同一 `reviewOrdinal` 取得不同語錄 | `trackOffset` 互異且池大小 ≥ 3 |

> **為何不用 `sessionIndex mod N`**：三軌 rhythm 皆 6 槽且 review 固定於末槽，`sessionIndex` 每次
> 遞增 6，`mod 30` 只會取到 `30 / gcd(6,30) = 5` 個相異索引——**整輪課程只用得到 5 則語錄**，
> SC-002 數學上不可能成立。完整推導見 research R5。

---

## 5. Compiler 填入（`compileReview`）

```ts
const lesson: ReviewLesson = { …既有欄位… };
const q = deps.reflectionBank && selectReflectionQuestion({ … });
if (q !== undefined && q.trim() !== "") lesson.reflectionQuestion = q;
const e = deps.encouragement && selectEncouragement({ … });
if (e !== undefined && e.trim() !== "") lesson.encouragement = e;
```

- **MUST NOT 以空字串填充**（沿用 `overlayNotes` 的既有處置）：空字串會讓 Renderer 長出一個空欄位。
- `compileRest` 的 `encouragement` 填入路徑**保留**（FR-014c）：`rest` 雖已不在現行課表中，
  型別與版面支援 MUST 維持，並由單元測試覆蓋（現行課表已無此類 Session，`validate.ts` 的全課表
  編譯不再涵蓋它，若無單元測試會退化為無人測到的死路徑）。
- Compiler MUST NOT 於 runtime 選題：review 的 `problems` 一律來自課表的 `problemIds`
  （經 `buildOriginProblems`），與 practice / challenge 同一路徑。

---

## 6. Renderer 版面（`buildReviewBlocks`）

單一 embed，`fields` **依序**（缺席即整段省略，MUST NOT 留空欄位或佔位字串）：

| 序 | field name | 來源 | 登記的 budget slot |
| --- | --- | --- | --- |
| 1 | `📚 本週涵蓋` | `reviewConcepts`（必存在且非空） | **不登記**——`docs/spec.md` §14.5 對 slot⇄field 對等不變式的明文例外（「由 Compiler 依課表生成的清單」），由 embed field value ≤1024 與總長 ≤5,500 兜底 |
| 2 | `🤔 Reflection` | `reflectionQuestion` | `reflectionQuestion` |
| 3 | `🎯 Challenge` | `problems`（`renderProblemEntry`） | `problems`（逐題） |
| 4 | `💬 一句話` | `encouragement` | `encouragement` |

- **鼓勵語 MUST 為最後一段**（FR-022）：MUST NOT 插入於 Reflection 與 Challenge 之間，
  避免通用文字稀釋針對本週教材的具體提問。
- **slot⇄field 對等不變式（FR-024）**：每放進 embed 的一段可變長度文字 MUST 同時登記對應 slot；
  由 `tests/unit/budget-slot-parity.test.ts` 強制。
- Renderer MUST 維持 stateless 純函式（憲章 XI）：MUST NOT 讀素材檔 / Curriculum / Problem Bank / state，
  MUST NOT 使用 `!` 斷言取用類型專屬欄位。
- `buildRestBlocks` **不變**。

### 6.1 預算

review 的最大理論長度：`reflectionQuestion` 300 + `problems` 1×350 + `encouragement` 200
+ 本週涵蓋清單（≤6 個 Concept 標題）+ 標題與 field name ≈ **1,000 出頭**，距單則上限 5,500
餘裕極大。逐區塊與總量檢查一律走既有的同一顆 `checkBudget`（FR-025），超限 MUST 視為失敗，
MUST NOT 自動截斷。
