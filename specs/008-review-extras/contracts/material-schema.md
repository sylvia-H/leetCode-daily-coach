# Contract: 素材檔格式與品質 Gate

**Feature**: 008-review-extras | **對象**：`data/reflection-bank.json`、`data/encouragement.json`

本契約釘死兩份凍結素材的**檔案格式**、**Gate 判準**與**失敗語意**。生成端（`scripts/generate-materials.ts`）、
Compiler（runtime）、CI Gate（`runContentGate`）三者 MUST 依同一份 schema 與同一組上限常數，
MUST NOT 各自實作（憲章 IX）。

---

## 1. 檔案格式

### 1.1 `data/reflection-bank.json`

```json
{
  "version": 1,
  "byTopic": {
    "programming-mindset": ["這週你最常在哪一步卡住？…", "…"],
    "array": ["…"]
  }
}
```

- `version`：固定 `1`。
- `byTopic`：key MUST 為 `curriculum/modules.json` 的 `topics[].id`；value 為字串陣列
  （每一則 MUST 為非空字串），**宣告序即輪替序**。
- **陣列本身 MAY 為空**：空集合是 spec FR-014 的降級路徑之一（⇒ Compiler 省略該欄位），
  schema MUST NOT 以 `min(1)` 擋下——否則 schema 與 FR-014 互斥。空集合由 §3 的
  `material-quota` 在 CI 擋下，不會進入正式推播。
- key 的排列 MUST 為 Module 宣告序 → Module 內 Topic 宣告序（canonical 序列化，
  同輸入 → byte-identical 輸出）。

### 1.2 `data/encouragement.json`

```json
{ "version": 1, "quotes": ["今天沒解出來不代表白費…", "…"] }
```

- `quotes`：字串陣列（每一則 MUST 為非空字串），**宣告序即輪替序**。
  **陣列本身 MAY 為空**（理由同 §1.1）；空池由 §3 的 `material-pool-size`（≥30）在 CI 擋下。

### 1.3 序列化

兩檔皆為 `JSON.stringify(obj, null, 2) + "\n"`。生成腳本 MUST 以此寫檔，使重跑
（在 LLM 輸出相同的前提下）產出 byte-identical 檔案。

---

## 2. 載入語意（`src/compiler/material.ts`，Compiler 與 Gate 共用）

| 情境 | 行為 |
| --- | --- |
| 檔案不存在 | 回傳 `undefined` ⇒ Compiler 省略對應欄位 ⇒ Renderer 省略對應段落；**流程 MUST NOT 失敗**（FR-014） |
| 檔案存在但非合法 JSON | **throw**（具名：`{label} 壞檔：{path}`） |
| 檔案存在但不符 schema | **throw**（具名，含 zod issue 路徑與訊息） |
| 檔案存在、schema 合法、但某 Topic 缺 key | 該 Session 省略 `reflectionQuestion`（runtime 降級）；由 Gate 的 `material-quota` 擋下，不會進到正式推播 |

「壞檔 MUST NOT 降級為缺席」是 F5 已定案的語意（`loadOptionalMaterial`）：一個打錯字的 JSON
若被當成「缺席」，整個段落會無聲消失。本 Feature **沿用不改**。

---

## 3. Gate 判準（`checkMaterials()`）

純函式，輸入 `{ reflectionBank?, encouragement?, schedules, graph }`，輸出具名違規陣列。
素材**缺席時回傳空陣列**（缺席合法）；素材存在時逐項檢查。

**回傳型別 MUST 具名到 rule 層級，MUST NOT 只把 rule 名稱寫進 `message`**（權威型別落點
`src/compiler/material.ts`，見 data-model.md §1.1）：

```ts
export type MaterialViolationRule =
  | "material-schema"              // ★ 由載入層 throw 實現，見下方註記
  | "material-unknown-topic"
  | "material-budget"
  | "material-traditional-chinese"
  | "material-duplicate"
  | "material-pool-size"
  | "material-progress-coupled"
  | "material-quota";

export interface MaterialViolation {
  rule: MaterialViolationRule;
  /** 素材座標：`reflection-bank:{topicId}[{i}]` 或 `encouragement[{i}]`。 */
  subject: string;
  message: string;
}

export function checkMaterials(input: {
  reflectionBank?: ReflectionBank;
  encouragement?: EncouragementPool;
  schedules: Record<Track, TrackSchedule>;
  graph: CurriculumGraph;
}): MaterialViolation[];
```

**理由**：SC-007 要求「8 個 rule MUST 全數有對應驗證」。rule 名稱若只存在於文件表格與 `message`
字串，測試只能做子字串比對——改一次訊息措辭就會讓驗證靜默失效，而 SC-007 恰恰是要防止漏放。

**映射進 `GateViolation`**（data-model.md §8）：`rule` 固定為 `material-invalid`，
`subject` MUST 為 `` `${v.rule}@${v.subject}` ``（例：`material-budget@reflection-bank:array[3]`），
`message` 沿用 `v.message`。**Gate 層不新增 8 個 `GateRule`**——素材違規對 Gate 的意義一致
（擋下、非零 exit code），細分留在 `MaterialViolationRule`。

> **本表是「判準⇄具名 rule」的單一基準（8 個 rule）**：spec FR-028 的條目、SC-007 的驗收範圍、
> quickstart §6 的樣本表與 tasks 的測試任務一律以此表的 **rule 名稱**對齊，
> MUST NOT 以「N 類 / N 項」互相指稱——條目數（7）、rule 數（8）與人工樣本數（6）本就不同，
> 用數字對照必然對不上，且對不上時無從分辨是漏了檢查還是只是數法有別。

| # | rule | 對象 | 判準 | 依據 |
| --- | --- | --- | --- | --- |
| 1 | `material-schema` | 兩者 | zod strict 解析失敗 —— **由 §2 的載入層 `throw` 實現，不是 `checkMaterials()` 的輸出**（見下方註記） | FR-028 |
| 2 | `material-unknown-topic` | Reflection | `byTopic` 的 key 不存在於 `graph.topics` | FR-002 |
| 3 | `material-budget` | 兩者 | 單則 code point 長度 > `MATERIAL_BUDGET_LIMITS[slot]`（300 / 200） | FR-004 / FR-008 / FR-029 |
| 4 | `material-traditional-chinese` | 兩者 | `checkTraditionalChinese(text)` 有任一違規 | FR-004 / FR-008 |
| 5 | `material-duplicate` | 兩者 | 完全相同的字串出現 ≥2 次（Reflection 為**跨 Topic 全庫**比對） | FR-005 / FR-009 |
| 6 | `material-pool-size` | Encouragement | `quotes.length < 30` | FR-007 |
| 7 | `material-progress-coupled` | Encouragement | 命中 `http(s)://`／markdown 連結／`LeetCode`（不分大小寫）／`#\d+` | FR-008 |
| 8 | `material-quota` | Reflection | 某 Topic 的則數 < 該 Topic 在三份課表中依 §4 歸屬規則被選中的最大次數 | FR-003a |

> **`material-schema` 的實現機制（MUST 照此理解，否則會寫出走不到的分支）**：`checkMaterials()`
> 收到的是**已由 §2 載入層解析並通過 zod strict 的** `ReflectionBank` / `EncouragementPool`，
> 型別上不可能觀察到 schema 違規。故本 rule **MUST 由載入層 `throw` 實現**（沿用 F5
> `loadOptionalMaterial` 的「壞檔即 fail loud」語意，本 Feature 不改），`checkMaterials()`
> **MUST NOT** 為它保留一個永遠不成立的檢查分支。它仍列於本表，是因為 SC-007 的驗收範圍以
> rule 名稱界定；其驗證形態為**單元測試對載入層的 throw 斷言**（tasks T031），
> 而非 quickstart §6 的人工植入樣本。

**違規訊息 MUST 指名根因**：哪一份素材、哪一個 Topic、第幾則、實際值 / 上限。
`material-quota` 的訊息 MUST 同時給出「需要幾則、實際幾則、哪一個 Track 造成該最大值」。

**MUST NOT 自動截斷**：任一項不通過即擋下（生成期觸發重生、CI 期以非零 exit code 結束）。

### 3.1 配額計算（`material-quota`）

```
for each track in TRACKS:
  for each review session (依 sessionIndex 升冪):
    topicId = resolveReviewTopic(session)        // 見 review-selection.md §2
    count[track][topicId] += 1
requiredQuota[topicId] = max over track of count[track][topicId]
```

Topic 未在任何課表的 review 中出現 ⇒ `requiredQuota = 0` ⇒ 該 Topic 即使沒有任何問題也合法
（但生成端仍會為每個 Topic 產 6 則）。

---

## 4. 預算常數的單一來源

```ts
// src/renderer/budget.ts
export const MATERIAL_BUDGET_LIMITS = {
  reflectionQuestion: 300,
  encouragement: 200,
} as const;
```

`checkBudget`（render 後）、`checkMaterials`（素材層）、生成腳本的 per-batch 檢查
**MUST 全部 import 此常數**，MUST NOT 出現第二處字面值（FR-029）。

---

## 5. 生成端契約（`scripts/generate-materials.ts`）

### 5.1 CLI

```
npm run generate:materials -- [--force] [--only <topicId|encouragement>,...] [--stage reflection|encouragement]
```

- `--force`：唯一覆蓋冪等的路徑（§20.4）。
- `--only`：逗號分隔的批次 key（Topic id，或字面值 `encouragement`）。
- `--stage`：只跑其中一個階段；省略即兩階段都跑。
- **缺 `GEMINI_API_KEY` MUST fail-fast**（`createLlmClient` 建構期即拋），且**不寫任何檔案**。

### 5.2 批次流程

```
Stage A（Reflection，逐 Topic 一批）
  for each topic in modules.json 宣告序:
    if shouldSkipBatch(...) → continue
    for attempt in 1..3:
      draft = LLM(buildReflectionPrompt(topic, 6 則), responseSchema)   // 結構化輸出
      f = perBatchGate(draft)        // schema / 預算 / 繁中 / 批內去重 / 則數 == 6
      if f → retryFeedback = f.reason; continue
      f = selfCheck(draft)           // rubric 恰兩項，見 §5.3
      if f → retryFeedback = f.reason; continue
      → 通過，寫入 byTopic[topic.id]，checkpoint 標記 frozen/gatePassed
    3 次皆不過 → 標記 needsHumanReview，**不寫入該 Topic**，繼續下一個 Topic

Stage B（Encouragement，單批 36 則）
  同上，但 **不跑 self-check**（FR-028b）

批次末：loadCompilerDeps() → runContentGate()（含 checkMaterials 的全庫配額檢查）
若有任一 needsHumanReview 或批次末違規 → 非零 exit code
```

### 5.3 self-check rubric（**恰兩項**，FR-028a）

1. 本批問題中是否有任兩則在問同一件事（僅措辭不同）？
2. 是否有任一則可用單一字詞或「是／否」回答？

**MUST NOT 納入「切題性」判準**（問題本依該 Topic 生成，離題風險低，且該項最主觀、最易誤退）。
回應契約沿用 F7 的 `SelfCheckResponse`：`{ "confident": boolean, "issues": string[] }`，
`confident === false` 或 `issues` 非空 ⇒ 觸發重生。
解析沿用 `parseSelfCheckResponse`（搬至 `scripts/lib/prompts/self-check.ts`），
解析失敗語意上等同「這次審稿不可信」⇒ 算一次重生，MUST NOT 讓整批以 unhandled rejection 中止。

### 5.4 冪等與續跑

- `.cache/material-manifest.json`（data-model.md §9）；跳過條件見同節。
- 中斷後重跑 MUST 從缺漏的批次繼續，**已通過 Gate 的批次零重複 LLM 呼叫**（SC-008）。
- manifest 遺失／損毀 ⇒ 由現存素材檔反推重建（既有批次視為已凍結且過 Gate），
  MUST NOT 降級為空 manifest 後覆蓋全部素材。

### 5.5 邊界

- 生成腳本 MUST NOT 寫入 `concepts/**`、`articles/**`、`schedules/**`、`curriculum/**`（FR-027 / SC-009）。
- `@google/genai` 只出現在 `scripts/` 依賴路徑（憲章 VIII，`tests/unit/no-llm-in-src.test.ts` 守）。
- `daily.yml` MUST NOT 含 `GEMINI_API_KEY`（FR-031，`tests/unit/daily-no-llm-key.test.ts` 守）。
