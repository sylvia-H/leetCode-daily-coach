# Implementation Plan: Schedule Generator（課表生成器、三組 Track 參數與 Track Overlay）

**Branch**: `004-schedule-generator` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-schedule-generator/spec.md`

## Summary

F4 交付**「把共用 DAG + 週節奏模板 + 三組 Track 參數，確定性攤平成三份可驗證課表」的生成器與其資料契約**。核心：

- **US1 determinism**：`scripts/generate-schedule.ts` 一次生成 `schedules/{track}.json` × 3，同輸入 → **byte-identical**（canonical serializer：固定欄位序、2-space、LF、檔尾換行）。
- **US2 拓樸子序列**：Concept 出現序取自 F2 canonical `topoOrder`；每個 `concept` Session 恰引入一個新 Concept，無前向依賴。
- **US3 共用教材、Overlay 疊加**：三 Track 共用同一 DAG／教材；分歧走【涵蓋範圍 + 難度帶 + Challenge 難度】。`TrackOverlay`（疊加不取代）schema 落地。
- **US4 週節奏**：相對天數（每 7 Session 一輪）內建 `review` / `rest`；`reviewRange` 涵蓋本週已上 Session。
- **US5 內建 Gate**：拓樸子序列、`reviewRange`、dangling `conceptId` / `problemIds`、涵蓋閉包、Overlay 指向未涵蓋 Concept——全部 fail loud、具名、非零 exit、不寫半成品。

**技術取向**：沿用 F2/F3 的「純函式模組 + 薄入口」分層——生成／驗證／序列化為**單一實作**（`src/compiler/schedule-generator.ts`，無 `process.exit`、無 I/O），`process.exit` 與檔案寫入只在 `scripts/` 入口。消費 F2（`loadCurriculum` / `validateCurriculum` / `topoOrder` / `ordinalOf`）與 F3（`loadProblemBank` / `makeProblemExists`），`zod` 驗三份輸入 schema。零 LLM、零網路、確定性。以 **stub DAG（F2 5 個 Concept／2 Module）+ F3 seed 題庫**開發；正式全量課表待 F7。

## Technical Context

**Language/Version**: strict TypeScript 5.5（`tsc` → `node` / `tsx`），Node.js 24。

**Primary Dependencies**: `zod`（JSON schema，已於 F2 引入）；Node 內建 `fs`（讀寫檔）。**無新增相依**。消費 F2 `src/compiler/curriculum.ts` 與 F3 `src/compiler/problem.ts`。測試 `vitest`；入口用 `tsx`。

**Storage**: 版本控制的 JSON。**輸入**：`curriculum/modules.json`（F2）、`concepts/**`（F2 stub）、`data/problem-bank.json`（F3 seed）、`curriculum/track-params.json`（**新增**，Track 參數，zod 驗證）、`overlays/{track}.json`（**新增**，Track Overlay）。**輸出（生成物）**：`schedules/{foundation,interview-ready,interview-mastery}.json`（**新增**，commit 後凍結，MUST NOT 手改）。

**Testing**: `vitest`（單元）＋ `npm run validate:schedule`（CI Gate 入口：重生成 → 驗證 → 與 committed 檔逐位元組比對 determinism drift）。

**Target Platform**: GitHub Actions（Node 24）上的一次性 build-time script；純函式核心亦供 F5 runtime / CI Gate `import`。

**Project Type**: 單一專案 CLI／library（composition root 手寫，無框架、無 HTTP server）。

**Performance Goals**: N/A（stub 5 Concept、輸出 sub-ms）；硬性要求為 **determinism（byte-identical）**。

**Constraints**: 零 LLM（`src/` MUST NOT import `@google/genai`）、零網路、確定性；生成／驗證**單一實作**（FR-017，禁雙軌）；純函式無副作用，`process.exit` 只留在 `scripts/` 入口；生成物 canonical 序列化（固定欄位序 / LF / 檔尾換行）以確保跨平台 byte-identical。

**Scale/Scope**: stub = F2 的 5 Concept（`programming-mindset` Level 0、`array` Level 1）成一條線性 DAG，F3 的 seed 題號 {1,26,27,283,303,560}（Easy/Medium，無 Hard）。三 Track 在 stub 規模下**以難度帶分歧展示 AC5**（涵蓋分歧需多 Level，於單元測試以合成 fixture 驗證）。正式 ~180×3 全量課表待 F7。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

逐條對照 `.specify/memory/constitution.md`（v1.0.1）：

| 原則 | 判定 | 說明 |
| --- | --- | --- |
| II. One Concept per Session | ✅ PASS | 每個 `concept` Session 恰引入一個新 Concept；`one-concept-per-session` 為內建 Gate + 單元測試（SC-006）。 |
| IV. Deterministic Curriculum | ✅ PASS | 順序取自 DAG canonical `topoOrder`；**LLM 全程不參與**排序／生成；無隨機源、無系統時間、無 `readdir` 序依賴。 |
| V. Curriculum as DAG | ✅ PASS | 課表為 DAG 的合法拓樸子序列；`forward-dependency` 為內建 error 級 Gate（US2）。 |
| VI. Shared Knowledge, Different Tracks | ✅ PASS | 三 Track 共用同一 DAG／教材；分歧只走【涵蓋範圍 + 難度帶 + Challenge 難度 + Overlay】；難度差異化由 Problem Bank 過濾 + Overlay 提供（憲章明訂），MUST NOT 複製教材。 |
| VIII. Zero-LLM Daily Runtime | ✅ PASS | 生成器為 `scripts/` build-time；`src/compiler/schedule-generator.ts` 不 import `@google/genai`；補一條 zero-llm 掃描斷言（比照 `tests/unit/zero-llm.test.ts`）。 |
| IX. Build-time over Runtime／單一 Compiler | ✅ PASS | 生成／驗證／序列化為**單一模組**；CI `validate:schedule` 以同一顆重生成並比對，未另寫平行驗證（FR-017）。 |
| XI. Renderer Knows Nothing | ✅ PASS | 難度分歧於 **schedule 層**即帶入 `problemIds`，MUST NOT 推給 Renderer（本 Feature 不動 Renderer）。 |
| XIII. Generated Artifacts Frozen | ✅ PASS（核心） | `schedules/{track}.json` 由 `generate-schedule.ts` 確定性生成、commit 後凍結；工作流為「改輸入 → 重跑 → diff → commit」；CI determinism drift gate 守住「不得手改」。 |
| XV. Fault Isolation & Fail Loud | ✅ PASS | 全部違規為結構化 `Violation`（沿用 F2/F3 契約）；有 error 即非零 exit、不寫半成品。 |
| 測試優先（§22.2） | ✅ PASS | determinism（byte-identical）、拓樸子序列、`reviewRange`、Overlay 疊加不取代、dangling、涵蓋閉包、one-concept——每類至少一單元測試。 |
| 技術釘死（§22.3） | ✅ PASS | `zod` 驗 schema、`vitest`、`tsx` 入口；無新框架、無新付費相依。 |

**結論**：無違反任一 MUST／MUST NOT。**Complexity Tracking 留空**。

**Phase 1 設計後再檢（Post-Design Re-check）**：research.md（R1–R10）與 contracts 未引入任何偏離——生成/驗證/序列化維持
單一純函式模組（IX）、順序全取自 DAG `topoOrder`（IV/V）、難度分歧走 Problem Bank 過濾 + Overlay（VI）於 schedule 層固化
（XI）、determinism drift gate 守住生成物凍結（XIII）、全違規具名 fail loud（XV）。**判定不變：PASS**。

## Project Structure

### Documentation (this feature)

```text
specs/004-schedule-generator/
├── plan.md              # 本檔（/speckit-plan 輸出）
├── research.md          # Phase 0：關鍵設計決策（R1–R10）
├── data-model.md        # Phase 1：SessionPlan / TrackSchedule / TrackParams / TrackOverlay / 違規規則
├── quickstart.md        # Phase 1：生成／驗證／determinism 的可執行驗收指引
├── contracts/
│   ├── track-params-schema.md    # curriculum/track-params.json 的 JSON schema 契約
│   ├── overlay-schema.md         # overlays/{track}.json 的 JSON schema 契約（§16.3）
│   ├── schedule-schema.md        # schedules/{track}.json 生成物的 JSON schema 契約（§16.2）
│   └── generator-api.md          # src/compiler/schedule-generator.ts 對外函式契約
├── checklists/
│   ├── requirements.md  # 既有（spec 品質檢查）
│   └── generator.md     # pre-implement Gate（需求品質，Determinism／難度帶／Overlay 重點）
└── tasks.md             # /speckit-tasks 產出（非本命令）
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── lesson.ts             # 既有（F1）：Track / SessionType（本 Feature import，MUST NOT 重定義）
│   ├── curriculum.ts         # 既有（F2）：CurriculumGraph / ConceptNode / Ordinal / Violation
│   ├── problem.ts            # 既有（F3）：ProblemBank / Difficulty
│   └── schedule.ts           # 【新增】SessionPlan(§16.2) / TrackSchedule / TrackParams / TrackOverlay
│                             #          / ScheduleViolation / ScheduleViolationRule（純型別）
├── compiler/
│   ├── curriculum.ts         # 既有（F2）：loadCurriculum / validateCurriculum / topoOrder（消費，不改）
│   ├── problem.ts            # 既有（F3）：loadProblemBank / makeProblemExists（消費，不改）
│   ├── schedule.ts           # 既有（F1 臨時 shim）：getSessionPlan / getPathLabels（**本 Feature 不動**；
│   │                         #   仍供 F1 walking-skeleton compile；F5 才改由生成物取代）
│   ├── schedule-schema.ts    # 【新增】zod 解析 track-params / overlay 輸入（→ 具名 schema-* 違規）
│   └── schedule-generator.ts # 【新增】單一實作：generateAllSchedules / validateSchedule /
│                             #          serializeSchedule（純函式；無 process.exit、無 I/O）
curriculum/
├── modules.json              # 既有（F2）
└── track-params.json         # 【新增】三組 Track 參數（zod 驗證；stub 規模值）
overlays/                     # 【新增目錄】Track Overlay（疊加不取代）
├── foundation.json
├── interview-ready.json
└── interview-mastery.json
schedules/                    # 【新增目錄】生成物（commit 後凍結；MUST NOT 手寫）
├── foundation.json
├── interview-ready.json
└── interview-mastery.json
scripts/
├── validate-curriculum.ts    # 既有（F2）
├── validate-problem-bank.ts  # 既有（F3）
├── generate-schedule.ts      # 【新增】入口：載入 → generateAllSchedules → 寫三檔 → exit（唯一 I/O + process.exit）
└── validate-schedule.ts      # 【新增】CI Gate 入口：重生成 → validateSchedule → 與 committed 逐位元組比對 → exit
tests/
├── fixtures/
│   └── schedule/**           # 【新增】合成多-Level DAG（驗涵蓋分歧/閉包）、非法 track-params / overlay fixtures
└── unit/
    ├── schedule-generate.test.ts  # 【新增】US1 determinism（byte-identical、重跑無 diff）
    ├── schedule-topo.test.ts      # 【新增】US2 拓樸子序列 + one-concept-per-session
    ├── schedule-track.test.ts     # 【新增】US3 共用教材 + 難度帶分歧 + Overlay 疊加不取代
    ├── schedule-rhythm.test.ts    # 【新增】US4 review/rest 節奏 + reviewRange 正確（含第一週）
    ├── schedule-gate.test.ts      # 【新增】US5 各違規類型 fail loud（dangling / 閉包 gap / overlay-unknown）
    ├── schedule-schema.test.ts    # 【新增】track-params / overlay / schedule zod 合法+非法樣本
    ├── schedule.test.ts           # 既有（F1）：getSessionPlan/getPathLabels（**保持綠燈，不改**）
    └── zero-llm.test.ts           # 【小改】掃描補 src/compiler/schedule-generator.ts 涵蓋斷言
.github/workflows/ci.yml      # 【小改】新增一步 `npm run validate:schedule`
package.json                  # 【小改】新增 scripts `generate:schedule` / `validate:schedule`
```

**Structure Decision**: 沿用 F2/F3「純函式模組 + 薄入口」分層。F4 邏輯集中在**單一模組** `src/compiler/schedule-generator.ts`（FR-017），輸入 zod 於 `schedule-schema.ts`，型別於 `src/types/schedule.ts`。**刻意不動 F1 的 `src/compiler/schedule.ts` shim**——它仍被 F1 walking-skeleton 的 `compile` 消費，改由生成物取代是 F5 職責（F2 clarify 2026-07-21 定案）；F4 只新增生成器與生成物，避免破壞既有綠燈。`process.exit` 只在 `scripts/generate-schedule.ts` 與 `scripts/validate-schedule.ts`。Track id（`interviewReady`）↔ 檔名（`interview-ready.json`）映射集中於單一常數表。

## Complexity Tracking

> 無 Constitution 違規，本表留空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| —         | —          | —                                   |
