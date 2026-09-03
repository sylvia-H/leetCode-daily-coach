# F12 · 教材重生（content regeneration）

**分支**：`012-content-regeneration` ／ **憲章依據**：XVII 例外條款（v1.1.0）
**流程**：精簡流程（使用者 2026-08-29 決定）——不跑 clarify / checklist / analyze，
需求已於決策對話中釐清完畢。

## 為什麼做

既有 `articles/**`（165 篇）與 `data/quiz-bank.json`（1,216 題）由 `gemini-3.5-flash-lite`
生成。三模型比稿（Fable / Opus / Sonnet，同一 Concept 同一 brief）暴露既有內容有**自動 Gate
結構上抓不到**的缺陷，並已逐項查證：

1. **quiz 正解標錯**：`two-pointer-container-water` item[5] 宣稱「兩端等高時同時移動兩端會漏解」。
   窮舉驗證（隨機 200,000 組含首尾等高 50,004 組 ＋ 全窮舉 3,276 組）不一致組數為 **0**——
   該題正解標反。此題通過全部 13 條 quiz Gate 判準，也通過了同模型家族的盲答交叉驗證
   （`generate-quiz-bank.ts` 檔頭已預先承認此機制的相關性限制）。
2. **Tomorrow Preview 與課表不符**：同一 Concept 的 Skeleton `next` 為
   `two-pointer-trapping-rain-water`，教材卻寫「明天將探討 3Sum」（3Sum 是更早的課）。
3. **題目適配性敘述錯誤**：把 344 Reverse String 說成「貪婪策略」。
4. **教學深度不足**：觀念本體上限 2000 字，既有樣本僅用 713 字（36%），普遍只斷言不論證。

## 範圍

- **In**：`articles/**`（165 篇修訂）、`data/quiz-bank.json`（1,216 題重寫）。
- **Out**：`concepts/**`（Author Hints 不改）、`schedules/**`、`curriculum/**`、
  `data/reflection-bank.json`、`data/encouragement.json`（使用者決定 materials 不做）。

## 不可違反的約束

1. **結構欄位凍結**：MUST NOT 改動 Skeleton 的 `id` / `module` / `topic` / `prerequisite` /
   `next` / `leetcode` / `localOrder`，以及 Article frontmatter。
   ⇒ `schedules/**` 維持 byte-identical、`state.json` 的 `currentSessionIndex` 不受影響。
2. **單一 Gate**（憲章 IX）：驗證一律走 `scripts/lib/article-gate.ts` 的 `runPerArticleGate`
   與 `src/compiler/quiz.ts` 的 `checkQuizBank`，MUST NOT 另立平行判準。
3. **正解位置**由 `rebalanceAnswerPositions` 於合併時確定性重排，MUST NOT 交給 agent 決定。
4. **一次性**：活動結束後產線恢復全自動（憲章 XVII 例外條款第 4 項）。

## 產線切分（依時間軸，以 `currentSessionIndex = 28` 為原點）

Phase 1 = 過去一週 + 未來一週（sessionIndex 21–34）；Phase N 各往兩側再推一週，
至 sessionIndex 0 消化完畢後改為每批兩週往未來推進。共 18 個 Phase、165 個 Concept。

| Phase | 視窗 | 新增 Concept | 累計 |
| --- | --- | --- | --- |
| 1（pilot） | 21–34 | 14 | 14（8%） |
| 2 | 14–41 | 8 | 22（13%） |
| 3 | 7–48 | 9 | 31（19%） |
| 4 | 0–55 | 10 | 41（25%） |
| 5–17 | 56–237（每批 14 session） | 9–10 | 163（99%） |
| 18 | 238–251 | 2 | 165（100%） |

## 執行方式

- 生成模型：**Claude Fable**（比稿結論，使用者 2026-08-29 決定）。
- 每批開 **4 個乾淨的 Fable agent 並行**，批次結束即關閉，下一批開新 agent（維持 context 乾淨）。
- 每批完成 → `gate:articles` 全數通過 → 合併 quiz → commit 凍結。
- **Phase 1 完成後停下讓使用者審閱**；其餘 Phase 不停，直接走完。
- 用量守則：Phase 1 作為校準run，實測 Fable 週用量增幅後換算全案成本。

## 驗收

- 每個 Phase 的全部 Concept `npm run gate:articles -- --only <ids>` 通過。
- Phase 結束後 `npm test`、`npm run validate:content`、`npm run gate:code` 通過（CI 亦會跑）。
- `git diff --stat` 確認 `schedules/**` 與 `concepts/**` **零變更**。
