# Quickstart & Validation Guide: Curriculum Schema（F2）

驗證 F2 交付「Curriculum 骨架 + Concept schema + DAG 驗證」是否端到端可運作。所有指令於 repo 根目錄執行
（Windows / PowerShell 或 CI Ubuntu 皆可）。**本 Feature 無外部服務、無機密、零 LLM。**

## 前置

```powershell
npm ci        # 安裝相依（含新增的 zod 與 devDep tsx）
npm run build # tsc 編譯 src/**（scripts/ 由 tsx 執行，不進 dist）
```

## 主要驗收路徑

### 1. 單元測試全綠（涵蓋 AC1 / SC-001～007）

```powershell
npm test
```

**預期**：`tests/unit/**` 全數通過。關鍵檔對應：
- `schema.test.ts` → SC-003（frontmatter / modules.json 逐類非法具名報錯）。
- `dag-validate.test.ts` → SC-001 / SC-002（合法通過；環 / 前向依賴 / 懸空參照 / 孤兒 / 自我依賴 / 重複邊各自報錯）。
- `topo-order.test.ts` → SC-005（拓樸序可線性化且重複 100 次逐次一致）。
- `granularity-gate.test.ts` → SC-004（上/下限、唯一性、stub/full 模式）。
- `leetcode-pluggable.test.ts` → SC-006 / FR-023（無題庫時存在性列 `skipped`、格式仍驗）。
- `stub-curriculum.test.ts` → US4（交付的真實 stub 課程整條綠燈）。

### 2. 對真實 stub 課程執行驗證入口（FR-028）

```powershell
npm run validate:curriculum
```

**預期**：讀 `curriculum/modules.json` + `concepts/**`，以 `mode:'stub'` 驗證 → 印出 `0 error`、
列出 `skipped: leetcode existence (deferred-to-F3)` → **exit code 0**。

## 逐類失敗情境（fail loud 驗證）

以 `tests/fixtures/curriculum/**` 的缺陷素材驅動（單元測試已涵蓋；亦可手動指向入口驗證）。每一類 MUST
**驗證失敗**且錯誤訊息**指名**違規主體 / 欄位 / 規則（見 [contracts/curriculum-validation-contract.md](./contracts/curriculum-validation-contract.md)）：

| 情境 | fixture | 預期 rule |
|---|---|---|
| 缺必要欄位（如缺 `pattern_label`） | `bad-frontmatter/` | `schema-missing-field` |
| 值域錯（`difficulty: hard`） | `bad-frontmatter/` | `schema-type` |
| `id` 非 kebab-case | `bad-frontmatter/` | `schema-id-format` |
| `leetcode` 非正整數陣列 | `bad-frontmatter/` | `leetcode-format` |
| 懸空 `prerequisite`/`next`/`module`/`topic` | `dangling-ref/` | `dangling-ref`（**僅由 `validateCurriculum` 產出**，FR-013） |
| `topic` 與所在資料夾名不符 | `dangling-ref/` | `dangling-ref`（`target` = 實際資料夾名） |
| 成環 / 自我依賴 | `cycle/` | `cycle` / `self-dependency` |
| 前向依賴（prerequisite 指向宣告序晚於自己） | `forward-dep/` | `forward-dependency` |
| 孤兒（非合法起點、無前人、不被 next 提及） | `orphan/` | `orphan` |
| `next`/`prerequisite` 單向宣告 | `edge-inconsistency/` | `edge-inconsistency` |
| 重複 `id` | `dup-id/` | `duplicate-id` |
| Topic/Module 數超上限 | `granularity/` | `granularity-range` |
| **空課程（0 個 Concept）** | `empty/` | `empty-curriculum`（兩模式皆 error） |
| **`concepts/` 目錄不存在** | `empty/` | `empty-curriculum`（同類別，`message` 區分「目錄不存在」） |
| 骨架結構錯誤（`modules` 長度非 16 / `level` ≠ 索引 / module 無 topic / `title` 空） | `skeleton-shape/` | `skeleton-shape`（**不受 `mode` 影響**，非 `granularity-range`） |

**MUST 通過（不得誤報）的對照組**：

| 情境 | fixture | 預期 |
|---|---|---|
| 同一 Concept 重複依賴邊 | `duplicate-edge/` | `duplicate-edge`（**warning**）；`ok` 仍為 `true` |
| Topic 恰 5 / 恰 12、Module 恰 10 / 恰 30（閉區間端點） | `granularity/` | **0 個 `granularity-range`** |
| Level 0 各 Topic 的首個 Concept 無 `prerequisite` | `valid/` | **不判 `orphan`**（合法起點，FR-016） |
| `module.id` 與其主 `topic.id` 同名（如 `array`） | `valid/` | **不判 `duplicate-id`**（FR-002） |

## 確定性檢查（SC-005）

`topo-order.test.ts` 對同一 stub 課程重複驗證 100 次，斷言 `violations` 排序與 `topoOrder` 逐次逐字元一致。

## 完成準則（Definition of Done 對照）

- [ ] `curriculum/modules.json` 定稿完整 16-Level Module→Topic 骨架（Deterministic）。
- [ ] `conceptFrontmatterSchema` / `modulesSchema`（zod）驗證 §10.1 / 骨架全部欄位，非法具名報錯。
- [ ] `validateCurriculum` 單一實作，涵蓋 §8.3 全部圖驗證 + 顆粒度 Gate + 可插拔 leetcode。
- [ ] Level 0 + Level 1 stub Concept 交付且整鏈驗證綠燈；每檔標註「F2 seed，F7 取代」。
- [ ] `npm test` 全綠、`npm run validate:curriculum` exit 0。
- [ ] `.github/workflows/ci.yml` 建立，push / PR 自動跑「build → test → validate:curriculum」且全綠（FR-028a / SC-008）。
- [ ] 參照完整性只實作於 `validateCurriculum`；`loadCurriculum` 不產出任何 `dangling-ref`（SC-007 / FR-013）。
- [ ] `src/**` 無 `@google/genai`；未改 `daily.yml` / F1 執行路徑。

## 非本 Feature（不在此驗收）

課表生成（F4）、Full Article 解析與 `Lesson` 組裝、learning path 由 DAG 驅動、移除 `getPathLabels`（F5）、
`leetcode` 題號存在性（F3）、內容產線與 outline 定稿（F7）。詳見 [spec.md](./spec.md) Out of Scope。
