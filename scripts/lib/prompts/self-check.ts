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
  /**
   * 後繼 Concept 的 title 清單（可為空）。用於檢查 Tomorrow Preview 是否名副其實。
   *
   * 為何走 self-check 而非機械 Gate（F12 實測）：以「Tomorrow Preview 是否含後繼 title 的顯著詞」
   * 對 14 篇人工核對過的教材實測，13 篇有後繼者命中 12 篇——唯一未命中的
   * `array-in-place-removal` 其實**寫對了**，只是整句用中文表達（「已排序陣列的原地去重」）。
   * 約 8% 的假陽性會擋掉正確教材並逼出無謂重生，故 MUST NOT 上這條正則判準；語意比對交給 LLM。
   */
  nextTitles: string[];
}

/** LLM self-check 回應：`confident=false` 或 `issues` 非空 ⇒ 觸發重生（R8）。 */
export interface SelfCheckResponse {
  confident: boolean;
  issues: string[];
}

/**
 * 剝除 LLM 回應可能夾帶的 ``` fence 後取 JSON 字面（F7 R8；F8 由 generate-content.ts 搬移至此，
 * 純搬移無行為變更，供 self-check / Stage 2 解析與 F8 素材生成共用）。
 */
export function stripJsonFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

export function buildSelfCheckPrompt(input: SelfCheckPromptInput): string {
  return `你是 LeetCode Daily Coach 課程引擎的教材審稿者。請複審以下已展開完成的教學文章，檢查：
1. Complexity 區塊描述的時間/空間複雜度是否與 TypeScript/Python Tip 的程式碼實際邏輯一致。
2. Pattern（${input.patternLabel}）是否確實適用於本文描述的解法與候選題目。
3. 全文前後是否一致（Digest / Concept / Takeaway 對同一個觀念的描述無矛盾）。
4. **Tomorrow Preview 是否與下列後繼 Concept 相符**：${
    input.nextTitles.length > 0 ? input.nextTitles.join("、") : "（無後繼——MUST 為系列收尾語且不得點名任何 Concept）"
  }
   預告了不在清單內的主題（尤其是課程中更早出現過的主題）、或在無後繼時仍承諾「明天將學習 X」，皆屬問題。

Concept: ${input.title}（id: ${input.conceptId}，宣告複雜度：${input.complexityLabel}）

--- 文章全文開始 ---
${input.articleMarkdown}
--- 文章全文結束 ---

回傳格式 MUST 為單一 JSON 物件：{ "confident": boolean, "issues": string[] }。
若你對上述四項檢查皆有把握、無發現問題，回傳 { "confident": true, "issues": [] }。
若有任何一項不確定或發現問題，回傳 confident: false 並在 issues 逐條列出具體問題（供重生參考）。
不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。`;
}

/**
 * 剝除 ``` fence 後解析 self-check 回應；形狀不符即具名 throw（F8 由 generate-content.ts 搬移至此，
 * 純搬移無行為變更）。
 *
 * 不可對 `JSON.parse` 的結果直接 cast 後取 `response.issues.length`：LLM 回非 JSON、或回了 JSON
 * 但漏掉 `issues`，都會在此炸出例外；呼叫端（重生迴圈）MUST 接住並算成一次重生，而非讓產線以
 * unhandled rejection 中止（FR-028b）。
 */
export function parseSelfCheckResponse(raw: string): SelfCheckResponse {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFence(raw));
  } catch (err) {
    throw new Error(`self-check-parse-error：LLM 回應非合法 JSON：${(err as Error).message}`);
  }
  const obj = parsed as Partial<SelfCheckResponse> | null;
  if (typeof obj !== "object" || obj === null || typeof obj.confident !== "boolean") {
    throw new Error("self-check-parse-error：LLM 回應缺少布林欄位 confident");
  }
  if (!Array.isArray(obj.issues) || obj.issues.some((i) => typeof i !== "string")) {
    throw new Error("self-check-parse-error：LLM 回應缺少字串陣列欄位 issues");
  }
  return { confident: obj.confident, issues: obj.issues };
}

export interface ReflectionSelfCheckPromptInput {
  topicId: string;
  topicTitle: string;
  /** 本批（6 則）反思問題，依宣告序。 */
  questions: string[];
}

/**
 * Reflection 素材的 self-check prompt（FR-028a，contracts/material-schema.md §5.3）：rubric **恰為兩項**，
 * MUST NOT 納入「切題性」——問題本依該 Topic 生成，離題風險低，且該項最主觀、最易誤退（同 F7
 * Stage 2 self-check 排除格式類判準的取捨）。回應型別沿用同一個 SelfCheckResponse。
 */
export function buildReflectionSelfCheckPrompt(input: ReflectionSelfCheckPromptInput): string {
  const list = input.questions.map((q, i) => `${i + 1}. ${q}`).join("\n");
  return `你是 LeetCode Daily Coach 課程引擎的教材審稿者。請複審以下同一個 Topic 的一批反思問題，檢查恰恰兩項：
1. 批內是否有任兩則在問同一件事（僅措辭不同）？
2. 是否有任一則可用單一字詞或「是／否」回答（不是開放式提問）？

Topic: ${input.topicTitle}（id: ${input.topicId}）

--- 本批問題開始 ---
${list}
--- 本批問題結束 ---

回傳格式 MUST 為單一 JSON 物件：{ "confident": boolean, "issues": string[] }。
若上述兩項皆無發現問題，回傳 { "confident": true, "issues": [] }。
若有任一項發現問題，回傳 confident: false 並在 issues 逐條列出具體問題（供重生參考）。
不得包含 JSON 以外的文字或 markdown code fence 包裹整個回應。`;
}
