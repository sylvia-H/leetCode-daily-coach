import type { DiscordEmbed, Lesson } from "../types/lesson.js";

// 題目 Embed 中每一則的 bullet 前綴（contracts/discord-embed-contract.md §1）。
//
// `budget.ts` MUST import 這一顆常數來切分逐題內容，MUST NOT 自行寫死 "• "。checkBudget 是
// post-render validator——它量測的是「實際會送出去的 payload」，逐題預算因此必須從已渲染的
// description 切分。兩邊各自寫死時，調整版面只改其中一處會讓逐題 350 上限與題數上限**靜默失效**
// （超長 lesson 仍以 ok === true 通過 Gate）。常數由產生者匯出、量測者引用，使其無法單邊漂移。
export const PROBLEM_BULLET = "• ";

function renderProblemsDescription(lesson: Lesson): string {
  return lesson.problems
    .map((problem) => {
      const hintPart = problem.hint ? ` · Hint: ${problem.hint}` : "";
      return `${PROBLEM_BULLET}[${problem.id}. ${problem.title}](${problem.url})\n  ${problem.difficulty} · ${problem.whyThisPattern}${hintPart}`;
    })
    .join("\n");
}

function renderPathFooter(lesson: Lesson): string {
  const lines: string[] = [];
  if (lesson.path.prev) {
    lines.push(`昨天  ${lesson.path.prev} ✓`);
  }
  lines.push(`今天  ${lesson.path.current}`);
  if (lesson.path.next) {
    lines.push(`明天  ${lesson.path.next}`);
  }
  return lines.join("\n");
}

function renderExitCriteria(lesson: Lesson): string {
  return lesson.concept.exitCriteria.map((item) => `- [ ] ${item}`).join("\n");
}

// Renderer：stateless 純函式，只 import src/types/lesson.ts（憲章 XI）。
// 版面順序寫死：觀念先於題目（憲章 I）。
export function render(lesson: Lesson): DiscordEmbed[] {
  const mainEmbed: DiscordEmbed = {
    title: `📚 Session ${lesson.sessionIndex} · ${lesson.concept.title}`,
    description: lesson.concept.digest,
    color: lesson.concept.moduleColor,
    fields: [
      { name: "Pattern", value: lesson.concept.patternLabel, inline: true },
      { name: "複雜度", value: lesson.concept.complexityLabel, inline: true },
      { name: "預估時間", value: `${lesson.concept.estimatedMinutes} 分鐘`, inline: true },
      { name: "TypeScript Tip", value: lesson.concept.tsTip, inline: false },
      { name: "Python Tip", value: lesson.concept.pyTip, inline: false },
    ],
  };

  const problemEmbed: DiscordEmbed = {
    title: "🎯 Today's Challenge",
    description: renderProblemsDescription(lesson),
    color: lesson.concept.moduleColor,
  };

  const closingEmbed: DiscordEmbed = {
    color: lesson.concept.moduleColor,
    fields: [
      { name: "🧭 學習路徑", value: renderPathFooter(lesson) },
      { name: "✅ Exit Criteria", value: renderExitCriteria(lesson) },
      { name: "💡 Takeaway", value: lesson.concept.takeaway },
    ],
  };

  return [mainEmbed, problemEmbed, closingEmbed];
}
