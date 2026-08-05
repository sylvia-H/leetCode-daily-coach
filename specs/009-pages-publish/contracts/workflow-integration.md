# Contract: `daily.yml` 新增 `pages` job

**Feature**: 009-pages-publish | **實作位置**: `.github/workflows/daily.yml`（新增 job，既有 `push` job
不變）
**對應**: FR-001／FR-011／FR-012／FR-017、憲章 XV（Fault Isolation & Fail Loud）、research R5／R6／R7

---

## 0. 一次性前置設定（人工，僅需執行一次）

本 Feature 的自動化流程**假設 repository 的 Pages 來源已設為 GitHub Actions**。首次啟用前 MUST 由維運者
於 GitHub 網頁 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**（而非
「Deploy from a branch」）。未完成此設定時 `actions/deploy-pages` 會失敗，並依 FR-017 每日發出琥珀色通知。

此為**一次性環境設定**，非內容產線的常態性人工審核關卡，MUST NOT 被解讀為違反憲章 XVII
（One Human Checkpoint）——後者規範的是「每次內容產出都要人看過」這類反覆性關卡。

## 1. Job 依賴與觸發條件

```yaml
jobs:
  push:
    # 既有，不變

  pages:
    needs: push
    if: ${{ !cancelled() && inputs.dry_run != true }}
    continue-on-error: true
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
```

| 要求 | 等級 | 理由 |
| --- | --- | --- |
| `needs: push` 但 `if: !cancelled()`（不能是預設的 `if: success()`） | MUST | `push` job 因單一 Track 失敗以非零 exit 結束時，其餘 Track 的 state 仍可能已 commit（憲章 XV）；Pages MUST 反映已 commit 的最新 state（FR-002），不能因任一 Track 失敗而整段跳過（research R6） |
| 用 `!cancelled()` 而非 `always()` | MUST | `always()` 會讓**使用者主動取消 workflow 後仍發生一次對外站台部署**，違反取消語意；`!cancelled()` 仍完整涵蓋「`push` job 失敗但已部分 commit」這個 FR-012 要求的情境（失敗 ≠ 取消）。既有 `push` job 的「Commit state changes」step 已針對同類陷阱採用 `!cancelled()` 並留下註解（`daily.yml`），本 job MUST 與之一致。取消後當天不更新 Pages 的影響已由 spec Edge Cases「下一次每日執行會以最新 state 重新產生全部產物」涵蓋 |
| `inputs.dry_run != true` | MUST | `dry_run` 下 `state.json` 未變更，執行 Pages 只會重跑出等價內容，且 `workflow_dispatch` 手動觸發預覽時不應真的部署（research R6） |
| job 層 `continue-on-error: true` | MUST | FR-017：Pages 失敗 MUST NOT 改變當次 workflow 的最終 exit code／結論 |
| `permissions.pages: write` / `id-token: write` | MUST | `actions/deploy-pages` 的官方要求（OIDC 部署） |
| job 層宣告 `environment: github-pages` | MUST | `actions/deploy-pages` 要求部署 job 隸屬 `github-pages` environment，否則 Pages 部署 API 拒絕該次部署。此宣告**與是否設定人工核准保護規則無關**——本專案不設任何保護規則，但 environment 宣告本身仍為必要（research R6 已修正原先「environment 僅供人工核准」的誤述） |

## 2. Step 序列

| # | Step | 條件 | 說明 |
| --- | --- | --- | --- |
| 1 | `actions/checkout@v4` | 無 | 取得程式碼與已凍結的 `concepts/`／`articles/`／`schedules/` |
| 2 | 同 `push` job 的「Checkout state branch」 | 無 | 讀取剛 commit（或未變更）的 `state.json`；`ref: state`, `path: .state` |
| 3 | `actions/setup-node@v4`（Node 24）+ `npm ci` + `npm run build` | 無 | 與既有 job 一致 |
| 4 | **偵測 repo 可見性**（research R5） | 無 | `gh api repos/${{ github.repository }} --jq .private`，輸出 `steps.visibility.outputs.is_public`（`'true'` 僅當呼叫成功且欄位為 `false`；呼叫失敗或欄位為 `true` 時該 step 視為未產出 `'true'`）。此 step **MUST** 設定 `env: GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`——GitHub Actions 內的 `gh` CLI 未取得 `GH_TOKEN` 即直接報錯，將使可見性永遠無法確認、依 R5 的安全預設**永不發佈**並每日發出琥珀色通知 |
| 5 | `npm run build:pages` | `steps.visibility.outputs.is_public == 'true'` | 執行 `scripts/build-pages.ts`，見 §3 |
| 6 | `actions/configure-pages@v5` | 同上 | 官方標準步驟 |
| 7 | `actions/upload-pages-artifact@v3`（`path: pages-dist`） | 同上 | 上傳建置產物 |
| 8 | `actions/deploy-pages@v4`（`id: deployment`） | 同上 | 實際部署。`id` MUST 為 `deployment`，供 §1 的 `environment.url` 引用 `steps.deployment.outputs.page_url` |
| 9 | **失敗通知**（FR-017） | `if: failure()`（僅在本 job 內先前 step 失敗時觸發；`is_public != 'true'` 造成的 skip 不算失敗，不觸發） | `npx tsx scripts/notify-pages-failure.ts`，見 §4。對第一個已設定的 webhook 發送琥珀色 Discord 通知，內容明示「Pages 未更新、當日核心推播與 state 不受影響」 |

## 3. `scripts/build-pages.ts` 的執行環境

| 環境變數 | 用途 | 對應 |
| --- | --- | --- |
| `STATE_FILE` | 同 `push` job（指向 `.state/state.json`） | 與既有 `main.ts` 共用同一命名，不新增變數名 |
| `PAGES_OUTPUT_DIR` | 建置產物輸出目錄（`pages-dist`） | research R11 |
| `PAGES_BASE_URL` | 由 workflow 以 `github.repository_owner` + repo 名稱組成 | research R7 |
| `DISCORD_WEBHOOK_URL_FOUNDATION` / `DISCORD_WEBHOOK_URL_INTERVIEW_READY` / `DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY` | 同 `push` job 三個既有 secrets（不新增變數名）；`pages` job 內**僅用於判斷該 Track 是否啟用**，MUST NOT 建立 webhook client、MUST NOT 發送任何 Discord 訊息 | research R13：供 `build-pages.ts` 以 `parseWebhooks(env)` 算出 `SiteBuildInput.enabledTracks` |

`build-pages.ts` MUST：
- 讀取上述環境變數，`STATE_FILE`／`PAGES_OUTPUT_DIR`／`PAGES_BASE_URL` 缺任一必要項 fail-fast（比照
  `src/config.ts` 現行模式），非零 exit code 結束；三個 `DISCORD_WEBHOOK_URL_*` 允許同時缺席（對應零
  Track Edge Case）。
- 以 `parseWebhooks(env)`（`src/config.ts` 既有 export）+ `TRACK_ORDER.filter(...)` 算出
  `enabledTracks`；**MUST NOT** 呼叫 `loadConfig(env)`（research R13：`loadConfig()` 在零 enabledTracks
  時會 throw，與零 Track Edge Case 的預期行為衝突）。
- 呼叫 `loadCompilerDeps()` 取得 `SiteBuildInput.deps`（`CompilerDeps` 原封傳入，不拆解重組——
  `graph`／`bank`／`schedules`／`readArticle`／`articleCache` 皆由它提供，見 data-model.md §5），
  並以 `state-store.ts` 的 `load(stateFile, enabledTracks)` 取得 `SiteBuildInput.state`；呼叫
  [site-build-contract.md](./site-build-contract.md) 的 `buildSite()`，將回傳的 `SiteOutput` 逐一寫入
  `PAGES_OUTPUT_DIR`。
- MUST NOT 呼叫任何 GitHub API（可見性偵測已在 step 4 完成，見 research R5）。

## 4. 失敗通知（FR-017）

分為**組版**（`src/` 純函式）與**發送**（`scripts/` I/O 邊界）兩層，比照本專案既有分工
（`src/renderer/alert.ts` 組版、`src/main.ts` 發送）。

### 4.1 組版：`src/renderer/alert.ts`

複用既有的顏色區分模式（`ALERT_COLOR` 紅、`COMPLETION_COLOR` 綠），新增第三色：

```ts
// src/renderer/alert.ts 新增
const PAGES_FAILURE_COLOR = 0xf39c12; // 琥珀色，與既有紅／綠明確區分

export function renderPagesFailureNotice(): DiscordEmbed[];
```

| 要求 | 等級 |
| --- | --- |
| 顏色 MUST 與 `ALERT_COLOR`（紅，核心推播失敗）不同 | MUST |
| 顏色 MUST 與 `COMPLETION_COLOR`（綠，完課通知）不同 | MUST |
| 內文 MUST 明示「Pages 未更新，當日核心推播與 state 不受影響」 | MUST |
| 純函式、固定文案，不含時間戳（與 `renderCompletionNotice` 同理由：憲章 XII） | MUST |

### 4.2 發送：`scripts/notify-pages-failure.ts`（新增）

`renderPagesFailureNotice()` 只回傳 `DiscordEmbed[]`，**本身不具備發送能力**；發送由本腳本負責，
由 §2 step 9 以 `npx tsx scripts/notify-pages-failure.ts` 呼叫。

| 要求 | 等級 | 說明 |
| --- | --- | --- |
| MUST 依 `TRACK_ORDER` 順序選出**第一個已設定**的 `DISCORD_WEBHOOK_URL_*` 作為發送目標 | MUST | 與既有「最後防線通知」step 的選擇順序一致（foundation → interviewReady → interviewMastery） |
| 三個 webhook 皆未設定時 MUST 只記錄本機日誌並以 exit code 0 結束 | MUST | 零 Track 情境下無處可通知，不是錯誤 |
| 發送 MUST 包在 try/catch；發送本身失敗只記本機日誌並以 exit code 0 結束 | MUST | job 已是 `continue-on-error`，發送失敗無下游影響；MUST NOT 讓通知失敗製造第二層雜訊 |
| MUST NOT 讀取 `state.json`、MUST NOT 呼叫 `buildSite()`、MUST NOT 呼叫任何 GitHub API | MUST | 職責僅為「送出一則固定通知」 |
| MUST NOT 影響 `push` job 或 `state` 分支 commit（已由 job 隔離保證） | MUST | — |

> **已知限制（刻意接受）**：本腳本依賴 `npm ci` 已成功安裝 `tsx`。若失敗發生在 `npm ci`／`npm run build`
> 這兩個更早的 step，通知將無法送出。FR-017 實際要涵蓋的失敗點（可見性偵測、`build:pages`、
> `deploy-pages`）全部在其之後，故接受此破口，換取「色彩與文案集中於 `alert.ts` 且可被單元測試釘死」。

## 5. `.gitignore` 新增

```
pages-dist/
```

（research R11；比照既有 `dist/` 慣例，不 commit 建置產物）

## 6. 反向約束（防止實作漂移）

| MUST NOT | 理由 |
| --- | --- |
| 把 Pages 建置與發佈拆成獨立 workflow 檔 | Assumptions：本 Feature 是既有每日推播流程新增的附加末段 |
| 在 `pages` job 內重新執行 `push` job 已做過的 state commit | 職責重複，且可能與 `push` job 的 commit 產生競爭 |
| 讓 `daily.yml` 出現任何 LLM 金鑰名稱字樣 | 憲章 VIII；既有 `tests/unit/daily-no-llm-key.test.ts` 掃描整份 `daily.yml`，本 Feature 的新增內容自動受檢 |
| 在偵測可見性失敗時仍嘗試發佈 | research R5：安全預設為不發佈，避免誤將無法確認的私有內容公開 |
