# Implementation Plan: Curriculum Schema（Curriculum 骨架、Concept frontmatter schema、DAG 建置與驗證）

**Branch**: `002-curriculum-schema` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-curriculum-schema/spec.md`

## Summary

建立課程的**資料契約與驗證機器**：一份確定性的 `curriculum/modules.json`（完整 16-Level 的 Module→Topic
骨架）、一套 Concept frontmatter 的 **schema 驗證**（`zod`，對齊 `docs/spec.md` §10.1），以及一顆
**單一實作**的 curriculum 載入 + in-memory DAG 建置 + 完整性驗證（`src/compiler/curriculum.ts`），
把「課程順序是一張合法 DAG（無環、無前向依賴、參照完整、無孤兒、可拓樸排序）＋顆粒度 / 唯一性結構 Gate」
變成可重複執行、fail-loud 的機器檢查（對應 §24 **AC1**）。

技術上是既有 strict TypeScript 專案的**純資料 / 純計算擴充**：不改每日 runtime、不接 Renderer、無 LLM。
驗證邏輯以**純函式** `validateCurriculum(graph, options?)` 交付，供未來 Lesson Compiler（F5，runtime）與
F7 內容產線 Stage 1 的結構 Gate 共用同一顆實作（憲章 IX；FR-022 / FR-024）。以 **Level 0 + Level 1 的
少量 stub Concept** 驅動整條驗證鏈綠燈；stub 為臨時 seed，F7 產線取代。

F2 在 F1 的工程鷹架上**只新增檔案 + 一個相依（`zod`）+ 一個開發工具（`tsx`，跑驗證入口）**，
不重寫任何 F1 模組。

## Technical Context

**Language/Version**: TypeScript 5.x（strict，沿用 F1 的 `tsconfig.json`，`noUncheckedIndexedAccess` 開啟）
→ `tsc` 編譯 → Node.js 24 執行。

**Primary Dependencies**:
- **新增** `zod`（^3.23）：Concept frontmatter 與 `modules.json` 的 schema 驗證（憲章「技術與資源約束」指定）。
- 沿用 `gray-matter`（讀 Concept 檔的 YAML frontmatter；F1 已引入）。
- **不使用** `marked`：F2 只讀 frontmatter，不解析 Full Article 正文區塊（屬 F5）。
- **新增（devDependency）** `tsx`：以 `tsx scripts/validate-curriculum.ts` 執行驗證入口（FR-028），
  不進入 `tsc` 的 `dist` 建置；同時預先建立 `scripts/` 的執行機制供 F5 / F7 沿用。
- **不引入** `@google/genai`（憲章 VIII；F2 無 LLM）。
- `package-lock.json` MUST 一併 commit（CI 以 `npm ci` 安裝）。

**Storage**: 純檔案。新增 `curriculum/modules.json`（授權手寫的骨架，非生成物）、`concepts/**.md`
（stub Concept Skeleton：frontmatter + Author Hints）。驗證為讀取後的 in-memory 計算，無資料庫、無常駐服務。

**Testing**: `vitest`。以 fixture（合法 + 逐類注入錯誤）與真實 stub 課程覆蓋 §22.2 的「DAG 驗證」測試優先項
（拓樸排序 / 無環 / 無前向依賴 / 參照完整）與 frontmatter schema。無外部呼叫、無 mock 需求。

**Target Platform**: GitHub Actions `ubuntu-latest` + Node 24；本機 Windows / PowerShell
（開發、`npm run validate:curriculum`）。

> **CI 現況與本 Feature 的補齊（定案 2026-07-22，FR-028a）**：本 Feature 之前 repo **只有 `daily.yml`**
> （每日推播用，僅跑 `npm run build`），**單元測試從未在 CI 執行**。F2 新增
> `.github/workflows/ci.yml`（push / PR 觸發：`npm ci` → `npm run build` → `npm test` →
> `npm run validate:curriculum`），使 FR-028「供本地與 CI 呼叫」真正成立，並讓 F1 既有測試一併受保護。
> 此為**工程鷹架**，與 F5 的內容 Gate（全 Track × 全 Session 編譯 + Discord 限制檢查）分屬不同關卡。

**Project Type**: 單一專案的**純函式庫 + 一支驗證 CLI**（無 HTTP server、無 DI 框架、無 runtime 副作用）。

**Performance Goals**: 非效能導向。stub 規模（Level 0+1，數十個 Concept 節點）驗證應在毫秒級完成；
即使未來 150+ Concept，DAG 驗證仍為線性 / 近線性，遠低於任何實務門檻。

**Constraints**:
- **確定性（FR-025）**：同一輸入 → 相同驗證結論與拓樸順序，不依賴檔案列舉順序 / 雜湊順序 / 時間。
- **單一實作（FR-022 / FR-024）**：載入 + DAG + 結構 Gate 僅一份，供 runtime 與 build-time Gate 共用；
  MUST NOT 雙軌。置於 §17 既定的 `src/compiler/curriculum.ts`。
- **自足（FR-026）**：可在無 Problem Bank / 無 schedules / 無 articles 的環境獨立執行；`leetcode` 存在性
  為可插拔關卡（FR-023），F2 只驗格式、存在性延後至 F3。
- **fail loud（FR-008 / FR-028）**：驗證失敗 MUST 指名違規 Concept / 欄位 / 規則並以非零狀態回報，
  MUST NOT 以空值 / 預設值靜默帶過。
- **零 LLM / 零 runtime 改動**：`src/**` MUST NOT import `@google/genai`；不改 `daily.yml`、不改 F1 執行路徑。

**Scale/Scope**: `modules.json` 完整 16 Module + 各自 Topic；stub Concept 涵蓋 Level 0（Programming Mindset）
+ Level 1（Array）少量節點（估 6～10 個，足以觸發每一條 DAG / schema / 顆粒度規則）。
預估 production code（`src/compiler/schema.ts` + `curriculum.ts` + 型別）~350–500 行、
`scripts/validate-curriculum.ts` ~40–60 行、測試 ~500–700 行、`modules.json` + stub 內容為資料。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

逐條對照憲章 v1.0.1：

| # | 原則 | 本 Feature 判定 | 說明 |
|---|---|---|---|
| I | Concept-first, Problem-second | ➖ N/A | 本 Feature 無推播 / 渲染，不決定版面順序 |
| II | One Concept per Session | ➖ N/A | 無 Session / 課表（F4）；F2 只建 Concept 之間的 DAG |
| III | Small Learning Steps | ✅ PASS | FR-019 / FR-021 的顆粒度結構 Gate 正是「細顆粒度可機器驗」的落地 |
| IV | Deterministic Curriculum | ✅ PASS | `modules.json` 順序凍結；全部驗證為確定性純計算（FR-025）；無任何動態排序 |
| V | Curriculum as DAG | ✅ PASS | **本 Feature 的核心**：DAG 建置 + 無環 + 無前向依賴 + 參照完整 + 無孤兒 + 拓樸排序（FR-010～016，對應 AC1） |
| VI | Shared Knowledge, Different Tracks | ➖ N/A | 無 Track / Overlay（F4）；但交付的是**單一共用 DAG**，與 VI 的「共用知識圖譜」一致 |
| VII | LLM Authors Once, Not Daily | ➖ N/A | 無 LLM；stub Concept 為人工 seed（F7 產線取代） |
| VIII | Zero-LLM Daily Runtime | ✅ PASS | 未新增任何 LLM 相依；`src/**` 無 `@google/genai`；`curriculum.ts` 可於零 LLM 環境被 runtime import |
| IX | Build-time over Runtime | ✅ PASS（強化） | 載入 + DAG + 結構 Gate 為**單一純函式實作**（FR-024），供未來 runtime Compiler 與 F7 Stage 1 / CI Gate 共用同一顆（FR-022），從源頭杜絕雙軌 |
| X | Language-specific Learning | ➖ N/A | 屬教材內容（F5 / F7） |
| XI | Renderer Knows Nothing About Curriculum | ➖ N/A | 不改 Renderer；F2 的所有邏輯位於 `src/compiler/`，本就是 Curriculum 知識的正確歸屬 |
| XII | Deterministic & Reproducible Delivery | ✅ PASS | 驗證確定性（FR-025）；SC-005（重複 100 次結論與拓樸順序逐次一致）為直接驗收 |
| XIII | Generated Artifacts Are Frozen Once Committed | ⚠️ 需正當化 | stub Concept 置於 `concepts/**`（F7 產線的輸出路徑）——與 F1 手寫教材置於 `articles/**` 同理，屬 seed 而非違規手改。`modules.json` 為**授權手寫的骨架**（§8.1 明訂 modules.json 為骨架來源，非生成物）。詳見 Complexity Tracking |
| XIV | Secrets Never in Repo | ✅ PASS | 不涉任何機密 |
| XV | Fault Isolation & Fail Loud | ✅ PASS | 驗證逐項回報具名違規、非零 exit（FR-008 / FR-028）；MUST NOT 靜默預設值 |
| XVI | Free-tier Only | ✅ PASS | 純本地 / CI 計算，無任何 infra |
| XVII | One Human Checkpoint | ➖ N/A | F2 定義骨架屬一次性 authoring；內容產線唯一人工檢查點（outline）屬 F7。見 research R6 的 Topic 顆粒度取捨 |

**技術與資源約束**：遵循——strict TS、`zod`、`gray-matter`、`vitest`、Node 24、固定環境變數命名（F2 未新增
runtime 環境變數）。唯一新增相依 `zod` 為憲章明列指定項；`tsx` 為執行 `scripts/` 的開發工具，
不進入 runtime / dist。無 plan 階段另行選型。

**Gate 結論**：**通過**。唯一需正當化項（XIII 的 stub Concept 路徑）有明確 seed 定位與 F7 收斂路徑，
與 F1 既定判例一致，記錄於 Complexity Tracking。

### Post-Design Re-check（Phase 1 完成後）

重新逐條檢視：判定不變，未因設計新增違反。三項設計決策強化合規：

1. `validateCurriculum` 為**單一純函式**、以 `options.mode`（`stub` | `full`）與可插拔 `problemExists`
   參數化 → 收斂原則 IX（F5 / F7 Gate 直接呼叫同一顆，不重寫）與 FR-021 / FR-023。
2. 前向依賴以 **modules.json 宣告序 + Topic 內 `NNN`** 構成的確定性全序判定（clarify Q3），
   使原則 V 的「無前向依賴」獨立於「無環」而可機器驗，且結果不隨載入順序漂移 → 強化原則 IV / XII。
3. `modules.json` 與 Concept frontmatter 皆走 `zod` schema（`safeParse` 收集全部 issue）→ fail loud
   且錯誤具名 → 落實原則 XV；schema 與圖驗證分層，各自可獨立測試。

## Project Structure

### Documentation (this feature)

```text
specs/002-curriculum-schema/
├── plan.md              # 本檔
├── research.md          # Phase 0 產出：技術決策與待定項解消
├── data-model.md        # Phase 1 產出：實體與驗證規則
├── quickstart.md        # Phase 1 產出：驗證 / 執行指南
├── contracts/           # Phase 1 產出
│   ├── modules-schema.md              # curriculum/modules.json 結構與 zod 契約
│   ├── concept-frontmatter-schema.md  # §10.1 欄位、型別、值域、id slug 規則
│   └── curriculum-validation-contract.md # loadCurriculum() / validateCurriculum(graph, options?) API：檢查清單、錯誤分類、模式、退場語意
├── checklists/
│   ├── requirements.md  # 已存在（/speckit-specify 產出）
│   └── dag-validation.md # 已存在（/speckit-checklist 產出：DAG 驗證專項）
└── tasks.md             # Phase 2 產出（/speckit-tasks，非本指令產生）
```

### Source Code (repository root)

```text
leetcode-daily-coach/
├── package.json                     # 修改：新增 dep `zod`、devDep `tsx`、script `validate:curriculum`
├── package-lock.json                # 修改：MUST commit
├── .github/workflows/
│   └── ci.yml                       # 新增（FR-028a）：push / PR → npm ci → build → test → validate:curriculum
│                                    #   （既有 daily.yml 不改動）
├── curriculum/
│   └── modules.json                 # 新增（授權手寫骨架）：完整 16-Level Module→Topic 順序（Deterministic）
├── concepts/                        # 新增：stub Concept Skeleton（frontmatter + Author Hints；F7 產線取代）
│   │                                #   資料夾名 == topic id；主 Topic 沿用 Module id（clarify 2026-07-21）
│   ├── programming-mindset/         # Level 0 Module `programming-mindset` 的主 Topic
│   │   ├── 001-time-space-complexity.md   # 合法起點（該 Topic NNN 最小，免除孤兒判定）
│   │   └── 002-reading-the-problem.md     # 非起點 → MUST 由 001 的 next 指向（雙向一致）
│   └── array/                       # Level 1 Module `array` 的主 Topic
│       ├── 001-array-traversal.md         # prerequisite 指向 programming-mindset 的 Concept
│       ├── 002-in-place-operations.md
│       └── 003-prefix-sum.md
├── src/
│   ├── types/
│   │   └── curriculum.ts            # 新增：ConceptNode / ModuleNode / TopicNode / CurriculumGraph / ValidationResult / Violation 型別
│   └── compiler/
│       ├── schema.ts                # 新增：zod schemas（conceptFrontmatterSchema / modulesSchema）+ parse 函式
│       └── curriculum.ts            # 新增：loadCurriculum() + buildGraph() + validateCurriculum() —— 單一實作（FR-024）
├── scripts/
│   └── validate-curriculum.ts       # 新增：驗證入口（讀 modules.json + concepts/** → validateCurriculum → 印違規 → exit code）
└── tests/
    ├── fixtures/
    │   └── curriculum/              # 驗證測試素材（合法基準 + 逐類缺陷）
    │       ├── valid/               #   合法 stub 課程（modules.json + concepts）
    │       ├── cycle/               #   成環
    │       ├── forward-dep/         #   前向依賴
    │       ├── dangling-ref/        #   懸空 prerequisite / next / module / topic
    │       ├── orphan/              #   孤兒
    │       ├── dup-id/              #   重複 id
    │       ├── bad-frontmatter/     #   缺欄位 / 型別錯 / 值域錯 / id 非 slug / leetcode 格式錯
    │       ├── edge-inconsistency/  #   next / prerequisite 單向宣告（error）
    │       ├── duplicate-edge/      #   同一 Concept 重複依賴邊（warning，不阻擋）
    │       ├── empty/               #   空課程（0 個 Concept；兩模式皆 error）
    │       └── granularity/         #   Topic / Module 數量超上限 + 恰好等於上/下限（閉區間邊界）
    └── unit/
        ├── schema.test.ts            # frontmatter / modules.json schema：合法通過、逐類非法具名報錯（SC-003）
        ├── curriculum-load.test.ts   # 載入 + module/topic 參照完整、骨架不一致報錯
        ├── dag-validate.test.ts      # 無環 / 前向依賴 / 懸空參照 / 孤兒 / 自我依賴 / 重複邊（SC-001 / SC-002）
        ├── topo-order.test.ts        # 拓樸排序可線性化 + 確定性（重複 100 次一致，SC-005）
        ├── granularity-gate.test.ts  # 顆粒度上/下限、唯一性、stub/full 模式（SC-004）
        ├── leetcode-pluggable.test.ts# 無題庫時 leetcode 存在性標記「延後 F3」、格式仍驗（SC-006 / FR-023）
        └── stub-curriculum.test.ts   # 交付的真實 stub 課程整條驗證綠燈（SC-001 / US4）
```

**Structure Decision**: 沿用 F1 的**單一專案、分層模組**結構，目錄與 `docs/spec.md` §17 完全對齊。
F2 首次建立 `curriculum/`、`concepts/`、`scripts/` 三個 §17 既定目錄，並在 `src/compiler/` 新增
`schema.ts` / `curriculum.ts`（§17 明列 `compiler/curriculum.ts`）。新增 `src/types/curriculum.ts`
作為 DAG 相關型別的入口（與 F1 的 `types/lesson.ts` 同樣模式，讓型別與實作分離）。
驗證入口 `scripts/validate-curriculum.ts` 以 `tsx` 執行，不動 `tsc` 的 `src/**` 建置範圍。
與 §17 的差異僅為尚未進入範圍者（`overlays/` / `schedules/` / `articles/` 的完整內容、
`scripts/generate-*.ts` 屬 F4 / F5 / F7）。

## Complexity Tracking

> 僅記錄 Constitution Check 中需正當化的偏離。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **原則 XIII（生成物凍結）**：stub Concept 置於 `concepts/**`——該路徑在最終架構是 F7 產線的輸出目錄 | F2 要驗證的是**真實讀取路徑**（`concepts/**` → frontmatter → DAG）。stub 放在假路徑會使 F5 / F7 必須改動 `curriculum.ts` 的讀取邏輯，等於 F2 沒驗到產品路徑 | 「放 `tests/fixtures/`」被否決：fixtures 用於**注入錯誤情境**的測試替身，但**交付的 stub 課程**必須佔真實路徑以證明整鏈可跑。緩解：每個 stub 檔頂端 MUST 加註「F2 stub seed，F7 產線上線後由生成物取代」（FR-027）；憲章 XIII 禁止的是「手改**既有生成物**」，此處產線尚未存在、無生成物可改，屬 seed 而非違規手改——與 F1 `articles/**` 手寫教材同一判例 |
| **原則 XIII 相關**：`curriculum/modules.json` 為手寫 | §8.1 明訂 `modules.json` 是 **Module / Topic 骨架的來源真相**（由人定序、版本控制），**不是**生成物 | 因此手寫 `modules.json` **不構成偏離**，列此僅為與 `schedules/*.json`（MUST NOT 手寫）對比澄清：骨架是手寫來源、課表是生成產物，兩者路徑與紀律不同 |
