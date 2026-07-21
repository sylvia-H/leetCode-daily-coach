# LeetCode Daily Coach（Ascent）

一套**演算法課程引擎**，不是題目推播機。每日早晨透過 Discord 推播**一則解題觀念（Concept）＋
1～3 題對應 LeetCode 題**，依固定課綱循序漸進。三個 Track（Foundation / InterviewReady /
InterviewMastery）各自推播獨立頻道。

> 本專案的目標不是讓使用者刷更多題，而是建立能夠持續解題的思維模式。

核心 Pipeline：`排程 → 讀取進度 → 組裝 Lesson → 渲染 Discord embeds → 推播 → 推進進度並提交至 state 分支`。
**每日 runtime 零 LLM**：所有推播內容皆為 build-time 凍結素材，依 `sessionIndex` 決定性輪替。

目前狀態：**001-walking-skeleton**（垂直切片）——一篇手寫教材 + 硬編 3-Session 課表 + 最小
Problem Bank，打通從內容到 Discord 的完整鏈路，驗證版面觀感、雙 cron 去重與 state 分支流程。
完整需求見 [`docs/spec.md`](docs/spec.md)，本 Feature 的規格與實作計畫見
[`specs/001-walking-skeleton/`](specs/001-walking-skeleton/)。

## 環境需求

- Node.js 24（建議以 nvm 安裝 `24.x`）
- npm（非 pnpm、非 monorepo）
- Windows / PowerShell 為主要開發環境

## 快速開始

```powershell
npm ci
npm run build
npm test
```

## 本機 dry run（不會真的推播到 Discord）

**MUST NOT** 對真實 Discord webhook 反覆測試版面；本機驗證一律使用 `DRY_RUN=true`
（compile + render 後輸出至 log，不推播、不寫 state）：

```powershell
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://discord.com/api/webhooks/<id>/<token>"
$env:STATE_FILE = ".state/state.json"
$env:DRY_RUN = "true"
npm run build; if ($?) { npm start }
```

log 會輸出完整的 3 個 Discord embeds（格式化 JSON）與逐區塊字元預算明細。

## npm scripts

| script | 指令 | 用途 |
|---|---|---|
| `build` | `tsc` | 編譯至 `dist/` |
| `test` | `vitest run` | 單元測試（CI 用） |
| `test:watch` | `vitest` | 開發用 |
| `start` | `node dist/main.js` | 執行（需先 build） |

## 文件索引

- [`docs/spec.md`](docs/spec.md) — 唯一需求來源（AI-Friendly Engineering Specification）
- [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — 專案憲章（最高規範）
- [`docs/setup-guide.md`](docs/setup-guide.md) — 一次性環境建置說明（`state` 分支 / Discord
  Webhook / GitHub Actions Secrets）
- [`specs/001-walking-skeleton/quickstart.md`](specs/001-walking-skeleton/quickstart.md) —
  本 Feature 的驗收指南

## 環境變數

| 變數 | 必填 | 說明 |
|---|---|---|
| `DISCORD_WEBHOOK_URL_FOUNDATION` | 至少三選一 | 設定即啟用 `foundation` Track |
| `DISCORD_WEBHOOK_URL_INTERVIEW_READY` | 至少三選一 | 設定即啟用 `interviewReady` Track |
| `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` | 至少三選一 | 設定即啟用 `interviewMastery` Track |
| `STATE_FILE` | ✅ | `state.json` 路徑 |
| `DRY_RUN` | — | `"true"` 才視為真，其餘（含 `"false"` / 空字串）皆為假 |
| `FORCE` | — | 同上；繞過同日去重 |

完整契約見 [`specs/001-walking-skeleton/contracts/cli-contract.md`](specs/001-walking-skeleton/contracts/cli-contract.md)。
