import type { DiscordEmbed } from "../types/lesson.js";

export interface BudgetItem {
  name: string;
  length: number;
  limit: number;
  over: boolean;
}

export interface BudgetReport {
  items: BudgetItem[];
  total: number;
  totalLimit: 5500;
  hardLimit: 6000;
  ok: boolean;
}

const TOTAL_LIMIT = 5500;
const HARD_LIMIT = 6000;

function codePointLength(s: string | undefined): number {
  return s ? Array.from(s).length : 0;
}

function makeItem(name: string, length: number, limit: number): BudgetItem {
  return { name, length, limit, over: length > limit };
}

function findFieldValue(embed: DiscordEmbed | undefined, fieldName: string): string | undefined {
  return embed?.fields?.find((field) => field.name === fieldName)?.value;
}

function countedTextLength(embed: DiscordEmbed): number {
  let total = codePointLength(embed.title) + codePointLength(embed.description);
  for (const field of embed.fields ?? []) {
    total += codePointLength(field.name) + codePointLength(field.value);
  }
  total += codePointLength(embed.footer?.text);
  total += codePointLength(embed.author?.name);
  return total;
}

interface ProblemEntry {
  id: string;
  text: string;
}

// 題目 Embed 的每一則以 "• " 開頭（見 contracts/discord-embed-contract.md §1），依此切分逐題內容。
function parseProblemEntries(description: string | undefined): ProblemEntry[] {
  if (!description) return [];
  const lines = description.split("\n");
  const entries: ProblemEntry[] = [];
  let current: ProblemEntry | null = null;

  for (const line of lines) {
    if (line.startsWith("• ")) {
      if (current) entries.push(current);
      const match = line.match(/^•\s*\[(\d+)\./);
      current = { id: match?.[1] ?? String(entries.length + 1), text: line };
    } else if (current) {
      current.text += `\n${line}`;
    }
  }
  if (current) entries.push(current);
  return entries;
}

// 獨立純函式（憲章 IX）：同時涵蓋逐區塊預算、總量上限與平台結構性上限，供 runtime 與未來 F5 的
// scripts/validate.ts 共用同一顆實作。
export function checkBudget(embeds: DiscordEmbed[]): BudgetReport {
  const items: BudgetItem[] = [];

  const mainEmbed = embeds[0];
  const problemEmbed = embeds[1];
  const closingEmbed = embeds[2];

  if (mainEmbed) {
    items.push(makeItem("digest", codePointLength(mainEmbed.description), 900));
    items.push(makeItem("tsTip", codePointLength(findFieldValue(mainEmbed, "TypeScript Tip")), 450));
    items.push(makeItem("pyTip", codePointLength(findFieldValue(mainEmbed, "Python Tip")), 450));
  }

  if (problemEmbed) {
    const entries = parseProblemEntries(problemEmbed.description);
    for (const entry of entries) {
      items.push(makeItem(`problem[${entry.id}]`, codePointLength(entry.text), 350));
    }
    items.push(makeItem("problems.count", entries.length, 3));
  }

  if (closingEmbed) {
    items.push(makeItem("exitCriteria", codePointLength(findFieldValue(closingEmbed, "✅ Exit Criteria")), 400));
    items.push(makeItem("takeaway", codePointLength(findFieldValue(closingEmbed, "💡 Takeaway")), 120));
    items.push(makeItem("pathFooter", codePointLength(findFieldValue(closingEmbed, "🧭 學習路徑")), 200));
  }

  // 平台結構性上限（FR-006b）：這些是平台會直接拒絕請求的硬限制，MUST 與逐區塊預算在同一次呼叫中檢查。
  embeds.forEach((embed, i) => {
    items.push(makeItem(`embed[${i}].title`, codePointLength(embed.title), 256));
    items.push(makeItem(`embed[${i}].description`, codePointLength(embed.description), 4096));
    items.push(makeItem(`embed[${i}].fields.count`, embed.fields?.length ?? 0, 25));
    (embed.fields ?? []).forEach((field, j) => {
      items.push(makeItem(`embed[${i}].field[${j}].name`, codePointLength(field.name), 256));
      items.push(makeItem(`embed[${i}].field[${j}].value`, codePointLength(field.value), 1024));
    });
  });
  items.push(makeItem("embeds.count", embeds.length, 10));

  const total = embeds.reduce((sum, embed) => sum + countedTextLength(embed), 0);
  items.push(makeItem("total", total, TOTAL_LIMIT));

  const ok = items.every((item) => !item.over);

  return { items, total, totalLimit: TOTAL_LIMIT, hardLimit: HARD_LIMIT, ok };
}
