// F11 題庫產線 Stage A：面向列舉 prompt + response schema（FR-016、quiz-bank-schema.md §5.2／§5.5／§5.6）。
// 純字串組裝，不做 I/O、不 runtime import @google/genai（憲章 VIII）。輸入 MUST 由呼叫端
// （scripts/generate-quiz-bank.ts，唯一 I/O 點）組裝——本模組不讀 node.skeletonPath。
import type { ResponseSchema } from "../llm-client.js";

export interface QuizAspectsConceptBrief {
  id: string;
  title: string;
  learningGoal: string[];
}

export interface QuizAspectsInput {
  concept: {
    id: string;
    title: string;
    learningGoal: string[];
    exitCriteria: string[];
  };
  /** 由呼叫端從 node.skeletonPath 讀入後切出的 Author Hints 段落；
   * TypeScript 重點／Python 重點 MUST NOT 出現於此（quiz-bank-schema.md §5.5）。 */
  authorHints: {
    核心觀念: string;
    Pattern辨識線索: string;
    Thinking: string;
    CommonMistakes: string;
  };
  /** 只供「區辨點」使用，MUST NOT 含鄰居的 Author Hints 全文（quiz-bank-schema.md §5.5）。 */
  neighbors: {
    prerequisite: QuizAspectsConceptBrief[];
    next: QuizAspectsConceptBrief[];
  };
  /** 上一次嘗試被 Gate 或交叉驗證擋下的原因（重生時才有值）。 */
  retryFeedback?: string;
}

export interface DraftQuizAspects {
  aspects: string[];
}

export function buildQuizAspectsResponseSchema(): ResponseSchema {
  return {
    type: "OBJECT",
    properties: {
      aspects: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
    required: ["aspects"],
  };
}

function renderNeighbors(list: QuizAspectsConceptBrief[]): string {
  if (list.length === 0) return "（無）";
  return list.map((n) => `- ${n.title}（id: ${n.id}）：${n.learningGoal.join("；")}`).join("\n");
}

export function buildQuizAspectsPrompt(input: QuizAspectsInput): string {
  const feedback = input.retryFeedback
    ? `⚠️ 上一次產出未通過品質 Gate 或交叉驗證，原因如下，這次 MUST 修正：\n${input.retryFeedback}\n\n`
    : "";

  return `${feedback}你是 LeetCode Daily Coach 課程引擎的測驗設計者。請針對以下 Concept，列舉可作為
選擇題出題依據的「面向」（aspect）——每個面向是學習者需要真正理解、而非死記的一個觀念切入點或
常見誤區。

Concept: ${input.concept.title}（id: ${input.concept.id}）
Learning Goal: ${input.concept.learningGoal.join("；")}
Exit Criteria: ${input.concept.exitCriteria.join("；")}

Author Hints：
- 核心觀念：${input.authorHints.核心觀念}
- Pattern 辨識線索：${input.authorHints.Pattern辨識線索}
- Thinking：${input.authorHints.Thinking}
- Common Mistakes：${input.authorHints.CommonMistakes}

前置 Concept（僅供區辨點參考，MUST NOT 整體搬入面向）：
${renderNeighbors(input.neighbors.prerequisite)}

後續 Concept（僅供區辨點參考，MUST NOT 整體搬入面向）：
${renderNeighbors(input.neighbors.next)}

規則（MUST 遵守）：
1. 面向 MUST 完整涵蓋 Learning Goal、Exit Criteria、以及上列 Author Hints 四段（核心觀念／
   Pattern 辨識線索／Thinking／Common Mistakes）所描述的內容，不得遺漏任一段所指向的重點。
2. 前置與後續 Concept 只能用來衍生「與本 Concept 的區辨點」（例如：本 Concept 與前置 Concept
   的關鍵差異是什麼），MUST NOT 將鄰居 Concept 的正題整體搬入本 Concept 的面向清單。
3. MUST NOT 涉及任何程式語言 API 用法或語法細節（例如特定語言函式簽名、標準函式庫用法）——
   面向 MUST 是可遷移的觀念性理解，不是語言記誦。
4. 面向清單本身 MUST NOT 提及任何數量（不得說明面向的個數或建議出題數）——面向的多寡完全由
   涵蓋上述內容自然決定，不是預先設定的目標。
5. 每個面向 MUST 是一句簡短描述（供下一階段依此出題），彼此 MUST NOT 是同一件事的換句話說。
6. 回傳格式 MUST 為單一 JSON 物件：{ "aspects": string[] }，不得包含 JSON 以外的文字或
   markdown code fence 包裹整個回應。全文以繁體中文撰寫。

請開始列舉。`;
}
