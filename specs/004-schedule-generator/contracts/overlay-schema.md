# Contract: `overlays/{track}.json`

**Feature**: `004-schedule-generator` | 對齊 spec FR-008/009、§16.3、clarify Q4

Track Overlay：承載 Track 專屬加料而**不污染共用教材**（憲章 VI）。三檔：`overlays/foundation.json`、
`overlays/interview-ready.json`、`overlays/interview-mastery.json`。`zod` `.strict()` 驗證。人工維護、commit。

## 檔案形態

```jsonc
{
  "track": "foundation",
  "byConcept": {
    "array-traversal": {
      "extraProblemIds": [1],           // 附加題目（疊加於過濾結果之後，不取代）
      "extraNotesMarkdown": "…",        // 疊加註記（本 Feature 僅驗結構；F5 消費）
      "challengeDifficulty": "Easy"     // 覆寫該 Concept 的 challenge 難度
    }
  }
}
```

## 欄位

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `track` | `Track` | ✅ | MUST 等於檔名對應 Track |
| `byConcept` | `Record<conceptId, ConceptOverlay>` | ✅ | 可為 `{}`；每個 key MUST 為該 Track **已涵蓋**的 Concept |

### ConceptOverlay

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `extraProblemIds` | `number[]` | — | 每項 MUST 存在於 Problem Bank；附加、去重、穩定序 |
| `extraNotesMarkdown` | `string` | — | 疊加語意；本 Feature 僅驗型別 |
| `challengeDifficulty` | `"Easy"\|"Medium"\|"Hard"` | — | 覆寫該 Concept 的 challenge 難度；**本 Feature 僅驗型別/enum**，語意由 F5 消費（challenge 槽非 concept-bound），比照 `extraNotesMarkdown` |

## 疊加語意（MUST）

- `extraProblemIds` **附加於** Problem Bank 過濾結果**之後**，MUST NOT 取代 Core 題目（單元測試斷言 Core 仍在，SC-005）。
- `byConcept` 為 `{}` 或整檔缺席（空 Overlay）MUST 合法——課表照生成、無疊加。

## 違規對照

| 情形 | rule |
| --- | --- |
| 缺 `track`/`byConcept`、型別錯、未知欄位 | `schema-missing-field` / `schema-type` |
| `track` 與檔名不符 | `param-invalid` |
| `byConcept` key 非該 Track 涵蓋 Concept | `overlay-unknown-concept`（clarify Q4，fail loud） |
| `extraProblemIds` 含題庫不存在題號 | `dangling-problem` |

## stub 值（本 Feature）

三檔給最小示例（例：`foundation` 對 `array-traversal` 加一筆 `extraProblemIds`，其餘 `byConcept: {}`），以驗疊加路徑
與 `overlay-unknown-concept` / `dangling-problem` Gate。正文全量填充屬後續內容產線（Out of Scope）。
