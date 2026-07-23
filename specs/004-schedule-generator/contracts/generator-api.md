# Contract: `src/compiler/schedule-generator.ts`（生成器對外 API）

**Feature**: `004-schedule-generator` | 對齊 spec FR-006/017、憲章 IX（單一實作）

**單一實作**：CI Gate（`validate-schedule.ts`）、生成入口（`generate-schedule.ts`）、未來 F5 runtime / F6 pipeline
**共用同一顆**。純函式：無 `process.exit`、無檔案 I/O（讀寫只在 `scripts/` 入口）。

## 型別（詳見 data-model.md §6）

```ts
import type { CurriculumGraph } from "../types/curriculum.js";
import type { ProblemBank } from "../types/problem.js";
import type { Track } from "../types/lesson.js";
import type {
  TrackSchedule, TrackParamsFile, TrackOverlay, ScheduleViolation,
} from "../types/schedule.js";

export interface GenerateInput {
  graph: CurriculumGraph;
  bank: ProblemBank;
  params: TrackParamsFile;
  overlays: Record<Track, TrackOverlay>;
}

export interface GenerateResult {
  schedules: Record<Track, TrackSchedule>;
  violations: ScheduleViolation[];
}
```

## 函式

### `generateAllSchedules(input: GenerateInput): GenerateResult`
- 對三 Track 各自：涵蓋子集（R3）→ `topoOrder` 子序列 → rhythm 攤課（R4）→ 題目過濾+Overlay（R5）→ 內建 Gate（R8）。
- **前置條件**：`graph` MUST 已過 `validateCurriculum`（清 DAG）；`params` / `overlays` MUST 已過 zod。
- **後置條件**：`violations` 含任一 `error` ⇒ caller MUST NOT 寫檔並以非零 exit（fail loud）。
- **determinism**：同一 `input` → `schedules` 逐欄位相同、`violations` 穩定排序（R2/R8）。

### `validateSchedule(schedule: TrackSchedule, input: GenerateInput): ScheduleViolation[]`
- 對單一課表跑全部不變式（schedule-schema.md 表）；供 CI 對 committed 檔重驗。純函式。

### `serializeSchedule(schedule: TrackSchedule): string`
- canonical 序列化（固定欄位序、2-space、檔尾 `\n`）；`generate-schedule.ts` 寫檔前呼叫，`validate-schedule.ts`
  以其輸出與 committed 檔字串比對（determinism drift）。

## 入口（scripts/，唯一副作用點）

### `scripts/generate-schedule.ts`
1. `loadCurriculum` + `validateCurriculum`（error 即中止）→ `loadProblemBank` → 讀 `track-params.json` + `overlays/*`（zod）。
2. `generateAllSchedules` → 有 error：印具名違規、非零 exit、**不寫檔**。
3. 無 error：`serializeSchedule` 寫 `schedules/{track}.json` ×3、印摘要、exit 0。

### `scripts/validate-schedule.ts`（CI Gate）
1. 同上載入 → `generateAllSchedules`（重生成於記憶體）。
2. `validateSchedule` 全 Track；讀 committed `schedules/{track}.json` 與 `serializeSchedule` 輸出**逐位元組比對**。
3. 任一 error 或 drift（`determinism-drift`）→ 印清單、非零 exit；否則 exit 0。

## 消費的既有 API（不改）

| 來源 | 函式 | 用途 |
| --- | --- | --- |
| F2 `compiler/curriculum.ts` | `loadCurriculum` / `validateCurriculum` | 建圖 + 確保清 DAG + 取 `topoOrder` |
| F2 型別 | `CurriculumGraph.concepts` / `.modules` / `.ordinalOf` | 涵蓋篩選、level 對照、子序列 |
| F3 `compiler/problem.ts` | `loadProblemBank` / `makeProblemExists` | 題目難度過濾、`problemIds` 存在性 |
