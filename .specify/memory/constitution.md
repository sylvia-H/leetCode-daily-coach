<!--
Sync Impact Report
==================
[1.0.0] 首次定稿
- Version change: (template, unversioned) → 1.0.0
- Rationale: 首次定稿（ratification）。內容依 docs/spec.md §4「Core Design Principles」17 條
  非協商原則逐條落地，並收錄 §22.2（測試優先）、§22.3（技術釘死）、§22.1/§22.5（SDD 流程）
  作為約束與工作流程章節。
- Modified principles: 全部由樣板佔位符替換為正式內容（新定稿，無舊名可對照）。
- Added sections:
  - Core Principles（17 條，對應 spec §4-1 ～ §4-17）
  - 技術與資源約束（Additional Constraints）
  - 開發工作流程與品質把關（Development Workflow & Quality Gates）
  - Governance
- Removed sections: 無（樣板結構保留，佔位符全數填實）。
- Templates status:
  - .specify/templates/plan-template.md ✅ 無需更新（Constitution Check 為 plan 階段依本檔
    動態判定的佔位，設計即如此）
  - .specify/templates/spec-template.md ✅ 無需更新（無憲章相依內容）
  - .specify/templates/tasks-template.md ✅ 無需更新（任務分類已涵蓋測試優先原則所需類型）
  - CLAUDE.md ✅ 已同步（移除「憲章仍為樣板」的過渡性警語）
- Follow-up TODOs: 無。

[1.0.1] Gemini 模型型號釘死
- Version change: 1.0.0 → 1.0.1
- Rationale: PATCH——非新原則，僅將既有「技術與資源約束」中的 LLM SDK 條款從泛稱
  「Gemini 免費層 Flash 系」澄清為經實測驗證的確切型號 `gemini-3.1-flash-lite`
  （其餘 Flash 系型號實測不符免費層資格）。同步更新 docs/spec.md §20.4、§22.3。
- Modified sections: 技術與資源約束（LLM SDK 條款）。
- Added/Removed sections: 無。
- Templates status: 無需更新（無樣板相依此條款的結構）。
- Follow-up TODOs: 無。

[1.0.2] Gemini 模型型號更新（3.1 → 3.5）
- Version change: 1.0.1 → 1.0.2
- Rationale: PATCH——非新原則，僅因應官方於 2026-07-21 發布 `gemini-3.5-flash-lite`，將既有
  「技術與資源約束」LLM SDK 條款釘死的型號由 `gemini-3.1-flash-lite` 更新為
  `gemini-3.5-flash-lite`（新版同為 Gemini 免費層資格）。同步更新 docs/spec.md §20.4、§22.3，
  以及 007-content-generation Feature 內引用此型號的設計文件與程式碼。
- Modified sections: 技術與資源約束（LLM SDK 條款）。
- Added/Removed sections: 無。
- Templates status: 無需更新（無樣板相依此條款的結構）。
- Follow-up TODOs: 無。
-->

# LeetCode Daily Coach (Ascent) Constitution

本憲章是 LeetCode Daily Coach（codename **Ascent**）的最高規範，內容與 `docs/spec.md` §4
「Core Design Principles」一致。違反任一條核心原則即視為設計錯誤；憲章與其他文件衝突時，
以憲章為準；需求細節一律回 `docs/spec.md`（§1–§26）查證。

## Core Principles

### I. Concept-first, Problem-second

每日推播 MUST 先呈現觀念（Concept），再搭配至少一題對應 LeetCode 題；
MUST NOT 以題目為中心反過來組織內容。

**理由**：本專案的目標不是讓使用者刷更多題，而是建立能夠持續解題的思維模式。

### II. One Concept per Session

每個 concept 類 Session MUST 只引入恰好一個新的核心 Concept。
內容過長 MUST 拆成多個 Concept，MUST NOT 硬塞。

### III. Small Learning Steps

Curriculum MUST 維持細顆粒度；MUST NOT 為縮短課程而合併多個 Concept。

### IV. Deterministic Curriculum

課程順序 MUST 固定且可版本控制。LLM MUST NOT 動態調整、重排或生成學習順序。

### V. Curriculum as DAG

Curriculum MUST 實作為有向無環圖（DAG），而非線性 list。一個 Concept MUST NOT 依賴任何
在拓樸排序上晚於它的 Concept（不得有前向依賴、不得成環）。

### VI. Shared Knowledge, Different Tracks

三個 Track（Foundation / InterviewReady / InterviewMastery）MUST 共用同一份 Concept 教材庫
與知識圖譜（DAG）；分歧只發生在【各自的 Session 課表（涵蓋深度）+ 題目難度帶 +
Challenge 難度 + 推播頻道】。MUST NOT 為不同 Track 複製或改寫三份 Concept 教材正文；
題目難度依 Track 差異化一律由 Overlay 提供（spec §9）。

### VII. LLM Authors Once, Not Daily

核心教材（Full Article，含 Digest / Tips / Hints）MAY 由 LLM 依 Concept Skeleton（spec §10.4）
一次性展開生成，但生成物 MUST 通過 CI 自動把關（spec §20.3）後才凍結入庫；
LLM MUST NOT 在每日執行時生成或篡改核心教材。

### VIII. Zero-LLM Daily Runtime

每日 runtime MUST NOT 呼叫任何 LLM API。所有 LLM 產出（課綱、教材、Digest、Hint、
Reflection 題庫）皆為 build-time 生成並凍結；每日 workflow MUST 可在完全沒有
LLM API key 的環境下成功執行。`daily.yml` MUST NOT 含 `GEMINI_API_KEY`；
`@google/genai` 只允許出現在 `scripts/` 的依賴路徑，`src/` MUST NOT import。

### IX. Build-time over Runtime

凡是確定性、可預先完成的運算（markdown 解析、DAG 驗證、Lesson 組裝、Discord 長度檢查），
MUST 在 CI Gate 對全部 Session 預演過。每日 runtime MUST 與 Gate 共用同一顆
Lesson Compiler（spec §7.1），MUST NOT 出現「Gate 一套解析、runtime 另一套」的雙軌實作，
確保「Gate 通過 ⇒ runtime 不會因內容問題失敗」。

### X. Language-specific Learning

每個 concept Session 的推播 MUST 同時包含 TypeScript 與 Python 的實戰技巧
（`TypeScript Tip` / `Python Tip`）。

### XI. Renderer Knows Nothing About Curriculum

Renderer MUST NOT 包含任何 Curriculum 邏輯（不知道「Array」「Two Pointer」等領域知識），
只負責 Lesson → Discord message 的組版；MUST NOT 讀 Curriculum / Problem Bank / 檔案 /
state，一切資料由 Compiler 放進 `Lesson`。Track 只是 `Lesson` 的一個欄位，
決定不了版面結構。

### XII. Deterministic & Reproducible Delivery

給定同一個 Session index 與 Track，推播內容 MUST 可重現：Renderer MUST 為 stateless
純函式（同一 `Lesson` → 同一 embeds）；每日流程不含任何隨機或 LLM 產生的內容——
鼓勵語 / Hint / Reflection 亦為 build-time 凍結素材，依 `sessionIndex` 決定性輪替。

### XIII. Generated Artifacts Are Frozen Once Committed

課綱與 Skeleton（`concepts/**`）、課表（`schedules/**`）、教材（`articles/**`）由產線生成，
commit 後即定版；重新生成是刻意的 build-time 行為，MUST NOT 發生在每日 runtime。
`schedules/{track}.json` MUST NOT 手寫，由 `scripts/generate-schedule.ts` 確定性生成
（同輸入 → byte-identical 輸出）；調整流程一律是「改 Curriculum → 重跑生成器 →
review diff → commit」。MUST NOT 手改生成物。

### XIV. Secrets Never in Repo

Discord Webhook URL、LLM API key MUST 只走 GitHub Actions Secrets，
MUST NOT 進 repo 或任何發佈產物；只 commit 佔位示意，不 commit `.env` / API key。

### XV. Fault Isolation & Fail Loud

任一非核心步驟（如未來的 Pages 發佈）失敗 MUST NOT 中斷核心推播。多 Track 推播時，
單一 Track 的 compile / render / post 失敗 MUST 記錄錯誤、對該頻道發紅色告警、
繼續處理其餘 Track（已成功 Track 的 state 照常保存）；全部處理完若有任一失敗，
MUST 發告警並以非零 exit code 結束。核心步驟失敗 MUST 大聲失敗
（紅色告警 Embed + 非零 exit code），MUST NOT 靜默吞錯。

### XVI. Free-tier Only

MUST 僅使用 GitHub Actions + Discord Webhook + LLM 免費層（僅 build-time）+
committed `state.json`；MUST NOT 引入付費方案、常駐伺服器，或任何逼近免費上限的設計。

### XVII. One Human Checkpoint

內容產線唯一的常態性人工檢查點是「課綱大綱定稿」（`curriculum/outline.md`，
spec §20.3 Stage 1）。大綱凍結後，Skeleton、全文、課表 MUST 全自動生成、
僅由自動 Gate 把關；MUST NOT 引入其他常態性人工審核關卡
（Gate 擋下時的例外介入除外）。

## 技術與資源約束（Additional Constraints）

以下技術選型已於 spec §22.3 釘死，各 Feature 的 `/speckit-plan` MUST 遵循，
不得於 plan 階段另行選型：

- **語言 / 執行**：strict TypeScript（`tsc` 編譯 → `node dist/main.js`）；一次性 CLI，
  跑完即退。composition root 手寫（純 class / function + 建構式注入），
  MUST NOT 引入 NestJS / InversifyJS 等 DI 框架，不啟 HTTP server。
- **驗證**：`zod`（frontmatter / JSON schema）。**Markdown / frontmatter**：`gray-matter` +
  `marked`（或等價）。**HTTP**：Node 內建 `fetch`（undici）。
- **測試**：`vitest`；Python 教材程式碼實測用 `python` / `pytest`（僅 CI Gate）。
- **LLM SDK**：`@google/genai`，只允許出現在 `scripts/` 依賴路徑，僅 build-time。模型 MUST 為
  `gemini-3.5-flash-lite`（經實測，目前僅此型號符合 Gemini 免費層資格；其餘 Flash 系型號
  MUST NOT 使用）。
- **執行環境**：GitHub Actions（Node 24）；狀態為 `state` 分支的 `state.json`，
  只經 `StateStore` 讀寫，MUST NOT 另建平行狀態。
- **Secrets / 環境變數命名固定**：`DISCORD_WEBHOOK_URL_FOUNDATION` /
  `DISCORD_WEBHOOK_URL_INTERVIEW_READY` / `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY`
  （設定即啟用該 Track、移除即停用）、`GEMINI_API_KEY`（僅產線）、`STATE_FILE`、
  `DRY_RUN`、`FORCE`。
- **Discord 字元預算（spec §14.5）**：單則訊息全部 embeds 文字總和官方上限 6,000，
  本專案自訂上限 ≤ 5,500；Digest ≤ 900、TS/Python Tip 各 ≤ 450、每題 ≤ 350（最多 3 題）、
  Exit Criteria ≤ 400、Takeaway ≤ 120、footer ≤ 200。Gate MUST 對每一筆 Lesson 的
  render 結果逐一檢查。
- **不轉載 LeetCode 題目內容（spec §5、§11）**：只呈現題號 / 官方標題 / 連結 / 難度 /
  「為什麼適合此 Pattern」/ Hint；題號、連結、難度 MUST 由程式從 Problem Bank 帶入，
  MUST NOT 由 LLM 生成。

## 開發工作流程與品質把關（Development Workflow & Quality Gates）

- **SDD × Spec Kit（spec §22.1、§22.5）**：Constitution 於專案建立時定稿一次；之後每個
  Feature 從 `develop` 切 `NNN-feature-name` 分支，依序走
  `specify → clarify → plan → checklist → tasks → analyze → implement → 驗收 → merge 回 develop`。
  Feature 順序與依賴依 spec §22.5，不可跳過依賴。
- **分支紀律**：`main` 只接受來自 `develop` 的合併；唯一 bot 例外是每日 workflow 對
  `state` 分支的 `state.json` 自動 commit（不進 `main` / `develop`）。
- **State 推進**：某 Track 推播成功才 `currentSessionIndex++`（漏跑不跳課）；全部 Track
  處理完單次存檔、單次 commit；push 衝突以 `git pull --rebase --autostash` + 重試處理；
  `history` 滾動上限 30 筆。MUST NOT 用 Actions matrix 平行跑多 Track。
- **測試優先（spec §22.2，關鍵邏輯 MUST 有單元測試）**：DAG 驗證（拓樸排序 / 無環 /
  無前向依賴 / 參照完整）、Full Article 固定區塊解析與 frontmatter schema、課表生成器
  determinism（byte-identical）與拓樸子序列合法性、Lesson Compiler determinism、
  per-track idempotency guard（Asia/Taipei 日期判斷，含跨日 / UTC 邊界）、狀態推進
  （僅成功才 +1、漏跑不跳課、history 上限、未知啟用 Track 自動補建）、多 Track 失敗隔離
  （mock 單一 webhook 失敗）、Overlay 疊加不取代、Renderer 純函式性與 Discord 限制
  （含 6,000 總長）、教材品質 Gate。外部呼叫（Gemini、Discord）以 mock 測；
  Python / TS 教材程式碼實測只在 CI Gate 跑。
- **產線韌性（spec §20.4）**：`generate-curriculum.ts` / `generate-content.ts` MUST 具備
  RPM 節流、429 指數退避 + jitter、斷點續跑（checkpoint resume）、冪等
  （不覆蓋已凍結且未變更的產物，除非 `--force`）。
- **本機驗證**：MUST NOT 對真實 Discord webhook 測試版面；一律用 `DRY_RUN=true`
  （compile + render 後輸出至 log，不推播、不寫 state）。機密以環境變數提供，
  缺任一必要項 MUST fail-fast 且不推播。

## Governance

- **位階**：本憲章高於其他所有實務文件（CLAUDE.md、各 Feature 的 spec / plan / tasks）。
  衝突時以憲章為準；憲章未涵蓋的需求細節以 `docs/spec.md` 為唯一需求來源。
- **修訂程序**：核心原則的任何新增、修改、移除 MUST 先落地至 `docs/spec.md` §4
  （及相關章節，並消除矛盾），再同步修訂本檔並更新版本號與 Last Amended 日期。
  在任一 Feature 流程中確立的跨 Feature 決策，若涉及非協商原則，MUST 同步寫回本檔；
  只寫進 Agent memory 或單一 Feature 的 spec 不視為已定案。
- **版本策略（semantic versioning）**：MAJOR＝不向後相容的原則移除或重新定義；
  MINOR＝新增原則／章節或實質擴充既有指引；PATCH＝措辭澄清、錯字、非語意性修整。
- **合規審查**：每個 Feature 的 `/speckit-plan` MUST 執行 Constitution Check，逐條對照
  本憲章原則並記錄違反與正當化理由（無法正當化者退回設計）；`/speckit-analyze` MUST
  將憲章衝突列為 CRITICAL。程式碼審查與驗收 MUST 確認未違反任一 MUST / MUST NOT。

**Version**: 1.0.2 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-30
