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
