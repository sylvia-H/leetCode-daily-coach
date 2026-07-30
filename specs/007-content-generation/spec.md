# Feature Specification: 兩階段內容產線（全量課綱起草＋大綱定稿 → 全文展開）＋品質 Gate＋節流／續跑

**Feature Branch**: `007-content-generation`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "feature 007-content-generation"

## 背景與目的

本 Feature 是 LeetCode Daily Coach 的第七個切片（對應 `docs/spec.md` §22.5 **F7**、§20、里程碑 **M3**），
依賴 F2（`002-curriculum-schema`，Curriculum 骨架 / frontmatter schema / DAG 驗證）、F3（`003-problem-bank`，
題庫 schema 與資料）、F4（`004-schedule-generator`，`generate-schedule.ts` / Overlay / Track 參數）。**可與
F5 / F6 並行**（機器批次 2～4 天）。

前六個 Feature 交付的是**引擎與骨架**：DAG 驗證、題庫、課表生成器、Compiler、Renderer、推播管線。但截至目前，
repo 內的教材只是**種子 / stub**——`concepts/**` 僅 5 份 Skeleton、`articles/**` 僅 5 份 fixture Article、
`schedules/**` 為 F4 以種子 DAG 生成的短課表。**本 Feature 交付的是把整條內容產線在真實規模上跑起來**：
以 LLM 批次生成**全部 16 個 Module、150+ 個 Concept** 的完整課綱與教材，過自動 Gate 凍結入庫，取代所有種子，
使 F6 的每日管線推播的是**真實、成體系、通過品質把關的課程**，而非 stub。

本 Feature 的產出**不是新的每日 runtime 能力**，而是**一次性的 build-time 內容工程**：教材由 LLM 在 build-time
生成 → 過 Gate → 凍結入 repo；凍結後即為定版，每日 runtime 依舊零 LLM（憲章 VII / VIII / XIII）。整條產線
**唯一的常態性人工檢查點是「課綱大綱表一次性定稿」**（`curriculum/outline.md`，約 1～2 小時；憲章 XIV / §4-17）；
大綱凍結後，Skeleton、全文、課表全自動生成，僅由自動 Gate 把關。

**對應驗收基準**：`docs/spec.md` §26 **AC11**（Stage 1 產出通過結構 Gate 的完整課綱與 `outline.md`；大綱定稿後
Stage 2 全量展開並通過 §20.3 全部 Gate；中斷後可 checkpoint resume）；§22.5 F7 驗收（三軌全部 Session 內容
齊備、Gate 含 TS/Python 程式碼在 CI 實測 / 字元預算 / 全編譯全數通過）；里程碑 **M3**（並行達成）。

## 產線範圍與階段（源自 `docs/spec.md` §20.3 / §20.4）

| 階段 | 產物腳本 | 輸入 | 產出 | 把關 |
| --- | --- | --- | --- | --- |
| **Stage 1** 課綱 + Skeleton 起草 | `scripts/generate-curriculum.ts` | §8 Module 骨架（`curriculum/modules.json`）、Problem Bank、生成參數 | 完整 Concept 清單（frontmatter + Author Hints）＝ `concepts/**`；`curriculum/outline.md` | 結構 Gate（自動）＋**大綱定稿（唯一人工檢查點）** |
| **Stage 2** 全文展開 | `scripts/generate-content.ts` | 凍結的 Skeleton（`concepts/**`）、Problem Bank | Full Article ＝ `articles/**`；衍生 `data/**` | §20.3 品質 Gate（含 TS/Python 程式碼實測） |
| **課表生成** | `scripts/generate-schedule.ts`（F4 既有） | 凍結的 DAG、Track 參數、Overlay | 三份正式課表 ＝ `schedules/{track}.json` × 3 | 生成器內建課表驗證（determinism、拓樸子序列） |
| **CI 承接** | `content-gate.yml`（F5 既有） | 生成的 `concepts/** articles/** data/**` | — | 補入 TS/Python 程式碼實測步驟（F5 定案 2026-07-23 由本 Feature 承接） |

## Clarifications

### Session 2026-07-30

- Q: F7 需 150+ Concept 的對應題目，但 `problem-bank.json` 只有種子 8 題，題庫如何擴充（前提：題號 / 標題 /
  連結 / 難度 MUST 由程式帶入、MUST NOT 由 LLM 生成）？ → A: **LLM 提號 → 程式驗證入庫**——Stage 1 LLM 只
  提出候選 `leetcode` 題號（策展判斷），另一支 build-time 步驟從權威來源驗證題號存在並填入 title / url /
  difficulty / slug 至 Problem Bank（**不抓題目描述**，§5），LLM MUST NOT 生成任何題目 metadata；擴充後的
  bank commit 凍結，結構 Gate 檢查題號存在性，查無 / 錯號 MUST 擋下並觸發重生。metadata 來源（build-time
  即時抓取 vs. 靜態快照）為實作細節，留待 `/speckit-plan`。**此為跨 Feature 決策（影響 F3 題庫契約），已回寫
  `docs/spec.md` §12 / §20.3。**
- Q: Stage 2 Gate 對 TS/Python Corner + Tip 程式碼「可執行」的把關標準為何？ → A: **編譯 + 內嵌斷言執行**——
  TS 需 `tsc` 通過並以 `vitest`/`tsx` 執行內嵌斷言、Python 以 `pytest` 執行內嵌斷言；每個程式碼片段 MUST
  自帶最小測試（呼叫函式並斷言預期輸出），編譯通過且斷言執行成功才算過關（僅編譯或僅無例外執行不足）。
- Q: Gate 反覆擋下某篇、或 self-check 標記低信心時，自動重生成幾次後才轉例外人工介入？ → A: **3 次後
  升級人工**——每篇最多自動重生 3 次；仍不過則標記為「待人工檢視」並記錄（fail loud），MUST NOT 阻斷其餘
  Concept 的生成，MUST NOT 靜默凍結不合格產物。
- Q: 「繁體中文、技術術語 / 程式碼保留英文」如何在 Gate 機器可驗？ → A: **簡體偵測 + CJK 佔比下限**——
  程式檢查全文無簡體字、且 CJK 字元佔比達門檻（程式碼區塊與行內英文術語排除在分母外）；違反即擋下。
  觀念本體 ≤2,000 字為另一道獨立客觀檢查。

> **仍待定（`/speckit-plan` / `/speckit-tasks` 定案，非阻塞）**：Stage 1 / Stage 2 的 prompt 模板細節、批次大小
> （每批 Concept 數）與跨天排程策略、`leetcode-index.json` 快照的初始題目集合來源。
> （題目 metadata 來源已於 plan R5 定案為「靜態快照優先、線上補齊」，見 FR-003a；**CJK 佔比門檻已於 plan /
> tasks 定案為 0.5**，見 FR-008 / contracts/content-quality-gate §1。）
>
> **跨 Feature 影響提醒**：若後續定案的決策會影響其他 Feature 或屬資料契約層，MUST 依 CLAUDE.md「跨 Feature
> 決策必須落地到真實來源」回寫 `docs/spec.md`，MUST NOT 只留在本 Feature 的 spec。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stage 1：全量課綱起草，一次性大綱定稿後凍結 Skeleton (Priority: P1)

內容維運者（＝使用者本人）執行 `generate-curriculum.ts`。LLM 依 §8 的 Module 骨架與顆粒度規範，**批次起草**
涵蓋全部 16 個 Module 的完整 Concept 清單——每個 Concept 的 frontmatter（id / 依賴 / 對應題號…）與 Author Hints。
產出立刻過**結構 Gate**（DAG 無環 / 無前向依賴 / 無孤兒、顆粒度、frontmatter schema、題號存在於 Problem Bank、
id 全域唯一）。通過後生成**課綱大綱表**（`curriculum/outline.md`）。維運者花約 1～2 小時**只看方向**（顆粒度、
順序、依賴是否合理）核可定稿；核可後 Skeleton 凍結 commit。修改意見一律以「調整參數 / 提示 → 重跑 Stage 1」
處理，**不逐篇手改**。

**Why this priority**: 這是整條內容產線的起點，也是**唯一的人工檢查點**（憲章 XIV）。Skeleton 是內容的來源真相；
沒有定版的完整課綱，Stage 2 沒有可展開的骨架、F4 沒有可生成正式課表的 DAG，MVP 的「三軌全量內容」無從談起。

**Independent Test**: 在種子課綱之外執行一次 Stage 1，檢查：產出涵蓋 16 個 Module、Concept 總數 ≥150；產出通過
結構 Gate **零違規**（DAG 拓樸排序成功、無孤兒、雙向一致、所有 `leetcode` 題號存在於 Problem Bank、id 唯一）；
產出 `curriculum/outline.md` 可讀且列出 Module / Topic / Concept 清單、順序、依賴、對應題目；**在維運者未核可
定稿前，Skeleton MUST NOT 被視為凍結**（Stage 2 不得對其展開）。

**Acceptance Scenarios**:

1. **Given** `curriculum/modules.json` 定義了 16 個 Module 骨架，**When** 執行 Stage 1，**Then** LLM 起草出涵蓋
   全部 Module 的 Concept 清單（每 Topic 5～12 個、每 Module 10～30 個、總數 ≥150），且每個 Concept 具備完整
   frontmatter 與 Author Hints。
2. **Given** Stage 1 已產出 Concept 草稿，**When** 執行結構 Gate，**Then** DAG 無環、無前向依賴、無孤兒（合法起點
   除外）、`prerequisite`/`next` 雙向一致、所有 `leetcode` 題號存在於 Problem Bank、id 全域唯一——任一違規
   MUST 使 Stage 1 **不通過**且不進入定稿。
3. **Given** 結構 Gate 通過，**When** Stage 1 完成，**Then** 產出 `curriculum/outline.md`，內容為 Module / Topic /
   Concept 清單、順序、依賴與對應題目一覽，供人工一次性定稿。
4. **Given** 維運者尚未核可大綱，**When** 嘗試進入 Stage 2，**Then** 流程 MUST 拒絕展開（Skeleton 未凍結），
   MUST NOT 在未定稿的骨架上生成全文。
5. **Given** 維運者對顆粒度或順序不滿意，**When** 調整生成參數 / 提示並重跑 Stage 1，**Then** 重新產出並重新過
   結構 Gate；MUST NOT 要求維運者逐篇手改 Skeleton。

---

### User Story 2 - Stage 2：全量展開 Full Article，過品質 Gate 後凍結 (Priority: P1)

大綱定稿、Skeleton 凍結後，維運者執行 `generate-content.ts`。流程讀取凍結的 Skeleton，LLM 依 Author Hints
展開成 §10 全部固定區塊的**繁體中文詳盡教材**（Concept / Thinking / Pattern Recognition / Common Mistakes /
Complexity / TS·Python Corner / Digest / TS·Python Tip / Takeaway / Exit Criteria / Tomorrow Preview /
Today's Challenge 每題 Hint）。每篇過 §20.3 品質 Gate——**程式碼實測（最強把關）**、結構 / schema、字元預算、
DAG、題目正確性、完整編譯與 render、LLM 二次 self-check——全數通過才凍結至 `articles/**` 與衍生 `data/**`。

**Why this priority**: 這是使用者每天真正讀到的內容。沒有 Stage 2 的全量產出，每日推播的仍是 stub；有了它，
F6 管線推播的才是成體系、可執行程式碼經實測、版面通過字元預算的真實課程。

**Independent Test**: 對一批凍結的 Skeleton 執行 Stage 2，檢查：每篇 Full Article 具備 §10 全部固定區塊；
TS Corner / TS Tip 的程式碼可 `tsc` 編譯並執行、Python Corner / Tip 可執行（跑不過的 MUST 被 Gate 擋下、不凍結）；
Digest / Tips / Exit Criteria / Takeaway 各自符合 §14.5 字元預算；觀念本體 ≤2,000 字；每個 `leetcode` 題號都有
對應的 `Today's Challenge` 條目與 `whyThisPattern` / Hint；全 Track × 全 Session 經 Lesson Compiler 編譯並 render
通過 Discord 限制。

**Acceptance Scenarios**:

1. **Given** 一份凍結的 Skeleton，**When** 執行 Stage 2 展開，**Then** 產出的 Full Article 具備 §10 全部固定區塊
   （閱讀用 8 段 + 推播用 4 段 + Today's Challenge），缺任一區塊 MUST 使該篇不通過。
2. **Given** Full Article 含 TS / Python 程式碼（各片段自帶最小斷言），**When** 品質 Gate 執行程式碼實測，
   **Then** TS 程式碼 `tsc` 編譯通過且 `vitest`/`tsx` 斷言成功、Python 程式碼 `pytest` 斷言成功；任一編譯失敗 /
   斷言失敗 / 缺斷言 MUST 擋下該篇並觸發重生，MUST NOT 凍結。
3. **Given** Full Article 的推播區塊，**When** Gate 檢查字元預算，**Then** Digest ≤900、TS/Python Tip 各 ≤450、
   每題 ≤350（最多 3 題）、Exit Criteria ≤400、Takeaway ≤120、footer ≤200、單則全 embeds ≤5,500——任一超限
   MUST 擋下並重生，MUST NOT 截斷凍結。
4. **Given** Full Article 的 `Today's Challenge`，**When** Gate 檢查題目正確性，**Then** 每個 `leetcode` 題號存在於
   Problem Bank、`url` slug 與 bank 一致；題號 / 連結 / 難度 MUST 由程式從 Problem Bank 帶入，MUST NOT 由 LLM 生成。
5. **Given** 全部 Skeleton 已展開，**When** 對全 Track × 全 Session 執行完整編譯與 render，**Then** 全數通過 Discord
   限制（§14.5），任一 Session 編譯或 render 或預算失敗 MUST 使 Gate 不通過。
6. **Given** LLM 二次 self-check 對某篇標記低信心（複雜度推導 / Pattern 適用性 / 前後矛盾），**When** Gate 處理，
   **Then** 該篇 MUST 重生成或轉入例外人工介入，MUST NOT 直接凍結。

---

### User Story 3 - 課綱凍結後生成三份正式課表，取代種子課表 (Priority: P1)

大綱定稿、Skeleton 凍結後，維運者執行 F4 既有的 `generate-schedule.ts`，以凍結的完整 DAG、三組 Track 參數與
Overlay 生成**三份約 180-Session 的正式課表**（`schedules/{track}.json` × 3），determinism（同輸入 →
byte-identical）、拓樸子序列合法，commit 取代 F4 種子課表。

**Why this priority**: 課表是每日管線挑「今天哪一課」的依據。種子課表只有十餘課，走完即完課；換上正式 180-Session
課表，三軌才有完整課程可推（並觸發 F6 的完課狀態自動解除 FR-022b）。

**Independent Test**: 對凍結的正式 DAG 執行 `generate-schedule.ts` 兩次，比對兩次輸出 byte-identical；驗證三份
課表皆通過拓樸子序列合法性檢查、`reviewRange` / 參照完整；課表長度達約 180 Session。

**Acceptance Scenarios**:

1. **Given** 完整 DAG 已凍結、三組 Track 參數與 Overlay 已定義，**When** 執行 `generate-schedule.ts`，**Then** 產出
   三份約 180-Session 的正式課表，取代 F4 種子課表。
2. **Given** 同一份輸入，**When** 連續執行兩次生成器，**Then** 兩次輸出 **byte-identical**（AC9 前半）。
3. **Given** 生成的課表，**When** 執行生成器內建驗證，**Then** 每份課表為 DAG 的合法拓樸子序列、`reviewRange` 與
   Concept 參照完整——任一違規 MUST 使生成失敗。

---

### User Story 4 - 免費層額度內以節流／退避／斷點續跑完成全量批次 (Priority: P1)

全量產線約需 600～800 次 LLM 呼叫，遠超 Gemini 免費層單日額度，MUST 分 2～4 天批次跑完。兩支生成腳本 MUST
內建：RPM 節流、429 指數退避 + jitter、斷點續跑（已生成且過 Gate 的 Concept 跳過、中斷後從缺漏處續跑）、
冪等（不覆蓋已凍結且未變更 Skeleton 的 Article，除非 `--force`）。

**Why this priority**: 沒有這份韌性，任何一次額度耗盡 / 429 / 當機都會讓整批從頭再來，全量產線在免費層下根本
跑不完（憲章 XVI free-tier only）。它是 Stage 1 / Stage 2 能否實際完成的前提。

**Independent Test**: 在生成到一半時中斷腳本，重跑：檢查已完成且過 Gate 的 Concept 被跳過、只從缺漏處續跑；
對已凍結且 Skeleton 未變更的 Article 重跑 MUST 不重新生成（除非 `--force`）；模擬 429 回應 MUST 觸發退避重試
而非直接失敗。

**Acceptance Scenarios**:

1. **Given** 產線正在批次生成，**When** 中途中斷後重跑，**Then** 已生成且通過 Gate 的 Concept MUST 被跳過，
   僅從缺漏處繼續（checkpoint resume）。
2. **Given** 某 Article 已凍結且其 Skeleton 未變更，**When** 重跑 Stage 2，**Then** 該 Article MUST NOT 被重新
   生成（冪等）；帶 `--force` 時 MUST 才重生。
3. **Given** LLM 服務回傳 429（額度 / 限流），**When** 產線處理，**Then** MUST 以指數退避 + jitter 重試，
   MUST NOT 直接判為失敗中止整批。
4. **Given** 免費層 RPM 限制，**When** 產線持續呼叫，**Then** MUST 主動節流至限制內，MUST NOT 以高於限制的
   速率送出而觸發封鎖。

---

### User Story 5 - CI content-gate 補入程式碼實測，生成內容持續受把關 (Priority: P2)

F5 交付 `content-gate.yml` 時 repo 內只有 stub / fixture，無真實素材可驗，故未放程式碼實測步驟。本 Feature 有了
真實教材後，MUST 補入 TS/Python 程式碼實測步驟至**同一支** `content-gate.yml`，使日後對 `concepts/** articles/**
data/**` 的任何變更，其程式碼都在 CI 被實際編譯與執行。

**Why this priority**: 它保障「凍結後的內容持續正確」，但不阻擋「本次全量內容產出」這個核心價值——本地 Stage 2
Gate 已做同一件事；CI 步驟是把這道把關固化進合併流程，故列 P2。

**Independent Test**: 對一份程式碼故意寫錯（無法編譯 / 執行）的 Article 開 PR，CI 的 `content-gate.yml` MUST 失敗
並阻擋合併；修正後 MUST 通過。

**Acceptance Scenarios**:

1. **Given** `content-gate.yml` 已補入程式碼實測步驟，**When** 對含可執行 TS/Python 的教材開 PR，**Then** CI MUST
   實際 `tsc` 編譯並執行 TS、執行 Python，跑不過 MUST 使 CI 失敗並阻擋合併。
2. **Given** 程式碼實測步驟與既有結構 / 預算檢查，**When** CI 執行，**Then** 兩者 MUST 於**同一支 workflow** 執行，
   MUST NOT 另建平行 Gate（憲章 IX：Gate 與 runtime 共用同一顆 Compiler）。

---

### Edge Cases

- **結構 Gate 反覆擋下 Stage 1**（DAG 前向依賴 / 環 / 孤兒 / 顆粒度違規）：MUST 明確報出違規清單（依 F2 既有
  違規格式）供調整生成參數，MUST NOT 靜默通過或自動補齊缺漏的依賴方向（§8.3：MUST NOT 自動補齊雙向一致）。
- **LLM 生成引用了不存在於 Problem Bank 的題號**：結構 Gate MUST 擋下（題號存在性檢查）；題號 / 連結 / 難度
  MUST 由程式從 Problem Bank 帶入，LLM MUST NOT 憑空生成事實資料（§5 / §11 / 憲章反面）。
- **Stage 2 生成的程式碼跑不過**（`tsc` 失敗 / runtime 例外 / 測試失敗）：品質 Gate 的程式碼實測 MUST 擋下該篇、
  觸發重生，MUST NOT 凍結有問題的程式碼。
- **生成的推播區塊超出字元預算**：Gate MUST 擋下並重生，MUST NOT 截斷後凍結（截斷會使教學內容殘缺）。
- **觀念本體超過 2,000 字**：MUST 擋下並重生 / 拆分（§10.3；「內容過長 MUST 拆成多個 Concept，MUST NOT 硬塞」
  — 憲章 I / §4-1）。
- **LLM self-check 標記低信心或前後矛盾**：MUST 重生成或轉例外人工介入，MUST NOT 直接凍結。
- **產線中斷（斷網 / 當機 / 額度耗盡）後重跑**：MUST 從 checkpoint 續跑，已過 Gate 者跳過，MUST NOT 從頭重來。
- **維運者事後手動修訂某份 Skeleton**：重跑 Stage 2 時 MUST 只重生受影響的該篇 Article（依 Skeleton 變更偵測），
  MUST NOT 因此重生全部；未變更者維持凍結。
- **大綱未定稿即嘗試 Stage 2**：MUST 拒絕（Skeleton 未凍結不得展開）——唯一人工檢查點的凍結是 Stage 2 的前提。
- **部分 Concept 生成失敗、其餘成功**：成功者照常過 Gate 凍結，失敗者留待重跑（fail loud：記錄哪些缺漏），
  MUST NOT 因單篇失敗回滾整批已凍結產出。
- **`GEMINI_API_KEY` 缺失**（本機忘了設 / CI 誤觸發）：內容產線 MUST fail-fast 並明確報「缺金鑰」，MUST NOT
  靜默產出空內容；每日 `daily.yml` 則本就 MUST NOT 含此金鑰（憲章 VIII）。
- **`@google/genai` 被誤 import 進 `src/`**：MUST 由既有 CI 檢查擋下（憲章 VIII：LLM SDK 只允許在 `scripts/`
  依賴路徑）；本 Feature 引入 SDK 時 MUST 確認其只出現在 `scripts/`。
- **生成物與種子並存**：全量凍結後 MUST 清理 / 取代 F2 / F5 的種子 Skeleton 與 fixture Article、F4 種子課表，
  MUST NOT 讓 stub 殘留污染正式素材（SC-001 的 0 殘留）。

## Requirements *(mandatory)*

### Functional Requirements

**Stage 1：課綱與 Skeleton 起草（`scripts/generate-curriculum.ts`）**

- **FR-001**: `generate-curriculum.ts` MUST 以 LLM 批次起草涵蓋 `curriculum/modules.json` 全部 16 個 Module 的
  完整 Concept 清單，每個 Concept 產出 §10.1 frontmatter 全部欄位與 §10.4 Author Hints 提示段，總數 ≥150。
- **FR-002**: 顆粒度 MUST 符合 §8 規範：每 Topic 5～12 個 Concept、每 Module 10～30 個 Concept；違反 MUST 由
  結構 Gate 報為違規。
- **FR-003**: Stage 1 產出 MUST 通過**結構 Gate**（重用 F2 的 `src/compiler/curriculum.ts` 單一驗證實作，
  §8.3）：DAG 拓樸排序成功、無環、無前向依賴、無孤兒（合法起點除外）、`prerequisite`/`next` 雙向一致、
  所有 `leetcode` 題號存在於 Problem Bank、frontmatter schema（zod）符合、id 全域唯一。任一違規 MUST 使
  Stage 1 不通過、不進入定稿。
- **FR-003a**（**題庫擴充機制**，2026-07-30 定案，回寫 `docs/spec.md` §12 / §20.3）: Stage 1 的 LLM MUST 只
  提出候選 `leetcode` **題號**（哪一題適合此 Pattern，屬策展判斷）；一支 **build-time 題庫擴充步驟** MUST 從
  權威來源驗證每個候選題號**真實存在**並填入 `title` / `url` / `difficulty` / `slug` 至 `data/problem-bank.json`，
  **MUST NOT 抓取或轉載題目描述**（§5），且 LLM MUST NOT 生成任何題目 metadata（憲章：題號 / 連結 / 難度由
  程式帶入）。擴充後的 Problem Bank MUST commit 凍結（後續重跑可重現）；FR-003 的結構 Gate 以此 bank 檢查題號
  存在性，查無 / 錯號 MUST 擋下並觸發 Stage 1 重生。
  - **候選題號 MUST 遵守 §12.1**：每個宣告 ≥1 題的 Concept 對應 **1～3 個**題號、`leetcode` 陣列**不得含重複**；
    LLM 產生超量 / 重複由 §12.1 既有守門（`problem.ts`）擋下。**`leetcode: []` 的「無題目觀念課」為一等合法
    狀態**（如 Programming Mindset 的複雜度 / 讀題等基礎觀念）：題庫擴充與存在性檢查對其 MUST 回傳/視為
    空清單、MUST NOT 報錯。
  - **metadata 來源（plan 定案，R5）**：採「**committed 靜態快照（`data/leetcode-index.json`）優先、線上
    metadata 補齊**」——產線與 CI 只讀快照即可離線、可重現；快照缺項時以線上 metadata 端點補齊後寫回快照。
    只取 metadata、不取題目描述（§5）。
- **FR-004**: Stage 1 MUST 產出**課綱大綱表** `curriculum/outline.md`，內容為 Module / Topic / Concept 清單、
  順序、依賴與對應題目一覽，供人工一次性定稿。
- **FR-005**: **唯一人工檢查點（MUST，憲章 XIV / §4-17）**：大綱定稿是整條產線唯一的常態性人工介入；維運者
  核可 `outline.md` 後 Skeleton 凍結 commit。凍結前 Skeleton MUST NOT 被視為可展開；MUST NOT 新增任何其他
  常態性人工審核關卡（Gate 反覆擋下 / self-check 低信心的例外介入除外）。
- **FR-006**: 修訂意見 MUST 以「調整生成參數 / 提示 → 重跑 Stage 1」處理；MUST NOT 要求維運者逐篇手改 Skeleton
  作為常態流程（維運者事後 MAY 手動修訂個別 Skeleton，屬非常態）。

**Stage 2：全文展開（`scripts/generate-content.ts`）**

- **FR-007**: `generate-content.ts` MUST 讀取**凍結的** Skeleton（`concepts/**`），依 Author Hints 展開為 §10 全部
  固定區塊的 Full Article（`articles/**`）：閱讀用 8 段（Concept / Thinking / Pattern Recognition / Common
  Mistakes / Complexity / TypeScript Corner / Python Corner / Tomorrow Preview）＋推播用 4 段（Digest /
  TypeScript Tip / Python Tip / Takeaway）＋ Exit Criteria ＋ Today's Challenge（每題 Hint）。
  - **每個 Concept MUST 只產生一份 Article**（三軌共用同一正文，憲章 VI）；Track 差異一律走課表涵蓋深度
    ＋ Overlay 題目難度帶＋頻道，MUST NOT 逐軌複製或改寫正文。
  - **「凍結」的可機驗前提（MUST）**：Stage 2 執行前 MUST 確認 Skeleton 已定稿凍結——以「工作目錄的
    `concepts/**` 無未提交變更」作為凍結代理；未凍結（有未提交變更）時 MUST 拒絕展開並明確報「Skeleton
    未定稿」（開發除錯得以顯式 `--allow-dirty` 繞過，正式產線 MUST NOT 使用）。
- **FR-008**: Full Article MUST 以**繁體中文**撰寫，但技術術語 / Pattern 名稱 / API / 類別 / 函式名 / 程式碼
  MUST 保留英文（§11 / CLAUDE.md）。
  - **「觀念本體」的界定（MUST，依 §10.3）**：指 `Concept` / `Thinking` / `Pattern Recognition` /
    `Common Mistakes` 的**敘述性文字**，其中文字數 MUST ≤2,000 字（獨立的客觀字數檢查）。**不計入**此上限：
    `TypeScript Corner` / `Python Corner`、程式碼區塊、`Today's Challenge`、`Complexity` 的算式。
  - **繁中的機器可驗判準（MUST）**：Gate MUST 對「散文文本」（**先移除 fenced 程式碼區塊、行內 `code`、
    frontmatter** 後的其餘文字）檢查兩項：**① 無簡體字**（比對簡體專用字集，命中即違規）；**② CJK 字元佔比
    ≥ 門檻**（CJK 字數 ÷（CJK 字數 + 拉丁字母詞數），**預設 0.5**，確切值於 `/speckit-plan` 定案）。散文中的
    英文技術術語**計入分母**——門檻刻意設寬，使正常夾帶英文術語的繁中段落可通過，只擋下「整段英文/疑似未
    譯」。此判準**不需**辨識「哪個英文是術語」（不可靠），只依機械可辨的程式碼/行內 code 邊界。違反任一項
    MUST 擋下並重生。
- **FR-009**: Full Article 的 `Today's Challenge` MUST 為每個 `leetcode` 題號產出對應條目與 `whyThisPattern` 一句話
  ＋ Hint（§13 / §22.5）；題號 / 連結 / 難度 MUST 由程式從 Problem Bank 帶入，MUST NOT 由 LLM 生成（§5 / 憲章）。
- **FR-010**: Stage 2 每篇 MUST 通過 §20.3 全部品質 Gate 才凍結：
  1. **程式碼實測（編譯 + 內嵌斷言執行）**：TS Corner / TS Tip MUST `tsc` 編譯通過且以 `vitest`/`tsx` 執行
     **內嵌斷言**、Python Corner / Tip MUST 以 `pytest` 執行**內嵌斷言**；每個程式碼片段 MUST 自帶最小測試
     （呼叫函式並斷言預期輸出），**編譯通過且斷言執行成功**才算過關——僅編譯通過、或僅「執行不拋例外」
     均 MUST NOT 視為通過。**「含斷言」為機器可判**：TS 區塊 MUST 出現 `throw` 或 `node:assert`、Python 區塊
     MUST 出現 `assert`；**未出現斷言者視同不通過**。跑不過 MUST 擋生成並觸發重生。程式碼實測的暫存檔 MUST
     建於系統暫存區、用後清理，MUST NOT 寫入 repo 工作目錄、MUST NOT 殘留。
  2. **結構 / schema**：§10 固定區塊都在、frontmatter schema（zod）符合、觀念本體 ≤2,000 字。
  3. **字元預算**：Digest / Tips / Exit Criteria / Takeaway 各自符合 §14.5 預算（Gate 對每一筆 render 結果逐一
     檢查）。超限 MUST 擋下並重生，**MUST NOT 截斷後凍結**（截斷會使教學內容殘缺）。
  4. **DAG 驗證**：`prerequisite` / `next` 無環 / 無前向依賴 / 參照完整。
  5. **題目正確性**：`leetcode` 題號存在於 Problem Bank、`url` slug 與 bank 一致。
  6. **完整編譯與 render**：呼叫 Lesson Compiler（§7.1）對所有 Track × 所有 Session 編譯並 render，驗證 §14.5
     Discord 限制全數通過。
  7. **LLM 二次 self-check**：對「複雜度是否正確、Pattern 適用性、前後是否矛盾」批判；不合格 MUST 重生成。
     此關**為生成期專屬**（需 LLM 金鑰），MUST NOT 進入 CI（見 FR-016）。
  - **關卡 1–6 為純檢查（無 LLM）**，MUST 於生成期與 CI **同一實作**執行（憲章 IX）；關卡 7 只在生成期。
- **FR-011**: 品質 Gate 的完整編譯 / render / 預算檢查 MUST **重用每日 runtime 所用的同一顆 Compiler / Renderer /
  預算檢查實作**（憲章 IX），MUST NOT 為產線另建平行的編譯或版面邏輯。
- **FR-012**: Gate 擋下、或 self-check 標記低信心時 MUST **自動重生成，每篇上限 3 次**（per-Concept 計數，非整批
  合計）；3 次仍不過則標記為「待人工檢視」並記錄（fail loud，§20.4 的 2～4 次緩衝內取 3），轉入**例外人工
  介入**（僅此情形）。單篇升級人工 MUST NOT 阻斷其餘 Concept 的生成、MUST NOT 靜默凍結不合格產物；其餘
  正常者 MUST 自動凍結入庫。MUST NOT 把例外介入變成常態關卡。
  - **「待人工檢視」篇在後續重跑時 MUST 重新嘗試**（該篇未凍結、不算通過）：MUST NOT 因曾被標記而永久靜默
    跳過（那會使不合格內容變成無聲失敗，違反憲章 XV）；仍未解決前，該篇 MUST 持續使整批以非零 exit 結束。
- **FR-013**: Stage 2 凍結產物為 `articles/**` 與衍生 `data/**`；凍結後即定版（憲章 XIII），重新生成 MUST 為刻意的
  build-time 行為，MUST NOT 於每日 runtime 發生。

**課表生成與 CI 承接**

- **FR-014**: 大綱定稿後 MUST 執行 F4 既有 `generate-schedule.ts`，以凍結的完整 DAG、三組 Track 參數與 Overlay
  產出三份約 180-Session 正式課表（`schedules/{track}.json` × 3）並 commit，取代 F4 種子課表。生成 MUST
  determinism（同輸入 → byte-identical，§13.4），MUST NOT 手改生成物。
- **FR-015**: 三份課表 MUST 各自通過生成器內建驗證：為 DAG 的合法拓樸子序列、`reviewRange` 與 Concept 參照完整。
- **FR-016**: MUST 於 `content-gate.yml`（F5 既有，§21.3）補入 TS/Python 程式碼實測步驟（§20.3 Stage 2-1），與
  既有結構 / 預算 / 編譯檢查於**同一支 workflow** 執行；Gate 不通過 MUST 阻擋合併。MUST NOT 另建平行 Gate。
  - **CI 跑的關卡範圍（MUST）**：`content-gate.yml` 執行 FR-010 的**關卡 1–6（純檢查 + 程式碼實測）**，
    MUST NOT 執行關卡 7（LLM self-check）。因此 `content-gate.yml` MUST 可在**無任何 LLM 金鑰**下執行
    （憲章 VIII）；MUST NOT 於此 workflow 引入 `GEMINI_API_KEY`。

**產線韌性（§20.4，MUST）**

- **FR-017**: `generate-curriculum.ts` 與 `generate-content.ts` MUST 內建 **RPM 節流**，依 Gemini 免費層限制主動限速。
- **FR-018**: 兩支腳本 MUST 對 **429 / 5xx / 網路暫時性**回應以**指數退避 + jitter** 重試（重試上限見 plan），
  MUST NOT 直接判失敗中止整批；**非暫時性錯誤**（如 4xx 參數/授權錯誤）MUST 直接失敗、不進退避。
  - **退避耗盡的終局（MUST）**：重試上限用盡仍失敗時，該次呼叫對應的 Concept MUST 計為**待重跑**（不凍結、
    不算通過）、以非零 exit 結束，且 **checkpoint MUST 保留**——下次重跑從缺漏處續跑（FR-019），MUST NOT
    因此丟失已完成進度。
- **FR-019**: 兩支腳本 MUST 具備**斷點續跑（checkpoint resume）**：已生成且通過 Gate 的 Concept MUST 跳過；中斷後
  重跑從缺漏處繼續。
- **FR-020**: 兩支腳本 MUST **冪等**：重跑 MUST NOT 覆蓋已凍結且未變更 Skeleton 的 Article；帶 `--force` 時 MUST 才
  重生。Skeleton 變更偵測 MUST 只重生受影響的該篇。
  - **局部重生旗標**：除錯 / 局部重生 MAY 以 `--only <conceptId,...>` 限定只處理指定 Concept，對該範圍比照
    `--force` 重新處理（見 data-model §7 / contracts/stage2-content §1・§4）；未帶 `--only` / `--force` 時冪等語意不變。
- **FR-021**: 產線 MUST 只傳送公開資料（Concept 標題 / Author Hints / 題目 metadata）給 LLM，MUST NOT 涉及機密。

**憲章護欄（本 Feature MUST 維持）**

- **FR-022**: LLM 使用 MUST 限於 **build-time**（本機或手動 `workflow_dispatch`）；`GEMINI_API_KEY` MUST NOT 出現在
  `daily.yml`（憲章 VIII / §4-8）。模型 MUST 為 `gemini-3.5-flash-lite`（§20.4；憲章 v1.0.2 釘死）。
- **FR-023**: LLM SDK（`@google/genai`）MUST 只出現在 `scripts/` 的依賴路徑，`src/` MUST NOT import（憲章 VIII）；
  本 Feature 引入 SDK 時 MUST 確認既有的 `src/` 匯入禁止檢查仍生效。
- **FR-024**: 大綱定稿凍結後，LLM MUST NOT 未經人為觸發即變更課綱結構 / 重排 / 生成學習順序（順序為 deterministic，
  憲章 II / §20.1）；題號 / 連結 / 難度 MUST NOT 由 LLM 竄改（一律由程式從 Problem Bank 帶入）。
- **FR-025**: 缺 `GEMINI_API_KEY` 時內容產線 MUST fail-fast 並明確報錯，MUST NOT 靜默產出空 / 不完整內容（憲章 XV
  Fail loud）。
- **FR-026**: 全量凍結後 MUST 取代 / 清理 F2 種子 Skeleton、F5 fixture Article、F4 種子課表，MUST NOT 讓 stub 殘留
  混入正式素材。

### Key Entities

- **Curriculum Outline（課綱大綱表）**：`curriculum/outline.md`——Stage 1 產出、整條產線**唯一的人工定稿物**；
  列 Module / Topic / Concept 清單、順序、依賴、對應題目。
- **Concept Skeleton（骨架）**：`concepts/{topic}/{NNN}-{slug}.md`——frontmatter（§10.1）＋ Author Hints（§10.4）；
  Stage 1 起草、定稿後凍結，內容的**來源真相**。
- **Full Article（全文）**：`articles/{topic}/{NNN}-{slug}.md`——Stage 2 依 Skeleton 展開的 §10 全部固定區塊
  ＋可執行程式碼；過 §20.3 Gate 後凍結；Compiler 只讀這份。
- **Problem Bank**：`data/problem-bank.json`（F3 來源真相）——題號 / 標題 / 連結 / 難度 metadata；Stage 1 題號
  存在性、Stage 2 題目正確性皆以此為準；LLM MUST NOT 竄改。
- **Track Schedule（正式課表）**：`schedules/{track}.json` × 3——大綱凍結後由 `generate-schedule.ts` 生成的
  約 180-Session 課表；determinism、拓樸子序列合法。
- **Checkpoint / 生成進度標記**：記錄哪些 Concept 已生成且過 Gate，供斷點續跑與冪等判斷；MUST NOT 進 `main`/
  `develop` 的常態產物語意混淆（是產線工作狀態，非教材）。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 三軌全部 Session（各約 180 堂）皆有可編譯、可渲染、通過字元預算的正式教材，種子 / stub **0 殘留**。
- **SC-002**: Stage 1 產出涵蓋全部 16 個 Module、Concept 總數 ≥150，且通過結構 Gate **零違規**（DAG / 顆粒度 /
  frontmatter schema / 題號存在 / id 唯一）。
- **SC-003**: Stage 2 全量產出通過 §20.3 全部品質 Gate（含 TS/Python 程式碼在 CI **編譯 + 內嵌斷言執行**、
  字元預算、全 Track × 全 Session 完整編譯 + Discord 限制）**零違規**才凍結。
- **SC-004**: 整條產線的常態性人工介入**恰為一次**（大綱定稿），耗時約 1～2 小時；其餘全自動。
- **SC-005**: 全量產線可在 Gemini 免費層額度內以 **2～4 天分批完成**（≈600～800 次呼叫），無需付費、無需升級方案。
- **SC-006**: 中斷後重跑 100% 從缺漏處續跑，已凍結且未變更 Skeleton 者 **0 重新生成**（除非 `--force`）。
- **SC-007**: 每日 runtime 仍**零 LLM**——`daily.yml` 無任何 LLM 金鑰、`src/` 無 LLM SDK import（既有 CI 檢查
  持續通過）。
- **SC-008**: `generate-schedule.ts` 對正式 DAG 同輸入產出 **byte-identical** 課表（AC9 前半）。
- **SC-009**: 100% 教材觀念本體 ≤2,000 字、以繁體中文撰寫且技術術語保留英文（§10.3 / §11），並通過 Gate 的
  機器可驗繁中檢查（無簡體字 + CJK 佔比達門檻）。
- **SC-010**: CI `content-gate.yml` 對程式碼無法編譯 / 執行的教材變更 **100% 阻擋合併**。

## Assumptions

- **Problem Bank 由 F7 擴充、為來源真相**（2026-07-30 clarify 定案，見 FR-003a）：F3 交付的 `problem-bank.json`
  為 8 題種子（其註解已載明 Hard / 全量覆蓋延至 F7 課綱凍結後補齊）。本 Feature 以「LLM 提候選題號 → build-time
  步驟從權威來源驗證並填入 metadata → commit 凍結」擴充題庫至涵蓋全部 Concept；題目事實 metadata MUST NOT
  由 LLM 生成（憲章 / §5）。此為跨 Feature 決策，已回寫 `docs/spec.md` §12 / §20.3。
- **prompt 模板 / 批次大小為 plan / tasks 待定項**：本 spec 以合理預設描述行為；prompt 模板細節、每批 Concept
  數與跨天排程、CJK 佔比門檻確切值、`leetcode-index.json` 初始題目集合來源於 `/speckit-plan` / `/speckit-tasks`
  定案。（Gate 通過門檻、程式碼實測標準、繁中判準、重生上限、題目 metadata 來源＝靜態快照優先已定案。）
- **模型釘死 `gemini-3.5-flash-lite`**：依 §20.4 與憲章 v1.0.2，本 Feature 不重新評估型號；若免費層資格變動，
  屬憲章 PATCH 修訂流程，非本 Feature 範圍。（2026-07-21 官方發布 `gemini-3.5-flash-lite` 後，已由憲章
  v1.0.1 → v1.0.2 完成一次此類 PATCH，同步更新本 Feature 全部引用處。）
- **內容正確性的殘餘風險為可接受權衡**（§20.3 風險披露）：Gate + 大綱定稿消除結構 / 程式碼 / 參照 / 版面類
  錯誤與方向性偏差，但不保證教學敘述 100% 正確；純自用場景下上線後邊用邊修（改 Skeleton → 重跑展開）。
- **執行環境**：Stage 1 / Stage 2 於本機或手動 `workflow_dispatch` 執行（Windows / PowerShell 本機 + Node 24），
  非每日排程；`GEMINI_API_KEY` 由環境變數 / Secrets 提供，MUST NOT 寫入檔案。
- **與 F5 / F6 並行**：本 Feature 產出的凍結內容替換 stub 後，F6 管線即推播真實課程；兩者可並行開發，F7 的
  合併不改動 F5 / F6 已定案的 Compiler / Renderer / 管線行為（僅補 `content-gate.yml` 的實測步驟）。

## Dependencies

- **F2 `002-curriculum-schema`**：Concept frontmatter schema、`curriculum/modules.json` 16-Module 骨架、
  DAG 驗證單一實作（`src/compiler/curriculum.ts`，Stage 1 結構 Gate 重用）。
- **F3 `003-problem-bank`**：`data/problem-bank.json` 與題庫驗證（Stage 1 題號存在性、Stage 2 題目正確性）。
- **F4 `004-schedule-generator`**：`generate-schedule.ts`、三組 Track 參數、Overlay schema（大綱凍結後產正式課表）。
- **F5 `005-lesson-compiler`**：Lesson Compiler / Renderer / 預算檢查（Stage 2 Gate 的完整編譯與 render 重用）、
  `content-gate.yml`（本 Feature 補入程式碼實測步驟）。
