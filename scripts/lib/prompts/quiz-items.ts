// F11 題庫產線 Stage B：據面向出題 prompt + response schema
// （FR-006、FR-010、FR-016，quiz-bank-schema.md §5.2）。純字串組裝，不做 I/O。
import type { ResponseSchema } from "../llm-client.js";

export interface QuizItemsPromptInput {
  conceptId: string;
  conceptTitle: string;
  /** Stage A 的面向清單（宣告序不代表出題序）。 */
  aspects: string[];
  /** 上一次嘗試被 Gate 或交叉驗證擋下的原因（重生時才有值）。 */
  retryFeedback?: string;
}

export interface DraftQuizItem {
  stem: string;
  options: string[];
  answerIndex: number;
  explanation: string[];
  /**
   * 本題對應的面向原文（須逐字等於面向清單中的一項）。**非最終 QuizItem 的一部分**（該型別只有
   * stem/options/answerIndex/explanation）——僅供 generate-quiz-bank.ts 在交叉驗證不通過時，
   * 定位「該題所屬面向」以重出一題（換考核角度），quiz-bank-schema.md §5.2 的重生規則需要這個
   * 對應關係才可執行，寫入題庫前會被捨棄。
   */
  aspect: string;
}

export interface DraftQuizItems {
  items: DraftQuizItem[];
}

export function buildQuizItemsResponseSchema(): ResponseSchema {
  return {
    type: "OBJECT",
    properties: {
      // items 陣列本身 MUST NOT 加 minItems/maxItems（items 為複雜 OBJECT，會被 API 以 400 拒收，
      // 且加了也違反 FR-016「MUST NOT 出現任何題數字」的精神）。
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            stem: { type: "STRING" },
            // options / explanation 的 items 為單純 STRING，加 minItems/maxItems 安全（llm-client.ts
            // docblock：僅 items 為複雜 OBJECT 的陣列才會被拒收）。這是題目結構本身的恰定形狀
            // （4 選項、5 段詳解），非「出多少題」的數字，不受 FR-016 規範。
            options: { type: "ARRAY", items: { type: "STRING" }, minItems: "4", maxItems: "4" },
            answerIndex: { type: "INTEGER", minimum: 0, maximum: 3 },
            explanation: { type: "ARRAY", items: { type: "STRING" }, minItems: "5", maxItems: "5" },
            aspect: { type: "STRING" },
          },
          required: ["stem", "options", "answerIndex", "explanation", "aspect"],
        },
      },
    },
    required: ["items"],
  };
}

export function buildQuizItemsPrompt(input: QuizItemsPromptInput): string {
  const feedback = input.retryFeedback
    ? `⚠️ 上一次產出未通過品質 Gate 或交叉驗證，原因如下，這次 MUST 修正：\n${input.retryFeedback}\n\n`
    : "";

  const aspectsList = input.aspects.map((a) => `- ${a}`).join("\n");

  return `${feedback}你是 LeetCode Daily Coach 課程引擎的測驗設計者。請針對以下 Concept 的每一個面向，
出選擇題（單選、四選項）。同一面向 MAY 從不同考核角度出多題，MUST NOT 為了填數量而重複同一角度。

Concept: ${input.conceptTitle}（id: ${input.conceptId}）

面向清單：
${aspectsList}

規則（MUST 遵守）：
1. 每一題 MUST 有恰好 4 個選項，唯一正解由 answerIndex（0-based）指出。
2. options 的文字 MUST NOT 含 "A."、"B."、"1."、"(a)" 等代號前綴——呈現層會自行加上，你只需提供
   純文字選項內容。
3. explanation MUST 恰為 5 段，依序為：
   [0] 結論句，MUST ≤80 字，直接說出正解是什麼（不含理由）；
   [1] 正解為何成立的完整說明；
   [2]-[4] 依序說明其餘三個選項各自為何不成立（一段對應一個錯誤選項，順序與 options 中除正解外
   的其餘選項一致）。
4. MUST NOT 在題幹、選項或詳解中提及任何 LeetCode 題號或題目連結——這是自製選擇題，不是 LeetCode
   題目改寫。複雜度標記（如 O(n²)）、陣列索引、題目情境中的數值可以正常出現，這不是題號。
5. MUST NOT 考核任何程式語言 API 用法或語法細節；MUST 考核可遷移的觀念性理解。
6. 全文以繁體中文撰寫；技術術語、Pattern 名稱、程式碼片段 MUST 保留英文原文（§11）。
7. MUST NOT 提及任何題數或面向數字（含上限）——出多少題完全由涵蓋上述面向自然決定。
8. 每一題的 aspect 欄位 MUST 逐字等於上方面向清單中的一項，供後續系統對應該題所屬面向。
9. 回傳格式 MUST 為單一 JSON 物件：{ "items": [{ "stem": string, "options": string[4],
   "answerIndex": number, "explanation": string[5], "aspect": string }] }，不得包含 JSON 以外的
   文字或 markdown code fence 包裹整個回應。

請開始出題。`;
}
