# Phase 1 Data Model: 011-weekly-quiz

**Branch**: `011-weekly-quiz` | **Date**: 2026-08-06

本檔定義本 Feature 新增／變更的資料實體、欄位與不變式。**既有實體只列出被變更的部分**，
未提及者一律不變。型別的權威落點見各節標示的檔案路徑。

---

## 1. `QuizBank`（新增凍結產物 `data/quiz-bank.json`）

**權威型別**：`src/compiler/quiz.ts`

```ts
export interface QuizItem {
  stem: string;
  /** 恰 4 個，純文字，MUST NOT 含 `A.`/`B.` 等代號前綴（FR-006）。 */
  options: [string, string, string, string];
  /** 正解在 options 中的 0-based index（research R4）。 */
  answerIndex: 0 | 1 | 2 | 3;
  /**
   * 恰 5 段（FR-006）：[0] ≤80 字結論句（Discord 用）／[1] 正解為何成立／
   * [2]–[4] 逐一說明其餘三個選項為何不成立（Pages 用）。
   */
  explanation: [string, string, string, string, string];
}

export interface QuizBank {
  version: 1;
  /** key = ConceptNode.id；value 為該 Concept 的題目陣列（3–10 題，FR-005），宣告序即穩定索引（FR-003）。 */
  byConcept: Record<string, QuizItem[]>;
}
```

**序列化規則（canonical）**：`JSON.stringify(obj, null, 2) + "\n"`；`byConcept` 的 key
**依 `ordinalOf` 全序**（`moduleIndex → topicIndex → localOrder → id`，與課表/素材檔同向），
MUST NOT 用字典序。

| 不變式 | 判準 | 違規 rule | 來源 |
| --- | --- | --- | --- |
| schema 合法 | zod strict：`version===1`、`options` 恰 4 個非空字串、`answerIndex ∈ [0,3]`、`explanation` 恰 5 個非空字串 | `quiz-schema` | FR-006 |
| Concept 存在 | 每個 key MUST 存在於 `graph.concepts` | `quiz-unknown-concept` | FR-010 |
| 無代號前綴 | 每個 `options[i]` MUST NOT 以 `/^[A-D][.、)]\s*/` 開頭 | `quiz-option-prefix` | FR-006 |
| 結論句長度 | `explanation[0]` 的 code point 長度 ≤ 80 | `quiz-conclusion-length` | FR-006 |
| 單題預算 | 模擬呈現後長度（見 §3）≤ `QUIZ_BUDGET_LIMITS.quizItem`（570） | `quiz-item-budget` | FR-014 |
| 繁中判準 | `checkTraditionalChinese(stem + options.join + explanation.join)` 無違規 | `quiz-traditional-chinese` | §11（沿用既有判準） |
| 題數範圍 | 每個 Concept 的陣列長度 ∈ [3, 10]（FR-005） | `quiz-count-range` | FR-005／FR-010a |
| 無重複題 | 同一 Concept 內無 `stem` 完全相同的兩題（**結構性判準只查逐字相同**；「實質等價」由生成端
  的面向/角度設計與交叉驗證共同防範，非本檔的機械判準所能偵測，見 research R2） | `quiz-duplicate` | FR-010／FR-016 |

- **生成目標**：題數由內容推導、非固定配額（FR-016）。上限 10 僅為 code-side 保險絲。
- **缺席語意**：整檔缺席 ⇒ `deps.quizBank === undefined` ⇒ 全部 review Session 省略小測段
  （FR-008）；檔在但某 Concept 缺 key 或陣列為空 ⇒ 該 Concept 略過（FR-007），
  **schema MUST NOT 用 `min(1)`**（同 F8 `ReflectionBank` 的既有理由：陣列本身 MAY 為空是
  合法降級路徑之一，由 `quiz-count-range` 在 CI 擋下，不會進入正式推播）。
- **檔在但壞檔／不符 schema ⇒ fail loud**（沿用 `loadOptionalMaterial` 既有語意）。
- **`quiz-cross-validation`（FR-013）不是本表的機械判準**：交叉驗證需要 LLM 呼叫，只發生在
  生成期（`scripts/generate-quiz-bank.ts`），MUST NOT 進入 `checkQuizBank()`——凍結入庫的題目
  已保證通過一次，CI Gate 對已凍結內容不重跑（research R8、同 F7/F8 既有 self-check 邊界）。

### 1.1 `QuizViolation`（`checkQuizBank()` 的回傳型別）

**權威型別**：`src/compiler/quiz.ts`。rule 名稱 MUST 具名到型別層級（同 F8 `MaterialViolationRule`
的理由：避免只存在於 `message` 字串而讓子字串比對隨措辭調整靜默失效）。

```ts
export type QuizViolationRule =
  | "quiz-schema"              // ★ 由載入層 throw 實現，非 checkQuizBank() 的輸出（同 material-schema 的既有註記）
  | "quiz-unknown-concept"
  | "quiz-option-prefix"
  | "quiz-conclusion-length"
  | "quiz-item-budget"
  | "quiz-traditional-chinese"
  | "quiz-count-range"
  | "quiz-duplicate";

export interface QuizViolation {
  rule: QuizViolationRule;
  /** 素材座標：`quiz-bank:{conceptId}[{i}]` 或 `quiz-bank:{conceptId}`。 */
  subject: string;
  message: string;
}

export function checkQuizBank(input: {
  quizBank?: QuizBank;
  graph: CurriculumGraph;
}): QuizViolation[];
```

**映射進 `GateViolation`**（同 F8 §8 的映射慣例）：`rule` 固定為 `"quiz-invalid"`，
`subject` MUST 為 `` `${v.rule}@${v.subject}` ``，`message` 沿用 `v.message`。
`GateRule` 只新增 `"quiz-invalid"` 這一個，細分留在 `QuizViolationRule`。

---

## 2. 選題選取（`src/compiler/quiz.ts`）

```ts
/** 純函式：依 FR-003 的公式決定性選出一題；bank 缺該 Concept 或陣列為空 ⇒ undefined（FR-007）。 */
export function selectQuizItem(input: {
  bank: QuizBank;
  graph: CurriculumGraph;
  track: Track;
  conceptId: string;
}): QuizItem | undefined;
```

```
items       = bank.byConcept[conceptId]                      // 缺席或空 ⇒ undefined
node        = graph.concepts.get(conceptId)                  // 不存在 ⇒ undefined（防禦性；
                                                               //   reviewConcepts 已保證存在於 DAG）
trackOffset = TRACK_ORDER.indexOf(track)                      // 0 / 1 / 2
index       = (node.localOrder + trackOffset) mod items.length
題目         = items[index]
```

**不變式**（同 F8 review-selection.md 的格式）：

| # | 不變式 | 由誰保證 |
| --- | --- | --- |
| I1 | 同一 `(track, conceptId)` 永遠選到同一題 | 純函式（無時間／隨機／IO），索引由 `localOrder`（凍結課程結構欄位）與 `trackOffset` 唯一決定 |
| I2 | 三軌在同一 Concept 取得相異題目 | `trackOffset` 互異（0/1/2）且 `items.length ≥ 3`（`quiz-count-range` 保證，SC-003） |
| I3 | Topic 內插入新 Concept 只影響**該 Topic 內、宣告序在其後**的 Concept 選題（`localOrder` 位移），不影響其他 Topic | `localOrder` 為 Topic-scoped 序位，非全 DAG 名次（FR-003 已載明） |

**MUST NOT 固化進生成物**（FR-003a）：`selectQuizItem` 只在 `compileReview` 呼叫，
**MUST NOT** 出現於 `scripts/generate-schedule.ts` 或任何寫入 `schedules/**`／`data/quiz-bank.json`
的路徑——索引每次 `compile()` 現算。

---

## 3. 預算常數與模擬呈現長度（`src/renderer/budget.ts`）

```ts
export const QUIZ_BUDGET_LIMITS = {
  /** 內容 450（實測最長 362 + 約 24% 餘裕）+ 連結保留 120 = 570（FR-014）。 */
  quizItem: 570,
  quiz: 3000,
} as const;

/**
 * checkQuizBank 對「附連結」情境的保守估計（research R3）：Gate 恆比 runtime 實際檢查更嚴格。
 * 最壞實測 111 = base URL 47 + `/quiz/` 6 + 最長 conceptId 42 + `.html` 5 + ` · [完整詳解]()` 11，
 * 取整為 120。**MUST NOT 低於實際最壞值**——低估會使 Gate 寬鬆於 runtime，違反憲章 IX
 * 「Gate 通過 ⇒ runtime 不會因內容問題失敗」。
 */
export const QUIZ_URL_RESERVE_CHARS = 120;
```

- **量測範圍**：兩格 slot 皆只計 embed **field value**，不含 field name（FR-014）。
- `checkBudget`（render 後，runtime 與 CI 共用）、`checkQuizBank`（素材層，生成端與 CI 共用）
  **MUST 全部 import 此常數**，MUST NOT 出現第二處字面值（同 F8 `MATERIAL_BUDGET_LIMITS` 的單一來源要求）。
- `checkQuizBank` 對逐題預算的估計公式（不依賴實際 `PAGES_BASE_URL`，見 research R3）：

  ```
  估計長度 = len(renderQuizItemBody(toReviewQuizItem(conceptId, item)))
                                                //  題幹＋四個帶字母前綴的選項＋spoiler 內的
                                                //   「正解：{letter} — {explanation[0]}」（無 quizUrl）
             + QUIZ_URL_RESERVE_CHARS           // 保留給連結（含 spoiler 內的 markdown link 語法）
  ```

  `renderQuizItemBody` 為 `src/renderer/discord.ts` 匯出的純函式，供 `checkQuizBank`（生成期/CI，
  無實際 track/url）與 `buildReviewBlocks`（runtime，有實際 url）**共用同一份呈現邏輯**（憲章 IX），
  後者呼叫時另外拼接 `[完整詳解]({quizUrl})` 或省略。

### 3.1 `toReviewQuizItem`（`QuizItem → ReviewQuizItem` 的唯一轉換點）

```ts
/** 純函式；quizUrl 省略即代表 Renderer 不附連結（FR-012）。 */
export function toReviewQuizItem(conceptId: string, item: QuizItem, quizUrl?: string): ReviewQuizItem;
```

`renderQuizItemBody` 吃的是 `ReviewQuizItem`（含 `answerLabel` / `conclusion`），而 `checkQuizBank`
手上只有 `QuizItem`。**此轉換 MUST 只有一份實作**（`src/compiler/quiz.ts` 匯出），由 `compileReview`
（§7）與 `checkQuizBank`（§1）共用——`answerLabel = "ABCD"[item.answerIndex]`、
`conclusion = item.explanation[0]` 這組對應若各寫一份，即是憲章 IX 禁止的「Gate 一套、runtime 另一套」。

---

## 4. `Lesson` 型別變更（`src/types/lesson.ts`）

```diff
 export interface ReviewLesson extends LessonBase {
   type: "review";
   reviewConcepts: ReviewConcept[];
   reflectionQuestion?: string;
   encouragement?: string;
+  /** F11 小測；缺席或空陣列即省略整段（FR-007／FR-008）。 */
+  quizItems?: ReviewQuizItem[];
 }

+export interface ReviewQuizItem {
+  conceptId: string;
+  stem: string;
+  /** 純文字，Renderer 呈現時才加上 A/B/C/D 前綴（憲章 XI：呈現歸 Renderer）。 */
+  options: [string, string, string, string];
+  answerLabel: "A" | "B" | "C" | "D";
+  /** = 該題 `explanation[0]`（Discord 只用結論句，FR-002）。 */
+  conclusion: string;
+  /** 缺席 ⇒ Renderer 省略連結（FR-012）。 */
+  quizUrl?: string;
+}
```

```diff
 export interface BudgetSlots {
   …
+  quizItems?: string[];
 }
```

- `quizItems` 為空陣列與缺席同義（**MUST NOT** 以空陣列填充，統一用「缺席」表示無小測段，
  沿用 `overlayNotes`／F8 素材欄位的既有處置）。
- `SessionType` **不變**。

**`checkBudget` 的兩格對應（FR-014，MUST）**：`BudgetSlots` **只新增 `quizItems` 一個欄位**，
`quiz` 為由它導出的彙總項，不另立欄位（避免同一份字串登記兩次而漂移）。比照既有 `problems`
的處置方式：

```ts
if (budgetSlots.quizItems !== undefined) {
  budgetSlots.quizItems.forEach((entry, i) => {
    items.push(makeItem(`quizItem[${i}]`, codePointLength(entry), QUIZ_BUDGET_LIMITS.quizItem));
  });
  items.push(
    makeItem("quiz", budgetSlots.quizItems.reduce((sum, e) => sum + codePointLength(e), 0), QUIZ_BUDGET_LIMITS.quiz),
  );
}
```

- 登記進 `quizItems[i]` 的字串 **MUST 是放進 embed field value 的同一份實例**（沿用 research R10
  的既有立場：不反解析 embeds），故不含 field name。
- `BudgetItem` 名稱固定為 `quizItem[i]` 與 `quiz`，供 Gate 訊息具名回報。

---

## 5. `CompilerDeps` 型別擴充（`src/compiler/lesson.ts`）

```diff
 export interface CompilerDeps {
   graph: CurriculumGraph;
   bank: ProblemBank;
   schedules: Record<Track, TrackSchedule>;
   overlays: Record<Track, TrackOverlay>;
   readArticle: (path: string) => string;
   articleCache?: Map<string, ArticleContent>;
   problemOrigins: Record<Track, ProblemOrigin>;
   reflectionBank?: ReflectionBank;
   encouragement?: EncouragementPool;
+  quizBank?: QuizBank;
+  /** research R1：選填。缺席 ⇒ 全部小測題目省略連結（FR-012）。由 src/main.ts 的 run() 從
+   * config.pagesBaseUrl 併入，MUST NOT 由 loadCompilerDeps() 自行讀取環境變數（維持
+   * loadCompilerDeps() 只讀檔案系統、不讀環境變數的既有邊界）。 */
+  pagesBaseUrl?: string;
 }
```

```diff
 export interface CompilerPaths {
   …
+  quizBankPath: string;
 }
```

```diff
 const DEFAULT_PATHS: CompilerPaths = {
   …
+  quizBankPath: "data/quiz-bank.json",
 };
```

`loadCompilerDeps()` 載入行為與既有 `reflectionBank`/`encouragement` 完全同構
（`loadOptionalMaterial(path, label, schema)`：缺席 ⇒ `undefined`；壞檔 ⇒ throw）。

---

## 6. `Config` 型別擴充（`src/config.ts`）

```diff
 export interface Config {
   webhooks: Partial<Record<Track, string>>;
   enabledTracks: Track[];
   stateFile: string;
   dryRun: boolean;
   force: boolean;
+  pagesBaseUrl?: string;
 }
```

```diff
 export function loadConfig(env: EnvLike): Config {
   …
+  const pagesBaseUrl = env.PAGES_BASE_URL?.trim() || undefined;
   return {
     …
+    pagesBaseUrl,
   };
 }
```

`src/main.ts` 的 `run()` 於 `loadCompilerDeps()` 後併入：`deps.pagesBaseUrl = config.pagesBaseUrl`
（research R1）。**不新增必要環境變數**——`PAGES_BASE_URL` 缺席不影響 `loadConfig` 的既有
fail-fast 條件（webhooks／stateFile），MUST NOT 令其成為必要欄位。

---

## 7. `compileReview` 的小測組裝（`src/compiler/lesson.ts`）

**組裝程式碼的權威落點為 [contracts/quiz-selection.md](./contracts/quiz-selection.md) §3**——本檔
MUST NOT 重複同一段程式碼（重複必然漂移）。以下只記錄該段程式碼**未**表達的約束：

- **順序**：`quizItems` 依 `reviewConcepts` 的既有順序（`sessionIndex` 升冪，已在既有程式碼決定），
  MUST NOT 另排序——與「本週涵蓋」段的 Concept 順序一致，降低使用者對照題目與涵蓋清單的認知負擔。
- Compiler MUST NOT 於 runtime 選擇「哪些 Concept 出題」（那由 `reviewConcepts` 既有邏輯決定），
  只在**每個已知 Concept**上決定「選哪一題」（FR-003 的職責邊界）。

---

## 8. `GateRule` 新增（`src/compiler/gate.ts`）

| rule | 語意 |
| --- | --- |
| `quiz-invalid` | `checkQuizBank()` 回報的任一違規（§1.1 的全部判準） |

`runContentGate` 開頭比照 `checkMaterials` 的既有呼叫方式，多呼叫一次
`checkQuizBank({ quizBank: deps.quizBank, graph: deps.graph })`，映射規則見 §1.1。

---

## 9. Pages：`quiz/{conceptId}.html`（`src/pages/quiz-page.ts`，新增）

**權威型別**：`src/pages/quiz-page.ts`（與 `article-page.ts` 同構）

```ts
export interface QuizPageItem {
  stem: string;
  options: [string, string, string, string];
  answerLabel: "A" | "B" | "C" | "D";
  /** 完整 5 段（Pages 用，區別於 Discord 只用 explanation[0]）。 */
  explanation: [string, string, string, string, string];
}

export interface QuizPageView {
  conceptId: string;
  title: string;
  items: QuizPageItem[];
}

export function buildQuizPageView(node: ConceptNode, items: QuizItem[]): QuizPageView;
export function renderQuizPage(view: QuizPageView): string;
```

- **正解與詳解的「spoiler」以原生 `<details><summary>` 呈現**（site-build-contract.md §3
  既有規則：頁面 MUST NOT 內嵌任何 JavaScript；`<details>` 為零 JS 的原生互動元素，
  與既有頁面骨架的無 JS 約束完全相容，不需引入任何新技術）。
- `buildSite()`（`src/pages/site.ts`）的既有 `for (const conceptId of unlockedIds)` 迴圈內
  追加：`quizBank?.byConcept[conceptId]` 非空時，額外 `output.set('quiz/${conceptId}.html', …)`
  （research R7：範圍與 article 頁一致，僅 `unlockedIds`）。
- `SiteBuildInput` 新增選填欄位 `quizBank?: QuizBank`（由 `deps.quizBank` 傳入，與既有
  `deps` 傳遞方式一致，MUST NOT 另立欄位名稱）。

---

## 10. `MaterialManifest` 對應：`QuizManifest`（新增快取 `.cache/quiz-manifest.json`）

**權威型別**：`scripts/lib/quiz-checkpoint.ts`。**加速快取、非真實來源**（同 F7/F8 既有慣例）。

```ts
export interface QuizConceptCheckpoint {
  /** Concept Skeleton 內容雜湊（FR-015；沿用 scripts/lib/checkpoint.ts 的 hashFile(node.skeletonPath)）。 */
  skeletonHash: string;
  frozen: boolean;
  gatePassed: boolean;
  needsHumanReview: boolean;
  /** 本次生成實際嘗試輪數（初次 + 補生成，上限 3，FR-013a）。 */
  regenCount: number;
  /** 最終存活題數（供人工快速掃視題數分布是否偏低，非 SC-010 的正式量測來源）。 */
  itemCount: number;
}

export interface QuizManifest {
  version: 1;
  /** key = conceptId。 */
  concepts: Record<string, QuizConceptCheckpoint>;
}
```

跳過條件（沿用 `shouldSkip` 語意，`scripts/lib/checkpoint.ts` 的既有 I/O 邊界函式直接復用）：
`--force` ⇒ 不跳；否則須「該 Concept 已存在於 `quiz-bank.json` **且** `skeletonHash` 相符
**且** `frozen && gatePassed`」。

---

## 11. 新增／變更檔案一覽

| 路徑 | 動作 | 說明 |
| --- | --- | --- |
| `data/quiz-bank.json` | 新增（凍結產物） | §1 |
| `src/compiler/quiz.ts` | 新增 | schema + `selectQuizItem` + `checkQuizBank` |
| `src/compiler/lesson.ts` | 變更 | `CompilerDeps`/`CompilerPaths` 擴充；`compileReview` 組裝 `quizItems` |
| `src/compiler/gate.ts` | 變更 | 新增 `quiz-invalid`，呼叫 `checkQuizBank` |
| `src/config.ts` | 變更 | `Config.pagesBaseUrl` |
| `src/main.ts` | 變更 | `run()` 併入 `deps.pagesBaseUrl` |
| `src/renderer/budget.ts` | 變更 | `QUIZ_BUDGET_LIMITS`、`QUIZ_URL_RESERVE_CHARS`、`checkBudget` 新增 slot 處理 |
| `src/renderer/discord.ts` | 變更 | `buildReviewBlocks` 新增小測欄位（Challenge 後、鼓勵語前）；匯出 `renderQuizItemBody` |
| `src/types/lesson.ts` | 變更 | `ReviewLesson.quizItems`、`ReviewQuizItem`、`BudgetSlots.quizItems` |
| `src/pages/quiz-page.ts` | 新增 | `quiz/{conceptId}.html` 視圖與 render |
| `src/pages/site.ts` | 變更 | `buildSite()` 對 `unlockedIds` 額外輸出 quiz 頁 |
| `scripts/generate-quiz-bank.ts` | 新增 | 產線入口（唯一寫檔／LLM 呼叫／process.exit 點） |
| `scripts/lib/prompts/quiz-aspects.ts` | 新增 | Stage A：面向列舉 prompt + response schema |
| `scripts/lib/prompts/quiz-items.ts` | 新增 | Stage B：據面向出題 prompt + response schema |
| `scripts/lib/prompts/quiz-cross-check.ts` | 新增 | 獨立二次作答交叉驗證 prompt + 解析（FR-013） |
| `scripts/lib/quiz-checkpoint.ts` | 新增 | §10 |
| `package.json` | 變更 | 新增 `generate:quiz-bank` script |
| `.github/workflows/content.yml` | 變更 | `stage` choice 新增 `quiz-bank` |
