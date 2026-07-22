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
  CurriculumSkeleton,
  ModuleNode,
  Ordinal,
  TopicNode,
  ValidateOptions,
  ValidationResult,
  Violation,
} from "../types/curriculum.js";

const SENTINEL = Number.MAX_SAFE_INTEGER;

/**
 * 由骨架推導單一 Concept 的確定性全序 ordinal（R7）。載入建圖與測試輔助共用唯一實作，
 * 避免兩處手抄同一套 moduleIndex/topicIndex/sentinel 規則而悄悄分歧（SC-007）。
 * 懸空 module / topic 以 SENTINEL 排在最後，交由 validateCurriculum 判 dangling-ref。
 */
export function computeOrdinal(
  node: { id: string; module: string; topic: string; localOrder: number },
  modules: ModuleNode[],
  topics: Map<string, TopicNode>,
): Ordinal {
  const moduleIndex = modules.findIndex((m) => m.id === node.module);
  const topicNode = topics.get(node.topic);
  return {
    moduleIndex: moduleIndex >= 0 ? moduleIndex : SENTINEL,
    topicIndex: topicNode ? topicNode.topicIndex : SENTINEL,
    localOrder: node.localOrder,
    id: node.id,
  };
}

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

/**
 * 去除檔首雜訊，讓 frontmatter 的 `---` 落在字串開頭供 gray-matter 解析：
 * BOM、任意數量的前導 HTML 註解、以及其間 / 其後的空白。單一 regex 只能吃掉一個註解，
 * 遇到 BOM、前導空行或連續兩個註解時 frontmatter 會被漏讀而誤報整批 missing-field，故在此正規化。
 */
function stripLeadingComment(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "");
  for (;;) {
    const stripped = s.replace(/^\s*<!--[\s\S]*?-->/, "");
    if (stripped === s) break;
    s = stripped;
  }
  return s.replace(/^\s+/, "");
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
  // 缺檔 / 壞 JSON 時 modulesRaw 為 undefined：已於上方報 skeleton-shape，無需再對 `{}` 跑一次
  // schema（其產出的 missing-field 違規只會被丟棄）。僅在確有解析輸入時才驗證並併入 schema 違規。
  let skeleton: CurriculumSkeleton | undefined;
  if (modulesRaw !== undefined) {
    const parsed = parseModules(modulesRaw);
    skeleton = parsed.skeleton;
    loadViolations.push(...parsed.violations);
  }

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
    ordinalOf.set(node.id, computeOrdinal(node, modules, topics));
  }

  loadViolations.sort(cmpViolation);
  return {
    graph: {
      modules,
      topics,
      concepts,
      ordinalOf,
      conceptsDirMissing,
      conceptFileCount: files.length,
    },
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
    const message = graph.conceptsDirMissing
      ? "concepts 目錄不存在，無法建立課程圖"
      : (graph.conceptFileCount ?? 0) > 0
        ? "concepts 目錄下的 Concept 檔全部未通過 schema 驗證，無有效 Concept（詳見上方 schema 違規）"
        : "concepts 目錄下無任何 Concept（目錄為空）";
    violations.push({
      rule: "empty-curriculum",
      severity: "error",
      subject: "curriculum",
      message,
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

  // 9. 顆粒度 Gate（依 mode，閉區間，FR-019 / FR-021）——僅 Concept 數量語意
  const mode = options.mode ?? "stub";
  checkGranularity(ordered, mode, violations);

  // 10. leetcode 可插拔存在性（FR-023）
  if (options.problemExists) {
    for (const c of ordered) {
      for (const id of c.leetcode) {
        if (!options.problemExists(id)) {
          violations.push({
            rule: "dangling-leetcode",
            severity: "error",
            subject: c.id,
            field: "leetcode",
            target: String(id),
            message: `Concept ${c.id} 的 leetcode 題號不存在於 Problem Bank：${id}`,
          });
        }
      }
    }
  } else {
    skipped.push({
      check: "leetcode-existence",
      reason: "無 Problem Bank，leetcode 題號存在性檢查延後至 F3（deferred-to-F3）",
    });
  }

  violations.sort(cmpViolation);
  const ok = !violations.some((v) => v.severity === "error");
  const result: ValidationResult = { ok, violations, skipped };
  if (ok) result.topoOrder = topoSort(ordered, prereqOf);
  return result;
}

// 顆粒度範圍（閉區間；下限類僅 full 強制，上限任何模式強制，FR-019 / FR-021）
const TOPIC_MIN = 5;
const TOPIC_MAX = 12;
const MODULE_MIN = 10;
const MODULE_MAX = 30;
const TOTAL_MIN = 150;

function checkGranularity(ordered: ConceptNode[], mode: "stub" | "full", violations: Violation[]): void {
  const perTopic = new Map<string, number>();
  const perModule = new Map<string, number>();
  for (const c of ordered) {
    perTopic.set(c.topic, (perTopic.get(c.topic) ?? 0) + 1);
    perModule.set(c.module, (perModule.get(c.module) ?? 0) + 1);
  }
  const range = (subject: string, field: string, n: number, min: number, max: number): void => {
    if (n > max) {
      violations.push(rangeViolation(subject, field, `${field} ${subject} 的 Concept 數（${n}）超過上限 ${max}`));
    } else if (mode === "full" && n < min) {
      violations.push(rangeViolation(subject, field, `${field} ${subject} 的 Concept 數（${n}）低於下限 ${min}`));
    }
  };
  // 只檢查有 Concept 的 Topic / Module（stub 階段空 Module/Topic 不觸發下限，FR-021）
  for (const [topic, n] of perTopic) range(topic, "topic", n, TOPIC_MIN, TOPIC_MAX);
  for (const [module, n] of perModule) range(module, "module", n, MODULE_MIN, MODULE_MAX);
  if (mode === "full" && ordered.length < TOTAL_MIN) {
    violations.push(rangeViolation("curriculum", "total", `Concept 總數（${ordered.length}）低於下限 ${TOTAL_MIN}`));
  }
}

function rangeViolation(subject: string, field: string, message: string): Violation {
  return { rule: "granularity-range", severity: "error", subject, field, message };
}

function ref(subject: string, field: string, target: string, message: string): Violation {
  return { rule: "dangling-ref", severity: "error", subject, field, target, message };
}

/** 附加一條鄰接邊，就地 push 至既有陣列（避免每筆入邊都 spread 重建陣列，O(deg²) → O(deg)）。 */
function addEdge(adj: Map<string, string[]>, from: string, to: string): void {
  const list = adj.get(from);
  if (list) list.push(to);
  else adj.set(from, [to]);
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
      addEdge(adj, p, c.id);
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

/**
 * canonical 拓樸序：Kahn，候選以 ordinal tie-break（FR-011）。
 *
 * 前置條件：僅在 forward-dependency 與 cycle 檢查皆通過後呼叫（validateCurriculum 於 ok 時才呼叫），
 * 故每條邊必由較小 ordinal 指向較大 ordinal。`ordered` 已按 ordinal 排序，因此每個節點被解鎖
 * （indegree 歸零）的時機恰好是走訪指標抵達它時——單向前進的 `cursor` 即可挑出「ordinal 最小的可用節點」，
 * 與原本每步 `ordered.find` 全表掃描的結果逐字元相同，但複雜度由 O(V²) 降為 O(V+E)。
 * `cursor >= length` 的 break 為安全網：僅在前置條件被破壞（非清 DAG）時才可能觸發並回傳部分序。
 */
function topoSort(ordered: ConceptNode[], prereqOf: Map<string, string[]>): string[] {
  const indegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const idSet = new Set(ordered.map((c) => c.id));
  for (const c of ordered) {
    indegree.set(c.id, indegree.get(c.id) ?? 0);
    for (const p of prereqOf.get(c.id)!) {
      if (p === c.id || !idSet.has(p)) continue;
      addEdge(adj, p, c.id);
      indegree.set(c.id, (indegree.get(c.id) ?? 0) + 1);
    }
  }
  const order: string[] = [];
  let cursor = 0;
  while (order.length < ordered.length) {
    // 前進至下一個 indegree 為 0 的節點（清 DAG 上此指標永不回頭，見函式說明）。
    while (cursor < ordered.length && (indegree.get(ordered[cursor]!.id) ?? 0) !== 0) cursor++;
    if (cursor >= ordered.length) break; // 安全網：非清 DAG 才可能發生
    const nextId = ordered[cursor]!.id;
    cursor++;
    order.push(nextId);
    for (const nb of adj.get(nextId) ?? []) {
      indegree.set(nb, (indegree.get(nb) ?? 0) - 1);
    }
  }
  return order;
}
