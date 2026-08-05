# Contract: `src/compiler/problem.ts` 模組 API

**單一實作**（FR-014）：CI Gate 與未來 F5 runtime 共用此模組。除 `loadProblemBank` 讀檔外，
其餘為**純函式、無副作用**（無 `process.exit`、無其他 I/O）；`process.exit` 只出現在 `scripts/validate-problem-bank.ts`。

`src/` MUST NOT import `@google/genai`（FR-012；由既有 `zero-llm.test.ts` 全樹掃描守衛）。

---

## `loadProblemBank(path: string): { bank: ProblemBank; loadViolations: ProblemViolation[] }`

- 讀取 JSON、忽略底線前綴 key、以 zod 驗每筆 `ProblemMeta`，建 `byId` / `byPattern`（升冪 id）索引。
- 檔缺失 / 非法 JSON → 回傳 `bank`（空）+ 一筆 `bank-load` error violation（**不 throw**，讓入口統一處理）。
- schema 類違規（缺欄位／型別／值域／key≠id／patterns 空／slug 不符）收進 `loadViolations`。
- **確定性**：同輸入 → 同 `bank` 與同 `loadViolations`（穩定排序：先 key 升冪、再欄位名）。

## `validateProblemBank(bank: ProblemBank, graph: CurriculumGraph): ProblemViolation[]`

- 需要圖的跨參照檢查：`patterns` 每項 ∈ `graph.topics.keys() ∪ graph.concepts.keys()`，否則 `dangling-pattern`。
- MAY 回報難度覆蓋缺口為 `warning`（FR-011；seed 無 Hard 非 error）。
- 純函式；回傳穩定排序的 violation 清單。

## `getProblemsForConcept(conceptId: string, leetcodeIds: number[], bank: ProblemBank): ProblemMeta[]`

前向查找 + 題數守門（US2、§12.1 唯一權威守門點）。`leetcodeIds` 由 caller 從 `ConceptNode.leetcode` 注入。

| 輸入 | 行為 |
| --- | --- |
| `leetcodeIds = []` | 回傳 `[]`（合法無題觀念課；**不 throw**） |
| `leetcodeIds.length > 3` | `throw Error`（`problem-count-range`：指名 conceptId、題數） |
| 某 id ∉ `bank.byId` | `throw Error`（`unknown-leetcode`：指名 conceptId、缺漏題號） |
| 全部命中（1~3） | 回傳與 `leetcodeIds` **同序**的 `ProblemMeta[]` |

- 錯誤訊息 MUST 具名、可辨識（fail loud，FR-008/FR-013）；MUST NOT 靜默截斷或略過缺漏題目。

## `getProblemsByPattern(patternId: string, bank: ProblemBank): ProblemMeta[]`

- 回傳所有 `patterns` 含 `patternId` 的題目，**題號 `id` 升冪**排序（確定性，R5）。
- pattern 無對應題目 → 回傳 `[]`（合法）。

## `makeProblemExists(bank: ProblemBank): (leetcodeId: number) => boolean`

- 回傳判定式：`id ∈ bank.byId`。供注入 `validateCurriculum(graph, { problemExists })`（FR-009），
  使 F2 原 `skipped: deferred-to-F3` 的 leetcode 存在性檢查實際執行（SC-005）。

---

## CI 入口 `scripts/validate-problem-bank.ts`（FR-015）

流程（比照 `scripts/validate-curriculum.ts`）：

1. `loadCurriculum({ modulesPath, conceptsDir })` → `graph`。
2. `loadProblemBank("data/problem-bank.json")` → `bank` + `loadViolations`。
3. `validateProblemBank(bank, graph)` → 題庫層 violations（US1/US3/US4）。
4. 走訪 `graph.concepts`，對每個 Concept 呼叫 `getProblemsForConcept(id, node.leetcode, bank)` 收集前向守門錯誤（US2）。
5. `validateCurriculum(graph, { problemExists: makeProblemExists(bank) })` → leetcode 存在性實際執行（FR-009）。
6. 彙整 → 人可讀輸出（沿用 F2 `formatViolation` 風格）→ 有任一 `error` 則 `process.exit(1)`，否則 `process.exit(0)`。

**package.json**：`"validate:problem-bank": "tsx scripts/validate-problem-bank.ts"`。
**ci.yml**：於 `Validate curriculum` 後新增 `- name: Validate problem bank` / `run: npm run validate:problem-bank`。
