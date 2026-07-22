// Curriculum 載入 + in-memory DAG 建置 + 完整性驗證的**單一實作**（FR-022 / FR-024）。
// F5 runtime Compiler、F7 Stage 1 / CI Gate MUST 呼叫同一顆，MUST NOT 另寫平行驗證。
// validateCurriculum 為純函式：無 process.exit、無 I/O（供 runtime / Gate 安全 import）。
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import matter from "gray-matter";
import { parseConceptFrontmatter, parseModules } from "./schema.js";
import type {
  ConceptNode,
  CurriculumGraph,
  ModuleNode,
  Ordinal,
  TopicNode,
  ValidateOptions,
  ValidationResult,
  Violation,
} from "../types/curriculum.js";

const SENTINEL = Number.MAX_SAFE_INTEGER;

// ── 共用比較器（確定性，R5） ────────────────────────────────────────────────

function cmpOrdinal(a: Ordinal, b: Ordinal): number {
  return (
    a.moduleIndex - b.moduleIndex ||
    a.topicIndex - b.topicIndex ||
    a.localOrder - b.localOrder ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

function cmpViolation(a: Violation, b: Violation): number {
  return (
    a.rule.localeCompare(b.rule) ||
    a.subject.localeCompare(b.subject) ||
    (a.field ?? "").localeCompare(b.field ?? "")
  );
}

function dedupe(ids: string[]): { unique: string[]; hadDup: boolean } {
  const seen = new Set<string>();
  const unique: string[] = [];
  let hadDup = false;
  for (const id of ids) {
    if (seen.has(id)) hadDup = true;
    else {
      seen.add(id);
      unique.push(id);
    }
  }
  return { unique, hadDup };
}

// ── loadCurriculum（讀檔 + 建圖；只產 schema 類違規，FR-013） ─────────────────

export interface LoadInput {
  modulesPath: string;
  conceptsDir: string;
}

export interface LoadResult {
  graph: CurriculumGraph;
  loadViolations: Violation[];
}

function stripLeadingComment(raw: string): string {
  return raw.replace(/^\s*<!--[\s\S]*?-->\s*\n/, "");
}

function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const entry of readdirSync(d).sort()) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".md")) out.push(full);
    }
  };
  walk(dir);
  return out;
}

const NNN_RE = /^(\d{3})-.+\.md$/;

export function loadCurriculum(input: LoadInput): LoadResult {
  const loadViolations: Violation[] = [];

  // modules.json
  let modulesRaw: unknown;
  if (existsSync(input.modulesPath)) {
    try {
      modulesRaw = JSON.parse(readFileSync(input.modulesPath, "utf-8"));
    } catch (err) {
      loadViolations.push({
        rule: "skeleton-shape",
        severity: "error",
        subject: input.modulesPath,
        message: `modules.json 無法解析為 JSON：${(err as Error).message}`,
      });
    }
  } else {
    loadViolations.push({
      rule: "skeleton-shape",
      severity: "error",
      subject: input.modulesPath,
      message: `modules.json 不存在：${input.modulesPath}`,
    });
  }
  const { skeleton, violations: moduleViolations } = parseModules(modulesRaw ?? {});
  // 缺檔 / 壞 JSON 時 modulesRaw 為 undefined，parseModules 會另報結構違規；避免重覆噪音，
  // 僅在確有解析輸入時併入其 schema 違規。
  if (modulesRaw !== undefined) loadViolations.push(...moduleViolations);

  const modules: ModuleNode[] = (skeleton?.modules ?? []).map((m, i) => ({ ...m, moduleIndex: i }));
  const topics = new Map<string, TopicNode>();
  modules.forEach((m) =>
    m.topics.forEach((t, ti) => topics.set(t.id, { ...t, moduleId: m.id, topicIndex: ti })),
  );

  // concepts
  const concepts = new Map<string, ConceptNode>();
  const conceptsDirMissing = !existsSync(input.conceptsDir);
  const files = conceptsDirMissing ? [] : listMarkdown(input.conceptsDir);

  for (const file of files) {
    const raw = readFileSync(file, "utf-8");
    const { data } = matter(stripLeadingComment(raw));
    const { frontmatter, violations } = parseConceptFrontmatter(data, file);
    loadViolations.push(...violations);
    if (!frontmatter) continue;

    const fname = basename(file);
    const nnn = NNN_RE.exec(fname);
    const localOrder = nnn ? parseInt(nnn[1]!, 10) : 0;
    const dirName = basename(dirname(file));
    const node: ConceptNode = {
      id: frontmatter.id,
      title: frontmatter.title,
      module: frontmatter.module,
      topic: frontmatter.topic,
      difficulty: frontmatter.difficulty,
      estimatedMinutes: frontmatter.estimated_minutes,
      patternLabel: frontmatter.pattern_label,
      complexityLabel: frontmatter.complexity_label,
      prerequisite: frontmatter.prerequisite,
      next: frontmatter.next,
      learningGoal: frontmatter.learning_goal,
      exitCriteria: frontmatter.exit_criteria,
      leetcode: frontmatter.leetcode,
      tags: frontmatter.tags,
      localOrder,
      skeletonPath: `concepts/${dirName}/${fname}`,
      articlePath: `articles/${dirName}/${fname}`,
      dirName,
    };

    if (concepts.has(node.id)) {
      loadViolations.push({
        rule: "duplicate-id",
        severity: "error",
        subject: node.id,
        field: "concept",
        target: node.skeletonPath,
        message: `Concept id 重複：${node.id}（${node.skeletonPath}）`,
      });
      continue;
    }
    concepts.set(node.id, node);
  }

  const ordinalOf = new Map<string, Ordinal>();
  for (const node of concepts.values()) {
    const moduleIndex = modules.findIndex((m) => m.id === node.module);
    const topicNode = topics.get(node.topic);
    ordinalOf.set(node.id, {
      moduleIndex: moduleIndex >= 0 ? moduleIndex : SENTINEL,
      topicIndex: topicNode ? topicNode.topicIndex : SENTINEL,
      localOrder: node.localOrder,
      id: node.id,
    });
  }

  loadViolations.sort(cmpViolation);
  return {
    graph: { modules, topics, concepts, ordinalOf, conceptsDirMissing },
    loadViolations,
  };
}

// ── validateCurriculum（圖層規則；純函式，FR-024） ───────────────────────────

export function validateCurriculum(
  graph: CurriculumGraph,
  options: ValidateOptions = {},
): ValidationResult {
  const violations: Violation[] = [];
  const skipped: ValidationResult["skipped"] = [];
  const concepts = graph.concepts;

  // 0. 空課程守衛（error，兩模式皆強制，命中即回傳，FR-010a / U2）
  if (concepts.size === 0) {
    violations.push({
      rule: "empty-curriculum",
      severity: "error",
      subject: "curriculum",
      message: graph.conceptsDirMissing
        ? "concepts 目錄不存在，無法建立課程圖"
        : "concepts 目錄下無任何 Concept（目錄為空）",
    });
    return { ok: false, violations, skipped };
  }

  // 依全序排序的 Concept 走訪順序（確定性，R5）
  const ordered = [...concepts.values()].sort((a, b) =>
    cmpOrdinal(graph.ordinalOf.get(a.id)!, graph.ordinalOf.get(b.id)!),
  );

  // 3. 參照完整（此為參照檢查的唯一實作處，FR-013）
  for (const c of ordered) {
    const mod = graph.modules.find((m) => m.id === c.module);
    if (!mod) {
      violations.push(ref(c.id, "module", c.module, `Concept ${c.id} 的 module 不存在於骨架：${c.module}`));
    }
    const topicNode = graph.topics.get(c.topic);
    if (!topicNode) {
      violations.push(ref(c.id, "topic", c.topic, `Concept ${c.id} 的 topic 不存在於骨架：${c.topic}`));
    } else if (mod && topicNode.moduleId !== c.module) {
      violations.push(ref(c.id, "topic", c.topic, `Concept ${c.id} 的 topic（${c.topic}）不隸屬其 module（${c.module}）`));
    }
    if (c.topic !== c.dirName) {
      violations.push(ref(c.id, "topic", c.dirName, `Concept ${c.id} 的 topic（${c.topic}）與所在資料夾名（${c.dirName}）不符`));
    }
    for (const p of c.prerequisite) {
      if (!concepts.has(p)) {
        violations.push(ref(c.id, "prerequisite", p, `Concept ${c.id} 的 prerequisite 指向不存在的 Concept：${p}`));
      }
    }
    for (const n of c.next) {
      if (!concepts.has(n)) {
        violations.push(ref(c.id, "next", n, `Concept ${c.id} 的 next 指向不存在的 Concept：${n}`));
      }
    }
  }

  // 4. 重複邊正規化（duplicate-edge，warning）→ 供後續檢查使用去重後的邊
  const prereqOf = new Map<string, string[]>();
  const nextOf = new Map<string, string[]>();
  for (const c of ordered) {
    const p = dedupe(c.prerequisite);
    const n = dedupe(c.next);
    prereqOf.set(c.id, p.unique);
    nextOf.set(c.id, n.unique);
    if (p.hadDup) {
      violations.push({
        rule: "duplicate-edge",
        severity: "warning",
        subject: c.id,
        field: "prerequisite",
        message: `Concept ${c.id} 的 prerequisite 含重複 id（已去重續行）`,
      });
    }
    if (n.hadDup) {
      violations.push({
        rule: "duplicate-edge",
        severity: "warning",
        subject: c.id,
        field: "next",
        message: `Concept ${c.id} 的 next 含重複 id（已去重續行）`,
      });
    }
  }

  // 5. 雙向一致（error，不自動補齊，FR-017）；只比對兩端皆存在的邊
  for (const c of ordered) {
    for (const n of nextOf.get(c.id)!) {
      const target = concepts.get(n);
      if (target && !prereqOf.get(n)!.includes(c.id)) {
        violations.push({
          rule: "edge-inconsistency",
          severity: "error",
          subject: c.id,
          target: n,
          message: `${c.id}.next 含 ${n}，但 ${n}.prerequisite 未含 ${c.id}（雙向不一致）`,
        });
      }
    }
    for (const p of prereqOf.get(c.id)!) {
      const target = concepts.get(p);
      if (target && !nextOf.get(p)!.includes(c.id)) {
        violations.push({
          rule: "edge-inconsistency",
          severity: "error",
          subject: c.id,
          target: p,
          message: `${c.id}.prerequisite 含 ${p}，但 ${p}.next 未含 ${c.id}（雙向不一致）`,
        });
      }
    }
  }

  // 6. 自我依賴 + 無環（Kahn；自我依賴視為環的退化並單獨具名）
  const selfDep = new Set<string>();
  for (const c of ordered) {
    if (prereqOf.get(c.id)!.includes(c.id) || nextOf.get(c.id)!.includes(c.id)) {
      selfDep.add(c.id);
      violations.push({
        rule: "self-dependency",
        severity: "error",
        subject: c.id,
        message: `Concept ${c.id} 依賴自己（環的退化情形）`,
      });
    }
  }
  const cycleNodes = detectCycle(ordered, prereqOf, concepts, selfDep);
  if (cycleNodes.length > 0) {
    violations.push({
      rule: "cycle",
      severity: "error",
      subject: cycleNodes[0]!,
      target: cycleNodes.join(" → "),
      message: `偵測到依賴環，構成環的 Concept：${cycleNodes.join(", ")}`,
    });
  }

  // 7. 無前向依賴（相對宣告序全序，R7 / FR-014）
  for (const c of ordered) {
    const co = graph.ordinalOf.get(c.id)!;
    for (const p of prereqOf.get(c.id)!) {
      if (p === c.id) continue;
      const po = graph.ordinalOf.get(p);
      if (po && cmpOrdinal(po, co) > 0) {
        violations.push({
          rule: "forward-dependency",
          severity: "error",
          subject: c.id,
          target: p,
          message: `Concept ${c.id} 的 prerequisite ${p} 在宣告序上晚於自己（前向依賴）`,
        });
      }
    }
  }

  // 8. 無孤兒（合法起點 = ordinal.moduleIndex === 0 且為該 Topic 內 NNN 最小者，FR-016）
  const minLocalOrderOfTopic = new Map<string, number>();
  for (const c of ordered) {
    const cur = minLocalOrderOfTopic.get(c.topic);
    if (cur === undefined || c.localOrder < cur) minLocalOrderOfTopic.set(c.topic, c.localOrder);
  }
  const referencedByNext = new Set<string>();
  for (const c of ordered) for (const n of nextOf.get(c.id)!) referencedByNext.add(n);

  for (const c of ordered) {
    const ord = graph.ordinalOf.get(c.id)!;
    const isValidStart = ord.moduleIndex === 0 && c.localOrder === minLocalOrderOfTopic.get(c.topic);
    if (isValidStart) continue;
    if (prereqOf.get(c.id)!.length === 0 && !referencedByNext.has(c.id)) {
      violations.push({
        rule: "orphan",
        severity: "error",
        subject: c.id,
        message: `Concept ${c.id} 為孤兒：非合法起點、無 prerequisite、且未被任何 next 提及`,
      });
    }
  }

  violations.sort(cmpViolation);
  const ok = !violations.some((v) => v.severity === "error");
  const result: ValidationResult = { ok, violations, skipped };
  if (ok) result.topoOrder = topoSort(ordered, prereqOf, graph.ordinalOf);
  return result;
}

function ref(subject: string, field: string, target: string, message: string): Violation {
  return { rule: "dangling-ref", severity: "error", subject, field, target, message };
}

/** 以 Kahn 偵測無法線性化的節點（構成環者）。忽略自我依賴（已單獨回報）與懸空前置。 */
function detectCycle(
  ordered: ConceptNode[],
  prereqOf: Map<string, string[]>,
  concepts: Map<string, ConceptNode>,
  selfDep: Set<string>,
): string[] {
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  for (const c of ordered) {
    indegree.set(c.id, indegree.get(c.id) ?? 0);
    for (const p of prereqOf.get(c.id)!) {
      if (p === c.id || !concepts.has(p)) continue; // 跳過自環與懸空
      adj.set(p, [...(adj.get(p) ?? []), c.id]);
      indegree.set(c.id, (indegree.get(c.id) ?? 0) + 1);
    }
  }
  const queue = ordered.filter((c) => (indegree.get(c.id) ?? 0) === 0).map((c) => c.id);
  const removed = new Set<string>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    removed.add(id);
    for (const nb of adj.get(id) ?? []) {
      indegree.set(nb, (indegree.get(nb) ?? 0) - 1);
      if ((indegree.get(nb) ?? 0) === 0) queue.push(nb);
    }
  }
  // selfDep 節點本身可能被 removed（若無其他入邊），不列為 cycle
  return ordered.filter((c) => !removed.has(c.id) && !selfDep.has(c.id)).map((c) => c.id);
}

/** canonical 拓樸序：Kahn，候選以 ordinal tie-break（FR-011）。 */
function topoSort(
  ordered: ConceptNode[],
  prereqOf: Map<string, string[]>,
  ordinalOf: Map<string, Ordinal>,
): string[] {
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const idSet = new Set(ordered.map((c) => c.id));
  for (const c of ordered) {
    indegree.set(c.id, indegree.get(c.id) ?? 0);
    for (const p of prereqOf.get(c.id)!) {
      if (p === c.id || !idSet.has(p)) continue;
      adj.set(p, [...(adj.get(p) ?? []), c.id]);
      indegree.set(c.id, (indegree.get(c.id) ?? 0) + 1);
    }
  }
  const order: string[] = [];
  const available = new Set(ordered.filter((c) => (indegree.get(c.id) ?? 0) === 0).map((c) => c.id));
  while (available.size > 0) {
    // 取 ordinal 最小者（ordered 已按 ordinal 排序）
    const nextId = ordered.find((c) => available.has(c.id))!.id;
    available.delete(nextId);
    order.push(nextId);
    for (const nb of adj.get(nextId) ?? []) {
      indegree.set(nb, (indegree.get(nb) ?? 0) - 1);
      if ((indegree.get(nb) ?? 0) === 0) available.add(nb);
    }
  }
  return order;
}
