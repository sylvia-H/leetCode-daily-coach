# Feature Specification: Curriculum Schema（Curriculum 骨架、Concept frontmatter schema、DAG 建置與驗證）

**Feature Branch**: `002-curriculum-schema`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "feature 002-curriculum-schema"

## 背景與目的

本 Feature 是 LeetCode Daily Coach 的第二個切片（對應 `docs/spec.md` §22.5 F2、§23 Phase 1、里程碑 M1 的
一半），依賴 F1（`001-walking-skeleton`）已打穿的鏈路。

F1 用「一篇手寫教材 + 硬編課表 + 硬編學習路徑對照表」把鏈路打通，但**刻意不建立任何正式的資料契約**。
本 Feature 補上這層契約的第一塊基石：**課程的結構骨架、Concept metadata 的 schema、以及把整份課程建成
一張有向無環圖（DAG）並機器化驗證其完整性**。

它交付的是**確定性的資料契約與驗證能力**，不是內容本身——真正的 150+ Concept 清單由 F7 的內容產線
（Stage 1）批次起草、經課綱大綱定稿後凍結（`docs/spec.md` §20.3）。本 Feature 只用**極少量的 stub
Concept**（涵蓋 Level 0 + Level 1）驅動並驗證整條驗證鏈可運作。

本 Feature 的核心價值：讓「課程順序是一張合法 DAG（無環、無前向依賴、參照完整）」這件事**不再靠人肉檢查**，
而是由一套可重複執行的驗證機器保證；且這套驗證機器 MUST 能被 F7 Stage 1 的結構 Gate 原樣重用，
避免「產線一套驗證、其他地方另一套」的雙軌實作（`docs/spec.md` §4-9、§7.1）。

**對應驗收基準**：`docs/spec.md` §24 **AC1**（DAG 驗證通過：無環、無前向依賴、所有 `prerequisite` /
`next` / `leetcode` 參照存在）——其中 `leetcode` 題號存在性驗證需 Problem Bank（F3）方能落地，本 Feature
以可插拔的方式預留該關卡（見 FR-023、Out of Scope）。

## Clarifications

### Session 2026-07-21

- Q: `curriculum/modules.json` 要定稿到什麼範圍？ → A: 完整 16-Level 骨架——`docs/spec.md` §8.2 全部 Level 的 Module/Topic 順序一次定稿；Concept 清單仍留 F7（Deterministic Curriculum：地圖一次定版）。
- Q: §8.2 的 Level 清單（Array、Two Pointer…）在 `Module → Topic → Concept` 中對應哪一層？ → A: **Level = Module**；每個 Module 下再切 1~N 個 Topic，Concept 掛 Topic（符合 §8.1 的數量分層）。`docs/spec.md` §10.1 範例 `module: array / topic: two-pointer` 視為筆誤，須回寫修正。
- Q: 「無前向依賴」驗證的「順序」以什麼為確定性基準？ → A: **宣告序**——以 modules.json 的 Module/Topic 宣告順序 + Topic 內 NNN 局部序號構成的全序為準；前向依賴 = `prerequisite` 指向此全序中晚於自己者（使「無前向依賴」獨立於「無環」而有意義）。
- Q: F2 是否交付「由 DAG 推導 prev/current/next」的能力並移除 F1 硬編 `getPathLabels`？ → A: 否——F2 **只建 DAG + 驗證**，不做 path 推導、不移除 `getPathLabels`；接入與移除留待 F5（Lesson Compiler 消費 DAG）。F1 交棒表「→ F2」須回寫修正為「F2 建能力、F5 接入移除」。

### Session 2026-07-21（`/speckit-analyze` 後補定案）

- Q: Topic 的命名與切分慣例為何？ → A: **每個 Module 的第一個（主）Topic id 沿用 Module id**，需細分時再增列額外 Topic（與 `docs/spec.md` §8.4 `concepts/two-pointer/`、§10.1 `module: two-pointer / topic: two-pointer` 的既有慣例一致）。`contracts/concept-frontmatter-schema.md` 原範例 `topic: converging-pointers` 與此不符，已修正。
- Q: 孤兒判定免除的「合法起點」精確定義？ → A: **Level 0（`moduleIndex == 0`）Module 內、每個 Topic 的首個 Concept**（該 Topic 內檔名 `NNN` 最小者）免除；其餘一律適用孤兒規則。此為跨 Feature 約束（F7 產出的 Concept 須滿足），**已回寫 `docs/spec.md` §8.3**。
- Q: 顆粒度範圍的端點是否合法？ → A: **閉區間**——恰好等於上限或下限皆為合法（見 FR-019）。
- Q: Concept 集合為空時如何處置？ → A: 報 **`error`** 級 `empty-curriculum`，**`stub` / `full` 兩模式皆強制**（見 FR-010a）；不因 stub 模式豁免下限而被連帶放行。

### Session 2026-07-22（第二輪 `/speckit-analyze` 後定案）

- Q: 參照完整檢查（`module` / `topic` / `topic` == 資料夾名）由 `loadCurriculum` 還是 `validateCurriculum` 負責？ → A: **全歸 `validateCurriculum`**——`loadCurriculum` 只負責讀檔 + schema 解析並產出 schema 類 violation；**全部**參照完整性統一在 `validateCurriculum` 的圖層檢查（見 FR-013）。避免兩處各實作一份而違反 FR-022 / FR-024 單一實作。
- Q: `docs/spec.md` §8.1 的顆粒度數量範圍是 SHOULD，但本 Feature 判為 `error`，何者為準？ → A: **§8.1 升為 MUST**，`granularity-range` 維持 `error` 級。**已回寫 `docs/spec.md` §8.1**（2026-07-22）；與憲章 III「Curriculum MUST 維持細顆粒度」一致，憲章本身無數值門檻故無需修訂。
- Q: 骨架結構錯誤（`modules` 長度非 16、module 缺 topics）該用哪個違規類別？ → A: **新增獨立 rule `skeleton-shape`**（`error`、**不受 `mode` 影響**），與依 `mode` 的 `granularity-range`（純 Concept 數量語意）分離（見 FR-001c）。
- Q: F2 是否建立跑 `npm test` 的 CI workflow？ → A: **是**——新增 `.github/workflows/ci.yml`（`npm ci` → build → test → `validate:curriculum`），使 FR-028 的「供 CI 呼叫」真正落地（既有 `daily.yml` 只跑 `npm run build`，測試從未在 CI 執行）。此為工程鷹架，非 F5 的內容 Gate（後者仍屬 F5）。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 任一 Concept 的 metadata 能被確定性驗證 (Priority: P1)

課程維護者（或下游 Feature、內容產線）提供一個 Concept 的 metadata（frontmatter），系統能明確判定它
**合規或不合規**：合規則接受，不合規則指名是哪一個 Concept、哪一個欄位、違反了什麼規則，
而**不是靜默帶過或以預設值填補**。

**Why this priority**: Concept metadata schema 是 F3（題庫逆向對應）、F4（課表生成）、F5（Lesson Compiler）、
F7（內容產線 Stage 1 起草）全部依賴的資料契約。沒有它，後續 Feature 各自對 metadata 做假設，契約漂移。
它是本 Feature 一切驗證的地基，故列為 P1。

**Independent Test**: 只實作這一個 Story，即可獨立驗收——給一批合法與各類非法的 frontmatter fixture，
確認驗證器逐一正確接受 / 拒絕，且每個拒絕都明確指出違規的 Concept 與欄位。

**Acceptance Scenarios**:

1. **Given** 一個涵蓋 `docs/spec.md` §10.1 全部欄位且值皆合法的 Concept metadata，**When** 執行 schema 驗證，
   **Then** 驗證通過，且解析出的結構包含全部欄位、型別正確。
2. **Given** 一個缺少必要欄位（如缺 `id` 或 `pattern_label`）的 Concept metadata，**When** 執行驗證，
   **Then** 驗證失敗，錯誤訊息指名該 Concept 與缺少的欄位，MUST NOT 以空值或預設值靜默通過。
3. **Given** 一個欄位型別 / 值域錯誤的 Concept metadata（如 `difficulty: hard`、`estimated_minutes: "十分鐘"`），
   **When** 執行驗證，**Then** 驗證失敗並指名違規欄位與期望的型別 / 值域。
4. **Given** 一個 `id` 非 kebab-case slug 的 Concept metadata，**When** 執行驗證，**Then** 驗證失敗並指出
   `id` 命名不符規範。

---

### User Story 2 - 整份 Curriculum 能被建成一張合法的 DAG (Priority: P1)

系統讀取課程骨架與全部 Concept，建出一張 in-memory 的依賴圖，並機器化驗證這張圖是一張**合法的 DAG**：
可拓樸排序、無環、無前向依賴、`prerequisite` / `next` 參照皆存在、除起點外無孤兒。任一項不成立時明確報錯。

**Why this priority**: 這是本 Feature 對應里程碑的核心交付（§24 AC1），也是「Deterministic Curriculum、
Curriculum as DAG」兩條非協商原則（`docs/spec.md` §4-4、§4-5；憲章 IV、V）能被機器保證的唯一手段。
沒有它，課程順序的合法性只能靠人肉檢查，違反確定性原則。

**Independent Test**: 給一份合法的 stub 課程 → 驗證通過並能輸出一個確定的拓樸順序；分別注入「環」、
「前向依賴」、「懸空 `prerequisite` 參照」、「懸空 `next` 參照」、「孤兒 Concept」→ 每一類各自明確報錯。

**Acceptance Scenarios**:

1. **Given** 一份無環、無前向依賴、參照完整的合法 stub 課程，**When** 建置並驗證 DAG，**Then** 驗證通過，
   且可產出一個確定性的拓樸排序。
2. **Given** Concept A 的 `prerequisite` 含 B、B 的 `prerequisite` 直接或間接含 A（成環），**When** 驗證 DAG，
   **Then** 驗證失敗並指出構成環的 Concept。
3. **Given** 某 Concept 的 `prerequisite` 指向課程順序上**晚於自己**的 Concept（前向依賴），**When** 驗證 DAG，
   **Then** 驗證失敗並指出該前向依賴的來源與目標。
4. **Given** 某 Concept 的 `prerequisite` 或 `next` 指向一個**不存在於 Concept 集合**的 id，**When** 驗證 DAG，
   **Then** 驗證失敗並指名該懸空參照。
5. **Given** 某個非起點 Concept 既未被任何 Concept 的 `next` 提及、也沒有任何 `prerequisite`（孤兒），
   **When** 驗證 DAG，**Then** 驗證失敗並指名該孤兒 Concept；合法起點（Level 0 Module 內各 Topic 的首個
   Concept，見 FR-016）不視為孤兒。

---

### User Story 3 - 顆粒度與唯一性規則可被機器檢查，且供產線重用 (Priority: P2)

系統能機器化檢查課程的**結構顆粒度規則**（每個 Topic / Module 的 Concept 數量範圍、Concept 總數下限）
與 **id 全域唯一性**，並將這套結構 Gate 以**單一實作**提供，供 F7 內容產線 Stage 1 的結構 Gate 原樣重用。

**Why this priority**: 顆粒度規則是「One Concept per Session、Small Learning Steps」在課程結構層的具體守門
（`docs/spec.md` §8.1）。§22.5 明確要求本 Feature 讓顆粒度規則**機器可驗**並供 Stage 1 重用；但它建立在
US1 / US2 的 schema 與 DAG 之上，且在本 Feature 只能對 fixture 與 stub 驗證（真正的完整課程於 F7 交付），
故列為 P2。

**Independent Test**: 給違反顆粒度規則的 fixture（Topic 少於下限 / 多於上限、重複 id）→ 各自明確報錯；
給合法 fixture → 通過。並驗證同一套規則實作可被結構 Gate 入口與（未來）產線共用，無第二份平行實作。

**Acceptance Scenarios**:

1. **Given** 一個 Topic 的 Concept 數落在合法範圍內的課程，**When** 執行顆粒度檢查，**Then** 通過。
2. **Given** 一個 Topic 的 Concept 數超出上限（或低於下限）的課程，**When** 執行顆粒度檢查，**Then** 失敗並
   指名該 Topic 與其實際 / 期望數量。
3. **Given** 兩個 Concept 使用相同 `id`，**When** 執行唯一性檢查，**Then** 失敗並指名重複的 `id` 與其所在位置。
4. **Given** 顆粒度規則需在**完整課程資料尚未存在**的情況下開發，**When** 以 fixture 驗證各條規則，**Then** 每條
   規則皆可獨立被觸發與驗證，不需依賴完整的 150+ Concept 課程。

---

### User Story 4 - 骨架定稿並以 stub 課程端到端跑通驗證 (Priority: P3)

系統交付一份**課程結構骨架**（Module / Topic 的順序與命名，確定性、版本控制）與**少量 stub Concept**
（涵蓋 Level 0 + Level 1），讓「載入骨架與 Concept → 建 DAG → 跑完全部驗證」這條鏈路端到端綠燈，
作為後續 Feature 與內容產線的可運行驅動範例。

**Why this priority**: 骨架定稿與 stub 端到端跑通，是把 US1～US3 的能力串成一條可執行驗證鏈的收尾；
它證明整套契約與驗證能真的跑起來，但本身不新增驗證能力，且 stub 內容是臨時產物（F7 取代），故列為 P3。

**Independent Test**: 對交付的 stub 課程執行完整驗證流程，確認全部驗證通過（綠燈）、可輸出確定性拓樸順序；
重複執行多次，結果一致。

**Acceptance Scenarios**:

1. **Given** 交付的課程骨架與 stub Concept 集合，**When** 執行完整驗證流程，**Then** 全部驗證通過，
   且產出的拓樸順序是確定的。
2. **Given** 同一份骨架與 stub Concept，**When** 重複執行驗證 N 次，**Then** 每次的驗證結論與（成功時的）
   拓樸順序 100% 一致。
3. **Given** stub Concept 集合，**When** 檢視其檔案，**Then** 每一份皆明確標示其臨時性與接手 Feature（F7）。

---

### Edge Cases

- **空課程**（Concept 集合為空）：MUST 明確報錯（無法建立有意義的課程），MUST NOT 視為「零違規、通過」；
  **兩模式皆強制**，不因 stub 模式豁免下限而放行（見 FR-010a）。
  **`concepts/` 目錄不存在**與**目錄存在但無任何 Concept** MUST 視為同一情形、回報同一 `empty-curriculum`
  違規（定案 2026-07-22）：兩者對驗證的意義相同（載入鏈路無產出），分立兩種類別只增加下游分支而無價值；
  但錯誤訊息 MUST 區分兩者以利排錯（指出是「目錄不存在」還是「目錄為空」）。
- **只有起點、無任何依賴邊**（全部 Concept 皆無 `prerequisite` / `next`）：孤兒規則如何裁定 MUST 有明確定義
  （見 FR-016：僅「Level 0 Module 內、各 Topic 的首個 Concept」免除孤兒判定，其餘無連結者視為孤兒並報錯）。
- **自我依賴**（Concept 的 `prerequisite` 或 `next` 含自己的 `id`）：視為環的退化情形，MUST 報錯。
- **`prerequisite` 與 `next` 邊不一致**（A 宣告 `next: [B]`，但 B 未把 A 列入 `prerequisite`，反之亦然）：
  本 Feature 的處置見 FR-017（預設校驗雙向一致性並報告不一致，屬防呆檢查）。
- **重複的依賴邊**（同一 `prerequisite` / `next` id 在同一 Concept 列出多次）：MUST 明確處置（正規化去重或報錯，
  見 FR-018），MUST NOT 因此讓後續圖演算法行為未定義。
- **`leetcode` 題號參照**：Problem Bank 屬 F3，本 Feature **無**題庫可比對；`leetcode` 題號存在性驗證
  MUST 設計為可插拔關卡，在 F2 環境下明確標示為「延後至 F3」而非誤報通過（見 FR-023）。
- **骨架與 Concept 不一致**（Concept 宣告的 `module` / `topic` 不存在於課程骨架 `modules.json`）：
  視為參照完整性錯誤，MUST 報錯並指名（見 FR-013）。
- **顆粒度下限與 stub 現實衝突**：stub 課程只涵蓋 Level 0 + Level 1，**必然**達不到「總數 ≥ 150」等針對完整
  課程的下限；本 Feature MUST 明確區分「對完整課程強制的規則」與「本 Feature stub 階段豁免的規則」
  （見 FR-021），MUST NOT 讓 stub 課程因為總數不足而被判為結構錯誤。

## Requirements *(mandatory)*

### Functional Requirements

**課程骨架（Curriculum Skeleton）**

- **FR-001**: 系統 MUST 提供一份**確定性、版本控制的課程結構骨架**，定義 `docs/spec.md` §8.1 的
  `Module → Topic → Concept` 三層中的 **Module 與 Topic 的身分與順序**（Concept 清單不在此，由 F7 產出）。
  骨架 MUST 涵蓋 §8.2 的**完整 16 個 Level**（Level 0 Programming Mindset ～ Level 15 Dynamic Programming）
  的 Module 與其 Topic，一次定稿；MUST NOT 只定 stub 所涵蓋的 Level 0 + Level 1 子集
  （Deterministic Curriculum：地圖 MUST 一次定版即固定，§4-4）。
- **FR-001a**: 三層對應關係 MUST 為：§8.2 的**每個 Level = 一個 Module**；每個 Module 下 MUST 再切 1～N 個
  Topic；Concept 依其 `topic` 掛在 Topic 之下（Concept 由 F7 產出）。此對應 MUST 與 §8.1 的數量分層一致
  （Module 10～30 Concept、Topic 5～12 Concept）。
  > **回寫真實來源（MUST，跨 Feature 決策）**：`docs/spec.md` §10.1 的範例 `module: array / topic: two-pointer`
  > 與此對應不一致（two-pointer 為獨立 Module，非 array 下的 Topic）。**已回寫（2026-07-21）**：
  > `docs/spec.md` §10.1 範例的 `module` 已由 `array` 修正為 `two-pointer`，使真實來源與本決策一致
  > （CLAUDE.md「跨 Feature 決策必須落地到真實來源」）。
- **FR-001b**: 骨架的**凍結顆粒度**MUST 明確區分兩層：
  - **Module 的身分與順序 MUST 嚴格凍結**（§8.2 的 16 個 Level，順序即 `level`；MUST NOT 於後續 Feature
    重排或增刪）。
  - 各 Module 的 **Topic 清單**為本 Feature 交付的**骨架**：對尚未撰寫 Concept 的 Module，Topic 依標準
    演算法課綱知識**先行宣告**（best-effort skeleton）。F7 outline 若需在**不改 Module 順序**的前提下
    調整某 Module 的 Topic，MUST 走「改 `modules.json` → 重跑驗證 → review diff → commit」的既定紀律
    （與憲章 XIII 生成流程精神一致），MUST NOT 於 runtime 變更。
  此區分 MUST NOT 被解讀為「Topic 未定稿」——Topic 於本 Feature 已定版並凍結，上述僅界定其**可修訂途徑**。
  骨架檔本身 MUST 明確記載此凍結紀律（Module 順序嚴格凍結、Topic 的既定修訂途徑），使其可被後續 Feature 追溯。
- **FR-001c**: 骨架的**結構性錯誤**（`modules` 陣列長度非 16、`module.level` 不等於陣列索引、某 module
  無任何 topic、`title` 為空）MUST 回報為獨立的 **`skeleton-shape`** 違規類別（`error` 級），且此類別
  **MUST NOT 受 `mode`（stub / full）影響**——骨架是一次定稿的地圖，任何模式下都不該有殘缺骨架。
  此類別 MUST 與 `granularity-range` 分離：後者專指**Concept 數量**是否落在 §8.1 範圍內、且依 `mode`
  區分強制層級（FR-021）。兩者混用同一類別會使下游無法區分「骨架壞掉」與「內容尚未填滿」
  （定案 2026-07-22）。
- **FR-002**: Module 與 Topic 的識別 id MUST 為 kebab-case 且穩定不變（`docs/spec.md` §26.1）。
  唯一性層級 MUST 為：**`module.id` 全域唯一**；**`topic.id` 跨全部 Module 全域唯一**（非僅於所屬 Module
  內唯一）——因為 `topic.id` 同時是 Concept 的資料夾名 `concepts/{topic}/`（§26.1、FR-013），跨 Module 撞名
  會使資料夾歸屬不確定。**Topic 命名慣例**：每個 Module 的第一個（主）Topic id **沿用該 Module 的 id**
  （如 Module `two-pointer` 的主 Topic 即 `two-pointer`，`docs/spec.md` §8.4 / §10.1 既有慣例），需再細分時
  才增列其他 Topic id；`module.id` 與其主 `topic.id` 同名 MUST NOT 被判為重複（兩者屬不同層級的識別空間）。
  骨架 MUST 明確表達 Module 與 Topic 的**宣告順序**——此順序即前向依賴判定所依據之確定性全序的
  骨架部分（見 FR-015）。
- **FR-003**: 課程骨架 MUST 存放於 `docs/spec.md` §17 既定的 curriculum 骨架路徑（`curriculum/modules.json`），
  MUST NOT 硬編於程式常數中——「骨架檔 → in-memory 課程結構」是本 Feature 要建立的載入鏈路一環。

**Concept metadata schema**

- **FR-004**: 系統 MUST 定義一套 **Concept metadata schema**，涵蓋 `docs/spec.md` §10.1 的全部欄位：
  `id`、`title`、`module`、`topic`、`difficulty`、`estimated_minutes`、`pattern_label`、`complexity_label`、
  `prerequisite`、`next`、`learning_goal`、`exit_criteria`、`leetcode`、`tags`，並對每個欄位規範型別與值域。
- **FR-005**: `id` MUST 為 kebab-case slug、**全域唯一**、穩定不變（`docs/spec.md` §26.1）；schema 驗證
  MUST 能判定 `id` 是否符合此命名規範。
- **FR-006**: `difficulty` MUST 限定為 `easy | medium`（Concept 本身的認知難度，非題目難度）；
  `estimated_minutes` MUST 為正整數；`prerequisite` / `next` / `leetcode` / `tags` / `learning_goal` /
  `exit_criteria` MUST 為對應元素型別的陣列。
- **FR-007**: `pattern_label` 與 `complexity_label` MUST 由 frontmatter **明確提供**，schema MUST 要求其存在；
  系統 MUST NOT 由正文散文以啟發式規則推導這兩個標籤（違反確定性原則，`docs/spec.md` §10.1 註、§4-12）。
- **FR-008**: schema 驗證失敗時，系統 MUST **fail loud**——明確指名違規的 Concept（以 `id` 或檔案路徑）、
  違規欄位、以及期望的型別 / 值域 / 規則；MUST NOT 以空值或預設值靜默帶過，MUST NOT 只回傳布林而不指出原因。
- **FR-008a**: 每一筆違規 MUST 帶明確的**嚴重度**，且嚴重度分類 MUST 為需求層的固定定義（非實作自由裁量）：
  除**重複依賴邊**（見 FR-018）為 `warning` 外，其餘全部違規類別（schema 缺欄位 / 型別 / id 格式 /
  `leetcode` 格式 / 懸空參照 / 懸空 `leetcode` 題號 / 環 / 自我依賴 / 前向依賴 / 孤兒 / 雙向不一致 /
  重複 id / 顆粒度超限 / **骨架結構錯誤**（FR-001c）/ **空課程**）MUST 為 `error`。整體驗證的「通過與否」MUST **僅由 `error` 級決定**（存在任一 `error` ⇒ 不通過）；
  `warning` MUST 被回報但 MUST NOT 使驗證失敗。
- **FR-009**: Concept metadata MUST 由**實際解析 Concept 檔的 frontmatter** 取得，MUST NOT 把 metadata
  硬編為程式常數——「Concept 檔 → metadata」是本 Feature 要建立的鏈路一環。

**DAG 建置與完整性驗證**

- **FR-010**: 系統 MUST 由課程骨架與全部 Concept metadata 建出一張 **in-memory 的依賴圖**，其節點結構
  MUST 對齊 `docs/spec.md` §16.1 的 `ConceptNode`（含 `prerequisite` / `next` / 骨架與全文路徑等欄位）。
- **FR-010a**: **Concept 集合為空**（`concepts/**` 下無任何通過 schema 的 Concept）時，系統 MUST 回報一筆
  `error` 級違規（空課程無法構成有意義的學習圖），MUST NOT 視為「零違規、通過」。此規則 MUST **對 `stub`
  與 `full` 兩種模式一律強制**——它與 FR-021 的「下限類規則」性質不同（下限類是「數量不足」，此處是
  「完全沒有課程」），MUST NOT 因 stub 模式豁免下限而被連帶放行。
- **FR-011**: 系統 MUST 驗證此圖**可拓樸排序**（可線性化為一個合法的學習順序），並能在成功時輸出一個
  **確定性**的拓樸順序（同一輸入恆得同一順序）。
- **FR-012**: 系統 MUST 驗證此圖**無環**；偵測到環時 MUST 報錯並指出構成環的 Concept。自我依賴
  （Concept 依賴自己）MUST 被當作環的退化情形而報錯。
- **FR-013**: 系統 MUST 驗證**參照完整性**——每個 `prerequisite` / `next` id 皆存在於 Concept 集合、
  每個 Concept 宣告的 `module` / `topic` 皆存在於課程骨架、且該 `topic` MUST 隸屬於該 `module`；
  此外，Concept 的 `topic` **MUST 等於其檔案所在的資料夾名**（`concepts/{topic}/`，§26.1）。
  任一懸空參照或 `topic` 與資料夾名不符 MUST 報錯並指名來源與目標。
  **職責歸屬（定案 2026-07-22）**：上述**全部**參照完整性檢查 MUST 由圖層驗證（`validateCurriculum`）
  單一負責；載入階段（`loadCurriculum`）MUST 只做讀檔與 schema 解析、只產出 schema 類違規，
  **MUST NOT 自行實作任何參照完整性檢查**。此劃分是 FR-022 / FR-024「單一實作、不得雙軌」在本規則上的
  具體落地——兩處各驗一次會使 F7 Stage 1 Gate 可能只呼叫其一而漏檢。
- **FR-014**: 系統 MUST 驗證**無前向依賴**——任一 Concept 的 `prerequisite` MUST NOT 指向在確定性課程順序
  上**晚於自己**的 Concept（`docs/spec.md` §8.3）；違反時 MUST 報錯並指名前向依賴的來源與目標。
  「課程順序」的判定基準 MUST 有單一、明確、確定性的定義（見 FR-015）。
- **FR-015**: 「前向 / 後向」所依據的**確定性課程順序** MUST 為**宣告序**：以 `modules.json` 的
  Module 宣告順序 → Module 內 Topic 宣告順序 → Topic 內 Concept 檔名局部序號（`NNN`，§8.4）構成的
  唯一全序。前向依賴即 `prerequisite` 指向此全序中**晚於自己**的 Concept（FR-014）。
  此順序 MUST 為純宣告 / 編號決定，不隨載入順序或雜湊順序改變；且合法 DAG 下 MUST 與拓樸排序相容
  （不得存在「宣告序合法但拓樸不可線性化」的矛盾）。**「無前向依賴」因此獨立於「無環」而具意義**
  （一張無環圖仍可能違反宣告序）。
- **FR-016**: 系統 MUST 驗證**無孤兒**——除了合法起點 Concept 外，每個 Concept MUST 至少被
  某個 Concept 的 `next` 提及、或自身宣告至少一個 `prerequisite`（`docs/spec.md` §8.3）；孤兒 MUST 報錯並
  指名。
  **「合法起點」的定義（定案 2026-07-21）**：一個 Concept 為合法起點 ⇔ 它同時滿足
  （a）所屬 Module 為 **Level 0**（`ordinal` 全序中 `moduleIndex == 0`），且
  （b）它是**該 Topic 內檔名 `NNN` 最小**的 Concept。
  亦即：**Level 0 的每個 Topic 各允許恰一個起點**；Level 0 內同一 Topic 的第 2 個以後的 Concept、
  以及 Level 1～15 的全部 Concept，一律適用孤兒規則。此定義為純宣告 / 編號決定（確定性，FR-025），
  且 MUST 與 FR-015 的全序使用同一份 `ordinal` 資料，MUST NOT 另立平行判準。
  （此為跨 Feature 約束——F7 產出的 Concept MUST 滿足之——**已回寫 `docs/spec.md` §8.3**。）
- **FR-017**: 系統 MUST 校驗 `prerequisite` 與 `next` 兩組邊的**雙向一致性**（A 的 `next` 含 B ⇔ B 的
  `prerequisite` 含 A）；不一致 MUST 報 **`error`** 級違規並指名兩端。此為防呆檢查，避免作者手誤造成
  單向宣告的隱性錯誤——本 Feature **要求作者同時宣告 `prerequisite` 與 `next` 且兩者一致**，
  MUST NOT 由系統自動補齊缺漏的一向。
  （此檢查為本 Feature 定案，**已回寫 `docs/spec.md` §8.3**（2026-07-21）；若後續決定改為單向宣告，
  MUST 一併修訂 §8.3。）
- **FR-018**: 同一 Concept 的 `prerequisite` / `next` 內出現**重複 id** 時，系統 MUST **正規化去重後續行**
  並回報一筆 **`warning`** 級違規（不使驗證失敗，見 FR-008a），MUST NOT 讓重複邊使後續圖演算法行為未定義。
  （定案採「去重 + warning」而非報 error：重複邊是無害的作者冗餘，去重後語意不變。）

**顆粒度與唯一性結構 Gate（供 F7 Stage 1 重用）**

- **FR-019**: 系統 MUST 機器化檢查**顆粒度規則**：每個 Topic 的 Concept 數、每個 Module 的 Concept 數、
  以及 Concept 總數，是否落在 `docs/spec.md` §8.1 定義的範圍內。
  範圍 MUST 為**閉區間**（端點合法）：`5 ≤ Topic Concept 數 ≤ 12`、`10 ≤ Module Concept 數 ≤ 30`、
  `Concept 總數 ≥ 150`——**恰好等於上限或下限 MUST 判為通過**，僅超出端點（如 Topic 13、Module 9）才報錯。
  違規時 MUST 指名違規的 Topic / Module 與其實際 / 期望數量。
  此範圍在 `docs/spec.md` §8.1 為 **MUST**（2026-07-22 由 SHOULD 升級並回寫），故違規 MUST 為 `error` 級
  （FR-008a），MUST NOT 降為僅提示；「本 Feature stub 階段的豁免」僅適用下限類，見 FR-021。
  本規則只涵蓋 **Concept 數量**；骨架自身的結構錯誤屬 `skeleton-shape`（FR-001c），MUST NOT 混用同一類別。
- **FR-020**: 系統 MUST 檢查 **`id` 全域唯一性**（跨全部 Topic / Module）；重複時 MUST 指名重複的 `id`
  與其出現位置。
- **FR-021**: 顆粒度規則 MUST 明確區分**強制層級**，以相容於「骨架完整 16-Level 定稿（FR-001）、但 stub
  階段僅 Level 0 + Level 1 有 Concept、其餘 Module / Topic 暫為空」的現實：
  - **下限類規則**（Concept 總數 ≥ 150、Module ≥ 10 Concept、Topic ≥ 5 Concept）MUST 為**可組態的模式**：
    完整課程模式（供 F7 / CI）強制之；stub 模式豁免之。MUST NOT 因 stub 規模小、或因尚未填 Concept 的
    空 Module / Topic 而被判為結構錯誤。
  - **上限、唯一性類規則**（Topic ≤ 12、Module ≤ 30、`id` 全域唯一）MUST 對任何課程（含 stub）一律適用。
  - 模式切換 MUST 為**明確且確定性的組態**（非隱性硬編門檻），MUST NOT 讓 stub 意外通過應失敗的檢查、
    或意外失敗應豁免的檢查。
- **FR-022**: 顆粒度與唯一性的結構 Gate MUST 以**單一實作**提供，並 MUST 能被 F7 內容產線 Stage 1 的
  結構 Gate（`docs/spec.md` §20.3 Stage 1 步驟 2）原樣重用；MUST NOT 出現「本 Feature 一套、產線另一套」
  的雙軌驗證（呼應 §4-9「單一 Compiler、不得雙軌」）。

**參照完整性的可插拔關卡（跨 Feature 邊界）**

- **FR-023**: `leetcode` 題號存在性驗證（題號 MUST 存在於 Problem Bank，`docs/spec.md` §8.3）需 Problem Bank
  （F3）方能落地。本 Feature MUST 將此關卡設計為**可插拔**：在無 Problem Bank 的 F2 環境下，MUST 明確標示
  該檢查為「延後至 F3」，MUST NOT 誤報為「通過」、亦 MUST NOT 因缺題庫而讓整體驗證失敗。
  schema 層 MUST 仍驗證 `leetcode` 欄位的**格式**（正整數題號陣列）。

**單一實作、確定性與共用**

- **FR-024**: 課程載入與 DAG 建置 MUST 為**單一實作**，供未來的 Lesson Compiler（runtime）與 build-time Gate
  （F7 / CI）共用；MUST NOT 為不同呼叫端各寫一套載入 / 驗證邏輯（`docs/spec.md` §4-9、§7.1；憲章 IX）。
  本 Feature MUST 將此實作置於 §17 既定的 compiler 模組路徑（`src/compiler/curriculum.ts`）。
- **FR-025**: 全部驗證 MUST 為**確定性純計算**——同一份骨架與 Concept 集合，MUST 恆得相同的驗證結論與
  （成功時的）拓樸順序，不依賴檔案系統列舉順序、雜湊順序或時間。
- **FR-026**: 驗證 MUST 能在**無 Problem Bank、無 schedules、無 articles 全文**的環境下獨立執行——本 Feature
  的驗證是自足的，MUST NOT 依賴尚未建立的 F3 / F4 / F7 產物（`leetcode` 存在性除外，見 FR-023）。

**stub Concept 與驗證入口**

- **FR-027**: 系統 MUST 提供**少量 stub Concept**（涵蓋 Level 0 + Level 1），存放於 §17 既定的 Concept 路徑
  （`concepts/{topic}/{NNN}-{slug}.md`），內含合法的 frontmatter，使整條驗證鏈可端到端跑通並綠燈。
  stub 內容為臨時產物，MUST 在檔案內明確標示其臨時性與接手 Feature（**F7 內容產線 Stage 1 取代**）。
- **FR-028**: 系統 MUST 提供一個**可重複執行的驗證入口**（供本地與 CI 呼叫），對課程骨架 + Concept 集合
  執行 FR-010～FR-023 的全部驗證，並在任一項失敗時以**明確錯誤與非零結束狀態**回報（fail loud），
  全數通過時明確回報通過。此入口 MUST 為 F7 Stage 1 結構 Gate 與（未來）CI Gate 的重用基礎。
- **FR-028a**: 系統 MUST 提供一個在 push / pull request 時自動執行的 **CI workflow**，至少涵蓋
  「安裝相依 → 建置 → 單元測試 → 執行 FR-028 的驗證入口」，任一步失敗 MUST 使 CI 失敗（fail loud）。
  此為 FR-028「供 CI 呼叫」得以成立的前提——在本 Feature 之前，repo 僅有每日推播用的 `daily.yml`
  （只跑建置），**單元測試從未在 CI 執行**（定案 2026-07-22）。此 workflow 屬工程鷹架，
  與 F5 的內容 Gate（全 Track × 全 Session 編譯 + Discord 限制檢查）分屬不同關卡，後者仍屬 F5。

### Key Entities

- **課程骨架（Curriculum Skeleton / modules.json）**：完整 16 個 Level 的 Module 與其 Topic 的身分、命名與
  宣告順序（Level 遞增、確定性）。是 Concept 之上的結構容器與課程順序的權威來源之一；不含 Concept 清單。
- **Module**：課程的最上層分組，**對應 §8.2 的一個 Level**（如 Programming Mindset、Array、Two Pointer…），
  含 id、顯示名、宣告順序、所屬 Topic 集合（1～N 個）。
- **Topic**：Module 下的次層分組（如 `two-pointer` 於 Two Pointer Module 下），含 id、顯示名、宣告順序；
  Concept 依其 `topic` 歸屬於某個 Topic。
- **Concept（ConceptNode）**：課程的最小知識單元，以 `docs/spec.md` §10.1 的 frontmatter 描述 metadata，
  §16.1 的 `ConceptNode` 為 in-memory 形態；唯一識別為 `id`（slug）。本 Feature 只處理其 metadata 與依賴邊，
  **不處理全文內容**（屬 F5 / F7）。
- **Curriculum DAG**：由全部 Concept 依 `prerequisite` / `next` 邊構成的有向無環圖；本 Feature 的核心產物與
  驗證對象。
- **驗證結果（Validation Result）**：一次驗證的結論——通過，或一組具名的違規（違規 Concept / 欄位 / 規則、
  期望與實際）。fail loud 的載體。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**（對應 AC1）：對交付的合法 stub 課程執行完整驗證，DAG 驗證（無環、無前向依賴、`prerequisite` /
  `next` 參照完整、無孤兒、可拓樸排序）**100% 通過、0 誤報**。
- **SC-002**：對每一類注入的結構性錯誤——環、自我依賴、前向依賴、懸空 `prerequisite` 參照、懸空 `next` 參照、
  懸空 `module` / `topic` 參照、孤兒、重複 `id`、**`prerequisite`/`next` 雙向不一致**（FR-017）、**空課程**
  （FR-010a）、**骨架結構錯誤**（FR-001c，`skeleton-shape`）——驗證**必定失敗**，且錯誤訊息指名違規的
  Concept / 欄位 / 規則。每一類至少一個自動化測試涵蓋。
  此外，**重複依賴邊**（FR-018）MUST 產生一筆 `warning` 且**不**使驗證失敗，亦須至少一個自動化測試涵蓋。
- **SC-003**：對每一類注入的 metadata schema 錯誤——缺必要欄位、型別錯誤、值域錯誤（如 `difficulty` 非法）、
  `id` 命名不符、**`leetcode` 格式非正整數陣列**——驗證**必定失敗**並指名違規欄位。每一類至少一個自動化測試涵蓋。
- **SC-004**：對違反顆粒度規則的 fixture（Topic Concept 數超出範圍、重複 `id`）驗證失敗並指名；
  對**恰好等於上限 / 下限**的 fixture 驗證通過（閉區間，FR-019）。顆粒度結構
  Gate 可在**無完整 150+ Concept 課程**的前提下，以 fixture 獨立驗證每一條規則。
- **SC-005**（確定性）：同一份骨架與 Concept 集合重複驗證 100 次，驗證結論與（成功時的）拓樸順序
  **100% 逐次一致**。
- **SC-006**（自足性）：驗證入口可在**無 Problem Bank、無 schedules、無 articles** 的環境下端到端執行完成；
  `leetcode` 存在性關卡明確回報「延後至 F3」而非誤判通過或失敗。
- **SC-007**（單一實作 / 可重用）：課程載入 + DAG 驗證 + 結構 Gate 為單一實作，能被 F7 Stage 1 結構 Gate
  與 CI 入口共用；程式庫中**不存在**針對相同規則的第二份平行驗證實作。**參照完整性**（FR-013）
  MUST 僅實作於圖層驗證一處，載入階段**不得**有第二份。
- **SC-008**（CI 自動把關，FR-028a）：push / pull request 觸發的 CI workflow 自動執行「建置 → 單元測試 →
  驗證入口」三段並全綠；刻意注入任一失敗（測試失敗或課程結構違規）時，CI **必定**以非零狀態失敗。

## Assumptions

- **本 Feature 交付「契約與驗證能力」，非內容**：真正的 150+ Concept 清單由 F7 Stage 1 產出、經課綱大綱定稿後
  凍結（`docs/spec.md` §20.3、§4-17）。本 Feature 只用 Level 0 + Level 1 的少量 stub Concept 驅動驗證。
- **不改動每日 runtime、不重寫 F1 的執行路徑**：本 Feature 交付 curriculum 載入 + DAG 驗證的**模組與驗證入口**，
  以測試與驗證入口驗收，**不**把 DAG 接入每日推播的組裝 / 渲染（Lesson Compiler 對 DAG 的消費屬 F5）。
- **F1 硬編學習路徑對照表的交棒（clarify 2026-07-21 定案）**：F1 的 `getPathLabels`
  （`src/compiler/schedule.ts`）標註「學習路徑對照表 → F2」。**定案：F2 只建 DAG + 驗證，不做 path 推導、
  不移除 `getPathLabels`**；由 `prerequisite` / `next` 推導 prev / current / next 的接入與對照表移除，
  留待 Lesson Compiler（F5）真正消費 DAG 時落地——因為本 Feature 的 DAG 只含 stub Concept，每日 pipeline
  仍在使用 F1 的手寫教材與硬編課表（課表交棒 F4）。**此為跨 Feature 決策，已回寫真實來源（2026-07-21）**：
  F1 交棒表「學習路徑硬編對照表」該列接手 Feature 由「F2」改為「F5」、F1 spec FR-007a 與
  `src/compiler/schedule.ts` 註解同步更新，並在 `docs/spec.md` §22.5 F5 段落新增「消費 DAG 推導 learning path、
  移除 `getPathLabels`」（CLAUDE.md「跨 Feature 決策必須落地到真實來源」）。
- **Module / Topic 分層與骨架範圍（clarify 2026-07-21 定案）**：**Level = Module、每 Module 下切 Topic**
  （FR-001a）；**modules.json 一次定稿完整 16-Level 骨架**（FR-001）。`docs/spec.md` §10.1 的範例
  `module: array / topic: two-pointer` 與此不一致，**已回寫修正**（§10.1 `module` 改為 `two-pointer`，見 FR-001a 內註）。
- **前向依賴順序基準（clarify 2026-07-21 定案）**：以**宣告序**（Module → Topic → Concept `NNN`）構成的
  唯一全序為前向 / 後向判準（FR-014、FR-015），使「無前向依賴」獨立於「無環」而具意義。
- **仍待 `/speckit-clarify` 或後續 Feature 定案的次要參數**（採合理預設、不阻擋本 Feature）：
  - **Concept 顆粒度的確切門檻與豁免細節**：預設採 §8.1 數值（Topic 5～12、Module 10～30、總數 ≥ 150，
    **閉區間**，FR-019），強制層級的區分見 FR-021；stub 階段的豁免與完整課程門檻的最終數值可於 F7 outline
    定稿時微調。
  - **`difficulty` 判定基準**：`easy | medium` 為 Concept 認知難度；「何謂 easy / medium」的判定基準
    屬內容判斷、於 F7 定稿，**不影響**本 Feature schema 對值域的驗證。
- **`leetcode` 存在性延後至 F3**：本 Feature 只驗 `leetcode` 欄位格式；題號是否存在於 Problem Bank 的比對
  於 F3 接上題庫後啟用（FR-023）。此為 §22.5 依賴關係的自然結果（F3 依賴 F2）。
- **技術選型沿用 `docs/spec.md` §22.3 / CLAUDE.md**：schema 驗證與 frontmatter 解析的具體工具、語言、
  測試框架於 `/speckit-plan` 釘死，不在本 spec 規範（本 spec 只描述能力與契約，技術中性）。

## 臨時產物與交棒

本 Feature 交付的下列產物為**臨時**，用以驅動並驗證契約；為避免與正式產物並存形成技術債，逐項列出接手者：

| 臨時產物 | 需求 | 接手 Feature | 淘汰條件 |
|---|---|---|---|
| stub Concept（Level 0 + Level 1 少量） | FR-027 | **F7** | 內容產線 Stage 1 起草完整 Concept 並經大綱定稿凍結後取代 |

**交棒規則（MUST）**：

- 上表產物 MUST 在其檔案內明確標示臨時性與接手 Feature（F7）。
- F7 完成時 MUST 一併移除被取代的 stub Concept，MUST NOT 讓 stub 與正式 Concept 並存
  （並存會使「哪一份是真實來源」變得不確定）。
- **相對地，本 Feature 交付的下列產物為永久資產**，後續 Feature 應在其上擴充而非重建：
  課程骨架 `curriculum/modules.json`、Concept metadata schema、curriculum 載入 + DAG 建置模組
  （`src/compiler/curriculum.ts`）、DAG / 顆粒度 / 唯一性的驗證與結構 Gate、驗證入口。
- **F1 硬編學習路徑對照表**（`getPathLabels`）的移除**不在本 Feature**，改由 F5 接入 DAG 時處理
  （見 Assumptions；此跨 Feature 決策已於 2026-07-21 回寫真實來源）。

## Out of Scope（本 Feature 明確不做）

- **題庫資料與 `leetcode` 題號存在性驗證、Concept ↔ Problem 逆向對應、slug 一致性**（F3）。本 Feature 只驗
  `leetcode` 欄位格式，並把存在性關卡設計為可插拔（FR-023）。
- **課表生成器、Track 參數、Overlay schema、拓樸子序列課表驗證**（F4）。本 Feature 只保證整份 DAG 合法，
  不生成任何 Track 課表。
- **Lesson Compiler 的全文（`articles/**`）解析、`Lesson` 組裝、Renderer 對 DAG 的消費、learning path
  由 DAG 驅動、CI 內容 Gate 的完整編譯 + Discord 限制檢查**（F5）。
- **移除 F1 的硬編學習路徑對照表 / 硬編課表 / 手寫教材**（分別屬 F5 接入、F4、F7）。
- **真正的完整 Concept 清單、Author Hints、Full Article、內容產線（Stage 1 / Stage 2）與其品質 Gate**（F7）。
- **每日 pipeline、多 Track、狀態推進、Discord 推播**（F1 已建 / F6）。
- **`exit_criteria` 的字元預算檢查（≤ 6 條、每條 ≤ 60 字元）等內容 / 版面預算**（屬內容 Gate，F5 / F7）——
  本 Feature 只驗 `exit_criteria` 為非空字串陣列的結構，不驗其長度 / 字數預算。

## Dependencies

- **F1（`001-walking-skeleton`）已完成**：提供工程鷹架（建置 / 測試設定）、`src/compiler/` 模組邊界、
  §17 的目錄結構基礎；本 Feature 在其上新增 `curriculum/modules.json`、Concept metadata schema 與
  `src/compiler/curriculum.ts`。
- **`docs/spec.md` 為唯一需求來源**：Module 骨架（§8.2）、DAG 規範（§8.3）、命名編號（§8.4、§26.1）、
  Concept frontmatter（§10.1）、`ConceptNode`（§16.1）、目錄結構（§17）、內容產線 Stage 1 結構 Gate
  （§20.3）、驗收基準（§24 AC1）皆以 spec 為準；查不到才於 clarify 定案並回寫 spec。
- **後續 Feature 的重用約定**：F3（題庫存在性接上 FR-023 關卡）、F4（消費 DAG 生成課表）、F5（Lesson
  Compiler 消費 DAG、接入 learning path）、F7（Stage 1 結構 Gate 重用本 Feature 的驗證，見 FR-022）
  皆依賴本 Feature 的契約與驗證入口保持穩定。
