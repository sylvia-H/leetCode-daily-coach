# Resilience Requirements Quality Checklist: 韌性與失敗隔離

**Purpose**: 上線前 release gate——驗證「多 Track 失敗隔離、告警、完課終態、最後防線」這一組需求
**寫得夠不夠完整、明確、一致、可量測**（不是驗證程式行為是否正確）
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md) ｜ **Depth**: Release gate ｜ **Scope**: 含 F1 / F5 跨 Feature 契約介面

## 需求完整性（Requirement Completeness）

- [ ] CHK001 單軌失敗時「記錄錯誤」的**內容與去識別化要求**是否已定義（錯誤訊息可能夾帶 webhook URL）？[Gap, Spec §FR-018]
- [x] CHK002 紅色告警 `reason` 欄位**MUST NOT 含 webhook URL / 金鑰**的要求是否已寫入需求？（notice-contract 只對完課通知寫了此限制，告警未寫）[Gap, Contract notice-contract §2] — ✅ 2026-07-24 已補：新增 FR-019b（通知實作內建遮蔽）、`docs/spec.md` §9.2、notice-contract §1.1
- [ ] CHK003 同一 Track 在一次執行中發生**多個失敗**時，告警則數（一則彙總 vs 每個失敗一則）是否已定義？[Gap, Spec §FR-018]
- [ ] CHK004 告警訊息本身的**重試策略**是否已定義（是否與課程訊息共用 WebhookClient 的重試/退避、或應 fail-fast）？[Gap, Contract notice-contract §3]
- [ ] CHK005 「部分推播」的告警是否被要求**告知使用者「本課進度已前進、不會補推」**，以免使用者誤等補推？[Gap, Spec §FR-012]
- [ ] CHK006 某 Track **連續多日失敗**時的行為（持續每日告警 vs 降頻 vs 自動暫停）是否已定義，或已明確排除？[Gap, Recovery]
- [x] CHK007 完課通知**發送失敗**時是否另發紅色告警，此要求是否寫在 spec 而非僅存在於契約文件？[Gap, Spec §FR-022 vs Contract notice-contract §3] — ✅ 2026-07-24 已補：新增 FR-019c
- [ ] CHK008 workflow 層「最後防線通知」的**目標頻道**是否已定義（三軌之一？全部？第一個已設定者？）[Gap, Spec §FR-019, §US4-5]
- [ ] CHK009 最後防線通知與程式內全域告警**可能同時發出**（重複打擾）的情境是否已被需求處理或明確接受？[Gap, Spec §FR-019]
- [ ] CHK010 全域失敗但**完全沒有任何已設定頻道**時（告警無處可發），可觀測性要求（日誌／exit code）是否已定義？[Gap, Spec §FR-021, §US4-4]

## 需求明確性（Requirement Clarity）

- [ ] CHK011 「紅色告警」是否以**可客觀判定的方式**定義（顏色碼 `15158332`），還是僅以「紅色」描述？[Clarity, Spec §FR-018 vs data-model §4]
- [ ] CHK012 「非紅色的課程完成通知」是否已明確到單一值（`3066993`），而非「非紅色」這種排除式描述？[Clarity, Spec §FR-022 vs data-model §4]
- [ ] CHK013 Discord 限流「由既有的退避重試吸收；重試耗盡才計為該軌失敗」中的**重試次數與退避上限**是否有明確引用來源（F1 契約），還是僅以「既有」帶過？[Clarity, Spec §Edge Cases]
- [ ] CHK014 「告警 MUST NOT 逸出成未捕捉例外」是否已轉譯為可驗證的敘述（例如「MUST NOT 重新拋出」），而非僅描述後果？[Clarity, Spec §US4-2]
- [ ] CHK015 「單一實作」（FR-019 / FR-019a）是否定義了**可稽核的判準**（同一模組／同一函式族／禁止新增第二個通知模組）？[Clarity, Spec §FR-019a]
- [ ] CHK016 「極簡純文字」最後防線通知是否量化了限制（不得使用 embeds、不得重述細節），足以在 review 時客觀判定？[Clarity, Spec §FR-019]

## 需求一致性（Requirement Consistency）

- [x] CHK017 **全域性失敗的觸發清單不一致**：spec（FR-021 / US4-4）列「無 webhook / STATE_FILE 缺失 / 解析或語意損毀 / 存檔失敗」四項，cli-contract §2 多列「素材載入失敗」——兩者是否需對齊？[Conflict, Spec §FR-021 vs Contract cli-contract §2] — ✅ 2026-07-24 已對齊：素材載入失敗補入 FR-021 / US4-4 / `docs/spec.md` §9.2 §18，並新增 FR-021a 釘死「迴圈前載入」
- [ ] CHK018 完課改判為 exit 0 是否與 F1 既有契約的「課表走完＝失敗」明確標示為**修訂關係**（而非兩份並存的矛盾契約）？[Consistency, Spec §Assumptions, Contract cli-contract §2]
- [ ] CHK019 憲章 XV「Fail loud」與 FR-022「完課不計失敗」的關係是否已在需求層留下**正當化說明**，避免日後被判為違憲？[Consistency, Constitution §XV, plan.md §Post-Design]
- [ ] CHK020 DRY_RUN 下「不發送任何通知（告警亦然）」的要求，是否同時出現在 spec 與契約，且與 FR-009「照常編譯、渲染並輸出」無衝突？[Consistency, Spec §FR-009 vs Contract notice-contract §3]
- [ ] CHK021 「部分推播仍前進進度」（FR-012）與「推播失敗的 Track 進度 MUST 保持不變」（FR-011）是否已明確標示前者為後者的**例外**，而非兩條對立規則？[Consistency, Spec §FR-011, §FR-012]

## 驗收準則可量測性（Acceptance Criteria Quality）

- [ ] CHK022 SC-004「其餘 Track 的成功率維持 100%」是否定義了**分母**（啟用軌數？非失敗軌數？）以避免歧義？[Measurability, Spec §SC-004]
- [ ] CHK023 「發出告警」是否有可機驗的判準（被攔截請求的目標頻道 + 顏色碼），而非僅靠人工目視？[Measurability, Spec §SC-004]
- [ ] CHK024 SC-011「其後每日發送次數為 0」是否定義了觀測窗口（連續執行 N 次？），使其可被自動化驗證？[Measurability, Spec §SC-011]
- [ ] CHK025 「非零結束狀態」是否釘死為單一值（1），還是允許任意非零值——影響 workflow 端可否據此分支？[Clarity, Contract cli-contract §2]

## 例外與復原情境覆蓋（Exception & Recovery Coverage）

- [ ] CHK026 需求是否涵蓋「失敗軌的 webhook 本身無效」這一自我指涉情境（告警必然也發不出去）並定義其終局？[Coverage, Spec §US4-2]
- [ ] CHK027 「多則訊息推到一半失敗」時，**是否應繼續嘗試送剩餘則**，需求是否有明確裁決？[Ambiguity, Spec §FR-012, §US4-3]
- [ ] CHK028 單軌失敗時的重試耗時是否可能拖累後續 Track 與 SC-009「數分鐘內結束」——需求是否定義**單軌處理時間上限**或明確接受此風險？[Gap, Spec §SC-009]
- [x] CHK029 課表**中間缺號**（找不到該 sessionIndex 但未超出最大值）MUST 判為失敗而非完課，此規則是否只存在於 cli-contract 而未寫入 spec 的 Edge Cases？[Gap, Contract cli-contract §1 vs Spec §Edge Cases] — ✅ 2026-07-24 已補：Edge Cases 新增「課表中間缺號」條目，FR-022 判定條件改為「超出最大 `sessionIndex`」
- [ ] CHK030 存檔（save）失敗時，**已成功推播的 Track 進度遺失**的後果（下次執行會重推同一課）是否已在需求中揭露並裁決？[Gap, Spec §FR-021]

## 跨 Feature 契約介面（Cross-Feature Contract）

- [ ] CHK031 本 Feature 對 F1 的「告警渲染」與「WebhookClient 重試/退避」的依賴是否明確標示為**不修改、只消費**，且引用了具體契約位置？[Traceability, Spec §Dependencies]
- [ ] CHK032 FR-019a「MUST NOT 修改 F5 的版面或解析邏輯」是否可被客觀稽核（例如以「F5 產物檔案不得出現在本 Feature 變更清單」表述）？[Measurability, Spec §FR-019a, §Out of Scope]

## Notes

- 勾選規則：`[x]` 表示該項需求敘述**已確認完整/明確/一致**；若發現缺口，請直接修訂 [spec.md](../spec.md) 對應段落後再勾選。
- 本表檢查的是**需求文字**，不是程式行為；程式行為的驗證屬 `tests/e2e/**` 與 `acceptance.md`。
- 高風險優先項：CHK017（契約清單不一致）、CHK029（缺號誤判完課）、CHK002（告警洩漏 URL）、CHK027（部分推播未裁決）。
