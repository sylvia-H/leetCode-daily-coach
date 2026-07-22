// 測試輔助：建構驗證用的「資料」（骨架物件與 in-memory 圖），供圖層規則測試在記憶體中組情境。
// 這裡只組資料、不重寫任何驗證規則（規則僅存在於 src/compiler/**，SC-007 / T025）。
import { computeOrdinal } from "../../src/compiler/curriculum.js";
import type {
  ConceptNode,
  CurriculumGraph,
  CurriculumSkeleton,
  ModuleNode,
  ModuleSkeleton,
  Ordinal,
  TopicNode,
} from "../../src/types/curriculum.js";

/** docs/spec.md §8.2 的完整 16 個 Level（Module id → 顯示名），順序即 level。 */
export const MODULE_DEFS: ReadonlyArray<readonly [string, string]> = [
  ["programming-mindset", "Programming Mindset"],
  ["array", "Array"],
  ["hash-table", "Hash Table"],
  ["string", "String"],
  ["two-pointer", "Two Pointer"],
  ["binary-search", "Binary Search"],
  ["sliding-window", "Sliding Window"],
  ["stack", "Stack"],
  ["queue", "Queue"],
  ["linked-list", "Linked List"],
  ["tree", "Tree"],
  ["graph", "Graph"],
  ["heap", "Heap / Priority Queue"],
  ["backtracking", "Backtracking"],
  ["dfs-bfs", "DFS / BFS"],
  ["dynamic-programming", "Dynamic Programming"],
];

/** 產生結構合法的 16-Module 骨架（每個 Module 一個主 Topic，id 沿用 Module id）。 */
export function validModules(): CurriculumSkeleton {
  return {
    version: 1,
    modules: MODULE_DEFS.map(([id, title], level) => ({
      id,
      title,
      level,
      topics: [{ id, title }],
    })),
  };
}

/** 由「module → topics」規格建自訂骨架（供顆粒度邊界測試組多 Topic 的 Module）。 */
export function skeletonOf(mods: { id: string; topics: string[] }[]): CurriculumSkeleton {
  return {
    version: 1,
    modules: mods.map(({ id, topics }, level) => ({
      id,
      title: id,
      level,
      topics: topics.map((t) => ({ id: t, title: t })),
    })),
  };
}

/** 產生 count 個掛在同一 module/topic 的 Concept 規格（localOrder 連號，無連結）。 */
export function repeatConcepts(
  module: string,
  topic: string,
  count: number,
  startOrder = 1,
): ConceptSpec[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${topic}-${startOrder + i}`,
    module,
    topic,
    localOrder: startOrder + i,
  }));
}

/** 測試用 Concept 規格（只列必要欄位，其餘以合理預設補齊）。 */
export interface ConceptSpec {
  id: string;
  module: string;
  topic: string;
  /** 檔名 NNN。 */
  localOrder: number;
  prerequisite?: string[];
  next?: string[];
  /** 實際所在資料夾名（預設 = topic）。 */
  dirName?: string;
  leetcode?: number[];
}

function toNode(spec: ConceptSpec): ConceptNode {
  const dir = spec.dirName ?? spec.topic;
  const nnn = String(spec.localOrder).padStart(3, "0");
  return {
    id: spec.id,
    title: spec.id,
    module: spec.module,
    topic: spec.topic,
    difficulty: "easy",
    estimatedMinutes: 10,
    patternLabel: "Pattern",
    complexityLabel: "O(n)",
    prerequisite: spec.prerequisite ?? [],
    next: spec.next ?? [],
    learningGoal: ["目標"],
    exitCriteria: ["條件"],
    leetcode: spec.leetcode ?? [],
    tags: [],
    localOrder: spec.localOrder,
    skeletonPath: `concepts/${dir}/${nnn}-${spec.id}.md`,
    articlePath: `articles/${dir}/${nnn}-${spec.id}.md`,
    dirName: dir,
  };
}

/**
 * 由骨架 + Concept 規格建 in-memory 圖，**不做任何驗證**（模擬 loadCurriculum 的建圖產物）。
 * ordinal 一律沿用 src/compiler 的 computeOrdinal，避免此處手抄 sentinel 規則而與正式建圖分歧
 * （SC-007）；懸空 module/topic 交由 computeOrdinal 以 SENTINEL 排在最後、validateCurriculum 判 dangling-ref。
 */
export function buildGraph(
  specs: ConceptSpec[],
  skeleton: CurriculumSkeleton = validModules(),
): CurriculumGraph {
  const modules: ModuleNode[] = skeleton.modules.map((m: ModuleSkeleton, i) => ({
    ...m,
    moduleIndex: i,
  }));
  const topics = new Map<string, TopicNode>();
  modules.forEach((m) => {
    m.topics.forEach((t, ti) => {
      topics.set(t.id, { ...t, moduleId: m.id, topicIndex: ti });
    });
  });

  const concepts = new Map<string, ConceptNode>();
  const ordinalOf = new Map<string, Ordinal>();
  for (const spec of specs) {
    const node = toNode(spec);
    concepts.set(node.id, node);
    ordinalOf.set(node.id, computeOrdinal(node, modules, topics));
  }

  return { modules, topics, concepts, ordinalOf };
}
