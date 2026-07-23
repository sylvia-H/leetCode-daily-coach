# Implementation Plan: Lesson Compiler、全 Session 類型 Renderer 與內容 CI Gate

**Branch**: `005-lesson-compiler` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-lesson-compiler/spec.md`

## Summary

F5 把前四個 Feature 交付的素材（DAG、題庫、三份課表、Overlay）接成 `docs/spec.md` §7.1 的**單一顆 Lesson
Compiler**，並讓 Renderer 支援全部五種 Session 類型，最後以 `scripts/validate.ts` + `content-gate.yml`
對「全 Track × 全 Session」完整編譯 + render + 限制檢查。核心：

- **US1 真實素材編譯**：`compile(track, sessionIndex)` 改由 `schedules/{track}.json` 取得 `SessionPlan`、
  由 F2 `ConceptNode.articlePath` 讀 Full Article、由 F3 Problem Bank 帶入題目 metadata、由 DAG 推 `path`。
  同時清償 F1 三筆硬編債（`SESSION_PLANS` / `getPathLabels` / `DEMO_*` 常數，FR-029）。
- **US2 五種 Session 類型**：`concept` / `practice` / `review` / `challenge` / `rest` 各有 Lesson 形狀與版面；
  版面只依 `Lesson.type` 分派，`Lesson.track` 不影響結構。
- **US3 內容 Gate**：`src/compiler/gate.ts`（純函式）逐筆編譯 + render + `checkBudget`，蒐集**全部**違規後
  由 `scripts/validate.ts` 一次回報並以非零 exit code 結束；`content-gate.yml` 對七類路徑觸發。
- **US4 Renderer 純函式**：`render(lesson)` 回傳 `RenderedMessage[]`（支援 §14.5 的第二則訊息 fallback），
  只 import 型別；預算 slot 與 embeds 共用**同一份字串實例**，避免量測值與送出值漂移。
- **US5 Overlay 疊加**：教材正文三軌相同、`Lesson.problems` 完全等於課表 `problemIds`（`extraProblemIds`
  已於 F4 生成階段套入課表，Compiler 不再套用）、`extraNotesMarkdown` 以獨立區塊附加不取代。

**技術取向**：沿用 F2/F3/F4 的分層——**純函式核心在 `src/`（無 I/O、無 `process.exit`）、I/O 與 exit 只在
`scripts/` 入口**；Gate 與 runtime `import` 同一顆 `compile` / `render` / `checkBudget`（憲章 IX，禁雙軌）。
零新增相依（沿用 `gray-matter` / `marked` / `zod` / `vitest`）。教材以 **F2 的 5 個 stub Concept 對應的
fixture Full Article** 開發，正式全量教材待 F7。

## Technical Context

**Language/Version**: strict TypeScript 5.5（`tsc` → `node dist/main.js`；script 以 `tsx` 執行），Node.js 24。

**Primary Dependencies**: `gray-matter` + `marked`（Full Article frontmatter / 固定區塊解析，F1 已引入）、
`zod`（Overlay / 課表 schema，經 F4 `schedule-schema.ts`）。消費 F2 `curriculum.ts`、F3 `problem.ts`、
F4 `schedule-schema.ts` 與 `schedules/**`、`overlays/**`。**無新增相依**。

**Storage**: 版本控制的檔案。**輸入**：`curriculum/modules.json`、`concepts/**`（F2）、
`data/problem-bank.json`（F3）、`schedules/{track}.json`、`overlays/{track}.json`（F4）、
`articles/**`（本 Feature 新增 5 篇 stub fixture Article）。**輸出**：無新增 committed 生成物
（Lesson / embeds 皆為 in-memory 產物）。

**Testing**: `vitest` 單元測試 + `npm run validate:content`（Gate 入口，本機與 CI 同一條指令）。

**Target Platform**: GitHub Actions（Node 24）上的一次性 CLI／CI script；同一顆核心供 F6 每日 runtime `import`。

**Project Type**: 單一專案 CLI／library（composition root 手寫，無框架、無 HTTP server）。

**Performance Goals**: N/A（stub 規模 3 Track × 13 Session = 39 筆，sub-second）。硬性要求為
**determinism**（同輸入 → 序列化後 byte-identical 的 Lesson 與 embeds）。

**Constraints**: 零 LLM（`src/` MUST NOT import `@google/genai`）、零網路、確定性；Gate 與 runtime
**單一 Compiler / 單一 Renderer / 單一預算函式**；Renderer 只 import 型別（憲章 XI）；超限 MUST NOT 截斷；
長度單位為 Unicode code point；單則訊息 ≤ 5,500（平台硬限 6,000）。

**Scale/Scope**: F2 stub = 5 Concept（`programming-mindset` Level 0 ×2、`array` Level 1 ×3）；F4 stub 課表 =
每 Track 13 Session（5 concept / 2 practice / 2 challenge / 2 review / 2 rest）；Gate 覆蓋 **39 筆 Lesson**，
五種類型全數涵蓋。`interviewMastery` 因題庫無 Hard 題而多數 Session 無題目——**這是刻意保留的邊界案例**，
用來證明「無題目 Session」為一等合法狀態。正式 ~180×3 待 F7。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

逐條對照 `.specify/memory/constitution.md`（v1.0.1）：

| 原則 | 判定 | 說明 |
| --- | --- | --- |
| I. Concept-first, Problem-second | ✅ PASS | concept 版面固定「主 Embed（觀念）→ 題目 Embed → 結尾 Embed」，順序寫死於 Renderer，不可被資料翻轉。 |
| II. One Concept per Session | ✅ PASS | Compiler 對 `concept` Session 只讀**一個** `conceptId` 的 Article；課表側的「一 Session 一 Concept」已由 F4 Gate 保證，本 Feature 不放寬。 |
| IV. Deterministic Curriculum | ✅ PASS | 順序全取自 committed 課表；Compiler 不重排、不選題（challenge 選題已於 F4 生成時凍結，R6）。無隨機源、無系統時間、無 `readdir` 序依賴。 |
| V. Curriculum as DAG | ✅ PASS | `Lesson.path` 由 DAG `prerequisite` / `next` 推導，決勝鍵沿用 F2 `ordinalOf` 全序（R4）。 |
| VI. Shared Knowledge, Different Tracks | ✅ PASS | 三 Track 讀**同一篇** Article；分歧只來自課表 `problemIds` 與 Overlay 疊加（SC-005 有專測）。MUST NOT 複製教材正文。 |
| VII. LLM Authors Once | ✅ PASS | Compiler 只讀凍結的 `articles/**`，不生成、不改寫。 |
| VIII. Zero-LLM Daily Runtime | ✅ PASS | 全程無 LLM、無網路；沿用既有 zero-llm 掃描測試並擴及新模組。 |
| IX. Build-time over Runtime／單一 Compiler | ✅ PASS | 本 Feature 的核心命題：Gate 與 runtime `import` 同一顆 `compile` / `render` / `checkBudget`；`src/compiler/gate.ts` 為純函式、`scripts/validate.ts` 只做 I/O + exit（R9）。 |
| X. Language-specific Learning | ✅ PASS | concept 版面 MUST 同時含 `TypeScript Tip` 與 `Python Tip`；缺任一即解析失敗（FR-005）。 |
| XI. Renderer Knows Nothing About Curriculum | ✅ PASS | Renderer 只 import `types/lesson.ts`；Module 配色查表留在 Compiler 側（F1 定案），Renderer 只用 `Lesson.color`（頂層欄位）。以 import 掃描測試守住。 |
| XII. Deterministic & Reproducible Delivery | ✅ PASS | 同一 `(track, sessionIndex)` → 序列化後 byte-identical 的 Lesson；同一 Lesson → deep-equal embeds。F8 素材未到之前不引入任何隨機挑選（R7：缺席即省略）。 |
| XIII. Generated Artifacts Frozen | ✅ PASS | 本 Feature 不產生新的 committed 生成物，也不改寫 `schedules/**`；新增的 5 篇 stub Article 屬 F7 前的開發素材，F7 全量展開時取代（R8）。 |
| XV. Fault Isolation & Fail Loud | ✅ PASS | 全部失敗以具名 `GateViolation` / 具名 Error 表達；Gate 蒐集全部違規後非零 exit。**唯二**不失敗的情形（practice/challenge 查無說明來源、F8 素材缺席）已在 spec FR-030 / FR-031 明文界定，非靜默吞錯。 |
| 測試優先（§22.2） | ✅ PASS | Compiler determinism、固定區塊解析、Overlay 疊加不取代、Renderer 純函式性與 Discord 限制（含 6,000 總長）、教材品質 Gate——皆為憲章點名項目，每類至少一單元測試。 |
| 技術釘死（§22.3） | ✅ PASS | `gray-matter` + `marked` + `zod` + `vitest`；無新框架、無新相依、無 HTTP server。 |

**結論**：無違反任一 MUST／MUST NOT。**Complexity Tracking 留空**。

**`/speckit-analyze` 後修訂（2026-07-23）**：分析核對 F4 生成器原始碼後發現兩項與憲章相關的偏離，已修正：

| 發現 | 判定 | 處置 |
| --- | --- | --- |
| Overlay `extraProblemIds` 已由 `generate-schedule.ts` 套入課表，FR-009 卻要求 Compiler 再套用一次 | ❌ 違反 IX（禁雙軌）與 XIII（生成物即權威） | 統一為「選題一律在生成階段定案」：Compiler **不消費** `extraProblemIds`（spec FR-009、research R6、`docs/spec.md` §16.3） |
| `interviewReady` #10（practice）排 4 題，超過 §14.5「最多 3 題」 | ❌ 課表違反技術與資源約束的字元預算 | 題數上限的唯一套用點設在生成端（`docs/spec.md` §13.4 + `session-problem-overflow` 不變式），三份課表已重跑；Compiler / Renderer **MUST NOT 截斷** |

**Phase 1 設計後再檢（Post-Design Re-check）**：research（R1–R12）與四份 contracts 未引入偏離——
Compiler／Renderer／預算函式維持單一實作（IX）、Renderer 仍只 import 型別且新增的 `budgetSlots` 與 embeds
共用同一份字串實例（XI/XII）、選題不在 runtime 發生（IV/XIII）、教材三軌共用（VI）、全違規具名 fail loud
（XV）。三項需回寫 `docs/spec.md` 的跨 Feature 決策（R1 `Today's Challenge` 條目格式、R6 Overlay
`challengeDifficulty` 無套用點、R7 review Challenge 段的題目來源）已於本階段同步。**判定不變：PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/005-lesson-compiler/
├── plan.md              # 本檔（/speckit-plan 輸出）
├── research.md          # Phase 0：關鍵設計決策（R1–R12）
├── data-model.md        # Phase 1：Lesson / ArticleContent / RenderedMessage / GateViolation
├── quickstart.md        # Phase 1：編譯／render／Gate／determinism 的可執行驗收指引
├── contracts/
│   ├── article-format.md      # Full Article 固定區塊與 `Today's Challenge` 條目格式（F1 版之後繼）
│   ├── lesson-contract.md     # Lesson 型別與各 Session 類型的欄位形狀（F1 版之後繼）
│   ├── renderer-contract.md   # 五種版面、RenderedMessage、budgetSlots 與拆訊息規則
│   └── gate-contract.md       # src/compiler/gate.ts API + scripts/validate.ts CLI 契約
├── checklists/
│   ├── requirements.md  # spec 品質檢查（16/16 通過）
│   └── compiler.md      # 實作驗證檢查表（Polish 階段 T056 對照）
└── tasks.md             # /speckit-tasks 產出（非本命令）
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── lesson.ts             # 【改】Lesson 支援五種類型：concept/path 轉選配，新增 reviewConcepts /
│   │                         #      overlayNotes / reflectionQuestion? / encouragement?；新增 RenderedMessage
│   ├── curriculum.ts         # 既有（F2）：CurriculumGraph / ConceptNode / Ordinal（消費，不改）
│   ├── problem.ts            # 既有（F3）（消費，不改）
│   └── schedule.ts           # 既有（F4）：SessionPlan / TrackSchedule / TrackOverlay（消費，不改）
├── compiler/
│   ├── curriculum.ts         # 既有（F2）：loadCurriculum / validateCurriculum（消費，不改）
│   ├── problem.ts            # 既有（F3）：loadProblemBank / getProblemsForConcept（消費，不改）
│   ├── content.ts            # 【改】解析 §10 全部固定區塊 + `Today's Challenge` 逐題條目；MODULE_COLORS
│   │                         #      補齊 modules.json 全部 16 個 Module
│   ├── schedule.ts           # 【重寫】F1 硬編課表 → 讀 schedules/{track}.json、sessionIndex → SessionPlan
│   ├── overlay.ts            # 【新增】載入 overlays/{track}.json（zod）＋ 取出 extraNotesMarkdown
│   │                         #      （選題類欄位不消費，見 research R6）
│   ├── lesson.ts             # 【改】compile(track, sessionIndex, deps) → Lesson；含 path 推導與
│   │                         #      problemId → 引入 Concept 的確定性反查
│   └── gate.ts               # 【新增】純函式：全 Track × 全 Session 編譯 + render + checkBudget → GateViolation[]
├── renderer/
│   ├── discord.ts            # 【改】render(lesson) → RenderedMessage[]；五種版面分派 + 拆訊息 fallback
│   ├── budget.ts             # 【改】checkBudget(message) 依 budgetSlots 檢查逐區塊預算 + 結構性上限 + 總量
│   └── alert.ts              # 既有（F1）（不改）
├── discord/webhook-client.ts # 既有（F1）（不改；多訊息迴圈屬 main.ts）
├── state/state-store.ts      # 既有（F1）（不改）
└── main.ts                   # 【改】改用新的 compile 相依注入；post 迴圈支援 RenderedMessage[]

articles/                     # 【新增 5 篇 stub fixture Article（F7 取代）；移除 F1 的孤兒 article】
├── programming-mindset/001-time-space-complexity.md
├── programming-mindset/002-reading-the-problem.md
├── array/001-array-traversal.md
├── array/002-in-place-operations.md
└── array/003-prefix-sum.md

scripts/
└── validate.ts               # 【新增】Gate 入口：載入 → runContentGate → 逐筆回報 → exit（唯一 I/O + exit）

.github/workflows/
└── content-gate.yml          # 【新增】PR/push Gate（七類路徑觸發；不含程式碼實測——延至 F7，FR-028）

tests/
├── fixtures/articles/**      # 【新增】各類錯誤形態的 Article fixture（缺區塊 / 條目不對齊 / 超預算）
└── unit/                     # 【新增】compile-*.test.ts、overlay.test.ts、path.test.ts、
                              #        renderer-types.test.ts、gate.test.ts、determinism.test.ts…
```

**Structure Decision**：延續 F2–F4 已成立的分層——**純函式核心置於 `src/compiler/` 與 `src/renderer/`
（無 `process.exit`、I/O 只在載入邊界）、CLI 入口置於 `scripts/`**。本 Feature 不新增頂層目錄；
`src/compiler/overlay.ts` 已見於 `docs/spec.md` §17，`src/compiler/gate.ts` 為 §17 未列出的實作分層檔
（責任仍屬 Compiler，不改變任何責任邊界，故不需回寫 §17）。

## Complexity Tracking

> Constitution Check 無違反項，本節留空。
