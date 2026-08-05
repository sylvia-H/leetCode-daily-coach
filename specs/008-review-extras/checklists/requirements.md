# Specification Quality Checklist: Weekly Review 素材、鼓勵語錄池與 review 版面完善（含移除 rest 槽）

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-01
**Last validated**: 2026-08-01（`/speckit-clarify` 後重新驗證）
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- 本 Feature 屬既有系統的補完，spec 內對既有產物路徑（`data/reflection-bank.json`、
  `data/encouragement.json`、`schedules/{track}.json`、`curriculum/track-params.json`）與既有元件名稱
  （Lesson Compiler、Renderer、`generate-schedule.ts`）的引用**不視為實作細節洩漏**——這些是
  `docs/spec.md` §13–§17 已釘死的**資料契約與責任邊界**（AI-Friendly Engineering Specification 的既有
  規範用語），本 Feature 的 spec 必須引用它們才能界定責任範圍。演算法、資料結構、函式簽章等真正的
  實作決策一律留給 `/speckit-plan`。

### `/speckit-clarify` 2026-08-01 的收斂結果

初版列出的三處待收斂項**全部已定案**，並依 CLAUDE.md「跨 Feature 決策必須落地到真實來源」寫回
`docs/spec.md`（§2 G1、§13.1、§13.2、§13.5、§14.3、§14.5、§15、§16.4、§17、§20.3、§22.5、§23）：

1. ~~跨 Topic 決勝規則~~ → **取最早引入者**（FR-011），與 §14.3 既有決勝慣例同向。
2. ~~rest 的本週回顧提示~~ → **直接移除 rest 槽**（FR-014a～d），鼓勵語改掛 review。
3. ~~Reflection 題庫每 Topic 則數~~ → **生成 6 則 + 計算式 Gate**（FR-003 / FR-003a）。

另新增三項定案：

4. **review Challenge 的候選池與排序**（FR-016 / FR-017）——推翻初版 FR-016 的 `challengeDifficulty`
   方案，實測會使 Foundation 23～29%、InterviewMastery ≥67% 的 review 無題。
5. **素材 Gate 納入兩項 rubric 的 LLM self-check**（FR-028a / FR-028b）——使原本無法驗證的 FR-004
   變為可驗證。
6. **跳過選不到題目的 `practice` / `challenge` 槽**（FR-014e / FR-014f / FR-014g）——由檢視 review 的空
   Challenge 段時發現同類問題：`programming-mindset` 全為 `leetcode: []`，Foundation 開課前 4 週每週有
   2 天推出「叫你練習卻沒給題目」的空洞訊息。課表長度再降至 **198 / 200 / 243**。

### 實作順序（已於 spec 新增專節，`/speckit-tasks` MUST 遵守）

spec 的 User Story 優先序是**價值優先序**，與實作依賴序不同。spec 已新增
「**實作順序約束（MUST，供 `/speckit-plan` 與 `/speckit-tasks` 使用）**」一節，將
①生成器與參數變更、②重跑三份課表 標記為 **Foundational（Blocking Prerequisites）**，
並列出依賴 ② 的工作與可並行的 ④ Renderer 版面。產出 `tasks.md` 後 MUST 人工確認 Phase 2
確實包含 ①②，否則 Topic 配額（FR-003a）會以舊課表計算而得到錯誤結果。

### 遺留給 `/speckit-plan` 的細部決策（已於 spec 明文標示，非未定義行為）

- **FR-020a**：review Challenge 是否額外排除同週 `practice` 已用題號（Foundation 專有的重疊情境），
  以及本週題目不足時的退回規則。MUST 於 plan 定案並以測試釘死。
  → **已於 `/speckit-plan` 定案**（research.md R4）：不排除 practice；對 challenge 改為軟排除。

---

# 第二輪：需求可達成性與一致性（`/speckit-plan` 後，2026-08-01）

**Purpose**: 進入 `/speckit-tasks` 前的**正式關卡**。審的是**需求本身寫得好不好**——完整、明確、
自洽、可量測——**不是**實作對不對。任一項不通過 MUST 先修 `spec.md`（或 `docs/spec.md`），再產 tasks。

**觸發原因**：`/speckit-plan` 的 Phase 0 發現 FR-011 / FR-012 的**字面機制與 SC-002 / SC-010 互斥**
（rhythm 6 槽 ⇒ `sessionIndex` 步長恆為 6，`mod 30` 只取得到 5 個相異索引）。第一輪的
「Requirements are testable and unambiguous」「Success criteria are measurable」皆已勾選卻沒抓到——
因為那類項目問的是「有沒有寫」，這一輪問的是「**寫的機制在實際參數下算不算得出來**」。

**焦點**：① FR ⇄ SC 可達成性　② 生成器與課表修訂　③ feature spec 與 `docs/spec.md` 的一致性
**深度**：正式關卡　**參照**：[plan.md](../plan.md)、[research.md](../research.md)、[contracts/](../contracts/)、`docs/spec.md`

**標記**：`[Gap]` 需求缺漏　`[Ambiguity]` 語意不明　`[Conflict]` 條文互斥　`[Assumption]` 未驗證假設

---

## A. 驗收標準品質（SC 是否真的被某條 FR 的機制達成）

> 本節是本輪主軸：逐條複驗其餘 SC 是否也有與 FR-011 / FR-012 同類的「寫得出來、算不出來」問題。

- [x] CHK001 SC-001 的「Challenge 段省略 **100% 僅**發生在該週涵蓋的 Concept 全部無題目時」，是否被任一條 FR 的機制保證？特別是 FR-017 的排除規則在候選池只剩該題時，會不會製造 SC-001 禁止的省略？[Achievability, Conflict, Spec §SC-001 / §FR-017]
- [x] CHK002 SC-002 的「連續 30 個 review 互不相同」在 FR-007 的池下限（**恰好 30**）與現行輪替索引下是否可達成？邊界（池 = 30、恰好一輪）是否成立？[Achievability, Spec §SC-002 / §FR-007 / §FR-012]
- [x] CHK003 SC-010 的「單一 Track 內同一則 Reflection 只出現 1 次」是否由 FR-003a（配額）與 FR-011（索引）**共同**保證，且兩者的依賴關係在需求中明寫（配額不足時索引即繞回）？[Achievability, Spec §SC-010 / §FR-003a / §FR-011]
- [x] CHK004 FR-011 / FR-012 修訂後的輪替索引，是否已明確到「同一份需求只能導出唯一一種實作」，且全文無殘留「以 `sessionIndex` 取模」的舊措辭？[Clarity, Spec §FR-011 / §FR-012]
- [x] CHK005 SC-005 的「三軌涵蓋的 Concept 集合與引入順序 100% 相同」是否定義了**可執行的比對方法**與**比對基準版本**（相對於哪一個 commit 的 F7 凍結版）？[Measurability, Spec §SC-005]
- [x] CHK006 SC-012 的「每一個被跳過的槽都有對應的具名 warning **可追溯**」是否可被客觀查驗——warning 是否被要求包含足以定位該槽的座標？[Measurability, Spec §SC-012 / §FR-014g]
- [x] CHK007 SC-007 的六類違規樣本（超預算／簡體／重複／配額不足／…）是否**逐一**對應到 FR-028 中一條可判定的 Gate 判準，無任何一類落空？[Traceability, Spec §SC-007 / §FR-028]
- [x] CHK008 SC-008 的「已通過 Gate 的部分 100% 被跳過（零重複消耗額度）」是否可被觀測——需求是否要求腳本輸出跳過清單或等價訊號？[Measurability, Spec §SC-008]
- [x] CHK009 SC-009 的「`concepts/**` 與 `articles/**` 零變更」是否指定查驗方式（git 狀態／檔案雜湊）？[Measurability, Spec §SC-009]
- [x] CHK010 SC-006 的「每日推播流程」在無 webhook、無 LLM 金鑰的環境下**以何種形態執行**（`DRY_RUN=true`？）是否明確？[Clarity, Spec §SC-006]
- [x] CHK011 SC-011 的「100% 標記」是否明確為「對刻意植入樣本的期望」，而非對真實 LLM 判斷力的保證（後者不可能驗證）？[Clarity, Spec §SC-011]

---

## B. 生成器與課表修訂：需求完整性

- [x] CHK012 `rhythm` 陣列的**長度約束**（現行 schema 釘死為 7）在移除一槽後該如何處理，是否有任一條需求定義？FR-014a / FR-014b 只提「移除 rest」與「放寬 rest 必要性」，未提長度。[Gap, Spec §FR-014a / §FR-014b / docs §13.2]
- [x] CHK013 被跳過的槽**不消耗 `sessionIndex`**，因此沒有 Session 座標可指——warning 的 `subject` 格式是否有需求定義？[Gap, Spec §FR-014g / docs §13.4]
- [x] CHK014 warning 追溯所需的「**週序號**」在有槽被跳過的情況下如何計數，是否有需求定義？[Gap, Spec §FR-014g]
- [x] CHK015 `challenge` 槽被跳過的那一週，FR-017「排除同週 `challenge` 已選題號」的排除集為空——該情境是否有定義的行為？[Coverage, Gap, Spec §FR-017 / §FR-014e]
- [x] CHK016 槽被跳過時，生成器累積的狀態（已引入 Concept、已用過的 challenge 題號）是否仍照常累積，需求是否說明？[Gap, Spec §FR-014e]
- [x] CHK017 「某週全部 `concept` 槽皆被跳過、但 `review` 仍一律產生」的情境是否被需求覆蓋——此時 `reviewRange` 是否可能成為空區間？[Coverage, Gap, Spec §FR-014f]
- [x] CHK018 「rhythm 的第一個槽必為 `concept`」是明寫的約束，還是**未記錄的隱含假設**？`reviewRange` 非空、`compileReview` 不拋錯皆依賴它。[Assumption, Gap, docs §13.2]
- [x] CHK019 三份課表重生成後，「跳過的槽落在哪些週」是否被要求以可比對的形式輸出（`docs/spec.md` §13.5 已列出預期落點，需求是否要求驗證它）？[Gap, docs §13.5 / Spec §SC-012]

---

## C. 生成器與課表修訂：需求明確性

- [x] CHK020 FR-016 的「`reviewRange` 涵蓋的 concept Session 的 `problemIds` 聯集」是否明確為**課表已寫入的 `problemIds`**，而非由 `leetcode` 重新過濾一次？兩者結果不同（overlay 附加題、≤3 題截取）。[Ambiguity, Spec §FR-016 / docs §15]
- [x] CHK021 FR-014e 的「`problemIds` 為空」對 `practice`（聯集為空）與 `challenge`（選不到題）是否為**同一個可判定條件**，或需要分別定義？[Clarity, Spec §FR-014e]
- [x] CHK022 FR-019 的「byte-identical」是以何為比對基準——同一次執行重跑兩遍、跨機器、還是跨 Node 版本？[Clarity, Spec §FR-019]
- [x] CHK023 FR-020 的「`problemIds` 長度恰為 **0**」與課表序列化規則的「空陣列省略欄位」是否指同一件事？[Clarity, Spec §FR-020]
- [x] CHK024 FR-016「難度帶由聯集**隱含決定**」與 FR-017「**先依難度由低至高**排序」是否為同一組規則的兩種說法，會不會被讀成兩道各自獨立的過濾？[Consistency, Spec §FR-016 / §FR-017]

---

## D. 素材與 Gate：需求完整性

- [x] CHK025 Reflection 選取所需的「Topic 歸屬規則」（FR-011）與 Gate 配額計算所需的**同一規則**（FR-003a），是否明訂 MUST 為單一實作、不得兩處各寫一份？[Gap, Spec §FR-003a / §FR-011 / 憲章 IX]
- [x] CHK026 FR-008 的「MUST NOT 包含外部連結、MUST NOT 提及任何具體題號或 Concept」是否有**可判定的機械判準**（明確的樣態清單），或明確指派給非機械把關？[Gap, Spec §FR-008 / §FR-028]
- [x] CHK027 `docs/spec.md` §20.3 Stage 3 關卡 1 的機械 Gate 清單（schema／預算／繁中／去重）是否涵蓋 FR-007 的**池規模下限**與 FR-008 的**進度耦合檢查**？兩者目前不在該清單內。[Completeness, docs §20.3 / Spec §FR-007 / §FR-008]
- [x] CHK028 素材檔的**序列化規則**（鍵排列序、縮排、檔尾換行）是否有需求定義？沒有它，「可重生成／byte-identical」無法驗證。[Gap, Spec §FR-026 / §SC-008]
- [x] CHK029 某個 Topic 連續 3 次不過而標記 `needsHumanReview` 時，**批次整體的結束狀態**（exit code、是否視為失敗、已通過的批次是否仍凍結）是否定義？[Gap, Spec §FR-028a / §SC-011]
- [x] CHK030 素材檔**存在但缺某個 Topic 的 key**（非整檔缺席）的降級行為是否有需求定義？FR-014 只寫「素材檔缺席或為空集合」。[Coverage, Gap, Spec §FR-014]
- [x] CHK031 語錄池為**空陣列**時的行為是否定義？FR-012 只註明「池只有一則」的例外。[Edge Case, Spec §FR-012 / §FR-014]
- [x] CHK032 FR-004 的「MUST 為開放式反思問題」是否有可判定的定義，或已明確指派給 FR-028a 的 self-check（避免成為無人負責的 MUST）？[Clarity, Spec §FR-004 / §FR-028a]
- [x] CHK033 FR-028 的「CJK 佔比達門檻」對**短句語錄**是否沿用與教材相同的門檻，需求是否明確？[Clarity, Spec §FR-028]

---

## E. 一致性：feature spec ⇄ `docs/spec.md`（真實來源）

- [x] CHK034 FR-011 / FR-012 修訂後的輪替索引，與 `docs/spec.md` §15 的「每日 runtime 依 `sessionIndex` 決定性選取／輪替」措辭是否**仍相容**？若讀者會把該句理解為「以 `sessionIndex` 取模」，是否需要在真實來源一併澄清？[Consistency, docs §15 / Spec §FR-011 / §FR-012]
- [x] CHK035 FR-014d 把 **198 / 200 / 243** 寫成 MUST，與 `docs/spec.md` §13.5 的「課表長度是導出值，**MUST NOT 在 spec 或任何設定中把長度寫死為固定值**」是否構成衝突？[Conflict, Spec §FR-014d / docs §13.5]
- [x] CHK036 FR-014g 的「**沿用並擴充**既有的 `challenge-no-problem` 語意至 practice」是否等同「共用同一個 rule id」？plan 的設計新增了獨立的 `practice-no-problem`——需求措辭是否允許？[Ambiguity, Spec §FR-014g / docs §13.4]
- [x] CHK037 feature spec Assumptions 採「語錄池由 LLM 生成」，與 `docs/spec.md` §20.1 的「亦可人工撰寫」是否需要在真實來源消除歧異？[Consistency, docs §20.1 / Spec Assumptions]
- [x] CHK038 `docs/spec.md` §20.4 的產線韌性條款只點名 `generate-curriculum.ts` / `generate-content.ts`，是否已擴及 Stage 3 的素材腳本？FR-026 要求同等韌性。[Gap, docs §20.4 / Spec §FR-026]
- [x] CHK039 `docs/spec.md` §20.4 的免費層額度評估（Stage 1 + Stage 2 合計 600–800 次）是否已納入 Stage 3 的呼叫量？[Gap, docs §20.4]
- [x] CHK040 `docs/spec.md` §17 目錄樹的 `scripts/` 清單是否已納入素材產線腳本？（目前只列 `generate-curriculum` / `generate-content` / `generate-schedule` / `validate`）[Gap, docs §17]
- [x] CHK041 `docs/spec.md` §13.4 的 challenge 選題舊條文（「候選池為空時 `problemIds` 省略為合法…產出無題目的挑戰日」）與 F8 的「無題即跳過」是否已完全取代、無殘留互斥敘述？[Conflict, docs §13.4]
- [x] CHK042 三軌 review Session 數（`docs/spec.md` §13.5 的 35 / 34 / 42）與 FR-007 的池規模下限、SC-002 的「連續 30」是否彼此相容且無隱含矛盾？[Consistency, docs §13.5 / Spec §FR-007 / §SC-002]

---

## F. 依賴與假設

- [x] CHK043 「某 Topic 最大被選次數為 **4**」是依現行課綱的實測導出值——需求是否明確它**不是常數**，且課綱一改即由 Gate 重算？[Assumption, Spec §FR-003a]
- [x] CHK044 課表重跑與 `state` 分支進度的關係（Edge Cases 於 2026-08-01 查證 `currentSessionIndex: 2`）是否被寫成**實作時必須重驗的需求**，而非一次性觀察結論？該值每天都在推進。[Assumption, Spec Edge Cases]
- [x] CHK045 rest 槽移除後，`compileRest` / `buildRestBlocks` 失去全課表 Gate 的覆蓋——是否有需求要求以其他方式維持覆蓋（否則退化為無人測到的死路徑）？[Coverage, Spec §FR-014c / §FR-032]
- [x] CHK046 「沿用 F7 既有產線基礎設施」（節流／退避／checkpoint／self-check）的假設，是否逐項對應到**確實可重用**的既有模組，而非籠統宣告？[Assumption, Spec Assumptions / §FR-026 / §FR-028b]
- [x] CHK047 本 Feature 以 F7 凍結產物（16 Topic / 165 Concept / 351 題 / 三份課表）為輸入——需求是否說明這些輸入變動時素材與課表的重驗路徑？[Dependency, Spec Dependencies]

---

## 第二輪 Notes

- 完成後於 `[ ]` 打勾；**不通過的項目 MUST 先修需求文件再產 tasks**，不得留到 implement 階段。
- 修到 `docs/spec.md` 的項目（E 節多數）MUST 同步消除既有段落的矛盾（CLAUDE.md「跨 Feature 決策必須落地到真實來源」）。
- 本輪審的是**需求品質**，不是實作正確性；實作面的驗收見 [quickstart.md](../quickstart.md)。
- 部分項目在 `/speckit-plan` 已有設計答案（如 CHK001 / CHK013 / CHK020 由 research R4 / R2 / R3 定案）。
  **這些項目仍 MUST 勾選**——要確認的是「**需求文件本身**是否寫下了該決策」，而不是「plan 是否想過」。
  設計文件不是需求的真實來源。

---

## 第二輪執行結果（2026-08-01，全 47 項已跑完並修訂需求）

**判定**：47 項中 **38 項不通過**（需求缺漏／語意不明／條文互斥），**9 項通過**。
不通過者**全部已修**——新增 8 條 FR、改寫 12 條既有 FR/SC，並修訂 `docs/spec.md` 9 處。

### 不通過並已修（38，下表按主題合併列出）

| 項 | 判定 | 修訂落點 |
| --- | --- | --- |
| CHK001 | **Conflict** — FR-017 的無條件「MUST 排除同週 challenge 題號」在候選池只剩該題時，會製造 SC-001 禁止的省略 | 新增 **FR-017a**（軟排除 + 具名 warning）；`docs/spec.md` §15 同步 |
| CHK003 | Gap — SC-010 對 FR-003a 的依賴未明寫 | FR-003a 增列「與 SC-010 的依賴關係」段 |
| CHK005 | Gap — 無比對方法與基準版本 | SC-005 增列 conceptId 序列比對法 + 基準 commit `db3f594` |
| CHK006 / CHK013 / CHK014 | Gap — 跳過類 warning 無可用座標；輪次序未定義 | 新增 **FR-014g1**（輪次序 + 槽位序，禁用 `sessionIndex`）；`docs/spec.md` §13.4 同步 |
| CHK007 / CHK026 | Gap — FR-028 只列 5 項，漏池規模與進度耦合；FR-008 無機械判準 | FR-028 改寫為**七項**並釘死四項樣態清單；`docs/spec.md` §20.3 Stage 3 關卡 1 同步 |
| CHK008 | Gap — SC-008 不可觀測 | 新增 **FR-026a**（輸出跳過批次清單）；`docs/spec.md` §20.4 同步 |
| CHK009 | Gap — 無查驗方式 | SC-009 增列 `git status --porcelain` 判準 |
| CHK010 | Ambiguity — 「每日推播流程」形態不明 | SC-006 釘死為 `DRY_RUN=true` 的 compile + render |
| CHK012 | **Gap（最嚴重）** — rhythm 長度約束完全未被任何需求提及 | 新增 **FR-014b1**（範圍 2–14，禁止改寫為固定 6）；`docs/spec.md` §13.2 同步 |
| CHK015 | 由 CHK001 的軟排除一併解消 | FR-017a |
| CHK016 | Gap — 跳過時的跨槽累積狀態未定義 | FR-014e 增列「跳過 MUST NOT 影響累積狀態」 |
| CHK017 / CHK018 | Gap — 依賴未記錄的隱含假設 | FR-014f 增列**結構保證**（輪次進入條件 + 佇列只被 concept 消耗）＋ `review-range-invalid` 護欄；`docs/spec.md` §13.4 同步 |
| CHK020 | Ambiguity — 「聯集」可讀成重新過濾 | FR-016 釘死為「課表已寫入的 `problemIds`」；`docs/spec.md` §15 同步 |
| CHK021 | Clarity — 兩種槽的「空」判準未分別定義 | FR-014e 增列兩者的觸發條件與可區分訊息要求 |
| CHK022 | Clarity — determinism 比對基準未定義 | FR-019 釘死為「同輸入 × 同 Node major」 |
| CHK023 | Clarity — 「長度 0」與「欄位省略」混用 | FR-020 改寫為「整個欄位省略，MUST NOT 是 `[]`」 |
| CHK024 | Consistency — 難度可能被讀成第二道過濾 | FR-017 增列「難度只作排序鍵」；`docs/spec.md` §15 同步 |
| CHK025 | Gap — 未要求 Gate 與 Compiler 共用歸屬實作 | FR-003a 增列單一實作 MUST；`docs/spec.md` §15 同步 |
| CHK027 | Completeness — 真實來源 Gate 清單缺兩項 | `docs/spec.md` §20.3 Stage 3 關卡 1 補齊 |
| CHK028 | Gap — 素材檔無序列化規則 | 新增 **FR-009a**；`docs/spec.md` §20.3 同步 |
| CHK029 | Gap — 批次結束狀態未定義 | FR-028a 增列 (a)(b)(c) 三款；`docs/spec.md` §20.3 新增關卡 5 |
| CHK030 / CHK031 | **Conflict** — FR-014 的「空集合即省略」與素材 schema 的 `min(1)` 互斥 | FR-014 改寫為**三種降級情境**並明訂 schema MUST 允許空集合；同步修 `data-model.md` §1/§2 與 `contracts/material-schema.md` §1 |
| CHK033 | Clarity — 短句素材的 CJK 門檻未定 | FR-028 第 3 項釘死沿用教材既有預設值 |
| CHK034 | Consistency — `docs/spec.md` §15 措辭仍可被讀成 `sessionIndex` 取模 | §15 新增兩條輪替索引 bullet，含反例推導 |
| CHK035 | **Conflict** — FR-014d 把 198/200/243 寫成 MUST vs §13.5「MUST NOT 寫死長度」 | FR-014d 改寫為「預期輸出，供驗收比對」，並明禁反向調整生成器湊數 |
| CHK036 | Ambiguity — 「沿用並擴充」是否允許新 rule id | FR-014g 明確 MAY 另立 `practice-no-problem` 並說明根因差異；`docs/spec.md` §13.4 同步 |
| CHK037 | Consistency — §20.1「亦可人工撰寫」與本 Feature 定案相左 | `docs/spec.md` §20.1 改為明確採 LLM 生成，附憲章 XIII / XVII 理由 |
| CHK038 | Gap — §20.4 韌性條款未涵蓋 Stage 3 | §20.4 三項條款擴及 `generate-materials.ts`，並定義**批次**為 Stage 3 的續跑單位 |
| CHK039 | Gap — 額度評估未含 Stage 3 | §20.4 新增 Stage 3 呼叫量（35–70 次），合計改為 600–900 |
| CHK040 | Gap — §17 目錄樹缺素材腳本 | §17 `scripts/` 新增 `generate-materials.ts` |
| CHK041 | **Conflict** — §13.4 的 F4 challenge 舊條文與 F8「無題即跳過」互斥 | §13.4 該項加註「末句自 F8 起被取代」，並釐清哪些部分不變 |
| CHK046 | Assumption — 「重用 checkpoint」不成立（F7 manifest 以 Concept 為鍵） | Assumptions 改寫：MAY 新增批次 manifest，但 MUST 復用雜湊與原子寫入 |
| CHK047 | Gap — 上游輸入變動的重驗路徑未定義 | Dependencies 新增「上游輸入變動時的重驗路徑」表（4 類變動 × 重跑順序） |

### 通過（9）

| 項 | 依據 |
| --- | --- |
| CHK002 | 池 = 30 時，連續 30 次取值恰為一輪，索引互異；池 36 更寬裕 |
| CHK004 | `grep` 確認 spec 全文已無「以 `sessionIndex` 取模」的殘留措辭 |
| CHK011 | SC-011 原文已寫「對**刻意植入**…的樣本」，未宣稱保證真實 LLM 判斷力 |
| CHK019 | 由 CHK006 的座標修訂後，warning 即可對應 `docs/spec.md` §13.5 的預期落點 |
| CHK032 | FR-004 原文已把「開放式」指派給 FR-028a 的 self-check |
| CHK042 | 35 / 34 / 42 個 review 與池下限 30、SC-002 的「連續 30」相容（IM 繞回一次為既定取捨） |
| CHK043 | FR-003a 原文已寫「現行課綱下最大為 4」；另新增 **FR-003b** 強化為 MUST NOT 寫死 |
| CHK044 | Edge Cases 原文已寫「實作時 MUST 重新確認此前提仍成立」 |
| CHK045 | FR-032 原文已列 `rest` 的 compile / render 單元測試要求 |

### 新增條文一覽

`FR-003b`、`FR-009a`、`FR-014b1`、`FR-014g1`、`FR-017a`、`FR-017b`、`FR-026a`
＋ FR-028 由 5 項擴為 7 項　＋ Dependencies 新增「上游輸入變動時的重驗路徑」節。

