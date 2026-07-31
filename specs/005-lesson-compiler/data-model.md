# Phase 1 Data Model: Lesson Compiler、Renderer 與內容 Gate

**Feature**: `005-lesson-compiler` | **Date**: 2026-07-23 | **Plan**: [plan.md](./plan.md)

本檔定義本 Feature 新增／修改的**型別與驗證規則**。既有型別（`CurriculumGraph` / `ConceptNode` /
`ProblemBank` / `SessionPlan` / `TrackSchedule` / `TrackOverlay`）由 F2–F4 定義，本 Feature **只消費、不重定義**。

---

## 1. `ArticleContent`（`src/compiler/content.ts`）

一篇 Full Article 解析後的 in-memory 形態。

```ts
interface ArticleMeta {
  id: string;                 // frontmatter id，MUST === 請求的 conceptId
  title: string;
  module: string;
  patternLabel: string;       // frontmatter pattern_label（原樣帶入，MUST NOT 改寫）
  complexityLabel: string;    // frontmatter complexity_label
  estimatedMinutes: number;
  exitCriteria: string[];     // frontmatter exit_criteria
}

interface ArticleChallengeEntry {
  problemId: number;          // Today's Challenge 條目的 **{id}**
  whyThisPattern: string;     // 條目本文（非空）
  hint?: string;              // 巢狀 `Hint:` 項目（至多一則）
}

interface ArticleContent {
  meta: ArticleMeta;
  digest: string;             // 推播主體
  tsTip: string;
  pyTip: string;
  takeaway: string;
  challenge: Map<number, ArticleChallengeEntry>; // 以 problemId 為鍵
}
```

### 驗證規則（解析階段，全部 fail loud）

| 規則 | 條件 | 訊息要件 |
| --- | --- | --- |
| `article-missing-section` | `Digest` / `TypeScript Tip` / `Python Tip` / `Takeaway` / `Today's Challenge` 任一缺漏或空白 | 指名區塊名稱與檔案路徑 |
| `article-missing-field` | frontmatter 必要欄位缺漏或空值 | 指名欄位名稱 |
| `article-field-type` | 宣告為陣列的欄位（`exit_criteria`）非陣列 | 指名欄位名稱 |
| `article-id-mismatch` | `meta.id !== conceptId` | 同時列出兩者 |
| `article-challenge-format` | `Today's Challenge` 有內容但切不出任何條目、或條目缺 `whyThisPattern` | 指名檔案與條目 |
| `article-challenge-duplicate` | 同一 `problemId` 出現多個條目 | 指名題號 |

> `Concept` / `Thinking` / `Pattern Recognition` / `Common Mistakes` / `Complexity` / `TypeScript Corner` /
> `Python Corner` / `Tomorrow Preview` 為 §10 的閱讀用固定區塊，本 Feature **解析但不進 `Lesson`**
> （Discord 不推全文，§14.5）。它們的存在性檢查列為 `article-missing-section` 的一部分——缺漏代表教材
> 不完整，F9 全文頁與 F7 產線都會受害，故在此一併攔下。

---

## 2. `Lesson`（`src/types/lesson.ts`，Compiler → Renderer 的唯一介面）

```ts
type Track = "foundation" | "interviewReady" | "interviewMastery";
type SessionType = "concept" | "practice" | "review" | "challenge" | "rest";

interface Problem {
  id: number;
  title: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard";
  whyThisPattern?: string;   // 【改】F1 為必備；practice/challenge 查無來源時省略（spec FR-030）
  hint?: string;
}

interface PathLabels { prev?: string; current: string; next?: string; }

interface LessonConcept {
  id: string; title: string;
  digest: string; tsTip: string; pyTip: string; takeaway: string;
  exitCriteria: string[];
  patternLabel: string; complexityLabel: string; estimatedMinutes: number;
  articlePath: string;       // 全文位置（F9 用）
}

interface ReviewConcept { id: string; title: string; }

// 【改 2026-07-24】以 type 為判別子的 discriminated union：每種 Session 類型的必備欄位
// 由型別系統保證，Renderer 因而不需要（也 MUST NOT 用）非空斷言取用類型專屬欄位。
interface LessonBase {
  sessionIndex: number;
  track: Track;
  color: number;             // 【改】F1 的 concept.moduleColor 上移：非 concept 類亦需顏色
  problems: Problem[];       // 恆存在（可為空陣列）
}

interface ConceptLesson extends LessonBase {
  type: "concept";
  concept: LessonConcept;    // MUST 存在
  path: PathLabels;          // MUST 存在
  overlayNotes?: string;     // Overlay extraNotesMarkdown（疊加，不取代）
}

interface PracticeLesson extends LessonBase { type: "practice" | "challenge"; }

interface ReviewLesson extends LessonBase {
  type: "review";
  reviewConcepts: ReviewConcept[];   // MUST 存在且非空
  reflectionQuestion?: string;       // F8 素材；缺席即省略（spec FR-031）
}

interface RestLesson extends LessonBase {
  type: "rest";
  encouragement?: string;    // F8 素材；缺席即省略
}

type Lesson = ConceptLesson | PracticeLesson | ReviewLesson | RestLesson;
```

### 型別不變式（單元測試守住）

- `type === "concept"` ⇔ `concept !== undefined` 且 `path !== undefined`。
- `type === "review"` ⇔ `reviewConcepts !== undefined && reviewConcepts.length > 0`。
- `type === "rest"` ⇒ `problems.length === 0`（休息日不派題）。
- `color` 恆存在（**所有**類型皆有值；非 concept 類為中性色）。
- `overlayNotes` 存在 ⇔ 該 Track Overlay 對該 `conceptId` 宣告了非空的 `extraNotesMarkdown`；
  否則欄位**不存在**（MUST NOT 為 `""`）。僅 `concept` 類可能有值。
- `problems` 的題號序 MUST **完全等於**該 Session 課表 `problemIds`（Overlay `extraProblemIds` 已於 F4
  生成階段套入課表，Compiler MUST NOT 再增刪或重排；research R6）。長度 MUST ≤ 3——上限由生成端保證
  （`docs/spec.md` §13.4），Compiler MUST NOT 截斷。
- `reflectionQuestion` 存在 ⇔ `type === "review"` 且 F8 素材已就緒；`encouragement` 存在 ⇔
  `type === "rest"` 且 F8 素材已就緒。素材缺席時欄位**不存在**（MUST NOT 為 `""` 或佔位字串）。
- `problems[].whyThisPattern` 存在 ⇔ 查得說明來源；查無來源時欄位**不存在**（MUST NOT 為 `""`）。
- 全部欄位 MUST 為 build-time 可得的凍結內容；MUST NOT 有欄位需 runtime LLM 或網路填充。
- **序列化穩定**：同一 `(track, sessionIndex)` 的 `JSON.stringify(lesson)` MUST byte-identical。

---

## 3. `CompilerDeps`（`src/compiler/lesson.ts`）

```ts
interface CompilerDeps {
  graph: CurriculumGraph;                  // F2
  bank: ProblemBank;                       // F3
  schedules: Record<Track, TrackSchedule>; // F4 生成物
  overlays: Record<Track, TrackOverlay>;   // F4（檔案缺席 ⇒ { track, byConcept: {} }）
                                           // 僅消費 extraNotesMarkdown（research R6）
  readArticle: (path: string) => string;   // 讀檔邊界（預設 fs.readFileSync）
  articleCache?: Map<string, ArticleContent>; // 同一批 Gate 執行內共用；命中時 MUST 重驗
                                           // article.meta.id === conceptId（否則繞過 id-mismatch 檢查）
  problemOrigins: Record<Track, ProblemOrigin>; // problemId → 首次引入它的 conceptId
  reflectionBank?: unknown;                // F8；未提供即缺席（載入時驗最小結構 schema）
  encouragement?: unknown;                 // F8；未提供即缺席（載入時驗最小結構 schema）
}
```

`loadCompilerDeps(paths?)` 於載入層完成：讀 DAG（並跑 `validateCurriculum`，有 error 即拋）、讀題庫、
讀三份課表與三份 Overlay（**皆經 zod 驗證**，課表 MUST NOT 盲目 cast），任一失敗 fail loud；
F8 素材（`reflection-bank.json` / `encouragement.json`）缺席即略過，存在但不符最小結構 schema ⇒ fail loud。

---

## 4. 反查表：`problemId → conceptId`（per Track）

```ts
type ProblemOrigin = Map<number, string>; // problemId → 首次引入它的 conceptId
```

建法見 [research.md R3](./research.md#r3problemid--引入該題的-conceptid-反查practice--challenge-用)：
依 `sessionIndex` 遞增走訪該 Track 課表的 `concept` Session，取 `ConceptNode.leetcode`，**首次出現者勝**。
表由 `loadCompilerDeps` 於每 Track 建一次並隨 deps 傳遞（確定性、無 I/O）。

**查無來源的兩種狀態（皆省略說明、皆不失敗，spec FR-030）**：(a) 表中無此 `problemId`；
(b) 表中有、但該 Concept 的 Article `Today's Challenge` 無該題號條目（表建自 `ConceptNode.leetcode` 全集，
條目只被要求涵蓋課表排入的題號，故 (b) 可達）。實作 MUST 讓兩者走同一條分支。

---

## 5. `RenderedMessage` / `BudgetSlots`（`src/types/lesson.ts` + `src/renderer/`）

```ts
interface BudgetSlots {
  digest?: string;
  tsTip?: string;
  pyTip?: string;
  exitCriteria?: string;
  takeaway?: string;
  pathFooter?: string;
  overlayNotes?: string;
  reflectionQuestion?: string;  // 【新 2026-07-24】review 的 Reflection 段
  encouragement?: string;       // 【新 2026-07-24】rest 的鼓勵語
  problems?: string[];   // 每題一則（已渲染的完整字串）
}

interface RenderedMessage {
  embeds: DiscordEmbed[];
  budgetSlots: BudgetSlots; // 值 MUST 為放進 embeds 的同一份字串實例
}
// 不變式（測試強制，tests/unit/review-fixes.test.ts）：Renderer 放進 embed 的每一段**可變長度文字**
// MUST 登記對應 slot，否則該段落完全逃過逐區塊預算。例外只給非教材自由文字（固定標籤、
// 由 Compiler 依課表生成的清單，如 review 的「本週涵蓋」）。
```

### 預算表（`checkBudget` 的判準，`docs/spec.md` §14.5）

| slot / 項目 | 上限 | 備註 |
| --- | --- | --- |
| `digest` | 900 | 主 Embed description |
| `tsTip` / `pyTip` | 各 800 | 含程式碼區塊與其中的型別定義（F7 定案 2026-07-31 由 450 → 650 → 800，見 `docs/spec.md` §14.5） |
| `problems[i]` | 各 350 | 逐題（連結 + 難度 + why + Hint） |
| `problems.count` | 3 | 題數上限。**兜底檢查**——上限的唯一套用點在 F4 生成端（`docs/spec.md` §13.4）；此處命中代表課表缺陷，處置是修生成器重跑，MUST NOT 由 Compiler / Renderer 截斷 |
| `exitCriteria` | 400 | ≤6 條、每條 ≤110（條數與單條長度亦檢查；單條上限 F7 定案 2026-07-31 由 60 放寬為 110，實作常數 `EXIT_CRITERIA_ITEM_MAX`） |
| `takeaway` | 120 | |
| `pathFooter` | 200 | |
| `reflectionQuestion` | 300 | 【新 2026-07-24】F8 素材；預算 MUST 在素材之前就位（`docs/spec.md` §14.5） |
| `encouragement` | 200 | 【新 2026-07-24】同上 |
| `overlayNotes` | 400 | 本 Feature 新增（Overlay 附加註記亦須受控，否則可繞過總量以外的所有逐區塊上限） |
| `embed[i].title` | 256 | 結構性上限 |
| `embed[i].description` | 4096 | 結構性上限 |
| `embed[i].fields.count` | 25 | 結構性上限 |
| `embed[i].field[j].name` / `.value` | 256 / 1024 | 結構性上限 |
| `embeds.count` | 10 | 結構性上限（每則訊息） |
| `total` | 5500 | 本專案自訂上限 |
| `total.hard` | 6000 | 平台硬限（後盾） |

- **長度單位**：Unicode code point（`Array.from(s).length`）。
- **超限 MUST NOT 截斷**；`ok === false` 即為失敗（§14.5）。

---

## 6. `GateViolation`（`src/compiler/gate.ts`）

```ts
type GateRule =
  | "compile-error"        // compile 拋錯（含 article-* / dangling / 不對齊等）
  | "render-error"         // render 拋錯
  | "budget-over"          // 逐區塊 / 結構性 / 總量任一超限
  | "curriculum-invalid"   // F2 validateCurriculum 的 error 級違規（轉入）
  | "schedule-empty";      // 某 Track 課表為空（無 Session 可編譯 ⇒ Gate 形同虛設）

interface GateViolation {
  rule: GateRule;
  severity: "error";       // 本 Feature 全部違規皆為 error（無 warning 級）
  track?: Track;
  sessionIndex?: number;
  subject?: string;        // conceptId / articlePath / 預算項名稱
  message: string;         // 指名成因，MUST 可單獨定位問題
}
```

**排序**（輸出穩定性）：`track`（`TRACK_ORDER` 序）→ `sessionIndex` → `rule` → `subject` → `message`。

**彙總**：`scripts/validate.ts` 於逐筆列印後輸出
`✗ 內容 Gate 未通過：{n} 筆違規（已編譯 {m} / {total} 筆 Lesson）`，並以非零 exit code 結束；
全數通過時輸出 `✓ 內容 Gate 通過：{total} 筆 Lesson（3 Track × 各課表全部 Session）`。

---

## 7. 與既有型別的相容性影響

| 既有使用點 | 影響 | 處置 |
| --- | --- | --- |
| `src/main.ts` `compileLesson()` | `compile` 簽名改為注入 deps；`render` 回傳 `RenderedMessage[]` | 改為在 `run()` 起始載入一次 deps；push 時逐則 post |
| `src/renderer/budget.ts` | 由「反解析 embeds」改為「讀 `budgetSlots`」 | 重寫；`PROBLEM_BULLET` 反解析移除 |
| `src/compiler/schedule.ts` | F1 硬編課表與 `getPathLabels` | 全數移除（FR-029），改為課表載入器 |
| `tests/unit/renderer.test.ts` / `budget.test.ts` | 斷言 F1 的 `render(lesson) → embeds` 與反解析式預算 | 隨 T010 更新至 `RenderedMessage[]` + `budgetSlots` 契約 |
| `tests/unit/lesson.test.ts` / `schedule.test.ts` / `content.test.ts` | 依賴 F1 硬編課表與 demo 常數 | 隨 T020–T024 更新至新契約 |
| `tests/unit/dry-run.test.ts` / `run-tracks.test.ts` | 斷言 `src/main.ts` 的單則 post 流程與 DRY_RUN 輸出 | 隨 T011 更新至逐則 `RenderedMessage` 流程 |
| `articles/two-pointer/002-left-right-pointer.md` | 孤兒且格式過時 | 移除（research R8） |
