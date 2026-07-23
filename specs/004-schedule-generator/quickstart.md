# Quickstart: Schedule Generator（驗收與執行指引）

**Feature**: `004-schedule-generator` | 對齊 spec User Stories / Success Criteria

離線、確定性、零 LLM、零網路。以下場景證明 F4 端到端可運作。前置：`npm ci`（Node 24）；F2 stub 課綱與 F3 seed 題庫已在庫。

## 前置檔案

- 輸入：`curriculum/modules.json`、`concepts/**`（F2）、`data/problem-bank.json`（F3）、
  `curriculum/track-params.json`（本 Feature 新增）、`overlays/{track}.json`（本 Feature 新增）。
- 輸出：`schedules/{foundation,interview-ready,interview-mastery}.json`（生成物）。

## 場景 1 — 生成三份課表（US1 / FR-001）

```bash
npm run generate:schedule
```
**預期**：印三 Track 摘要（各課表 Session 數、Concept 數）；寫出 `schedules/*.json` ×3、exit 0。stub 規模下為短課表
（隨涵蓋 Concept 自然收尾，非 180，屬預期）。

## 場景 2 — determinism：同輸入 byte-identical（US1 / SC-001）

```bash
npm run generate:schedule
git status --porcelain schedules/    # 首次生成後 commit；再次執行應無 diff
npm run generate:schedule
git diff --exit-code schedules/       # 預期：無輸出、exit 0（byte-identical）
```
**預期**：第二次生成與已 commit 檔逐位元組相同（`git diff --exit-code` 通過）。改動任一輸入（如 `track-params.json`
的難度帶）後重跑，diff 僅反映該變動。

## 場景 3 — CI Gate：驗證 + determinism drift（US2/US5 / SC-002~004 / R10）

```bash
npm run validate:schedule
```
**預期**：重生成 → 跑全部不變式（拓樸子序列、`reviewRange`、dangling、涵蓋閉包、Overlay）→ 與 committed 檔比對；
全通過印 `✓ 驗證通過`、exit 0。**手改** `schedules/foundation.json` 任一位元組後重跑 → `determinism-drift` error、非零 exit。

## 場景 4 — 三 Track 共用教材、難度分歧（US3 / SC-005）

檢視三份 `schedules/*.json`：
- **相同**：`concept` Session 的 `conceptId` 序列（三 Track 引用同一批 Concept，無教材複製）。
- **不同**：同一 Concept 的 `problemIds`（foundation 僅 Easy、interviewReady 含 Medium、interviewMastery 含 Hard/Medium）、
  `challenge` 槽難度、`targetLevel`。
單元測試 `schedule-track.test.ts` 斷言 Overlay `extraProblemIds` 疊加後 Core 過濾題目仍在（不取代）。

## 場景 5 — fail loud（US5 / SC-004）

以非法輸入驗證具名失敗（單元測試 `schedule-gate.test.ts` / `schedule-schema.test.ts` 覆蓋，亦可手動）：
- `track-params.json` 設 `maxLevel: 99` → `param-invalid`、不寫檔、非零 exit。
- `overlays/foundation.json` 加一個未涵蓋 conceptId → `overlay-unknown-concept`。
- `overlays/*` `extraProblemIds` 放題庫不存在題號 → `dangling-problem`。
- 合成 fixture 用 `moduleAllowlist` 跳號（缺前置）→ `coverage-gap`。

## 場景 6 — 單元測試（SC-006~008）

```bash
npm test
```
**預期**：新增測試全綠——determinism（byte-identical）、拓樸子序列 + one-concept、涵蓋分歧 + 閉包 gap（合成多-Level
fixture）、節奏 + `reviewRange`（含第一週 `[1,3]`）、各違規類型、zod 合法/非法樣本；F1 既有 `schedule.test.ts` 仍綠。

## 驗收對照

| 場景 | User Story / SC |
| --- | --- |
| 1, 2 | US1 / SC-001 |
| 3 | US2, US5 / SC-002, SC-003, SC-004 |
| 4 | US3 / SC-005 |
| 5 | US5 / SC-004 |
| 6 | US1–US5 / SC-006, SC-007, SC-008 |
