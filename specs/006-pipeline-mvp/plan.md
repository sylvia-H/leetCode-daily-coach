# Implementation Plan: 每日 Pipeline 端到端、多 Track 失敗隔離與 MVP 驗收

**Branch**: `006-pipeline-mvp` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-pipeline-mvp/spec.md`

## Summary

F6 不新增元件，而是把 F1～F5 的既有元件**在真實素材上接成一條可驗收的每日產線**，並補上三項缺口：
**（a）不注入推播替身的端到端驗證**、**（b）完課終態語意**（clarify 定案，取代 F1「課表走完＝失敗」）、
**（c）維運 runbook 與實機驗收紀錄**。程式改動刻意保持小幅：

- **US1/US2/US3/US4（端到端驗收）**：新增 `tests/e2e/`，唯一替身是**全域 `fetch`**（Clarification 3）。
  三軌同時啟用、各自不同 `currentSessionIndex`、跳過／成功／完課／失敗四種結局、DRY_RUN，皆在真實
  `compile → render → checkBudget → WebhookClient（含重試/退避）→ advance → save` 鏈路上斷言。
  AC5 以 `prefix-sum`（三軌皆為 sessionIndex 9）作為固定 fixture：教學正文逐字相同、題目難度帶不同。
- **完課終態（FR-022 / FR-019a）**：`TrackState` 增一個選填 `completedAt`；`run()` 在 per-track guard
  之後、compile 之前插入完課檢查；完課通知由 `src/renderer/alert.ts` **同一顆通知實作**產生（非紅色），
  不經過 Compiler / Renderer，不計入非零 exit code。
- **通知的祕密遮蔽（FR-019b，2026-07-24 checklist 後新增）**：`alert.ts` 於組版前對 `reason` 做
  Discord webhook URL 樣式遮蔽——底層 `fetch` 例外訊息可能夾帶完整請求 URL，而該 URL 等同頻道寫入
  憑證（憲章 XIV）。遮蔽為純函式、單獨可測，放在**唯一出口**而非依賴呼叫端自律。
- **上線與維運（FR-023 / FR-024 / FR-027）**：新增 `docs/runbook.md`（日常維運）與
  `specs/006-pipeline-mvp/acceptance.md`（實機驗收勾選表）；`daily.yml` 的 checkout step 正名為
  「預設分支（`develop`）」並註明 `schedule` 事件只跑預設分支。

**技術取向**：沿用既有分層——純函式核心在 `src/`、I/O 與 exit code 只在 `main.ts` / `scripts/`；
**零新增相依**；`state.json` 契約以**向後相容的選填欄位**擴充（缺席＝未完課），既有 `state` 分支不需
遷移即可載入。

## Technical Context

**Language/Version**: strict TypeScript 5.5（`tsc` → `node dist/main.js`），Node.js 24。

**Primary Dependencies**: **無新增**。既有 `gray-matter` / `marked` / `zod`（F1–F5 已引入）、
Node 內建 `fetch`。測試為 `vitest` 2.x。

**Storage**: 版本控制的檔案。**狀態**＝`state` 分支的 `state.json`（經 `STATE_FILE` 指向 `.state/state.json`）；
**內容輸入**＝`curriculum/modules.json`、`concepts/**`、`articles/**`、`data/problem-bank.json`、
`schedules/{track}.json`、`overlays/{track}.json`（皆為 F2–F5 凍結產物，本 Feature 只讀不改）。

**Testing**: `vitest`（新增 `tests/e2e/`；`vitest.config.ts` 的 `include: tests/**/*.test.ts` 已涵蓋，
無需改設定）＋ 既有 `npm run typecheck` / `validate:*`。E2E 唯一替身為全域 `fetch`。

**Target Platform**: GitHub Actions（`ubuntu-latest`、Node 24）上的一次性 CLI；`schedule` 事件執行
**預設分支 `develop`** 上的 `daily.yml`。

**Project Type**: 單一專案 CLI（composition root 手寫，無框架、無 HTTP server、無常駐）。

**Performance Goals**: 一次完整每日執行（整個 workflow run）**≤ 10 分鐘**（SC-009）；實際工作量為
3 Track × 1–2 則 POST + 一次檔案讀寫，瓶頸在 `npm ci` / `tsc`，遠低於 free-tier 配額。

**Constraints**: 零 LLM runtime（`daily.yml` MUST NOT 出現 LLM 金鑰）、零常駐服務、單一 job 單一執行序
（MUST NOT 用 matrix 平行跑 Track）、全部 Track 處理完**單次存檔＋單次 commit**、`state.json` 只進
`state` 分支、字元預算 ≤ 5,500、超限 MUST NOT 截斷。

**Scale/Scope**: 3 Track × 13 個 seed Session（F7 之前）。E2E 覆蓋 39 筆 Lesson 中的代表性切片而非全量
（全量編譯已由 F5 `content-gate.yml` 涵蓋，本 Feature MUST NOT 重複建第二套全量 Gate）。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

逐條對照 `.specify/memory/constitution.md`（v1.0.1）：

| 原則 | 判定 | 說明 |
| --- | --- | --- |
| I. Concept-first, Problem-second | ✅ PASS | 版面順序由 F5 Renderer 決定，本 Feature 只消費，不改版面。 |
| II. One Concept per Session | ✅ PASS | 不觸及課表與 Concept 顆粒度。 |
| III. Small Learning Steps | ✅ PASS | 同上，不合併 Concept。 |
| IV. Deterministic Curriculum | ✅ PASS | 順序全取自 committed 課表；本 Feature 不重排、不選題、不含隨機源。 |
| V. Curriculum as DAG | ✅ PASS | 不改 DAG；`path` 由 F5 Compiler 推導。 |
| VI. Shared Knowledge, Different Tracks | ✅ PASS | **本 Feature 主動驗證此條**：E2E 以 `prefix-sum` 斷言三軌正文逐字相同、題目難度帶不同（SC-007）。 |
| VII. LLM Authors Once | ✅ PASS | 只讀凍結 `articles/**`。 |
| VIII. Zero-LLM Daily Runtime | ✅ PASS | E2E 在**不注入任何 LLM 環境變數**下跑完（FR-005）；新增測試斷言 `daily.yml` 內 LLM 金鑰出現次數為 0。 |
| IX. Build-time over Runtime／單一 Compiler | ✅ PASS | E2E `import` 的是 runtime 用的同一顆 `compile` / `render` / `checkBudget`；MUST NOT 為測試另建解析路徑。完課檢查以課表資料判定，不新增第二套課表解讀。 |
| X. Language-specific Learning | ✅ PASS | 由 F5 Compiler / Gate 保證，本 Feature 不放寬。 |
| XI. Renderer Knows Nothing About Curriculum | ✅ PASS | 完課通知走 `renderer/alert.ts`（只 import 型別、不讀檔、不知課綱），與紅色告警同一實作；`Lesson` 路徑完全不動。 |
| XII. Deterministic & Reproducible Delivery | ✅ PASS | 完課通知內容只依 `track`，無隨機、無 LLM。時間僅寫入 state，不進訊息內容（可重現）。 |
| XIII. Generated Artifacts Frozen | ✅ PASS | 不重跑生成器、不手改 `schedules/**` 與 `articles/**`。 |
| XIV. Secrets Never in Repo | ✅ PASS | 三個 webhook 全走 Actions Secrets；`acceptance.md` / `runbook.md` MUST NOT 含 URL 或金鑰（FR-025 / FR-027，並以測試掃描守住）。 |
| XV. Fault Isolation & Fail Loud | ✅ PASS | 本 Feature 的核心命題（US4）。**完課改判為非失敗**不違反本條——它不是故障；把正常終局持續報成紅色告警反而會淹沒真故障，屬「Fail loud」的正確適用而非豁免。 |
| XVI. Free-tier Only | ✅ PASS | 無新增服務、無新增相依；E2E 不起本機 server（Clarification 3 已排除 C 案）。 |
| XVII. One Human Checkpoint | ✅ PASS | 實機驗收紀錄（FR-027）是 **F6 上線的一次性驗收**，非內容產線的常態審核關卡，不牴觸本條。 |

**結論**：無違反、無需 Complexity Tracking 條目。

## Project Structure

### Documentation (this feature)

```text
specs/006-pipeline-mvp/
├── plan.md              # 本檔
├── research.md          # Phase 0：11 項決策
├── data-model.md        # Phase 1：state 契約增量與執行期實體
├── quickstart.md        # Phase 1：本機／實機驗證流程
├── acceptance.md        # 實機驗收勾選表（FR-027；由 implement 階段建立、由維運者填寫）
├── contracts/
│   ├── state-schema.md      # `completedAt` 增量（F1 契約的修訂）
│   ├── cli-contract.md      # 執行模式 × 完課的 exit code／日誌契約增量
│   ├── notice-contract.md   # 告警 + 完課通知的單一實作契約
│   └── e2e-harness.md       # 端到端驗證的替身邊界與斷言契約
├── checklists/          # /speckit-checklist 產出的四份需求品質 checklist ＋ 通用 requirements
│   ├── requirements.md
│   ├── e2e.md
│   ├── ops.md
│   ├── resilience.md
│   └── state.md
└── tasks.md             # /speckit-tasks 產出（非本指令）
```

### Source Code (repository root)

```text
src/
├── main.ts                    # ✏️ 逐 Track 迴圈插入完課檢查；完課不計 anyFailed
├── config.ts                  # 不變
├── state/state-store.ts       # ✏️ TrackState 增選填 completedAt；驗證放行；新增 markCompleted()
├── renderer/alert.ts          # ✏️ 同檔新增 renderCompletionNotice()（非紅色；單一通知實作）
│                              #    ＋ reason 的 webhook URL 遮蔽（FR-019b，純函式可單測）
├── compiler/**                # 不變（F5）
├── discord/webhook-client.ts  # 不變（F1/F5）
└── renderer/{discord,budget}.ts # 不變（F5）

tests/
├── e2e/                       # 🆕 唯一替身為全域 fetch 的端到端驗證
│   ├── three-tracks.test.ts       # US1：三軌不交叉、各自 sessionIndex、AC5 共用正文
│   ├── guard-and-modes.test.ts    # US2：同日去重、force、dry-run、UTC 跨日
│   ├── state-advance.test.ts      # US3：成功 +1／失敗不動／單次存檔／自動補建
│   ├── isolation.test.ts          # US4：單軌失敗隔離、告警失敗、部分推播
│   └── completion.test.ts         # 完課終態：一次通知、其後靜默、exit 0
├── helpers/fetch-recorder.ts  # 🆕 fetch 攔截與請求記錄（contracts/e2e-harness.md）
└── unit/
    ├── no-push-stub.test.ts   # 🆕 守門測試：掃描 tests/e2e/** 不含 pushTrack（置於 unit 以免自我命中）
    └── **                     # 既有測試保留（分支覆蓋），MUST NOT 作為 AC2/AC5/AC10 唯一證據

.github/workflows/daily.yml    # ✏️ checkout step 正名為「預設分支（develop）」+ 註解
docs/runbook.md                # 🆕 維運 runbook（FR-023）
```

**Structure Decision**: 沿用單一專案結構，不新增頂層目錄。新增的唯一目錄是 `tests/e2e/`——與
`tests/unit/` 分開，是為了讓「替身邊界不同」這件事在檔案佈局上一眼可辨（`unit` 可注入 `pushTrack`，
`e2e` 只准替換 `fetch`），並讓 SC-006 的「不使用推播替身」可用目錄層級的掃描測試守住。

## Post-Design Constitution Re-Check

Phase 1 設計完成後重新對照，**判定不變（全數 PASS）**。設計過程新增的三項自我約束值得記錄：

| 設計決定 | 對應原則 | 效果 |
| --- | --- | --- |
| `completedAt` 為**選填**欄位、`save()` 未設定時不寫出該鍵 | XIII / XV | 既有 `state` 分支不需遷移，也不產生無語意 diff；唯一權威狀態不因新功能而承擔遷移風險 |
| `renderCompletionNotice` **不含時間戳**（時間只進 state） | XII | 保住「同輸入 → 同輸出」的純函式性，測試不需凍結系統時間 |
| 以掃描測試禁止 `tests/e2e/**` 出現 `pushTrack`（測試本身置於 `tests/unit/`） | IX / XV | 讓「不使用推播替身」（SC-006）成為機器可驗的約束，而非文件上的承諾；置於 `unit` 是為了不讓守門測試落入自己的掃描範圍 |

唯一需要說明的判定是 **XV（Fault Isolation & Fail Loud）**：F6 把「課表走完」從 exit≠0 改判為 exit 0。
這不是對 Fail loud 的豁免——完課是課程的正常終局，不是故障；把它持續報成紅色告警會讓真正的故障
淹沒在每日雜訊中，反而**降低**告警的可信度。此決策已於 clarify 定案並回寫 `docs/spec.md` §9.2 / §18，
非本 plan 的單方裁量。

## Complexity Tracking

> Constitution Check（前後兩次）全數 PASS，無需正當化條目。
