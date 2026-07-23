# Compiler & Boundaries Checklist: Lesson Compiler、全 Session 類型 Renderer 與內容 CI Gate

**Purpose**: `/speckit-implement` 前的**需求品質關卡**——檢驗「Compiler 資料契約」與「跨 Feature 邊界
（F1 債 / F4 / F7 / F8）」的需求是否**寫得完整、無歧義、彼此不衝突、可客觀驗證**。
本清單檢查的是**規格文字本身的品質**，不是實作行為是否正確。

**Created**: 2026-07-23 ｜ **Reviewed**: 2026-07-23（58/58 通過；14 項於本次審查中修正需求文字後通過）
**Feature**: [spec.md](../spec.md) ｜ **設計依據**: [plan.md](../plan.md)、[research.md](../research.md)、
[data-model.md](../data-model.md)、[contracts/](../contracts/)

**焦點領域**: Compiler 契約完整性、跨 Feature 邊界（F4 / F7 / F8）
**深度**: pre-implement Gate（標準）｜**使用者**: 實作者本人，於 `/speckit-tasks` 之後、`/speckit-implement` 之前

---

## Requirement Completeness（Compiler 契約是否寫齊）

- [x] CHK001 Full Article **必備區塊的完整清單**是否明確列出（含閱讀用與推播用兩組），且「缺漏即失敗」與「允許存在但被忽略」的區塊界線是否寫明？[Completeness, contracts/article-format.md §3]
- [x] CHK002 Compiler 可自 Article frontmatter 讀取的欄位、以及**MUST NOT** 自 Article 讀取（改由 Skeleton／DAG 為權威）的欄位，是否各自列舉完整？[Completeness, contracts/article-format.md §2]
- [x] CHK003 `CompilerDeps` 的每一項相依（DAG / 題庫 / 課表 / Overlay / 讀檔邊界 / F8 素材）是否都定義了「缺席」與「不合法」兩種狀態的需求？[Completeness, contracts/lesson-contract.md §1]
  > **修正**：原契約只寫了 Overlay 的「不存在 vs 壞檔」，F8 素材與課表未涵蓋。已在 contracts/lesson-contract.md §1 補上五類檔案的「缺席 / 壞檔」對照表，並明訂壞檔 MUST NOT 被當成缺席靜默略過。
- [x] CHK004 五種 Session 類型**各自**的 Lesson 欄位來源表是否都已寫出（無任一類型只以「同上」帶過）？[Completeness, contracts/lesson-contract.md §2]
- [x] CHK005 `compile` 的錯誤契約是否對每一種可預期失敗都定義了**訊息必含的識別資訊**（而非只說「fail loud」）？[Completeness, contracts/lesson-contract.md §4, Spec §FR-003]
- [x] CHK006 `Lesson` 每個新增／改動欄位（`color` / `reviewConcepts` / `overlayNotes` / `whyThisPattern` 轉選配）是否都寫明「何時 MUST 存在、何時 MUST 省略」？[Completeness, data-model.md §2]
  > **修正**：原型別不變式只涵蓋 `concept` / `path` / `reviewConcepts`。已於 data-model.md §2 補上 `color`、`overlayNotes`、`reflectionQuestion`、`encouragement`、`whyThisPattern` 的存在條件，並一律要求「不存在」而非空字串。
- [x] CHK007 預算表是否涵蓋**所有**會被渲染的內容區塊——包含本 Feature 新增的 `overlayNotes`，而非只沿用 F1 的七項？[Completeness, data-model.md §5, Spec §FR-019]
- [x] CHK008 Gate 的違規模型是否列出全部規則值，且每個規則都對應到至少一個 spec 需求？[Completeness, data-model.md §6, Spec §FR-022~FR-024]
  > **修正**：`schedule-empty` 只存在於 contracts，spec 無對應需求。已於 FR-022 補上「任一 Track 課表為空 MUST 視為違規」及其理由（避免 Gate 以「通過 0 筆」靜默失效）。
- [x] CHK009 `Today's Challenge` 條目格式是否連「解析時要去除哪些前導符號」「`hint` 的辨識前綴」等**解析細節**都寫明，使兩個實作者不會做出不同解析器？[Completeness, contracts/article-format.md §4]

## Requirement Clarity（模糊詞是否已量化／定義）

- [x] CHK010 「確定性（deterministic）」是否以**可客觀檢查的判準**定義（序列化後 byte-identical、禁用哪些資訊源），而非只寫「同輸入同輸出」？[Clarity, Spec §FR-012, quickstart §2]
- [x] CHK011 「疊加不取代」是否對三個 Overlay 欄位**各自**給出可驗證的語意（附加位置、去重規則、呈現形式），而非只有原則性宣示？[Clarity, Spec §FR-009, research R6]
  > 隨 CHK019 一併修正：FR-009 改為逐欄位條列，三個欄位各有明確語意。
  > **2026-07-23 `/speckit-analyze` 再修**：`extraProblemIds` 的 Compiler 側語意（附加位置／去重規則）已整條
  > 移除——該欄位改為「本 Feature 不消費」，語意只剩「F4 生成端已套入課表」。三欄位中僅
  > `extraNotesMarkdown` 有 Compiler 側語意（見 CHK059）。
- [x] CHK012 `path` 的「最接近的前置／後繼」是否以明確的排序鍵定義（`ordinalOf` 最大／最小），使多前置情境無二義？[Clarity, Spec §FR-008, research R4]
- [x] CHK013 「省略該段落」與「空字串／佔位符」的差異是否明文界定為 embed／field **不存在**？[Clarity, Spec §FR-031, contracts/renderer-contract.md §2]
- [x] CHK014 「單一預算檢查函式、同一次呼叫」是否寫明其涵蓋範圍（逐區塊 + 結構性上限 + 總量），可據以判斷實作是否違反？[Clarity, Spec §FR-019]
- [x] CHK015 長度單位是否明確為 Unicode code point，且計入／不計入的欄位清單是否完整？[Clarity, contracts/renderer-contract.md §4]
- [x] CHK016 `practice` 版面的「固定提示文案」是否界定為 Renderer 文案（非內容素材），避免與「MUST NOT 憑空發明資料」相衝突？[Ambiguity, research R5]
  > **修正**：已於 contracts/renderer-contract.md §2 補註——固定提示文案屬 Renderer 版面文案，不受「MUST NOT 憑空發明資料」約束；並以「practice MUST NOT 推導近期 Concept 清單」作為對照組界定該約束的真正適用對象。
- [x] CHK017 stub fixture Article 的「最小可編譯」是否有可判定的標準（區塊齊備、真實繁中、足以讓預算檢查有意義），而非任憑實作者拿捏？[Clarity, research R8, Spec Assumptions]
  > **修正**：已於 spec Assumptions 明訂驗收標準＝「通過本 Feature 的內容 Gate」，並列出四項可判定條件（區塊齊備非空、frontmatter 合格、`Today's Challenge` 涵蓋三份課表用到的全部題號、預算未超限），另明文禁用 lorem／填充字元。

## Requirement Consistency（三份文件之間是否對齊）

- [x] CHK018 spec FR-006（每題說明取自 Article）與 contracts/article-format.md §4「條目多於課表題號不算錯」是否語意一致、無互相否定？[Consistency, Spec §FR-006]
  > **修正（衝突）**：原 FR-006 寫「條目 MUST 與題號集合對齊，不對齊即 fail loud」，與契約的單向規則互相否定。已改寫為明確的**單向包含**：課表題號 ⊆ 條目，缺漏即失敗；條目較多為正常狀態。
- [x] CHK019 spec FR-009 對 Overlay `challengeDifficulty` 的描述，與 research R6「本 Feature 不消費」的定案是否已對齊（spec 文字是否仍暗示會生效）？[Conflict, Spec §FR-009, research R6]
  > **修正（衝突）**：原 FR-009 寫「`challengeDifficulty` 影響 challenge 選題」，與 R6 定案相反。已改寫為「本 Feature MUST NOT 消費」，並補上「Compiler MUST NOT 於 runtime 重新選題」與日後生效時的正確套用點（`generate-schedule.ts`）。
- [x] CHK020 spec FR-030（查無來源不失敗）與 FR-006（條目不對齊即失敗）的**適用範圍**是否切分清楚，不會被讀成互相矛盾？[Consistency, Spec §FR-006 / §FR-030]
  > **修正**：FR-006 已冠上「**`concept` 類 Session**」限定並加註「非 concept 類見 FR-030，兩者 MUST NOT 混用」；Edge Cases 對應條目同步改寫。
- [x] CHK021 `docs/spec.md` §16.4 的 `Lesson` 定義與本 Feature data-model.md §2 是否已一致（含 `color` 上移與新增欄位）？[Consistency, data-model.md §2]
- [x] CHK022 `docs/spec.md` §14.3／§15／§16.3／§10 的四處回填內容，是否彼此一致且未與原有段落產生矛盾？[Consistency, Spec Clarifications]
- [x] CHK023 題數 1～3 的守門「唯一權威點在 `problem.ts`」是否在本 Feature 文件中被重申、且未在別處另立一套題數錯誤語意？[Consistency, contracts/lesson-contract.md §4]
- [x] CHK024 Gate 觸發路徑清單（七類）在 spec FR-025、contracts/gate-contract.md §4 與 `docs/spec.md` §21.3 三處是否完全相同？[Consistency, Spec §FR-025]
  > 三處七類路徑一致；contracts 另含「本 workflow 自身」，屬明示的超集，不構成不一致。

## Acceptance Criteria Quality（成功條件是否可客觀驗證）

- [x] CHK025 SC-001～SC-009 是否每一條都能在不看實作的前提下判定通過與否（有數字或明確狀態）？[Measurability, Spec §Success Criteria]
- [x] CHK026 SC-009「硬編常數數量為 0」是否有可執行的判定方式（可搜尋的具體符號名），而非主觀認定？[Measurability, Spec §SC-009, quickstart §7]
- [x] CHK027 Gate 的「全 Track × 全 Session」是否有明確的**期望筆數**可對照（避免 0 筆也算通過）？[Measurability, contracts/gate-contract.md §1, quickstart §1]
- [x] CHK028 每一條 FR 是否都能對應到至少一個 Acceptance Scenario 或 SC，無「只寫了要求卻沒有驗收方式」的孤兒需求？[Traceability, Spec §Requirements]
  > **修正**：FR-018（Module 配色涵蓋全部 Module + fallback）原無任何 SC 或 Scenario 對應。已新增 **SC-010**。FR-026 / FR-028 由 quickstart §1／§8 與 contracts/gate-contract.md §4 提供驗收方式，判定可接受。

## Scenario Coverage（五種類型與主要流程）

- [x] CHK029 五種 Session 類型是否**每一種**都有 Lesson 形狀需求 + 版面需求 + 至少一個 Acceptance Scenario？[Coverage, Spec §US2, research R5]
- [x] CHK030 「無題目」情境（觀念課 `leetcode: []`、難度帶過濾後為空、challenge 無候選）是否都被明確界定為合法而非錯誤？[Coverage, Spec §Edge Cases]
- [x] CHK031 例外流程（Article 缺檔 / 區塊缺漏 / id 不符 / 題號不對齊 / `reviewRange` 無 concept）是否都各自定義了預期結果？[Exception Flow, Spec §Edge Cases]
- [x] CHK032 拆訊息 fallback 的**恢復路徑**（拆後仍超限、單一 embed 自身超限）是否有明定行為？[Recovery, research R11, contracts/renderer-contract.md §3]
- [x] CHK033 Gate 的多違規流程（不中止、全數蒐集、排序穩定、彙總輸出）是否有需求層級的定義而非僅實作備註？[Coverage, Spec §FR-024]

## Edge Case Coverage（邊界條件）

- [x] CHK034 `sessionIndex` 的邊界（0、1、課表長度、超出）是否都有明定行為？[Edge Case, Spec §FR-003]
  > **修正**：原 FR-003 只寫「超出範圍」，未涵蓋 `0`、負數與非整數。已改寫為「不是 1..N 範圍內的整數即 fail loud」，並要求訊息含課表長度。
- [x] CHK035 Overlay 檔案「不存在」vs「存在但不合法」vs「指向未涵蓋 Concept」三種狀態是否各有不同且明確的需求？[Edge Case, Spec §FR-009]
- [x] CHK036 同一題號被多個 Concept 引用時的反查決勝規則是否寫到無二義（含並列時的最終決勝鍵）？[Edge Case, Spec §FR-030, research R3]
- [x] CHK037 F8 素材檔「缺席」與「存在但壞檔」是否被明確區分（前者省略、後者 fail loud）？[Edge Case, research R7]
  > 隨 CHK003 一併修正（contracts/lesson-contract.md §1 的缺席／壞檔對照表）。

## 跨 Feature 邊界：F1 債清償

- [x] CHK038 F1 待清償項目是否被**逐一列名**（硬編課表、`getPathLabels`、demo 題號、demo why/hint 常數、孤兒 Article），而非籠統寫「移除 F1 臨時碼」？[Completeness, Spec §FR-029, research R8]
  > **修正**：原 FR-029 未含孤兒 Article，且未寫出可搜尋的符號名。已補齊五項並逐一列出符號名（`SESSION_PLANS` / `getPathLabels` / `DEMO_LEETCODE_IDS` / `DEMO_PROBLEM_CONTENT` / `articles/two-pointer/002-left-right-pointer.md`），與 SC-009、quickstart §7 的檢查方式對齊。
- [x] CHK039 是否明文要求「不得留下等價替身」，以免硬編只是換個名字搬家？[Clarity, Spec §FR-029]
  > FR-029 已明文「改名搬家亦屬違反」。
- [x] CHK040 移除孤兒 Article 的決定是否記錄了理由與可回復性，使日後 review 不會誤判為誤刪？[Assumption, research R8]

## 跨 Feature 邊界：F4（課表 / Overlay）

- [x] CHK041 「Compiler 只組裝、不選題」是否被表述為**需求**（可據以判定違反），而不只是設計偏好？[Clarity, research R6, docs/spec.md §15]
  > **修正**：原本只存在於 research.md 與 `docs/spec.md`，本 Feature 的 FR 未載明。已併入改寫後的 FR-009。
- [x] CHK042 review Session 目前無題目的成因（F4 未為 review 槽選題）是否記錄為**F4 側的待補**，且指明補在生成器而非 Compiler？[Dependency, research R7]
- [x] CHK043 Compiler 對課表的第二道防線（`reviewRange` 涵蓋、dangling 參照）是否寫明與 F4 生成側 Gate 的職責分工，避免被讀成重複實作？[Consistency, contracts/lesson-contract.md §2]
- [x] CHK044 消費 F4 生成物的**假設**（課表已通過 F4 內建驗證、byte-identical 凍結）是否明文記錄？[Assumption, Spec §Assumptions]
  > **修正**：Assumptions 原只寫了 Overlay。已補上「課表為可信輸入」條目，並界定第二道防線的範圍（MUST NOT 重做 F4 完整驗證、MUST NOT 修改課表）。

## 跨 Feature 邊界：F7（內容產線）

- [x] CHK045 `Today's Challenge` 條目格式是否已被明確指認為**F7 Stage 2 的輸出義務**（而非只是本 Feature 的解析偏好）？[Dependency, docs/spec.md §10, research R1]
- [x] CHK046 「教材 TS/Python 程式碼實測延至 F7」是否在 spec、contracts 與 `docs/spec.md` §21.3／§22.5 四處都已載明，且要求 F5 不得放置空殼步驟？[Consistency, Spec §FR-028]
- [x] CHK047 stub fixture Article 於 F7 被取代的路徑是否明確（誰取代、何時取代、取代後 Gate 行為不變）？[Assumption, research R8]
  > 隨 CHK017 一併補強：Assumptions 已加註「取代後 Gate 的檢查項與判準不變」。
- [x] CHK048 Article 格式契約是否足以讓 F7 產線在**不回頭問本 Feature** 的情況下生成合格教材？[Completeness, contracts/article-format.md]
  > §1–§5 涵蓋路徑、frontmatter、固定區塊、條目格式與內容規範；§10.2 的 `exit_criteria` 上限亦已升為 MUST（見 CHK057），F7 有完整可遵循的規格。

## 跨 Feature 邊界：F8（Review 素材）與 F6（每日 pipeline）

- [x] CHK049 F8 素材缺席的過渡規則是否同時定義了「本 Feature 的行為」與「F8 接手後不需改版面邏輯」的要求？[Completeness, Spec §FR-031]
- [x] CHK050 是否明文禁止本 Feature 代 F8 建立佔位素材（含理由），避免日後出現兩套輪替規則？[Clarity, research R7]
- [x] CHK051 `render` 改回傳多則訊息對 F6 推播流程的影響（逐則 post、逐則檢查）是否已寫成需求而非留給實作推測？[Dependency, contracts/renderer-contract.md §5]
- [x] CHK052 本 Feature 與 F6 的界線（本 Feature 止於 compile + render + 預算檢查）是否明確，避免把 guard／狀態推進誤納入範圍？[Clarity, Spec §Assumptions]

## Dependencies & Assumptions（假設是否被驗證）

- [x] CHK053 「零新增相依」的假設是否成立（新需求未隱含需要新套件，例如更嚴謹的 markdown AST 走訪）？[Assumption, plan.md Technical Context]
  > `Today's Challenge` 的巢狀 list 走訪可由既有 `marked` lexer token 完成，無需新增相依。
- [x] CHK054 「Gate 通過 ⇒ runtime 不會因內容失敗」這條核心推論的**前提**（同一顆 Compiler／Renderer／預算函式、同一份 repo 內容）是否被明文列出？[Assumption, 憲章 IX, Spec §FR-023]
- [x] CHK055 Gate 可在無任何環境變數與 API key 下執行的要求，是否已寫成需求並有對應驗收方式？[Dependency, Spec §FR-027, quickstart §1]

## Ambiguities & Conflicts（尚待釐清）

- [x] CHK056 是否已無殘留的 [NEEDS CLARIFICATION] 標記，且三項定案都能在 spec 內文找到落地文字（不只在 Clarifications 段）？[Ambiguity, Spec §Clarifications]
- [x] CHK057 §10.2 的 Exit Criteria 條數／單條長度（≤6 條、每條 ≤60）在 spec 中屬 SHOULD、在本 Feature 預算檢查中卻要檢查——此強弱差異是否已明確交代？[Conflict, data-model.md §5, docs/spec.md §10.2]
  > **修正（衝突，跨 Feature）**：已將 `docs/spec.md` §10.2 由 SHOULD 升為 **MUST**，理由是「機器會擋的規則不該停在 SHOULD，否則合規的 SHOULD 卻過不了 Gate」。F7 產線生成 `exit_criteria` 時 MUST 遵守。
- [x] CHK058 §15「review MUST 含三段」與本 Feature「Reflection／Challenge 段可省略」的關係是否已被明文界定為**過渡規則**而非長期例外？[Conflict, docs/spec.md §15]

## `/speckit-analyze` 追加項（2026-07-23）

- [x] CHK059 Overlay `extraProblemIds` 的套用點是否**唯一**，且與 `challengeDifficulty` 的裁決出於同一條總則？[Conflict, Spec §FR-009, research R6, docs/spec.md §16.3]
  > **修正（CRITICAL，跨 Feature）**：核對 `src/compiler/schedule-generator.ts` 後確認 F4 `selectConceptProblems` / `unionProblems` **已**套用 `extraProblemIds`（`foundation` #4 的題號 27 即由此而來），FR-009 卻要求 Compiler 再套用一次——同一規則兩處實作（憲章 IX）且使生成物失去權威（憲章 XIII）。已統一為總則「凡會改變選題的 Overlay 欄位，唯一套用點在 `generate-schedule.ts`」，Compiler 只消費 `extraNotesMarkdown`。回寫 `docs/spec.md` §16.3，並改寫 FR-009、US5（AS-2 / AS-5）、research R6、lesson-contract §2、T008 / T048 / T050 / T051、quickstart §5。
- [x] CHK060 「每 Session 最多 3 題」的把關點是否明確、且與「MUST NOT 截斷」不衝突？[Conflict, docs/spec.md §13.4 / §14.5, data-model.md §5]
  > **修正（CRITICAL，跨 Feature）**：`schedules/interview-ready.json` #10（practice）實際排 4 題，Gate 的 `problems.count ≤3` 必然攔下，SC-001／SC-002／quickstart「39 筆通過」不可能成立；而 §14.5 又禁止下游截斷，形成死結。已把上限的唯一套用點設在生成端（`docs/spec.md` §13.4：取前 3 題 + `session-problem-overflow` 不變式），三份課表已重跑（`interview-ready` #10 → `[27,283,303]`），並補 `tests/unit/schedule-problem-cap.test.ts`。
- [x] CHK061 `Lesson.problems` 與課表 `problemIds` 的關係是否被表述為**可驗證的等式**，而非「大致來自課表」？[Measurability, Spec §US5 AS-2, data-model.md §2]
  > **修正**：已於 data-model.md §2 型別不變式與 spec US5 AS-2 明訂「題號序**完全等於**課表 `problemIds`」，並在 T050 / quickstart §5 加上逐 Session 的自動比對。
- [x] CHK062 `problemId → conceptId` 反查「查無來源」是否涵蓋「查得 Concept 但 Article 無該條目」的第三種狀態？[Edge Case, Spec §FR-030, research R3]
  > **修正**：反查表建自 `ConceptNode.leetcode`（全集），Article 條目只被 FR-006 要求涵蓋課表排入的題號（單向包含），故該狀態可達卻未定義。已於 `docs/spec.md` §14.3、spec FR-030、research R3、data-model.md §4、lesson-contract §2 明訂兩種狀態走同一條「省略、不失敗」分支，並在 T028 加測。
- [x] CHK063 受本 Feature 契約變更波及的**既有測試**是否都有對應的更新任務？[Coverage, data-model.md §7, tasks.md T010 / T011]
  > **修正**：T010／T011 會破壞 `renderer.test.ts` / `budget.test.ts` / `dry-run.test.ts` / `run-tracks.test.ts`，但原本只有 `lesson`／`schedule`／`content` 三支有更新任務，Phase 2 的「既有 `npm test` 綠燈」Checkpoint 無法達成。已把四支測試的更新併入 T010／T011（同批完成），並補進 data-model.md §7 相容性表。
- [x] CHK064 SC-007（無 API key 可執行）除手動驗證外，是否有自動化把關？[Measurability, Spec §SC-007, tasks.md T053]
  > **修正**：原僅靠 quickstart §1 手動執行與「workflow 不引用 secret」間接保證。已於 T053 加一條斷言：`scripts/validate.ts` 與 Gate 路徑 MUST NOT 讀取任何 API key／webhook 環境變數。

---

## Notes

- 勾選方式：`[x]`；發現問題直接在該項下方以 `> ` 記錄，並回頭修 spec／contracts 後再勾。
- 本清單**不驗證實作行為**——實作行為的驗收在 [quickstart.md](../quickstart.md) 與單元測試。
- 未通過的項目 MUST 在 `/speckit-implement` 之前修正需求文字；若判定為「刻意不寫」，於該項下方記錄理由。

### 2026-07-23 審查結論

- **58/58 通過**，其中 **14 項**（CHK003 / 006 / 008 / 016 / 017 / 018 / 019 / 020 / 028 / 034 / 038 / 041 /
  044 / 057）在審查中發現需求文字缺陷並已修正；另有 3 項（CHK011 / 037 / 047）隨上述修正一併解決。
- 修正涉及：`spec.md`（FR-003 / FR-006 / FR-009 / FR-022 / FR-029、SC-010、Edge Cases、Assumptions）、
  `data-model.md` §2、`contracts/lesson-contract.md` §1、`contracts/renderer-contract.md` §2、
  `docs/spec.md` §10.2。
- **兩項屬真實衝突**（CHK018 FR-006 對齊方向、CHK019 Overlay `challengeDifficulty`），若未修正會在實作時
  產生「照 spec 寫就違反 contract」的分歧。
- **一項為跨 Feature 決策**（CHK057：`docs/spec.md` §10.2 SHOULD → MUST），已依 CLAUDE.md 規定落地至
  `docs/spec.md`，對 F7 產線具約束力。

### 2026-07-23 `/speckit-analyze` 追加審查結論

- **64/64 通過**。追加的 CHK059–CHK064 全部在分析中發現缺陷並已修正；其中 **CHK059 / CHK060 為 CRITICAL**
  （憲章 IX/XIII 的雙軌實作、以及會讓 Gate 必然失敗的課表題數超限），**兩者皆為跨 Feature 決策**，
  已依 CLAUDE.md 落地至 `docs/spec.md`（§13.4 / §14.3 / §14.5 / §16.3 / §21.3）。
- 本輪唯一動到**程式碼與生成物**的修正：`src/compiler/schedule-generator.ts`（題數上限）、
  `src/types/schedule.ts`（`session-problem-overflow`）、`schedules/interview-ready.json`（重跑）、
  `tests/unit/schedule-problem-cap.test.ts`（新增）——皆屬 F4 責任範圍，F5 尚未開始實作。
- 教訓：**檢核表比對的是文件之間的一致性，抓不到「文件與已合併程式碼」的分歧**。CHK041「Compiler 只組裝
  不選題」被判為通過，但沒有人去讀 F4 生成器確認 `extraProblemIds` 早已在生成端套用。日後涉及消費前一個
  Feature 生成物的檢核項，SHOULD 直接核對生成器原始碼與實際生成物，而非只讀該 Feature 的 spec。
