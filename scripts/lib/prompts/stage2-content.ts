// F7 Stage 2 prompt 模板（§10 固定區塊、§11 繁中保留英文術語）。純函式：只組字串，不呼叫 LLM。
// 結構欄位（id/title/module/topic/pattern_label/complexity_label/leetcode/prerequisite/next）一律
// 由凍結 Skeleton frontmatter 帶入、generate-content.ts 組裝，MUST NOT 交給 LLM 重新生成或改動
// （FR-024，tests/unit/no-structure-mutation.test.ts 守）；LLM 只產生 §10 各區塊的教學文字。

export interface Stage2CandidateProblem {
  id: number;
  /** Stage 1 Author Hints 已有的「為何適合此 Pattern」種子句，供 LLM 展開參考（非必填）。 */
  seedWhyThisPattern?: string;
}

export interface Stage2PromptInput {
  conceptId: string;
  title: string;
  patternLabel: string;
  complexityLabel: string;
  learningGoal: string[];
  exitCriteria: string[];
  /** Stage 1 產出的 Author Hints 原始 markdown 文字（核心觀念/Pattern 辨識線索/Thinking/Common Mistakes/語言重點）。 */
  authorHints: string;
  candidateProblems: Stage2CandidateProblem[];
}

/** Stage 2 LLM 回應中的單一候選題目教學說明（whyThisPattern MUST NOT 省略；hint 選配）。 */
export interface DraftChallengeEntry {
  id: number;
  whyThisPattern: string;
  hint?: string;
}

/** Stage 2 LLM 回應形狀：只含 §10 各區塊教學文字，不含任何結構欄位。 */
export interface DraftArticleResponse {
  concept: string;
  thinking: string;
  patternRecognition: string;
  commonMistakes: string;
  complexity: string;
  /** 內含 fenced ```typescript code block，MUST 自帶斷言（`throw` 或 `node:assert`）。 */
  tsCorner: string;
  /** 內含 fenced ```python code block，MUST 自帶斷言（`assert`）。 */
  pyCorner: string;
  tomorrowPreview: string;
  digest: string;
  /** 內含 fenced ```typescript code block，MUST 自帶斷言。 */
  tsTip: string;
  /** 內含 fenced ```python code block，MUST 自帶斷言。 */
  pyTip: string;
  takeaway: string;
  challenge: DraftChallengeEntry[];
}

export function buildStage2Prompt(input: Stage2PromptInput): string {
  const problemsList =
    input.candidateProblems.length > 0
      ? input.candidateProblems
          .map((p) => `- 題號 ${p.id}${p.seedWhyThisPattern ? `（草稿線索：${p.seedWhyThisPattern}）` : ""}`)
          .join("\n")
      : "（此 Concept 無對應題目）";

  return `你是 LeetCode Daily Coach 課程引擎的教材作者。請將以下 Concept 展開為完整教學文章（Full Article）的各個區塊。

Concept: ${input.title}（id: ${input.conceptId}）
Pattern: ${input.patternLabel}
Complexity: ${input.complexityLabel}
Learning Goal: ${input.learningGoal.join("；")}
Exit Criteria: ${input.exitCriteria.join("；")}

Author Hints（Stage 1 草稿，供你展開參考）：
${input.authorHints}

候選題目：
${problemsList}

規則（MUST 遵守）：
1. 全文以繁體中文撰寫；技術術語、Pattern 名稱、API、程式碼 MUST 保留英文原文，不得翻譯（§11）。
2. concept + thinking + patternRecognition + commonMistakes 四段敘述性文字合計 MUST ≤2000 字（觀念本體，不含程式碼）。
3. tsCorner/tsTip 的 TypeScript fenced code block、pyCorner/pyTip 的 Python fenced code block MUST 各自內嵌至少一個斷言（TypeScript 用 \`throw\` 或 \`node:assert\`；Python 用 \`assert\`），且程式碼須能實際編譯/執行通過。
4. challenge 陣列 MUST 為每個候選題目各提供恰好一條，欄位為 { id, whyThisPattern, hint? }；id MUST 與候選題目一致，MUST NOT 新增、刪除或替換題號。
5. digest ≤900 字、tsTip/pyTip 各 ≤450 字、takeaway ≤120 字（Discord 字元預算，§14.5）；超限請自行精簡，MUST NOT 期待後續被截斷。
6. 回傳格式 MUST 為單一 JSON 物件，形狀為 DraftArticleResponse（concept/thinking/patternRecognition/commonMistakes/complexity/tsCorner/pyCorner/tomorrowPreview/digest/tsTip/pyTip/takeaway/challenge），不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。

請開始展開。`;
}
