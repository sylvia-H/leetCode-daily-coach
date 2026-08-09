# 合併前補強驗收：011-weekly-quiz（F11 每週自評測驗）

**Purpose**: 在 `tasks.md` 全數完成、`requirements.md` / `prompt-design.md` 兩份規格品質檢查表已跑完之後，
針對「既有檢查表**沒有涵蓋**、但只在**凍結後的真實產物**上才量得到」的面向做最後一輪驗收，作為併入
`develop` 前的放行依據。**不含 code review**（使用者明示不做），只驗可客觀量測的結果。
**Created**: 2026-08-09
**Feature**: [spec.md](../spec.md)
**Focus**: 凍結題庫的全庫層級品質、CI 接線、憲章硬規則複驗、repo 衛生
**Depth**: Light（8 項）
**Audience**: 合併決策者

## 工程基線

- [x] AC001 `npm run build`（tsc）與 `npm test` 在合併前的 branch HEAD 全綠？[Blocking]
  → **PASS**：`tsc` 無輸出（零錯誤）；vitest **104 test files / 943 tests 全數 passed**，含
  `gate.test.ts` 以**真實素材**執行 `runContentGate`（`violations` 為空、`compiled === total`）。

- [x] AC002 CI 是否真的會在題庫變更時把新 Gate 跑起來（而非只有本機跑過）？[Blocking, FR-010/FR-010a]
  → **PASS**：`checkQuizBank` 由 [gate.ts:99](../../../src/compiler/gate.ts#L99) 併入 `runContentGate`；
  `loadCompilerDeps` 於 [lesson.ts:200](../../../src/compiler/lesson.ts#L200) 載入 `data/quiz-bank.json`；
  `.github/workflows/content-gate.yml` 的 push / PR 觸發路徑含 `data/**` 與 `src/**`，
  `ci.yml` 對所有 push / PR 跑 build → type-check → test。題庫或選題邏輯異動皆會被擋。

## 凍結題庫的全庫層級品質（既有 Gate 只逐 Concept 檢查，量不到全庫分布）

- [x] AC003 凍結後的 `data/quiz-bank.json` 題數分布是否確實遠離下限（SC-010、SC-008、FR-005）？[Blocking]
  → **PASS，且大幅優於門檻**：165 Concept / **1,216 題**，平均 **7.37** 題（門檻 ≥5）；
  題數恰為 3 的 Concept **0 個（0%，門檻 <40%）**；**無任何 Concept < 3 題**；最大 10、未越界。
  分布：`{5:11, 6:33, 7:49, 8:42, 9:16, 10:14}`。FR-016「達標即停」防制確認生效。

- [x] AC004 全庫（跨 Concept）層級的**正解位置**偏誤是否已消除？[Blocking, FR-010b]
  → **PASS**：全庫 answerIndex 分布 **A 25.1% / B 25.2% / C 25.3% / D 24.3%**（1,216 題），
  與均勻分布無實質差距；單一 Concept 的最集中位置佔比**最大值 40%**（門檻 ≤50%）；
  每個 Concept 的正解位置覆蓋數**最小值 4**（四個位置全用到）。對照修復前實測基準
  （`array-two-pointers-variable` 80% 正解落在 B），`quiz-balance.ts` 的確定性重排確認有效。

- [x] AC005 全庫層級的**選項長度**偏誤是否已消除到「不讀題猜不對」？[Non-blocking，見下方結論]
  → **符合 spec 門檻，但殘留可量測訊號**：per-Concept「正解為唯一最長選項」佔比最大值
  **50%**（門檻 ≤50%，貼齊而未越界），全庫 411/1,216 = **33.8%**。
  但以**學習者實際可用的猜答啟發式**量測：「一律選最長選項」命中率 **44.7%**（並列取最前）／
  **47.7%**（並列隨機的期望值），高於隨機基準 25% 約 20 個百分點；正解的長度平均名次
  **1.90**（1 = 最長，無偏誤應為 2.5）；717 題「存在唯一最長選項」者之中，**57.3%** 正解就是它。
  對照修復前基準（90% 正解為唯一最長）已大幅改善，但未歸零。**判定：不阻擋合併**，理由與後續處置見文末。

## 憲章硬規則複驗（F11 新增了產線與 runtime 兩側程式碼）

- [x] AC006 每日 runtime 是否仍為零 LLM（憲章 IX、spec §4-8）？[Blocking]
  → **PASS**：`src/` 全域無 `@google/genai` 或 `GEMINI_API_KEY` 之引用（`no-llm-in-src.test.ts`、
  `daily-no-llm-key.test.ts` 皆綠）；`daily.yml` 未含 `GEMINI_API_KEY`；`content.yml` 新增的
  Stage 4（`generate:quiz-bank`）為 `workflow_dispatch` 產線，且**不自動 commit** 產出。

- [x] AC007 FR-013 的「獨立二次作答」在程式碼層是否客觀可核驗（補結 `prompt-design.md` 的 CHK008）？[FR-013]
  → **PASS**：`crossCheckOne`（[generate-quiz-bank.ts:260](../../../scripts/generate-quiz-bank.ts#L260)）
  呼叫 `llmClient.generate(prompt, schema)`，`llm-client.ts` 以 `contents: prompt` 送出**單次無狀態
  request**、不帶任何訊息歷史；`buildQuizCrossCheckPrompt` 只餵 `stem` + `options`，
  **未附 `answerIndex` 或 `explanation`**。「獨立」在實作面已無歧義，CHK008 的殘餘風險關閉。

## Repo 衛生

- [x] AC008 branch 上是否留有一次性人工執行殘留物、或與 `docs/spec.md` 相牴觸的文件？[Non-blocking]
  → 初驗 **FAIL（兩項）**，已於 2026-08-09 合併前修正：
  1. repo root 的 `run-quiz-bank-pipeline.ps1` / `run-quiz-bank-validate.ps1` 為 T037–T039 的
     一次性人工執行腳本（無 secret 外洩，已確認），但全 repo 無任何文件引用，且
     `run-quiz-bank-validate.ps1` 硬編了當時 6 個低題數 Concept、對現況已失效。
     → **已刪除**；正式指令（首跑 / 冪等重跑 / `--force --only` / `--rebalance-only`）
     完整保留於 [quickstart.md](../quickstart.md) §1，刪除不損失任何可重現步驟。
  2. `CLAUDE.md` 的 Feature 順序表仍停在 F10 `010-interactive`（且描述含「每週測驗」為 Roadmap），
     未反映 `docs/spec.md` §22.5 已定案的「F10 評估不做、改由 F11 `011-weekly-quiz` 承接」。
     → **已補正**：F10 改標「已評估，不做」並新增 F11 一列（依賴 F6、F8、F9，里程碑 M5），
     與 `docs/spec.md` §22.5 的表格一致。

---

## 結論：可以合併

**AC001–AC004、AC006–AC008 全數 PASS**（AC008 初驗的兩項瑕疵已於本輪修正）；AC005 符合 spec
既定門檻但有殘留訊號，判定不阻擋合併。

**AC005（選項長度殘留偏誤）判定不阻擋合併的理由**：

- **代價有界且可量化**：學習者若採「挑最長」啟發式，期望得分約 **45%** 而非 25%，即自評分數會系統性
  高於真實理解程度約 20 個百分點；但位置偏誤已完全消除，且 Discord 每次只推 **1 題**，
  單題層級的啟發式收益不構成「整份測驗量不到東西」的失效態（修復前 90% 才是）。
- **符合已定案的判準**：FR-010b 的門檻（per-Concept ≤50%）是 spec 明文權衡後設定的值（並註明
  50% 不會誤殺），現況 100% 通過，並非違規放行。
- **後續處置建議另立任務**（不在本 Feature 範圍）：在 Stage B prompt 要求四個選項字數相近
  （例如彼此差距 ≤15%），或在 `scripts/lib/quiz-balance.ts` 寫入前加一條「正解長度名次分布」的
  確定性觀測欄位，之後只對超標 Concept 逐題重生 —— 沿用本 Feature 已建立的逐題修復機制即可，
  無須整庫重跑（約 1,500 次呼叫的成本不必再付一次）。
