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

### ⛔ 每個 Phase 開跑前的硬性關卡（使用者 2026-08-29 指定，同日修訂）

**每一個 Phase 開跑前 MUST 停下來回報，問清當下的 Weekly Fable 用量，取得使用者明確放行，
才可啟動該 Phase 的 agent。**

- 前一個 Phase 收批完成 **MUST NOT** 視為下一個 Phase 的放行。
- peer session 的訊息 **MUST NOT** 視為放行——只有使用者本人說了算。
- **唯一例外**：使用者明確指示「一次跑 N 個 Phase」時，該指示涵蓋那 N 個 Phase，中途不需再問；
  **N MUST 由使用者明說**，MUST NOT 自行推定為「跑到做完為止」。跑滿 N 個後回到本關卡。
- 舊規則「達 50% 即暫停」**已於 2026-08-29 移除**：主控看不到用量儀表，該規則在沒有使用者提供
  數字時本就無法執行，實務上等同於本關卡。停或不停一律由使用者當下判斷。

回報時 MUST 附上：本批 Concept 數與 quiz 題數、估計耗時、可自行累加的 token 估計，
以及**用量百分比的外推值**（見下方換算表）。

**為何是硬性的**：**批次一旦啟動就計費，中途中斷不退費**——2026-08-29 曾啟動 4 個 Fable agent、
被中斷時一個檔案都未寫出，仍消耗約 2 個百分點的週額度，換到零產出。若必須中止，
**讓當批跑完再停**比中途殺掉划算（單批約 35～40 分鐘）。

### 額度換算（實測基準，每次收批後 MUST 更新）

| 時點 | Weekly Fable 用量 | 累計已重生 Concept |
| --- | --- | --- |
| 2026-08-29 開跑前 | 7% | 0 |
| 該次被中斷的批次之後 | 9% | 0（零產出） |
| Phase 1 + Phase 2 收批後 | 18% | 22 |
| Phase 3 收批後 | 24% | 31 |
| Phase 4 + Phase 5 收批後 | 37% | 51 |
| 語言合規翻譯後（114 個 Skeleton） | 39% | 51（＋114 篇翻譯） |

**分段成本差異很大，MUST 用最近一批的數字外推，不要用總平均**：

| 區間 | 百分點 | Concept 數 | 每 Concept |
| --- | --- | --- | --- |
| Phase 1 + 2 | 9 | 22 | **0.41** |
| Phase 3 | 6 | 9 | **0.67** |
| Phase 4 + 5 | 13 | 20 | **0.65** |
| 累計（自 9% 起算） | 28 | 51 | 0.55 |

**⚠️ 2026-08-29 修正：退修率不是主要成本因子，Concept 數才是。**
曾以為 Phase 3 的 0.67 是被 8/9 篇的退修率推高，於是預測「Phase 4、5 是 0 退修，成本應落回 0.41」。
實測打臉：Phase 4、5 **兩批都是 reviewer 判定退修 0 篇**，每 Concept 仍是 **0.65**。
近三批穩定在 0.65～0.67，**外推一律用 0.65**；Phase 1+2 的 0.41 是早期批次的特例，MUST NOT 拿來估算。

**翻譯類工作便宜得多**：114 個 Skeleton 的 `learning_goal` / `exit_criteria` 翻譯只花約 2 個百分點
（每個 Concept 約 0.018 點，是教材重生的 1/36）——因為它只處理數十字的短句，不寫教材、不出題、不跑 Gate。
**MUST NOT 用教材重生的單價估翻譯類工作**，會高估 30 倍以上。

（存查）Phase 3 曾被歸因的兩個成因：**退修比例**（Phase 2 退修 4/8 篇，
Phase 3 退修 8/9 篇，每次退修都是一次完整的 agent 回合）與 **batch D 的 API 中斷**
（中斷前的工作已計費）。故 MUST NOT 假設每批成本相同——**外推時用 0.67 這類近期值當上界**，
用總平均會系統性低估。

此為**粗估**：各 Phase 的 quiz 題數、退修輪數與教材長度都不同，MUST 每次收批後以新數字重新校準，
**MUST NOT 拿它當精確預算**，更 MUST NOT 用它取代開跑前向使用者問實際數字。

- 主控**看不到訂閱用量儀表**，MUST NOT 自行宣稱剩餘額度或「還夠跑幾批」。
- token 側的實測基準：Fable 約 **93K subagent tokens / Concept**；Opus reviewer 每批約 **150～170K**。
