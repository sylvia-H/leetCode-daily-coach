# Phase 1 Data Model: Curriculum Schema（F2）

型別集中於 `src/types/curriculum.ts`；schema 於 `src/compiler/schema.ts`（`zod`）；建圖 / 驗證於
`src/compiler/curriculum.ts`。以下為概念模型與驗證規則，欄位對齊 `docs/spec.md` §8.1 / §10.1 / §16.1。

---

## 1. Curriculum Skeleton（`curriculum/modules.json`）— 手寫來源真相

完整 16-Level 的 Module→Topic 骨架（不含 Concept 清單）。宣告順序即凍結的課程地圖與前向依賴全序的骨架部分。

| 欄位 | 型別 | 規則 |
|---|---|---|
| `version` | number | schema 版本（起始 `1`） |
| `modules` | `ModuleSkeleton[]` | **順序即 Level 遞增**；長度 = 16（Level 0–15，clarify Q1） |

### `ModuleSkeleton`

| 欄位 | 型別 | 規則 |
|---|---|---|
| `id` | string | kebab-case、全域唯一（FR-002）。例：`programming-mindset`、`array`、`two-pointer` |
| `title` | string | 顯示名，非空。例：`Two Pointer` |
| `level` | number | 0–15，整數，**MUST 等於陣列索引**（防呆：宣告序 = level） |
| `topics` | `TopicSkeleton[]` | 至少 1 個；順序即 Module 內 Topic 宣告序 |

### `TopicSkeleton`

| 欄位 | 型別 | 規則 |
|---|---|---|
| `id` | string | kebab-case、**全域唯一**（跨 Module；作為 `concepts/{topic}/` 資料夾名，§26.1） |
| `title` | string | 顯示名，非空 |

> **對應決策**：Level = Module（clarify Q2）。`concepts/{topic}/` 資料夾對應某 Module 下的一個 Topic。
>
> **命名慣例（clarify 2026-07-21）**：每個 Module 的**第一個（主）Topic id 沿用該 Module 的 id**
> （例：Module `two-pointer` 的主 Topic 即 `two-pointer`，對應 `concepts/two-pointer/`，與 `docs/spec.md`
> §8.4 / §10.1 既有範例一致）；需再細分時才增列其他 Topic id。`module.id` 與其主 `topic.id` 同名
> **不構成** `duplicate-id`——兩者屬不同層級的識別空間（FR-002）。

---

## 2. Concept Frontmatter（`concepts/{topic}/{NNN}-{slug}.md` 的 YAML）— §10.1

`conceptFrontmatterSchema`（zod）驗證下列欄位。**全部為 MUST（除標註選填者）**；違反 → 具名 `Violation`。

| 欄位 | 型別 | 值域 / 規則 |
|---|---|---|
| `id` | string | kebab-case slug（`KEBAB_SLUG`）、**全域唯一**、穩定（FR-005） |
| `title` | string | 非空 |
| `module` | string | MUST 存在於 `modules.json` 的某 `ModuleSkeleton.id`（參照完整，FR-013） |
| `topic` | string | MUST 存在，且 MUST 屬於 `module` 下（FR-013）；MUST 等於檔案所在資料夾名 |
| `difficulty` | enum | `'easy' \| 'medium'`（FR-006；§10.1） |
| `estimated_minutes` | number | 正整數（`z.number().int().positive()`，FR-006） |
| `pattern_label` | string | 非空、**MUST 由 frontmatter 提供**（FR-007，MUST NOT 由正文推導） |
| `complexity_label` | string | 非空、**MUST 由 frontmatter 提供**（FR-007） |
| `prerequisite` | string[] | Concept id 陣列（可空陣列）；每個 id MUST 存在（FR-013）；元素為 slug |
| `next` | string[] | Concept id 陣列（可空陣列）；每個 id MUST 存在（FR-013） |
| `learning_goal` | string[] | 非空字串陣列 |
| `exit_criteria` | string[] | 非空字串陣列（F2 只驗結構；條數 / 字數預算屬 F5/F7 內容 Gate） |
| `leetcode` | number[] | **正整數**題號陣列（格式，FR-023）；存在性延後 F3（可插拔 `problemExists`） |
| `tags` | string[] | 字串陣列（可空） |

> `pattern_label` / `complexity_label` 由 Compiler 原樣帶入 `Lesson`（§16.4），F2 只保證其存在且非空。

---

## 3. In-memory 節點與圖（`src/types/curriculum.ts`）

### `ConceptNode`（對齊 §16.1）

```
id, title, module, topic,
difficulty: 'easy' | 'medium',
estimatedMinutes: number,
patternLabel: string, complexityLabel: string,
prerequisite: string[], next: string[],
learningGoal: string[], exitCriteria: string[],
leetcode: number[], tags: string[],
localOrder: number,        // 檔名 NNN（Topic 內排序；R3/R7）
skeletonPath: string,      // concepts/{topic}/{NNN}-{slug}.md（F2 填）
articlePath: string        // articles/{topic}/{NNN}-{slug}.md（推導；F5 讀）
```

### `CurriculumGraph`

```
modules: ModuleNode[]                 // 保序（宣告序）
topics: Map<topicId, TopicNode>       // 附 moduleId、宣告索引
concepts: Map<conceptId, ConceptNode> // 建立時偵測 id 碰撞
ordinalOf: Map<conceptId, number>     // 前向依賴全序（R7）
topoOrder?: string[]                   // 驗證通過時的 canonical 拓樸序
```

### `ModuleNode` / `TopicNode`

`ModuleNode` = `ModuleSkeleton` + `moduleIndex`（宣告序）+ 其 Topic 節點。
`TopicNode` = `TopicSkeleton` + `moduleId` + `topicIndex`（Module 內宣告序）。

---

## 4. 驗證結果（`ValidationResult` / `Violation`）

```
ValidationResult = {
  ok: boolean,                     // 無 error 級 violation 即 true
  violations: Violation[],         // 穩定排序（R5）
  topoOrder?: string[],            // ok 時的 canonical 拓樸序（FR-011）
  skipped: SkippedCheck[]          // 例：leetcode 存在性 deferred-to-F3（FR-023）
}

Violation = {
  rule: ViolationRule,             // 見下表
  severity: 'error' | 'warning',
  subject: string,                 // 違規主體：conceptId / moduleId / topicId / 檔案路徑
  field?: string,                  // 違規欄位（schema 類）
  target?: string,                 // 關聯對象：例前向依賴 / 懸空參照的目標 id
  message: string                  // 人可讀、具名（fail loud）
}
```

### `ViolationRule`（規則枚舉；每一類至少一個單元測試 — SC-002 / SC-003 / SC-004）

| rule | severity | 觸發 | 需求 |
|---|---|---|---|
| `schema-missing-field` | error | frontmatter 缺必要欄位 | FR-004 / FR-008 |
| `schema-type` | error | 型別 / 值域錯（如 `difficulty` 非法、`estimated_minutes` 非正整數） | FR-006 |
| `schema-id-format` | error | `id` 非 kebab-case slug | FR-005 |
| `leetcode-format` | error | `leetcode` 非正整數陣列 | FR-023 |
| `dangling-ref` | error | `prerequisite`/`next`/`module`/`topic` 參照不存在 | FR-013 |
| `dangling-leetcode` | error | `leetcode` 題號不存在於 Problem Bank（**僅在提供 `problemExists` 時觸發**；F2 缺省下列入 `skipped`） | FR-023 |
| `cycle` | error | 依賴成環 | FR-012 |
| `self-dependency` | error | Concept 依賴自己 | FR-012 |
| `forward-dependency` | error | `prerequisite` 指向宣告序上晚於自己者 | FR-014 / FR-015 |
| `orphan` | error | 非合法起點（= Level 0 Module 內、各 Topic 檔名 `NNN` 最小者）且無 prerequisite 又不被任何 next 提及 | FR-016 |
| `edge-inconsistency` | error | `next`/`prerequisite` 雙向不一致（FR-017 定案；不自動補齊） | FR-017 |
| `duplicate-id` | error | **識別碼重複，涵蓋三種主體**：Concept `id` 全域重複、`module.id` 全域重複、`topic.id` 跨 Module 重複（`module.id` 與其主 `topic.id` 同名**不**觸發——不同識別空間，FR-002）。`subject` 為重複的 id，`field` 標示主體種類（`concept` / `module` / `topic`） | FR-002 / FR-020 |
| `granularity-range` | error | **Concept 數量**超出 §8.1 **閉區間**範圍（Topic / Module / 總數；依 `mode` 區分下限強制層級）。**僅限數量語意**，骨架自身結構錯誤不走此類別 | FR-019 / FR-021 |
| `skeleton-shape` | error | **骨架結構錯誤**：`modules` 陣列長度非 16、`module.level` ≠ 陣列索引、某 module 無任何 topic、`title` 為空。**不受 `mode` 影響**（骨架一次定稿，任何模式皆強制） | FR-001c |
| `empty-curriculum` | error | Concept 集合為空（**`stub` / `full` 兩模式皆強制**）。**`concepts/` 目錄不存在與目錄為空同屬此類別**，`message` 須區分兩者以利排錯 | FR-010a |
| `duplicate-edge` | warning | 同一 Concept 的 prerequisite/next 重複 id（去重後續行） | FR-018 |

> `ok` 僅由 `error` 級決定；`warning`（如 `duplicate-edge`）回報但不使 `ok=false`。

---

## 5. 驗證選項（`ValidateOptions`）

```
mode: 'stub' | 'full'                     // 預設 'stub'（R8）
problemExists?: (leetcodeId: number) => boolean   // 缺省 → leetcode 存在性列入 skipped（FR-023）
```

| mode | 下限類（總數≥150 / Module≥10 / Topic≥5） | 上限 + 唯一性（Topic≤12 / Module≤30 / id 唯一） | `empty-curriculum` | `skeleton-shape` |
|---|---|---|---|---|
| `stub` | 略過（空 Module/Topic 不報錯） | 強制 | **強制** | **強制** |
| `full` | 強制（F7 / CI） | 強制 | **強制** | **強制** |

> **閉區間（FR-019）**：全部門檻皆含端點——Topic 恰 5 或恰 12、Module 恰 10 或恰 30、總數恰 150
> **MUST 判為通過**；僅超出端點才報 `granularity-range`。
>
> **`empty-curriculum` 不受 mode 影響**（FR-010a）：「數量不足」（下限類，stub 豁免）與「完全沒有課程」
> 是兩件事，後者兩模式皆為 error。
>
> **`skeleton-shape` 亦不受 mode 影響**（FR-001c）：骨架是**一次定稿的地圖**，stub 階段只是「Concept 還沒填」，
> 不代表骨架可以殘缺。把它與 `granularity-range` 分開，下游才能區分「骨架壞掉」（必須修）與
> 「內容尚未填滿」（stub 階段的正常中間態）。

---

## 6. 關鍵不變量（Invariants）

- **確定性**：給定同一 `modules.json` + `concepts/**` + `options`，`ValidationResult`（含 `violations` 排序
  與 `topoOrder`）逐次逐字元一致（FR-025 / SC-005）。
- **單一實作**：schema + 建圖 + 全部規則僅一份，`validateCurriculum` 為唯一入口；F5 runtime Compiler 與
  F7/CI Gate 皆呼叫之（FR-022 / FR-024）。
- **職責分層（定案 2026-07-22，FR-013）**：`loadCurriculum` **只做讀檔 + `gray-matter` + `zod` schema**，
  只產出 schema 類 violation（`schema-*` / `leetcode-format` / `skeleton-shape`）；**全部參照完整性**
  （`module` / `topic` / `topic` == 資料夾名 / `prerequisite` / `next` → `dangling-ref`）與其餘圖層規則
  一律由 `validateCurriculum` 負責。載入階段 MUST NOT 出現第二份參照檢查（SC-007）。
- **自足**：無 `problemExists` 時仍能完成驗證（leetcode 存在性列 `skipped`），不因缺題庫 fail（FR-026 / FR-023）。
- **fail loud**：任一 error 級 violation ⇒ `ok=false` ⇒ CLI 入口 `exit(1)`；MUST NOT 靜默預設值（FR-008）。
