# Contract: Full Article 固定區塊格式（解析器輸入契約）

**Feature**: 001-walking-skeleton | **生產者**: 本 Feature 為人工手寫；F7 起由 LLM 產線生成
**消費者**: `src/compiler/content.ts`

本契約定義 `articles/**/*.md` 的檔案結構。它是 `docs/spec.md` §10 的**落地格式**——§10 規定「有哪些
固定區塊」，本契約規定「這些區塊在檔案裡長什麼樣、解析器怎麼認」。

> **穩定性承諾**：本格式為 F5（完整解析）與 F7（產線生成）的共同目標格式。F1 只**解析其中一部分**，
> 但檔案 MUST 一次寫齊全部區塊——否則 F7 的產線與 F5 的 Gate 需要一套過渡格式。

---

## 1. 檔案結構

```markdown
<!-- F1 手寫種子內容；F7 內容產線上線後由生成物取代 -->
---
id: left-right-pointer
title: Left-Right Pointer
module: two-pointer
pattern_label: Two Pointer
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能描述左右指標的移動條件
  - 能辨識「已排序 + 找一對」的適用時機
  - 能分析時間 / 空間複雜度
  - 能完成至少一題 Easy
---

## Concept
（閱讀用；F1 不解析）

## Thinking
## Pattern Recognition
## Common Mistakes
## Complexity
## TypeScript Corner
## Python Corner
## Today's Challenge
## Tomorrow Preview

## Digest
（推播用；F1 解析）

## TypeScript Tip
## Python Tip
## Takeaway
```

---

## 2. Frontmatter 欄位

以 `gray-matter` 解析。**frontmatter 鍵一律 snake_case**（`docs/spec.md` §10.1 慣例）；
`ArticleMeta` / `Lesson` 的 TypeScript 欄位為 camelCase，對應由 `content.ts` 明確轉換。

| frontmatter 鍵 | → TS 欄位 | 型別 | 用途 |
|---|---|---|---|
| `id` | `id` | string | conceptId；MUST 與請求的 `SessionPlan.conceptId` 相符 |
| `title` | `title` | string | 主 Embed 標題 |
| `module` | `module` | string | 決定 embed 顏色（Module 色表，位於 `compiler/`） |
| `pattern_label` | `patternLabel` | string | 主 Embed 的 `Pattern` field |
| `complexity_label` | `complexityLabel` | string | 主 Embed 的 `複雜度` field |
| `estimated_minutes` | `estimatedMinutes` | number | 主 Embed 的 `預估時間` field |
| `exit_criteria` | `exitCriteria` | string[] | 收尾 Embed 的 checklist；SHOULD ≤ 6 條、每條 ≤ 60 字元 |

**驗證規則（FR-004b）**：
- 上述欄位缺失或為空 → 拋出**指名該欄位**的錯誤，該 Track 失敗
- **MUST NOT** 做型別 / 值域 schema 驗證（zod 屬 F2）——只檢查「存在且非空」
- 檔案中 MAY 含 §10.1 的其他欄位（`difficulty` / `prerequisite` / `next` / `leetcode` / `tags` …），
  本 Feature **忽略**它們，MUST NOT 因其存在或缺失而失敗

> **跨 Feature 決策（已回寫真實來源）**：`pattern_label` / `complexity_label` 原不在 `docs/spec.md`
> §10.1 的 frontmatter 範例中，但 §16.4 的 `Lesson` 需要這兩個短標籤。定為 frontmatter 欄位而非從
> `Complexity` 區塊正文推導——正文是給人讀的散文，啟發式抽取違反確定性原則。此決策影響 F2 的 schema
> 與 F7 的產線，已於 2026-07-20 寫入 `docs/spec.md` §10.1。

---

## 3. 區塊解析規則

### 邊界認定

- 區塊由 **`## ` 開頭的第二層 heading** 界定；區塊內容為「該 heading 之後、下一個第二層 heading 之前」的
  **原始 markdown**。
- 解析 MUST 走 `marked` 的 **lexer token**，**MUST NOT 用 regex 逐行比對**——TypeScript / Python 區塊
  必含 fenced code block，其中的 `## ` 字樣會讓 regex 誤判區塊邊界（research R1）。
- 區塊名稱以 heading 文字**去除前後空白後精確比對**（大小寫敏感）。
- 內容 MUST `trim()` 前後空行後保留內部的 markdown 原文（含 fenced code block、粗體、清單、遮罩連結）。

### 本 Feature 的解析範圍（FR-004a）

| 區塊 | F1 解析？ | 去向 |
|---|---|---|
| `Digest` | ✅ **必要** | 主 Embed 的 `description` |
| `TypeScript Tip` | ✅ **必要** | 主 Embed 的 `TypeScript Tip` field |
| `Python Tip` | ✅ **必要** | 主 Embed 的 `Python Tip` field |
| `Takeaway` | ✅ **必要** | 收尾 Embed 的 `💡 Takeaway` field |
| `Concept` / `Thinking` / `Pattern Recognition` / `Common Mistakes` / `Complexity` / `TypeScript Corner` / `Python Corner` / `Today's Challenge` / `Tomorrow Preview` | ❌ 不解析 | MUST 存在於檔案，F5 起解析 |

**驗證規則**：
- 四個「必要」區塊中任一缺失或內容為空 → 拋出**指名該區塊**的錯誤，該 Track 失敗（FR-004b）；
  **MUST NOT** 以空字串或預設值靜默帶過
- 本 Feature **MUST NOT** 驗證「不解析」區塊是否存在——那是 F5 的 Gate 職責。
  （教材檔仍應寫齊，但這是內容規範，不是 F1 解析器的檢查項）
- 出現未知的第二層 heading → **忽略**，MUST NOT 失敗（保留 F5 擴充空間）

---

## 4. 字元預算（生產側約束）

教材撰寫時 MUST 使推播用區塊落在 `docs/spec.md` §14.5 預算內（FR-001），否則 render 後會被
`renderer/budget.ts` 擋下：

| 區塊 | 預算 |
|---|---|
| `Digest` | ≤ 900 |
| `TypeScript Tip` | ≤ 450（含程式碼區塊） |
| `Python Tip` | ≤ 450（含程式碼區塊） |
| `Takeaway` | ≤ 120 |
| `exit_criteria`（全部合計） | ≤ 400（≤ 6 條、每條 ≤ 60） |

> 此處為**教材端**的預算。渲染後還會加上 heading、emoji 與版面文字，實際檢查以
> [discord-embed-contract.md](./discord-embed-contract.md) 的 render 結果為準。

---

## 5. 本 Feature 的實例

單一檔案：`articles/two-pointer/002-left-right-pointer.md`

- `id: left-right-pointer`，三個 Session 共用（spec Assumptions）
- 對應題目由 `data/problem-bank.json` 的 `conceptProblems["left-right-pointer"]` 決定，
  **不**由本檔的 frontmatter `leetcode` 欄位決定（FR-003：題目資料由程式從資料來源帶入）
