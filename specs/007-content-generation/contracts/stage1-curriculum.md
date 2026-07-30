# Contract: Stage 1 — `scripts/generate-curriculum.ts`

課綱與 Skeleton 起草。`process.exit` / 檔案寫入 / LLM 呼叫只在此入口與 `scripts/lib/`；`src/` 不參與。

## 1. 呼叫

```
npm run generate:curriculum -- [--force] [--only <topicId,...>]
```

`--only` 的比對單位是 **Topic id**（`curriculum/modules.json` 的 `topics[].id`），不是 Concept id：
Stage 1 的起草最小單位就是一個 Topic（一次 LLM 呼叫產出該 Topic 的全部 Concept）。Stage 2
（`generate:content`）的 `--only` 才是 Concept id。

**環境變數**：`GEMINI_API_KEY`（必要，缺 ⇒ 建構期 fail-fast，exit 1）、`RPM_LIMIT`（可選，預設 10）。

## 2. 輸入

- `curriculum/modules.json`（16 Module 骨架，F2；只讀）。
- `data/problem-bank.json` + `data/leetcode-index.json`（供題庫擴充；見 problem-bank-population 契約）。
- 生成參數與 prompt 模板（`scripts/lib/prompts/`）。

## 3. 流程（MUST 依序）

1. 建構 `LlmClient`（模型 `gemini-3.5-flash-lite`；節流/退避見 R3）。缺金鑰即 exit 1。
2. 對每個 Module/Topic 批次起草 Concept：frontmatter（`leetcode` **只候選題號**）+ Author Hints。
   - 冪等：已有 Skeleton 的 Topic 跳過（除非 `--force`；`--only` 限定範圍）。
   - 重新起草某 Topic（`--force` / `--only` 命中）為 **replace 語意**：MUST 先清空該 Topic 目錄下
     既有的 `*.md` 再從 `001` 重新編號，MUST NOT 續編號附加——否則篇數翻倍、或舊的高編號檔殘留
     成 dangling-ref / 孤兒 Concept。被清除的 Concept id MUST 同步排除於後續 Topic 的
     `priorConceptIds` 之外。
3. 呼叫 `populate-problem-bank.ts` 流程驗證候選題號並填入 metadata（見對應契約）。
4. **結構 Gate**（重用 F2 `src/compiler/curriculum.ts` + `schema.ts`）：
   - DAG：無環、無前向依賴、無孤兒（合法起點除外）、`prerequisite`/`next` 雙向一致、參照完整。
   - 顆粒度：每 Topic 5–12 Concept、每 Module 10–30 Concept（全量時 MUST 生效，不豁免）。
   - frontmatter zod 通過；`id` 全域唯一；每個 `leetcode` 題號存在於 Problem Bank。
5. 產出 `curriculum/outline.md`（確定性序列化）。

## 4. 輸出

- `concepts/{topic}/{NNN}-{slug}.md`（Skeleton；通過結構 Gate 者）。
- `data/problem-bank.json`（擴充後）。
- `curriculum/outline.md`。
- stdout：各 Module 生成/跳過摘要；stderr：具名違規（沿用 F2/F4 `formatViolation` 風格）。

## 5. Exit code

| code | 條件 |
| --- | --- |
| 0 | 結構 Gate 零 error；產物寫出；outline 產生 |
| 1 | 缺 `GEMINI_API_KEY` / 結構 Gate 有 error（**不寫 outline、不視為定稿**）/ 素材載入失敗 / 節流退避耗盡 |

## 6. 不變式（MUST）

- LLM MUST NOT 生成題目 metadata（號/連結/難度/slug）——只提候選題號。
- 結構 Gate 有 error ⇒ MUST NOT 進定稿階段（outline 不作為可展開訊號）。
- `@google/genai` MUST NOT 被 `src/` import（掃描測試守）。
- 顆粒度/DAG 檢查 MUST 重用 F2 單一實作，MUST NOT 另寫平行檢查。

## 7. 人工定稿（Stage 1 之後、Stage 2 之前）

維運者 review `outline.md`（唯一人工檢查點）→ 核可即 `git commit`（凍結 Skeleton + bank + outline）。
不核可 ⇒ 調參數/提示、重跑 Stage 1（不逐篇手改）。
