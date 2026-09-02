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
| 6 | idx 70–83 | 9 個（binary-search 002–010），quiz 61 題 | fable ×4 + opus reviewer ×1 | （本批） | `verify:phase` 8 道**一次全過**：article 9/9 ✓、quiz 合併 61 題、962 tests ✓、`validate:content` 641 筆 ✓、`gate:code` 330 區塊 ✓（137.1s） | subagent 計數 fable 1,258K + opus 209K ≈ 1,467K tokens。**reviewer 判定 0 BLOCKER / 0 MAJOR**（連續第三批），修 2 項 MINOR。用量 39%→45%（0.67／Concept） |
| 7 | idx 84–97 | 9 個（sliding-window 001–009），quiz 64 題 | fable ×4 + opus reviewer ×2（第一個因事故作廢） | （本批） | `verify:phase` 8 道全過：article 9/9 ✓、quiz 合併 64 題、962 tests ✓、`validate:content` 641 筆 ✓、`gate:code` 330 區塊 ✓（145.0s） | **牆鐘 96 分鐘，其中約 40–45 分是 D14 事故損耗**（對照 Phase 6 約 48 分）。reviewer 判定 0 BLOCKER / 0 MAJOR，修 7 項 MINOR |
| 8 | idx 98–111 | 10 個（sliding-window 010 收官 + stack 001–009），quiz 75 題 | **新制首批**：fable ×6 + opus reviewer ×2（隨交件輪派） | （本批） | `verify:phase` 8 道通過（第一輪在步驟 b 被 `quiz-option-prefix` 擋下 1 題——「A、B、D」型選項，重寫為數字標籤後全過）：article 10/10 ✓、quiz 合併 75 題、tests ✓、`validate:content` ✓、`gate:code` ✓（138.4s） | subagent 計數 fable ×6 ≈ 744K + opus ×2 ≈ 343K ≈ 1,087K tokens（fable 端 74K/Concept，低於舊制的 ~125K）。reviewer 判定 **2 MAJOR**（009 對先修課 008 的對照講反、010 失效形式寫反）＋ 10 餘項 MINOR，退修均一輪完成。**發生一次派件無聲卡關**（reviewer A 停機時佇列訊息不喚醒，靠使用者發現、手動補喚醒），據此改制為 1 對 1 即拋即審（見 runbook）。用量 56%→67%（**1.1／Concept**，詳見 runbook 2026-09-01 校準） |
| 9 | idx 112–125 | 9 個（queue 001–007 + stack 010–011），quiz 64 題 | **1 對 1 制首批**：fable ×6 + opus reviewer ×6（每交件即開、審完即關） | （本批） | `verify:phase` 8 道**一次全過**：article 9/9 ✓、quiz 合併 64 題、tests ✓、`validate:content` ✓、`gate:code` ✓（133.4s） | subagent 計數 fable ≈ 700K + opus ×6 ≈ 665K ≈ 1,365K tokens。reviewer 判定 **1 MAJOR**（010 兩處事實錯誤）＋ 5 件 MINOR，退修均一輪完成、突變全 KILLED。作者 E 曾被內容過濾中斷、恢復收尾成功。**零卡關**。用量 67%→75%（**0.89／Concept**） |
| 10 | idx 126–139 | 9 個（linked-list 001–006 + queue 008–010），quiz 64 題 | fable ×6 + opus reviewer ×6（1 對 1 即拋即審） | （本批） | `verify:phase` 8 道**一次全過**：article 9/9 ✓、quiz 合併 64 題、tests ✓、`validate:content` ✓、`gate:code` ✓（132.5s） | subagent 計數 fable ≈ 796K + opus ≈ 597K ≈ 1,393K tokens。reviewer 判定 **4 MAJOR**（002 的 876 Hint 洩漏第 6 課、002 quiz 在 strict TS 下的假命題、004 因果錯置、009 的 994 收尾條件）＋ 18 項 MINOR，退修均一輪完成。**零卡關**。用量 75%→83%（**0.89／Concept**，與 Phase 9 同值） |
| 11 | idx 140–153 | 10 個（linked-list 007–012 + tree 001–004），quiz 69 題 | **就地修制首批**：fable ×6 + opus reviewer ×6（1 對 1，findings 就地修，Fable 交件即關） | `8a249b8` | `verify:phase` 8 道全過（`gate:code` 310s） | subagent 計數 fable ≈ 630K + opus ≈ 700K ≈ 1,330K tokens。reviewer 判定 **1 BLOCKER + 3 MAJOR** + 9 MINOR，全部就地修。零卡關、零退修回合。用量 0%→6%（**0.60／Concept**） |
| 12 | idx 154–167 | 9 個（graph 001–002 + tree 005–011），quiz 57 題 | fable ×6 + opus reviewer ×6（就地修） | `d9fb233` | `verify:phase` 8 道**一次全過**（`gate:code` 137.9s） | subagent 計數 fable ≈ 531K + opus ≈ 719K ≈ 1,250K tokens。reviewer 判定 **7 MAJOR**（0 BLOCKER）+ 14 MINOR，全部就地修。用量 6%→12%（**≤0.67／Concept**，含跨專案污染） |
| 13 | idx 168–181 | 9 個（graph 003–010 + heap 001），quiz 66 題 | fable ×6 + opus reviewer ×6（就地修；派件首次帶 D7 清單） | （本批） | `verify:phase` 8 道**一次全過**：article 9/9 ✓、quiz 合併 66 題、tests ✓、`validate:content` ✓、`gate:code` ✓（135.5s） | subagent 計數 fable ≈ 914K + opus ≈ 960K ≈ 1,874K tokens。reviewer 判定 **1 MAJOR**（0 BLOCKER）+ 19 MINOR，就地修 16 項。零卡關、零退修回合 |
| 14 | idx 182–195 | 10 個（heap 002–010 + backtracking 001），quiz 69 題 | fable ×6 + opus reviewer ×6（就地修；派件帶 D7 清單） | （本批） | `verify:phase` 8 道**一次全過**：article 10/10 ✓、quiz 合併 69 題、tests ✓、`validate:content` ✓、`gate:code` ✓（133.8s） | subagent 計數 fable ≈ 997K + opus ≈ 1,099K ≈ 2,096K tokens。reviewer 判定 **6 MAJOR**（0 BLOCKER）+ 19 MINOR，就地修 21 項。reviewer 階段被使用者中斷，產物保全於 `.f12-wip/` 後續跑收批 |

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

## Phase 6 — binary-search 002–010（2026-08-29）

**reviewer 判定：9 篇可收，0 BLOCKER、0 MAJOR**（連續第三批）。

**分派依「概念配對」而非單純相鄰**：binary-search 是全課程最容易寫出「看起來對、實際差一」的模組，
故把 002 閉區間 ↔ 004 半開區間交給同一個 agent（兩種慣例 MUST 用同一套語彙對照）、
005 lower bound ↔ 006 upper bound 一組、007 旋轉 ↔ 008 旋轉含重複一組。
四個 agent 都被要求先讀 Phase 5 定稿的 001，沿用其「**區間定義、迴圈條件、更新方式三者必須成套**」框架。

### reviewer 首次大規模執行驗算（本批的關鍵作法）

授權 reviewer 跑只讀腳本後，它做的不是抽樣讀文字，而是**窮舉驗證**：

| 驗證對象 | 規模 | 結果 |
| --- | --- | --- |
| 002/004 終止狀態（閉區間 `left == right + 1`、半開 `left == right`） | 30,888 組 | 違反 **0** |
| 007 演算法正確性（對照暴力法） | 25,245 組 | 全對 |
| 007 判半論證、兩半值域不重疊 | 11,439 / 19,728 次 | 無反例 |
| 008 含重複值 | 4,950 組 | 全對 |
| 009 findMin | 2,295 組 | 全對 |
| **突變測試（全部 18 個 code block、20 個突變）** | 20 個 | **20/20 KILLED、0 存活** |
| 30+ 條 Common Mistakes 的反例 | 全部 | **實際重現**（含 5 處無窮迴圈以熔斷計數確認） |

**這是機械 Gate 永遠做不到的層次**：`gate:code` 只驗「能跑且不拋錯」，驗不了「這個論證是否為真」。

### 2 項 MINOR 的處置——都是 D10 在新教材裡復發

| 篇章 | 教材宣稱 | 實測 | 處置 |
| --- | --- | --- | --- |
| `binary-search-matrix-search` | 少寫 `Math.floor` 會「安靜地永遠為否」 | 兩層索引 `matrix[1.25][0]` **當場拋 TypeError** | 教材與 quiz 兩處同步改正 |
| `binary-search-inclusive-bounds` | 閉區間 `right = n` 在 JS「安靜讀到 undefined、比出錯誤結果」 | 窮舉 7,392 組錯誤結果 **0**，只是多白跑幾輪 | 改為真實後果，並保留 Python 拋 IndexError 的對照 |

**修法比原文更有教學價值**：同一個寫錯，**JS 是安靜做白工、Python 是直接爆**——
兩種語言的失效形式對照本身就值得講。作者**下筆前先自行窮舉 99 組驗證**才改寫，順序正確。

另 2 項 MINOR 不修：quiz `explanation[0]` 與正解語意重疊 0.71（已一併修）、
**inline code 反引號用量在交界處斷崖**（37–42 處 vs 3–5 處）——後者是全庫規模的版面問題，
與 D6 同類，**MUST 待 F12 跑完以腳本統一掃描**，零星修補只會製造新的不一致。

### 三個交界

004→005「三者成套」口訣**逐字同構**；006→007 是半開→閉區間的慣例回切，007 明寫「整套沿用第一課」
且 004 已預先鋪陳；008→009 是第二次切換，009 明寫「換了基準就重新配一套」並論證為何不能沿用 `<=`，
且 007 對 153 的 Hint 與 009 正文**逐字一致**。舊 010 的行列術語自相矛盾已根除
（全篇 m=列、n=欄、除數恆為欄數）。

**D1 狀態**：Tomorrow Preview 對 `next` **9/9 全中**（含 010 空 `next` 正確寫成收尾語）。
舊教材則有多篇預告錯課，其中 **009 預告的是「昨天的課」**（008），方向寫反。

## Phase 6 查證出的既有缺陷

- **quiz 正解標錯（第四例）**：`binary-search-rotated-duplicates` item[3] 宣稱「照搬無重複模板會
  指標停滯、陷入無窮迴圈」——偽。`mid ± 1` 更新下指標必前進，真正後果是**安靜漏解**
  （`[1,0,1,1,1]` 找 0 可重現），且**四個選項無一正確**。
- **整課建立在對語言的誤解上**：舊 `003-overflow-prevention` 把 TypeScript 說成固定位寬整數語言。
  JS 的 `Number` 是 IEEE 754 雙精度，陣列索引範圍內 `(left + right)` 根本不會溢位；
  **真正會溢位的是 `>> 1`**（先做 ToInt32）。舊 quiz 卻有一題宣稱「`>> 1` 不會增加溢位風險」，
  方向剛好相反——reviewer 獨立複核確認為事實錯誤，並補充 Java 的修法是無號 `>>>`、有號 `>>` 同樣救不了。
  同卷還有作者未發現的自相矛盾（item[3] 說溢位「崩潰」vs item[0] 說「安靜截斷」）。
- **D4 的第三、四種變體**（見 `pipeline-defects.md` D4）：
  **亂碼填充字串** `aspectpiicidv`（`aspect` 是 `quiz-aspects.ts` 的欄位名，研判為產線識別項洩漏）、
  **引述不存在的選項文字**。四種變體同指一個根因：`explanation` 各段職責從未被定義。
- **簡體字與中國用語**：舊 002 quiz 選項含「空间」、item[0] 用「指針」。

## Phase 7 — sliding-window 001–009（2026-08-29 ～ 08-30）

**reviewer 判定：9 篇可收，0 BLOCKER、0 MAJOR**（連續第四批）；7 項 MINOR 全數修畢。
事實面複核結果：**Common Mistakes 25 條逐條手算全部成立、8 條 Hint 全對、Tomorrow Preview 9/9**
——D1 / D9 / D10 均無復發。

### ⚠️ 本批發生 D14 事故（詳見 `pipeline-defects.md`）

第一個 reviewer 被授權執行驗算腳本，其突變測試在 Windows 上漏出 **10 個孤兒行程**，
11 分鐘內累積 **約 77 分鐘 CPU、壓滿約 7 個核心**。**由使用者發現並反映**，非任何既有機制攔下。
處置：終止行程 → 停掉該 reviewer → 改派**純閱讀 reviewer**（零執行權）重做。

**對照組證明執行權的收益遠不如想像**：純閱讀的 reviewer 仍查出 7 項 MINOR 並手算複核 25 條
Common Mistakes；而 Phase 2、4 的 reviewer 本來就沒有執行權，一樣抓到 MAJOR 並判定準確。
**執行權是 Phase 5 才加的，此後改為預設不給。**

需要實跑的命題改由 **orchestrator 自己驗**（單一腳本、全域操作熔斷、規模上限、不開子行程）：

| 命題 | 測資 | 結果 |
| --- | --- | --- |
| 攤銷 O(n)（內層 while 總步數 ≤ n） | 3,279 組 | 違反 **0**，最大比值 0.857 |
| **最長型**用 `if` 取代 `while` | 9,837 組 | 不符 **0** ⇒ 是正確的 non-shrinking window 技巧 |
| **最短型**（LC 209）用 `if` 取代 `while` | 21,840 組 | 不符 **8,784（40%）**；反例 `[1,3]` target=3 → 得 2、正解 1 |

**結論：`if` vs `while` 取決於題型。** 兩個作者的相反宣稱其實互補、且都正確——
B 批只把該誤區列在 004（最短型）、D 批在 007（最長型）主動避免誤指控，**兩邊處置都對**。
這是防 D10 的正面案例：**不確定就實測，實測不了就不要寫**。

### 7 項 MINOR 的處置

| 篇章 | 問題 | 修法 |
| --- | --- | --- |
| 004 | CM2「回傳 4」只對「只在收縮過才記錄」成立；最字面寫法回傳 1 | 改為「會得到 1 或 4，都不是正解 5」，不綁死單一數字 |
| 004 | Tomorrow Preview 說 005 用「頻率表＋逐格收縮」，實際是位置 map 一步跳 | 讀 005 後改正 |
| 005 | 說 LC 3「解過兩次」實為三次；自稱的「第三種寫法」是 `string/002` 的 Hint 已點名者 | 改為「已見過三次」＋「把該 Hint 的想法完整實作並論證」 |
| 006 | CM1 的「掛死」只對 TS 的 zeros 寫法成立 | 兩種失效形式並列（zeros 版掛死、ones 版安靜算錯），皆實測 |
| 007 + 008 | 術語「變動視窗」與全批及先修課的「可變視窗」不一致（5 處） | 統一 |
| 008 | TS `L9`、PY `L12`/`L15` 斷言覆蓋缺口 | 替換測資（TS Tip 786→783，**替換非新增**） |
| 009 | TS Tip 僅一組退化測資，三個非等價突變體存活 | 換成 `findAnagrams("axbxab","ab") === [4]`，單組覆蓋四類突變（795→788） |

### 跨模組定位（D7）

**008（LC 567）與 009（LC 438）完全誠實**——開篇具名承認先修課教過、指出唯一增量，
且**沒有一篇教得比先修課粗**。唯一破口是 005 把 LC 3 的前科少算一次，已修。
本批開跑前另做了全庫配題普查（44 個共用題號，跨模組 21 個），結果併入 D7。

### 課綱層新發現（F12 動不了，需另立任務）

`string-sliding-window-variable`（**session 63**）的 Complexity 段已給出「每元素進出各一次 ⇒ 攤銷 O(n)」，
而 `sliding-window-concept-intro`（**session 114**）才「首次引入」同一個論證——
**模組開場課比它要教的東西晚了 51 個 session 出現**。這不是配題重複，是**模組排序**問題。

## Phase 7 查證出的既有缺陷

- **quiz 正解對本題不成立（最嚴重的一類）**：`max-consecutive-ones` 舊 item[0] 與 item[2]
  教「長度 − maxFreq ≤ k」——那是「最多可替換 k 個字元」的通用判準，但本題只允許 0→1。
  反例 `[0,0,0,1]`、k=0：該式得 3、正確 1。正確判準是 `zeros ≤ k`。
  **這是把另一道題的解法搬來當本題正解**，前幾例都只是選項或理由寫錯。
- **quiz 正解標錯（第六例）**：`variable-size-contraction` 舊 item[3] 標「必須在 while 結束後才更新」，
  對最短型不成立（實測 `target=11, [2,3,1,2,4,3]` 回傳 4，長度 4 的達標視窗不存在，正解 5），
  且與同課正文自相矛盾。
- **攤銷複雜度被說反**：`longest-substring-no-repeat` 舊 item[2] 稱逐格收縮「最壞退化為平方級別」——
  實際攤銷仍 O(n)。
- **失效形式寫反（D10）再兩例**：`fixed-size` 舊版說 `n < k` 會「程式碼崩潰」（實測 Python 切片與
  JS 索引都安靜算錯）；`fruit-into-baskets` 舊版說「不刪鍵」會「安靜誤判」（實際是收縮停不下來）。
- **韓文亂碼**：`longest-substring-no-repeat` 舊 item[6] 的 explanation 混入「常수의」。

## Phase 8 查證出的既有缺陷

- **Tomorrow Preview：10 篇中 9 篇錯或不當**（001/002/003/004/005/006/008/009/010 直接指向錯課或違反
  `next`；007 籠統但未違規）。D1 樣態的又一次全面重演。
- **既有 quiz 雙正解 3 起**：`stack-asteroid-collision` item[5]（「新元素為正且頂端非正」也是充分免碰撞
  條件，explanation 的駁斥在事實上錯誤）、`stack-evaluate-reverse-polish-notation` item[0]、
  `stack-remove-adjacent-duplicates` item[4]（「從堆疊底部依序取出串接」正是標準做法，與同課 Tip 矛盾）。
- **詳解事實錯誤**：`stack-array-implementation` item[5] 把常數增量擴容的攤銷成本寫成「O(n平方)」
  （正確：攤銷 O(n)，總量才是 O(n^2)）。
- **不變式寫錯**：`stack-daily-temperatures` 舊版稱堆疊「嚴格遞減」——彈出條件是嚴格小於，相等溫度
  可共存，實為非嚴格遞減。
- **D4 樣態大面積存在**：001/005/006/009 等課的既有 quiz `explanation[0]` 逐字複製正解選項。
- **Tip 與 pattern 脫鉤普遍**：003 只是泛用 Stack class 包裝、005 完全沒有 RPN 實作、007 是無關玩具碼、
  009 斷言只驗前兩筆（從未觸發 span 累加路徑）。
- **錯字**：「巡員」×2（002 quiz）、「演習」（009 quiz）、「更階層資料結構」（002 正文）、
  「隕石」對 asteroid 的不精確譯名（004）。

### 新制（6 Fable + 2 Opus 輪派）首批觀察

- reviewer 與寫作重疊進行有效；但**派件依賴 SendMessage 續用 context 是卡關熱區**：訊息在對方停機
  瞬間送出時只入佇列、不喚醒（回應顯示「queued for delivery」而非「Resuming」即為此況），
  reviewer A 因此無聲閒置約 15 分鐘，由使用者發現。已改制為「每交件即開新 reviewer、審完即關」（1 對 1）。
- reviewer 交辦主控的實跑命題，改由**退修時要求原作者附帶驗證**（含不終止變體 MUST 加步數熔斷的
  D14 防護）運作良好——本批 6 項命題全數由作者實測回覆，主控僅補跑 quiz 腳本一次。

## Phase 9 查證出的既有缺陷

- **Tomorrow Preview：9 篇中 8 篇錯**（001 跳課預告 BFS、002 預告不在 `next` 的環形緩衝區、003/004/007
  指錯課、006 方向整個顛倒指回昨天、010 預告課綱不存在的「Subarray Ranges」、011 `next: []` 卻預告
  LC 85；僅 005 原本正確）。
- **既有 quiz 重大缺陷**：005 item[0] 四選項無一無條件成立（標定正解描述的是「每次出隊都搬移」的錯誤
  演算法，缺「僅當 outStack 為空」要件）；006 item[5] 整題站不住（把最壞與攤銷混為一談、比較對象錯置），
  新版整題汰換；002 item[1] 選項含簡體「先进先出」；010 item[1]/[2] 正解選項機制寫反／自相矛盾；
  011 item[2] 詳解「每根等高柱都能正確計算最大寬度」為事實錯誤。
- **D4 樣態擴及 queue 模組（第 5 個模組樣本）**：003 全 8 題、004 幾乎每題的 explanation[0]
  為正解選項逐字複製。
- **Tip 與主題脫鉤依然普遍**：003 未示範 enqueue/dequeue 本體、004 只斷言陣列長度為 3 的佔位碼、
  005 無關 helper、007 的 sumQueue 與層長快照無關、010/011 玩具碼。003 的 Concept 段更是只有
  一行英文標題、零內容。
- **D7 備忘**：LC 102/104 與本批 007 重疊的「誠實定位」義務落在課序更晚的 `bfs-queue-level-order`
  （session 214），屆時 MUST 具名承認 007 已教過層序走訪。

### 新版在審查中被抓的（證明 1 對 1 審查有效）

- 010 兩處 MAJOR 事實錯誤：最壞空間的輸入方向寫反（遞增堆疊誤寫「嚴格遞減零彈出」）、
  LC 907 約束下不成立的 2^53 溢位偽命題（與同篇 TS Tip 自相矛盾）——修正皆先實測後改寫。
- 005/006 三處 D10 假知識（「退化成每次 O(n)」偽命題及其 quiz 傳染、無反例的「無窮迴圈」宣稱——
  後者被作者自己的 Tip 程式碼與 quiz 否證）。
- 007 quiz 一段詳解「用假命題駁假命題」（失效方向只寫一半，漏了葉節點層長縮短的拆層錯法）。
- 002/004 各一處 D8 斷言缺口（邊界 off-by-one 突變、wrap-around 突變存活），修正後突變全數 KILLED。

### 1 對 1 即拋即審制首批觀察

- **零卡關**：每交件即 spawn 新 reviewer，全程無派件佇列、無需喚醒核實。
- 作者 E 曾被 API 內容過濾中斷（Phase 3 後第二例），檔案已落地，依先例恢復收尾成功、未重跑。
- Opus 用量實測：6 個 reviewer 合計約 665K tokens（估 600–780K 命中）；Fable 約 700K（78K/Concept）。

## Phase 10 查證出的既有缺陷

- **Tomorrow Preview：9 篇全錯（D1 樣態最高比例的一批）**。001/002 都預告快慢指標（實際 `next`
  分別是 002、003）、003 預告一門**不存在的課**「Deletion at Head and Tail」、004 預告快慢指標／環偵測
  （實際是 dummy head）、005 提環狀結構、006 寫「Reversal and In-place Manipulation」、
  008 預告 Dijkstra + Priority Queue、009 預告 Topological Sort、010 在 `next: []` 下預告
  Largest Rectangle in Histogram。
- **D4 樣態擴及 linked-list 與 queue 全批（第 6、7 個模組樣本）**：008 全 6 題、009 全 7 題、
  010 全 6 題、004 的 index 1/5/6 的 `explanation[0]` 為正解選項逐字複製；004 另有 index 2/4/8
  的 `[0]` 是主題標籤而非結論句、index 6 的正解選項本身答非所問（名詞片語）。
- **既有 quiz 正解標錯（本批唯一一組，但互相矛盾）**：`linked-list-two-pointers-slow-fast`
  item[0] 標「偶數中點偏左」為錯（標準條件 `while (fast && fast.next)` 落在第二中點，
  正解應為 index 0）；item[5] 標「奇數偏右＋偶數偏左」為錯，**正確答案是 index 1**
  （reviewer 獨立推演 n=1..6 落點表後確認，並更正作者原本「四選項無一正確」的判斷）。
- **既有 Tip 與主題脫鉤依然普遍**：009 的 TS Tip 完全沒有 BFS 邏輯、008 兩段是與最短路徑無關的
  假 BFS、010 的 TS Tip 是玩具片段且註解的均攤論證本身就是錯的（宣稱 `shift()` 均攤 O(n)）。
- **其他**：002 的既有 quiz item[4] 宣稱提早推進會「記憶體區段錯誤」（GC 語言不成立）；
  008 item[1] 的正解命題不精確（提早終止只是最佳化，非最小步數的必要條件）、item[4] 超前考了
  隔天才教的多源 BFS；008/010 有錯字（「演標」「一但」）。

### 新版在審查中被抓的 4 個 MAJOR

- **002**：Today's Challenge 876 的 Hint 把第 6 課（`linked-list-two-pointers-slow-fast`，
  `leetcode: [876, 19]`、`exit_criteria` 第一條就是「單趟找中點」）的核心技巧整套先講掉，
  且與同篇 Thinking「環偵測留待快慢指標課」自我矛盾。改回兩趟走訪，並補上真正的坑
  （偶數長度要回傳第二個中點，`floor(n/2)` 對、`floor((n-1)/2)` 會 WA——作者實跑 n=1..6 驗證）。
- **002 quiz item[5]**：`explanation[4]` 宣稱雙重推進「在型別與語法上完全合法、編譯器無從得知」，
  但專案 strict + `noUncheckedIndexedAccess` 下實編為 **TS18047 possibly 'null' 編譯錯誤**，
  它要駁的干擾項反而更接近事實，且與同篇 Common Mistakes #4 互打。改為三語言分別陳述
  （strict TS 編譯期擋下／JS TypeError／Python AttributeError，偶數長度靜默漏半）。
- **004**：`Common Mistakes` 第一句因果錯置（**D10 樣態**）——把「漏掉刪頭分支」的後果寫成拋例外，
  實際是**安靜輸出錯誤結果**；會拋例外的是另一件事（刪頭迴圈漏 `head !== null` 收斂）。
  同篇下一句才剛把「prev 前進」正確標為安靜錯誤，內部不一致，且與自己的 quiz item 3 矛盾。
  拆成兩條並以 `[2,1,2]` / `[2,2,2]` 實跑確認例外類別後才下筆。
- **009**：`Thinking` 第四步的收尾檢查寫成「仍有格子停留在 -1 就回報無法完成」，與同篇第一步的
  「源點填 0、其餘填 -1」相衝——994 的空格（值 0，非橘子）永遠停在 -1，照字面實作任何含空格的網格
  都會回 -1（反例 `[[2,1,1],[0,1,1],[1,0,1]]` 正解 4）。與同篇 Hint 及 quiz 第 6 題正面矛盾，
  三處只有這處錯。

### D8（斷言鑑別力）本批抓到 4 篇，全部實測突變確認

- **010**：唯一測資 `[1,3,-1,-3,5,3,6,7], k=3` **完全不觸發前端過期**（`head++` 一次都不執行），
  刪掉整行過期判斷斷言照樣通過——而 `<= i - k` 正是該篇 Common Mistakes、`exit_criteria` 與
  quiz item[2] 的主軸。補 `[9,9,7,2,4,6,8,8,6]` 後實測三種突變（刪除、`< i-k`、`<= i-k+1`）全數 KILLED。
- **009**：測資 `[[0,1],[1,1]]` 只有一個 0，等於在測單源 BFS，「一次全部入隊」改成「只入第一個源點」
  照樣通過。改 `[[0,1,1],[1,1,1],[1,1,0]]` 後單源退化版被攔下。
- **005**：測資 `7→1→7` 對「刪除後照樣前進」的 bug 版仍 PASS（實測確認 reviewer 指控成立）；
  改為含連續目標值的 `7→7→1→7` 後 bug 版 FAIL。
- **003**：Python Tip 把接線包進 `Node(val, head)` 建構式，**順序錯誤在該形式下無法表達**，
  斷言抓不到本篇宣稱的「第一名錯誤」。改兩行賦值後，顛倒版實跑自我成環、被步數熔斷抓到。

### 一項理論宣稱被 reviewer 證偽後由作者實測校準

009 原寫「出隊才標記使入隊次數**最壞**放大近兩倍」，但 1.95 只是 200 個隨機 8×8 網格的**實測最大值**。
reviewer 以二分圖 + degree 論證指出上界應為 2.5（棋盤式源點時每個非源格的四鄰皆為源點）。
作者實跑該反例：8×8=2.25、20×20=2.40、50×50=2.46、100×100=2.48，趨近 2.5。教材與 quiz 兩處
同步改為「隨機網格實測約兩倍；最壞每格被其每一個鄰居各推一次」。**「最壞」是全稱命題，
MUST NOT 拿抽樣實測最大值充當**。

### 1 對 1 制第二批觀察

- **再次零卡關**。9 篇全部一輪退修完成，無需二輪。
- 唯一一則「queued for delivery」（補送作者 C 的 D7 要求）在對方下一輪工具呼叫正常送達並處理，
  未發生 Phase 8 的無聲閒置——差別在於對方當時正在跑退修而非停機。
- Opus 用量：6 個 reviewer 合計約 597K（Phase 9 為 665K），仍落在 1 對 1 制的 600–780K 估計區間。

## Phase 11 — linked-list 007–012 + tree 001–004（2026-09-02）

sessionIndex 視窗 140–153，10 個 Concept、69 題 quiz。**「reviewer 就地修、Fable 交件即關」新制首批。**
6 個 Fable 作者並行（A：007/008、B：009/010、C：011/012、D：tree 001、E：tree 002/003、F：tree 004），
每交件即 spawn 1 對 1 Opus reviewer 就地修，orchestrator 代跑逐篇 `gate:articles` ✓ 後關閉該 reviewer。
`verify:phase` 8 道全數通過（`gate:code` 310s 為最慢一步）。

## Phase 11 查證出的既有缺陷

- **Tomorrow Preview：10 篇中 7 篇錯（D1 樣態持續）**。008 預告 k-Group（實際 `next` 是
  reversal-iterative）、010 預告 Floyd 環偵測（**更早的課**）、011 預告「反轉技巧」（亦為更早的課）、
  012 在 `next: []` 的收官課預告不存在的「區間合併」、tree 001 預告走訪三序（實際是節點表示法）、
  tree 002 預告課綱外的 BFS、tree 004 預告 Preorder（**是前一課，方向寫反**）。
  正確的只有 007、009、tree 003。
- **Tip 與主題脫鉤／假驗證碼**：007、008 的 TS/PY Tip 都是無條件 `return true` 的恆真假示範；
  011 的 Tip 與合併完全無關；tree 003 的 Tip 沒有示範 preorder 本身。
- **008 完全沒有 `exit_criteria` 要求的 F = nC − a 推導**——該篇的核心論證整段缺席。
- **既有 quiz 詳解事實錯誤**：012 item[0] `explanation[1]` 與自家正解互斥（偶數時 slow 停左半末
  vs 正解說右半首）；012 item[2] 宣稱「同時檢查兩指標會提前中斷、把迴文誤判為非迴文」——兩種條件
  終止時機相同，且誤判方向也寫反；tree 003 item[2] 引了一個**不存在的選項**（「先右後右」）。
- **佔位字串與超規**：007 舊卷 7 題的 `explanation[4]` 全是佔位字串 `"aspect"`；008 舊卷 item[0]
  的 stem 96 字元、選項 70+ 字元嚴重超規。
- **D4 樣態依舊**：tree 001（全 10 題）、tree 004（item 3–7）、010（全 7 題）、tree 002/003（全 13 題）
  的 `explanation[0]` 為正解逐字複製。
- **錯字與禁用詞**：011 舊卷「破環」（應為破壞）、012 舊文用禁用詞「指針」、010 item[2] 詳解含亂碼語句。

### 新版在審查中被抓的 1 BLOCKER + 3 MAJOR

- **BLOCKER（007）**：新寫的 Thinking 宣稱「fast 走 3 步時，環長為偶數而初始間距為奇數可能永不相遇」
  是**假命題**，而且 **quiz item[1] 的正解就是這個偽命題**——教材與題庫同步中毒（D2 樣態）。
  reviewer 的反證：兩指標同從 head 出發時，slow 入環當下的間距恆為 `(−2F) mod C`，C 為偶數時間距必為偶，
  作者假設的情形在本演算法中根本不可能出現；且相遇條件 `2t ≡ 0 (mod C)` 對任意 C 都有解，速度 1／3
  **必定相遇**。已改為真命題（失效的是「每輪只減一所以不會跳過」的論證與距離等式，不是相遇性），
  該題整題重寫並把「必定永不相遇」降為干擾項。
- **MAJOR（008）**：新寫的 F = nC − a 推導**在 F = 0 時等式不成立**（slow 實走 C 步而非 F + a），
  原文卻用同一條等式去「涵蓋」該邊界，構成循環論證；`n ≥ 1` 全篇未證。已補 `0 ≤ a < C` 前提、
  `n ≥ 1` 的理由（`nC = F + a ≥ F ≥ 1`），並把 F = 0 改為獨立論證。
- **MAJOR（009 quiz）**：item[1] **新版仍是雙正解**——干擾項「後續節點全數斷鏈」在執行結束後的
  結構上也為真，原詳解只把它限縮成「迴圈期間仍走得到」，並未真正反駁。作者修掉舊版的雙正解、
  自己又踩一次同一個坑。已改寫干擾項為兩個子句皆偽的敘述並同步改詳解。
- **MAJOR（012 TS/PY Tip，D8）**：斷言 `[1,2,2,1]`→true、`[1,2,3]`→false 對本篇 Common Mistakes
  點名的頭號陷阱（把「從 slow 反轉」誤寫成「從 slow.next 反轉」）**完全無鑑別力**，兩案例照樣通過。
  偶數反例改為 `[1,2,3,1]` 後突變被攔下（僅 +3 字元，TS Tip 785→788/800）。
- **MAJOR（tree 003，D9）**：Today's Challenge 114 的 Hint 只說「把 `node.right` 接向上一個處理的
  節點」，**漏了 `node.left` 必須清空**，照此提交會被判錯。

### 其餘 MINOR 的處置（共 9 項，另 3 項判定不改）

tree 001「子樹跟整棵樹結構完全相同」為假命題且與同卷詳解互斥（改為「結構同型、規模較小」）、
tree 001 複雜度主句對高分支節點不成立（改以邊計數論證）、tree 004 的 BST 歸納法缺「不變式對每棵子樹
遞迴成立」與接合處不等式、tree 004 quiz 詳解與自家 Python 範例（合併回傳值寫法）矛盾、
009 Thinking 漏列第三條順序約束「備份先於翻轉」、010 Tomorrow Preview 的 title 字序寫錯、
011「不建立任何新節點」與自家 dummy head 矛盾（改為「不複製任何節點」）、011 對 strict TS 的
`tail = tail.next` 宣稱不精確（實為直接編譯失敗）、012 對兩種中點約定的結論只在偶數成立。

判定**不改**且理由成立的 3 項：tree 001 的堆疊深度 h vs h+1 off-by-one（通行講法、改了會與 quiz
正解不一致、且會踩 `isAnswerUniqueLongestOption`）、009 quiz item[2] 詳解與正解重疊（定義型題目難免）、
012 quiz item[1] 詳解的另一種約定敘述（題幹已限定奇數，改動會撞 quiz 預算）。

### 「reviewer 就地修」新制首批觀察

- **零卡關、零退修回合**：Fable 交件經收下即關（6 個全部一次交件即過逐篇 Gate），
  reviewer 就地修完由 orchestrator 代跑 Gate，10 篇**全部一次 ✓**，無任何一篇需要二輪。
- **改制的假設被證實**：4 個 MAJOR + 1 個 BLOCKER **全部是作者自己新寫的論證**（新推導、新反例、
  新斷言測資），退回同一個腦袋等於要它重想一次它本來就沒想清楚的事。reviewer 逐字讀完後直接動手，
  省掉「報告 → 主控轉譯 → 作者理解」三跳。
- **新增缺陷登錄**：D16（Skeleton Author Hints 的 Python tuple assignment 是壞的，照抄即錯）、
  D17（Tip 800 字元預算與 D8 斷言鑑別力互相排擠）、D7 新登錄題號 23 的跨模組重複（舉證責任在 heap/008）。
- **紅線提示衝突**：1 個 reviewer 自陳誤發 2 次唯讀 Bash，起因是 harness 的 auto 模式提示與 prompt 的
  零執行權方向相反（詳見 D14 的 Phase 11 觀察）。最後一個 reviewer 改用「包含 `node -e`／`cat`／`ls`
  在內的任何一次 Bash 呼叫」措辭後，全程零 Bash。
- **用量實測**：Fable 6 個作者合計 630K subagent tokens（63K／Concept，低於 6 agent 制基準的 74～78K）；
  Opus 6 個 reviewer 合計 700K（每個 105～132K，落在就地修制的估計區間 120–160K 下緣）。

## Phase 12 — graph 001–002 + tree 005–011（2026-09-02）

sessionIndex 視窗 154–167，9 個 Concept、57 題 quiz。「reviewer 就地修、Fable 交件即關」制第二批。
6 個 Fable 作者並行（A1：graph 001/002、A2：tree 005/006、A3：tree 007、A4：tree 008、
A5：tree 009/010、A6：tree 011），每交件即 spawn 1 對 1 Opus reviewer 就地修，
orchestrator 代跑逐篇 `gate:articles` 全數一次 ✓ 後關閉 reviewer。

## Phase 12 查證出的既有缺陷

- **Tomorrow Preview：9 篇中 7 篇錯（D1 樣態持續）**。graph 001 漏列 `next` 裡的 adjacency list、
  graph 002 預告不在 `next` 的 BFS、tree 005 預告 Level-order（BFS）、tree 007 預告 Bottom-Up
  （**是前一課，方向倒退**）、tree 008 預告課綱外的「前序＋中序重建二元樹」、tree 010 預告
  Level Order Traversal、tree 011 在 `next: []` 的收官課預告不存在的 Valid BST。
  正確的只有 tree 006、009。
- **Challenge 描述失實**：tree 005 的 1245（edge list 一般樹）硬寫「左右子樹的高度」。
- **Tip 與主題脫鉤**：tree 005 的 Tip 放的是下一課的 `maxDepth`；tree 007 是與樹無關的 counter
  空殼；tree 008 只 `return 0/1` 未示範 sentinel；tree 010 只比較兩個純量、與鏡像遞迴無關。
- **既有 quiz：9 篇全數逐題驗過，無 answerIndex 標錯**；但 tree 009 item[5] 詳解理由錯誤
  （把 Same Tree 說成「交叉比對」——那是 Symmetric 的做法）；graph 002 item[1] 整題用 C++；
  D4 樣態多篇（`explanation[0]` 為正解逐字複製）；tree 006 全 7 題各漏解釋一個錯項；
  tree 011 item[1] 命題不良（詳解自承前後皆可）。
- **錯字與用語**：「左電子樹」「分辦」「閥值」、中國用語「調用堆疊」「全局」、graph 002 的
  Takeaway 是英文、graph 001 通篇翻譯腔。

### 新版在審查中被抓的 7 MAJOR（0 BLOCKER）＋14 MINOR，全部 reviewer 就地修

- **MAJOR（005）**：Thinking 以「算子樹高度」走流程，把 006 的 learning_goal 全文講完、
  且與自己的 Tomorrow Preview 矛盾；示範指標改為子樹節點總數。
- **MAJOR（006，D7）**：LC 104 已在 queue 模組（level 8、三 track 皆有）解過，原文當第一次見；
  已補誠實定位句。**MAJOR（006，D8）**：TS Tip 全斜樹測資殺不掉「左右深度相加」突變，
  已補分叉樹斷言。
- **MAJOR（007，D7）**：同 104 問題，Challenge why 改寫為「此題你已見過兩次」。
- **MAJOR（008，D8 ×2）**：TS/PY Tip 皆為死斷言——TS 測資從無子樹回傳過 -1（刪早退照樣過）、
  PY「只驗根節點」的錯誤實作照樣給對答案；皆換測資實殺突變（TS 748/800、PY 676/800 未破預算）。
- **MAJOR（011）**：Thinking「交換與遞迴順序都可以」的論證不成立（中序式會壞），
  且 **quiz item[2] 的正解正是「中序式不行」**——教材論述會讓學員答錯自己的題目；已改寫並
  同步修 Digest 的同一過度概括。
- **MINOR 14 項**：graph 001 Complexity 空間記帳（E→無向兩側各一筆）、graph 001 quiz D4 複述、
  graph 002 Pattern Recognition「處理手法完全相同」與自家 133 Hint 矛盾、007 quiz「路徑長度」
  與教材節點數約定衝突、007 Tip 測資鑑別力提升、008 quiz「閥值→閾值」、009 Complexity 計數
  宣稱（走訪對數上限 2·min+1）、009 Concept 變形概括、009 PY Tip 補殺「移除數值比較」突變、
  009 quiz 鏡像措辭、010 Common Mistakes 誤判方向補雙向、011 迭代段表述、011 PY tuple
  assignment 語意誤述（D16 同款知識點）等。

### 就地修制第二批觀察

- **再次零卡關、零退修回合**：6 個作者全部一次交件即過 Gate；reviewer 修完由 orchestrator
  代跑逐篇 Gate，9 篇全部一次 ✓。
- **D17 取捨兩例**：008 TS Tip 的「門檻放寬」面向與「-1 傳遞」互斥不可兼得（預算 800 補不下
  第三個斷言），由 PY 側承接；009 TS Tip 殺不掉「移除數值比較」突變、預算 762/800 補不上，
  依 D17 具名回報不砍示範碼。
- **D7 新登錄**：題號 104（詳見 pipeline-defects.md D7 Phase 12 新登錄）；作者 prompt 未帶
  重複配題清單，後續批次派件 SHOULD 帶入。
- **用量實測**：Fable 6 個作者合計 531K subagent tokens（59K／Concept）；
  Opus 6 個 reviewer 合計 719K（每個 102～147K）。

## Phase 13 — graph 003–010 + heap 001（2026-09-02）

sessionIndex 視窗 168–181，9 個 Concept、66 題 quiz。「reviewer 就地修、Fable 交件即關」制第三批。
6 個 Fable 作者並行（A1：graph 003/004、A2：graph 005/006、A3：graph 007/008、A4：graph 009、
A5：graph 010、A6：heap 001），每交件即 spawn 1 對 1 Opus reviewer 就地修，orchestrator 代跑逐篇
`gate:articles` 全數一次 ✓ 後關閉 reviewer。**本批派件首次帶入 D7 重複配題清單**（Phase 12 的建議）。
`verify:phase` 8 道一次全過（`gate:code` 135.5s）。

## Phase 13 查證出的既有缺陷

- **Tomorrow Preview：9 篇中 6 篇錯（D1 樣態持續）**。graph 003 預告的是先修課 adjacency list、
  graph 005 指向昨天的 DFS、graph 006 誤指四課後的拓樸排序、graph 010 預告昨天的課、heap 001 預告
  非 `next` 的課；graph 004／007／008／009 正確。
- **Tip 死斷言（D8）幾乎全批**：graph 003／005／006／007／008／009／010、heap 001 的 TS 或 PY Tip
  皆為死斷言或與主題無關的空殼——graph 007 的三角形測資連「忘記排除 parent」版都過；graph 008 單布林
  visited 版同樣通過；graph 004 TS Tip 斷言硬編在函式本體且測資無環。
- **Common Mistakes 無反例（D10）**：graph 004／005／007／008／009／010、heap 001 皆有；graph 003
  誤稱列別名為「淺拷貝」；graph 007 舊 Tip 只判環不驗連通、與自家 Hint 矛盾。
- **Thinking 洩漏下一課**：heap 001 把陣列表示法的索引公式整個講完（`next` 才教）。
- **既有 quiz：9 篇 66 題逐題驗過，無 answerIndex 標錯**；但 R4 與 R6 各查出一題「四個選項無一無條件
  成立」（graph 009 舊 item[2] 的「無限迴圈」只在完全無 visited 時為真；heap 001 舊 item[1] 的
  「任意相鄰索引無序」被 `a[0] <= a[1]` 證偽），屬 D10 同型。**D4 再擴大**：graph 008 舊卷 8/8、
  graph 003 舊卷 10/10 的 `explanation[0]` 逐字等於正解；graph 009 舊卷 21/21 段錯項解釋為
  「〈選項原文〉的說法錯誤，因為…」模板（D4 第五種變體）。heap 001 item[3]/[4] 含 LaTeX；
  graph 005 item[3] 簡體「将」（R2 更正：不在 `SIMPLIFIED_ONLY_CHARS` 表內，Gate 實際不會擋）；
  graph 008 item[7]、graph 009 item[6] 提前教 Kahn。
- **錯字與用語**：「遍布」×4、「遞本」、「結東」、「顯示堆疊」、「拓撲」（graph 008 舊卷至少 5 處）、
  「遞歸」「調用」「函數」「記憶體地址」。

### 新版在審查中被抓的 1 MAJOR（0 BLOCKER）＋19 MINOR，就地修 16 項

- **MAJOR（graph 004，D10）**：Common Mistakes 第二條把 Python 的病因誤植為「檢查順序」——順序倒置
  實際拋 IndexError 而非安靜少算，「頂端與底端相連、島嶼少算」只發生在**漏寫** `r < 0` 時；且同一
  錯誤因果已流入 quiz item[5] 當正解（D2 傳染路徑）。教材兩語言病因分開講並補反例、quiz stem 改為
  「漏寫 `r < 0`」、PY Tip 測資 `"100"→"101"` 補殺「漏寫 `c < 0`」突變（782→781/800）。
- **D8 補鑑別力三例（皆依 D17 改測資不加測資）**：heap 001 TS Tip 測資補等值 parent／child 殺
  `<`→`<=` 突變（776→780）；graph 008 PY Tip 第 2 組測資改為環不含節點 0 的 `(3, [[2,1],[1,2]])`
  殺「只從 0 出發」突變（等長 794 不變）；graph 004 見上。
- **教材自相矛盾**：graph 005 Thinking 教「size = queue.length 當層界線」但自家 Tip 用 head 指標
  且永不彈出（`q.length` 是歷來推入總數）→ 改「佇列當下的節點數（head 指標寫法是 `q.length - head`）」；
  graph 007 Pattern Recognition 說「每個未造訪節點各發起 DFS」但 Tip 只從 0 出發 → Thinking 補
  「造訪數 ≠ n 已非樹，261 只從 0 出發就夠」論證；graph 009 Concept「v 尚未完成就被 u 指到」
  涵蓋白點、照字面是偽命題 → 改「v 正在造訪中」。
- **quiz 正解有瑕疵**：graph 010 item[2]「遇到環時入度轉負、迴圈不終止」對「環不從任何源頭可達」
  的圖不成立（n=2 的 0↔1）→ 加作用域；同題 options[2]「把所有 DAG 誤判為無環」語意矛盾 → 改寫；
  heap 001 item[3]「取最小值 O(1)」與教材 peek／extract 區分衝突 → 「讀最小值」。
- **其餘 MINOR**：graph 003 Challenge 洩漏產線術語「Skeleton」、graph 003 quiz 兩處 explanation
  自相矛盾、graph 005 Digest 洩漏 spec 語彙「MUST」（全庫唯一）、graph 009 Tip「訪問中」與全篇
  「造訪中」不一致、graph 010 的 `n` 未定義、graph 010 quiz「兩種狀態」與先修課三色不一致。
- **未修（裁決）**：D6「昨天／今天／明天」措辭全批依規不動；graph 008「菱形」實為遞移三角形
  （非事實錯誤、改需動 10 處而 Tip 只剩 3／6 字元餘裕）不改；heap 001「退化成鏈高度 n」與先修
  tree/001 一致不改；graph 010「每條邊恰好減 1」NIT 不改。

### 就地修制第三批觀察

- **零卡關、零退修回合**：6 個作者一次交件即過 Gate；reviewer 修完由 orchestrator 代跑逐篇 Gate，
  9 篇全部一次 ✓。
- **D7 派件帶清單首次實測有效**：graph 005 對 994 的定位與 queue/009 六項邊界慣例逐條對上、且補了
  queue/009 未展開的不變式；graph 010 的 Challenge why 具名承認 207 已在 graph 008 用三色法解過。
  同批兩課共用 207（008 先、010 後）由兩位作者各自依對方 Skeleton 定位，銜接無矛盾。
- **D7 新登錄三筆**（舉證責任皆在 dfs-bfs 模組，level 14）：200（graph/004 先、dfs-bfs/002 後）、
  323（graph/006 先、dfs-bfs/008 後）、994 第三次（dfs-bfs/007）。詳 pipeline-defects.md D7。
- **D17 警示**：graph 006 TS 779／PY 770，第二組測資 `[[2,1],[1,0]]` 是唯一能殺單向建圖突變的，
  日後動 Tip MUST 保留；graph 008 TS 797／PY 794、graph 009 TS 794／PY 794、graph 010 TS 793／
  PY 795 皆貼上限。
- **用量實測**：Fable 6 個作者合計 **914K** subagent tokens（**102K／Concept**，比 Phase 11／12 的
  63K／59K 高七成——本批作者普遍做了大規模窮舉實測：A3 跑 n≤4 全 4,165 張有向圖、A4 跑 4,000 張
  隨機圖 × 9 變體）；Opus 6 個 reviewer 合計 **960K**（每個 138～181K，較 Phase 12 的 102～147K 高）。
  牆鐘：作者最長 20 分（A3）、reviewer 最長 16 分（R3），整批約 55 分。

## Phase 14 — heap 002–010 + backtracking 001（2026-09-02）

sessionIndex 視窗 182–195，10 個 Concept、69 題 quiz。「reviewer 就地修、Fable 交件即關」制第四批。
6 個 Fable 作者並行（B1：heap 002/003、B2：heap 004/005、B3：heap 006/007、B4：heap 008/009、
B5：heap 010、B6：backtracking 001），每交件即 spawn 1 對 1 Opus reviewer 就地修。
**本批在 reviewer 階段被使用者中斷**（token 用罄）：作者與 reviewer 皆已自然跑完，orchestrator 於中斷點
把 scratchpad 產物複製到 repo 內未追蹤目錄 `.f12-wip/` 並寫 HANDOFF，續跑後代跑逐篇 `gate:articles`
（8 篇一次 ✓）、`verify:phase` 8 道一次全過（`gate:code` 133.8s）。

## Phase 14 查證出的既有缺陷

- **Tomorrow Preview：10 篇中 9 篇錯（D1 樣態持續，本批最嚴重）**。heap 002 預告 Heapify 而非 `next` 的
  sift-up、003 把 Heapify 當 sift-down 同義詞、005 預告 Merge k Sorted Lists（`next` 是 kth-largest）、
  006 跨模組指向 Two Pointers、007 指向前一課並教 Quickselect、008 指向 Graph/BFS、009 指向 Sliding
  Window Maximum、010 捏造、backtracking 001 不在 `next`。正確的只有 004。
- **Tip 死斷言（D8）全批 10 篇**：無一例外，且多篇 Tip 教的是隔壁課的東西（002 教下一課的 `siftUp`、
  004 無 sift-down 實作）。
- **Common Mistakes 偽命題（D10）**：003 兩條經本機證偽（「索引 <0 會拋錯」在 TS／PY 都不拋、Python
  反而錯誤交換；「忘記更新索引會無窮迴圈」實際兩步即停）；005「破壞複雜度分析基礎」捏造；006「完整
  Max-Heap 會過早丟棄第 K 大」；007 第三條捏造；010 Complexity 誤稱排序法 O(N²)。
- **既有 quiz：10 篇 69 題逐題驗過，無 answerIndex 標錯**；但「四選項無一正確／雙正解」多題：
  005 item[1]（`floor((n-2)/2)` 與 `floor(n/2)-1` 恆等卻判其一為錯）、005 item[6]（正著做 sift-down
  是建不出 heap 而非複雜度退化）、007 item[4]、010 item[0]／[4]／[5]（[4]「heap 對 tie 依字典序」
  為事實錯誤）。**009 舊 item[2] `explanation[3]`「依數值分流無法維持均等」為偽**（B4 實測 3,000 組
  0 錯，S4 手推證實）——見下方「派件層被舊題庫污染」。D4 再擴大：backtracking 001 舊卷 5/5 複製正解
  ＋15/15 第五變體模板；heap 008 6/6、009 7/7、006／010 多題。
- **正文洩漏產線術語**：007 正文出現 conceptId。**錯字與用語**：「堆／堆頂」「指針」「鍊結」。

### 新版在審查中被抓的 6 MAJOR（0 BLOCKER）＋19 MINOR，就地修 21 項

- **MAJOR（heap 004 ×3，S2）**：Thinking 的核心反例算錯——「拿 3 跟 5 換會得到 [3,2,5]」，真的交換
  得 [5,2,3]，[3,2,5] 是「不交換」的結果；**同一錯誤複製進 Digest**（會單獨推 Discord）；quiz item[5]
  option[2]「先換再 pop 再對空陣列 sift-down」在自家程式碼下可行＝第二正解，且 explanation[3]
  「空陣列讀 h[0] 會出錯」與程式碼矛盾（D10）。三處皆改。
- **MAJOR（heap 003 ×2，S1）**：Common Mistakes 第三、四條宣稱「[5,10] 插 3 會停在原地」「TS 碰巧
  安靜停下」，但本篇 Tip 是 `if (a[p] <= a[i]) break`，`undefined <= 3` 為 false ⇒ 不停、把 a[2]／root
  洗成 `undefined`。**根因：作者實測用的迴圈寫法與自家 Tip 相反**，「五條都實測過」的宣稱部分不成立。
  orchestrator 續跑時以 20 行前景腳本複驗：break-form 得 `[5,10,undefined]`，swap-form 才停在原地。
- **MAJOR（heap 006，S3）**：quiz item[5] explanation[4] 名次恆等式錯——大小 n−k 的 min-heap root 是
  第 n−k 大＝第 k+1 小，不是第 n−k 小（n=6、k=2 即破）。
- **D10 紅線兩例**：heap 009 Common Mistakes「依大小分邊」（指個數）緊鄰 Thinking 的「依值分邊是正確
  寫法」，易被讀成教材自打——改「只看個數分邊」；heap 006 Concept「x ≤ root 可略過」在等值時為偽
  （[5,5,5]、k=2）——補等值說明。
- **教材自相矛盾**：heap 002 CM「除法沒取整→提早停」只在 swap-form 成立、與下一課 break-form Tip 相反；
  heap 003 Thinking 配對列舉含交換後不存在的兄弟；heap 010 Challenge why「最高頻任務是唯一瓶頸」與自家
  `AAABBBCCCDDD`／n=2 反例矛盾；heap 008 TS Tip 改回傳值序列卻未標示（作者自稱已註明不實）——補標示並以
  `throw Error` 騰字元（795→797）；backtracking 001 稱先修 graph/004 為「昨天」（實隔 16 個 Concept）
  ＋遞迴深度 off-by-one。
- **quiz 正解有瑕疵**：heap 005 item[2] 干擾項 `(n/2)·log n` 也是真上界（stem 改「上界 n 如何推出」）；
  backtracking 001 item[1]「最多 n 層」與同卷 item[3] 正解 n+1 矛盾；heap 003 item[2]「每個都比 x 大」
  在重複值下不成立。
- **未修（裁決）**：D6「昨天／今天／明天」全批依規不動；heap 005 正文「隨機資料逐一插入平均約 1.2 次
  交換」（作者實測 1,261／1,023）reviewer 無法複核但質性結論正確，保留；heap 008 引述 linked-list/011
  非逐字（語意一致）不改；heap 009 CM#2 分支敘述與 quiz item[1] 較寬鬆的不變式皆為真，不改。

### 就地修制第四批觀察

- **零卡關、零退修回合**；使用者中途喊停後 12 個 agent 皆自然結束，無孤兒行程。中斷點的產物保全靠
  「scratchpad → repo 內未追蹤目錄 + HANDOFF」一次複製完成，續跑只需重跑 8 篇 Gate。
- **派件層被舊題庫污染（D2 新傳染路徑）**：orchestrator 派件給 B4 時寫「直接依大小分邊會壞——給具體
  反例」，這句話的來源正是 heap 009 舊 quiz item[2] 的偽命題。作者 B4 實測 3,000 組後主動更正，
  S4 手推證實。教訓：**派件 prompt 裡的演算法命題 MUST 與 Common Mistakes 同等對待——寫不出反例就
  不要寫進 prompt**；已登錄 pipeline-defects.md D2。
- **作者實測與自家 Tip 寫法脫鉤**（heap 003）：作者用 swap-form 驗證 Common Mistakes，教材 Tip 卻是
  break-form，兩條 MAJOR 由此而來。addendum 已要求「若某條與你自己的示範程式碼衝突，先弄清楚哪一邊錯」，
  但沒要求「實測 MUST 用 Tip 的同一份程式碼」，SHOULD 補。
- **兩位作者用了唯讀 git 指令**（B4 `git status`、B5 `git log/show/status`）：無狀態影響，但違反字面
  規則；後續 prompt 的「MUST NOT 執行 git」SHOULD 明寫「含唯讀」（reviewer prompt 自本批起已加）。
- **D17 全批貼上限**：heap 006 TS 796／PY 798、008 TS 797／PY 793、009 TS 798、010 TS 793；TS 無內建
  heap 是主因。三篇 TS Tip 以「排序陣列模擬」「計數＋每輪排序」「換頂再 sift-down + END 哨兵」替代，
  皆誠實標示。
- **D7 派件清單第二批**：215（004 先、006 後）由 B3 誠實定位；23（linked-list/011 → heap/008）由 B4
  嚴格增量、逐字沿用先修課術語；78（backtracking 001 先、002 後）舉證在 002，本課已教滿 start 模板。
- **用量實測**：Fable 6 個作者合計 **997K** subagent tokens（**100K／Concept**，與 Phase 13 的 102K 同級，
  作者實測規模：B2 145,636 組窮舉、B4 3,000 組隨機、B5 1,344 組暴力對照）；Opus 6 個 reviewer 合計
  **1,099K**（每個 140～209K，本批 MAJOR 密度最高的 S2 最貴）。牆鐘：作者最長 26 分（B4）、
  reviewer 最長 20 分（S2）。
