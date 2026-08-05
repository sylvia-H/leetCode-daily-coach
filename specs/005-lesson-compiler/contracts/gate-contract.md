# Contract: 內容 Gate（`src/compiler/gate.ts` + `scripts/validate.ts` + `content-gate.yml`）

**Feature**: `005-lesson-compiler` | **權威來源**: `docs/spec.md` §7.1、§20.3-6、§21.3；憲章 IX / XV

---

## §1 核心 API（純函式）

```ts
interface GateInput { deps: CompilerDeps; }
interface GateResult { violations: GateViolation[]; compiled: number; total: number; }

function runContentGate(input: GateInput): GateResult;
```

**規則（MUST）**：

1. 對 `TRACK_ORDER`（`foundation` → `interviewReady` → `interviewMastery`）× 該 Track 課表的
   **全部** `sessionIndex`（1..N）逐筆執行：`compile` → `render` → 每則訊息 `checkBudget`。
2. **蒐集而非中止**：單筆的例外以 try/catch 收攏為一筆 `GateViolation` 後繼續下一筆（spec FR-024）。
3. 呼叫的 `compile` / `render` / `checkBudget` MUST 與每日 runtime **同一顆**（`import` 同一模組），
   MUST NOT 為 Gate 另寫解析或組裝（憲章 IX）。
4. `runContentGate` 為純函式：無 `process.exit`、無 `console`、無檔案寫入。
5. 某 Track 課表為空（0 個 Session）⇒ 產生 `schedule-empty` 違規（否則 Gate 會「全數通過 0 筆」而
   形同虛設）。

## §2 違規模型

見 [data-model.md §6](../data-model.md#6-gateviolationsrccompilergatets)。全部違規皆為 `severity: "error"`；
本 Feature **不定義 warning 級**（有疑慮就擋，§4-15）。

排序：`track`（TRACK_ORDER 序）→ `sessionIndex` → `rule` → `subject` → `message`。

---

## §3 CLI 入口（`scripts/validate.ts`）

```bash
npm run validate:content
```

**流程**：

1. `loadCompilerDeps()` 載入 DAG / 題庫 / 三份課表 / 三份 Overlay。
2. 跑 F2 `validateCurriculum`——error 級違規轉為 `curriculum-invalid` 並**繼續**（讓一次執行看到全貌）。
3. `runContentGate({ deps })`。
4. 逐筆列印：`{track} #{sessionIndex} [{rule}] {subject}: {message}`。
5. 彙總並結束：
   - 無違規：`✓ 內容 Gate 通過：{total} 筆 Lesson（3 Track × 各課表全部 Session）` → exit **0**。
   - 有違規：`✗ 內容 Gate 未通過：{n} 筆違規（已編譯 {compiled} / {total} 筆 Lesson）` → exit **1**。

**約束**：`process.exit` 與檔案 I/O **只允許出現在本檔**（沿用 F2/F3/F4 分層）；本檔 MUST NOT 含任何
編譯／版面／預算判斷邏輯。

**環境**：MUST 可在**無任何環境變數與 API key** 的情況下執行（無 webhook、無 `GEMINI_API_KEY`）。

---

## §4 Workflow（`.github/workflows/content-gate.yml`）

| 項目 | 值 |
| --- | --- |
| 觸發 | `pull_request` 與 `push`，`paths`：`concepts/**`、`articles/**`、`data/**`、`schedules/**`、`overlays/**`、`curriculum/**`、`src/**`（另含本 workflow 自身） |
| Node | `actions/setup-node@v4`，`node-version: 24` |
| 步驟 | `npm ci` → `npm run build` → `npm test` → `npm run validate:content` |
| 失敗 | 任一步非零 ⇒ workflow 失敗 ⇒ 阻擋合併 |
| Secrets | **無**（MUST NOT 引用任何 secret，含 `GEMINI_API_KEY` 與 webhook） |

**不含**：TS/Python 教材程式碼實測——延至 **F7** 加入同一支 workflow（spec FR-028、`docs/spec.md` §21.3）。
本 Feature MUST NOT 放置無驗證力的實測空殼步驟。

> `ci.yml`（工程 Gate：build / test / `validate:curriculum`(F2) / `validate:problem-bank`(F3) /
> `validate:schedule`(F4)）維持不變；兩支 workflow 職責分離（`docs/spec.md` §21.3）。
> `content-gate.yml` 重跑 `npm ci` / `build` / `npm test` 是刻意的——內容 Gate 的結論
> 「Gate 通過 ⇒ runtime 不會因內容失敗」以 Compiler 行為正確為前提，MUST NOT 倚賴另一支 workflow 的結果。
> 以本專案規模（兩支 job 各約 1–2 分鐘）此重複遠低於 Actions 免費層額度，不違反憲章 XVI；若未來 job 時間
> 顯著成長，SHOULD 先合併為單一 job 的多個 step，**MUST NOT 以省略 build/test 的方式節省**。
