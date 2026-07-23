// 本專案唯一的 Lesson Compiler（docs/spec.md §7.1）：CI Gate 與每日 runtime MUST import 同一個
// compile（憲章 IX）。純函式（除 deps.readArticle 這個明確的讀檔邊界外，無 I/O、無網路、無 LLM）。
import { existsSync, readFileSync } from "node:fs";
import { TRACK_ORDER } from "../config.js";
import { loadCurriculum, validateCurriculum } from "./curriculum.js";
import { type ArticleContent, DEFAULT_MODULE_COLOR, moduleColor, parseArticle } from "./content.js";
import { getOverlayNotes, loadAllOverlays } from "./overlay.js";
import { getProblemsForConcept, loadProblemBank, makeProblemExists } from "./problem.js";
import { getSessionPlan, loadAllSchedules } from "./schedule.js";
import type { ConceptNode, CurriculumGraph, Ordinal } from "../types/curriculum.js";
import type { Lesson, PathLabels, Problem, ReviewConcept, Track } from "../types/lesson.js";
import type { ProblemBank } from "../types/problem.js";
import type { SessionPlan, TrackOverlay, TrackSchedule } from "../types/schedule.js";

/** problemId → 首次引入它的 conceptId（per Track，research R3）。 */
export type ProblemOrigin = Map<number, string>;

export interface CompilerDeps {
  graph: CurriculumGraph;
  bank: ProblemBank;
  schedules: Record<Track, TrackSchedule>;
  overlays: Record<Track, TrackOverlay>;
  readArticle: (path: string) => string;
  articleCache?: Map<string, ArticleContent>;
  problemOrigins: Record<Track, ProblemOrigin>;
  reflectionBank?: unknown;
  encouragement?: unknown;
}

export interface CompilerPaths {
  modulesPath: string;
  conceptsDir: string;
  problemBankPath: string;
  schedulesDir: string;
  overlaysDir: string;
  reflectionBankPath: string;
  encouragementPath: string;
}

const DEFAULT_PATHS: CompilerPaths = {
  modulesPath: "curriculum/modules.json",
  conceptsDir: "concepts",
  problemBankPath: "data/problem-bank.json",
  schedulesDir: "schedules",
  overlaysDir: "overlays",
  reflectionBankPath: "data/reflection-bank.json",
  encouragementPath: "data/encouragement.json",
};

// 沿用 F2 `Ordinal` 的確定性全序比較；F2 未輸出此比較器（同 F4 schedule-generator.ts 的做法），
// 於此複寫一份而非重建課程結構。
function cmpOrdinal(a: Ordinal, b: Ordinal): number {
  return (
    a.moduleIndex - b.moduleIndex ||
    a.topicIndex - b.topicIndex ||
    a.localOrder - b.localOrder ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/** per Track：依 sessionIndex 遞增走訪 concept Session，problemId 首次出現者記錄其 conceptId（R3）。 */
function buildProblemOrigin(schedule: TrackSchedule, graph: CurriculumGraph): ProblemOrigin {
  const origin: ProblemOrigin = new Map();
  const conceptSessions = schedule.sessions
    .filter((s): s is SessionPlan & { conceptId: string } => s.type === "concept" && s.conceptId !== undefined)
    .sort((a, b) => a.sessionIndex - b.sessionIndex);
  for (const session of conceptSessions) {
    const concept = graph.concepts.get(session.conceptId);
    if (!concept) continue; // dangling-concept 已由課表載入的第二道防線攔下，此處僅防禦
    for (const id of concept.leetcode) {
      if (!origin.has(id)) origin.set(id, concept.id);
    }
  }
  return origin;
}

export function loadCompilerDeps(paths: Partial<CompilerPaths> = {}): CompilerDeps {
  const p: CompilerPaths = { ...DEFAULT_PATHS, ...paths };

  const { bank, loadViolations: bankViolations } = loadProblemBank(p.problemBankPath);
  const bankErrors = bankViolations.filter((v) => v.severity === "error");
  if (bankErrors.length > 0) {
    throw new Error(`題庫載入失敗：${bankErrors.map((v) => v.message).join("; ")}`);
  }

  const { graph, loadViolations: curriculumLoadViolations } = loadCurriculum({
    modulesPath: p.modulesPath,
    conceptsDir: p.conceptsDir,
  });
  const curriculumLoadErrors = curriculumLoadViolations.filter((v) => v.severity === "error");
  if (curriculumLoadErrors.length > 0) {
    throw new Error(`Curriculum 載入失敗：${curriculumLoadErrors.map((v) => v.message).join("; ")}`);
  }
  const validation = validateCurriculum(graph, { problemExists: makeProblemExists(bank) });
  if (!validation.ok) {
    const errors = validation.violations.filter((v) => v.severity === "error");
    throw new Error(`Curriculum 驗證失敗：${errors.map((v) => v.message).join("; ")}`);
  }

  const schedules = loadAllSchedules(p.schedulesDir);
  const overlays = loadAllOverlays(p.overlaysDir);

  // 第二道防線（研究 R6 / T051）：Overlay 指向該 Track 未涵蓋的 Concept ⇒ fail loud。
  for (const track of TRACK_ORDER) {
    const scheduledConceptIds = new Set(
      schedules[track].sessions
        .filter((s): s is SessionPlan & { conceptId: string } => s.type === "concept" && s.conceptId !== undefined)
        .map((s) => s.conceptId),
    );
    for (const conceptId of Object.keys(overlays[track].byConcept)) {
      if (!scheduledConceptIds.has(conceptId)) {
        throw new Error(`overlay 指向未涵蓋的 Concept：track=${track}, conceptId=${conceptId}`);
      }
    }
  }

  const problemOrigins = {} as Record<Track, ProblemOrigin>;
  for (const track of TRACK_ORDER) {
    problemOrigins[track] = buildProblemOrigin(schedules[track], graph);
  }

  const deps: CompilerDeps = {
    graph,
    bank,
    schedules,
    overlays,
    readArticle: (path: string) => readFileSync(path, "utf-8"),
    articleCache: new Map(),
    problemOrigins,
  };

  if (existsSync(p.reflectionBankPath)) {
    try {
      deps.reflectionBank = JSON.parse(readFileSync(p.reflectionBankPath, "utf-8"));
    } catch (err) {
      throw new Error(`reflection bank 壞檔：${p.reflectionBankPath}（${(err as Error).message}）`);
    }
  }
  if (existsSync(p.encouragementPath)) {
    try {
      deps.encouragement = JSON.parse(readFileSync(p.encouragementPath, "utf-8"));
    } catch (err) {
      throw new Error(`encouragement 壞檔：${p.encouragementPath}（${(err as Error).message}）`);
    }
  }

  return deps;
}

function readArticleCached(articlePath: string, conceptId: string, deps: CompilerDeps): ArticleContent {
  const cached = deps.articleCache?.get(articlePath);
  if (cached) return cached;
  const raw = deps.readArticle(articlePath);
  const article = parseArticle(raw, conceptId, articlePath);
  deps.articleCache?.set(articlePath, article);
  return article;
}

/** concept 類題目組裝：課表題號 ⊆ Article 條目，缺漏即 fail loud（FR-006，單向包含）。 */
function buildConceptProblems(
  problemIds: number[],
  article: ArticleContent,
  bank: ProblemBank,
  track: Track,
  sessionIndex: number,
): Problem[] {
  return problemIds.map((id) => {
    const meta = bank.byId.get(id);
    if (!meta) {
      throw new Error(`題號不在 Problem Bank：${id}（track=${track}, sessionIndex=${sessionIndex}）`);
    }
    const entry = article.challenge.get(id);
    if (!entry) {
      throw new Error(`課表題號在 Article 條目中缺漏：track=${track}, sessionIndex=${sessionIndex}, 題號=${id}`);
    }
    const problem: Problem = {
      id: meta.id,
      title: meta.title,
      url: meta.url,
      difficulty: meta.difficulty,
      whyThisPattern: entry.whyThisPattern,
    };
    if (entry.hint !== undefined) problem.hint = entry.hint;
    return problem;
  });
}

/**
 * practice / challenge / review 類題目組裝：以 ProblemOrigin 反查引入該題的 Concept Article
 * （research R3）。查無來源（表中無此題號、或反查到 conceptId 但 Article 無該題號條目）皆省略
 * whyThisPattern / hint，**不失敗**（FR-030）——MUST NOT 重新選題。
 */
function buildOriginProblems(problemIds: number[], deps: CompilerDeps, track: Track, sessionIndex: number): Problem[] {
  const origin = deps.problemOrigins[track];
  return problemIds.map((id) => {
    const meta = deps.bank.byId.get(id);
    if (!meta) {
      throw new Error(`題號不在 Problem Bank：${id}（track=${track}, sessionIndex=${sessionIndex}）`);
    }
    const problem: Problem = { id: meta.id, title: meta.title, url: meta.url, difficulty: meta.difficulty };
    const originConceptId = origin.get(id);
    const originConcept = originConceptId ? deps.graph.concepts.get(originConceptId) : undefined;
    if (originConcept) {
      const article = readArticleCached(originConcept.articlePath, originConcept.id, deps);
      const entry = article.challenge.get(id);
      if (entry) {
        problem.whyThisPattern = entry.whyThisPattern;
        if (entry.hint !== undefined) problem.hint = entry.hint;
      }
    }
    return problem;
  });
}

function closestOrdinal(ids: string[], graph: CurriculumGraph, mode: "max" | "min"): string | undefined {
  let best: { id: string; ordinal: Ordinal } | undefined;
  for (const id of ids) {
    const ordinal = graph.ordinalOf.get(id);
    if (!ordinal) {
      throw new Error(`path 推導失敗：參照不存在於 DAG 的 Concept：${id}`);
    }
    if (!best || (mode === "max" ? cmpOrdinal(ordinal, best.ordinal) > 0 : cmpOrdinal(ordinal, best.ordinal) < 0)) {
      best = { id, ordinal };
    }
  }
  return best?.id;
}

/** DAG 推導 prev/current/next：prev = prerequisite 中 ordinalOf 最大者；next = next 中最小者（R4）。 */
function derivePath(node: ConceptNode, graph: CurriculumGraph): PathLabels {
  const prevId = closestOrdinal(node.prerequisite, graph, "max");
  const nextId = closestOrdinal(node.next, graph, "min");
  const path: PathLabels = { current: node.title };
  if (prevId !== undefined) path.prev = graph.concepts.get(prevId)!.title;
  if (nextId !== undefined) path.next = graph.concepts.get(nextId)!.title;
  return path;
}

function compileConcept(track: Track, plan: SessionPlan, deps: CompilerDeps): Lesson {
  const conceptId = plan.conceptId;
  if (!conceptId) {
    throw new Error(`concept Session 缺少 conceptId：track=${track}, sessionIndex=${plan.sessionIndex}`);
  }
  const node = deps.graph.concepts.get(conceptId);
  if (!node) {
    throw new Error(`conceptId 不在 DAG 中：track=${track}, sessionIndex=${plan.sessionIndex}, conceptId=${conceptId}`);
  }

  const article = readArticleCached(node.articlePath, conceptId, deps);
  const problems = buildConceptProblems(plan.problemIds ?? [], article, deps.bank, track, plan.sessionIndex);
  const path = derivePath(node, deps.graph);
  const overlayNotes = getOverlayNotes(deps.overlays[track], conceptId);

  const lesson: Lesson = {
    sessionIndex: plan.sessionIndex,
    type: "concept",
    track,
    color: moduleColor(article.meta.module),
    concept: {
      id: article.meta.id,
      title: article.meta.title,
      digest: article.digest,
      tsTip: article.tsTip,
      pyTip: article.pyTip,
      takeaway: article.takeaway,
      exitCriteria: article.meta.exitCriteria,
      patternLabel: article.meta.patternLabel,
      complexityLabel: article.meta.complexityLabel,
      estimatedMinutes: article.meta.estimatedMinutes,
      articlePath: node.articlePath,
    },
    path,
    problems,
  };
  if (overlayNotes !== undefined && overlayNotes.trim() !== "") {
    lesson.overlayNotes = overlayNotes;
  }
  return lesson;
}

function compilePracticeOrChallenge(track: Track, plan: SessionPlan, deps: CompilerDeps): Lesson {
  const problems = buildOriginProblems(plan.problemIds ?? [], deps, track, plan.sessionIndex);
  return {
    sessionIndex: plan.sessionIndex,
    type: plan.type,
    track,
    color: DEFAULT_MODULE_COLOR,
    problems,
  };
}

function compileReview(track: Track, plan: SessionPlan, deps: CompilerDeps, schedule: TrackSchedule): Lesson {
  const range = plan.reviewRange;
  if (!range) {
    throw new Error(`review Session 缺少 reviewRange：track=${track}, sessionIndex=${plan.sessionIndex}`);
  }
  const [start, end] = range;
  const reviewConcepts: ReviewConcept[] = schedule.sessions
    .filter(
      (s): s is SessionPlan & { conceptId: string } =>
        s.type === "concept" &&
        s.conceptId !== undefined &&
        s.sessionIndex >= start &&
        s.sessionIndex <= end,
    )
    .sort((a, b) => a.sessionIndex - b.sessionIndex)
    .map((s) => {
      const node = deps.graph.concepts.get(s.conceptId);
      if (!node) {
        throw new Error(`review 涵蓋的 conceptId 不在 DAG 中：track=${track}, conceptId=${s.conceptId}`);
      }
      return { id: node.id, title: node.title };
    });

  if (reviewConcepts.length === 0) {
    throw new Error(
      `review Session 的 reviewRange [${start}, ${end}] 內無任何 concept Session：track=${track}, sessionIndex=${plan.sessionIndex}`,
    );
  }

  const problems = buildOriginProblems(plan.problemIds ?? [], deps, track, plan.sessionIndex);
  return {
    sessionIndex: plan.sessionIndex,
    type: "review",
    track,
    color: DEFAULT_MODULE_COLOR,
    problems,
    reviewConcepts,
  };
}

function compileRest(track: Track, plan: SessionPlan): Lesson {
  return {
    sessionIndex: plan.sessionIndex,
    type: "rest",
    track,
    color: DEFAULT_MODULE_COLOR,
    problems: [],
  };
}

export function compile(track: Track, sessionIndex: number, deps: CompilerDeps): Lesson {
  const schedule = deps.schedules[track];
  const plan = getSessionPlan(track, sessionIndex, schedule);

  switch (plan.type) {
    case "concept":
      return compileConcept(track, plan, deps);
    case "practice":
    case "challenge":
      return compilePracticeOrChallenge(track, plan, deps);
    case "review":
      return compileReview(track, plan, deps, schedule);
    case "rest":
      return compileRest(track, plan);
  }
}
