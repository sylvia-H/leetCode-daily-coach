# Schedule Generator — Requirements Quality Checklist

**Purpose**: pre-implement Gate——在進 `/speckit-implement` 前，驗證 F4 課表生成器的**需求本身**是否完整、明確、一致、可量測、覆蓋周全（"unit tests for the spec"，非驗證實作）。
**Created**: 2026-07-23
**Feature**: [spec.md](../spec.md)（重點面向：Determinism 契約精確度、難度帶／Overlay 疊加）

**Note**: 每項為對「需求文字」的品質提問；勾選代表該需求已寫得夠好可實作。發現缺口請回修 spec / contracts 再勾。

## Requirement Completeness

- [ ] CHK001 是否列舉了生成器的**全部輸入**及其唯一來源（DAG、週節奏模板、`track-params.json`、`overlays/{track}.json`）？ [Completeness, Spec §FR-002/FR-002a]
- [ ] CHK002 五種 Session 型別各自的**必填/選填欄位**（誰帶 `conceptId`／`reviewRange`／`problemIds`）是否都明確界定？ [Completeness, Spec §16.2, data-model §1]
- [ ] CHK003 是否為「每一類驗證規則至少一個具名違規 + 一個單元測試」立下需求？ [Completeness, Spec §SC-007, data-model §5]
- [ ] CHK004 三份生成物的**檔名與 Track id 映射**（`interviewReady`→`interview-ready.json`）是否明列、無歧義？ [Completeness, data-model §2]
- [ ] CHK005 `TrackParams` 的每個欄位（`targetLevel`/`maxLevel`/`problemDifficulties`/`challengeDifficulty`/`rhythm`）是否都有型別與值域定義？ [Completeness, contracts track-params-schema]

## Requirement Clarity — Determinism 契約（重點）

- [ ] CHK006 「byte-identical」是否以**可驗證的序列化屬性**釘死（固定欄位序、2-space 縮排、LF、檔尾換行、無 BOM）？ [Clarity, Spec §FR-003, research R2]
- [ ] CHK007 生成器**每一處排序選擇**的確定性來源是否都指名（`topoOrder`、`leetcode` 宣告序、升冪 id）？ [Clarity, Spec §FR-003/FR-015a]
- [ ] CHK008 對「非確定來源」（未固定 seed 隨機、系統時間、檔案列舉序）的禁令是否寫成可測需求？ [Clarity, Spec §FR-003]
- [ ] CHK009 optional 欄位的 canonical **省略規則**（空 `problemIds` 省略而非輸出 `null`）是否明確？ [Clarity, Spec §16.2, contracts schedule-schema]
- [ ] CHK010 跨平台換行（Windows 本機 vs Linux CI）造成 diff 假陽性的防護是否被指明為需求？ [Edge Case, Spec Edge Cases, research R2]
- [ ] CHK011 CI 的「determinism drift」定義（committed 檔 ≠ 重生成即 `determinism-drift`）是否清楚？ [Clarity, research R10, contracts generator-api]

## Requirement Clarity — 難度帶／Overlay 疊加（重點）

- [ ] CHK012 每 Track 的 `problemIds` 產生機制（Problem Bank 難度過濾 + Overlay 附加）是否明確、且明訂**不由 Renderer 判難度**？ [Clarity, Spec §FR-015a, Clarify Q2]
- [ ] CHK013 「疊加不取代」是否有**可量測判準**（套 Overlay 後 Core 過濾題目仍在）？ [Measurability, Spec §FR-009, SC-005]
- [ ] CHK014 `challengeDifficulty`（覆寫）與 `extraProblemIds`（附加）的語意差異是否清楚區分？ [Clarity, Spec §16.3, contracts overlay-schema]
- [ ] CHK015 難度過濾**結果為空**（含 `leetcode: []`）時的行為是否明訂為**一等合法**（省略 `problemIds`、**不以替代題填充、無 fallback 機制**）？ [Edge Case, Spec §FR-015a/FR-019]
- [ ] CHK016 Overlay 指向**該 Track 未涵蓋 Concept** 時，是否明訂為具名 fail-loud（`overlay-unknown-concept`）？ [Completeness, Spec Edge Cases, Clarify Q4]
- [ ] CHK017 `extraProblemIds` 指向題庫不存在題號時的處理（`dangling-problem`）是否指明？ [Completeness, contracts overlay-schema]

## Requirement Clarity — 涵蓋子集／閉包

- [ ] CHK018 涵蓋機制是否以精確納入規則界定（`module.level ≤ maxLevel`）而非模糊描述？ [Clarity, Spec §FR-014a, Clarify Q1]
- [ ] CHK019 prerequisite 閉包是否定義，含前置落在宣告範圍外時的**解法**（fail-loud `coverage-gap` vs 自動納入）？ [Completeness, Spec §FR-014a, research R3]
- [ ] CHK020 `moduleAllowlist` 與 `maxLevel` 的**優先順序與跳號風險**是否文件化？ [Clarity, contracts track-params-schema]

## Requirement Clarity — 節奏／reviewRange

- [ ] CHK021 週節奏模板約束（長度 7、必含 `review` 與 `rest`）是否明確且可驗？ [Completeness, Spec §FR-011, contracts track-params-schema]
- [ ] CHK022 `reviewRange` 是否有**明確公式與邊界**使第一週行為無歧義（如 `[weekStart, reviewIndex-1]`）？ [Clarity, Spec §FR-013, Edge Cases, research R4]
- [ ] CHK023 「相對天數、非日曆星期」是否寫成可測需求？ [Clarity, Spec §FR-012]
- [ ] CHK024 課表長度／Concept 用盡行為（自然收尾、不填充）是否確定性地界定？ [Completeness, Spec §FR-011/FR-019, Clarify Q3]

## Requirement Consistency

- [ ] CHK025 「難度分歧固化於 schedule 層、非 Renderer」在 FR-015／FR-015a 與憲章 XI 之間是否一致無衝突？ [Consistency, Spec §FR-015/FR-015a]
- [ ] CHK026 「生成／驗證單一實作、禁雙軌」是否明列並指名其重用者（CI Gate、F5、F6）？ [Consistency, Spec §FR-017, Constitution IX]
- [ ] CHK027 「三 Track 共用教材、0 複製」與 Overlay/難度分歧機制之間是否一致（分歧只落在指定四處）？ [Consistency, Spec §FR-010, SC-005]

## Acceptance Criteria Quality

- [ ] CHK028 Success Criteria 是否皆技術中立且可客觀量測（diff 為空、100% 拓樸、100% reviewRange、參照 100%）？ [Measurability, Spec §SC-001–SC-004]
- [ ] CHK029 `one-concept-per-session` 是否有可驗定義（恰好一個新 Concept）而非「大致一個」？ [Measurability, Spec §FR-005, SC-006]

## Dependencies & Assumptions

- [ ] CHK030 消費 F2/F3 的**前置條件**是否文件化（`graph` 須先過 `validateCurriculum`；`params`/`overlays` 須過 zod）？ [Assumption, contracts generator-api]
- [ ] CHK031 「stub 課表遠短於 180 為預期、非錯誤」是否明載為假設？ [Assumption, Spec Assumptions, Edge Cases]
- [ ] CHK032 尚待定的**具體數值**（各 Track Level 上限、難度帶集合、節奏微調表）是否清楚界定為「撰寫 track-params 時填入」而非阻礙機制實作？ [Ambiguity, Spec Assumptions]

## Notes

- 勾選：完成打 `[x]`；發現缺口先回修 spec/contracts 再勾。
- 重點面向（Determinism CHK006–011、難度帶/Overlay CHK012–017）為本 Gate 的最高把關密度。
- 本 checklist 驗**需求品質**，不驗實作；實作正確性由 tasks.md 的單元測試（`schedule-*.test.ts`）與 `npm run validate:schedule` 把關。
