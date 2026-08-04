# Phase 0 Research: 008-review-extras

**Branch**: `008-review-extras` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

本檔解決 spec 留給 `/speckit-plan` 的未定案細節（FR-020a 明文指定）、以及規劃過程中發現的
**兩項規則不可實作**（R5 / R6：spec 字面規則與 SC-002 / SC-010 互斥）。每則格式為
Decision / Rationale / Alternatives considered。

> ⚠️ **R5 與 R6 導致 spec FR-011 / FR-012 的字面機制被修訂**（見各節末的「spec 修訂」）。
> 修訂只動「用什麼當輪替索引」，不動任何 MUST 的意圖、不動 SC。

---

## R1 — `rhythm` 陣列長度約束如何放寬

**Decision**：`src/compiler/schedule-schema.ts` 的 `rhythm: z.array(SESSION_TYPE_ENUM).length(7)`
改為 **`.min(2).max(14)`**；`validateRhythm` 移除「MUST 含至少一個 `rest`」，其餘四條約束
（含 ≥1 concept、≥1 review、第一個 practice 晚於第一個 concept、最後一個 review 不早於最後一個
concept）**全部保留**。`src/types/schedule.ts` 的 `rhythm` 註解同步由「長度 7；MUST 含 ≥1 review
與 ≥1 rest」改為「長度 2–14；MUST 含 ≥1 concept 與 ≥1 review」。

**Rationale**：

- 改成 `.length(6)` 只是把一個硬編數字換成另一個。`rhythm` 是 `track-params.json` 的**參數**，
  本 Feature 之所以要動 schema，正是因為 F4 當初把「一週 7 天」當成不變式寫死了——重蹈覆轍會讓
  下一次調節奏又要改 schema。
- 下限 **2**：`validateRhythm` 已要求 ≥1 concept 與 ≥1 review，長度 1 必然違反，寫 2 讓長度本身就
  擋掉不可能的值，錯誤訊息也停在「長度」而非繞到兩條語意規則。
- 上限 **14**：`rhythm.length` 即「一輪的天數」，也就是 `reviewRange` 的最大跨度。沒有上限時，一個
  誤植的 `rhythm`（例如貼上 100 個槽）會生出「一次複習涵蓋 100 天」的課表且**零違規通過**——
  週複習的語意悄悄消失。14 = 兩週，是仍能稱為「週節奏」的最寬鬆值。

**Alternatives considered**：

- **`.length(6)`**：最小改動，但把 F4 的錯誤原封不動搬到新數字上。
- **完全移除長度約束（`z.array(...).min(1)`）**：失去上限保護（見上），且 `.min(1)` 與 ≥1 concept +
  ≥1 review 直接矛盾。
- **改由 `validateRhythm` 檢查長度**：可行但沒有好處——長度是 schema 層天生該管的事，放進
  superRefine 只會讓「什麼歸 schema、什麼歸語意」的界線更模糊。

---

## R2 — 無題槽跳過後，warning 的 subject 不能再指 `sessionIndex`

**Decision**：被跳過的 `practice` / `challenge` 槽，其 warning 的 `subject` MUST 為
**`{track}:week-{weekNumber}-slot-{slotPosition}`**（1-based 週序與槽位序），
MUST NOT 使用 `session-{sessionIndex}`。同時新增兩個具名 rule：

| rule | severity | 觸發時機 |
| --- | --- | --- |
| `practice-no-problem` | warning | `practice` 槽算出的 `problemIds` 為空 ⇒ 跳過該槽 |
| `challenge-no-problem`（既有，語意調整） | warning | `challenge` 槽選不到題 ⇒ 跳過該槽（原語意為「產出無題挑戰日」） |

**Rationale**：跳過的槽**不消耗 `sessionIndex`**（FR-014e），該 index 會立刻被同一週的下一個槽用掉。
若沿用現行的 `${track}:session-${sessionIndex}`，warning 會指向一個**真實存在但完全無關**的 Session
——例如「Foundation session-3 challenge 無題」而 session 3 實際上是一堂 concept 課。這種訊號比沒有
訊號更糟：它會把除錯者送到錯誤的地點。週序 + 槽位是被跳過的槽**唯一穩定的座標**。

沿用既有 `challenge-no-problem`（而非新增 `challenge-slot-skipped`）是為了遵守 FR-014g 的「沿用並擴充
既有語意」；但 practice 另立 rule 而非共用，是因為兩者的根因不同——challenge 空池代表
`challengeDifficulty` 與題庫難度分布對不上，practice 空池代表**該週涵蓋的 Concept 整週無題**。
共用一個 rule id 會讓「grep 這個 rule 找出所有難度帶設定問題」這件事失準。

**Alternatives considered**：

- **沿用 `session-{sessionIndex}`**：見上，會指向無關的 Session。
- **兩者共用 `challenge-no-problem`**：rule 名稱與實際主體不符，且混淆兩種不同根因。
- **改為 error 級**：直接違反 FR-018 / §13.4 的「無 fallback、省略為一等合法」定案，且
  `programming-mindset` 期間會讓 CI 恆紅。

---

## R3 — review 槽的候選池取「課表已寫入的 `problemIds`」而非重算

**Decision**：review 的候選池 MUST 為**同一週已產生的 concept Session 之 `problemIds` 的聯集**
（即 `emitSessions` 在該週 push concept Session 時實際寫進課表的那些題號），
MUST NOT 由 `concept.leetcode` 重新過濾一次。

**Rationale**：`selectConceptProblems` 的輸出 = `leetcode` 依難度帶過濾 **＋ overlay 的
`extraProblemIds` ＋ cap 至 3 題**。若 review 端重新從 `concept.leetcode` 過濾，會得到一個
**與使用者當週實際收到的題目不一致**的池：可能選到被 cap 掉的第 4 題（使用者從未看過，
review 就不再是「重做」而是新題），也可能漏掉 overlay 加的題。FR-016 的立論
（「本週題目在 concept 日即已發完，review 的題必然是重做」）**只有在復用同一份輸出時才成立**。

**Alternatives considered**：

- **重算 `unionProblems(weekConcepts, ...)`**：`unionProblems` 自己也 cap 3 且排序方式不同（純 id 升冪），
  兩處各算一次必然漂移。
- **用 `concept.leetcode` 全集（不過濾難度）**：會讓 Foundation 的 review 拿到 Hard 題——該 Track
  的使用者當週根本沒看過那題。

---

## R4 — review 選題是否排除同週 `practice` 已用題號（FR-020a 指定由 plan 定案）

**Decision**：**MUST NOT 排除**同週 `practice` 槽已用的題號。唯一的排除對象是**同週 `challenge` 槽
已選的題號**（FR-017），且該排除為**軟排除**：若排除後候選池變空而原池非空，MUST 退回原池
（允許與 challenge 撞號）並發出具名 warning `review-challenge-duplicate`。

**Rationale**：

1. **硬排除 practice 會直接打破 SC-001**。SC-001 要求「Challenge 段的省略 100% 僅發生在該週涵蓋的
   Concept 全部無題目時」。Foundation 的 `practice` 取的是**同一份週聯集的前 3 題**——當某週的
   題目總數 ≤3（純觀念課混雜的週、或只有 1～2 個 Concept 帶題的週），practice 會把整池吃光，
   排除後 review 必然無題。那是「該週有題但 review 沒題」，是 SC-001 明文禁止的省略。
2. **重做本來就是設計意圖**。FR-016 的定案理由已寫明 review 的題必然是本週已看過的題，
   `practice` 的 `unionProblems` 是同一個設計。把「與 practice 重複」當成缺陷，等於否定 FR-016。
3. **challenge 的排除必須軟化，理由同 (1)**。`challenge` 槽的池是「全部已引入 Concept」而非本週，
   多數情況下它選的題不在本週池內、排除不生效；但當它恰好選中本週唯一一題時，硬排除同樣會製造
   SC-001 禁止的省略。軟排除 + warning 讓「MUST 排除」在**可達成時 100% 達成**，不可達成時
   fail loud 而非靜默丟掉一整段版面。
4. **軟排除有既有前例**：`selectChallengeProblem` 現行就是 `minUnused ?? min`（優先取未用過的，
   全部用過則退回最小 id）。沿用同一個習慣，讀者不需要學第二套規則。

**Alternatives considered**：

- **硬排除 practice + 本週題目不足時退回允許重複**（FR-020a 提到的選項）：行為與本決策**幾乎等價**
  （退回條件觸發時就是允許重複），但多一層狀態、多一個 warning、多一組測試，換到的只是「在池夠大時
  review 與 practice 不同題」——而那正是 FR-016 說不需要在意的事。複雜度不划算。
- **硬排除 challenge、空池就省略**：違反 SC-001（見上）。

---

## R5 — 鼓勵語輪替索引：`sessionIndex` 取模是**不可實作**的，改用 review 序數

**Decision**：鼓勵語索引 MUST 為

```
encouragementIndex = (reviewOrdinal + trackOffset) mod quotes.length
```

其中 `reviewOrdinal` = 該 Track 課表中，全部 `review` Session 依 `sessionIndex` 升冪排列後，
本 Session 的 **0-based 序位**；`trackOffset` = `TRACK_ORDER.indexOf(track)`（0 / 1 / 2）。
兩者皆為 `(track, sessionIndex)` 的純函式（由已載入的凍結課表推導），不依賴時間、隨機源或
檔案列舉序，故 FR-010 的決定性要求完整成立。

**Rationale**：

- **`sessionIndex mod poolSize` 在本專案的節奏下會退化到只用得到 5 則語錄。** 三軌 rhythm 皆為 6 槽，
  review 固定在第 6 槽，故無跳過的週其 `sessionIndex` **每次遞增恰好 6**。以語錄池 30 則計算，
  `sessionIndex mod 30` 的值以 `gcd(6, 30) = 6` 為步長循環，只會取到
  `30 / 6 = 5` 個相異索引——**整個 Track 一輪課程只會看到 5 則語錄**，其餘 25 則永遠不會出現。
  這直接判 SC-002（連續 30 個 review 互不相同）為不可能達成。跳過的槽會讓步長偶爾變成 4 或 5，
  使退化不那麼整齊，但「連續 30 則互異」在任何步長 > 1 的等差數列上都無法保證。
- **`reviewOrdinal` 的步長恆為 1**，`(k mod N)` 在連續 N 次取值中必然互異 ⇒ 只要 `N ≥ 30`（FR-007）
  即機械性滿足 SC-002，也自動滿足 FR-012 的「相鄰兩個 review 不得同一則」（N ≥ 2 時恆成立）。
- **`trackOffset` 消除三軌同句風險**：spec 的 Edge Cases 要求「MUST NOT 因為共用同一份素材而讓三軌
  在同一天推出完全相同的內容」。少了 offset，三軌的第 k 個 review 都會取 `quotes[k mod N]`——
  雖然三軌的第 k 個 review 通常不落在同一天（跳過次數不同導致課表漂移），但那是**觀察到的巧合**
  而非保證。加上固定 offset 後，同一個 `reviewOrdinal` 在三軌必得三則不同語錄（N ≥ 3），
  該 Edge Case 由算式本身保證，不需要依賴課表巧合。

**spec 修訂**：FR-012 的字面機制（「以 `sessionIndex` 對語錄池大小取模」）依本決策改寫為上式。
`docs/spec.md` §14.3 的措辭是「依 `sessionIndex` 決定性輪替」——本規則仍是 `(track, sessionIndex)`
的決定性函式，**與真實來源相容，故 `docs/spec.md` 無需修訂**。

**Alternatives considered**：

- **`sessionIndex mod poolSize`**：見上，數學上無法滿足 SC-002。
- **把語錄池擴到與 `sessionIndex` 步長互質的大小**（例如 31 則）：`gcd(6, 31) = 1` 確實能讓 31 次
  取值互異，但這讓「素材數量」與「rhythm 長度」產生隱性耦合——調一次節奏就可能讓語錄靜默退化，
  且沒有任何 Gate 抓得到。
- **雜湊 `(track, sessionIndex)` 取模**：決定性成立，但輪替均勻性只是機率保證，仍無法**保證**
  連續 30 次互異，且雜湊值不可讀、除錯時無從預期下一則是什麼。

---

## R6 — Reflection 輪替索引：同理改用「該 Topic 的出現序數」

**Decision**：Reflection 問題索引 MUST 為

```
reflectionIndex = (topicOccurrence + trackOffset) mod byTopic[topicId].length
```

其中 `topicOccurrence` = 在同一 Track 課表中，`sessionIndex` **小於**本 Session 且依 FR-011 解析出
**同一個 `topicId`** 的 review Session 數量（0-based）；`trackOffset` 同 R5。

**Rationale**：

- **SC-010 要求「單一 Track 走完整輪課程，同一則 Reflection 問題被推播的次數 MUST 為 1」。**
  以 `sessionIndex mod 6` 選取無法保證：同一 Topic 的數個 review 其 `sessionIndex` 間距為 6 的倍數，
  `mod 6` 恆為同一個值 ⇒ **同一 Topic 的每一次 review 都會拿到完全相同的那一則問題**
  （最壞情況：Foundation 的某個 Topic 連續 4 週推同一題）。這正是 spec 判定為「高可見度缺陷」
  並為此設 FR-003a 配額 Gate 與 FR-028a self-check 的那件事，卻會被選取規則本身製造出來。
- 改用 Topic 出現序數後，`(occ mod L)` 在該 Topic 的前 `L` 次出現中必然互異；FR-003a 的 Gate
  保證 `L ≥ 該 Topic 的最大出現次數`（現行為 4，池為 6），故 SC-010 **由 Gate 與選取規則共同機械保證**，
  不需要另設執行期檢查。
- `trackOffset` 讓同時訂閱多軌的使用者在同一 Topic 的前幾次收到不同問題。spec 的 Assumptions 已
  接受「跨三軌合計 10 次 > 每 Topic 6 則 ⇒ 可能重複」，offset 不改變該結論，只是把重複往後推。

**spec 修訂**：FR-011 的「再以 `sessionIndex` 決定性輪替於該候選集之內」依本決策改寫為上式。
FR-011 的 **Topic 歸屬規則（取最早引入者、並列以 `ordinalOf` 決勝）維持不變**。

**Alternatives considered**：

- **`sessionIndex mod L`**：見上，會讓同一 Topic 每次都推同一則。
- **以 `reviewOrdinal mod L`（不分 Topic）**：跨 Topic 的候選池長度不同，`reviewOrdinal` 與 Topic
  切換點不對齊，同一 Topic 的第 1、2 次可能落在同一索引（例如 Topic 只出現在 review #7 與 #13，
  `7 mod 6 == 13 mod 6 == 1`）。
- **在課表生成期就把選定的問題寫進 `schedules/*.json`**：確實最單純，但會讓「補幾則 Reflection」
  變成「必須重跑並 commit 三份課表」，且素材與課表的凍結週期被綁死。素材的消費點應留在 Compiler。

---

## R7 — 素材檔的檔案結構與嚴格 schema 的落點

**Decision**：兩份素材皆為 `{ "version": 1, ... }` 包裝的物件（非裸陣列）：

```jsonc
// data/reflection-bank.json
{ "version": 1, "byTopic": { "<topicId>": ["問題…", …] } }
// data/encouragement.json
{ "version": 1, "quotes": ["語錄…", …] }
```

嚴格 zod schema、選取純函式、素材品質檢查一律放進**新檔 `src/compiler/material.ts`**；
`src/compiler/lesson.ts` 現行的 `REFLECTION_BANK_SHAPE` / `ENCOURAGEMENT_SHAPE`
（F5 留的最小骨架）由它取代，`CompilerDeps` 的 `reflectionBank?: unknown` / `encouragement?: unknown`
收斂為具型別欄位。

**Rationale**：

- **相容 F5 已就位的載入路徑**：F5 的 `ENCOURAGEMENT_SHAPE` 是 `array | record` 的 union，
  `REFLECTION_BANK_SHAPE` 是 `record`——上述兩個物件形態**都落在既有 union 內**，故
  「壞檔 ⇒ fail loud、缺席 ⇒ 省略」的既有語意與測試不需要重寫，只是把骨架換成完整 schema。
- **`version` 欄位**：兩份都是會被重生成的凍結產物，未來改結構時需要能分辨舊檔。裸陣列沒有掛
  版本的地方。
- **`byTopic` 而非 `byModule`**：FR-002 要求綁 Topic 識別項。現行 16 個 Module 各含 1 個同名 Topic
  （spec Assumptions），但綁 Topic 才能在未來 Module 拆出多個 Topic 時免於重構。
- **放 `src/compiler/material.ts` 而非 `scripts/`**：Compiler（runtime）、`runContentGate`（CI）、
  生成腳本三者 MUST 用同一顆判斷（憲章 IX）。放進 `scripts/` 會讓 `src/` 反向依賴 `scripts/`。

**Alternatives considered**：

- **裸陣列 / 裸 map**：省一層縮排，換來無處掛 `version`。
- **拆成 `src/compiler/material-schema.ts` + `material-select.ts` + `material-gate.ts` 三檔**：
  三者合計約 200 行且共用同一組型別，拆檔只增加 import 噪音。
- **沿用 `src/compiler/schema.ts`**：該檔是 F2 的 Concept frontmatter schema，職責不同。

---

## R8 — 素材 Gate 掛在 `runContentGate`，不另立 CLI

**Decision**：素材品質檢查（schema / 逐區塊預算 / 繁中 / 去重 / Topic 配額 / 語錄池下限 /
語錄無連結無題號）以純函式 `checkMaterials()` 實作於 `src/compiler/material.ts`，並在
**`runContentGate()` 的最前段呼叫**，違規以新增的 `GateRule = "material-invalid"` 回報。
不新增 `scripts/validate-materials.ts`。

**Rationale**：`runContentGate` 已經是「全 Track × 全 Session」的唯一內容 Gate，且有**兩個**呼叫端：
`scripts/validate.ts`（CI 的 `validate:content`，經 content-gate.yml）與 `generate-content.ts` 的批次末。
掛在這裡，兩條路徑自動同時涵蓋素材，不需要記得在兩處各接一次線（憲章 IX）。另立 CLI 則必須
同步修改 `ci.yml` / `content-gate.yml` 並在文件裡多維護一條指令，而它檢查的東西本來就屬於
「這批 Lesson 能不能推」的範疇。

生成腳本 `generate-materials.ts` 另需在**寫檔前**對單批草稿跑同一組 per-batch 檢查
（schema / 預算 / 繁中 / 批內去重）——這是 F7 的既有教訓（per-article Gate 缺預算檢查，導致超標
要等 165 篇跑完的批次末才爆出）。配額檢查（FR-003a）需要全庫 + 三份課表，故只在批次末的
`checkMaterials` 執行。

**Alternatives considered**：

- **獨立 `npm run validate:materials`**：多一條 CI 步驟與一份文件，且與 `validate:content` 的
  失敗訊息分家。
- **只在生成腳本檢查**：CI 就無法擋下手改的素材檔（憲章 XIII 明訂生成物不得手改，但 Gate 必須
  真的擋得住）。

---

## R9 — 逐區塊預算數字必須從 `budget.ts` 抽成具名常數

**Decision**：`src/renderer/budget.ts` 內目前以字面值寫死的 `300` / `200` 抽出為

```ts
export const MATERIAL_BUDGET_LIMITS = { reflectionQuestion: 300, encouragement: 200 } as const;
```

`checkBudget` 改用之；`material.ts` 的 Gate 與生成腳本一律 import 此常數，MUST NOT 另寫數字。

**Rationale**：FR-029 明文要求單一預算來源。F7 已經為此吃過虧——`ARTICLE_BUDGET_LIMITS`
與 `EXIT_CRITERIA_*` 就是為了讓生成期 Gate 與 renderer 用同一份數字才抽出來的。素材生成端要在
**組不出 `RenderedMessage` 的情況下**驗長度（生成期只有字串），與當時完全同一個處境。

**Alternatives considered**：

- **生成端 import `checkBudget` 並組一個假的 `RenderedMessage`**：為了驗一個字串長度而偽造整則
  訊息，且假訊息的結構性檢查會產生無意義的違規。

---

## R10 — self-check 沿用 F7 機制的具體接法

**Decision**：

1. 把 `stripJsonFence` 與 `parseSelfCheckResponse` 由 `scripts/generate-content.ts` **搬到**
   `scripts/lib/prompts/self-check.ts`（與 `SelfCheckResponse` 型別同處），`generate-content.ts`
   改為 import 並 **re-export**（既有測試若 import 該符號不受影響）。純搬移，無行為變更。
2. 在 `self-check.ts` 新增 `buildReflectionSelfCheckPrompt(input)`，rubric **恰為兩項**
   （FR-028a）：批內是否有任兩則在問同一件事；是否有任一則可用單一字詞或「是／否」回答。
   回應型別沿用同一個 `SelfCheckResponse`（`{ confident, issues }`）。
3. 重生迴圈沿用 `generate-content.ts` 的語意與 `MAX_REGEN = 3`：機械 Gate → self-check →
   任一失敗即帶著具名 `retryFeedback` 重生；3 次仍不過 ⇒ 該 Topic 標記 `needsHumanReview`、
   **不寫入素材檔**、**不中斷其餘 Topic**、批次結束以非零 exit code 收尾。

**Rationale**：FR-028b 明文禁止另建第二套 self-check。共用的是「回應契約 + 解析 + 重生語意」，
prompt 內容本來就該依對象而異（審一篇文章 vs 審一批問題）。把解析函式留在 `generate-content.ts`
會讓新腳本 import 一支 165 篇教材的產線入口，只為了一個 15 行的 JSON 解析。

**Alternatives considered**：

- **`generate-materials.ts` 直接 import `generate-content.ts`**：會拉進 `run-code-blocks`、
  `gray-matter`、整條 Stage 2 依賴；且該檔底部有 `process.argv[1]` 的入口自動執行判斷，
  雖不會誤觸發，但讓兩支 CLI 互相依賴是不必要的耦合。
- **在 `generate-materials.ts` 內複製一份解析**：直接違反 FR-028b。

---

## R11 — 生成腳本的續跑單位與 manifest

**Decision**：新增 `.cache/material-manifest.json`，以**批次**為 checkpoint 單位
（key = `topicId`，加上一個固定 key `"encouragement"`）：

```jsonc
{ "version": 1, "batches": { "array": { "inputHash": "…", "frozen": true, "gatePassed": true,
                                        "needsHumanReview": false, "regenCount": 1 } } }
```

實作於新檔 `scripts/lib/material-checkpoint.ts`，**復用** `scripts/lib/checkpoint.ts` 既有的
`hashContent` 與原子寫入（`.tmp` + `rename`）路徑——為此把 `checkpoint.ts` 的原子寫入與讀檔抽為
不綁 `Manifest` 型別的內部 helper 並匯出，`Manifest` 相關 API 行為不變。

跳過條件沿用 `shouldSkip` 的語意：`--force` 一律不跳；否則須「該批已存在於素材檔 + `inputHash`
相符 + `frozen && gatePassed`」才跳過。`inputHash` = 該批生成輸入的雜湊
（Reflection：`topicId` + Topic title + prompt 版本常數；Encouragement：prompt 版本常數 + 目標則數）。

**Rationale**：批次是唯一有意義的續跑單位——一次 LLM 呼叫產出一個 Topic 的 6 則問題，中斷只會發生在
批與批之間。沿用 `ConceptCheckpoint` 的欄位（`skeletonHash` / `articleFrozen`）則要讓欄位名說謊。
原子寫入必須復用而非重寫：F7 已經記錄過「寫到一半被 Ctrl-C 會留下半截 JSON」的實測教訓。

**Alternatives considered**：

- **把 `checkpoint.ts` 泛型化為 `Manifest<TEntry>`**：能共用最多程式碼，但會改動 F7 全部呼叫點的
  型別推導，為了 17 個批次去動 165 篇教材的續跑機制，風險與收益不成比例。
- **不做 checkpoint（全批 17 次呼叫，重跑成本低）**：直接違反 FR-026 / SC-008，且冪等（不覆蓋已凍結
  素材）本來就需要一份 manifest 才能判斷。

---

## R12 — 語錄池生成目標則數

**Decision**：生成目標 **36 則**；Gate 通過門檻維持 spec FR-007 的 **≥ 30**。

**Rationale**：門檻 30 是「最長 Track（InterviewMastery，**42** 個 review——導出值，見 FR-007，
MUST 以重跑後的課表為準）一輪最多繞回一次」推出來的
下限。若把生成目標也設成 30，任何一則因去重／繁中／預算被剔除就會直接跌破門檻並觸發整批重生。
36 給 6 則（20%）的損耗餘裕，仍遠低於「要 LLM 生一大堆而稀釋品質」的規模。與 Reflection 的
「生成端固定則數、驗證端計算式」（FR-003a）是同一個職責分離原則。

**Alternatives considered**：

- **正好 30**：無損耗餘裕（見上）。
- **≥ 42（覆蓋 InterviewMastery 全部 review，完全不繞回）**：spec 的 Assumptions 已明確定案
  「語錄與課程內容無關，繞回一次幾乎不可察覺，故只設下限、不設計算式」。加碼會與該定案相左。

---

## R13 — 語錄「不得提及題號或 Concept」的機械判準邊界

**Decision**：`checkMaterials` 對每一則語錄機械檢查四項：(a) 不含 `http://` / `https://`；
(b) 不含 markdown 連結語法 `[…](…)`；(c) 不含 `LeetCode`（不分大小寫）；(d) 不含 `#數字` 形式的
題號樣式。**不**比對 Concept id / title 清單。

**Rationale**：(a)–(d) 是**零誤判**的樣態——教材語錄沒有任何正當理由包含連結、平台名或題號標記。
比對 Concept title 則會誤殺：Concept title 含「Two Pointer」「Sliding Window」等一般性詞彙，
一句「有時候慢下來，換個角度就過了」若碰巧命中就會被無故退回，而 FR-008 真正要防的是
「語錄綁定進度而無法安全輪替於全部 Track」，不是「語錄不准出現任何技術名詞」。
剩餘風險由 prompt 明確約束承擔——與 FR-028a 刻意排除「切題性」判準（最主觀、最易誤退）同一個取捨。

**Alternatives considered**：

- **比對全部 Concept id 與 title**：誤判率高（見上），且 165 個 title 的子字串比對會讓 Gate 的失敗
  訊息難以理解。
- **完全不機械檢查、只靠 prompt**：連 URL 這種零誤判、後果明確（外部連結進推播）的樣態都放掉。

---

## R14 — 課表重跑前 MUST 重新確認 `state` 分支的進度

**Decision**：執行 FR-014d 的課表重跑**之前**，MUST 讀取 `state` 分支的 `state.json` 並確認三軌的
`currentSessionIndex` 仍 ≤ 3。若已 > 3，MUST 先依 `docs/spec.md`
§9.2 的「指定起點」流程換算並校正 `currentSessionIndex`，再重跑課表。

### 查證紀錄

| 日期 | 結果 | 判定 |
| --- | --- | --- |
| 2026-08-01（spec 撰寫時） | 三軌 `currentSessionIndex: 2` | ≤ 3，不需遷移 |
| 2026-08-02 | **`state` 分支已重置**：三軌 `currentSessionIndex: 1`、`lastPushAt: null`、`completedConceptIds: []`、`history: []` | ≤ 3，且**從未推播** ⇒ 無任何進度需對齊，遷移不適用 |
| **2026-08-04（`/speckit-implement` T001 執行時，最近一次）** | 每日 cron 已正式運作：三軌 `currentSessionIndex: 3`、`history` 各 2 筆（`computational-thinking-basics`、`input-output-contract`），`lastPushAt: 2026-08-03T23:14` | **仍 ≤ 3，不需遷移**，但已貼近門檻邊界（下次推播即 index 4）⇒ 課表重跑 MUST 儘快完成，不得拖延至下次 cron 執行後 |

**Rationale**：spec 的 Edge Cases 已查證「三軌 rhythm 的第 1、2 槽都是 concept 且 Concept 引入順序不變
（SC-005），故新課表的 Session 1、2 仍指向同樣兩個 Concept，不需要 state 遷移」，並明文要求
**實作時重新確認此前提仍成立**。位移自 Session 3 起發生，而每日 cron（`daily.yml` 台北 06:07 / 06:37）
仍在排程中、每天推進 1——故本檢查仍具時效性，但**自 2026-08-02 的重置起有 3 天餘裕**。

**風險等級（2026-08-02 下修）**：state 重置後 `history` 為空，**即使門檻被越過也沒有已推播進度會被錯位**，
最壞後果從「使用者跳課」降為「重看一課」。本檢查因此由「唯一會靜默造成跳課的風險點」降級為
**例行前置記錄**——仍 MUST 執行（成本只是一次 `git show`），但不再是排程上的關鍵路徑。

**Alternatives considered**：

- **假設前提仍成立**：見上，是時間相依的假設，且失效時無任何訊號。
- **一律執行 state 遷移**：多數情況下是不必要的手術，且遷移本身也可能算錯。
