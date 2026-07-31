# Fact Provenance & Problem Bank Checklist: 兩階段內容產線（F7）

**Purpose**: 以「需求品質單元測試」驗證「題目事實來源、LLM 邊界、題庫擴充」相關需求的完整、清晰與一致性——testing the spec, not the code。
**Created**: 2026-07-30
**Feature**: [spec.md](../spec.md)
**Depth**: 正式合併前門（高嚴格度）；**Audience**: 維運者本人（自審，merge 回 develop 前）

## Requirement Completeness（來源邊界是否齊備）

- [x] CHK057 「LLM 只提候選題號、事實 metadata 由程式帶入」的**責任切分**是否在 spec、契約、data-model 三處完整記載？ [Completeness, Spec §FR-003a / contracts/problem-bank-population]
- [x] CHK058 由程式帶入的 metadata 欄位集合（`id / slug / title / url / difficulty`）是否**明確列舉**？ [Completeness, Spec §FR-003a / data-model §4]
- [x] CHK059 metadata 主來源（committed 快照 `leetcode-index.json`）與補齊來源（線上 GraphQL metadata）是否皆有定義？ [Completeness, research R5 / data-model §4b]
- [x] CHK060 題庫合併語意（既有題號不覆蓋、只新增缺漏、`--force` 例外）是否明訂？ [Completeness, contracts/problem-bank-population §3]
- [x] CHK061 候選題號查無（無效）時**驅動 Stage 1 重生**的回饋路徑是否定義？ [Completeness, contracts/problem-bank-population §5]

## Requirement Clarity / Constitution Boundary（可判定、守憲章）

- [x] CHK062 「MUST NOT 抓取或轉載題目描述、只取 metadata」是否有**可判定界線**（§5）？ [Clarity, Spec §FR-003a / §5]
- [x] CHK063 「題號/連結/難度 MUST NOT 由 LLM 生成」是否與「`whyThisPattern`/Hint 由 LLM 生成」**清楚區分**（事實 vs 教學說明）？ [Clarity, research R5 / Spec §FR-009]
- [x] CHK064 `url` 由 `slug` 組成、且「`url` slug 與 `slug` 欄位一致」的 Gate 規則是否明訂？ [Clarity, contracts/problem-bank-population §3 / §12.1]
- [x] CHK065 Stage 1 LLM 對 `leetcode` 只填「1–3 個候選題號」的數量與型別約束是否明確？ [Clarity, data-model §1 / §12.1]
- [x] CHK066 「只送/取公開資料」是否明訂（不涉機密），作為與 LLM/外部端點互動的邊界？ [Clarity, Spec §FR-021]

## Acceptance Criteria Quality（可驗）

- [x] CHK067 「Stage 1 結構 Gate 的題號存在性檢查」是否被定為此機制的**可機驗守門**（查無即擋、非零 exit）？ [Measurability, contracts/stage1-curriculum §5 / Spec §FR-003]
- [x] CHK068 「產線只讀快照可離線、可重現」是否可**客觀驗證**（CI 不需網路）？ [Measurability, contracts/problem-bank-population §6]

## Requirement Consistency（不衝突）

- [x] CHK069 §12「題庫建置方式」的回寫內容是否與本 Feature spec §FR-003a / research R5 **一致無矛盾**（跨 Feature 落地）？ [Consistency, Conflict-check, docs/spec.md §12 / Spec Clarifications]
- [x] CHK070 題庫由 F7 擴充後為來源真相，是否與 F3「problem-bank 為來源真相」在**擁有權轉移**上表述一致無衝突？ [Consistency, Spec Assumptions / docs §12]
- [x] CHK071 §12.1 既有「每 Concept 1–3 題、`leetcode` 陣列不得重複」守門是否與 F7 候選題號生成**一致**（LLM 不得產生重複/超量）？ [Consistency, §12.1 / data-model §1]
- [x] CHK072 快照補齊寫回是「維護時機」而非「產線常態」的定位，是否與「凍結後可重現」一致？ [Consistency, research R5]

## Scenario & Edge Case Coverage

- [x] CHK073 「快照命中 / 快照未命中須線上補齊 / 線上仍查無」三種路徑是否皆有明訂結果？ [Coverage, contracts/problem-bank-population §3]
- [x] CHK074 「LLM 提出的候選題號重複或超過 3 題」是否被既有守門擋下且需求層有覆蓋？ [Coverage, Gap, §12.1]
- [x] CHK075 「無題目觀念課（`leetcode: []`）」是否被明訂為一等合法狀態，不因題庫擴充機制而誤報？ [Coverage, §12.1 / Edge Case]
- [x] CHK076 「題庫擴充是否納入本 F7 或屬 F3」的歸屬是否已無歧義（clarify 定案為 F7）？ [Ambiguity, Spec Assumptions / Clarifications Q1]

## Dependencies & Assumptions

- [x] CHK077 `leetcode-index.json` 初始題目集合來源與一次性整理指令是否有記載（或明確標為 tasks 待定）？ [Assumption, research R5 note]
- [x] CHK078 依賴 LeetCode 公開 GraphQL metadata 端點的**可用性與變動風險**是否被記載（快照優先即為緩解）？ [Assumption, research R5 / contracts/problem-bank-population §3b]

## Notes

- 勾選＝該來源/題庫需求已在 spec/plan/contracts/docs §12 有清楚、可驗、無衝突且守憲章的規範。
- 本清單測「事實來源需求是否寫對」，非「題庫抓取是否成功」。

### 逐項走查結果（2026-07-30）

**觸發 spec 補強（原為 Gap，已修正）**
- CHK059 metadata 主/補齊來源未回寫 spec → FR-003a 補「靜態快照優先、線上補齊」（plan R5 定案）＋ Clarifications/Assumptions 同步更新。
- CHK071 + CHK074 候選題號守 §12.1（1–3 題、不重複） → FR-003a 補明。
- CHK075 `leetcode: []` 無題目觀念課合法 → FR-003a 補「題庫擴充與存在性檢查對其 MUST NOT 報錯」。

**已滿足**：CHK057–058、CHK060–070、CHK072–073、CHK076、CHK078。
- CHK069 跨 Feature 一致性：已核對 `docs/spec.md` §12 / §20.3 回寫與本 spec FR-003a / research R5 無矛盾。

**刻意延後（有擁有者，非阻塞）**
- CHK077 `leetcode-index.json` 初始題目集合來源與一次性整理指令 → research R5 註明待 tasks 期定案（屬資料維運，不影響契約形狀）。
