# Phase 0 Research: Problem Bank

本檔記錄 F3 的關鍵設計決策。spec 的需求歧義已於 `/speckit-clarify`（Session 2026-07-22）收斂；
此處僅解決**實作結構**層面的抉擇（無殘留 NEEDS CLARIFICATION）。

---

## R1（樞紐決策）：單一 Problem Bank 形態，遷移 F1 臨時產物

**Decision**：F3 以 **spec §12.1 形態**（題號字串為 key 的物件、`ProblemMeta` 只含參照 metadata）作為
`data/problem-bank.json` 的**唯一**形態，並把 `src/compiler/problem.ts` 重寫為**唯一**的載入／驗證／查找模組。
F1 walking-skeleton 遺留的舊形態（`{ problems[], conceptProblems{} }` 且題目條目內含 `whyThisPattern`/`hint`）
一併遷移；相依的 F1 消費者（`lesson.ts`、`tests/fixtures/problem-bank.json`、`problem.test.ts`）同步更新。

**Rationale**：
- **FR-014 / 憲章 IX 禁雙軌**：「載入／查找／驗證 MUST 為單一實作，MUST NOT Gate 一套 runtime 另一套」。
  同時保留 F1 舊形態與 F3 新形態＝兩種 bank schema 並存＝雙軌，直接違憲。
- **FR-004 / §5 禁內容欄位**：舊形態把 `whyThisPattern`/`hint`（生成內容）塞進題庫；spec 明令題庫只存
  參照 metadata。這兩個欄位屬 `Lesson.problems[]`（§16.4），由 Compiler 於 build-time 組裝（F5/F7），非題庫欄位。
- **§16.1 前向對應權威**：Concept→Problem 的權威來源是 `Concept.leetcode[]`，非題庫內的 `conceptProblems` 映射。
  舊形態的 `conceptProblems` 是 F1 為硬編課表臨時建的平行映射，與真實來源牴觸，且其 `left-right-pointer`
  參照的 concept 根本不在 F2 的 DAG 中——屬明確的臨時鷹架（`schedule.ts` 首行已自我標記「⚠️ F1 臨時產物」）。

**Alternatives considered**：
- **新增平行模組 `problem-bank.ts`、保留舊 `problem.ts`**：最省事但構成雙軌（兩種 schema、兩套 lookup），
  違反 FR-014。**否決**。
- **把 F1 的 `whyThisPattern`/`hint` 留在題庫**：違反 FR-004／§5。**否決**。

**F1 walking-skeleton 的善後（keep green；2026-07-22 查核後定案）**：

查核已驗證 `data/problem-bank.json` **同時是 F1 現行 runtime 的資料源**（`main.ts` → `compile()` →
`render()` 把每題渲染成 `… difficulty · whyThisPattern · Hint: hint`，見 `src/renderer/discord.ts`）。
故遵守 spec（檔案釘死 + FR-004 禁內容欄位）就**必然**動到 F1 這條 runtime 線——無純新增走法。

- **保留 `left-right-pointer`（重導 F1 schedule 至真實 F2 concept 之選項已否決）**：查核發現 `articles/**`
  底下唯一存在的 Full Article 是 `002-left-right-pointer.md`；F2 的 array-traversal / in-place / prefix-sum
  只有 skeleton、**無文章**（生文章屬 F5/F7）。故 F1 只能沿用 `left-right-pointer` + 其獨立文章。
- `Lesson.problems[]`（型別 `Problem`，含 `whyThisPattern`/`hint`）**保留不動**——它是 Compiler 組裝後的
  呈現形態，非題庫形態。
- **`whyThisPattern`/`hint` 來源（decision 2026-07-22）**：於 `lesson.ts` 內置一張**小型 F1-local 常數表**
  （demo 三題 11/125/167 各自的 why/hint），明確標注「F1 seed，由 F5/F7 Overlay 取代」。此為 Lesson 組裝
  內容、非題庫欄位，**不違 FR-004**。文章 `002-left-right-pointer.md` 刻意不列題目（避免兩份不同步副本），
  故不改文章 frontmatter；亦不另立 `data/f1-lesson-content.json`（避免多一個臨時載入點）。
- `lesson.ts` 亦需提供 demo 的 `leetcodeIds = [167, 125, 11]`（`left-right-pointer` 不在 F2 graph、
  文章不帶題號），注入新的 `getProblemsForConcept` 取得 `ProblemMeta[]`，再配上述常數表組成 `Lesson.problems`。
- seed 題庫**同時納入** F1 demo 的 two-pointer 三題 {11,125,167}（真實有效、patterns 指向 `two-pointer` Topic）
  與 F2 引用題號 {1,26,27,283,303,560}，使**單一題庫**同時支撐 F1 runtime 查找與 CI Gate，避免另立資料源。

**遷移波及面（已逐檔查核）**：必改＝`data/problem-bank.json`、`src/compiler/problem.ts`（重寫）、
`src/compiler/lesson.ts`、`tests/fixtures/problem-bank.json`、`tests/unit/problem.test.ts`（重寫）、
`tests/unit/lesson.test.ts`（調整）；受影響但可容忍＝`tests/unit/dry-run.test.ts`（斷言為通用字串，compile 仍產合法 Lesson 即綠）；
**不受影響**＝`tests/unit/renderer.test.ts`、`tests/unit/budget.test.ts`（自建 Lesson、不讀題庫）。

---

## R2：型別放置——新增 `ProblemMeta`，不污染 `Lesson.Problem`

**Decision**：於 `src/types/problem.ts` 新增 `ProblemMeta`（題庫參照 metadata）與 `ProblemBank` 型別；
`src/types/lesson.ts` 的 `Problem`（`whyThisPattern`/`hint`）**保留**，代表 Compiler 組裝後的 Lesson 形態。
兩者刻意分離：題庫層 = 事實 metadata；Lesson 層 = 事實 + 生成呈現內容。

**Rationale**：呼應 FR-004（題庫無內容）與 §16.4（Lesson 才有 why/hint）。分離型別讓「題庫 MUST NOT 含內容」
在型別層即成立，避免日後誤把內容寫回題庫。

**Alternatives considered**：共用單一 `Problem` 型別（沿用 F1）——會讓題庫型別帶著內容欄位，型別層無法阻止違反 FR-004。**否決**。

---

## R3：驗證違規契約——沿用 F2 `Violation`，擴充 F3 規則

**Decision**：重用 F2 `src/types/curriculum.ts` 的 `Violation` / `Severity` 結構（`rule/severity/subject/field?/target?/message`）。
F3 專屬的 `rule` 以獨立字串聯集型別 `ProblemViolationRule` 表達（放 `src/types/problem.ts`），
`Violation` 的 `rule` 欄位對 F3 用途接受此聯集（型別上以共用 `string` 基底或擴充聯集達成，實作細節見 data-model）。

F3 規則枚舉（每一類至少一個單元測試，SC-004）：
`schema-missing-field`、`schema-type`、`difficulty-range`、`review-priority-range`、`key-id-mismatch`、
`patterns-empty`、`dangling-pattern`、`slug-url-mismatch`、`problem-count-range`（有題 Concept >3）、
`unknown-leetcode`（Concept 引用題號不存在）、`bank-load`（檔缺失/非法 JSON）。

**Rationale**：F5/CI Gate 已消費 F2 的 `Violation` 結構；共用同一載體讓下游一致處理（FR-013 結構化、可共用）。

**Alternatives considered**：F3 自訂全新結果型別——徒增下游分歧，違反「結構化、供 Gate 與 Compiler 共用」。**否決**。

---

## R4：前向查找簽章——查找純函式，Concept.leetcode 由 caller 注入

**Decision**：`getProblemsForConcept(conceptId: string, leetcodeIds: number[], bank: ProblemBank): ProblemMeta[]`。
題號序列由 caller（CI Gate 走訪 graph、或 F5 Compiler）從 `Concept.leetcode[]` 取出後注入；查找函式本身**不讀圖、不讀檔**，
為對 `(ids, bank)` 的純映射。守門規則：

- `leetcodeIds.length === 0` → 回傳 `[]`（合法「無題目觀念課」，clarify 2026-07-22；**不**報錯）。
- `length > 3` → throw 具名錯誤（`problem-count-range`，指名 conceptId 與題數）。
- 某 id 不在 bank → throw 具名錯誤（`unknown-leetcode`，指名 conceptId 與缺漏題號）。
- 否則回傳與宣告**同序**的 `ProblemMeta[]`。

**Rationale**：與 F2 `problemExists` 同哲學（可插拔、不綁圖），保持查找為零 I/O 純函式（FR-014），
易測、易被 runtime/Gate import。§12.1 要求守門在「查找階段」——此函式即該階段。

**Alternatives considered**：`getProblemsForConcept(conceptId, graph, bank)` 直接讀圖——耦合圖、失去純度、
與 F2 可插拔風格不一致。**否決**（caller 讀圖即可）。

---

## R5：反向查找 determinism——升冪題號排序

**Decision**：`getProblemsByPattern(patternId, bank)` 回傳所有 `patterns` 含 `patternId` 的題目，
以**題號 `id` 升冪**排序（確定性）。

**Rationale**：FR-010／SC-007 要求確定性順序；題庫以字串 key 存放，物件 key 迭代序不可依賴，故明訂數值升冪為 canonical。

**Alternatives considered**：以題庫宣告序／插入序——JSON 物件 key 序不穩定、跨環境不可靠。**否決**。

---

## R6：`patterns` 參照命名空間——Topic id ∪ Concept id

**Decision**：`patterns[]` 的每個值 MUST 屬於 **{全部 Topic id} ∪ {全部 Concept id}**（由 F2 graph 的
`graph.topics.keys()` 與 `graph.concepts.keys()` 聯集構成）。懸空即 `dangling-pattern` error。
seed 題目一律以既有 Topic id 標記（如 `two-pointer`、`array`）。

**Rationale**：§26.2「`patterns` MUST 對應到某條 Topic / Concept id」；FR-006 明列兩者皆可。已核對
`curriculum/modules.json`：`two-pointer`、`array`、`hash-table` 等為合法 Topic id，`array-traversal` 等為合法 Concept id。

**Alternatives considered**：只允許 Topic id——與 §26.2／FR-006「Topic 或 Concept id」不符。**否決**。

---

## R7：FR-009 `problemExists` 落地——`makeProblemExists(bank)`

**Decision**：新增 `makeProblemExists(bank: ProblemBank): (leetcodeId: number) => boolean`，回傳的判定式供
`validateCurriculum(graph, { mode, problemExists })` 注入。CI 入口 `validate-problem-bank.ts` 載庫後建此判定式並
呼叫 `validateCurriculum`，使 F2 原本 `skipped: deferred-to-F3` 的 leetcode 存在性檢查**實際執行**（FR-009／SC-005）。

**Rationale**：F2 已預留可插拔介面（`src/types/curriculum.ts` 的 `ValidateOptions.problemExists`），
F3 只需提供背景實作，零改動 F2 驗證邏輯，完全符合「以真實題庫為背景換掉 stub」。

**Alternatives considered**：在 F3 另寫一份 leetcode 存在性檢查——與 F2 重複、雙軌。**否決**。

---

## R8：CI 驗證入口與 Gate 併入

**Decision**：新增 `scripts/validate-problem-bank.ts`（比照 `validate-curriculum.ts`）：`loadCurriculum` 取圖 →
載入題庫 → `validateProblemBank(bank, graph)` + 走訪各 Concept 跑前向守門 + `validateCurriculum(graph, { problemExists })`
→ 人可讀輸出 → 有 error 非零 exit。`package.json` 加 `"validate:problem-bank": "tsx scripts/validate-problem-bank.ts"`；
`ci.yml` 在 `Validate curriculum` 後加一步 `npm run validate:problem-bank`。`process.exit` **只**在此入口（純度界線同 F2）。

**Rationale**：沿用 F2 既定 Gate 模式，最小驚訝；滿足 FR-015。

**Alternatives considered**：合併進 `validate-curriculum.ts`——會混淆兩 Feature 的職責與訊息，且題庫驗證需要
額外的載庫步驟。分開入口較清晰。**（保留彈性：實作時若共用 loader 更簡潔亦可，但 npm script/Gate 兩步分列。）**
