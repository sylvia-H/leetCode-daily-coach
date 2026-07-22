# Phase 1 Data Model: Problem Bank

對齊 `docs/spec.md` §12.1（Problem Metadata）、§16（Data Model）、§26（Conventions）與本 Feature spec 的
FR / Key Entities。所有型別為 strict TypeScript，放 `src/types/problem.ts`（除標註沿用 F2 者）。

---

## 1. ProblemMeta（題庫條目｜參照 metadata）

一題 LeetCode 題目的**參照性 metadata**；MUST NOT 含任何題目敘述／內容欄位（FR-004、§5）。

```ts
export type Difficulty = "Easy" | "Medium" | "Hard";
export type ReviewPriority = "high" | "medium" | "low";

export interface ProblemMeta {
  // ── 必填（FR-001） ──
  id: number;             // LeetCode 題號；MUST 等於題庫 key 的數值（FR-003）
  slug: string;           // 非空；MUST 與 url 內 /problems/{slug}/ 一致（FR-005）
  title: string;          // 非空；官方標題
  url: string;            // 非空；https://leetcode.com/problems/{slug}/
  difficulty: Difficulty; // 恰為 Easy | Medium | Hard（FR-002）
  patterns: string[];     // 非空；每項 ∈ {Topic id} ∪ {Concept id}（FR-006、§26.2）

  // ── 選配（提供時才驗型別／值域；缺省合法，Edge Cases） ──
  keywords?: string[];
  review_priority?: ReviewPriority; // 提供時恰為 high | medium | low（FR-002）
  estimated_minutes?: number;
  lists?: string[];       // 經典題單標籤（grind75 / neetcode150 / blind75…）
  companies?: string[];
}
```

**驗證規則（逐題）**

| 規則 | 條件 | Violation rule | severity |
| --- | --- | --- | --- |
| 必填齊備 | `id/slug/title/url/difficulty/patterns` 任一缺失 | `schema-missing-field` | error |
| 型別正確 | 欄位型別不符（如 `id` 非 number、`patterns` 非字串陣列） | `schema-type` | error |
| difficulty 值域 | `difficulty ∉ {Easy,Medium,Hard}` | `difficulty-range` | error |
| review_priority 值域 | 提供且 `∉ {high,medium,low}` | `review-priority-range` | error |
| key == id | 題庫 key 的數值 ≠ 條目 `id` | `key-id-mismatch` | error |
| patterns 非空 | `patterns.length === 0` | `patterns-empty` | error |
| slug 一致 | 無法從 `url` 擷取 slug，或擷取值 ≠ `slug` | `slug-url-mismatch` | error |
| patterns 參照完整 | 某 pattern ∉ {Topic id ∪ Concept id} | `dangling-pattern` | error |

---

## 2. ProblemBank（題庫集合）

`data/problem-bank.json` 的檔案根結構：**以 LeetCode 題號字串為 key 的物件**（§12.1、§26.1）。

```ts
// 檔案形態（原始 JSON）
export type ProblemBankFile = Record<string /* 題號字串，如 "26" */, ProblemMeta>;

// 載入後 in-memory 形態（查找以數值 id 為鍵）
export interface ProblemBank {
  byId: Map<number, ProblemMeta>;         // id → 題目
  byPattern: Map<string, ProblemMeta[]>;  // patternId → 題目（升冪 id；R5）
}
```

- 同一題號重複＝物件 key 天然去重；key 與 `id` 一致性由 `key-id-mismatch` 把關（Edge Cases）。
- 空題庫 `{}`：載入合法（無 schema violation）；但有題 Concept 查找時前向守門 fail loud（US2）。

**JSON 範例**（seed 片段；完整契約見 `contracts/problem-bank-schema.md`）

```jsonc
{
  "26": {
    "id": 26,
    "slug": "remove-duplicates-from-sorted-array",
    "title": "Remove Duplicates from Sorted Array",
    "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    "difficulty": "Easy",
    "patterns": ["array", "in-place-operations"],
    "lists": ["neetcode150"]
  }
}
```

---

## 3. 對應關係（Concept ↔ Problem）

| 方向 | 權威來源 | 提供者 |
| --- | --- | --- |
| Concept → Problem（前向） | `ConceptNode.leetcode: number[]`（§16.1，F2 graph） | `getProblemsForConcept`（US2） |
| Problem → Pattern（反向索引） | `ProblemMeta.patterns: string[]` | `getProblemsByPattern`（US3） |

- 前向：一個 Concept 對應 **1~3** 題（**有題** Concept）；`leetcode: []` 觀念課回傳 `[]`（clarify 2026-07-22）。
- 反向：一題可標記多個 pattern、可被多個 Concept 引用、也可不被任何 Concept 引用（皆合法，Edge Cases）。

**前向守門狀態轉移（US2）**

```
輸入 leetcodeIds（來自 Concept.leetcode）
  ├─ 空陣列            → 回傳 []            （合法無題觀念課；不報錯）
  ├─ length > 3        → throw problem-count-range（指名 conceptId、題數）
  ├─ 某 id ∉ bank.byId → throw unknown-leetcode（指名 conceptId、缺漏題號）
  └─ 全部命中          → 回傳同序 ProblemMeta[]（1~3 筆）
```

---

## 4. Violation（沿用 F2，擴充 F3 規則）

沿用 `src/types/curriculum.ts` 的 `Violation` / `Severity` 結構；F3 的 `rule` 值域：

```ts
export type ProblemViolationRule =
  | "bank-load"            // 題庫檔缺失 / 非法 JSON（Edge Cases）
  | "schema-missing-field"
  | "schema-type"
  | "difficulty-range"
  | "review-priority-range"
  | "key-id-mismatch"
  | "patterns-empty"
  | "dangling-pattern"
  | "slug-url-mismatch"
  | "problem-count-range"  // 有題 Concept 對應題數 > 3
  | "unknown-leetcode";    // Concept 引用的題號不存在於題庫

export interface ProblemViolation {
  rule: ProblemViolationRule;
  severity: "error" | "warning";
  subject: string;   // 題號字串 / conceptId / 檔案路徑
  field?: string;    // 違規欄位（schema 類）
  target?: string;   // 關聯對象：無效 pattern id、缺漏題號等
  message: string;   // 人可讀、具名（fail loud，FR-013）
}
```

- 難度覆蓋缺口（FR-011）可回報為 `warning`（seed 階段無 Hard 不視為 error）。
- 每一種 rule 至少一個單元測試（SC-004）。

---

## 5. 型別與檔案落點總表

| 型別 / 常數 | 落點 | 狀態 |
| --- | --- | --- |
| `ProblemMeta` / `Difficulty` / `ReviewPriority` / `ProblemBank` / `ProblemBankFile` | `src/types/problem.ts` | 新增 |
| `ProblemViolationRule` / `ProblemViolation` | `src/types/problem.ts` | 新增 |
| `Violation` / `Severity` / `CurriculumGraph` / `ConceptNode` / `TopicNode` | `src/types/curriculum.ts` | 沿用（F2） |
| `Lesson` / `Problem`（whyThisPattern/hint） | `src/types/lesson.ts` | 沿用（F1，Lesson 組裝形態） |
