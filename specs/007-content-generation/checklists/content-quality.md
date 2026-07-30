# Content Quality Gate Checklist: 兩階段內容產線（F7）

**Purpose**: 以「需求品質單元測試」驗證 Stage 2 品質 Gate 相關需求的完整、清晰、一致與可量測性——testing the spec, not the code。
**Created**: 2026-07-30
**Feature**: [spec.md](../spec.md)
**Depth**: 正式合併前門（高嚴格度）；**Audience**: 維運者本人（作者/自審，merge 回 develop 前）

## Requirement Completeness（需求是否齊備）

- [x] CHK001 §10 固定區塊清單（閱讀用 8 段 + 推播用 4 段 + Today's Challenge）是否**逐項列明且無遺漏**，作為區塊完整性 Gate 的判準？ [Completeness, Spec §FR-007 / data-model §3]
- [x] CHK002 每個 `leetcode` 候選題號是否**明訂**須產出對應 `Today's Challenge` 條目（含 `whyThisPattern` + Hint）？ [Completeness, Spec §FR-009]
- [x] CHK003 品質 Gate 的**七道關卡**是否各自定義了通過/不通過的具體判準，而非只列名稱？ [Completeness, Spec §FR-010 / contracts/content-quality-gate §1]
- [x] CHK004 各推播區塊的字元預算上限（Digest ≤900、Tip 各 ≤650、每題 ≤350、Exit Criteria ≤400、Takeaway ≤120、footer ≤200、總 ≤5,500）是否**在需求層完整列出**？ [Completeness, Spec §FR-010.3 / 憲章]
- [x] CHK005 「觀念本體 ≤2,000 字」的**「觀念本體」範圍**是否有明確定義（是 `Concept` 區塊，還是含其他段落）？ [Gap, Spec §FR-008 / §10.3]
- [x] CHK006 是否明訂 self-check（關卡 7）**不進 CI**、只在生成期執行的邊界？ [Completeness, Spec §FR-010.7 / contracts/content-quality-gate §1]

## Requirement Clarity（可量測、無歧義）

- [x] CHK007 程式碼「可執行」是否已被**量化為「編譯通過 + 內嵌斷言執行成功」**，且明確排除「僅編譯」「僅無例外」？ [Clarity, Spec §FR-010.1 / Clarifications Q2]
- [x] CHK008 「缺斷言即失敗」是否有**可機器判定的定義**（何謂「含斷言」：`assert`/`throw`/`node:assert`）？ [Clarity, contracts/content-quality-gate §2]
- [x] CHK009 繁中判準是否量化為「無簡體字 + CJK 佔比 ≥ 門檻」，且**門檻的計算範圍**（排除程式碼區塊與行內英文術語）有明訂？ [Clarity, Spec §FR-008 / Clarifications Q4]
- [x] CHK010 CJK 佔比門檻**確切數值**是否已定案，或明確標記為 plan/tasks 待定並附預設值（0.5）？ [Ambiguity, research R7 / Clarifications]
- [x] CHK011 「技術術語 / Pattern 名稱 / API / 程式碼保留英文」是否有**可判定邊界**，避免與 CJK 佔比檢查互相矛盾誤殺？ [Clarity, Spec §FR-008 / §11]
- [x] CHK012 「LLM self-check 低信心」是否有**可觸發重生的判定描述**，而非純主觀？ [Ambiguity, Spec §FR-010.7]

## Acceptance Criteria Quality（成功標準可驗）

- [x] CHK013 SC-003「通過全部品質 Gate 零違規才凍結」是否可**客觀驗證**（每關皆有機器可判輸出）？ [Measurability, Spec §SC-003]
- [x] CHK014 SC-009（繁中 + 術語英文 + 機器可驗檢查）是否可用**單一自動化結果**判定通過？ [Measurability, Spec §SC-009]
- [x] CHK015 SC-010「CI 對程式碼寫錯的變更 100% 阻擋合併」是否有**明確的失敗條件**對應？ [Measurability, Spec §SC-010 / FR-016]
- [x] CHK016 每筆違規是否要求以**具名格式**（track/session/rule/subject/message）輸出，使「過/不過」可稽核？ [Measurability, contracts/content-quality-gate §3]

## Requirement Consistency（不衝突、單一 Gate）

- [x] CHK017 「Stage 2 Gate 重用每日 runtime 同一顆 Compiler/Renderer/預算」是否與「MUST NOT 另建平行解析」在需求與契約間**表述一致**？ [Consistency, Spec §FR-011 / 憲章 IX]
- [x] CHK018 生成期 Gate 與 CI `content-gate.yml` 的**關卡分工**（1/2/4/5/6 純檢查入 CI；3 程式碼實測入 CI；7 self-check 不入 CI）是否無矛盾？ [Consistency, contracts/content-quality-gate §1]
- [x] CHK019 「字元預算超限 MUST NOT 截斷」是否在 Edge Cases、FR、契約三處**一致**，且與「擋下重生」不衝突？ [Consistency, Spec §FR-010.3 / Edge Cases]
- [x] CHK020 純內容檢查放 `src/compiler`、程式碼實測放 `scripts/`——此分層是否與「單一 Gate」原則**一致無雙軌**？ [Consistency, plan Structure / 憲章 IX]

## Scenario & Edge Case Coverage（情境與邊界）

- [x] CHK021 「觀念本體超過 2,000 字」是否有明訂處置（擋下 + 重生/拆分為多 Concept）？ [Coverage, Spec Edge Cases / 憲章 II]
- [x] CHK022 「self-check 標記低信心或前後矛盾」是否有明訂處置（重生或例外人工，MUST NOT 直接凍結）？ [Coverage, Spec Edge Cases / FR-012]
- [x] CHK023 「部分 Concept 生成失敗、其餘成功」是否明訂單篇隔離（成功者凍結、失敗者記錄、不回滾整批）？ [Coverage, Spec Edge Cases / FR-012]
- [x] CHK024 重生上限 3 次後的**終局**（標記 needsHumanReview、記錄、繼續其餘、非零 exit）是否完整定義？ [Coverage, Spec §FR-012 / Clarifications Q3]
- [x] CHK025 是否定義「題目正確性」關卡的失敗情境（題號不存在、slug 不一致、缺 challenge 條目）？ [Coverage, contracts/content-quality-gate §1]
- [x] CHK026 程式碼實測的**暫存資源清理**需求（建於系統暫存區、用後清理、不寫 repo）是否明訂？ [Edge Case, contracts/content-quality-gate §2]

## Dependencies & Assumptions（相依與假設）

- [x] CHK027 是否明訂 CI Gate **MUST 可在無任何 LLM 金鑰下執行**（self-check 不進 CI 的相依前提）？ [Assumption, 憲章 VIII / contracts/content-quality-gate §4]
- [x] CHK028 Stage 2 前置「Skeleton 已凍結」的**可機驗代理**（工作目錄乾淨）是否有明確定義與繞過條件（`--allow-dirty`）？ [Assumption, research R12 / contracts/stage2-content §2]
- [x] CHK029 「Full Article 為每個 Concept 單一份、三軌共用正文」的假設是否明訂，避免 Gate 誤要求逐軌差異？ [Assumption, 憲章 VI / Spec §FR-011]

## Notes

- 勾選＝該需求品質面向已在 spec/plan/contracts 有清楚、可驗、無衝突的規範；未過項須回頭補強 spec 再進 `/speckit-tasks`。
- 本清單測「需求是否寫對」，非「Gate 是否跑對」。

### 逐項走查結果（2026-07-30）

**觸發 spec 補強（原為 Gap/Ambiguity/Conflict，已修正）**
- CHK005 觀念本體範圍未界定 → FR-008 依 §10.3 明訂範圍（Concept/Thinking/Pattern Recognition/Common Mistakes 敘述性文字，排除 Corner/程式碼/Challenge/Complexity 算式）。
- CHK009 + CHK011 **Conflict**：FR-008 原「行內英文術語排除在分母外」與 research R7「英文計入分母、門檻寬鬆」矛盾且不可機器判定 → 改為「移除 fenced code / 行內 code / frontmatter 後計 CJK 佔比，英文計入分母、門檻寬鬆（預設 0.5）」，兩處一致。
- CHK008 缺斷言判定 → FR-010.1 明訂「TS 出現 `throw`/`node:assert`、Python 出現 `assert`；未出現視同不通過」。
- CHK010 CJK 門檻數值 → FR-008 補預設 0.5、確切值 plan 定案。
- CHK019 超限不截斷 → FR-010.3 補「MUST NOT 截斷後凍結」。
- CHK026 暫存清理 → FR-010.1 補「暫存檔建於系統暫存區、用後清理、不寫 repo」。
- CHK006 + CHK018 + CHK027 self-check 不進 CI / CI 無金鑰 / 關卡分工 → FR-010.7 + FR-016 明訂「CI 跑關卡 1–6、不含 self-check、MUST 可無 LLM 金鑰執行」。
- CHK028 Stage 2 凍結前提 → FR-007 補「工作目錄 `concepts/**` 無未提交變更＝凍結代理，`--allow-dirty` 僅開發用」。
- CHK029 每 Concept 單一份 Article → FR-007 補「三軌共用正文、MUST NOT 逐軌複製（憲章 VI）」。

**已滿足（無需改動）**：CHK001–004、CHK007、CHK012–017、CHK020–025。
- CHK012 self-check「低信心」本質為 LLM 自評輸出，屬既定的半主觀判準，非可完全客觀量化項（已知並接受）。
