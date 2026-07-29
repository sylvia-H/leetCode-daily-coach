# Contract: Stage 2 — `scripts/generate-content.ts`

讀凍結 Skeleton → LLM 展開 Full Article → 品質 Gate → 重生 ≤3 → 凍結。

## 1. 呼叫

```
npm run generate:content -- [--force] [--only <conceptId,...>] [--allow-dirty]
```

**環境變數**：`GEMINI_API_KEY`（必要）、`RPM_LIMIT`（可選）。

## 2. 前置檢查（MUST）

- Skeleton **已凍結**：工作目錄 `concepts/**` 無未提交變更（R12）。未凍結且無 `--allow-dirty` ⇒ exit 1
  （訊息指明「Skeleton 未定稿，先完成 outline 定稿並 commit」）。

## 3. 輸入

- `concepts/{topic}/{NNN}-{slug}.md`（凍結 Skeleton）、`data/problem-bank.json`。
- Stage 2 / self-check prompt 模板（`scripts/lib/prompts/`）。

## 4. 每篇流程（MUST）

1. 冪等判斷：`articles/.../NNN-slug.md` 已存在且 Skeleton 雜湊一致 ⇒ 跳過（除非 `--force`/`--only`）。
2. LLM 依 Author Hints 展開 §10 全部固定區塊（程式碼區塊 **MUST 自帶內嵌斷言**；`whyThisPattern`/Hint 為
   教學文字由 LLM 生成，題號/連結/難度由程式帶入）。
3. **品質 Gate 逐關**（見 content-quality-gate 契約）：結構/schema+字數 → 繁中判準 → 程式碼實測 → 題目正確性
   → 完整編譯/render/預算 → LLM self-check。
4. 任一關不過 ⇒ 重生（回步驟 2），**每篇上限 3 次**。
5. 3 次仍不過 ⇒ manifest 標記 `needsHumanReview`、記錄未過關與原因（fail loud）、**繼續下一 Concept**。
6. 過關 ⇒ 寫 `articles/.../NNN-slug.md`、更新 manifest（`articleFrozen/gatePassed`）。

## 5. 批次末（MUST）

- 對**全 Track × 全 Session** 執行 `runContentGate`（重用每日 runtime 同一顆 compile/render/checkBudget）。
- 統計 `needsHumanReview` 篇數。

## 6. Exit code

| code | 條件 |
| --- | --- |
| 0 | 全部 Concept 過 Gate 並凍結；批次末整體 Gate 零違規 |
| 1 | 缺金鑰 / 前置檢查失敗 / 任一篇 `needsHumanReview` / 批次末 Gate 有違規 / 節流退避耗盡 |

## 7. 不變式（MUST）

- MUST NOT 靜默凍結未過 Gate 的 Article；MUST NOT 因單篇卡住整批（單篇隔離，其餘照常）。
- 完整編譯/render/預算 MUST 用 `src/compiler`/`src/renderer` 同一實作（IX），MUST NOT 另建解析。
- MUST NOT 修改 F5 Renderer/Compiler 版面或解析邏輯；只產生餵入的凍結素材。
- self-check 為生成期專屬，MUST NOT 進 CI（CI 無金鑰、需確定性）。
