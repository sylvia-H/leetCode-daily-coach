# Phase 0 Research: 011-weekly-quiz

**Branch**: `011-weekly-quiz` | **Date**: 2026-08-06

spec.md 的 Clarifications（Q1–Q14）已解決絕大多數技術問題（選題公式、字元預算、交叉驗證、
面向覆蓋率、產線順序）。本檔只處理 spec 未觸及、但 plan 階段必須釘死才能開始實作的技術問題。

---

## R1：Discord 小測連結如何取得 Pages Base URL，且不違反「daily workflow 推播機制零改」

**問題**：FR-002／FR-011 要求 Discord spoiler 內含指向 `quiz/{conceptId}.html` 的連結；
FR-012 要求「Pages 停用（private repo）或該頁尚未產出時，MUST 照常出題、僅省略連結」。
但 spec 定位與邊界明文「MUST NOT 改動：…daily workflow（推播機制零改）」，而現行
`.github/workflows/daily.yml` 的 `push` job **完全不含 `PAGES_BASE_URL`**——該變數只在
`pages` job（`needs: push`，晚於 `push` 執行）用於 `npm run build:pages`。`push` job 也
不做 repo 可見性偵測（`gh api` 呼叫只存在於 `pages` job）。

**Decision**：**沿用既有的 `PAGES_BASE_URL` 環境變數名稱**（`scripts/build-pages.ts` 已定義同名
變數），由 `src/config.ts` 的 `loadConfig()` 新增選填欄位 `pagesBaseUrl?: string`（`env.PAGES_BASE_URL`
trim 後非空才賦值）；`src/main.ts` 的 `run()` 於 `loadCompilerDeps()` 後以
`{ ...deps, pagesBaseUrl: config.pagesBaseUrl }` 併入 `CompilerDeps`（一行變更，不改函式簽章）。
`compileReview` 據此決定是否對每一題附上 `quizUrl`：**變數缺席 ⇒ 全部題目省略連結**
（FR-012 的降級路徑），**MUST NOT** 另外呼叫任何 API 去偵測 repo 可見性。

**本 Feature 不修改 `daily.yml`**：目前 `push` job 不會設定 `PAGES_BASE_URL`，因此併入後的
預設行為是「小測題目正常推播、連結全部省略」——與現狀（無小測功能）同樣安全，是完全向下相容的
起始狀態。若之後要讓 Discord 真的出現連結，只需在 `push` job 的 `env:` 區塊追加一行
`PAGES_BASE_URL: https://${{ github.repository_owner }}.github.io/${{ github.event.repository.name }}`
（與 `pages` job 現有寫法完全一致的靜態字串，不需新增可見性偵測步驟）——**此為獨立於本 Feature
之外、風險與代價都极低的後續操作**（一行環境變數、不改變推播機制本身：仍是同一顆
compile→render→checkBudget→post），留給 repo 操作者自行決定何時啟用，本 Feature 的驗收不依賴它。

**為何不用其他方案**：
- 用 GitHub Actions 預設環境變數（`GITHUB_REPOSITORY_OWNER`/`GITHUB_REPOSITORY`）自動組出 URL、
  完全不需任何環境變數 ⇒ **被否決**：無法知道 repo 是否為 private（Pages 對 private repo 不可用
  除非付費方案），會讓私有 repo 使用者收到必然 404 的死連結，且與 FR-012 明文的「private repo ⇒
  省略連結」矛盾。
- 讓 `push` job 也做一次 `gh api` 可見性偵測 ⇒ **被否決**：需要新增一個 step 到 `daily.yml`，
  且讓「核心推播」與「GitHub API 呼叫」耦合，與 F9 既有的「Pages 為完全隔離的末段」定位相悖，
  也直接牴觸「daily workflow 推播機制零改」。
- 用檔案系統偵測 quiz 頁是否已產出 ⇒ **不可行**：`push` job 在 `pages` job 之前執行（workflow 依賴
  `needs: push`），該次執行時 Pages 尚未建置，`push` job 的 checkout 也不含任何 build 產物。

---

## R2：quiz-bank 的 Concept-keyed 結構與 Gate 判準檔（新模組落點）

**問題**：F8 的 `ReflectionBank` 以 Topic 為 key（16 個），本 Feature 的 `QuizBank`
（spec FR-001）明文以 **Concept id** 為 key（165 個，數量級不同）。是否能直接擴充
`src/compiler/material.ts`？

**Decision**：**新增獨立模組 `src/compiler/quiz.ts`**，不擴充 `material.ts`。理由：
1. **選題輸入不同**——`selectReflectionQuestion` 依賴 `resolveReviewTopic`（Topic 歸屬 + review 出現序），
   `selectQuizItem`（FR-003）依賴 `ConceptNode.localOrder`（Topic 內序位），兩者的確定性索引來源
   完全不同的資料維度，混在同一檔案會讓兩套「選取規則」互相干擾理解。
2. **Gate 判準規模不同**——Quiz 的結構性檢查（schema、5 段 explanation、選項無前綴、題數 3–10、
   跨題重複、Concept 存在性）與 Reflection/Encouragement 的判準（預算、繁中、重複、進度耦合）
   幾乎沒有共用邏輯，唯一共用的是 `checkTraditionalChinese`（既有全域 export，直接 import 即可）。
3. **與 `runContentGate` 的接線方式維持同構**（憲章 IX）：`quiz.ts` 匯出 `checkQuizBank()`，
   回傳型別與 `checkMaterials()` 的 `MaterialViolation[]` 同構（`QuizViolation[]`），
   `gate.ts` 比照現有 `checkMaterials` 的呼叫方式在 `runContentGate` 開頭多呼叫一次，
   新增唯一一個 `GateRule = "quiz-invalid"`（同 `material-invalid` 的分層設計，細分留在
   `QuizViolationRule`）。

---

## R3：全庫結構性 Gate 為何不能只靠既有的「逐 Session compile→render→checkBudget」迴圈

**問題**：`runContentGate` 已經對三軌全部 Session 執行 `compile()→render()→checkBudget()`，
quiz 選項一旦掛進 `ReviewLesson`，理論上不是「順便」就把每一題的字元預算都驗過了嗎？

**Decision**：**不夠，必須另外對整份 `quiz-bank.json` 做全量結構檢查**（`checkQuizBank`）。
原因：FR-005 允許每個 Concept 有 3–10 題，但 FR-003 的選題公式對單一 Concept 在其**整個課表
生命週期**中只會被三個 Track 各選中一次（Q2/Q3 已實測「三軌全部 Concept 皆恰好被 review
涵蓋 1 次」），即最多只有 **3 個相異索引** `(localOrder+0/1/2) mod itemCount` 会被
`compile()→render()` 實際觸達。當 `itemCount > 3` 時，題庫中**未被觸達的題目完全不會經過
`checkBudget`**——若這些題目超出 `quizItem` 上限（現為 570），不會在現行迴圈中被發現，只會在未來
Topic 重排導致 `localOrder` 位移、選中索引改變時才爆出（届时是 runtime 或下一次 CI，而非
本次生成即發現）。`checkQuizBank` 因此 MUST 對 `byConcept` 的**每一個陣列元素**逐一檢查，
不依賴課表選中與否——這與 F8 `checkMaterials` 對 `ReflectionBank.byTopic` 的每一則都檢查
（而非只查被選中的那則）同一設計動機。

**連帶決策**：`checkQuizBank` 對逐題預算檢查需要模擬「附連結後的呈現長度」，但
Gate 執行當下不知道實際的 `PAGES_BASE_URL`（R1 已定案為 runtime 選填）。**採保守估計**：
以常數 `QUIZ_URL_RESERVE_CHARS`（見 data-model.md §3）代表連結欄位的保留字元數上限，
在計算 `quizItem` 預算時一律假設連結存在且佔滿保留額度——這使結構性 Gate 恆比 runtime
實際檢查更嚴格（連結缺席時 runtime 的 `checkBudget` 只會更寬鬆，不會有「Gate 過但 runtime 爆」
的落差方向）。

**數值修訂（2026-08-07，`/speckit-analyze` C1）**：該常數初訂為 **90，低於實際最壞值**，
使上述「Gate 恆嚴格」的方向**反轉**——實測最壞連結長度為 **111** = base URL 47
（`https://sylvia-h.github.io/leetcode-daily-coach`）+ `/quiz/` 6 + 最長 conceptId 42
（`sliding-window-longest-substring-no-repeat`）+ `.html` 5 + ` · [完整詳解]()` 裝飾 11；
即使取中位長度的 conceptId 也達 99。以 90 保留即代表 Gate 估算**短於** runtime 實際長度，
可能出現「CI 過、正式推播才爆」，直接違反憲章 IX。**已更正為 120**（最壞值 + 約 8% 餘裕），
且 `quizItem` 上限同步由 450 提為 **570**（內容 450 + 連結 120，見 spec FR-014）。
**此常數 MUST NOT 低於實際最壞值**；未來若 base URL 或 conceptId 命名變長，MUST 一併重估。

---

## R4：Compiler 如何拿到「答對代號→選項字母」的對應（options 不含前綴，FR-006）

**問題**：`QuizItem.options` 儲存純文字（無 `A.`/`B.` 前綴），`answer` 需要指出哪一個是正解。
用「正解在陣列中的 index」還是「正解文字本身」？

**Decision**：**用 0-based index（`answerIndex: 0|1|2|3`）**，不用文字比對。
理由：文字比對在選項出現重複或近似字串時語意含糊；index 直接對應「呈現時第幾個選項加上
A/B/C/D 前綴」，Renderer 只需 `String.fromCharCode(65 + answerIndex)` 即可得到字母，
不需要额外查找。生成端／Gate 端一律用 index，`answerIndex` 必須落在 `[0,3]` 且對應選項
存在（schema 保證陣列恰為 4 個元素，故只需驗範圍）。

---

## R5：Renderer 中「本週小測」段的位置——F8「鼓勵語 MUST 為最後一段」是否仍成立

**問題**：spec FR-002 原文「MUST 於第四段（Challenge 後）附加第五段」語意有兩種讀法：
(a) 插入點在 Challenge 之後、鼓勵語之前（新段落變成第 4 段，鼓勵語順延為第 5 段）；
(b) 插入點在鼓勵語之後（鼓勵語維持第 4 段，小測變成新的第 5 段）。

**Decision**：**採讀法 (a)**——版面順序為
`📚 本週涵蓋 → 🤔 Reflection → 🎯 Challenge → ✍️ 本週小測 → 💬 一句話`。
理由：
1. FR-002 原文明確寫「Challenge **後**」而非「鼓勵語後」，字面最貼近的錨點是 Challenge。
2. F8 `review-selection.md` §6 定案的不變式「**鼓勵語 MUST 為最後一段**（FR-022）：MUST NOT
   插入於 Reflection 與 Challenge 之間，避免通用文字稀釋針對本週教材的具體提問」——本 Feature
   的定位與邊界未列出要撤銷此不變式，讀法 (a) 讓兩條規則同時成立（鼓勵語依然最後），
   讀法 (b) 則會與「MUST 為最後一段」直接衝突，須先讓使用者明確廢止 FR-022 才能採用，
   而 spec 並無此廢止意圖的任何字句。
3. 「附加第五段」的「五」對得上「本週涵蓋、Reflection、Challenge、小測、鼓勵語」共五段的最終計數，
   讀法 (a) 與 (b) 在段落**總數**上並無差異，故「五」本身不足以決勝，需靠 1、2 點決定。

---

## R6：quiz-bank 生成腳本的兩階段呼叫是否算兩次「批次」（續跑粒度）

**問題**：FR-016 要求「先列面向、再據以出題」為兩階段，FR-013/FR-013a 要求交叉驗證與
最多 3 輪重生。續跑（checkpoint）的最小單位應該是「面向列舉」還是整個 Concept？

**Decision**：**以 Concept 為續跑單位**（同 F8 以 Topic 為單位、F7 以 Concept 為單位），
面向列舉與出題+交叉驗證**在同一次「該 Concept 的生成嘗試」內完成**，不拆成两个可獨立續跑的
子階段。理由：
- 面向列表若中途變更（下一輪重生時因交叉驗證棄題），需要**在同一份面向基礎上**針對被棄題的
  面向重出（FR-013 的重生規則），拆開續跑反而需要額外持久化「面向列表」這一中繼產物，
  且面向列表本身不是任何契約要求的凍結產物。
- Manifest 的 `inputHash` 綁 Concept Skeleton 雜湊（FR-015），與 F7 `ConceptCheckpoint.skeletonHash`
  完全同構，一個 Concept 對應一筆 checkpoint，續跑判斷（`shouldSkip`）可直接複用
  `scripts/lib/checkpoint.ts` 現有的 `hashFile`/`writeFileAtomic`/`readJsonCheckpoint` 等
  I/O 邊界函式，只需新增一份 `QuizManifest` 型別（結構參照 `MaterialManifest`，但
  `inputHash` 語意換成 Skeleton 雜湊而非 prompt 版本雜湊）。

---

## R7：Pages 的 quiz 頁涵蓋範圍——是否為「全部 165 個 Concept」還是「僅 unlocked」

**問題**：FR-011 **修訂前**的字面是「GitHub Pages MUST 為每個 Concept 產出一頁完整題庫頁」
（本節的決策已於 2026-08-07 回寫該 FR），
但既有 `buildArticlePageView`／`articles/{conceptId}.html` 只對 `unlockedIds`
（`state.tracks[*].completedConceptIds` 的聯集，經 `computeUnlockedConceptIds` 計算）產出，
避免提前洩漏尚未解鎖的課程內容（dashboard 的「解鎖」模型）。

**Decision**：**quiz 頁比照 article 頁，僅對 `unlockedIds` 產出**，不是全部 165 個。
理由：
1. **一致性**——`docs/spec.md` 的 unlock 模型是全站一致的呈現規則，quiz 頁單獨破例對外
   曝光尚未解鎖 Concept 的內容，會製造「文章看不到、但測驗題看得到」的不一致體驗，且讓
   尚未學到的課程內容（面向、考點）提前劇透。
2. **Discord 連結恆落在已解鎖範圍內**——`review` Session 只會涵蓋「已經上過的」concept
   Session（`reviewRange` 定義即為之前的課表區間），而 review 推播時對應 Concept 必然已
   計入 `completedConceptIds`（`advance()` 在該 concept Session 推播成功時就寫入）。
   故 Discord 產生的連結**必然**指向一個屬於 `unlockedIds` 的 Concept，兩者範圍不會有落差，
   `unlockedIds` 限定不會造成「連結出去卻 404」的問題。
3. **實作成本**——`buildSite()` 現有的 `for (const conceptId of unlockedIds)` 迴圈可直接
   複用，只需在迴圈內多一段「若 quiz bank 有該 Concept 的題目則額外輸出
   `quiz/{conceptId}.html`」，不需另建一個涵蓋範圍不同的迴圈。

---

## R8：quiz-bank 的獨立二次作答交叉驗證（FR-013）是否需要新的 self-check 模組

**問題**：F7/F8 的 self-check（`scripts/lib/prompts/self-check.ts`）回應形狀是
`{ confident: boolean, issues: string[] }`，用於「複審已產出的草稿是否有問題」。
FR-013 的交叉驗證性質不同：**不是複審，而是重新作答**（盲答，不給正解），比對答案是否一致。

**Decision**：**新增獨立的 prompt/parse 模組 `scripts/lib/prompts/quiz-cross-check.ts`**，
不沿用 `self-check.ts` 的 `SelfCheckResponse` 形狀。理由：
- 回應形狀不同——交叉驗證只需要「這題應該選哪個」（`{ answerIndex: number }`），不是
  信心與問題清單；語意上是「獨立解題」而非「審稿」，混用 `SelfCheckResponse` 會讓
  `confident`/`issues` 欄位變得沒有意義（永遠不會被填）。
- Prompt 內容本質不同——`buildQuizCrossCheckPrompt` MUST NOT 提供題庫標記的正解（FR-013
  明文），且只送題幹與四個選項（不含 explanation），與既有 self-check prompt 送整篇文章
  或整批問題的形態完全不同，強行共用同一個檔案只會讓兩種 prompt 建構邏輯互相干擾。
- `stripJsonFence` 為通用的 JSON fence 剝除 helper（與回應形狀無關），**繼續從
  `self-check.ts` import 復用**，不重複實作。

---

## 待併入 spec 的 Phase 0 修訂（比照 F8 R5/R6 模式）

| 項目 | 原字面 | 修訂 |
| --- | --- | --- |
| FR-002 小測段插入點 | 「於第四段（Challenge 後）附加第五段」（讀法歧義） | 明訂為 Challenge 之後、鼓勵語之前（R5），版面五段順序：本週涵蓋／Reflection／Challenge／小測／鼓勵語 |
| Pages 連結來源 | 未提及機制 | 新增：沿用 `PAGES_BASE_URL` 環境變數（R1），`push` job 缺席該變數即全部省略連結，本 Feature 不修改 `daily.yml` |
| FR-011 quiz 頁產出範圍 | 「MUST 為**每個** Concept 產出一頁」 | 明訂為僅 `unlockedIds` 且題庫中有題者（R7），與 `articles/{conceptId}.html` 同構；**此項於 2026-08-07 `/speckit-analyze` 才發現漏回寫**，現已補入 spec FR-011 與 `docs/spec.md` §15 |

上述修訂已同步至本 plan 與 `data-model.md`／`contracts/`，並已於 `/speckit-tasks` 前回寫
`docs/spec.md` 與 `specs/011-weekly-quiz/spec.md`（見 spec.md FR-002／FR-012）。
**回寫時另發現 `docs/spec.md` §15 的段落順序圖誤植**（Encouragement 排第四、Quiz 排第五，
直接違反 F8 FR-022「鼓勵語 MUST 為最後一段」，與本節 R5 的決策矛盾）——已一併更正為
Quiz 第四、Encouragement 最後。
