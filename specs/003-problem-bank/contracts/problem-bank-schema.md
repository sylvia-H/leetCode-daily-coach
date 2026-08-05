# Contract: `data/problem-bank.json` Schema

**權威來源**：`docs/spec.md` §12.1、§26.1／§26.2。此契約以 `zod` 於載入時強制（違反 → `Violation`）。

## 1. 根結構

- 型別：JSON 物件，**key = LeetCode 題號的十進位字串**（如 `"26"`），**value = ProblemMeta**。
- 空物件 `{}` 合法（空題庫）。
- 允許以 `_comment`（底線前綴）攜帶說明；載入器 MUST 忽略底線前綴 key，不視為題目。

## 2. ProblemMeta 欄位

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `id` | number（整數） | ✅ | MUST == `Number(key)`（FR-003） |
| `slug` | string（非空） | ✅ | MUST == 從 `url` 擷取之 slug（FR-005） |
| `title` | string（非空） | ✅ | 官方標題 |
| `url` | string（非空） | ✅ | MUST 形如 `https://leetcode.com/problems/{slug}/` |
| `difficulty` | `"Easy" \| "Medium" \| "Hard"` | ✅ | 值域外 → `difficulty-range`（FR-002） |
| `patterns` | string[]（非空） | ✅ | 每項 ∈ {Topic id ∪ Concept id}；空陣列 → `patterns-empty`（FR-006） |
| `keywords` | string[] | — | 提供時驗型別 |
| `review_priority` | `"high" \| "medium" \| "low"` | — | 提供時值域外 → `review-priority-range` |
| `estimated_minutes` | number | — | 提供時驗型別 |
| `lists` | string[] | — | 經典題單標籤 |
| `companies` | string[] | — | 提供時驗型別 |

**MUST NOT** 出現任何題目敘述／內容欄位（如 `description`、`whyThisPattern`、`hint`）——FR-004 / §5。
未知欄位處理：以 zod `.strict()`（或等價）**拒絕未知欄位（一律 `error`）**，避免任何內容欄位悄悄混入；此規則與 tasks T008 對齊（FR-004、§5）。

## 3. url ↔ slug 一致性（FR-005）

擷取規則：對 `url` 比對 `^https?://leetcode\.com/problems/([^/]+)/?$`，capture group == `slug`。
無法擷取（非 LeetCode 網域、缺 `/problems/{slug}/` 結構）或不相等 → `slug-url-mismatch` error（避免死鏈）。

## 4. Seed 資料集（F3 交付）

涵蓋 F2 stub Concept 引用題號 + F1 walking-skeleton demo；難度僅 Easy/Medium（Hard 延到 F7，clarify 2026-07-22）。

| key | slug | difficulty | patterns（示例，指向既有 Topic/Concept id） | 來源 |
| --- | --- | --- | --- | --- |
| `1` | two-sum | Easy | `["array","hash-table"]` | array-traversal |
| `26` | remove-duplicates-from-sorted-array | Easy | `["array","in-place-operations"]` | in-place-operations |
| `27` | remove-element | Easy | `["array","in-place-operations"]` | in-place-operations |
| `283` | move-zeroes | Easy | `["array","in-place-operations"]` | in-place-operations |
| `303` | range-sum-query-immutable | Easy | `["array","prefix-sum"]` | prefix-sum |
| `560` | subarray-sum-equals-k | Medium | `["array","prefix-sum"]` | prefix-sum |
| `11` | container-with-most-water | Medium | `["two-pointer"]` | F1 demo |
| `125` | valid-palindrome | Easy | `["two-pointer"]` | F1 demo |
| `167` | two-sum-ii-input-array-is-sorted | Medium | `["two-pointer"]` | F1 demo |

> `array-traversal.leetcode = [1, 26]`、`in-place-operations = [27, 283]`、`prefix-sum = [303, 560]`
> （見 `concepts/**` frontmatter）。上表 `patterns` 為示意；實作以真實 Topic/Concept id 標記且通過 `dangling-pattern` 檢查即可。
> **難度覆蓋**：Easy ✅、Medium ✅（560/11/167）、Hard ⏳ 延到 F7。

## 5. 確定性（FR-012 / SC-007）

同一份題庫檔重複載入 + 驗證 + 查找，輸出（違規清單、前向/反向查找結果）MUST 逐次一致；
反向查找排序鍵 = 題號 `id` 升冪（見 `problem-module-api.md`）。
