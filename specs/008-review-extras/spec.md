# Feature Specification: Weekly Review 素材、鼓勵語錄池與 review 版面完善（含移除 rest 槽）

**Feature Branch**: `008-review-extras`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "feature 008-review-extras"

## 背景與目的

本 Feature 是 LeetCode Daily Coach 的第八個切片（對應 `docs/spec.md` §22.5 **F8**、§15、§20、里程碑 **M4**），
依賴 F6（`006-pipeline-mvp`，每日端到端管線）與 F7（`007-content-generation`，全量課綱與教材）。

F1～F7 走完後，MVP（M3）已經成立：三個頻道每日自動推播「一則觀念 ＋ 1～3 題」。但**每週有兩天是空的**。

- **`review`（週複習）**：`docs/spec.md` §15 明訂 review Session MUST 含三段——`Review`（本週涵蓋的
  Concept 清單）、`Reflection`（一個反思問題）、`Challenge`（一題綜合題）。目前**只有第一段成立**：
  Compiler 依 `reviewRange` 推導出 Concept 清單，但 `reflectionQuestion` 沒有素材來源（`data/reflection-bank.json`
  尚未建立），課表生成器也**從未為 review 槽選過題**（`emitSessions` 的 `review` 分支只寫 `reviewRange`，
  不寫 `problemIds`），因此 Challenge 段永遠是空的。三段中有兩段缺席。
- **`rest`（休息日）**：§14.3 原訂 rest 為「一句簡短鼓勵（內建語錄池決定性輪替）＋ 本週回顧提示」。
  目前只有一句寫死的 `REST_DESCRIPTION`，`encouragement` 沒有素材來源（`data/encouragement.json` 尚未建立）。
  **本 Feature 定案移除 rest 槽**（見下方 Clarifications），鼓勵語改掛至 review Session。

這些缺口**不是遺漏，而是 F5 的刻意設計**（§15「F8 之前的過渡規則」，F5 定案 2026-07-23）：素材與版面分屬
不同 Feature，F5 先把 `reflectionQuestion` / `encouragement` 定義為選配欄位、把逐區塊預算（≤300 / ≤200）
先放進 `checkBudget`、並要求「素材檔缺席時 Renderer MUST 省略該段落」，就是為了讓 F8 灌入素材後，**版面在
不修改 Compiler / Renderer 版面邏輯的前提下自動長出**。

**本 Feature 交付的是「把缺席的素材補齊，並讓 review 的四段真的長出來」**：

1. **Weekly Reflection 題庫**（`data/reflection-bank.json`）——build-time 生成、過 Gate、凍結。
2. **鼓勵語錄池**（`data/encouragement.json`）——build-time 生成、過 Gate、凍結，**掛載於 review Session**。
3. **決定性輪替規則**——Compiler 依 `sessionIndex` 從凍結素材中選取，同一 `(track, sessionIndex)` 永遠選到同一則。
4. **review 槽的 Challenge deterministic 選題**——由 `generate-schedule.ts` 於課表生成階段定案並寫入
   `problemIds`，三份正式課表重跑並 commit。
5. **review 版面完善**——在既有 Renderer 分支上補足呈現，維持純函式與 slot⇄field 對等不變式。
6. **節奏與槽位產生規則修訂**——(a) `track-params.json` 三軌 rhythm 移除 rest 槽（7 → 6）、放寬
   `validateRhythm` 的 rest 必要性檢查；(b) 生成器**跳過選不到題目的 `practice` / `challenge` 槽**
   （`review` 一律保留）；(c) 重跑三份課表（**198 / 200 / 243**）。此為 F4 / F7 的參數與生成器決策，
   但 (a) 會使 `encouragement` 失去唯一消費者、(b) 是檢視 review 空 Challenge 段時才浮現的同類問題，
   兩者 MUST 與本 Feature 一併定案與執行。

**每日 runtime 仍然零 LLM**：本 Feature 新增的兩份素材檔與課表變更全部是 build-time 產物，凍結後 commit 入
repo；`daily.yml` 依舊不含 `GEMINI_API_KEY`（憲章 VIII）。

**對應驗收基準**：`docs/spec.md` §22.5 F8 驗收（「review Session **四段**齊備且全部素材為凍結內容；每日
runtime 仍零 LLM」）、里程碑 **M4**、§23 Phase 3。

## Clarifications

### Session 2026-08-01

- Q: rest 的「本週回顧提示」應為固定文案、動態列出本週涵蓋 Concept、還是固定文案＋動態進度？
  → A: 皆非——**直接移除 rest 槽**。三軌 rhythm 由 7 槽縮為 6 槽，課表長度縮短約 14.3%
  （243/236/291 → 208/202/249；後續再因「跳過無題槽」降至 198/200/243），涵蓋的 Concept 數不變。
  理由：§3 Learning Philosophy 未列 Rest、
  憲章亦無對應原則，且 §19「漏跑不跳課」已使任意休息零成本，固定休息日屬重複保障。
- Q: rest 移除後 `encouragement` 失去唯一消費者，應改掛何處或直接砍除？
  → A: **改掛至 `review` Session**（每週仍有一句鼓勵）。`RestLesson` 的 `encouragement` 欄位與 rest
  版面保留不刪，使「是否排休息日」維持為 `track-params.json` 的參數選擇。
- Q: `reviewRange` 橫跨多個 Topic 時，Reflection 問題的歸屬 Topic 如何決勝？
  → A: **取最早引入者**（`reviewRange` 內第一個 concept Session 所屬的 Topic），並列時以 §16.1 的全序
  `ordinalOf` 決勝。理由是與 §14.3 既有的「取較早引入者」決勝慣例同向——同向規則好記、好測、好維護；
  記憶曲線的考量在此僅為 3 天差距（最早與最晚的 concept 槽相隔 3 個 Session），不足以支撐反向規則。
- Q: review 槽 Challenge 的候選池範圍為何（本週 / 全部已引入 / 混合）？難度帶取 `challengeDifficulty`
  還是 `problemDifficulties`？
  → A: **本週 `reviewRange` 涵蓋的 concept Session 的題目聯集，優先取難度最低者、同難度取最小題號，
  並排除同週 `challenge` 槽已選的題號**。`challengeDifficulty` 不被 review 槽使用（維持只服務 challenge 槽）。
  **關鍵事實**：`selectConceptProblems` 會把該 Concept 在該 Track 難度帶內的題目**全部**推出，故本週題目
  在 concept 日即已發完——review 的題必然是本週已看過的題，本質是**重做**而非進階挑戰，正合 review 的
  「複習、反思」定位（`practice` 槽的 `unionProblems` 已是同一設計）。「優先取最低難度」確保 Foundation
  在該週有 Easy 題時必取 Easy，不會出現 review 比 challenge 日更難的反轉。
  **實測依據**：限縮本週但沿用 `challengeDifficulty` 會使 Foundation 23～29%、InterviewMastery ≥67% 的
  review 無題（全 165 個 Concept 僅 14 個帶 Hard 題）；改用本週題目聯集後，省略降至
  **Foundation 4 / InterviewReady 3 / InterviewMastery 3 週**——全部落在「該週 Concept 全為
  `leetcode: []`」的情境（全課綱 27 個純觀念 Concept 中，`programming-mindset` 的 10 個相鄰者造成
  課程開頭 2～3 週，另有各軌 1 週落在中段；實測落點見 SC-001）。
- Q: Reflection 題庫每個 Topic 要產出幾則問題？
  → A: **生成目標為每 Topic 6 則（總計 96），但 Gate 的通過條件改用計算式**——「每 Topic 的則數 MUST ≥
  該 Topic 在三軌課表中被選中的最大次數」。**職責分離**：生成端只管產固定則數（簡單、可預期、不稀釋品質），
  驗證端負責確認夠不夠（課綱一改，Gate 立刻指名哪個 Topic 不足，而非等到推播時才撞見重複）。
  **實測依據**：依「取最早引入 Topic」規則模擬，單一 Topic 被選中的最大次數為 Foundation 4、
  InterviewReady 3、InterviewMastery 3；6 則對上限 4 有 50% 餘裕。未採 10 則（可涵蓋同時訂閱三軌的
  4+3+3=10 次）的理由：要 LLM 對同一 Topic 產出 10 則不重疊且夠深的問題必然逼出換句話說的湊數題，
  而 Gate 只驗得出字串不同、驗不出語意重複。
- Q: 素材 Gate 是否納入 LLM self-check？機械式檢查驗不出語意重複、切題性與「是否為開放式問題」。
  → A: **納入，但 rubric 收斂為兩項**——(1) 本批問題中是否有任兩則在問同一件事（僅措辭不同）；
  (2) 是否有任一則可用單一字詞或「是／否」回答。**刻意排除「切題性」**：問題本就依該 Topic 生成，
  離題風險低，且它是最主觀的判準、最容易造成誤退。實作 MUST 沿用 F7 既有機制
  （`scripts/lib/prompts/self-check.ts` 的回應型別 + `generate-content.ts` 的重生迴圈與
  「上限 3 次、3 次不過標記待人工檢視」），MUST NOT 另建第二套。
  **理由**：同一 Topic 連產 6 則，最可能的失效就是後幾則為前幾則的換句話說，而使用者會在 3～4 週內
  連續收到同一 Topic 的問題、重複立刻可辨——這是高可見度缺陷，卻是機械 Gate 完全抓不到的一項。
  未採人工審閱：寫進 spec 即成常態性關卡，會使素材從可重生成的產物退化為不敢重生的手工資產
  （違反憲章 XIII 與 XVII）。
- Q: 某週的 `practice` / `challenge` 槽選不到任何題目時（如 `programming-mindset` 全為 `leetcode: []`），
  該日只會推出「叫你去練習卻沒給任何東西」的空洞訊息。是否應跳過該日？
  → A: **應跳過，且 MUST 由課表生成端跳過**——`practice` / `challenge` 槽算出 `problemIds` 為空時
  MUST NOT 產生該 Session、MUST NOT 消耗 `sessionIndex`（與 concept 槽在涵蓋佇列取空時的既有行為同一路徑）。
  **`review` 槽一律保留**：跳掉它會使該週的 Concept 落在所有 `reviewRange` 之外、違反 `review-coverage-gap`
  不變式；且 F8 之後 review 有涵蓋清單 + Reflection + 鼓勵語，不缺 Challenge 仍有實質內容。
  **MUST NOT 於 runtime 跳過**：runtime 跳過會違反 §19 的「推播成功才 +1」與「漏跑不跳課」，
  等同讓每日管線做內容判斷。
  **實測影響**：Foundation practice 跳過 7 次（w1–w4 mindset、w24、w28、w31）／challenge 跳過 3 次；
  InterviewReady challenge 跳過 2 次；InterviewMastery challenge 跳過 6 次（Hard 題要到 hash-table 才出現）。
  課表長度 208 / 202 / 249 → **198 / 200 / 243**。

> 兩項決策已依 CLAUDE.md「跨 Feature 決策必須落地到真實來源」寫回 `docs/spec.md`
> （§2 G1、§13.1、§13.2、§13.5、§14.3、§14.5、§15、§16.4、§17、§22.5 F4/F7/F8、§23）。

## 範圍界線

### 在範圍內

| 項目 | 產物 / 變更點 | 依據 |
| --- | --- | --- |
| Reflection 題庫 | `data/reflection-bank.json`（新建，凍結） | §15、§20.1 |
| 鼓勵語錄池 | `data/encouragement.json`（新建，凍結） | §14.3、§16.4、§20.1 |
| 素材生成腳本 | build-time 生成 + Gate（沿用 F7 的節流／退避／續跑機制） | §20.3、§20.4 |
| 素材 Gate | schema 驗證、逐區塊預算、繁中判準、去重、涵蓋量下限 | §14.5、§11、§20.3 |
| 決定性選取 | Lesson Compiler 依 `sessionIndex` 填入 `reflectionQuestion` / `encouragement` | §15、§16.4 |
| review Challenge 選題 | `generate-schedule.ts` 為 review 槽寫入 `problemIds` | §15、§13.4 |
| **移除 rest 槽** | `curriculum/track-params.json` 三軌 rhythm 由 7 槽 → 6 槽；放寬 `validateRhythm` 的 rest 必要性檢查 | §13.2（F8 定案） |
| **跳過無題槽** | `emitSessions` 對 `problemIds` 為空的 `practice` / `challenge` 槽不產生 Session；`review` 一律保留 | §13.2、§13.4（F8 定案） |
| **課表重跑** | 三份課表重生成並 commit（198 / 200 / 243 Session） | §13.4、§13.5 |
| 版面完善 | Renderer 的 `review` 分支呈現四段（涵蓋清單 / Reflection / Challenge / 鼓勵語） | §14.3、§15 |
| Gate 承接 | `validate.ts` 全 Track × 全 Session 編譯 + render 檢查照常涵蓋新素材 | §20.3、§14.5 |

### 不在範圍內

- **不改動 concept / practice / challenge 三種 Session 的版面**（本 Feature 只碰 review）。
- **不移除 `rest` 這個 Session 類型**：`SessionType` / `RestLesson` / `compileRest` / `buildRestBlocks`
  MUST 保留並持續受測，使「是否排休息日」維持為 `track-params.json` 的參數選擇，而非寫死於程式（§13.1）。
- **不改動 Curriculum、Concept Skeleton 或 Full Article**（`concepts/**`、`articles/**` 不變；Skeleton
  雜湊不動，故 F7 的 165 篇教材 MUST NOT 被觸發重生）。
- **不新增常態性人工審核關卡**（憲章 XVII：唯一人工檢查點仍是課綱大綱定稿；素材由自動 Gate 把關）。
- **不引入 runtime LLM**、不新增外部服務或付費資源（憲章 VIII / XVI）。
- **不做 GitHub Pages 或 Slash Commands**（F9 / F10）。
- **不做「跨 Topic 比較型」Reflection 問題**：§15 舉的範例（「本週哪兩個 Pattern 最容易混淆？」）在跨
  Module 交界週最有價值，但本 Feature 的歸屬規則（FR-011）只會選定單一 Topic，等同放棄該提問角度。
  補上它需要新的題型與跨 Topic 的候選集模型，屬 F10 等級的擴張，**明確排除於 F8 之外**。
- **不調整 rhythm 中 concept / practice / challenge / review 槽的數量與位置**（僅移除 rest 槽；
  三軌的 `maxLevel`、`problemDifficulties`、`challengeDifficulty` 皆維持 F7 定案值不變）。

## 實作順序約束（MUST，供 `/speckit-plan` 與 `/speckit-tasks` 使用）

本 Feature 的 User Story 優先序（P1/P2/P3）是**價值優先序，不是實作依賴序**。以下依賴為硬性，
`/speckit-tasks` MUST 據此編排 Phase，MUST NOT 僅依 User Story 順序展開。

### Foundational（Blocking Prerequisites — 阻擋全部 User Story）

**① 生成器與參數變更**（FR-014a／FR-014b／FR-014e／FR-014f／FR-014g／FR-016／FR-017／FR-020）
— `track-params.json` 移除 rest 槽、放寬 `validateRhythm`、`emitSessions` 跳過無題的
`practice` / `challenge` 槽、review 槽的 Challenge 選題。**這四項 MUST 在同一階段完成**，
因為它們全部改變 `generate-schedule.ts` 的輸出，分批進行會產生多次全量課表 diff。

**② 重跑並 commit 三份課表**（FR-014d）— MUST 緊接 ①，且 MUST 通過生成器全部內建驗證。

### 依賴 ②（MUST 在 ② 之後）

| 工作 | 為何依賴 ② |
| --- | --- |
| **③ Reflection 題庫的 Gate**（FR-003a） | 通過條件是「該 Topic 在**三軌課表**中被選中的最大次數」——沒有新課表就算不出配額 |
| Compiler 的 Reflection 選取（FR-011） | 依 `reviewRange` → Topic 推導，其正確性只能對新課表驗證 |
| Compiler 的 `encouragement` 填入（FR-010） | 掛載於 review Session，需新課表的 review 落點 |
| 全 Track × 全 Session 的 `validate.ts` Gate（FR-030） | 對象即三份新課表 |
| SC-003 / SC-004 / SC-005 / SC-012 的驗收 | 全部以新課表為基準 |

### 可與 ③ 並行（無硬依賴）

**④ Renderer 版面**（FR-021～FR-025）— Renderer 是 `Lesson` 的**純函式**（憲章 XI），可用測試替身
（`tests/helpers/lesson.ts`）完整開發與測試，MUST NOT 為了等素材而延後。唯一需要等待的是最終的
端到端驗收（`DRY_RUN=true` 對真實課表 render）。

> **Reflection 題庫的「生成」本身不依賴 ②**（每 Topic 固定 6 則），依賴 ② 的是它的 **Gate 配額檢查**。
> 但因兩者屬同一批工作且 Gate 不過就不能凍結，實務上 MUST 整批排在 ② 之後。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 週複習日收到完整三段（Priority: P1）

身為每日跟課的使用者，我在該 Track 的週複習日打開 Discord 頻道時，看到的不再只是「本週涵蓋的 Concept 清單」，
而是完整的三段：**Review**（本週學了哪些觀念）、**Reflection**（一個逼我回頭想的反思問題）、**Challenge**
（一題把本週觀念綜合起來練的題目，含可點的 LeetCode 連結與難度）。反思問題與本週實際涵蓋的內容相關，不是
一句放諸四海皆準的空話。

**Why this priority**: 這是 §15 明文的 MUST，也是 F8 驗收（M4）的核心。三段中目前有兩段缺席，是 MVP 走完
之後最顯眼的功能缺口——每週有一天的推播內容明顯比其他天單薄。單獨交付這一段即可讓 review 日從「半成品」
變成「完整的一堂複習課」。此三段獨立於 US2 的鼓勵語，可先行交付。
**⚠️ 本 Story MUST 在「實作順序約束」的 ①②（Foundational）完成後才開始**——其 Challenge 段直接來自
重跑後的課表。

**Independent Test**: 對三個 Track 各取一個 review Session，以 `DRY_RUN=true` 編譯並 render，確認輸出的
embeds 同時包含「本週涵蓋」清單、「Reflection」問題、「Challenge」題目三段，且三段內容皆來自凍結產物
（`data/reflection-bank.json` 與 `schedules/{track}.json`），過程中無任何 LLM 呼叫。

**Acceptance Scenarios**:

1. **Given** 三份課表已由生成器重跑並含 review 槽的 `problemIds`、`data/reflection-bank.json` 已凍結入庫，
   **When** Compiler 針對任一 Track 的任一 review Session 編譯，
   **Then** 產出的 Lesson 同時具備非空的 `reviewConcepts`、非空的 `reflectionQuestion`、以及至少一題 `problems`。
2. **Given** 同一個 `(track, sessionIndex)` 的 review Session，**When** 重複編譯並 render 多次，
   **Then** 每次得到 byte-identical 的 embeds（含同一則 Reflection 問題與同一題 Challenge）。
3. **Given** 某個 review Session 的 `reviewRange` 涵蓋的 Concept 屬於 Topic X，**When** 選取 Reflection 問題，
   **Then** 選到的問題屬於與本週涵蓋內容相關的題組，而非任意一則。
4. **Given** review Session 的 render 結果，**When** 執行預算檢查，
   **Then** `reflectionQuestion` ≤ 300 字元、單則訊息總長 ≤ 5,500 字元，且所有結構性上限皆通過。

---

### User Story 2 - 週複習日結尾收到一句輪替的鼓勵（Priority: P2）

身為連續跟課數週的使用者，我在週複習日的推播結尾，收到一句會輪替的鼓勵語——不是每週一模一樣的罐頭文字，
而是能在我卡關或懷疑進度時接得住我的一句話，讓我知道還在路上這件事本身就有意義。

**Why this priority**: 這是體驗價值而非功能缺口，低於 US1，但屬於 F8 範圍與 M4 驗收。可獨立於 US1 交付
（素材檔與選取邏輯完全獨立於 Reflection 題庫）。

**Independent Test**: 對同一 Track 連續多個 review Session 編譯並 render，確認鼓勵語逐次輪替（不重複於相鄰
出現）、且每一則都來自 `data/encouragement.json` 的凍結內容；素材檔存在時版面長出「一句話」欄位，
移除素材檔後版面自動省略該段落且不失敗。

**Acceptance Scenarios**:

1. **Given** `data/encouragement.json` 已凍結入庫，**When** Compiler 編譯任一 review Session，
   **Then** 產出的 Lesson 具備非空的 `encouragement`，且該字串存在於語錄池中。
2. **Given** 同一 Track 的連續 N 個 review Session（N ≤ 語錄池大小），**When** 逐一編譯，
   **Then** 取得 N 則**互不相同**的鼓勵語。
3. **Given** 同一個 `(track, sessionIndex)` 的 review Session，**When** 重複編譯，**Then** 每次得到同一則鼓勵語。
4. **Given** review Session 的 render 結果，**When** 執行預算檢查，**Then** `encouragement` ≤ 200 字元，
   且與同一則訊息中的 `reflectionQuestion`（≤300）、`problems`（≤350×3）合計後總長 ≤ 5,500。
5. **Given** 鼓勵語與 Reflection 問題同時出現於 review 版面，**When** 檢視版面順序，
   **Then** 鼓勵語 MUST 位於三段實質內容之後（版面結尾），MUST NOT 插在 Reflection 與 Challenge 之間。

---

### User Story 3 - 素材可重生成、可驗證、且不污染每日 runtime（Priority: P3）

身為專案維護者，當我覺得反思問題品質不夠好或鼓勵語太少時，我可以重跑一次 build-time 生成腳本，讓它在
不觸碰教材（`concepts/**`／`articles/**`）的前提下重新產出素材、自動過 Gate、review diff 後 commit 凍結；
CI 會替我確認素材沒有超出預算、沒有簡體字、沒有重複，且每日推播流程完全不需要 LLM key。

**Why this priority**: 這是可維護性而非使用者可見價值，但它決定了素材是「一次性手工資產」還是「可演進的
生成物」（憲章 XIII）。放在 P3 是因為 US1 / US2 即使以較小的素材集也能先交付價值。

**Independent Test**: 在完全沒有 `GEMINI_API_KEY` 的環境下執行 `DRY_RUN=true` 的每日流程與 CI Gate，兩者
皆成功；接著帶 key 重跑素材生成腳本，確認同一輸入不會覆蓋已凍結且未變更的素材（冪等），且 `concepts/**`
與 `articles/**` 的檔案雜湊完全不變。

**Acceptance Scenarios**:

1. **Given** 素材已凍結，**When** 在沒有任何 LLM API key 的環境執行每日推播流程與 CI Gate，**Then** 兩者皆成功。
2. **Given** 一份刻意超出預算（Reflection > 300 字元）或含簡體字的素材，**When** 執行 Gate，
   **Then** Gate 以具名錯誤擋下並回報是哪一筆素材、哪一項違規，MUST NOT 自動截斷後放行。
3. **Given** 素材已凍結且輸入未變更，**When** 重跑生成腳本（未帶 `--force`），**Then** 既有素材不被覆蓋。
4. **Given** 生成腳本執行中被中斷，**When** 重跑，**Then** 從缺漏處續跑，不重做已通過 Gate 的部分。

---

### Edge Cases

- **素材檔缺席**：任一素材檔不存在時，對應段落 MUST 被省略（維持 §15 的 F5 過渡規則），Renderer MUST NOT
  產生空段落或佔位字串，CI Gate MUST 照常通過——這條在 F8 之後仍然成立，因為它同時是「素材檔損毀」的降級路徑。
- **本週無任何題目**：某個 review Session 的 `reviewRange` 涵蓋的 Concept 全部為 `leetcode: []`（純觀念課）
  時，Challenge 段省略為合法（沿用 §13.4 的「無 fallback」定案），但生成器 MUST 留下具名 warning 訊號。
  現行課綱下此情境**多數**落在 `programming-mindset` 模組期間（各軌開頭 2～3 週），
  但**各軌另有 1 週落在課程中段**（Foundation w28 `queue`、InterviewReady w21 `stack`+`queue`、
  InterviewMastery w28 `tree`）——27 個純觀念 Concept 中有 17 個散在其他 Topic，恰好整週相鄰時同樣觸發。
  詳見 SC-001 的實測落點表。
- **輪替週期短於 Session 數**：語錄池 / 題庫的規模小於該 Track 的 review Session 數時，輪替會繞回，
  這是預期行為；但 MUST 保證繞回是決定性的，且 MUST NOT 出現「相鄰兩次選到同一則」。
- **三 Track 的同一 `sessionIndex`**：三個 Track 的 review 落在不同的 `sessionIndex`（因節奏不同），
  選取規則 MUST 對每個 Track 各自決定性，MUST NOT 因為共用同一份素材而讓三軌在同一天推出完全相同的內容。
- **rest 槽移除後的回歸風險**：`SessionType` 仍含 `rest`，但三份正式課表已無此類 Session，
  `compileRest` / `buildRestBlocks` 將不再被 `validate.ts` 的全課表編譯涵蓋。兩者 MUST 由**單元測試**
  維持覆蓋（否則會退化為無人測到的死路徑，未來想加回休息日時才發現已損壞）。
- **`state.json` 的進度語意位移 — 已查證為非問題（最近一次查證 2026-08-02）**：課表重新編號後，
  同一個 `currentSessionIndex` 指向的 Session 可能與變更前不同。
  **實際查證（2026-08-02）**：`state` 分支已被重置，三軌皆為 `currentSessionIndex: 1`、
  `lastPushAt: null`、`completedConceptIds: []`、`history: []`——即**從未推播過任何一課**，
  因此沒有任何已推播進度需要與新編號對齊，**state 遷移在本 Feature 期間不適用**。
  （前次查證 2026-08-01 為 `currentSessionIndex: 2`，該紀錄已被本次重置取代。）
  即使期間又推播數日，只要 ≤ 3 仍安全：三軌 rhythm 的第 1、2 槽都是 `concept`、且 Concept 引入順序
  不變（SC-005），故新課表的 Session 1、2 仍指向同樣兩個 Concept。位移自 Session 3 起才發生
  （Foundation 第 3 天由 `practice` 變為第三個 concept）。
  **每日 cron 仍在排程中**（`daily.yml` 台北 06:07 / 06:37），index 每天 +1，故自 1 起算有 **3 天餘裕**；
  實作時 MUST 重新確認此前提仍成立（若已 > 3，依 §9.2「指定起點」流程校正 `currentSessionIndex`）。
- **reviewRange 涵蓋跨 Module**：一週涵蓋的 Concept 橫跨兩個 Module 時，Reflection 問題的歸屬 MUST 有
  決定性的決勝規則（不得依賴 JSON 鍵序或雜湊等不穩定來源）。
- **課表重跑造成大範圍 diff**：為 review 槽補上 `problemIds` 會改動三份課表；重跑 MUST 為
  byte-identical 可重現，且 diff MUST 僅出現在 review Session 的 `problemIds` 欄位，MUST NOT 波及既有
  concept / practice / challenge 槽的選題（否則等同悄悄改變了已上線的課程）。
- **Challenge 題目重複**：review 的 Challenge 與同週 `challenge` 槽的題目 MUST NOT 是同一題（同一週被要求
  解兩次同一題等於少了一次練習）。

## Requirements *(mandatory)*

### Functional Requirements

#### 素材：Weekly Reflection 題庫

- **FR-001**: 系統 MUST 建立 `data/reflection-bank.json`，內容為 build-time 預生成、通過 Gate 後**凍結**於
  repo 的 Weekly Reflection 問題集合；每日 runtime MUST NOT 生成或改寫任何一則。
- **FR-002**: 題庫 MUST 依 Topic 組織，使「本週涵蓋的內容」可對應到一組候選問題；組織鍵 MUST 參照
  `curriculum/modules.json` 既有的 Topic 識別項，MUST NOT 另立平行分類。
- **FR-003**: 題庫的**生成目標**為每個 Topic **6 則**問題（現行 16 個 Topic ⇒ 96 則）。
- **FR-003a**: 題庫的 **Gate 通過條件**為計算式而非固定值：每一個 Topic 的問題則數 MUST **≥ 該 Topic
  依 FR-011 的歸屬規則在三軌課表中被選中的最大次數**（現行課綱下最大為 4）。不足 MUST 由 Gate 以具名
  錯誤指出是哪一個 Topic、需要幾則、實際幾則（fail loud），MUST NOT 靜默略過。
  **理由**：生成端用固定則數（簡單、可預期、不稀釋品質），驗證端用計算式（課綱一改即指名不足處），
  兩邊職責分離；MUST NOT 讓生成腳本讀課表反推配額。
  **與 SC-010 的依賴關係（MUST 明寫）**：SC-010（單一 Track 內同一則問題只被推播 1 次）**僅在本條配額
  成立時才成立**——FR-011 的輪替索引在該 Topic 的出現次數超過候選集大小時必然繞回。故本條不是「額外的
  保險」，而是 SC-010 的**必要條件**；本條的 Gate 一旦被停用或放寬，SC-010 即同時失效。
  **配額計算所用的 Topic 歸屬規則 MUST 與 FR-011 的 Compiler 選取共用同一顆實作**（憲章 IX）：
  兩處各寫一份必然漂移，屆時會出現「Gate 算出配額足夠、runtime 卻選到重複問題」的落差。
- **FR-003b**: 現行課綱下的「最大次數 4」與「16 Topic ⇒ 96 則」皆為**依現行 `curriculum/modules.json`
  與三份課表導出的觀察值，MUST NOT 被寫死為常數**。課綱、Track 參數或 rhythm 任一變動時，配額 MUST 由
  Gate 依當時的三份課表重新計算，MUST NOT 沿用本文件記載的數值。
- **FR-004**: 每一則 Reflection 問題 MUST ≤ 300 字元（code point 計；§14.5 預算），MUST 為繁體中文
  （技術術語 / Pattern 名稱 / API 保留英文；§11），且 MUST 為開放式反思問題而非可用單一字詞或
  「是／否」回答的事實題。**前兩項由機械 Gate 驗證，第三項由 FR-028a 的 LLM self-check 驗證**
  （否則此條無法驗證）。
- **FR-005**: 題庫內 MUST 無完全重複的問題文字（字串層級，機械檢查）；**語意層級的重複**由
  FR-028a 的 self-check 把關。

#### 素材：鼓勵語錄池

- **FR-006**: 系統 MUST 建立 `data/encouragement.json`，內容為 build-time 預生成、通過 Gate 後**凍結**於
  repo 的鼓勵語集合；每日 runtime MUST NOT 生成或改寫任何一則。
- **FR-007**: 語錄池 MUST 至少包含 30 則語錄，使最長 Track（InterviewMastery ⇒ **42 個** review Session）
  在一輪課程中最多只繞回一次。
  **「42」為依現行課表推算的導出值，MUST NOT 被寫死為常數**（同 FR-003b 的處置）：review Session 數
  ＝生成器實際攤出的**輪次數**（`review` 槽一律產生，故 review 數 ＝ 週數，**不受跳過規則影響**），
  由課綱與 rhythm 決定，實作時 MUST 以重跑後的課表為準。
  三軌週數為 **35 / 34 / 42**（`docs/spec.md` §13.5，F8 兩項修訂後不變）——**MUST NOT 由
  「Session 數 ÷ rhythm 長度」反推**：concept 槽在涵蓋佇列取空時、practice / challenge 槽在無題時
  都會被跳過，實際每週的 Session 數少於 6，除法會得到偏低的錯誤值（198 ÷ 6 = 33 ≠ 35）。
  下限 30 的成立不依賴這個數字的精確值——只要 review 數 < 60，30 則即保證「最多繞回一次」。**此下限同時是 SC-002 的必要條件**：FR-012 的輪替索引步長恆為 1，
  故「連續 N 個 review 互異」的 N 上限即為語錄池大小，30 則以下 SC-002 不成立。
  **生成目標為 36 則**（下限 30 ＋ 20% 損耗餘裕）：若生成目標等於下限，任何一則因去重／繁中／預算被
  剔除即跌破門檻並觸發整批重生。
- **FR-008**: 每一則鼓勵語 MUST ≤ 200 字元（code point 計；§14.5 預算），MUST 為繁體中文，MUST NOT 包含
  外部連結、MUST NOT 提及任何具體題號或 Concept（語錄與課程進度無關，才能安全輪替於全部 Track）。
  **「不得提及題號或 Concept」的機械判準見 FR-028 的樣態清單**——該條的機械可判定範圍**刻意小於**
  本條的意圖，剩餘部分由生成 prompt 的明確約束承擔（理由同 FR-028a 排除「切題性」）。
- **FR-009**: 語錄池內 MUST 無完全重複的語錄文字。
- **FR-009a**: 兩份素材檔 MUST 以 **canonical 形式序列化**：2-space 縮排、檔尾單一 `\n`；
  `reflection-bank.json` 的 Topic 鍵序 MUST 依 `curriculum/modules.json` 的 Module 宣告序 → Module 內
  Topic 宣告序（MUST NOT 用字典序或插入序）；`encouragement.json` 的 `quotes` 依生成序。
  **理由**：沒有 canonical 序列化，「重跑不覆蓋未變更產物」（FR-026）與 SC-008 皆無從驗證——
  鍵序漂移會讓每次重跑都產生假 diff。

#### 決定性選取

- **FR-010**: Lesson Compiler MUST 於編譯 `review` 類 Session 時同時填入 `reflectionQuestion` 與
  `encouragement`；兩者的選取 MUST 為 `(track, sessionIndex)` 的**純函式**——同一輸入永遠得到同一則素材，
  MUST NOT 依賴時間、隨機源或檔案系統列舉順序。`ReviewLesson` MUST 新增 `encouragement?: string` 欄位；
  `RestLesson` 既有的同名欄位與 `compileRest` 的填入路徑 MUST 保留（`rest` 槽雖已不在現行課表中，
  但型別與版面支援 MUST 維持，見 §13.1）。
- **FR-011**: Reflection 問題的選取 MUST 依「本週涵蓋範圍（`reviewRange`）所對應的 Topic」縮小候選集後，
  再決定性輪替於該候選集之內。**涵蓋範圍橫跨多個 Topic 時，MUST 取「最早引入者」**
  ——即 `reviewRange` 內 `sessionIndex` 最小的 concept Session 所屬的 Topic；仍並列時以 §16.1 的全序
  `ordinalOf` 決勝。MUST NOT 依賴 JSON 鍵序、雜湊或任何不穩定來源。
  **理由**：與 §14.3 既有的 `problemId → conceptId` 反查決勝規則（「取較早引入者，並列時以 `ordinalOf`
  決勝」）**同向**；專案內若同時存在「取較早」與「取較晚」兩種決勝方向，會使每一處都需回查文件。
  **輪替索引 MUST 為 `(topicOccurrence + trackOffset) mod 候選集大小`**（`/speckit-plan` 定案
  2026-08-01，見 `research.md` R6）——`topicOccurrence` 為同一 Track 中 `sessionIndex` 更小且歸屬
  同一 Topic 的 review Session 數（0-based），`trackOffset` 為 `TRACK_ORDER` 的索引。
  **MUST NOT 改用 `sessionIndex` 取模**：同一 Topic 的數個 review 其 `sessionIndex` 間距為 rhythm
  長度（6）的倍數，`mod 6` 恆為同一值 ⇒ 同一 Topic 每次都推出同一則問題，SC-010 不可能成立。
- **FR-012**: 鼓勵語的選取 MUST 以 **`(reviewOrdinal + trackOffset) mod 語錄池大小`** 的方式決定性輪替
  （`reviewOrdinal` 為該 Track 全部 review Session 依 `sessionIndex` 升冪的 0-based 序位），並 MUST 保證
  同一 Track 相鄰兩個 review Session 不會選到同一則（除非語錄池只有一則）。
  **MUST NOT 改用 `sessionIndex` 對語錄池大小取模**（`/speckit-plan` 定案 2026-08-01，見 `research.md` R5）：
  三軌 rhythm 皆 6 槽且 review 固定於末槽，`sessionIndex` 每次遞增 6，`mod 30` 只會取到
  `30 / gcd(6,30) = 5` 個相異索引——整輪課程只用得到 5 則語錄，SC-002 不可能成立。
  兩式皆為 `(track, sessionIndex)` 的純函式，FR-010 的決定性要求不受影響。
- **FR-013**: 三個 Track 共用同一份素材檔（憲章 VI：Shared Knowledge, Different Tracks）；MUST NOT 為每個
  Track 各建一份題庫或語錄池。
- **FR-014**: 素材檔缺席或為空集合時，Compiler MUST 省略對應欄位、Renderer MUST 省略對應段落，
  整條流程 MUST NOT 失敗（沿用 §15 的 F5 過渡規則作為降級路徑）。
  **三種降級情境 MUST 逐一定義，MUST NOT 只寫「缺席」**：
  1. **整檔缺席**（檔案不存在）⇒ 省略對應欄位。
  2. **檔在、schema 合法、但集合為空**（`quotes: []`／某 Topic 的陣列為空）⇒ 省略對應欄位。
     素材 schema MUST 允許空集合（MUST NOT 以 `min(1)` 擋下），否則本條與 schema 互斥；
     空集合的把關改由 FR-028 的 Gate（池規模下限、Topic 配額）在 CI 擋下
     （Topic 配額同樣適用下方第 3 點的 `requiredQuota === 0` 例外）。
  3. **檔在、schema 合法、但缺某個 Topic 的鍵**（非整檔缺席）⇒ 該 Session 省略 `reflectionQuestion`。
     此為 runtime 降級路徑；該 Topic 的 `requiredQuota ≥ 1` 時，該狀態 MUST 由 FR-003a 的配額 Gate 在
     CI 擋下，不得進入正式推播。**`requiredQuota === 0` 的 Topic 為明文例外**（該 Topic 未被任何一份
     課表的 review 選中，見 `contracts/material-schema.md` §3.1）：缺鍵、空陣列皆為合法狀態，
     Gate MUST NOT 擋下——它本來就不會被任何 review Session 取用，擋下等同要求為永遠用不到的 Topic
     生成問題。**此例外 MUST 明寫**：否則本條的「MUST 擋下」與 §3.1 的「即使沒有任何問題也合法」
     互斥，實作端無從判斷該信哪一份。
  **檔在但為壞檔或不符 schema ⇒ MUST fail loud，MUST NOT 降級為「缺席」**（沿用 F5 既有語意）：
  一個打錯字的 JSON 若被當成缺席，整個段落會無聲消失。

#### 節奏修訂（移除 rest 槽）

- **FR-014a**: `curriculum/track-params.json` 的三軌 `rhythm` MUST 移除 `rest` 槽（7 槽 → 6 槽）；
  其餘參數（`maxLevel`、`problemDifficulties`、`challengeDifficulty`、concept / practice / challenge /
  review 槽的數量與相對順序）MUST 維持 F7 定案值不變。
- **FR-014b**: Track 參數的 rhythm 驗證 MUST 放寬「MUST 含至少一個 `rest` 槽」的檢查；「MUST 含至少一個
  `review` 槽」以及既有三條槽位順序約束（至少一個 concept 槽、第一個 practice 晚於第一個 concept、
  **最後一個 review 不早於最後一個 concept**）MUST 全部保留。
  末條的措辭 MUST 與現行實作（`validateRhythm` 的 `lastReview < lastConcept` 判定）及
  contracts/schedule-revision.md §1 一致——同一槽不可能同時是 concept 與 review，故「不早於」與
  「concept 早於 review」語意等價，但**專案內只保留一種敘述**，避免每次比對都得先確認兩者是否同義。
- **FR-014b1**: `rhythm` 的**陣列長度約束**（現行 schema 釘死為恰好 7）MUST 改為**範圍**而非固定值：
  下限 **2**（≥1 concept ＋ ≥1 review 的必然結果，使長度違規停在「長度」而非繞到兩條語意規則）、
  上限 **14**（兩週）。**MUST NOT 改寫為固定 6**——那只是把 F4 的硬編數字換成新數字，下次調節奏又得改
  schema；`rhythm` 是 `track-params.json` 的參數，長度本就不該是不變式。
  **上限不可省略**：`rhythm.length` 即 `reviewRange` 的最大跨度，無上限時一個誤植的長陣列會生出
  「一次複習涵蓋數十天」的課表且**零違規通過**，週複習的語意會悄悄消失。
- **FR-014c**: `rest` MUST 維持為受支援的 Session 類型：型別（`SessionType` / `RestLesson`）、
  Compiler 分支、Renderer 版面 MUST 保留且 MUST 有單元測試覆蓋，使「是否排休息日」為純參數選擇。

> **編號提醒**：**FR-014d（三份課表重跑）置於本節末（FR-014g1 之後）**，因為它是前述全部參數與生成器
> 變更的共同產物，依邏輯順序收尾。編號本身 MUST NOT 更動——plan.md、tasks.md 與 contracts/ 均已引用。
- **FR-014e**: `practice` / `challenge` 槽在算出的 `problemIds` **為空**時，生成器 MUST **不產生該 Session、
  且不消耗 `sessionIndex`**（與 concept 槽在涵蓋佇列取空時的既有 `continue` 行為同一路徑）。
  **MUST NOT 於 runtime 跳過**——runtime 跳過會違反 §19 的「推播成功才 +1」與「漏跑不跳課」，
  等同讓每日管線依內容決定是否推播。
  **「為空」對兩種槽是各自的既有判準，MUST 分別認定**：`practice` 為「該週已引入 Concept 的題目聯集
  過濾後為空」；`challenge` 為「已引入 Concept 中找不到符合該 Track `challengeDifficulty` 的題目」
  （既有選題函式回傳無結果）。兩者的**結果**相同（跳過），**觸發條件**不同，Gate 訊息 MUST 能區分。
  **跳過 MUST NOT 影響生成器的跨槽累積狀態**：已引入 Concept 清單（供 challenge 候選池與前向依賴檢查）
  與已用過的 challenge 題號集合 MUST 照常維持——跳過的是「產出一筆 Session」，不是「這一輪沒發生過」。
- **FR-014f**: `review` 槽 MUST **一律產生**，即使其 `problemIds` 為空。
  **理由**：跳過 review 會使該週的 concept Session 落在所有 `reviewRange` 之外，直接違反生成器的
  `review-coverage-gap` 不變式（§13.2）；且 F8 之後 review 具備涵蓋清單 + Reflection + 鼓勵語，
  不缺 Challenge 段仍有實質內容。
  **「每個被產生的輪次必含至少一個 concept Session」為結構保證，非假設**：輪次的進入條件是涵蓋佇列
  非空，而佇列**只被 concept 槽消耗**，故該輪的第一個 concept 槽必然產出。`reviewRange` 因而恆非空，
  Compiler 不會撞上「範圍內無 concept Session」。若 rhythm 把某個 `review` 槽排在該輪第一個 `concept`
  槽**之前**，該 review 的 `reviewRange` 為空區間，MUST 由既有的 `review-range-invalid` 具名擋下
  （此護欄 MUST NOT 因本次修訂而放寬）。
- **FR-014g**: 因無題而被跳過的 `practice` / `challenge` 槽，生成器 MUST 留下**具名 warning**
  （沿用並擴充既有的 `challenge-no-problem` 語意至 practice；**MAY 為 practice 另立
  `practice-no-problem` 規則名**——兩者根因不同：challenge 空池代表 `challengeDifficulty` 與題庫難度
  分布對不上，practice 空池代表該週涵蓋的 Concept 整週無題，共用一個規則名會讓依規則篩查失準）。
  **理由**：空槽是「題庫涵蓋不足」的訊號；跳過後該訊號從「使用者看到一則空推播」變成「課表少一天」，
  **更難察覺**——若不保留 warning，等同把問題掃到地毯下。
- **FR-014g1**: 跳過類 warning 的**違規主體（subject）MUST 以「輪次序 + 槽位序」定位，MUST NOT 使用
  `sessionIndex`**。被跳過的槽不消耗 `sessionIndex`，該編號會立刻被同一輪的下一個槽用掉——沿用
  `session-{n}` 會讓 warning 指向一個**真實存在但完全無關**的 Session（例如報「session-3 的 challenge
  無題」而 Session 3 實際是一堂 concept 課），比沒有訊號更糟。
  **輪次序的定義**：生成器攤課迴圈的第幾輪（1-based，自涵蓋佇列非空而進入該輪起算）；**被完全跳過的
  槽不影響輪次計數**（輪次由迴圈次數決定，與該輪實際產出幾筆 Session 無關）。
  **槽位序的定義**：該槽在 `rhythm` 陣列中的位置（1-based）。
- **FR-014d**: 三份課表 MUST 以修訂後的參數與跳過規則重新生成並 commit。
  **課表長度 MUST 由生成器輸出決定，MUST NOT 被當成設定值寫死**（`docs/spec.md` §13.5：長度是導出值）。
  本文件記載的 Foundation **198** / InterviewReady **200** / InterviewMastery **243** 是依現行課綱與參數
  推算的**預期輸出**，用途僅為**驗收比對**——實際輸出與此不符時，MUST 先查明是課綱／參數／生成器哪一項
  與預期不同，MUST NOT 反過來調整生成器去湊這三個數字。
  重生成 MUST 通過生成器全部內建驗證
  （拓樸子序列、`reviewRange` 正確、`review-coverage-gap`、參照完整、`session-problem-overflow`）。
  **`reviewRange` 不需為此另作處理**：被跳過的槽未消耗 `sessionIndex`，故
  `[weekStartIndex, sessionIndex − 1]` 自動收縮至該週實際產生的 Session。

#### review 槽的 Challenge 選題

- **FR-015**: `generate-schedule.ts` MUST 為每個 `review` Session 寫入 `problemIds`；Lesson Compiler
  MUST NOT 於 runtime 即時選題（§15、憲章 IX / XIII）。
- **FR-016**: review 的 Challenge 候選池 MUST 為**該 review Session 的 `reviewRange` 所涵蓋的 concept
  Session 的 `problemIds` 聯集**。
  **「`problemIds` 聯集」MUST 指「這些 concept Session 實際寫進課表的那份 `problemIds`」，MUST NOT 由
  Concept 的 `leetcode` 宣告重新過濾一次**。兩者結果不同：課表中的 `problemIds` 已含 Overlay 附加題、
  且已套用每 Session ≤3 題的截取。重新過濾會讓候選池含入**被截取掉、使用者當週從未收到**的題目，
  本條「review 的題必然是本週已看過的題」的立論即不成立。
  難度帶 MUST 由此聯集**隱含決定**（即該 Track 的 `problemDifficulties`），
  MUST NOT 另行套用 `challengeDifficulty`——後者 MUST 維持只服務 `challenge` 槽。
  **理由**：`selectConceptProblems` 已把該 Concept 在該 Track 難度帶內的題目全部推出，故本週的題在
  concept 日即已發完；review 的題必然是本週已看過的題，本質為**重做**（複習），不是進階挑戰。
  沿用 `challengeDifficulty` 會使候選池近乎恆空（實測 Foundation 23～29%、InterviewMastery ≥67% 無題）。
- **FR-017**: 選題 MUST 為決定性：同一輸入 → 同一題號。排序規則 MUST 為「**先依難度由低至高，同難度依
  題號由小至大**」，取排序後第一題。**難度在此只作為排序鍵，MUST NOT 再作為候選池的過濾條件**
  ——池的難度帶已由 FR-016 隱含決定，再過濾一次等同悄悄套用了第二道難度限制。
- **FR-017a**: 同一週 `challenge` 槽已選用的題號 MUST 被排除，但該排除為**軟排除**：
  排除後候選池變空、而**排除前非空**時，MUST 退回未排除的候選池取排序後第一題，
  並留下具名 warning（review 與同週 challenge 同題）。
  **理由（與 SC-001 的衝突解消）**：硬排除在「該週候選池只剩 challenge 選走的那一題」時會讓 review
  無題，那是**該週有題卻仍省略 Challenge 段**——SC-001 明文禁止的省略情境。故排除在**可達成時 100%
  達成**，不可達成時退回並 fail loud，而非靜默丟掉一整段版面。
  此形狀與既有的 `challenge` 槽選題（「取尚未用過的最小題號，全部用過則退回池中最小題號」）一致，
  不引入第二套慣例。
- **FR-017b**: **MUST NOT 排除同一週 `practice` 槽已用的題號**（`/speckit-plan` 定案 2026-08-01，
  見 `research.md` R4；本條即該決策的規範性落點）。
  Foundation 的 practice 取的是同一份週聯集的前 3 題，該週題目總數 ≤3 時排除會把候選池吃空，
  同樣製造 SC-001 禁止的省略；且兩者皆為本週題目的複習，**重做本來就是設計意圖**（FR-016）。
  > **排序規則（「先難度低、同難度取小題號」）的規範性落點一律為 FR-017，本條 MUST NOT 複述其判準**
  > ——理由同 FR-020a：同一決策散在多處，改判準時必然漏改其中一處。
- **FR-018**: 候選池為空時（該週涵蓋的 Concept 全部無題目），`problemIds` 省略為合法狀態（無 fallback，
  沿用 §13.4 定案），但生成器 MUST 以具名 **warning** 留下訊號，MUST NOT 靜默通過。
  **已知且合法的省略來源**：全課綱共 **27 個** `leetcode: []` 的純觀念 Concept。
  `programming-mindset` 模組的 10 個是最大一群且相鄰，故各 Track **課程開頭 2～3 個** review 必然無
  Challenge 段；其餘 17 個散在 heap(4) / queue(3) / graph(2) / sliding-window(2) / tree(2) /
  array / dfs-bfs / linked-list / stack 各 1，**恰好整週相鄰時同樣會產生空候選池**——現行課綱下各軌
  各有 1 筆落在課程中段（實測落點見 SC-001 的表）。
  **MUST NOT 把「省略」與「課程開頭」綁定**：兩者在現行課綱下並非等價，綁定會使中段的合法省略被誤判。
- **FR-019**: 重跑生成器 MUST 產出 byte-identical 的三份課表（§13.4 determinism）。
  **比對基準 MUST 明確**：同一組輸入（Curriculum、Problem Bank、`track-params.json`、Overlay）在
  **同一 Node.js major 版本**下重跑，輸出檔案逐位元組相同。determinism 的責任範圍是「**同輸入 → 同輸出**」，
  MUST NOT 被解讀為「跨 Node major 版本或跨輸入版本亦須相同」（前者非本專案可控，後者本來就該不同）。**本次課表 diff 必然是
  全面性的**——移除 rest 槽會使第一個 rest 之後的每一個 `sessionIndex` 全部前移，故 MUST NOT 以「diff 面積」
  作為驗收條件；正確性 MUST 改由生成器內建驗證（FR-014d）＋ determinism 重跑比對＋「三軌涵蓋的 Concept
  集合與順序相對於 F7 完全不變」三者共同保證。
- **FR-020**: 每個 review Session MUST **恰帶 1 個** `problemIds` 題號（候選池非空時），或**整個欄位省略**
  （候選池為空時）。課表序列化既有規則為「空陣列不輸出」，故「0 題」在生成物中的形態 MUST 是
  **欄位缺席**，MUST NOT 是 `"problemIds": []`——兩者在 schema 與 diff 上是不同的東西。
  §15 明文「Challenge 一題綜合題」，且與 §13.4 的 `challenge` 槽同為單題；§13.4 的
  `session-problem-overflow` 不變式（≤3）照常作為兜底。
- **FR-020a**: review 的 Challenge 與同週 `practice` 日的題目重複為**可接受行為**；規範性內容一律以
  **FR-017b（不排除 practice）與 FR-017a（對同週 challenge 軟排除）**為準，理由見 FR-017b 與
  `research.md` R4。本條僅存為背景索引，**MUST NOT 在此複述判準**——同一決策原先散在五處，改判準時
  必然漏改其中一處。

#### 版面

- **FR-021**: `review` Session 的版面 MUST 依序呈現四段：本週涵蓋的 Concept 清單、Reflection 問題、
  Challenge 題目（含可點連結、難度）、鼓勵語；任一段素材缺席時 MUST 省略該段而非留空。
- **FR-022**: 鼓勵語 MUST 位於版面**最後一段**（三段實質內容之後），MUST NOT 插入於 Reflection 與
  Challenge 之間——避免通用文字稀釋針對本週教材的具體提問。
- **FR-023**: Renderer MUST 維持 stateless 純函式（憲章 XI）：同一 `Lesson` → 同一 embeds；MUST NOT 讀取
  素材檔、Curriculum、Problem Bank 或 state——素材一律由 Compiler 放進 `Lesson`。
- **FR-024**: Renderer 每放進 embed 的一段可變長度文字 MUST 同時登記對應的預算 slot（§14.5 的 slot⇄field
  對等不變式），並 MUST 由測試強制。
  **既有的明文例外照常適用（`docs/spec.md` §14.5，F5 定案 2026-07-24）**：非教材自由文字——固定標籤，
  以及**由 Compiler 依課表生成的清單**——不登記 slot。故 review 版面第 1 段的「本週涵蓋」（`reviewConcepts`）
  **MUST NOT** 被要求登記 slot，其長度由 embed field value ≤1024 與單則總長 ≤5,500 兜底（該段文字仍計入
  總量，因 `checkBudget` 的 `total` 是由 embeds 實際文字加總而來）。
  本 Feature 需要登記 slot 的只有 `reflectionQuestion`、`encouragement` 與 `problems`（逐題）三者。
- **FR-025**: review 的 render 結果 MUST 通過既有的同一顆預算檢查函式：逐區塊上限
  （`reflectionQuestion` ≤ 300、`encouragement` ≤ 200、每題 ≤ 350）、結構性上限、單則訊息總長 ≤ 5,500。
  超限 MUST 視為失敗，MUST NOT 自動截斷。

#### 生成與 Gate

- **FR-026**: 素材 MUST 由 build-time 腳本生成，並沿用 F7 既有的產線韌性機制：RPM 節流、429 指數退避 +
  jitter、斷點續跑、冪等（未帶 `--force` 時不覆蓋已凍結且未變更的素材）（§20.4）。
  **續跑的比對單位 MUST 為「批次」**（一個 Topic 的一次生成，或語錄池的一次生成），而非單則素材——
  一次 LLM 呼叫產出一整批，中斷只可能發生在批與批之間。
- **FR-026a**: 生成腳本 MUST 在每次執行時**輸出被跳過的批次清單**（哪些批次因冪等而未重新生成）。
  **理由**：SC-008 要求「已通過 Gate 的部分 100% 被跳過（零重複消耗免費層額度）」——沒有這份輸出，
  該 SC 無從觀測，只能靠「這次好像比較快」這種不可驗證的印象。
- **FR-027**: 素材生成 MUST NOT 更動 `concepts/**` 與 `articles/**` 的任何檔案（避免觸發 F7 的 165 篇教材
  全量重生）。
- **FR-028**: 素材 Gate MUST 檢查下列各項，任一項不通過 MUST 以具名錯誤擋下（生成期觸發重生、
  CI 期以非零 exit code 結束），MUST NOT 自動截斷後放行。
  **判準⇄具名 rule 的對應以 `contracts/material-schema.md` §3 的表格為單一基準**（該表列 **8 個 rule**）；
  本條的第 1 項對應 `material-schema` 與 `material-unknown-topic` **兩個** rule，其餘各項一對一。
  **文件各處 MUST 以 rule 名稱指稱違規，MUST NOT 以「N 類 / N 項」作為判準的識別方式**——數法不同
  （判準條目 vs rule 數 vs 驗收樣本數）必然導出不同的數字，而數字對不上時無從判斷是漏了檢查還是只是數法有別：
  1. **schema 合法**（結構與必要欄位；Topic 鍵 MUST 存在於 `curriculum/modules.json`）。
  2. **逐區塊字元預算**（Reflection ≤300、鼓勵語 ≤200；上限 MUST 取自 FR-029 的單一來源）。
  3. **繁中判準**（無簡體字、無教材不適用的俚語、CJK 佔比達門檻）。門檻 MUST 沿用教材既有的同一個
     預設值，MUST NOT 為短句素材另立一套——素材為繁中短句，實測不會逼近該門檻。
  4. **字串層級無重複**（Reflection 為**跨 Topic 全庫**比對，非僅 Topic 內）。
  5. **Topic 配額充足**（FR-003a 的計算式）。
  6. **語錄池規模達下限**（FR-007 的 ≥30）。
  7. **語錄與課程進度無耦合**（FR-008）。**機械判準的樣態清單恰為四項**：含 `http://` / `https://`、
     含 markdown 連結語法、含 `LeetCode`（不分大小寫）、含 `#` 接數字的題號樣式。
     **MUST NOT 比對 Concept id 或 title 清單**——Concept title 含「Two Pointer」「Sliding Window」等
     一般性詞彙，比對必然誤殺正常語句；本項要防的是「語錄綁定進度而無法安全輪替」，不是
     「語錄不准出現任何技術名詞」。剩餘風險由生成 prompt 的明確約束承擔。
- **FR-028a**: Reflection 題庫的生成 MUST 於機械 Gate 之後再經一道 **LLM self-check**，rubric 恰為兩項：
  (1) 本批問題中是否有任兩則在問同一件事（僅措辭不同）；(2) 是否有任一則可用單一字詞或「是／否」回答。
  **MUST NOT 納入「切題性」判準**（問題本依該 Topic 生成，離題風險低，且該項最主觀、最易誤退）。
  self-check 不通過 MUST 觸發重生，沿用「每批上限 3 次、3 次仍不過則標記待人工檢視並記錄（fail loud）」；
  單批升級 MUST NOT 阻斷其餘 Topic、MUST NOT 靜默凍結不合格產物。
  **批次整體的結束狀態 MUST 明確定義**：(a) 未通過的批次 MUST NOT 寫入素材檔（不凍結不合格產物）；
  (b) 已通過的批次照常寫入並記錄 checkpoint（不因他批失敗而回滾——否則一次失敗會浪費整批已花的額度）；
  (c) 只要有任一批次被標記待人工檢視，**整個腳本 MUST 以非零 exit code 結束**（憲章 XV fail loud），
  MUST NOT 因為「多數批次成功」而回報成功。
- **FR-028b**: self-check MUST 沿用 F7 既有機制（`scripts/lib/prompts/self-check.ts` 的回應型別與
  `generate-content.ts` 的重生迴圈語意），MUST NOT 另建平行的第二套 self-check 實作。
  鼓勵語錄池 MUST NOT 套用 self-check（語錄與課程內容無關，重複的可見度遠低於 Reflection 問題，
  字串去重已足夠）。
- **FR-029**: 素材的預算上限 MUST 取自既有的單一預算來源（`src/renderer/budget.ts`），MUST NOT 在生成端
  另寫一份數字（§14.5）。
- **FR-030**: `validate.ts` 的全 Track × 全 Session 完整編譯 + render 檢查 MUST 照常涵蓋灌入素材後的
  review Session；CI Gate MUST 在沒有任何 LLM API key 的環境下通過。
- **FR-031**: `daily.yml` MUST NOT 含 `GEMINI_API_KEY`；LLM key MUST 只出現在手動觸發的素材產線
  （本機或 `workflow_dispatch`）（憲章 VIII / XIV）。

#### 測試

- **FR-032**: 下列邏輯 MUST 有單元測試（§22.2）：Reflection 選取的決定性與 Topic 對應、鼓勵語輪替的
  決定性與不相鄰重複、素材檔缺席時的省略路徑、review 選題的決定性與「排除同週 challenge 題號」、
  課表重跑的 byte-identical、review 版面的預算與 slot 對等不變式、**不含 rest 槽的 rhythm 通過參數驗證**、
  **`rest` Session 類型的 compile / render 路徑**（現行課表已無此類 Session，MUST 由單元測試維持覆蓋）、
  **無題槽的跳過行為**（practice / challenge 空池不產生 Session 且不消耗 `sessionIndex`；review 空池仍產生；
  跳過後 `reviewRange` 仍正確涵蓋該週全部 concept Session）。

### Key Entities

- **Reflection 題庫（`data/reflection-bank.json`）**：以 Topic 為組織鍵的反思問題集合。每一則問題是一段
  ≤300 字元的繁體中文開放式提問，與該 Topic 的觀念相關但不綁定特定題號。屬凍結生成物，來源為 build-time
  腳本，消費者為 Lesson Compiler。
- **鼓勵語錄池（`data/encouragement.json`）**：與課程進度無關的短句集合（≥30 則、每則 ≤200 字元、繁體中文）。
  屬凍結生成物，消費者為 Lesson Compiler 的 **review** 分支。
- **Review Session 的 Challenge 題目**：既有 `schedules/{track}.json` 中 review Session 的 `problemIds` 欄位
  （目前恆為空）。本 Feature 使其由課表生成器決定性填入，題目 metadata 仍一律由 Problem Bank 帶入。
- **Lesson 的 `reflectionQuestion` / `encouragement`**：既有的選配欄位（F5 已定義、預算已就位）。本 Feature
  讓 Compiler 開始有素材可填，並將 `encouragement` 由 `RestLesson` **增設**至 `ReviewLesson`
  （`RestLesson` 的既有欄位保留不刪）。兩者的「缺席即省略」語意不變。
- **Track 參數的 `rhythm`（`curriculum/track-params.json`）**：三軌各一份的週節奏槽位陣列。本 Feature 將
  其由 7 槽縮為 6 槽（移除 `rest`），這是唯一被改動的參數欄位。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 三個 Track 的**全部** review Session 都同時呈現前三段（本週涵蓋 / Reflection / Challenge）。
  Challenge 段的省略 **100% 僅發生在「該週涵蓋的 Concept 全部無題目」時**，且每一筆省略都有對應的
  具名 warning 可追溯；在該情境之外的省略數 MUST 為 **0**。
  **現行課綱下的實測落點為 Foundation 4 / InterviewReady 3 / InterviewMastery 3 週**
  （2026-08-02 對 F7 凍結課表實算；review 數 35 / 34 / 42 不因 F8 修訂而變，故此落點對新課表同樣成立）：

  | Track | 空 Challenge 的 review | 落點 |
  | --- | --- | --- |
  | Foundation | 4 | w1 / w2 / w3（`programming-mindset`）＋ **w28（`queue` 的三個實作課）** |
  | InterviewReady | 3 | w1 / w2（`programming-mindset`）＋ **w21（`stack` 尾 + `queue`）** |
  | InterviewMastery | 3 | w1 / w2（`programming-mindset`）＋ **w28（`tree` 的四個走訪課）** |

  **MUST NOT 把省略歸因為「只發生在 `programming-mindset` 期間」**：全課綱共有 **27 個** `leetcode: []`
  的純觀念 Concept，`programming-mindset` 只佔 10 個，其餘 17 個散在 heap(4) / queue(3) / graph(2) /
  sliding-window(2) / tree(2) / array / dfs-bfs / linked-list / stack 各 1——當它們**恰好整週相鄰**時
  同樣會產生空候選池。驗收（T064）MUST 以「該週 Concept 是否全部無題」為判準，
  **MUST NOT 以「是否落在課程開頭」為判準**，否則上表三筆課程中段的省略會被誤判為缺陷。
- **SC-002**: 三個 Track 的**全部** review Session 都在版面結尾呈現一句鼓勵語；同一 Track 內連續 30 個
  review Session 取得的鼓勵語互不相同。
- **SC-003**: 對「三個 Track × 各自課表全部 Session」執行完整編譯與 render，100% 通過預算與結構檢查
  （逐區塊上限、單則 ≤ 5,500、Discord 結構性上限），零例外。
- **SC-004**: 同一 `(track, sessionIndex)` 重複編譯 100 次，產出的 embeds 100% byte-identical。
- **SC-005**: 課表生成器重跑兩次產出 byte-identical 的三份課表；三份課表的 Session 數符合 FR-014d 的
  預期輸出（**198 / 200 / 243**），且**三軌涵蓋的 Concept 集合與引入順序相對於 F7 凍結版本 100% 相同**
  （移除 rest 與跳過無題槽只改變 Session 編號與總長，不得改變任何一門課的教學內容或先後）。
  **比對方法（MUST 可執行，MUST NOT 目視 diff）**：對每份新舊課表各取
  `sessions.filter(type === "concept").map(conceptId)` 的序列，兩序列 MUST 完全相等。
  **比對基準版本**：F7 併入 `develop` 的 merge commit（`db3f594 merge(007-content-generation)`）
  上的 `schedules/*.json`。
  **本次課表 diff 必然是全面性的**（移除 rest 會使其後每個 `sessionIndex` 前移），故 MUST NOT 以
  diff 面積作為驗收條件。
- **SC-012**: 三份課表中，`problemIds` 為空的 `practice` / `challenge` Session 數 MUST 為 **0**
  （空槽一律不產生），且每一個被跳過的槽都有對應的具名 warning 可追溯。
  > **編號提醒**：本條編號雖為 012，位置緊接 SC-005 是刻意的——兩者同為「課表重跑」的驗收項，
  > 一起讀才完整。編號 MUST NOT 更動（plan.md / tasks.md / contracts/ 已引用）。
- **SC-006**: 在完全沒有 LLM API key 的環境下，每日推播流程與 CI Gate 皆 100% 成功執行。
  **「每日推播流程」在此 MUST 指 `DRY_RUN=true` 的完整 compile + render 路徑**（不推播、不寫 state）
  ——本專案明訂 MUST NOT 對真實 Discord webhook 驗證版面，故該 SC 的可執行形態只能是 dry run。
  CI Gate 指 `validate:content`（全 Track × 全 Session 編譯 + render + 預算檢查）。
- **SC-007**: 素材 Gate 對刻意植入的違規樣本 100% 攔截並指名根因，零漏放、零自動截斷。
  **涵蓋範圍以 rule 名稱界定**（`contracts/material-schema.md` §3 的 8 個 rule）：
  `material-budget`、`material-traditional-chinese`、`material-duplicate`、`material-quota`、
  `material-pool-size`、`material-progress-coupled` 以人工植入樣本驗證（quickstart §6）；
  `material-schema` 與 `material-unknown-topic` 以單元測試驗證（載入層 throw 與未知 Topic key，
  不適合以手改 `data/` 的方式植入）。**8 個 rule MUST 全數有對應驗證，缺一即本 SC 不成立。**
- **SC-010**: 任一 Track 走完整輪課程的過程中，同一則 Reflection 問題被推播的次數 MUST **≤ 1**
  （即題庫配額足以支撐該軌的全部 review Session，不發生輪替繞回）。此保證僅適用於**單一 Track 內**。
  **上限而非等值**：每 Topic 生成 6 則、單 Topic 最大出現次數為 4（FR-003a 的計算式配額只保證
  「則數 ≥ 出現次數」），故每個 Topic 必然有數則在該軌**一次都不會被推播**——寫成「次數 = 1」
  會使本 SC 恆為假、不可驗收。可驗收的形態是「對每一則問題統計推播次數，最大值 MUST ≤ 1」。
- **SC-011**: 對刻意植入語意重複（同一 Topic 內兩則僅措辭不同）或可用「是／否」回答的樣本，
  LLM self-check 100% 標記為不合格並觸發重生；連續 3 次不過的批次 100% 被標記為「待人工檢視」
  且不進入凍結產物。
- **SC-008**: 素材生成腳本中斷後重跑，已通過 Gate 的部分 100% 被跳過（零重複消耗免費層額度）。
- **SC-009**: 本 Feature 交付後，`concepts/**` 與 `articles/**` 的檔案內容零變更。
  **查驗方式**：素材產線執行後 `git status --porcelain -- concepts/ articles/` **無輸出**；
  Feature 併入前，該分支相對於 F7 基準對這兩個目錄的 diff 為空。

## Assumptions

- **素材來源採 LLM build-time 生成**：§20.1 對鼓勵語錄池寫的是「生成初稿；亦可人工撰寫」。本 Feature 採
  **LLM 生成 + 自動 Gate** 路線，與 Reflection 題庫一致，理由是憲章 XVII 明訂唯一常態性人工檢查點是課綱
  大綱定稿——若語錄池改為人工撰寫，等於為每次擴充新增一道人工工序。生成後的 diff review 屬一般 commit
  review，不構成新的常態性審核關卡。
- **沿用 F7 既有的產線基礎設施**：節流、退避、LLM client、self-check 的回應契約與重生迴圈語意
  **MUST 直接重用** `scripts/lib/` 既有模組，本 Feature 不新建平行實作。
  **唯一的例外是 checkpoint 的資料結構**：F7 的 manifest 以 Concept 為鍵、欄位語意綁定 Skeleton 與
  Article（`skeletonHash` / `articleFrozen`），而本 Feature 的續跑單位是**批次**（FR-026）。
  沿用該結構會讓欄位名說謊。故 MAY 新增以批次為鍵的 manifest，但 **MUST 復用既有的內容雜湊與原子寫入
  （先寫暫存檔再 rename）路徑**，MUST NOT 另寫一套寫檔邏輯——F7 已記錄「寫到一半被中斷會留下半截 JSON、
  導致整份 manifest 不可用」的實測教訓。
- **語錄池規模下限取 30**：最長 Track（InterviewMastery，243 Session、**42** 個 review Session——
  導出值，見 FR-007）；30 則可保證一輪課程內最多繞回一次。**與 Reflection 題庫的判準刻意不同**——語錄與課程內容無關，繞回一次幾乎不可察覺，
  故只設下限、不設計算式；Reflection 問題綁定 Topic，重複會被立刻認出，故用 FR-003a 的計算式嚴格把關。
- **「同時訂閱三軌」的重複不納入保證**：同一 Topic 跨三軌合計最多被選 4+3+3=10 次，而題庫每 Topic 僅 6 則，
  故同時訂閱三個 Track 的使用者可能在不同頻道看到同一則 Reflection 問題。此為刻意取捨（見 Clarifications），
  SC-010 的不重複保證僅適用於**單一 Track 內**。
- **Topic 與 Module 在現行課綱中為 1:1**：`curriculum/modules.json` 的 16 個 Module 各含恰好 1 個同名 Topic，
  故 FR-002 的「依 Topic 組織」在現行資料下等於 16 個分組。此為觀察到的現況而非約束——題庫的組織鍵仍
  MUST 綁 Topic 識別項，使未來 Module 拆出多個 Topic 時不需重構。
- **移除 rest 屬既有參數的修訂，不是新增能力**：`rhythm` 本來就是 `track-params.json` 的可設定欄位，
  本 Feature 只是改值並放寬一條過度嚴格的驗證；生成器演算法、課表 schema、`SessionType` 皆不變。
- **review 的 Challenge 沿用「每 Session ≤3 題」與「無 fallback」既有定案**，不為 review 另立一套選題語意。
- **不改動 `Lesson` 型別契約**：`reflectionQuestion` / `encouragement` 維持選配欄位（缺席即省略），使素材
  檔損毀時仍有可用的降級路徑。

## Dependencies

- **F6（`006-pipeline-mvp`）**：每日端到端管線與狀態推進；本 Feature 的素材需經由該管線推播驗證。
- **F7（`007-content-generation`）**：全量課綱（16 Module / 165 Concept）、題庫（**351 題**）、三份正式課表；
  Reflection 題庫的 Topic 組織與 review 選題的候選池皆依賴 F7 的凍結產物。
- **F5（`005-lesson-compiler`）既有契約**：`Lesson` 的選配欄位、`checkBudget` 中已就位的
  `reflectionQuestion`（≤300）／`encouragement`（≤200）預算項、Renderer 的 review / rest 分支骨架。
- **F4（`004-schedule-generator`）既有生成器與參數 schema**：review 槽選題將加在既有的 `emitSessions`
  節奏攤課流程中；rhythm 驗證的放寬（FR-014b）亦落在 F4 建立的 `track-params.json` zod 層。
  本 Feature **修訂 F4／F7 已定案的 Track 參數**（rhythm 移除 rest 槽），該修訂已寫回 `docs/spec.md`
  §13.2／§13.5／§22.5 作為專案的真實來源。

### 上游輸入變動時的重驗路徑（MUST）

本 Feature 的產物依賴 F7 的凍結輸入（16 Topic / 165 Concept / **351 題** / 三份課表）。下列任一項變動時
MUST 依序重驗，MUST NOT 只重跑其中一段：

| 變動 | MUST 重跑 | 理由 |
| --- | --- | --- |
| `curriculum/modules.json` 的 Topic 增刪 | 素材生成（新 Topic 無題庫）→ 課表生成 → 素材 Gate | 題庫以 Topic 為組織鍵（FR-002） |
| Concept 增刪 / 順序調整 | 課表生成 → 素材 Gate（配額） | 配額為三份課表的導出值（FR-003a / FR-003b） |
| Problem Bank 變動 | 課表生成（review / practice / challenge 選題）→ 內容 Gate | 選題以題庫難度為排序鍵（FR-017） |
| `track-params.json` 變動 | 課表生成 → 素材 Gate（配額）→ 內容 Gate | rhythm 影響 review 落點與 Topic 出現次數 |

**素材本身不需因課表變動而重生成**（問題內容與課表無關），但**配額 Gate MUST 重跑**——課綱一改就可能
出現「某 Topic 的 review 次數超過題庫則數」。
