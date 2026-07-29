# Quickstart: 007-content-generation

驗證 F7 兩階段產線端到端可跑、Gate 有效、續跑/冪等成立。**build-time 操作**（本機或手動 workflow），
與每日 runtime 完全分離。

## 前置

- Node.js 24、npm、Python 3.x（+ 可執行 `python`）。
- `GEMINI_API_KEY`（Gemini 免費層）：`$env:GEMINI_API_KEY="..."`（PowerShell）。**MUST NOT** 寫入檔案。
- 已安裝相依：`npm ci`（含新增 devDependency `@google/genai`）。

## 主流程（一次性內容工程）

```powershell
# 1) Stage 1：起草課綱 + 題庫擴充 + 結構 Gate + 產 outline
npm run generate:curriculum          # 缺金鑰即 fail-fast；結構 Gate 有 error 則非零、不產定稿

# 2) 唯一人工檢查點：review 課綱大綱，核可後凍結（約 1–2 小時，只看方向）
#    檢視 curriculum/outline.md（Module/Topic/Concept 順序、依賴、對應題號）
git add concepts/ curriculum/outline.md data/problem-bank.json data/leetcode-index.json
git commit -m "feat(007-content-generation): 課綱大綱定稿凍結"

# 3) Stage 2：展開全文 + 品質 Gate（每篇重生 ≤3）
npm run generate:content             # Skeleton 未凍結（工作目錄髒）會被前置檢查擋下

# 4) 課綱凍結後生成三份正式課表（byte-identical）
npm run generate:schedule
git add articles/ schedules/ && git commit -m "feat(007-content-generation): 全文展開與正式課表凍結"
```

## 驗證情境（對應 SC / AC）

| 驗證 | 指令 / 動作 | 預期 | 對應 |
| --- | --- | --- | --- |
| 缺金鑰 fail-fast | 不設 `GEMINI_API_KEY` 跑 `generate:curriculum` | 立即 exit 1、明確報缺金鑰 | FR-025 |
| 結構 Gate 擋前向依賴 | 注入含環/前向依賴的候選 | Stage 1 exit 1、不產 outline、具名違規 | FR-003 / SC-002 |
| 題號無效被擋 | 候選題號不存在於快照且線上查無 | `populate` exit 1、指名 conceptId+題號 | FR-003a |
| 未定稿禁止 Stage 2 | Skeleton 有未提交變更時跑 `generate:content` | 前置檢查 exit 1（要求先定稿） | FR-005 / R12 |
| 程式碼實測擋錯碼 | 某 Article 程式碼缺斷言/斷言失敗 | 該篇重生；3 次仍不過 ⇒ `needsHumanReview`、批次 exit 1 | FR-010 / SC-003 |
| 繁中判準 | 混入簡體字或英文過多段落 | 繁中 Gate 擋下、重生 | FR-008 / SC-009 |
| 字元預算 | 生成超 §14.5 上限 | Gate 擋下、MUST NOT 截斷凍結 | Edge Case |
| 斷點續跑 | Stage 2 中途中斷後重跑 | 已凍結且過 Gate 者跳過，只續缺漏 | FR-019 / SC-006 |
| 冪等 | 對已凍結且 Skeleton 未變更者重跑 | 不重新生成；`--force` 才重生 | FR-020 / SC-006 |
| 課表 determinism | 連跑兩次 `generate:schedule`，`git diff schedules/` | 無差異（byte-identical） | FR-014 / SC-008 |
| 零 LLM runtime 守門 | `npm test`（掃描測試） | `src/**` 無 `@google/genai` import、`daily.yml` 無 LLM 金鑰 | FR-022/023 / SC-007 |

## CI Gate（合併前）

```powershell
npm run validate:content     # 結構/繁中/題目/DAG/完整編譯+預算（無需金鑰）
npm run gate:code            # run-code-blocks.ts：TS/Python 編譯+斷言（content-gate.yml 同一步驟）
```

- 對「程式碼寫錯（無法編譯/斷言失敗）」的教材開 PR ⇒ `content-gate.yml` MUST 失敗、阻擋合併（SC-010）。

## 收尾檢查（凍結後）

- `concepts/**`、`articles/**` 涵蓋 16 Module、≥150 Concept；種子/fixture 0 殘留（SC-001）。
- 三份 `schedules/{track}.json` 各 ~180 Session、通過 F4 拓樸子序列驗證。
- `manifest` 無 `needsHumanReview` 殘留（或已逐篇處理）。

> 契約細節見 [contracts/](./contracts/)；實體與 schema 見 [data-model.md](./data-model.md)；決策理由見
> [research.md](./research.md)。實作程式碼與完整測試屬 `/speckit-tasks` 與實作階段，不在本指南展開。
