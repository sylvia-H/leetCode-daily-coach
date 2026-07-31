# Pipeline Resilience Checklist: 兩階段內容產線（F7）

**Purpose**: 以「需求品質單元測試」驗證節流／退避／斷點續跑／冪等／告警等韌性需求的完整、清晰與可量測性——testing the spec, not the code。
**Created**: 2026-07-30
**Feature**: [spec.md](../spec.md)
**Depth**: 正式合併前門（高嚴格度）；**Audience**: 維運者本人（自審，merge 回 develop 前）

## Requirement Completeness（韌性需求是否齊備）

- [x] CHK030 是否明訂 RPM 節流需求，且**限速依據**（免費層 RPM、預設值 10、可覆寫）有記載？ [Completeness, Spec §FR-017 / research R3]
- [x] CHK031 429/限流退避需求是否完整（指數退避 + jitter + 重試上限），且明訂**哪些錯誤觸發退避、哪些直接失敗**？ [Completeness, Spec §FR-018 / research R3]
- [x] CHK032 斷點續跑需求是否明訂「已生成且過 Gate 者跳過、中斷後從缺漏處續」？ [Completeness, Spec §FR-019]
- [x] CHK033 冪等需求是否明訂「不覆蓋已凍結且未變更 Skeleton 的 Article，除非 `--force`」與「Skeleton 變更只重生該篇」？ [Completeness, Spec §FR-020]
- [x] CHK034 checkpoint manifest 的**欄位語意**（skeletonHash / skeletonFrozen / articleFrozen / gatePassed / needsHumanReview / regenCount）是否有明確定義？ [Completeness, data-model §6]
- [x] CHK035 「缺 `GEMINI_API_KEY` MUST fail-fast」需求是否明訂觸發時機（建構期）與可觀測輸出？ [Completeness, Spec §FR-025 / contracts/stage1-curriculum §1]
- [x] CHK036 分 2–4 天跨批次執行的**額度前提**（≈600–800 次呼叫、每日 250–1,500 請求）是否記載為可評估依據？ [Completeness, Spec §SC-005 / §20.4]

## Requirement Clarity（可量測、無歧義）

- [x] CHK037 重試上限、退避 base/上限、jitter 形態是否**量化**（而非「適當重試」之類模糊語）？ [Clarity, research R3]
- [x] CHK038 冪等判斷依據是否明確為「產物存在 + Skeleton 內容雜湊」，而非易失的 mtime 或純 manifest？ [Clarity, research R4]
- [x] CHK039 「從缺漏處續跑」的「缺漏」是否有**可判定定義**（產物不存在或雜湊不符）？ [Clarity, research R4 / data-model §6]
- [x] CHK040 `--force` 的語意是否明確為「唯一覆蓋已凍結物的路徑」，且**不擴大**為其他自動修正？ [Clarity, Spec §FR-020 / data-model §7]
- [x] CHK041 重生上限「每篇 3 次」是否明確為**per-Concept** 計數（而非整批合計）？ [Clarity, Spec §FR-012 / Clarifications Q3]

## Acceptance Criteria Quality（可驗）

- [x] CHK042 SC-005「免費層內 2–4 天分批完成、無需付費」是否可**客觀評估**（有額度量級依據）？ [Measurability, Spec §SC-005]
- [x] CHK043 SC-006「中斷後 100% 從缺漏處續跑、已凍結未變更 0 重生」是否有**可觀測判準**？ [Measurability, Spec §SC-006]
- [x] CHK044 節流/退避邏輯是否被要求以**可注入時鐘**設計，使「不需真等待即可驗」成為需求（呼應測試優先）？ [Measurability, research R3 / plan Testing]

## Requirement Consistency（不衝突）

- [x] CHK045 manifest 被定義為「加速快取、非真實來源、可由掃描產物重建」是否與「凍結物為真實來源」**一致無衝突**？ [Consistency, research R4 / 憲章 XIII]
- [x] CHK046 「連續多日/多次失敗 MUST 照常 fail loud，MUST NOT 自動暫停/降頻」是否與 F6 的 FR-022a **一致**（產線亦不得引入隱藏暫停）？ [Consistency, 憲章 XV / Spec §FR-012]
- [x] CHK047 退避重試與「只送公開資料」是否一致（重試不改變送出內容範圍）？ [Consistency, Spec §FR-021]

## Scenario & Edge Case Coverage（情境與邊界）

- [x] CHK048 「產線中斷（斷網/當機/額度耗盡）後重跑」是否明訂 checkpoint resume 行為？ [Coverage, Spec Edge Cases / FR-019]
- [x] CHK049 「manifest 遺失/損毀」是否有明訂復原路徑（掃描產物 + 重算雜湊重建）？ [Coverage, research R4]
- [x] CHK050 「維運者事後手動修訂某份 Skeleton」是否明訂只重生受影響篇（依雜湊）？ [Coverage, Spec Edge Cases / FR-020]
- [x] CHK051 429 持續不退（端點長時間限流）耗盡重試後的**終局**（非零 exit、可續跑）是否定義？ [Coverage, Gap, research R3]
- [x] CHK052 網路取得 metadata 失敗且快照無此題（產線半途外部失敗）的處置是否明訂？ [Coverage, contracts/problem-bank-population §5]
- [x] CHK053 部分 Concept `needsHumanReview` 時整批的結束狀態（非零 exit、其餘照常凍結）是否定義？ [Coverage, Spec §FR-012]

## Dependencies & Assumptions

- [x] CHK054 產線執行載體（本機優先 + 可選 `workflow_dispatch`，MUST NOT 進 `daily.yml`）的相依假設是否明訂？ [Assumption, research R2 / Spec §FR-022]
- [x] CHK055 `.cache/` 為 gitignored、非教材產物的假設是否記載，避免被誤當凍結物 commit？ [Assumption, data-model §6 / plan Structure]
- [x] CHK056 「只讀快照可離線、可重現；線上補齊只在維護時機」的相依邊界是否清楚，避免 CI/重跑依賴網路？ [Assumption, research R5 / contracts/problem-bank-population §6]

## Notes

- 勾選＝該韌性需求已在 spec/plan/contracts 有清楚、可驗、無衝突的規範。
- 本清單測「韌性需求是否寫對」，非「產線是否跑順」。

### 逐項走查結果（2026-07-30）

**觸發 spec 補強（原為 Gap，已修正）**
- CHK031 哪些錯誤觸發退避 vs 直接失敗 → FR-018 明訂「429/5xx/網路暫時性退避；非暫時性 4xx 直接失敗」。
- CHK051 退避耗盡終局 → FR-018 補「耗盡後該 Concept 計待重跑、非零 exit、checkpoint 保留供續跑」。
- CHK046 連續失敗不自動暫停 / 不永久靜默 → FR-012 補「待人工檢視篇於重跑 MUST 重新嘗試、MUST NOT 永久靜默跳過、未解前持續非零 exit」（與 F6 FR-022a 同向）。

**已滿足（spec/plan/research/contracts 已涵蓋）**：CHK030、CHK032–045、CHK047–050、CHK052–056。
- CHK034（manifest 欄位）、CHK037–039/044（退避數值、雜湊依據、可注入時鐘）、CHK045/049/056（manifest 非真實來源、遺失復原、離線快照）主要落在 plan/research/data-model，屬實作層契約，非 spec FR 缺口。

**刻意延後（有預設值/擁有者，非阻塞）**
- CHK030/CHK037 RPM 預設 10、退避數值等確切參數 → research R3 給預設，最終值於 plan/tasks 微調。
