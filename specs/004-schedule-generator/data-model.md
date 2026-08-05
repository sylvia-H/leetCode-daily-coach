# Phase 1 Data Model: Schedule Generator

**Feature**: `004-schedule-generator` | **Date**: 2026-07-23

型別落於 `src/types/schedule.ts`（純型別，MUST NOT 含 runtime import）。`Track` / `SessionType` **沿用** F1
`src/types/lesson.ts`（MUST NOT 重定義）。欄位對齊 `docs/spec.md` §16.2 / §16.3 與本 Feature spec。

---

## §1 SessionPlan（課表中的一堂課，§16.2）

```ts
import type { Track, SessionType } from "./lesson.js";

export interface SessionPlan {
  sessionIndex: number;              // 1..N（該 Track 第一天起遞增）
  type: SessionType;                 // concept | practice | review | challenge | rest
  conceptId?: string;                // type === 'concept'：恰一個新 Concept
  reviewRange?: [number, number];    // type === 'review'：[weekStartIndex, reviewSessionIndex-1]
  problemIds?: number[];             // practice / challenge / concept：過濾+Overlay 後題號（可為空）
}
```

**規則**：
- `type === 'concept'` ⇒ `conceptId` MUST 存在且為 DAG 內 Concept；跨全課表每個 `conceptId` **至多出現一次**（引入語意）。
- `type === 'review'` ⇒ `reviewRange` MUST 存在、`start ≤ end`、皆落在本週、`end < reviewSessionIndex`。
- `problemIds` 為 optional：`concept`/`practice`/`challenge` 可帶；`rest`/`review` 不帶。空陣列省略（canonical 序列化不輸出）。
- 輸出欄位序固定（R2）：`sessionIndex → type → conceptId? → reviewRange? → problemIds?`。

## §2 TrackSchedule（生成物 `schedules/{track}.json`，§16.2）

```ts
export interface TrackSchedule {
  track: Track;
  targetLevel: "easy" | "medium" | "hard";  // 半年目標等級
  sessions: SessionPlan[];                    // MUST 為共用 DAG 的合法拓樸子序列
}
```

**規則**：`sessions` 中 `concept` Session 的出現序 MUST 為 DAG canonical `topoOrder` 的子序列（無前向依賴）。
`track` ↔ 檔名映射：`foundation`→`foundation.json`、`interviewReady`→`interview-ready.json`、
`interviewMastery`→`interview-mastery.json`（單一常數表）。

## §3 TrackParams（輸入 `curriculum/track-params.json`，本 Feature 定形）

> **命名對照**：spec Key Entities 的概念名 **TrackParams** ＝ 檔根型別 `TrackParamsFile` 與其 `tracks[track]` 的
> `TrackParam`（單一 Track 設定）。下文 `TrackParam` 指單一 Track、`TrackParamsFile` 指整個檔案。

```ts
export interface TrackParam {
  targetLevel: "easy" | "medium" | "hard";
  maxLevel: number;                  // 含；涵蓋 module.level ≤ maxLevel 的 Concept（FR-014a 主要機制）
  moduleAllowlist?: string[];        // 進階可選；提供時以 allowlist 取代 maxLevel 篩選（可能觸發 coverage-gap）
  problemDifficulties: Array<"Easy" | "Medium" | "Hard">;  // 該 Track 難度帶（過濾 Problem Bank）
  challengeDifficulty: "Easy" | "Medium" | "Hard";         // challenge 槽難度
  rhythm: SessionType[];             // 長度 7；MUST 含 ≥1 review 與 ≥1 rest
}

export interface TrackParamsFile {
  version: number;
  tracks: Record<Track, TrackParam>;  // 三 Track 皆 MUST 存在
}
```

**規則（zod `.strict()`）**：`maxLevel` MUST 落在 `modules.json` 宣告的 level 範圍內（**動態上界＝現存最大 module
level**，非寫死常數；現行 `modules.json` 為 `0..15`）；`rhythm.length === 7` 且含 review+rest；`problemDifficulties`
非空；三 Track key 齊備。違反 → `schema-*` / `param-invalid`。

**stub 值**（本 Feature，對齊 F2 5 Concept / F3 seed）：

| track | targetLevel | maxLevel | problemDifficulties | challengeDifficulty |
| --- | --- | --- | --- | --- |
| foundation | easy | 1 | [Easy] | Easy |
| interviewReady | medium | 1 | [Easy, Medium] | Medium |
| interviewMastery | hard | 1 | [Medium, Hard] | Hard |

（三 Track 涵蓋同 5 Concept，以難度帶分歧展示 AC5；涵蓋分歧由合成 fixture 單元測試驗證。`rhythm` 三 Track 同採
§13.2 預設 `[concept, concept, practice, review, challenge, concept, rest]`。）

## §4 TrackOverlay（輸入 `overlays/{track}.json`，§16.3）

```ts
export interface ConceptOverlay {
  extraProblemIds?: number[];        // 附加題目（疊加於過濾結果之後，不取代）
  extraNotesMarkdown?: string;       // 疊加註記（本 Feature 僅驗結構；F5 消費）
  challengeDifficulty?: "Easy" | "Medium" | "Hard";  // 覆寫該 Concept 的 challenge 難度
                                     //   （本 Feature 僅驗型別/enum；rhythm challenge 槽非 concept-bound，
                                     //    per-concept 覆寫語意由 F5 消費，比照 extraNotesMarkdown）
}

export interface TrackOverlay {
  track: Track;
  byConcept: Record<string /*conceptId*/, ConceptOverlay>;
}
```

**規則（zod `.strict()`）**：`byConcept` 每個 key MUST 為該 Track **已涵蓋**的 Concept，否則 `overlay-unknown-concept`
（clarify Q4，error）。`extraProblemIds` 每項 MUST 存在於 Problem Bank，否則 `dangling-problem`。疊加語意：套用後
Core 過濾題目仍在（不被取代）。`challengeDifficulty` 於本 Feature **僅驗型別/enum**（challenge 槽非 concept-bound，
per-concept 覆寫語意由 F5 消費，比照 `extraNotesMarkdown`）。

> **兩個 `challengeDifficulty` 不可混淆**：`TrackParam.challengeDifficulty`（§3，per-Track）**在 F4 生效**——決定 rhythm
> `challenge` 槽的選題難度（R5 / tasks T024）；此處 `ConceptOverlay.challengeDifficulty`（per-Concept 覆寫）**在 F4 不生效**
> ——rhythm 的 challenge 槽非 concept-bound，本 Feature 只驗型別/enum。**兩者的套用優先關係由 F5 定案**（對齊 spec FR-009）。

## §5 ScheduleViolation / ScheduleViolationRule（沿用 F2/F3 結構）

```ts
export type ScheduleViolationRule =
  | "schema-missing-field"      // zod：缺必填
  | "schema-type"               // zod：型別 / 未知欄位（.strict）
  | "param-invalid"             // maxLevel 超範圍 / rhythm 缺 review|rest / problemDifficulties 空
  | "coverage-gap"              // 被涵蓋 Concept 的 prerequisite 不在涵蓋集（FR-014a）
  | "forward-dependency"        // concept 出現序違反 prerequisite（US2）
  | "one-concept-violation"     // concept Session 未引入或重複引入 Concept
  | "duplicate-concept"         // 同一 conceptId 被多個 concept Session 引入
  | "review-range-invalid"      // reviewRange 空 / 越界 / 錯週
  | "dangling-concept"          // conceptId 不存在於 DAG
  | "dangling-problem"          // problemId 不存在於 Problem Bank
  | "overlay-unknown-concept"   // Overlay key 非該 Track 涵蓋 Concept（clarify Q4）
  | "determinism-drift";        // CI 專用：committed 檔 ≠ 重生成（scripts/validate-schedule.ts）

export interface ScheduleViolation {
  rule: ScheduleViolationRule;
  severity: "error" | "warning";
  subject: string;              // track / conceptId / sessionIndex / 檔案路徑
  field?: string;
  target?: string;              // 關聯對象：被違反的 prerequisite / 缺漏題號 / 未涵蓋 conceptId
  message: string;              // 人可讀、具名（fail loud）
}
```

全部為 `error` 級（`determinism-drift` 亦 error）。無 warning 類（保留擴充）。

## §6 生成器對外契約（詳見 contracts/generator-api.md）

```ts
export interface GenerateInput {
  graph: CurriculumGraph;                 // F2 loadCurriculum 之圖（MUST 先過 validateCurriculum）
  bank: ProblemBank;                      // F3 loadProblemBank
  params: TrackParamsFile;                // track-params.json（已 zod 通過）
  overlays: Record<Track, TrackOverlay>;  // overlays/{track}.json（已 zod 通過）
}

export interface GenerateResult {
  schedules: Record<Track, TrackSchedule>;
  violations: ScheduleViolation[];        // 有 error ⇒ entry 不寫檔、非零 exit
}

// 純函式：無 process.exit、無 I/O
export function generateAllSchedules(input: GenerateInput): GenerateResult;
export function validateSchedule(schedule: TrackSchedule, input: GenerateInput): ScheduleViolation[];
export function serializeSchedule(schedule: TrackSchedule): string;  // canonical、含檔尾 \n
```

## §7 關係與資料流

```
modules.json ─┐
concepts/**  ─┤ loadCurriculum → CurriculumGraph ─┐
              │ (validateCurriculum: 先確保清 DAG)  │
problem-bank ── loadProblemBank → ProblemBank ─────┤ generateAllSchedules → { schedules, violations }
track-params ── zod → TrackParamsFile ─────────────┤        │
overlays/**  ── zod → TrackOverlay×3 ──────────────┘        │
                                                            ├─ error? → fail loud（不寫檔）
                                                            └─ ok → serializeSchedule → schedules/{track}.json ×3
```
