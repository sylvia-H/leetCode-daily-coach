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
