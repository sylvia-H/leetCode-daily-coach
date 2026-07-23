# Phase 0 Research: Schedule Generator

**Feature**: `004-schedule-generator` | **Date**: 2026-07-23

本檔記錄 F4 生成器的關鍵設計決策。spec 的五項 clarify（2026-07-23）已釘死機制，本檔把它們落到實作層並補齊
determinism / 節奏 / 序列化等未在 clarify 觸及但影響正確性的細節。格式：Decision / Rationale / Alternatives。

---

## R1 — 模組分層：純函式生成核心 + 薄入口（沿用 F2/F3）

**Decision**：生成／驗證／序列化集中在單一純函式模組 `src/compiler/schedule-generator.ts`（無 `process.exit`、無檔案
I/O）；`scripts/generate-schedule.ts` 負責讀輸入 + 寫三檔 + `process.exit`；`scripts/validate-schedule.ts` 為 CI
Gate 入口。輸入 zod 解析放 `src/compiler/schedule-schema.ts`。

**Rationale**：F2 `curriculum.ts` / F3 `problem.ts` 已確立「驗證邏輯純函式化，副作用只在 `scripts/` 入口」的分層，
使同一顆核心能被 CI Gate 與未來 F5 runtime / F6 pipeline 安全 `import`（憲章 IX 單一 Compiler）。生成器寫檔屬 I/O，
故留在 entry；核心只回傳 `{ schedules, violations }`。

**Alternatives considered**：
- 把生成邏輯直接寫進 `scripts/generate-schedule.ts`（entry 內含全部邏輯）→ 否決：F5/F6 要 `import` 時被 `process.exit`
  與 I/O 綁死，違單一實作重用。
- 覆寫 F1 既有 `src/compiler/schedule.ts` → 否決：該檔仍被 F1 `compile` 消費，覆寫會破壞 walking-skeleton 綠燈；
  改由生成物取代是 F5 職責。新模組取名 `schedule-generator.ts` 避免衝突。

---

## R2 — Determinism：canonical serializer（byte-identical 的關鍵）

**Decision**：以**明確欄位序**建構輸出物件（不靠 `JSON.stringify` 對任意 key 排序），`JSON.stringify(obj, null, 2)`
+ **強制 `\n` 檔尾換行**，寫檔用 UTF-8 無 BOM、LF 行尾。SessionPlan 欄位序固定為
`sessionIndex → type → conceptId? → reviewRange? → problemIds?`（缺省欄位省略而非填 null，對齊 §16.2 optional 語意）。
TrackSchedule 欄位序 `track → targetLevel → sessions`。

**Rationale**：JS 物件對字串 key 保留插入序，故「按固定順序 push 欄位」即得穩定鍵序；顯式檔尾換行 + LF 消除
Windows（本機）與 Linux（CI）之間的 diff 假陽性（spec Edge Case）。所有排序輸入皆已確定性（見 R3/R4），故輸出為
輸入的純函數。

**Alternatives considered**：
- 依賴 `JSON.stringify` 預設行為不顯式管理換行 → 否決：檔尾換行 / CRLF 在跨平台會漂移，byte-identical 失守。
- 引入 `json-stable-stringify` 之類相依 → 否決：無新相依原則；顯式欄位序已足夠且更可讀。

---

## R3 — Concept 涵蓋子集：Module/Level 準則 + 閉包驗證（clarify Q1 / FR-014a）

**Decision**：`track-params.json` 以 **`maxLevel`（含）** 為主要涵蓋宣告（可選 `moduleAllowlist` 作進階形式）。生成器
從 `graph.concepts` 篩出 `module.level ≤ maxLevel`（或屬 allowlist）者，依 F2 canonical `topoOrder` 取其**子序列**作為
該 Track 的 Concept 佇列。**閉包驗證**：對每個被涵蓋 Concept，其 `prerequisite` 若不在涵蓋集 → 產出 `coverage-gap`
error 級違規、fail loud（不靜默擴張宣告範圍）。

**Rationale**：F2 已保證「宣告序 = level」且無前向依賴，故 `maxLevel` 連續切法**天然閉包**（任一被涵蓋 Concept 的
前置 ordinal ≤ 自己 → level ≤ maxLevel）；閉包檢查對連續切法恆通過，只在 `moduleAllowlist` 有跳號時才可能觸發，
屆時 fail loud 最能暴露參數錯誤（與 clarify Q4 對 Overlay 懸空採 fail loud、及 F2/F3 dangling 一致）。以 `topoOrder`
子序列取用，直接繼承 F2 的確定性排序。

**Alternatives considered**：
- 缺前置時**自動納入**（擴張涵蓋）→ 保留為 FR-014a 允許的替代，但否決為預設：會讓「宣告 maxLevel=2 卻悄悄多教
  Level 5 前置」難以察覺，違「宣告範圍為權威」。
- 逐 Concept include/exclude 清單為主要機制 → 否決（clarify Q1 已定：避免 150+ 手寫）。

---

## R4 — 週節奏與 reviewRange：相對天數模板（clarify Q3 / FR-011~013）

**Decision**：`track-params.json` 每 Track 帶一個長度 7 的 `rhythm` 模板（§13.2 預設
`[concept, concept, practice, review, challenge, concept, rest]`，Track 可微調但 MUST 含 ≥1 `review` 與 ≥1 `rest`）。
生成器逐「週」（每 7 Session）攤課：`concept` 槽從涵蓋佇列取下一個 Concept；佇列**取空後，於當週節奏走完即自然收尾**
（FR-019，不填充）。`review` 槽的 `reviewRange = [weekStartIndex, reviewSessionIndex - 1]`（涵蓋本週在其之前的 Session）。

**Rationale**：相對天數（`(sessionIndex-1) % 7`）決定型別，完全不讀日曆星期（FR-012）。`reviewRange` 取「本週已上
Session」使第一週亦非空（模板 review 落在第 4 槽 → range `[1,3]`），一次解掉 spec 的「第一週無上週」Edge Case，且不
越界、不重疊他週。「取空即於當週收尾」讓長度 = 輸入的確定性函數（stub 短課表為預期）。

**Alternatives considered**：
- `reviewRange` 指向「上一週」→ 否決：第一週為空區間，且 §16.2 明寫「本週範圍」。
- Concept 取空後以 practice/review 填滿到 180 → 否決（clarify Q3：不憑空填充）。
- 節奏綁日曆星期 → 否決（憲章「漏跑不跳課」使星期漂移，FR-012 明禁）。

**implement 前補充決策（週節奏走到「該排 Concept 但佇列已空」的槽位）**：概念數不一定整除「每週 concept 槽數」
（stub 5 Concept、每週 3 concept 槽即為一例：第 2 週僅夠排 2 個，模板第 3 個 concept 槽落空）。此時**跳過該
concept 槽（不消耗 sessionIndex、不產出對應 session），繼續攤課至該週剩餘槽位**（practice/review/challenge/
rest 正常產出，皆為對已涵蓋 Concept 的純函數，無需等待該槽）；跳過後仍在**同一輪**（週）內走到 rest 才真正
收尾，不提前中止、也不跨到下一輪。收尾點 = 該輪（週）跑完剩餘非 concept 槽位之處，`sessionIndex` 連續遞增
無缺口。此舉為輸入的確定性函數（僅取決於「涵蓋 Concept 數」與「rhythm 模板」），不引入隨機或非確定行為。

---

## R5 — 題目選取與難度帶：Problem Bank 過濾 + Overlay 附加（clarify Q2 / FR-015a）

**Decision**：`track-params.json` 每 Track 帶 `problemDifficulties`（`Difficulty[]`，如 foundation `["Easy"]`、interviewReady
`["Easy","Medium"]`、interviewMastery `["Medium","Hard"]`）與 `challengeDifficulty`。
- `concept` 槽 `problemIds` = 該 Concept 的 `leetcode` 依 Problem Bank `difficulty` **過濾至 `problemDifficulties`**（保留
  `leetcode` 宣告序），再附加 `overlay.byConcept[id].extraProblemIds`（去重、穩定序）。過濾後為空（含 `leetcode: []`）
  MUST 合法。
- `practice` 槽 `problemIds` = 當週已引入 Concept 的過濾題目聯集（確定性、升冪 id）。
- `challenge` 槽 `problemIds` = 涵蓋 Concept 中符合 `challengeDifficulty` 的題目、取 id 最小一題（決定性）；無則空。

**Rationale**：Problem Bank 為難度唯一真相（§5/§11 題號難度由程式帶入）；分歧走 Overlay（憲章 VI）。難度差異在
schedule 層即固化進 `problemIds`，Renderer 不需判難度（憲章 XI）。所有選取皆為 `leetcode` 宣告序 / 升冪 id 的純函數。

**Alternatives considered**：
- 由 params/Overlay 帶逐 Concept 題號清單 → 否決（clarify Q2：回到手寫）。
- 全題給三 Track、難度差異在 Renderer → 否決（違憲章 VI/XI）。

---

## R6 — `track-params.json` schema 與 stub 值

**Decision**：檔根為 `{ version, tracks: { foundation, interviewReady, interviewMastery } }`，每 Track：
`{ targetLevel, maxLevel, moduleAllowlist?, problemDifficulties, challengeDifficulty, rhythm }`。`zod` `.strict()` 驗證，
非法（缺欄位 / 型別 / `targetLevel` 值域 / `rhythm` 缺 review|rest / `maxLevel` 超出 modules 範圍）→ 具名 `schema-*` /
`param-invalid` 違規。stub 值：三 Track 皆 `maxLevel: 1`（涵蓋 mindset+array 全 5 Concept），僅
`problemDifficulties` / `challengeDifficulty` / `targetLevel` 分歧——**在 stub 規模即展示 AC5 難度分歧**。

**Rationale**：對齊 `modules.json` / `problem-bank.json` 的資料驅動 + zod 作風（clarify Q5）；stub 只有 2 個有 Concept
的 Level，涵蓋分歧無從展示，故以難度帶分歧滿足 AC5，涵蓋分歧改由合成多-Level fixture 的單元測試涵蓋（R9）。

**Alternatives considered**：Track 參數寫死於程式 / 併入 overlay → 否決（clarify Q5）。

---

## R7 — `TrackOverlay` schema 與疊加語意（US3 / FR-008/009）

**Decision**：`overlays/{track}.json` = `{ track, byConcept: Record<conceptId, { extraProblemIds?, extraNotesMarkdown?,
challengeDifficulty? }> }`，`zod` `.strict()` 驗證。生成器套用時：`extraProblemIds` **附加**於過濾結果之後（不取代）；
`extraNotesMarkdown` 與 `challengeDifficulty` 本 Feature **僅驗結構**（正文疊加、per-concept challenge 覆寫語意皆由 F5
消費——rhythm 的 challenge 槽非 concept-bound，F4 無明確作用點）。
**Overlay key MUST 為該 Track 已涵蓋的 Concept**，否則 `overlay-unknown-concept` error 級違規、fail loud（clarify Q4）。

**Rationale**：Overlay 是承載 Track 差異而不污染共用教材的唯一機制（憲章 VI）；「疊加不取代」以「附加於過濾結果之後」
落實，並有單元測試斷言 Core 題目仍在（SC-005）。stub overlay 給最小示例（如一筆 `extraProblemIds`）以驗疊加路徑。

**Alternatives considered**：Overlay 懸空採忽略+warning → 否決（clarify Q4 已定 fail loud）。

---

## R8 — 違規模型：沿用 F2/F3 `Violation` 結構

**Decision**：新增 `ScheduleViolationRule` 列舉，`ScheduleViolation` 沿用同一結構
（`rule / severity / subject / field? / target? / message`）。規則見 data-model.md §5。排序以
`(rule, subject, field)` 穩定排序（比照 F2/F3 `cmpViolation`），使違規清單本身亦 determinism。

**Rationale**：三個 Feature 共用同一違規契約，`scripts/` 的 formatter 可原樣重用（F3 已示範單一 formatter 服務兩者）；
fail loud + 具名（憲章 XV）。

**Alternatives considered**：自訂 throw/Error 字串 → 否決：不利彙總、排序與測試逐類斷言（SC-007）。

---

## R9 — 測試策略：stub 驅動 + 合成 fixture 補涵蓋分歧

**Decision**：
- **determinism**（US1）：對 stub 連續生成兩次比對字串相等；快照比對 committed 檔。
- **拓樸子序列 / one-concept**（US2）：驗每 concept Session 的 prereq 皆在更前 index；合成一個「參數要求違序」案例斷言
  fail loud。
- **涵蓋分歧 / 閉包**（US3/FR-014a）：以**合成多-Level DAG fixture**（≥3 Level、跨 Level prereq）驗 `maxLevel` 切分與
  `coverage-gap`（用 `moduleAllowlist` 跳號構造）。
- **節奏 / reviewRange**（US4）：驗每週含 review/rest、`reviewRange` 起訖（含第一週 `[1,3]`）。
- **Gate**（US5）：dangling conceptId / dangling problemId / overlay-unknown-concept 各一案例。
- **schema**：track-params / overlay / schedule 合法 + 非法樣本。

**Rationale**：stub（真實 F2/F3 種子）證明端到端鏈路；合成 fixture 補 stub 因只有 2 Level 而驗不到的涵蓋分歧與閉包
gap。全部離線、確定性、mock-free（無外部呼叫）。

**Alternatives considered**：只用 stub → 否決：驗不到 `maxLevel` 分歧與 `coverage-gap`。

---

## R10 — CI Gate 與 determinism drift、npm scripts

**Decision**：新增 `package.json` scripts `generate:schedule`（`tsx scripts/generate-schedule.ts`）與
`validate:schedule`（`tsx scripts/validate-schedule.ts`）。`validate-schedule.ts` **以同一顆生成器重生成三份課表於記憶體 →
跑 `validateSchedule` → 與 committed `schedules/{track}.json` 逐位元組比對**，任一 error 或 drift 即非零 exit。`ci.yml`
於 `validate:problem-bank` 後新增一步 `npm run validate:schedule`。

**Rationale**：CI 以「重生成並比對」同時驗**內建 Gate**與**生成物未被手改 / determinism 未漂移**（憲章 XIII / FR-016），
且與生成用同一實作（FR-017，非雙軌）。工作流 = 改輸入 → `npm run generate:schedule` → review diff → commit。

**Alternatives considered**：CI 另寫一套獨立驗證器 → 否決（違單一實作）；不比對 committed 檔只跑內建 Gate → 否決：無法
偵測手改生成物。
