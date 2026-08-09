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
出選擇題（單選、四選項）。

Concept: ${input.conceptTitle}（id: ${input.conceptId}）

面向清單：
${aspectsList}

規則（MUST 遵守）：
1. **面向清單中的每一項 MUST 至少對應一題**——這是逐項覆蓋的完整性要求，MUST NOT 挑選其中幾項
   出題、略過其餘。若某面向底下其實還能問出考法不同、答案不同的第二道題，MAY 從不同考核角度
   為同一面向多出一題，但 MUST NOT 為了填數量而重複同一角度、也 MUST NOT 為了省事而把兩個面向
   合併成同一題（那違反了規則 14 的一對一對應）。
2. 每一題 MUST 有恰好 4 個選項，唯一正解由 answerIndex（0-based）指出。
3. options 的文字 MUST NOT 含 "A."、"B."、"1."、"(a)" 等代號前綴——呈現層會自行加上，你只需提供
   純文字選項內容。
4. explanation MUST 恰為 5 段，依序為：
   [0] 結論句，MUST ≤80 字，直接說出正解是什麼（不含理由）；
   [1] 正解為何成立的完整說明；
   [2]-[4] 依序說明其餘三個選項各自為何不成立（一段對應一個錯誤選項，順序與 options 中除正解外
   的其餘選項一致）。**每一段 MUST 引用該選項的關鍵字句**，讓讀者一眼看出這段在講哪個選項；
   MUST NOT 用「此選項錯誤」「這個說法不正確」這類看不出對象的制式開頭。
5. **撰寫順序 MUST 為「先寫四個等重的候選、最後才指定正解」**：MUST NOT 先寫好正解、再補三個較短
   較隨便的干擾項——實測顯示那是「正解恆為最長選項」這個偏誤的直接成因，會讓學習者只挑最長的就
   猜對，題目因此量測不到任何理解程度。四個候選敘述 MUST 句式相同、細節密度相同、**字元數落在
   彼此 ±20% 以內**；干擾項要「看起來一樣有道理但實際上錯」，而不是「一眼就知道太短太隨便」。
   寫完後 MUST 自我檢查：若正解剛好是四個選項中**唯一最長**的那一個，MUST 把干擾項補到等長、
   或把正解精簡，改到正解不再是唯一最長為止。
6. **正解放在哪個位置無關緊要，MUST NOT 花心思分散**：系統會在寫入題庫前以確定性演算法重排選項
   順序，把正解平均分配到四個位置。你只需讓 answerIndex 正確指向你心中的正解，不必也 MUST NOT
   為了「看起來平均」而刻意調整位置——那只會分散你對選項品質的注意力。
7. **每個選項 MUST 能獨立閱讀**：MUST NOT 出現「以上皆是」「以上皆非」「同選項 A」「A 和 B 都對」
   這類參照其他選項或參照位置的寫法。選項順序會被系統重排（見規則 6），這種寫法重排後必然語意
   錯亂，會被品質 Gate 直接擋下。
8. **MUST NOT 用「語氣絕對」當作干擾項的唯一破綻**：實測顯示干擾項大量出現「完全不需要」「必然」
   「永遠」「只能」「絕對」「所有」等字眼而正解從不使用，學習者只要刪掉語氣最強的選項就能猜對。
   干擾項 MUST 有**實質的觀念錯誤**（張冠李戴、因果顛倒、條件搞錯、把前置或後續 Concept 的作法
   套錯地方），而不是靠把正確敘述加上極端修飾語來製造錯誤。若某個絕對化敘述本身確實成立，
   MAY 用在正解上。
9. **題幹 MUST 精簡、MUST NOT 洩漏答案**：題幹 MUST NOT 複述正解的內容（實測有題目問「為什麼必須
   排除語意模糊的描述」而正解就是「為了排除語意模糊的描述以確保每一步可執行」，等於白送分）；
   MUST NOT 在題幹夾帶英文原文括號（如「可變大小滑動視窗（Variable Size Sliding Window）」）——
   Concept 名稱已在上方給出，重複只會佔用版面預算；MUST NOT 把解題理由寫進題幹再問「為什麼」。
10. MUST NOT 在題幹、選項或詳解中提及任何 LeetCode 題號或題目連結——這是自製選擇題，不是 LeetCode
   題目改寫。複雜度標記（如 O(n²)）、陣列索引、題目情境中的數值可以正常出現，這不是題號。
11. MUST NOT 考核任何程式語言 API 用法或語法細節；MUST 考核可遷移的觀念性理解。
12. 全文以繁體中文撰寫；技術術語、Pattern 名稱、程式碼片段 MUST 保留英文原文（§11）。
13. MUST NOT 提及任何題數或面向數字（含上限）——出多少題完全由規則 1 的逐項覆蓋自然決定。
14. 每一題的 aspect 欄位 MUST 逐字等於上方面向清單中的一項，供後續系統對應該題所屬面向。
15. 回傳格式 MUST 為單一 JSON 物件：{ "items": [{ "stem": string, "options": string[4],
    "answerIndex": number, "explanation": string[5], "aspect": string }] }，不得包含 JSON 以外的
    文字或 markdown code fence 包裹整個回應。

請開始出題。`;
}
