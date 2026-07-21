# Phase 0 Research: Walking Skeleton（001-walking-skeleton）

**Date**: 2026-07-20 | **Plan**: [plan.md](./plan.md)

Technical Context 中**無 NEEDS CLARIFICATION**——技術選型已由憲章 v1.0.1「技術與資源約束」與
`docs/spec.md` §22.3 釘死，plan 階段不得另行選型。因此本文件處理的是**選型之下仍需定案的實作策略**，
以及 Constitution Check 標記的兩處待正當化決策。

---

## R1. 教材固定區塊的解析策略

**Decision**：以 `gray-matter` 剝離 frontmatter，再用 `marked` 的 **lexer**（`marked.lexer(md)`）取得
token 串，掃描 `type === 'heading' && depth === 2` 的節點作為區塊邊界，收集兩個 heading 之間的原始
markdown 作為該區塊內容。區塊以 heading 的**文字**比對（如 `Digest`、`TypeScript Tip`）。

**Rationale**：
- `marked` 已是憲章釘死的相依，用它的 lexer 不需額外套件，且**不做 HTML 轉換**——推播內容要保留
  markdown 原文（Discord embed description 直接吃 markdown），轉 HTML 反而有害。
- 用 token 而非 regex，可正確跳過**程式碼區塊內的 `## ` 字樣**。TypeScript / Python Tip 內含
  fenced code block，regex 切分在此會誤判——這是本專案最可能踩到的解析 bug。
- 保留原始 markdown 需以 token 的 `raw` 欄位重組，而非 token 的結構化內容，才能讓程式碼區塊原樣進入
  Discord。

**Alternatives considered**：
- **regex 逐行切 `^## `**：實作最短，但無法區分程式碼區塊內的井號，且 §10 的 TS/Python Corner 必含
  程式碼，風險具體而非理論性。否決。
- **`remark` / `unified` AST**：功能足夠但引入新相依樹，違反「不得於 plan 階段另行選型」。否決。
- **自訂分隔符（如 `<!-- SECTION: digest -->`）**：解析最穩，但會讓教材偏離 §10 的固定區塊定義，且
  F7 的 LLM 產線要多生成一層標記。否決。

---

## R2. Asia/Taipei 日曆日的換算方式

**Decision**：以 `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year:'numeric', month:'2-digit',
day:'2-digit' }).format(date)` 取得 `YYYY-MM-DD` 字串，去重判斷為**字串相等比較**。
封裝於 `src/util/taipei-date.ts`，對外只暴露 `toTaipeiDateString(date: Date): string`。

**Rationale**：
- `en-CA` locale 的日期格式天然就是 ISO 的 `YYYY-MM-DD`，不需手動組字串。
- 使用 IANA 時區資料庫（Node 24 內建完整 ICU），而非手動 `+8` 位移——後者在語意上是「假設台北永遠 UTC+8」，
  雖然目前成立，但把時區規則寫死在算術裡是不必要的脆弱點。
- 比較「日曆日字串」而非時間差，直接對應 FR-020「以台北時區日曆日為準」的措辭，測試也更直觀。

**Alternatives considered**：
- **手動 `new Date(ts + 8*3600*1000).toISOString().slice(0,10)`**：可行且常見，但語意繞（先偽造一個
  UTC 時刻再取其 UTC 日期），可讀性差、易被後人誤改。否決。
- **引入 `date-fns-tz` / `luxon`**：本需求只有一個函式，不值得新增相依（憲章 XVI 的精神：不引入非必要複雜度）。否決。

**測試邊界（憲章「測試優先」明列，MUST 覆蓋）**：
- UTC `2026-07-19T15:59:59Z` → 台北 `2026-07-19`（23:59:59）
- UTC `2026-07-19T16:00:00Z` → 台北 `2026-07-20`（00:00:00，**跨日翻轉點**）
- 每日 cron `22:07Z` 的實際台北日期為**次日**——直接對應排程情境
- `lastPushAt` 為空（新 Track）→ guard 放行

---

## R3. Discord 字元總量的計算口徑

**Decision**：總量 = 所有 embeds 的 `title` + `description` + 每個 field 的 `name` + `value` +
`footer.text` + `author.name` 的長度總和。長度以 **Unicode code point** 計（`Array.from(str).length`），
非 UTF-16 code unit（`str.length`）。實作於 `src/renderer/budget.ts`，回傳**逐區塊明細 + 總計**而非布林。

**Rationale**：
- 這組欄位即 `docs/spec.md` §14.5 列舉的計入項目；`url` / `color` / `image` 等不計入。
- 教材為繁體中文，中文字在 UTF-16 下多為 1 個 code unit，但 emoji（版面用了 📚 / 🎯 / 🧭 / ✅ / 💡）
  為 surrogate pair，`str.length` 會**高估**。兩種算法在本專案都不會低估，但採 code point 與平台語意一致，
  且避免日後有人「發現數字對不上」而改壞。
- 回傳明細而非布林：FR/US4 要求預覽模式「明確標示超限的區塊與數值」（spec US4 Scenario 2），
  布林值滿足不了；且 F5 的 Gate 需要同樣的明細來報告哪一筆 Lesson 爆哪一格。

**Alternatives considered**：
- **只檢查總量 5,500**：不符 §14.5 的分區塊預算與 US4 Scenario 2。否決。
- **超限時自動截斷**：會讓內容在無聲中被裁掉，違反憲章 XV「Fail Loud」。改為**視為該 Track 失敗**（FR-006）。否決。

---

## R4. 手寫教材與硬編課表的存放位置（憲章 XIII 的正當化）

**Decision**：
- **手寫教材** → `articles/two-pointer/002-left-right-pointer.md`（產線最終會使用的**真實路徑**），
  檔頂加註 `<!-- F1 手寫種子內容；F7 內容產線上線後由生成物取代，屆時本檔可被覆寫 -->`。
- **硬編課表** → `src/compiler/schedule.ts` 的 TypeScript 常數，**不得**放 `schedules/*.json`。
- **最小題庫** → `data/problem-bank.json`（FR-003a 指定的既定路徑），F3 直接擴充資料。

**Rationale**：
- 憲章 XIII 對 `schedules/{track}.json` 是**明文 MUST NOT 手寫**，無正當化空間，故課表必須另置；
  放在 `src/compiler/schedule.ts` 可讓 F4 只替換該模組實作，對外介面
  `getSessionPlan(track, sessionIndex)` / `getPathLabels(sessionIndex)` 保持不變。
- 憲章 XIII 對 `articles/**` 的禁令語意是「**MUST NOT 手改生成物**」。F1 階段產線尚不存在、無生成物可改，
  寫入的是**種子內容**而非竄改，故不構成違規；而放真實路徑才能讓 F1 真的驗證到
  `compiler/content.ts` 未來要走的讀取路徑（這正是 walking skeleton 的目的）。
- `data/problem-bank.json` 不在憲章 XIII 的凍結清單內（凍結對象為 `concepts/` `schedules/` `articles/`），
  故最小資料檔可直接置於既定路徑。

**Alternatives considered**：
- **教材放 `tests/fixtures/`**：F1 會驗到測試替身而非產品路徑，等於這一段鏈路沒被打穿。否決。
- **教材放 `articles/_seed/`**：避開了命名衝突，但 F7 上線時需搬檔並改讀取邏輯，把成本延後而非消除。否決。
- **課表放 `schedules/foundation.json` 並註記臨時**：直接違反憲章明文禁令，且會讓 F4 生成器的
  byte-identical 驗證被既有手寫檔污染。否決。

---

## R5. `state.json` 的提交責任歸屬

**Decision**：CLI 程式**只負責寫檔**（寫入 `STATE_FILE` 指向的路徑）；`git add / commit / pull --rebase
--autostash / push` 與重試迴圈**全部由 `daily.yml` 的 workflow step 執行**（`docs/spec.md` §21.2 骨架已定）。

**Rationale**：
- 程式內不需要 git 相依，維持「一次性 CLI 跑完即退」的單純性；本機 dry run 也不會意外碰到 git。
- workflow 已 checkout `state` 分支到 `.state/`，在該目錄下操作 git 最自然。
- FR-017 的「重試」語意因此落在 workflow 層，測試方式為人工觸發驗證而非單元測試——已於 tasks 規劃中標示。

**Alternatives considered**：
- **程式內用 `simple-git` 提交**：新增相依、且讓 CLI 具備寫遠端的權力，擴大失敗面。否決。

---

## R6. 環境變數的布林解析（GitHub Actions 陷阱）

**Decision**：`DRY_RUN` / `FORCE` 一律以「**字串嚴格等於 `'true'`（trim + 小寫後）才為真**」解析，
其餘值（含 `'false'`、空字串、`undefined`）皆為假。封裝於 `src/config.ts` 的 `parseBool`。

**Rationale**：
- GitHub Actions 的 `workflow_dispatch` boolean input 經 `env:` 傳入時會變成**字串** `"true"` / `"false"`；
  JavaScript 中 `Boolean("false") === true`，這是本專案最容易誤推播的單點失誤——一旦踩到，
  dry run 會變成真的推播（違反憲章「本機驗證 MUST NOT 對真實 webhook 測試」）。
- `schedule` 事件觸發時 `${{ inputs.dry_run }}` 會展開為**空字串**，故解析必須容忍空值並視為 `false`。

**Alternatives considered**：
- **`JSON.parse(v)`**：對空字串與非法值會 throw，需額外包裝，且錯誤訊息不友善。否決。
- **`v !== 'false'`**（預設為真）：語意危險——未設定時會變成 dry run，導致每日推播靜默不發送。否決。

---

## R7. Discord embeds 的切分方式

**Decision**：一則訊息**固定 3 個 embeds**，順序寫死：

1. **主 Embed（今日課程）**：`title` = `📚 Session {n} · {conceptTitle}`、`description` = Digest、
   fields = `Pattern`(inline) / `複雜度`(inline) / `預估時間`(inline) / `TypeScript Tip` / `Python Tip`、
   `color` = Module 色
2. **題目 Embed**：`title` = `🎯 Today's Challenge`、description 逐題列出遮罩連結 + 難度 + why + Hint
3. **收尾 Embed**：`🧭 學習路徑` field + `✅ Exit Criteria` field（checklist）+ `💡 Takeaway` field

**Rationale**：
- 對齊 `docs/spec.md` §14.6 的 mock 版面（三個視覺區塊），使 SC-003 的主觀驗收有明確比對基準。
- 三個 embeds 遠低於單則 10 embeds 的上限，留有餘裕。
- 學習路徑放 field 而非 embed `footer`：footer 不支援換行後的對齊呈現，而版面需要三行（昨天/今天/明天）；
  §14.5 的「footer ≤ 200」預算仍套用於此區塊的字元數。

**Alternatives considered**：
- **全部塞進單一 embed**：description 上限 4,096 雖夠，但視覺上無分隔，與 §14.6 的設計不符，
  且 SC-003「一眼看出今天要做哪幾題」會劣化。否決。
- **每題一個 embed**：embeds 數隨題數浮動，Renderer 輸出結構不穩定，且無助於可讀性。否決。

---

## R8. 課表用盡與各類失敗的處理層級

**Decision**：區分**全域性失敗**（立即中止）與**單一 Track 失敗**（隔離後續行）：

| 情境 | 層級 | 行為 |
|---|---|---|
| 無任何 webhook 設定 | 全域 | 立即 exit≠0，不推播、不寫 state（FR-023） |
| `STATE_FILE` 未設定 | 全域 | 同上 |
| state.json 解析失敗 | 全域 | 立即 exit≠0，**不覆寫**既有檔案（spec Edge Cases） |
| 課表用盡（sessionIndex > 3） | **單一 Track** | 該 Track 發紅色告警、不推播、不前進，繼續下一 Track，最終 exit≠0 |
| 教材缺區塊 / 解析失敗 | 單一 Track | 同上（FR-004b） |
| 字元預算超限 | 單一 Track | 送出**前**擋下（FR-006），同上 |
| Discord POST 非 2xx | 單一 Track | 同上 |
| 告警本身也送不出去 | 單一 Track | 記錄錯誤日誌，仍計為失敗（spec Edge Cases） |

**Rationale**：全域性失敗發生在「逐 Track 迴圈之前」，此時沒有任何 Track 狀態可保存，中止最安全；
迴圈內的失敗一律隔離，直接對應憲章 XV 與 FR-009。課表用盡歸類為單一 Track 而非全域，是因為
它是**該 Track 的**進度問題——多 Track 情境下其他 Track 不應被牽連（F6 會實際驗收此性質）。

**Alternatives considered**：
- **課表用盡視為全域失敗**：實作更簡單，但在 F6 的多 Track 場景會造成無辜 Track 被中斷，屆時需重寫。否決。
- **課表用盡時循環回第 1 課**：spec Edge Cases 明訂 fail loud，避免臨時課表被誤當成正式課程無限重播。否決。

---

## R9. 預覽模式（DRY_RUN）在流程中的插入點

**Decision**：`DRY_RUN` 的判斷**先於** idempotency guard（對應本 Feature clarify 的 FR-021a / FR-021b，
已回寫 `docs/spec.md` §21.1）。逐 Track 流程順序為：

```
for track of enabledTracks:
  1. if (!dryRun && !force && lastPushAt 的台北日 == 今天) → 跳過（非失敗）
  2. compile(track, currentSessionIndex) → Lesson
  3. render(Lesson) → embeds
  4. checkBudget(embeds) → 超限即該 Track 失敗
  5. if (dryRun) → 輸出 embeds + 預算明細至 log，continue（不推播、不寫 state）
  6. post(track, embeds)
  7. 成功 → 推進該 Track 進度（記憶體中）
```

`DRY_RUN` 為真時，步驟 1 的 guard 直接不套用（不論 `FORCE` 為何），且流程永不到達步驟 6/7。

**Rationale**：把 guard 的略過條件寫成 `dryRun || force`，即可同時滿足 FR-021a（預覽略過去重）與
FR-021b（兩者同開以預覽為準）——因為 `dryRun` 為真時步驟 5 已提前 continue，`force` 是否為真不影響結果。
這使兩條需求由**同一行條件式**實現，不需額外的衝突判斷分支。

**Alternatives considered**：
- **guard 在前、dryRun 在後**：今天已推過就無法預覽，US4 的工具價值在當天失效。否決（此即 clarify Q4 的 Option B）。

---

## R10. 測試策略

**Decision**：全數為 `vitest` 單元測試，不設整合測試層；外部 I/O 以下列方式隔離：

- **Discord**：`vi.stubGlobal('fetch', vi.fn())`，斷言 POST 的 URL 與 body，並模擬非 2xx 與 throw。
- **檔案系統**：`compiler/content.ts` / `problem.ts` / `state-store.ts` 接受**注入的路徑**，測試指向
  `tests/fixtures/`；不 mock `fs`。
- **時間**：`taipei-date.ts` 為純函式（吃 `Date` 參數），去重測試以建構特定 `lastPushAt` 驗證，
  不使用 fake timers。

**Rationale**：本專案無 DB、無 HTTP server，跑一次即退，整合測試的邊際價值低於直接以 `DRY_RUN=true`
做一次真實執行（已由 quickstart 涵蓋）。純函式化（Renderer、budget、taipei-date）使大部分關鍵邏輯
不需要任何 mock，這正是憲章 XI / XII 把 Renderer 設計為純函式的附帶收益。

**憲章「測試優先」在本 Feature 的適用範圍**（其餘項目屬 F2–F7）：
Full Article 固定區塊解析、Lesson Compiler determinism、per-track idempotency guard（含跨日 / UTC 邊界）、
狀態推進（僅成功才 +1、漏跑不跳課、history 上限 30、未知啟用 Track 自動補建、completedConceptIds 去重）、
多 Track 失敗隔離（mock 單一 webhook 失敗）、Renderer 純函式性與 Discord 限制（含 6,000 總長）。

**Alternatives considered**：
- **加一層以本機 HTTP server 假裝 Discord 的整合測試**：違反「無本機 infra」的專案前提，
  且 mock `fetch` 已能覆蓋同樣的分支。否決。
