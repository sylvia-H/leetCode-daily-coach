# Contract: `curriculum/modules.json`（Curriculum 骨架）

**角色**：課程 Module→Topic 骨架的**手寫來源真相**（§8.1）。Deterministic、版本控制、順序凍結。
**消費者**：`loadCurriculum()`（建圖 / 參照完整 / 前向依賴全序）；未來 F5 Compiler、F7 Gate。
**非生成物**：與 `schedules/*.json`（MUST NOT 手寫）不同，`modules.json` 是授權手寫的骨架。

## 結構

```jsonc
{
  "version": 1,
  "modules": [
    {
      "id": "programming-mindset",   // kebab-case、全域唯一
      "title": "Programming Mindset",
      "level": 0,                     // MUST == 陣列索引
      "topics": [
        // 主 Topic 沿用 Module id（命名慣例，clarify 2026-07-21）→ concepts/programming-mindset/
        { "id": "programming-mindset", "title": "Programming Mindset" }
      ]
    },
    {
      "id": "array",
      "title": "Array",
      "level": 1,
      "topics": [
        { "id": "array", "title": "Array" },            // 主 Topic → concepts/array/
        { "id": "prefix-sum", "title": "Prefix Sum" }   // 細分後增列 → concepts/prefix-sum/
      ]
    }
    // … Level 2–15（Hash Table、String、Two Pointer、Binary Search、Sliding Window、
    //   Stack、Queue、Linked List、Tree、Graph、Heap、Backtracking、DFS/BFS、DP）
  ]
}
```

## 規則（schema + 骨架驗證）

| # | 規則 | 違規 rule |
|---|---|---|
| M1 | `version` 為整數 | `schema-type` |
| M2 | `modules` 長度 = 16（Level 0–15，clarify Q1） | `skeleton-shape` |
| M3 | 每個 `module.id` / `topic.id` 為 kebab-case | `schema-id-format` |
| M4 | `module.id` 全域唯一；`topic.id` **跨全部 Module 全域唯一**。**`module.id` 與 `topic.id` 分屬不同識別空間**——主 Topic 與其 Module 同名（如 module `array` + topic `array`）**MUST NOT** 被判為重複（FR-002） | `duplicate-id`（`field` = `module` / `topic`） |
| M5 | `module.level` 為 0–15 整數且**等於陣列索引**（宣告序 = level） | `skeleton-shape` |
| M6 | 每個 module 至少 1 個 topic | `skeleton-shape` |
| M7 | `title` 皆非空字串 | `skeleton-shape` |

> **`skeleton-shape` vs `granularity-range`（定案 2026-07-22，FR-001c）**：M2 / M5 / M6 / M7 屬**骨架結構
> 錯誤**，走 `skeleton-shape`（`error`、**不受 `mode` 影響**）。`granularity-range` 專指 **Concept 數量**
> 是否落在 §8.1 範圍（依 `mode` 區分下限強制層級）。兩者分離，下游才能區分「骨架壞掉」與
> 「stub 階段內容尚未填滿」。

## 命名慣例（clarify 2026-07-21）

- 每個 Module 的**第一個（主）Topic id 沿用該 Module 的 id**，對應資料夾 `concepts/{module-id}/`。
  依據 `docs/spec.md` §8.4（`concepts/two-pointer/001-…`）與 §10.1（`module: two-pointer / topic: two-pointer`）
  的既有慣例。
- 僅在該 Module 的 Concept 需再細分時，才於主 Topic 之後**增列**其他 Topic id（如 `prefix-sum`）。
- 增列的 Topic id 仍受 M3（kebab-case）與 M4（跨 Module 全域唯一）約束。

## 順序語意（前向依賴全序的骨架部分，R7）

- Module 宣告序 = 陣列索引 = `level`。
- Topic 宣告序 = 該 module `topics` 陣列索引。
- 全序 `ordinal(concept)` = (moduleIndex, topicIndex-in-module, 檔名 NNN, id)。

## 凍結紀律

- **Module 順序嚴格凍結**（Deterministic Curriculum，憲章 IV）。
- Topic 清單為 F2 骨架；F7 若需在**不改 Module 順序**下微調 Topic，走「改 curriculum → 重跑驗證 →
  review diff → commit」（research R6）。MUST NOT 於 runtime 變更。
