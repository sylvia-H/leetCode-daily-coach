# Contract: 內容品質 Gate 組成 + CI 程式碼實測步驟

Stage 2 生成期 Gate 與 CI `content-gate.yml` 共用的把關契約。**單一 Compiler / 單一 Gate 路徑**（憲章 IX）：
純內容檢查與編譯/render/預算重用 `src/compiler`/`src/renderer`；程式碼實測抽為 `scripts/run-code-blocks.ts`
供本機與 CI 共同呼叫；LLM self-check 為生成期專屬。

## 1. Gate 關卡（逐關；快速失敗）

| # | 關卡 | 實作位置 | CI 是否跑 | 判準 |
| --- | --- | --- | --- | --- |
| 1 | 結構/schema + 觀念本體字數 | `src/compiler/content.ts` + zod | ✅ | §10 固定區塊齊全、frontmatter 合法、觀念本體 ≤2,000 字 |
| 2 | 繁中判準 | `src/compiler/traditional-chinese.ts` | ✅ | 散文（排除程式碼/行內 code）無簡體字、CJK 佔比 ≥ 門檻（預設 0.5） |
| 3 | 程式碼實測（編譯+斷言） | `scripts/run-code-blocks.ts` | ✅ | 見 §2 |
| 4 | 題目正確性 | `src/compiler/problem.ts` | ✅ | 題號存在於 bank、`url` slug 一致、每題有 challenge 條目 |
| 5 | DAG（defence-in-depth） | `src/compiler/curriculum.ts` | ✅ | 無環/無前向/參照完整（Stage 2 起點已凍結，仍再驗） |
| 6 | 完整編譯 + render + 字元預算 | `src/compiler` + `src/renderer`（`runContentGate`） | ✅ | 全 Track × 全 Session 編譯/render 通過、全 embeds ≤5,500、各區塊 ≤§14.5 上限；超限 MUST NOT 截斷 |
| 7 | LLM self-check | `scripts/generate-content.ts` + `scripts/lib` | ❌（生成期專屬） | 複雜度正確性/Pattern 適用性/前後一致；低信心 ⇒ 重生 |

- 關卡 1/2/4/5/6 的純檢查由既有 `scripts/validate.ts` 入口在 CI 跑（`content-gate.yml`）。
- 關卡 3 由 `content-gate.yml` **新增步驟**呼叫 `run-code-blocks.ts`（本 Feature 承接 F5）。
- 關卡 7 只在 Stage 2 生成期（有金鑰）跑，MUST NOT 進 CI。

## 2. 程式碼實測（`scripts/run-code-blocks.ts`，Q2 / R6）

- 從 Article 抽出 `TypeScript Tip`、`Python Tip` 的 fenced code blocks（F12 Phase 0 移除 Corner 兩段前為四段）。
- **缺斷言即失敗**：區塊未含任何 `assert` / `throw`（TS：`throw`/`node:assert`；Python：`assert`）⇒ 不通過。
- TS：寫暫存 `.ts` → `tsc --noEmit --strict` 型別檢查 + `tsx` 執行（斷言失敗即非零）。
- Python：寫暫存 `.py` → `python` 執行（`assert` 失敗即非零）。
- 暫存資源建於系統暫存區、用後清理；MUST NOT 寫入 repo 工作目錄、MUST NOT 殘留。

## 3. Exit / 回報

- 生成期（Stage 2）：任一關不過 ⇒ 觸發該篇重生（≤3 次，R8）。
- CI（`content-gate.yml`）：任一關有違規 ⇒ workflow 失敗、阻擋合併（沿用既有「Gate 不通過阻擋合併」）。
- 違規輸出沿用 `GateViolation` / `formatViolation` 具名風格（track/session/rule/subject/message）。

## 4. 不變式（MUST）

- 關卡 1/2/4/5/6 MUST 為生成期與 CI **同一實作**（不雙軌，IX）。
- 關卡 6 MUST 用每日 runtime 同一顆 compile/render/checkBudget。
- CI Gate MUST 可在**無任何 LLM 金鑰**下執行（憲章 VIII；self-check 不進 CI）。
- 字元預算超限 MUST NOT 以截斷通過（Edge Case）。
