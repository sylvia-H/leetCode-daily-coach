# Feature Specification: Schedule Generator（課表生成器、三組 Track 參數與 Track Overlay）

**Feature Branch**: `004-schedule-generator`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "feature 004-schedule-generator"

## 背景與目的

本 Feature 是 LeetCode Daily Coach 的第四個切片（對應 `docs/spec.md` §22.5 **F4**、§23 Phase 1、里程碑
**M2** 的前半），依賴 F2（`002-curriculum-schema`，已交付共用 Curriculum DAG 與驗證機器）與 F3
（`003-problem-bank`，已交付題庫與 `problemExists` 反查）。

三個 Track（Foundation / InterviewReady / InterviewMastery）**共用同一份 Concept 教材庫與 DAG**，但
**各自有一份獨立的 ~180-Session 課表**（`docs/spec.md` §9「模型 B」）。這三份課表 **MUST NOT 手寫**
（3 × ~180 筆手寫必然出錯且難以演進，§13.4），而 MUST 由 `scripts/generate-schedule.ts` **確定性生成**：
同一輸入 → **byte-identical** 輸出，且每份課表 MUST 為共用 DAG 的**合法拓樸子序列**（不得違反 prerequisite）。

本 Feature 交付的是**「把共用 DAG + 週節奏模板 + 每 Track 參數，確定性地攤平成三份可驗證課表」的生成器與其
資料契約**——包含 `TrackSchedule` / `TrackOverlay` schema、三組 Track 參數定義、以及生成器內建的課表驗證
（拓樸子序列合法性、`reviewRange` 涵蓋正確、`conceptId` / `problemIds` 參照存在）。它**不產出正式的全量課表**：
真正涵蓋 150+ Concept 的三份正式課表，需等 F7 Stage 1 把課綱定稿凍結後才生成（§22.5：F7 依賴 F4）。因此本
Feature 以 **stub / 種子 DAG** 開發與測試，證明整條生成 → 驗證鏈路可運作且具備 determinism。

本 Feature 的核心價值：讓「三 Track 課表」從一份**可版本控制、可重跑、可 diff 的確定性產物**而生，且其
**合法性由機器把關而非人肉核對**；分歧只落在【課表 + 題目難度帶 + Challenge 難度 + 涵蓋子集】，教材正文
與 DAG 全程共用一份（`docs/spec.md` §4-5、§9.1）。生成與驗證 MUST 為**單一實作**，供 CI Gate 與未來 F5
Lesson Compiler / F6 每日 pipeline 原樣重用（§4-9、§7.1）。

**對應驗收基準**：`docs/spec.md` §24 **AC5**（三份課表共用教材、難度分歧）與 §22.5 F4 驗收（同輸入 →
byte-identical；課表全數通過 DAG 子序列驗證）；里程碑 **M2** 的課表 determinism 部分。

## Clarifications

### Session 2026-07-23

- Q: Track 涵蓋子集（哪些 Concept 會進該 Track 課表）如何決定？ → A: 以 **Module/Level 準則**（Track 參數宣告涵蓋範圍，如 max Level 或 module allowlist）決定；範圍外 Concept 排除，並自動強制 **prerequisite 閉包**（被涵蓋 Concept 的所有前置亦必被涵蓋）。日後如需同一 Module 內細部取捨，MAY 加 per-Concept override 補丁，不預先攤開全清單。
- Q: 每 Track 的 `problemIds` 與「同 Concept 不同難度」的難度帶分歧如何實現？ → A: 生成器以 **Problem Bank 的 `difficulty` 過濾** Concept 的 `leetcode`，取符合該 Track 難度帶者；Track 專屬加題走 **Overlay `extraProblemIds` 附加**（對齊憲章第 VI 條「難度差異化一律由 Overlay 提供」）。Problem Bank 為難度唯一真相；schedule 層即帶入 Track 分歧，MUST NOT 把難度差異推給 Renderer。
- Q: stub 階段課表長度與 Concept 用盡行為？ → A: 課表長度 = 涵蓋 Concept + 週節奏**自然攤出**的長度，**不強制填充到 180**；~180 是完整課綱（F7）的湧現結果、非填充目標。stub 階段不憑空發明湊數的 practice/review/rest 填充（MUST NOT 憑空發明）。
- Q: Overlay 指向該 Track 未涵蓋的 Concept 時如何處理？ → A: 視為**驗證錯誤，fail loud**（指名 conceptId 與 track），非零 exit、不寫出課表（對齊憲章第 XV 條與 F2/F3 dangling-ref 為 error 級的既有作法）；MUST NOT 忽略後靜默產出。
- Q: Track 參數（涵蓋範圍準則、難度帶、Challenge 難度、節奏微調、targetLevel）存放形態？ → A: 一份 **commit 進版控的設定檔 `curriculum/track-params.json`**，以 **zod 驗證**，作為生成器的一等輸入（對齊 modules.json / problem-bank.json 的資料驅動作風）；生成器維持「純輸入→輸出」。此決策**新增一個 committed 產物**，MUST 回寫 `docs/spec.md` §17 repo 結構（跨 Feature 落地，已於本次 clarify 同步）。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 三份課表由確定性生成器而生，同輸入 byte-identical (Priority: P1)

維護者改動 Curriculum 或 Track 參數後，重跑 `generate-schedule.ts`，一次生成三份 `schedules/{track}.json`；
在輸入完全不變時，重跑的輸出與上次**逐位元組相同**，可放心 review diff 後 commit 定版。

**Why this priority**: determinism 是「生成物 commit 後即凍結」（Constitution 第 13 條、§4-13）與整個
build-time-over-runtime 哲學的地基。若同輸入會產出不同 bytes，diff 失去意義、凍結無從談起，後續所有 Feature
的可重現性都崩解。這是本 Feature 存在的第一理由。

**Independent Test**: 以固定的 stub DAG + 固定 Track 參數連續執行生成器兩次，`diff` 兩批輸出為空；改變任一
輸入（新增一個 Concept）後重跑，diff 非空且僅反映該變動。

**Acceptance Scenarios**:

1. **Given** 固定的 stub DAG 與三組 Track 參數，**When** 連續執行生成器兩次，**Then** 三份課表兩次輸出
   byte-identical（含 JSON 鍵序、縮排、換行）。
2. **Given** 已生成並 commit 的三份課表，**When** 輸入未變更再次執行生成器，**Then** 產物無 diff。
3. **Given** 生成器實作，**When** 檢視其排序 / 選題邏輯，**Then** 不存在未固定 seed 的隨機源或依賴系統時間 /
   檔案系統列舉順序的非決定行為。

---

### User Story 2 - 每份課表都是共用 DAG 的合法拓樸子序列 (Priority: P1)

生成器把共用 DAG 攤平進每個 Track 的課表時，Concept 的出現順序 MUST 尊重 prerequisite——絕不在某 Concept 的
任一前置 Concept 之前引入它；且每個 concept 類 Session 只引入恰好一個新 Concept。

**Why this priority**: 「Deterministic Curriculum、DAG 無前向依賴」是憲章非協商原則（§4-4、§4-5）。課表是把
DAG 攤平成線性序列的產物，若順序違反 prerequisite，使用者會在學會前置觀念前就撞到後繼觀念，課程的循序漸進
承諾直接破功。這與 US1 並列為 P1。

**Independent Test**: 對每份生成的課表，逐一驗證其 concept 出現序是共用 DAG 的合法拓樸子序列（對每個
Concept，其所有已排入的 prerequisite 皆出現在它之前）；故意在參數中構造一個違反案例，生成器 MUST fail loud。

**Acceptance Scenarios**:

1. **Given** 一份 stub DAG 與其拓樸序，**When** 生成任一 Track 課表，**Then** 課表中每個 concept Session 的
   `conceptId` 之所有 prerequisite（且亦被該 Track 涵蓋者）皆出現在更前的 sessionIndex。
2. **Given** 一個 concept 類 Session，**When** 檢視其內容映射，**Then** 恰好引入一個新 Concept（不多不少）。
3. **Given** 生成過程若排出違反 prerequisite 的序，**When** 內建驗證執行，**Then** 以具名違規（指出
   concept 與被違反的 prerequisite）fail loud，非零 exit，且不寫出課表檔。

---

### User Story 3 - 三 Track 共用教材，分歧只在課表/難度/涵蓋子集，Overlay 疊加不取代 (Priority: P1)

三份課表引用同一份 Concept 教材與同一張 DAG；差異只發生在「選哪些 Concept、走多深、題目難度帶、Challenge
難度」。Track 專屬的加料（額外題目、補充註記、Challenge 難度覆寫）透過 `TrackOverlay` 表達，且為**疊加**，
不取代 Core Content。

**Why this priority**: 「Shared Knowledge, Different Tracks」是憲章原則（§4-6）：教材正文 MUST NOT 複製三份。
Overlay 是承載 Track 差異而不污染共用教材的唯一機制；schema 若沒定義好，後續 F5 Compiler 無從疊加，三 Track
分歧也無處落腳。本 Feature 是 Overlay schema 的落地點，故列 P1。

**Independent Test**: 三份課表引用的 `conceptId` 全部指向同一份 Concept 教材（0 份複製）；建構一組
`TrackOverlay`，驗證其 `byConcept` 的 `extraProblemIds` / `extraNotesMarkdown` / `challengeDifficulty` 結構
合法、且語意為「在 Core Content 之上疊加」而非覆寫。

**Acceptance Scenarios**:

1. **Given** 三組 Track 參數與同一份 stub DAG，**When** 生成三份課表，**Then** 三份課表所引用的 Concept 皆
   來自同一教材庫（無任一 Track 產生自有的教材正文副本）。
2. **Given** 同一個 Concept 出現在多個 Track，**When** 比較各 Track 對它搭配的題目 / Challenge 難度，
   **Then** 可依 Track 參數不同而不同（難度帶分歧），但 Concept 本體不變。
3. **Given** 一份 `TrackOverlay`，**When** 以 schema 驗證，**Then** `byConcept` 各欄位型別合法；
   `extraNotesMarkdown` 語意為疊加、`extraProblemIds` 為附加題目、`challengeDifficulty` 為該 Track 覆寫值。

---

### User Story 4 - 週節奏內建 review 與 rest，且 reviewRange 正確涵蓋本週 (Priority: P2)

生成器依週節奏模板攤課：每輪（相對天數，每 7 個 Session）內建 review 與 rest；review Session 的
`reviewRange` MUST 正確涵蓋本週在其之前已上的 sessionIndex 範圍。節奏以相對天數計，MUST NOT 綁日曆星期。

**Why this priority**: Review 與 Rest 是 Learning Philosophy 的內建要求（§13.2）；`reviewRange` 錯誤會讓週複習
指向錯誤的 Session 區間。屬課表品質的重要面向，但在 determinism 與 DAG 合法性（P1）之後，故列 P2。

**Independent Test**: 對每份課表，驗證每 7 個 Session 一輪的節奏含 review 與 rest；每個 review Session 的
`reviewRange` 起訖正確涵蓋本週在其之前已上的 Session（`[weekStartIndex, reviewSessionIndex − 1]`）；節奏判定不引用任何日曆星期資訊。

**Acceptance Scenarios**:

1. **Given** 一份生成的課表，**When** 掃描其 Session 類型序列，**Then** 每輪（相對天數）皆含至少一個 review
   與一個 rest（呼應 §13.2 樣板，Track 可微調）。
2. **Given** 一個 review Session，**When** 檢視其 `reviewRange`，**Then** 該區間正確涵蓋**本週在其之前已上的**
   sessionIndex 範圍（`[weekStartIndex, reviewSessionIndex − 1]`；不重疊他週、不越界）。
3. **Given** 生成器邏輯，**When** 決定某 sessionIndex 的類型，**Then** 僅依相對天數（Session 1 起每 7 一輪）
   計算，MUST NOT 讀取日曆星期。

---

### User Story 5 - 生成器內建參照完整性 Gate，懸空即 fail loud (Priority: P2)

生成器在寫出課表前 MUST 自我驗證：所有 `conceptId` 存在於共用 DAG、所有 `problemIds` 存在於 Problem Bank、
且 Track 涵蓋子集不引入教材庫以外的 Concept；任一懸空參照以具名違規 fail loud，且不產出半成品課表。

**Why this priority**: 「Fail loud, not silent」（§4-15）與「生成器 MUST 內建驗證」（§13.4）。懸空的
`conceptId` / `problemIds` 會讓下游 F5 Compiler 在編譯時才爆、甚至早上六點推播時才爆；能在 build-time 驗的
不留到 runtime。屬把關品質，列 P2。

**Independent Test**: 故意在 Track 參數中引用不存在的 `conceptId` 或不在 Problem Bank 的 `problemIds`，生成器
MUST 以指名成因的違規 fail loud 並以非零 exit 結束、不寫出課表。

**Acceptance Scenarios**:

1. **Given** 一份 Track 參數引用了不存在於 DAG 的 `conceptId`，**When** 執行生成器，**Then** 以具名違規
   （指出該 conceptId）fail loud、非零 exit、不寫出任何課表檔。
2. **Given** 一份課表產生了不存在於 Problem Bank 的 `problemIds`，**When** 內建驗證執行，**Then** 以具名違規
   （指出該題號）fail loud。
3. **Given** Track 涵蓋子集規則，**When** 生成器選課，**Then** MUST NOT 引入教材庫（DAG）以外的 Concept；
   若參數要求如此，fail loud。

---

### Edge Cases

- **`leetcode: []` 的無題目觀念課**：某些 Concept（如 mindset 類）合法宣告無對應題目——此類 concept Session 的
  `problemIds` 為空 MUST 合法，不因「無題」而報錯（沿用 F3 定案：`leetcode: []` 為一等合法狀態）。
- **Track 只涵蓋子集**：Foundation 可不在 ~180 Session 內走完全部進階 Concept——涵蓋子集 MUST 合法，只要不引入
  教材庫以外的 Concept、且被涵蓋 Concept 的 prerequisite 亦被涵蓋（否則拓樸子序列不成立）。
- **stub DAG 短於 ~180**：本 Feature 用種子 DAG，Concept 數遠少於 180——課表 MUST 隨涵蓋 Concept + 節奏
  **自然收尾**（不填充湊數，FR-011 / FR-019），長度較短為預期行為、非錯誤；determinism 測試以此短課表驗證。
- **同輸入跨平台換行**：byte-identical 需固定換行（LF）與檔尾換行策略，避免 Windows / CI 之間 diff 假陽性。
- **Overlay 指涉未被該 Track 涵蓋的 Concept**：Overlay 的 `byConcept` key 指向該 Track 課表未包含的 Concept 時，
  MUST 視為**驗證錯誤並 fail loud**（指名 conceptId 與 track、非零 exit、不寫出課表）；MUST NOT 忽略或靜默產出。
- **reviewRange 落在課表開頭第一週**：第一週尚無「上週」可複習時，review Session 的 `reviewRange` MUST 有明確
  規則（涵蓋本週已上 Session，或該週不排 review），不得產生越界或空區間。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 提供 `scripts/generate-schedule.ts`，一次生成三份 Track 課表
  （`foundation` / `interviewReady` / `interviewMastery`）並輸出為 `schedules/{track}.json` × 3。
- **FR-002**: 生成器輸入 MUST 為【共用 Curriculum DAG（F2）】+【週節奏模板（§13.2）】+【三組 Track 參數
  （涵蓋子集規則、題目難度帶、Challenge 難度、節奏微調）】；MUST NOT 從 LLM 或任何 runtime 來源取得順序。
- **FR-002a**: 三組 Track 參數 MUST 存為一份 commit 進版控的設定檔 **`curriculum/track-params.json`**，並以
  **zod** 驗證其 schema（合法與非法樣本各有測試）；生成器 MUST 純由此檔 + DAG + 節奏模板驅動，維持「純輸入→
  輸出」的確定性。此檔為一等版控輸入（比照 `curriculum/modules.json` / `data/problem-bank.json`），
  MUST NOT 把 Track 參數硬編於生成器程式或併入 `overlays/{track}.json`。
- **FR-003**: 生成 MUST 為 deterministic——同一輸入 → **byte-identical** 輸出（含 JSON 鍵序、縮排、換行、檔尾）；
  MUST NOT 使用未固定 seed 的隨機源、系統時間或非穩定的檔案列舉順序。
- **FR-004**: 每份課表 MUST 為共用 DAG 的**合法拓樸子序列**——任一 Concept 之（被該 Track 涵蓋的）prerequisite
  皆出現在更早的 sessionIndex；無前向依賴。
- **FR-005**: 每個 `concept` 類 Session MUST 只引入**恰好一個**新 Concept（Concept-first、one concept per
  session，§4-1、§4-2）。
- **FR-006**: 生成器 MUST 內建驗證，涵蓋至少：拓樸子序列合法性、`reviewRange` 正確涵蓋本週、所有 `conceptId`
  存在於 DAG、所有 `problemIds` 存在於 Problem Bank（F3 `problemExists`）、涵蓋子集不引入教材庫以外 Concept、
  **Overlay `byConcept` 的每個 key 皆為該 Track 已涵蓋的 Concept**（指向未涵蓋 Concept 者為 error 級違規）；
  任一失敗 MUST fail loud（具名違規 + 非零 exit）且 MUST NOT 寫出半成品課表。
- **FR-007**: 系統 MUST 定義 `TrackSchedule`（`track` / `targetLevel` / `sessions[]`）與 `SessionPlan`
  （`sessionIndex` / `type` / `conceptId?` / `reviewRange?` / `problemIds?`）型別，欄位對齊 §16.2；作為**生成物**，
  其結構正確性 MUST 由生成器內建的 `validateSchedule` 不變式（拓樸子序列、reviewRange、one-concept、dangling、
  duplicate 等）把關，MUST NOT 以 zod re-parse 生成物（generated artifact 不需輸入級 schema 驗證；手改由 CI
  determinism drift gate 偵測）。zod 僅用於**輸入** `track-params.json`（FR-002a）與 `overlays/{track}.json`（FR-008）。
- **FR-008**: 系統 MUST 定義並以 schema（zod）驗證 `TrackOverlay`（`track` / `byConcept: Record<conceptId,
  { extraProblemIds?, extraNotesMarkdown?, challengeDifficulty? }>`），欄位對齊 §16.3。
- **FR-009**: `TrackOverlay` 的語意 MUST 為**疊加**（append / augment），MUST NOT 取代 Core Content；
  `extraNotesMarkdown` 疊加於教材、`extraProblemIds` 附加題目、`byConcept` 的 `challengeDifficulty` 為**該 Concept**
  在此 Track 的 challenge 難度**per-Concept 覆寫值**——**有別於** `track-params.json` 的 per-Track
  `TrackParam.challengeDifficulty`（後者決定 rhythm `challenge` 槽的選題難度，FR-015a）。此 per-Concept 覆寫的
  **實際套用點在 F4 不存在**（rhythm 的 `challenge` 槽非 concept-bound），本 Feature 僅驗其型別/enum；**其套用語意
  與兩個 `challengeDifficulty` 的優先關係由 F5 定案**（比照 `extraNotesMarkdown`）。
- **FR-010**: 三 Track MUST 共用同一份 Concept 教材與同一張 DAG；分歧 MUST 只發生在【課表 + 題目難度帶 +
  Challenge 難度 + 涵蓋子集】。生成器 MUST NOT 產生任一 Track 專屬的教材正文副本。
- **FR-011**: 每份課表 MUST 支援五種 Session 類型（`concept` / `practice` / `review` / `challenge` / `rest`）；
  週節奏 MUST 內建 `review` 與 `rest`。課表長度 MUST 為「涵蓋 Concept + 週節奏」自然攤出的結果，約 **180**
  個 Session 是**完整課綱（F7）的湧現規模、非填充目標**——生成器 MUST NOT 為湊滿固定長度而填充額外 Session。
- **FR-012**: 週節奏 MUST 以**相對天數**計（Session 1 = 該 Track 第一天，每 7 個 Session 一輪），
  MUST NOT 依日曆星期決定 Session 類型。
- **FR-013**: `review` Session 的 `reviewRange` MUST 正確涵蓋**本週在該 `review` Session 之前已上的** sessionIndex
  範圍（即 `[weekStartIndex, reviewSessionIndex − 1]`；不越界、不重疊他週）。第一週的 review 亦因此得到非空區間
  （例：模板 review 落第 4 槽 → `[1, 3]`），不需援引「上週」。
- **FR-014**: Track 課表 MAY 涵蓋教材庫的**子集**，但 MUST NOT 引入不存在於教材庫（DAG）的 Concept；被涵蓋
  Concept 的 prerequisite MUST 亦被該 Track 涵蓋（維持子序列合法）。
- **FR-014a**: 涵蓋子集 MUST 由 Track 參數以 **Module/Level 準則**宣告（如 max Level 或 module allowlist）
  決定：範圍外 Concept 排除，範圍內 Concept 全數納入，並強制 **prerequisite 閉包驗證**——若某被涵蓋 Concept
  的前置落在宣告範圍外，生成器 MUST 以具名違規 `coverage-gap` **fail loud**（非零 exit、不寫出課表），
  MUST NOT 靜默自動納入該前置以擴張宣告範圍（宣告範圍為權威；`maxLevel` 連續切法對閉包恆天然成立，此規則
  實務上只在 `moduleAllowlist` 跳號時觸發）。逐 Concept 的 include/exclude override MAY 作為補丁存在，但
  MUST NOT 作為主要涵蓋機制（避免 150+ Concept 手寫清單）。
- **FR-015**: `challenge` 與題目難度帶 MUST 依 Track 參數分歧（Foundation 降級、InterviewMastery 升級為變體 /
  綜合），且此分歧 MUST 由 Track 參數 / Overlay 驅動，MUST NOT 硬編於 Renderer 或下游。
- **FR-015a**: Session 的 `problemIds` MUST 由生成器以 **Problem Bank 的 `difficulty` 過濾** Concept 的
  `leetcode`（取符合該 Track 難度帶者）產生；Track 專屬加題 MUST 走 **Overlay `extraProblemIds` 附加**
  （憲章第 VI 條）。Problem Bank 為題目難度的唯一真相；difficulty 分歧 MUST 於 schedule 層即帶入，
  MUST NOT 交由 Renderer 判定（憲章第 XI 條）。過濾後 `problemIds` 為空（含 `leetcode: []`）MUST 為一等合法狀態
  ——序列化時省略該欄位，**不以替代題填充、無 fallback 機制**（沿用 F3 `leetcode: []` 定案；課表長度自然收尾見 FR-019）。
- **FR-016**: `schedules/{track}.json` 為生成物，MUST NOT 手寫；調整工作流固定為【改 Curriculum / Track 參數 →
  重跑生成器 → review diff → commit】（生成物 commit 後即凍結，§4-13）。
- **FR-017**: 生成與驗證 MUST 為**單一實作**，供 CI Gate 與未來 F5 / F6 原樣重用（§4-9、§7.1）；MUST NOT 出現
  「生成一套、驗證另一套」的雙軌實作。
- **FR-018**: 本 Feature MUST 以 **stub / 種子 DAG**（沿用 F2 的 stub Concept 與 F3 seed 題庫）開發與測試；
  **不**在本 Feature 產出正式全量三份課表——正式課表於 F7 Stage 1 課綱凍結後生成（§22.5）。
- **FR-019**: 生成器對「涵蓋 Concept 全數排入後課表自然結束」MUST 為決定性且不 crash——課表在最後一個 Concept
  對應的節奏輪次結束處**自然收尾**（長度即該輪次終點），MUST NOT 為湊滿 180 而填充憑空 Session（FR-011）；
  收尾位置 MUST 為輸入的確定性函數並可於 log / 產物觀察。

### Key Entities *(include if feature involves data)*

- **TrackSchedule**：某 Track 的完整課表。屬性：`track`、`targetLevel`（easy / medium / hard，半年目標等級）、
  `sessions[]`（~180 筆 `SessionPlan`；MUST 為共用 DAG 的合法拓樸子序列）。為生成物 `schedules/{track}.json`。
- **SessionPlan**：課表中的一堂課。屬性：`sessionIndex`（1..~180）、`type`（五類之一）、`conceptId?`
  （type=concept）、`reviewRange?`（type=review，本週範圍）、`problemIds?`（practice / challenge）。
- **TrackParams（Track 參數）**：驅動生成器的每 Track 設定。概念屬性：**涵蓋範圍準則（Module/Level：max
  Level 或 module allowlist，FR-014a）**、題目難度帶映射、Challenge 難度、週節奏微調、`targetLevel`。三組
  （Foundation / InterviewReady / InterviewMastery）。存為 commit 的 **`curriculum/track-params.json`**（zod
  驗證，FR-002a）。**具體數值於 `/speckit-clarify` 定案**（見 Assumptions）。
- **TrackOverlay**：承載 Track 專屬加料而不污染共用教材。屬性：`track`、`byConcept`（conceptId →
  `{ extraProblemIds?, extraNotesMarkdown?, challengeDifficulty? }`）；語意為疊加。產物 `overlays/{track}.json`。
- **Curriculum DAG（輸入，F2 交付）**：共用課程圖，提供 Concept、prerequisite / next、拓樸序與參照完整性。
- **Problem Bank（輸入，F3 交付）**：題庫與 `problemExists` 反查，供 `problemIds` 參照存在性驗證。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 以固定輸入連續執行生成器兩次，三份課表輸出 **byte-identical**（diff 為空）；改動任一輸入後 diff
  非空且僅反映該變動。
- **SC-002**: 三份生成課表 **100%** 通過 DAG 拓樸子序列驗證——0 筆前向依賴、0 筆缺前置 Concept。
- **SC-003**: 每份課表中所有 `review` Session 的 `reviewRange` **100%** 正確涵蓋本週在其之前已上的 Session
  （`[weekStartIndex, reviewSessionIndex − 1]`；0 越界 / 0 空區間 / 0 錯週）。
- **SC-004**: 所有課表中的 `conceptId` 存在於 DAG、`problemIds` 存在於 Problem Bank 的比率為 **100%**；任一懸空
  參照可被生成器**指名**並 fail loud。
- **SC-005**: 三 Track 引用同一份 Concept 教材正文（**0** 份複製），且難度帶 / 涵蓋子集 / Challenge 難度依 Track
  可觀察到分歧。
- **SC-006**: 全課表中每個 `concept` 類 Session 皆**恰好**引入一個新 Concept（跨三份課表 0 違反）。
- **SC-007**: 生成器內建的每一類驗證規則（拓樸子序列、reviewRange、dangling conceptId、dangling problemIds、
  涵蓋子集越界、one-concept-per-session）**至少各有一個單元測試**；DAG determinism 亦有 byte-identical 測試。
- **SC-008**: 輸入 schema（`track-params.json` 與 `overlays/{track}.json`＝`TrackOverlay`）對合法與非法樣本各有
  zod 測試，違法樣本被**指名**拒絕；`TrackSchedule` / `SessionPlan` 為生成物，其結構不變式由 `validateSchedule`
  的逐規則測試（SC-007）把關，不另做 zod re-parse。

## Assumptions

- **Track 參數的機制已於 2026-07-23 clarify 定案**（涵蓋 = Module/Level 準則 + prerequisite 閉包；題目難度 =
  Problem Bank 過濾 + Overlay 附加；存放 = `curriculum/track-params.json` + zod）。**仍待定的僅剩「具體數值」**：
  各 Track 的 Level 上限 / module allowlist、難度帶對應的 Problem Bank difficulty 集合、節奏微調表、`targetLevel`
  ——這些數值於**撰寫 `curriculum/track-params.json`（本 Feature 以 stub 規模示例）**時填入，正式全量值待 F7 課綱
  凍結後定版。本 spec 先採 §9 / §13.2 的敘述性描述為合理預設。
- **週節奏預設採 §13.2 建議樣板**（Mon concept / Tue concept / Wed practice / Thu review / Fri challenge /
  Sat concept / Sun rest 的相對天數版），Track 可微調；rest 與 review 為內建、不可移除。
- **stub / 種子 DAG 沿用 F2 的 stub Concept 與 F3 的 seed 題庫**：本 Feature 只驗證生成 → 驗證鏈路可運作與
  determinism，課表隨涵蓋 Concept 自然收尾（遠短於 180，非錯誤，FR-011 / FR-019）。正式 ~180 全量課表於 F7 後生成。
- **輸入 DAG 由 F2 的 `loadCurriculum` / `buildGraph` 提供**（含 `ordinalOf` 全序與 canonical `topoOrder`）；
  `problemIds` 存在性用 F3 Problem Bank 的 `problemExists` 介面。
- **JSON 輸出格式沿用 F2 / F3 既定慣例**（穩定鍵序、固定縮排、LF 換行、檔尾換行策略）以確保 byte-identical 與
  可讀 diff。
- **`overlays/{track}.json` 於本 Feature 建立 schema 與（stub 規模的）示例**；其內容正文的全量填充由後續內容
  產線 / Feature 負責，本 Feature 只釘死契約與疊加語意。
- **執行環境**：Node.js 24、strict TypeScript、npm、vitest；生成器為 build-time script（`scripts/`），
  每日 runtime 不執行（§4-8）。

## Out of Scope

- **正式全量三份課表**（涵蓋 150+ Concept）：於 F7 Stage 1 課綱定稿凍結後生成（§22.5，F7 依賴 F4）。
- **Lesson Compiler / Renderer**（§16.4、§14）：F5 消費本 Feature 的課表與 Overlay 組 `Lesson`；本 Feature 不
  產生 `Lesson`、不做 Discord 渲染。
- **每日 pipeline / 多 Track 推播 / 狀態推進 / per-track guard**（§18、§19、§9.2）：屬 F6。
- **Overlay 內容正文的全量填充**（`extraNotesMarkdown` 的實際教學文字、每 Concept 的完整加料）：屬內容產線。
- **動態調整 / 重排 / LLM 生成學習順序**：憲章明令 LLM MUST NOT 生成或重排學習順序（§4-4、§4-5）；本 Feature
  的順序完全來自共用 DAG 的確定性攤平。
- **`ci.yml` / `content-gate.yml` 的 Gate 接線細節**：本 Feature 交付可被 Gate 呼叫的生成 / 驗證能力；把它接進
  完整 CI Gate 的全 Track × 全 Session 編譯屬 F5（§21.3）。

## Dependencies

- **F2（`002-curriculum-schema`）**：共用 Curriculum DAG 與驗證機器（`loadCurriculum` / `buildGraph` /
  `ordinalOf` 全序 / canonical `topoOrder` / `Violation` 結構）——生成器的順序來源與拓樸子序列判定基礎。
- **F3（`003-problem-bank`）**：Problem Bank 與 `problemExists` 反查——`problemIds` 參照存在性驗證。
- **`docs/spec.md`**：§9（Track System / 模型 B）、§13（Session Scheduling，含 §13.4 課表生成）、§16.2
  （TrackSchedule / SessionPlan）、§16.3（TrackOverlay）、§24 AC5。
- **`.specify/memory/constitution.md`**：第 4 條（Deterministic Curriculum）、第 5 條（Curriculum as DAG）、
  第 6 條（Shared Knowledge, Different Tracks）、第 13 條（生成物 commit 後即凍結 / byte-identical）等非協商原則。
