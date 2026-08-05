# Feature Specification: Pages Publish — GitHub Pages 儀表板、全文閱讀與 RSS 訂閱

**Feature Branch**: `009-pages-publish`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "feature 009-pages-publish"

## Clarifications

### Session 2026-08-05

- Q: 文章版本記錄（首次發布日期／版號、目前版號、`updatedAt`、異動摘要）要持久化在哪裡？ → A: `state` 分支新增獨立檔案（例：`pages-registry.json`），核心 state commit 之後獨立提交（**本場次第 3 題已決議整組移除版本記錄機制，此答案不再適用**）
- Q: 「異動摘要」由誰產生（每日 runtime 禁用 LLM）？ → A: 由發佈階段比對固定區塊層級指紋決定性產生（**同上，隨版本記錄機制一併移除，此答案不再適用**）
- Q: 版本記錄機制（首次發布日期／版號、修訂版號遞增、異動摘要、`updatedAt`）要保留還是移除？ → A: 整組移除——發佈階段改為完全 stateless、不保留任何跨執行記憶、不新增 `state` 分支檔案、不產生第二個 commit；feed 項目一律由 `state.json` 既有的 per-Track `history` 導出，項目識別碼採 `conceptId`
- Q: Pages 發佈階段失敗或被跳過時，維運者要如何得知？ → A: 以有別於紅色告警的顏色（琥珀色）發一則 Discord 通知至第一個已設定的頻道，明示「Pages 未更新、核心推播正常」，且 MUST NOT 影響 workflow 的 exit code；FR-001 的 private 自動停用不發通知
- Q: FR-005 的課綱順序中，尚未解鎖的 Concept 要如何呈現？ → A: 列出全部 Concept，已解鎖者為可點連結、未解鎖者僅顯示標題與「未解鎖」標示，且 MUST NOT 輸出任何指向不存在頁面的連結、MUST NOT 為其生成佔位頁

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 造訪儀表板查看三軌目前進度與今日課程 (Priority: P1)

學習者（本專案的課程訂閱者）想知道自己在 Foundation / InterviewReady / InterviewMastery 三個
Track 各自目前推進到哪一課、今天早上收到的是哪一則課程，而不需要往回翻 Discord 歷史訊息。他造訪一個
公開網址，立即看到三個 Track 各自的目前進度（在整體課綱順序中的位置）與今日課程標題。

**Why this priority**：這是本 Feature 存在的核心價值——把「唯一權威狀態」`state.json` 轉譯成人類可讀的
公開頁面。沒有這一步，其餘功能（全文閱讀、RSS）都無處連結、無意義。

**Independent Test**：在 state 分支已有至少一個 Track 的進度記錄的情況下觸發一次發佈，可獨立驗證公開頁面
是否正確反映該 Track 的 `currentSessionIndex` 與最近一次推播內容，不依賴全文閱讀頁或 RSS 是否完成。

**Acceptance Scenarios**:

1. **Given** 三個 Track 皆已啟用且各自有推播歷史，**When** 學習者造訪儀表板網址，**Then** 頁面同時列出
   三個 Track 各自的目前進度（第幾課／對應 Concept）與今日課程標題，且與 state 分支當下的資料一致。
2. **Given** 某個 Track 剛啟用、尚未有任何成功推播記錄，**When** 學習者造訪儀表板，**Then** 該 Track 顯示
   「尚未開始」而非顯示錯誤或空白造成的頁面錯亂。
3. **Given** 某個 Track 已完課（課表走完、`completedAt` 已記錄），**When** 學習者造訪儀表板，**Then** 該
   Track 顯示明確的「已完課」狀態，而非停留在誤導性的「今日課程」欄位。

---

### User Story 2 - 從今日課程進入完整文章全文閱讀 (Priority: P2)

Discord 推播的 Digest 因 6,000 字元總長限制只呈現精華摘要。學習者想看完整的教學文章全文（含更完整的
說明、範例與延伸內容），從儀表板的今日課程連結點進去，看到該 Concept 對應的完整 Article。

**Why this priority**：這是「Pages 補足 Discord 不推全文」的主要使用情境，直接對應 spec §25 訂下的產品
承諾；價值僅次於「能先看到進度」本身。

**Independent Test**：任選一個已產生 Full Article 的 Concept，直接訪問其全文閱讀頁網址，驗證頁面呈現的
內容包含 Digest 之外的完整正文區塊，且不需要先經過儀表板導覽。

**Acceptance Scenarios**:

1. **Given** 學習者正在瀏覽儀表板的今日課程區塊，**When** 點擊「閱讀全文」，**Then** 一次點擊內進入對應
   Concept 的全文閱讀頁，且頁面內容為完整 Article（而非 Discord Digest 摘要版）。
2. **Given** 學習者直接持有某篇全文閱讀頁的網址（例如從先前分享取得），**When** 開啟該網址，**Then** 頁面
   正常呈現，不需要額外登入或授權。

---

### User Story 3 - 透過 RSS/Atom 訂閱掌握新課程發佈 (Priority: P3)

想被動追蹤課程更新的學習者（或有興趣的旁觀者）用慣用的 RSS reader 訂閱本專案的更新摘要。訂閱者可以選擇
訂閱「全站」或「特定 Track」：訂閱特定 Track 時，reader 只會依該 Track 自己的實際推播節奏出現新項目，
不會因為其他 Track 進度較快而提前看到還沒輪到自己 Track 的內容。每次對應範圍內有新課程成功推播並完成
Pages 發佈後，reader 會出現一筆新項目，可直接點進全文閱讀頁。

**Why this priority**：屬於加值的被動通知管道，建立在儀表板與全文閱讀頁都已存在的前提上，價值低於前兩者
但完成度較低的成本也較低（格式標準化）。

**Independent Test**：訂閱 feed 網址後比對其中項目數量與識別碼，可獨立驗證「新增項目」與「識別碼穩定不
重複」兩件事，不需要先驗證儀表板版面。

**Acceptance Scenarios**:

1. **Given** 學習者已訂閱某個 Track 專屬的 feed，**When** 該 Track 有新課程成功推播並完成 Pages 發佈，
   **Then** reader 端出現對應的新項目，可點擊前往該課程的全文閱讀頁；即使其他 Track 進度更快、對應
   Concept 頁面已存在，該項目也 MUST NOT 提前出現在這個 Track 專屬 feed 中。
2. **Given** feed 因項目數量上限被滾動修剪（移除較舊項目），**When** reader 端下一次抓取 feed，**Then**
   既有仍保留的項目識別碼不變、不會被誤判為新項目而重複顯示。
3. **Given** 某 Track 當日推播的是不引入新 Concept 的 Session（review／practice／challenge），
   **When** reader 端下一次抓取該 Track 的 feed，**Then** 不會出現新項目，且既有項目不受影響——
   feed 只在有新的全文閱讀頁可連結時才新增項目。

### Edge Cases

- Repository 從 public 轉為 private 後，下一次發佈流程依 FR-001 自動跳過。本 Feature 的責任邊界**僅止於
  「不再更新」**：先前已發佈的頁面是否仍可存取，取決於平台對私有 repo 的 Pages 站台處置，不在本 Feature
  的控制範圍，系統 MUST NOT 為此另行實作下線或清除機制。
- 某 Concept 只完成 Skeleton（骨架）而尚未跑過 Stage 2 全文展開時：此狀態的 Concept 必然尚未被任何 Track
  推播過（否則 Lesson Compiler 會在推播當下即因讀不到 Article 而失敗），因此依 FR-006 本就不會建立閱讀頁，
  並依 FR-005a 於課綱順序中以「未解鎖」純文字呈現，不會產生指向 404 的連結。
- Pages 發佈階段本身失敗（例如 GitHub 服務暫時性錯誤）時，依 FR-017 發出琥珀色通知並讓該次執行的 exit
  code 維持核心結果；此失敗**不重試**（下一次每日執行本就會以最新 state 重新產生全部產物，等同自動補回）。
- 課表因內容調整重新生成（例如 §8 決議的跳過無題槽位）造成 byte-diff 變動、但受影響 Session 尚未被任何
  Track 實際推播過：依 FR-015，feed 項目一律導出自 `history`，未推播即無 `history` 項目，因此不會產生
  對應的 feed 項目；該 Session 要等到真正推播後才會出現。
- 已公開的 Concept 全文若因 Skeleton／Curriculum 修訂而重新生成內容，發佈階段既不保留版本記憶（FR-014），
  即以最新內容原樣重新發佈、不遞增版號、不在 feed 產生任何變化；訂閱端不會得知該篇已被修訂。
- 人工編輯 `state.json` 直接調高某 Track 的 `currentSessionIndex`（§19 認可的進度調整方式）時，被跳過的
  Session 不會寫入 `history`，因此其 Concept 雖依 FR-006 建立了全文閱讀頁，卻不會出現在任何 feed 中。
- 全文閱讀頁的解鎖（FR-006）一旦達成即永久保留，不受 `history` 滾動上限影響；但 feed 的可見範圍
  （FR-016）僅涵蓋最近 30 筆。故一個已解鎖多時的 Concept，可能不再出現於任三份 feed 中（其對應
  `history` 項目已滾動移除），此為兩者刻意不同步的正常行為，MUST NOT 被誤判為資料遺失或 bug。
- 若目前完全未啟用任何 Track（三個 webhook 皆未設定），儀表板 MUST 呈現空的 Track 進度區塊而非顯示
  錯誤或崩潰；課綱順序視圖（FR-005／FR-005a）MUST 依然完整呈現——解鎖狀態依 FR-006 取決於 `state.json`
  中三個已知 Track 的完整歷史紀錄，不受「目前是否啟用」影響。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 在發佈前偵測 repository 的公開／私有狀態；當 repository 為 private 時 MUST 自動
  跳過本 Feature 全部發佈行為（儀表板、全文閱讀頁、feed），且 MUST NOT 因此判定為錯誤或觸發告警。
- **FR-002**: 系統 MUST 只依據已 commit 的既有資料（`state` 分支的 state.json、凍結課表、凍結 Article）
  重新產生一份可公開瀏覽的儀表板首頁，MUST NOT 在產生過程中呼叫任何 LLM API。
- **FR-003**: 儀表板 MUST 呈現每個已啟用 Track 目前所在的課程位置（於整體課綱順序中的進度），且此進度
  MUST 與 state 分支當下記錄的 `currentSessionIndex` 一致。
- **FR-004**: 儀表板 MUST 呈現每個已啟用 Track 的今日課程（最近一次成功推播的 Session）標題與所屬
  Concept；尚未有推播記錄的 Track MUST 明確標示「尚未開始」，已完課的 Track MUST 明確標示「已完課」，
  兩者皆 MUST NOT 以空白或誤導性文字呈現。當最近一次推播的 Session **不引入新 Concept**（review／
  practice／challenge 類；`rest` 類自 F8 移除 rest 槽後現行課表已不再產生，惟型別仍保留）時，MUST
  呈現該 Session 類型的固定標籤（例如「複習週」），MUST NOT 虛構或挪用其他 Concept 冒充「所屬
  Concept」。
- **FR-005**: 系統 MUST 呈現課綱順序（Curriculum 的固定順序），並在其中標示各已啟用 Track 目前的進度
  位置，讓訪客理解「已學過的部分」與「尚未推進到的部分」的相對關係。
- **FR-005a**: 課綱順序 MUST 完整列出全部 Concept（含尚未解鎖者）：依 FR-006 已解鎖的 Concept MUST 呈現
  為指向其全文閱讀頁的可點連結；尚未解鎖的 Concept MUST 僅顯示標題並明確標示為「未解鎖」，且 MUST NOT
  輸出任何指向不存在頁面的連結、MUST NOT 為其產生佔位頁面。此規則同樣適用於儀表板上任何引用 Concept 的
  位置，公開網站 MUST NOT 存在任何指向 404 的內部連結。
- **FR-006**: 系統 MUST 只為「已被三個 Track 中至少一個實際推播過」的 Concept 建立全文閱讀頁——以三個
  Track 中**進度最快者**為準（例如某 Track 已推進到第 50 課，即使其他 Track 仍在第 10 課，前 50 課全文
  仍一併建立閱讀頁），呈現該 Concept 的完整 Article 內容（不受 Discord 精簡版限制的完整版）；尚未被任何
  Track 推播過的 Concept MUST NOT 建立對應的全文閱讀頁。
- **FR-007**: 全文閱讀頁 MUST 可從儀表板的今日課程區塊以連結直接前往，且 MUST NOT 要求登入或額外授權。
- **FR-008**: 系統 MUST 產生訂閱摘要（feed），且訂閱者 MUST 能選擇訂閱「全站」（涵蓋依 FR-006 已解鎖的
  Concept，並受 FR-016 的滾動上限約束）或「特定 Track」；訂閱特定 Track 的 feed MUST 只依該 Track 自己
  實際推播的順序與節奏出現新項目——即便其他 Track 進度更快、對應 Concept 頁面已依 FR-006 存在，也
  MUST NOT 提前出現在該 Track 專屬 feed 中。
- **FR-009**: Feed 中每一筆項目 MUST 具備穩定且唯一的識別碼，使同一篇內容在後續重新產生 feed 時 MUST NOT
  被訂閱端判定為新項目而重複出現。
- **FR-010**: Feed MUST 有上限的滾動保留機制（避免項目無限增長）；被移除的舊項目 MUST NOT 導致既有訂閱
  端出現錯誤、空白項目，或使仍保留項目的識別碼一併改變。
- **FR-011**: 本 Feature 的建置與發佈 MUST 作為每日推播流程中完全隔離的末段執行；此段的任何失敗或跳過
  （含 FR-001 的自動停用）MUST NOT 導致 Discord 每日推播失敗、MUST NOT 阻擋或延遲 `state` 分支的 commit。
- **FR-012**: 儀表板與全文閱讀頁 MUST 在每次每日推播流程的 `state` 分支 commit 步驟執行完畢後自動重新
  產生並發佈，使呈現內容與最新 state 一致，不需要另外的人工觸發。此處「執行完畢」MUST NOT 要求該次
  執行的**全部** Track 皆推播成功——依憲章 XV 的失敗隔離，即使部分 Track 失敗，其餘 Track 已 commit
  的進度仍 MUST 被納入本次重新產生（呼應 FR-002：僅依已 commit 的資料決定內容）。
- **FR-013**: 公開網站（儀表板與全文閱讀頁）MUST 可透過穩定網址直接瀏覽，MUST NOT 要求登入或額外授權。
- **FR-014**: 發佈階段 MUST 為完全 stateless：其產物 MUST 僅由當次執行時既有的 `state.json`、凍結課表與
  凍結 Article 決定性導出，MUST NOT 保留任何跨執行的記憶、MUST NOT 於 `state` 分支（或任何分支）新增或
  寫入專屬檔案、MUST NOT 產生第二個 commit。因此系統 MUST NOT 提供文章版本號、首次發布日期、修訂異動
  摘要或內容修訂偵測——文章內容若被重新生成，發佈階段 MUST 以最新內容原樣重新發佈，不遞增版號、不在
  feed 產生任何差異。
- **FR-015**: Feed 項目 MUST 由各 Track `state.json` 中既有的 `history` 導出，且 MUST 只收錄帶有
  `conceptId` 的項目（即引入新 Concept、因而有對應全文閱讀頁可連結的 Session）；不引入新 Concept 的
  Session MUST NOT 產生 feed 項目。項目的時間戳 MUST 取自對應 `history` 項目的 `pushedAt`。
- **FR-016**: FR-010 的滾動保留上限 MUST 與 `state.json` 的 `history` 上限（現為 30 筆／Track）一致，
  且 MUST NOT 另行實作獨立的保留機制；per-Track feed 的可回溯範圍因此受限於該上限，超出範圍的較早項目
  MUST 被視為已滾動移除（符合 FR-010），MUST NOT 嘗試由其他來源補建。
- **FR-017**: 發佈階段失敗時，系統 MUST 對第一個已設定的 Discord 頻道發出一則通知，且該通知 MUST 使用
  **單一固定、可客觀判定的顏色**，此顏色 MUST 與既有核心紅色告警、既有完課通知綠色皆不同，使維運者不會將
  其誤讀為每日推播失敗或完課；通知內文 MUST 明示「Pages 未更新、當日核心推播與 state 不受影響」。此通知
  MUST NOT 改變當次 workflow 的 exit code（延續 FR-011），且發佈失敗 MUST NOT 於當次執行內重試——下一次
  每日執行會以最新 state 重新產生全部產物。FR-001 的 private 自動停用 MUST NOT 發出此通知（屬預期狀態而
  非異常）。

### Key Entities

- **儀表板首頁（Dashboard）**：由 state 與課表資料重新渲染而成的公開靜態頁面，呈現課綱順序、各已啟用
  Track 的目前進度與今日課程摘要。
- **全文閱讀頁（Article Reading Page）**：對應單一 Concept 的完整 Article 之公開呈現版本，是 Discord
  Digest 之外、不受字數限制的完整內容；只在該 Concept 已依 FR-006 解鎖（至少被一個 Track 推播過）後才
  存在。
- **訂閱摘要（Feed）**：以標準訂閱格式列出已發佈內容的清單，可分為「全站」與「特定 Track」兩種範疇；每筆
  項目具備穩定識別碼（採 `conceptId`）供訂閱端去重判斷，時間戳取自該 Track 的實際推播時間，滾動保留上限
  沿用 `history` 上限。Feed 為每次發佈時由 `history` 重新導出的衍生產物，不另存任何狀態。
- **Track 進度**：既有實體，來自 `state` 分支的 `state.json`（§19），含各 Track 的 `currentSessionIndex`、
  `completedAt` 與 `history`（`{ sessionIndex, pushedAt, conceptId? }`，上限 30 筆）；本 Feature 只負責
  將其視覺化呈現與導出 feed，MUST NOT 建立、修改或擴充其資料結構。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 訪客以桌面瀏覽器視窗造訪儀表板首頁後，無需捲動或跳轉頁面，即可在同一畫面看到三個已啟用
  Track 各自的目前進度與今日課程標題（本準則不對行動裝置小螢幕做同等保證，見 Assumptions）。
- **SC-002**: 訪客從今日課程區塊，1 次點擊內即可進入對應 Concept 的全文閱讀頁，並看到完整文章內容。
- **SC-003**: 訂閱摘要的使用者在課表因內容調整重新產生（項目集合有增減）後，既有仍保留的項目不會在
  reader 端被重複標示為新項目。
- **SC-004**: 當本 Feature 的發佈流程失敗，或因 repository 轉為 private 而被自動跳過時，同一次執行的
  Discord 每日推播與 `state` 分支 commit 仍 100% 正常完成，不受影響、不延遲。
- **SC-005**: 每日推播流程成功執行後，公開儀表板在同一次工作流程執行完成的同時即反映最新進度，不需要另一
  次人工觸發或等待下一個排程週期。
- **SC-006**: 訂閱特定 Track feed 的使用者，收到的新項目節奏與該 Track 實際的每日推播節奏一致，不會因為
  其他 Track 進度較快而提前收到尚未輪到自己 Track 的內容。
- **SC-007**: 連續兩次執行之間若 `state.json`、課表與 Article 內容皆未變更，重新產生的儀表板、全文閱讀頁
  與 feed MUST 為完全相同的產物（byte-identical），且該次執行對 `state` 分支的 commit 數為 0。

## Assumptions

- 本 Feature 僅在 repository 為 public 時對外服務；repository 為 private 時功能自動停用，且此停用狀態
  MUST NOT 被視為錯誤（依 spec §25「限 public repo」）。
- 訂閱摘要採業界通用格式（RSS 2.0 或 Atom 皆可），以確保主流 reader 皆可正常訂閱解析；因 FR-014 已移除
  修訂偵測需求，項目只需單一時間戳（推播時間），不需要格式原生區分「首次發布」與「最後修訂」，實際格式由
  後續 `/speckit-plan` 技術選型階段定案。
- 本 Feature 的建置與發佈是既有每日推播工作流程新增的附加末段，而非獨立排程或獨立 workflow；沿用既有
  「可選階段失敗 MUST NOT 中斷核心推播」的失敗隔離原則（§4-15、§9.2）。
- 公開頁面的更新頻率與每日推播頻率一致（每次核心推播流程執行完成後更新一次），不支援 sub-daily 即時更新。
- 本專案為單一使用者（課程訂閱者本人）多 Track 情境，儀表板呈現的三個 Track 進度不涉及個資或存取權限
  控管；不需要帳號系統或多使用者區隔。
- 「課綱順序」的呈現方式在本 Feature 範圍內為非互動式（例如帶進度標示的順序列表），互動式知識圖譜視覺化
  屬於 spec §25 另列的更遠期項目，不在本 Feature 範圍內。
- 「特定 Track」訂閱以 Concept 在該 Track 的推播順序決定 feed 項目出現的先後，即便同一 Concept 已因
  FR-006（進度最快 Track 為準）建立了全文閱讀頁，該 Concept 仍要等到訂閱者所選 Track 自己實際推播到它
  時，才會出現在該 Track 專屬 feed 中。
- 本專案為單一使用者情境，且 `articles/**` 依憲章 XIII 為凍結產物、重新生成屬低頻的刻意 build-time 行為，
  因此「文章被修訂過幾次／哪天首次公開」的閱讀價值不足以支撐一份跨執行的版本記錄；發佈階段維持 stateless
  是本 Feature 刻意的範圍收斂（FR-014），而非疏漏。
- 全站 feed 的項目集合由三個 Track 的 `history` 聯集後依 `conceptId` 去重、依最早的 `pushedAt` 排序取得，
  同樣受 FR-016 的滾動上限約束；同一 Concept 在全站 feed 與各 Track feed 中使用相同的識別碼。
- 本 Feature 的公開頁面 MUST 提供基本可讀的語意化 HTML（標題階層、連結文字有意義），但正式的無障礙
  規範（WCAG 對比度／螢幕閱讀器逐項驗證等）不在本 Feature 範圍內——單一使用者情境下，可讀性優先於
  正式合規驗證；行動裝置版面呈現同樣不保證與桌面等價（呼應 SC-001 的桌面視窗前提）。
- GitHub Pages 免費層的站台大小與部署頻率限制（現行每次部署 1GB、每小時 10 次部署）在本專案現有規模
  （200 餘篇文字為主的靜態頁面、每日至多 2 次部署嘗試）下有充分餘裕，不視為本 Feature 的風險項；
  MUST NOT 為此預先設計任何配額監控或降級機制。
