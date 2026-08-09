# Feature Specification: Weekly Quiz — 每週自評測驗（spoiler 自評）

**Feature Branch**: `011-weekly-quiz`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "每週 review Session 附加自評測驗題組，題目與解說掛在 Discord spoiler 中，學習者可自行決定是否查看"

## Clarifications

### Session 2026-08-06

- Q1 評估記錄：原 F10 `010-interactive` 是否應整組棄置，或保留在 Roadmap？  
  A: 棄置並回寫 spec §22.5。F10 名號改用 F11。緣由見本 spec 之「定位與邊界」。
- Q2 小測的呈現與選題：Discord 一則訊息要放幾題、怎麼挑？  
  A: **Discord 每個 Concept 恰 1 題 ＋ GitHub Pages 掛該 Concept 全部題目**（呈現深度見 Q5）。
  Discord 段落長度因而與題庫規模脫鉤，題庫每 Concept 可出更多題而不受字元預算綁架。
  選題 MUST 為決定性（**MUST NOT 隨機**，違反憲章 XI 與 SC-002）：
  `(ordinalOf(conceptId) + trackOffset) mod 該 Concept 題數`
  ——**此式後由 Q9 更正為 `(localOrder + trackOffset) mod 該 Concept 題數`，以 Q9 為準**。
  以 Concept 自身的靜態序位為基底而非 `reviewOrdinal`，係因實測三軌全部 Concept（103 / 134 / 165）
  **皆恰好被 review 涵蓋 1 次、0 個從未被複習**，per-Concept 不存在時間輪替維度，唯一變化軸為 Track。
  三軌 111 個 review Session 實測現況為 204～612 字元，僅用掉自訂上限 5,500 的約 11%。
- Q3 題庫每個 Concept 出幾題？  
  A: **浮動 3～10 題，Gate 只驗下限**。下限 3 由 SC-003 推導（三軌 `trackOffset` 0/1/2 需落在相異題目上）；
  上限 10 僅為產線失控的保險絲，非配額目標。**MUST NOT 訂為固定值**——Concept 的可出題面向多寡差異極大，
  固定值會逼產線對簡單觀念灌水、對複雜觀念砍題。因 Discord 只取 1 題，題數不影響字元預算，
  故無工程理由壓抑上限。
- Q4 如何確保標記的正解真的正確（§4-17 規定不會有人逐題審）？  
  A: **獨立二次作答交叉驗證**。Gate 階段以一次獨立 LLM 呼叫盲答（**MUST NOT 提供標記的正解**），
  答案與題庫標記不一致者 MUST 丟棄重生。全程 build-time，不影響 §4-8 零 LLM runtime。
  緣由：結構性檢查一條都攔不住「正解標錯」，而錯誤知識帶著「正解」的權威感，比沒看還糟。
  **已知限制**：同模型家族可能有相關性錯誤，故非 100% 覆蓋。
- Q5 Discord 的 spoiler 裡放到什麼程度？  
  A: **正解代號 + 一句結論 + 指向 Pages 的連結**（完整詳解留在 Pages）。
  `explanation` MUST 定義為**段落陣列**，第一段 MUST 為 ≤80 字的結論句；Discord 推 `explanation[0]`、
  Pages 推完整陣列——**單一素材來源、決定性擷取**，MUST NOT 生成長短兩版解說。
  緣由：三種寫法實測 216 / 258 / 365 字元，**皆遠低於預算**（最長者仍餘 3,428），故此決策
  MUST NOT 以字元預算為理由。純以學習效果權衡：Testing effect 依賴「回想 → 立即反饋」，
  只給正解代號會讓答錯者當下拿不到解釋，而早晨手機情境下點連結的摩擦使其難以補上；
  一句結論僅多 42 字元即可補回大部分反饋價值。
- Q6 小測段的字元預算 slot？  
  A: 新增兩格具名 slot 至 spec §14.5 與 `checkBudget`：**`quizItem` ≤ 350**（實測 258 + 約 35% 餘裕，
  與既有「每題 ≤350」同值）、**`quiz` 整段 ≤ 2,500**。兩道都設：前者擋單題越寫越長，
  後者擋未來 `rhythm` 調長導致一週涵蓋十幾個 Concept 而失控。超標 MUST 於 CI Gate 失敗，
  **MUST NOT 自動截斷或靜默略過題目**（§14.5、§4-15）。
- Q7 上游內容變動時，已凍結題庫的失效路徑？  
  A: **綁 Concept Skeleton 雜湊**——Skeleton 變更即令該 Concept 全部題目失效重生，完全沿用 F7 既有機制
  （`concepts/**` 為內容的來源真相，`articles/**` 與 `data/quiz-bank.json` 並列為其可重生成產物）。
  **MUST NOT 綁 Article 雜湊**：Article 為 LLM 產物，每次重生雜湊皆變，會造成大量假性失效並白燒免費層額度。
  **MUST NOT 另立只有題庫在用的失效規則**（兩套判斷必然漂移，憲章 IX）。
- Q8 如何避免產線「滿足下限 3 題即停止產出」？  
  A: **讓題數由內容推導，而非由配額決定**（FR-016）。生成 prompt **MUST NOT 提及下限 3**（該數字只存在於
  Gate，是事後把關，回饋為生成目標必然導致 satisficing）；改採兩階段——先列舉該 Concept 值得單獨考核的
  面向（來源為 Skeleton 的 `learningGoal` / `exitCriteria` / Author Hints 與常見誤解），再每個面向出 1 題。
  上限 10 僅以「截斷點」形式呈現。另立 SC-010 為可量測訊號：題數恰為 3 的 Concept 佔比 <40%、
  全庫平均 ≥5，未達標即視為 prompt 設計失敗。
  **MUST NOT** 改以「請盡量出滿 10 題」處理——那會換來灌水湊數。
- Q10 題數 Gate 與交叉驗證的先後順序？重試耗盡仍不足 3 題怎麼辦？  
  A: **題數檢查 MUST 是產線最後一道，作用於交叉驗證後的存活集合**（FR-013a）。若順序顛倒，
  「生成恰 3 題 → 題數合格 → 交叉驗證棄 1 題 → 入庫 2 題」會無人察覺，而 2 題使 `trackOffset`
  取模只剩兩個相異值、SC-003 靜默失效。補生成 MUST 針對被棄題的面向重出並**再次通過交叉驗證**，
  per-Concept 總生成輪數上限 **3 輪**（初次 + 最多 2 次補生成）。
  耗盡後仍 <3 題者：**Gate 具名失敗 + 非零 exit，該 Concept MUST NOT 以不足量入庫**（FR-010a），
  且 Gate MUST 一次列出全部不足量的 Concept。**MUST NOT 降級為「1～2 題也接受」**——那會使 SC-003
  由 MUST 退化為帶例外的 MUST，換來的只是省掉一次人工介入；而 F7 既有 checkpoint resume 使 Gate
  失敗不丟失已完成工作，且此為 build-time 批次而非每日推播，攔下代價低。
- Q11 面向數會不會少於 3，使「每面向 1 題」注定跌破下限？  
  A: **會，且是多數情形——原設計已修正**（FR-016）。實測全 165 個 Concept：`learning_goal` 恆為 1 條、
  `exit_criteria` 為 1～2 條，兩者合計分布 `{2: 80, 3: 85}`，**無一超過 3**。原文「來源為 learningGoal /
  exitCriteria / …，每面向 1 題」會使 48% 的 Concept 只生 2 題而當場失敗、其餘 52% 恰 3 題零餘裕。
  兩處修正：**(a) 面向取材範圍 MUST 涵蓋 Author Hints 的核心觀念 / Pattern 辨識線索 / Thinking /
  Common Mistakes 四段，與 `prerequisite` / `next` 鄰居的區辨點**——納入後合計 <3 的 Concept 為 0 個；
  **(b) 面向數 MUST NOT 成為題數上限**，同一面向 MAY 從不同考核角度（定義辨析 / 反例識別 / 複雜度判斷 /
  適用邊界 / 相似 Pattern 區辨 / 常見誤用）出多題，面向只作為**覆蓋下界**。
  連帶 Gate 的重複判準由「面向重複」改為「**實質等價的題目**」（FR-010）。
- Q12 `TypeScript 重點` / `Python 重點` 是否該納入面向來源？  
  A: **排除，且 MUST NOT 出考核語言 API 用法的題目**（FR-016）。抽樣全部 330 條實測，絕大多數為
  **寫法建議而非觀念**（「Use a list as a stack and pop iteratively」「Leverage built-in max()」
  「Iterate over the Set elements using for...of」），出成題即淪為 API 記誦，與「建立能夠持續解題的
  思維模式」無關；且相當比例為英文，違反 §11 繁中要求。**排除的代價為零**——面向來源數僅由
  min=10 降為 min=8（中位 13 → 11），無任何 Concept 因此跌破下限。
  少數具觀念價值者（如別名／淺拷貝陷阱）本質即 Common Mistakes，已由該段涵蓋。
  附帶發現：Author Hints 為**固定六段結構**（核心觀念 / Pattern 辨識線索 / Thinking / Common Mistakes /
  TypeScript 重點 / Python 重點），165 個 Concept 皆完整具備，故取材來源 MUST 點名段落而非泛稱「每一條」。
- Q13 smoke test（2026-08-06，真實 Gemini 呼叫，`array-memory-layout` 最低配 Concept）的實證修正：  
  A: **三項結論。(1) Q11 的鄰居區辨修法確實有效**——Stage A 於最低配 Concept 產出 **10 個面向**（達上限），
  其中第 7～10 個正是 `next` 鄰居的區辨點，且教學價值最高；無鄰居時僅約 6 個。
  **(2) `quizItem` ≤350 訂太緊，已放寬為 450**（`quiz` 2,500 → 3,000）——**此處的 450 後由 Phase 0 後修訂（2026-08-07）更正為 570**，因該次量測未含 spoiler 內的 Pages 連結（最壞 111 字元），以 FR-014 為準——真實產出單題最長 399、平均 342，
  10 題中 6 題超標，且超標者皆為選項需寫入實質差異的好題（詳見 FR-014）。
  **(3) 新增 `options` MUST NOT 內含代號前綴**（FR-006）——模型會自帶 `A.` 前綴，與 Renderer 疊加後
  輸出 `A. A. …`。原 spec 未規定歸屬，屬真實缺口。
  **盲答一致率 10/10，但 MUST NOT 解讀為正確性已驗證**——同模型家族的一致即 FR-013 已載明的相關性限制；
  其實務意義僅為「誤殺率低、3 輪重生上限充裕」。
  **尚未驗證**：`explanation` 第 2 段是否確實逐一說明其餘三個選項為何不成立（smoke test 未輸出該段）
  ——已於 Q14 的第二次實測解決。
- Q14 第二次 smoke test（2026-08-06，同一 Concept、prompt 移除數量上限）：**上限本身即是病灶**。  
  A: **四項結論。(1) 錨定效應確認**——prompt 寫「最多列到 10 個面向」時產出**恰好 10 個**且第 10 個已越界
  為 `next` 鄰居的正題；移除該句後自然產出 **6 個面向 / 7 題**、無越界。故 FR-016 追加
  **「生成 prompt 中 MUST NOT 出現任何題數或面向數的數字（上限亦然）」**，上限降級為純 code-side 保險絲；
  並追加「鄰居只能作為區辨點、MUST NOT 搬入其正題」。
  **(2) 敘述性的詳解要求不可靠**——以**逐字相同**的指令跑兩次，一次 `explanation` 全部產出 **2 段**、
  另一次全部產出 **5 段**（後者結構恰為「結論句 / 正解為何對 / 其餘三選項各自為何錯」）。故 FR-006 改為
  **明訂恰 5 段並由 Gate 檢查**，不再只寫「其餘段落 MUST 逐一說明」。
  **此差異 MUST NOT 被歸因於題數配額**——兩次之間題數與 prompt 其他行皆有變動且各僅一個樣本，
  不足以支撐因果推論；本條只採認「敘述性要求無法穩定落實」這項已確立的事實。
  （影響面僅限 Pages：Discord 取 `explanation[0]`，兩次皆合格；2 段版本會使 Pages 上看不到
  「其餘三個選項各自為何錯」，而那正是點連結過去的主要價值。）
  **(3) 「面向為覆蓋下界而非上限」（FR-016b）生效**——6 個面向出 7 題，其中面向 1 以「複雜度判斷」與
  「定義辨析」兩個角度各出一題。
  **(4) 代號前綴規則在 prompt 層即可攔下**——加入該規則後 0/7 自帶前綴（前次為 10/10），Gate 為第二道保險。
  數值更正：單題最長由估算的 399 更正為實測 **362**、平均 336；全庫規模由 1,300～1,650 下修為
  **1,000～1,300** 題、產線呼叫約 2,500 次（**此呼叫數後於 2026-08-07 更正為約 1,500 次，以 Assumptions ③ 為準**）。
  **題數上限維持 10**：自然產出 7，10 留有 43% 餘裕；MUST NOT 提高至 15——保險絲設在正常值兩倍以上
  即失去警示作用（真的產出 14 題時多半是灌水或越界，而 15 不會攔下）。
- Q9 選題公式的基底該用什麼？（修正 Q2 的筆誤）  
  A: **`(localOrder + trackOffset) mod 該 Concept 題數`**，索引由 Compiler 於 runtime 現算、
  **MUST NOT 固化進課表或題庫**（FR-003、FR-003a）。
  Q2 原記「`ordinalOf(conceptId)`」為誤——§16.1 的 `ordinalOf` 回傳複合鍵
  `{ moduleIndex, topicIndex, localOrder, id }`，僅供比較，非可取模的純量。
  亦 MUST NOT 改用「DAG 全序名次」：前段插入一個 Concept 會使其後全部名次位移，令內容未變的 Concept
  全數換題；`localOrder` 僅在其所屬 Topic 重排時變動。
  **與 §15「MUST NOT 於 runtime 即時選題」不衝突**：該條對象為 LeetCode 題（選題影響課程排程，故須固化為
  生成物）；Quiz 與 Reflection / 鼓勵語同屬**素材**，§15 明文允許每日 runtime 決定性選取。

### Session 2026-08-07

- Q15 課綱頁（Pages 儀表板）的「課綱順序」清單（`src/pages/dashboard.ts` 的 `#curriculum`
  區塊、資料來自 `src/pages/curriculum-view.ts` 的 `CurriculumEntryView`）要不要一併掛上
  quiz 連結，而不只是 Discord 小測段？涵蓋範圍與呈現方式？
  A: **要**。範圍**僅限「課綱順序」清單**，**MUST NOT** 一併擴充到同頁「今日課程」欄位
  （`LastSessionView` / `renderTodaySession`）——原始需求聚焦於課綱清單本身；「今日課程」當天
  即可從 Discord 小測段取得等價連結，一併擴充只會放大本次改動面而無對應需求支撐。
  條件比照 `articleUrl`（`entry.unlocked` 為真）**再疊加**「該 Concept 在 `quizBank.byConcept`
  有題目」——與 F11 既有的 `quiz/{conceptId}.html` 產出範圍規則（FR-011、research R7）同一組
  判準，MUST NOT 另立一套解鎖或有題判斷。
  呈現：標題連結後接 `|` 分隔符號（左右各留 margin，僅作視覺分隔、不可點擊），再接一個指向
  `quiz/{conceptId}.html` 的連結「✍️ 小測」。連結底色 MUST 用
  `color-mix(in srgb, currentColor 12%, transparent)`，MUST NOT 寫死固定色號——與現有
  `.badge`（`border: 1px solid currentColor`）「用 currentColor 換算、同一份規則自動適配明暗
  主題」的既有慣例一致，不需另寫 dark-mode media query override。決策定案前已用互動預覽
  （pipe 分隔 + 淡底色 chip）與使用者確認呈現效果。

## 定位與邊界

F10 互動化「評估後否決」。原方案需要 Discord Slash Command 互動端點（edge worker）+ 表現訊號存儲 + 自適應排序，投入與 F7 相當，但核心價值卻只有「US2 每週測驗」一個——US1 已由 F9 Pages 覆蓋（儀表板 + 全文 + 即時查閱），US3 自適應因違反生成物凍結原則（spec §4-13）而不可行。

**本 Feature 取其精華**：每週 review 於 Discord 掛 spoiler 自評題（每 Concept 1 題），完整題庫則掛在既有 Pages 上（`quiz/{conceptId}.html`）。完全零新 infra、憲章一字不改，交付成本約等於 F8（主體在內容產線）而非 F10 的全部工程成本。

**兩層呈現的取捨**：Discord 只推每 Concept 1 題，換得的是「**題庫規模與字元預算脫鉤**」——題庫每 Concept 可出 3～10 題、詳解可寫足，都不會擠壓 Discord 版面。代價是不點連結的使用者每週只練 3～4 題；願意多練的人有完整題庫可去。

**MUST NOT 改動**：
- Curriculum DAG、三份課表、Article 正文、daily workflow（推播機制零改）
- spec §4-8（每日零 LLM）、§4-13（生成物凍結）
- state.json 結構與 commit 路徑

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 每週自評確認本週觀念掌握（Priority: P1）

每週 review Session 推出後，學習者在同一則 Discord 訊息中看到新增的「✍️ 本週小測」段——本週複習到的每個 Concept 各一題。題幹與選項明碼呈現，正解與一句結論封在 spoiler 後面，他可按節奏自己決定何時點開對答案；答錯時當下就知道錯在哪。想看完整推導、或想多練幾題的人，每題都附一個連結，通往該 Concept 在 Pages 上的完整題庫頁。

**Why this priority**：Testing effect（先嘗試回想、再檢視反饋）是最有效的學習手段。這是本 Feature 存在的唯一理由。

**Independent Test**：測驗題庫已凍結、某週 review 推出後，可獨立驗證該則訊息是否為該週 `reviewRange` 涵蓋的每個 Concept 各出 1 題、正解與一句結論是否封於 spoiler、以及題目是否與 FR-003 公式算出的索引一致。

**Acceptance Scenarios**:

1. **Given** 某 Track 該週為 review Session 且該週涵蓋 4 個 Concept，**When** review embeds 推出，**Then** 版面內包含「✍️ 本週小測」，恰含 4 道選擇題（每 Concept 1 題），每題的正解、一句結論與連結封於 `||…||`。
2. **Given** 題目已顯示，**When** 學習者點開 spoiler，**Then** 正解代號與 ≤80 字的結論句完整顯示（無截斷），完整詳解不出現於 Discord。
2a. **Given** 學習者點開 spoiler 內的連結，**When** 該 Concept 的 quiz 頁載入，**Then** 該題的完整詳解（含其餘三個選項為何不成立）與該 Concept 其餘題目全部可見。
3. **Given** 同一個 Concept 在三個 Track 都被複習，**When** 比較三軌推出的題目，**Then** 三者取到相異題目，且同一 `(track, sessionIndex)` 重複編譯結果恆同（非隨機、非由運行環境決定）。
4. **Given** 該週某個 Concept 在題庫中無任何題目，**When** review 推出，**Then** 略過該 Concept、其餘 Concept 照常出題；該週全部 Concept 皆無題時才省略整段。
5. **Given** 測驗題庫缺席或損毀，**When** 該週 review 推出，**Then** 小測段自動省略，推播正常進行，MUST NOT 因素材缺席而使整個 review 失敗。
6. **Given** Pages 停用（private repo）或 quiz 頁尚未產出，**When** review 推出，**Then** 題目照常全部推出、僅省略連結，推播成功。

---

### Edge Cases

- 某 Concept 題庫僅 1～2 題 → 三軌以 `trackOffset` 取模會撞題，SC-003 不成立 → 由 Gate 以「每 Concept ≥3 題」擋在凍結前（FR-005、FR-010），MUST NOT 留到 runtime 才發現。
- 某週僅涵蓋 1 個 Concept（實測三軌各有 1 週如此）→ 小測段僅 1 題，合法，MUST NOT 因題數少而省略整段。
- 題庫某 Concept id 在 Curriculum 中不存在（改名 / 刪除後未重跑）→ Gate 的參照完整性檢查擋下（FR-010）。
- Pages 已啟用但該 Concept 的 quiz 頁缺席 → 該題省略連結，其餘題目的連結不受影響（FR-012）。
- 課綱順序清單中，某已解鎖 Concept 在題庫中無任何題目 → 該筆只顯示標題連結，不掛「✍️ 小測」
  chip；其餘已解鎖且有題的 Concept 不受影響（FR-017，與 FR-007 的降級精神呼應，但屬 Pages
  呈現規則，非推播邏輯）。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 提供一份 build-time 生成、通過品質 Gate 後凍結的測驗題庫（`data/quiz-bank.json`），**依 Concept id 組織**（MUST NOT 依 Topic——選題與呈現皆以 Concept 為單位）。每題含題幹、A/B/C/D 四選項、唯一正解、`explanation` 段落陣列（形狀見 FR-006）。
- **FR-002**: 每週 review Session 的推播 MUST 於 Challenge 段之後、鼓勵語段**之前**附加「✍️ 本週小測」段——五段順序為
  **本週涵蓋 → Reflection → Challenge → 小測 → 鼓勵語**，使 F8 FR-022「鼓勵語 MUST 為最後一段」持續成立、
  MUST NOT 撤銷該不變式（Phase 0 修訂，見 [research.md](./research.md) R5）。
  **該週 `reviewRange` 涵蓋的每一個 Concept 各出恰 1 題**（現行課表為每週 3～4 題）。每題明碼呈現題幹與四選項，並以 spoiler `||…||` 封藏【正解代號 + `explanation[0]` 的一句結論 + 指向該 Concept quiz 頁的連結】。**完整詳解 MUST NOT 出現在 Discord**，只出現在 Pages（FR-011）。
- **FR-003**: 選題 MUST 為決定性純函式，公式為 **`(localOrder + trackOffset) mod 該 Concept 題數`**——`localOrder` 為 `ConceptNode` 既有的整數欄位，其值由 **Skeleton 檔名的 `NNN-` 前綴**解析而得（`src/compiler/curriculum.ts` 既有實作：`001-array-memory-layout.md` ⇒ `1`，**1-based**，範圍為 `concepts/{dirName}/` 目錄；無 `NNN-` 前綴者為 `0`）。**MUST NOT 另行計算「該 Concept 在其 Topic 內的序位」**——現行資料恰為「一個目錄對應一個 Topic、編號自 `001` 連續」，兩者數值相同，但真實來源是檔名而非序位，檔名跳號時即不相等。`trackOffset` 沿用 §15 的 Track 固定順序索引（0/1/2）。**MUST NOT 隨機選題**（違反憲章 XI 的 Renderer 純函式性與 SC-002 的 byte-identical 驗收），**MUST NOT 改用 `sessionIndex` 或 `reviewOrdinal` 取模**。
  **為何不用 `ordinalOf`**：§16.1 的 `ordinalOf` 回傳複合鍵 `{ moduleIndex, topicIndex, localOrder, id }`，僅供 `cmpOrdinal` 比較用，**不是可取模的純量**。亦 MUST NOT 改用「Concept 在 DAG 全序中的名次」——在 DAG 前段插入一個 Concept 會使其後全部 Concept 的名次位移，導致內容未變的 Concept 全數換題；`localOrder` 僅在其所屬 Topic 被重排時變動，影響面小得多。
  **為何唯一變化軸是 Track（實測 2026-08-06）**：三軌全部 Concept（103 / 134 / 165）皆恰好被 review 涵蓋 1 次、0 個從未被複習，故 per-Concept **不存在時間輪替維度**；以 `localOrder` 作基底另可避免所有 Concept 都固定取到第 0 題。
  **已知性質（非缺陷）**：於同一目錄插入新 Skeleton 檔並重新編號，會使其後 Concept 的 `localOrder` 位移、推出的題目隨之更換。此仍為凍結輸入的純函式，決定性不受影響。
- **FR-003a**: 選中的題目索引 **MUST 由 Compiler 於 runtime 依 FR-003 現算**，**MUST NOT 固化進 `schedules/{track}.json` 或 `data/quiz-bank.json`**。
  **與 §15「MUST NOT 於 runtime 即時選題」的關係**：該條規則的對象是 **LeetCode 題**——選哪些題會影響課程排程本身（跨槽去重、難度帶、每 Session ≤3 題截取），故必須固化為生成物。Quiz 與 Reflection / 鼓勵語同屬**素材**，§15 明文允許「每日 runtime 決定性選取」。本 Feature 走素材路徑，**不構成雙軌選題**。
- **FR-004**: 題目 MUST 全部落在該週 `reviewRange` 涵蓋的 Concept 範圍內；`reviewRange` 的推導 MUST 重用 §13.4 / §15 的既有規則（MUST NOT 另寫一套）。
- **FR-005**: 每個 Concept 的題庫題數 MUST 落在 **3～10** 之間，且 **MUST NOT 為固定配額**（依該 Concept 的可出題面向浮動）。下限 3 由 SC-003 推導——三軌以 `trackOffset` 0/1/2 取模時需能落在相異題目上；上限 10 為產線失控的保險絲。此範圍 MUST 由 Gate 把關（見 FR-010）。
- **FR-006**: 正解 MUST 唯一且存在於選項中；選項 MUST 為 A / B / C / D 四選一。**`options` MUST 儲存純選項文字、MUST NOT 內含 `A.` / `B.` 等代號前綴**——代號由 Renderer 於呈現時產生（憲章 XI：呈現歸 Renderer）。素材若自帶前綴 MUST 由 Gate 擋下（smoke test 實測 2026-08-06：模型會自行加上前綴，與 Renderer 疊加後產生 `A. A. …` 的重複輸出）。`explanation` MUST 為**段落陣列，且 MUST 恰為 5 段**：`[0]` 為 ≤80 字的結論句（單獨閱讀即成立，供 Discord 使用）；`[1]` 說明正解為何成立；`[2]`～`[4]` **逐一**說明其餘三個選項各自為何不成立（供 Pages 使用）。**段落數 MUST 由 Gate 檢查**。
  **理由（smoke test 實測 2026-08-06）**：以**逐字相同**的指令「其餘段落說明正解為何成立，並逐一說明其餘三個選項為何不成立」跑兩次，一次全部產出 **2 段**、另一次全部產出 **5 段**——**同一條敘述性要求無法穩定落實**，僅寫要求而不驗結構即攔不住。5 段的產出恰好對應「結論句 / 正解為何對 / 其餘三選項各自為何錯」，故將此結構明訂為契約。
  （兩次之間題數與 prompt 其他行亦有變動且各僅一個樣本，**故 MUST NOT 將段落數差異歸因於題數配額**；此處只採認「敘述性要求不可靠」這項已確立的事實。）**MUST NOT 另生成一份短版解說**——Discord 與 Pages 共用同一份 `explanation`，前者取 `[0]`、後者取全部。
- **FR-007**: 某 Concept 在題庫中無任何題目時，MUST **略過該 Concept**（其餘 Concept 照常出題）；該週全部 Concept 皆無題時 MUST 省略整個小測段，該則 review 原有四段 MUST 完全不受影響。
- **FR-008**: 題庫素材**缺席**時 MUST 降級為「無題」（同 FR-007 的整段省略），MUST NOT 使該週 review 推播失敗。
  **壞檔（非合法 JSON 或不符 schema）MUST NOT 降級為缺席**，一律 fail loud（`throw` 具名錯誤、非零 exit code）——
  此語意沿用 F8 既有 `loadOptionalMaterial` 的全域行為（`reflectionBank`／`encouragement` 同受此規則，
  contracts/quiz-bank-schema.md §2），**MUST NOT 為 quiz bank 另立一套降級規則**（憲章 IX：同一份載入邏輯，
  MUST NOT 因素材種類而分歧）。此為既有架構已承擔的風險，非本 Feature 新增（2026-08-07
  `/speckit-analyze` 後修訂，修正原文字面過度承諾「無法解析」亦會降級的誤述）。
- **FR-009**: Discord spoiler 語法 `||…||` 需由 Renderer 產生；Discord 原生支援，無需額外用戶端互動。單題 MUST 獨占一個 embed field（實測 258 < field value 上限 1,024）。
- **FR-010**: 測驗素材 MUST 通過**結構性**自動品質檢查（繁體中文、參照 Concept id 存在、正解唯一且在選項中、**`options` 不含代號前綴**、**`explanation` 恰 5 段且 `[0]` ≤80 字**、每 Concept 題數落在 3～10、**同一 Concept 內無實質等價的題目**、**無 LeetCode 題號或題目連結**）。Gate 未過 MUST NOT 凍結入庫。題數一項的執行時機受 FR-013a 約束。**「同一面向的多題」MUST NOT 被判為違規**（FR-016）——禁的是同面向且同考核角度、僅換句話說的重複題。
  **「無 LeetCode 題號或題目連結」MUST 為一條具名 Gate 判準**（`quiz-leetcode-id`），檢查對象為 `stem` + `options` + `explanation` 的合併文本，MUST NOT 只寫在需求裡而無對應規則。**理由**：§5／§11 與憲章「技術與資源約束」明訂題號 / 連結 / 難度 **MUST 由程式從 Problem Bank 帶入、MUST NOT 由 LLM 生成**，而小測題的題幹、選項與詳解**全部**是 LLM 產物（Assumptions ⑥：Quiz Item 無題號、無難度）；沒有這條規則，模型自行寫入的題號會直接落進凍結產物。**且此類違規的補救成本不對稱**——題庫綁 Skeleton 雜湊（FR-015），內容問題不會觸發失效，凍結後只能以 `--force` 重生該 Concept 並重燒一次免費層額度。
- **FR-010b**（2026-08-07 實測後新增）: 測驗素材 MUST 通過三條**猜答偏誤**的結構性判準，皆為 per-Concept 的**集合層**統計，題數 < 4 時不套用（樣本太小佔比無統計意義）：
  - **`quiz-answer-position-bias`**：該 Concept 內任一 `answerIndex` 的出現次數佔比 MUST ≤ **50%**。
  - **`quiz-longest-option-bias`**：該 Concept 內「正解恰為該題**唯一**最長選項」的題數佔比 MUST ≤ **50%**。
  - **`quiz-answer-position-coverage`**：正解實際用到的位置數 MUST ≥ **3**；題數 ≥ **8** 時 MUST 用滿 **4** 個位置。**此條與 position-bias 互補而非重複**——佔比上限只約束「最集中的那一格」，`A=50% B=50% C=0 D=0` 完全通過 position-bias 卻讓 C／D 從未出現、猜答空間砍半。實測全庫 242 題：**A 佔 66.9%、B 26.4%、C 6.2%、D 僅 0.4%**，模型幾乎從不把正解放在最後一格。分層（而非一律要求四格）是因為 `n=4` 時要求用滿四格等於「每格恰一題」，交叉驗證丟掉任一題即必然違規、過於脆弱。

  **理由（實測證據）**：`array-two-pointers-variable` 產出的 10 題**全數通過當時既有的 9 條判準**，卻有 **80% 正解落在 B、90% 正解是唯一最長選項**——學習者只要「一律選最長的 B」就能得 80 分而完全不必理解內容。同批 31 個已產出 Concept 以此判準複驗為 **31/31 違規**，證實這是**系統性偏誤而非個案**。本 Feature 的全部價值在於**誠實的自我訊號**（US1 與 SC-001～SC-003 的共同前提），這種題目量測不到任何東西，**等同素材失效卻無任何徵兆**——正是憲章 XV「fail loud」要防的靜默失效。

  **MUST 為結構性判準、MUST NOT 只靠 prompt 敘述**：Q14 已實證敘述性要求無法穩定落實；且「把正解寫得比干擾項完整」是撰寫選擇題時的下意識行為，連人工撰寫也會發生（本次以 Opus 5 手寫對照組的首版即有 70% 正解為最長選項）。**與 checklists/prompt-design.md CHK006／018 那批「語意層無法結構化偵測」者不同**：這兩條是**純計數**，不需要將 Stage A 面向清單持久化為中繼產物（那正是 research R6 否決補 Gate 的理由），成本極低而收益明確。

  **門檻 MUST NOT 收緊至接近隨機期望值（25%）**：正常抽樣波動會頻繁觸發重生而白燒免費層額度；50% 留一倍餘裕，只攔明顯的系統性偏誤。「唯一最長」而非「並列最長」亦為刻意——若有其他選項與正解等長，長度就不構成可利用的線索。

  **達成手段的修正（2026-08-07 首跑後）：兩條位置類判準 MUST 由確定性重排達成，MUST NOT 靠重生達成。** 上述「50% 留一倍餘裕故不會誤殺」只對 `quiz-longest-option-bias` 成立（單一二項分布，n=7 誤殺率約 7%）。`quiz-answer-position-bias` 取四格的**最大值**、`quiz-answer-position-coverage` 取**覆蓋數**，在 n=4～10 的樣本量下，即使 `answerIndex` 完全均勻隨機仍有 **23%–45%** 的誤殺率（n=8 時光是「需滿四格」就有 37.7%）；`MAX_REGEN = 3` 之下，純統計噪音即可讓約 **4%–12%** 的 Concept 被誤判為 `needsHumanReview`。首跑實測：5 個 Concept 中 4 個因這三條耗盡 3 輪。**這不是門檻鬆緊問題而是樣本量問題**，放寬門檻只會連真實偏誤一起放過。**正解落在哪一格不帶任何語意**，因此 MUST NOT 交給 LLM 決定再由 Gate 事後拒絕：產線 MUST 於交叉驗證後、集合層 Gate 前以確定性演算法重排正解位置（`scripts/lib/quiz-balance.ts`，quiz-bank-schema.md §5.2a），使兩條由建構保證通過。兩條判準 **MUST 保留於 `checkQuizBank()`**，作為防手改題庫／防未來新題目來源／防重排邏輯被改壞的 CI 守衛。`quiz-longest-option-bias` 是**內容**問題（把正解寫得比干擾項完整），重排改不了，MUST 繼續由 prompt 與重生迴圈處置。

  **`quiz-longest-option-bias` 的重生顆粒度 MUST 為逐題，MUST NOT 為整個 Concept**（quiz-bank-schema.md §5.2b）：整輪重生會把已通過交叉驗證的好題一起丟掉，實測全量跑至第 37 個 Concept 時 **19/37（51%）需要 2 輪以上**，成本主因即此。改為只重出「正解為唯一最長」的題（複用交叉驗證失敗時既有的 per-aspect 重出機制），一輪從約 10 次呼叫降至約 4 次。**修復目標 MUST 為隨機基準 25%，MUST NOT 只修到剛好通過 50%**——修到擦邊會讓題庫大量卡在上限（實測 5 個 Concept 恰為 50%），而「正解從不最長」與「正解恆為最長」是同樣可利用的反向線索。修復為 best-effort：替換題不符要求即保留原題，**Gate 仍是權威**，修完仍超標即照既有路徑判本輪不通過。

  **重排的前提條件 MUST 同時以 Gate 與 prompt 強制**：選項順序既然會被重排，任何參照其他選項或位置的寫法（「以上皆是」「同選項 A」「A 和 B 都對」）重排後必然語意錯亂且無徵兆，故 MUST 新增具名判準 `quiz-option-cross-reference`（逐題判準）並於 Stage B prompt 明文禁止。**MUST NOT 只靠 prompt**（Q14 已實證）。

  **已評估並否決的第四條判準（MUST NOT 補上）**：「絕對化用詞只出現在干擾項」實測佔 **54.1%**，看似理想的追加判準；但校準顯示它**不是好壞的鑑別器**——刻意平衡撰寫的手寫對照組在同一指標上是 **70%**，比被判定為劣質的那批更高。根因是「過度一般化」本來就是**優良干擾項的合法設計**（用以測試學習者是否知道例外），機械化禁止會與正確的出題原則衝突。此項 MUST 僅以 prompt 規則處置（要求干擾項具備實質觀念錯誤，而非靠極端修飾語製造錯誤）。

  **執行時機受 FR-013a 約束**：與 `quiz-count-range` 同屬**集合層**判準，MUST 於交叉驗證丟棄題目**之後**、以**存活集合**為對象執行。
- **FR-010a**: 生成輪數上限耗盡後，某 Concept 的存活題數仍 **< 3** 時，Gate MUST 以**具名違規 + 非零 exit code** 失敗，該 Concept **MUST NOT 以不足量入庫**（MUST NOT 降級為「1～2 題也接受」——那會使 SC-003 由 MUST 退化為帶例外的 MUST）。Gate MUST **一次列出全部**不足量的 Concept，MUST NOT 遇到第一個即中止。
  **理由與邊界**：F7 既有的 checkpoint resume 使 Gate 失敗**不會丟失已完成的工作**，重跑從缺漏處續跑；此為 build-time 批次而非每日推播，攔下的代價低。一個 Concept 連 3 道通過驗證的題都產不出，通常代表 Skeleton 顆粒度或 prompt 設計有問題，MUST 讓人看見（§4-15 fail loud）。此為**失敗時的介入**，非常態性人工審核關卡，不牴觸 §4-17。
- **FR-011**: GitHub Pages MUST 為**每個已解鎖且題庫中有題的 Concept**產出一頁完整題庫頁（`quiz/{conceptId}.html`，與既有 `articles/{conceptId}.html` 同構），列出該 Concept **全部**題目、選項，以及 spoiler 封藏的正解與**完整 `explanation` 陣列**。Discord 小測段的每一題 MUST 附上指向該頁的連結。
  **產出範圍 MUST 與 `articles/{conceptId}.html` 完全同構**——僅涵蓋 `unlockedIds`（`computeUnlockedConceptIds(state)`，三軌 `completedConceptIds` 的聯集），**MUST NOT 對全部 165 個 Concept 產出**（Phase 0 修訂，見 [research.md](./research.md) R7）。理由：unlock 是全站一致的呈現模型，題庫頁單獨破例會造成「文章看不到、但考點看得到」的劇透與不一致。**此限制不會造成死連結**——review 只涵蓋已上過的 concept Session，該 Session 推播成功時 `advance()` 已將其寫入 `completedConceptIds`，故 Discord 產生的連結必然落在 `unlockedIds` 內。
- **FR-012**: Pages 停用或該頁尚未產出時，Discord 小測段 MUST 照常推出題目、僅省略連結，MUST NOT 因 Pages 不可用而使推播失敗或使小測段消失——維持 §22.5 對 F9「完全隔離的末段」的定位。
  **連結來源機制（Phase 0 修訂，見 [research.md](./research.md) R1）**：`quizUrl` MUST 沿用既有 `PAGES_BASE_URL` 環境變數（`scripts/build-pages.ts` 已定義同名變數），MUST NOT 另立新變數，MUST NOT 呼叫任何 API 偵測 repo 可見性。該變數未設定即視同 Pages 停用，全部題目省略連結；**本 Feature MUST NOT 修改 `daily.yml`**——現行 `push` job 未設定此變數，故本 Feature 的預設起始狀態即為「小測正常推播、連結全數省略」，與現狀完全向下相容。
- **FR-013**: 產線 MUST 於 build-time 對每一題執行**獨立二次作答交叉驗證**：以一次獨立 LLM 呼叫提供題幹與四選項並要求作答，**MUST NOT 於該次呼叫中提供題庫標記的正解**；作答結果與標記不一致者 MUST 丟棄重生，MUST NOT 凍結入庫。
  **重生規則（MUST）**：補生成 MUST 針對被棄題所屬的**面向**重出（FR-016 的面向清單），且 MUST 換一個考核角度，MUST NOT 重出實質等價的題；**重生的題 MUST 再次通過本條的交叉驗證**，MUST NOT 直接入庫。per-Concept 的總生成輪數 MUST 設上限（**初次 + 最多 2 次補生成 = 3 輪**），MUST NOT 無限重試（免費層額度，§4-16）。
  **基礎設施層失敗 MUST NOT 計入該輪數上限**：交叉驗證呼叫本身失敗（API 錯誤、逾時、回應非結構化而無法解析）屬基礎設施失敗，MUST 沿用 F7 既有的 RPM 節流與 429 指數退避 + jitter 重試路徑處理，**MUST NOT 計入 3 輪內容重生上限**——把可重試的暫時性錯誤計入內容輪數，等同把網路抖動誤判為「這個 Concept 出不出好題」而觸發 FR-010a 的具名失敗。基礎設施重試耗盡後，才將該題視為本輪未通過。
- **FR-013a**: 產線各關卡的**執行順序 MUST 為**：生成 → 交叉驗證（FR-013）→ 丟棄不一致者 → 補生成 → 補生成的題再驗 → **最後才執行全部集合層判準**。**集合層判準 MUST 作用於交叉驗證後的存活集合，MUST NOT 在驗證前執行。**
  **「集合層判準」的定義**：判斷對象為「該 Concept 的整個題目集合」而非單一題目者，計有 **題數範圍（FR-005 / FR-010 的 `quiz-count-range`）** 與 **三條猜答偏誤（FR-010b 的 `quiz-answer-position-bias` / `quiz-answer-position-coverage` / `quiz-longest-option-bias`）**。其餘逐題判準（繁中、代號前綴、選項互相參照、結論句長度、單題預算、重複、LeetCode 題號）可在草稿階段直接判。
  **確定性重排的落點 MUST 為「交叉驗證之後、集合層 Gate 之前」**（FR-010b 的修正段）：更早 MUST NOT——交叉驗證會丟棄題目而改變題數，先排會排錯份數；更晚 MUST NOT——那等於讓 Gate 檢查一份不是最終要寫入的內容。
  **理由**：若集合層判準先跑，「生成恰 3 題 → 題數合格 → 交叉驗證棄掉 1 題 → 入庫 2 題」會完全無人察覺，而 2 題使 `trackOffset` 0/1/2 取模只剩兩個相異值，SC-003 靜默失效。同理，交叉驗證會改變正解位置與選項長度的分布，草稿階段通過 FR-010b 不代表存活集合仍通過。補生成失敗後 MUST 回頭重新執行全部集合層判準，MUST NOT 假設補生成必然成功。
  **生成端 MUST 於存活集合上重跑一次完整 `checkQuizBank`，MUST NOT 只判題數下限就寫入**：實測 2026-08-07，產線因只判了 `survivors.length < 3`、未重判上限與偏誤，導致 3 個 Concept 帶著 11～12 題寫入題庫，直到批次末 `runContentGate` 才爆出——屆時已離開該 Concept 的重生迴圈，只能以整批非零 exit 收場，等同浪費整輪額度。
  **理由**：§4-17 規定內容產線唯一的常態人工檢查點是課綱大綱定稿，這 800～1,200 道題不會有人逐題審；FR-010 的結構性檢查無法偵測「標成正解的選項實際上是錯的」，而錯誤知識帶有「正解」的權威感，危害大於未提供測驗。
  **邊界**：此驗證 MUST 完全落在 build-time（§4-8 每日 runtime 零 LLM 不受影響）；MUST 沿用 F7 既有的 RPM 節流、429 退避與斷點續跑。**已知限制 MUST 記錄於產線文件**——同模型家族可能產生相關性錯誤，故此機制非 100% 覆蓋，MUST NOT 被描述為正確性保證。
- **FR-014**: spec §14.5 的字元預算表 MUST 新增兩格具名 slot，並由既有的 `checkBudget` 於同一次呼叫中檢查：**`quizItem` ≤ 570**（單題，含題幹 / 選項 / spoiler 內容 / 連結）、**`quiz` ≤ 3,000**（小測段合計）。超標 MUST 於 CI Gate 失敗並具名回報，**MUST NOT 自動截斷內容，亦 MUST NOT 靜默略過超出的題目**（§14.5、§4-15）。
  **量測範圍（MUST）**：兩格皆只計 embed **field value**，不含 field name（`✍️ 本週小測 (i/N) · {conceptTitle}`）——field name 由 Renderer 以固定樣板產生、長度不由素材決定，其對總長的貢獻由既有的 `total` ≤5,500 與 `embed[i].field[j].name` ≤256 兜底。`quiz` 為該則訊息**全部小測題 field value 的合計**。
  **理由（兩道都設）**：小測段長度為「該週 Concept 數 × 單題長度」，而 §13.2 允許 `rhythm.length` 最高 14——僅設單題上限擋不住節奏調整後一週涵蓋十餘個 Concept 的失控；僅設整段上限則默許單題寫到 2,900 而擠掉其餘題目。
  **數值依據（smoke test 實測 2026-08-06，`array-memory-layout`）**：真實產出單題**內容**最長 **362**、平均 **336**（已剝除選項代號前綴，為真值；**該次 smoke test 未設定 `PAGES_BASE_URL`，故此數字不含連結**）。初訂的 350 仍使 7 題中 2 題超標，且超標者為**選項需寫入實質差異的好題**（如「陣列連續配置 vs 雜湊表鍵值對映的根本差異」）；此與 §14.5 記載的 TS / Python Tip 兩次放寬（450 → 650 → 800）同因——壓預算只會逼出「砍到失去教學價值」或「反覆重生燒額度」。故**內容側取 450**（實測最長 + 約 24% 餘裕）。
  **連結側另計 120（Phase 0 後修訂 2026-08-07）**：spoiler 內連結片段的最壞長度為 `{pagesBaseUrl}`（本 repo 47）+ `/quiz/`（6）+ 最長 conceptId（`sliding-window-longest-substring-no-repeat`，42）+ `.html`（5）+ ` · [完整詳解]()` 裝飾（11）= **111**，取整為 **120** 作為保留額度（`QUIZ_URL_RESERVE_CHARS`）。故 `quizItem` = 450 + 120 = **570**。
  **MUST NOT 沿用初訂的 450**：該數字是「內容 + 24% 餘裕」，**從未計入連結**；沿用會使實測最長的題目在操作者依 research R1 啟用 `PAGES_BASE_URL` 後（362 + 111 = 473 > 450）當場變成 Gate 違規，而屆時題庫已凍結、無重生路徑。
  `quiz` 維持 3,000 之理由：最壞週次 4 個 Concept × 570 = 2,280 仍在額度內，該則訊息合計 612 + 2,280 = **2,892**、距 5,500 餘約 47%；3,000 仍能攔下真正的失控（`rhythm` 拉至 14 將達 7,980）。
- **FR-015**: 題庫的重生成 MUST 以 **Concept Skeleton 雜湊**為失效判準——Skeleton 未變更時 MUST NOT 重生（冪等，§20.4）；某 Concept 的 Skeleton 變更時 MUST 令**該 Concept 全部題目**失效重生，其餘 Concept 不受影響。**MUST NOT 以 Article 雜湊為判準**（Article 為 LLM 產物，每次重生雜湊皆變，將造成大量假性失效）；**MUST NOT 另立只有題庫在用的失效規則**（憲章 IX，兩套判斷必然漂移）。
- **FR-016**: 題庫生成的 prompt MUST 使題數**由內容推導**而非由配額決定，以防「達標即停」（滿足下限即停止產出）：
  - **MUST NOT 於生成 prompt 中陳述下限 3**——該數字只存在於 Gate（FR-010），是事後把關，MUST NOT 回饋為生成目標；
  - MUST 採兩階段：先列舉該 Concept **值得單獨考核的面向**，再據以出題；
  - **面向的取材範圍 MUST 涵蓋以下全部來源**（MUST NOT 只取結構化欄位）：`learning_goal`、`exit_criteria`、Author Hints 的 **核心觀念 / Pattern 辨識線索 / Thinking / Common Mistakes** 四段、以及**與 `prerequisite` / `next` 相鄰 Concept 的區辨點**。
    **理由（實測 2026-08-06，全 165 個 Concept）**：`learning_goal` **恆為 1 條**（min=max=1）、`exit_criteria` 為 1～2 條，兩者合計分布為 `{2: 80, 3: 85}`——**80 個 Concept 只有 2 條、85 個恰好 3 條、無一超過 3**。僅取這兩欄必然使 48% 的 Concept 跌破下限、其餘 52% 零餘裕。納入上述四段 Author Hints（165 個 Concept 皆完整具備）與鄰居區辨後，面向來源數 **min=8、中位=11**，合計 <3 者為 **0 個**。
  - **MUST NOT 以 Author Hints 的 `TypeScript 重點` / `Python 重點` 作為面向來源**，亦 MUST NOT 出考核語言 API 用法的題目。
    **理由**：抽樣全部 330 條實測，絕大多數為**寫法建議而非觀念**（如「Use a list as a stack and pop iteratively」「Leverage built-in max()」「Iterate over the Set elements using for...of」），出成選擇題即淪為 API 記誦，與本專案「建立能夠持續解題的思維模式」的目標無關且稀釋題庫；且其中相當比例為英文，違反 §11 的繁中要求、易污染題目語言。**排除的代價為零**——面向來源數僅由 min=10 降為 **min=8**，無任何 Concept 因此跌破下限。少數具觀念價值者（如別名／淺拷貝陷阱）本質即屬 Common Mistakes，已由該段涵蓋。
  - **面向數 MUST NOT 成為題數上限**：同一面向 MAY 出多題，但每題 MUST 採不同**考核角度**（定義辨析 / 反例識別 / 複雜度判斷 / 適用邊界 / 與相似 Pattern 區辨 / 常見誤用）。面向的作用是**覆蓋保證的下界**（每個面向至少 1 題），非上限。
  - **生成 prompt 中 MUST NOT 出現任何題數或面向數的數字**（上限亦然）——上限 10 僅為 code-side 保險絲與 Gate 檢查（FR-010），MUST NOT 寫進 prompt。
    **理由（smoke test 實測 2026-08-06，同一 Concept 兩次對照）**：prompt 寫「最多列到 10 個面向」時，模型產出**恰好 10 個**，且第 10 個已越界為 `next` 鄰居的正題；移除該句後自然產出 **6 個面向 / 7 題**、無越界。**上限一旦出現在 prompt 就會被當成目標**，與下限同病。
  - **面向列舉 MUST 僅涵蓋本 Concept 自身的可考事項**：`prerequisite` / `next` 鄰居**只能作為「與本 Concept 的區辨點」**，MUST NOT 將鄰居的正題整體搬入（實測未加此限制時，第 10 個面向即為 `stack-array-implementation` 的正題）。
  - **MUST NOT 產出實質等價的題目**（同一面向、同一考核角度、僅換句話說）——由 Gate 視為品質違規。**MUST NOT 將「同一面向的多題」本身視為違規**。
  - **防線完整性的已知限制（MUST 明文承認，2026-08-07 定調）**：本條的數項要求——「重生 MUST 換一個考核角度」（FR-013）、「鄰居 MUST NOT 搬入正題」、「MUST NOT 產出實質等價的題目」、「面向取材 MUST 涵蓋六個來源」——**僅由生成 prompt 的敘述性指示與交叉驗證部分兜底，MUST NOT 被描述為完整防線**。`checkQuizBank` 的結構性判準只攔得下 `stem` **逐字相同**（FR-010），語意層的「換句話說」「角度其實沒換」「搬了鄰居的正題」皆非機械可偵測；且交叉驗證的判準是「答案是否一致」，與「題目是否語意重複」不對應。本條唯一具自動化判準者為「prompt 中不得出現題數／面向數的數字」（可對 prompt 模板字串做靜態掃描）。**此為刻意取捨**：補上結構性 Gate 需將 Stage A 的面向清單持久化為中繼產物（research R6 已因續跑粒度而否決），代價高於收益；殘留風險由 T037 真實生成時的人工抽樣觀察承接。
  - **「165 個 Concept 皆完整具備六段 Author Hints、且皆有 `prerequisite`／`next` 鄰居」MUST 視為現況實測、而非恆定不變式**：日後新增或改寫的 Concept 若因缺段或無鄰居而使面向來源不足，其後果 MUST 以「交叉驗證後存活題數 < 3」的形式落入 **FR-010a 既有的具名失敗路徑**（Gate 擋下、非零 exit、該 Concept 不以不足量入庫）。**MUST NOT 為此另立降級規則**——不足量入庫會使 SC-003 靜默失效，正是 FR-013a 要防的同一類問題。
  **附帶一致性**：面向的來源即 Skeleton，與 FR-015 的「Skeleton 雜湊變更即失效重生」同源——Skeleton 改動代表面向需重新盤點，題目理應重生。
  **附帶效益**：本條同時是**對交叉驗證誤殺的緩衝**。FR-013 的丟棄是保守作法（不一致未必是題錯，也可能是驗證模型答錯），若每個 Concept 都只生成 3 題，任何一次誤殺即跌破下限並觸發 FR-010a 失敗；SC-010 要求全庫平均 ≥5 正是為此提供餘裕。
- **FR-017**：GitHub Pages 課綱頁（`src/pages/dashboard.ts` 的「課綱順序」清單）MUST 對每個
  `entry.unlocked` 為真**且** `quizBank?.byConcept[entry.conceptId]` 非空的 Concept，於標題連結
  後追加一個指向 `quiz/{conceptId}.html` 的連結（文字「✍️ 小測」），與標題連結以 `|` 分隔符號區隔
  （左右各留視覺 margin，分隔符本身不可點擊）。不滿足上述任一條件時 MUST 只顯示標題連結（或
  `未解鎖` badge，沿用既有規則），MUST NOT 顯示空連結或死連結（Q15）。
  **範圍限定**：本條 MUST NOT 擴及同頁「今日課程」欄位（`LastSessionView` /
  `renderTodaySession`）——僅「課綱順序」清單在本 Feature 範圍內（Q15）。
  **呈現樣式**：新增 `.quiz-chip`（底色 `color-mix(in srgb, currentColor 12%, transparent)`、
  無 border）與 `.divider`（純分隔符號）兩個 CSS token，MUST 沿用 `.badge` 既有的
  「用 `currentColor` 換算、單一規則自動適配明暗主題」慣例，MUST NOT 寫死固定色號或另寫
  `prefers-color-scheme` override（Q15）。
  **資料流**：`CurriculumEntryView` 新增選填欄位 `quizUrl?: string`，由
  `buildCurriculumEntries()` 依上述條件計算並帶入既有的 `deps.quizBank`（`buildSite()` 既有傳遞
  路徑，MUST NOT 另立欄位名稱，同 FR-011 對 `deps` 的既有處置）。

### Key Entities

- **Quiz Bank**（`data/quiz-bank.json`）：build-time 凍結的測驗題庫，**以 Concept id 為組織鍵**，每個 Concept 對應一個有序的 Quiz Item 陣列（≥3 題）。
- **Quiz Item**：一道選擇題。屬性：題幹、四選項（A/B/C/D）、唯一正解、`explanation` 段落陣列（`[0]` 為 ≤80 字結論句供 Discord，其餘段落為完整詳解供 Pages）。陣列中的位置即其穩定索引，供 FR-003 取模。
- **Quiz**：某週某 Track 實際推出的題組——該週 `reviewRange` 涵蓋的每個 Concept 各 1 題，由 FR-003 的公式決定性選出。
- **Quiz Page**（`quiz/{conceptId}.html`）：Pages 上該 Concept 的完整題庫頁，列出全部 Quiz Item 與 spoiler 封藏的正解與詳解。Discord 每題連結至此，課綱順序清單的「✍️ 小測」連結（FR-017）亦連結至此。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 小測段推出時，**100%** 的 Discord embeds render 結果中正解、一句結論與連結正確封藏於 `||…||`，題幹與選項不封藏，且完整詳解不出現於訊息內。
- **SC-002**: 對同一 `(track, sessionIndex)`，編譯 & render 結果 **byte-identical**（決定性驗收）；重跑或補跑 MUST NOT 換題。
- **SC-003**: 同一個 Concept 在三個 Track 被複習時，**三軌各取到相異題目**（由 `trackOffset` 與 FR-005 的 ≥3 題下限共同保證）。
- **SC-004**: review Session 全 embeds 字元總和（含小測段）**≤ 5,500**（自訂上限），且 `quizItem` ≤ 570、`quiz` ≤ 3,000 逐格通過。實測基準（2026-08-06）：現行 review 為 204～612 字元；真實產出單題**內容**最長 362、平均 336（不含連結）。最壞週次（4 Concept）：**未啟用 `PAGES_BASE_URL`** 時合計 1,448、總計 2,060、餘裕 3,440；**啟用後**每題另加最壞 111 字元的連結，合計 1,892、總計 2,504、餘裕 2,996。上限側最壞（4 × 570 = 2,280）總計 2,892，仍餘 2,608。
- **SC-005**: 題庫**缺席**時，推播照常進行、小測段自動省略，**零提示、零告警**（降級為無素材狀態）。
  **素材損毀（壞檔）不在此列**——依 FR-008 一律 fail loud（具名錯誤 + 非零 exit code），MUST NOT 被視為
  「零告警降級」的情境。
- **SC-006**: 小測段的題幹、選項、`explanation` MUST 來自凍結 Quiz Bank，在**無 LLM API key** 的環境下推播不變（spec §4-8 延伸至本 Feature）。
- **SC-007**: Pages 停用或 quiz 頁缺席時，小測段仍推出全部題目、僅省略連結，推播成功率不受影響。
- **SC-008**: 凍結入庫的題目 **100%** 通過獨立二次作答交叉驗證（FR-013）——未通過者不存在於 `data/quiz-bank.json`；且 `data/quiz-bank.json` 中**不存在題數 < 3 的 Concept**（FR-010a）。此二者 MUST 以「交叉驗證後的存活集合」為判斷對象（FR-013a）。
- **SC-009**: Skeleton 未變更時重跑產線，`data/quiz-bank.json` **byte-identical**（冪等）；單一 Concept 的 Skeleton 變更時，**僅該 Concept** 的題目被重生，其餘 Concept 的位元組不變。
- **SC-010**: 全庫題數分布**不得堆積於下限**——凍結後 `data/quiz-bank.json` 中題數恰為 3 的 Concept 佔比 **< 40%**，且全庫平均題數 **≥ 5**。此為 FR-016「達標即停」防制是否生效的可量測訊號；未達標 MUST 視為 prompt 設計失敗並重新調整，MUST NOT 以補生成硬湊。
- **SC-011**（FR-017）：課綱順序清單中，**100%** 滿足「已解鎖且題庫有題」的 Concept 項目顯示「✍️ 小測」連結並指向對應 `quiz/{conceptId}.html`；**0%** 的未解鎖或題庫無題項目顯示該連結。`buildSite()` 對同一 `SiteBuildInput` 重複呼叫兩次，課綱頁（含新增的 quiz 連結）**byte-identical**。

## Assumptions

1. **題目形狀**：單選題、四選項（A/B/C/D）、正解唯一。複選題或其他題型屬後續 Roadmap。
2. **Discord 每週題數 = 該週 Concept 數**：現行課表為 3（Foundation）／4（IR、IM），三軌各有 1 週僅 1 個 Concept。此數字由課表決定，非可調參數。
3. **題庫每 Concept 題數為浮動 3～10**（FR-005）：下限由 SC-003 推導，上限為 code-side 保險絲（**不進 prompt**，FR-016）。因 Discord 只取 1 題，**題庫規模不影響字元預算**，故 MUST NOT 為了版面而壓低題數。**全庫規模預估 1,000～1,300 題**——smoke test 顯示最低配 Concept 在無數字誘導下自然產出 6 個面向 / 7 題，上限 10 保有約 43% 餘裕、足以在灌水或越界時響。產線呼叫數約 **1,500 次**（165 次列面向 + 約 200 次出題批次 + 約 1,150 次盲答驗證），MUST 沿用 F7 的節流與斷點續跑分批完成。
   **此數字於 2026-08-07 由 2,500 更正**：Stage B 是**每個 Concept 一次批次呼叫**產出該 Concept 全部題目（contracts/quiz-bank-schema.md §5.2），初估誤把出題記為「每題一次」（1,150）；唯一逐題呼叫的是盲答驗證（FR-013）。方向為高估、不影響任何已定案的設計，但 MUST 更正以免後續據此誤判免費層額度。
4. **兩層反饋深度，單一素材來源**：Discord 給正解 + 一句結論（`explanation[0]`），Pages 給完整詳解（完整 `explanation`）。**MUST NOT 生成長短兩版解說**——Discord 的內容是對同一份素材的決定性擷取，不是另一次生成，故不存在漂移。此決策 MUST NOT 以字元預算為由改寫：三種深度實測 216 / 258 / 365 字元皆遠低於上限，權衡點在學習反饋的即時性而非版面。
5. **沒有成績記錄**：自評版本完全無回收機制、無作答記錄。若需表現訊號支撐日後自適應，那已超出本 Feature（屬 Roadmap「多使用者」等後續項目）。
6. **Quiz Item 無難度屬性**：小測題是自製選擇題，不是 LeetCode 題——**沒有題號、不套用 §12.1 難度帶**，選題也 MUST NOT 借用 review Challenge 的「難度 + 題號」排序鍵。
7. **短期單軌**：本專案維持單人多 Track；題庫設計不為多使用者預留擴展。
8. **壞檔 fail loud 為既有架構行為，非本 Feature 新增風險**：`data/quiz-bank.json` 壞檔（非合法 JSON／
   不符 schema）時的 `throw` 語意沿用 F8 `loadOptionalMaterial`（`reflectionBank`／`encouragement`
   同受此規則），為系統既有的全域素材載入行為，**MUST NOT 為 quiz bank 另立規則**（憲章 IX）。
   FR-008／SC-005 的「降級」承諾僅涵蓋「缺席」情境，不涵蓋壞檔（2026-08-07 `/speckit-analyze` 後修訂）。

## Dependencies

- **F8 `008-review-extras`**（已完成）：review Session 的既有四段版面、`data/reflection-bank.json` 的題庫形狀與「決定性索引、MUST NOT 隨機」的既有立場（§15）。本 Feature 的索引基底改用 `localOrder`，但同屬決定性純函式，MUST NOT 引入隨機。
- **F5 `005-lesson-compiler`**（已完成）：單一 Lesson Compiler + Renderer。小測段的內容組裝 MUST 重用同一套編譯路徑。
- **F7 `007-content-generation`**（已完成）：內容產線框架（Stage 1 + Stage 2 + Gate）、RPM 節流 / 429 退避 / 斷點續跑，以及**以 Skeleton 雜湊判斷是否重生的冪等機制**。題庫生成與失效判定 MUST 沿用同一套工具鏈與同一個雜湊判準（FR-015），MUST NOT 另立一套。
- **F9 `009-pages-publish`**（已完成）：Pages 產出管線與 `articles/{conceptId}.html` 的既有頁面骨架（`src/pages/site.ts`）。`quiz/{conceptId}.html` MUST 為其同構擴充。**此依賴為單向且可降級**——Pages 停用時 Discord 推播完全不受影響（FR-012）。本 Feature 亦擴充 F9 的儀表板（`src/pages/curriculum-view.ts` 的 `CurriculumEntryView`、`src/pages/dashboard.ts` 的 `renderCurriculumEntry` / `SHARED_STYLE`）以掛上 quiz 連結（FR-017），範圍限「課綱順序」清單。

## Out of Scope

- **互動能力**：無 Discord Slash Command、無作答回收、無成績記錄（整組棄置，改採 spoiler 自評）。
- **多使用者**（spec §25 Roadmap）。
- **表現訊號與自適應**（不記錄答題表現，故無輸入）。
- **複選題、簡答、代碼題**等進階題型（Roadmap）。
- **Learning Graph 可視化**（Roadmap）。
