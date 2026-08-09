// F11 獨立二次作答交叉驗證（FR-013，quiz-bank-schema.md §4／§5.3、research R8）：盲答 prompt，
// MUST NOT 附帶 answerIndex／explanation。復用 self-check.ts 的 stripJsonFence，
// 不沿用 SelfCheckResponse 形狀——這是「重新作答」而非「複審」。
import { stripJsonFence } from "./self-check.js";
import type { ResponseSchema } from "../llm-client.js";

export interface QuizCrossCheckPromptInput {
  stem: string;
  options: [string, string, string, string];
}

/** 結構化輸出（responseSchema），MUST NOT 走敘述性 JSON（quiz-bank-schema.md §5.3）。 */
export interface QuizCrossCheckResponse {
  answerIndex: 0 | 1 | 2 | 3;
}

export function buildQuizCrossCheckResponseSchema(): ResponseSchema {
  return {
    type: "OBJECT",
    properties: {
      answerIndex: { type: "INTEGER", minimum: 0, maximum: 3 },
    },
    required: ["answerIndex"],
  };
}

export function buildQuizCrossCheckPrompt(input: QuizCrossCheckPromptInput): string {
  const optionLines = input.options.map((opt, i) => `${"ABCD"[i]}. ${opt}`).join("\n");
  return `你是一位正在作答的學習者。請閱讀以下單選題，選出你認為正確的選項。

${input.stem}
${optionLines}

回傳格式 MUST 為單一 JSON 物件：{ "answerIndex": number }（0-based，對應上述選項順序），
不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。`;
}

/** 剝除 ``` fence 後解析交叉驗證回應；形狀不符即具名 throw（呼叫端接住並算成一次基礎設施失敗）。 */
export function parseQuizCrossCheckResponse(raw: string): QuizCrossCheckResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`quiz-cross-check-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as Partial<QuizCrossCheckResponse> | null;
  if (
    typeof obj !== "object" ||
    obj === null ||
    typeof obj.answerIndex !== "number" ||
    ![0, 1, 2, 3].includes(obj.answerIndex)
  ) {
    throw new Error("quiz-cross-check-parse-error：LLM 回應缺少合法的整數欄位 answerIndex（須為 0-3）");
  }
  return { answerIndex: obj.answerIndex as 0 | 1 | 2 | 3 };
}
