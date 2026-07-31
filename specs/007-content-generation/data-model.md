# Phase 1 Data Model: 007-content-generation

本檔定義 F7 產線消費 / 產出的實體與其驗證規則。**既有 schema（Skeleton frontmatter、modules.json、Problem
Bank、TrackSchedule、Overlay）為 F2–F4 真實來源，本 Feature 沿用不改形狀**；此處僅補 F7 新增/擴充的部分，並標明
每個實體由哪一關 Gate 守。

---

## 1. Concept Skeleton（`concepts/{topic}/{NNN}-{slug}.md`）— Stage 1 產出、定稿後凍結

沿用 §10.1 / F2 `conceptFrontmatterSchema`（不改）。F7 相關約束：

| 欄位 | 型別 | F7 生成約束 |
| --- | --- | --- |
| `id` | kebab slug | 全域唯一（結構 Gate）；LLM 起草、人工定稿確認 |
| `module` / `topic` | string | MUST 對應 `modules.json` 既有 16 Module / Topic |
| `difficulty` | `easy` \| `medium` | 依 §8 difficulty 判定基準 |
| `prerequisite` / `next` | slug[] | 雙向一致、無環、無前向依賴（結構 Gate；F2 `curriculum.ts`） |
| `leetcode` | int[] | **1–3 個候選題號（Q1：LLM 只提號）**；填入後每個 MUST 存在於 Problem Bank |
| 其餘（`title`/`pattern_label`/`complexity_label`/`estimated_minutes`/`learning_goal`/`exit_criteria`/`tags`） | 見 F2 schema | `exit_criteria` MUST ≤ §10.2 條數/長度上限 |

**Author Hints 段**（markdown 條列，§10.4）：SHOULD 涵蓋核心觀念一句話、Pattern 辨識線索、Thinking、Common
Mistakes、TS/Python 語言重點、每個候選題目「為何適合此 Pattern」一句話（供 Stage 2 展開 `whyThisPattern`/Hint）。

**凍結訊號**：Skeleton 於工作目錄無未提交變更 = 已定稿凍結（R12）。

---

## 2. Curriculum Outline（`curriculum/outline.md`）— Stage 1 產出、唯一人工定稿物

Markdown，由 `scripts/lib/outline.ts` 依 modules.json 宣告序 + 各 Skeleton frontmatter **確定性序列化**（同輸入
→ 同輸出，可單測）。內容區塊（每 Module → 每 Topic → 每 Concept）：

- Module 標題（level、id、title）
- Topic 標題（id、title、Concept 數）
- 每 Concept 一列：`NNN` · `id` · `title` · `difficulty` · `prerequisite`→ · `next`→ · `leetcode`（候選題號）

**用途**：人工一次性定稿（只看方向：顆粒度/順序/依賴），非逐篇審 Hints。非機器消費物（不被 Compiler 讀）。

---

## 3. Full Article（`articles/{topic}/{NNN}-{slug}.md`）— Stage 2 產出、過 Gate 後凍結

沿用 §10 固定區塊與 F5 `content.ts` 解析（`ArticleMeta` / `ArticleContent` / `ArticleChallengeEntry`，不改型別）。
F7 生成 MUST 滿足的固定區塊（缺任一即區塊完整性 Gate 擋下）：

| 區塊分類 | 區塊 | Gate |
| --- | --- | --- |
| 閱讀用（8） | Concept / Thinking / Pattern Recognition / Common Mistakes / Complexity / TypeScript Corner / Python Corner / Tomorrow Preview | 存在且非空（`content.ts` `READING_SECTIONS`） |
| 推播用（4） | Digest / TypeScript Tip / Python Tip / Takeaway | 存在 + 字元預算（§14.5） |
| 題目 | Today's Challenge（每候選題一條目：`whyThisPattern` + `hint`） | 每題號存在於 bank、slug 一致（`problem.ts`） |
| frontmatter | id/title/module/pattern_label/complexity_label/estimated_minutes/exit_criteria | zod（`ArticleMeta`） |

**F7 新增內容約束**：
- **繁中判準**（R7）：散文（排除程式碼區塊/行內 code）無簡體字、CJK 佔比 ≥ 門檻。
- **觀念本體 ≤2,000 字**（§10.3）：`Concept` 區塊（或 §10.3 定義的觀念本體範圍）字數上限。
- **程式碼自帶斷言**（R6）：`TypeScript Corner/Tip`、`Python Corner/Tip` 各 fenced block MUST 含 assert/throw，
  且編譯通過 + 斷言成功。
- **繁中保留英文**：技術術語/Pattern 名稱/API/程式碼保留原文（§11）。

**驗證狀態流**：`草稿 → [品質 Gate 逐關] → (不過) 重生 (≤3 次) → (仍不過) needsHumanReview → (過) 凍結`。

---

## 4. Problem Bank（`data/problem-bank.json`）— F3 形態，F7 擴充後凍結

沿用 §12.1 metadata 形狀（`id/slug/title/url/difficulty/patterns/...`，不改）。F7 擴充規則（Q1 / R5）：

- 新題號的 `id/slug/title/url/difficulty` **MUST 由 `populate-problem-bank.ts` 從權威來源帶入**，MUST NOT 由
  LLM 生成。`url` slug MUST 與 `slug` 一致（既有 Gate）。
- `patterns` 由 Concept ↔ Problem 逆向對應維護（Concept 的 `topic`/pattern key）。
- **合併語意**：既有題號不被覆蓋（除非 `--force`）；只新增缺漏題號。
- 擴充後 commit 凍結，Stage 1 結構 Gate 以此檢查「候選題號存在性」。

### 4b. LeetCode Metadata Snapshot（`data/leetcode-index.json`）— 🆕 R5 主來源

題號 → `{ slug, title, difficulty }` 的 committed 快照，供 `populate` 離線帶入 metadata；缺項時以線上 GraphQL
metadata 補齊後寫回。**只含 metadata、無題目描述**（§5）。此檔為可重生成的產線輔助資料（非教材）。

---

## 5. TrackSchedule / TrackParams（`schedules/{track}.json` / `curriculum/track-params.json`）

- `schedules/{track}.json`：F4 生成物形狀（不改）；F7 對正式 DAG 重新生成，byte-identical、拓樸子序列合法。
- `track-params.json`：**F7 修改值（非形狀）**——三軌 `maxLevel` 由 `1` → `15`（全量涵蓋）；`problemDifficulties`
  / `challengeDifficulty` / `rhythm` 維持三軌分歧（R11）。

---

## 6. Generation Checkpoint Manifest（`.cache/content-manifest.json`）— 🆕 gitignored，加速快取

```jsonc
{
  "version": 1,
  "concepts": {
    "<conceptId>": {
      "skeletonHash": "<sha256 of concepts/.../NNN-slug.md>",
      "skeletonFrozen": true,        // 工作目錄無未提交變更
      "articleFrozen": true,         // articles/.../NNN-slug.md 已存在且過 Gate
      "gatePassed": true,
      "needsHumanReview": false,     // 重生 3 次仍不過（R8）
      "regenCount": 0
    }
  }
}
```

- **非真實來源**：遺失可由掃描 `concepts/**` + `articles/**` 重算重建（R4）。
- **用途**：Stage 1/2 續跑跳過判斷（產物存在 + 雜湊一致 ⇒ skip，除非 `--force`）；記錄 `needsHumanReview` 供
  收尾報告。

---

## 7. Generation Config（環境變數 / 旗標）

| 名稱 | 位置 | 說明 |
| --- | --- | --- |
| `GEMINI_API_KEY` | env/Secret | 缺 ⇒ fail-fast（FR-025）；MUST NOT 入 `daily.yml` |
| `RPM_LIMIT` | env（可選，預設 10） | R3 節流速率 |
| `--force` | CLI 旗標 | 覆蓋冪等、重生已凍結（§20.4） |
| `--only <conceptId,...>` | CLI 旗標（可選） | 只處理指定 Concept（除錯/局部重生） |
| `--allow-dirty` | CLI 旗標（Stage 2，開發用） | 繞過「Skeleton 已凍結」前置檢查（R12） |

---

## 實體關係（生成流向）

```text
modules.json (16 Module 骨架, F2)
   │  Stage 1: LLM 起草
   ▼
concepts/** (Skeleton: frontmatter + Author Hints)  ──候選題號──►  populate-problem-bank.ts
   │                                                                    │ 驗證+metadata
   │  結構 Gate (curriculum.ts, 重用 F2)  ◄──────── data/problem-bank.json (+ leetcode-index.json)
   ▼
curriculum/outline.md ──► 【人工定稿 commit 凍結（唯一檢查點）】
   │  Stage 2: LLM 展開（讀凍結 Skeleton）
   ▼
articles/** (Full Article) ──► 品質 Gate（結構/繁中/程式碼實測/題目/預算/完整編譯/self-check）──► 凍結
   │
   ▼  課綱凍結後
track-params.json(maxLevel→15) + DAG ──► generate-schedule.ts ──► schedules/{track}.json ×3 (byte-identical)
```
