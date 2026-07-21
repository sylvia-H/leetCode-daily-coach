# Contract: Lesson（Compiler → Renderer 的唯一介面）

**Feature**: 001-walking-skeleton
**生產者**: `src/compiler/lesson.ts` | **消費者**: `src/renderer/discord.ts`

`Lesson` 是本專案最重要的內部契約——它是憲章 XI（Renderer Knows Nothing About Curriculum）與
XII（Deterministic Delivery）的**實作載體**。新增 delivery 通道（Telegram / Email / Pages）時只需新增
Renderer，不動上游。

---

## 1. 介面定義

宣告於 `src/types/lesson.ts`。**此檔 MUST 不含任何 import**（純型別），使 Renderer 的相依集合
在編譯期就被限制住。

```ts
export type Track = "foundation" | "interviewReady" | "interviewMastery";
export type SessionType = "concept" | "practice" | "review" | "challenge" | "rest";

export interface Problem {
  id: number;
  title: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard";
  whyThisPattern: string;
  hint?: string;
}

export interface PathLabels {
  prev?: string;
  current: string;
  next?: string;
}

export interface LessonConcept {
  id: string;
  title: string;
  moduleColor: number;
  digest: string;
  tsTip: string;
  pyTip: string;
  takeaway: string;
  exitCriteria: string[];
  patternLabel: string;
  complexityLabel: string;
  estimatedMinutes: number;
  articlePath: string;
}

export interface Lesson {
  sessionIndex: number;
  type: SessionType;
  track: Track;
  concept: LessonConcept;
  problems: Problem[];
  path: PathLabels;
}
```

**與 `docs/spec.md` §16.4 的差異**：本 Feature 只做 concept 類 Session，故 `concept` 為必填、
`problems` 為必填；未實作 `encouragement`（F8）與 `reflectionQuestion`（F8）。**欄位名稱全數保持一致**，
F5 擴充時只需將 `concept` 改為選填並補上其餘欄位，Renderer 的既有分支不受影響。

---

## 2. Compiler 介面

```ts
compile(track: Track, sessionIndex: number): Lesson
```

**流程**：
1. `schedule.getSessionPlan(track, sessionIndex)` → `SessionPlan`（查無 → 拋「課表用盡」錯誤）
2. `content.loadArticle(conceptId)` → `ArticleContent`（缺區塊 → 拋指名錯誤）
3. `problem.getProblemsForConcept(conceptId)` → `Problem[]`（1～3 筆，否則拋錯）
4. `schedule.getPathLabels(sessionIndex)` → `PathLabels`
5. 組裝並回傳 `Lesson`

**契約性要求**：
| 要求 | 說明 |
|---|---|
| **Determinism** | 同一 `(track, sessionIndex)` MUST 產出逐欄位相同的 `Lesson`（憲章 XII） |
| **無 runtime 生成** | 所有欄位 MUST 來自凍結內容；MUST NOT 呼叫任何 LLM 或外部服務（憲章 VIII、FR-004） |
| **Fail loud** | 任一步驟失敗 MUST 拋出帶明確原因的錯誤，MUST NOT 回傳半成品 `Lesson`（FR-004b） |
| **單一 Compiler** | 此函式即 `docs/spec.md` §7.1 的 Lesson Compiler；F5 的 CI Gate MUST 呼叫**同一顆**，MUST NOT 另做一套解析（憲章 IX） |

---

## 3. Renderer 介面

```ts
render(lesson: Lesson): DiscordEmbed[]
```

**契約性要求（憲章 XI / XII，MUST 以單元測試把關）**：

| # | 要求 | 測試方式 |
|---|---|---|
| R-1 | **純函式**：無 I/O、無全域狀態、不讀時鐘、不讀亂數 | 同一 `Lesson` 呼叫 100 次 → `JSON.stringify` 逐字元相同（SC-010） |
| R-2 | **不讀 Curriculum / Problem Bank / 檔案 / state** | `src/renderer/**` 的 import 集合 MUST 只含 `src/types/lesson.ts`（以測試斷言原始碼的 import 行） |
| R-3 | **Track 不決定版面結構** | 建構兩個只有 `track` 欄位不同的 `Lesson` → 產出的 embeds MUST 完全相同 |
| R-4 | **不修改輸入** | 呼叫前後 `lesson` 的深層快照 MUST 相同 |
| R-5 | **無領域知識** | Renderer MUST NOT 出現 `"Two Pointer"` `"Array"` 等 Curriculum 字串；Module 色表以 `moduleColor`（已由 Compiler 解析為數字）傳入 |

> **R-5 的設計後果**：Module → 色碼的對照表屬 Curriculum 知識，故 MUST 位於 `src/compiler/`
> （由 `content.ts` 依 frontmatter 的 `module` 查表後填入 `moduleColor`），**不得**放在 `src/renderer/`。

---

## 4. 不變式摘要

給定同一份凍結內容（`articles/**`、`data/problem-bank.json`、`src/compiler/schedule.ts`）：

```
compile(track, n) 為純粹的 (track, n) → Lesson 映射
render(lesson)   為純粹的 lesson → embeds 映射
∴ (track, n) → embeds 完全確定，可在 CI 完整預演
```

這正是憲章 IX「Gate 通過 ⇒ runtime 不會因內容問題失敗」成立的前提。F5 接上
`scripts/validate.ts` 時，只需對全 Track × 全 Session 迴圈呼叫這兩個函式，不需要任何額外實作。
