// F7 Stage 1 產出、唯一人工定稿物（R12、data-model.md §2）：`curriculum/outline.md` 的確定性
// 序列化。純函式：同一 CurriculumGraph 輸入 → byte-identical 輸出（可單測）；非機器消費物
// （Compiler 不讀本檔），只供人工一次性 review 顆粒度/順序/依賴方向。
import type { ConceptNode, CurriculumGraph, TopicNode } from "../../src/types/curriculum.js";

function cmpConcept(a: ConceptNode, b: ConceptNode): number {
  return a.localOrder - b.localOrder || a.id.localeCompare(b.id);
}

function cmpTopic(a: TopicNode, b: TopicNode): number {
  return a.topicIndex - b.topicIndex || a.id.localeCompare(b.id);
}

function edgeList(ids: string[]): string {
  return ids.length > 0 ? ids.join(", ") : "—";
}

function leetcodeList(ids: number[]): string {
  return ids.length > 0 ? ids.join(", ") : "—";
}

function conceptRow(c: ConceptNode): string {
  const nnn = String(c.localOrder).padStart(3, "0");
  return `| ${nnn} | \`${c.id}\` | ${c.title} | ${c.difficulty} | ${edgeList(c.prerequisite)} | ${edgeList(c.next)} | ${leetcodeList(c.leetcode)} |`;
}

const TABLE_HEADER = [
  "| NNN | id | title | difficulty | prerequisite → | next → | leetcode（候選） |",
  "| --- | --- | --- | --- | --- | --- | --- |",
].join("\n");

/**
 * 依 modules.json 宣告序 + 各 Skeleton frontmatter 確定性序列化 outline.md（R12）。
 * 只讀 graph（in-memory，已由 loadCurriculum 建好），不做任何檔案 I/O、不呼叫 LLM。
 */
export function serializeOutline(graph: CurriculumGraph): string {
  const lines: string[] = [
    "# Curriculum Outline（Stage 1 草稿，唯一人工定稿檢查點）",
    "",
    "審核重點：顆粒度（Topic 5–12 / Module 10–30）、Concept 順序、prerequisite/next 依賴方向、",
    "每個 Concept 的候選 `leetcode` 題號是否合理——非逐篇審 Author Hints 文字。",
    "",
  ];

  for (const module of graph.modules) {
    lines.push(`## Level ${module.level} · ${module.title}（\`${module.id}\`）`, "");

    const topics = [...graph.topics.values()]
      .filter((t) => t.moduleId === module.id)
      .sort(cmpTopic);

    for (const topic of topics) {
      const concepts = [...graph.concepts.values()].filter((c) => c.topic === topic.id).sort(cmpConcept);
      lines.push(`### ${topic.title}（\`${topic.id}\`） — ${concepts.length} Concept`, "", TABLE_HEADER);
      for (const c of concepts) lines.push(conceptRow(c));
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
