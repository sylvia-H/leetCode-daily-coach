# 實機驗收紀錄：006-pipeline-mvp（M3 完成條件）

**Feature**: [spec.md](./spec.md) ｜ **對應**: FR-025 / FR-027 / FR-027a / FR-027b / SC-009 / SC-010

本表為**空白模板**，由 `/speckit-implement` 階段建立並隨其他交付物一併進版控；**實際觀察與 Actions run
連結由維運者（＝使用者本人）於實機執行後填寫並勾選**。本 Feature 的完成判定不在「程式寫完」，而在本表
**七條 AC 全數勾選**（FR-027）。

> **紀錄中 MUST NOT 出現任何 webhook URL 或金鑰**（FR-025 / FR-027，測試見
> `tests/unit/docs-secrets.test.ts` 的全文掃描）。
>
> **執行約束（MUST）**：① 全部觸發以 `workflow_dispatch` 指定 **ref = `006-pipeline-mvp`**，
> **MUST NOT** 為取得證據而先 merge 回 `develop`（FR-027a）；② AC10 **MUST NOT** 帶 `force`（FR-027b），
> 故需先完成下方「C7a：重置 `state` 分支」。
>
> **同一次 run 可同時佐證多條 AC**——不需要為每條 AC 各自觸發一次。
>
> **判定門檻（SC-009）**：每次 run 的耗時 **MUST ≤ 10 分鐘**才得勾選該條；`npm ci` 快取失效或 runner
> 較慢時仍在門檻內才算通過。

---

## 前置確認

- [ ] ① 三個 webhook Secret 皆已登錄（`DISCORD_WEBHOOK_URL_FOUNDATION` /
      `DISCORD_WEBHOOK_URL_INTERVIEW_READY` / `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY`）。
      **只記「已登錄」，MUST NOT 記錄任何 URL 或片段。**
- [ ] ② GitHub repo Settings 的 Default branch = `develop`（見下方 AC 之外的獨立確認，T039）。
- [ ] ③ `state` 分支已重置為三軌初始值（`currentSessionIndex: 1`、`lastPushAt: null`、
      `completedConceptIds: []`、`history: []`，且無 `completedAt`）。
- [ ] ④ 本次驗收全程以 `workflow_dispatch` 指定 **ref = `006-pipeline-mvp`**，尚未 merge 回 `develop`。

---

## AC2：三頻道各收到各自 Track 的今日課程

**操作步驟**：`workflow_dispatch` 觸發（`dry_run=false`、`force=false`）。

**預期結果**：每個已設定 webhook 的 Track 各自的頻道收到該 Track Session 1 的 concept embeds
（Digest 主 Embed、TS/Python Tip、prev/current/next 路徑、Exit Criteria、Takeaway），三軌互不交叉。

- 實際觀察：
- Actions run 連結：
- run 耗時：
- [ ] 已勾選

---

## AC3：同一天不重複打擾、`force` 可繞過

**操作步驟**：同日內以 `workflow_dispatch` 再次觸發（`force=false`），觀察皆跳過後，再以 `force=true`
觸發一次。**MUST 以兩次 `workflow_dispatch` 佐證，MUST NOT 依賴真實 cron 觸發。**

**預期結果**：`force=false` 的第二次觸發：三軌皆 `skipped (already pushed today)`，`state.json` 無新
commit；`force=true` 的第三次觸發：三軌照常推播並前進一課。

- 實際觀察：
- Actions run 連結（兩次）：
- run 耗時：
- [ ] 已勾選

---

## AC4：各 Track 進度獨立 +1、單次 commit

**操作步驟**：檢視 AC2 觸發後 `state` 分支的 `state.json` 與提交歷史。

**預期結果**：三軌 `currentSessionIndex` 皆為 2；本次執行**恰好 1 個** commit；`main` / `develop`
**無任何** bot 狀態提交（以 `git log` 依 bot 提交者身分篩選，範圍為**本 Feature 分支建立之後**）。

- 實際觀察：
- 查核指令與結果（`git log` 篩選 bot 提交者）：
- Actions run 連結：
- run 耗時：
- [ ] 已勾選

---

## AC5：三軌共用教材正文、題目難度帶不同

**操作步驟**：比對三軌 `prefix-sum` Concept 的推播內容（同一次 run 中三軌推播內容的觀察結果）。

**預期結果**：教學正文（Digest / TypeScript Tip / Python Tip / Takeaway / Exit Criteria）逐字相同；
題目難度帶依 Track 不同。

- 實際觀察：
- Actions run 連結：
- [ ] 已勾選

---

## AC6：全程無 LLM API key 仍端到端成功

**操作步驟**：檢視 AC2 觸發的 Actions log，確認執行環境未提供任何 LLM 金鑰且執行成功；並檢視
`.github/workflows/daily.yml` 定義中 LLM 金鑰名稱出現次數（`tests/unit/zero-llm.test.ts` 掃描結果）。

**預期結果**：該次 run 環境未提供任何 LLM 金鑰且執行成功；`daily.yml` 中 LLM 金鑰名稱出現次數為 0。

- 實際觀察：
- 掃描測試結果：
- Actions run 連結：
- [ ] 已勾選

---

## AC9（後半）：`dry_run: true` 不推播、不寫 state

**操作步驟**：同日以 `workflow_dispatch` 觸發（`dry_run=true`）。

**預期結果**：三軌照常編譯／渲染並輸出至 Actions log；**零推播**（頻道無新訊息）；`state` 分支**無新
commit**。**（前半的課表 byte-identical 屬 F4，不在本紀錄範圍。）**

- 實際觀察：
- Actions run 連結：
- run 耗時：
- [ ] 已勾選

---

## AC10：多 Track 失敗隔離

**前置**：
- [ ] 已先執行 C7a（重置 `state` 分支，使日期 guard 對三軌全部放行）
- [ ] 本次觸發**未帶 `force`**

**操作步驟**：暫時把某軌 Secret 改為無效值 → `workflow_dispatch`（`force=false`、`dry_run=false`）→
觀察 → 還原該軌 Secret。

**預期結果**：其餘兩軌正常推播並前進一課；失敗軌收到紅色告警（`15158332`）且進度維持不變；job 以非零
exit code 結束；第一個已設定的頻道另收到一則最後防線純文字通知（刻意保留的兜底設計，非重複故障）。

- 實際觀察：
- Actions run 連結：
- run 耗時：
- [ ] 已勾選

---

## 完成判定

- [ ] 以上七條 AC（AC2 / AC3 / AC4 / AC5 / AC6 / AC9 後半 / AC10）**全數勾選** ⇒ F6 完成 ⇒ **MVP 達成（M3）**
