# Phase 0 Research: Lesson Compiler、全 Session 類型 Renderer 與內容 CI Gate

**Feature**: `005-lesson-compiler` | **Date**: 2026-07-23 | **Plan**: [plan.md](./plan.md)

技術選型已由憲章「技術與資源約束」與 `docs/spec.md` §22.3 釘死（strict TypeScript / `gray-matter` +
`marked` / `zod` / `vitest` / 無框架），本階段**不做選型研究**，只解決本 Feature 的**設計決策**。
spec 的三個 [NEEDS CLARIFICATION] 已於 2026-07-23 由使用者定案（見 spec.md「Clarifications」），
本檔承接其後續設計細節。

---

## R1：Full Article `Today's Challenge` 的逐題條目格式

**Decision**：`Today's Challenge` 區塊 MUST 由**巢狀 markdown list** 逐題描述，每題一個頂層項目，
以 `**{leetcodeId}**` 開頭：

```markdown
## Today's Challenge

- **167** · 陣列已排序，兩數之和的經典應用——直接用左右指標，不需要額外的雜湊表。
  - Hint: 想想總和與 target 的大小關係，該移動哪一個指標？
- **125** · 字串視為字元陣列，左右指標同時往中間夾，檢查兩端字元是否對稱。
```

- 頂層項目 `**{id}**` 之後的文字（去除前導 `·` 與空白）即 `whyThisPattern`，MUST 非空。
- 巢狀項目中以 `Hint:` 開頭者即 `hint`（選配，至多一則）。
- **MUST NOT** 出現題目標題、連結、難度——那三者由程式從 Problem Bank 帶入（憲章「不轉載」條款）。
- 條目集合以 `id` 為鍵，**順序不影響** Lesson（Lesson 的題目順序由課表 `problemIds` 決定），
  故格式本身不引入非決定性。

**Rationale**：
1. `whyThisPattern` / `hint` 是**教學內容**，唯一合理來源是教材；Problem Bank 只存題目 metadata（§12.1），
   把教學說明塞進 Bank 會讓「同一題在不同 Pattern 下為何適合」無處安放。
2. 以 `id` 為鍵而非位置對應，可讓 Article 與課表 `problemIds` 的**不對齊被明確偵測**（FR-006），
   而不是靜默錯位。
3. list 結構可由既有的 `marked` lexer token 直接走訪，不需新增相依，也不需正則硬解整段文字。

**Alternatives considered**：
- **三級標題 `### 167`**：可行，但會在 §10 的二級固定區塊之下再引入一層標題語意，且 F7 產線生成
  markdown 標題的變異度高於 list（易出現 `### 167.` / `### 167 Two Sum` 等變體）。
- **frontmatter 內以 YAML map 描述**：解析最穩，但把教學散文塞進 frontmatter，人類閱讀與 F9 全文頁
  都會失真，且與 §10「固定區塊」的模型衝突。
- **沿用 F1 現況（不列題、由 Bank 帶入全部）**：無法提供 `whyThisPattern` / `hint`，直接違反 §14.2 版面
  與 FR-006。**F1 的 `articles/two-pointer/002-left-right-pointer.md` 正是此形態，故本 Feature 需改寫或移除**（見 R8）。

**跨 Feature 影響（已回寫 `docs/spec.md` §14.3）**：`Today's Challenge` 是全專案題目說明的唯一來源，
F7 Stage 2 展開全文時 MUST 為每個 `leetcode` 題號產出對應條目。

---

## R2：`compile()` 的相依注入形態

**Decision**：`compile(track, sessionIndex, deps)`，`deps` 為**已載入完成**的來源集合：

```ts
interface CompilerDeps {
  graph: CurriculumGraph;                 // F2
  bank: ProblemBank;                      // F3
  schedules: Record<Track, TrackSchedule>;// F4 生成物
  overlays: Record<Track, TrackOverlay>;  // F4（僅消費 extraNotesMarkdown，見 R6）
  readArticle: (path: string) => string;  // 讀檔邊界（預設 fs，測試可注入）
}
```
另提供 `loadCompilerDeps(paths?)` 一次載入全部來源並在載入層 fail loud。

**Rationale**：
- 沿用 F1 已建立的「caller 載入一次、注入 compile」慣例（現有 `CompileOptions.bank` 即此形態的雛形），
  避免 Gate 對 39 筆 Lesson 各重讀一次 DAG 與題庫。
- `compile` 本身維持**純函式**（除 `readArticle` 這個明確的讀檔邊界），使 determinism 與失敗語意可單元測試。
- Article 內容不預先全量載入：以 `readArticle` 回呼 + **同 deps 內的快取**（`Map<path, ArticleContent>`）
  兼顧「Gate 39 筆不重複解析同一篇」與「runtime 只讀一篇」。

**Alternatives considered**：模組級全域快取（會讓測試互相污染、且與 F1 既有注入風格不一致）；
每次 compile 全量重載（Gate 需重載 39 次 DAG + 題庫，明顯浪費且無收益）。

---

## R3：`problemId → 引入該題的 conceptId` 反查（practice / challenge 用）

**Decision**：以**該 Track 的課表**為準建立反查表，於 `compile` 的 deps 準備階段對每個 Track 各建一次：

1. 依 `sessionIndex` 遞增走訪該 Track 課表的 `concept` 類 Session；
2. 對每個 Session 的 `conceptId`，取其 `ConceptNode.leetcode` 全部題號；
3. 每個題號**首次**出現時記錄其 `conceptId`（先到先得 ⇒「較早引入者」）；
4. 同一 Session 內多題無先後問題（都屬同一 Concept）；若兩個 Concept 位於同一 `sessionIndex`
   （課表不允許，僅防禦）則以 F2 `ordinalOf` 全序決勝。

查得 `conceptId` 後讀該 Concept 的 Article `Today's Challenge` 條目取 `whyThisPattern` / `hint`；
**查無來源**時該題**只呈現題號 / 標題 / 連結 / 難度**，MUST NOT 失敗、MUST NOT 以空字串填充（spec FR-030）。

**「查無來源」涵蓋兩種狀態，MUST 走同一條路徑**：
1. 反查表中沒有該題（該題未被任何已排入的 Concept 引入，例如 challenge 專屬題）；
2. 反查到 `conceptId`，但該 Concept 的 Article `Today's Challenge` **沒有該題號的條目**。此為可達狀態——
   反查表建自 `ConceptNode.leetcode`（全集），而 Article 條目只被 FR-006 要求涵蓋**課表排入**的題號
   （單向包含），故難度帶過濾掉的題號可能有 origin 卻無條目。

兩者對使用者的結果相同（該題只有 metadata），故不區分。**與 concept 類 Session 的題目不對齊
（fail loud）語意不同，MUST NOT 混用**。

**Rationale**：反查以「課表順序」而非「DAG 順序」為準，才符合「學習者是在哪一堂課第一次見到這題」的語意；
先到先得使結果完全由 committed 課表決定 ⇒ 確定性。

**Alternatives considered**：以 DAG `ordinalOf` 為唯一準則（與使用者實際學習順序脫鉤，且跨 Track 相同，
無法反映 Track 涵蓋差異）；在 Problem Bank 增設 `hint` 欄位（見 R1 Alternatives，已否決）。

---

## R4：`Lesson.path`（prev / current / next）的 DAG 推導

**Decision**：
- `current` = 該 Session 的 Concept `title`。
- `prev` = 該 Concept `prerequisite` 中 **`ordinalOf` 最大**者的 `title`（最接近的前置）；空則省略。
- `next` = 該 Concept `next` 中 **`ordinalOf` 最小**者的 `title`（最接近的後繼）；空則省略。
- 參照不存在於 DAG ⇒ fail loud（F2 的 `dangling-ref` 已在 `validateCurriculum` 攔下，此處為第二道防線）。

**Rationale**：§14.2 的「昨天 / 今天 / 明天」是**學習位置感**，F2 clarify 2026-07-21 已定案 MUST 取自 DAG
而非課表相鄰。多前置 / 多後繼時取「最接近者」最符合直覺，並以 F2 既有全序保證確定性——不新增排序準則，
避免第二套順序知識。

**Alternatives considered**：取課表中前一 / 後一個 `concept` Session（與 F2 定案衝突，且 rest / review
插在中間時語意混亂）；列出全部 prerequisite（footer 預算 ≤200，多前置時會超限）。

---

## R5：五種 Session 類型的 Lesson 形狀與版面

**Decision**（詳細欄位見 [data-model.md](./data-model.md)、版面見 [contracts/renderer-contract.md](./contracts/renderer-contract.md)）：

| type | Lesson 必備 | Lesson 選配 | embeds |
| --- | --- | --- | --- |
| `concept` | `concept`、`path` | `problems`、`overlayNotes` | 主 Embed + 題目 Embed（有題才有）+ 結尾 Embed |
| `practice` | — | `problems` | 練習 Embed（題目為主；無題時只有標題與一行提示） |
| `challenge` | — | `problems` | 挑戰 Embed（同上，標題與色系不同） |
| `review` | `reviewConcepts` | `problems`、`reflectionQuestion` | 複習 Embed（Concept 清單）+ 選配 Reflection / Challenge 段 |
| `rest` | — | `encouragement` | 休息 Embed（一行固定文案 + 選配鼓勵語） |

- `Lesson.color`（頂層欄位，取代 F1 的 `concept.moduleColor`）：非 concept 類 Session 無單一 Module，
  一律使用**中性色**（`DEFAULT_MODULE_COLOR`），由 Compiler 填入，Renderer 不查表（憲章 XI）。
- `practice` **不推導「近期 Concept 清單」**：課表未提供 practice 的涵蓋範圍欄位，憑空推導等於發明資料
  （MUST NOT）。practice 版面只呈現題目與固定提示文案。
- `review` 的 Concept 清單由 `reviewRange` 推導：取 `[start, end]` 內全部 `concept` Session 的
  `{ id, title }`；範圍內無任何 concept Session ⇒ fail loud（spec Edge Cases）。

**Rationale**：Lesson 欄位「該類型不需要就不存在」使 Renderer 的分派與 Gate 的檢查都能靠型別收斂，
不需要在版面中判斷空字串。

---

## R6：Overlay 的三個欄位在 Compiler 的套用點

**Decision**——總則：**凡會改變「今天做哪幾題」的欄位，唯一套用點在 `generate-schedule.ts`（F4 生成階段），
Compiler 只組裝不選題、不加題**：

- **`extraNotesMarkdown`**：以 `Lesson.overlayNotes` 帶入，Renderer 以**獨立附加區塊**呈現，
  MUST NOT 併入或取代 Digest（憲章 VI）。納入字元預算（見 R10）。
  **這是本 Feature 唯一消費的 Overlay 欄位**——它是補充說明，不改變選題。
- **`extraProblemIds`**：**本 Feature 不消費**。F4 `generate-schedule.ts` 的 `selectConceptProblems` 已把它
  附加於難度帶過濾結果之後（首次出現保留去重），`unionProblems` 亦納入同週 practice 槽的聯集，結果凍結於
  `schedules/{track}.json`（`foundation` #4 的題號 `27` 即由此而來）。Compiler 若再套用一次，等於**同一條
  加題規則有生成端與 runtime 兩份實作**（違反憲章 IX），並使生成物失去權威（違反憲章 XIII）；
  即使去重讓它在目前資料下冪等，兩處實作仍必然隨時間漂移。**Track 的題目分歧一律來自課表本身。**
- **`challengeDifficulty`（per-Concept）**：**本 Feature 不消費**。challenge 的選題已於 F4 生成階段依
  `TrackParam.challengeDifficulty` 決定並凍結於 `schedules/{track}.json`；且 challenge 槽非 concept-bound，
  per-Concept 覆寫在 Compiler 側**沒有套用點**。

**Rationale**：F4 spec 明文把「兩者的套用優先關係由 F5 定案」留給本 Feature。初版裁決對
`extraProblemIds` 與 `challengeDifficulty` 給出相反結論，但兩者適用完全相同的理由；`/speckit-analyze`
（2026-07-23）核對 F4 生成器原始碼後確認 `extraProblemIds` 已在生成端套用，故統一為單一總則。

**對 US5 驗收的影響**：Overlay 加題不再是 Compiler 的可觀察行為，US5 改以「教材正文三軌相同 +
`Lesson.problems` 完全等於課表 `problemIds` + `extraNotesMarkdown` 疊加不取代」驗證（spec US5 AS-2 / AS-5）。

**跨 Feature 影響（已回寫 `docs/spec.md` §16.3）**：`extraProblemIds` 的唯一套用點為 `generate-schedule.ts`；
`ConceptOverlay.challengeDifficulty` 目前無消費者，若日後要使其生效，套用點同樣在 `generate-schedule.ts`，
MUST NOT 移至 Compiler。

---

## R7：F8 素材缺席時的行為與 review 的 Challenge 段

**Decision**：
- `reflectionQuestion` / `encouragement` 為 `Lesson` 的選配欄位。素材檔（`data/reflection-bank.json` /
  `data/encouragement.json`）**不存在時**，Compiler 不填該欄位、Renderer 省略該段落、Gate 照常通過
  （spec FR-031 已定案）。素材檔**存在但不符 schema** ⇒ fail loud（避免壞檔被當成缺席）。
- `review` 的 **Challenge 段**：題目 MUST 來自課表該 review Session 的 `problemIds`。F4 現行生成器**未為
  review 槽選題**，故目前 review Lesson 無題目、該段省略。這是課表側的待補，MUST NOT 由 Compiler
  即時選題補足（同 R6 理由）。

**跨 Feature 影響（已回寫 `docs/spec.md` §15）**：review 的 Challenge 題目來源明確為課表 `problemIds`；
在 F4 生成器補上 review 槽選題之前，該段省略為合法狀態。

---

## R8：stub fixture Article 與 F1 孤兒 Article 的處置

**Decision**：
- 為 F2 的 5 個 stub Concept 各補一篇**最小可編譯的 Full Article**（`articles/{topic}/{NNN}-{slug}.md`，
  路徑由 F2 `ConceptNode.articlePath` 決定），含 §10 全部固定區塊、frontmatter 與符合 R1 格式的
  `Today's Challenge` 條目。內容為簡短但**真實可讀**的繁中教材（非 lorem），使 Gate 的預算檢查有意義。
- `articles/two-pointer/002-left-right-pointer.md`（F1 手寫）**移除**：其 `left-right-pointer` 不存在於 F2 的
  DAG，任何課表都不會引用它，且其 `Today's Challenge` 為「不列題」的舊形態（與 R1 衝突）。它的版面價值
  已於 M0 由真實 Discord 推播驗收兌現，內容仍可由 git 歷史取回；新的 5 篇 fixture 沿用同一版面並在 Gate
  中被實際 render，覆蓋面更廣。

**Rationale**：留下一篇沒有 Concept 對應、格式又已過時的 Article，會讓「articles 與 Concept 一一對應」
這個直覺失效，也給 F7 產線一個錯誤的格式樣板。

**Alternatives considered**：為它補一份 Concept Skeleton（`two-pointer` 是 Level 4，且單一 Concept 會踩到
F2 的 `granularity-range` 顆粒度規則，得為此放寬 Gate——代價遠大於收益）；移入 `tests/fixtures/`
（可行，但既有 fixture 已涵蓋所需錯誤形態，多一份舊格式樣板反而是雜訊）。

---

## R9：Gate 的分層與失敗蒐集策略

**Decision**：
- `src/compiler/gate.ts` 匯出 `runContentGate(input: GateInput): GateResult`（`{ violations, compiled, total }`，
  權威定義見 [contracts/gate-contract.md §1](./contracts/gate-contract.md)）——**純函式**：對
  `TRACK_ORDER × 該 Track 課表全部 sessionIndex` 逐筆 `compile` → `render` → `checkBudget`，
  把「拋出的 Error」與「預算超限明細」一律轉成結構化 `GateViolation`。
- `scripts/validate.ts` 為唯一入口：載入來源（DAG / 題庫 / 課表 / Overlay）→ 先跑 F2 `validateCurriculum`
  → 再跑 `runContentGate` → 逐筆列印 → `process.exit(violations.length ? 1 : 0)`。
- **蒐集而非中止**：單筆 Lesson 的失敗以 try/catch 收攏成一筆 violation 後**繼續下一筆**（FR-024）。
- 違規排序沿用 F2/F3/F4 的 `cmpViolation` 風格：`track`（TRACK_ORDER 序）→ `sessionIndex` → `rule` → `subject`，
  使輸出與 CI log diff 穩定。

**Rationale**：與 F4 `validate-schedule.ts` 的分層完全一致（核心純函式 + 薄入口），
讓 Gate 可被單元測試直接呼叫，不需 spawn 子行程或攔截 `process.exit`。

---

## R10：預算檢查如何支援五種版面（`budgetSlots`）

**Decision**：`render(lesson)` 回傳 `RenderedMessage[]`，每則訊息為：

```ts
interface RenderedMessage {
  embeds: DiscordEmbed[];
  budgetSlots: BudgetSlots; // { digest?, tsTip?, pyTip?, exitCriteria?, takeaway?, pathFooter?,
                            //   overlayNotes?, problems?: string[] }
}
```
`budgetSlots` 的每個值 MUST 是**放進 embeds 的同一份字串實例**（同一個 `const`，非重新組裝的副本）。
`checkBudget(message)` 依 slot 檢查逐區塊預算，依 `embeds` 檢查結構性上限與總量——**仍是同一顆函式、
同一次呼叫**（F1 定案不變）。

**Rationale**：F1 現行實作以 `embeds[0]/[1]/[2]` 的**位置**與 `PROBLEM_BULLET` 的**反解析**定位預算區塊，
在只有一種版面時可行，擴到五種版面後位置假設必然破裂，而反解析的脆弱性 F1 自己已在註解中承認
（需靠共用常數避免單邊漂移）。改由 render 明確宣告 slot，可消除位置耦合與反解析，同時**不放棄
「量測的是實際會送出的字串」**——因為 slot 與 embeds 指向同一份字串實例。

**Alternatives considered**：`checkBudget(embeds, sessionType)` 內部依類型硬編位置（把版面知識複製進
budget，兩處必然漂移）；以 embed title 的 emoji 前綴識別（版面文案一改就靜默失效）。

---

## R11：第二則訊息 fallback 的確定性規則

**Decision**：
1. Renderer 先組出**單一** `RenderedMessage`（全部 embeds）。
2. 若其計數文字總和 > 5,500，則依 **embed 邊界**切分：由第一個 embed 起累加，把「加入後仍 ≤ 5,500」的
   embeds 留在第 1 則，其餘**原序**移入第 2 則。
3. 最多 2 則；若第 2 則仍 > 5,500，或**單一 embed 自身**已超過 5,500 ⇒ 不再切分，回報預算違規（fail loud）。
4. embeds 內部**不切分**（不拆 description、不拆 field），避免產生半句話的訊息。

**Rationale**：以 embed 為原子單位可保證版面完整、規則單純且與內容無關 ⇒ 確定性。§14.5 明言正常情況下
預算設計應使 fallback 不發生，故複雜度應壓到最低。

**Alternatives considered**：依 field 切分（會把主 Embed 拆成兩半，版面破碎）；自動截斷（§14.5 明文禁止）。

---

## R12：測試策略

**Decision**（對應憲章「測試優先」點名項目）：

| 測試面 | 作法 |
| --- | --- |
| Compiler determinism | 同一 `(track, sessionIndex)` 連續 compile 10 次，`JSON.stringify` 全等（SC-003） |
| 固定區塊解析 | fixture Article：缺 `Digest` / 缺 `Python Tip` / `Today's Challenge` 條目多、少、題號不符 / `id` 不符 ⇒ 各自具名錯誤 |
| Overlay 疊加不取代 | 同 Concept 三 Track 比對教材欄位全等；`Lesson.problems` 完全等於課表 `problemIds`（Compiler 未增刪，R6）；`extraNotesMarkdown` 進 `overlayNotes` 而不進 digest |
| path 推導 | 多 prerequisite / 多 next 的合成 DAG fixture，驗「最接近者」與 ordinal 決勝 |
| Renderer 純函式性 | 連續 render deep-equal；換 `track` 結構不變；**import 掃描**斷言 renderer 只 import 型別 |
| Discord 限制 | 超長 fixture 逐項觸發每一個預算項與每一個結構性上限；6,000 硬限有獨立斷言；拆訊息規則有專測 |
| 五種類型 | 每種類型至少一筆 compile + render 的快照式結構斷言 |
| Gate | 全 39 筆通過的 happy path；注入 3 筆不同成因的違規 ⇒ 一次全報、非零 exit、順序穩定 |
| 零 LLM | 擴充既有掃描測試，涵蓋 `src/compiler/gate.ts` / `overlay.ts` 與 `scripts/validate.ts` |

**Rationale**：沿用 F1–F4 既有測試風格（fixture 目錄 + `tests/helpers/`），不引入 snapshot 檔以外的新機制；
`render` 的結構斷言採**明確欄位比對**而非 vitest snapshot，避免「盲目更新快照」讓版面回歸失去把關力。
