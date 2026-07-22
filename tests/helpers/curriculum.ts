// 測試輔助：建構驗證用的「資料」（骨架物件與 in-memory 圖），供圖層規則測試在記憶體中組情境。
// 這裡只組資料、不重寫任何驗證規則（規則僅存在於 src/compiler/**，SC-007 / T025）。
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

const SENTINEL = Number.MAX_SAFE_INTEGER;

/**
 * 由骨架 + Concept 規格建 in-memory 圖，**不做任何驗證**（模擬 loadCurriculum 的建圖產物）。
 * 懸空 module/topic 以 sentinel ordinal 排在最後，交由 validateCurriculum 判 dangling-ref。
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
    const moduleIndex = modules.findIndex((m) => m.id === node.module);
    const topicNode = topics.get(node.topic);
    ordinalOf.set(node.id, {
      moduleIndex: moduleIndex >= 0 ? moduleIndex : SENTINEL,
      topicIndex: topicNode ? topicNode.topicIndex : SENTINEL,
      localOrder: node.localOrder,
      id: node.id,
    });
  }

  return { modules, topics, concepts, ordinalOf };
}
