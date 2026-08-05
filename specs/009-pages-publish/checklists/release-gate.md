# Release Gate Requirements Quality Checklist: Pages Publish

**Purpose**: `/speckit-tasks` 前的全面重新掃描——跨全部九大品質維度逐條檢驗 spec.md 的需求敘述本身
（完整性／明確性／一致性／可量測性／情境與邊界覆蓋／非功能需求／依賴假設／歧義衝突），不驗證程式行為
**Created**: 2026-08-05 ｜ **Depth**: Release gate（發現缺口即直接修訂 spec.md 並勾選，而非僅記錄）
**Feature**: [spec.md](../spec.md) ｜ **Scope**: 全部類別，含本次 `/speckit-clarify`（Q3 stateless 改版）
遺留的一致性覆核

## 需求完整性（Requirement Completeness）

- [x] CHK001 今日課程（FR-004）對「最近一次推播為**非 concept 類** Session」的呈現方式是否已定義？[Gap] — ✅ 2026-08-05 已補：FR-004 新增規則——不引入新 Concept 的 Session MUST 呈現固定標籤，MUST NOT 虛構所屬 Concept
- [x] CHK002 完全未啟用任何 Track（三個 webhook 皆未設定）時，儀表板與課綱視圖的呈現是否已定義（而非任其顯示錯誤或空白崩潰）？[Gap] — ✅ 2026-08-05 已補：Edge Cases 新增條目，明訂空 Track 區塊 + 課綱視圖仍完整呈現
- [x] CHK003 全文閱讀頁的「永久解鎖」（FR-006）與 feed 的「30 筆滾動窗」（FR-016）兩者範圍不同步一事，是否已被顯式記載為預期行為？[Gap] — ✅ 2026-08-05 已補：Edge Cases 新增條目，明訂此為正常行為、MUST NOT 誤判為資料遺失
- [x] CHK004 無障礙（a11y）規範與行動裝置支援程度是否有明確的範圍排除聲明？[Gap] — ✅ 2026-08-05 已補：Assumptions 新增條目，明訂僅要求基本語意化 HTML，正式 WCAG 驗證與行動裝置等價呈現不在範圍內
- [x] CHK005 GitHub Pages 免費層的部署頻率／站台大小限制是否已評估並記錄為可接受風險（而非未提及的潛在風險）？[Gap] — ✅ 2026-08-05 已補：Assumptions 新增條目，記錄現行規模下的餘裕評估與「MUST NOT 預先設計配額監控」的裁決
- [x] CHK006 三個 User Story 是否各自涵蓋正向路徑與至少一個非正向（未開始／完課／直接訪問／滾動修剪）情境？[Completeness] — US1 三個 Scenario（正常/尚未開始/已完課）、US2 兩個（點擊進入/直接訪問）、US3 三個（訂閱/滾動修剪/非 concept 無新項目），皆已覆蓋 [Spec §User Scenarios]
- [x] CHK007 FR-006 的措辭是否存在不必要的重複片語，影響閱讀明確性？[Clarity] — ✅ 2026-08-05 已修順：「至少已被三個 Track 其中一個」→「已被三個 Track 中至少一個」

## 需求明確性（Requirement Clarity）

- [x] CHK008 FR-012「每日推播流程成功執行後」是否清楚定義了「成功」是否要求**全部** Track 皆推播成功，還是僅要求 `state` 分支 commit 步驟已執行？[Ambiguity] — ✅ 2026-08-05 已釐清：FR-012 改為「`state` 分支 commit 步驟執行完畢後」，並明訂 MUST NOT 要求全部 Track 皆成功，與憲章 XV 失敗隔離一致
- [x] CHK009 FR-017 的通知顏色是否以可客觀判定的方式定義，而非僅「有別於核心紅色告警」這種排除式描述（無法排除它與完課通知的綠色相同）？[Clarity] — ✅ 2026-08-05 已補：改為「單一固定、可客觀判定的顏色，MUST 與紅色告警、綠色完課通知皆不同」
- [x] CHK010 SC-001「同一畫面」是否定義了適用的視窗／裝置範圍，使其可被客觀驗證？[Measurability] — ✅ 2026-08-05 已補：SC-001 改為「以桌面瀏覽器視窗」為準，並註記不對行動裝置做同等保證
- [x] CHK011 FR-014「發佈階段 MUST 為完全 stateless」是否清楚列舉了被排除的機制，避免讀者誤以為只是措辭調整？[Clarity, Spec §FR-014] — 已明列「MUST NOT 提供文章版本號、首次發布日期、修訂異動摘要或內容修訂偵測」，範圍清楚
- [x] CHK012 FR-016 的 feed 上限數值（30）是否有明確依據來源，而非憑空給一個數字？[Clarity, Spec §FR-016] — 已明訂與 `state.json` 的 `history` 上限同源，並交代此耦合關係

## 需求一致性（Requirement Consistency）

- [x] CHK013 `## Clarifications` 中已失效的 Q1／Q2 歷史問答，其標註是否仍與目前 FR-014～FR-017 的正式文字一致，無殘留矛盾陳述？[Consistency] — ✅ 2026-08-05 本次覆核重新確認：全文搜尋 `registry`／`版號`／`updatedAt`／`異動摘要`／`首次發布` 僅出現於「決策軌跡」與「明文聲明不提供」兩種語境，無殘留矛盾
- [x] CHK014 FR-008 對全站 feed 範疇（「涵蓋依 FR-006 已解鎖的 Concept」）與 Assumptions 對全站 feed 組成方式（三軌 `history` 聯集）的描述，兩者是否一致（皆受 FR-016 同一上限約束）？[Consistency, Spec §FR-008 vs Assumptions] — 一致：FR-008 明文「並受 FR-016 的滾動上限約束」，與 Assumptions 描述的組裝方式同源同限
- [x] CHK015 FR-006 的解鎖判定（一旦解鎖即永久）與 FR-016 的 feed 上限（僅覆蓋最近 30 筆）之間的範圍差異，是否已被顯式承認為兩個獨立性質而非隱含矛盾？[Consistency] — ✅ 見 CHK003，已於 Edge Cases 明文承認並排除誤判空間
- [x] CHK016 US3 Acceptance Scenario 3（非 concept 類 Session 不產生新 feed 項目）是否與 FR-015 的機制描述（「只收錄帶 `conceptId` 的項目」）一致？[Consistency, Spec §US3 vs FR-015] — 一致，兩處對「非 concept 類 Session 無 feed 項目」的描述互相呼應

## 驗收準則可量測性（Acceptance Criteria Quality）

- [x] CHK017 SC-007 的「byte-identical」與「commit 數為 0」是否構成可被自動化測試直接斷言的判準？[Measurability, Spec §SC-007] — 是，兩者皆為可程式化比對的具體條件（檔案逐 byte diff、commit count 統計）
- [x] CHK018 SC-004「100% 正常完成」是否明確為單次執行事件的完整性宣稱，而非需要額外定義分母的統計比例？[Measurability, Spec §SC-004] — 是單次執行的完整性斷言（該次推播與該次 commit 是否受影響），無分母歧義
- [x] CHK019 SC-006「節奏一致」是否有可操作的判定依據，而非主觀描述？[Measurability, Spec §SC-006 vs FR-015] — 有：FR-015 已將「節奏」精確定義為「該 Track `history` 中帶 `conceptId` 的項目」，SC-006 可據此直接驗證
- [x] CHK020 SC-001（本次已修訂為桌面視窗前提）修訂後是否仍可被客觀驗證？[Measurability] — ✅ 見 CHK010，已補上視窗範圍限定詞，成為可驗證的視覺回歸檢查項

## 情境覆蓋（Scenario Coverage）

- [x] CHK021 是否涵蓋「Track 剛啟用、尚無推播記錄」情境？[Coverage, Spec §US1 Scenario 2] — 已涵蓋
- [x] CHK022 是否涵蓋「Track 已完課」情境？[Coverage, Spec §US1 Scenario 3] — 已涵蓋
- [x] CHK023 是否涵蓋「直接持有全文網址、不經儀表板導覽」情境？[Coverage, Spec §US2 Scenario 2] — 已涵蓋
- [x] CHK024 是否涵蓋「feed 因項目上限被滾動修剪」情境？[Coverage, Spec §US3 Scenario 2] — 已涵蓋
- [x] CHK025 是否涵蓋「完全無 Track 啟用」的零狀態情境？[Coverage] — ✅ 見 CHK002，已補入 Edge Cases

## 邊界情境覆蓋（Edge Case Coverage）

- [x] CHK026 repo 由 public 轉 private 後，既有已發佈頁面的去留責任邊界是否明確？[Edge Case, Spec §Edge Cases] — 已明確：僅保證「不再更新」，下線與否非本 Feature 控制範圍
- [x] CHK027 Concept 只完成 Skeleton、尚未展開全文的情境是否有覆蓋且不產生 404？[Edge Case, Spec §Edge Cases] — 已涵蓋，並論證此狀態必然等同「尚未解鎖」
- [x] CHK028 Pages 發佈失敗的重試策略是否已明訂（避免與下次執行的自動補回產生歧義）？[Edge Case, Spec §Edge Cases] — 已明訂「不重試，下次執行自動補回」
- [x] CHK029 課表重生成但受影響 Session 尚未被推播時，對 feed 的影響是否覆蓋？[Edge Case, Spec §Edge Cases] — 已涵蓋，明訂需等實際推播後才出現
- [x] CHK030 人工調整 `currentSessionIndex` 跳過 Session 時，對 feed／全文頁的不同步影響是否覆蓋？[Edge Case, Spec §Edge Cases] — 已涵蓋
- [x] CHK031 已發布文章被修訂但不留任何修訂痕跡的行為，是否已明確聲明以避免使用者誤期待版本記錄？[Edge Case, Spec §Edge Cases] — 已明確聲明「訂閱端不會得知該篇已被修訂」

## 非功能需求（Non-Functional Requirements）

- [x] CHK032 是否有明確的資料一致性／可重現性要求（byte-identical、commit 數）？[NFR, Spec §SC-007] — 已涵蓋
- [x] CHK033 是否有明確的無障礙範圍聲明？[NFR] — ✅ 見 CHK004，已補入 Assumptions
- [x] CHK034 是否有明確的平台配額／限制評估？[NFR] — ✅ 見 CHK005，已補入 Assumptions
- [x] CHK035 是否有明確的「免登入／免授權」要求並覆蓋全部公開頁面類型（儀表板 + 全文閱讀頁）？[NFR, Spec §FR-007, §FR-013] — 已涵蓋兩種頁面類型

## 依賴與假設（Dependencies & Assumptions）

- [x] CHK036 對 `state.json` 既有結構（`history`／`completedConceptIds`／`completedAt`）的依賴是否明確聲明為唯讀消費、不修改其資料結構？[Dependency, Spec §Key Entities] — 已明確聲明「本 Feature 只負責視覺化呈現與導出 feed，MUST NOT 建立、修改或擴充其資料結構」
- [x] CHK037 訂閱格式（RSS 2.0／Atom）延後至 `/speckit-plan` 定案的理由是否交代清楚？[Dependency, Spec §Assumptions] — 已交代：FR-014 移除修訂偵測後，格式原生區分 published/updated 的理由已消失，交由技術選型階段定案
- [x] CHK038 對 GitHub Pages 作為託管平台可用性的假設（無需另建伺服器）是否有明確依據？[Assumption] — 承接 `docs/spec.md` §25「Future Roadmap」既有的產品承諾脈絡，FR-013「公開網站」用語與之一致

## 歧義與衝突（Ambiguities & Conflicts）

- [x] CHK039 FR-004「所屬 Concept」用語是否曾與非 concept 類 Session 的呈現產生解讀衝突？[Ambiguity] — ✅ 見 CHK001，已於 FR-004 內消除此歧義
- [x] CHK040 「進度最快 Track」（FR-006 的解鎖判定說明）與「`history` 聯集」（feed 的資料來源）兩種相近但不同的計算方式，spec 本身是否誤將兩者混為一談？[Ambiguity] — 未混淆：spec 僅描述解鎖的**行為**（哪些 Concept 有全文頁），不指定計算所用的資料欄位；FR-016 另外明確界定 feed 的資料來源與上限，兩者在 spec 層級各自獨立、互不覆蓋，計算依據的等價證明適當地留給 `/speckit-plan`（見 plan.md research R8）

## Notes

- 勾選規則：`[x]` 表示該項需求敘述**已確認完整/明確/一致**；本輪發現的 7 處缺口（CHK001～CHK005、CHK007、CHK008～CHK010）已直接修訂 [spec.md](../spec.md) 對應段落後勾選，未留待下一輪。
- 本表檢查的是**需求文字**本身，不是程式行為；程式行為的驗證屬 `tests/unit/pages-*.test.ts`（見 [plan.md](../plan.md) 測試落點對照）。
- **2026-08-05 全數結清**：本表 40 項全部通過，其中 9 項（CHK001～CHK005、CHK007、CHK008～CHK010）為本輪新發現並當場修訂的缺口，其餘 31 項為覆核既有需求文字後確認無缺陷。
- 本表產生於 `/speckit-plan` 完成之後——部分項目（CHK038、CHK040）的判定同時參照了 [plan.md](../plan.md)／[research.md](../research.md) 以確認「spec 層級的行為描述」與「plan 層級的實作依據」之間沒有錯位；此非違反「checklist 只測需求文字」的原則，而是驗證兩份文件的分工邊界本身清楚。
