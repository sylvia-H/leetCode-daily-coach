# State Contract Requirements Quality Checklist: 狀態契約與冪等

**Purpose**: 上線前 release gate——驗證「per-track guard、模式旗標、狀態推進、單次存檔與單一 commit、
`completedAt` 增量」這一組需求**寫得夠不夠完整、明確、一致、可量測**（不是驗證程式行為是否正確）
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md) ｜ **Depth**: Release gate ｜ **Scope**: 含 F1 state 契約的修訂介面

## 需求完整性（Requirement Completeness）

- [x] CHK001 「完課 MUST NOT 更新 `lastPushAt`」這條規則是否寫進了 spec，還是只存在於 data-model／契約文件？[Gap, data-model §1 vs Spec §FR-022] — ✅ 2026-07-29 已補：FR-022 新增「完課的狀態不變式」——只寫完課時間，MUST NOT 更新 `lastPushAt`、MUST NOT 前進 `currentSessionIndex`
- [x] CHK002 「人工把 `currentSessionIndex` 調回範圍內時 MUST 一併清除 `completedAt`」這條**維運陷阱**是否已在 spec 需求層留下要求（而非僅在契約與 runbook）？[Gap, Contract state-schema §3 vs Spec §FR-022] — ✅ 2026-07-24：`docs/spec.md` §9.2 / §19 原本即有，F6 spec 補上 FR-023a（runbook MUST 以「沉默失敗警告」形式明示）；⚠️ **2026-07-29 修訂**：改由 FR-022b 的自動解除處理（`completedAt` 與課表矛盾時程式自刪），人工清除降為 SHOULD
- [x] CHK003 完課 MUST NOT 產生 `history` 條目、MUST NOT 追加 `completedConceptIds` 的不變式，是否已在 spec 的 FR 或 Key Entities 中表述？[Gap, data-model §1] — ✅ 2026-07-29 已補：FR-022「完課的狀態不變式」明列此兩項，並說明理由（完課不是一次推播）
- [x] CHK004 **全部 Track 都被跳過**（零推播）時，是否仍執行存檔與提交，需求是否有明確裁決？[Ambiguity, Spec §FR-013, §SC-002] — ✅ 2026-07-24 已裁決：照常存檔（寫出內容相同的檔案），由提交步驟偵測無變更而略過提交；寫入 FR-015、`docs/spec.md` §19、cli-contract §4
- [x] CHK005 承上：SC-003 要求「恰好 1 個 commit」、SC-002 要求「狀態檔內容完全不變」——**無內容變更時 commit 數應為 0 還是 1**，兩條 SC 是否已對齊？[Conflict, Spec §SC-002 vs §SC-003] — ✅ 2026-07-24 已對齊：SC-002 明列 commit 數為 0，SC-003 加上「確有進度變更」的前提，FR-015 改為「至多一個 commit」
- [x] CHK006 狀態檔中出現**不屬於三個已知 Track 的未知鍵**時的處理（保留？視為語意損毀？）是否已定義？[Gap, Spec §FR-017] — ✅ 2026-07-29 已裁決：**判為欄位語意損毀 → 全域性失敗**（補入 FR-031 封閉清單與 Edge Cases，並回寫 `docs/spec.md` §19）。理由：與「值的手誤即全域失敗」一致；靜默忽略會使維運者的編輯完全不生效卻無訊號；中止點在迴圈前故原檔得以保全
- [x] CHK007 `STATE_FILE` 指向的檔案存在但**內容為空字串／非 JSON** 時，是否明確歸類為「解析失敗＝全域失敗」而非「視為空狀態」？[Ambiguity, Spec §FR-021 vs §Edge Cases] — ✅ 2026-07-29 已裁決：「檔案不存在」是唯一的寬容入口；存在但空字串／純空白／非 JSON／不符 schema 一律判為解析失敗＝全域性失敗。已同步 Edge Cases 與 FR-021
- [x] CHK008 強制模式在**同一天重複執行**時，`currentSessionIndex` 會連續 +1（同日跳兩課）的後果，是否已在需求中揭露並裁決？[Gap, Spec §FR-009, §US2-3] — ✅ 2026-07-29 已裁決：明確揭露並接受——FR-009 釘死 force 語意為單一的「繞過日期 guard、其餘照常」，MUST NOT 內建隱藏例外；風險與回復路徑由 FR-023b 要求寫入 runbook
- [x] CHK009 提交推送重試（上限 3 次）之間是否需要**等待間隔**，需求是否有定義或明確交由實作決定？[Gap, Spec §FR-016] — ✅ 2026-07-29 已明確：FR-016 補上「不要求固定等待間隔（重新同步本身即為有效間隔），是否加入 MAY 由實作決定」
- [x] CHK010 `state` 分支的**寫入權限前提**（Actions token 權限範圍）是否已列為需求或依賴，而非隱含假設？[Assumption, Spec §Dependencies] — ✅ 2026-07-29 已補：Dependencies 明列「執行權杖 MUST 具備 repo 內容寫入權限，否則提交步驟必然失敗；MUST NOT 停留在隱含假設」

## 需求明確性（Requirement Clarity）

- [x] CHK011 `history` 上限 30 是否明確為 **per-Track** 而非全域？[Clarity, Spec §FR-014 vs §Key Entities] — ✅ 2026-07-29 已補：FR-014 改為「MUST **per-Track 各自**滾動保留上限 30 筆（非三軌合計）」
- [x] CHK012 「進度前進一課」是否明確定義為 `currentSessionIndex + 1`，而非「下一個存在的 sessionIndex」（涉及缺號課表的解讀）？[Ambiguity, Spec §FR-011] — ✅ 2026-07-29 已補：FR-011 明訂「前進一課的精確語意為 `currentSessionIndex` 加 1」，MUST NOT 解讀為「跳到下一個存在的 sessionIndex」
- [x] CHK013 `completedAt` 的「缺席或 `null` ⇒ 未完課」語意是否在 spec 層可讀出，還是需要讀契約才知道？[Clarity, Contract state-schema §1] — ✅ 2026-07-29 已補：FR-022 新增「完課時間欄位的語意」——選填、缺席或空值皆代表未完課、向後相容、未設定時 MUST NOT 憑空寫出該鍵
- [x] CHK014 「欄位語意損毀」（FR-021 觸發全域失敗的條件之一）是否有可判定的定義清單，還是留給實作自由心證？[Clarity, Spec §FR-021, §FR-026] — ✅ 2026-07-29 已補：新增 FR-031 列出**封閉清單**（八款），並明訂清單以外的內容差異 MUST NOT 判為損毀
- [x] CHK015 「單次存檔」是否明確為「至多一次 `save()` 呼叫」，且涵蓋「零變更時是否仍算一次」的情形？[Clarity, Spec §FR-013 vs data-model §2] — ✅ 2026-07-29 已補：FR-013 明訂「一次執行至多發生一次存檔動作」，並說明三軌皆跳過時仍存檔一次、預覽模式為零次
- [x] CHK016 Asia/Taipei 日期換算的**輸入來源**（`lastPushAt` 的 ISO 字串時區）是否明確，避免「本地時間字串」與「UTC 字串」混淆？[Clarity, Spec §FR-008] — ✅ 2026-07-29 已補：新增 FR-032——輸入 MUST 為帶時區的 ISO 8601 字串（程式寫入時即為 UTC），MUST NOT 以不帶時區的本地時間字串為輸入

## 需求一致性（Requirement Consistency）

- [x] CHK017 三種模式的優先序（DRY_RUN > FORCE > guard）是否在 spec、cli-contract、Edge Cases 三處表述一致？[Consistency, Spec §FR-009, §Edge Cases] — ✅ 2026-07-29 已補：FR-009 明訂優先序為「預覽模式 > 強制模式 > 日期 guard」，且此優先序 MUST 在需求、契約與 Edge Cases 三處表述一致
- [x] CHK018 「FORCE 只繞過日期 guard、不繞過完課跳過」這條區隔是否同時出現在 spec 與 cli-contract？[Consistency, Contract cli-contract §1 vs Spec §FR-009, §FR-022] — ✅ 2026-07-29 已補：FR-022 新增「強制模式 MUST NOT 繞過完課跳過」，與 cli-contract §1 的模式矩陣一致
- [x] CHK019 US3-7（超出課表 → `currentSessionIndex` 不前進）與 FR-011（成功才 +1）是否一致地把「完課」排除在「推播成功」之外？[Consistency, Spec §US3-7, §FR-011] — ✅ 2026-07-29 已補：FR-011 明載「完課 MUST NOT 計為推播成功——完課只寫完課時間，MUST NOT 前進 `currentSessionIndex`」
- [x] CHK020 `completedAt` 作為**跨 Feature 狀態契約變更**，是否已確認回寫 `docs/spec.md` §19 且與 F1 契約標示為修訂關係（非並存）？[Consistency, Spec §Assumptions, Contract state-schema] — ✅ 2026-07-29 覆核：Assumptions 已載明回寫 `docs/spec.md` §9.2 / §18 / §19，`docs/spec.md` §9.2 標「此處**取代**之」；FR-033 另釘死修訂範圍為「只增一個選填欄位」
- [x] CHK021 「未啟用但已存在的 Track 原樣保留」是否明確涵蓋其 `completedAt` 欄位（不因未啟用而被 `save()` 抹除）？[Consistency, Spec §FR-017 vs data-model §1] — ✅ 2026-07-24 已補：Edge Cases 該條改為「原樣保留其進度（含完課時間欄位）」

## 驗收準則可量測性（Acceptance Criteria Quality）

- [x] CHK022 SC-002「狀態檔內容完全不變」是否定義了比對層級（位元組相同 vs 語意相同），以決定序列化順序是否也在保證範圍內？[Measurability, Spec §SC-002] — ✅ 2026-07-24 已明確：SC-002 改寫為「內容**位元組相同**」
- [x] CHK023 SC-003「`main` / `develop` 的 bot 狀態提交數為 0」是否定義了**觀測方式與時間範圍**（全歷史？本 Feature 期間？）？[Measurability, Spec §SC-003] — ✅ 2026-07-29 已補：SC-003 明訂觀測方式為「以提交歷史依 bot 提交者身分篩選」、時間範圍為「本 Feature 分支建立之後至驗收當下」（先前歷史不在保證範圍）
- [x] CHK024 「進度變化量為 0」是否涵蓋 `lastPushAt` / `history` / `completedConceptIds` 全部欄位，還是僅指 `currentSessionIndex`？[Clarity, Spec §SC-003] — ✅ 2026-07-24 已明確：SC-003 逐一列出四個欄位
- [x] CHK025 SC-011「結束狀態碼為 0」的量測是否與「該次執行同時存在其他失敗軌」的情形分離（避免驗收條件被其他軌污染）？[Measurability, Spec §SC-011] — ✅ 2026-07-29 已補：SC-011 明訂「本項的量測 MUST 在『該次執行不存在其他失敗軌』的條件下進行」

## 情境與邊界覆蓋（Scenario & Edge Coverage）

- [x] CHK026 台北時間跨日邊界（`lastPushAt` 落在 UTC 前一日）是否有對應的驗收情境？[Coverage, Spec §US2-4] — ✅ 2026-07-29 覆核：US2 Acceptance Scenario 4 即為此情境（明訂時區換算 MUST 以 Asia/Taipei 日期為準、非 UTC 日期），且 FR-032 補上換算輸入來源的定義
- [x] CHK027 「狀態檔不存在」（`state` 分支初次使用）與「狀態檔存在但 `tracks` 為空物件」兩種情境是否都被涵蓋？[Coverage, Spec §Edge Cases] — ✅ 2026-07-29 已補：Edge Cases 新增「狀態檔存在但 `tracks` 為空物件（或缺少該鍵）」條目，並明訂與「檔案不存在」MUST 有一致的結果
- [x] CHK028 新啟用 Track 的自動補建，其**初始值全集**（`currentSessionIndex=1`、`lastPushAt=null`、空陣列）是否已定義，而非僅說「從第 1 課開始」？[Completeness, Spec §FR-017, §US3-6] — ✅ 2026-07-29 已補：FR-017 明列初始值全集五項（含「不含完課時間欄位」）
- [x] CHK029 雙 cron 極罕見重疊導致的推送衝突是否為唯一被涵蓋的併發情境，其他併發來源（手動觸發與排程同時）是否已考慮？[Coverage, Spec §US3-5] — ✅ 2026-07-29 已補：Edge Cases 新增「除雙 cron 外的併發來源」——MUST 由同一套併發控制與提交衝突重試涵蓋，workflow MUST 設併發群組使同時觸發者排隊
- [x] CHK030 「暫停後重新啟用」時，舊的 `lastPushAt` 會使 guard 立即生效／失效的行為是否已在需求中說清楚？[Gap, Spec §US5-2] — ✅ 2026-07-29 已補：Edge Cases 新增「暫停後重新啟用某 Track」——舊時間保留，非當日即放行續播、恰為當日則跳過隔日續播，兩者皆為正確行為

## 跨 Feature 契約介面（Cross-Feature Contract）

- [x] CHK031 本 Feature 對 F1 `state-schema` 契約的修訂範圍是否明確界定為「只增選填欄位、其餘沿用」，可據此稽核未預期的契約漂移？[Traceability, Contract state-schema §開頭] — ✅ 2026-07-29 已補：新增 FR-033 明訂修訂 MUST 限於「新增一個選填欄位（完課時間）」，其餘欄位語意、序列化順序與存取入口一律沿用
- [x] CHK032 「向後相容、既有 `state` 分支不需遷移」是否被列為**可驗證的需求**（而非設計備註），例如以現行 state.json 載入成功為準？[Measurability, Contract state-schema §1] — ✅ 2026-07-29 已補：FR-033 明訂「向後相容 MUST 為可驗證的需求：現行 `state` 分支上不含該欄位的狀態檔 MUST 能直接載入成功且不需遷移」

## Notes

- 勾選規則：`[x]` 表示該項需求敘述**已確認完整/明確/一致**；若發現缺口，請直接修訂 [spec.md](../spec.md) 或對應契約後再勾選。
- 高風險優先項：CHK005（SC-002 與 SC-003 的 commit 數矛盾）、CHK004（全跳過是否存檔）、CHK002（`completedAt` 人工清除規則未進 spec）、CHK008（force 同日跳兩課）。
- **2026-07-29 全數結清**：本表 32 項全部通過。其中 CHK006（未知 Track 鍵）、CHK007（空字串狀態檔）、CHK008（force 同日跳課）屬本輪新增的裁決，前兩者已回寫 `docs/spec.md` §19。
