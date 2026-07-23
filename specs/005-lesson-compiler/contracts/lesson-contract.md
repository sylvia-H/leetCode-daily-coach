# Contract: Lesson Compiler API 與 `Lesson` 介面

**Feature**: `005-lesson-compiler` | **Supersedes**: `specs/001-walking-skeleton/contracts/lesson-contract.md`
**權威來源**: `docs/spec.md` §7.1、§13.3、§16.4；憲章 IX / XI / XII

---

## §1 對外 API（`src/compiler/lesson.ts`）

```ts
function loadCompilerDeps(paths?: Partial<CompilerPaths>): CompilerDeps;
function compile(track: Track, sessionIndex: number, deps: CompilerDeps): Lesson;
```

- **`compile` 是全專案唯一的 Lesson 組裝入口**。CI Gate（`src/compiler/gate.ts`）與每日 runtime
  （`src/main.ts`）MUST `import` 同一個 `compile`，MUST NOT 各自實作解析或組裝（憲章 IX）。
- `compile` 為**確定性**：同一 `deps` 內容 + 同一 `(track, sessionIndex)` → `JSON.stringify` 相同。
  MUST NOT 讀系統時間、亂數、環境變數，或依賴 `readdir` 列舉序。
- 除 `deps.readArticle` 這個明確的讀檔邊界外，`compile` **不做 I/O**、不呼叫網路、不呼叫 LLM。
- `compile` 失敗一律 `throw Error`，訊息 MUST 指名成因與位置（見 §4）。MUST NOT 回傳部分填充的 Lesson。

### `CompilerPaths` 預設值

| 鍵 | 預設 |
| --- | --- |
| `modulesPath` | `curriculum/modules.json` |
| `conceptsDir` | `concepts` |
| `problemBankPath` | `data/problem-bank.json` |
| `schedulesDir` | `schedules` |
| `overlaysDir` | `overlays` |
| `reflectionBankPath` | `data/reflection-bank.json`（缺席即略過，F8） |
| `encouragementPath` | `data/encouragement.json`（缺席即略過，F8） |

`loadCompilerDeps` 於載入層 fail loud：DAG 有 error 級違規、題庫載入失敗、課表缺檔／不符 schema、
Overlay 存在但不符 schema ⇒ 拋錯。

**「缺席」與「壞檔」MUST 明確區分**（兩者行為不同，MUST NOT 以同一條路徑處理）：

| 檔案 | 不存在 | 存在但不符 schema |
| --- | --- | --- |
| `overlays/{track}.json` | 視為空 Overlay（`byConcept: {}`），**不失敗** | **fail loud** |
| `data/reflection-bank.json`（F8） | 視為缺席，`reflectionQuestion` 不填，**不失敗** | **fail loud** |
| `data/encouragement.json`（F8） | 視為缺席，`encouragement` 不填，**不失敗** | **fail loud** |
| `schedules/{track}.json` | **fail loud** | **fail loud** |
| `articles/**`（該課用到者） | **fail loud** | **fail loud** |

> 壞檔 MUST NOT 被當成缺席靜默略過——否則一個打錯字的 JSON 會讓整個段落無聲消失。

---

## §2 各 Session 類型的組裝規則

### `concept`

| Lesson 欄位 | 來源 |
| --- | --- |
| `concept.*` | `deps.readArticle(ConceptNode.articlePath)` 解析結果 + frontmatter |
| `color` | Module 配色表（Compiler 側常數，Renderer 不查表） |
| `problems` | 課表 `problemIds` → Problem Bank metadata；`whyThisPattern` / `hint` 取自本篇 `Today's Challenge` |
| `path` | DAG：`prev` = `prerequisite` 中 `ordinalOf` 最大者；`next` = `next` 中最小者 |
| `overlayNotes` | Overlay `byConcept[conceptId].extraNotesMarkdown`（**Overlay 唯一被消費的欄位**） |

- 課表 `problemIds` 缺席或空 ⇒ `problems: []`（無題目觀念課為一等合法，F3 定案）。
- **Compiler MUST NOT 消費 Overlay `extraProblemIds`**：該加題已於 F4 `generate-schedule.ts` 套入課表並凍結
  （research R6、`docs/spec.md` §16.3）。`Lesson.problems` 的題號序 MUST **完全等於**課表 `problemIds`——
  Compiler 不增、不刪、不重排。
- **Compiler MUST NOT 截斷題目**：每 Session ≤3 題的上限由生成端保證（`docs/spec.md` §13.4）；課表若超標，
  由 Gate 的 `problems.count` 兜底回報，處置是修生成器重跑。

### `practice` / `challenge`

| Lesson 欄位 | 來源 |
| --- | --- |
| `problems` | 課表 `problemIds` → Problem Bank；`whyThisPattern` / `hint` 經 `ProblemOrigin` 反查引入該題的 Concept Article |
| `color` | 中性色（無單一 Module） |

- 反查不到來源 ⇒ 該題省略 `whyThisPattern` / `hint`，**不失敗**（spec FR-030）。「反查不到來源」MUST 涵蓋
  **兩種狀態且走同一分支**：(a) `ProblemOrigin` 無此題號；(b) 反查到 `conceptId`、但該 Article 的
  `Today's Challenge` 無此題號條目（反查表建自 `ConceptNode.leetcode` 全集，條目只涵蓋課表排入的題號）。
- `problemIds` 缺席 ⇒ `problems: []`，仍產出可推播的版面。
- **Compiler MUST NOT 為 challenge 重新選題**：選題已於 F4 生成階段凍結（research R6）。

### `review`

| Lesson 欄位 | 來源 |
| --- | --- |
| `reviewConcepts` | 課表 `reviewRange = [start, end]` 內全部 `concept` Session 的 `{ id, title }`，依 `sessionIndex` 遞增 |
| `problems` | 課表該 Session 的 `problemIds`（目前 F4 未為 review 選題 ⇒ 空） |
| `reflectionQuestion` | F8 素材；缺席即省略 |

- `reviewRange` 缺席、或範圍內無任何 `concept` Session ⇒ **fail loud**（課表缺陷，F4 已有
  `review-coverage-gap` 於生成側把關，此為第二道防線）。

### `rest`

| Lesson 欄位 | 來源 |
| --- | --- |
| `encouragement` | F8 素材；缺席即省略 |
| `problems` | 恆為 `[]` |

---

## §3 `Lesson` 介面

見 [data-model.md §2](../data-model.md#2-lessonsrctypeslessonts)。契約重點：

- `Lesson` 是 **Compiler → Renderer 的唯一介面**。新增 delivery（Telegram / Email / Web）只需新增
  Renderer，不動上游。
- Renderer MUST 只依賴 `Lesson`；`Lesson` 內 MUST NOT 出現檔案路徑以外的來源引用，
  也 MUST NOT 出現需要 Renderer 再查表才能顯示的代碼（例如 Module id）。
- `Lesson.track` **只是資料**：Renderer MUST NOT 依它改變版面結構。

---

## §4 錯誤契約（`compile` 拋出的訊息 MUST 指名）

| 情境 | 訊息要件 |
| --- | --- |
| `sessionIndex` 超出課表 | track、sessionIndex、課表長度 |
| `conceptId` 不在 DAG | track、sessionIndex、conceptId |
| Article 檔案不存在／不可讀 | articlePath、底層錯誤訊息 |
| Article 區塊／欄位缺漏 | 區塊或欄位名稱、articlePath |
| Article `id` 與 `conceptId` 不符 | 兩者 |
| 課表題號在 Article 條目中缺漏 | track、sessionIndex、題號 |
| 題號不在 Problem Bank | 題號（沿用 F3 `problem.ts` 既有錯誤，不另定義） |
| `review` 缺 `reviewRange` 或範圍內無 concept | track、sessionIndex、範圍 |
| Overlay 指向該 Track 未涵蓋的 Concept | track、conceptId |

> **題數守門的兩個層級（本 Feature 皆不重做）**：
> - **Concept 宣告的 `leetcode` ≤3**：權威點在 `src/compiler/problem.ts` 的 `problem-count-range`（F3 定案）。
> - **課表單一 Session 的 `problemIds` ≤3**：權威點在 `generate-schedule.ts`（取前 3 題）+
>   `validateSchedule` 的 `session-problem-overflow`（F4／F5 定案 2026-07-23，`docs/spec.md` §13.4）。
>
> 本 Feature MUST NOT 另行定義題數的錯誤型態與訊息，也 MUST NOT 以截斷「修正」超標課表。
