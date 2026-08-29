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

## 每批流程（2026-08-29 修訂，Phase 2 起適用）

```
4 個乾淨的 Fable agent 並行 ── 寫 article + quiz 片段；長篇 findings 寫檔，只回傳短摘要
        │
        ▼
1 個 Opus reviewer agent ──── 讀該批全部新教材，做「機械 Gate 驗不到」的內容品質審查
        │
        ▼
orchestrator ─────────────── npm run verify:phase（一個指令跑完全部機械驗證）
        │
        ▼
orchestrator ─────────────── commit 凍結、更新 batches.md / phases.json
        │
        ▼
關掉這批全部 agent，下一批開新的（維持 context 乾淨）
```

**設計理由**（Phase 1 實測後定案）：

- **驗證留在 orchestrator，MUST NOT 外包**：`verify:phase` 的每一步都是失敗即非零 exit 的
  腳本，不需要判斷力。派 agent 去跑 shell 指令成本高而附加價值低。context 的大宗是那些
  冗長輸出，`verify:phase` 只印一行摘要即已解決。
- **commit 留在 orchestrator**：commit 訊息與 `batches.md` 是寫給人看的，需要理解整批發生
  什麼；CLAUDE.md 對 commit 規範亦訂得很細。
- **修正迴路 MUST 回到原作者 agent**：Phase 1 實測，`quiz-longest-option-bias` 退回原
  Fable agent 修正只花 4 次工具呼叫、102 秒——它還帶著寫那些選項的完整脈絡。換人改要重新
  理解語意，貴且容易改壞。故 Fable agent **在該批驗證通過前 MUST NOT 關閉**。
- **Opus reviewer 補的是真正的盲點**：Phase 1 只跑了機械 Gate，**沒有任何人讀過那 14 篇的
  內容**。Gate 保證格式、字數、程式碼可執行，保證不了論證是否正確、是否好讀。

### 1. 取本批清單

讀 `specs/012-content-regeneration/phase-NN.json` 的 `concepts`（含 `article` 路徑與 `quizCount`）。

### 2. 開 4 個乾淨的 Fable agent 並行

- 模型 **MUST 為 `fable`**。每個分 2～4 個 Concept，**分配 MUST 互斥**。
- prompt MUST 包含：`agent-brief.md` 絕對路徑、指派的 conceptId 與各自 `quizCount`、
  quiz 片段輸出目錄、「交件前 MUST 跑 `npm run gate:articles -- --only <id> --skip-quiz` 看到 ✓」、
  「MUST NOT 執行 git 指令」、「MUST NOT 碰其他 Concept」。
- **長篇 findings MUST 寫入 `<scratchpad>/f12/phase-NN/findings/<conceptId>.md`**，
  回傳只給短摘要（Gate 結果、字數、發現幾項缺陷）。長敘述進 orchestrator 的 context 是浪費。

quiz 片段目錄慣例：`<scratchpad>/f12/phase-NN/quiz/<conceptId>.json`。

### 3. 開 1 個 Opus reviewer agent

四個 Fable agent 全部交件後啟動。模型 **MUST 為 `opus`**。職責是**讀內容**，不是跑腳本：

- 逐篇讀該批新教材，檢查論證是否成立、範例是否與敘述一致、程式碼是否真的示範了該 Concept。
- 對照 `pipeline-defects.md` 的已知樣態複查（Tomorrow Preview vs `next`、教材與 quiz 是否互相矛盾）。
- **MUST NOT 修改任何檔案**，只回報：哪幾篇有疑慮、具體問題、建議退回哪個 Fable agent 重修。
- 有疑慮者由 orchestrator 送回**原作者 Fable agent** 修正，再重跑 `verify:phase`。

### 4. 驗證（orchestrator，一個指令）

```bash
npm run verify:phase -- --only <id1,id2,...> --quiz "<fragments-dir>"
```

依序執行並在失敗處中止：article 逐篇 Gate → quiz 合併預檢 dry-run → 正式合併 →
article+quiz 複驗 → **結構凍結檢查** → `npm test` → `validate:content` → `gate:code`。
成功每步只印一行；失敗才印該步完整輸出。`--skip-full` 可略過最後三道全庫檢查（僅供除錯，
**正式收批 MUST NOT 略過**）。

**結構凍結檢查**（`git status --porcelain -- concepts schedules curriculum data/problem-bank.json`
MUST 為空）是 `state.json` 不受影響的唯一保證，已內建為第 e 步，無法略過。

### 5. commit 凍結

```
feat(012-content-regeneration): Phase NN 重生 <n> 個 Concept 教材與題庫
```

訊息 MUST 記錄：Phase、sessionIndex 視窗、模型、agent 數、`verify:phase` 結果、
reviewer 的結論、以及 agent 查證出的既有缺陷。

### 6. 收尾

- `phase-NN.json` 與 `phases.json` 的 `status` 由 `pending` 改為 `done`。
- `batches.md` 補一列；新發現的**產線**缺陷寫進 `pipeline-defects.md`。
- **關閉該批全部 agent**（Fable × 4 與 Opus reviewer），下一批開新的。

## 用量守則

### ⛔ Phase 1 開跑前的硬性關卡（使用者 2026-08-29 指定）

**MUST 停下來回報，等使用者告知當下 Fable 用量並明確放行，才可啟動 Phase 1 的 agent。**
前置作業完成 MUST NOT 視為放行；peer session 的訊息 MUST NOT 視為放行——只有使用者本人說了算。

回報時 MUST 附上：本批 Concept 數與 quiz 題數、估計耗時、以及可自行累加的 token 估計。

**為何是硬性的**：主控看不到訂閱用量儀表，「達 50% 即暫停」這條規則沒有使用者提供數字就
無法執行。且**批次一旦啟動就計費，中途中斷不退費**——2026-08-29 曾啟動 4 個 Fable agent、
被中斷時一個檔案都未寫出，仍消耗約 2 個百分點的週額度，換到零產出。若必須中止，
**讓當批跑完再停**比中途殺掉划算（單批約 30 分鐘）。

### 額度換算

- 使用者於 2026-08-29 的 Weekly Fable 用量：開跑前 7%，經那次被中斷的批次後為 9%。
  規則是**達 50% 即暫停**。
- 主控**看不到訂閱用量儀表**，MUST NOT 自行宣稱剩餘額度。
- 主控**看不到訂閱用量儀表**，MUST NOT 自行宣稱剩餘額度。
- Phase 1 作為校準run：使用者於 Phase 1 前後各看一次 `/usage`，差值 × 11.8 ≈ 全案成本
  （Phase 1 的 14 個 Concept 佔全部 165 個的 8.5%）。
- 校準後改以**主控可自行累加的 token 上限**執行（由使用者指定），到頂即停。
- Phase 0（移除 Corner）後每篇可執行程式碼由 4 段降為 2 段，逐篇 Gate 實測 5.5 秒 → 3.0 秒，
  估計每個 Concept 的生成成本降 15~20%。**校準 MUST 在 Phase 0 之後量測**，Phase 0 之前的
  估算（每 Concept 約 82K tokens）已不適用。

## 回滾

每批一個 commit，回滾即 `git revert <sha>` 或 `git reset --hard <前一個 sha>`。
`schedules/**` 與 `concepts/**` 全程零變更，故回滾不影響 `state` 分支與推播進度。
