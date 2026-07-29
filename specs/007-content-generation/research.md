# Phase 0 Research: 007-content-generation

決策格式：**Decision / Rationale / Alternatives considered**。本檔解消 Technical Context 的未知並落地
spec Clarifications（Q1–Q4）。所有「plan 待定項」在此定案，交 `/speckit-tasks` 與實作。

---

## R1 — LLM 供應與呼叫層（`scripts/lib/llm-client.ts`）

**Decision**: 以 `@google/genai`（devDependency）封裝單一 `LlmClient`，模型硬編 `gemini-3.1-flash-lite`
（憲章 v1.0.1 釘死），只讀 `process.env.GEMINI_API_KEY`；缺金鑰在客戶端建構時即 throw（fail-fast，FR-025）。
Client 只在 `scripts/lib/` 出現，`src/` 一律不 import。所有呼叫走此單一出口，方便統一套用節流/退避（R3）與
「只送公開資料」的約束（FR-021）。

**Rationale**: 集中出口 → 節流/退避/遮蔽/測試替身都只需一處；模型釘死避免誤用付費型號；建構期 fail-fast 讓
「忘了設金鑰」在第一次呼叫前就爆，不會產出半套空內容。

**Alternatives considered**: 直接在各 script 內散呼叫 SDK（否決：無法集中節流、難 mock、易讓 SDK 洩漏到多處）；
REST `fetch` 直打 Gemini（否決：放棄 SDK 的重試/串流處理，且與 §22.3 釘死的 `@google/genai` 不符）。

---

## R2 — 產線執行載體：本機優先 + 可選手動 workflow

**Decision**: 主要執行方式為**本機** `npm run generate:curriculum` / `generate:content`（開發者已有 Node 24 +
Python）。另提供**可選** `.github/workflows/content.yml`（`workflow_dispatch` only，帶 `GEMINI_API_KEY` Secret），
供無本機環境時批次跑。兩者 MUST NOT 進 `daily.yml`。

**Rationale**: §20.4 明言金鑰只在「本機或 `workflow_dispatch`」；本機跑省 Actions 分鐘、除錯直覺。手動 workflow
為便利選項而非必需，故標為可選，不阻塞 MVP。

**Alternatives considered**: 排程 workflow 自動跑產線（否決：違反 XVII 一次性人工定稿的節奏、且憲章 VIII 精神是
LLM 不進常態排程）；只允許本機（否決：喪失「換機器也能續跑」的彈性）。

---

## R3 — RPM 節流 + 429 指數退避 + jitter（`scripts/lib/throttle.ts`）

**Decision**: 純邏輯排程器：以「最小呼叫間隔 = 60,000ms / RPM_LIMIT」串行化呼叫（預設 `RPM_LIMIT` 保守取
**10**，可經環境變數覆寫）；對 429/5xx 以指數退避 `base * 2^n`（base 1s，上限如 60s）+ 全抖動 jitter，最多
`MAX_RETRY`（預設 6）次；非 429 的 4xx 直接失敗。時鐘與 sleep 以注入參數表示，便於 `vitest` 假時鐘單測。

**Rationale**: 免費層約 10–15 RPM；取 10 留餘裕。全抖動避免多請求同步重試。把時鐘抽成參數是本專案既有測試
風格（per-track guard 也如此），讓退避邏輯**不需真等待**即可測。

**Alternatives considered**: 固定 sleep 無退避（否決：429 下會持續撞牆）；令牌桶併發（否決：串行已足夠且更易
推理，避免多請求同時觸發限流）。

---

## R4 — 斷點續跑與冪等（`scripts/lib/checkpoint.ts`）

**Decision**: 冪等以**產物存在性 + Skeleton 內容雜湊**推導，不依賴易失的外部狀態：
- Stage 1：某 Concept 的 Skeleton 已存在且其結構 Gate 通過 ⇒ 跳過起草（除非 `--force`）。
- Stage 2：`articles/{topic}/{NNN}-{slug}.md` 已存在，且其對應 Skeleton 的雜湊與上次生成時記錄一致 ⇒ 跳過展開
  （除非 `--force`）。Skeleton 變更（雜湊不符）⇒ **只重生該篇**。
- Manifest（`.cache/content-manifest.json`，gitignored）記錄 `{ conceptId, skeletonHash, articleFrozen, gatePassed }`，
  作為中斷後「從缺漏處續跑」的索引；manifest 遺失時可由掃描現有產物 + 重算雜湊重建（manifest 為加速快取，非真實來源）。

**Rationale**: 「產物 + 雜湊」讓續跑對 manifest 損毀免疫（真實來源是 repo 內凍結物本身），符合 XIII「凍結物為
定版」；`--force` 是唯一覆蓋路徑（§20.4）。只重生變更篇 = 最小重工。

**Alternatives considered**: 純 manifest 決定跳過（否決：manifest 損毀即誤判、且與「凍結物為真實來源」相悖）；
以檔案 mtime 判斷（否決：git checkout 會重置 mtime，不可靠）。

---

## R5 — 題庫擴充機制（Q1 落地；`scripts/populate-problem-bank.ts`）

**Decision**: Stage 1 的 LLM 於每個 Concept 的 frontmatter `leetcode` **只填候選題號**（整數陣列，1–3 個）。
`populate-problem-bank.ts` 蒐集全部候選題號 → 對 `data/problem-bank.json` 中**尚無**的題號，逐一從**權威 metadata
來源**取得 `slug / title / url / difficulty`（**只取 metadata、不取題目描述**，§5）→ 併入 bank → commit 凍結。
**metadata 來源採「靜態快照優先、線上驗證補齊」**：
- 主來源＝committed 的 LeetCode 題目 metadata 快照（`data/leetcode-index.json`，題號→slug/title/difficulty），
  由一支一次性維護指令從公開來源整理；**產線只讀快照** → 可重現、無網路相依、CI 可離線跑。
- 快照缺某題號時，`populate` 以 Node `fetch` 打 LeetCode 公開 GraphQL metadata 端點補齊該題（只取
  title/titleSlug/difficulty），寫回快照後再併入 bank；查無 = 該題號無效 ⇒ 回報以驅動 Stage 1 重生。

**Rationale**: 快照優先滿足「build-time 可重現、CI 離線」；線上補齊避免手工維護全表。題目**選擇**（策展）是
合法的 LLM 任務，**事實**（號/連結/難度/slug）一律由程式帶入（憲章 XIV / §5）。Stage 1 結構 Gate 的「題號存在
於 bank」即此機制的守門。

**Alternatives considered**: 純線上抓取無快照（否決：CI/重跑需網路、易受端點變動影響、不可重現）；純人工策展
（Q1 選項 B，否決：≈300–500 題手工 = 第二個人工關卡，違反 XVII）；讓 LLM 直接輸出 metadata（否決：違反 §5/
XIV，事實可能幻覺）。**`whyThisPattern` / Hint 文字**仍由 Stage 2 LLM 生成（那是教學說明、非題目事實）。

> **待 tasks 期定案的次要細節**：`leetcode-index.json` 快照的初始題目集合來源與整理指令（一次性）。屬資料維運，
> 不影響契約形狀。

---

## R6 — 程式碼實測：編譯 + 內嵌斷言（Q2 落地；`scripts/run-code-blocks.ts`）

**Decision**: 每個 `TypeScript Corner/Tip`、`Python Corner/Tip` 的 fenced code block **MUST 自帶最小斷言**
（TS：以 `if (!cond) throw new Error(...)` 或 `node:assert`；Python：`assert`）。`run-code-blocks.ts` 從 Article
抽出各語言區塊 → 寫入暫存目錄 → TS 以 `tsc --noEmit --strict` 型別檢查 + `tsx` 執行斷言、Python 以 `python`
執行（斷言失敗即非零）→ 全數通過才算過關。**判準**：編譯/型別失敗、斷言失敗、或**缺斷言**（區塊未出現任何
assert/throw）皆為不通過。暫存資源建於系統暫存區、用後清理（不寫 repo）。

**Rationale**: §20.3 稱程式碼實測為「最強把關」；只編譯或只 no-throw 抓不到邏輯錯誤。要求內嵌斷言讓「片段正確」
可機器判定；LLM 於展開時一併生成斷言（Stage 2 prompt 要求）。抽為單一 script 供本機 Stage 2 與 CI `content-gate.yml`
共用，避免雙軌（IX）。

**Alternatives considered**: 只 `tsc` 編譯 / 只 no-throw（Q2 選項 B/C，否決：漏邏輯錯）；為每篇另寫外部測試檔
（否決：與教材脫節、維護雙份、且 Corner/Tip 本就該自成可驗片段）。`pytest` vs 直接 `python assert`：採 `python`
直跑（斷言即測試，免每片段建 `test_` 包裝），CI 若已裝 `pytest` 亦可；契約以「Python 執行且斷言成立」表述，
不綁定框架細節。

---

## R7 — 繁中機器判準（Q4 落地；`src/compiler/traditional-chinese.ts`）

**Decision**: 純函式 `checkTraditionalChinese(markdown)`：
1. **移除**程式碼區塊（``` fenced）與行內 `code`、frontmatter，得「散文文本」。
2. **簡體偵測**：比對簡體專用字集合（bundled 簡體字表），出現任一即違規並回報字元與位置。
3. **CJK 佔比**：散文中 CJK 字元數 /（CJK + 拉丁字母詞數）達門檻（預設 **0.5**，可調）——低於門檻代表英文過多/
   疑似未譯段落。英文技術術語計入分母但不因此失敗（門檻寬鬆設計）。
違規 ⇒ Gate 擋下、重生。此函式加入 `runContentGate` 路徑，CI 與生成期共用。

**Rationale**: 「無簡體 + CJK 佔比」是客觀、低成本、可單測的近似；避免主觀「像不像繁中」。門檻 0.5 為初值，
tasks/實測期可微調（Clarifications 已註明門檻數值待定）。

**Alternatives considered**: 交 LLM self-check 主觀判（Q4 選項 B，否決：不可稽核、耗額度）；術語白名單比對
（選項 C，否決：白名單維護沉重且易誤殺）。OpenCC 之類轉換庫做繁簡判定（否決：新增相依、殺雞用牛刀，簡體字表
足矣）。

---

## R8 — 重生上限與例外升級（Q3 落地）

**Decision**: Stage 2 對單篇：Gate 任一關不通過或 self-check 低信心 ⇒ 重新生成，**每篇上限 3 次**。第 3 次仍不過
⇒ 於 manifest 標記 `needsHumanReview`、輸出可辨識日誌（列出未過的 Gate 關與原因）、**繼續處理其餘 Concept**，
最終以非零 exit 結束（fail loud）。MUST NOT 靜默凍結不合格產物、MUST NOT 因單篇卡住整批。

**Rationale**: §20.4「重生緩衝 2–4 次」取中值 3，平衡品質與免費層額度；升級人工是**例外**而非常態關卡（XVII）；
單篇隔離符合 XV 失敗隔離精神（比照 F6 多 Track 隔離）。

**Alternatives considered**: 無上限重生（否決：卡死 + 燒額度）；一次不過即停整批（否決：一篇幻覺拖垮全量）。

---

## R9 — Stage 1 結構 Gate：重用 F2，不新建

**Decision**: Stage 1 起草 + 題庫擴充後，呼叫 F2 既有 `src/compiler/curriculum.ts`（`validateCurriculum`）與
`schema.ts`（frontmatter zod）跑結構 Gate：DAG（無環/無前向/無孤兒/雙向一致/參照完整）、顆粒度（Topic 5–12 /
Module 10–30）、id 唯一、`leetcode` 存在於 bank。違規 ⇒ 印具名違規、非零 exit、不進定稿。

**Rationale**: §8.3 明定「驗證單一實作為 F2 `curriculum.ts`，F7 Stage 1 重用之」；避免雙軌（IX）。顆粒度上下限
若 F2 尚以 stub 豁免，本 Feature 於全量時 MUST 生效（spec §8 顆粒度為正式規則）。

**Alternatives considered**: 在 script 內另寫一套結構檢查（否決：雙軌、與 CI Gate 不一致）。

---

## R10 — Stage 2 品質 Gate 組成與單一 Compiler

**Decision**: `generate-content.ts` 對每篇依序跑：
1. **結構/schema**（`src/compiler/content.ts` 區塊完整性 + frontmatter zod + 觀念本體 ≤2,000 字）。
2. **繁中判準**（R7）。
3. **程式碼實測**（R6，`run-code-blocks.ts`）。
4. **題目正確性**（題號存在於 bank、`url` slug 一致——重用 `src/compiler/problem.ts`）。
5. **DAG**（沿用 R9 的 `curriculum.ts`，Stage 2 起點即凍結 Skeleton，已保證；此處為 defence-in-depth）。
6. **完整編譯 + render + 字元預算**：全篇凍結後，對**全 Track × 全 Session** 呼叫 `runContentGate`（重用每日
   runtime 同一顆 `compile`/`render`/`checkBudget`）——此為批次末的整體 Gate。
7. **LLM self-check**（生成期專屬，不進 CI）。
**CI `content-gate.yml`** ＝ 既有 `validate.ts`（涵蓋 1/2/4/5/6 的純檢查）＋ 新增 `run-code-blocks.ts`（3）；
self-check（7）不進 CI。

**Rationale**: 逐篇快檢（1–4）快速失敗省額度；批次末整體 Gate（6）確保跨 Session 預算與交叉一致；self-check
只在有金鑰的生成期。CI 只跑可離線、確定性的關卡（無 LLM）。

**Alternatives considered**: 只在批次末一次總檢（否決：晚失敗浪費額度）；把 self-check 放進 CI（否決：CI 需金鑰、
非確定性、違反 CI 應離線可重現）。

---

## R11 — 課表生成與三軌涵蓋深度（US3）

**Decision**: 課綱凍結後執行既有 `scripts/generate-schedule.ts`（**不改生成邏輯**）。為使三份課表達 ~180 Session、
覆蓋全量 DAG，**更新 `curriculum/track-params.json`** 的涵蓋深度：三軌 `maxLevel` 由種子的 `1` 提高至涵蓋全部
16 Module（`15`）；三軌**共用同一 DAG 與 Concept 序列**（涵蓋深度相同），分歧維持在既有的 `problemDifficulties`
/ `challengeDifficulty`（＋ Overlay ＋ 頻道）。若 Session 數不足 180，由生成器既有的節奏/複習/rest 模板補足（F4
機制，不新增）。

**Rationale**: 憲章 VI 允許 Track 以「涵蓋深度」分歧，但本專案三軌目標皆為走完核心課綱（§8.4 表：三軌都覆蓋
全核心，差在題目難度帶），故涵蓋深度一致、難度帶不同即可滿足 VI 且最簡。`generate-schedule.ts` determinism 與
拓樸子序列驗證由 F4 保證，本 Feature 只改參數值、跑生成器、review diff、commit（XIII 流程）。

**Alternatives considered**: 三軌走不同 Concept 子集（否決：與 §8.4「三軌都覆蓋核心課綱」矛盾、且複雜化 Overlay）；
手改 `schedules/**` 湊長度（否決：違反 XIII，MUST NOT 手改生成物）。

> **待 tasks 期確認**：全量 DAG 下三軌實際 Session 數是否自然落在 ~180；若顯著偏離，於 tasks 期以 track-params
> 節奏參數微調（仍走生成器，不手改產物）。

---

## R12 — outline.md 定稿與凍結流程（XVII）

**Decision**: Stage 1 產 `curriculum/outline.md`（Module/Topic/Concept 清單、順序、依賴、對應題號一覽，
`scripts/lib/outline.ts` 純函式序列化，可單測）。**定稿 = 人工 review 後 commit 凍結**：維運者核可即
`git add concepts/ curriculum/outline.md data/problem-bank.json && commit`。Stage 2 **拒絕在未凍結（未 commit）
Skeleton 上執行**——以「工作目錄乾淨（Skeleton 無未提交變更）」作為凍結的可機驗代理，或以顯式 `--allow-dirty`
繞過（僅開發用）。無獨立審核系統、無 PR 強制（自用專案，XVII 精神是「只此一次人工、其餘自動」）。

**Rationale**: outline.md 是唯一人工定稿物；以 git commit 作為「凍結」訊號最輕量、可稽核，且天然版本控制。
Stage 2 前置檢查避免「改到一半的 Skeleton 被展開」。

**Alternatives considered**: 在 outline.md 加 `approved: true` 旗標檔（否決：多一個平行狀態，git 已足夠）；PR 審核
強制（否決：單人自用，過重且近似新增常態關卡）。

---

## R13 — 種子清理與相依/腳本註冊

**Decision**: 全量凍結後移除 F2 種子 Skeleton、F5 fixture Article、F4 種子課表殘留（SC-001：0 殘留）——由生成
物覆蓋同路徑 + 刪除不再對應任何 Concept 的舊檔。`package.json` 新增 scripts：`generate:curriculum`、
`generate:content`、`populate:problem-bank`、`gate:code`（`run-code-blocks.ts`）；`@google/genai` 加入
`devDependencies`。`.gitignore` 加 `.cache/`。

**Rationale**: 收尾一致性；scripts 註冊讓 quickstart/CI 可穩定引用。`@google/genai` 為 devDependency（build-time
only），與「`src/` 不 import」互不矛盾（打包 `dist/` 不含它）。

**Alternatives considered**: 保留種子作為測試 fixture（否決：污染正式素材、SC-001 要求 0 殘留；測試改用
`tests/**` 內自帶的最小 fixture）。
