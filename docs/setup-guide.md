# 一次性環境建置說明（FR-024）

本文件涵蓋 LeetCode Daily Coach（Ascent）**唯一需要人工手動執行一次**的環境建置步驟：
`state` 分支初始化、Discord 頻道與 Webhook 取得、GitHub Actions Secrets 登錄。

依本文件操作完成後，即可觸發 `.github/workflows/daily.yml`（`workflow_dispatch`）收到第一則課程訊息。
本文件所述步驟 **MUST 由使用者手動執行一次**；本專案 **MUST NOT** 提供自動建立分支或頻道的程式
（一次性用途不值得長期維護，且涉及分支與外部服務的破壞性操作）。

---

## 前置需求

- 一個你有管理權限的 GitHub repository（本專案）
- 一個你有建立頻道 / Webhook 權限的 Discord 伺服器
- 本機已安裝 Git

---

## Step 1：初始化 `state` 分支（orphan branch）

`state.json` 的每日進度提交 **MUST 只進 `state` 分支**，不得進 `main` / `develop`
（見憲章 XIII、`docs/spec.md` §19）。`state` 分支是一個**沒有共同歷史的 orphan branch**，
只放 `state.json` 一個檔案。

```powershell
git checkout --orphan state
git rm -rf .
Copy-Item docs\state.template.json state.json
git add state.json
git commit -m "chore(state): 初始化 state 分支"
git push origin state
git checkout develop
```

初始化後 `state` 分支只有一個檔案 `state.json`，內容為三個 Track 的初始進度
（`currentSessionIndex: 1`、`lastPushAt: null`，見 `docs/state.template.json`）。

---

## Step 2：建立 Discord 頻道與取得 Webhook URL

至少啟用一個 Track（建議先啟用 `foundation`）：

1. 在你的 Discord 伺服器建立一個文字頻道（例如 `#foundation-daily`）。
2. 頻道設定 → **整合（Integrations）** → **Webhook** → 建立新 Webhook，命名任意（例如
   `Ascent Foundation`）。
3. 複製 Webhook URL（格式為
   `https://discord.com/api/webhooks/<id>/<token>`）——**這是機密，MUST NOT 貼到任何程式碼、
   commit message 或公開頻道**。

若要啟用其餘 Track（`interviewReady` / `interviewMastery`），為每個 Track 各自重複上述步驟，
建立各自獨立的頻道與 Webhook。**只設定你想啟用的 Track 即可**——移除對應的 Secret 即代表停用該
Track，不需要修改任何程式碼或設定檔（憲章「技術與資源約束」）。

---

## Step 3：登錄 GitHub Actions Secrets

至 repository → **Settings → Secrets and variables → Actions → New repository secret**，
依你在 Step 2 啟用的 Track 登錄對應 Secret（**只登錄你要啟用的**）：

| Secret 名稱 | 對應 Track | 必填 |
|---|---|---|
| `DISCORD_WEBHOOK_URL_FOUNDATION` | `foundation` | 至少三選一 |
| `DISCORD_WEBHOOK_URL_INTERVIEW_READY` | `interviewReady` | 至少三選一 |
| `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` | `interviewMastery` | 至少三選一 |

> `GEMINI_API_KEY` **MUST NOT** 登錄至本 workflow 使用的 Secrets（每日推播零 LLM，憲章 VIII）；
> 該 Secret 只在未來 F7 內容產線的獨立 workflow 中使用，與本文件無關。

---

## Step 4：手動觸發驗證

至 repository → **Actions** → **Daily Push** → **Run workflow**：

- 第一次建議勾選 `dry_run`：確認 log 有完整的 render 結果，且 `state` 分支**沒有**新 commit。
- 確認無誤後再次 Run workflow、**不勾** `dry_run`：你設定的頻道應收到第一則課程訊息，
  `state` 分支新增一個 commit（`currentSessionIndex` 由 1 變為 2）。

---

## 如何手動調整學習進度（FR-018）

調整進度的**唯一官方方式**是直接編輯 `state` 分支的 `state.json`：

```powershell
git fetch origin state
git checkout state
# 編輯 state.json，例如把 foundation.currentSessionIndex 改成想要的課程序號
git add state.json
git commit -m "chore(state): 手動調整 foundation 進度"
git push origin state
git checkout develop
```

**MUST NOT** 另外新增「起始課數」之類的環境變數或設定項——`state` 分支的 `state.json` 是進度的
唯一權威來源。

**暫停 / 續播某個 Track**：移除（或清空）對應的 Webhook Secret 即暫停，該 Track 會被跳過且
`state.json` 保持不動；重新加回 Secret 即從原進度繼續，**不會**重置回第 1 課。

---

## 疑難排解

| 現象 | 可能原因 |
|---|---|
| workflow 顯示「未設定任何 Track 的 webhook」後失敗 | Step 3 的 Secret 名稱打錯或忘記登錄 |
| 頻道沒收到訊息，但 workflow 顯示成功 | 檢查是否誤勾 `dry_run` |
| 同一天收到兩則訊息 | 不應發生（雙 cron 有 per-track 同日去重）；若發生請檢查是否用了 `force` |
| `state` 分支提交失敗 | 通常是暫時性的 push 衝突，workflow 會自動重試 3 次；若仍失敗請查看 Actions log |
