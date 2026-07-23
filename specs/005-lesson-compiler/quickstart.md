# Quickstart: F5 驗收指引（Lesson Compiler / Renderer / 內容 Gate）

**Feature**: `005-lesson-compiler` | **Plan**: [plan.md](./plan.md)

環境：Windows + PowerShell、Node.js 24、npm。**本機不得對真實 Discord webhook 測試版面**（憲章：
一律用 `DRY_RUN=true`）。

---

## 0. 前置

```powershell
npm ci
npm run build
```

前四個 Feature 的素材需就位（皆已 commit）：`curriculum/modules.json`、`concepts/**`、
`data/problem-bank.json`、`schedules/*.json`、`overlays/*.json`，加上本 Feature 新增的
`articles/programming-mindset/**`、`articles/array/**`。

---

## 1. 內容 Gate（US3、AC8、SC-001／SC-002／SC-006／SC-007）

```powershell
npm run validate:content
```

**預期**：

```
✓ 內容 Gate 通過：39 筆 Lesson（3 Track × 各課表全部 Session）
```

exit code 為 `0`（`$LASTEXITCODE` 檢查）。39 = 3 Track × 13 Session（F4 stub 課表）。

### 失敗路徑（各做一次，做完復原）

| 注入的破壞 | 預期 |
| --- | --- |
| 把某篇 Article 的 `## Digest` 內容撐到 > 900 字元 | 非零 exit；訊息指名 track / sessionIndex / `digest`(實際/900) |
| 刪掉某篇 Article 的 `## Python Tip` 整段 | 非零 exit；訊息指名區塊名稱與 articlePath |
| 把某篇 Article 的 `Today's Challenge` 拿掉一個課表用到的題號條目 | 非零 exit；訊息指名該題號 |
| 同時做上述三項 | **一次列出三筆**違規（不在第一筆中止），彙總筆數正確 |

> 復原方式：`git checkout -- articles/`。

**零 API key 驗證（SC-007）**：在完全沒有設定任何環境變數的 shell 執行上述指令，仍應通過。

---

## 2. 編譯單一 Lesson（US1、SC-003 determinism）

```powershell
npx tsx -e "import{loadCompilerDeps,compile}from'./src/compiler/lesson.ts';const d=loadCompilerDeps();console.log(JSON.stringify(compile('foundation',4,d),null,2))"
```

**預期**：輸出 `type: 'concept'`、`concept.id === 'array-traversal'`、`problems` 各題含
`title` / `url` / `difficulty`（來自 Problem Bank）與 `whyThisPattern`（來自 Article），
`path` 有 `prev` / `current` / `next`。輸出中**不得**出現 F1 的 demo 題號（11 / 125 / 167）。

**determinism**：連續執行兩次並比對輸出，MUST 逐字元相同。

---

## 3. 五種 Session 類型（US2、SC-008）

`foundation` 課表的類型分布：

| sessionIndex | type |
| --- | --- |
| 1, 2, 4, 8, 9 | `concept` |
| 3, 10 | `practice` |
| 5, 11 | `challenge` |
| 6, 12 | `review` |
| 7, 13 | `rest` |

逐一以第 2 節的方式編譯並確認：

- `practice` / `challenge`：無 `concept` / `path` 欄位；`problems` 可為空。
- `review`：`reviewConcepts` 非空（session 6 對應 `reviewRange [1,5]` ⇒ 涵蓋 3 個 Concept）；
  無 `reflectionQuestion`（F8 素材未建立，屬預期）。
- `rest`：`problems` 為空；無 `encouragement`（同上）。

---

## 4. 版面預覽（DRY_RUN；不推播、不寫 state）

```powershell
$env:DISCORD_WEBHOOK_URL_FOUNDATION="https://discord.com/api/webhooks/000/placeholder"
$env:STATE_FILE="$env:TEMP\state.json"
$env:DRY_RUN="true"
node dist/main.js
```

**預期**：輸出完整 embeds JSON 與 BudgetReport 逐項明細；**無任何網路請求**、`state.json` 不被寫入。
確認 concept 版面依序為「主 Embed → 題目 Embed →（有 Overlay 時）附註 Embed → 結尾 Embed」。

> 用完清掉環境變數：`Remove-Item Env:DRY_RUN, Env:STATE_FILE, Env:DISCORD_WEBHOOK_URL_FOUNDATION`。

---

## 5. Track 差異只來自課表與 Overlay（US5、SC-005）

```powershell
npx tsx -e "import{loadCompilerDeps,compile}from'./src/compiler/lesson.ts';const d=loadCompilerDeps();const a=compile('foundation',4,d),b=compile('interviewReady',4,d);console.log('digest 相同:',a.concept.digest===b.concept.digest);console.log('foundation 題:',a.problems.map(p=>p.id));console.log('ready 題:',b.problems.map(p=>p.id));console.log('foundation overlayNotes:',a.overlayNotes);console.log('ready overlayNotes:',b.overlayNotes)"
```

**預期**：

- `digest 相同: true`（教材正文三軌共用）。
- `foundation 題: [1, 26, 27]`、`ready 題: [1, 26]`——**題目集合完全等於各自課表的 `problemIds`**。
  `27` 來自 `foundation` Overlay 的 `extraProblemIds`，但它是**在 F4 生成階段**就被寫進
  `schedules/foundation.json` 的（research R6）；Compiler MUST NOT 再加題。
- `foundation overlayNotes`：印出 Overlay 的 `extraNotesMarkdown`；`ready overlayNotes`：`undefined`。
  兩軌的 `concept.digest` 不受影響（疊加不取代）。

**反向確認（Compiler 未增刪題目）**：

```powershell
npx tsx -e "import{loadCompilerDeps,compile}from'./src/compiler/lesson.ts';import{readFileSync}from'node:fs';const d=loadCompilerDeps();const s=JSON.parse(readFileSync('schedules/foundation.json','utf-8'));let ok=true;for(const x of s.sessions){const l=compile('foundation',x.sessionIndex,d);if(JSON.stringify(l.problems.map(p=>p.id))!==JSON.stringify(x.problemIds??[]))ok=false}console.log('problems 完全等於課表:',ok)"
```

**預期**：`problems 完全等於課表: true`。

---

## 6. 單元測試（SC-004、SC-009 與憲章測試優先項）

```powershell
npm test
```

**預期**：全數通過，且包含：

- Compiler determinism（10 次）、五種類型形狀、path 推導、Overlay 疊加不取代。
- Renderer 純函式性（連續 render deep-equal、換 track 結構不變、**import 掃描**）。
- 預算：每個預算項與每個結構性上限各有觸發案例；6,000 硬限獨立斷言；拆訊息規則專測。
- Gate：happy path 39 筆 + 多違規一次全報 + 排序穩定。
- 零 LLM 掃描涵蓋新增模組。

---

## 7. F1 臨時債清償確認（FR-029、SC-009）

```powershell
Select-String -Path src\**\*.ts -Pattern "SESSION_PLANS|getPathLabels|DEMO_LEETCODE_IDS|DEMO_PROBLEM_CONTENT"
```

**預期**：**無任何命中**。另確認 `articles/two-pointer/` 已移除（research R8）。

---

## 8. CI 對照

PR 推上後應觸發兩支 workflow：

- `ci.yml`（工程 Gate）：build → test → `validate:curriculum`(F2) → `validate:problem-bank`(F3)
  → `validate:schedule`(F4)。
- `content-gate.yml`（本 Feature）：build → test → `validate:content`。

> 兩支對 `src/**` 的 PR 會各跑一次 `npm ci` / build / test，**這是刻意的**（`docs/spec.md` §21.3）。

兩者皆綠即滿足 **AC7 / AC8** 與里程碑 **M2** 的 F5 部分。
