// 測試專用：建構合成 CompilerDeps（DAG / 課表 / Overlay / readArticle），供各 Story 的單元測試共用，
// 不需依賴真實 concepts/ 與 articles/（T012）。
import { checkOverlayCoverage, type CompilerDeps, type ProblemOrigin } from "../../src/compiler/lesson.js";
import type { EncouragementPool, ReflectionBank } from "../../src/compiler/material.js";
import type { ConceptNode, CurriculumGraph, ModuleNode, Ordinal, TopicNode } from "../../src/types/curriculum.js";
import type { Track } from "../../src/types/lesson.js";
import type { ProblemBank, ProblemMeta } from "../../src/types/problem.js";
import type { SessionPlan, TrackOverlay, TrackSchedule } from "../../src/types/schedule.js";

const TRACKS: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

export interface TestConcept {
  id: string;
  title?: string;
  module?: string;
  topic?: string;
  localOrder?: number;
  prerequisite?: string[];
  next?: string[];
  leetcode?: number[];
  difficulty?: "easy" | "medium";
  patternLabel?: string;
  complexityLabel?: string;
  estimatedMinutes?: number;
  articlePath?: string;
}

export function makeGraph(concepts: TestConcept[]): CurriculumGraph {
  const modules: ModuleNode[] = [
    { id: "test-module", title: "Test Module", level: 0, topics: [{ id: "test-topic", title: "Test Topic" }], moduleIndex: 0 },
  ];
  const topics = new Map<string, TopicNode>([
    ["test-topic", { id: "test-topic", title: "Test Topic", moduleId: "test-module", topicIndex: 0 }],
  ]);

  const conceptMap = new Map<string, ConceptNode>();
  concepts.forEach((c, i) => {
    const localOrder = c.localOrder ?? i + 1;
    const nnn = String(localOrder).padStart(3, "0");
    const node: ConceptNode = {
      id: c.id,
      title: c.title ?? c.id,
      module: c.module ?? "test-module",
      topic: c.topic ?? "test-topic",
      difficulty: c.difficulty ?? "easy",
      estimatedMinutes: c.estimatedMinutes ?? 10,
      patternLabel: c.patternLabel ?? "Pattern",
      complexityLabel: c.complexityLabel ?? "O(n)",
      prerequisite: c.prerequisite ?? [],
      next: c.next ?? [],
      learningGoal: ["goal"],
      exitCriteria: ["exit"],
      leetcode: c.leetcode ?? [],
      tags: [],
      localOrder,
      skeletonPath: `concepts/test-topic/${nnn}-${c.id}.md`,
      articlePath: c.articlePath ?? `articles/test-topic/${nnn}-${c.id}.md`,
      dirName: "test-topic",
    };
    conceptMap.set(c.id, node);
  });

  const ordinalOf = new Map<string, Ordinal>();
  for (const node of conceptMap.values()) {
    ordinalOf.set(node.id, { moduleIndex: 0, topicIndex: 0, localOrder: node.localOrder, id: node.id });
  }

  return { modules, topics, concepts: conceptMap, ordinalOf };
}

export function makeProblem(overrides: Partial<ProblemMeta> & { id: number }): ProblemMeta {
  return {
    slug: `problem-${overrides.id}`,
    title: `Problem ${overrides.id}`,
    url: `https://leetcode.com/problems/problem-${overrides.id}/`,
    difficulty: "Easy",
    patterns: ["test-topic"],
    ...overrides,
  };
}

export function makeBank(problems: ProblemMeta[]): ProblemBank {
  const byId = new Map(problems.map((p) => [p.id, p]));
  const byPattern = new Map<string, ProblemMeta[]>();
  for (const p of [...problems].sort((a, b) => a.id - b.id)) {
    for (const pattern of p.patterns) {
      const list = byPattern.get(pattern);
      if (list) list.push(p);
      else byPattern.set(pattern, [p]);
    }
  }
  return { byId, byPattern };
}

export function makeSchedule(track: Track, sessions: SessionPlan[]): TrackSchedule {
  return { track, targetLevel: "easy", sessions };
}

export function makeOverlay(track: Track, byConcept: TrackOverlay["byConcept"] = {}): TrackOverlay {
  return { track, byConcept };
}

export interface ChallengeEntryInput {
  id: number;
  why: string;
  hint?: string;
}

// 建構符合 contracts/article-format.md 的最小可編譯 Full Article 原始 markdown。
export function makeArticleMarkdown(input: {
  id: string;
  title?: string;
  module?: string;
  patternLabel?: string;
  complexityLabel?: string;
  estimatedMinutes?: number;
  exitCriteria?: string[];
  digest?: string;
  tsTip?: string;
  pyTip?: string;
  takeaway?: string;
  challenge?: ChallengeEntryInput[];
}): string {
  const exitCriteria = input.exitCriteria ?? ["條件一", "條件二"];
  const challenge = input.challenge ?? [];
  const challengeMd =
    challenge.length > 0
      ? challenge
          .map((c) => {
            const hintLine = c.hint ? `\n  - Hint: ${c.hint}` : "";
            return `- **${c.id}** · ${c.why}${hintLine}`;
          })
          .join("\n")
      : "- **1** · 佔位條目（本篇未涵蓋任何課表題號）";

  return `---
id: ${input.id}
title: ${input.title ?? input.id}
module: ${input.module ?? "test-module"}
topic: test-topic
pattern_label: ${input.patternLabel ?? "Pattern"}
complexity_label: ${input.complexityLabel ?? "O(n)"}
estimated_minutes: ${input.estimatedMinutes ?? 10}
exit_criteria:
${exitCriteria.map((c) => `  - ${c}`).join("\n")}
---

## Concept

測試用內容。

## Thinking

測試用內容。

## Pattern Recognition

測試用內容。

## Common Mistakes

測試用內容。

## Complexity

測試用內容。

## Digest

${input.digest ?? "Digest 內容"}

## TypeScript Tip

${input.tsTip ?? "ts tip"}

## Python Tip

${input.pyTip ?? "py tip"}

## TypeScript Corner

測試用內容。

## Python Corner

測試用內容。

## Takeaway

${input.takeaway ?? "一句話帶走"}

## Tomorrow Preview

測試用內容。

## Today's Challenge

${challengeMd}
`;
}

function buildProblemOrigin(schedule: TrackSchedule, graph: CurriculumGraph): ProblemOrigin {
  const origin: ProblemOrigin = new Map();
  const conceptSessions = schedule.sessions
    .filter((s): s is SessionPlan & { conceptId: string } => s.type === "concept" && s.conceptId !== undefined)
    .sort((a, b) => a.sessionIndex - b.sessionIndex);
  for (const session of conceptSessions) {
    const concept = graph.concepts.get(session.conceptId);
    if (!concept) continue;
    for (const id of concept.leetcode) {
      if (!origin.has(id)) origin.set(id, concept.id);
    }
  }
  return origin;
}

export interface TestDepsInput {
  concepts: TestConcept[];
  problems?: ProblemMeta[];
  schedules: Partial<Record<Track, SessionPlan[]>>;
  overlays?: Partial<Record<Track, TrackOverlay["byConcept"]>>;
  /** articlePath → raw markdown（未提供者呼叫 readArticle 時拋錯，模擬檔案不存在）。 */
  articles: Record<string, string>;
  /** F8 素材；未提供則 deps.reflectionBank / deps.encouragement 缺席（同真實載入層的缺席語意）。 */
  reflectionBank?: ReflectionBank;
  encouragement?: EncouragementPool;
}

export function makeCompilerDeps(input: TestDepsInput): CompilerDeps {
  const graph = makeGraph(input.concepts);
  const bank = makeBank(input.problems ?? []);

  const schedules = {} as Record<Track, TrackSchedule>;
  const overlays = {} as Record<Track, TrackOverlay>;
  const problemOrigins = {} as Record<Track, ProblemOrigin>;

  for (const track of TRACKS) {
    schedules[track] = makeSchedule(track, input.schedules[track] ?? []);
    overlays[track] = makeOverlay(track, input.overlays?.[track] ?? {});
    problemOrigins[track] = buildProblemOrigin(schedules[track], graph);
  }

  checkOverlayCoverage(schedules, overlays);

  const deps: CompilerDeps = {
    graph,
    bank,
    schedules,
    overlays,
    readArticle: (path: string) => {
      const raw = input.articles[path];
      if (raw === undefined) {
        throw new Error(`測試輔助函式：找不到路徑對應的 article 內容：${path}`);
      }
      return raw;
    },
    articleCache: new Map(),
    problemOrigins,
  };
  if (input.reflectionBank !== undefined) deps.reflectionBank = input.reflectionBank;
  if (input.encouragement !== undefined) deps.encouragement = input.encouragement;
  return deps;
}
