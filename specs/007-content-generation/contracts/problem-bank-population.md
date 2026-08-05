# Contract: 題庫擴充 — `scripts/populate-problem-bank.ts`（Q1 / R5）

驗證 Stage 1 提出的候選 `leetcode` 題號並填入事實 metadata。**題目事實一律由程式帶入，MUST NOT 由 LLM 生成，
MUST NOT 抓取題目描述（§5）。**

## 1. 呼叫

```
npm run populate:problem-bank -- [--force]
```

可獨立執行，亦由 `generate-curriculum.ts` 於結構 Gate 前呼叫其核心函式（合併邏輯抽出為純函式供單測）。

## 2. 輸入

- 全部 `concepts/**` Skeleton 的 frontmatter `leetcode`（候選題號集合）。
- `data/leetcode-index.json`（committed metadata 快照：題號 → `{slug,title,difficulty}`；主來源）。
- 現有 `data/problem-bank.json`。

## 3. 流程（MUST）

1. 蒐集全部候選題號、去重。
2. 對 bank 中**尚無**的題號，依序：
   a. 查 `leetcode-index.json` 快照 → 命中即取 `slug/title/difficulty`、組 `url`（`https://leetcode.com/problems/{slug}/`）。
   b. 快照未命中 ⇒ 以 Node `fetch` 打 LeetCode 公開 GraphQL **metadata** 端點取 `titleSlug/title/difficulty`
      （**只 metadata、不取 content**），寫回快照。
   c. 線上仍查無 ⇒ 該題號**無效**：回報錯誤（指名 conceptId + 題號）以驅動 Stage 1 重生，MUST NOT 憑空編造。
3. 併入 bank：既有題號不覆蓋（除非 `--force`）；只新增缺漏題號；`patterns` 依對應 Concept 的 topic/pattern key。
4. 一致性檢查：每筆 `url` slug 與 `slug` 一致（沿用既有 Gate 規則）。

## 4. 輸出

- `data/problem-bank.json`（擴充後；commit 凍結）。
- `data/leetcode-index.json`（補齊後）。
- stderr：查無題號 / slug 不一致的具名錯誤。

## 5. Exit code

| code | 條件 |
| --- | --- |
| 0 | 全部候選題號皆有有效 metadata 並併入 bank |
| 1 | 任一候選題號查無（無效）/ 網路取得失敗且快照無此題 / slug 不一致 |

## 6. 不變式（MUST）

- `id/slug/title/url/difficulty` MUST 來自快照或線上 metadata，MUST NOT 由 LLM 生成。
- MUST NOT 抓取或存入題目描述文字（§5）。
- 產線（Stage 1/Stage 2、CI）**只讀快照**時 MUST 可離線、可重現；線上補齊只發生在快照缺項的維護時機。
- 只送/取公開資料（FR-021）。
