# LeetCode Daily Coach

> **Ascent**：循序登頂的每日演算法課程引擎。依所選 Track，約 6.5～8 個月的每日小步練習，從 Easy 穩步進階到 Medium / Hard。

🔗 **儀表板 / 全文閱讀 / RSS**：[sylvia-h.github.io/leetCode-daily-coach](https://sylvia-h.github.io/leetCode-daily-coach/)

一套**演算法課程引擎（Learning Pipeline）**，不是題目推播機。核心 Pipeline 是
`Knowledge Graph → Learning Path → Today's Lesson → Discord`：每日早晨推播**一則解題觀念
（Concept）＋ 1～3 題對應 LeetCode 題**，依固定課綱（DAG）循序漸進；Foundation /
InterviewReady / InterviewMastery 三個 Track 共用同一份教材與知識圖譜，各自以不同的
涵蓋深度、節奏與難度帶推進，推播至各自獨立的 Discord 頻道。

> **本專案的目標不是讓使用者刷更多題，而是建立能夠持續解題的思維模式。**

教材由 LLM 在 **build-time 一次性生成 → 過 Gate → 凍結入 repo**；**每日 runtime 零 LLM**。
零常駐、零付費：GitHub Actions（排程）+ Discord Webhook（推播）+ `state` 分支的
`state.json`（狀態）+ GitHub Pages（儀表板 / 全文 / RSS，選配）。

## 目前狀態

三個 Track 的完整課表與全部教材已全量生成、通過 Gate、凍結入 repo（F1～F9 皆已完成並併入
`develop`）：**foundation.json 198 Session／interview-ready.json 200 Session／
interview-mastery.json 243 Session**，共 165 個 Concept、165 篇 Full Article、352 題
Problem Bank、97 個測試檔 805 個測試全數通過。完整需求見 [`docs/spec.md`](docs/spec.md)，
各 Feature 的規格與實作計畫見 [`specs/`](specs/)。

---

## 目錄

- [技術亮點](#技術亮點)
- [全局架構](#全局架構)
- [三軌全量課表](#三軌全量課表)
- [內容產線（Build-time）](#內容產線build-time)
- [每日推播（Runtime）](#每日推播runtime)
- [State 管理與失敗隔離](#state-管理與失敗隔離)
- [GitHub Pages（儀表板 / 全文 / RSS）](#github-pages儀表板--全文--rss)
- [快速開始](#快速開始)
- [npm scripts](#npm-scripts)
- [環境變數](#環境變數)
- [測試與 Gate](#測試與-gate)
- [文件索引](#文件索引)

---

## 技術亮點

- **單一 Lesson Compiler，Gate 與 runtime 共用同一顆**（[`src/compiler/`](src/compiler)）：
  CI Gate 對「全部 Track × 全部 Session」跑一次完整編譯 + render 限制檢查，任何一筆失敗
  即擋下 PR；每日 runtime 呼叫的是**同一份程式碼**，MUST NOT 出現「Gate 一套解析、runtime
  另一套」的雙軌實作。把能在 CI 驗的錯誤，全部擋在早上六點之前。
- **Curriculum 是確定性 DAG，LLM 不參與排序**：課程順序（拓樸排序、無環、無前向依賴）由
  `curriculum/modules.json` + Concept frontmatter 的 `prerequisite`/`next` 決定並經自動驗證，
  LLM 只負責一次性起草教材文字，**不會動態調整或重排學習順序**。
- **課表由生成器確定性生成，同輸入 → byte-identical 輸出**（[`scripts/generate-schedule.ts`](scripts/generate-schedule.ts)）：
  `schedules/{track}.json` MUST NOT 手寫；調整課綱或節奏一律是「改設定 → 重跑生成器 →
  review diff → commit」。內建不變式自檢：`review-coverage-gap`（每個 concept 都被某週複習
  涵蓋）、拓樸子序列合法性、`session-problem-overflow`（單日題數 > 3）、無題槽自動跳過並
  留下具名 warning（`practice-no-problem` / `challenge-no-problem`）而非推出空洞訊息。
- **Renderer 是 Curriculum-agnostic 的 stateless 純函式**（[`src/renderer/`](src/renderer)）：
  輸入同一個 `Lesson` 物件必產出同一份 embeds；不讀 Curriculum / Problem Bank / 檔案 /
  state，Track 只是 `Lesson` 的一個欄位、決定不了版面結構。
- **Discord 6,000 字元硬限制的逐區塊預算控管**（[`src/renderer/budget.ts`](src/renderer/budget.ts)）：
  自訂上限收緊到 ≤5,500（保留 500 餘裕），Digest / TS Tip / Python Tip / 每題 / Exit
  Criteria / Takeaway / footer 各自獨立配額，CI Gate 對每一筆 Lesson 的 render 結果逐一檢查，
  **MUST NOT 截斷題目**——超限一律視為課表或教材缺陷、由生成端消除。
- **多 Track 失敗隔離、單一 job 依序處理**：同一個 workflow 依 `foundation → interviewReady
  → interviewMastery` 固定順序逐一編譯 / 推播；單一 Track 失敗只記錄錯誤與紅色告警、
  **繼續處理其餘 Track**，全部處理完才以非零 exit code 收尾。MUST NOT 用 Actions matrix
  平行跑多 Track——那會讓多個 job 同時搶 push `state` 分支。
- **per-track Asia/Taipei 日期 guard + 漏跑不跳課**：雙 cron（06:07 主推 / 06:37 補跑）靠
  當地日期去重，某天沒推成功則進度原地不動、下次直接續播，**永遠不會跳過課程**。
- **State 隔離在專用 orphan 分支**：`state.json` 只 commit 至 `state` 分支，8～10 個月
  240+ 筆 bot commit 不會污染 `main` / `develop` 的歷史。
- **完課是終態、不是失敗**：`currentSessionIndex` 超出課表最大值時發一次性完課通知並記錄
  `completedAt`，其後靜默跳過；課表若因課綱擴充而變長，下次執行**自動解除**完課狀態並從
  既有進度續推——不需要人工介入。
- **內容產線具備生產級韌性**（[`scripts/generate-content.ts`](scripts/generate-content.ts) 等）：
  RPM 節流、429 指數退避 + jitter、斷點續跑（checkpoint resume）、冪等（不覆蓋已凍結且未
  變更的產物，除非 `--force`），因應 Gemini free tier 限制。
- **Secrets 全走 GitHub Actions Secrets、告警自帶 URL 遮蔽**：Webhook URL 等同頻道寫入
  憑證，通知渲染函式對錯誤訊息中疑似 webhook URL 的內容一律遮蔽為 `[redacted]`，避免例外
  訊息把憑證貼進頻道歷史。
- **不轉載 LeetCode 題目內容**：題號 / 官方標題 / 連結 / 難度一律由程式從 Problem Bank
  帶入，**MUST NOT 由 LLM 生成**，只呈現「為什麼適合此 Pattern」與 Hint。
- **97 個測試檔、805 個測試全數通過**：DAG 驗證、課表生成 determinism（重複 100 次 byte
  級一致）、Lesson Compiler determinism、per-track idempotency guard（含跨日／UTC 邊界）、
  狀態推進、多 Track 失敗隔離、Renderer 純函式性與 Discord 限制、Pages stateless 守門
  等關鍵邏輯皆有單元測試覆蓋；外部呼叫（Gemini、Discord）以 mock 測試。

---

## 全局架構

```
   Curriculum (DAG)         Content (Markdown)        Problem Bank      Schedules（script 生成）
   curriculum/modules.json  concepts/** (Skeleton)    data/             schedules/{track}.json ×3
   + concept frontmatter    articles/** (Full Article) problem-bank.json overlays/{track}.json ×3
          │                        │                        │                  │
          └────────────┬───────────┴───────────┬────────────┴──────────┬───────┘
                        ▼                       ▼                       ▼
              ┌──────────────────────────────────────────────────────────┐
              │  Lesson Compiler（單一模組；CI Gate 與 runtime 共用）      │
              │  sources → validate → sessionIndex × Track → Lesson       │
              └───────────────────────────┬──────────────────────────────┘
              CI Gate：對全部 Track ×      │      每日 runtime：逐啟用 Track
              全部 Session 完整編譯 +      │      各編譯當日一筆 Lesson
              Discord 限制檢查             ▼
              ┌──────────────────────────────────────────────────────────┐
              │  Renderer（Curriculum-agnostic、stateless 純函式）        │ → Discord message
              └───────────────────────────┬──────────────────────────────┘
                                           ▼（每 Track 各自的 Webhook / 頻道）
              Discord Webhooks ◀──────────┘     state 分支 / state.json（per-track progress）
                                                          │
                                                          ▼（選配、失敗不影響核心推播）
                                          GitHub Pages：儀表板 / 全文閱讀 / RSS
```

無伺服器、無通用 DB、無常駐程序；唯一持久狀態是 `state.json`（存於專用 `state` 分支）。

### 目錄結構

```
leetcode-daily-coach/
├── docs/spec.md              # 唯一需求來源（AI-Friendly Engineering Specification）
├── curriculum/
│   ├── modules.json          # Module → Topic 骨架，16 個 Module（Level 0～15），Deterministic
│   ├── track-params.json     # 三組 Track 參數：maxLevel／problemDifficulties／rhythm
│   └── outline.md            # 課綱大綱表（產線唯一的人工定稿物）
├── concepts/{topic}/NNN-{slug}.md   # Concept Skeleton（165 篇；frontmatter + Author Hints）
├── articles/{topic}/NNN-{slug}.md   # Full Article（165 篇；LLM 展開、Gate 通過、凍結）
├── overlays/{track}.json     # Track Overlay（疊加不取代：extraProblemIds／extraNotesMarkdown）
├── schedules/{track}.json    # 三份確定性課表（198／200／243 Session）；MUST NOT 手寫
├── data/
│   ├── problem-bank.json     # 352 題 metadata（題號/標題/連結/難度一律由此帶入，不由 LLM 生成）
│   ├── encouragement.json    # 鼓勵語錄池（決定性輪替，掛載於 review Session）
│   └── reflection-bank.json  # Weekly Reflection 題庫（build-time 預生成、凍結）
├── src/
│   ├── main.ts                # composition root：手動組裝元件 → 逐 Track run → exit
│   ├── config.ts               # 讀環境變數
│   ├── compiler/                # Lesson Compiler：curriculum / content / problem / schedule /
│   │                             #   overlay / lesson / gate（單一模組，Gate 與 runtime 共用）
│   ├── renderer/                # DiscordRenderer + budget（stateless 純函式）+ alert（告警/完課通知）
│   ├── discord/                 # DiscordWebhookClient（依 Track 路由至對應 webhook）
│   ├── state/                   # StateStore（讀寫 state.json；per-track 進度）
│   ├── pages/                   # 儀表板 / 全文閱讀頁 / RSS feed 產生（F9，純函式、stateless）
│   └── util/                    # Asia/Taipei 日期 guard 等
├── scripts/
│   ├── generate-curriculum.ts   # Stage 1：課綱 + Skeleton 批次起草（LLM）+ 結構 Gate
│   ├── generate-content.ts      # Stage 2：全文批次展開（LLM）+ 品質 Gate；節流/斷點續跑
│   ├── generate-materials.ts    # Stage 3：Review 素材批次生成（LLM）+ 素材 Gate
│   ├── generate-schedule.ts     # 課表確定性生成（三份一次生成）
│   ├── validate.ts              # Gate 入口：DAG 驗證 + 全 Track × 全 Session 完整編譯
│   ├── build-pages.ts           # 產生儀表板 / 全文 / RSS 靜態頁面
│   └── supplement-problems.ts / populate-problem-bank.ts / run-code-blocks.ts …
├── state/state.json           # ※ 只存在於專用 state 分支；main 上僅初始樣板
└── .github/workflows/
    ├── daily.yml               # 每日推播排程（零 LLM；單一 job 逐 Track）+ Pages 發佈附加段
    ├── ci.yml                  # push / PR：npm ci → build → test → validate:curriculum
    └── content-gate.yml        # PR Gate：validate.ts + TS/Python 程式碼實測（內容 Gate）
```

### 責任邊界（MUST，不可越界）

| 元件 | 只知道 | MUST NOT |
|---|---|---|
| Curriculum | 學什麼、順序、依賴（DAG） | 推播 / 組版邏輯 |
| Lesson Compiler | 把 `(track, sessionIndex)` 組成 `Lesson` | 碰 Discord |
| Renderer | 把 `Lesson` 轉成 Discord embeds | 讀 Curriculum / Problem Bank / 檔案 / state |
| StateStore | 讀寫 `state.json` 的 per-track 進度 | 決定課程內容 |
| Pages | 把 `state.json` 與 `articles/**` 轉譯成靜態頁 | 影響核心推播的 exit code |

---

## 三軌全量課表

三個 Track **共用同一份 165 個 Concept 的教材庫與 DAG**，分歧只發生在「涵蓋深度 + 節奏 +
題目難度帶 + Challenge 難度 + 推播頻道」——**MUST NOT** 複製三份教材正文。

### 程度差異：涵蓋深度（`maxLevel`）

課綱共 16 個 Module（Level 0～15，難度遞增）；三軌各自涵蓋到不同深度，越深的 Track 走過
越多進階模組：

```
Level   0   1     2      3      4          5             6              7      8      9           10    11     12    13            14       15
Module  思維 Array HashTbl String TwoPointer BinarySearch SlidingWindow  Stack  Queue  LinkedList | Tree  Graph  Heap | Backtracking DFS/BFS  DP
        └──────────────── Foundation（maxLevel 9・103 Concept）─────────┘
        └───────────────────────── InterviewReady（maxLevel 12・134 Concept）─────────┘
        └────────────────────────────────── InterviewMastery（maxLevel 15・165 Concept，全量）──────────────────┘
```

| Track | `maxLevel` | 涵蓋 Module | 涵蓋 Concept 數 | 目標等級 |
|---|---|---|---|---|
| **Foundation** | 9（至 Linked List） | 10 個（思維 → Linked List） | 103 | 熟練 **Easy**、能碰觸簡單 Medium |
| **InterviewReady** | 12（至 Heap） | 13 個（+ Tree / Graph / Heap） | 134 | 熟練 **Medium**，對齊 Grind75 / NeetCode 節奏 |
| **InterviewMastery** | 15（全量） | 16 個（+ Backtracking / DFS-BFS / DP） | 165 | 大廠面試程度、熟練 **Hard** |

### 節奏差異：每輪 6 槽的組成不同

三軌 `rhythm` 皆為 6 槽一輪（v1 曾含 rest 槽，F8 移除——`漏跑不跳課`已讓休息零成本，
固定休息日只是重複保障，代價是每 7 次推播有 1 次沒有教學內容）：

```
Foundation        concept → concept → practice → concept → challenge → review   （每輪 3 個新觀念）
InterviewReady    concept → concept → concept   → concept → challenge → review   （每輪 4 個新觀念）
InterviewMastery  concept → concept → concept   → concept → challenge → review   （每輪 4 個新觀念）
```

- Foundation 每輪只排 3 個新觀念、多留一天 `practice` 消化，換取更低的認知負荷；
  InterviewReady / InterviewMastery 每輪 4 個新觀念，推進更快。
- `review` 槽 MUST 涵蓋本輪全部 `concept` 槽（`reviewRange` 不變式），故每輪最後一個
  `concept` 槽必早於 `review` 槽——三軌皆遵守此順序。
- 題目難度帶與 Challenge 難度依 Track 而不同（Concept 教學正文本身完全共用）：

  | Track | `problemDifficulties` | `challengeDifficulty` |
  |---|---|---|
  | Foundation | Easy + Medium | Easy |
  | InterviewReady | Easy + Medium | Medium |
  | InterviewMastery | Medium + Hard | Hard |

  Foundation 刻意**不收窄為僅 Easy**：backtracking / heap / graph / DP 等主題本質上不存在
  Easy 級題目，實測若堅持 Easy-only，60% 的 concept Session 會無題可練；放寬為 Easy+Medium
  後降至 21%（其中 16% 是課綱本就宣告 `leetcode: []` 的「無題目觀念課」，屬合法下限）。
  Foundation 的難度控制改由較淺的 `maxLevel` 與 `challengeDifficulty: Easy` 承擔。

### 總量與時長差異

**Session 數是導出值，不是設定值**：`Session 數 = ceil(涵蓋 Concept 數 ÷ 每輪 concept 槽數) ×
6`，再扣掉「無題槽跳過」省下的空洞日子——新增 Concept 或調整節奏都會連帶改變總量，
MUST NOT 在任何設定或文件中把長度寫死。

| Track | Concept | concept | practice | challenge | review | **合計 Session** | 約需時長 |
|---|---:|---:|---:|---:|---:|---:|---|
| Foundation | 103 | 103 | 28 | 32 | 35 | **198** | 約 6.5 個月 |
| InterviewReady | 134 | 134 | 0 | 32 | 34 | **200** | 約 6.6 個月 |
| InterviewMastery | 165 | 165 | 0 | 36 | 42 | **243** | 約 8 個月 |

每天推播一則（每 Session 對應一次成功推播 / 一天），故總 Session 數即約略等於完課所需
天數；`review` Session 數不受節奏微調影響（每輪必產生一次）。上表已是「移除 rest 槽」＋
「跳過無題的 practice / challenge 槽」後的最終數值——空槽不會產生「叫你去練習卻沒給題目」
的空洞推播，而是在課表生成階段就被跳過並留下具名 warning。

### 推播頻道與啟用方式

每 Track 對應一個獨立 Discord Webhook Secret；**設定即啟用、移除即停用**，不需要改程式：

| Track | 環境變數 |
|---|---|
| Foundation | `DISCORD_WEBHOOK_URL_FOUNDATION` |
| InterviewReady | `DISCORD_WEBHOOK_URL_INTERVIEW_READY` |
| InterviewMastery | `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` |

同一個 workflow、單一 job，每日依固定順序 `foundation → interviewReady → interviewMastery`
逐一處理已啟用的 Track；跳課 / 重來只需直接編輯 `state` 分支的 `state.json`。

---

## 內容產線（Build-time）

```
Stage 1  generate-curriculum.ts   LLM 批次起草課綱大綱 + Concept Skeleton
                                  → 結構 Gate（DAG / 數量範圍）→ 輸出 curriculum/outline.md
                                  ⇩ 【唯一的人工檢查點：課綱大綱表一次性定稿，約 1～2 小時】
Stage 2  generate-content.ts      讀 Skeleton → LLM 展開為 §10 全部固定區塊的 Full Article
                                  → 品質 Gate（區塊完整性 / 字數 / 程式碼可執行）→ 凍結入 articles/**
Stage 3  generate-materials.ts    批次生成 Weekly Reflection 題庫 → 素材 Gate → 凍結入 data/**
         generate-schedule.ts     依 DAG + track-params.json 確定性生成三份 schedules/{track}.json
```

- LLM（`@google/genai`）**只允許出現在 `scripts/` 的依賴路徑**，`src/` MUST NOT import；
  每日 `daily.yml` MUST NOT 含 `GEMINI_API_KEY`。
- 全部產線步驟具備 RPM 節流、429 指數退避 + jitter、斷點續跑（checkpoint resume）、冪等
  （不覆蓋已凍結且未變更的產物，除非 `--force`），對齊 Gemini free tier 限制。
- 凍結後的產物（`concepts/**` / `articles/**` / `schedules/**`）**MUST NOT 手改**；調整
  一律是「改 Curriculum / Skeleton → 重跑生成器 → review diff → commit」。

---

## 每日推播（Runtime）

```
1. bootstrap：src/main.ts 手動建構 config / StateStore / LessonCompiler / Renderer / WebhookClient
2. 依固定順序逐一處理已啟用 Track：
   a. per-track Asia/Taipei 日期 guard（今天已推過 → 跳過；FORCE=true 可強推）
   b. 完課檢查：currentSessionIndex 超出課表最大值 → 發一次性完課通知、其後靜默跳過
      （若課表因課綱擴充而變長且進度已回到範圍內，自動解除 completedAt）
   c. Lesson Compiler 編譯當日一筆 Lesson → Renderer 產出 embeds → 驗證字元預算
   d. WebhookClient 推播至該 Track 專屬頻道
   e. 成功 → currentSessionIndex + 1；失敗 → 記錄錯誤、繼續下一個 Track（不中斷）
3. 全部 Track 處理完 → 單次存檔、單次 commit 至 state 分支（push 衝突以
   git pull --rebase --autostash 重試）
4. 任一 Track 失敗 → 發紅色告警 + 以非零 exit code 結束
```

雙 cron 排程：`7 22 * * *` / `37 22 * * *`（UTC）= 台北 **06:07 主推 / 06:37 補跑**，
靠 per-track 日期 guard 去重；`workflow_dispatch` 支援 `dry_run` / `force` 手動觸發。

---

## State 管理與失敗隔離

`state.json`（僅存在於專用 `state` 分支）以 `tracks` map 保存每個 Track 的獨立進度：

```jsonc
{
  "tracks": {
    "foundation": {
      "currentSessionIndex": 42,
      "lastPushAt": "2026-08-05T06:07:11Z",
      "completedConceptIds": ["..."],
      "history": [ /* 最近 30 筆，供 Pages / RSS 使用 */ ],
      "completedAt": null // 完課後才存在，非 null 即靜默跳過
    }
    // interviewReady / interviewMastery 各自獨立
  }
}
```

- **某 Track 推播成功才 `currentSessionIndex + 1`**：漏跑不跳課，進度只會順延、不會斷。
- **多 Track 失敗隔離**：單一 Track 的 compile / render / post 失敗只記錄錯誤、發紅色告警，
  繼續處理其餘 Track；已成功 Track 的 state 照常保存。
- **告警實作單一化**：Track 失敗與全域性失敗（無任何 Webhook、`STATE_FILE` 缺失、
  `state.json` 解析／語意損毀、存檔失敗、課程素材載入失敗）皆由同一顆
  `src/renderer/alert.ts` 發出，MUST NOT 讓 workflow YAML 另行拼組 Embed 告警；告警內文對
  疑似 webhook URL 的片段一律遮蔽。
- **history 上限 30 筆**（滾動保留），同時是 F9 RSS/Atom feed 的唯一資料來源。

---

## GitHub Pages（儀表板 / 全文 / RSS）

公開網址：**https://sylvia-h.github.io/leetCode-daily-coach/**

`daily.yml` 核心推播完成後的**附加末段**（非獨立 workflow、選配、失敗不影響核心推播與
exit code）：讀取 `state` 分支的最新 `state.json` + `articles/**`，以純函式（stateless、
不保留跨執行記憶、不新增第二個 commit）產生：

- **儀表板**（[`src/pages/dashboard.ts`](src/pages/dashboard.ts)）：三軌各自目前進度、
  今日課程標題，尚未開始 / 已完課皆有明確狀態。
- **全文閱讀頁**（[`src/pages/article-page.ts`](src/pages/article-page.ts)）：Discord 只推
  Digest（≤6,000 字元限制），全文（Concept / Thinking / Pattern Recognition / Common
  Mistakes / Complexity / Corner 等）留給 Pages 呈現。
- **課綱總覽**（[`src/pages/curriculum-view.ts`](src/pages/curriculum-view.ts)）：列出全部
  Concept，已解鎖者可點連結、未解鎖者僅顯示標題與「未解鎖」標示，不產生指向不存在頁面的連結。
- **RSS/Atom feed**（[`src/pages/feed.ts`](src/pages/feed.ts)）：可訂閱全站或單一 Track，
  項目直接由 `state.json` 的 per-track `history` 導出，識別碼採 `conceptId`。

發佈失敗或被跳過時，以琥珀色（有別於紅色告警）通知第一個已設定的頻道「Pages 未更新、
核心推播正常」，MUST NOT 影響 workflow 的 exit code。

---

## 快速開始

```powershell
npm ci
npm run build
npm test
```

### 本機 dry run（不會真的推播到 Discord）

**MUST NOT** 對真實 Discord webhook 反覆測試版面；本機驗證一律使用 `DRY_RUN=true`
（compile + render 後輸出至 log，不推播、不寫 state）：

```powershell
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://discord.com/api/webhooks/<id>/<token>"
$env:STATE_FILE = ".state/state.json"
$env:DRY_RUN = "true"
npm run build; if ($?) { npm start }
```

log 會輸出完整的 Discord embeds（格式化 JSON）與逐區塊字元預算明細。

---

## npm scripts

| script | 指令 | 用途 |
|---|---|---|
| `build` | `tsc` | 編譯至 `dist/` |
| `test` | `vitest run` | 單元測試（CI 用，97 檔 805 測） |
| `test:watch` | `vitest` | 開發用 |
| `typecheck` | `tsc -p tsconfig.test.json` | 含測試檔的型別檢查 |
| `start` | `node dist/main.js` | 執行每日推播（需先 build） |
| `validate:curriculum` | `tsx scripts/validate-curriculum.ts` | Curriculum DAG 結構驗證 |
| `validate:problem-bank` | `tsx scripts/validate-problem-bank.ts` | Problem Bank schema 驗證 |
| `validate:schedule` | `tsx scripts/validate-schedule.ts` | 課表拓樸子序列與不變式驗證 |
| `validate:content` | `tsx scripts/validate.ts` | 內容 Gate 入口：全 Track × 全 Session 完整編譯 |
| `generate:curriculum` | `tsx scripts/generate-curriculum.ts` | Stage 1：課綱 + Skeleton 起草（LLM） |
| `generate:content` | `tsx scripts/generate-content.ts` | Stage 2：全文展開（LLM） |
| `generate:materials` | `tsx scripts/generate-materials.ts` | Stage 3：Review 素材生成（LLM） |
| `generate:schedule` | `tsx scripts/generate-schedule.ts` | 三份課表確定性生成 |
| `populate:problem-bank` | `tsx scripts/populate-problem-bank.ts` | 題庫資料填充 |
| `supplement:problems` | `tsx scripts/supplement-problems.ts` | 補題 pass |
| `gate:code` | `tsx scripts/run-code-blocks.ts` | 教材內 TS / Python 程式碼實測 |
| `build:pages` | `tsx scripts/build-pages.ts` | 產生 GitHub Pages 靜態頁面 |

---

## 環境變數

| 變數 | 必填 | 說明 |
|---|---|---|
| `DISCORD_WEBHOOK_URL_FOUNDATION` | 至少三選一 | 設定即啟用 `foundation` Track |
| `DISCORD_WEBHOOK_URL_INTERVIEW_READY` | 至少三選一 | 設定即啟用 `interviewReady` Track |
| `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` | 至少三選一 | 設定即啟用 `interviewMastery` Track |
| `STATE_FILE` | ✅ | `state.json` 路徑 |
| `DRY_RUN` | — | `"true"` 才視為真，其餘（含 `"false"` / 空字串）皆為假 |
| `FORCE` | — | 同上；繞過同日去重 |
| `GEMINI_API_KEY` | 僅內容產線 | **MUST NOT** 出現在 `daily.yml`；只用於 `scripts/generate-*` |

Secrets 一律走 GitHub Actions Secrets，**MUST NOT** 進 repo 或任何發佈產物。完整契約見
[`specs/001-walking-skeleton/contracts/cli-contract.md`](specs/001-walking-skeleton/contracts/cli-contract.md)。

---

## 測試與 Gate

- **CI（`ci.yml`）**：push / PR 觸發 `npm ci → build → test → validate:curriculum`。
- **內容 Gate（`content-gate.yml`）**：`validate.ts`（全 Track × 全 Session 完整編譯 +
  Discord 限制檢查）+ 教材內 TS / Python 程式碼實測（`pytest` / Node），任何一筆失敗即擋下
  PR，不進 `main`。
- **關鍵邏輯 MUST 有單元測試**（詳見 [`docs/spec.md`](docs/spec.md) §22.2）：DAG 驗證、Full
  Article 固定區塊解析與 frontmatter schema、課表生成器 determinism（byte-identical）、
  Lesson Compiler determinism、per-track idempotency guard（含跨日 / UTC 邊界）、狀態推進
  （僅成功才 +1、漏跑不跳課、history 上限）、多 Track 失敗隔離、Overlay 疊加不取代、
  Renderer 純函式性與 Discord 6,000 字元限制、Pages stateless 守門。

---

## 文件索引

- [`docs/spec.md`](docs/spec.md) — 唯一需求來源（AI-Friendly Engineering Specification）
- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — 專案憲章（最高規範，
  依 spec §4 的 17 條非協商原則定稿）
- [`docs/setup-guide.md`](docs/setup-guide.md) — 一次性環境建置說明（`state` 分支 /
  Discord Webhook / GitHub Actions Secrets）
- [`docs/runbook.md`](docs/runbook.md) — 維運手冊（跳課 / 重來 / 完課處理等操作指引）
- [`curriculum/outline.md`](curriculum/outline.md) — 課綱大綱表（唯一人工定稿物）
- [`specs/`](specs/) — 各 Feature（F1～F9）的 spec / plan / tasks / contracts / checklists
