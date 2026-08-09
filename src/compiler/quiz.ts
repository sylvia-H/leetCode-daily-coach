// F11 小測（Quiz Bank）的 schema、決定性選取純函式與品質 Gate 判準
// （data-model.md §1/§1.1/§2/§3.1、contracts/quiz-bank-schema.md、contracts/quiz-selection.md）。
// Compiler（runtime）、CI Gate（runContentGate）、生成腳本（scripts/generate-quiz-bank.ts）三者
// MUST 共用同一份（憲章 IX），MUST NOT 各自實作。純函式：無 I/O、無隨機源、無時間依賴。
import { z } from "zod";
import { TRACK_ORDER } from "../config.js";
import { QUIZ_BUDGET_LIMITS, QUIZ_URL_RESERVE_CHARS } from "../renderer/budget.js";
import { renderQuizItemBody } from "../renderer/discord.js";
import { checkTraditionalChinese } from "./traditional-chinese.js";
import type { CurriculumGraph } from "../types/curriculum.js";
import type { ReviewQuizItem, Track } from "../types/lesson.js";

// ── 型別（data-model.md §1） ──────────────────────────────────────────────

export interface QuizItem {
  stem: string;
  /** 恰 4 個，純文字，MUST NOT 含 `A.`/`B.` 等代號前綴（FR-006）。 */
  options: [string, string, string, string];
  /** 正解在 options 中的 0-based index（research R4）。 */
  answerIndex: 0 | 1 | 2 | 3;
  /**
   * 恰 5 段（FR-006）：[0] ≤80 字結論句（Discord 用）／[1] 正解為何成立／
   * [2]–[4] 逐一說明其餘三個選項為何不成立（Pages 用）。
   */
  explanation: [string, string, string, string, string];
}

export interface QuizBank {
  version: 1;
  /** key = ConceptNode.id；value 為該 Concept 的題目陣列（3–10 題，FR-005），宣告序即穩定索引（FR-003）。 */
  byConcept: Record<string, QuizItem[]>;
}

// ── zod strict schema（陣列本身 MAY 為空，MUST NOT 用 min(1)，同 F8 ReflectionBank 既有理由：
// 空集合是 FR-007 的降級路徑之一，由 quiz-count-range 在 CI 擋下） ──────────────────────

const quizItemSchema = z
  .object({
    stem: z.string().min(1),
    options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
    answerIndex: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
    explanation: z.tuple([
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
      z.string().min(1),
    ]),
  })
  .strict();

export const quizBankSchema = z
  .object({
    version: z.literal(1),
    byConcept: z.record(z.string(), z.array(quizItemSchema)),
  })
  .strict();

// ── QuizViolation（data-model.md §1.1）：rule 名稱具名到型別層級，MUST NOT 只寫進 message。 ──

export type QuizViolationRule =
  | "quiz-schema" // ★ 由 §2 載入層 throw 實現，非本函式輸出（同 material-schema 的既有註記）
  | "quiz-unknown-concept"
  | "quiz-option-prefix"
  | "quiz-option-cross-reference" // 選項參照其他選項／位置 ⇒ 產線重排正解位置後必然語意錯亂
  | "quiz-conclusion-length"
  | "quiz-item-budget"
  | "quiz-traditional-chinese"
  | "quiz-count-range"
  | "quiz-duplicate"
  | "quiz-leetcode-id" // §5／§11：題號 MUST 由程式從 Problem Bank 帶入，MUST NOT 由 LLM 生成
  | "quiz-answer-position-bias" // 正解位置過度集中 ⇒ 不讀題也能猜對
  | "quiz-answer-position-coverage" // 正解只用到少數位置（實測 D 幾乎從未被使用）
  | "quiz-longest-option-bias"; // 正解恆為最長選項 ⇒ 可用長度猜答案

export interface QuizViolation {
  rule: QuizViolationRule;
  /** 素材座標：`quiz-bank:{conceptId}[{i}]` 或 `quiz-bank:{conceptId}`。 */
  subject: string;
  message: string;
}

const QUIZ_ANSWER_LABELS = ["A", "B", "C", "D"] as const;

/**
 * `QuizItem → ReviewQuizItem` 的唯一轉換點（data-model.md §3.1）。`renderQuizItemBody`
 * 吃的是 `ReviewQuizItem`；此轉換 MUST 只有一份實作，由 `compileReview`（有 url）與
 * `checkQuizBank`（無 url，估算用）共用（憲章 IX）。
 */
export function toReviewQuizItem(conceptId: string, item: QuizItem, quizUrl?: string): ReviewQuizItem {
  const result: ReviewQuizItem = {
    conceptId,
    stem: item.stem,
    options: item.options,
    answerLabel: QUIZ_ANSWER_LABELS[item.answerIndex],
    conclusion: item.explanation[0],
  };
  if (quizUrl !== undefined) result.quizUrl = quizUrl;
  return result;
}

/**
 * 決定性選取純函式（FR-003、quiz-selection.md §2）：`index = (localOrder + trackOffset) mod items.length`。
 * `bank` 缺該 Concept 或陣列為空 ⇒ undefined（FR-007）。MUST NOT 固化進生成物（FR-003a）。
 */
export function selectQuizItem(input: {
  bank: QuizBank;
  graph: CurriculumGraph;
  track: Track;
  conceptId: string;
}): QuizItem | undefined {
  const { bank, graph, track, conceptId } = input;
  const items = bank.byConcept[conceptId];
  if (!items || items.length === 0) return undefined;
  const node = graph.concepts.get(conceptId);
  if (!node) return undefined; // 防禦性；reviewConcepts 已保證存在於 DAG
  const trackOffset = TRACK_ORDER.indexOf(track);
  const index = (node.localOrder + trackOffset) % items.length;
  return items[index];
}

// ── 品質 Gate（quiz-bank-schema.md §3） ──────────────────────────────────

function codePointLength(text: string): number {
  return Array.from(text).length;
}

/**
 * 「正解恰為該題**唯一**最長選項」的單題判準（`quiz-longest-option-bias` 的計數基礎）。
 *
 * **MUST 只有這一份實作**（憲章 IX）：`checkQuizBank`（集合層計數）與
 * `scripts/generate-quiz-bank.ts` 的逐題修復（挑出要重出的題）共用。兩邊若各寫一份，
 * 會出現「修復端認為修好了、Gate 仍判違規」的無限重生。
 *
 * 「唯一最長」而非「最長」是刻意的：若有其他選項與正解等長，長度就不構成可利用的線索。
 */
export function isAnswerUniqueLongestOption(item: { options: readonly string[]; answerIndex: number }): boolean {
  const lengths = item.options.map(codePointLength);
  const maxLength = Math.max(...lengths);
  return lengths[item.answerIndex] === maxLength && lengths.filter((l) => l === maxLength).length === 1;
}

/**
 * 「猜答偏誤」判準的門檻與適用下界（quiz-bank-schema.md §3 rule 10／11）。
 *
 * **為何需要這兩條**：實測（2026-08-07，`array-two-pointers-variable`）產出的 10 題全部通過當時
 * 既有的 9 條判準，卻有 **80% 正解落在 B、90% 正解是該題最長選項**——學習者只要「一律選最長的 B」
 * 就能得 80 分而完全不必理解內容。本題庫的全部價值在於「誠實的自我訊號」（SC 系列的前提），
 * 這種題目量測不到任何東西，等同素材失效卻無任何徵兆。
 *
 * **為何是結構性判準而非 prompt 敘述**：同一次實測顯示，這是**任何模型寫選擇題的系統性偏誤**
 * （把正解寫得比干擾項完整是下意識行為），而 spec Q14 已實證「敘述性要求無法穩定落實」。
 * 這兩條與 checklists/prompt-design.md CHK006／018 那批「無法結構化偵測」的語意層判準不同——
 * 它們是**純計數**，不需要把 Stage A 面向清單持久化為中繼產物（那正是當初否決補 Gate 的理由），
 * 故成本極低而收益明確。
 *
 * **門檻取 50%**：隨機均勻分派下，正解位置的期望佔比為 25%、「唯一最長」的期望佔比亦約 25%；
 * 取 50% 留有一倍餘裕，只攔明顯的系統性偏誤。**MUST NOT 收緊到接近 25%**——那會讓正常波動頻繁
 * 觸發重生、白燒免費層額度。
 *
 * ⚠️ **「50% 不會誤殺」只對 `quiz-longest-option-bias` 成立**（單一二項分布，n=7 時誤殺率約 7%）。
 * 對 `quiz-answer-position-bias` 不成立：它取的是四格的**最大值**，n=7 時即使 answerIndex 完全均勻
 * 隨機也有 **27%** 機率違規（`quiz-answer-position-coverage` 在 n=8 更高達 37.7%）。故位置類的兩條
 * **MUST NOT 靠重生達成**——產線改以 `scripts/lib/quiz-balance.ts` 在寫入前確定性重排正解位置，
 * 使兩條由建構保證通過；它們在此保留為**防手改題庫、防未來新來源**的 CI 守衛
 * （quiz-bank-schema.md §3／§5.2a）。**MUST NOT 因「產線一定會通過」而移除。**
 */
export const QUIZ_BIAS_MAX_SHARE = 0.5;
/** 題數低於此下界時不套用偏誤判準：樣本太小時佔比本身沒有統計意義（3 題有 2 題同位置即 67%）。 */
export const QUIZ_BIAS_MIN_ITEMS = 4;

/**
 * 正解位置**覆蓋數**下界（`quiz-answer-position-coverage`，quiz-bank-schema.md §3 rule 12）。
 *
 * **為何 `quiz-answer-position-bias`（佔比 ≤50%）不足以涵蓋**：佔比上限只約束「最集中的那一格」，
 * 一份 `A=50% B=50% C=0 D=0` 的題庫完全合規，但 C／D 兩格從未出現，猜答空間仍被砍半。
 * 實測（2026-08-07，242 題）：**A 佔 66.9%、B 26.4%、C 6.2%、D 僅 1 題（0.4%）**——模型幾乎
 * 從不把正解放在最後一格，這是佔比判準看不見的第二種系統性偏誤。
 *
 * **分層而非一律要求四格**：`n=4` 時要求用滿四格等於「每格恰一題」，交叉驗證丟掉任一題就必然違規，
 * 過於脆弱；`n≥8` 時四格各至少一題則相當寬鬆（期望各 2 題）。實測攔截率 27/31，且對照組
 * （刻意平衡的 10 題手寫版本，分布 2/3/2/3）通過。
 */
export const QUIZ_POSITION_COVERAGE_MIN = 3;
/** 題數達此下界時，四個位置 MUST 全部被使用（見 `QUIZ_POSITION_COVERAGE_MIN` 的分層理由）。 */
export const QUIZ_POSITION_FULL_COVERAGE_ITEMS = 8;

const OPTION_PREFIX_PATTERN = /^[A-D][.、)]\s*/;

/**
 * rule 13（`quiz-option-cross-reference`）：選項 MUST 各自獨立可讀。
 *
 * **為何是硬性判準而非風格建議**：產線在寫入題庫前會以確定性演算法重排選項順序、把正解平均分配到
 * 四個位置（`scripts/lib/quiz-balance.ts`，quiz-bank-schema.md §5.2a）。任何依賴「選項在清單中的
 * 位置或彼此關係」的寫法——「以上皆是」「同選項 A」「A 和 B 都對」——重排後必然語意錯亂，
 * 且錯得無聲無息。這是重排機制的前提條件，MUST NOT 只以 prompt 敘述防範（spec Q14 已實證）。
 *
 * **判準刻意保守**：只攔明確的自我參照樣式。MUST NOT 擴大為「不得出現『以上』二字」——
 * 「10 以上」「上述情境」這類正常敘述是合法內容，過寬會逼出無意義的重生。
 */
const OPTION_CROSS_REFERENCE_PATTERNS = [
  /以上(皆|都|各項|選項|所有)/,
  /上述(皆|都|各項|選項)/,
  /前述(皆|都|各項|選項)/,
  /選項\s*[A-D](?![A-Za-z0-9_])/,
  /[A-D]\s*(和|與|及)\s*[A-D]\s*(皆|都|均|兩者|二者)/,
];
// rule 9 的判準邊界（MUST）：只攔「LeetCode／力扣 + 數字」與題目連結兩種樣式，MUST NOT 擴大為
// 「不得出現任何數字」——複雜度（O(n²)）、陣列索引、題目情境數值皆為合法內容。
const LEETCODE_URL_PATTERN = /leetcode\.com\/problems/i;
const LEETCODE_NUMBER_PATTERN = /(LeetCode|力扣)\s*[#第]?\s*\d+/i;

/**
 * 純函式，對 `byConcept` 每一個陣列元素逐一檢查（不依賴課表是否實際選中該題，research R3）。
 * 供 `runContentGate`（CI）與 `scripts/generate-quiz-bank.ts`（生成端，僅濾掉 quiz-count-range）
 * 共用同一顆實作（憲章 IX，MUST NOT 另立 structuralGate）。
 */
export function checkQuizBank(input: { quizBank?: QuizBank; graph: CurriculumGraph }): QuizViolation[] {
  const { quizBank, graph } = input;
  if (!quizBank) return [];
  const violations: QuizViolation[] = [];

  for (const [conceptId, items] of Object.entries(quizBank.byConcept)) {
    const conceptSubject = `quiz-bank:${conceptId}`;

    if (!graph.concepts.has(conceptId)) {
      violations.push({
        rule: "quiz-unknown-concept",
        subject: conceptSubject,
        message: `quiz-bank.json 的 Concept key「${conceptId}」不存在於 curriculum`,
      });
    }

    if (items.length < 3 || items.length > 10) {
      violations.push({
        rule: "quiz-count-range",
        subject: conceptSubject,
        message: `Concept「${conceptId}」題數 ${items.length}，需落在 [3,10] 區間`,
      });
    }

    // 猜答偏誤（rule 10／11）：per-Concept 的統計性判準，與逐題判準分開計算。
    if (items.length >= QUIZ_BIAS_MIN_ITEMS) {
      const positionCounts = [0, 0, 0, 0];
      let uniqueLongestAsAnswer = 0;
      for (const item of items) {
        positionCounts[item.answerIndex]!++;
        if (isAnswerUniqueLongestOption(item)) uniqueLongestAsAnswer++;
      }

      const maxPositionCount = Math.max(...positionCounts);
      if (maxPositionCount / items.length > QUIZ_BIAS_MAX_SHARE) {
        const label = QUIZ_ANSWER_LABELS[positionCounts.indexOf(maxPositionCount) as 0 | 1 | 2 | 3];
        violations.push({
          rule: "quiz-answer-position-bias",
          subject: conceptSubject,
          message:
            `Concept「${conceptId}」的正解位置過度集中：${items.length} 題中有 ${maxPositionCount} 題（${((maxPositionCount / items.length) * 100).toFixed(0)}%）` +
            `正解為「${label}」，超過上限 ${QUIZ_BIAS_MAX_SHARE * 100}%（分布 A=${positionCounts[0]} B=${positionCounts[1]} C=${positionCounts[2]} D=${positionCounts[3]}）；` +
            `MUST 將正解平均分散到四個位置，否則學習者不讀題也能猜對`,
        });
      }

      const usedPositions = positionCounts.filter((c) => c > 0).length;
      const requiredCoverage =
        items.length >= QUIZ_POSITION_FULL_COVERAGE_ITEMS ? 4 : QUIZ_POSITION_COVERAGE_MIN;
      if (usedPositions < requiredCoverage) {
        const unused = QUIZ_ANSWER_LABELS.filter((_, i) => positionCounts[i] === 0).join("、");
        violations.push({
          rule: "quiz-answer-position-coverage",
          subject: conceptSubject,
          message:
            `Concept「${conceptId}」的正解只用到 ${usedPositions} 個位置（需 ≥${requiredCoverage}）：` +
            `分布 A=${positionCounts[0]} B=${positionCounts[1]} C=${positionCounts[2]} D=${positionCounts[3]}，` +
            `位置「${unused}」從未被使用；MUST 讓正解涵蓋更多位置，否則猜答空間被縮小`,
        });
      }

      if (uniqueLongestAsAnswer / items.length > QUIZ_BIAS_MAX_SHARE) {
        violations.push({
          rule: "quiz-longest-option-bias",
          subject: conceptSubject,
          message:
            `Concept「${conceptId}」的正解過度集中於最長選項：${items.length} 題中有 ${uniqueLongestAsAnswer} 題（${((uniqueLongestAsAnswer / items.length) * 100).toFixed(0)}%）` +
            `的正解是該題唯一最長的選項，超過上限 ${QUIZ_BIAS_MAX_SHARE * 100}%；` +
            `MUST 讓四個選項的長度相近，否則學習者可用長度猜答案`,
        });
      }
    }

    const firstSeenAt = new Map<string, number>();

    items.forEach((item, i) => {
      const subject = `${conceptSubject}[${i}]`;

      item.options.forEach((opt, oi) => {
        if (OPTION_PREFIX_PATTERN.test(opt)) {
          violations.push({
            rule: "quiz-option-prefix",
            subject,
            message: `「${subject}」的 options[${oi}] 含代號前綴：「${opt}」`,
          });
        }
        if (OPTION_CROSS_REFERENCE_PATTERNS.some((p) => p.test(opt))) {
          violations.push({
            rule: "quiz-option-cross-reference",
            subject,
            message:
              `「${subject}」的 options[${oi}] 參照了其他選項或位置：「${opt}」；` +
              `選項順序會在寫入題庫前被確定性重排，這種寫法重排後必然語意錯亂，MUST 改寫為可獨立閱讀的敘述`,
          });
        }
      });

      const conclusionLength = codePointLength(item.explanation[0]);
      if (conclusionLength > 80) {
        violations.push({
          rule: "quiz-conclusion-length",
          subject,
          message: `「${subject}」的結論句長度 ${conclusionLength} 字元，超過上限 80：「${item.explanation[0]}」`,
        });
      }

      // 模擬呈現長度（data-model.md §3 公式）：與 renderQuizItemBody 共用同一份呈現邏輯（憲章 IX），
      // 一律假設連結存在且佔滿 QUIZ_URL_RESERVE_CHARS，使 Gate 恆比 runtime 實際檢查更嚴格。
      const estimated =
        codePointLength(renderQuizItemBody(toReviewQuizItem(conceptId, item))) + QUIZ_URL_RESERVE_CHARS;
      if (estimated > QUIZ_BUDGET_LIMITS.quizItem) {
        violations.push({
          rule: "quiz-item-budget",
          subject,
          message: `「${subject}」模擬呈現長度（含連結保留）${estimated} 字元，超過上限 ${QUIZ_BUDGET_LIMITS.quizItem}`,
        });
      }

      const mergedText = `${item.stem}${item.options.join("")}${item.explanation.join("")}`;

      const tc = checkTraditionalChinese(mergedText);
      for (const v of tc.violations) {
        violations.push({ rule: "quiz-traditional-chinese", subject, message: `${subject}：${v.message}` });
      }

      if (LEETCODE_URL_PATTERN.test(mergedText) || LEETCODE_NUMBER_PATTERN.test(mergedText)) {
        violations.push({
          rule: "quiz-leetcode-id",
          subject,
          message: `「${subject}」疑似含 LeetCode 題號或題目連結：「${item.stem}」`,
        });
      }

      const firstAt = firstSeenAt.get(item.stem);
      if (firstAt !== undefined) {
        violations.push({
          rule: "quiz-duplicate",
          subject,
          message: `「${subject}」與 ${conceptSubject}[${firstAt}] 的 stem 完全重複：「${item.stem}」`,
        });
      } else {
        firstSeenAt.set(item.stem, i);
      }
    });
  }

  return violations;
}
