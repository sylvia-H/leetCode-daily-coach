// F7 Stage 2 prompt 模板（§10 固定區塊、§11 繁中保留英文術語）。純函式：只組字串 / 組 schema 物件，
// 不呼叫 LLM。結構欄位（id/title/module/topic/pattern_label/complexity_label/leetcode/prerequisite/next）
// 一律由凍結 Skeleton frontmatter 帶入、generate-content.ts 組裝，MUST NOT 交給 LLM 重新生成或改動
// （FR-024，tests/unit/no-structure-mutation.test.ts 守）；LLM 只產生 §10 各區塊的教學文字。
import type { ResponseSchema } from "../llm-client.js";

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
  /**
   * 上一次嘗試被 Gate 擋下的原因（重生時才有值）。
   *
   * 為何需要：原本重生是重送**一模一樣**的 prompt。這對偶發失誤有效，但對**系統性**偏差無效
   * ——實測第一篇文章連續兩次因俚語「寫扣」被擋、第三次才過，等於重擲三次同樣的骰子。額度是
   * 免費層批次的瓶頸，每篇多打兩次會讓 165 篇的批次從 2～4 天變成 6～12 天。
   * 與 Stage 1 `buildStage1Prompt` 的 `retryFeedback` same pattern。
   */
  retryFeedback?: string;
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

/**
 * DraftArticleResponse 中每個 MUST 為非空字串的區塊欄位（結構欄位不在此，一律由 Skeleton 帶入）。
 *
 * 單一來源：同時供 (a) 本檔組 responseSchema 的 `required`／`propertyOrdering`，
 * (b) generate-content.ts 的 `parseDraftArticleResponse` 逐欄驗證。兩處各留一份清單必然漂移
 * ——schema 要求了某欄、解析端卻不驗（或反之），正是這類缺陷最容易溜過去的地方。
 */
export const REQUIRED_ARTICLE_TEXT_FIELDS = [
  "concept",
  "thinking",
  "patternRecognition",
  "commonMistakes",
  "complexity",
  "tsCorner",
  "pyCorner",
  "tomorrowPreview",
  "digest",
  "tsTip",
  "pyTip",
  "takeaway",
] as const satisfies readonly (keyof DraftArticleResponse)[];

/**
 * Stage 2 的結構化輸出 schema（`llmClient.generate` 的第二參數）。由 API 層強制保證回應含齊全部
 * 區塊，取代原本「prompt 規則 6 列出欄位清單、請 LLM 自律」的做法。
 *
 * 實測起因：以純文字輸出跑第一篇（computational-thinking-basics）時，**連續三次重生都缺
 * `complexity` / `tsCorner` / `pyCorner` 三個欄位**——與 Stage 1「總是回 9 個 Concept」同性質的
 * 系統性偏差，重打同一份 prompt 不會變好（缺欄位會讓 `assembleArticleMarkdown` 把字面字串
 * `undefined` 插進文章，故 parseDraftArticleResponse 以 fail loud 擋下，見該函式註解）。
 *
 * ⚠️ `challenge` 陣列 MUST NOT 加 minItems / maxItems：對 items 為複雜 OBJECT 的陣列加任何長度
 * 約束，整個請求會被 API 以 400 INVALID_ARGUMENT 拒收（實測見 stage1-curriculum.ts 的
 * `buildStage1ResponseSchema` docblock）。「每個候選題各恰好一條」的約束仍由 prompt 規則 4 表達，
 * 並由 generate-content.ts 對照候選題號逐一驗證。
 */
export function buildStage2ResponseSchema(): ResponseSchema {
  const properties: Record<string, ResponseSchema> = {};
  for (const field of REQUIRED_ARTICLE_TEXT_FIELDS) properties[field] = { type: "STRING" };
  properties.challenge = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        id: { type: "INTEGER", description: "LeetCode 題號，MUST 與候選題目一致" },
        whyThisPattern: { type: "STRING" },
        hint: { type: "STRING" },
      },
      required: ["id", "whyThisPattern"], // hint 為選配（§10 契約）
    },
  };
  return {
    type: "OBJECT",
    properties,
    required: [...REQUIRED_ARTICLE_TEXT_FIELDS, "challenge"],
    // 依 §10 的區塊順序生成，讓長文的產出順序穩定、也利於模型先鋪陳觀念再寫程式碼。
    propertyOrdering: [...REQUIRED_ARTICLE_TEXT_FIELDS, "challenge"],
  };
}

export function buildStage2Prompt(input: Stage2PromptInput): string {
  const problemsList =
    input.candidateProblems.length > 0
      ? input.candidateProblems
          .map((p) => `- 題號 ${p.id}${p.seedWhyThisPattern ? `（草稿線索：${p.seedWhyThisPattern}）` : ""}`)
          .join("\n")
      : "（此 Concept 無對應題目）";

  // 回饋擺在最前面：這是本次與上次唯一的差異，放在長規則清單之後容易被淹沒。
  const feedback = input.retryFeedback
    ? `⚠️ 上一次產出未通過品質 Gate，原因如下，這次 MUST 修正：\n${input.retryFeedback}\n\n`
    : "";

  return `${feedback}你是 LeetCode Daily Coach 課程引擎的教材作者。請將以下 Concept 展開為完整教學文章（Full Article）的各個區塊。

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
   **用語 MUST 正式、專業，MUST NOT 使用網路俚語或音譯用字**——這是教材，不是論壇貼文。
   例：MUST 寫「程式碼」或保留英文 code，**MUST NOT 寫「扣」「寫扣」「敲扣」**（實測曾在一篇文章內
   誤用 6 次）；同理 MUST NOT 使用「ㄊ」「der」「4」等諧音或口語簡寫。
2. concept + thinking + patternRecognition + commonMistakes 四段敘述性文字合計 MUST ≤2000 字（觀念本體，不含程式碼）。
3. **tsCorner / tsTip / pyCorner / pyTip 四個欄位的值 MUST 各自包含一個 markdown fenced code block**，
   格式**完全比照**下例（含開頭的三個反引號與語言標示、以及真正的換行字元）：

   tsCorner 的值範例：
   \`\`\`typescript
   function solve(nums: number[]): number {
     const result = nums.reduce((a, b) => a + b, 0);
     if (result !== 6) throw new Error("assertion failed");
     return result;
   }
   solve([1, 2, 3]);
   \`\`\`

   pyCorner 的值範例：
   \`\`\`python
   def solve(nums: list[int]) -> int:
       result = sum(nums)
       assert result == 6, "assertion failed"
       return result

   solve([1, 2, 3])
   \`\`\`

   **MUST NOT 把程式碼寫成單行純文字、MUST NOT 用分號把多行擠成一行、MUST NOT 省略 fence**——
   程式碼會被程式抽出後真的拿去編譯與執行，沒有 fence 就抽不到，換行被壓掉則無法執行。
   每個 code block MUST 內嵌至少一個斷言（TypeScript 用 \`throw\` 或 \`node:assert\`；Python 用 \`assert\`），
   且 MUST 能實際編譯／執行通過。
4. challenge 陣列 MUST 為每個候選題目各提供恰好一條，欄位為 { id, whyThisPattern, hint? }；id MUST 與候選題目一致，MUST NOT 新增、刪除或替換題號。
5. digest ≤900 字、tsTip/pyTip 各 ≤650 字（**含 fenced code block 本身**）、takeaway ≤120 字
   （Discord 字元預算，§14.5）；超限請自行精簡，MUST NOT 期待後續被截斷。
6. 回傳格式 MUST 為單一 JSON 物件，形狀為 DraftArticleResponse（concept/thinking/patternRecognition/commonMistakes/complexity/tsCorner/pyCorner/tomorrowPreview/digest/tsTip/pyTip/takeaway/challenge），不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。

請開始展開。`;
}
