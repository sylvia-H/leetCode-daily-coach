// F8 Stage 3-B prompt 模板（contracts/material-schema.md §5.2、FR-007/FR-008、research R12）：
// 單批生成 36 則鼓勵語（門檻 30 + 20% 損耗餘裕）。純函式：只組字串 / 組 schema 物件，不呼叫 LLM、
// 不做 I/O。**不跑 self-check**（FR-028b）——鼓勵語與教材內容無關，切題性判準不適用於此類素材。
import type { ResponseSchema } from "../llm-client.js";

/** 生成目標則數（research R12）；Gate 通過門檻為 spec FR-007 的 ≥30，兩者刻意不同（生成端固定則數）。 */
export const ENCOURAGEMENT_QUOTES_TARGET = 36;

export interface EncouragementPromptInput {
  /** 上一次嘗試被 Gate 擋下的原因（重生時才有值）。 */
  retryFeedback?: string;
}

/** LLM 回應形狀：單批鼓勵語。 */
export interface DraftEncouragementBatch {
  quotes: string[];
}

export function buildEncouragementResponseSchema(): ResponseSchema {
  return {
    type: "OBJECT",
    properties: {
      quotes: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
    required: ["quotes"],
  };
}

export function buildEncouragementPrompt(input: EncouragementPromptInput): string {
  const feedback = input.retryFeedback
    ? `⚠️ 上一次產出未通過品質 Gate，原因如下，這次 MUST 修正：\n${input.retryFeedback}\n\n`
    : "";

  return `${feedback}你是 LeetCode Daily Coach 課程引擎的教材作者。請撰寫 ${ENCOURAGEMENT_QUOTES_TARGET} 則簡短的鼓勵語，
供每週複習日版面結尾使用（一次只會顯示一則）。

規則（MUST 遵守）：
1. 全文以繁體中文撰寫。
2. 每一則 MUST 為**與學習進度、具體 Concept、具體題目完全無關**的通用鼓勵語句——它會被隨機分派到
   三個不同難度、不同進度的 Track，讀者可能在課程第一週或第三十週看到同一則，內容必須在任何時間點
   都成立。
3. 每一則 MUST NOT 包含：外部連結（http/https）、markdown 連結語法、「LeetCode」字樣、
   任何形式的題號樣式（如 #123）、任何具體 Concept 或 Pattern 名稱。
4. 每一則長度 MUST ≤200 字元（Discord 字元預算，§14.5）。
5. 36 則彼此 MUST 互不相同。
6. 語氣 MUST 溫暖、真誠，避免空泛的口號式套話；可以承認解題過程中的挫折是正常的。
7. 回傳格式 MUST 為單一 JSON 物件：{ "quotes": string[] }，恰為 ${ENCOURAGEMENT_QUOTES_TARGET} 則，
   不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。

請開始撰寫。`;
}
