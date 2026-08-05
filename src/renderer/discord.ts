import type {
  BudgetSlots,
  ConceptLesson,
  DiscordEmbed,
  DiscordEmbedField,
  Lesson,
  PathLabels,
  PracticeLesson,
  Problem,
  RenderedMessage,
  RestLesson,
  ReviewLesson,
} from "../types/lesson.js";

// 題目 Embed 中每一則的 bullet 前綴（budget.ts 不再反解析——budgetSlots.problems 已逐題提供同一份
// 字串實例；此常數只用於渲染，保留匯出供既有測試沿用）。
export const PROBLEM_BULLET = "• ";
// Exit Criteria checklist 每行的固定前綴；budget.ts 量測單條長度時需剝除同一份前綴常數，避免版面
// 調整（如改用不同 checkbox 符號）時兩處單邊漂移。
export const EXIT_CRITERIA_PREFIX = "- [ ] ";

const TOTAL_LIMIT = 5500;

const PRACTICE_PROMPT = "今天不引入新觀念，把前面學過的 Pattern 拿出來練，把熟練度變成直覺。";
const CHALLENGE_PROMPT = "準備好了嗎？今天是綜合運用的時刻，試著在不看提示的狀況下解出來。";
const REST_DESCRIPTION = "今天是休息日：回顧這週學到的東西，讓大腦消化一下，明天再繼續前進。";

interface Block {
  embed: DiscordEmbed;
  slots: BudgetSlots;
}

function textLength(s: string | undefined): number {
  return s ? Array.from(s).length : 0;
}

// 供 render() 內部的拆訊息門檻判斷用（R11）；與 budget.ts 的 countedTextLength 計入相同欄位，
// 但因 Renderer MUST 只 import 型別（憲章 XI），無法 import budget.ts，於此獨立實作同一套計數規則。
function embedLength(embed: DiscordEmbed): number {
  let total = textLength(embed.title) + textLength(embed.description);
  for (const field of embed.fields ?? []) {
    total += textLength(field.name) + textLength(field.value);
  }
  total += textLength(embed.footer?.text);
  total += textLength(embed.author?.name);
  return total;
}

/**
 * 匯出供 Stage 2 的 per-article Gate 沿用（憲章 IX：不另立平行判準）。生成期要判斷單題是否超過
 * `PROBLEM_ENTRY_MAX`，量測對象 MUST 是**這裡 render 出的同一份字串**——自行拼一份「差不多」的
 * 格式必然與 renderer 漂移，屆時會出現「生成期放行、批次末才擋下」的落差。
 */
export function renderProblemEntry(problem: Problem): string {
  const hintPart = problem.hint ? ` · Hint: ${problem.hint}` : "";
  const detail = problem.whyThisPattern
    ? `\n  ${problem.difficulty} · ${problem.whyThisPattern}${hintPart}`
    : `\n  ${problem.difficulty}`;
  return `${PROBLEM_BULLET}[${problem.id}. ${problem.title}](${problem.url})${detail}`;
}

function renderPathFooter(path: PathLabels): string {
  const lines: string[] = [];
  if (path.prev) lines.push(`昨天  ${path.prev} ✓`);
  lines.push(`今天  ${path.current}`);
  if (path.next) lines.push(`明天  ${path.next}`);
  return lines.join("\n");
}

function renderExitCriteria(items: string[]): string {
  return items.map((item) => `${EXIT_CRITERIA_PREFIX}${item}`).join("\n");
}

function buildConceptBlocks(lesson: ConceptLesson): Block[] {
  const { concept, path } = lesson;
  const blocks: Block[] = [];

  const digest = concept.digest;
  const tsTip = concept.tsTip;
  const pyTip = concept.pyTip;
  const mainEmbed: DiscordEmbed = {
    title: `📚 Session ${lesson.sessionIndex} · ${concept.title}`,
    description: digest,
    color: lesson.color,
    fields: [
      { name: "Pattern", value: concept.patternLabel, inline: true },
      { name: "複雜度", value: concept.complexityLabel, inline: true },
      { name: "預估時間", value: `${concept.estimatedMinutes} 分鐘`, inline: true },
      { name: "TypeScript Tip", value: tsTip },
      { name: "Python Tip", value: pyTip },
    ],
  };
  blocks.push({ embed: mainEmbed, slots: { digest, tsTip, pyTip } });

  if (lesson.problems.length > 0) {
    const entries = lesson.problems.map(renderProblemEntry);
    blocks.push({
      embed: { title: "🎯 Today's Challenge", description: entries.join("\n"), color: lesson.color },
      slots: { problems: entries },
    });
  }

  if (lesson.overlayNotes !== undefined) {
    const overlayNotes = lesson.overlayNotes;
    blocks.push({
      embed: { title: "📎 Track 補充", description: overlayNotes, color: lesson.color },
      slots: { overlayNotes },
    });
  }

  const pathFooter = renderPathFooter(path);
  const exitCriteria = renderExitCriteria(concept.exitCriteria);
  const takeaway = concept.takeaway;
  blocks.push({
    embed: {
      color: lesson.color,
      fields: [
        { name: "🧭 學習路徑", value: pathFooter },
        { name: "✅ Exit Criteria", value: exitCriteria },
        { name: "💡 Takeaway", value: takeaway },
      ],
    },
    slots: { pathFooter, exitCriteria, takeaway },
  });

  return blocks;
}

function buildPracticeOrChallengeBlocks(lesson: PracticeLesson): Block[] {
  const isChallenge = lesson.type === "challenge";
  const title = isChallenge ? `🔥 Session ${lesson.sessionIndex} · Challenge` : `🏋️ Session ${lesson.sessionIndex} · 練習`;
  const prompt = isChallenge ? CHALLENGE_PROMPT : PRACTICE_PROMPT;

  if (lesson.problems.length === 0) {
    return [{ embed: { title, description: prompt, color: lesson.color }, slots: {} }];
  }

  const entries = lesson.problems.map(renderProblemEntry);
  const description = `${prompt}\n\n${entries.join("\n")}`;
  return [{ embed: { title, description, color: lesson.color }, slots: { problems: entries } }];
}

function buildReviewBlocks(lesson: ReviewLesson): Block[] {
  const fields: DiscordEmbedField[] = [
    { name: "📚 本週涵蓋", value: lesson.reviewConcepts.map((c) => `- ${c.title}`).join("\n") },
  ];
  const slots: BudgetSlots = {};

  if (lesson.reflectionQuestion !== undefined) {
    // 放進 embed 的每一段可變長度文字都 MUST 同時登記 slot，否則會完全逃過逐區塊預算。
    slots.reflectionQuestion = lesson.reflectionQuestion;
    fields.push({ name: "🤔 Reflection", value: lesson.reflectionQuestion });
  }
  if (lesson.problems.length > 0) {
    const entries = lesson.problems.map(renderProblemEntry);
    slots.problems = entries;
    fields.push({ name: "🎯 Challenge", value: entries.join("\n") });
  }
  if (lesson.encouragement !== undefined) {
    // MUST 為最後一段（FR-022）：MUST NOT 插入於 Reflection 與 Challenge 之間，避免通用文字
    // 稀釋針對本週教材的具體提問。
    slots.encouragement = lesson.encouragement;
    fields.push({ name: "💬 一句話", value: lesson.encouragement });
  }

  return [{ embed: { title: `🔁 Session ${lesson.sessionIndex} · 本週複習`, color: lesson.color, fields }, slots }];
}

function buildRestBlocks(lesson: RestLesson): Block[] {
  const embed: DiscordEmbed = {
    title: `😌 Session ${lesson.sessionIndex} · 休息日`,
    description: REST_DESCRIPTION,
    color: lesson.color,
  };
  const slots: BudgetSlots = {};
  if (lesson.encouragement !== undefined) {
    slots.encouragement = lesson.encouragement;
    embed.fields = [{ name: "💬 一句話", value: lesson.encouragement }];
  }
  return [{ embed, slots }];
}

function buildBlocks(lesson: Lesson): Block[] {
  switch (lesson.type) {
    case "concept":
      return buildConceptBlocks(lesson);
    case "practice":
    case "challenge":
      return buildPracticeOrChallengeBlocks(lesson);
    case "review":
      return buildReviewBlocks(lesson);
    case "rest":
      return buildRestBlocks(lesson);
    default: {
      // 型別層已窮舉；此支只在 Lesson 由型別系統之外的來源構造時命中，指名根因而非讓版面組裝
      // 回傳 undefined 後在別處爆開（憲章 XV Fail loud）。
      const unknown = lesson as { type: string; sessionIndex?: number };
      throw new Error(`未知的 Session type：${unknown.type}（sessionIndex=${unknown.sessionIndex}）`);
    }
  }
}

function mergeSlots(blocks: Block[]): BudgetSlots {
  const merged: BudgetSlots = {};
  for (const { slots } of blocks) {
    if (slots.digest !== undefined) merged.digest = slots.digest;
    if (slots.tsTip !== undefined) merged.tsTip = slots.tsTip;
    if (slots.pyTip !== undefined) merged.pyTip = slots.pyTip;
    if (slots.exitCriteria !== undefined) merged.exitCriteria = slots.exitCriteria;
    if (slots.takeaway !== undefined) merged.takeaway = slots.takeaway;
    if (slots.pathFooter !== undefined) merged.pathFooter = slots.pathFooter;
    if (slots.overlayNotes !== undefined) merged.overlayNotes = slots.overlayNotes;
    if (slots.reflectionQuestion !== undefined) merged.reflectionQuestion = slots.reflectionQuestion;
    if (slots.encouragement !== undefined) merged.encouragement = slots.encouragement;
    if (slots.problems !== undefined) merged.problems = slots.problems;
  }
  return merged;
}

// Renderer：stateless 純函式，只 import src/types/lesson.ts（憲章 XI）。
// 版面順序寫死：觀念先於題目（憲章 I）；版面分派只依 lesson.type（憲章 XI 版面規則）。
export function render(lesson: Lesson): RenderedMessage[] {
  const blocks = buildBlocks(lesson);
  const total = blocks.reduce((sum, b) => sum + embedLength(b.embed), 0);

  if (total <= TOTAL_LIMIT) {
    return [{ embeds: blocks.map((b) => b.embed), budgetSlots: mergeSlots(blocks) }];
  }

  // 拆訊息 fallback（§14.5、research R11）：依 embed 邊界原序切分，最多兩則，embed 內部不切分。
  const firstBlocks: Block[] = [];
  let running = 0;
  let splitIndex = 0;
  for (; splitIndex < blocks.length; splitIndex++) {
    const block = blocks[splitIndex]!;
    const candidate = running + embedLength(block.embed);
    if (firstBlocks.length > 0 && candidate > TOTAL_LIMIT) break;
    firstBlocks.push(block);
    running = candidate;
  }
  const secondBlocks = blocks.slice(splitIndex);

  const messages: RenderedMessage[] = [
    { embeds: firstBlocks.map((b) => b.embed), budgetSlots: mergeSlots(firstBlocks) },
  ];
  if (secondBlocks.length > 0) {
    messages.push({ embeds: secondBlocks.map((b) => b.embed), budgetSlots: mergeSlots(secondBlocks) });
  }
  return messages;
}
