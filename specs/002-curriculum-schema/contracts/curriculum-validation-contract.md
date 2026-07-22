# Contract: `validateCurriculum` 與驗證入口

**單一實作**（FR-022 / FR-024）：`src/compiler/curriculum.ts` 匯出純函式。F5 runtime Compiler、
F7 Stage 1 / CI Gate MUST 呼叫同一顆，MUST NOT 另寫平行驗證。

## API（型別語意，非最終簽章）

```ts
// 讀檔 → in-memory 圖（不驗證業務規則以外的副作用；純讀）
loadCurriculum(input: {
  modulesPath: string;      // 預設 'curriculum/modules.json'
  conceptsDir: string;      // 預設 'concepts'
}): { graph: CurriculumGraph; loadViolations: Violation[] }   // 讀檔/parse 階段的 schema violations

// 純函式驗證（無 process.exit、無 I/O）
validateCurriculum(
  graph: CurriculumGraph,
  options?: ValidateOptions   // { mode?: 'stub'|'full'; problemExists?: (id:number)=>boolean }
): ValidationResult
```

- `loadCurriculum` 負責讀檔 + `gray-matter` + `zod` schema（frontmatter / modules.json）→ 產生節點圖與
  **schema 類 violations**（`schema-missing-field` / `schema-type` / `schema-id-format` /
  `leetcode-format` / `skeleton-shape`）。
- `validateCurriculum` 負責**圖層規則**（參照完整、無環、前向依賴、孤兒、雙向一致、重複邊、顆粒度、
  leetcode 存在性 via `problemExists`）。
- **職責界線（定案 2026-07-22，FR-013 / SC-007）**：**全部參照完整性檢查**——`module` / `topic` 是否存在於
  骨架、`topic` 是否隸屬該 `module`、`topic` 是否等於檔案所在資料夾名、`prerequisite` / `next` 是否存在
  ——**MUST 只實作於 `validateCurriculum`（第 3 步）**。`loadCurriculum` **MUST NOT** 自行比對骨架或
  資料夾名；它只負責把「檔案讀進來、欄位型別正確」這件事做完。
  > **理由**：兩處各實作一次即構成憲章 IX / FR-022 禁止的雙軌驗證，且 F7 Stage 1 Gate 若只呼叫其中一顆
  > 就會漏檢。`loadCurriculum` 仍會把 `skeletonPath` / 所在資料夾名記入節點，供第 3 步比對。
- 呼叫端合併 `loadViolations` 與 `validateCurriculum` 的 `violations` 得完整結果（入口 CLI 代勞）。

## 驗證檢查清單（執行順序固定 → 確定性）

0. **空課程**：Concept 集合為空 → `empty-curriculum`（error，**兩模式皆強制**，FR-010a）；
   此時後續圖層檢查無意義，MUST 直接回傳（不再產出其他 violation，避免噪音）。
   **`concepts/` 目錄不存在**與**目錄存在但無任何通過 schema 的 Concept** 皆歸此類別（同一 rule），
   但 `message` MUST 區分兩者（例：「`concepts/` 目錄不存在」vs「`concepts/` 下無任何 Concept」）以利排錯。
1. **schema**（load 階段）：modules.json（M1–M7；結構類違規為 `skeleton-shape`）、
   每個 Concept frontmatter（§10.1 欄位）。
2. **id 唯一性**：`duplicate-id` 涵蓋三種主體——Concept `id` 全域唯一、`module.id` 全域唯一、
   `topic.id` 跨 Module 全域唯一；`field` 標示主體種類（`concept` / `module` / `topic`）。
   **`module.id` 與其主 `topic.id` 同名不觸發**（不同識別空間，FR-002）。
3. **參照完整**（**本步驟為參照完整性的唯一實作處**，FR-013）：
   - `module` 存在於骨架、`topic` 存在且**隸屬該 `module`**（`dangling-ref`）；
   - **`topic` MUST 等於 Concept 檔案所在的資料夾名**（`concepts/{topic}/`，§26.1）——不符亦記 `dangling-ref`，
     `target` 為實際資料夾名；
   - 每個 `prerequisite` / `next` id 存在於 Concept 集合（`dangling-ref`）。
4. **重複邊正規化**：prerequisite/next 去重（`duplicate-edge`，warning）。
5. **雙向一致**：`A.next∋B ⇔ B.prerequisite∋A`（`edge-inconsistency`，error、不自動補齊）。
6. **無環 / 自我依賴**：Kahn + DFS 回溯（`cycle` / `self-dependency`）。
7. **無前向依賴**：相對宣告序全序 `ordinal`（`forward-dependency`）。
8. **無孤兒**：`orphan`（error）。**合法起點 = `ordinal.moduleIndex === 0` 且為該 Topic 內檔名 `NNN`
   最小者**（Level 0 每個 Topic 各允許恰一個起點，FR-016）；其餘 Concept 若無 prerequisite 又不被任何
   next 提及 → `orphan`。
9. **顆粒度**：依 `mode` 檢查 Topic/Module/總數的 **Concept 數量**範圍（`granularity-range`）；範圍為**閉區間**，
   恰好等於上/下限判為通過（FR-019）。**骨架自身的結構錯誤不在此步**——屬 `skeleton-shape`（第 1 步，
   不受 `mode` 影響，FR-001c）。
10. **leetcode 存在性**：有 `problemExists` → 檢查（`dangling-leetcode`，error）；無 → 列入 `skipped`。

> 全部檢查**收集式**回報（不遇錯即停）；`violations` 以 `(rule, subject, field)` 穩定排序（R5）。

## 回傳（見 data-model §4）

`ValidationResult = { ok, violations[], topoOrder?, skipped[] }`
- `ok` = 無 `error` 級 violation。
- `topoOrder` 僅在 `ok` 時提供，為 Kahn + `ordinal` tie-break 的 canonical 序（FR-011）。
- `skipped` 記錄如「leetcode 存在性 deferred-to-F3」（FR-023）。

## 確定性保證（FR-025 / SC-005）

同一 `(modules.json, concepts/**, options)` → `ValidationResult`（含排序與 `topoOrder`）逐次逐字元一致。
所有集合走訪先依全序排序；不依賴 `fs.readdir` / `Map` 迭代序。

## 執行入口 `scripts/validate-curriculum.ts`（FR-028）

- 讀 `curriculum/modules.json` + `concepts/**` → `loadCurriculum` → `validateCurriculum(graph,{mode:'stub'})`。
- 印出：每筆 violation 一行（`severity rule subject[.field] → target : message`）、末尾 summary、
  `skipped` 清單。
- **退場**：有任一 `error` violation → `process.exit(1)`；否則 `exit(0)`（fail loud）。
- 執行：`npm run validate:curriculum`（`tsx scripts/validate-curriculum.ts`）。
- **純度界線**：`process.exit` 只在此入口；`curriculum.ts` 的函式無副作用，供 runtime / Gate 安全 import。

## 重用點（下游 Feature）

| Feature | 重用方式 |
|---|---|
| F3 | 注入 `problemExists`（題庫查詢）→ 啟用 leetcode 存在性檢查 |
| F5 | runtime Compiler `import { loadCurriculum }`；DAG 供 learning path（prev/current/next 取自 prerequisite/next），移除 F1 `getPathLabels` |
| F7 | Stage 1 結構 Gate 呼叫 `validateCurriculum(graph,{mode:'full',problemExists})`；同一顆實作 |
