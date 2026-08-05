# Quickstart: Problem Bank 驗證與查找

本檔為 F3 的**可執行驗收指引**（非實作碼）。細節見 [data-model.md](./data-model.md) 與
[contracts/](./contracts/)。環境：Windows / PowerShell、Node 24、`npm ci` 已完成。

## 前置

```powershell
npm ci
npm run build   # tsc 型別檢查通過（strict）
```

## 驗收 1：CI 驗證入口（US1 + US3 + US4 + FR-009）

```powershell
npm run validate:problem-bank
```

**預期**：
- 印出「摘要：N 個 Problem、M 個 Concept、0 個 error、K 個 warning」。
- leetcode 存在性檢查**不再**列為 `skipped`（由 `deferred-to-F3` 轉為實際執行；SC-005）。
- 全數通過 → `✓ 驗證通過`、exit code 0。
- 難度覆蓋（Hard 缺）如以 warning 呈現屬預期（seed 階段，FR-011）。

## 驗收 2：單元測試（全部 Gate + 查找）

```powershell
npm test
```

**預期關鍵測試**（皆綠；SC-004 每一種違規類型皆覆蓋）：

| 測試檔 | 覆蓋 |
| --- | --- |
| `problem-bank-validate.test.ts` | 缺必填、型別錯、`difficulty`/`review_priority` 值域、`key ≠ id`、`patterns` 空、`dangling-pattern`、`slug-url-mismatch`、`bank-load`（檔缺/壞 JSON） |
| `problem-lookup.test.ts` | 前向：正常 1~3 同序回傳；`leetcode: []` 回空不報錯；`>3` 與 `unknown-leetcode` fail loud 指名。反向：升冪 determinism。 |
| `leetcode-existence.test.ts` | `makeProblemExists` 注入 `validateCurriculum` → skipped 轉實際執行、既有 stub concept 全通過（SC-005） |
| `zero-llm.test.ts`（既有補斷言） | 全樹掃描含 `src/compiler/problem.ts` 且不含 `@google/genai`（FR-012；不另立第二份掃描檔） |

## 驗收 3：確定性（SC-007）

```powershell
npm run validate:problem-bank ; npm run validate:problem-bank   # 兩次輸出一致
```

**預期**：兩次違規清單與摘要 byte 級一致；反向查找結果順序穩定（升冪 id）。

## 驗收 4：手動注入非法題庫（fail loud 展示）

暫時把某題 `difficulty` 改成 `"easy"`（小寫）或讓某 `url` 的 slug 與 `slug` 不符，執行
`npm run validate:problem-bank`：

**預期**：印出 `[error] difficulty-range …` 或 `[error] slug-url-mismatch …`，**指名該題號與欄位**，
exit code 非零。復原後回到 0。

## 對應 User Story ↔ 驗收

| User Story | 驗收步驟 |
| --- | --- |
| US1（逐題 schema 驗證） | 驗收 1、驗收 2（`problem-bank-validate`）、驗收 4 |
| US2（前向查找 + 題數守門，含空題合法） | 驗收 2（`problem-lookup` 前向）、驗收 1（走訪各 Concept） |
| US3（反查 pattern + 參照完整） | 驗收 2（`problem-lookup` 反向、`dangling-pattern`）、驗收 3 |
| US4（url ↔ slug 一致） | 驗收 2（`slug-url-mismatch`）、驗收 4 |
| FR-009（problemExists 落地） | 驗收 1、驗收 2（`leetcode-existence`） |
