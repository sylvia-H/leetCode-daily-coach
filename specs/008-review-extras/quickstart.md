# Quickstart: 008-review-extras 驗收指引

**Branch**: `008-review-extras` | **Date**: 2026-08-01

本檔是**可執行的驗收腳本**，不是實作說明。實作細節見
[data-model.md](./data-model.md) 與 [contracts/](./contracts/)。
指令一律為 **PowerShell**（Windows），套件管理為 npm。

---

## 0. 前置

```powershell
node -v          # 需 24.x
npm ci
```

- **本機 MUST NOT 打真實 Discord webhook**：驗證版面一律 `DRY_RUN=true`。
- **素材生成需要 `GEMINI_API_KEY`**；除該步驟外，以下全部指令 MUST 在**沒有任何 API key**
  的環境下成功（憲章 VIII）。

---

## 1. 前置查證：`state` 分支進度（重跑課表前 MUST 執行）

```powershell
git fetch origin state
git show origin/state:state.json
```

**預期**：三軌 `currentSessionIndex` ≤ 3 ⇒ 不需要 state 遷移。
> `> 3` 時 MUST 先依 `docs/spec.md` §9.2 校正起點再繼續（contracts/schedule-revision.md §5）。

---

## 2. 課表重生成（Foundational ①②）

```powershell
npm run generate:schedule
npm run validate:schedule
```

**預期**

- 三份課表 Session 數為 **198 / 200 / 243**（生成器輸出的摘要行直接可讀）。
- 生成器**零 error**；warning 僅限 `practice-no-problem` / `challenge-no-problem` /
  `review-no-problem`，且 subject 為 `{track}:week-N-slot-M`（跳過類）或
  `{track}:session-N`（review 無題類）。
- `validate:schedule` 通過（determinism drift 零違規）。

### 2.1 determinism（SC-005）

```powershell
Copy-Item schedules schedules.bak -Recurse
npm run generate:schedule
git diff --stat schedules/     # 預期：無輸出
Remove-Item schedules.bak -Recurse -Force
```

### 2.2 教學內容不變（SC-005 的 A4）

```powershell
# 對每份課表比對「concept Session 的 conceptId 序列」與 F7 凍結版本
# 基準 MUST 為 F7 併入 develop 的 merge commit db3f594（SC-005 明訂），MUST NOT 用 HEAD~1
# ——T019 之後 HEAD~1 已不是 F7 基準，且拿錯基準時比對照樣輸出 true，不會有任何訊號。
foreach ($t in 'foundation','interview-ready','interview-mastery') {
  git show "db3f594:schedules/$t.json" > "$env:TEMP\f7-$t.json"
  node -e "const a=require(process.argv[1].replace(/\\/g,'/')),b=require(process.argv[2]);const f=s=>s.sessions.filter(x=>x.type==='concept').map(x=>x.conceptId);console.log(process.argv[3], JSON.stringify(f(a))===JSON.stringify(f(b)))" "$env:TEMP\f7-$t.json" "./schedules/$t.json" $t
}
```

**預期**：三軌皆輸出 `true`。
> 基準版本的 Session 數為 **243 / 236 / 291**（F7 凍結值）。若 `git show` 取不到 `db3f594`，
> 表示分支基底與預期不同，MUST 先查明再繼續，MUST NOT 換一個「跑得動」的 commit 湊過去。
> 實作時建議把此比對寫成 `tests/unit/` 的一次性驗證或 `scripts/` 的臨時腳本，
> MUST NOT 只靠目視 diff（移除 rest 會讓 diff 全面性改動，見 FR-019）。

### 2.3 無空槽（SC-012）

```powershell
node -e "for(const f of ['foundation','interview-ready','interview-mastery']){const s=require('./schedules/'+f+'.json');const bad=s.sessions.filter(x=>(x.type==='practice'||x.type==='challenge')&&!(x.problemIds&&x.problemIds.length));console.log(f,bad.length)}"
```

**預期**：三行皆為 `0`。

---

## 3. 素材生成（build-time，需要金鑰）

```powershell
$env:GEMINI_API_KEY = "<your key>"
npm run generate:materials
```

**預期**

- 產出 `data/reflection-bank.json`（16 Topic × 6 則）與 `data/encouragement.json`（36 則）。
- 每個 Topic 印出通過的嘗試次數；任一 Topic 連續 3 次不過 ⇒ 印出 `needsHumanReview`、
  **該 Topic 不寫入**、其餘 Topic 照常處理，批次以非零 exit code 結束（SC-011）。
- 批次末自動跑 `runContentGate`（含全庫配額檢查），零違規才 exit 0。

### 3.1 冪等與續跑（SC-008）

```powershell
npm run generate:materials            # 第二次執行
```

**預期**：全部批次印出「跳過」，**零 LLM 呼叫**，素材檔內容不變（`git status` 乾淨）。

```powershell
npm run generate:materials -- --force --only encouragement
```

**預期**：只重生語錄池那一批。

### 3.2 不觸碰教材（SC-009）

```powershell
git status --porcelain -- concepts/ articles/
```

**預期**：無輸出。

**SC-009 有兩個查驗，上式只是第一個**（本次產線執行沒改到教材）。第二個 MUST 於 Feature 併入前
（T065）執行——證明**整個 Feature 期間**相對 F7 基準零變更：

```powershell
git diff --stat db3f594 -- concepts/ articles/
```

**預期**：無輸出。兩者不可互相取代——worktree 乾淨只證明「這一次執行沒改」。

---

## 4. 零金鑰驗證（SC-006 / FR-031）

```powershell
Remove-Item Env:\GEMINI_API_KEY -ErrorAction SilentlyContinue
npm run build
npm run typecheck
npm test
npm run validate:curriculum
npm run validate:problem-bank
npm run validate:schedule
npm run validate:content
```

**預期**：全部成功。`validate:content` 印出
`✓ 內容 Gate 通過：641 筆 Lesson（3 Track × 各課表全部 Session）`（198 + 200 + 243）。

---

## 5. 版面驗收（US1 / US2）

```powershell
$env:DRY_RUN = "true"
$env:DISCORD_WEBHOOK_URL_FOUNDATION = "https://discord.com/api/webhooks/0/dry-run"
node dist/main.js
```

**預期輸出**（挑一個 review Session 檢視；可先以 `FORCE=true` 搭配已知的 review `sessionIndex`）：
embed 依序含四段——`📚 本週涵蓋` / `🤔 Reflection` / `🎯 Challenge` / `💬 一句話`，
且**鼓勵語在最後**（FR-022）。過程中**無任何網路推播、不寫 state**。

### 5.1 逐段檢查（對照 Acceptance Scenarios）

| 檢查 | 預期 | 對應 |
| --- | --- | --- |
| 三軌各取一個 review Session 編譯 | `reviewConcepts` 非空、`reflectionQuestion` 非空、`problems.length === 1` | US1-1 |
| 同一 `(track, sessionIndex)` 重複編譯 render 100 次 | embeds byte-identical | US1-2 / SC-004 |
| 連續 30 個 review 的鼓勵語 | 互不相同 | US2-2 / SC-002 |
| 同一 Topic 的多個 review 的 Reflection | 互不相同 | SC-010 |
| 素材檔暫時改名後重跑 | 對應段落省略、流程不失敗、Gate 照常通過 | Edge Case / FR-014 |

> 前四項 MUST 以 `tests/unit/` 覆蓋（FR-032），本節只是人工快照確認。

### 5.2 素材檔缺席的降級路徑

```powershell
Rename-Item data\reflection-bank.json data\reflection-bank.json.off
npm run validate:content        # 預期：通過（Reflection 段省略）
Rename-Item data\reflection-bank.json.off data\reflection-bank.json
```

---

## 6. Gate 攔截驗證（SC-007）

逐一植入違規樣本後執行 `npm run validate:content`，**預期每一項都被具名擋下、零自動截斷**。
下表涵蓋 `contracts/material-schema.md` §3 的 8 個 rule 中的 **6 個**；其餘兩個
（`material-schema`、`material-unknown-topic`）以單元測試驗證（T031），不在此以手改 `data/` 的方式植入：

| 樣本 | 預期 rule |
| --- | --- |
| 某則 Reflection 加長至 > 300 字元 | `material-invalid` / `material-budget`（指名 Topic 與索引） |
| 某則語錄混入簡體字 | `material-invalid` / `material-traditional-chinese` |
| 複製一則問題到另一個 Topic | `material-invalid` / `material-duplicate` |
| 刪到某 Topic 只剩 1 則 | `material-invalid` / `material-quota`（指名需要幾則、實際幾則） |
| 語錄加入一個 URL | `material-invalid` / `material-progress-coupled` |
| 語錄池刪至 29 則 | `material-invalid` / `material-pool-size` |

> **表中「/」左邊是 `GateViolation.rule`（恆為 `material-invalid`），右邊是 `MaterialViolationRule`**
> ——後者在輸出中出現於 `subject` 的 `{rule}@` 前綴（例：`material-budget@reflection-bank:array[3]`），
> 見 `data-model.md` §8。人工核對時看 `subject` 前綴即可，不必從訊息文字推斷。
>
> `material-schema` 之所以不在本表，除了「不適合手改 `data/` 植入」，更根本的原因是它**由載入層 throw
> 實現、不是 Gate 違規**（`contracts/material-schema.md` §3 註記）：壞檔會讓 `validate:content` 直接以
> 例外中止，而不是印出一筆 `material-invalid`。

> 驗完 MUST `git checkout -- data/` 還原。

---

## 7. 完成判準（對照 Success Criteria）

- [X] SC-001 三軌全部 review 呈現前三段；Challenge 省略僅發生於**該週涵蓋 Concept 全無題**，且每筆有 warning。預期 **4 / 3 / 3** 筆——`programming-mindset` 開頭數週**＋各軌 1 筆課程中段**（Foundation w28、InterviewReady w21、InterviewMastery w28），中段那筆同樣合法，MUST NOT 以「是否在開頭」判定（`tests/unit/schedule-warning-traceability.test.ts` 雙向驗證 + 筆數釘死 4/3/3）
- [X] SC-002 全部 review 結尾有鼓勵語；連續 30 個互異（對真實課表與真實素材驗證，`tests/unit/material-select.test.ts`）
- [X] SC-003 641 筆 Lesson 全數通過預算與結構檢查（`npm run validate:content` 零違規）
- [X] SC-004 重複編譯 100 次 byte-identical（`tests/unit/compile-determinism.test.ts`，含 review Session render）
- [X] SC-005 課表 198 / 200 / 243、byte-identical、Concept 集合與順序不變（`npm run generate:schedule` 兩次 sha256 相同；`tests/unit/schedule-concept-order.test.ts` 對 F7 基準 db3f594 逐一比對）
- [X] SC-006 零金鑰環境下推播流程與 CI Gate 皆成功（`npm run build/typecheck/test/validate:*` 全數通過，`DRY_RUN=true node dist/main.js` 亦成功）
- [X] SC-007 素材 Gate 的 8 個具名 rule 全數有對應驗證（§6 的六個人工樣本實測攔截 + `material-gate.test.ts`/`material-load.test.ts` 涵蓋 `material-schema`/`material-unknown-topic`），100% 攔截並指名根因、零自動截斷
- [X] SC-008 中斷後重跑零重複 LLM 呼叫（實測：`npm run generate:materials` 第二次執行全部 17 批次印出「跳過」，`data/` 內容不變）
- [X] SC-009 `concepts/**` 與 `articles/**` 零變更（**兩個查驗皆已通過**：`git status --porcelain` 乾淨、`git diff --stat db3f594 -- concepts/ articles/` 無輸出）
- [X] SC-010 單一 Track 內同一則 Reflection 只出現一次（對真實課表與真實素材驗證，同一 Track 內無問題被選中 >1 次）
- [X] SC-011 語意重複／是非題樣本 100% 被 self-check 標記；3 次不過者不進凍結產物（機制以 `tests/unit/material-generate.test.ts` 驗證：self-check 解析失敗算一次重生、3 次不過標記 needsHumanReview 且不寫入；實際生成時 16 個 Topic 首次嘗試即通過，無觸發重生案例可觀察，符合 quickstart 第二輪 CHK011 的既有判定——本項不宣稱保證真實 LLM 判斷力，只驗證機制正確運作）
- [X] SC-012 空 `practice` / `challenge` Session 數為 0，每個跳過有 warning（`tests/unit/schedule-warning-traceability.test.ts`）
