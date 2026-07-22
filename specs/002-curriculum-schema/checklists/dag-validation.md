# DAG & Schema Validation — Requirements Quality Checklist: Curriculum Schema（F2）

**Purpose**: 以「需求的單元測試」檢驗 F2 spec 對 **DAG 完整性驗證、Concept/骨架 schema、顆粒度 Gate、
確定性** 的需求是否**完整、清楚、一致、可量測**——測的是「需求寫得好不好」，不是「程式跑不跑得對」。
**Created**: 2026-07-21
**Feature**: [spec.md](../spec.md)
**Focus**: DAG/schema 驗證完整性 + 確定性（Depth: Standard；Audience: PR Reviewer / 實作前）

> 用法：逐項回答「是 / 否 / 需補」。標 `[Gap]` / `[Ambiguity]` / `[Conflict]` 者若答「否」，
> 應在 `/speckit-implement` 前回頭修 [spec.md](../spec.md)（必要時回帶 plan/tasks）。

## Requirement Completeness（需求是否齊備）

- [x] CHK001 是否為 `docs/spec.md` §8.3 的**每一條**規則都定義了驗證需求（可拓樸排序、無環、無前向依賴、參照完整、無孤兒）？ [Completeness, Spec FR-010–FR-016] — ✅ FR-011/012/013/014/016 逐條對應
- [x] CHK002 §10.1 的 Concept frontmatter **全部欄位**是否都在需求中列出型別與值域（含 `pattern_label`/`complexity_label` 由 frontmatter 提供）？ [Completeness, Spec FR-004/FR-006/FR-007] — ✅ FR-004 列全 14 欄，FR-005/006/007 訂型別值域，細節見 contracts
- [x] CHK003 參照完整性需求是否涵蓋 `module`/`topic`（而非只有 `prerequisite`/`next`）？ [Completeness, Spec FR-013] — ✅
- [x] CHK004 spec 是否把「`topic` MUST 等於所在資料夾名」列為一條驗證需求？ [Gap, Spec FR-013] — ✅ 已回寫 FR-013（2026-07-21）
- [x] CHK005 是否為空課程、以及 stub 階段的空 Module/Topic 定義了明確的處置需求？ [Coverage, Spec Edge Cases/FR-021] — ✅ **已補（2026-07-21）**：新增 **FR-010a**（空課程 → `error`，兩模式皆強制）＋ `empty-curriculum` rule ＋ fixture `empty/` ＋ T009 測試；空 Module/Topic 續由 FR-021 處理
- [x] CHK006 是否在需求層定義了每一類 violation 的**嚴重度分類**（error vs warning）？ [Gap] — ✅ 已回寫 FR-008a（2026-07-21）
- [x] CHK007 驗證入口的退場/回報語意（fail-loud、非零結束、印出具名違規）是否有需求定義？ [Completeness, Spec FR-028] — ✅

## Requirement Clarity（需求是否清楚無歧義）

- [x] CHK008 「無前向依賴」所依據的**確定性課程順序**是否被單一、明確地定義？ [Clarity, Spec FR-015] — ✅ 宣告序全序（Module→Topic→NNN），research R7 佐證
- [x] CHK009 免除孤兒判定的「合法起點」是否被精確定義（哪些 Concept 合格）？ [Ambiguity, Spec FR-016] — ✅ **已定案（2026-07-21）**：合法起點 = `moduleIndex == 0` **且**該 Topic 內 `NNN` 最小者（Level 0 每 Topic 恰一個起點）。已回寫 FR-016 與 `docs/spec.md` §8.3
- [x] CHK010 「指名違規」是否精確到識別方式（`id` vs 檔案路徑）與粒度（欄位/規則/目標）？ [Clarity, Spec FR-008] — ✅ FR-008 + data-model `Violation{rule,severity,subject,field,target,message}`；「id 或路徑」的二擇一為刻意（schema 失敗時 id 可能取不到）
- [x] CHK011 顆粒度規則中「下限類」與「上限/唯一性類」是否**逐條列舉**，使 stub/full 模式行為無歧義？ [Clarity, Spec FR-021] — ✅ 兩類各三條逐條列出
- [x] CHK012 骨架的 Module 數量/身分是否被精確陳述（恰為 §8.2 的 16 個 Level）？ [Clarity, Spec FR-001] — ✅ FR-001 + modules-schema M2
- [x] CHK013 尚未撰寫 Concept 的 Module 其 **Topic 切分準則**是否被定義，或明確標示延後/可微調？ [Ambiguity, Spec FR-001a] — ✅ 已回寫 FR-001b（2026-07-21）
- [x] CHK014 「單一實作、供 F5/F7 重用」是否可被客觀查核（不存在第二份平行驗證）？ [Measurability, Spec FR-022/FR-024] — ✅ SC-007 已陳述為可查核；惟 tasks 無對應查核任務（見 analyze A7）

## Requirement Consistency（需求彼此是否一致）

- [x] CHK015 「無前向依賴」「無環」「可拓樸排序」三項需求是否構成一致、不矛盾的集合？ [Consistency, Spec FR-011/FR-012/FR-014] — ✅ FR-015 明訂「合法 DAG 下宣告序 MUST 與拓樸排序相容」，R7 給出論證
- [x] CHK016 `leetcode` 存在性「延後至 F3」在 DAG 驗證需求、Out of Scope 與 §8.3 之間是否一致？ [Consistency, Spec FR-023] — ✅ FR-023 / Edge Cases / Out of Scope / R8 一致
- [x] CHK017 `exit_criteria`「本 Feature 只驗結構、字數/條數預算延後」在各節是否一致？ [Consistency, Spec FR-006/Out of Scope] — ✅ FR-006 / Out of Scope / data-model / contract 四處一致
- [x] CHK018 「`modules.json` 為手寫骨架」與「生成物 commit 後凍結」原則在 spec/plan 間是否一致無衝突？ [Consistency, Constitution XIII] — ✅ plan Complexity Tracking 已正當化並與 `schedules/*.json` 對比澄清

## Ambiguities & Conflicts（需求本身的歧義/衝突）

- [x] CHK019 FR-018 是否因並列「正規化去重並報告，**或**視為錯誤報錯」而留下未決的二擇一？ [Conflict, Spec FR-018] — ✅ 已定案「去重 + warning」（2026-07-21）
- [x] CHK020 `prerequisite`/`next` 雙向一致性檢查的**結果**（error / warning / 自動補齊）是否被指定？ [Ambiguity, Spec FR-017] — ✅ 已定案 error、不自動補齊（2026-07-21）
- [x] CHK021 自我依賴是否在需求中被明確歸類（環的退化），而非隱含？ [Ambiguity, Spec FR-012] — ✅ FR-012 明文「視為環的退化情形」＋獨立 rule `self-dependency`

## Acceptance Criteria Quality（驗收準則是否可量測）

- [x] CHK022 DAG 驗證的成功準則是否可量測（100% 通過、0 誤報）並對映 §24 AC1？ [Measurability, Spec SC-001] — ✅
- [x] CHK023 驗收準則是否要求**每一類**注入的結構/schema 錯誤至少一個負向測試？ [Coverage, Spec SC-002/SC-003] — ✅ 兩條皆含「每一類至少一個自動化測試涵蓋」；惟 SC-002 的列舉漏了 `edge-inconsistency` / `duplicate-edge`（見 analyze A5）
- [x] CHK024 確定性是否以可量測方式陳述（重複 N 次的結論與拓樸序逐字元一致）？ [Measurability, Spec FR-025/SC-005] — ✅ SC-005 重複 100 次
- [x] CHK025 「顆粒度 Gate 可在無完整 150+ Concept 下以 fixture 逐條驗證」是否可量測？ [Measurability, Spec SC-004] — ✅

## Scenario & Edge Case Coverage（情境/邊界是否被需求涵蓋）

- [x] CHK026 是否為每一類非法情境（環、前向依賴、懸空參照、孤兒、重複 id、非法 frontmatter、顆粒度超限）定義了 exception-flow 需求？ [Coverage, Spec Edge Cases/SC-002] — ✅ Edge Cases ＋ SC-002/SC-003/SC-004 合計涵蓋（空課程除外，見 CHK005）
- [x] CHK027 Concept 參照到不存在的 `module`/`topic`（骨架不一致）是否被列為需求涵蓋？ [Coverage, Spec FR-013/Edge Cases] — ✅
- [x] CHK028 顆粒度的**邊界值**（恰好等於上/下限）是否在需求中被處理？ [Edge Case, Gap, Spec FR-019] — ✅ **已定案（2026-07-21）**：FR-019 明訂**閉區間**（恰 5 / 12 / 10 / 30 皆通過）；T013 補邊界 fixture、T014 補邊界斷言；已回寫 `docs/spec.md` §8.1

## Dependencies & Assumptions（依賴與假設是否明載可追溯）

- [ ] CHK029 「驗證為唯讀、無狀態變更（故無需 rollback）」的假設是否被陳述？ [Assumption] — ⚠️ **spec 層未陳述**；contract 有「純讀」「無 `process.exit`、無 I/O」、T023 有守衛測試。屬低風險，可不回寫 spec
- [x] CHK030 跨 Feature 交棒假設（stub→F7、getPathLabels→F5、`problemExists`→F3）是否明載且可追溯？ [Assumption, Spec Assumptions] — ✅ 三項皆在 Assumptions ＋「臨時產物與交棒」表，且已回寫真實來源

## Notes

- 本清單為**需求品質**檢核，不驗實作；勾選代表「該需求已寫清楚」，非「程式已通過」。
- **已於 2026-07-21 回寫 spec 收斂的 5 項**：CHK004（FR-013 topic==資料夾名）、CHK006（FR-008a 嚴重度分類）、
  CHK013（FR-001b Topic 凍結顆粒度與可修訂途徑）、CHK019（FR-018 去重 + warning）、CHK020（FR-017 error、
  不自動補齊）。spec 本文現與 [data-model.md](../data-model.md) / [contracts/](../contracts/) 立場一致。
- **2026-07-21 完成逐項核查**（對照 spec / plan / research / data-model / contracts / tasks）：
  初次核查 30 項中 26 項通過，4 項留缺口。
- **同日 `/speckit-analyze` 後完成修正**：CHK005（新增 FR-010a `empty-curriculum`）、
  CHK009（FR-016 合法起點精確定義，已回寫 `docs/spec.md` §8.3）、CHK028（FR-019 閉區間，
  已回寫 §8.1）三項**已收斂並勾選**。**現況 29/30 通過**。
- 僅餘 **CHK029**（「驗證為唯讀」的假設未寫進 spec 本文）刻意不補：contract 已明訂純函式 / 無 I/O、
  T023 有守衛測試，回寫 spec 屬重複敘述，風險可忽略。
