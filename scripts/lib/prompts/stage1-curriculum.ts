// F7 Stage 1 prompt 模板（§8 Module 骨架與顆粒度規範、§10.4 Author Hints 涵蓋項）。
// 純函式：只組字串 / 組 schema 物件，不呼叫 LLM、不做 I/O。輸出要求 LLM 回傳單一 JSON 物件
// （見 DraftConceptResponse），供 generate-curriculum.ts 確定性解析為 Skeleton frontmatter + Author Hints。
import type { ResponseSchema } from "../llm-client.js";

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
  /**
   * 宣告序在本 Topic **之前**的 Concept 已經用掉的 LeetCode 題號。
   *
   * 為何需要：先前只告訴 LLM「前面有哪些 Concept id」，卻沒說「哪些題目已經教過」，它無從得知
   * 而必然重複——實測 two-pointer 模組把 26/27/283/344 又教一次（題 27 全課綱被教 4 次），
   * 因為 array 模組早就用過那批題，但 two-pointer 起草時完全看不到這個事實。
   */
  usedLeetcodeIds: number[];
  /**
   * 上一次嘗試的失敗原因（重試時才有值）。
   *
   * 為何需要：原本重試是重送**一模一樣**的 prompt。這對「偶發 JSON 語法錯誤」有效（重擲一次骰子
   * 就過），但對**系統性**偏差無效——實測模型在本 Topic 規模下的自然傾向就是回 9 個 Concept，
   * 不告訴它上次錯在哪，三次嘗試只是擲出三次同樣的 9。把失敗原因回饋進 prompt，重試才會收斂。
   */
  retryFeedback?: string;
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

const STRING_ARRAY: ResponseSchema = { type: "ARRAY", items: { type: "STRING" } };

/**
 * Stage 1 的結構化輸出 schema（`llmClient.generate` 的第二參數）。由 API 層強制保證回應形狀，
 * 取代原本「靠 prompt 指示詞請 LLM 自律 + 解析端事後補救」的做法。
 *
 * 這裡每一條約束都對應一個**實測反覆發生**的失敗（見 generate-curriculum.ts 的重試紀錄）：
 * - `difficulty.enum`：LLM 屢次回 `"hard"`（N-Queens、Largest Rectangle…），使整個 Topic 草稿作廢。
 * - `required` / `type`：漏欄位、把單元素陣列回成純量（`next: "foo"`）。
 * - `responseMimeType: application/json`（由 LlmClient 帶上）：JSON 語法錯誤（未跳脫字元等）。
 *
 * ## ⚠️ MUST NOT 對 `concepts` 加 minItems / maxItems（實測 2026-07-30，gemini-3.5-flash-lite）
 *
 * 對 `concepts` 這個「items 結構複雜」的陣列加上**任何**長度約束，整個請求會被 API 以
 * **HTTP 400 `INVALID_ARGUMENT`** 拒收（連 prompt 都到不了模型，每個 Topic 每次重試皆失敗）。
 * 逐項實測結論：
 * - 單獨的 `minItems`、單獨的 `maxItems`、兩者併用 → 皆 400。
 * - 移除 `concepts` 的長度約束後，**其餘全部約束（含最深的 author_hints.leetcode_hints 巢狀結構）
 *   都能正常運作** → 故病灶不是 schema 大小（1458 bytes 的版本通過）、也不是巢狀深度。
 * - 簡單陣列（`leetcode_candidates`，items 為 INTEGER）的 `maxItems` **可以正常使用**。
 *
 * 推定成因：約束解碼（constrained decoding）需同時追蹤元素計數與每個元素的完整結構，兩者相乘後
 * 超出模型端的狀態機複雜度上限。**故篇數下限 MUST 由應用層守**——見 generate-curriculum.ts 的
 * `stage1-granularity` 檢查與同 Topic 重試（實測本 schema 下模型的自然傾向就是回 9 篇）。
 *
 * ⚠️ schema 保證的是**形狀**，保證不了**內容品質**：`difficulty.enum` 擋掉 `"hard"` 之後，模型就無法
 * 再用這個欄位對我們發出「這篇太大了」的訊號，只會默默改標 medium 把過大的 Concept 硬塞進來——
 * **恰好違反想守的 Small Learning Steps 原則**。故 prompt 規則 4 MUST 明講「想標 hard ⇒ 該拆分」，
 * 把被 schema 消音的訊號轉成正確行為（§10.3.1）。MUST NOT 因為有了 schema 就把該段引導拿掉。
 */
export function buildStage1ResponseSchema(): ResponseSchema {
  return {
    type: "OBJECT",
    properties: {
      concepts: {
        type: "ARRAY",
        // ⚠️ 這裡 MUST NOT 出現 minItems / maxItems，理由見本函式 docblock（API 會整包 400）。
        items: {
          type: "OBJECT",
          properties: {
            slug: { type: "STRING", description: "kebab-case（僅小寫英數與連字號），全域唯一" },
            title: { type: "STRING" },
            difficulty: { type: "STRING", enum: ["easy", "medium"] },
            estimated_minutes: { type: "INTEGER", minimum: 1 },
            pattern_label: { type: "STRING" },
            complexity_label: { type: "STRING" },
            prerequisite: STRING_ARRAY,
            next: STRING_ARRAY,
            learning_goal: STRING_ARRAY,
            exit_criteria: STRING_ARRAY,
            // items 為單純 INTEGER 的陣列，長度約束實測可用（§12.1 的 1–3 題上限）。
            leetcode_candidates: { type: "ARRAY", maxItems: "3", items: { type: "INTEGER" } },
            tags: STRING_ARRAY,
            author_hints: {
              type: "OBJECT",
              properties: {
                core_idea: { type: "STRING" },
                pattern_recognition: { type: "STRING" },
                thinking: { type: "STRING" },
                common_mistakes: { type: "STRING" },
                ts_notes: { type: "STRING" },
                py_notes: { type: "STRING" },
                leetcode_hints: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      id: { type: "INTEGER" },
                      whyThisPattern: { type: "STRING" },
                    },
                    required: ["id", "whyThisPattern"],
                  },
                },
              },
              required: [
                "core_idea",
                "pattern_recognition",
                "thinking",
                "common_mistakes",
                "ts_notes",
                "py_notes",
                "leetcode_hints",
              ],
            },
          },
          required: [
            "slug",
            "title",
            "difficulty",
            "estimated_minutes",
            "pattern_label",
            "complexity_label",
            "prerequisite",
            "next",
            "learning_goal",
            "exit_criteria",
            "leetcode_candidates",
            "tags",
            "author_hints",
          ],
        },
      },
    },
    required: ["concepts"],
  };
}

export function buildStage1Prompt(input: Stage1PromptInput): string {
  const priorList = input.priorConceptIds.length > 0 ? input.priorConceptIds.join(", ") : "（無，此為課綱起點）";
  const usedList =
    input.usedLeetcodeIds.length > 0
      ? [...input.usedLeetcodeIds].sort((a, b) => a - b).join(", ")
      : "（無，此為課綱起點）";
  const example = JSON.stringify({ concepts: [EXAMPLE_CONCEPT] }, null, 2);
  // 重試回饋擺在**開頭**而非附在末尾：這是本次與上次唯一的差異，放在最前面才不會被淹沒在長規則清單裡。
  const feedback = input.retryFeedback
    ? `⚠️ 上一次的產出不合格，原因如下，這次 MUST 修正：\n${input.retryFeedback}\n\n`
    : "";
  return `${feedback}你是 LeetCode Daily Coach 課程引擎的課綱設計者。請為以下 Topic 起草 ${input.minConcepts}–${input.maxConcepts} 個 Concept 的 Skeleton 草稿。

Module: ${input.moduleTitle}（id: ${input.moduleId}）
Topic: ${input.topicTitle}（id: ${input.topicId}）
已存在、依課綱順序排在本 Topic 之前（或同屬本 Topic）的 Concept id，只能被 prerequisite 引用：${priorList}

**前面課程已經教過的 LeetCode 題號（MUST 避免重複選用）**：${usedList}

**篇數要求（MUST）**：本次 MUST 產出**至少 ${input.minConcepts} 個**、至多 ${input.maxConcepts} 個 Concept。
少於 ${input.minConcepts} 個會被自動退回重做。若你覺得這個 Topic 湊不滿 ${input.minConcepts} 個，
那代表你把某些觀念包得太大了——依規則 4 把它們拆開，而不是交出不足的數量。

**⚠️ 但 MUST NOT 為了湊足篇數而灌水**。以下都算灌水，一律禁止：
- 把**同一個技巧**拆成多個 Concept、只是換不同題號來充數
  （反例：「同向雙指標原地覆寫」寫成三篇，分別掛 26 / 27 / 283——這三題是同一個技巧的同類練習，MUST 併為一篇）。
- 重複教上面「已經教過」清單中的題目。
- 產出與前面 Concept 實質相同、只是改個名字的觀念。
寧可**在本 Topic 內找出真正不同的技巧**（更進階的變化、不同的資料結構組合、不同的邊界處理），
也不要用同義的篇數填滿。每一篇 MUST 能用一句話說出「它教的新東西是前面所有 Concept 都沒有的」。

規則（MUST 遵守）：
1. 每個 Session（Concept）MUST 只引入恰好一個新觀念，不可為縮短課程合併多個觀念。
2. 每個 Concept 物件的識別欄位**必須命名為 "slug"（不是 "id"）**，值為 kebab-case（小寫英數＋連字號），Topic 內外皆須全域唯一。
3. prerequisite 與 next **必須是 JSON 陣列**，即使只有 0 個或 1 個元素也一樣（例如 [] 或 ["some-slug"]），**絕對不可以是單一字串**。
   - prerequisite **只能**引用上面列出的「已存在」id，或本次一起草的其他 concept 的 slug；MUST NOT 引用上面清單以外的 id（那些是宣告序更晚的 Concept，會構成前向依賴）。
   - next **只能**引用「本次一起草的其他 concept」的 slug，或留空 []；**絕對不可以引用上面「已存在」清單中的任何 id**——那個方向的連結會由程式自動處理，你只需要正向（透過 prerequisite）建立關係。
4. difficulty 僅 "easy" 或 "medium"，**沒有 "hard"，這是刻意的設計**：這裡指的是「Concept 本身的認知難度」，
   不是 LeetCode 題目難度（題目難度由程式從題庫帶入，與此無關）。一堂每日課只引入一個觀念，本來就不該「難」。
   **當你覺得某個 Concept 難到想標成 hard，那正是它塞了不只一個新觀念的訊號——此時 MUST 把它拆成兩個以上的
   Concept，MUST NOT 硬塞成一篇。** 例如：
   - N-Queens 想標 hard ⇒ 拆成「對角線衝突的 O(1) 判斷」與「逐行放置的回溯與剪枝」兩個 Concept。
   - Largest Rectangle in Histogram 想標 hard ⇒ 拆成「單調堆疊維護」與「左右邊界延伸與面積計算」。
   - Reverse Nodes in k-Group 想標 hard ⇒ 拆成「區間反轉」與「分批檢查與接回原串」。
   拆開後每一篇各自都會落在 easy 或 medium，而且更符合「每個 Session 只引入恰好一個新觀念」的要求。
5. leetcode_candidates 僅列出 1–3 個你認為適合的 LeetCode 題號（整數陣列），MUST NOT 自行編造 slug / title / url / difficulty——那些由程式從權威題庫帶入，你只需要選號。若判斷此 Concept 不需要對應題目，回傳空陣列 []。
6. author_hints 需涵蓋：一句話核心觀念（core_idea）、Pattern 辨識線索（pattern_recognition）、解題思維（thinking）、常見錯誤（common_mistakes）、TypeScript 重點（ts_notes）、Python 重點（py_notes），以及每個候選題號「為何適合此 Pattern」一句話（leetcode_hints，須與 leetcode_candidates 一一對應）。
7. **以下每一個欄位皆為必要欄位，即使內容簡短也 MUST 逐一填寫，不可省略**：slug、title、difficulty、estimated_minutes、pattern_label、complexity_label、prerequisite、next、learning_goal、exit_criteria、leetcode_candidates、tags、author_hints（含其六個文字欄位與 leetcode_hints）。
8. 回傳格式 MUST 為單一 JSON 物件，且**每個 concept 物件的欄位形狀必須逐一比照下方範例**（範例只示範 1 個 concept，你需要依需求數量產出多個）：

${example}

不得包含 JSON 以外的文字、說明、或 markdown code fence 包裹整個回應。請開始起草。`;
}
