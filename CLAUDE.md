<!-- SPECKIT START -->
目前尚未建立任何 Feature。開始第一個 Feature（F1 `001-walking-skeleton`）後，
本區塊會由 Spec Kit 自動改寫為當前 plan 路徑；屆時請先讀該 `specs/NNN-*/plan.md`
取得技術選型、專案結構與 shell 指令等實作脈絡。
<!-- SPECKIT END -->

# LeetCode Daily Coach — Agent 協作指引

LeetCode Daily Coach（codename **Ascent**）是一套**演算法課程引擎**，不是題目推播機。它每日早晨透過
Discord 推播**一則解題觀念（Concept）＋ 1～3 題對應 LeetCode 題**，依固定課綱（DAG）循序漸進，
三個 Track（Foundation / InterviewReady / InterviewMastery）各推自己的頻道，各約 180 個 Session。

> **本專案的目標不是讓使用者刷更多題，而是建立能夠持續解題的思維模式。**

核心 Pipeline：`Knowledge Graph → Learning Path → Today's Lesson → Discord`。
教材由 LLM 在 **build-time 一次性生成 → 過 Gate → 凍結入 repo**；**每日 runtime 零 LLM**。
零常駐、零付費：GitHub Actions（排程）+ Discord Webhook（推播）+ `state` 分支的 `state.json`（狀態）。

**本檔只放「Agent 日常操作」的行動層約定**，需求與設計細節一律回 `docs/spec.md`，不在此複製。

## 溝通語言

- 與使用者的**對話輸出一律用繁體中文**：回報摘要、說明、詢問問題、提案都用繁體中文。
- 技術識別項一律保留原文：程式碼、指令、檔名/路徑、Conventional Commits 前綴、API/型別/欄位名稱、
  spec 既有的規範用語（`MUST` / `SHOULD` / `MUST NOT` / `MAY`、Concept、Session、Track、Overlay、
  Digest、Skeleton、Lesson Compiler…）不翻譯。
- **教材內容**另有規範（spec §11）：教學文章以繁體中文撰寫，但技術術語 / Pattern 名稱 / API / 程式碼
  MUST 保留英文（Sliding Window、Two Pointer、`O(n)`、`bisect` 不譯）。

## 真實來源（Source of Truth，不得憑空發明）

- **唯一需求來源**：`docs/spec.md`。這是一份 AI-Friendly Engineering Specification，**實作無關但釘死
  責任邊界與資料契約**。任何需求疑問先查 spec 的章節（§1–§26），查不到才問使用者，**MUST NOT 自行推測**。
- **最高規範**：`.specify/memory/constitution.md`（憲章，現行 v1.0.2，2026-07-19 依 spec §4 的 17 條
  原則定稿）。與其他文件衝突時以憲章為準；憲章未涵蓋的需求細節回 `docs/spec.md` 查證。
- **唯一權威狀態**：`state` 分支的 `state.json`（每 Track 的 `currentSessionIndex` / `lastPushAt` /
  `completedConceptIds` / `history`）。只經 `StateStore` 讀寫；MUST NOT 另建平行狀態或「起始課數」設定項。
- **內容的來源真相**：`concepts/**`（Concept Skeleton：frontmatter + Author Hints）。
  `articles/**`（Full Article）與 `schedules/**`（三份課表）是**可重生成的產物**——改 Skeleton / 改
  Curriculum → 重跑產線 → 重新過 Gate → commit。**MUST NOT 手改生成物**。
- **開發步驟**：正式流程走 Spec Kit，各 Feature 的 `specs/NNN-*/`（spec / plan / tasks / contracts /
  checklists）為該 Feature 的實作依據。目前作用中的 Feature 見 `.specify/feature.json`。

> F2+ 才會出現的檔案（`curriculum/`、`concepts/`、`articles/`、`data/problem-bank.json`、`schedules/`、
> `src/compiler/`…）在引用前**先確認是否已存在**，勿引用尚未建立者。目錄全貌見 spec §17。

### 跨 Feature 決策必須落地到真實來源（MUST）

在任一 Feature 的 `/speckit-clarify`、`/speckit-analyze`（或任何階段）中，若確立或修正了一項決策，而該決策
**不屬於本次 Feature 的實作範圍、卻會影響其他 Feature**（例：在 F2 clarify 時定案了 F7 的課綱顆粒度規則、
或在 F4 定案了 Track 難度帶映射），則 **MUST** 立即把該決策寫回 `docs/spec.md` 對應章節（涉及非協商原則時
一併寫入 `.specify/memory/constitution.md`），並**同步修訂既有段落使其與新決策一致、消除矛盾**。
**MUST NOT** 只寫進 Agent memory、或只留在該 Feature 的 spec 就當作已定案——Agent memory 可作輔助記憶，
但**不是專案的真實來源**；未同步回 `docs/spec.md` 的跨 Feature 決策**不得視為「未落地」以外的任何狀態**。

## 環境

- 作業系統 **Windows**，終端機預設 **PowerShell**（用 `Copy-Item`、`New-Item -ItemType Directory -Force`、
  `Remove-Item -Recurse -Force`，不要用 `cp` / `mkdir -p` / `rm -rf`）。Bash 工具是 POSIX sh，
  **兩者語法不可混用**。
- 套件管理用 **npm**（非 pnpm、非 monorepo）：`npm ci`、`npm run build`（`tsc`）、`npm test`（**vitest**）。
- **Node.js 24**（本機建議 nvm `24.x`；CI 用 `actions/setup-node@v4` `node-version: 24`）。
- 全程 **strict TypeScript**，避免 `any` 逃逸。
- **無本機 infra**（無 docker / DB / 常駐服務）：本專案是一支跟完即退的一次性 CLI（`node dist/main.js`）。
- 本機執行需要的機密以環境變數提供，**勿寫入檔案**；缺任一必要項須 fail-fast 且不推播。
- **本機不要真的打 Discord webhook**：驗證版面用 `DRY_RUN=true`（compile + render 後輸出至 log，
  不推播、不寫 state）。

## 工程硬規則（違反即設計錯誤；本節為 spec §4 / §22 的行動層摘要，完整定義見 spec）

1. **Concept-first、One Concept per Session（§4-1、§4-2）**：每日推播 MUST 先觀念再題目；每個 concept
   類 Session MUST 只引入**恰好一個**新 Concept。內容過長 MUST 拆成多個 Concept，MUST NOT 硬塞。
2. **Deterministic Curriculum（§4-4、§4-5）**：課程順序固定且版本控制，Curriculum MUST 為 **DAG**
   （無環、無前向依賴）。**LLM MUST NOT 動態調整、重排或生成學習順序**。
3. **Zero-LLM Daily Runtime（§4-8）**：每日 runtime **MUST NOT 呼叫任何 LLM API**；`daily.yml`
   MUST NOT 含 `GEMINI_API_KEY`。`@google/genai` **只允許出現在 `scripts/` 的依賴路徑，`src/` MUST NOT
   import**。鼓勵語 / Hint / Reflection 全為 build-time 凍結素材，依 `sessionIndex` 決定性輪替。
4. **Build-time over Runtime、單一 Compiler（§4-9、§7.1）**：CI Gate 與每日 runtime **MUST 共用同一顆
   Lesson Compiler**；MUST NOT 出現「Gate 一套解析、runtime 另一套」的雙軌實作。能在 CI 驗的，不留到早上六點。
5. **Shared Knowledge, Different Tracks（§4-6）**：三 Track **共用同一份 Concept 教材正文與 DAG**；
   分歧只發生在【課表 + 題目難度帶 + Challenge 難度 + 推播頻道】。**MUST NOT 複製三份教材正文**，
   Track 差異一律走 Overlay。
6. **Renderer 不知道 Curriculum（§4-11、§4-12）**：Renderer MUST 為 **stateless 純函式**（同一 `Lesson`
   → 同一 embeds），MUST NOT 讀 Curriculum / Problem Bank / 檔案 / state，一切資料由 Compiler 放進
   `Lesson`。Track 只是 `Lesson` 的一個欄位，決定不了版面結構。
7. **生成物 commit 後即凍結（§4-13、§13.4）**：`schedules/{track}.json` **MUST NOT 手寫**，由
   `scripts/generate-schedule.ts` 確定性生成（同輸入 → **byte-identical** 輸出）。調整流程一律是
   「改 Curriculum → 重跑生成器 → review diff → commit」。
8. **Discord 字元預算（§14.5）**：單則訊息**全部 embeds 文字總和 ≤ 6,000**（最容易踩的硬限制），
   本專案自訂上限 **≤ 5,500**（保留 500 餘裕）；Digest ≤900、TS/Python Tip 各 ≤450、每題 ≤350（最多 3 題）、
   Exit Criteria ≤400、Takeaway ≤120、footer ≤200。**Gate 對每一筆 Lesson 的 render 結果逐一檢查**。
9. **State 只在推播成功後前進（§19）**：某 Track 推播成功才 `currentSessionIndex++`（漏跑不跳課）；
   `state.json` **MUST commit 至專用 `state` 分支**，MUST NOT 進 `main` / `develop`。全部 Track 處理完
   **單次存檔、單次 commit**；push 衝突以 `git pull --rebase --autostash` + 重試處理；`history` 滾動上限 30 筆。
10. **多 Track 失敗隔離（§4-15、§9.2）**：單一 Track 的 compile / render / post 失敗 MUST 記錄錯誤、
    對該頻道發紅色告警、**繼續處理其餘 Track**（已成功 Track 的 state 照常保存）；全部處理完若有任一失敗，
    MUST 發告警並以**非零 exit code** 結束。MUST NOT 用 Actions matrix 平行跑多 Track（會搶 `state` 分支）。
11. **Secrets 絕不入庫（§4-14）**：Discord Webhook URL、`GEMINI_API_KEY` **只走 GitHub Actions Secrets**，
    MUST NOT 進 repo 或任何發佈產物；只 commit 佔位示意，不 commit `.env` / API key。
12. **Fail loud, not silent（§4-15）**：核心步驟失敗 MUST 發紅色告警 Embed + 非零 exit code；
    可選階段（未來 Pages）失敗 MUST NOT 中斷核心推播。
13. **Free-tier only（§4-16）**：僅 GitHub Actions + Discord Webhook + LLM 免費層（**僅 build-time**）+
    committed `state.json`。**禁止**引入常駐伺服器、付費方案，或任何逼近免費上限的設計。
14. **One Human Checkpoint（§4-17）**：內容產線唯一的常態性人工檢查點是「**課綱大綱表定稿**」
    （`curriculum/outline.md`，§20.3 Stage 1）。凍結後 Skeleton / 全文 / 課表 MUST 全自動生成、
    僅由自動 Gate 把關；MUST NOT 新增其他常態性人工審核關卡。
15. **不轉載 LeetCode 題目內容（§5、§11）**：題目只呈現題號 / 官方標題 / 連結 / 難度 /「為什麼適合此
    Pattern」/ Hint。題號、連結、難度 **MUST 由程式從 Problem Bank 帶入，MUST NOT 由 LLM 生成**。

### 測試優先（關鍵邏輯，MUST 有單元測試；§22.2）

DAG 驗證（拓樸排序 / 無環 / 無前向依賴 / 參照完整）、Full Article 固定區塊解析與 frontmatter schema、
課表生成器 determinism（byte-identical）與拓樸子序列合法性、Lesson Compiler determinism、
**per-track idempotency guard**（Asia/Taipei 日期判斷，含跨日 / UTC 邊界）、狀態推進（僅成功才 +1、
漏跑不跳課、history 上限、未知啟用 Track 自動補建）、**多 Track 失敗隔離**（mock 單一 webhook 失敗）、
Overlay 疊加不取代、Renderer 純函式性與 Discord 限制（含 6,000 總長）、教材品質 Gate。
外部呼叫（Gemini、Discord）以 mock 測；Python / TS 教材程式碼實測只在 CI Gate 跑。

## 技術釘死（於各 Feature `/speckit-plan` 確認；§22.3）

- **執行框架**：**輕量 composition root**——`src/main.ts` 手動建構元件（純 TypeScript class / function +
  建構式注入），跑完即退。**MUST NOT 引入 NestJS / InversifyJS 等 DI 框架**，不啟 HTTP server。
- **驗證**：`zod`（frontmatter / JSON schema）。**Markdown**：`gray-matter` + `marked`（或等價）。
- **HTTP**：Node 內建 `fetch`（undici）。**測試**：`vitest`（＋ CI Gate 的 `python` / `pytest`）。
- **LLM SDK**：`@google/genai`，**只在 `scripts/`**（Gemini 免費層 Flash 系，僅 build-time）。
- **Secrets / 環境變數命名固定**：`DISCORD_WEBHOOK_URL_FOUNDATION`、`DISCORD_WEBHOOK_URL_INTERVIEW_READY`、
  `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY`（**設定即啟用該 Track，移除即停用**，不需改程式）、
  `GEMINI_API_KEY`（僅產線）、`STATE_FILE`、`DRY_RUN`、`FORCE`。
- **排程**：雙 cron `7 22 * * *` / `37 22 * * *`（UTC）= 台北 06:07 主推 / 06:37 補跑；靠
  **per-track Asia/Taipei 日期 guard** 去重。`workflow_dispatch` MUST 提供 `dry_run` / `force` inputs。
- **產線韌性（§20.4）**：`generate-curriculum.ts` / `generate-content.ts` MUST 具備 RPM 節流、
  429 指數退避 + jitter、**斷點續跑（checkpoint resume）**、冪等（不覆蓋已凍結且未變更的產物，除非 `--force`）。

## Commit 規範

- 沿用 Conventional Commits 前綴（`feat` / `fix` / `build` / `ci` / `chore` / `docs` / `test` /
  `refactor`），**前綴後的描述用繁體中文**，技術識別項保留原文。
- **type 選用準則**（依該 commit 主要性質擇一）：
  - `feat`：對使用者 / 產品有意義的**能力增量**（推播管線、Lesson Compiler、Renderer 版面、課表生成器）。
  - `fix`：修正錯誤行為。
  - `build`：建置系統、相依與工具設定（`package.json` / `tsconfig` / vitest 設定 / lockfile / `.gitignore`）。
  - `ci`：CI 設定（`.github/workflows/*`）。
  - `chore`：上述未涵蓋的維護與純鷹架（空骨架、生成物重跑等）。
  - `docs` / `test` / `refactor`：文件 / 測試 / 不改行為的重構。
  - **教材與課綱產物**（`concepts/**`、`articles/**`、`schedules/**`、`data/**`）：新增內容用
    `feat`（對使用者有意義的課程增量），純重跑生成器產出無語意變化者用 `chore`。
- **scope 用完整 Feature 目錄名**：`feat(001-walking-skeleton): …`（勿縮寫為 `001`）。跨 Feature 或全域
  鷹架可省略 scope（如 `chore: 導入 Spec Kit 腳手架與 Claude skills`）。
- 範例：
  - `feat(001-walking-skeleton): 打通 Discord 推播與 state 分支流程`
  - `fix(006-pipeline-mvp): 修正 per-track 日期 guard 的 UTC 跨日誤判`
  - `build(002-curriculum-schema): 導入 zod 與 gray-matter 相依`
  - `ci(001-walking-skeleton): 新增每日推播 workflow 與雙 cron 排程`
- **多行訊息**用 Bash 工具搭配 POSIX heredoc 餵給 `git commit -F -`；**勿**在 Bash 工具用 PowerShell
  here-string `@'…'@`。單行訊息用 `-m`。**不使用 `--no-verify`、不跳過 hook**——hook 失敗修根因。
- **預設只在使用者要求時才 commit**；開發時應在 Feature branch 上進行，**不在 `develop` / `main` 直接 commit**。
  **例外**：使用者呼叫 `/speckit-implement` 本身即視為對階段 commit 的既有授權；執行時 MUST 依下一條規則
  主動分階段 commit，不需在過程中再次詢問。
- `/speckit-implement` 執行時 MUST 依 `tasks.md` 的 Phase / User Story 分段 commit（讓歷史對齊開發順序）：
  每完成一個 Phase 或一個 User Story 的實作＋測試即建立一個 commit，掛 Feature scope，type 依該段主要性質；
  該段的 `tasks.md` 勾選併入該段 commit。全部任務跑完後不再另外彙總，也不需事後用 `/commit-split` 補分類。

## SDD 流程與分支

- 開發主支為 **`develop`**（⚠️ 目前尚未建立；第一個 Feature 開始前先從 `main` 切出）。
  每個正式 Feature 從 `develop` 開新 branch，命名 `NNN-feature-name`，走完整流程：
  `specify → clarify → plan → checklist → tasks → analyze → implement → 驗收 → merge 回 develop`。
- **Feature 順序依 spec §22.5**（依賴不可跳）：
  | # | 分支 | 內容 | 依賴 | 里程碑 |
  | --- | --- | --- | --- | --- |
  | F1 | `001-walking-skeleton` | 垂直切片：1 篇手寫 Article + 硬編 3-Session 課表 + 最小 Renderer + Webhook + 雙 cron + state 分支 + 日期 guard + dry_run | — | M0 |
  | F2 | `002-curriculum-schema` | Curriculum 骨架、frontmatter schema、DAG 建置與驗證 | F1 | M1 |
  | F3 | `003-problem-bank` | 題庫 schema／資料、Concept ↔ Problem 逆向對應、slug 一致性 | F2 | M1 |
  | F4 | `004-schedule-generator` | `generate-schedule.ts`、三組 Track 參數、Overlay schema（以 stub DAG 開發） | F2、F3 | M2 |
  | F5 | `005-lesson-compiler` | Lesson Compiler、Renderer 全 Session 類型、CI Gate 完整編譯 + 限制檢查 | F2、F4 | M2 |
  | F6 | `006-pipeline-mvp` | 每日 pipeline 端到端、多 Track 失敗隔離、per-track guard 與狀態推進 | F1、F5 | M3 |
  | F7 | `007-content-generation` | 兩階段產線（課綱起草＋大綱定稿 → 全量展開）＋品質 Gate＋節流／續跑 | F2、F3、F4 | M3 |
  | F8 | `008-review-extras` | Reflection 題庫、語錄池（掛 review）、review 版面、移除 rest 槽＋跳過無題槽並重跑課表 | F6、F7 | M4 |
  | F9 | `009-pages-publish` | GitHub Pages 儀表板 + 全文閱讀 + RSS（post-MVP） | F6 | M5 |
  | F10 | `010-interactive` | Slash Commands、每週測驗、自適應（Roadmap） | F6、F8 | M5 |
  **M0 → M3 走完即 MVP**（三頻道每日自動推課）。F7 可與 F5 / F6 並行（機器批次 2～4 天）。
- **`/speckit-constitution` 已於第一個 Feature 之前執行**（2026-07-19），spec §4 的 17 條原則
  已寫進 `.specify/memory/constitution.md`（現行 v1.0.2；v1.0.1 為 Gemini 型號釘死為
  `gemini-3.1-flash-lite` 的 PATCH 修訂，v1.0.2 為因應官方發布 `gemini-3.5-flash-lite`
  而更新型號的 PATCH 修訂）；後續修訂依憲章 Governance 章節的程序。
- 不要在同一 branch 混多個大 Feature；不要貼整段 code 取代 `/speckit-implement`。
- **`main` 不直接 commit**，只接受來自 `develop` 的合併。**唯一 bot 例外**：每日 workflow 自動 commit
  的 `state.json`，且它只進 **`state` 分支**（不進 `main` / `develop`）。

### Merge 回 `develop`：MUST `--no-ff`，不得 fast-forward

- Feature branch 驗收後併入 `develop` **MUST** 用 `git merge --no-ff <feature-branch>`，明確建立一個
  merge commit。**MUST NOT** fast-forward（不可 `--ff-only`，也不可讓預設行為變成 ff）。
- **理由**：ff 會把 Feature 的 commit 平鋪進 `develop`、失去「這批改動屬於同一 Feature」的收尾點；
  `--no-ff` 讓 `git log --oneline --graph` 與 `git log develop --merges` 能數清楚每次 Feature 完成點。
- 若 git 判定為 ff 而未產生 merge commit，MUST 改用 `git merge --no-ff --no-edit` 確保產生非空 merge
  commit。**merge commit 訊息**掛 Feature 編號與名稱，例：`merge(001-walking-skeleton): 併入 F1 垂直切片`。
- 執行步驟：`git checkout develop` → `git merge --no-ff <feature-branch>` → `git push origin develop`。
- **merge 後的 push 屬影響共享狀態的操作**：先確認再 push（除非使用者已明確授權）。
