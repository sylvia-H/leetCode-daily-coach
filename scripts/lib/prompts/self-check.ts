// F7 Stage 2 self-check prompt（生成期專屬，contracts/content-quality-gate.md §1 關卡 7）。
// MUST NOT 進 CI（CI 無金鑰、需確定性）；只在有 GEMINI_API_KEY 的生成期呼叫，供 generate-content.ts
// 對已通過其餘機器 Gate 的草稿做複雜度正確性 / Pattern 適用性 / 前後一致的最後一道主觀把關。

export interface SelfCheckPromptInput {
  conceptId: string;
  title: string;
  patternLabel: string;
  complexityLabel: string;
  /** 已組裝完成的完整 Full Article markdown（含 frontmatter），供 LLM 通篇複審。 */
  articleMarkdown: string;
}

/** LLM self-check 回應：`confident=false` 或 `issues` 非空 ⇒ 觸發重生（R8）。 */
export interface SelfCheckResponse {
  confident: boolean;
  issues: string[];
}

export function buildSelfCheckPrompt(input: SelfCheckPromptInput): string {
  return `你是 LeetCode Daily Coach 課程引擎的教材審稿者。請複審以下已展開完成的教學文章，檢查：
1. Complexity 區塊描述的時間/空間複雜度是否與 TypeScript/Python Corner 的程式碼實際邏輯一致。
2. Pattern（${input.patternLabel}）是否確實適用於本文描述的解法與候選題目。
3. 全文前後是否一致（Digest / Concept / Takeaway 對同一個觀念的描述無矛盾）。

Concept: ${input.title}（id: ${input.conceptId}，宣告複雜度：${input.complexityLabel}）

--- 文章全文開始 ---
${input.articleMarkdown}
--- 文章全文結束 ---

回傳格式 MUST 為單一 JSON 物件：{ "confident": boolean, "issues": string[] }。
若你對上述三項檢查皆有把握、無發現問題，回傳 { "confident": true, "issues": [] }。
若有任何一項不確定或發現問題，回傳 confident: false 並在 issues 逐條列出具體問題（供重生參考）。
不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。`;
}
