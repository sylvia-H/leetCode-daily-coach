// F11 正解位置的確定性再平衡（quiz-bank-schema.md §5.2a）。
//
// **為何需要**：`quiz-answer-position-bias`（rule 10）與 `quiz-answer-position-coverage`（rule 12）
// 原本靠「模型自己分散 → 不合格就整個 Concept 重生」達成，這是一個**取樣＋拒絕**的機制，兩個問題：
//   1. 題數只有 4～10，佔比／覆蓋在這種樣本量下波動極大。即使模型完全無偏誤（answerIndex 均勻隨機），
//      這兩條合起來的誤殺率仍有 **約 23%–45%**（n=8 時光是「四格全中」就有 37.7% 機率至少一格是空的）。
//      MAX_REGEN=3 之下，純統計噪音就會讓約 4%–12% 的 Concept 被誤判為 needsHumanReview。
//   2. 模型實際上**有**強偏誤（實測 2026-08-07 全庫 242 題：A 66.9%、B 26.4%、C 6.2%、D 0.4%），
//      靠重生賭它下一輪突然變均勻，期望輪數很高且每輪要燒 Stage A + Stage B + 逐題交叉驗證。
//
// **做法**：正解落在哪一格**不帶任何語意**，因此沒有理由交給 LLM 決定再事後拒絕。改為在交叉驗證後、
// 集合層 Gate 前，以確定性演算法把每題的正解搬到指定位置，讓分布**由建構保證**。rule 10／12 因而對
// 產線產出恆真，降級為「防手改題庫、防未來新來源」的 CI 守衛（見 quiz-bank-schema.md §3 的註記）。
// `quiz-longest-option-bias`（rule 11）**不受本模組影響**——重排不改長度，那是內容問題而非標籤問題，
// 仍由 prompt 與重生迴圈處置。
//
// 純函式：無 I/O、無隨機源、無時間依賴。PRNG 種子由 `conceptId` 決定 ⇒ 同輸入 → byte-identical 輸出。
import type { QuizItem } from "../../src/compiler/quiz.js";

/** FNV-1a 32-bit：把 conceptId 攤成 PRNG 種子（跨平台一致，不依賴任何內建雜湊實作細節）。 */
function fnv1a32(text: string): number {
  let hash = 0x811c9dc5;
  for (const ch of text) {
    hash ^= ch.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** mulberry32：小而穩定的確定性 PRNG。MUST NOT 換成 `Math.random()`（會破壞生成物的可重現性）。 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 產生長度為 `count` 的目標位置序列，四個位置的出現次數盡可能相等（最多相差 1）。
 *
 * **MUST 洗牌、MUST NOT 直接用 `i % 4`**：固定輪替雖然同樣平衡，但會讓「第幾題 → 正解在第幾格」
 * 變成可預測的規律。題庫會經 Pages 全文公開，那等於把「一律選 A」換成一個更好猜的規律，
 * 比原本的偏誤更糟。**MUST 先旋轉再洗牌**：`count` 不是 4 的倍數時餘數格必須輪流由不同位置承擔，
 * 否則 A 會恆為出現最多次的那一格。
 */
export function buildBalancedTargets(count: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const rotation = Math.floor(rand() * 4);
  const targets = Array.from({ length: count }, (_, i) => (i + rotation) % 4);
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [targets[i], targets[j]] = [targets[j]!, targets[i]!];
  }
  return targets;
}

/**
 * 把單一題目的正解搬到 `target` 位置。
 *
 * **干擾項 MUST 維持原相對順序**（本函式的核心不變量）：`explanation[2]`–`[4]` 的契約是
 * 「依序說明**其餘三個選項在 options 中的出現順序**各自為何不成立」（quiz-bank-schema.md §3 rule 4）。
 * 只要三個干擾項的相對順序不變，這份對應就自動維持正確，**不需要也 MUST NOT 一併重排 explanation**。
 * 若日後改成任意置換選項，MUST 同步置換 `explanation[2..4]`，否則詳解會對錯選項。
 */
export function moveAnswerTo(item: QuizItem, target: 0 | 1 | 2 | 3): QuizItem {
  if (item.answerIndex === target) return item;
  const answer = item.options[item.answerIndex];
  const distractors = item.options.filter((_, i) => i !== item.answerIndex);
  const options = [...distractors.slice(0, target), answer, ...distractors.slice(target)];
  return { ...item, options: options as [string, string, string, string], answerIndex: target };
}

/**
 * 對單一 Concept 的整個題目集合重排正解位置，使 rule 10／12 由建構保證通過。
 * 種子只綁 `conceptId`，故同一個 Concept 重跑產線時，只要題數不變，位置指派就完全相同。
 */
export function rebalanceAnswerPositions(conceptId: string, items: QuizItem[]): QuizItem[] {
  const targets = buildBalancedTargets(items.length, fnv1a32(conceptId));
  return items.map((item, i) => moveAnswerTo(item, targets[i] as 0 | 1 | 2 | 3));
}
