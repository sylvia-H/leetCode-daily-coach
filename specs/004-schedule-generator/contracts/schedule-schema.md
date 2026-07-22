# Contract: `schedules/{track}.json`（生成物）

**Feature**: `004-schedule-generator` | 對齊 spec §16.2、FR-003/004/011~013、clarify Q3

由 `scripts/generate-schedule.ts` **確定性生成**、commit 後凍結。**MUST NOT 手寫 / 手改**（CI determinism drift gate
守門，R10）。三檔：`foundation.json`、`interview-ready.json`、`interview-mastery.json`。

## 檔案形態

```jsonc
{
  "track": "foundation",
  "targetLevel": "easy",
  "sessions": [
    { "sessionIndex": 1, "type": "concept", "conceptId": "time-space-complexity" },
    { "sessionIndex": 2, "type": "concept", "conceptId": "reading-the-problem" },
    { "sessionIndex": 3, "type": "practice", "problemIds": [1, 26] },
    { "sessionIndex": 4, "type": "review", "reviewRange": [1, 3] },
    { "sessionIndex": 5, "type": "challenge", "problemIds": [26] },
    { "sessionIndex": 6, "type": "concept", "conceptId": "array-traversal", "problemIds": [1, 26] },
    { "sessionIndex": 7, "type": "rest" }
  ]
}
```

> 上為結構示意（實際 sessions 由 stub DAG + rhythm 攤出，長度隨涵蓋 Concept 自然收尾）。

## 欄位序（canonical，byte-identical 關鍵，R2）

- 根：`track → targetLevel → sessions`
- SessionPlan：`sessionIndex → type → conceptId? → reviewRange? → problemIds?`
- 缺省 optional 欄位**省略**（不輸出 `null`）；空 `problemIds` 省略。
- `JSON.stringify(obj, null, 2)` + 檔尾 `\n`；UTF-8 無 BOM、LF。

## 不變式（MUST；生成器內建 Gate 驗證，違反不寫檔）

| 不變式 | rule（違反時） |
| --- | --- |
| `concept` Session 出現序為 DAG canonical `topoOrder` 子序列 | `forward-dependency` |
| `concept` Session 恰引入一個新 Concept | `one-concept-violation` |
| 同一 `conceptId` 至多一個 `concept` Session | `duplicate-concept` |
| `conceptId` 存在於 DAG | `dangling-concept` |
| `problemIds` 皆存在於 Problem Bank | `dangling-problem` |
| `review` 的 `reviewRange = [weekStart, reviewIndex-1]`、不越界不錯週 | `review-range-invalid` |
| 同輸入 → byte-identical | `determinism-drift`（CI 比對） |

> 「每週含 ≥1 review 與 ≥1 rest」由**輸入端** `rhythm` 模板的 zod 驗證保證（`param-invalid`：長度 7 且含 review+rest），
> 加上確定性攤課即成立；不另設輸出級 `rhythm-missing-rest-review` 規則（避免與 `param-invalid` 雙重歸類，且自然收尾的
> 末尾 partial week 本就可能不含 review/rest）。

## 長度語意（clarify Q3 / FR-011/019）

課表長度 = 涵蓋 Concept + rhythm **自然攤出**，於最後一個 Concept 所在週的節奏走完處收尾；**不填充湊滿 180**。stub
規模下三檔皆為短課表（預期，非錯誤）。
