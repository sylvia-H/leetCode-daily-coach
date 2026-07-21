# LeetCode Daily Coach

> Version: 0.3 · Status: Draft
> Codename: **Ascent**（循序登頂：依所選 Track，約半年的每日小步練習，從 Easy 穩步進階到 Medium / Hard）

> **本專案的目標不是讓使用者刷更多題，而是建立能夠持續解題的思維模式。**
> This project is designed to teach algorithmic thinking, not to maximize the number of solved LeetCode problems.

這份 `docs/spec.md` 是本專案的**唯一需求來源（Single Source of Truth）**。它是一份 AI-Friendly Engineering Specification：面向 GitHub Spec Kit / Claude Code / Codex 等工具，讓 AI 看完後即可拆解需求、逐步生成程式碼與教材。文件大量使用 `MUST` / `SHOULD` / `MUST NOT` / `MAY` 等規範語氣，避免 AI 自行推測需求。文件本身**實作無關（implementation-agnostic）**：釘死架構責任邊界與資料契約，但不綁死框架細節。

### v0.3 修訂摘要（相對 v0.2）

1. **三軌全量交付**：取消「MVP 只交付 Foundation」的限制。三個 Track 的完整 180-Session 課表與全部教材（150+ Concept）MUST 於上線前全數生成並通過 Gate；不採用 Runway（跑道）模式，Gate 維持「全部 Track × 全部 Session 完整編譯」的最強保證（§9、§23、§24 AC5/AC8）。
2. **多 Track 推播（Multi-Track Delivery）**：每 Track 一個 Discord Webhook Secret，**設定即啟用**；同一個每日 job 依固定順序逐 Track 推播至各自頻道，單一 Track 失敗 MUST NOT 中斷其他 Track（§9.2、§16.5、§18、§24 AC10）。
3. **State 改為每 Track 一份進度**：`state.json` 以 `tracks` map 保存各 Track 的 `currentSessionIndex` / `lastPushAt` / history，單次 commit 寫入（§19）。
4. **內容產線半自動化、唯一人工檢查點**：Concept Skeleton（課綱 + Author Hints）改由 LLM 批次起草（新增 `scripts/generate-curriculum.ts`），**整條產線唯一的人工介入是「課綱大綱表一次性定稿」**（約 1～2 小時）；定稿凍結後，Skeleton、全文、課表全自動生成、僅由自動 Gate 把關（§4-17、§10.4、§20.3）。
5. Feature 對應調整：F4 改以 stub DAG 開發、正式課表於課綱凍結後生成；F7 擴為兩階段（課綱起草＋大綱定稿 → 全量展開），涵蓋全部 Module（§22.5）。

### v0.2 修訂摘要（相對 v0.1）

1. **Build-time over Runtime**：新增 Lesson Compiler 概念——CI Gate 與每日 runtime MUST 共用同一顆編譯模組；CI 於 PR 時對「所有 Track × 所有 Session」做完整編譯與 Discord 限制檢查，把失敗提早到 build-time（§7、§20.3、§24 AC8）。
2. **每日 runtime 零 LLM**：Hint、Digest、Weekly Reflection 題庫全部改為 build-time 預生成並過 Gate；鼓勵語改為內建語錄池決定性輪替。每日 workflow 不需要 `GEMINI_API_KEY`（§20、§24 AC6）。
3. **推播改推 Digest**：因 Discord 單則訊息全部 embeds 合計 ≤ 6,000 字元的硬限制，Full Article 新增 `Digest` / `TypeScript Tip` / `Python Tip` 推播專用區塊；全文保留給未來 GitHub Pages（§10、§14.5）。
4. **課表由 script 確定性生成**：`schedules/{track}.json` MUST NOT 手寫，由 `scripts/generate-schedule.ts` 依 DAG + 週節奏模板生成後 commit 定版（§13.4）。
5. **Idempotency guard 改為當地日期判斷**（Asia/Taipei），並新增 `workflow_dispatch` 的 `dry_run` / `force` inputs（§21.1）。
6. **state.json 改 commit 至專用 `state` 分支**，主分支歷史保持乾淨（§19、§21.2）。
7. **執行框架改為輕量 composition root**（純 TypeScript + 建構式注入），移除 NestJS（§7、§22.3）。
8. **內容產線 MUST 支援節流與斷點續跑**，以符合 Gemini free tier 限制（§20.4）。
9. Feature 拆分改以**垂直切片（Walking Skeleton）**起步（§22.5）。

---

## 目錄

1. Project Overview
2. Product Goals
3. Learning Philosophy
4. Core Design Principles
5. Non-Goals
6. Terminology & Definitions
7. System Architecture
8. Curriculum Design
9. Track System
10. Concept Structure
11. Content Style Guide
12. Problem Bank
13. Session Scheduling
14. Discord Rendering
15. Weekly Review
16. Data Model
17. Repository Structure
18. Runtime Flow
19. State Management
20. LLM Strategy
21. Infrastructure & Scheduling
22. Development Guidelines
23. MVP Scope
24. Acceptance Criteria
25. Future Roadmap
26. Appendix：Conventions

---

## 1. Project Overview

LeetCode Daily Coach 是一套**演算法課程引擎（Learning Pipeline）**，而非題目推播機（Notification Pipeline）。它每日早晨透過 Discord 推播**一則演算法解題觀念（Concept）**，並搭配 1～3 題對應的 LeetCode 選題，讓使用者依固定課綱循序漸進地建立解題思維。

### 1.1 產品定位

- **Learning Pipeline，而非 Notification Pipeline**：真正的產品是**課程**，Discord 只是 delivery 層。核心 Pipeline 為 `Knowledge Graph → Learning Path → Today's Lesson → Discord`。
- **Concept-first**：每日推播的主體是**觀念（Concept）**，題目是觀念的練習場（觀念先行、題目次之）。
- **內容一次性生成、凍結、版本控制**：演算法觀念本質穩定，核心教材由 LLM **一次性批次生成 → 通過 CI 自動把關（§20.3）→ 凍結存於 repo**，**不由 LLM 每天生成**；因此品質一致、可版本控制、不隨模型更新而飄移（亦可人工修改，但非必要）。
- **半自動內容產線、唯一人工檢查點**：從課綱到全文的整條產線由 LLM + 自動 Gate 完成；人只在「課綱大綱定稿」介入一次（§20.3 Stage 1）。
- **Build-time over Runtime**：所有確定性運算（解析、驗證、組裝、長度檢查）盡可能發生在 build-time / CI；每日 runtime 的可失敗面積收斂到接近「讀一筆資料、發一則 webhook」。
- **核心資產是 Curriculum（知識圖譜）＋教材**：只要教材與課綱設計得當，未來無論改用哪種 delivery（Telegram / Email / Web / MCP）或做成網站，都能直接重複利用同一套內容。

### 1.2 維運哲學（free-tier）

**零常駐、零付費 infra**：以 GitHub Actions（排程）＋Discord Webhook（推播，每 Track 一個頻道）＋committed `state.json`（狀態，存於專用 `state` 分支）構成，純自用、近乎零維運。

---

## 2. Product Goals

- **G1**：以每天約 20 分鐘內的閱讀量，讓一個能寫 TypeScript / Python 的中階工程師，在約半年（每 Track ~180 個 Session）內，依所選 **Track** 達到對應的解題等級：

  | Track                | 半年目標等級                       |
  | -------------------- | ---------------------------------- |
  | **Foundation**       | 熟練解 **Easy**、能碰觸簡單 Medium |
  | **InterviewReady**   | 熟練解 **Medium**                  |
  | **InterviewMastery** | 大廠面試程度 / 熟練解 **Hard**     |

  三個 Track **共用同一份 Concept 教材庫與知識圖譜（DAG）**，但**各自有不同的 180-Session 課表**（涵蓋深度與題目難度不同），以達到不同的目標等級（見 §9）。**三個 Track 全量交付、同時上線**，各自推播至獨立的 Discord 頻道（見 §9.2）。

- **G2**：每日推播**先建立觀念、再搭配題目**，培養**辨識解題模式（Pattern Recognition）**的能力，而非背誦題號。
- **G3**：教材品質一致、可版本控制、可人工修改，不因 LLM 模型更新而風格漂移。
- **G4**：使用者永遠知道自己在整個學習路徑（Knowledge Graph）中的位置：昨天學過什麼、今天學什麼、明天將學什麼。
- **G5**：每個 Session 都必須包含 **TypeScript 與 Python 的語言實戰技巧**，而不只是抽象演算法（推播內以 `TypeScript Tip` / `Python Tip` 呈現，見 §10）。
- **G6**：全免費、零維運，可長期每天穩定運作。

成功衡量（自用尺度，非硬性 KPI）：使用者能在課程後段獨立辨識「這題該用哪個 Pattern」，並完成對應 Medium 題。

---

## 3. Learning Philosophy

- **Concept-first, Problem-second**：學習的主體是觀念。題目是觀念的練習場，不是目的。
- **One Concept at a Time**：每個 Session 只聚焦一個核心觀念，避免一次引入多個新 Pattern 造成認知過載。
- **Small Learning Steps**：課程維持細顆粒度。寧可多切幾個 Concept，也不為縮短課程而合併。
- **Pattern over Memorization**：目標是辨識模式，不是記憶題號。
- **Spaced Review**：真正的學習一定有複習。課程節奏內建 Practice / Review / Challenge。
- **Know when NOT to use**：學會一個 Pattern，也要能說明「為什麼這題不用另一個 Pattern」。
- **Language-grounded**：演算法思維要落回 TypeScript / Python 的實際寫法與陷阱。

---

## 4. Core Design Principles

以下為**非協商原則（Constitution）**。AI 與後續開發 MUST 遵守；違反任一條即視為設計錯誤。

1. **Concept-first, Problem-second**：每日推播 MUST 先呈現觀念，再搭配至少一題 LeetCode。MUST NOT 以題目為中心反過來組織。
2. **One Concept per Session**：每個 Session MUST 只引入恰好一個新的核心 Concept。
3. **Small Learning Steps**：Curriculum MUST 維持細顆粒度，MUST NOT 為縮短課程而合併多個 Concept。
4. **Deterministic Curriculum**：課程順序 MUST 固定且可版本控制。LLM MUST NOT 動態調整、重排或生成學習順序。
5. **Curriculum as DAG**：Curriculum MUST 實作為有向無環圖（DAG），而非線性 list。一個 Concept MUST NOT 依賴任何在拓樸排序上晚於它的 Concept（不得有前向依賴、不得成環）。
6. **Shared Knowledge, Different Tracks**：三個 Track MUST 共用同一份 Concept 教材庫與知識圖譜（DAG）；分歧只發生在【各自的 Session 課表（涵蓋深度）+ 題目難度帶 + Challenge 難度 + 推播頻道】。MUST NOT 為不同 Track 複製或改寫三份 Concept 教材正文；題目難度依 Track 差異化由 Overlay 提供（見 §9）。
7. **LLM Authors Once, Not Daily**：核心教材（Full Article，含 Digest / Tips / Hints）MAY 由 LLM 依 Concept Skeleton（§10.4）**一次性展開生成**，但生成物 MUST 通過 CI 自動把關（§20.3）後才凍結入庫；LLM MUST NOT 在**每日執行時**生成或篡改核心教材。
8. **Zero-LLM Daily Runtime**：每日 runtime MUST NOT 呼叫任何 LLM API。所有 LLM 產出（課綱、教材、Digest、Hint、Reflection 題庫）皆為 build-time 生成並凍結；每日 workflow MUST 可在完全沒有 LLM API key 的環境下成功執行。
9. **Build-time over Runtime**：凡是確定性、可預先完成的運算（markdown 解析、DAG 驗證、Lesson 組裝、Discord 長度檢查），MUST 在 CI Gate 對全部 Session 預演過；每日 runtime MUST 與 Gate 共用同一編譯模組（§7.1），確保「Gate 通過 ⇒ runtime 不會因內容問題失敗」。
10. **Language-specific Learning**：每個 concept Session 的推播 MUST 同時包含 TypeScript 與 Python 的實戰技巧（`TypeScript Tip` / `Python Tip`）。
11. **Renderer knows nothing about Curriculum**：Renderer MUST NOT 包含任何 Curriculum 邏輯（不知道「Array」「Two Pointer」等領域知識），只負責 Lesson → Discord message 的組版。
12. **Deterministic & Reproducible Delivery**：給定同一個 Session index 與 Track，推播內容 MUST 可重現（Renderer MUST 為 stateless 純函式；每日流程不含任何隨機或 LLM 產生的內容——鼓勵語亦為決定性輪替）。
13. **Generated artifacts are frozen once committed**：課綱與 Skeleton（`concepts/**`）、課表（`schedules/**`）、教材（`articles/**`）由產線生成，commit 後即定版；重新生成是**刻意的 build-time 行為**，MUST NOT 發生在每日 runtime。
14. **Secrets never in repo**：Discord Webhook URL、LLM API key MUST 只走 Actions Secrets，MUST NOT 進 repo 或任何發佈產物。
15. **Source isolation & fault tolerance**：任一非核心步驟（如未來的 Pages 發佈）失敗 MUST NOT 中斷核心推播；**多 Track 推播時，單一 Track 失敗 MUST NOT 中斷其他 Track（§18）**；核心步驟失敗 MUST 大聲失敗（紅色告警 + 非零 exit code）。
16. **Free-tier only**：MUST 僅使用 GitHub Actions + Discord Webhook + LLM 免費層（僅 build-time）+ committed `state.json`，MUST NOT 引入付費或常駐 infra。
17. **One Human Checkpoint**：內容產線唯一的常態性人工檢查點是「課綱大綱定稿」（§20.3 Stage 1）。大綱凍結後，Skeleton、全文、課表 MUST 全自動生成、僅由自動 Gate 把關；MUST NOT 引入其他常態性人工審核關卡（Gate 擋下時的例外介入除外）。

---

## 5. Non-Goals

本專案**明確不是**（避免 AI 往奇怪方向發展）：

- **NOT** 一個 LeetCode 鏡像站或題目內容轉載工具（MUST NOT 複製 LeetCode 題目敘述，只引用題號 / 標題 / 連結）。
- **NOT** 一個 Online Judge（不執行、不評測使用者程式碼）。
- **NOT** 一個 AI 聊天機器人（MVP 不做自由對話）。
- **NOT** 一個 code generation 工具（不代寫解題程式碼作為主功能）。
- **NOT** 一個「每天隨機推一題」的 bot（推播 MUST 依固定課綱、觀念先行）。
- **NOT** 一個把 Curriculum 交給 LLM 即時生成的系統。
- **NOT** 一個每日呼叫 LLM 的系統（每日 runtime 零 LLM，見 §4-8）。
- **NOT** 一個需要人逐篇審稿的內容工廠（唯一人工檢查點是課綱大綱定稿，見 §4-17）。

---

## 6. Terminology & Definitions

- **Concept**：最小學習單位。一個 Concept 聚焦一個核心觀念（例：`Left-Right Pointer`）。有唯一 `id`、教材檔、metadata、Exit Criteria、對應題目。
- **Topic**：一組相關 Concept 的集合（例：`Two Pointer`）。SHOULD 包含 5～12 個 Concept。
- **Module**：一組相關 Topic 的集合，對應一個大領域（例：`Array`）。SHOULD 包含 10～30 個 Concept。
- **Curriculum**：所有 Module / Topic / Concept 及其 prerequisite / next 關係構成的 DAG。
- **Curriculum Outline（課綱大綱表）**：`generate-curriculum.ts` 產出的可讀大綱（Module / Topic / Concept 清單、順序、依賴、對應題目一覽），是**整條產線唯一的人工定稿物**（§20.3 Stage 1）。
- **Session**：一次「每日推播」的邏輯單位（例：`Session 87`）。Session 與 Concept **非一對一**：某些 Session 是 Practice / Review / Challenge / Rest，不引入新 Concept。
- **Track**：學習軌道。共三種（見 §9），**共用同一份 Concept 教材庫與 DAG**，但**各自有獨立的 Session 課表、題目難度帶與 Discord 頻道**，對應不同的半年目標等級（Easy / Medium / Hard）。
- **Problem**：一題 LeetCode 題目及其 metadata（見 §12）。
- **Lesson Compiler**：把 `curriculum + articles + problem-bank + schedules + overlays` 編譯成 `Lesson` 物件的**單一模組**；CI Gate 與每日 runtime 共用（§7.1）。
- **Renderer**：把 `Lesson` 物件組成 Discord message（embeds）的純函式元件；不含 Curriculum 邏輯。
- **State**：跨執行的推播進度與冪等資料（**每 Track 一份進度**），存於專用 `state` 分支的 `state.json`。
- **Overlay**：Track 針對某 Concept 的差異化補充（深度、額外題目、挑戰），疊加在 Core Content 之上。
- **Concept Skeleton（骨架）**：Concept 的來源檔（`concepts/**`）——frontmatter metadata（§10.1）＋「Author Hints」提示段。由產線 LLM 批次起草（§20.3 Stage 1）、經課綱大綱定稿後凍結，是內容的**來源真相**（人 MAY 修訂，非必要）。
- **Full Article（全文）**：LLM 依 Skeleton 展開成的完整教學文章（`articles/**`）——§10 全部固定區塊（含推播用 Digest / Tips）+ 可執行程式碼；通過 §20.3 Gate 後**凍結**。
- **Digest**：Full Article 內的推播專用精華區塊。Discord 每日推播的主體是 Digest（+ Tips + 題目），**不是全文**；全文留給未來 GitHub Pages / 連結閱讀（§14.5）。

---

## 7. System Architecture

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
              CI Gate：對全部 Track ×     │      每日 runtime：逐啟用 Track
              全部 Session 完整編譯 +     │      各編譯當日一筆 Lesson
              Discord 限制檢查            ▼
              ┌──────────────────────────────────────────────────────────┐
              │  Renderer（Curriculum-agnostic、stateless 純函式）        │ → Discord message
              └───────────────────────────┬──────────────────────────────┘
                                          ▼（每 Track 各自的 Webhook / 頻道）
              Discord Webhooks ◀──────────┘     state 分支 / state.json（per-track progress）
```

- **無伺服器、無通用 DB、無常駐程序**；全免費、近乎零維運。
- **唯一持久狀態**：`state.json`（每 Track 的 Session index、上次推播時間、已完成 Concept 等），由 workflow commit 至專用 `state` 分支（§19）。
- **每日 runtime 零 LLM**（§4-8）：pipeline 中沒有 LLM 步驟；所有 LLM 產物已在 build-time 凍結於 `concepts/**`、`articles/**` 與 `data/**`。
- **責任邊界（MUST）**：
  - Curriculum 只描述「學什麼、順序、依賴」，不含推播 / 組版邏輯。
  - Scheduler（Compiler 的一部分）只把 Session index 映射到「今天要做什麼」，不碰 Discord。
  - Renderer 只把 Lesson 物件轉成 Discord message，不碰 Curriculum。

### 7.1 Lesson Compiler（關鍵元件，MUST）

- Lesson Compiler MUST 是**單一模組**：載入全部來源 → schema / DAG / 交叉引用驗證 → 對任意 `(track, sessionIndex)` 組出 `Lesson`（§16.4）。
- **CI Gate MUST 呼叫同一顆 Compiler**，對「所有 Track × 該 Track 課表的所有 Session」完整編譯，並對每筆 Lesson 執行 Renderer 產出 embeds、驗證 Discord 限制（§14.5）。任何一筆失敗 ⇒ Gate 不通過，PR 不得合併。
- **每日 runtime MUST 呼叫同一顆 Compiler** 編譯各啟用 Track 當日那一筆 Lesson。由於輸入（repo 內容）與程式碼皆與通過 Gate 時相同且編譯為確定性，runtime 的內容類失敗面積趨近於零；殘餘失敗（網路、Discord API）依 §18 錯誤處理。
- Compiler MUST 為確定性：同一份 repo 內容 + 同一 `(track, sessionIndex)` → byte-identical 的 Lesson。
- MUST NOT 出現「Gate 用一套解析、runtime 用另一套解析」的雙軌實作。

### 7.2 執行方式

以**輕量 composition root** 跑成一次性 CLI job：`src/main.ts` 手動建構各元件（純 TypeScript class / function + 建構式注入），不使用 DI 框架、不啟 HTTP server、跑完即退，契合 GitHub Actions 排程。MUST NOT 引入 NestJS 或其他重量級框架。

---

## 8. Curriculum Design

### 8.1 結構

Curriculum MUST 為 `Module → Topic → Concept` 三層，且整體 MUST 是 DAG。

- 每個 **Topic** SHOULD 含 5～12 個 Concept。
- 每個 **Module** SHOULD 含 10～30 個 Concept。
- 全課程 **Concept 總數 MUST ≥ 150**（目標 156+），且 MUST 於上線前全數產出並通過 Gate（三軌全量交付，§9）。
- Curriculum MUST NOT 在此 spec 內窮舉全部 Concept；此處只定義**骨架與規範**，Concept 清單由產線起草、經課綱大綱定稿後凍結（§20.3 Stage 1）。

### 8.2 Module 骨架（建議順序，Level 遞增）

> 以下為建議的學習主軸；實際 Concept 由產線補齊，但**順序一經定版即固定（Deterministic）**。

```
Level 0   Programming Mindset      （思維、複雜度、如何讀題）
Level 1   Array
Level 2   Hash Table
Level 3   String
Level 4   Two Pointer
Level 5   Binary Search
Level 6   Sliding Window
Level 7   Stack
Level 8   Queue
Level 9   Linked List
Level 10  Tree
Level 11  Graph
Level 12  Heap / Priority Queue
Level 13  Backtracking
Level 14  DFS / BFS
Level 15  Dynamic Programming（入門）
```

### 8.3 DAG 依賴

- 每個 Concept MUST 宣告 `prerequisite: string[]`（前置 Concept id）與 `next: string[]`（後繼 Concept id）。
- Curriculum MUST NOT 有環；MUST NOT 有前向依賴（依賴晚於自己的 Concept）。
- 依賴可跨 Module（例：`Sliding Window` 的某 Concept 可以 `HashMap` 為 prerequisite）。
- 建置時 MUST 有驗證：拓樸排序成功、無孤兒（除 Level 0 起點外每個 Concept 至少被一個 next 提及或有前人）、所有 `prerequisite` / `next` / `leetcode` 參照存在。

範例 DAG（片段）：

```
Array Traversal
      │
      ▼
Two Pointer ──────────┐
      │               ▼
      ▼           Prefix Sum
Sliding Window        │
      └───────┬───────┘
              ▼
        Medium Pattern
```

### 8.4 命名與編號

- Concept 檔名 MUST **不使用** `Day001` 這類與 Session 綁定的編號（Session ≠ Concept；未來插入新 Concept 不牽動全體）。
- Concept MUST 以「Topic 資料夾 + 局部三位數序號 + slug」命名，例：
  ```
  concepts/two-pointer/001-why-two-pointer.md
  concepts/two-pointer/002-left-right-pointer.md
  concepts/two-pointer/003-fast-slow-pointer.md
  ```
- Concept 的**唯一識別**是 metadata 內的 `id`（slug，全域唯一、穩定不變），而非檔名序號與路徑。Renderer / DAG / Session 一律以 `id` 參照。

### 8.5 兩層內容模型：Skeleton → Full Article

內容分兩層（職責清楚分離）：

- **Concept Skeleton（半自動產出、來源真相）**：`concepts/{topic}/{NNN}-{slug}.md`。內含 frontmatter（§10.1）與「Author Hints」提示段（§10.4）。由 `scripts/generate-curriculum.ts` 以 LLM 批次起草，經**課綱大綱一次性定稿**（§20.3 Stage 1）後凍結。
- **Full Article（LLM 展開、凍結）**：`articles/{topic}/{NNN}-{slug}.md`。由 §20.3 Stage 2 pipeline **讀 Skeleton → LLM 展開成 §10 全部固定區塊的詳盡文章 → 通過 Gate → 凍結**。Lesson Compiler 只讀 `articles/`。
- **原則**：Skeleton 凍結後即為唯一來源真相（人 MAY 手動修訂，修訂後重跑展開）；Full Article 是可重生成的產物（改 Skeleton → 重跑生成 → 重新凍結）。生成 MUST 為 build-time 一次性，MUST NOT 於每日 runtime 進行。

---

## 9. Track System

三種 Track，**共用同一份 Concept 教材庫與 DAG**，但**各自有獨立的 180-Session 課表**（由 script 生成，§13.4）與**獨立的 Discord 頻道**（§9.2），以在約半年內達到不同的目標等級：

```
Track
├── Foundation         目標：熟練 Easy、碰觸簡單 Medium
│                      課表：基礎模組吃更多節奏、涵蓋較淺（進階模組可不在半年內走完）
│                      題目：Easy 為主；Challenge = Easy / 簡單 Medium
├── InterviewReady     目標：熟練 Medium
│                      課表：走完完整核心課綱、對齊 Grind75 / NeetCode 節奏
│                      題目：Easy 暖身 → Medium 為主；Challenge = 標準 Medium
└── InterviewMastery   目標：大廠面試程度 / 熟練 Hard
                       課表：基礎走快、把更多 Session 花在進階模組 + 變體/綜合
                       題目：Medium → Hard、變體綜合；Challenge = Hard / 綜合變體
```

### 9.1 共用 vs 分歧（模型 B）

```
Concept 教材庫    → Shared      （同一份 Concept 教學正文，三 Track 不存三份）
Knowledge / DAG   → Shared      （知識圖譜、prerequisite / next 共用）
Session 課表       → Different   （每 Track 選哪些 Concept、走多深、節奏不同）
Problem 難度帶     → Different   （每個 Concept 搭配的題目難度依 Track 而不同）
Presentation      → Different   （每週 Challenge 難度不同）
Delivery 頻道      → Different   （每 Track 一個 Discord Webhook / 頻道，§9.2）
```

規範（MUST）：

- 三個 Track MUST NOT 各自複製三份 Concept 教材正文；**分歧只發生在「課表 + 題目難度 + Challenge 難度 + 頻道」**，Concept 教學內容 MUST 共用同一份。
- 每個 Track MUST 有自己的確定性課表（`schedules/{track}.json`），由 `scripts/generate-schedule.ts` 生成（§13.4），且必為 DAG 的合法拓樸子序列（MUST NOT 違反 prerequisite）。
- Track 課表 MAY 涵蓋 Concept 教材庫的**子集**（Foundation 可不在半年內走完全部進階 Concept），但 MUST NOT 引入不存在於教材庫的 Concept。
- 每個 Concept 對每個 Track 的題目難度由 Overlay（§16.3）指定；同一 Concept 在不同 Track 可搭配不同難度題目。
- 未來新增 Track MUST NOT 需要複製核心教材，只需新增一份 Track 參數（供課表生成器使用）+ Overlay + Webhook Secret。
- **交付範圍**：三個 Track 的完整 180-Session 課表與其涵蓋的全部教材 MUST 全量交付、同時上線（Gate 對三軌全 Session 完整編譯，§7.1 / §24 AC8）。

### 9.2 Multi-Track Delivery（多頻道推播，MUST）

- 每個 Track 對應一個獨立的 Discord Webhook Secret（§16.5）；**「該 Track 的 Webhook Secret 有設定」即代表該 Track 啟用**，移除 Secret 即停用——不需要改程式或設定檔。
- 每日 MUST 由**同一個 workflow、單一 job** 依固定順序（`foundation → interviewReady → interviewMastery`）逐一處理啟用的 Track：各自做日期 guard → 編譯 → 渲染 → 推播至各自頻道 → 推進各自 state。
- MUST NOT 以 Actions matrix 開多個平行 job 處理多 Track（多 job 同時 push `state` 分支會互相衝突；單一 job 依序執行、單次 commit 寫入全部 Track state）。
- **失敗隔離（MUST）**：單一 Track 的編譯 / 推播失敗，MUST 記錄錯誤並繼續處理其餘 Track；全部處理完後若有任一失敗，MUST 發告警並以非零 exit code 結束（已成功的 Track 其 state 照常推進與保存）。
- **告警的責任歸屬（MUST，F1 定案）**：告警版面的實作 MUST 唯一——單一 Track 失敗與全域性失敗（無任何 Webhook 設定、`STATE_FILE` 缺失、`state.json` 解析失敗、**`state.json` 欄位語意損毀**、**狀態存檔失敗**）皆 MUST 由**推播程式**以同一顆告警渲染函式（`src/renderer/alert.ts`）發出，全域性失敗發至**第一個已設定的頻道**。**MUST NOT** 由 `daily.yml` 另行拼組 Embed 告警——同一責任兩套實作會使版面隨時間漂移，與 §4-9 的「單一 Compiler、不得雙軌」同理。
  - workflow 層 MAY 保留一道 `if: failure()` 的**最後防線通知**，用於程式根本沒能啟動的情境（`npm ci` / `tsc` / checkout 失敗）。此通知 MUST 為**極簡純文字**（`{"content": "..."}`），MUST NOT 使用 `embeds`、MUST NOT 重述失敗原因細節。與程式告警重疊時使用者會多收一則純文字提示，屬可接受的取捨（優於靜默）。
  - 三個 Webhook 皆未設定時**無處可發**，MUST 僅留下錯誤紀錄並以非零 exit code 結束；此情況不構成「無聲失敗」。
- **告警本身送不出去時（MUST）**：MUST 另記一筆錯誤紀錄、仍計為該次失敗，且 **MUST NOT 因告警失敗而中斷其餘 Track 的處理**——告警發送 MUST 包在自身的 try/catch 內且不重新拋出。
- 至少一個 Track 的 Webhook Secret MUST 已設定，否則每日 job MUST 直接失敗（fail loud，屬設定錯誤）。
- **Track 生命週期語意（MUST）**：
  - **啟用（何時開始推）**：加上 Secret 後**不需其他設定**——下一次排程執行時，StateStore 對 state 中不存在的啟用 Track 自動補建初始進度（`currentSessionIndex: 1`、`lastPushAt` 為空），日期 guard 因而放行，當次即推 Session 1。想立即開始 MAY 手動觸發 `workflow_dispatch`。
  - **指定起點 / 跳課 / 重來**：直接編輯 `state` 分支的 `state.json`（修改該 Track 的 `currentSessionIndex`）並 commit；下一次執行即從該課開始。MUST NOT 為此新增額外設定項——課表是凍結的地圖，state 是唯一權威的「目前位置」。
  - **暫停 / 續播**：移除 Secret = 暫停（該 Track 被跳過，state 保留不動）；重新加回 Secret = 從原進度續播，MUST NOT 重置為 Session 1。

---

## 10. Concept Structure

**Full Article**（LLM 展開後的完整教材，見 §8.5）MUST 包含以下**固定區塊**（是 `MUST`，非「建議」）；Lesson Compiler 與 Gate 都依這組區塊解析：

```
─ 閱讀用（全文；未來 Pages / 連結閱讀）─
- Concept              （這是什麼）
- Thinking             （為什麼會想到它 / 直覺從何而來）
- Pattern Recognition  （看到什麼特徵就該想到它）
- Common Mistakes      （常見誤區）
- Complexity           （時間 / 空間複雜度）
- TypeScript Corner    （TS 實戰技巧與陷阱，含可執行程式碼）
- Python Corner        （Python 實戰技巧與陷阱，含可執行程式碼）
- Today's Challenge    （今日題目：1~3 題、觀念對應、每題含 Hint）
- Takeaway             （一句話帶走）
- Tomorrow Preview     （明天預告：取自 DAG 的 next）

─ 推播用（Digest 區塊；Discord 每日推的主體）─
- Digest               （觀念精華：Concept + Thinking + Pattern Recognition 濃縮）
- TypeScript Tip       （TS 一則實戰要點，含短程式碼）
- Python Tip           （Python 一則實戰要點，含短程式碼）
```

### 10.1 Frontmatter（Concept metadata）

每個 Concept 檔 MUST 以 YAML frontmatter 描述 metadata：

```yaml
---
id: left-right-pointer # 全域唯一 slug（MUST 穩定不變）
title: Left-Right Pointer # 顯示標題
module: array # 所屬 Module id
topic: two-pointer # 所屬 Topic id
difficulty: easy # easy | medium（Concept 本身的認知難度）
estimated_minutes: 10 # 預估閱讀時間
pattern_label: Two Pointer # 主 Embed 的 `Pattern` field（§16.4 Lesson.patternLabel）
complexity_label: O(n) / O(1) # 主 Embed 的 `複雜度` field（§16.4 Lesson.complexityLabel）
prerequisite: [array-traversal] # 前置 Concept id（DAG）
next: [fast-slow-pointer] # 後繼 Concept id（DAG）
learning_goal:
  - 理解左右指標的用途
  - 能辨識使用時機
  - 能自行設計左右指標的移動條件
exit_criteria: # 「今天真正學會什麼」（MUST）
  - 能描述此 Pattern
  - 能辨識適用時機
  - 能分析時間 / 空間複雜度
  - 能完成至少一題 Easy
  - 能說明為什麼此題不用另一種 Pattern
leetcode: [26, 27, 167] # 對應題號（詳細 metadata 在 problem-bank）
tags: [array, in-place, sorted]
---
```

> **`pattern_label` / `complexity_label` 為 frontmatter 欄位（MUST，非從正文推導）**：§16.4 的 `Lesson`
> 需要這兩個短標籤填入主 Embed 的 inline fields，而 `Pattern Recognition` / `Complexity` 區塊是給人讀的
> 散文——若由正文以啟發式規則抽取，將違反 §4「Deterministic & Reproducible Delivery」。故一律由
> frontmatter 明確提供，Compiler 原樣帶入、MUST NOT 改寫。

### 10.2 Exit Criteria（MUST）

- 每個 Concept MUST 定義 `exit_criteria`，明確列出「今天真正學會什麼」，而非「今天學完」。
- Exit Criteria SHOULD 可勾選（呈現為 checklist），供使用者自評。
- 推播版面考量：`exit_criteria` SHOULD ≤ 6 條、每條 SHOULD ≤ 60 字元（Gate 檢查，§20.3）。

### 10.3 內容長度與詳盡度

- **全文（閱讀用區塊）**：「≤ 2,000 字（中文字）」的上限**只針對 Concept 觀念本體**——即 `Concept` / `Thinking` / `Pattern Recognition` / `Common Mistakes` 等**敘述性文字**；這段 SHOULD **詳盡**，把「怎麼想到、為什麼這樣用、什麼時機不適用」講清楚。
- **不計入**此上限的部分：`TypeScript Corner` / `Python Corner`（程式碼與語言技巧）、程式碼區塊、`Today's Challenge` 題目清單、`Complexity` 的算式。這些為必備固定區塊，MAY 依需要充分展開。
- **推播用區塊（Digest / Tips）**：受 §14.5 的字元預算硬限制，由 Gate 逐一檢查。
- 目標節奏：核心觀念本體 SHOULD 在「每天約 20 分鐘內」可讀完；語言 Corner 與題目視為延伸練習。
- 觀念本體過長（單一 Concept 塞入多個新 Pattern）時 MUST 分割為多個 Concept（呼應 Small Learning Steps），MUST NOT 硬塞。

### 10.4 Concept Skeleton（半自動產出的來源）

Skeleton（`concepts/**`）是內容的來源真相，MUST 只含兩部分：

1. **Frontmatter metadata**（§10.1 的全部欄位）。
2. **Author Hints 提示段**（markdown 條列），提供 LLM 展開全文時的骨架與方向，SHOULD 涵蓋：
   - 核心觀念一句話（這是什麼）
   - Pattern 辨識線索（看到什麼特徵就該想到它）
   - 要強調的重點與直覺來源（Thinking）
   - 要提醒的常見誤區（Common Mistakes）
   - TypeScript / Python 各自要點到的語言重點（供 Corner / Tip 展開）
   - 對應題目為何適合此 Pattern 的一句話（供 whyThisPattern / Hint 展開）

產出方式（MUST，呼應 §4-17）：

- Skeleton 由 `scripts/generate-curriculum.ts` 以 LLM **批次起草**（§20.3 Stage 1），結構面（DAG、顆粒度、參照）由自動 Gate 驗證。
- 人的介入點只有一個：**課綱大綱表（Curriculum Outline）一次性定稿**——確認 Module / Topic / Concept 清單、順序與依賴的方向正確（約 1～2 小時），不逐篇審 Hints。
- 定稿後 Skeleton 凍結。你 MAY 事後手動修訂任一 Skeleton（修訂 → 重跑該 Concept 的展開 → 重新過 Gate），但常態流程不要求。
- Author Hints 是 LLM 展開全文的**方向錨點**，用來壓低幻覺、確保前後一致。

---

## 11. Content Style Guide

- **語言：教學文章 MUST 以繁體中文輸出**，但**技術術語、Pattern 名稱、API / 類別 / 函式名與程式碼（含 Corner / Tip）MUST 保留原文**（英文），不強制翻譯（例：Sliding Window、Two Pointer、Hash Table、`O(n)`、`bisect` 等不譯）。
- 語氣：教練式、務實、鼓勵；避免學術腔與冗長證明。
- 觀念先行：先講「怎麼想到」（Thinking / Pattern Recognition），再講「怎麼做」。
- 每個 Concept MUST 至少一個具體例子帶出直覺（例：Sliding Window 的核心是「每個元素最多進出視窗一次 → O(n)」，而非「視窗」本身）。
- 程式碼：TypeScript Corner 與 Python Corner MUST 包含可執行片段，聚焦**語言特性與陷阱**（例：Python 的 `bisect`、TS 的 `number` 邊界、深淺拷貝、負索引），而不只是抄一份解答。
- 題目：只呈現題號 / 官方標題 / LeetCode 連結 / 為什麼適合此 Pattern；MUST NOT 轉載題目完整描述。
- 一致性：所有 Concept 依 §10 的固定區塊順序撰寫，讓 Compiler 能穩定解析。

---

## 12. Problem Bank

題目資料 MUST NOT 每天即時接 LeetCode，而是預先建於 `data/problem-bank.json`，版本控制。

### 12.1 Problem Metadata（MUST）

```jsonc
{
  "26": {
    "id": 26,
    "slug": "remove-duplicates-from-sorted-array",
    "title": "Remove Duplicates from Sorted Array",
    "url": "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    "difficulty": "Easy", // Easy | Medium | Hard
    "patterns": ["two-pointer"], // 對應 Concept/Topic 的 pattern key
    "keywords": ["sorted", "array", "in-place"],
    "review_priority": "high", // high | medium | low
    "estimated_minutes": 15,
    "lists": ["grind75", "neetcode150", "blind75"], // 選配：所屬經典題單
    "companies": [], // 選配：未來擴充
  },
}
```

- 每題 MUST 至少有 `id / slug / title / url / difficulty / patterns`。
- `patterns` MUST 對應到 Curriculum 內的 Topic / Concept key，讓「Concept → Problem」可逆向查找。
- `url` 的 slug MUST 與 `slug` 欄位一致（Gate 檢查，避免死鏈；§20.3）。
- 題庫 MUST 涵蓋三個 Track 難度帶所需的 Easy / Medium / Hard 題目（三軌全量交付）。
- **題數合法性的唯一權威守門點（MUST，F1 定案）**：每個 Concept 對應的題數 MUST 為 1～3 題；查無對應、對應題號在題庫中不存在、題數為 0 或超過 3，一律 MUST 在**題目查找階段**（`src/compiler/problem.ts`）拋出可辨識且訊息指名成因的錯誤（fail loud），MUST NOT 靜默截斷題數或略過缺漏題目。渲染後的字元預算檢查雖亦含題數上限，但僅為 defense-in-depth，MUST NOT 被當作主要判準，也 MUST NOT 在查找階段之外另行定義題數的錯誤型態與訊息——避免兩處各說各話。

### 12.2 教材依源（借鑑知識架構，不轉載內容）

MUST NOT 直接引用他人教材內容；MAY 參考其**知識架構與題目編排**：

- NeetCode Roadmap（循序式學習路徑）
- Grind 75（依學習時間安排的題單）
- Blind 75 / NeetCode 150 / Top Interview 150（經典題單，作為 `lists` 標籤）
- Tech Interview Handbook
- AlgoMonster Knowledge Map（知識圖譜設計參考）
- The Algorithms（Python / TypeScript 實作參考）

---

## 13. Session Scheduling

Session 是「每日推播」的邏輯單位；每 Track 總量 MUST 約 **180 個 Session**，對應約半年的每日學習。

### 13.1 Session ≠ Concept

- 並非每個 Session 都引入新 Concept。Session 類型（MUST 支援）：
  - `concept`：引入一個新 Concept（多數 Session）。
  - `practice`：不引入新 Concept，複習近期 Concept、加做題目。
  - `review`：週複習（見 §15）。
  - `challenge`：Medium 綜合挑戰。
  - `rest`：休息日（可只推一句鼓勵 / 一分本週回顧提示）。

### 13.2 每週節奏（建議樣板，Track 可微調）

```
Mon  concept    新觀念
Tue  concept    新觀念
Wed  practice   練習
Thu  review     複習
Fri  challenge  Medium Challenge
Sat  concept    補充 / 進階
Sun  rest       休息
```

- 節奏 MUST 內建 Review 與 Rest（呼應 Learning Philosophy）。
- Foundation Track 的 challenge 難度 SHOULD 降級；InterviewMastery 的 challenge SHOULD 升級為變體 / 綜合題。
- **週節奏不綁日曆星期（MUST）**：上表的 Mon～Sun 僅為示意；節奏以**相對天數**計（Session 1 = 該 Track 實際開始的第一天，每 7 個 Session 一輪）。因「漏跑不跳課」（§19），漏推一天即整體順延一天，星期本來就會漂移，MUST NOT 依日曆星期決定 Session 類型。使用者若希望 rest 落在週日，SHOULD 自行選在週一啟用該 Track（§9.2）。

### 13.3 Session → 內容映射

- Compiler MUST 依 Track 讀取**該 Track 的確定性課表**（`schedules/{track}.json`），把 `sessionIndex` 映射到 `{ type, conceptId?, reviewRange?, problemIds? }`。
- 課表 MUST 為 deterministic：同一 `sessionIndex` + 同一 Track 永遠得到相同結果；不同 Track 的同一 `sessionIndex` 可對應不同 Concept / 難度。
- 每個 Track 的課表 MUST 尊重共用 DAG 的 prerequisite（不得在前置 Concept 之前插入後繼 Concept）。
- 各 Track 的進度以 `state.tracks[track].currentSessionIndex` 獨立前進（該 Track 成功推播一次 +1，見 §19）。

### 13.4 課表生成（MUST 由 script 生成，不手寫）

- `schedules/{track}.json` MUST NOT 手工撰寫與維護（3 × ~180 筆手寫必然出錯且難以演進）。
- MUST 由 `scripts/generate-schedule.ts` **確定性生成**（三份課表一次生成）：
  - **輸入**：Curriculum DAG、每週節奏模板（§13.2）、Track 參數（涵蓋子集規則、難度帶、challenge 難度、節奏微調）。
  - **輸出**：`schedules/{track}.json` × 3，生成後 commit 定版（Constitution 第 13 條：commit 後即凍結；重新生成是刻意的 build-time 行為）。
  - **確定性（MUST）**：同一輸入 → byte-identical 輸出（不得使用未固定 seed 的隨機源）。
- 生成器 MUST 內建驗證：產出課表為 DAG 的合法拓樸子序列、review 的 `reviewRange` 正確涵蓋本週、所有 `conceptId` / `problemIds` 參照存在。
- 插入 / 調整 Concept 時的工作流：改 Curriculum → 重跑生成器 → review diff → commit。MUST NOT 手改生成物。

---

## 14. Discord Rendering

推播採用 Discord Channel Webhook 模式（只推播、不收訊息；不需要 bot / gateway / Message Content Intent）。推播 MUST 走 Discord Channel Webhook（HTTP POST embeds），每 Track 一個 Webhook / 頻道（§9.2）。

### 14.1 Renderer 契約（MUST）

- Renderer 輸入為一個 **Lesson 物件**（見 §16.4），輸出為 Discord message（embeds）。
- Renderer MUST NOT 讀取 Curriculum、Problem Bank、檔案或 state；一切所需資料 MUST 已由 Compiler 放進 Lesson 物件。
- Renderer MUST 為 stateless 且 deterministic 的**純函式**：同一 Lesson → 同一 embeds。
- Renderer 對 Track 無感知邏輯：Track 只是 Lesson 的一個欄位，決定不了版面結構（頻道路由由 Webhook Client 依設定處理）。

### 14.2 版面（concept 類 Session）——推 Digest，不推全文

一則訊息（主 Embed + 題目 Embed）：

- **主 Embed（今日課程）**
  - `title`：`📚 Session {n} · {conceptTitle}`
  - `description`：**Digest 區塊全文**（觀念精華；含遮罩連結 / 粗體 / 清單）
  - `fields`：
    - `Pattern`（inline）
    - `複雜度`（inline）
    - `預估時間`（inline）
    - `TypeScript Tip`（程式碼區塊）
    - `Python Tip`（程式碼區塊）
  - `color`：依 Module 上色（見 §14.4）
- **題目 Embed（Today's Challenge）**
  - 逐題列出：`[{id}. {title}]({url})` · 難度 · 為什麼適合此 Pattern · Hint（收合於一行，預生成、非 LLM 即時）
- **學習路徑（Progress footer）**：
  ```
  昨天  {prevConceptTitle} ✓
  今天  {conceptTitle}
  明天  {nextConceptTitle}
  ```
  取自 DAG 的 prerequisite / next，讓使用者知道所在位置。
- **Exit Criteria**：以 checklist 呈現（`- [ ] …`）。
- **Takeaway**：一句話結尾。

### 14.3 版面（其他 Session 類型）

- `practice` / `challenge`：以題目 Embed 為主，帶簡短提示（Hint 為 build-time 預生成）。
- `review`：見 §15。
- `rest`：一句簡短鼓勵（內建語錄池決定性輪替）+ 本週回顧提示。

### 14.4 顏色（依 Module，教材更快辨識）

- 每個 Module 一色（Array / Hash / String / Two Pointer …），同一 Module 的 Concept 共用色。
- 具體色碼由實作定義為常數表；Renderer 只查表，不含任何判斷邏輯以外的知識。

### 14.5 Discord 硬限制與字元預算（MUST）

Discord 的限制（全部 MUST 遵守，且由 **Gate 對每一筆 Lesson 的 render 結果逐一檢查**，§7.1 / §20.3）：

- 單一 embed：`title` ≤ 256、`description` ≤ 4,096、`fields` ≤ 25（name ≤ 256 / value ≤ 1,024）。
- 單則訊息 ≤ 10 embeds。
- **單則訊息內所有 embeds 的文字總和 ≤ 6,000 字元**（title + description + field name/value + footer 合計；這是最容易踩到的限制）。

**計算口徑（MUST，唯一判準）**——Gate 與每日 runtime MUST 採用同一套口徑，否則「Gate 通過 ⇒ runtime 不失敗」不成立：

- **計入**：每個 embed 的 `title`、`description`、每個 field 的 `name` 與 `value`、`footer.text`、`author.name`。
- **不計入**：`url`、`color`、`image`、`thumbnail`、`timestamp` 等非文字欄位。
- **長度單位**：Unicode **code point**（如 JS 的 `Array.from(str).length`），**不是** UTF-16 code unit（`str.length`）。版面含 emoji（📚🎯🧭✅💡）時兩者會有差異，統一以 code point 為準。
- **超限一律視為失敗**，MUST NOT 自動截斷內容以求通過（靜默裁切等同無聲失敗，違反 §4-15）。
- **結構性上限與字元預算 MUST 在同一次檢查中完成（F1 定案）**：本節開頭列出的平台**結構性上限**（單一 embed 的 `title` / `description` / `fields` 數 / field `name` / field `value`，以及單則訊息的 embeds 數）MUST 與逐區塊預算、總量上限由**同一顆預算檢查函式**（`src/renderer/budget.ts` 的 `checkBudget`）在同一次呼叫中檢查，並以相同的明細項形式回報。**理由**：這些是平台會直接拒絕請求的硬限制，若只檢查文字總量，超限會延後到送出時才由平台回報，等同把可在送出前攔下的錯誤推遲到推播階段，違反 §4-9「能在 CI 驗的，不留到早上六點」。Gate（§20.3）與每日 runtime MUST 共用此同一顆函式。

因此推播內容 MUST 依以下**字元預算**設計（Gate 檢查生成物；超限 ⇒ 生成不通過，回產線重生）：

| 區塊                        | 預算（字元）              |
| --------------------------- | ------------------------- |
| Digest（主 Embed description） | ≤ 900                  |
| TypeScript Tip（field value）  | ≤ 450（含程式碼區塊）   |
| Python Tip（field value）      | ≤ 450（含程式碼區塊）   |
| 每題（連結 + 難度 + why + Hint）| ≤ 350，最多 3 題        |
| Exit Criteria（checklist）     | ≤ 400（≤6 條、每條 ≤60）|
| Takeaway                       | ≤ 120                   |
| 學習路徑 footer                | ≤ 200                   |

- Render 後單則訊息總長 MUST ≤ **5,500** 字元（保留 500 安全餘裕）。
- 一則訊息裝不下時 MUST 確定性拆為第二則訊息（fallback，正常情況下預算設計應使其不發生）。
- 全文（Corner 等閱讀用區塊）不進 Discord；留待未來 GitHub Pages（F9）以連結提供。
- 推播失敗 MUST 發一則紅色告警 Embed（若 webhook 本身可用），MUST NOT 無聲失敗。

### 14.6 推播實際長相（mock，concept 類 Session）

> 主 Embed 的 description 即 **Digest**；TS/Python Tip 為 fields 內的程式碼區塊。題目一律呈現為**可點的 LeetCode 連結（題號 + 官方標題）**＋難度＋「為什麼適合此 Pattern」＋Hint，MUST NOT 轉載題目完整描述（§5 / §11）。

```
┌─────────────────────────────────────────────────┐
│ 📚 Session 34 · Left-Right Pointer              │  ← 主 Embed（依 Module 上色）
│ 排序後的陣列要找「一組和」時，與其開雙層迴圈       │  ← description = Digest
│ O(n²) 暴搜，不如讓兩個指標從頭尾往中間夾。       │
│ 特徵：陣列已排序、要找符合某條件的一對元素。     │
│                                                 │
│ Pattern：Two Pointer ─ 複雜度：O(n) ─ 預估：15m │  ← fields（inline）
│ TypeScript Tip：```ts … ```                     │
│ Python Tip：```py … ```                         │
├─────────────────────────────────────────────────┤
│ 🎯 Today's Challenge                            │  ← 題目 Embed
│ • [167. Two Sum II - Input Array Is Sorted](…)  │
│   Medium · 經典左右指標入門 · Hint: 想想單調性   │
│ • [26. Remove Duplicates from Sorted Array](…)  │
│   Easy · 練習快慢指標的邊界處理                  │
├─────────────────────────────────────────────────┤
│ 🧭 學習路徑                                     │
│ 昨天  Array Traversal ✓                          │
│ 今天  Left-Right Pointer                         │
│ 明天  Fast-Slow Pointer                          │
│                                                 │
│ ✅ Exit Criteria                                 │
│ - [ ] 能描述左右指標的移動條件                   │
│ - [ ] 能辨識「已排序 + 找一對」的適用時機         │
│ - [ ] 能完成至少一題 Easy                        │
│                                                 │
│ 💡 Takeaway：排序 + 找一對 → 先想左右指標。       │
└─────────────────────────────────────────────────┘
```

> `(…)` 代表該行整串是可點的 LeetCode 連結（Discord 遮罩連結）。實際連結、題號、難度由 Compiler 從 Problem Bank 帶入；Hint 為 build-time 預生成並凍結（§20）。

---

## 15. Weekly Review

每週固定一個 `review` Session，MUST 包含三段（比單純 Quiz 更有價值）：

```
Review       本週涵蓋的 Concept 清單（帶連結回顧）
Reflection   一個反思問題（例：本週哪兩個 Pattern 最容易混淆？為什麼？）
Challenge    一題 Medium 綜合題（Track 難度不同）
```

- Review 段的 Concept 清單 MUST 由 Compiler 依「本週涵蓋的 sessionIndex 範圍」推導；MUST NOT 由 LLM 決定範圍。
- Reflection 問題 MUST 來自 **build-time 預生成的題庫**（`data/reflection-bank.json`，依 Topic / 週次組織，過 Gate 凍結；§20），每日 runtime 依 sessionIndex 決定性選取。MUST NOT 於 runtime 呼叫 LLM 生成。
- Challenge 題目 MUST 取自 Problem Bank（deterministic 選題）。

---

## 16. Data Model

### 16.1 Curriculum（DAG）

Curriculum 由 Concept frontmatter（§10.1）與骨架檔（`curriculum/modules.json`）建置時產出一份 in-memory 圖：

```ts
interface ConceptNode {
  id: string;
  title: string;
  module: string;
  topic: string;
  difficulty: "easy" | "medium";
  estimatedMinutes: number;
  prerequisite: string[]; // Concept ids
  next: string[]; // Concept ids
  learningGoal: string[];
  exitCriteria: string[];
  leetcode: number[]; // Problem ids
  tags: string[];
  skeletonPath: string; // Skeleton（concepts/**；產線起草、定稿後凍結）
  articlePath: string; // LLM 展開並凍結的 Full Article（articles/**）；Compiler 讀這份
}
```

### 16.2 Schedule（Session 課表）

```ts
type SessionType = "concept" | "practice" | "review" | "challenge" | "rest";
type Track = "foundation" | "interviewReady" | "interviewMastery";

interface SessionPlan {
  sessionIndex: number; // 1..~180
  type: SessionType;
  conceptId?: string; // type === 'concept'
  reviewRange?: [number, number]; // type === 'review'（本週 sessionIndex 範圍）
  problemIds?: number[]; // practice / challenge
}

// 每個 Track 一份獨立課表（模型 B）；由 scripts/generate-schedule.ts 生成（§13.4）
interface TrackSchedule {
  track: Track;
  targetLevel: "easy" | "medium" | "hard"; // 半年目標等級
  sessions: SessionPlan[]; // 約 180 筆；MUST 為共用 DAG 的合法拓樸子序列
}
```

### 16.3 Track Overlay

```ts
interface TrackOverlay {
  track: Track;
  byConcept: Record<
    string /*conceptId*/,
    {
      extraProblemIds?: number[];
      extraNotesMarkdown?: string; // 疊加，不取代 Core Content
      challengeDifficulty?: "easy" | "medium" | "hard";
    }
  >;
}
```

### 16.4 Lesson（Compiler → Renderer 的唯一介面）

```ts
interface Lesson {
  sessionIndex: number;
  type: SessionType;
  track: Track;
  concept?: {
    id: string;
    title: string;
    moduleColor: number;
    digest: string; // 推播主體（§10 Digest 區塊）
    tsTip: string; // TypeScript Tip（含短程式碼）
    pyTip: string; // Python Tip（含短程式碼）
    takeaway: string;
    exitCriteria: string[];
    patternLabel: string; // 主 Embed field 用
    complexityLabel: string;
    estimatedMinutes: number;
    articlePath: string; // 全文位置（未來 Pages / 連結用）
  };
  problems: Array<{
    id: number;
    title: string;
    url: string;
    difficulty: string;
    whyThisPattern: string;
    hint?: string; // build-time 預生成、凍結
  }>;
  path?: { prev?: string; current: string; next?: string }; // 顯示用標題
  encouragement?: string; // 內建語錄池，依 sessionIndex 決定性輪替（rest 等）
  reflectionQuestion?: string; // review 用，取自預生成題庫
}
```

- Renderer MUST 只依賴 `Lesson`。新增 delivery（Telegram / Email / Web）時只需新增 Renderer，不動上游。
- `Lesson` 內所有欄位 MUST 為 build-time 可得的凍結內容；MUST NOT 有任何欄位需要 runtime LLM 填充。

### 16.5 使用者設定（Multi-Track）

MVP 為單一使用者、多 Track 訂閱。設定以環境變數（Actions Secrets / Vars）提供：

```
DISCORD_WEBHOOK_URL_FOUNDATION=...          # 設定即啟用 foundation Track
DISCORD_WEBHOOK_URL_INTERVIEW_READY=...     # 設定即啟用 interviewReady Track
DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY=...   # 設定即啟用 interviewMastery Track
STATE_FILE=<state.json 路徑；由 workflow 指向 state 分支的 checkout 位置>
DRY_RUN=true|false（選配；見 §21.1）
FORCE=true|false（選配；見 §21.1）
```

- **啟用規則（MUST）**：某 Track 的 Webhook 環境變數非空 ⇒ 該 Track 啟用；全部為空 ⇒ 每日 job 直接失敗（設定錯誤，fail loud）。
- 每日 runtime **沒有** `GEMINI_API_KEY`（§4-8）；LLM key 只出現在 build-time 內容產線（§20）。

---

## 17. Repository Structure

```
leetcode-daily-coach/
├── docs/
│   └── spec.md                  # 本文件（唯一需求來源）
├── README.md
├── package.json
├── tsconfig.json
├── curriculum/
│   ├── modules.json             # Module / Topic 骨架與順序（Deterministic）
│   └── outline.md               # 課綱大綱表（generate-curriculum 產出；唯一人工定稿物）
├── schedules/                   # 每 Track 一份課表；由 script 生成後 commit（MUST NOT 手寫）
│   ├── foundation.json          # ~180 Session；目標 Easy
│   ├── interview-ready.json     # ~180 Session；目標 Medium
│   └── interview-mastery.json   # ~180 Session；目標 Hard
├── concepts/                    # Concept Skeleton（產線起草、大綱定稿後凍結；frontmatter + Author Hints）
│   ├── mindset/
│   │   ├── 001-complexity.md
│   │   └── ...
│   ├── array/
│   ├── two-pointer/
│   │   ├── 001-why-two-pointer.md
│   │   ├── 002-left-right-pointer.md
│   │   └── ...
│   └── ...
├── articles/                    # Full Article（LLM 展開、Gate 通過、凍結；Compiler 讀這裡）
│   └── {topic}/{NNN}-{slug}.md
├── overlays/                    # Track Overlay（疊加，不取代）
│   ├── foundation.json
│   ├── interview-ready.json
│   └── interview-mastery.json
├── data/
│   ├── problem-bank.json        # 題目 metadata（涵蓋三 Track 難度帶）
│   ├── encouragement.json       # 內建鼓勵語錄池（決定性輪替）
│   └── reflection-bank.json     # Weekly Reflection 題庫（build-time 預生成、凍結）
├── src/
│   ├── main.ts                  # composition root：手動組裝元件 → 逐 Track run → exit
│   ├── config.ts                # 讀環境變數（各 Track webhook / STATE_FILE / DRY_RUN / FORCE）
│   ├── compiler/                # Lesson Compiler（單一模組；Gate 與 runtime 共用）
│   │   ├── curriculum.ts        #   載入 modules.json + frontmatter → DAG（含驗證）
│   │   ├── content.ts           #   讀 articles/** → 解析固定區塊
│   │   ├── problem.ts           #   讀 problem-bank
│   │   ├── schedule.ts          #   sessionIndex → SessionPlan
│   │   ├── overlay.ts           #   套 Track Overlay
│   │   └── lesson.ts            #   組出 Lesson（compile(track, sessionIndex)）
│   ├── renderer/                # DiscordRenderer（Lesson → embeds；純函式、無 Curriculum 邏輯）
│   ├── discord/                 # DiscordWebhookClient（POST、告警；依 Track 路由至對應 webhook）
│   └── state/                   # StateStore（讀寫 state.json；per-track 進度）
├── scripts/
│   ├── generate-curriculum.ts   # Stage 1：課綱 + Skeleton 批次起草（LLM）+ 結構 Gate + 大綱表輸出（§20.3）
│   ├── generate-content.ts      # Stage 2：全文一次性批次展開（LLM）+ 品質 Gate；含節流/斷點續跑
│   ├── generate-schedule.ts     # 課表確定性生成（三份；§13.4）
│   └── validate.ts              # Gate 入口：DAG 驗證 + 全 Track × 全 Session 完整編譯 + render 限制檢查
├── state/
│   └── state.json               # ※ 只存在於專用 `state` 分支（§19）；main 上只有初始樣板
└── .github/workflows/
    ├── daily.yml                # 每日推播排程（零 LLM；單一 job 逐 Track）
    └── content-gate.yml         # PR Gate：validate.ts + TS/Python 程式碼實測
```

---

## 18. Runtime Flow

每日 job（一次性 CLI；單一 process 逐 Track）流程：

```
1. bootstrap：src/main.ts 手動建構 config / StateStore / LessonCompiler / Renderer / WebhookClient
2. enabledTracks = 有設定 webhook 的 Track（固定順序：foundation → interviewReady → interviewMastery）
   ── 若為空 ⇒ 直接以設定錯誤失敗（fail loud）
3. StateStore.load()：讀 state.json（state 分支 checkout；per-track 進度）
4. for track of enabledTracks：
   a. Idempotency guard：若該 Track 的 lastPushAt 換算 Asia/Taipei 日期 == 今天 → 跳過該 Track
      （雙 cron 去重；FORCE=true 或 DRY_RUN=true 皆可繞過，供補推 / 測試；見 §21.1）
   b. LessonCompiler.compile(track, state.tracks[track].currentSessionIndex) → Lesson
      （與 CI Gate 同一顆 Compiler；Gate 已保證此步對凍結內容必然成功）
   c. DiscordRenderer.render(Lesson) → embeds（純函式）
   d. DRY_RUN=true → 輸出 render 結果至 log，跳到下一個 Track（不推播、不寫 state）
   e. WebhookClient.post(track, embeds)（推至該 Track 的頻道）
   f. 成功 → 推進該 Track state：currentSessionIndex++、更新 lastPushAt、append history（滾動上限）
   g. 失敗 → 記錄錯誤、對該頻道發紅色告警（若可用），**繼續下一個 Track**（失敗隔離，§9.2）
5. StateStore.save()：一次寫入全部 Track 的進度 → workflow 將 state.json commit 至 state 分支
   （已成功 Track 的進度 MUST 保存，不因其他 Track 失敗而回滾）
6. 任一 Track 失敗 ⇒ 以非零 exit code 結束（Actions 標記失敗）；全部成功 ⇒ exit 0
```

錯誤處理（MUST）：

- 單一 Track 的核心步驟（compile / render / post）失敗：發紅色告警 Embed（若該 webhook 可用）、記錄錯誤、**不中斷其他 Track**、該 Track 的 state 不前進。
- 全域性失敗（無任何 webhook 設定、state 讀寫失敗）：直接以非零 exit code 結束。
- 流程中不存在 LLM 步驟，因此不存在「enhancement 降級」路徑；唯一的外部依賴是 Discord API。

---

## 19. State Management

`state.json`（唯一權威狀態；**每 Track 一份進度**）：

```jsonc
{
  "tracks": {
    "foundation": {
      "currentSessionIndex": 87, // 該 Track 下一個要推的 Session（1-based）
      "lastPushAt": "2026-07-13T22:07:00Z",
      "completedConceptIds": ["array-traversal", "left-right-pointer"],
      "history": [
        // 滾動保留最近 30 筆（MUST 設上限，避免無限成長），供未來 Web/RSS
        {
          "sessionIndex": 86,
          "conceptId": "array-traversal",
          "pushedAt": "2026-07-12T22:07:00Z",
        },
      ],
    },
    "interviewReady": { "currentSessionIndex": 87, "lastPushAt": "...", "completedConceptIds": [], "history": [] },
    "interviewMastery": { "currentSessionIndex": 87, "lastPushAt": "...", "completedConceptIds": [], "history": [] },
  },
}
```

規範（MUST）：

- **存放位置：專用 `state` 分支**。`state.json` 的每日 commit MUST 推至 `state` 分支（orphan branch，初始化一次），MUST NOT commit 至 `main` / `develop`——避免半年 180+ 個 bot commit 淹沒主分支歷史。
- 每日 workflow MUST checkout 兩個 ref：主分支（程式與內容）+ `state` 分支（state.json，checkout 至獨立路徑，見 §21.2）。
- 各 Track 的 `currentSessionIndex` 只在**該 Track 推播成功後**前進（+1），確保漏跑 / 失敗不會跳課；Track 之間互不影響。
- 各 Track 的 `lastPushAt` 各自用於 idempotency guard（Asia/Taipei 日期判斷，§21.1）。
- 狀態變更 MUST 在該 Track 推播成功後才寫入該 Track 的欄位；全部 Track 處理完後一次存檔、單次 commit（避免半套狀態與多次 commit）。
- 各 Track 的 `history` MUST 滾動保留（上限 30 筆）。
- 未在 state 中出現的啟用 Track（例：日後新啟用），StateStore MUST 以初始值（`currentSessionIndex: 1`、`lastPushAt` 為空）自動補建；`lastPushAt` 為空 ⇒ 日期 guard 放行，下一次執行即推播 Session 1（Track 生命週期語意見 §9.2）。
- **調整進度的官方方式**：人工編輯 `state` 分支的 `state.json`（改該 Track 的 `currentSessionIndex`）並 commit。MUST NOT 另設「起始課數」等設定項——state 即唯一權威。
- **載入時的欄位語意驗證（MUST，F1 定案）**：StateStore 載入 `state.json` 後，MUST 驗證各 Track 進度的欄位語意，**任一項不合法即比照「JSON 解析失敗」視為全域性失敗**（發告警 → 非零 exit code → **MUST NOT 覆寫原檔**）：`currentSessionIndex` MUST 為 ≥ 1 的整數；`lastPushAt` MUST 為 `null` 或可解析的日期字串；`completedConceptIds` / `history` MUST 為陣列。
  - **理由**：既然「調整進度的官方方式」就是人工編輯這份檔案，手誤是可預期的常態輸入而非例外。少了這道驗證，字串型的 `currentSessionIndex` 會在推進時被當成字串串接（`"3"` → `"31"`）並靜默寫回，毀掉唯一權威狀態；不可解析的 `lastPushAt` 則會讓日期 guard 的時區換算丟出例外而使整輪執行中止（失敗隔離失效）。
  - 此為**結構性驗證**，非 schema 型別 / 值域驗證（後者屬 F2 的 zod 範圍）。MUST 寬容接受執行環境可解析的日期格式，MUST NOT 僅因非嚴格 ISO 8601 就判定損毀。
  - **狀態存檔本身失敗**（如路徑不可寫）亦 MUST 視為全域性失敗：發告警 + 非零 exit code，MUST NOT 讓例外逸出成為無告警的未捕捉錯誤（§4-15 Fail loud）。
- workflow 對 `state` 分支的 push 衝突 MUST 以 `git pull --rebase --autostash` + 重試處理，**重試上限固定為 3 次**（F1 定案：衝突來源僅有相隔 30 分鐘的雙 cron 極罕見重疊，3 次已足夠）；耗盡即以非零狀態結束該 step，MUST NOT 無限重試，亦 MUST NOT 以 `--force` push 覆蓋他人變更（會毀掉唯一權威狀態）。
- 任一分支的每日 commit 均可維持 repo 活動（避免 scheduled workflow 60 天無活動被停用）。

---

## 20. LLM Strategy

LLM 定位為 **Build-time Author, Never a Runtime Dependency**——在唯一人工檢查點（課綱大綱定稿）之外，整條內容產線由 LLM + 自動 Gate 完成（§4-17）。

### 20.1 允許 / 禁止

```
LLM MAY（僅 build-time 批次生成，全部過 §20.3 Gate 後凍結）
- Stage 1：批次起草課綱（Module / Topic / Concept 清單、frontmatter、DAG 依賴、題目對應）
  與每個 Concept 的 Author Hints（產出 Skeleton 與課綱大綱表）
- Stage 2：依 Skeleton 批次展開 Full Article（含 Digest / TS Tip / Python Tip / Corner / Exit Criteria）
- 為每個「Concept × 題目」組合生成 Hint 與 whyThisPattern 一句話
- 生成 Weekly Reflection 題庫（data/reflection-bank.json）
- 生成鼓勵語錄池初稿（data/encouragement.json；亦可人工撰寫）

LLM MUST NOT
- 在每日 runtime 被呼叫（每日 workflow MUST 不含任何 LLM API key；§4-8）
- 在課綱大綱定稿（凍結）之後，未經人為觸發即變更課綱結構（順序為 deterministic）
- 竄改題號 / 連結 / 難度等事實資料（一律由程式從 Problem Bank 帶入，不得由 LLM 生）
```

### 20.2 為什麼每日零 LLM

- 每日 pipeline 少一個外部依賴與失敗模式（429、額度、模型下線），可失敗面積收斂到 Discord API 一項。
- 內容全部過 Gate 凍結 ⇒ 品質一致、可重現、可 review。
- 「每日限額 / 節流 / 降級」的程式碼全部不需要，工程面更薄。

### 20.3 教材生成 Pipeline 與品質 Gate（build-time、兩階段）

內容產線分兩個 build-time 階段，與每日 runtime 完全分離。**整條產線唯一的人工介入是 Stage 1 的課綱大綱定稿**（§4-17）；其餘一律自動，Gate 擋下時才需要人看。

**Stage 1：課綱與 Skeleton 起草（`scripts/generate-curriculum.ts`）**

1. LLM 依 §8 的 Module 骨架與規範（Topic 5～12 Concept、Module 10～30 Concept、總數 ≥150）批次起草：完整 Concept 清單（frontmatter：id、依賴、對應題號…）與每個 Concept 的 Author Hints。
2. **結構 Gate（自動）**：DAG 驗證（無環、無前向依賴、無孤兒）、顆粒度規則（Topic / Module 的 Concept 數範圍）、frontmatter schema（zod）、`leetcode` 題號存在於 Problem Bank、id 全域唯一。
3. 產出**課綱大綱表**（`curriculum/outline.md`：Module / Topic / Concept 清單、順序、依賴、對應題目一覽）。
4. **唯一人工檢查點**：你審閱大綱表（約 1～2 小時，只看方向：顆粒度、順序、依賴是否合理），核可後 Skeleton 凍結 commit。修改意見以「調整參數 / 提示 → 重跑 Stage 1」處理，不逐篇手改。

**Stage 2：全文展開（`scripts/generate-content.ts`）**

讀凍結的 Skeleton → LLM 依 Author Hints 展開 Full Article（含 Digest / Tips / Hints）→ 通過下列 Gate → 凍結至 `articles/` 與 `data/`：

1. **程式碼實測（最強把關）**：TS Corner / TS Tip 的程式碼 MUST `tsc` 編譯通過且可執行（`tsx`/`vitest`）；Python Corner / Tip MUST 可執行（`python`/`pytest`）。跑不過 ⇒ 這關擋生成。
2. **結構 / schema 檢查**：§10 固定區塊（含 Digest / Tips）都在、frontmatter schema（zod）符合、觀念本體 ≤ 2,000 字（§10.3）。
3. **字元預算檢查**：Digest / Tips / Exit Criteria / Takeaway 各自符合 §14.5 預算。
4. **DAG 驗證**：`prerequisite` / `next` 無環 / 無前向依賴 / 參照完整（§8.3）。
5. **題目正確性**：`leetcode` 題號 MUST 存在於 Problem Bank；`url` slug 與 bank 一致；題號 / 連結 / 難度由程式帶入、不讓 LLM 生。
6. **完整編譯與 render 檢查**：呼叫 Lesson Compiler（§7.1）對所有 Track × 所有 Session 編譯並 render，驗證 Discord 限制（§14.5）全數通過。
7. **LLM 二次 self-check**：生成後再讓模型針對「複雜度是否正確、Pattern 適用性是否成立、是否有前後矛盾」做一次批判；不合格 ⇒ 重生成。
8. **（例外）人工介入**：僅當 Gate 反覆擋下、或 self-check 標記低信心時才需使用者看一眼；正常者直接凍結入庫。

> 風險披露：課綱與解說文字未逐篇人工審核，仍可能有幻覺（尤其複雜度推導、Pattern 適用性、學習順序合理性這類**無法由編譯器擋出的錯誤**）。上列 Gate + 大綱定稿能消除大部分**結構 / 程式碼 / 參照 / 版面**類錯誤與方向性偏差，但不保證教學敘述 100% 正確；純自用場景下屬可接受的風險權衡——上線後邊用邊修（改 Skeleton → 重跑該篇展開）即可。

### 20.4 免費層額度與產線韌性（MUST）

- 使用 **Gemini 免費層**，模型 MUST 為 **`gemini-3.1-flash-lite`**（經實測，目前僅此型號符合免費層資格；
  其餘 Flash 系型號實測不符免費層條件，MUST NOT 使用）。`GEMINI_API_KEY` 只出現在手動觸發的內容產線
  （本機或 `workflow_dispatch`），MUST NOT 出現在 `daily.yml`。
- **額度評估**（以官方當時公告為準；量級如下）：免費層約 10–15 RPM、每日 250–1,500 次請求。
  - Stage 1（課綱 + 156 份 Skeleton 起草）：可多 Concept 併批，約 50–200 次呼叫。
  - Stage 2（150+ 篇全文，每篇展開 + self-check + 重生成緩衝 2–4 次）：約 450–600 次呼叫。
  - 合計 ≈ 600–800 次呼叫 ⇒ **分 2–4 天批次跑完**（一次性成本，凍結後不再發生）。
- `generate-curriculum.ts` 與 `generate-content.ts` MUST 具備：
  - **RPM 節流**（依免費層限制主動限速）。
  - **429 指數退避 + jitter**。
  - **斷點續跑（checkpoint resume）**：已生成且通過 Gate 的 Concept MUST 跳過；中斷後重跑從缺漏處繼續。
  - **冪等**：重跑不會覆蓋已凍結且未變更 Skeleton 的 Article（除非帶 `--force`）。
- 只傳送公開資料（Concept 標題 / Author Hints / 題目 metadata），不涉機密。

---

## 21. Infrastructure & Scheduling

free-tier infra：

- **執行環境**：GitHub Actions 排程 workflow（public repo 無限分鐘 / private 每月 2,000 分鐘；本任務每次數秒～數分鐘，遠低於配額）。
- **狀態**：committed `state.json`（專用 `state` 分支；per-track 進度）。
- **推播**：Discord Channel Webhook ×3（`DISCORD_WEBHOOK_URL_*` 走 Actions Secrets；設定即啟用該 Track，§9.2）。
- **LLM**：Gemini 免費層，**僅 build-time**（`GEMINI_API_KEY` 走 Secrets，只給內容產線 workflow / 本機）。

### 21.1 排程（台北 UTC+8，每日晨報；雙 cron 補跑）

| 台北  | UTC             | cron          | 角色                              |
| ----- | --------------- | ------------- | --------------------------------- |
| 06:07 | 22:07（前一日） | `7 22 * * *`  | 主推                              |
| 06:37 | 22:37（前一日） | `37 22 * * *` | 補跑（主推被 Actions 跳過時遞補） |

- 兩個非整點分鐘（`:07` / `:37`）避開整點壅塞；cron 為 UTC 且可能延遲 / 跳過。
- **Idempotency guard（MUST，日期制、per-track）**：每次執行、對每個啟用 Track，把該 Track 的 `lastPushAt` 換算為 **Asia/Taipei 日期**；若等於今天（Asia/Taipei）⇒ 跳過該 Track 本次推播。此規則天然涵蓋「雙 cron 去重 + 漏跑補推」，且各 Track 獨立判斷（新啟用的 Track 立即開始，不受其他 Track 影響）。
- **`workflow_dispatch` inputs（MUST）**：
  - `dry_run`（boolean，預設 false）：走完 compile + render（全部啟用 Track），輸出結果至 log；**不推播、不寫 state**。供測試版面與流程。
  - `force`（boolean，預設 false）：繞過 idempotency guard 強制推播（仍會寫 state）。供補推 / 除錯，日常勿用。
- **`dry_run` 與 idempotency guard 的關係（MUST）**：`dry_run=true` 時 **MUST 略過 guard**——即使該 Track 今天已推播過，仍照常 compile + render 並輸出至 log。guard 防的是「重複打擾使用者」，而 dry run 不推播亦不寫 state，該風險不存在；若讓 guard 擋下 dry run，會使版面調校工具在當天失效。
- **`dry_run` 與 `force` 同時為 true（MUST）**：以 `dry_run` 為準——不推播、不寫 state，行為與單獨 `dry_run=true` 完全相同。MUST NOT 視為設定衝突而失敗。

### 21.2 Workflow（骨架）

```yaml
name: leetcode-daily-coach
on:
  schedule:
    - cron: "7 22 * * *" # 06:07 台北（主推）
    - cron: "37 22 * * *" # 06:37 台北（補跑；靠日期 guard 去重）
  workflow_dispatch:
    inputs:
      dry_run: { type: boolean, default: false }
      force: { type: boolean, default: false }
permissions:
  contents: write # push state 分支
concurrency:
  group: leetcode-daily-coach
  cancel-in-progress: false
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4 # 主分支：程式與凍結內容
      - uses: actions/checkout@v4 # state 分支：僅 state.json
        with: { ref: state, path: .state }
      - uses: actions/setup-node@v4
        with: { node-version: "24", cache: "npm" }
      - run: npm ci
      - run: npm run build
      - run: node dist/main.js
        env:
          DISCORD_WEBHOOK_URL_FOUNDATION: ${{ secrets.DISCORD_WEBHOOK_URL_FOUNDATION }}
          DISCORD_WEBHOOK_URL_INTERVIEW_READY: ${{ secrets.DISCORD_WEBHOOK_URL_INTERVIEW_READY }}
          DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY: ${{ secrets.DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY }}
          STATE_FILE: .state/state.json
          DRY_RUN: ${{ inputs.dry_run }}
          FORCE: ${{ inputs.force }}
          # 注意：無 GEMINI_API_KEY——每日 runtime 零 LLM（§4-8）
      - name: Commit & push state（state 分支；rebase + 重試）
        # `!cancelled()` MUST 保留：`if:` 運算式若不含任何 status function，GitHub 會隱式補上
        # `success()`，使「單一 Track 失敗 → 推播程式 exit 1」連帶跳過本步驟，已成功 Track 的進度
        # 將無法提交（違反 §4-15 失敗隔離與 §19「部分成功仍存檔」）。
        if: ${{ !cancelled() && inputs.dry_run != true }}
        working-directory: .state
        run: |
          git config user.name  "coach-bot"
          git config user.email "coach@users.noreply.github.com"
          git add state.json
          git diff --cached --quiet && echo "no state change" && exit 0
          git commit -m "chore: advance session state"
          for i in 1 2 3; do
            git pull --rebase --autostash origin state && git push origin HEAD:state && exit 0
            echo "push retry $i…"; sleep $((RANDOM % 5 + 1))
          done
          echo "::error::failed to push state after retries"; exit 1
      - name: Notify Discord on failure
        if: failure()
        run: |
          curl -s -H "Content-Type: application/json" \
            -d '{"embeds":[{"title":"⚠️ LeetCode Daily Coach 執行失敗","description":"workflow 失敗，請查 Actions log。","color":15158332}]}' \
            "${ALERT_WEBHOOK}"
        env:
          # 失敗告警發至第一個已設定的 webhook（Foundation 優先）
          ALERT_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL_FOUNDATION || secrets.DISCORD_WEBHOOK_URL_INTERVIEW_READY || secrets.DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY }}
```

> `state` 分支初始化（一次性）：`git checkout --orphan state && git rm -rf . && echo '{...初始 state...}' > state.json && git add state.json && git commit && git push origin state`。

### 21.3 CI Gate workflow（content-gate.yml）

- 觸發：對 `concepts/** articles/** data/** schedules/** overlays/** curriculum/** src/**` 的 PR / push。
- 內容：`scripts/validate.ts`（DAG 驗證 + 全 Track × 全 Session 完整編譯 + Discord 限制檢查）+ TS/Python 程式碼實測（§20.3 Stage 2-1）+ 單元測試。
- Gate 不通過 MUST 阻擋合併。

---

## 22. Development Guidelines

工程規則（Engineering Rules，MUST）：

- **Never generate curriculum order dynamically.** 課程順序固定、版本控制。
- **Never skip prerequisite concepts.** Session 推進 MUST 尊重 DAG 依賴。
- **All lessons are deterministic.** 同一 sessionIndex + Track → 同一內容，不隨執行變動。
- **Daily runtime is LLM-free.** 每日 workflow MUST 可在無任何 LLM key 下完整運作。
- **Build-time over runtime.** Gate 與 runtime 共用同一顆 Compiler；能在 CI 驗的不留到早上 6 點。
- **Schedules are generated, never hand-written.** 課表由 `generate-schedule.ts` 產出後 commit 定版。
- **One human checkpoint.** 內容產線唯一人工介入是課綱大綱定稿；其餘由自動 Gate 把關。
- **Tracks are isolated at runtime.** 單一 Track 失敗不中斷其他 Track；state 各自推進。
- **Discord rendering is a pure function.** Renderer 不持有跨執行狀態、不含 Curriculum 邏輯。
- **State advances only after successful push.** 且 state 只存在於 `state` 分支。
- **Secrets never in repo.** Webhook / API key 只走 Secrets。
- **Fail loud, not silent.** 核心失敗發紅色告警 + 非零 exit code。

### 22.1 SDD × Spec Kit

```
/speckit.constitution（一次）
→ 每個 Feature：/speckit.specify → /speckit.clarify → /speckit.plan
   → /speckit.checklist → /speckit.tasks → /speckit.analyze → /speckit.implement
```

分支策略：`main` 只收 `develop` 合併；每個 Feature 從 `develop` 切 `NNN-feature-name`。唯一例外是排程 bot 對 `state` 分支的自動 commit。

### 22.2 測試優先（關鍵邏輯）

MUST 有單元測試：

- Curriculum DAG 驗證（拓樸排序成功、無環、無前向依賴、參照完整性）。
- Full Article markdown 解析（固定區塊都在、frontmatter schema）。
- Schedule 生成器 determinism（同輸入 → byte-identical 輸出）與課表合法性（拓樸子序列、reviewRange 正確）。
- Lesson Compiler determinism（同 `(track, sessionIndex)` → 同 Lesson）。
- Idempotency guard（Asia/Taipei 日期判斷、per-track 獨立；含跨日 / UTC 邊界 case）。
- 狀態推進（僅該 Track 推播成功時 +1；漏跑不跳課；history 滾動上限；未知啟用 Track 自動補建初始 state）。
- **多 Track 失敗隔離**（mock 單一 Track webhook 失敗：其餘 Track 照常推播、state 正確保存、job 以非零 exit code 結束）。
- Track Overlay 疊加（不取代 Core Content）。
- Renderer 純函式性（同 Lesson → 同 embeds）與 Discord 限制（含 6,000 總長）檢查。
- 教材品質 Gate（§20.3）：TS/Python 程式碼在 CI 實測、固定區塊都在、字元預算、繁中 / 字數、題號存在性、slug 一致性。

### 22.3 技術釘死（於 /speckit.plan）

- **語言 / 執行**：TypeScript（`tsc` 編譯 → `node dist/main.js`）；composition root 手寫（MUST NOT 用 NestJS / InversifyJS 等 DI 框架）。
- **驗證**：`zod`（frontmatter / JSON schema）。
- **Markdown / frontmatter**：`gray-matter` + `marked`（或等價）。
- **HTTP**：Node 內建 `fetch`（undici）。
- **測試**：`vitest`；Python 程式碼實測用 `python` / `pytest`（僅 CI Gate）。
- **LLM SDK**：`@google/genai`——**只允許出現在 `scripts/` 的依賴路徑**，`src/` MUST NOT import。
  模型 MUST 為 `gemini-3.1-flash-lite`（見 §20.4，經實測為唯一符合免費層資格的型號）。
- **執行環境**：GitHub Actions（Node 24）；狀態 `state` 分支的 `state.json`。

### 22.4 專案規模評估

- **定位**：台北、單人、零維運的自用專案。**軟體工程複雜度低，內容工程以機器時間為主**——150+ Concept 的產出瓶頸已由「人工撰寫 30～50 小時」轉為「LLM 批次 2～4 天 + 一次 1～2 小時的大綱定稿」（§20.3 / §20.4）。
- **兩條並行主軸**：
  - **內容工程（教材）**：課綱半自動起草（Stage 1）→ 大綱定稿 → 全量展開（Stage 2）→ 三份課表生成。人工介入收斂到單一檢查點；其餘為機器批次與 Gate 迭代。
  - **軟體工程（引擎）**：一次性 CLI、Compiler、DAG 驗證、Renderer、Webhook（多 Track 路由）、Actions。程式面**相對較薄且穩定**（每日零 LLM 後更薄），MVP 可快速完成、之後幾乎不動。
- **工程風險集中點（少數）**：markdown 固定區塊解析穩定性（由「Gate 與 runtime 共用 Compiler」原則消解）、DAG 驗證、per-track idempotency guard、多 Track 狀態一致性與失敗隔離——已全數列為 §22.2 測試優先項。
- **內容風險集中點**：LLM 起草課綱的顆粒度與順序合理性（由大綱定稿把關）、繁中與字數規範、字元預算、課表生成參數的難度分佈正確性、教學敘述的殘餘幻覺（上線後邊用邊修）。

### 22.5 Feature 切分與里程碑（SDD）

流程沿用 §22.1；**Constitution 在專案建立一次**，之後**每個 Feature 各自走完一輪**。原則：**先垂直切片打穿全鏈路，再回頭補 schema 與產線**。

| #   | Feature 分支             | 內容                                                                       | 對應章節                  | 依賴       | 里程碑 |
| --- | ------------------------ | -------------------------------------------------------------------------- | ------------------------- | ---------- | ------ |
| F1  | `001-walking-skeleton`   | 垂直切片：1 篇手寫 Article + 硬編 3-Session 課表 + 最小 Renderer + Webhook + 雙 cron + state 分支 + 日期 guard + dry_run | §7、§14、§18、§19、§21   | —          | M0     |
| F2  | `002-curriculum-schema`  | Curriculum 骨架、Concept frontmatter schema、DAG 建置與驗證（顆粒度規則機器可驗） | §8、§10.1、§16.1、§26     | F1         | M1     |
| F3  | `003-problem-bank`       | 題庫 schema／資料（三 Track 難度帶）、Concept ↔ Problem 逆向對應、slug 一致性驗證 | §12、§16                  | F2         | M1     |
| F4  | `004-schedule-generator` | `generate-schedule.ts`、三組 Track 參數、Overlay schema；以 stub DAG 開發測試 | §9、§13、§16.2、§16.3     | F2、F3     | M2     |
| F5  | `005-lesson-compiler`    | Lesson Compiler（解析 / 組裝）、Renderer 全 Session 類型、CI Gate 完整編譯 + Discord 限制檢查 | §7.1、§10、§14、§16.4、§21.3 | F2、F4  | M2     |
| F6  | `006-pipeline-mvp`       | 每日 pipeline 端到端（多 Track 逐一處理、失敗隔離）、per-track guard 與狀態推進、state 分支 commit | §9.2、§18、§19、§21       | F1、F5     | M3     |
| F7  | `007-content-generation` | 兩階段產線：Stage 1 課綱 + Skeleton 起草（`generate-curriculum.ts`）＋大綱定稿；Stage 2 全量展開（全部 Module、含 Digest/Tips/Hints）＋品質 Gate＋節流/斷點續跑；跑 `generate-schedule.ts` 產出三份正式課表 | §8、§10、§11、§20.3、§20.4、§13.4 | F2、F3、F4 | M3     |
| F8  | `008-review-extras`      | Weekly Reflection 題庫（build-time 生成）、鼓勵語錄池、review/rest 版面完善 | §15、§20                  | F6、F7     | M4     |
| F9  | `009-pages-publish`      | GitHub Pages 儀表板 + 全文閱讀頁 + RSS/Atom（post-MVP）                    | §25                       | F6         | M5     |
| F10 | `010-interactive`        | Discord Slash Commands、每週測驗、自適應推薦（Roadmap）                    | §25                       | F6、F8     | M5     |

**F1 `001-walking-skeleton` — 垂直切片（第一週就打穿全鏈路）**

- 範圍：composition root CLI（`main.ts`）、config、StateStore（state 分支模式；per-track schema 從第一天就用）、最小 Renderer（concept 版面）、DiscordWebhookClient（POST + 紅色告警）、Actions workflow（雙 cron、`workflow_dispatch` 含 dry_run/force、concurrency、state 分支 commit + rebase 重試、`if: failure()` 告警）、**1 篇手寫 Full Article + 硬編 3-Session 課表**（單一 Track、單一 webhook 即可）。
- 不含：正式 schema、DAG、產線、LLM、多 Track 迴圈（迴圈骨架可先留單元素）。
- 目的：第一週即在真實 Discord 驗證 **6,000 字元限制、版面觀感、日期 guard、state 分支流程**——這些都是紙上設計驗不了的。
- 驗收（= M0）：`workflow_dispatch` 觸發後手機收到一堂「真的課」的 embeds；`dry_run` 不寫 state；state.json 成功 commit 至 `state` 分支。

**F2 `002-curriculum-schema` — Curriculum 骨架與 DAG 驗證**

- 範圍：`curriculum/modules.json`（Module / Topic 順序定稿）、Concept frontmatter schema（zod）、curriculum 載入 + in-memory DAG、驗證（拓樸排序、無環、無前向依賴、參照完整性、**顆粒度規則**——供 Stage 1 結構 Gate 重用），以 Level 0 + Level 1 少量 Concept stub 驗證。
- **本 Feature 待定（clarify 定案）**：Module / Topic 命名、Concept 顆粒度的機器可驗規則、`difficulty` 判定基準（實際 Concept 清單由 F7 Stage 1 產出、大綱定稿決定）。
- 驗收（= M1 部分）：DAG 驗證通過（對應 AC1）。

**F3 `003-problem-bank` — 題庫與逆向對應**

- 範圍：`data/problem-bank.json` schema（§12.1）／涵蓋三 Track 難度帶（Easy / Medium / Hard）的題目、problem 載入模組、`patterns` 對應 Topic / Concept 的逆向查找與驗證、`url` slug 一致性檢查。
- 驗收（= M1 部分）：由 Concept 可查得對應題目、由題目可反查 Pattern；參照與 slug 檢查通過。

**F4 `004-schedule-generator` — 課表生成器與 Overlay**

- 範圍：`generate-schedule.ts`（DAG + 週節奏模板 + Track 參數 → `schedules/{track}.json` × 3；determinism MUST）、`TrackSchedule` / `TrackOverlay` schema、三組 Track 參數定義、生成器內建課表驗證（拓樸子序列、reviewRange、參照）。**以 stub / 種子 DAG 開發與測試**；正式三份課表於 F7 Stage 1 課綱凍結後生成。
- **本 Feature 待定（clarify 定案）**：各 Track 參數（節奏微調、涵蓋子集規則、難度帶映射）、`targetLevel` 對應的題目難度分佈。
- 驗收（= M2 部分）：同輸入 → byte-identical 課表；課表全數通過 DAG 子序列驗證。

**F5 `005-lesson-compiler` — Compiler、Renderer 與 CI Gate**

- 範圍：Lesson Compiler 單一模組（content 解析 §10 固定區塊 → 組 `Lesson`）、DiscordRenderer（全 Session 類型版面、依 Module 配色、字元預算與拆訊息 fallback）、`scripts/validate.ts` + `content-gate.yml`（全 Track × 全 Session 完整編譯 + render 限制檢查）。
- 驗收（= M2 部分）：給定同一 `(track, sessionIndex)` → 產出相同 Lesson 與 embeds（對應 AC7）；Gate 對全部 Session 編譯通過（對應 AC8）。

**F6 `006-pipeline-mvp` — 每日 pipeline 端到端（MVP 完成點）**

- 範圍：§18 全流程串接（**多 Track 逐一處理 + 失敗隔離**）、per-track Asia/Taipei 日期 guard、狀態推進（僅該 Track 成功後 +1）、單次 state 分支 commit、webhook-secret 即開關、接上 F1 的 Actions 雙 cron。
- 驗收（= M3）：三個頻道各收到各自 Track 的課程 embeds（AC2）；同日第二次觸發被 guard 跳過（AC3）；各 Track state 獨立 +1 並單次 commit 至 state 分支（AC4）；三份課表共用教材、難度分歧（AC5）；全程無 LLM key（AC6）；單一 Track 失敗不影響其他（AC10）。此時即達 MVP（每日自動推課）。

**F7 `007-content-generation` — 兩階段內容產線（全量）**

- 範圍：
  - **Stage 1**：`generate-curriculum.ts`——LLM 批次起草完整課綱（150+ Concept 的 frontmatter + Author Hints）→ 結構 Gate → 產出 `curriculum/outline.md` → **你一次性定稿（唯一人工檢查點）** → Skeleton 凍結。
  - **Stage 2**：`generate-content.ts`——全量展開 Full Article（**繁體中文、詳盡、觀念本體 ≤2,000 字、含 Digest / TS·Python Tip / Corner / Exit Criteria / 每題 Hint**）；§20.3 全部 Gate；§20.4 節流 + 斷點續跑 + 冪等。
  - 課綱凍結後執行 `generate-schedule.ts` 產出三份正式課表並 commit。
- 定位：內容工程主軸，**可與 F5/F6 並行**（機器批次 2～4 天）。
- **本 Feature 待定（clarify 定案）**：Stage 1 / Stage 2 的 prompt 模板與 self-check 準則、Gate 通過門檻（程式碼執行範圍、字數 / 繁中嚴格度）、批次大小與排程。
- 驗收（= M3 並行）：三軌全部 Session 內容齊備，Gate（含 TS/Python 程式碼在 CI 實測、字元預算、全編譯）全數通過。

**F8 `008-review-extras` — Weekly Review 素材與語錄池**

- 範圍：`data/reflection-bank.json`（build-time LLM 生成 + Gate + 凍結）、`data/encouragement.json` 語錄池（決定性輪替規則）、review / rest Session 版面完善、Challenge deterministic 選題。
- 驗收（= M4）：review Session 三段齊備且全部素材為凍結內容；每日 runtime 仍零 LLM。

**F9 `009-pages-publish` — GitHub Pages 儀表板 + 全文 + RSS/Atom（post-MVP）**

- 範圍：repo 可見性偵測（private 自動停用）、由 state 預渲染 `index.html`（Curriculum Graph / 各 Track 進度 / 今日課程）與**全文閱讀頁**（Digest 之外的完整 Article，補足 Discord 不推全文的閱讀需求）、`feed.xml`（穩定 GUID、滾動修剪）、`upload-pages-artifact` + `deploy-pages`；一律為**完全隔離的末段**（失敗 / 停用不影響 Discord 推播與 state）。
- 驗收（= M5）：公開 URL 可瀏覽進度、今日課程與全文；RSS reader 訂閱不重複。

**F10 `010-interactive` — 互動化（Roadmap）**

- 範圍：Discord Slash Commands（`/review`、`/hint`、`/next`）、每週測驗、依答題表現微調 Practice / Challenge 選題（**仍不動 Curriculum 順序**）。
- 定位：最遠期、可選；需要由 Webhook-only 升級為具備互動能力的 bot。

**里程碑對照**

| 里程碑 | 內容                                       | 完成即可驗證                                              | 對應 Feature |
| ------ | ------------------------------------------ | --------------------------------------------------------- | ------------ |
| M0     | 垂直切片：真課 embeds 打穿全鏈路           | 手機收到真實課程 embed、state 分支 commit、dry_run 可用   | F1           |
| M1     | Curriculum schema + DAG 驗證 + 題庫        | DAG 驗證資本通過、Concept ↔ Problem 可逆向查找           | F2、F3       |
| M2     | 課表生成器 + Compiler + Renderer + CI Gate | 課表 determinism、全 Session 編譯 + 限制檢查通過          | F4、F5       |
| M3     | Pipeline 端到端 + 三軌全量內容（**MVP**）  | 三頻道每日自動推課、同日去重、零 LLM runtime、失敗隔離    | F6、F7       |
| M4     | Review 素材 + 語錄池                       | review 三段齊備、素材全凍結                               | F8           |
| M5     | Pages 儀表板 / 互動化（可選）              | 公開 URL 可瀏覽；Slash Command 可用                       | F9、F10      |

> **對照 §23 Phase**：Phase 0 → F1；Phase 1 → F2/F3/F4/F7；Phase 2（MVP 完成）→ F5/F6；Phase 3 → F8；Phase 4 → F9/F10。只要 **M0 → M3** 走完，就是一個零維運、全免費、三個頻道每日自動推播「觀念 + 對應 LeetCode 題」的課程引擎。

---

## 23. MVP Scope

分階段（MVP = Phase 0 + Phase 1 + Phase 2）：

### Phase 0：垂直切片（第一週）

- F1 Walking Skeleton：1 篇手寫 Article + 硬編課表 + Renderer + Webhook + Actions（雙 cron、日期 guard、dry_run、state 分支）。
- 在真實 Discord 上驗證 6,000 字元限制與版面，再回頭定 schema。

### Phase 1：建立教材與資料（最重要；半自動、全量）

- 定稿 Curriculum 骨架（Module / Topic 順序、顆粒度規則）與各 schema。
- **Stage 1**：LLM 批次起草完整課綱（150+ Concept 的 Skeleton）→ 結構 Gate → **課綱大綱表一次性定稿（唯一人工檢查點，約 1～2 小時）** → 凍結。
- **Stage 2**：LLM 全量展開 Full Article（繁中、含固定區塊、Digest / Tips、Exit Criteria、每題 Hint）→ §20.3 品質 Gate → 凍結（機器批次 2～4 天，含節流與斷點續跑）。
- 建立 `problem-bank.json`（涵蓋三 Track 難度帶的全部對應題目）。
- 以 `generate-schedule.ts` 產出**三份完整 180-Session 課表**並 commit。

### Phase 2：建立推播引擎（MVP 完成點）

- Lesson Compiler、Renderer、StateStore、CI Gate（完整編譯 + 限制檢查）。
- 每日 pipeline 端到端：多 Track 逐一處理、失敗隔離、per-track Asia/Taipei 日期 guard、單次 state 分支 commit。
- **驗收**：三個頻道每日自動推課（各自 Track 的內容與難度）；同日重複觸發被跳過；state 正確推進；全程零 LLM runtime。

### Phase 3：Review 素材與語錄池（非必要）

- Weekly Reflection 題庫（build-time 生成凍結）、鼓勵語錄池、review / rest 版面完善。

### Phase 4：發佈與互動化（Roadmap）

- GitHub Pages（進度儀表板 + 全文閱讀 + RSS）。
- Discord Slash Commands（`/review`、`/hint`、`/next`）、每週測驗、依表現調整推薦。

---

## 24. Acceptance Criteria

MVP 驗收（MUST 全部通過）：

- **AC1**：DAG 驗證資本通過（無環、無前向依賴、所有 `prerequisite`/`next`/`leetcode` 參照存在）。
- **AC2**：`workflow_dispatch` 觸發後，**每個已設定 webhook 的 Track 各自的頻道**收到該 Track Session 1 的 concept embeds：Digest 主 Embed、TS/Python Tip、1～3 題（可點連結 + why + Hint）、prev/current/next 路徑、Exit Criteria、Takeaway。
- **AC3**：同一天（Asia/Taipei）內第二次觸發，各 Track 因日期 guard 而跳過（不重複推、不跳課）；`force: true` 可繞過。
- **AC4**：推播成功後各該 Track 的 `currentSessionIndex` +1，全部 Track 以**單次 commit** 寫入 **`state` 分支**；推播失敗的 Track 其 index 不變、發紅色告警；`main` / `develop` 無任何 bot state commit。
- **AC5**：三個 Track 的完整課表全量交付——**Concept 教材正文共用同一份**，但涵蓋 / 題目難度 / Challenge 難度依 Track 不同（模型 B）；每份課表皆通過 DAG 拓樸子序列驗證。
- **AC6**：每日 workflow 在**完全沒有 LLM API key** 的環境下端到端成功執行（零 LLM runtime）。
- **AC7**：Renderer 為純函式——對同一 Lesson 產出相同 embeds。
- **AC8**：CI Gate 對「全部三個 Track × 各課表全部 Session」完整編譯並 render，全數通過 Discord 限制檢查（含單則 ≤ 6,000 總長 / 預算 ≤ 5,500）。
- **AC9**：`generate-schedule.ts` 對同一輸入產出 byte-identical 課表；`dry_run: true` 執行不推播、不寫 state。
- **AC10**：**多 Track 失敗隔離**——mock 其中一個 Track 的 webhook 失敗時，其餘 Track 照常推播且 state 正確推進保存，job 最終以非零 exit code 結束並發告警。
- **AC11**：內容產線驗收——Stage 1 產出通過結構 Gate 的完整課綱與 `curriculum/outline.md`；大綱定稿後 Stage 2 全量展開並通過 §20.3 全部 Gate；中斷後重跑可從缺漏處續跑（checkpoint resume）。

---

## 25. Future Roadmap

- **Multi-delivery**：新增 Telegram / Email / Web Renderer，重用同一 Lesson 契約。
- **GitHub Pages 儀表板 + 全文閱讀**（限 public repo）：呈現 Curriculum Graph、各 Track 進度、今日課程與 Full Article 全文；RSS/Atom 可訂閱（Digest 推播 + Pages 全文互補）。
- **Learning Graph 視覺化**：把 DAG 畫成互動式知識圖譜。
- **AI Tutor**：Slash Command 回答「為什麼這題適合此 Pattern」、自動生成變體題（此時才重新引入 runtime LLM，且仍隔離於核心推播之外）。
- **自適應**：依使用者答題表現微調 Practice / Challenge 選題（仍不動 Curriculum 順序）。
- **多使用者**：由「單人多 Track」擴為多使用者 / 每使用者多頻道訂閱。

---

## 26. Appendix：Conventions

### 26.1 Naming Convention

- Concept `id`：kebab-case slug，全域唯一、穩定不變（例：`left-right-pointer`）。
- Concept 檔名：`concepts/{topic}/{NNN}-{slug}.md`（NNN 為 Topic 內局部序號，僅排序用，非識別）。
- Full Article 檔名：`articles/{topic}/{NNN}-{slug}.md`（與 Skeleton 對應）。
- Module / Topic id：kebab-case（例：`two-pointer`）。
- Problem key：LeetCode 題號字串（例：`"26"`）。
- Webhook Secret：`DISCORD_WEBHOOK_URL_{TRACK_SNAKE_UPPER}`（例：`DISCORD_WEBHOOK_URL_INTERVIEW_READY`）。
- 分支：`main` / `develop` / `NNN-feature-name` / `state`（僅 bot state commit）。

### 26.2 Metadata Convention

- 所有 Concept metadata MUST 走 §10.1 的 YAML frontmatter schema（zod 驗證）。
- 所有 Problem metadata MUST 走 §12.1 的 JSON schema。
- `patterns`（Problem）MUST 對應到某條 Topic / Concept id，供逆向查找。
- 課表 / Overlay MUST 走 §16.2 / §16.3 的 schema。

### 26.3 Engineering Rules（摘要；完整見 §22）

```
- Renderer MUST NOT know Curriculum.
- Curriculum MUST be a deterministic DAG.
- One new Concept per concept-Session.
- Content is pipeline-generated behind gates, with exactly one human checkpoint (the outline).
- Daily runtime is LLM-free; LLM assists only at build-time, behind the Gate.
- Gate and runtime share one Lesson Compiler; what CI validated cannot fail at 6 a.m.
- Schedules are generated deterministically, never hand-written.
- Tracks share knowledge but deliver independently; one track's failure never blocks another.
- State advances only after successful push, per track, and lives on the `state` branch.
- Secrets never in repo or published artifacts.
- Fail loud on core errors; isolate optional stages (e.g. Pages) completely.
```

### 26.4 定位開場（README 首頁建議）

> This project is designed to teach algorithmic thinking, not to maximize the number of solved LeetCode problems.
> 本專案的目標不是讓使用者刷更多題，而是建立能夠持續解題的思維模式。

---

_End of spec.md_
