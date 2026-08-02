# Contract: 課表生成器修訂（移除 rest 槽、跳過無題槽、review 選題）

**Feature**: 008-review-extras | **對象**：`src/compiler/schedule-generator.ts`、`src/compiler/schedule-schema.ts`、`curriculum/track-params.json`

本契約釘死 `emitSessions` 的三項行為變更與參數層的兩項放寬。三項變更 MUST 在**同一階段**完成
（spec「實作順序約束」①）——它們全部改變生成器輸出，分批進行會產生多次全量課表 diff。

---

## 1. 參數層（`schedule-schema.ts`）

| 項目 | 變更前 | 變更後 | 依據 |
| --- | --- | --- | --- |
| `rhythm` 陣列長度 | `.length(7)` | `.min(2).max(14)` | FR-014a / research R1 |
| `validateRhythm` 必要槽 | `review` **與** `rest` | 僅 `review` | FR-014b |
| ≥1 concept 槽 | 保留 | **保留** | — |
| 第一個 practice 晚於第一個 concept | 保留 | **保留** | — |
| 最後一個 review 不早於最後一個 concept | 保留 | **保留** | — |

違規一律以既有的 `param-invalid` 具名回報（不新增 rule）。

**`track-params.json` 三軌 rhythm 各移除末槽 `"rest"`**（7 → 6）；其餘欄位不動。

---

## 2. `emitSessions` 的槽位處理（FR-014e / FR-014f / FR-014g）

```
weekNumber ← 0
while qi < covered.length:
    weekNumber++;  weekStartIndex ← sessionIndex;  weekConcepts ← [];  weekProblemIds ← [];
                   weekChallengeIds ← []
    for (slotPosition, slotType) of rhythm:            // slotPosition 1-based
        concept:
            if 佇列已空 → continue                     // 既有行為，不消耗 sessionIndex
            problemIds ← selectConceptProblems(...)
            push concept Session;  weekConcepts += concept
            weekProblemIds += problemIds               // ★ review 候選池的唯一來源
            sessionIndex++
        practice:
            problemIds ← unionProblems(weekConcepts, ...)
            if problemIds 為空 →
                warn practice-no-problem @ {track}:week-{weekNumber}-slot-{slotPosition}
                continue                               // ★ 不產生 Session、不消耗 sessionIndex
            push practice Session;  sessionIndex++
        challenge:
            id ← selectChallengeProblem(introduced, ...)
            if id === undefined →
                warn challenge-no-problem @ {track}:week-{weekNumber}-slot-{slotPosition}
                continue                               // ★ 同上（原為產出無題 Session）
            usedChallengeIds += id;  weekChallengeIds += id
            push challenge Session（problemIds = [id]）; sessionIndex++
        review:
            problemIds ← selectReviewProblem(weekProblemIds, weekChallengeIds, bank, ...)
            push review Session（reviewRange = [weekStartIndex, sessionIndex − 1]，
                                 problemIds 非空時才寫入）                 // ★ 一律產生
            sessionIndex++
        rest:
            push rest Session;  sessionIndex++          // 保留分支（現行課表不會走到）
```

### 2.1 為何 `review` 一律產生（FR-014f）

跳過 review 會使該週的 concept Session 落在所有 `reviewRange` 之外，直接違反
`review-coverage-gap` 不變式；且 F8 之後 review 具備涵蓋清單 + Reflection + 鼓勵語，
不缺 Challenge 段仍有實質內容。

### 2.2 為何跳過必須在生成端（FR-014e）

runtime 跳過會違反 §19 的「推播成功才 +1」與「漏跑不跳課」，等同讓每日管線依內容決定是否推播。

### 2.3 warning 的 subject 不得用 `sessionIndex`

被跳過的槽不消耗 `sessionIndex`，該 index 會被同一週的下一個槽用掉——沿用
`session-{sessionIndex}` 會讓 warning 指向一個真實存在但完全無關的 Session（research R2）。
故 practice / challenge 的跳過 warning MUST 用 `{track}:week-{n}-slot-{m}`。

### 2.4 `reviewRange` 不需另作處理（FR-014d）

被跳過的槽未消耗 `sessionIndex`，`[weekStartIndex, sessionIndex − 1]` 自動收縮至該週實際產生的
Session 範圍。**每一個被產生的週必含至少一個 concept Session**（`while` 進入條件為佇列非空，
且三軌 rhythm 首槽皆為 `concept`），故 `reviewRange` 恆非空、`compileReview` 不會撞上
「range 內無 concept Session」。既有的 `review-range-invalid` 與 `review-coverage-gap`
維持為護欄，不放寬。

---

## 3. `selectReviewProblem`（FR-016 / FR-017 / FR-018 / FR-020 + research R3 / R4）

```
候選池 = weekProblemIds（該週已產生的 concept Session 實際寫入課表的 problemIds 聯集，去重）
if 候選池為空:
    warn review-no-problem @ {track}:session-{sessionIndex}
    return undefined                                  // 省略 problemIds（無 fallback，§13.4）

排序鍵 = (難度 Easy < Medium < Hard, 題號升冪)          // 難度取自 Problem Bank
過濾池 = 候選池 \ weekChallengeIds
if 過濾池非空:  return 過濾池排序後第一題
else:
    warn review-challenge-duplicate @ {track}:session-{sessionIndex}
    return 候選池排序後第一題                            // 軟排除退回（見 §3.2）
```

### 3.1 為何候選池取「課表已寫入的 `problemIds`」

`selectConceptProblems` 的輸出 = 難度帶過濾 **＋ overlay `extraProblemIds` ＋ cap 3 題**。
重新從 `concept.leetcode` 過濾會得到與使用者當週實際收到的題目不一致的池（可能選到被 cap 掉、
使用者從未看過的第 4 題），FR-016 的「review 是重做」立論即不成立（research R3）。

### 3.2 排除規則為**軟排除**

FR-017 要求排除同週 `challenge` 已選題號；但當該題是本週唯一一題時，硬排除會讓 review 無題，
製造 SC-001 禁止的省略（「省略 100% 僅發生在該週涵蓋的 Concept 全部無題目時」）。
故排除在**可達成時 100% 達成**，不可達成時退回並 fail loud。此為既有慣例
（`selectChallengeProblem` 的 `minUnused ?? min`）的同一形狀。

### 3.3 **不**排除同週 `practice` 題號（FR-017b）

`practice`（`unionProblems`）取的是同一份週聯集的前 3 題，週題目總數 ≤3 時排除會把池吃空 ⇒
同樣製造 SC-001 禁止的省略。且兩者皆為本週題目的複習，**重做本來就是設計意圖**（FR-016）。
決策與理由詳見 research R4。

### 3.4 「優先取最低難度」的理由（規範性判準見 FR-017）

> 本節**只記錄理由**，排序規則的規範性落點一律為 spec FR-017（＋上方 §3 的排序鍵）；
> 本節 MUST NOT 被當成第二份判準來源（同 FR-020a 的處置）。

Foundation 的 `challengeDifficulty` 是 `Easy` 而 `problemDifficulties` 是 `Easy + Medium`。
若不排序而僅取最小題號，review 日可能拿到 Medium 而比前一天的 challenge 日更難，
與 review 的「複習、反思」定位相反。

### 3.5 題數（FR-020）

`review` 的 `problemIds` 長度 MUST 恰為 **1**（候選池非空）或**省略**（候選池為空）。
`challengeDifficulty` MUST NOT 被 review 槽使用（維持只服務 `challenge` 槽，FR-016）。

---

## 4. 課表重生成的驗收（FR-014d / FR-019 / SC-005 / SC-012）

| # | 驗收項 | 判準 |
| --- | --- | --- |
| A1 | Session 數 | Foundation **198** / InterviewReady **200** / InterviewMastery **243** |
| A2 | determinism | 連跑兩次產出 **byte-identical** 的三份課表（`checkDrift` 零違規） |
| A3 | 內建驗證 | 拓樸子序列、`review-range-invalid`、`review-coverage-gap`、`forward-dependency`、`duplicate-concept`、`dangling-*`、`session-problem-overflow` **零 error** |
| A4 | 教學內容不變 | 三軌涵蓋的 **Concept 集合與引入順序**相對於 F7 凍結版本 100% 相同 |
| A5 | 無空槽 | `problemIds` 為空的 `practice` / `challenge` Session 數 = **0** |
| A6 | warning 可追溯 | 每一個被跳過的槽、每一個無題 review 都有對應的具名 warning |
| A7 | review 題數 | 每個 review 的 `problemIds` 長度 ∈ {0（省略）, 1} |

> **MUST NOT 以「diff 面積」作為驗收條件**（FR-019）：移除 rest 槽會使第一個 rest 之後的每一個
> `sessionIndex` 全部前移，diff 必然是全面性的。正確性由 A2 + A3 + A4 三者共同保證。

**A4 的檢查方式**：對每份新舊課表各取 `sessions.filter(type === "concept").map(conceptId)`，
兩序列 MUST 完全相等。此比對 MUST 以測試或一次性腳本執行並留下輸出，MUST NOT 只靠目視 diff。

---

## 5. 前置：`state` 分支確認（research R14）

重跑課表**之前** MUST 執行：

```
git fetch origin state && git show origin/state:state.json
```

確認三軌 `currentSessionIndex` ≤ 3。
- **≤ 3**：三軌 rhythm 的第 1、2 槽皆為 `concept` 且 Concept 引入順序不變（A4），
  新課表的 Session 1、2 指向同樣兩個 Concept ⇒ **不需要任何 state 遷移**。
- **> 3**：位移已發生，MUST 先依 `docs/spec.md` §9.2 的「指定起點」流程換算並校正
  `currentSessionIndex`，再重跑課表。

此檢查 MUST 在實作時重新執行並把結果追加至 research R14 的「查證紀錄」表，
MUST NOT 沿用任何一次舊查證結果——每日 cron 每天推進 1。

**最近一次查證（2026-08-02）**：`state` 分支已重置，三軌 `currentSessionIndex: 1`、`history: []`
（從未推播）⇒ 前提成立，且因無已推播進度，越過門檻的最壞後果僅為「重看一課」而非跳課。
本檢查為**秒級指令**，非等待期。
