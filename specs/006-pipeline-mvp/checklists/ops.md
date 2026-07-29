# Operations Requirements Quality Checklist: 上線與維運

**Purpose**: 上線前 release gate——驗證「維運 runbook、預設分支、Secrets 邊界、實機驗收紀錄」
這一組需求**寫得夠不夠完整、明確、一致、可量測**（不是驗證維運操作本身是否成功）
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md) ｜ **Depth**: Release gate ｜ **Scope**: 含跨 Feature 上線契約

## Runbook 需求完整性（Requirement Completeness）

- [x] CHK001 FR-023 的 runbook 涵蓋清單是否包含「**讓已完課 Track 重新推播**」（需同時改 `currentSessionIndex` 並刪除 `completedAt`）？[Gap, Spec §FR-023 vs Contract state-schema §3] — ✅ 2026-07-24 已補：新增 FR-023a
- [x] CHK002 runbook 是否被要求說明「只改 `currentSessionIndex` 而未刪 `completedAt` ⇒ 該軌仍會被靜默跳過」這個**沉默失敗**陷阱？[Gap, Contract state-schema §3] — ✅ 2026-07-24 已補：FR-023a 明訂 MUST 以「沉默失敗警告」形式寫入 runbook
- [x] CHK003 runbook 需求是否涵蓋「如何判讀執行記錄中的各種結局」（`pushed` / `skipped` / `completed` / `failed` / `alert-failed`）？[Gap, Spec §FR-023, Contract cli-contract §3] — ✅ 2026-07-29 已補：FR-023 新增「執行結局的判讀對照」——MUST 列出各結局字樣的意義與應對動作，使維運者不需讀原始碼即可判讀一次執行
- [x] CHK004 「推播失敗時的排查起點」是否有可驗收的最小內容定義（看哪裡、找什麼、下一步做什麼），還是僅為一句概括要求？[Clarity, Spec §FR-023] — ✅ 2026-07-29 已補：FR-023 新增「排查起點的最小內容」——MUST 具體到「看哪裡／找什麼／下一步做什麼」三段，MUST NOT 只寫一句概括要求
- [x] CHK005 runbook 的**存放位置**是否已在需求中指定，還是只存在於 plan？[Gap, Spec §FR-023 vs plan.md §Project Structure] — ✅ 2026-07-29 已補：FR-023 明訂存放於 `docs/runbook.md`
- [x] CHK006 「不需改程式即可完成的操作」是否已釐清其**權限前提**（編輯 `state` 分支需 push 權限、改 Secrets 需 repo 設定權限）？[Assumption, Spec §FR-023] — ✅ 2026-07-29 已補：FR-023 新增「權限前提」項，並要求說明缺權限時不應誤判為程式故障
- [x] CHK007 webhook URL **輪換或外洩後的處置流程**是否納入維運需求，或已明確排除？[Gap, Spec §FR-025] — ✅ 2026-07-29 已補：FR-023 新增「webhook URL 輪換與外洩處置」——重建 webhook → 更新 Secret → 確認下次執行成功；外洩 MUST 以「重建並輪換」處理，MUST NOT 只刪訊息
- [x] CHK008 「暫停某 Track」＝移除 Secret，需求是否釐清 **Secret 未設定 vs 設定為空字串**兩者皆視為停用？[Ambiguity, Spec §FR-007, §US5-2] — ✅ 2026-07-29 已補：新增 FR-025b——未設定與空字串／純空白 MUST 一律視為停用、行為完全相同（與現行設定載入實作一致）

## 分支與部署需求（Deployment Requirements）

- [x] CHK009 FR-024「MUST 確認 `develop` 即為 GitHub 設定的預設分支」是否定義了**確認方式與留存證據**，使其可被驗收？[Measurability, Spec §FR-024] — ✅ 2026-07-29 已補：FR-024 明訂驗收方式為**文件化確認**（記錄當下 GitHub 預設分支設定，證據記入實機驗收紀錄），MUST NOT 以「等待一次真實 cron」為完成條件
- [x] CHK010 「程式與內容併入 `develop` 才會反映到每日推播」是否同時要求說明「併入 `main` 不影響推播」，避免維運者誤判？[Completeness, Spec §Edge Cases, §FR-024] — ✅ 2026-07-29 已補：FR-024 新增「併入 `main` 不影響每日推播」，並要求 runbook 同時明示（只說前者不足以避免誤判）
- [x] CHK011 若未來預設分支被變更，需求是否留下**偵測或防呆**的期待（或明確接受此風險）？[Gap, Spec §FR-024] — ✅ 2026-07-29 已裁決明確接受：FR-024 明訂 MUST NOT 為此新增偵測或防呆（GitHub 設定不在 repo 內、無零成本可靠偵測手段），改以 runbook 記載後果作為告知
- [x] CHK012 「checkout step MUST NOT 指定 `ref:`」這條實作級約束是否有對應的**需求層理由**可追溯（workflow 定義與執行內容須同分支）？[Traceability, Contract cli-contract §4 vs Spec §FR-024] — ✅ 2026-07-29 覆核：FR-024 本文即載明理由「避免 workflow 定義與執行內容分屬不同分支」，可直接追溯
- [x] CHK013 `state` 分支與程式分支**分別 checkout** 的關係是否已在需求層說清楚，避免與 FR-024「MUST NOT 另行 checkout 其他分支」互相矛盾？[Conflict, Spec §FR-024 vs Contract cli-contract §4] — ✅ 2026-07-29 已釐清：FR-024 新增「與 `state` 分支 checkout 並不衝突」——限制對象是「程式與課程內容」的取用來源，狀態檔屬**資料**、MUST 繼續獨立 checkout，兩者 MUST NOT 被解讀為矛盾

## Secrets 與資訊邊界（Security Requirements Quality）

- [x] CHK014 FR-025「MUST NOT 出現在 repo 或任何產物中」中的「產物」是否有明確範圍（含執行記錄、Actions log、acceptance.md、runbook）？[Clarity, Spec §FR-025] — ✅ 2026-07-29 已補：FR-025 明列「產物」範圍——repo 內任何檔案、執行記錄（含完整 workflow log）、實機驗收紀錄、維運 runbook、推播出去的任何訊息內容
- [x] CHK015 acceptance.md「MUST NOT 出現任何 webhook URL 或金鑰」是否延伸涵蓋**所附 Actions 執行連結所指向的 log 內容**？[Gap, Spec §FR-027] — ✅ 2026-07-29 已補：FR-027 明載「所附連結指向的 log 亦然，由 FR-025a 保證」；FR-025a 另說明「若 log 含 URL，等同驗收紀錄本身洩漏金鑰」
- [x] CHK016 runbook 中示範的操作步驟（例如設定 Secret）是否被要求使用佔位示意而非真實值？[Gap, Constitution §XIV, Spec §FR-025] — ✅ 2026-07-29 已補：FR-023 新增「示範值 MUST 為佔位示意」——runbook 內所有 Secret / webhook URL 示範 MUST NOT 使用真實值
- [x] CHK017 「日誌 MUST NOT 印出 webhook URL」是否只寫在 cli-contract，未升格為本 Feature 的 FR？[Gap, Contract cli-contract §3 vs Spec §FR-025] — ✅ 2026-07-29 已升格：新增 FR-025a——執行記錄 MUST NOT 印出任何 Track 的 webhook URL（含成功路徑診斷輸出與失敗路徑錯誤訊息）

## 實機驗收紀錄需求（Acceptance Record Requirements）

- [x] CHK018 FR-027 只列 AC2 / AC3 / AC4 / AC5 / AC6 / AC10，但 US3-4 引用了 **AC9**（預覽模式不寫狀態）——驗收紀錄是否應涵蓋 AC9？[Conflict, Spec §FR-027 vs §US3-4] — ✅ 2026-07-24 已裁決納入：FR-027 / SC-010 改為七條，並註明「僅 AC9 後半，前半的課表 byte-identical 屬 F4」
- [x] CHK019 AC5（三軌教材共用、難度分歧）與 AC6（零 LLM 金鑰）**能否從實機 Actions run 取得證據**，其證據形式是否已定義？[Measurability, Spec §FR-027, §SC-010] — ✅ 2026-07-29 已補：FR-027 新增「AC5 / AC6 的實機證據形式」——AC5 以同一次 run 中三軌推播內容的觀察結果佐證；AC6 以「該次 run 環境未提供任何 LLM 金鑰且執行成功」＋ workflow 定義掃描結果佐證，兩者 MUST NOT 僅以宣稱陳述
- [x] CHK020 AC10（失敗隔離）的實機驗收是否定義了**如何在正式環境安全地製造失敗**（不影響真實學習者），或已允許以自動化證據替代？[Gap, Spec §SC-010] — ✅ 2026-07-29 已補：新增 FR-027b（當日推播前暫改一軌 Secret 為無效值、不帶 force、觀察後還原，副作用為零），並要求同步寫入 runbook
- [x] CHK021 「每條各附至少一個真實 Actions 執行連結」是否考慮了同一次 run 可同時佐證多條 AC 的情形（是否允許重用）？[Clarity, Spec §SC-010] — ✅ 2026-07-24 已明確：SC-010 補上「同一次 run 可同時佐證多條」
- [x] CHK022 驗收紀錄的**填寫者與時機**（implement 階段建立、維運者事後填寫）是否已在需求中明確，避免成為無主文件？[Gap, Spec §FR-027 vs plan.md §Project Structure] — ✅ 2026-07-29 已補：FR-027 新增「填寫者與時機 MUST 明確」——空白表格於實作階段建立並進版控，實際觀察與連結由維運者於實機執行後填寫勾選
- [x] CHK023 「全數勾選才算本 Feature 完成」與 SDD 流程的 merge 時點如何協調（實機驗收在 merge 前或後）是否已定義？[Ambiguity, Spec §FR-027, CLAUDE.md §SDD 流程] — ✅ 2026-07-29 已定案：新增 FR-027a——merge 前於 feature branch 以 `workflow_dispatch` 完成七條並勾選，全勾選後才 merge；AC3 以兩次 dispatch 佐證，不依賴真實 cron

## 驗收準則可量測性（Acceptance Criteria Quality）

- [x] CHK024 SC-008「僅依 runbook（不閱讀原始碼）即可完成五項操作」是否定義了**驗證者身分與判定方式**（自我驗證？他人盲測？）？[Measurability, Spec §SC-008] — ✅ 2026-07-29 已補：SC-008 明訂為**維運者本人的自我驗證**（單人維運、無第三方盲測條件），判定標準是「過程中未開啟任何原始碼檔案」
- [x] CHK025 SC-008 的五項操作是否與 FR-023 的 runbook 涵蓋清單**逐項對應**（無涵蓋卻要驗、或有涵蓋卻不驗）？[Consistency, Spec §SC-008 vs §FR-023] — ✅ 2026-07-29 已補：SC-008 明訂五項操作 MUST 與 FR-023 涵蓋清單逐項對應（不驗未涵蓋者、不漏驗已涵蓋者）
- [x] CHK026 SC-009「數分鐘內結束」是否量化為具體上限值，或明確說明為何不需量化？[Measurability, Spec §SC-009] — ✅ 2026-07-29 覆核：SC-009 已於 `/speckit-analyze` 後收斂為 **≤ 10 分鐘**，並註明取值理由（`npm ci` 快取失效或 runner 較慢時不致誤判）
- [x] CHK027 SC-010「金鑰／webhook URL 出現次數為 0」是否定義了掃描範圍與方式，使其可自動化？[Measurability, Spec §SC-010] — ✅ 2026-07-29 已補：SC-010 明訂掃描範圍為 `acceptance.md` 全文與 `docs/runbook.md` 全文，方式為對 webhook URL 樣式與金鑰名稱（FR-005 字串集合）做全文比對

## 情境覆蓋與假設（Coverage & Assumptions）

- [x] CHK028 「三軌 seed 課表各 13 課、F7 內容進來前會實際發生完課」這項假設，是否連帶要求 runbook 說明**完課後該怎麼辦**？[Assumption, Spec §Assumptions, §Edge Cases] — ✅ 2026-07-29 覆核：FR-023a 已要求 runbook 明示「已完課 Track 的重新推播程序」（調回 `currentSessionIndex` 並清除 `completedAt`）及其沉默失敗警告
- [x] CHK029 「`state` 分支已存在（F1 已初始化）」的假設是否有**假設不成立時的補救說明**（初始化步驟）納入 runbook 需求？[Assumption, Spec §FR-023, §Assumptions] — ✅ 2026-07-29 已補：FR-023 涵蓋清單新增「`state` 分支不存在時的初始化步驟」
- [x] CHK030 維運操作的**回復路徑**（改錯進度、誤刪 Secret、誤推 state）是否有任一被涵蓋，或已明確排除？[Gap, Recovery] — ✅ 2026-07-29 已補：FR-023 涵蓋清單新增「回復路徑」——改錯進度、誤刪 Secret、誤推狀態檔三種常見誤操作的回復方式
- [x] CHK031 「不另設告警頻道」的假設是否已說明其後果（告警與課程混在同一頻道、可能被學習者看到）並被接受？[Assumption, Spec §Assumptions] — ✅ 2026-07-29 已補：Assumptions 該條新增「已知後果並接受」——紅色告警會與課程訊息混在同一頻道且對學習者可見，屬 free-tier 與單人使用情境下的刻意取捨（維運者與學習者是同一人）

## Notes

- 勾選規則：`[x]` 表示該項需求敘述**已確認完整/明確/一致**；若發現缺口，請直接修訂 [spec.md](../spec.md) 對應段落後再勾選。
- 高風險優先項：CHK018（AC9 是否漏列）、CHK013（FR-024 與 state 分支 checkout 的表面矛盾）、CHK002（完課後沉默跳過的陷阱）、CHK019（AC5/AC6 的實機證據形式未定義）。
- **2026-07-29 全數結清**：本表 31 項全部通過。其中 CHK011（預設分支變更防呆）為本輪新增的「明確接受風險」裁決，理由已寫入 FR-024。
