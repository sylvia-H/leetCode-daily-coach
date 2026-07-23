# Contract: Full Article 格式（`articles/**`）

**Feature**: `005-lesson-compiler` | **Supersedes**: `specs/001-walking-skeleton/contracts/article-format.md`
**權威來源**: `docs/spec.md` §10、§10.1、§10.3、§11

Full Article 是 **Compiler 的唯一教材輸入**（`concepts/**` 的 Skeleton 由產線消費，Compiler 不讀）。
本契約同時是 **F7 產線 Stage 2 的輸出規格**——生成端與消費端以此檔為唯一約定。

---

## §1 檔案結構

```
articles/{topic}/{NNN}-{slug}.md
```

路徑由 F2 `ConceptNode.articlePath` 推導（與 `concepts/{topic}/{NNN}-{slug}.md` 一一對應），
Compiler MUST NOT 自行拼路徑。

檔案內容依序為：

1. **（選配）單一前導 HTML 註解**——標示產出來源／階段。解析前剝除（沿用 F1/F2 的
   `stripLeadingComment`，MUST 容忍 BOM、多個註解與前導空白）。
2. **YAML frontmatter**（`---` 包夾）。
3. **二級標題（`##`）固定區塊**，順序不拘，名稱 MUST 完全相符（區分大小寫、不含前後空白）。

---

## §2 Frontmatter（Compiler 讀取的欄位）

| 欄位 | 型別 | 必要 | 用途 |
| --- | --- | --- | --- |
| `id` | string | ✅ | MUST 等於課表的 `conceptId`，否則 `article-id-mismatch` |
| `title` | string | ✅ | 主 Embed 標題與學習路徑標籤 |
| `module` | string | ✅ | Module 配色查表鍵 |
| `pattern_label` | string | ✅ | 主 Embed `Pattern` field（原樣帶入，MUST NOT 改寫） |
| `complexity_label` | string | ✅ | 主 Embed `複雜度` field |
| `estimated_minutes` | number | ✅ | 主 Embed `預估時間` field |
| `exit_criteria` | string[] | ✅ | 結尾 Embed checklist；SHOULD ≤6 條、每條 ≤60 字元 |

> frontmatter 的其餘欄位（`topic` / `difficulty` / `prerequisite` / `next` / `learning_goal` /
> `leetcode` / `tags`）是 **Concept Skeleton 的權威欄位**，由 F2 自 `concepts/**` 載入建 DAG。
> Article 可重複攜帶它們，但 **Compiler MUST NOT 由 Article 讀取這些欄位**——避免同一事實兩份副本。

**錯誤契約**：缺漏／空值 ⇒ 拋出**指名該欄位**的錯誤；宣告為陣列者拿到純量 ⇒ 指名該欄位的型別錯誤
（MUST NOT 讓純量一路穿到 Renderer 才以 `TypeError` 爆開）。

---

## §3 固定區塊（`##` 二級標題）

**閱讀用（不進 Discord，但 MUST 存在且非空）**：

`Concept`、`Thinking`、`Pattern Recognition`、`Common Mistakes`、`Complexity`、
`TypeScript Corner`、`Python Corner`、`Tomorrow Preview`

**推播用（進 `Lesson`）**：

| 區塊 | 進入 `Lesson` 的欄位 | 預算 |
| --- | --- | --- |
| `Digest` | `concept.digest` | ≤ 900 |
| `TypeScript Tip` | `concept.tsTip` | ≤ 450 |
| `Python Tip` | `concept.pyTip` | ≤ 450 |
| `Takeaway` | `concept.takeaway` | ≤ 120 |
| `Today's Challenge` | 逐題 `whyThisPattern` / `hint` | 每題 ≤ 350（含連結與難度） |

- 未列於上表的 `##` 區塊：**允許存在但被忽略**（不影響解析結果）。
- 區塊內容為該標題之後、下一個 `##` 之前的**原始 markdown**（`trim` 後）。

---

## §4 `Today's Challenge` 條目格式（本 Feature 定案）

```markdown
## Today's Challenge

- **167** · 陣列已排序、要找一組和 —— 左右指標一次掃完，不需額外雜湊表。
  - Hint: 想想總和與 target 的大小關係，該移動哪一個指標？
- **125** · 字串視為字元陣列，左右指標往中間夾，檢查兩端是否對稱。
```

**規則（MUST）**：

1. 每題一個**頂層 list item**，以 `**{leetcodeId}**` 開頭（`{leetcodeId}` 為十進位整數）。
2. 題號之後的文字即 `whyThisPattern`；解析時去除前導的 `·` / `-` / `—` 與空白，結果 MUST 非空。
3. `hint` 為該項目下的**巢狀 list item**，以 `Hint:`（或 `Hint：`）開頭；至多一則，選配。
4. **MUST NOT** 出現題目標題、URL、難度——三者由程式自 Problem Bank 帶入（`docs/spec.md` §5、§11）。
5. 同一 `problemId` **MUST NOT** 出現多次（`article-challenge-duplicate`）。
6. 條目集合以 `id` 為鍵；**條目順序不影響輸出**（Lesson 題序由課表 `problemIds` 決定）。

**與課表的對齊（MUST）**：對 `concept` 類 Session，課表 `problemIds` 的每個題號 MUST 在條目中找得到；
找不到 ⇒ `compile` fail loud（指名 track / sessionIndex / 題號）。條目**多於**課表題號者**不視為錯誤**
（Track 難度帶過濾後題數本就會少於 Concept 宣告的 `leetcode`）。

---

## §5 內容規範（§10.3、§11）

- 觀念本體（`Concept` / `Thinking` / `Pattern Recognition` / `Common Mistakes`）合計 SHOULD ≤ 2,000 中文字。
- 教學文字以**繁體中文**撰寫；技術術語 / Pattern 名稱 / API / 程式碼 MUST 保留英文。
- Corner 區塊的程式碼 MUST 可執行——由 **F7** 加入 `content-gate.yml` 實測（本 Feature 不檢查，spec FR-028）。
