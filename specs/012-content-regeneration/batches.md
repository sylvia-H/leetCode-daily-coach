# F12 批次紀錄（憲章 XVII 例外條款第 3 項要求）

每批 MUST 記錄：Phase、視窗、Concept 清單、模型、agent 數、commit、Gate 結果、用量。

| Phase | 視窗 | Concepts | 模型 | commit | Gate | 備註 |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | — | — | — | `166d8bc` | — | 憲章 v1.1.0 例外條款 |
| 0 | — | — | — | `24f2756` | 948 tests | 逐篇 Gate CLI + per-article Gate 抽出 |
| 0 | — | — | — | `949cb4a` | 實測正負案例 | quiz 片段合併工具 merge:quiz |
| 0 | — | — | — | `b0a91df` | 14 tests | 18 個 Phase 清單、執行守衛、單元測試、runbook |
| 0 | 全 165 篇 | — | 無（機械刪除） | （本批） | 962 tests、`validate:content` 641 筆、`gate:articles --all` | **移除 `TypeScript Corner` / `Python Corner`**（使用者 2026-08-29 定案，見 docs/spec.md §10） |

## Phase 0 — 移除 Corner 區塊（2026-08-29）

**動機**：Corner 與 Tip 職責完全重疊（同樣是「語言特性與陷阱＋可執行程式碼」，只差長度），
Corner 只出現在 Pages 卻付出與 Tip 相同的生成、斷言撰寫與 CI 實測成本。定案後 Discord 與
GitHub Pages **共用同一份 Tip**；Pages 全文閱讀頁改為呈現 Tip（推翻 F9 research R2 第 3 點）。

**必須排在 Phase 1 之前**：F12 分 18 批漸進重生，`READING_SECTIONS` 與 article-format 契約一改，
尚未輪到重生的篇章會立刻在 CI Gate 失敗；且若先跑 Phase 1，Fable 會為 165 篇多寫一輪注定要刪的 Corner。

**量化**：
- 教材：165 篇、8,503 行純刪除（Corner 合計 210,559 字元，占 `articles/` 語料 661 KB 的 32%）。
  Corner 中位數 TS 671 / PY 572 字元；Tip 409 / 323。
- CI：`gate:code` 實測片段 660 → 330（每篇 4 段 → 2 段），約 13 分鐘 → 6~7 分鐘。
- 生成：Fable 每 concept 約 82K tokens，程式碼撰寫與自驗為大宗，估省 15~20%；全案 165 篇約省 2M tokens。

**代價（已知並接受）**：Tip 的字元上限是為 Discord 6,000 總預算而訂，移除 Corner 後 Pages 的語言
深度也被推播預算封頂。補償措施：語言特有陷阱的**論述**改寫進 `Common Mistakes`（觀念本體 ≤2,000 字
目前僅用約 36%），程式碼示範留在 Tip；此規則已寫入 docs/spec.md §10／§11 與 agent-brief.md。
| 1 | idx 21–34 | 14 個（array 收尾 + hash-table 開頭），quiz 105 題 | fable | （本批） | article 14/14 ✓、quiz 零違規、962 tests ✓、641 筆 Lesson ✓、330 區塊 ✓ | 4 agent 並行；subagent 計數合計 730K tokens。A 的 3 個 Concept 因 `quiz-longest-option-bias` 退回重修一輪 |
| 2 | idx 14–41 | 8 個（array 前四課 + hash-table 收尾 + string 開頭），quiz 55 題 | fable ×4 + opus reviewer ×1 | （本批） | `verify:phase` 8 道全過：article 8/8 ✓、quiz 合併 55 題、962 tests ✓、`validate:content` 641 筆 ✓、`gate:code` 330 區塊 ✓（142.6s） | 4 agent 並行；subagent 計數 fable 746K + opus 148K ≈ 894K tokens。reviewer 退修 4 篇（1 MAJOR / 3 MINOR），另因 quiz 簡體字檢查退修 1 次 |
| 3 | idx 7–48 | 9 個（programming-mindset 006–010 + string 003–006），quiz 72 題 | fable ×4 + opus reviewer ×1 | （本批） | `verify:phase` 8 道**一次全過**：article 9/9 ✓、quiz 合併 72 題、962 tests ✓、`validate:content` 641 筆 ✓、`gate:code` 330 區塊 ✓（148.4s） | subagent 計數 fable 1,009K + opus 187K ≈ 1,196K tokens。batch D 曾因 API 內容過濾中斷，檔案已寫出故恢復收尾、未重跑。reviewer 退修 8 篇（2 MAJOR / 6 MINOR） |
| 4 | idx 0–55 | 10 個（programming-mindset 001–005 + string 007–010 + two-pointer 001），quiz 76 題 | fable ×4 + opus reviewer ×1 | （本批） | `verify:phase` 8 道**一次全過**：article 10/10 ✓、quiz 合併 76 題、962 tests ✓、`validate:content` 641 筆 ✓、`gate:code` 330 區塊 ✓（137.7s） | subagent 計數 fable 1,060K + opus 173K ≈ 1,233K tokens。**reviewer 判定退修 0 篇**（F12 首次），僅順手修 3 項 MINOR |
| 5 | idx 56–69 | 10 個（two-pointer 002–010 + binary-search 001），quiz 82 題 | fable ×4 + opus reviewer ×1 | （本批） | `verify:phase` 8 道**一次全過**：article 10/10 ✓、quiz 合併 82 題、962 tests ✓、`validate:content` 641 筆 ✓、`gate:code` 330 區塊 ✓（136.4s） | subagent 計數 fable 1,244K + opus 181K ≈ 1,425K tokens。**reviewer 判定退修 0 篇**（連續第二批），僅順手修 2 項 MINOR |

## Phase 1 查證出的既有缺陷（逐項經主控獨立驗證）

- **Tomorrow Preview 與 Skeleton `next` 不符：14 篇中 13 篇錯。** 根因為 `Stage2PromptInput`
  **沒有 `next` 欄位**，prompt 也無 Tomorrow Preview 的內容指示——模型只能編一個聽起來合理的
  下一課，且無任何 Gate 判準檢查。**產線本身尚未修正**（見下方待辦）。
- **quiz 正解標錯／命題瑕疵 3 起**：
  1. `two-pointer-container-water` item[5]：「等高時同時移動兩端會漏解」為偽——窮舉
     203,276 組（含首尾等高 50,004 組）不一致組數為 0。
  2. `hash-table-sliding-window-distinct` item[0]：標定「先加入 Set、再判斷重複」，
     在 TS/Python 上不可實作（`add` 對重複為靜默 no-op），且與同卷 item[1]/[2] 矛盾。
     舊教材 Thinking 段有同一錯誤 ⇒ 錯誤自教材傳染至題庫。
  3. `hash-table-sliding-window-frequency` item[2]：標定「頻率歸零**必須**刪鍵」，
     與**同一課教材 Common Mistakes**「刪鍵是常見錯誤」正面矛盾；實際為策略相依，
     四個選項無一無條件成立。

## Phase 2 — array 前四課 + hash-table 收尾 + string 開頭（2026-08-29）

**流程**：runbook 於本批改版後首次實跑——4 個 Fable agent 並行寫教材與 quiz 片段 → 1 個 Opus
reviewer 讀內容做品質審查（不改檔）→ orchestrator 單一 `verify:phase` 收批 → commit。

**reviewer 判定**：可收，無 BLOCKER；退修 4 篇後全數通過。

| 篇章 | 嚴重度 | 問題 | 處置 |
| --- | --- | --- | --- |
| `string-linear-scan` | MAJOR | 「`s[i]` 賦值靜默失敗」錯述——本專案為 TS + ESM，ES module 恆為 strict mode，實為擲 `TypeError`；錯述散布於 Common Mistakes、Digest、quiz item[2] 三處 | 退回原作者，三處同步改正 |
| `array-memory-layout` | MINOR | TS Tip 斷言全為常數事實（`2*4===8`），程式碼寫錯也不會失敗 | 改為以 `offsetOf()` 函式結果對 TypedArray 實測 `byteLength` 反驗 |
| `string-ascii-representation` | MINOR | 「銜接前一課的雜湊表觀念」指涉錯課（三 Track 的前一課皆為 LRU Cache） | 改為不指涉課序的寫法 |
| `hash-table-design-lru-cache` | MINOR | exit criteria 要求 eviction，兩段程式碼只示範 relocation | TS Tip 改寫為含容量上限與淘汰路徑，斷言驗「被淘汰的是最久未使用者」 |

**跨篇一致性**（reviewer 專項查核）：Prefix Sum 索引慣例處理得比要求更好——`array-prefix-sum-basic`
用對齊式並在正文預告 `array-range-sum-query` 會改補零式、明說兩者只差索引位移且數學等價；後者先以
對齊式 `P[R]-P[L-1]` 論證差分正確性（兌現 exit criteria）再切換到 `P[R+1]-P[L]`，正文／Digest／
程式碼／quiz 四者同步，且每道 quiz 題幹皆明示採用哪種慣例。課序銜接無斷層亦無重疊。

**D1 已無殘留**：Tomorrow Preview 對 Skeleton `next` **8/8 全數命中**（`next` 為空的 LRU 正確寫成
收尾語且未點名 Concept）。此為 `cf85cce` 修好 Stage 2 prompt 後的首批驗證——對照 Phase 1 的 13/14 錯誤，
修復有效。惟本批 8 篇的**舊**教材仍有 7 篇 Preview 錯誤，與 Phase 1 的樣態一致。

## Phase 2 查證出的既有缺陷

- **quiz explanation 的系統性壞資料**（新發現，非單篇失誤）：
  - `hash-table-longest-consecutive-sequence` items[2]–[7] 共 6 題的 `explanation[4]` 是產線洩漏的
    **學習目標句**，而非該錯項的解釋。
  - `hash-table-design-lru-cache` 全部 8 題的 `explanation[0]` 是**正解選項逐字複製**，而非結論句。
  - 兩者皆已在本批重寫時修正；產線層面見 `pipeline-defects.md` D6。
- **quiz 命題瑕疵**（answerIndex 皆正確，16+16 題逐題驗過無正解標錯）：
  - `array-prefix-sum-basic` item[2] 把「`P[0]` 設為 0」判為錯，僅在對齊式慣例下成立，
    與 `array-range-sum-query` 教材實際採用的補零式直接矛盾。
  - `array-range-sum-query` item[1] 的 `explanation[1]` 把「漏掉最左元素」歸因於 `P[L]-P[R]`，
    解釋對象講錯。
  - `string-linear-scan` item[1] 干擾項「布林旗標初始化為真」實為可辯護的正確做法（題目模稜兩可）。
  - `array-linear-scan` item[4] 以「唯讀」為原則的立意過度絕對（原地修改當前元素是合法操作），
    僅靠干擾項荒謬才成立。
- **教材殘骸**：LaTeX 殘留（`array-memory-layout` 的 `$P + (i \times S)$` 會渲染成亂碼、
  `string-linear-scan` 的 `$O(n)$`）、機器翻譯錯譯（「在分析演化時」「大量數額計算」「演習策略」）、
  中國用語「指針」、TS Tip 程式碼在 `noUncheckedIndexedAccess` 下無法編譯、
  永不觸發的死斷言（`s[i] === ""` 永假、寫在 `return true` 之後的路徑）。全數於重寫時清除。

## Phase 3 — programming-mindset 006–010 + string 003–006（2026-08-29）

**分派原則（Phase 2 教訓的應用）**：Phase 2 查出 prefix sum 的索引慣例是跨篇矛盾的高風險處，
故本批**刻意把成對的課派給同一個 agent**——Two Pointers 對（003–004）給一人、
Sliding Window 對（005–006）給一人，並在 prompt 直接點名要防的慣例衝突。
programming-mindset 五課因超過單 agent 負荷而切成 006–008 / 009–010。

**結果**：兩條鏈被切開的**跨 agent 交界**（008→009、004→005）經 reviewer 專項查核**均無不一致**。
004→005 是事前判定風險最高處，實測是全批處理最好的一處：005 開頭即釘死閉區間慣例，
005/006 的慣例句逐字一致，「迴圈不變式」譯法自 003 貫穿至 006。**成對分派有效。**

**reviewer 判定**：無 BLOCKER，9 篇可收；退修 8 篇（2 MAJOR / 6 MINOR）後全數通過。

| 篇章 | 嚴重度 | 問題 |
| --- | --- | --- |
| `string-two-pointers-filtering` | MAJOR | Python Tip 引言宣稱示範 `isalnum()` / `lower()`，程式碼零過濾邏輯——**與作者自己在 findings 指認的舊缺陷同型，新版未真正修掉** |
| `string-sliding-window-fixed` | MAJOR | Common Mistakes「未滿 k 比對會產生假陽性」不成立（計數總和 < k 永不匹配，只是白做工），且已傳染至 quiz `explanation[3]` |
| `spacetime-tradeoff-awareness` | MINOR | 五課中唯一未回指 prerequisite；複雜度標籤與 Common Mistakes 版面與 006–008 不一致 |
| `error-driven-refinement` | MINOR | Python Tip 說「往上追呼叫堆疊」，程式碼是單層呼叫 |
| `edge-case-enumeration` | MINOR | TS Tip 引言說 optional chaining 但只有 `??`；`average([]) === 0` 正是本篇批評的「不崩潰但答錯」 |
| `loop-invariant-thinking` | MINOR | Complexity 把 O(n) 歸因於「進展支柱」——進展保證的是終止，不是線性 |
| `problem-simplification-strategy` | MINOR | TS Tip 說驗證長度 2、3，斷言只有 1 與 3 |
| `string-two-pointers-opposite` | MINOR | Digest 無條件宣稱 O(1) 空間，但書只在正文 |

**Digest 過短**：006/007/008 原為 125／137／126 字元（其餘六篇 190–240，上限 900）。
reviewer 逐項對照 exit criteria 確認**未漏重點**，判為 MINOR、不構成退修理由——
問題是「只給規則、不給錨點」。因該批本就要重開，順帶各補一句實例，改後為 176／193／157。

**D1 狀態**：Tomorrow Preview 對 `next` **9/9 全數命中**（Phase 2 為 8/8）。
惟本批 9 篇的**舊**教材中，A、B 兩批負責的 5 篇 Preview **全部錯誤**，樣態與 Phase 1、2 一致。

**batch D 的 API 中斷**：batch D 在收尾階段因 API 內容過濾政策而終止。查證後確認
**兩篇 article 與兩份 quiz 片段皆已寫出**，故以 SendMessage 恢復該 agent 只補跑驗證與 findings，
未重跑生成。此為「中斷不退費」情境下的正確處置——先查磁碟狀態再決定救或重跑。

## Phase 3 查證出的既有缺陷

- **首次確認的 quiz 正解標錯**（Phase 1、2 逐題驗過 48 題皆無）：
  `string-two-pointers-opposite` item[1] 的 `answerIndex` 指向 `<=`，但該題 explanation 自述
  「通常設定為 `left < right`」自相矛盾，且駁斥 `<` 的理由「會漏掉奇數長度中央字元」為偽——
  中央字元與自己比對恆真，不需比。正確答案應為 index 1。
- **D4 樣態再現兩例**：`error-driven-refinement`（8/8）、`string-sliding-window-variable`（9/9）
  的 `explanation[0]` 皆為正解選項逐字複製。詳見 `pipeline-defects.md` D4。
- **課綱層配題重複**（新增 D7）：`hash-table-sliding-window-frequency` 與
  `string-sliding-window-fixed` 用同一題 438、同一組測資、同一條不變式教同一件事，
  且前者多教了 matched 計數器，後者反而只教整表比對。**不屬 F12 範圍，需動 `curriculum/`。**
- **教材殘骸**：LaTeX 殘留（`problem-simplification-strategy` quiz 的 `$k$`）、
  亂譯詞（「字安格斯群組化雜湊」＝ anagram 音譯）、簡體字「额」、
  中國用語「指針」「遞歸」「越界訪問」、錯字「演邏輯」「家目錄」、
  斷言只對特定輸入成立的假測試（`assert max_val == 5` 寫在函式內）。全數於重寫時清除。

## Phase 4 — programming-mindset 001–005 + string 007–010 + two-pointer 001（2026-08-29）

**reviewer 判定：10 篇全數可收、退修 0 篇，無 BLOCKER 亦無 MAJOR。** F12 至今首次。

品質提升可歸因於 Phase 4 起在 agent prompt 明列**前三批反覆出現的四種樣態**
（引言說 A 程式碼做 B、死斷言、教材示範自己批評的做法、Digest 只給規則不給錨點）。
reviewer 逐一驗算 20 個 code block 確認**新版未重蹈死斷言覆轍**，且多數斷言正對著該課點名的失誤
（`isLeap` 把 `% 4` 提前會真的失敗、拿掉 RLE 收尾即失敗、刪掉任一條去重 while 就回傳重複組合）。

### 6 項 MINOR 的處置（3 修 3 不修）

| 項目 | 處置 | 理由 |
| --- | --- | --- |
| `string-pattern-matching-basic` 686 的 Hint 漏了無解（-1）的可能 | **修** | 事實不完整的 Hint，學員照著推會漏掉無解情形（見 D9） |
| `tracing-execution-flow` 全批唯一未回指先修，且落在跨 agent 交界 | **修** | 一句話的成本 |
| `string-anagram-grouping` TS 斷言未覆蓋正文最強調的 join 分隔符陷阱 | **修** | 斷言沒驗到教材自己強調的點＝白測（見 D8） |
| `two-pointer-three-sum-basic` TS Tip 只示範 `sort()` 陷阱、演算法全靠 Python Tip | 不修 | 需重寫整段 TS Tip，代價與收益不成比例 |
| `tracing-execution-flow` quiz item[9] 輕微前傾 | 不修 | reviewer 判定可由追蹤表直接推得，不算超綱 |
| `computational-thinking-basics`「任務演化」用詞不自然 | **不能修** | 源自 Skeleton 的 `exit_criteria`；F12 MUST NOT 動 `concepts/**`（見下方待辦） |

**判準**：每次退修都是一次完整 agent 回合，Phase 3 就是被 8/9 篇的退修率推高到每 Concept
0.67 個百分點（Phase 1+2 為 0.41）。故 MINOR **只修「錯的」與「白測的」**，不修「可以更好的」。

### 三個交界的結論

- **003→004**（跨 agent）：術語（盒子／快照）銜接得上，無事實衝突；唯一缺口是 004 未回指 003，已修。
- **008→009**（跨 agent）：本批品質最高的交界。009 主動把兩課接起來（中心擴展枚舉回文中心 vs
  枚舉匹配起點，驗證器不同、骨架一致），複雜度記帳亦不互相矛盾。
- **跨 Phase 005→006、006→007**：reviewer 比對的是 Phase 3 定稿檔案的**實際內容**而非標題，
  兩處皆相符。

**D1 狀態**：Tomorrow Preview 對 `next` **10/10 全數命中**。舊教材則有 **9 篇預告錯誤**
（001 預告不存在的課、002 預告憑空的課、010 在 `next: []` 下仍預告明日課程…），樣態與前三批一致。

## Phase 4 查證出的既有缺陷

- **quiz 正解標錯（第二例）**：`string-palindrome-expansion` item[7] 的 `answerIndex` 指向
  「指標跳躍整併中心區段」，但正確描述（向外擴張至不同字元終止）被列為錯項且無任何解釋；
  同篇 item[4] 的 `explanation[3]` 解釋的是正解、某個錯項完全沒被解釋（結構壞損）。
- **一題兩解**：`string-pattern-matching-basic` item[6] 因題幹歧義而有兩個可辯護的答案。
  作者原判為正解標錯，**reviewer 獨立複核後判定較輕**，本紀錄採 reviewer 的保守判定。
- **誤導性 Hint**（新增 D9）：舊版 `two-pointer-three-sum-basic` 對 Two Sum 教
  「排序搭配相向雙指標」，但該題要求回傳**原始索引**，排序會打亂索引——此法解不了該題。
- **死斷言全面存在**（新增 D8）：`gate:code` 只驗「能跑且不拋錯」，**永真斷言完美通過**。
  舊教材實例涵蓋函式永遠回傳 true、斷言硬編在函式本體、寫在 `return` 之後、條件永假、
  常數事實斷言五種樣態。
- **D4 樣本擴大到 14 個 Concept／4 模組／3 個 Phase**：本批 10 卷舊題庫**全部**是
  `explanation[0]` 逐字複製正解選項，無一例外。

## 待辦（不屬 F12 範圍）

- **Skeleton 用詞**：`computational-thinking-basics` 的 `exit_criteria` 使用「任務演化」，
  用詞不自然並傳導至教材。修正 MUST 動 `concepts/**`，F12 明訂 MUST NOT 觸碰——
  待 F12 結束後另立任務。
- **D6 的統一收斂**：見 `pipeline-defects.md` D6 的「F12 修不掉這一條」——
  MUST 待 F12 全部跑完後以一次機械替換處理，MUST NOT 在個別批次零星修補。

## Phase 5 — two-pointer 002–010 + binary-search 001（2026-08-29）

**reviewer 判定：10 篇全數可收、退修 0 篇，無 BLOCKER 亦無 MAJOR**（連續第二批）。

本批是 two-pointer 的**正確性論證重頭戲**，故 reviewer 首次被授權**執行只讀的驗算腳本**——
純讀文字判斷不了「等高同移是否漏解」這類命題。實測證明這個授權是對的：
reviewer 抽驗 **13 段程式碼、施加 28 種針對性變異並實際執行**，僅一項存活
（而那正是教材主動宣告為等價、且經窮舉證實的變體，屬正確知識而非死斷言）；
另對四支演算法做對照暴力法窮舉（valid palindrome II 29,524 組、boats vs bitmask DP 97,650 組、
backspace 1,194,649 組、parity 87,381 組），不一致全為 0。

### 偽命題的三次證偽與正面改寫

「等高時同時移動兩端會漏解」此命題**為偽**，至此已被獨立窮舉三次：

| 來源 | 測資組數 | 首尾等高 | 不一致 |
| --- | --- | --- | --- |
| Phase 1 查證 | 203,276 | 50,004 | **0** |
| Phase 5 作者重驗 | 335,916 | 55,986 | **0** |
| Phase 5 reviewer 複驗 | 97,650 | 19,530 | **0** |

**作法**：orchestrator 在 agent prompt 附上既有結論與窮舉數據，並明令
「若你的推導得出不同結論，MUST 先窮舉驗證再下筆」。作者**自己重跑了一次更大範圍的窮舉**
才據以改寫——這是正確的：給的是既有結論，驗過才採信。
新版 004 在 Thinking／Common Mistakes／Digest／quiz item[4] 四處一致，
並把「以為同移會漏解」本身**反轉成教學點**列為常見誤解。

### 2 項 MINOR 的處置（依 Phase 4 定下的判準：只修「錯的」與「白測的」）

| 項目 | 處置 |
| --- | --- |
| `binary-search-core-concept` 對 34 的 Hint 未提無解回 `[-1, -1]`（同篇 704 已明寫回 -1） | **修**（D9 類） |
| `two-pointer-container-water` 是同模組唯一未交代為何用 `left < right` | **修**（沿用模組共同判準「相遇那一格需不需要被處理？」） |
| `binary-search-core-concept` 可補半句銜接前一課的 `left < right` | 不修（reviewer 自標為加分項；Common Mistakes 已用 `nums=[5]` 反例講清差異） |
| 兩篇 Python Tip 各有一處刻意簡化的未防護邊界 | 不修（正文均已如此定位） |

### 兩套邊界慣例（two-pointer `<` vs binary-search `<=`）

reviewer 專項查核結論：**不會混淆，是本批處理得最好的一件事。**
這不是「two-pointer 一律 `<`」的二分——模組內 005、006 本來就用 `<=` 且各有理由
（要結算相遇格／最後一人也要一艘船）。教材已把判準統一到同一個問題：
**「相遇那一格需不需要被處理？」** binary-search 001 再抽象成「區間定義、迴圈條件、
更新方式三者必須成套」，並以 `nums=[5]` 找 5 的反例示範閉區間配 `<` 會錯回 -1，
TS Tip 還放了 `binarySearch([5], 5)` 這條斷言守著它。

**D1 狀態**：Tomorrow Preview 對 `next` **10/10 全數命中**；舊教材則有 **9 篇預告錯誤**。

## Phase 5 查證出的既有缺陷

- **一個被死斷言完美掩蓋的真 bug**（D8 的最佳例證）：舊 `two-pointer-valid-palindrome-ii`
  的 Python Tip 把 `return True` 誤縮排進迴圈，`"abcdefba"` 會被誤判為回文——
  而斷言只驗 `"aba"`，剛好蓋住。`gate:code` 跑得過、斷言不拋錯、程式碼是錯的、教材在教錯的東西。
  reviewer 已確認新版把該縮排改壞後，`assert valid_palindrome_ii("abcda") is False` 會立即失敗。
- **憑空捏造的 Common Mistakes**（新增 D10）：三個 Concept 的「常見錯誤」經窮舉證偽，
  其中 `two-pointer-trapping-rain-water` 更是**同篇程式碼用的正是它指控的寫法**。
- **quiz 正解標錯（第三例，且比前兩例更糟）**：`two-pointer-container-water` item[5]
  不只正解標在偽命題上，而是**原四個選項無一正確**——正確答案根本不在選項裡。
- **一題事實不通**：`two-pointer-four-sum-extension` item[7] 題幹稱「右指標自左而右移動」，
  與相向夾擠的實際方向相反，explanation 亦自相矛盾。
- **答案對、理由錯**：`two-pointer-backspace-string-compare` item[7] 正解的機制描述
  與其舉例（`#a`）不符——開頭 `#` 根本沒有可略過的字元。
- **D4 樣態持續**：`two-pointer-trapping-rain-water` 舊卷 7/7 題 `explanation[0]` 為正解逐字複製。
- **殘骸**：「Container WithMost Water」「指子」「指針」、weight 誤作「體積」、多題 stem 超 60 上限。

## 待辦（不屬 F12 範圍，新增）

- **D11：114 個 Concept（69%）的 `exit_criteria` / `learning_goal` 是英文**，
  而 Exit Criteria 是 Discord 的獨立推播區塊，會原樣推給中文學習者，牴觸 spec §11。
  修法在 `concepts/**`，F12 MUST NOT 觸碰。**需使用者裁定三個選項之一並落地到 `docs/spec.md`**，
  詳見 `pipeline-defects.md` D11。

## 插入工作 — Exit Criteria / Learning Goal 語言合規（2026-08-29）

**不是 Phase**：這是在 Phase 5 收批後、Phase 6 開跑前插入的一次性修復，範圍是 `concepts/**`
的兩個文字欄位，與逐 Phase 的教材重生無關。

### 起因與查證

Phase 5 的 Opus reviewer 回報「114 個 Concept 的 `exit_criteria` 是英文，會直接推播給中文學習者」。
主控查證後推翻了兩個先前的說法：

1. **不是設計決策**。spec §10.2 原本寫「`exit_criteria` 為英文完整句子（§11）」——那是 F7 **由部分
   樣本歸納**，實際只有 69% 為英文，另 31% 是中文，且分布是**模組層級的全有全無**。
2. **根因是 Stage 1 的 prompt 沒有指定語言**。該 prompt 有 8 條編號 MUST 規則，**沒有一條講語言**；
   欄位範例雖是中文，但**範例不是規則**，模型逐批自行決定。
   `concepts/**` 自生成後**從未被手改**（唯一的修改 commit 是 102 行純新增的題號與 Author Hints）。

### 處置（憲章修訂 → 修根因 → 翻譯 → 補 Gate）

| 步驟 | 內容 | 額度 |
| --- | --- | --- |
| 1 | 憲章 **v1.1.0 → v1.2.0**：XVII 新增 `2-2` 例外之例外，窄範圍授權翻譯此二欄位；**把「MUST 同時修正 Stage 1 的 prompt」列為授權成立條件 (iv)** | 0 |
| 2 | `stage1-curriculum.ts` 新增規則 8（語言），附 114/165 的實測證據與「MUST NOT 只靠範例暗示」 | 0 |
| 3 | 4 個 Fable agent 並行翻譯 114 個 Skeleton（22 / 31 / 31 / 30） | 約 2 個百分點 |
| 4 | `sync-article-exit-criteria.ts` **腳本**回填 114 篇 Article frontmatter | 0 |
| 5 | `article-gate.ts` 補逐字比對 Gate + 6 項單元測試 | 0 |

**步驟 4 刻意用腳本而非 agent**：機械複製的正確結果唯一且可驗證，派 agent 會改寫措辭、
破壞「逐字一致」這個 Gate 條件，且要燒額度。

### 主控獨立驗證（未採信 agent 自述）

- 114 個 Skeleton：**結構欄位 0 改動、Author Hints 正文 0 改動、條數 0 改變**（逐檔對照 HEAD）。
- 165 個 Concept：全數繁中、無簡體字、符合上限。
- 全庫四關：`npm test` 107/107 檔、`validate:content` 641 筆、`sync --check` 一致、
  `gate:articles --all` 全數通過。

### 預算反而更寬鬆

`exit_criteria` 單條最長 **107 → 70**（上限 110）、合計最長 **197 → 90**（上限 400）。
spec §10.2 已註明 MUST NOT 因此把單條上限調回 60。

### 回填範圍是 114 篇而非 21 篇

推播讀的是 **Article** 的 frontmatter，而回填是零額度的腳本——因此一次補滿全部 114 篇，
**推播端立刻全部改善**，不必等剩下 13 個 Phase 跑完。尚未重生的 93 篇正文品質問題依然存在，
翻譯不會順便修好它們。

### 新增缺陷紀錄

- **D12**：Article 與 Skeleton 的 `exit_criteria` 有兩份副本卻無 Gate 比對（已修）。
- **D13**：`scripts/lib/prompts/**` 是 template literal，寫入反引號會靜默截斷字串。
  本次踩到——`gate:articles` / `validate:content` / `gate:code` **全都不會發現**，
  只有 `npm test` 的**檔案載入失敗**會，而它顯示成「1 failed / 0 tests failed」，
  真正的訊號是**測試總數少了 37**。紀律：改 prompt 後 MUST 跑 `npx tsc --noEmit`。
- **D11 已標記為修復**，並存查 7 條「翻譯時發現、但依『僅限語言合規』刻意未改」的原文問題
  （文法錯誤、寫死 JS 語法、RPN 與 operator precedence 的語意矛盾等），待另立任務處理。
