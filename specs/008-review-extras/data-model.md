# Phase 1 Data Model: 008-review-extras

**Branch**: `008-review-extras` | **Date**: 2026-08-01

本檔定義本 Feature 新增／變更的資料實體、欄位與不變式。**既有實體只列出被變更的部分**，
未提及者一律不變。型別的權威落點見各節標示的檔案路徑。

---

## 1. `ReflectionBank`（新增凍結產物 `data/reflection-bank.json`）

**權威型別**：`src/compiler/material.ts`

```ts
export interface ReflectionBank {
  version: 1;
  /** key = curriculum/modules.json 的 topics[].id；value = 該 Topic 的反思問題（宣告序即輪替序）。 */
  byTopic: Record<string, string[]>;
}
```

**序列化規則（canonical）**：2-space 縮排、檔尾 `\n`、`byTopic` 的 key **依 `modules.json` 的
Module 宣告序 → Module 內 Topic 宣告序**排列（不用字典序，與課表的 `ordinalOf` 全序同向）。

| 不變式 | 判準 | 違規 rule | 來源 |
| --- | --- | --- | --- |
| schema 合法 | zod strict：`version === 1`、`byTopic` 為 `Record<string, string[]>`、每則非空字串 | `material-schema` | FR-028 |
| Topic 存在 | 每個 key MUST 存在於 `graph.topics` | `material-unknown-topic` | FR-002 |
| 單則預算 | 每則 ≤ `MATERIAL_BUDGET_LIMITS.reflectionQuestion`（300，code point 計） | `material-budget` | FR-004 |
| 繁中判準 | `checkTraditionalChinese` 無違規（無簡體字、CJK 佔比達門檻、無俚語） | `material-traditional-chinese` | FR-004 |
| 無重複 | **全庫**（跨 Topic）無完全相同的問題文字 | `material-duplicate` | FR-005 |
| 配額充足 | 每個 Topic 的則數 ≥ 該 Topic 在**三份課表**中依 FR-011 被選中的最大次數 | `material-quota` | FR-003a |

- **生成目標**：每 Topic **6 則**（16 Topic ⇒ 96 則）。生成端固定則數，**MUST NOT 讀課表反推配額**。
- **缺席語意（FR-014 的三種降級情境）**：(1) 整檔缺席 ⇒ `deps.reflectionBank === undefined` ⇒ 省略
  `reflectionQuestion`；(2) 檔在但某 Topic 的陣列為**空集合** ⇒ 同樣省略（故 schema MUST 允許空陣列，
  MUST NOT 用 `min(1)`，否則與 FR-014 互斥）；(3) 檔在但**缺某個 Topic 的 key** ⇒ 亦省略。
  三者皆為 runtime 降級路徑，且皆由 `material-quota` 在 Gate 擋下，不會進到正式推播。
- **檔在但壞檔／不符 schema ⇒ fail loud**（沿用 F5 `loadOptionalMaterial` 的既有語意，
  MUST NOT 降級為「缺席」）。

### 1.1 `MaterialViolation`（`checkMaterials()` 的回傳型別）

**權威型別**：`src/compiler/material.ts`。上表與 §2 的 `違規 rule` 欄位 MUST 具名到型別層級，
MUST NOT 只把 rule 名稱寫進 `message`——SC-007 要求 8 個 rule 全數有對應驗證，而字串比對會在
訊息措辭一改時靜默失效。

```ts
export type MaterialViolationRule =
  | "material-schema"              // ★ 由載入層 throw 實現，非本函式輸出（contracts §3 註記）
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
```

---

## 2. `EncouragementPool`（新增凍結產物 `data/encouragement.json`）

**權威型別**：`src/compiler/material.ts`

```ts
export interface EncouragementPool {
  version: 1;
  /** 宣告序即輪替序。 */
  quotes: string[];
}
```

| 不變式 | 判準 | 違規 rule | 來源 |
| --- | --- | --- | --- |
| schema 合法 | zod strict：`version === 1`、`quotes` 為 `string[]`、每則為非空字串（**陣列本身 MAY 為空**，見 §1 說明） | `material-schema` | FR-028 |
| 池規模 | `quotes.length >= 30` | `material-pool-size` | FR-007 |
| 單則預算 | 每則 ≤ `MATERIAL_BUDGET_LIMITS.encouragement`（200，code point 計） | `material-budget` | FR-008 |
| 繁中判準 | `checkTraditionalChinese` 無違規 | `material-traditional-chinese` | FR-008 |
| 無重複 | 無完全相同的語錄文字 | `material-duplicate` | FR-009 |
| 與進度無關 | 不含 `http(s)://`、markdown 連結、`LeetCode`（不分大小寫）、`#數字` 題號樣式 | `material-progress-coupled` | FR-008 / research R13 |

- **生成目標**：**36 則**（門檻 30 + 20% 損耗餘裕，research R12）。
- **缺席語意**：同 §1（缺席即省略、壞檔即 fail loud）。

---

## 3. `Lesson` 型別變更（`src/types/lesson.ts`）

```diff
 export interface ReviewLesson extends LessonBase {
   type: "review";
   reviewConcepts: ReviewConcept[];
   reflectionQuestion?: string;
+  /** F8 素材：掛載於 review（rest 槽移除後 encouragement 的消費者）；缺席即省略。 */
+  encouragement?: string;
 }
```

- `RestLesson.encouragement` **保留不刪**（FR-014c）：`rest` 維持為受支援的 Session 類型，
  「是否排休息日」仍是 `track-params.json` 的參數選擇。
- `BudgetSlots` 兩個欄位（`reflectionQuestion` / `encouragement`）**已於 F5 就位，不變更**。
- `SessionType` **不變**（仍含 `"rest"`）。

---

## 4. `CompilerDeps` 型別收斂（`src/compiler/lesson.ts`）

```diff
-  reflectionBank?: unknown;
-  encouragement?: unknown;
+  reflectionBank?: ReflectionBank;
+  encouragement?: EncouragementPool;
```

F5 的最小骨架 schema（`REFLECTION_BANK_SHAPE` / `ENCOURAGEMENT_SHAPE`）由 `material.ts` 的完整
schema 取代。載入行為（缺席 ⇒ `undefined`；存在但不合法 ⇒ throw）**維持不變**。

---

## 5. `TrackParam.rhythm` 值變更（`curriculum/track-params.json`）

```diff
-  "foundation":        ["concept","concept","practice","concept","challenge","review","rest"]
+  "foundation":        ["concept","concept","practice","concept","challenge","review"]
-  "interviewReady":    ["concept","concept","concept","concept","challenge","review","rest"]
+  "interviewReady":    ["concept","concept","concept","concept","challenge","review"]
-  "interviewMastery":  ["concept","concept","concept","concept","challenge","review","rest"]
+  "interviewMastery":  ["concept","concept","concept","concept","challenge","review"]
```

其餘欄位（`targetLevel` / `maxLevel` / `problemDifficulties` / `challengeDifficulty`）
**MUST 維持 F7 定案值不變**（FR-014a）。

**schema 變更**（`src/compiler/schedule-schema.ts`）：

| 項目 | 變更前 | 變更後 |
| --- | --- | --- |
| 陣列長度 | `.length(7)` | `.min(2).max(14)`（research R1） |
| `validateRhythm` 必要槽 | `review` **與** `rest` | `review`（`rest` 檢查移除） |
| 其餘三條順序約束 | — | **全部保留，不變** |

---

## 6. `SessionPlan` 的 `problemIds` 語意擴張（`src/types/schedule.ts`）

欄位型別不變，**允許出現的 Session 類型**由 `concept / practice / challenge` 擴張為
**`concept / practice / challenge / review`**。

| 不變式 | 判準 | 來源 |
| --- | --- | --- |
| review 題數 | `review` 的 `problemIds` 長度 MUST 為 **1**（候選池非空）或**省略**（候選池為空） | FR-020 |
| 既有兜底 | `session-problem-overflow`（≤3）照常適用於全部類型 | §13.4 |
| 空槽不存在 | 三份課表中 **`problemIds` 為空的 `practice` / `challenge` Session 數 MUST 為 0** | FR-014e / SC-012 |

---

## 7. `ScheduleViolationRule` 新增（`src/types/schedule.ts`）

| rule | severity | 語意 |
| --- | --- | --- |
| `practice-no-problem` | warning | `practice` 槽算出空 `problemIds` ⇒ **跳過該槽**（不產生 Session、不消耗 `sessionIndex`） |
| `review-no-problem` | warning | `review` 槽的候選池為空（該週涵蓋的 Concept 全部無題）⇒ 產生無 Challenge 段的 review |
| `review-challenge-duplicate` | warning | 排除同週 challenge 題號後候選池變空 ⇒ 退回原池，review 與 challenge 同題（research R4） |

**既有 rule 語意調整**：`challenge-no-problem` 的訊息由「將產出無題目的挑戰日」改為
「已跳過該槽」；rule id 與 severity 不變（FR-014g）。

**subject 格式**：`practice-no-problem` / `challenge-no-problem` 的 `subject` MUST 為
`{track}:week-{weekNumber}-slot-{slotPosition}`（1-based），MUST NOT 使用 `session-{n}`
——被跳過的槽不消耗 `sessionIndex`，該 index 屬於別的 Session（research R2）。
`review-no-problem` / `review-challenge-duplicate` 指向真實存在的 review Session，
沿用 `{track}:session-{sessionIndex}`。

---

## 8. `GateRule` 新增（`src/compiler/gate.ts`）

| rule | 語意 |
| --- | --- |
| `material-invalid` | `checkMaterials()` 回報的任一素材違規（§1 / §2 的全部判準） |

**`GateRule` 只新增這一個**：素材違規對 Gate 的意義一致（擋下、非零 exit code），
細分留在 §1.1 的 `MaterialViolationRule`。

**`MaterialViolation` → `GateViolation` 的映射（MUST）**：

| `GateViolation` 欄位 | 值 |
| --- | --- |
| `rule` | 固定 `"material-invalid"` |
| `subject` | `` `${v.rule}@${v.subject}` ``（例：`material-budget@reflection-bank:array[3]`） |
| `message` | 沿用 `v.message`（MUST 指名根因） |
| `track` / `sessionIndex` | 留空（素材為全域產物，不屬於任一 Track 的任一 Session） |

`subject` 帶上 rule 名稱前綴，是為了讓 SC-007 的「8 個 rule 全數具名攔截」可用**欄位比對**驗證
而非子字串比對（§1.1 的理由）。

---

## 9. `MaterialManifest`（新增快取 `.cache/material-manifest.json`）

**權威型別**：`scripts/lib/material-checkpoint.ts`。**加速快取、非真實來源**（同 F7 的
`content-manifest.json`）：遺失可由現存素材檔重建。

```ts
export interface MaterialBatchCheckpoint {
  inputHash: string;      // 該批生成輸入的 sha256（topicId + title + prompt 版本常數）
  frozen: boolean;        // 已寫入素材檔
  gatePassed: boolean;    // 通過 per-batch 機械 Gate（+ Reflection 的 self-check）
  needsHumanReview: boolean;
  regenCount: number;
}
export interface MaterialManifest {
  version: 1;
  /** key = topicId，或固定值 "encouragement"。 */
  batches: Record<string, MaterialBatchCheckpoint>;
}
```

跳過條件（沿用 `shouldSkip` 語意）：`--force` ⇒ 不跳；否則須
「該批已存在於素材檔 **且** `inputHash` 相符 **且** `frozen && gatePassed`」。

---

## 10. 新增／變更檔案一覽

| 路徑 | 動作 | 說明 |
| --- | --- | --- |
| `data/reflection-bank.json` | 新增（凍結產物） | §1 |
| `data/encouragement.json` | 新增（凍結產物） | §2 |
| `src/compiler/material.ts` | 新增 | schema + 選取純函式 + `checkMaterials` |
| `src/compiler/lesson.ts` | 變更 | 改用完整 schema；`compileReview` 填入兩個素材欄位 |
| `src/compiler/gate.ts` | 變更 | 新增 `material-invalid`，開頭呼叫 `checkMaterials` |
| `src/compiler/schedule-generator.ts` | 變更 | 跳過無題槽、review 選題、warning subject |
| `src/compiler/schedule-schema.ts` | 變更 | rhythm 長度與 `rest` 必要性 |
| `src/renderer/budget.ts` | 變更 | 抽出 `MATERIAL_BUDGET_LIMITS` |
| `src/renderer/discord.ts` | 變更 | review 版面補 `💬 一句話` 段（最後） |
| `src/types/lesson.ts` | 變更 | `ReviewLesson.encouragement` |
| `src/types/schedule.ts` | 變更 | 三個新 rule；`rhythm` 註解 |
| `curriculum/track-params.json` | 變更 | 三軌 rhythm 移除 `rest` |
| `schedules/*.json`（×3） | 重生成 | 198 / 200 / 243 Session |
| `scripts/generate-materials.ts` | 新增 | 素材產線入口 |
| `scripts/lib/prompts/reflection-bank.ts` | 新增 | Reflection 生成 prompt + response schema |
| `scripts/lib/prompts/encouragement.ts` | 新增 | 語錄生成 prompt + response schema |
| `scripts/lib/prompts/self-check.ts` | 變更 | 移入 `stripJsonFence` / `parseSelfCheckResponse`；新增 Reflection rubric |
| `scripts/lib/material-checkpoint.ts` | 新增 | §9 |
| `scripts/lib/checkpoint.ts` | 變更 | 匯出原子寫入／讀檔 helper 供復用（行為不變） |
| `scripts/generate-content.ts` | 變更 | 改 import 搬移後的 self-check helper（re-export 維持相容） |
| `package.json` | 變更 | 新增 `generate:materials` script |
| `.github/workflows/content.yml` | 變更 | `stage` choice 新增 `materials` |
