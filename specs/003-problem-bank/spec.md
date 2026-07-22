# Feature Specification: Problem Bank（題庫 schema／資料、Concept ↔ Problem 逆向對應、slug 一致性）

**Feature Branch**: `003-problem-bank`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "feature 003-problem-bank"

## 背景與目的

本 Feature 是 LeetCode Daily Coach 的第三個切片（對應 `docs/spec.md` §22.5 F3、§23 Phase 1、里程碑 M1 的
另一半），依賴 F2（`002-curriculum-schema`）已交付的 Curriculum 圖與驗證機器。

F2 建立了「課程順序是一張合法 DAG」的資料契約與驗證能力，但**刻意把 `leetcode` 題號的存在性驗證延後**：
它以可插拔的 `problemExists` 介面預留了這個關卡，並在無 Problem Bank 時把該檢查列入 `skipped`
（`deferred-to-F3`）。本 Feature 補上這塊拼圖：**題目 metadata 的資料契約（Problem Bank）、由 Concept 查得
對應題目與由題目反查 Pattern 的雙向查找、以及一組把題庫釘死為「無死鏈、無懸空參照、題數合法」的機器化 Gate**。

它交付的是**題目事實的唯一來源與其驗證/查找能力**，不是完整題庫本身——真正涵蓋 150+ Concept 的全量題庫
需等 F7 的內容產線（Stage 1）把課綱與每個 Concept 的 `leetcode` 題號定稿凍結後方能補齊
（`docs/spec.md` §22.5：F7 依賴 F3）。本 Feature 只用**極少量的 seed 題目**（恰好涵蓋 F2 stub Concept 所
引用的題號，並示範三 Track 難度帶）驅動並驗證整條查找與 Gate 可運作。

本 Feature 的核心價值：讓「題號 / 連結 / 難度是可信事實、Concept 與 Problem 的對應關係完整且雙向可查」
這件事**不再靠人肉核對**，而由一套可重複執行、指名成因的驗證機器保證；且這套查找 / 驗證 MUST 為
**單一實作**，供 CI Gate 與未來 F5 Lesson Compiler 原樣重用（`docs/spec.md` §4-9、§7.1、§12.1）。

**對應驗收基準**：`docs/spec.md` §24 **AC1** 剩餘部分（所有 `leetcode` 參照存在於 Problem Bank）＋ §22.5 F3
驗收（由 Concept 可查得對應題目、由題目可反查 Pattern；參照與 slug 檢查通過）。

## Clarifications

### Session 2026-07-22

- Q: 1~3 題數守門該如何對待合法宣告 `leetcode: []` 的「無題目觀念課」（如 mindset 的 `time-space-complexity` / `reading-the-problem`）？ → A: `leetcode: []` 為一等合法狀態——前向查找回傳空清單、不報錯；1~3 題數守門只對「宣告 ≥1 題」的 concept 生效（仍守 查無對應 / 題號不存在於題庫 / >3）。同步修訂 FR-007 / FR-008 / SC-001 與 `docs/spec.md` §12.1。
- Q: 被 stub concept 引用的 seed 題號 {1,26,27,283,303,560} 全為 Easy/Medium、無任何 Hard，但 FR-011/SC-006 要求含 Hard 以示範三 Track 難度帶。如何滿足？ → A: F3 seed 階段只示範 Easy/Medium；完整 Hard 覆蓋延到 F7 課綱凍結後補齊（seed 不硬塞不被引用的 Hard 題）。修訂 FR-011 / SC-006 措辭。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 任一題目的 metadata 能被確定性驗證 (Priority: P1)

題庫維護者（或下游 Feature、內容產線）提供一份 Problem Bank，系統能明確判定每一筆題目**合規或不合規**：
合規則接受，不合規則**指名是哪一個題號、哪一個欄位、違反了什麼規則**，而不是靜默帶過或以預設值填補。

**Why this priority**: Problem metadata schema 是 Concept ↔ Problem 對應、slug 一致性、題數合法性等一切
後續檢查的地基。沒有它，下游對題目欄位各自假設，事實資料漂移。故列為 P1。

**Independent Test**: 只實作這一個 Story，即可獨立驗收——給一批合法與各類非法的題庫 fixture（缺必填欄位、
`difficulty` 非法值、型別錯誤、key 與 `id` 不符），確認驗證器逐一正確接受 / 拒絕，且每個拒絕都明確指出
違規的題號與欄位。

**Acceptance Scenarios**:

1. **Given** 一筆同時具備 `id` / `slug` / `title` / `url` / `difficulty` / `patterns` 的合法題目，**When** 驗證題庫，**Then** 該題通過、不產生任何 violation。
2. **Given** 一筆缺少 `patterns`（或其他必填欄位）的題目，**When** 驗證，**Then** 產生 `error` 級 violation，指名該題號與缺失欄位。
3. **Given** `difficulty` 值為 `"easy"`（小寫，非 `Easy | Medium | Hard`）的題目，**When** 驗證，**Then** 產生 `error` 級 violation 指名 `difficulty` 值域錯誤。
4. **Given** 題庫某 key（如 `"27"`）與其條目 `id`（如 `26`）不一致，**When** 驗證，**Then** 產生 `error` 級 violation 指名 key 與 `id` 不符。

---

### User Story 2 - 由 Concept 查得對應題目，且題數合法性被守門 (Priority: P1)

Lesson 編譯者（F5）或 CI Gate 給定一個 Concept，系統能把該 Concept 宣告的 `leetcode` 題號解析成完整的
題目 metadata 清單；當**有題 Concept**（宣告 ≥1 題）的對應關係不合法（題號不存在於題庫、宣告超過 3 題）時，
**在查找階段 fail loud**、訊息指名成因，MUST NOT 靜默截斷題數或略過缺漏題目。合法宣告 `leetcode: []` 的
**無題目觀念課**（如 mindset 的複雜度分析、讀題）為一等合法狀態，查找回傳空清單、不報錯。

**Why this priority**: 這是 `docs/spec.md` §12.1 釘死的「題數合法性唯一權威守門點」，也是 F2 延後的
`problemExists` 落地處。沒有它，早上六點的推播可能拿到 0 題或壞題號。與 US1 並列 P1。

**Independent Test**: 給定 F2 的 stub Concept 與 seed 題庫，確認每個**有題** Concept 都能解析出 1~3 題完整
metadata、每個 `leetcode: []` Concept 回傳空清單；再分別注入「題號不在題庫」「題數 4」的情境，確認皆拋出
可辨識、指名成因的錯誤。

**Acceptance Scenarios**:

1. **Given** 一個 `leetcode: [1, 26]` 的 Concept 與涵蓋這兩題的題庫，**When** 查找該 Concept 的題目，**Then** 回傳兩筆完整題目 metadata，順序與宣告一致。
2. **Given** 一個 `leetcode` 含題庫不存在題號的 Concept，**When** 查找，**Then** fail loud，錯誤訊息指名該 Concept 與缺漏的題號。
3. **Given** 一個宣告 `leetcode` 超過 3 題的 Concept，**When** 查找，**Then** fail loud，訊息指名題數違反 1~3。
4. **Given** 一個合法宣告 `leetcode: []` 的「無題目觀念課」（如 `time-space-complexity`），**When** 查找該 Concept 的題目，**Then** 回傳空清單、不報錯（1~3 守門不對其生效）。
5. **Given** 落實真實題庫存在性後重跑 F2 的 curriculum 驗證，**When** 驗證既有 stub Concept，**Then** `leetcode` 存在性檢查由 `skipped` 轉為實際執行且全數通過。

---

### User Story 3 - 由題目反查 Pattern，且 patterns 參照完整 (Priority: P2)

系統能由任一題目反查其對應的 Pattern（Curriculum 的 Topic / Concept），並保證題庫中每一筆題目的
`patterns` 皆指向**存在的** Curriculum 節點（無懸空參照）。

**Why this priority**: 「由題目可反查 Pattern」是 F3 驗收明列項（§22.5 F3），也是未來 Overlay
`extraProblemIds`、選題擴充與知識圖譜視覺化的索引基礎。屬重要但非阻斷每日推播的關鍵路徑，列 P2。

**Independent Test**: 給定 seed 題庫與 F2 Curriculum 圖，確認給一個 Topic / Concept id 能列出所有標記該
pattern 的題目；再注入一筆 `patterns` 指向不存在 id 的題目，確認產生指名的懸空參照 violation。

**Acceptance Scenarios**:

1. **Given** 題庫中若干題標記 `patterns: ["array"]`，**When** 以 `array` 反查，**Then** 回傳全部標記該 pattern 的題目（確定性順序）。
2. **Given** 一筆 `patterns` 含 Curriculum 不存在之 id 的題目，**When** 驗證題庫，**Then** 產生 `error` 級懸空參照 violation，指名該題號與無效的 pattern id。

---

### User Story 4 - url 與 slug 一致，題庫無死鏈 (Priority: P2)

系統能保證題庫中每一筆題目的 `url` 所含 slug 與其 `slug` 欄位一致，避免因手誤造成死鏈。

**Why this priority**: slug 不一致會讓推播出去的 LeetCode 連結指向錯誤或不存在的題目——這是使用者可見的
品質瑕疵。屬重要品質 Gate，列 P2。

**Independent Test**: 給定 seed 題庫，確認一致者通過；注入一筆 `url` 與 `slug` 不符的題目，確認產生指名的
slug 不一致 violation。

**Acceptance Scenarios**:

1. **Given** 一筆 `slug: "two-sum"` 且 `url` 為 `https://leetcode.com/problems/two-sum/` 的題目，**When** 驗證，**Then** 通過。
2. **Given** 一筆 `slug` 與 `url` 內 slug 不符的題目，**When** 驗證，**Then** 產生 `error` 級 violation，指名該題號與不一致的兩值。

---

### Edge Cases

- **題庫檔缺失 / 非合法 JSON**：MUST 報 `error`（指名檔案與成因），而非靜默視為空題庫。
- **題庫為空（`{}`）**：載入本身合法（無 schema violation）；但當任一**有題** Concept 需查找題目時，US2 的存在性 / 題數守門會 fail loud。
- **Concept 合法宣告 `leetcode: []`（無題目觀念課）**：合法；前向查找回傳空清單、不報錯，1~3 題數守門不對其生效（如 mindset 的 `time-space-complexity` / `reading-the-problem`）。
- **`url` 非 LeetCode 網域或不含 `/problems/{slug}/` 結構**：視為 slug 一致性檢查失敗（無法從 url 擷取 slug）。
- **同一題號重複出現**：以物件 key 為唯一鍵，天然去重；但若兩處欄位不一致無從察覺——key 與 `id` 一致性檢查（US1）即為此把關。
- **`patterns` 為空陣列**：違反「至少對應一個 pattern」→ `error`。
- **同一題被多個 Concept 引用**：合法；一題可服務多個 Concept / pattern。
- **選配欄位（`keywords` / `review_priority` / `estimated_minutes` / `lists` / `companies`）缺省**：合法；提供時才驗證其型別與值域（如 `review_priority ∈ {high, medium, low}`）。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 對每一筆題目驗證必填欄位齊備：`id`（number）、`slug`（非空字串）、`title`（非空字串）、`url`（非空字串）、`difficulty`、`patterns`（非空字串陣列）。缺任一項 MUST 產生指名該題號與欄位的 `error` 級 violation。
- **FR-002**: `difficulty` MUST 恰為 `Easy | Medium | Hard` 其一；`review_priority`（若提供）MUST 恰為 `high | medium | low` 其一。違反 MUST 產生指名值域錯誤的 violation。
- **FR-003**: 題庫以 **LeetCode 題號字串**為 key（§26.1）；每筆條目的 key MUST 等於其 `id` 的字串形式。不一致 MUST 產生指名的 violation。
- **FR-004**: 題庫 schema MUST NOT 含任何題目敘述 / 內容欄位（§5）；只保存題號 / slug / 標題 / 連結 / 難度 / patterns 等**參照性 metadata**。題目事實 MUST 以題庫為唯一來源，MUST NOT 由 LLM 生成或於 runtime 抓取。
- **FR-005**: 系統 MUST 檢查每一筆題目的 `url` 所含 slug 與其 `slug` 欄位一致（`url` 具 `…/problems/{slug}/` 結構且 `{slug}` == `slug`）；不一致或無法從 `url` 擷取 slug MUST 產生指名的 `error` 級 violation（避免死鏈）。
- **FR-006**: 系統 MUST 檢查每一筆題目的 `patterns` 皆指向**存在的** Curriculum Topic id 或 Concept id（§26.2）；懸空參照 MUST 產生指名該題號與無效 pattern id 的 `error` 級 violation。此檢查需 Curriculum 圖，MUST 以可插拔方式接受 F2 產出的圖（單一真實來源）。
- **FR-007**: 系統 MUST 提供**由 Concept 前向查得對應題目**的能力：給定一個 Concept 的 `leetcode` 題號序列，回傳對應的完整題目 metadata 清單，**順序與宣告一致**。當 Concept 合法宣告 `leetcode: []`（無題目觀念課）時，MUST 回傳空清單且 MUST NOT 報錯。
- **FR-008**: 前向查找 MUST 在**查找階段**強制題數合法性（§12.1 唯一權威守門點）：對**宣告 ≥1 題**的 Concept，其對應題數 MUST 為 1~3；對應題號不存在於題庫、或宣告超過 3 題，一律 MUST 拋出**可辨識且訊息指名成因**的錯誤（fail loud），MUST NOT 靜默截斷或略過缺漏題目。合法宣告 `leetcode: []` 的 Concept **不**觸發此守門（見 FR-007），此為「無題目觀念課」的一等合法狀態，MUST NOT 因題數 0 而報錯。
- **FR-009**: 系統 MUST 落實 F2 預留的 `leetcode` 題號存在性檢查（把 F2 的可插拔 `problemExists` 由 `deferred-to-F3` 的 stub 換成以真實題庫為背景的實作），使 Curriculum 驗證的 `leetcode` 參照檢查由 `skipped` 轉為實際執行。
- **FR-010**: 系統 MUST 提供**由題目反查 Pattern**的能力：給定一個 Topic / Concept id，回傳所有 `patterns` 標記該 id 的題目（**確定性順序**）。
- **FR-011**: F3 seed 題庫 MUST 至少涵蓋 `Easy` 與 `Medium` 兩種難度（由既有被引用題號 {1,26,27,283,303,560} 自然滿足）；`Hard` 覆蓋**延到 F7** 課綱凍結後補齊，seed 階段 MUST NOT 為湊 Hard 而硬塞不被任何 Concept 引用的題目。驗證 MAY 回報難度覆蓋缺口。**完整三難度帶覆蓋（含 Hard）**於 F7 補齊（§12.1 全量交付目標不變）。
- **FR-012**: 題庫載入 + 全部驗證 + 查找 MUST 為**零 LLM、零網路、確定性**：MUST NOT 於任何階段即時連線 LeetCode；`src/` 中的實作 MUST NOT import LLM SDK（`@google/genai`）；同輸入 → 同輸出。
- **FR-013**: 所有驗證失敗 MUST **fail loud 且指名**：每筆 violation 指出違規的題號 / Concept id、欄位或規則、與人可讀的成因；violation 結果 MUST 為結構化資料，供 CI Gate 與 Lesson Compiler 共用，MUST NOT 只印字串或靜默吞掉。
- **FR-014**: 題庫的載入 / 查找 / 驗證 MUST 為**單一實作**，供 CI Gate 與未來 F5 runtime 共用（§4-9 / §7.1）；MUST NOT 出現「Gate 一套解析、runtime 另一套」的雙軌。純函式邏輯 MUST 無副作用（無 `process.exit` / 無 I/O），可被 runtime / Gate 安全 import；`process.exit` 等副作用只留在驗證入口。
- **FR-015**: 系統 MUST 提供一個 CI 可呼叫的**驗證入口**（比照 F2 的 `validate:curriculum`），讀題庫 + Curriculum 圖 → 執行 US1/US3/US4 全部 Gate → 人可讀輸出 → 有 `error` 時以非零 exit code 結束；並納入既有 `ci.yml` 工程 Gate。

### Key Entities *(include if feature involves data)*

- **Problem**：一題 LeetCode 題目的**參照性 metadata**。必要屬性：`id`（題號）、`slug`、`title`、`url`、`difficulty`（Easy/Medium/Hard）、`patterns`（對應 Curriculum Topic/Concept 的 pattern key 陣列）。選配屬性：`keywords`、`review_priority`（high/medium/low）、`estimated_minutes`、`lists`（經典題單標籤）、`companies`。**不含**題目敘述內容。
- **Problem Bank**：以題號字串為 key 的 Problem 集合，版本控制於 `data/problem-bank.json`，為題目事實的**唯一來源**。
- **Concept → Problem 前向對應**：權威來源為 Concept 的 `leetcode[]`（§16.1）；每個 Concept 對應 1~3 題。
- **Problem → Pattern 逆向索引**：由 Problem 的 `patterns[]` 指向 Curriculum 的 Topic / Concept id，供反查與擴充選題。
- **Violation**（沿用 F2 概念）：一筆具名違規（rule / severity / subject / field? / target? / message），fail loud 的載體。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 由任一 Concept 皆可查得其宣告題號的對應題目：交付集合中 100% **有題** stub Concept 都能解析出 1~3 題完整 metadata 且無缺漏；100% 合法宣告 `leetcode: []` 的 Concept 回傳空清單且不報錯。
- **SC-002**: 由任一題目皆可反查其 Pattern：題庫中 100% 題目的 `patterns` 皆指向存在的 Curriculum 節點（0 懸空參照）。
- **SC-003**: 題庫中任一題的 `url` 與 `slug` 一致（0 死鏈不一致）。
- **SC-004**: 每一種違規類型（缺必填欄位、型別錯、`difficulty` 值域錯、key 與 `id` 不符、有題 Concept 題數 >3、題號不存在、slug 不符、懸空 pattern）皆有明確指名成因的錯誤，且皆有單元測試覆蓋；`leetcode: []` 的合法空題查找亦有回傳空清單不報錯的測試。
- **SC-005**: F2 的 Curriculum 驗證改用真實題庫存在性檢查後，既有 stub Concept 的 `leetcode` 參照 100% 通過，且該檢查不再列為 `skipped`。
- **SC-006**: F3 seed 題庫至少各存在一題 `Easy` 與 `Medium`（示範難度帶差異）；`Hard` 覆蓋延到 F7 補齊（seed 階段不硬塞未被引用的 Hard 題）。
- **SC-007**: 題庫載入 + 驗證 + 查找為零 LLM、零網路、確定性：重複執行任意次，輸出（違規清單、查找結果）逐次一致。

## Assumptions

- **交付邊界沿用 F2 模式**：F3 交付 schema、載入 / 查找 / 逆向索引模組、與各項 Gate，並附一份 **seed `data/problem-bank.json`**，恰好涵蓋 F2 stub Concept（`concepts/**`）所引用的題號 {`1, 26, 27, 283, 303, 560`}——此集合自然示範 `Easy` 與 `Medium` 兩難度帶；`Hard` 覆蓋與**完整題庫**一併待 F7 課綱凍結、全部 Concept 的 `leetcode` 題號定稿後補齊（與 §22.5 F7 依賴 F3 一致），seed 階段不硬塞未被引用的 Hard 題。mindset 兩個 concept（`time-space-complexity` / `reading-the-problem`）合法宣告 `leetcode: []`，seed 題庫不為其新增題目。
- **patterns 可指向 Topic id 或 Concept id**（§26.2「對應到某條 Topic / Concept id」）；逆向查找對兩者皆支援。
- **Problem Bank 為人工維護 / 半自動整理的版本控制資料**（非 LLM runtime 生成）；F3 只負責 schema / 驗證 / 查找，**不建生成器**（若日後需批次整理題庫，屬另議）。
- **Concept → Problem 的權威來源是 `Concept.leetcode[]`**（§16.1）；`Problem.patterns` 為額外的逆向索引，供反查與未來 Overlay `extraProblemIds` / 選題擴充（F4/F5 消費）。
- **url slug 擷取規則**：以 `https://leetcode.com/problems/{slug}/` 結構為準擷取 `{slug}` 與 `slug` 欄位比對。
- 需要 F2 產出的 Curriculum 圖（Topic / Concept id 集合）以執行 FR-006 / FR-009；F3 以可插拔方式接受該圖，不重建課程結構。

## Out of Scope

- **把題目放進 Lesson**、`whyThisPattern` / `hint` 文案、Overlay `extraProblemIds` 的**套用**（屬 F4 / F5 / F7）。
- **完整 150+ Concept 的全量題庫**（待 F7 課綱凍結後）。
- 課表生成、難度帶到 `targetLevel` 的精確映射規則（F4）。
- 從 LeetCode **即時抓取**任何資料（題庫一律預先版本控制）。
- Problem Bank 的**生成器 / 批次整理工具**（本 Feature 只驗證與查找既有資料）。

## Dependencies

- **F2（`002-curriculum-schema`）**：提供 Curriculum 圖（Topic / Concept id 集合與 `Concept.leetcode` 來源），為 FR-006（patterns 參照完整）與 FR-009（`problemExists` 落地）所必需；F3 將 F2 預留的可插拔存在性檢查換成以真實題庫為背景的實作。
- **`docs/spec.md` §12（Problem Bank）、§16（資料契約）、§26（Conventions）**：唯一需求來源。
- **憲章相關原則**：Fail loud not silent、Zero-LLM Daily Runtime、Build-time over Runtime 單一 Compiler、不轉載 LeetCode 題目內容。
