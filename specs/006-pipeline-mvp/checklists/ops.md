# Operations Requirements Quality Checklist: 上線與維運

**Purpose**: 上線前 release gate——驗證「維運 runbook、預設分支、Secrets 邊界、實機驗收紀錄」
這一組需求**寫得夠不夠完整、明確、一致、可量測**（不是驗證維運操作本身是否成功）
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md) ｜ **Depth**: Release gate ｜ **Scope**: 含跨 Feature 上線契約

## Runbook 需求完整性（Requirement Completeness）

- [x] CHK001 FR-023 的 runbook 涵蓋清單是否包含「**讓已完課 Track 重新推播**」（需同時改 `currentSessionIndex` 並刪除 `completedAt`）？[Gap, Spec §FR-023 vs Contract state-schema §3] — ✅ 2026-07-24 已補：新增 FR-023a
- [x] CHK002 runbook 是否被要求說明「只改 `currentSessionIndex` 而未刪 `completedAt` ⇒ 該軌仍會被靜默跳過」這個**沉默失敗**陷阱？[Gap, Contract state-schema §3] — ✅ 2026-07-24 已補：FR-023a 明訂 MUST 以「沉默失敗警告」形式寫入 runbook
- [ ] CHK003 runbook 需求是否涵蓋「如何判讀執行記錄中的各種結局」（`pushed` / `skipped` / `completed` / `failed` / `alert-failed`）？[Gap, Spec §FR-023, Contract cli-contract §3]
- [ ] CHK004 「推播失敗時的排查起點」是否有可驗收的最小內容定義（看哪裡、找什麼、下一步做什麼），還是僅為一句概括要求？[Clarity, Spec §FR-023]
- [ ] CHK005 runbook 的**存放位置**是否已在需求中指定，還是只存在於 plan？[Gap, Spec §FR-023 vs plan.md §Project Structure]
- [ ] CHK006 「不需改程式即可完成的操作」是否已釐清其**權限前提**（編輯 `state` 分支需 push 權限、改 Secrets 需 repo 設定權限）？[Assumption, Spec §FR-023]
- [ ] CHK007 webhook URL **輪換或外洩後的處置流程**是否納入維運需求，或已明確排除？[Gap, Spec §FR-025]
- [ ] CHK008 「暫停某 Track」＝移除 Secret，需求是否釐清 **Secret 未設定 vs 設定為空字串**兩者皆視為停用？[Ambiguity, Spec §FR-007, §US5-2]

## 分支與部署需求（Deployment Requirements）

- [ ] CHK009 FR-024「MUST 確認 `develop` 即為 GitHub 設定的預設分支」是否定義了**確認方式與留存證據**，使其可被驗收？[Measurability, Spec §FR-024]
- [ ] CHK010 「程式與內容併入 `develop` 才會反映到每日推播」是否同時要求說明「併入 `main` 不影響推播」，避免維運者誤判？[Completeness, Spec §Edge Cases, §FR-024]
- [ ] CHK011 若未來預設分支被變更，需求是否留下**偵測或防呆**的期待（或明確接受此風險）？[Gap, Spec §FR-024]
- [ ] CHK012 「checkout step MUST NOT 指定 `ref:`」這條實作級約束是否有對應的**需求層理由**可追溯（workflow 定義與執行內容須同分支）？[Traceability, Contract cli-contract §4 vs Spec §FR-024]
- [ ] CHK013 `state` 分支與程式分支**分別 checkout** 的關係是否已在需求層說清楚，避免與 FR-024「MUST NOT 另行 checkout 其他分支」互相矛盾？[Conflict, Spec §FR-024 vs Contract cli-contract §4]

## Secrets 與資訊邊界（Security Requirements Quality）

- [ ] CHK014 FR-025「MUST NOT 出現在 repo 或任何產物中」中的「產物」是否有明確範圍（含執行記錄、Actions log、acceptance.md、runbook）？[Clarity, Spec §FR-025]
- [ ] CHK015 acceptance.md「MUST NOT 出現任何 webhook URL 或金鑰」是否延伸涵蓋**所附 Actions 執行連結所指向的 log 內容**？[Gap, Spec §FR-027]
- [ ] CHK016 runbook 中示範的操作步驟（例如設定 Secret）是否被要求使用佔位示意而非真實值？[Gap, Constitution §XIV, Spec §FR-025]
- [ ] CHK017 「日誌 MUST NOT 印出 webhook URL」是否只寫在 cli-contract，未升格為本 Feature 的 FR？[Gap, Contract cli-contract §3 vs Spec §FR-025]

## 實機驗收紀錄需求（Acceptance Record Requirements）

- [x] CHK018 FR-027 只列 AC2 / AC3 / AC4 / AC5 / AC6 / AC10，但 US3-4 引用了 **AC9**（預覽模式不寫狀態）——驗收紀錄是否應涵蓋 AC9？[Conflict, Spec §FR-027 vs §US3-4] — ✅ 2026-07-24 已裁決納入：FR-027 / SC-010 改為七條，並註明「僅 AC9 後半，前半的課表 byte-identical 屬 F4」
- [ ] CHK019 AC5（三軌教材共用、難度分歧）與 AC6（零 LLM 金鑰）**能否從實機 Actions run 取得證據**，其證據形式是否已定義？[Measurability, Spec §FR-027, §SC-010]
- [ ] CHK020 AC10（失敗隔離）的實機驗收是否定義了**如何在正式環境安全地製造失敗**（不影響真實學習者），或已允許以自動化證據替代？[Gap, Spec §SC-010]
- [x] CHK021 「每條各附至少一個真實 Actions 執行連結」是否考慮了同一次 run 可同時佐證多條 AC 的情形（是否允許重用）？[Clarity, Spec §SC-010] — ✅ 2026-07-24 已明確：SC-010 補上「同一次 run 可同時佐證多條」
- [ ] CHK022 驗收紀錄的**填寫者與時機**（implement 階段建立、維運者事後填寫）是否已在需求中明確，避免成為無主文件？[Gap, Spec §FR-027 vs plan.md §Project Structure]
- [ ] CHK023 「全數勾選才算本 Feature 完成」與 SDD 流程的 merge 時點如何協調（實機驗收在 merge 前或後）是否已定義？[Ambiguity, Spec §FR-027, CLAUDE.md §SDD 流程]

## 驗收準則可量測性（Acceptance Criteria Quality）

- [ ] CHK024 SC-008「僅依 runbook（不閱讀原始碼）即可完成五項操作」是否定義了**驗證者身分與判定方式**（自我驗證？他人盲測？）？[Measurability, Spec §SC-008]
- [ ] CHK025 SC-008 的五項操作是否與 FR-023 的 runbook 涵蓋清單**逐項對應**（無涵蓋卻要驗、或有涵蓋卻不驗）？[Consistency, Spec §SC-008 vs §FR-023]
- [ ] CHK026 SC-009「數分鐘內結束」是否量化為具體上限值，或明確說明為何不需量化？[Measurability, Spec §SC-009]
- [ ] CHK027 SC-010「金鑰／webhook URL 出現次數為 0」是否定義了掃描範圍與方式，使其可自動化？[Measurability, Spec §SC-010]

## 情境覆蓋與假設（Coverage & Assumptions）

- [ ] CHK028 「三軌 seed 課表各 13 課、F7 內容進來前會實際發生完課」這項假設，是否連帶要求 runbook 說明**完課後該怎麼辦**？[Assumption, Spec §Assumptions, §Edge Cases]
- [ ] CHK029 「`state` 分支已存在（F1 已初始化）」的假設是否有**假設不成立時的補救說明**（初始化步驟）納入 runbook 需求？[Assumption, Spec §FR-023, §Assumptions]
- [ ] CHK030 維運操作的**回復路徑**（改錯進度、誤刪 Secret、誤推 state）是否有任一被涵蓋，或已明確排除？[Gap, Recovery]
- [ ] CHK031 「不另設告警頻道」的假設是否已說明其後果（告警與課程混在同一頻道、可能被學習者看到）並被接受？[Assumption, Spec §Assumptions]

## Notes

- 勾選規則：`[x]` 表示該項需求敘述**已確認完整/明確/一致**；若發現缺口，請直接修訂 [spec.md](../spec.md) 對應段落後再勾選。
- 高風險優先項：CHK018（AC9 是否漏列）、CHK013（FR-024 與 state 分支 checkout 的表面矛盾）、CHK002（完課後沉默跳過的陷阱）、CHK019（AC5/AC6 的實機證據形式未定義）。
