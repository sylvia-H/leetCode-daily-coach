# Contract: `curriculum/track-params.json`

**Feature**: `004-schedule-generator` | 對齊 spec FR-002a / FR-014a / FR-015a、clarify Q1/Q2/Q5

Track 參數的唯一來源；`generate-schedule.ts` 的一等輸入。`zod` `.strict()` 驗證（`src/compiler/schedule-schema.ts`）。
人工維護、commit 進版控（**非生成物**）。

## 檔案形態

```jsonc
{
  "version": 1,
  "tracks": {
    "foundation":       { /* TrackParam */ },
    "interviewReady":   { /* TrackParam */ },
    "interviewMastery": { /* TrackParam */ }
  }
}
```

## TrackParam 欄位

| 欄位 | 型別 | 必填 | 規則 |
| --- | --- | --- | --- |
| `targetLevel` | `"easy"\|"medium"\|"hard"` | ✅ | 半年目標等級（→ `TrackSchedule.targetLevel`） |
| `maxLevel` | `number` | ✅ | 含；涵蓋 `module.level ≤ maxLevel` 的 Concept。MUST 落在 `modules.json` 宣告的 level 範圍內（**動態上界＝現存最大 module level**，非寫死；現行 `modules.json` 為 `0..15`）。超出 → `param-invalid` |
| `moduleAllowlist` | `string[]` | — | 提供時**取代** `maxLevel` 篩選；module id MUST 存在。跳號可能觸發 `coverage-gap` |
| `problemDifficulties` | `("Easy"\|"Medium"\|"Hard")[]` | ✅ | 非空；該 Track 難度帶（過濾 Problem Bank） |
| `challengeDifficulty` | `"Easy"\|"Medium"\|"Hard"` | ✅ | `challenge` 槽選題難度 |
| `rhythm` | `SessionType[]` | ✅ | `length === 7`；MUST 含 ≥1 `review` 與 ≥1 `rest` |

`.strict()`：未知欄位 → `schema-type`。缺必填 → `schema-missing-field`。值域/長度違反 → `param-invalid`。

## 違規對照

| 情形 | rule |
| --- | --- |
| 缺 `version`/`tracks`/任一 Track/必填欄位 | `schema-missing-field` |
| 型別錯、未知欄位、非法 enum | `schema-type` |
| `maxLevel` 超出 modules 範圍 | `param-invalid` |
| `rhythm.length !== 7` 或缺 review/rest | `param-invalid`（單一權威；不另設輸出級 `rhythm-missing-rest-review`） |
| `problemDifficulties` 為空 | `param-invalid` |
| `moduleAllowlist` 含不存在 module id | `param-invalid` |

## stub 值（本 Feature）

```json
{
  "version": 1,
  "tracks": {
    "foundation":       { "targetLevel": "easy",   "maxLevel": 1, "problemDifficulties": ["Easy"],            "challengeDifficulty": "Easy",   "rhythm": ["concept","concept","practice","review","challenge","concept","rest"] },
    "interviewReady":   { "targetLevel": "medium", "maxLevel": 1, "problemDifficulties": ["Easy","Medium"],   "challengeDifficulty": "Medium", "rhythm": ["concept","concept","practice","review","challenge","concept","rest"] },
    "interviewMastery": { "targetLevel": "hard",   "maxLevel": 1, "problemDifficulties": ["Medium","Hard"],   "challengeDifficulty": "Hard",   "rhythm": ["concept","concept","practice","review","challenge","concept","rest"] }
  }
}
```

> 三 Track 涵蓋同一批 stub Concept，以 `problemDifficulties` / `challengeDifficulty` / `targetLevel` 分歧展示 AC5。
> 涵蓋分歧（不同 `maxLevel`）於合成多-Level fixture 的單元測試驗證。正式全量值待 F7 課綱凍結。
