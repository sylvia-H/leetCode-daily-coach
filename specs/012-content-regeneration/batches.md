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

## 待辦（不屬 Phase 1 範圍）

- `scripts/lib/prompts/stage2-content.ts` 的 `Stage2PromptInput` MUST 補 `next` 欄位並在 prompt
  指示 Tomorrow Preview 的內容來源；per-article Gate 宜加一條檢查。否則將來重跑產線會原樣重現
  13/14 的缺陷。

