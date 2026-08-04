# Feature Specification: Pages Publish — GitHub Pages 儀表板、全文閱讀與 RSS 訂閱

**Feature Branch**: `009-pages-publish`

**Created**: 2026-08-04

**Status**: Draft

**Input**: User description: "feature 009-pages-publish"

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
3. **Given** 某篇已發佈文章的內容被修訂（版號遞增），**When** reader 端下一次抓取 feed，**Then** 該項目
   的識別碼維持不變、但更新時間戳反映最新修訂時間，讓支援「更新偵測」的 reader 能辨識內容有變動，而不是
   被當成一筆全新項目。

### Edge Cases

- Repository 從 public 轉為 private 後，下一次發佈流程 MUST 自動跳過，那麼**先前已發佈**的公開頁面是繼續
  留在網路上（GitHub Pages 服務本身仍可能持續服務舊快照），還是本 Feature 不處理下線、只保證不再更新？
- 某 Concept 只完成 Skeleton（骨架）而尚未跑過 Stage 2 全文展開時，其全文閱讀頁應如何呈現（不應該連結到
  一篇不存在的全文，也不應該讓儀表板連結指向 404）？
- Pages 發佈階段本身失敗（例如 GitHub 服務暫時性錯誤）時，該次是否重試，以及是否讓當次 workflow 的整體
  結束碼被判定為非零（依 §4-15，可選階段失敗 MUST NOT 中斷核心推播，但需明確：是否仍需要某種非紅色告警
  讓維運者知道 Pages 沒更新成功）？
- 課表因內容調整重新生成（例如 §8 決議的跳過無題槽位）造成 byte-diff 變動、但受影響 Session 尚未被任何
  Track 實際推播過，此時 feed 是否應該產生對應項目，還是等到真正推播後才出現？
- 已公開的 Concept 全文若因 Skeleton／Curriculum 修訂而重新生成內容，此時「首次發布版號」與「已解鎖」
  狀態不變，但需要遞增版號、記錄異動摘要與 `updatedAt`；若該次修訂剛好與另一個尚未推播過此 Concept 的
  Track 之後才推播的時間點重疊，版本記錄應如何呈現才不會造成「先修訂、後首次公開」的時序混淆？

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
  兩者皆 MUST NOT 以空白或誤導性文字呈現。
- **FR-005**: 系統 MUST 呈現課綱順序（Curriculum 的固定順序），並在其中標示各已啟用 Track 目前的進度
  位置，讓訪客理解「已學過的部分」與「尚未推進到的部分」的相對關係。
- **FR-006**: 系統 MUST 只為「至少已被三個 Track 其中一個實際推播過」的 Concept 建立全文閱讀頁——以三個
  Track 中**進度最快者**為準（例如某 Track 已推進到第 50 課，即使其他 Track 仍在第 10 課，前 50 課全文
  仍一併建立閱讀頁），呈現該 Concept 的完整 Article 內容（不受 Discord 精簡版限制的完整版）；尚未被任何
  Track 推播過的 Concept MUST NOT 建立對應的全文閱讀頁。
- **FR-007**: 全文閱讀頁 MUST 可從儀表板的今日課程區塊以連結直接前往，且 MUST NOT 要求登入或額外授權。
- **FR-008**: 系統 MUST 產生訂閱摘要（feed），且訂閱者 MUST 能選擇訂閱「全站」（涵蓋所有依 FR-006 已解鎖
  的 Concept）或「特定 Track」；訂閱特定 Track 的 feed MUST 只依該 Track 自己實際推播的順序與節奏出現
  新項目——即便其他 Track 進度更快、對應 Concept 頁面已依 FR-006 存在，也 MUST NOT 提前出現在該 Track
  專屬 feed 中。
- **FR-009**: Feed 中每一筆項目 MUST 具備穩定且唯一的識別碼，使同一篇內容在後續重新產生 feed 時 MUST NOT
  被訂閱端判定為新項目而重複出現。
- **FR-010**: Feed MUST 有上限的滾動保留機制（避免項目無限增長）；被移除的舊項目 MUST NOT 導致既有訂閱
  端出現錯誤、空白項目，或使仍保留項目的識別碼一併改變。
- **FR-011**: 本 Feature 的建置與發佈 MUST 作為每日推播流程中完全隔離的末段執行；此段的任何失敗或跳過
  （含 FR-001 的自動停用）MUST NOT 導致 Discord 每日推播失敗、MUST NOT 阻擋或延遲 `state` 分支的 commit。
- **FR-012**: 儀表板與全文閱讀頁 MUST 在每次每日推播流程成功執行後自動重新產生並發佈，使呈現內容與最新
  state 一致，不需要另外的人工觸發。
- **FR-013**: 公開網站（儀表板與全文閱讀頁）MUST 可透過穩定網址直接瀏覽，MUST NOT 要求登入或額外授權。
- **FR-014**: 每篇全文閱讀頁 MUST 標示該 Concept 內容**首次依 FR-006 解鎖公開**的日期，並記錄對應的
  首次發布版號。
- **FR-015**: 已公開的 Concept 全文若在首次發布後內容有修訂（例如 Skeleton／Curriculum 調整重新生成），
  系統 MUST 遞增該篇文章的版號、MUST 於頁面上顯示本次修訂的異動摘要、MUST 標示最後修改時間
  （`updatedAt`）；首次發布日期與首次發布版號 MUST 維持不變，不因後續修訂而改寫。
- **FR-016**: Feed 項目 MUST 反映對應文章目前最新的 `updatedAt`，使支援「更新偵測」的訂閱端能在識別碼不
  變的前提下辨識內容已修訂，而不是被誤判為全新項目（延續 FR-009 的識別碼穩定性）。

### Key Entities

- **儀表板首頁（Dashboard）**：由 state 與課表資料重新渲染而成的公開靜態頁面，呈現課綱順序、各已啟用
  Track 的目前進度與今日課程摘要。
- **全文閱讀頁（Article Reading Page）**：對應單一 Concept 的完整 Article 之公開呈現版本，是 Discord
  Digest 之外、不受字數限制的完整內容；只在該 Concept 已依 FR-006 解鎖（至少被一個 Track 推播過）後才
  存在。
- **文章版本記錄（Article Version Record）**：附屬於全文閱讀頁的版本中繼資料，記錄首次發布日期、首次發布
  版號、目前版號、最後修訂時間（`updatedAt`）與修訂異動摘要；首次發布資訊在後續修訂中維持不變。
- **訂閱摘要（Feed）**：以標準訂閱格式列出已發佈內容的清單，可分為「全站」與「特定 Track」兩種範疇；每筆
  項目具備穩定識別碼供訂閱端去重判斷、並攜帶反映最新修訂的更新時間戳，同時有滾動保留上限。
- **Track 進度**：既有實體，來自 `state` 分支的 `state.json`（§19）；本 Feature 只負責將其視覺化呈現，
  不建立或修改其資料結構。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 訪客造訪儀表板首頁後，無需捲動或跳轉頁面，即可在同一畫面看到三個已啟用 Track 各自的目前
  進度與今日課程標題。
- **SC-002**: 訪客從今日課程區塊，1 次點擊內即可進入對應 Concept 的全文閱讀頁，並看到完整文章內容。
- **SC-003**: 訂閱摘要的使用者在課表因內容調整重新產生（項目集合有增減）後，既有仍保留的項目不會在
  reader 端被重複標示為新項目。
- **SC-004**: 當本 Feature 的發佈流程失敗，或因 repository 轉為 private 而被自動跳過時，同一次執行的
  Discord 每日推播與 `state` 分支 commit 仍 100% 正常完成，不受影響、不延遲。
- **SC-005**: 每日推播流程成功執行後，公開儀表板在同一次工作流程執行完成的同時即反映最新進度，不需要另一
  次人工觸發或等待下一個排程週期。
- **SC-006**: 訂閱特定 Track feed 的使用者，收到的新項目節奏與該 Track 實際的每日推播節奏一致，不會因為
  其他 Track 進度較快而提前收到尚未輪到自己 Track 的內容。
- **SC-007**: 訪客在任一全文閱讀頁上，皆能看到該篇內容的首次發布日期；若內容曾被修訂，亦能看到目前版號、
  最後修改時間與異動摘要，無需另外比對原始檔或 git 歷史。

## Assumptions

- 本 Feature 僅在 repository 為 public 時對外服務；repository 為 private 時功能自動停用，且此停用狀態
  MUST NOT 被視為錯誤（依 spec §25「限 public repo」）。
- 訂閱摘要採業界通用格式（RSS 2.0 或 Atom 皆可），以確保主流 reader 皆可正常訂閱解析；由於 FR-016 要求
  區分「首次發布」與「最後修訂」兩個時間點，實作選型 SHOULD 選擇能原生表達兩者差異的格式（例如 Atom 的
  `published` / `updated`），實際格式由後續 `/speckit-plan` 技術選型階段定案。
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
- 版號（FR-014／FR-015）採單調遞增的修訂序號即可滿足「可辨識是否曾修訂、修訂過幾次」的需求，不要求採用
  語意化版本號（semver）等更複雜的版本編碼規則。
