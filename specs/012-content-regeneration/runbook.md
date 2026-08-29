# F12 每批作業 Runbook

**跨 session 續跑的唯一依據是本檔與 `phases.json`，MUST NOT 依賴對話記憶。**
進度看 `phases.json` 各 Phase 的 `status`（`pending` / `done`）與 `batches.md` 的 commit 紀錄。

## 前置（已完成，不需重做）

| commit | 內容 |
| --- | --- |
| `166d8bc` | 憲章 XVII 一次性重生例外（v1.1.0）＋ spec §4-17 |
| `24f2756` | `gate:articles` CLI ＋ per-article Gate 抽出至 `scripts/lib/article-gate.ts` |
| `a732d80` | spec.md、agent-brief.md、phase-01.json |
| `949cb4a` | `merge:quiz` 片段合併工具 |
| `b0a91df` | 18 個 `phase-NN.json` + `phases.json`、執行守衛、單元測試、本 runbook |
| （Phase 0 末批） | **移除 `TypeScript Corner` / `Python Corner`**：spec §10 契約、產線 prompt、Pages 版面、165 篇教材（詳見 `batches.md`）。⚠️ Phase 1 起的 Article **MUST NOT** 再含這兩段 |

## 每批步驟

### 1. 取本批清單

讀 `specs/012-content-regeneration/phase-NN.json` 的 `concepts`（含 `article` 路徑與 `quizCount`）。

### 2. 開 4 個乾淨的 Fable agent 並行

- 模型 **MUST 為 `fable`**（比稿結論）。
- 每個 agent 分到 2～4 個 Concept，**分配 MUST 互斥**（同批並行，重疊會互相覆蓋）。
- prompt MUST 包含：`agent-brief.md` 絕對路徑、指派的 conceptId 與各自 `quizCount`、
  quiz 片段輸出目錄絕對路徑、「交件前 MUST 跑 `npm run gate:articles -- --only <id> --skip-quiz`
  看到 ✓」、「MUST NOT 執行 git 指令」、「MUST NOT 碰其他 Concept」。
- **一批做完就關掉那批 agent，下一批開新的**（維持 context 乾淨；使用者 2026-08-29 指定）。

quiz 片段目錄慣例：`<scratchpad>/f12/phase-NN/quiz/<conceptId>.json`。

### 3. 收件後的驗證序列（MUST 依序全過才 commit）

```bash
# a. 逐篇 Gate（與 CI 同一顆）——本批全部 conceptId
npm run gate:articles -- --only <id1,id2,...> --skip-quiz

# b. 合併 quiz 片段（先 dry-run 預檢，含正解位置確定性重排與品質 Gate）
npm run merge:quiz -- "<fragments-dir>" --dry-run
npm run merge:quiz -- "<fragments-dir>"

# c. 合併後連 quiz 一起複驗
npm run gate:articles -- --only <id1,id2,...>

# d. 結構凍結檢查——MUST 為空輸出（憲章 XVII 例外條款第 2 項）
git status --porcelain -- concepts schedules curriculum data/problem-bank.json

# e. 全庫複驗
npm test
npm run validate:content
npm run gate:code
```

**(d) 是 `state.json` 不受影響的唯一保證**：只要 `concepts/**` 與 `schedules/**` 零變更，
課表就維持 byte-identical，`currentSessionIndex` 指向的 Session 不會位移。**MUST NOT 略過。**

### 4. commit 凍結

```
feat(012-content-regeneration): Phase NN 重生 <n> 個 Concept 教材與題庫
```

`feat`（對使用者有意義的課程增量，見 CLAUDE.md commit 規範）。訊息 MUST 記錄：
Phase、sessionIndex 視窗、Concept 清單、模型、agent 數、Gate 結果、agent 回報的事實錯誤修正。

### 5. 收尾

- 把該 Phase 的 `status` 由 `pending` 改為 `done`（`phase-NN.json` 與 `phases.json` 都要）。
- 在 `batches.md` 補一列。
- **Phase 1 完成後 MUST 停下讓使用者審閱**；Phase 2 起不停，連續走完。

## 用量守則

- 使用者於 2026-08-29 開跑前的 Weekly Fable 用量為 **7%**，規則是**達 50% 即暫停**。
- 主控**看不到訂閱用量儀表**，MUST NOT 自行宣稱剩餘額度。
- Phase 1 作為校準run：使用者於 Phase 1 前後各看一次 `/usage`，差值 × 11.8 ≈ 全案成本
  （Phase 1 的 14 個 Concept 佔全部 165 個的 8.5%）。
- 校準後改以**主控可自行累加的 token 上限**執行（由使用者指定），到頂即停。

## 回滾

每批一個 commit，回滾即 `git revert <sha>` 或 `git reset --hard <前一個 sha>`。
`schedules/**` 與 `concepts/**` 全程零變更，故回滾不影響 `state` 分支與推播進度。
