# Feature Specification: Lesson Compiler、全 Session 類型 Renderer 與內容 CI Gate

**Feature Branch**: `005-lesson-compiler`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "feature 005-lesson-compiler"

## 背景與目的

本 Feature 是 LeetCode Daily Coach 的第五個切片（對應 `docs/spec.md` §22.5 **F5**、§23 Phase 2、里程碑
**M2** 的後半），依賴 F2（`002-curriculum-schema`，共用 Curriculum DAG 與驗證）、F3（`003-problem-bank`，
題庫與 Concept ↔ Problem 逆向查找）與 F4（`004-schedule-generator`，三份 `schedules/{track}.json` 與
`overlays/{track}.json` 的 schema 與生成器）。

前四個 Feature 各自交付了**素材**：DAG、題庫、課表、Overlay，以及 F1 為了打穿全鏈路而硬編的一段最小推播
路徑。本 Feature 交付的是把這些素材**接成一顆元件**的關鍵環節——`docs/spec.md` §7.1 的 **Lesson Compiler**：
對任意 `(track, sessionIndex)`，載入全部來源 → 驗證 → 組出一個 `Lesson`（§16.4），再由 **Renderer** 把
`Lesson` 轉成 Discord embeds。Compiler MUST 是**單一模組**，**CI Gate 與每日 runtime 呼叫同一顆**
（`docs/spec.md` §4-9、憲章第 IX 條）；MUST NOT 出現「Gate 一套解析、runtime 另一套解析」的雙軌實作。

同時，本 Feature 建立內容 Gate（`scripts/validate.ts` + `.github/workflows/content-gate.yml`）：對
**全部三個 Track × 各自課表的全部 Session** 完整編譯並 render，逐筆檢查 Discord 結構性上限與字元預算
（§14.5）。這是「能在 CI 驗的，不留到早上六點」的具體兌現——內容類失敗在 PR 階段就被擋下，讓 F6 每日
runtime 的失敗面積趨近於零。

本 Feature 亦負責**清償 F1 留下的臨時債**：`src/compiler/schedule.ts` 的硬編 3-Session 課表與硬編學習路徑
對照表 `getPathLabels`（F2 clarify 2026-07-21 定案：DAG 由 F2 建立，`Lesson.path` 的推導與 F1 對照表的
移除屬 F5），以及 `src/compiler/lesson.ts` 內的 demo 題號常數與 demo why/hint 常數表。

**對應驗收基準**：`docs/spec.md` §24 **AC7**（Renderer 為純函式，同一 Lesson → 相同 embeds）與 **AC8**
（CI Gate 對全部三 Track × 全部 Session 完整編譯並 render，全數通過 Discord 限制檢查）；§22.5 F5 驗收
（同一 `(track, sessionIndex)` → 相同 Lesson 與 embeds；Gate 對全部 Session 編譯通過）；里程碑 **M2**。

## Clarifications

### Session 2026-07-23

- Q: 內容 Gate（`content-gate.yml`）是否含教材 TS/Python 程式碼實測？ → A: **延到 F7**。本 Feature 的 Gate 範圍為「DAG 驗證 + 全 Track × 全 Session 完整編譯 + render 限制檢查 + 單元測試」；程式碼實測 harness 屬 §20.3 Stage 2-1（內容產線 Gate），在 F7 有真實教材素材時才具驗證力，屆時再加入同一支 `content-gate.yml`。此決策**跨 Feature**，MUST 回寫 `docs/spec.md` §21.3（已於本次同步）。
- Q: `practice` / `challenge` Session 的題目「為什麼適合此 Pattern」與 Hint 從何而來？ → A: **重用「引入該題的 Concept Article」的 `Today's Challenge` 條目**。Compiler 建立 `problemId → 引入它的 conceptId` 的**確定性**反查（該題被多個 Concept 引用時，取該 Track 課表中**較早引入**者；仍並列時以 F2 全序 `ordinalOf` 決勝）。查無來源時該題僅呈現題號 / 標題 / 連結 / 難度，MUST NOT 因此失敗。此決策影響 F7 產線（Article 的 `Today's Challenge` 是 practice/challenge 說明的唯一來源），MUST 回寫 `docs/spec.md` §14.3（已於本次同步）。
- Q: F8 的 `reflection-bank.json` / `encouragement.json` 未就緒時，`review` / `rest` 版面如何處理？ → A: **`Lesson` 的 `reflectionQuestion` / `encouragement` 為選配欄位；素材檔缺席即省略該段落**，Renderer 不產生空段落或佔位字串，Gate 照常通過。F8 灌入素材後版面自動長出，Renderer 與 Compiler 不需再改。本 Feature MUST NOT 自行建立 F8 的素材檔。此決策放寬了 §15「review MUST 含三段」在 F8 之前的適用範圍，MUST 回寫 `docs/spec.md` §15（已於本次同步）。

### Session 2026-07-23（`/speckit-analyze` 後）

- Q: `interview-ready` #10（practice）實際排了 4 題，超過 §14.5「最多 3 題」的硬預算，要在哪一層消除？ → A: **在 F4 生成端設題數上限**。`docs/spec.md` §13.4 新增「任一 Session 的 `problemIds` MUST ≤ 3」，由 `generate-schedule.ts` 於既有穩定序上**取前 3 題**（`selectConceptProblems` 與 `unionProblems` 皆套用），並以 `session-problem-overflow` 不變式自檢；三份課表已重跑。**Compiler / Renderer MUST NOT 截斷題目**（§14.5 明文禁止），Gate 的 `problems.count` 檢查為兜底。此決策跨 Feature，已回寫 `docs/spec.md` §13.4 / §14.5 與 F4 的 `contracts/schedule-schema.md`。
- Q: Overlay `extraProblemIds` 在 F4 生成端已套用（`foundation` #4 的題號 27 即由此而來），FR-009 又要求 Compiler 再套用一次，單點該落在哪裡？ → A: **只在 F4 生成端**。凡會改變「今天做哪幾題」的 Overlay 欄位，唯一套用點 MUST 在 `generate-schedule.ts`；**Compiler MUST NOT 消費 `extraProblemIds`**（重複套用即憲章 IX 的雙軌、並使生成物失去權威）。Compiler 唯一消費的 Overlay 欄位是 `extraNotesMarkdown`。此裁決與 `challengeDifficulty` 的既有裁決（research R6）統一於同一條總則。已回寫 `docs/spec.md` §16.3。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 由真實素材編譯出任意一堂課 (Priority: P1)

維護者指定一個 Track 與一個 `sessionIndex`，Compiler 依該 Track 的課表決定「今天做什麼」，載入對應的
Full Article、題庫 metadata、Overlay 與 DAG 學習路徑，組出一個完整的 `Lesson`——不再依賴 F1 的硬編課表、
硬編路徑與 demo 題號常數。

**Why this priority**: 這是本 Feature 的存在理由，也是 F6 每日 pipeline 唯一的內容入口。沒有它，前四個
Feature 交付的素材永遠只是躺在 repo 裡的 JSON 與 Markdown，無法變成一堂可推播的課。

**Independent Test**: 對 `foundation` Track 的 `sessionIndex = 4`（stub 課表中的一個 concept Session），
呼叫 Compiler 並檢查回傳的 `Lesson`：`concept` 各欄位取自對應 Article 的固定區塊與 frontmatter、`problems`
的題號 / 標題 / 連結 / 難度取自 Problem Bank、`path` 取自 DAG，無任何欄位來自硬編常數。

**Acceptance Scenarios**:

1. **Given** `schedules/foundation.json` 與對應的 Article、題庫、DAG，**When** 編譯一個 `concept` Session，
   **Then** 得到含 `concept`（digest / tsTip / pyTip / takeaway / exitCriteria / patternLabel /
   complexityLabel / estimatedMinutes / articlePath）、`problems`、`path` 與頂層 `color` 的完整 `Lesson`
   （顏色為 `Lesson` 頂層欄位而非 `concept.moduleColor`——非 concept 類 Session 亦需顏色，見 FR-014、
   `docs/spec.md` §16.4）。
2. **Given** 同一份 repo 內容，**When** 對同一 `(track, sessionIndex)` 重複編譯，**Then** 兩次結果完全相同
   （deep-equal，且序列化後 byte-identical）。
3. **Given** 某個 `sessionIndex` 超出該 Track 課表範圍，**When** 編譯，**Then** 拋出指名 track 與 sessionIndex
   的錯誤（fail loud），MUST NOT 回傳空 Lesson 或靜默夾帶最後一堂課。
4. **Given** 編譯過程，**When** 檢視其相依，**Then** 全程無任何 LLM 呼叫與網路存取（零 LLM runtime）。

---

### User Story 2 - 五種 Session 類型都有可推播的版面 (Priority: P1)

課表裡不只有 `concept`：還有 `practice`、`review`、`challenge`、`rest`。使用者不論今天輪到哪一種，都會在
Discord 收到一則結構正確、內容合宜的訊息，而不是編譯失敗或空白訊息。

**Why this priority**: F1 只支援 `concept`，但 F4 生成的課表每 7 個 Session 就會出現 practice / challenge /
review / rest。只要有任一類型無法編譯或無法 render，Gate 就不可能對「全部 Session」通過（AC8），F6 的每日
推播也會在第 3 天就撞牆。與 US1 並列 P1。

**Independent Test**: 對每個 Track 的課表各取出五種類型至少一筆，逐一編譯 + render，檢查產出的 embeds 結構
符合 §14.2 / §14.3 / §15 的版面約定，且不含未填值的佔位字串。

**Acceptance Scenarios**:

1. **Given** 一個 `practice` Session，**When** 編譯並 render，**Then** 產出以題目為主的 embeds（題目連結 +
   難度 + 提示），不含 concept 專屬欄位（Digest / Tips / Exit Criteria）。
2. **Given** 一個 `review` Session，**When** 編譯，**Then** Review 段的 Concept 清單 MUST 由 Compiler 依
   `reviewRange` 的 sessionIndex 範圍推導，涵蓋該範圍內全部 `concept` Session 的 Concept。
3. **Given** 一個 `challenge` Session，**When** 編譯並 render，**Then** 產出該 Track `challengeDifficulty`
   對應的題目 embeds。
4. **Given** 一個 `rest` Session，**When** 編譯並 render，**Then** 產出一則簡短版面，不引入新 Concept、
   不夾帶題目清單。
5. **Given** 任一非 `concept` 類型，**When** render，**Then** 版面選擇僅依 `Lesson.type` 決定，MUST NOT
   依 `Lesson.track` 改變版面結構。

---

### User Story 3 - CI Gate 對全 Track × 全 Session 完整編譯與限制檢查 (Priority: P1)

維護者送出一個改動教材、課表、題庫或 Compiler / Renderer 的 PR，CI 自動對三個 Track 的全部 Session 逐一
編譯並 render，檢查每一則訊息都符合 Discord 的結構性上限與本專案的字元預算。任何一筆不通過，Gate 失敗、
PR 不得合併。

**Why this priority**: 這是 §4-9「Build-time over Runtime」的兌現點，也是 AC8 的直接對應。沒有它，字元
超限、教材區塊缺漏、參照斷裂這類錯誤會延後到台北早上六點才由推播失敗告訴你。

**Independent Test**: 在本機執行 Gate 指令，對三份課表全部 Session 完整跑一遍並回報通過筆數；再故意把某篇
Article 的 Digest 撐到超過 900 字元，Gate MUST 失敗並指名該 `(track, sessionIndex, 區塊)`。

**Acceptance Scenarios**:

1. **Given** 目前 repo 內容，**When** 執行 Gate，**Then** 三個 Track 全部 Session 皆編譯 + render 成功，
   逐筆通過結構性上限與字元預算檢查，以 exit code 0 結束。
2. **Given** 某篇 Article 的 Digest 超過 900 字元，**When** 執行 Gate，**Then** 以非零 exit code 失敗，
   錯誤訊息指名 track、sessionIndex、超限區塊與實際 / 上限字元數。
3. **Given** 某 Session 的 `conceptId` 在 DAG 中不存在、或其 Article 檔案缺漏，**When** 執行 Gate，
   **Then** fail loud 並指名該筆，MUST NOT 靜默跳過該 Session。
4. **Given** 多筆違規同時存在，**When** 執行 Gate，**Then** 一次回報全部違規（不在第一筆就中止），
   最後彙總筆數並以非零 exit code 結束。
5. **Given** 一個修改 `articles/**` 的 PR，**When** 推上 GitHub，**Then** 內容 Gate workflow 自動觸發。

---

### User Story 4 - Renderer 是可信賴的純函式 (Priority: P2)

Renderer 只認得 `Lesson`。給它同一個 `Lesson`，永遠得到同一批 embeds；它不讀 Curriculum、不讀題庫、不碰
檔案系統與 state，也不因 Track 不同而改變版面結構。

**Why this priority**: 憲章第 XI 條（Renderer 不知道 Curriculum）與 AC7 的直接對應。這條界線一旦破口，
「Gate render 過 ⇒ runtime render 也過」的推論就不成立，Gate 的保證會失效。列 P2 是因為 F1 已建立此界線，
本 Feature 是在擴充版面時**維持**它，而非從零建立。

**Independent Test**: 檢視 Renderer 模組的 import 清單——只允許型別 import；對同一 `Lesson` 連續 render
兩次，結果 deep-equal；把同一 `Lesson` 的 `track` 換成另外兩個 Track，embeds 結構不變。

**Acceptance Scenarios**:

1. **Given** 一個 `Lesson`，**When** 連續 render 兩次，**Then** 兩次 embeds deep-equal。
2. **Given** 同一 `Lesson` 只改 `track` 欄位，**When** render，**Then** embeds 結構與內容不因 Track 而異。
3. **Given** Renderer 模組，**When** 檢視其相依，**Then** 不含檔案讀取、Curriculum / Problem Bank / state
   的任何 import。

---

### User Story 5 - Track 差異只由課表與 Overlay 疊加 (Priority: P2)

同一個 Concept 在三個 Track 共用完全相同的教材正文；Track 專屬的差異只來自兩處——**題目集合來自各自的
課表**（難度帶過濾與 Overlay 加題已在 F4 生成階段凍結進課表），**補充說明來自 Overlay 的
`extraNotesMarkdown`**，以**疊加**方式進入 Lesson，而不是取代或改寫核心內容。

**Why this priority**: 憲章第 VI 條（Shared Knowledge, Different Tracks）與 AC5 的延伸驗證。若在此處誤把
Overlay 實作成覆蓋，三份教材就會悄悄分裂；若在此處重複套用 `extraProblemIds`，同一條加題規則就會有
生成端與 runtime 兩份實作（憲章 IX）。

**Independent Test**: 對同一 Concept 分別以三個 Track 編譯，比對 `concept` 的 digest / tips / takeaway 完全
相同、`problems` 完全等於各自課表的 `problemIds`（Compiler 未增刪任何一題）；`foundation` Overlay 宣告的
`extraNotesMarkdown` 出現在 `Lesson.overlayNotes` 且 Digest 一字未動。

**Acceptance Scenarios**:

1. **Given** 同一 `conceptId` 在三個 Track 的課表中，**When** 分別編譯，**Then** `concept` 的教材正文欄位
   三軌完全相同。
2. **Given** 某 Track 課表的某 Session，**When** 編譯，**Then** `Lesson.problems` 的題號序**完全等於**該
   Session 的 `problemIds`（Compiler MUST NOT 因 Overlay 或任何其他來源增刪、重排題目）。
3. **Given** 某 Track Overlay 宣告 `extraNotesMarkdown`，**When** 編譯並 render，**Then** 該內容以附加段落
   呈現，MUST NOT 取代 Digest 或任何核心區塊。
4. **Given** Overlay 指向該 Track 未涵蓋的 `conceptId`，**When** 編譯或執行 Gate，**Then** fail loud
   （沿用 F4 定案）。
5. **Given** 某 Track Overlay 對某 Concept 宣告 `extraProblemIds`，**When** 編譯，**Then** `Lesson.problems`
   **不因此改變**——該加題的效果已在課表中（F4 生成階段套用），Compiler MUST NOT 再次套用。

---

### Edge Cases

- **課表指向不存在的 Concept / Article**：`conceptId` 不在 DAG、或 `articlePath` 指向的檔案不存在 ⇒ fail loud，
  指名 track / sessionIndex / conceptId / 路徑。
- **Article 固定區塊缺漏或空白**：缺 `Digest` / `TypeScript Tip` / `Python Tip` / `Takeaway` 等必備區塊 ⇒
  fail loud 並指名區塊名稱，MUST NOT 以空字串補位。
- **Article frontmatter 的 `id` 與課表 `conceptId` 不符** ⇒ fail loud（檔案錯置的唯一攔截點）。
- **課表 `problemIds` 的題號在 Article `Today's Challenge` 中缺漏**（`concept` 類 Session）⇒ fail loud，
  MUST NOT 以空的「為什麼適合此 Pattern」靜默出題（沿用 F1 `demo-content-missing` 的判準）。
  反向的「條目多於課表題號」為**正常狀態**（難度帶過濾的必然結果），MUST NOT 報錯（FR-006）。
- **`leetcode: []` 的無題目觀念課**（如 Programming Mindset）⇒ 一等合法：編譯出不含題目 embed 的 Lesson，
  MUST NOT 因題數 0 報錯（F3 定案）。
- **`reviewRange` 涵蓋範圍內沒有任何 `concept` Session** ⇒ 視為課表缺陷（F4 的 `review-coverage-gap` 已於
  生成端把關）；Compiler 側 MUST fail loud 而非產出空清單的 review 版面。
- **render 後總長超過 5,500** ⇒ MUST NOT 自動截斷；依 §14.5 確定性拆為第二則訊息，若拆後仍有單一 embed
  超過平台硬限制 ⇒ Gate 失敗。
- **單一 embed 結構性超限**（title > 256、description > 4,096、fields > 25、field value > 1,024、
  單則 > 10 embeds）⇒ 與字元預算在**同一顆預算檢查函式的同一次呼叫**中檢查（F1 定案）。
- **Overlay 檔案不存在** ⇒ 視為該 Track 無 Overlay（空 `byConcept`），MUST NOT 因此失敗；但檔案存在卻不符
  schema ⇒ fail loud。
- **某 Session 的 `problemIds` 超過 3 題** ⇒ 課表缺陷（F4 已於生成端以取前 3 題 + `session-problem-overflow`
  不變式把關）。Gate 的 `problems.count` 檢查為**兜底**：MUST 回報 `budget-over` 違規，**MUST NOT 由
  Compiler 或 Renderer 截斷題目**（`docs/spec.md` §14.5 禁止截斷）；處置方式是修生成器並重跑課表。
- **F8 素材（Reflection / 鼓勵語）尚未存在** ⇒ 對應段落省略，Lesson 與 render 皆正常產出、Gate 照常通過
  （FR-031），MUST NOT fail 也 MUST NOT 產生空段落。
- **`practice` / `challenge` 的題目查無「引入它的 Concept」** ⇒ 該題僅呈現題號 / 標題 / 連結 / 難度
  （FR-030），MUST NOT fail loud（與 concept Session 的題目不對齊錯誤語意不同，勿混用）。
- **同一 Concept 在同一 Track 課表中出現兩次** ⇒ 違反「One Concept per Session」的課表缺陷，Gate MUST 攔下。

## Requirements *(mandatory)*

### Functional Requirements

**Lesson Compiler（單一模組；Gate 與 runtime 共用）**

- **FR-001**: 系統 MUST 提供**唯一一顆** Lesson Compiler 入口，接受 `(track, sessionIndex)` 並回傳一個
  `Lesson`；CI Gate 與每日 runtime MUST 呼叫同一個入口，MUST NOT 存在第二套解析 / 組裝路徑。
- **FR-002**: Compiler MUST 由 `schedules/{track}.json`（F4 生成物）取得該 `sessionIndex` 的 `SessionPlan`；
  MUST 移除 F1 硬編的 3-Session 課表。
- **FR-003**: `sessionIndex` 不是 **1..N 範圍內的整數**（N = 該 Track 課表長度）時——含 `0`、負數、非整數、
  超出 N——MUST 拋出指名 track、sessionIndex 與課表長度的具名錯誤，MUST NOT 夾帶邊界值靜默回傳。
- **FR-004**: `concept` 類 Session MUST 依 F2 `ConceptNode.articlePath` 解析 Full Article；Article frontmatter
  的 `id` 與課表 `conceptId` 不符時 MUST fail loud。
- **FR-005**: Compiler MUST 解析 §10 的固定區塊；推播所需區塊（`Digest`、`TypeScript Tip`、`Python Tip`、
  `Takeaway`、`Today's Challenge`）缺漏或空白時 MUST fail loud 並指名區塊名稱。
- **FR-006**: **`concept` 類 Session** 每題的「為什麼適合此 Pattern」與 Hint MUST 取自該 Article 的
  `Today's Challenge` 區塊。對齊規則為**單向包含**：該 Session `problemIds` 的**每個題號 MUST 在條目中
  找得到**，找不到即 fail loud（指名 track / sessionIndex / 題號）；**條目多於課表題號 MUST NOT 視為錯誤**
  （Track 難度帶過濾後題數本就少於 Concept 宣告的 `leetcode`）。MUST 移除 F1 的 demo why/hint 常數表。
  （非 `concept` 類 Session 的來源與失敗語意見 FR-030，兩者 MUST NOT 混用。）
- **FR-007**: 題目的題號 / 官方標題 / 連結 / 難度 MUST 由程式自 Problem Bank 帶入（憲章第 XVII 條），
  MUST NOT 取自 Article 正文。MUST 移除 F1 的 demo 題號常數。
- **FR-008**: `Lesson.path` 的 prev / current / next MUST 由 F2 的 Curriculum DAG（`prerequisite` / `next`）
  推導（F2 clarify 2026-07-21 定案），並 MUST 移除 F1 的硬編學習路徑對照表 `getPathLabels`。多個
  prerequisite / next 時的取用 MUST 為確定性（依 F2 既有全序 `ordinalOf`）。
- **FR-009**: Compiler MUST 套用 `overlays/{track}.json`，語意一律為**疊加不取代**。**總則（跨 Feature
  定案 2026-07-23，已回寫 `docs/spec.md` §16.3）：凡會改變「今天做哪幾題」的 Overlay 欄位，唯一套用點
  MUST 在 `generate-schedule.ts`（F4 生成階段）並凍結於課表；Compiler 只組裝不選題、不加題。**
  - `extraNotesMarkdown`：以獨立附加內容進入 `Lesson.overlayNotes`，MUST NOT 併入或取代 Digest 等核心
    區塊。**這是本 Feature 唯一消費的 Overlay 欄位**——它是補充說明，不改變選題。
  - `extraProblemIds`：**本 Feature MUST NOT 消費**。F4 `generate-schedule.ts` 已於 concept 槽選題時把它
    附加於難度帶過濾結果之後（並納入同週 practice 槽的聯集），結果凍結於 `schedules/{track}.json`。
    Compiler 再套用一次等於**同一規則兩處實作**（違反憲章 IX 的禁雙軌），並使生成物失去權威
    （違反憲章 XIII）。Track 的題目分歧 MUST 純粹來自課表本身。
  - `challengeDifficulty`（per-Concept）：**本 Feature MUST NOT 消費**。challenge 選題已於 F4 生成階段依
    `track-params.json` 的 per-Track `challengeDifficulty` 決定並凍結於課表，且 challenge 槽非 concept-bound，
    在 Compiler 側無套用點。若日後要使其生效，套用點 MUST 在 `generate-schedule.ts`。

  Overlay 檔缺席 MUST 視為空 Overlay；存在但不符 schema 或指向該 Track 未涵蓋的 Concept MUST fail loud
  （即使本 Feature 只消費其中一個欄位，schema 與參照完整性仍 MUST 於載入層把關）。
- **FR-010**: Compiler MUST 支援全部五種 Session 類型（`concept` / `practice` / `review` / `challenge` /
  `rest`），並為各類型組出對應形狀的 `Lesson`。
- **FR-011**: `review` 類 Session 的 Concept 清單 MUST 由 Compiler 依 `reviewRange` 的 sessionIndex 範圍推導
  （§15），MUST NOT 由其他來源指定。
- **FR-012**: Compiler MUST 為確定性：同一份 repo 內容 + 同一 `(track, sessionIndex)` → 序列化後
  byte-identical 的 `Lesson`；MUST NOT 依賴系統時間、亂數或檔案系統列舉順序。
- **FR-013**: Compiler 執行全程 MUST NOT 呼叫任何 LLM API 或進行網路存取；`Lesson` 每一個欄位 MUST 來自
  build-time 已凍結的素材。
- **FR-014**: `Lesson` 型別 MUST 調整為足以承載五種 Session 類型（`concept` / `path` 等 concept 專屬欄位
  改為選配），且 MUST 維持為 Compiler → Renderer 的**唯一**介面。

**Renderer（全 Session 類型）**

- **FR-015**: Renderer MUST 為 stateless 純函式：同一 `Lesson` → 同一 embeds；MUST NOT 讀取 Curriculum、
  Problem Bank、檔案或 state。
- **FR-016**: Renderer MUST 為全部五種 Session 類型提供版面：`concept`（§14.2）、`practice` / `challenge`
  （題目為主，§14.3）、`review`（§15 三段）、`rest`（簡短版面）。版面選擇 MUST 僅依 `Lesson.type`。
- **FR-017**: Renderer MUST NOT 依 `Lesson.track` 改變版面結構（Track 只是 `Lesson` 的一個欄位）。
- **FR-018**: Module 配色 MUST 由確定性對照表提供，涵蓋 `curriculum/modules.json` 全部 Module 並具備
  fallback 色；同一 Module 的所有 Concept MUST 共用同色。
- **FR-019**: 結構性上限（單一 embed 的 title / description / fields 數 / field name / field value，單則訊息
  的 embeds 數）與逐區塊字元預算、總量上限 MUST 由**同一顆預算檢查函式**於同一次呼叫中檢查並以相同明細項
  形式回報（F1 定案）。長度單位 MUST 為 Unicode code point。
- **FR-020**: 超出預算時 MUST NOT 自動截斷內容；單則訊息裝不下時 MUST 依確定性規則拆為第二則訊息
  （§14.5 fallback）。
- **FR-021**: render 後單則訊息全部 embeds 文字總和 MUST ≤ 5,500 字元（平台硬限制 6,000，保留 500 餘裕）。

**內容 CI Gate**

- **FR-022**: 系統 MUST 提供一個 Gate 入口，對**全部三個 Track × 各自課表的全部 Session** 完整編譯並 render，
  逐筆執行預算與結構性上限檢查。任一 Track 的課表為空（0 個 Session）MUST 視為違規並回報——否則 Gate 會以
  「通過 0 筆」的形式靜默失效。
- **FR-023**: Gate MUST 呼叫與每日 runtime 同一顆 Compiler 與同一顆 Renderer / 預算檢查函式。
- **FR-024**: Gate MUST 一次回報全部違規（不於第一筆中止），每筆指名 track / sessionIndex / 區塊 / 成因，
  最後彙總筆數；有任一違規 MUST 以非零 exit code 結束。
- **FR-025**: Gate MUST 於 `.github/workflows/content-gate.yml` 中，對 `concepts/**`、`articles/**`、`data/**`、
  `schedules/**`、`overlays/**`、`curriculum/**`、`src/**` 的 PR / push 觸發（§21.3）。
- **FR-026**: Gate 入口 MUST 可由 `npm run` script 於本機以相同方式執行（本機與 CI 同一條指令路徑）。
- **FR-027**: Gate 執行全程 MUST NOT 需要任何 LLM API key。
- **FR-028**: 內容 Gate 的檢查範圍 MUST 限於「DAG 驗證 + 全 Track × 全 Session 完整編譯 + render 限制檢查 +
  單元測試」；教材 TS/Python 程式碼實測 **MUST NOT** 納入本 Feature（延至 F7 加入同一支 `content-gate.yml`）。
  本 Feature MUST NOT 在 workflow 中留下無驗證力的實測空殼步驟。

**F1 臨時債清償**

- **FR-029**: 本 Feature 完成後，下列 F1 臨時產物 MUST 全數移除，且不得留下等價的替身（改名搬家亦屬違反）：
  `src/compiler/schedule.ts` 的硬編 3-Session 課表（`SESSION_PLANS`）與硬編學習路徑對照表 `getPathLabels`、
  `src/compiler/lesson.ts` 的 demo 題號常數（`DEMO_LEETCODE_IDS`）與 demo why/hint 常數表
  （`DEMO_PROBLEM_CONTENT`），以及不對應任何 DAG Concept 的孤兒 Article
  `articles/two-pointer/002-left-right-pointer.md`（其內容可由 git 歷史取回）。

**非 `concept` Session 的內容來源（跨 F8 邊界）**

- **FR-030**: `practice` / `challenge` Session 的每題「為什麼適合此 Pattern」與 Hint MUST 取自
  **引入該題的 Concept Article** 的 `Today's Challenge` 條目。Compiler MUST 提供 `problemId → conceptId`
  的**確定性**反查：該題被多個 Concept 引用時取該 Track 課表中**較早引入**者；仍並列時以 F2 全序
  `ordinalOf` 決勝。查無來源時該題 MUST 僅呈現題號 / 標題 / 連結 / 難度，MUST NOT 因此失敗，亦 MUST NOT
  以空字串填充說明欄位。
  **「查無來源」MUST 涵蓋兩種狀態且走同一條路徑**（`docs/spec.md` §14.3）：(a) 反查表中找不到引入該題的
  Concept；(b) 反查到 Concept、但該 Concept 的 Article `Today's Challenge` 沒有該題號的條目（反查表建自
  `ConceptNode.leetcode`，而 Article 條目只被要求涵蓋課表排入的題號，故 (b) 為可達狀態）。兩者對使用者
  的結果相同（該題只有 metadata），MUST 皆為省略而非失敗。**與 FR-006 的 `concept` 類題目不對齊
  MUST NOT 混用**：concept 類的題目是該堂課的教學主體，缺說明代表教材與課表脫鉤 ⇒ fail loud。
- **FR-031**: `Lesson` 的 Reflection 問題與鼓勵語欄位 MUST 為選配；其素材（`data/reflection-bank.json` /
  `data/encouragement.json`）屬 F8，本 Feature MUST NOT 自行建立。素材缺席時 Renderer MUST **省略**該段落，
  MUST NOT 產生空段落或佔位字串，且 Gate MUST 照常通過。F8 灌入素材後版面 MUST 能在不修改 Renderer 與
  Compiler 版面邏輯的前提下自動長出。
  **「缺席」與「壞檔」MUST 明確區分**：素材檔**不存在**⇒ 視為缺席、省略段落、不失敗；素材檔**存在但不符
  schema**⇒ **fail loud**。MUST NOT 以同一條路徑處理兩者——否則一個打錯字的 JSON 會讓整個段落無聲消失，
  違反「Fail loud, not silent」（憲章 XV）。同一原則亦適用於 `overlays/{track}.json`（FR-009）。

### Key Entities

- **Lesson**：Compiler → Renderer 的唯一介面（§16.4）。承載 sessionIndex、type、track、選配的 concept
  區塊、problems、path、Overlay 附加內容，以及 review / rest 所需的素材欄位。全部欄位皆為 build-time 凍結內容。
- **ArticleContent**：一篇 Full Article 解析後的結構——frontmatter metadata + §10 的固定區塊（含推播用
  Digest / Tips 與 `Today's Challenge` 逐題條目）。
- **SessionPlan**：課表中的一筆（`sessionIndex` / `type` / `conceptId?` / `reviewRange?` / `problemIds?`），
  由 F4 生成、本 Feature 消費。
- **TrackOverlay**：Track 專屬的疊加內容（`extraProblemIds` / `extraNotesMarkdown` / `challengeDifficulty`），
  由 F4 定義 schema。**本 Feature 只消費 `extraNotesMarkdown`**；另兩個選題類欄位的套用點在 F4 生成階段
  （FR-009）。
- **BudgetReport**：預算與結構性上限檢查的結果——整體通過與否 + 逐項明細（項目名、實際字元數、上限）。
- **CompileViolation**：Gate 逐筆回報的違規（track / sessionIndex / 規則 / 主體 / 訊息），供彙總與 fail loud。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 對三個 Track 各自課表的**全部** Session，編譯與 render 的成功率為 **100%**，無任何一筆需要人工
  例外處理。
- **SC-002**: 全部三 Track × 全部 Session 的 render 結果，**100%** 通過結構性上限與字元預算檢查（單則
  ≤ 5,500 字元）。
- **SC-003**: 對同一 `(track, sessionIndex)` 重複編譯 **10 次**，序列化結果 byte-identical（determinism）。
- **SC-004**: 同一 `Lesson` 重複 render，embeds **完全相同**；同一 `Lesson` 換三個 Track，embeds 結構
  **零差異**。
- **SC-005**: 同一 Concept 在三個 Track 編譯出的教材正文欄位 **完全相同**，差異僅出現在題目集合與 Track
  專屬附加內容。
- **SC-006**: 對每一類可預期的失敗（區塊缺漏、參照斷裂、題目不對齊、預算超限），Gate 皆以**非零 exit code**
  結束並輸出**指名成因與位置**的訊息；無任何一類以靜默通過或截斷內容收場。
- **SC-007**: Gate 在**沒有任何 LLM API key** 的環境下可完整執行完畢。
- **SC-008**: 五種 Session 類型 **全部** 具備可推播版面，且每一種在 Gate 中至少各被實際編譯 + render 一次。
- **SC-009**: 本 Feature 完成後，`src/` 內針對「課表」「學習路徑」「題目說明」的硬編常數數量為 **0**。
- **SC-010**: Module 配色對照表涵蓋 `curriculum/modules.json` 宣告的**全部 Module（目前 16 個）**，
  未知 Module 一律落到單一 fallback 色；同一 Module 的所有 Concept 取得**相同**色值。

## Assumptions

- **stub 素材延續 F4 的作法**：正式的 150+ Concept 教材要到 F7 才全量生成。本 Feature 沿用 F2 的 stub
  Concept 與 F4 以 stub DAG 生成的三份課表，並為這些 stub Concept 補上**最小可編譯的 fixture Full Article**
  （含全部固定區塊），使 Gate 能真正跑完「全 Track × 全 Session」。這些 fixture 屬本 Feature 的開發素材，
  F7 全量展開時將被正式教材取代（取代後 Gate 的檢查項與判準不變）。
  **「最小可編譯」的驗收標準即「通過本 Feature 的內容 Gate」**：§10 固定區塊齊備且非空、frontmatter schema
  合格、`Today's Challenge` 涵蓋該 Concept 於三份課表中被排入的全部題號、且 render 後各項預算皆未超限。
  內容 MUST 為真實可讀的繁體中文教材（MUST NOT 使用 lorem 或重複填充字元）——否則預算檢查會失去意義。
- **`articles/**` 的既有慣例延續 F1**：Article 為 build-time 凍結產物，Compiler 只讀不寫。
- **Overlay 檔案已存在且通過 F4 schema**：本 Feature 只消費 `extraNotesMarkdown`（FR-009），不重新定義
  Overlay schema，也不消費會改變選題的欄位。
- **課表為可信輸入**：`schedules/{track}.json` 已通過 F4 生成器的內建驗證（拓樸子序列、`reviewRange` 涵蓋、
  參照完整、one-concept-per-session、**每 Session `problemIds` ≤ 3 題**）且 commit 後凍結、同輸入
  byte-identical；**Overlay 的 `extraProblemIds` 亦已於生成階段套入課表**。本 Feature 對其中少數不變式
  （`reviewRange` 涵蓋、參照存在）保留**第二道防線**，但 MUST NOT 重做 F4 的完整驗證，也 MUST NOT 修改課表。
- **配色表位置延續 F1 定案**：Module → 色碼對照屬 Curriculum 知識，置於 Compiler 側，Renderer 只使用
  `Lesson` 上已帶入的色值（憲章第 XI 條）。
- **Discord 實際推播不在本 Feature 範圍**：本 Feature 的驗證止於「編譯 + render + 預算檢查」；把 Lesson
  真正送進三個頻道、per-track guard 與狀態推進屬 F6。
- **F1 的 `daily.yml` 現況維持**：本 Feature 只新增 `content-gate.yml`，不改動每日推播 workflow（F6 才接手）。
- **失敗語意沿用既有慣例**：載入 / 參照 / schema 類錯誤為 `error` 級並 fail loud，與 F2 / F3 / F4 的
  violation 形態一致；本 Feature 不引入「警告後照樣產出」的新語意。
