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

## 每批流程（2026-08-29 修訂；2026-09-01 改 6 Fable + 2 Opus 輪派，Phase 8 實測後同日再改為
reviewer 1 對 1 即拋即審；**2026-09-02 再改為 reviewer 就地修、Fable 交件即關**，Phase 11 起適用）

```
6 個乾淨的 Fable agent 並行 ── 寫 article + quiz 片段；長篇 findings 寫檔，只回傳短摘要
        │  （每有一個交件，立即開一個新 reviewer 送審，不等全批交齊）
        ▼
Fable agent ──────────────── 交件並經 orchestrator 收下後即關閉，不留待退修
        │
        ▼
Opus reviewer ×6（1 對 1）─── 每交件即 spawn 一個新 reviewer，只審該作者的產出，做「機械
        │                     Gate 驗不到」的內容品質審查；**findings 就地修到好**
        │                     （只讀＋改檔，MUST NOT 執行任何指令）
        ▼
orchestrator ─────────────── 代跑該篇 gate:articles --only <id> --skip-quiz 看到 ✓
        │                     → 才關掉這個 reviewer
        ▼
orchestrator ─────────────── npm run verify:phase（一個指令跑完全部機械驗證）
        │
        ▼
orchestrator ─────────────── commit 凍結、更新 batches.md / phases.json
        │
        ▼
全部 agent 皆已在各自環節關閉，下一批開新的（維持 context 乾淨）
```

**設計理由**（Phase 1 實測後定案，其後隨各次改制增補）：

- **驗證留在 orchestrator，MUST NOT 外包**：`verify:phase` 的每一步都是失敗即非零 exit 的
  腳本，不需要判斷力。派 agent 去跑 shell 指令成本高而附加價值低。context 的大宗是那些
  冗長輸出，`verify:phase` 只印一行摘要即已解決。
- **commit 留在 orchestrator**：commit 訊息與 `batches.md` 是寫給人看的，需要理解整批發生
  什麼；CLAUDE.md 對 commit 規範亦訂得很細。
- **修正迴路改為 reviewer 就地修（2026-09-02 修訂，取代原「MUST 回到原作者」）**：
  舊規則的論據是「作者帶著寫那些選項的完整脈絡，換人改要重新理解語意」（Phase 1 實測退修
  只花 4 次工具呼叫、102 秒）。改制的三個理由：
  1. **1 對 1 的 reviewer 正是剛逐字讀完該篇的人**，對「錯在哪」的掌握不亞於作者。
     Phase 9／10 的 5 個 MAJOR（Hint 洩漏後續課、strict TS 下的假命題、因果錯置、
     收尾條件寫反）**全是作者自己寫錯又沒看出來**的——退回同一個腦袋，等於要求它重想一次
     它本來就沒想清楚的事。
  2. **模型分工**：Fable 強在大量產出便宜，Opus 強在低量高精度；退修屬於後者。
  3. **少一次語意轉手**：省掉「reviewer 報告 → orchestrator 讀懂 → 轉寫退修指令 → 作者
     理解」三跳，也省 orchestrator 的 context；且 Fable 交件即關，不再需要喚醒既有 agent，
     Phase 8 無聲卡關那條風險面直接消失。
  **⚠️ MUST NOT 期待它省下多少 Fable 用量**：閒置 agent 不計費，省的只有退修回合的 Fable
  token，而本檔已實測「退修率不是主要成本因子，Concept 數才是」（Phase 4、5 退修 0 篇仍是
  0.65／Concept）。真正的收益是把成本從瓶頸資源（Fable 週額度）移到非瓶頸（Opus），
  以及 wall-clock 與零卡關。
- **不採「MINOR 就地修、MAJOR 退回原作者」的分流**（2026-09-02 評估後否決）：那會讓
  「Fable 能否關閉」變成條件式（要等 reviewer 判完等級才知道），交件即關與零喚醒風險這兩個
  最大的好處全沒了；而 MAJOR 的量是 Phase 9 一件、Phase 10 四件，少到不值得為它保留
  一整套機制。
- **Opus reviewer 補的是真正的盲點**：Phase 1 只跑了機械 Gate，**沒有任何人讀過那 14 篇的
  內容**。Gate 保證格式、字數、程式碼可執行，保證不了論證是否正確、是否好讀。
- **reviewer 隨交件逐步啟動（2026-09-01 修訂）**：不等全批交齊——等全批再審會讓最早交件的
  篇章白白閒置整段尾巴時間；審查與寫作重疊進行，縮短整批 wall-clock。
- **reviewer 1 對 1、即拋即審、審完即關（2026-09-01 Phase 8 實測後定案，使用者指定）**：
  曾採「2 個 reviewer 共用、SendMessage 輪流追加派件」制，Phase 8 實測發生**無聲卡關**：
  派件訊息若在對方停機瞬間送出，只入佇列、不喚醒（工具回應顯示「queued for delivery」而非
  「Resuming」即為此況），reviewer 無聲閒置直到使用者發現。改為每交件 spawn 全新 reviewer
  即無此時序風險。**代價（已知並接受）**：每個 reviewer 各自重讀 brief 與 pipeline-defects，
  Opus 用量升約一倍（2 共用制實測每批合計 ~343K；1 對 1 估每個 ~100–130K、單批 6 個合計
  ~600–780K）——換零卡關與更高的審查並行度，Opus 額度非目前瓶頸。
- **reviewer 有改檔權、但仍 MUST 維持零執行權（D14 紅線不鬆）**：D14 出事的是**執行子行程**
  （Windows 上 `execSync` 的 timeout 殺不掉孫行程，漏出 10 個吃滿約 7 核的孤兒），不是寫檔。
  故 reviewer MAY 讀檔與改檔，MUST NOT 執行任何指令或開子行程。
- **改完的逐篇 Gate 由 orchestrator 代跑（補上新制的自檢缺口）**：舊制每次「改完」都有一道
  作者自跑 `gate:articles` 至 ✓ 的關（`agent-brief.md` §7 規定的是「改完每一個 Concept 後」，
  退修亦適用）；reviewer 無執行權，這格會空掉。而手改文章踩到的正是逐區塊預算、繁中、
  程式碼實測這些項目——若拖到收批才由 `verify:phase` 發現，改的人已關、且該指令**失敗即中止**
  會擋住整批、要從頭重跑。故 orchestrator MUST 在關掉 reviewer 前代跑該篇 Gate。
- **就地修 MUST 是最小外科手術**：reviewer 是拿 Opus 的筆改 Fable 寫的文章，容易順手把口吻
  改成自己的。只改 finding 指名之處，MUST NOT 順手潤稿、MUST NOT 調整固定區塊結構。

### 1. 取本批清單

讀 `specs/012-content-regeneration/phase-NN.json` 的 `concepts`（含 `article` 路徑與 `quizCount`）。

### 2. 開 6 個乾淨的 Fable agent 並行

- 模型 **MUST 為 `fable`**。單批 Concept 總數照舊（一個 Phase），每個分 1～3 個 Concept，
  **分配 MUST 互斥**。
- prompt MUST 包含：`agent-brief.md` 絕對路徑、指派的 conceptId 與各自 `quizCount`、
  quiz 片段輸出目錄、「交件前 MUST 跑 `npm run gate:articles -- --only <id> --skip-quiz` 看到 ✓」、
  「MUST NOT 執行 git 指令」、「MUST NOT 碰其他 Concept」。
- **長篇 findings MUST 寫入 `<scratchpad>/f12/phase-NN/findings/<conceptId>.md`**，
  回傳只給短摘要（Gate 結果、字數、發現幾項缺陷）。長敘述進 orchestrator 的 context 是浪費。
- **交件並經 orchestrator 收下後即可關閉**（2026-09-02 起）：退修不再回到原作者（見 §3），
  不需等 `verify:phase`。關閉後 MUST 依 D14 第三層防護檢查殘留的 `node.exe` 行程。

quiz 片段目錄慣例：`<scratchpad>/f12/phase-NN/quiz/<conceptId>.json`。

### 3. Opus reviewer：1 對 1 即拋即審、findings 就地修

模型 **MUST 為 `opus`**。**不等全批交齊**：

- 每有一個 Fable agent 交件，**立即 spawn 一個全新的 reviewer agent**，只審該作者的產出
  （1 對 1）；**審完並就地修完**再回報，之後即關閉，不留待命、不接第二件。單批最多 6 個。
- **MUST NOT 用 SendMessage 對既有 reviewer 追加派件**（Phase 8 卡關教訓，見設計理由）。
- **MUST NOT 執行任何指令或開子行程**（D14 紅線，改制後不變）：只允許**讀檔與改檔**。
  需要實跑驗證的命題具名列在回報裡，由 orchestrator 決定是否自行驗
  （不終止變體 MUST 加步數熔斷）。

職責是**讀內容並把它修好**：

- 逐篇讀分派到的新教材，檢查論證是否成立、範例是否與敘述一致、程式碼是否真的示範了該 Concept。
- 對照 `pipeline-defects.md` 的已知樣態複查（Tomorrow Preview vs `next`、教材與 quiz 是否互相矛盾）。
- **自己動手把 findings 修到好**，涵蓋該 Concept 的 `articles/**` 與其 quiz 片段
  （`<scratchpad>/f12/phase-NN/quiz/<conceptId>.json`）。
- **修改幅度 MUST 是最小外科手術**：只動 finding 指名之處；MUST NOT 順手潤稿、
  MUST NOT 改寫沒問題的段落、MUST NOT 調整固定區塊結構或區塊順序。
- **MUST NOT 碰其他 Concept 的檔案**，更 MUST NOT 動 `concepts/`、`schedules/`、
  `curriculum/`、`data/problem-bank.json`（結構凍結範圍）。
- 回報 MUST 具名列出：發現幾項（BLOCKER / MAJOR / MINOR）、**每一項改了什麼、改在哪個檔案的
  哪一段**、以及未修而需 orchestrator 處置的項目。

**orchestrator 的收關步驟**（MUST，補 reviewer 無執行權造成的自檢缺口）：

```bash
npm run gate:articles -- --only <conceptId> --skip-quiz
```

看到 `✓ <conceptId>` **才可關閉該 reviewer**；失敗則把具名原因回送同一個 reviewer 續修
（它此時仍開著，喚醒後 MUST 檢查工具回應是「Resuming」而非「queued for delivery」）。

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
- **確認該批已無存活 agent**：Fable 於交件收下後即關、reviewer 於逐篇 Gate ✓ 後即關，
  正常情況下走到這裡應已全數關閉；MUST 用 ListAgents 核實一次，並依 D14 第三層防護
  檢查殘留的 `node.exe` 行程。下一批開全新的 agent（維持 context 乾淨）。

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
| Phase 7 收批後（於 Phase 8 開跑前實測） | 56% | 69 |
| Phase 8 收批後 | 67% | 79 |
| Phase 9 收批後 | 75% | 88 |
| Phase 10 收批後 | 83% | 97 |
| **Weekly 新週期開始**（2026-09-02） | **0%**（額度重置） | 97 |
| Phase 11 收批後 | **6%** | 107 |

**分段成本差異很大，MUST 用最近一批的數字外推，不要用總平均**：

| 區間 | 百分點 | Concept 數 | 每 Concept |
| --- | --- | --- | --- |
| Phase 1 + 2 | 9 | 22 | **0.41** |
| Phase 3 | 6 | 9 | **0.67** |
| Phase 4 + 5 | 13 | 20 | **0.65** |
| Phase 11（就地修新制，新週期） | 6 | 10 | **0.60** |
| 累計（自 9% 起算） | 28 | 51 | 0.55 |

**⚠️ 2026-08-29 修正：退修率不是主要成本因子，Concept 數才是。**
曾以為 Phase 3 的 0.67 是被 8/9 篇的退修率推高，於是預測「Phase 4、5 是 0 退修，成本應落回 0.41」。
實測打臉：Phase 4、5 **兩批都是 reviewer 判定退修 0 篇**，每 Concept 仍是 **0.65**。

**⚠️ 2026-09-01 再修正：0.65 已失效，現行單價約 1.1／Concept。**
Phase 7（45%→56%，9 個）＝ 1.22（含 D14 事故損耗）；Phase 8（56%→67%，10 個）＝ **1.10**
（無事故、fable token 反而較低的 6+2 新制批次）。連續兩批遠高於 0.65，且 Phase 8 的
subagent token（744K fable）比 Phase 6（1,258K）低四成、百分比卻相同——**token 數與用量
百分比並不同步**，成因不明（可能與計量口徑或 Opus reviewer 併計有關），MUST NOT 假設
token 省=額度省。**外推一律用 1.1**；0.65～0.67 是 Phase 3–6 的舊值，MUST NOT 再用。
（2026-09-01 補充：Phase 9（67%→75%，9 個）＝ **0.89**；Phase 10（75%→83%，9 個）＝ **0.89**
（同值，且同為 9 個 Concept）。新制三批為 1.10 / 0.89 / 0.89，外推可用 0.9～1.1 區間、
**以 1.1 當上界**做預算判斷；9 個 Concept 的批次實測穩定落在 8 個百分點。）

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
- token 側的實測基準：Fable 端 6 agent 制實測 **74～78K subagent tokens / Concept**
  （舊 4 agent 制約 93～125K）；Opus reviewer：2 共用制實測每批合計 **343K**，
  1 對 1 制 Phase 9 實測每個 **95～136K**、單批 6 個合計 **665K**（先前估 600–780K 命中）。
- **2026-09-02 就地修改制的 Phase 11 實測（取代先前估計）**：Fable 6 個作者合計 **630K**
  （**63K／Concept**，低於 6 agent 制基準的 74～78K）；Opus 6 個 reviewer 合計 **700K**
  （每個 **105～132K**，落在就地修估計區間 120–160K 的下緣）。
- **⚠️ 本檔先前的「MUST NOT 假設 Fable 額度會明顯下降」預測被實測推翻**：Phase 11 為 **0.60／Concept**
  （0%→6%、10 個 Concept），較新制前三批的 1.10 / 0.89 / 0.89 明顯下降。token 側同向（78K→63K）。
  合理歸因是**退修回合整段消失**（10 篇全部一次交件即過、零退修）。**但單點實測 MUST NOT 當定論**：
  本批同時是 Weekly 新週期首批，計量口徑是否隨週期重置而不同尚無對照。**外推暫以 0.6～0.9 區間、
  以 0.9 當上界**做預算判斷，待 Phase 12 收批後再校準。
