// F7 Stage 1 prompt 模板（§8 Module 骨架與顆粒度規範、§10.4 Author Hints 涵蓋項）。
// 純函式：只組字串，不呼叫 LLM、不做 I/O。輸出要求 LLM 回傳單一 JSON 物件（見 DraftConceptResponse），
// 供 generate-curriculum.ts 確定性解析為 Skeleton frontmatter + Author Hints。

export interface Stage1PromptInput {
  moduleId: string;
  moduleTitle: string;
  topicId: string;
  topicTitle: string;
  /** 顆粒度下限/上限（Topic 5–12，R9）；供 LLM 掌握本 Topic 應起草的 Concept 數量級。 */
  minConcepts: number;
  maxConcepts: number;
  /** 供 LLM 引用為 prerequisite 的既有 Concept id（本 Module 前面 Topic 或前置 Module 已起草者）。 */
  priorConceptIds: string[];
}

/** LLM 回應中單一候選題號的教學說明（供 Stage 2 展開 whyThisPattern/Hint 的種子素材）。 */
export interface DraftLeetcodeHint {
  id: number;
  whyThisPattern: string;
}

/** Stage 1 LLM 回應中的單一 Concept 草稿（generate-curriculum.ts 據此組 frontmatter + Author Hints）。 */
export interface DraftConcept {
  slug: string;
  title: string;
  difficulty: "easy" | "medium";
  estimated_minutes: number;
  pattern_label: string;
  complexity_label: string;
  prerequisite: string[];
  next: string[];
  learning_goal: string[];
  exit_criteria: string[];
  /** 1–3 個候選 LeetCode 題號（Q1：LLM 只提號，事實 metadata 由 populate-problem-bank.ts 帶入）。 */
  leetcode_candidates: number[];
  tags: string[];
  author_hints: {
    core_idea: string;
    pattern_recognition: string;
    thinking: string;
    common_mistakes: string;
    ts_notes: string;
    py_notes: string;
    leetcode_hints: DraftLeetcodeHint[];
  };
}

export interface DraftConceptResponse {
  concepts: DraftConcept[];
}

const EXAMPLE_CONCEPT = {
  slug: "example-concept-slug",
  title: "Example Concept Title",
  difficulty: "easy",
  estimated_minutes: 10,
  pattern_label: "Example Pattern",
  complexity_label: "O(n) / O(1)",
  prerequisite: [],
  next: ["next-concept-slug"],
  learning_goal: ["一句話描述學會這個 Concept 後能做到什麼"],
  exit_criteria: ["一條可驗證的完成條件", "可以有第二條"],
  leetcode_candidates: [1, 2],
  tags: ["tag-one", "tag-two"],
  author_hints: {
    core_idea: "一句話核心觀念",
    pattern_recognition: "看到什麼線索就該想到這個 Pattern",
    thinking: "解題時的思考步驟",
    common_mistakes: "常見錯誤",
    ts_notes: "TypeScript 語言重點",
    py_notes: "Python 語言重點",
    leetcode_hints: [
      { id: 1, whyThisPattern: "這題為何適合此 Pattern" },
      { id: 2, whyThisPattern: "這題為何適合此 Pattern" },
    ],
  },
};

export function buildStage1Prompt(input: Stage1PromptInput): string {
  const priorList = input.priorConceptIds.length > 0 ? input.priorConceptIds.join(", ") : "（無，此為課綱起點）";
  const example = JSON.stringify({ concepts: [EXAMPLE_CONCEPT] }, null, 2);
  return `你是 LeetCode Daily Coach 課程引擎的課綱設計者。請為以下 Topic 起草 ${input.minConcepts}–${input.maxConcepts} 個 Concept 的 Skeleton 草稿。

Module: ${input.moduleTitle}（id: ${input.moduleId}）
Topic: ${input.topicTitle}（id: ${input.topicId}）
已存在、可作為 prerequisite 引用的 Concept id：${priorList}

規則（MUST 遵守）：
1. 每個 Session（Concept）MUST 只引入恰好一個新觀念，不可為縮短課程合併多個觀念。
2. 每個 Concept 物件的識別欄位**必須命名為 "slug"（不是 "id"）**，值為 kebab-case（小寫英數＋連字號），Topic 內外皆須全域唯一。
3. prerequisite 與 next **必須是 JSON 陣列**，即使只有 0 個或 1 個元素也一樣（例如 [] 或 ["some-slug"]），**絕對不可以是單一字串**；只能引用「已存在」或「本次一併起草」的 slug，不可前向依賴（不可指向宣告序更晚的 Concept）。
4. difficulty 僅 "easy" 或 "medium"。
5. leetcode_candidates 僅列出 1–3 個你認為適合的 LeetCode 題號（整數陣列），MUST NOT 自行編造 slug / title / url / difficulty——那些由程式從權威題庫帶入，你只需要選號。若判斷此 Concept 不需要對應題目，回傳空陣列 []。
6. author_hints 需涵蓋：一句話核心觀念（core_idea）、Pattern 辨識線索（pattern_recognition）、解題思維（thinking）、常見錯誤（common_mistakes）、TypeScript 重點（ts_notes）、Python 重點（py_notes），以及每個候選題號「為何適合此 Pattern」一句話（leetcode_hints，須與 leetcode_candidates 一一對應）。
7. **以下每一個欄位皆為必要欄位，即使內容簡短也 MUST 逐一填寫，不可省略**：slug、title、difficulty、estimated_minutes、pattern_label、complexity_label、prerequisite、next、learning_goal、exit_criteria、leetcode_candidates、tags、author_hints（含其六個文字欄位與 leetcode_hints）。
8. 回傳格式 MUST 為單一 JSON 物件，且**每個 concept 物件的欄位形狀必須逐一比照下方範例**（範例只示範 1 個 concept，你需要依需求數量產出多個）：

${example}

不得包含 JSON 以外的文字、說明、或 markdown code fence 包裹整個回應。請開始起草。`;
}
