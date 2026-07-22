# Contract: Concept Frontmatter Schema（§10.1）

**角色**：`concepts/{topic}/{NNN}-{slug}.md` 的 YAML frontmatter 契約。以 `conceptFrontmatterSchema`
（zod）驗證。**消費者**：`loadCurriculum()`（建 `ConceptNode`）；F5 Compiler；F7 Stage 1 結構 Gate。
**解析範圍**：F2 只讀 frontmatter（`gray-matter`），**不解析正文 / Author Hints**（F5）。

## 範例（合法）

```yaml
---
id: left-right-pointer
title: Left-Right Pointer
module: two-pointer          # MUST 存在於 modules.json（Level=Module，clarify Q2）
topic: two-pointer           # 主 Topic 沿用 Module id（命名慣例，clarify 2026-07-21）；
                             # MUST 屬於 module two-pointer，且 == 檔案所在資料夾名
                             # → 檔案位於 concepts/two-pointer/002-left-right-pointer.md（§8.4）
difficulty: easy             # easy | medium
estimated_minutes: 10        # 正整數
pattern_label: Two Pointer   # MUST 由 frontmatter 提供
complexity_label: O(n) / O(1)
prerequisite: [array-traversal]
next: [fast-slow-pointer]
learning_goal:
  - 理解左右指標的用途
exit_criteria:
  - 能描述此 Pattern
  - 能分析時間 / 空間複雜度
leetcode: [26, 27, 167]      # 正整數；存在性延後 F3
tags: [array, two-pointer]
---
```

## 欄位規則

| 欄位 | 型別（zod） | 規則 | 違規 rule |
|---|---|---|---|
| `id` | `string` | `KEBAB_SLUG`、全域唯一、穩定 | `schema-id-format` / `duplicate-id` |
| `title` | `string().min(1)` | 非空 | `schema-missing-field` |
| `module` | `string` | 存在於 `modules.json` | `dangling-ref` |
| `topic` | `string` | 存在、屬於 `module`、== 資料夾名（主 Topic 沿用 Module id） | `dangling-ref` |
| `difficulty` | `enum(['easy','medium'])` | 值域 | `schema-type` |
| `estimated_minutes` | `number().int().positive()` | 正整數 | `schema-type` |
| `pattern_label` | `string().min(1)` | 非空、frontmatter 提供 | `schema-missing-field` |
| `complexity_label` | `string().min(1)` | 非空、frontmatter 提供 | `schema-missing-field` |
| `prerequisite` | `array(slug)` | 元素為 slug、參照存在 | `schema-type` / `dangling-ref` |
| `next` | `array(slug)` | 元素為 slug、參照存在 | `schema-type` / `dangling-ref` |
| `learning_goal` | `array(string.min(1)).min(1)` | 非空陣列 | `schema-missing-field` |
| `exit_criteria` | `array(string.min(1)).min(1)` | 非空陣列（僅結構；字數/條數屬 F5/F7） | `schema-missing-field` |
| `leetcode` | `array(number().int().positive())` | 正整數陣列（格式）；存在性延後 F3 | `leetcode-format` |
| `tags` | `array(string)` | 可空 | `schema-type` |

## 錯誤回報語意（fail loud，FR-008）

- 以 `safeParse` 收集**全部** issue（不遇錯即停）；每個 issue 轉為具名 `Violation`
  （`subject` = concept id 或檔案路徑、`field` = zod `path`）。
- MUST NOT 以空值 / 預設值靜默通過任一缺失欄位。

## 未納入 F2（延後）

- `leetcode` 題號**存在性**（→ F3，可插拔 `problemExists`）。
- `exit_criteria` 條數 ≤ 6 / 每條 ≤ 60 字元（→ 內容 Gate，F5 / F7）。
- 正文固定區塊（Digest / Tips / Corner …）的存在與解析（→ F5）。
