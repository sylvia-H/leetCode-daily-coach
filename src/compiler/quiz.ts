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
  | "quiz-conclusion-length"
  | "quiz-item-budget"
  | "quiz-traditional-chinese"
  | "quiz-count-range"
  | "quiz-duplicate"
  | "quiz-leetcode-id"; // §5／§11：題號 MUST 由程式從 Problem Bank 帶入，MUST NOT 由 LLM 生成

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

const OPTION_PREFIX_PATTERN = /^[A-D][.、)]\s*/;
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
