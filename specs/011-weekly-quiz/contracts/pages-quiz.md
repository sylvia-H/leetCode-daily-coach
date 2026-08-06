# Contract: Pages 題庫頁（`quiz/{conceptId}.html`）與 Discord 連結來源

**Feature**: 011-weekly-quiz | **對象**：`src/pages/quiz-page.ts`、`src/pages/site.ts`、
`src/config.ts`、`src/main.ts`

本契約釘死題庫頁的產出範圍、頁面結構，以及 Discord 小測連結（`quizUrl`）如何在**不修改
`daily.yml`** 的前提下取得 Pages Base URL（research R1／R7 的落地）。

---

## 1. Discord 連結來源（research R1）

```
push job（daily.yml，本 Feature 不修改）
  └─ node dist/main.js
       └─ run(env) ── config = loadConfig(env)   // config.pagesBaseUrl = env.PAGES_BASE_URL?.trim() || undefined
            └─ deps = { ...loadCompilerDeps(), pagesBaseUrl: config.pagesBaseUrl }
                 └─ compile() → compileReview() → selectQuizItem 決定題目
                                                 → quizUrl = deps.pagesBaseUrl
                                                     ? `${deps.pagesBaseUrl}/quiz/${conceptId}.html`
                                                     : undefined
```

| 情境 | `PAGES_BASE_URL` | 結果 |
| --- | --- | --- |
| 現行 `daily.yml`（未設定此變數） | 未設定 | 小測題目正常推播，**全部題目省略連結**（FR-012 降級路徑；**本 Feature 的驗收基準**） |
| 操作者未來自行於 `push` job 的 `env:` 追加 `PAGES_BASE_URL: https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}` | 已設定 | 每題附上指向 quiz 頁的連結 |

- **本 Feature MUST NOT 修改 `daily.yml`**（spec 定位與邊界的既有約束）；上表第二列是留給
  操作者的後續操作，不在本 Feature 驗收範圍內，也不阻礙本 Feature 的其餘驗收項目。
- `PAGES_BASE_URL` 缺席 **MUST NOT** 影響 `loadConfig` 既有的 fail-fast 條件（webhooks／
  stateFile），為選填欄位。
- Compiler **MUST NOT** 呼叫任何 API（`gh api` 等）偵測 repo 可見性——「連結是否出現」完全由
  「環境變數是否設定」決定，MUST NOT 引入其他判斷來源（research R1 已否決的替代方案）。

---

## 2. `quiz/{conceptId}.html` 的產出範圍（research R7）

**與 `articles/{conceptId}.html` 完全同構的範圍規則**：僅對 `unlockedIds`
（`computeUnlockedConceptIds(state)`，三個已知 Track `completedConceptIds` 的聯集）產出，
**不是全部 165 個 Concept**。

| 要求 | 等級 | 理由 |
| --- | --- | --- |
| `quiz/{conceptId}.html` 只對 `conceptId ∈ unlockedIds` 且 `quizBank?.byConcept[conceptId]` 非空時產出 | MUST | 與 article 頁一致的 unlock 呈現模型，避免劇透未解鎖 Concept 的考點 |
| Discord `quizUrl` 指向的 Concept 恆屬於 `unlockedIds` | 不變式（非需實作的檢查） | review 只涵蓋已上過的 concept Session，該 Session 推播成功時 `advance()` 已寫入 `completedConceptIds`（見 research R7） |
| 題庫存在但該 Concept 尚未解鎖（理論上不會發生，見上一列） | — | 不產出該頁；即使 Discord 誤植連結也只會 404，不影響推播成功與否（FR-012 的降級對象是「Discord 端」而非「Pages 端」） |

---

## 3. 頁面結構（`src/pages/quiz-page.ts`）

```ts
export interface QuizPageItem {
  stem: string;
  options: [string, string, string, string];
  answerLabel: "A" | "B" | "C" | "D";
  /** 完整 5 段（FR-011：Pages 呈現完整詳解，區別於 Discord 只用 [0]）。 */
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

| 要求 | 等級 | 理由 |
| --- | --- | --- |
| 正解與詳解 MUST 以原生 `<details><summary>顯示解答</summary>…</details>` 包裹 | MUST | site-build-contract.md §3 既有規則「頁面 MUST NOT 內嵌任何 JavaScript」；`<details>` 為零 JS 原生互動元素，與既有頁面骨架完全相容 |
| 每題的 `<summary>` 前 MUST 明碼呈現題幹與四個帶字母前綴的選項 | MUST | 與 Discord 呈現一致的「先作答、後查看」體驗（Testing effect，spec Q5） |
| `<details>` 展開後 MUST 呈現：正解代號 + 完整 5 段 `explanation`（依序） | MUST | FR-011：Pages 呈現「完整詳解（含其餘三個選項為何不成立）」 |
| 動態文字（題幹／選項／explanation）MUST 經 HTML entity escape | MUST | 沿用 `src/pages/html.ts` 既有 `escapeHtml`，同 article 頁的既有規則 |
| 頁面外殼 MUST 沿用既有 `renderPage()`（`src/pages/html.ts`），不自建 `<head>`/`<style>` | MUST | 與全站頁面骨架一致（憲章 XVI：零外連 CSS/JS） |
| 同一 Concept 的多題 MUST 依 `QuizBank.byConcept[id]` 宣告序呈現，不重排 | MUST | 與凍結產物的宣告序一致，避免視圖層引入額外排序邏輯 |

---

## 4. `buildSite()` 整合（`src/pages/site.ts`）

```diff
 export interface SiteBuildInput {
   deps: CompilerDeps;
   state: AppState;
   enabledTracks: Track[];
   baseUrl: string;
 }
```

```diff
   for (const conceptId of unlockedIds) {
     const node = deps.graph.concepts.get(conceptId);
     if (!node) continue;
     const article = readArticleCached(node.articlePath, node.id, deps);
     const view = buildArticlePageView(article, deps.bank);
     output.set(`articles/${conceptId}.html`, renderArticlePage(view));
+
+    const quizItems = deps.quizBank?.byConcept[conceptId];
+    if (quizItems && quizItems.length > 0) {
+      const quizView = buildQuizPageView(node, quizItems);
+      output.set(`quiz/${conceptId}.html`, renderQuizPage(quizView));
+    }
   }
```

- `SiteBuildInput` **不新增欄位**——`quizBank` 透過既有的 `deps: CompilerDeps` 欄位傳入
  （`CompilerDeps.quizBank`，data-model.md §5），與 `deps.bank`／`deps.graph` 的既有傳遞方式一致，
  MUST NOT 另立名稱（同 `site-build-contract.md` 對 `readArticle` 命名衝突的既有告誡）。
- `buildSite` 純函式性不變式（`tests/unit/pages-site-determinism.test.ts` 既有覆蓋範圍）
  **MUST 擴充涵蓋 quiz 頁**：同一 `SiteBuildInput` 呼叫兩次，`quiz/*.html` 的內容 MUST byte-identical。

---

## 5. 與憲章 XI 的關係（同 site-build-contract.md §0，不適用非違反）

`buildQuizPageView`／`renderQuizPage` 與 `buildSite` 同屬 Pages 這一個**平行消費者**，
非 Discord Lesson Renderer；MUST NOT 被 `src/compiler/lesson.ts` 或 `src/renderer/discord.ts`
引用（單向依賴，避免 Discord 推播路徑意外牽扯進 Pages 邏輯）。
