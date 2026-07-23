# Contract: Discord Renderer 與字元預算

**Feature**: `005-lesson-compiler` | **Supersedes**: `specs/001-walking-skeleton/contracts/discord-embed-contract.md`
**權威來源**: `docs/spec.md` §14.1–§14.6；憲章 XI / XII

---

## §1 對外 API

```ts
function render(lesson: Lesson): RenderedMessage[];   // src/renderer/discord.ts
function checkBudget(message: RenderedMessage): BudgetReport; // src/renderer/budget.ts
```

**不變式（MUST）**：

1. `render` 為 **stateless 純函式**：同一 `Lesson` → deep-equal 的結果；無 I/O、無時間、無亂數。
2. `src/renderer/**` **只允許 `import type`**（`src/types/lesson.ts`）。MUST NOT import Curriculum、
   Problem Bank、state、`node:fs` 或任何 Compiler 模組（以 import 掃描測試守住）。
3. 版面分派**只依 `lesson.type`**；`lesson.track` MUST NOT 影響結構、順序或欄位數。
4. 顏色一律取 `lesson.color`；Renderer **不查任何對照表**、不認得 Module。
5. `budgetSlots` 的每個值 MUST 是放進 `embeds` 的**同一份字串實例**。
6. `checkBudget` 是**唯一**的限制檢查函式，於**同一次呼叫**中同時檢查逐區塊預算、結構性上限與總量
   （F1 定案）。Gate 與 runtime MUST 共用它。

---

## §2 版面（依 `lesson.type`）

### `concept`（`docs/spec.md` §14.2）

| Embed | 內容 |
| --- | --- |
| 主 Embed | `title`：`📚 Session {n} · {concept.title}`；`description`：Digest；`fields`：`Pattern`(inline) / `複雜度`(inline) / `預估時間`(inline) / `TypeScript Tip` / `Python Tip` |
| 題目 Embed | `title`：`🎯 Today's Challenge`；逐題 `• [{id}. {title}]({url})` + 換行縮排 `{difficulty} · {whyThisPattern}` + `· Hint: {hint}`。**`problems` 為空時整個 Embed 省略** |
| 附註 Embed | `title`：`📎 Track 補充`；`description`：`overlayNotes`。**無 overlayNotes 時省略** |
| 結尾 Embed | `fields`：`🧭 學習路徑` / `✅ Exit Criteria`（`- [ ]` checklist）/ `💡 Takeaway` |

觀念 MUST 先於題目（憲章 I）——順序寫死，資料不可翻轉。

### `practice`

單一 Embed：`title`：`🏋️ Session {n} · 練習`；`description`：固定提示文案（無題時仍非空）；
有題時題目清單以與 concept 相同的逐題格式呈現。

> **固定提示文案 = Renderer 版面文案，不是內容素材**：它是寫死在 Renderer 內、與任何 Concept／課表資料
> 無關的一句版面用語（如「今天不引入新觀念，把前面學過的 Pattern 拿出來練」）。它**不受**
> 「MUST NOT 憑空發明資料」約束——該約束針對的是課程資料（Concept 清單、題目、複習範圍）。
> 對照組：`practice` **MUST NOT** 推導「近期 Concept 清單」，因為課表未提供 practice 的涵蓋範圍欄位，
> 那才是憑空發明資料（research R5）。

### `challenge`

單一 Embed：`title`：`🔥 Session {n} · Challenge`；其餘同 `practice`。

### `review`（`docs/spec.md` §15）

單一 Embed：`title`：`🔁 Session {n} · 本週複習`；`fields`：

- `📚 本週涵蓋`：`reviewConcepts` 逐條列出（`- {title}`）。
- `🤔 Reflection`：`reflectionQuestion`——**缺席即省略此 field**（F8 前的常態，spec FR-031）。
- `🎯 Challenge`：`problems` 逐題——**空即省略此 field**（F4 尚未為 review 選題，research R7）。

### `rest`

單一 Embed：`title`：`😌 Session {n} · 休息日`；`description`：固定文案（本週回顧提示）；
`encouragement` 存在時另以一個 field 呈現，缺席即省略。

> **省略 ≠ 空字串**：任何缺席內容 MUST 讓對應的 embed / field **不存在**，MUST NOT 產生空字串、
> 佔位符或「（無）」之類的文案。

---

## §3 拆訊息 fallback（§14.5）

1. 先組成單一訊息（全部 embeds）。
2. 計數文字總和 ≤ 5,500 ⇒ 回傳 `[message]`。
3. 超過 ⇒ 依 **embed 邊界**切分：自第一個 embed 起累加，可容納者留在第 1 則，其餘**原序**進第 2 則，
   回傳 `[m1, m2]`。`budgetSlots` 隨其 embed 一併移動。
4. 最多 2 則。若第 2 則仍超限、或單一 embed 自身超過 5,500 ⇒ **不再切分**，交由 `checkBudget` 回報違規。
5. embed **內部不切分**（不拆 description、不拆 field）。
6. **MUST NOT 自動截斷**任何內容。

---

## §4 預算檢查

`checkBudget` 回傳：

```ts
interface BudgetItem { name: string; length: number; limit: number; over: boolean; }
interface BudgetReport { items: BudgetItem[]; total: number; totalLimit: 5500; hardLimit: 6000; ok: boolean; }
```

- 項目清單與上限見 [data-model.md §5](../data-model.md#5-renderedmessage--budgetslotssrctypeslessonts--srcrenderer)。
- **長度單位**：Unicode code point（`Array.from(s).length`），非 UTF-16 code unit。
- **計入總量**：每個 embed 的 `title` / `description` / 每個 field 的 `name` 與 `value` / `footer.text` /
  `author.name`。**不計入**：`url` / `color` 等非文字欄位。
- `ok === false` 即失敗；呼叫端 MUST NOT 因此截斷內容（§14.5）。
- `exitCriteria` 除總長 400 外，另檢查**條數 ≤ 6**與**每條 ≤ 60**（§10.2）。

---

## §5 對呼叫端的要求

- `src/main.ts`：`render` 回傳多則時 MUST **依序** post，且每則各自通過 `checkBudget` 才送出。
- `src/compiler/gate.ts`：對每則訊息各跑一次 `checkBudget`，任一 `ok === false` 即產生 `budget-over` 違規
  （逐項列出超限明細，不只回報一個布林）。
