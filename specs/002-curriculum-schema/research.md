# Phase 0 Research: Curriculum Schema（F2）

本檔解消 plan Technical Context 的技術決策與 spec 遺留的實作取捨。clarify（2026-07-21）已定案的四項
（骨架範圍、Level=Module、前向依賴宣告序、getPathLabels 交棒 F5）不再重列，僅在受影響處引用。

---

## R1 — schema 驗證工具：`zod`（v3.23+）

**Decision**：以 `zod` 定義 `conceptFrontmatterSchema` 與 `modulesSchema`；以 `schema.safeParse()` 取得
**全部** issue（不 throw），再轉成本 Feature 統一的 `Violation` 結構（具名 Concept / 欄位 / 期望）。

**Rationale**：
- 憲章「技術與資源約束」明列驗證用 `zod`，plan 階段不得另選。
- `safeParse` 回傳 `success:false` 時的 `error.issues[]` 帶 `path`（欄位路徑）與 `message`，天然滿足
  FR-008「指名違規欄位」；不 throw 使我們能在單次驗證收集多筆錯誤而非遇錯即停。
- zod 的 `z.enum`（`difficulty`）、`z.number().int().positive()`（`estimated_minutes`）、`z.array()`
  精準表達 §10.1 的值域，避免手寫型別守衛。

**Alternatives considered**：
- 手寫型別守衛：與憲章指定衝突，且錯誤訊息品質差、重工。
- `ajv` / JSON Schema：憲章未採；frontmatter 來自 YAML，zod 對 TS 型別推導與訊息更順手。

**Version note**：採 `zod@^3.23`（穩定、`safeParse` 與 `issues` 介面成熟）。zod v4 亦相容本設計；
以 lockfile 釘住實際版本。

---

## R2 — id / slug 命名驗證（kebab-case）

**Decision**：以正則 `^[a-z0-9]+(-[a-z0-9]+)*$` 驗證 Concept `id`、Module `id`、Topic `id` 為 kebab-case
（FR-005 / FR-002）。此規則寫成單一常數 `KEBAB_SLUG`，schema 與骨架驗證共用。

**Rationale**：§26.1 明訂 kebab-case slug、全域唯一穩定；正則是確定性、可單元測試的最小手段。
唯一性（FR-020）另由圖層以 `Map<id, node>` 建立時偵測碰撞處理（見 R4），不混入 slug 格式檢查。

**Alternatives considered**：允許底線 / 大寫 → 違反 §26.1；不驗格式 → 之後檔名 / 路徑 / 參照易漂移。

---

## R3 — Concept 檔讀取與 frontmatter 解析範圍

**Decision**：以 `gray-matter` 讀 `concepts/**/*.md`，**只取 frontmatter**（`data`）；Author Hints 等正文
**不解析**（F5 才需要 Full Article 正文區塊）。檔案探索以確定性排序（見 R5）。`NNN` 局部序號由**檔名**
擷取（`^(\d{3})-`），供前向依賴全序（R7）與孤兒起點判定。

**Rationale**：F2 只需 metadata 建 DAG；沿用 F1 既有的 `gray-matter` 相依，零新增。檔名 `NNN` 是 §8.4 /
§26.1 明訂的「排序用局部序號」，用它構成 Topic 內順序最貼近既定約定，且不需在 frontmatter 另設序號欄位。

**Alternatives considered**：
- 在 frontmatter 加 `order` 欄位：與 §8.4「NNN 僅排序用、非識別」重複且易與檔名不一致。
- 用 `marked` 解析正文：F2 不需要，違反最小相依（`marked` 留給 F5）。

---

## R4 — DAG 建置、無環、參照完整、唯一性、重複邊

**Decision**：
- **建圖**：以 `Map<conceptId, ConceptNode>` 建節點；建立時若 id 重複 → 記 `duplicate-id` violation（FR-020）。
- **參照完整（FR-013）**：每個 `prerequisite` / `next` id 必須在 node map 中；每個 Concept 的 `module` /
  `topic` 必須存在於 `modules.json` 骨架且 topic 屬於該 module → 否則 `dangling-ref` violation（具名來源與目標）。
- **重複邊（FR-018）**：同一 Concept 的 `prerequisite` / `next` 出現重複 id → **正規化去重**並記
  `duplicate-edge`（warning 級，不阻擋），確保後續圖演算法輸入乾淨。
- **無環（FR-012）**：Kahn 拓樸排序；若有節點無法出列 → 以 DFS 回溯出**構成環的節點路徑**記 `cycle` violation。
  自我依賴（id ∈ 自己的 prerequisite/next）→ 視為環的退化，記 `self-dependency`。
- **唯一性 / 碰撞**：一律以「建 map 時偵測 + 明確 violation」處理，不依賴丟例外。

**Rationale**：Kahn + DFS 是確定性、線性、可逐項回報的標準做法；「收集所有 violation 再回報」符合
fail-loud 且一次看完全部錯誤的體驗（FR-008）。

**Alternatives considered**：遇錯即 throw → 一次只看到一個錯誤，體驗差、不利內容產線批次修正。

---

## R5 — 確定性：消除檔案列舉與雜湊順序影響（FR-025）

**Decision**：所有集合走訪一律**先排序**再處理：
- Concept 節點：以 `(module 宣告序, topic 宣告序, NNN, id)` 排序後才建圖 / 走訪 / 輸出。
- violation 清單：以 `(規則類別, 主體 id, 欄位)` 穩定排序後回報。
- 拓樸排序（R7）：Kahn 佇列以上述全序為 tie-break。

**Rationale**：`fs.readdir` 的順序與 `Map`/`Set` 迭代在跨平台 / 跨 Node 版本可能不同；SC-005 要求「重複
100 次逐次一致」，唯有把所有順序決策收斂到**宣告序 + 檔名序**才能保證 byte-level 穩定。

**Alternatives considered**：依賴 `fs.readdir` 排序或插入序 → 不可移植、SC-005 會 flaky。

---

## R6 — 骨架範圍與 Topic 顆粒度的取捨（clarify Q1 = 完整 16-Level）

**Decision**：`modules.json` 一次列出**完整 16 個 Module（Level 0–15）**與各 Module 的 Topic，宣告順序即
凍結的課程地圖。**Module 順序為嚴格凍結**；各 Module 的 **Topic 清單**為 F2 定的**骨架**，
F7 outline 若需在**不改 Module 順序**的前提下微調 Topic，走「改 curriculum → 重跑驗證 → review → commit」
的既定紀律（與憲章 XIII 的生成流程精神一致）。stub 階段只有 Level 0 + Level 1 的 Topic 掛 Concept，
其餘 Module / Topic 為空（由顆粒度 stub 模式豁免下限，見 R8）。

**Rationale**：Q1 明確選「Module/Topic 順序全定稿」。但憲章 XVII 的唯一人工檢查點是 **Concept 級 outline
（F7）**，非 Module/Topic 骨架；Topic 是比 Concept 粗的結構層，於 F2 先定骨架、F7 精修 Concept，
兩者不衝突。把「Module 順序凍結、Topic 可依紀律微調」講清楚，避免日後 F7 因發現 Topic 需調整而誤以為
違反「定稿」。

**Alternatives considered**：
- 只定 Level 0+1（Q1 選項 B）：被使用者否決，且與「地圖一次定版」精神相違。
- 連 Concept 都在 F2 定：越界 F7 的人工檢查點，違反憲章 XVII。

---

## R7 — 前向依賴的確定性全序（clarify Q3 = 宣告序）

**Decision**：定義全序 `ordinal(concept)` = (`module` 在 modules.json 的索引, 該 module 內 `topic` 的索引,
Concept 檔名 `NNN`, `id` 作最終 tie-break)。**前向依賴**（FR-014）：存在 `prerequisite` P 使
`ordinal(P) > ordinal(C)` → `forward-dependency` violation（具名來源 C 與目標 P）。
**拓樸排序輸出**（FR-011）：以 Kahn 演算法、佇列 tie-break 用 `ordinal` → 產生唯一 canonical 順序。
合法課程下宣告序本身即一個合法拓樸序，故「宣告序」與「拓樸相容」不矛盾（若矛盾則必有前向依賴或環被擋下）。

**孤兒起點的判定同樣建立在此 `ordinal` 上**（clarify 2026-07-21）：合法起點 ⇔ `moduleIndex === 0`
（Level 0 Module）**且**為該 Topic 內 `NNN` 最小者——即 Level 0 的每個 Topic 各允許恰一個起點。
複用同一份 `ordinal` 可確保孤兒判定與前向依賴判定不會出現兩套平行順序（FR-016 / FR-025）。

**Rationale**：§8.3 把「無環」與「無前向依賴」分列 → 前向依賴必須是**比無環更強**的檢查；唯有相對於一個
**外部宣告的順序**才有「前向」可言（純拓樸只有「無環」）。宣告序來自 modules.json + 檔名 `NNN`，
完全確定、作者可直觀預期、與 §8.4 編號規則一致。

**Alternatives considered**：以拓樸排序結果為序（Q3 選項 B）→ 「前向」被「無環」吸收、§8.3 分列失義；
兩者皆驗（選項 C）→ 過度嚴格、實作與測試成本高，無額外保證。

---

## R8 — 顆粒度規則的模式化（stub / full）與可插拔 leetcode（FR-021 / FR-023）

**Decision**：`validateCurriculum(graph, options?)` 的 `options`（簽章以
[contracts/curriculum-validation-contract.md](./contracts/curriculum-validation-contract.md) 為準）：
- `mode: 'stub' | 'full'`（預設 `'stub'`）。
  - **下限類**（總數 ≥ 150、Module ≥ 10 Concept、Topic ≥ 5 Concept）：僅 `full` 強制；`stub` 略過。
  - **上限 / 唯一性類**（Topic ≤ 12、Module ≤ 30、id 全域唯一）：**兩模式皆強制**。
  - 空 Module / Topic（尚未掛 Concept）在 `stub` 模式不觸發下限錯誤。
  - 全部門檻為**閉區間**（恰好等於上/下限判為通過，FR-019）。
  - **例外，不受 `mode` 影響**：Concept 集合**完全為空** → `empty-curriculum`（error，兩模式皆強制，
    FR-010a）。理由：「數量不足」與「完全沒有課程」是兩件事——前者是 stub 階段的正常中間態，
    後者代表載入鏈路壞掉或路徑錯誤，任何模式下都不該綠燈。
- `problemExists?: (leetcodeId: number) => boolean`（可選）。
  - 提供時（F3 起）：對每個 `leetcode` 題號檢查存在性，缺失 → `dangling-leetcode` violation。
  - 未提供時（F2）：`leetcode` 存在性檢查回報為 **`skipped`（deferred-to-F3）** 的 info，**不計入 pass/fail**；
    但 schema 仍驗 `leetcode` 為**正整數陣列**（格式）。

**Rationale**：clarify Q1 選完整骨架 → 14/16 Module 在 stub 階段為空，下限類規則必然不滿足；模式化是唯一
能同時「stub 綠燈」與「full 對真實課程強制」而不雙軌的方式（同一顆函式、參數切換，符合 FR-022 / IX）。
可插拔 `problemExists` 讓 F3 只需注入題庫查詢、F5 / F7 Gate 只需傳 `mode:'full'` + `problemExists`，
無需改本函式（FR-024）。

**Alternatives considered**：
- 兩套函式（stub 版 / full 版）：違反單一實作（FR-022 / IX）。
- 在 F2 就硬接題庫：越界 F3、破壞自足性（FR-026）。

---

## R9 — 驗證入口與退場語意（FR-028）

**Decision**：
- **可重用核心**＝ `src/compiler/curriculum.ts` 匯出的 `loadCurriculum()` 與 `validateCurriculum()`
  （純函式、無 `process.exit`）。這是 FR-022 / FR-024 的「單一實作」，F5 `scripts/validate.ts` 直接 import。
- **可執行入口**＝ `scripts/validate-curriculum.ts`：讀 `curriculum/modules.json` + `concepts/**` →
  呼叫 `validateCurriculum(..., { mode:'stub' })` → 將 violations 以人可讀格式印出 → **有 error 級 violation
  則 `process.exit(1)`，否則 `exit(0)`**。以 `tsx` 執行（npm script `validate:curriculum`）。
- **CI 驗收**主要靠 `npm test`（vitest，涵蓋全部注入錯誤類別）；`validate:curriculum` 為對真實 stub 課程的
  端到端 smoke。

**Rationale**：把「純計算」與「印出 + exit code」分離，才能讓核心被 runtime / Gate 安全 import（不會意外
`process.exit`），同時提供 fail-loud 的 CLI（FR-028）。`tsx` 執行 TS 而不污染 `dist`，並預先建立 `scripts/`
執行機制供 F5 / F7 沿用。

**Alternatives considered**：
- 把 exit 邏輯寫進 `curriculum.ts`：會讓被 import 時有副作用，違反純函式與可重用。
- 只靠 vitest、不做 CLI 入口：FR-028 明確要求「可重複執行的驗證入口（本地與 CI 可呼叫）」對**真實課程資料**
  執行，測試替身不等於對交付 stub 的端到端驗證。

---

## R10 — 型別分層（`src/types/curriculum.ts`）

**Decision**：DAG 相關型別（`ModuleNode` / `TopicNode` / `ConceptNode` / `CurriculumGraph` /
`ValidationResult` / `Violation` / `ValidateOptions`）集中於 `src/types/curriculum.ts`；`ConceptNode`
對齊 §16.1（含 `skeletonPath`、`articlePath` 欄位——F2 填 `skeletonPath`，`articlePath` 為推導值 /
預留，供 F5 讀 Full Article）。

**Rationale**：與 F1 `types/lesson.ts` 同模式，讓 schema / curriculum / 未來 compiler 共用一組型別入口，
降低耦合。§16.1 已釘 `ConceptNode` 形狀，直接對齊可讓 F5 無縫接手。

**Alternatives considered**：型別散落各實作檔 → 循環 import 風險、F5 接手需重整。

---

## R11 — 第二輪 `/speckit-analyze` 後的四項定案（2026-07-22）

**Decision**：

1. **參照完整性單一歸屬**：`loadCurriculum` 只做讀檔 + `gray-matter` + `zod`，只產 schema 類 violation；
   **全部** `dangling-ref`（`module` / `topic` / `topic` == 資料夾名 / `prerequisite` / `next`）
   統一在 `validateCurriculum` 第 3 步。`loadCurriculum` 仍把 `skeletonPath` 與所在資料夾名記入節點供比對。
2. **`skeleton-shape` 獨立規則**：骨架結構錯誤（`modules` 長度非 16、`level` ≠ 索引、module 無 topic、
   `title` 空）自成 `error` 級類別且**不受 `mode` 影響**；`granularity-range` 收斂為純 **Concept 數量**語意。
3. **§8.1 顆粒度由 SHOULD 升 MUST**：已回寫 `docs/spec.md` §8.1，`granularity-range` 維持 `error` 級。
4. **新增 `ci.yml` 工程 Gate**：`npm ci` → build → test → `validate:curriculum`，push / PR 觸發。

**Rationale**：
- (1) 兩處各驗一次即為憲章 IX / FR-022 禁止的雙軌，且 F7 Stage 1 Gate 若只呼叫 `validateCurriculum`
  就會漏掉 load 階段的檢查——把參照完整全數收進圖層，Gate 呼叫單一函式即拿到完整結果。
- (2) 原本 M2 借用 `granularity-range`，但該規則依 `mode` 豁免下限；骨架殘缺卻在 stub 模式被連帶放行是
  嚴重誤判。分離後下游可明確區分「骨架壞掉（必修）」與「內容尚未填滿（stub 正常態）」。
- (3) SHOULD 卻實作為 `error` 是規範層級矛盾；憲章 III 已是「MUST 維持細顆粒度」，升 MUST 才自洽。
  憲章本身無數值門檻，故無需修訂憲章。
- (4) 此前 repo 只有 `daily.yml`（僅 `npm run build`），**單元測試從未在 CI 執行**——FR-028 的
  「供 CI 呼叫」實際落空。補上工程 Gate 後，F1 既有測試亦一併受保護。

**Alternatives considered**：
- (1) 把 module/topic 檢查留在 load（load 手上已有骨架，直覺較順）→ 呼叫端必須合併兩份 violation 才算
  完整驗證，F7 Gate 極易漏接，否決。
- (2) 沿用 `granularity-range` 並註記「不受 mode 影響」→ 同一 rule 承載兩種語意，下游過濾困難，否決。
- (3) 把 `granularity-range` 降為 `warning` → F7 產出超限課綱時 CI 不會擋，違背「能在 CI 驗的不留到早上」，否決。
- (4) 沿用 F5 的 `content-gate.yml` 提前建立 → 內容 Gate 需 `scripts/validate.ts` 與全 Session 編譯（F5 才有），
  提前建立會是空殼；兩道 Gate 職責分離較清楚，已回寫 `docs/spec.md` §21.3。

---

## 未列入 F2、明確延後（避免範圍蔓延）

- `leetcode` 題號**存在性**（→ F3，經 R8 的 `problemExists` 注入）。
- 課表拓樸**子序列**驗證、Overlay（→ F4）。
- Full Article 正文區塊解析、`Lesson` 組裝、learning path 由 DAG 推導、移除 `getPathLabels`（→ F5）。
- 完整 Concept 清單、Author Hints 展開、內容 Gate（→ F7）。
- `exit_criteria` 的字數 / 條數預算（→ 內容 Gate，F5 / F7）；F2 僅驗其為非空字串陣列的結構。
