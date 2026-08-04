// F8 Stage 3-A prompt 模板（contracts/material-schema.md §5.2、FR-003/FR-004）：每 Topic 生成 6 則
// 反思問題。純函式：只組字串 / 組 schema 物件，不呼叫 LLM、不做 I/O（同 F7 stage1/stage2 prompt 模組）。
import type { ResponseSchema } from "../llm-client.js";

/** 每 Topic 生成目標則數（data-model.md §1；Gate 通過門檻由 material-quota 依課表即時計算，不在此硬編）。 */
export const REFLECTION_QUESTIONS_PER_TOPIC = 6;

export interface ReflectionBankPromptInput {
  topicId: string;
  topicTitle: string;
  /** 上一次嘗試被 Gate 或 self-check 擋下的原因（重生時才有值）。 */
  retryFeedback?: string;
}

/** LLM 回應形狀：單一 Topic 的一批反思問題。 */
export interface DraftReflectionBatch {
  questions: string[];
}

export function buildReflectionBankResponseSchema(): ResponseSchema {
  return {
    type: "OBJECT",
    properties: {
      questions: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
    required: ["questions"],
  };
}

export function buildReflectionBankPrompt(input: ReflectionBankPromptInput): string {
  const feedback = input.retryFeedback
    ? `⚠️ 上一次產出未通過品質 Gate，原因如下，這次 MUST 修正：\n${input.retryFeedback}\n\n`
    : "";

  return `${feedback}你是 LeetCode Daily Coach 課程引擎的教材作者。請為以下 Topic 撰寫 ${REFLECTION_QUESTIONS_PER_TOPIC} 則週複習用的反思問題（Reflection Question）。

Topic: ${input.topicTitle}（id: ${input.topicId}）

規則（MUST 遵守）：
1. 全文以繁體中文撰寫；技術術語、Pattern 名稱、API MUST 保留英文原文（§11）。
2. 每一則 MUST 為**開放式提問**——引導學習者回顧本週學習過程中的思考、卡點或收穫，
   MUST NOT 是可用單一字詞或「是／否」回答的封閉式問題。
3. 每一則 MUST 為**通用於本 Topic 的一般性問題**，MUST NOT 提及任何具體 LeetCode 題號、
   Concept 名稱或本課程特有術語——這批問題會在該 Topic 被複習的每一次交替出現，內容必須經得起
   反覆使用而不顯得重複或過時。
4. 6 則問題彼此 MUST 互不相同、且不得是同一個問題的換句話說（措辭不同但問的是同一件事）。
5. 每一則長度 MUST ≤300 字元（Discord 字元預算，§14.5）。
6. 回傳格式 MUST 為單一 JSON 物件：{ "questions": string[] }，恰為 ${REFLECTION_QUESTIONS_PER_TOPIC} 則，
   不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。

請開始撰寫。`;
}
