import { loadArticle, moduleColor } from "./content.js";
import { getProblemsForConcept } from "./problem.js";
import { getPathLabels, getSessionPlan } from "./schedule.js";
import type { Lesson, Track } from "../types/lesson.js";

export interface CompileOptions {
  articlePath?: string;
  problemBankPath?: string;
}

// F1 只有一篇教材、一份最小題庫，故路徑為固定預設值；F2/F3 起會依 conceptId 動態解析路徑。
const DEFAULT_ARTICLE_PATH = "articles/two-pointer/002-left-right-pointer.md";
const DEFAULT_PROBLEM_BANK_PATH = "data/problem-bank.json";

// 本 Feature 唯一的 Lesson Compiler（docs/spec.md §7.1）：runtime 與未來 F5 的 CI Gate MUST 呼叫同一顆
// （憲章 IX）。純粹的 (track, sessionIndex) → Lesson 映射，所有欄位皆來自既有凍結內容（憲章 VIII）。
export function compile(track: Track, sessionIndex: number, options: CompileOptions = {}): Lesson {
  const plan = getSessionPlan(track, sessionIndex);
  if (plan.type !== "concept" || !plan.conceptId) {
    throw new Error(`本 Feature 只支援 concept 類型的 Session（sessionIndex=${sessionIndex}）`);
  }

  const articlePath = options.articlePath ?? DEFAULT_ARTICLE_PATH;
  const problemBankPath = options.problemBankPath ?? DEFAULT_PROBLEM_BANK_PATH;

  const article = loadArticle(articlePath, plan.conceptId);
  const problems = getProblemsForConcept(plan.conceptId, problemBankPath);
  const path = getPathLabels(sessionIndex);

  return {
    sessionIndex,
    type: plan.type,
    track,
    concept: {
      id: article.meta.id,
      title: article.meta.title,
      moduleColor: moduleColor(article.meta.module),
      digest: article.digest,
      tsTip: article.tsTip,
      pyTip: article.pyTip,
      takeaway: article.takeaway,
      exitCriteria: article.meta.exitCriteria,
      patternLabel: article.meta.patternLabel,
      complexityLabel: article.meta.complexityLabel,
      estimatedMinutes: article.meta.estimatedMinutes,
      articlePath,
    },
    problems,
    path,
  };
}
