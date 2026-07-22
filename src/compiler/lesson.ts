import { loadArticle, moduleColor } from "./content.js";
import { getProblemsForConcept, loadProblemBank } from "./problem.js";
import { getPathLabels, getSessionPlan } from "./schedule.js";
import type { Lesson, Problem, Track } from "../types/lesson.js";

export interface CompileOptions {
  articlePath?: string;
  problemBankPath?: string;
}

// F1 只有一篇教材、一份最小題庫，故路徑為固定預設值；F2/F3 起會依 conceptId 動態解析路徑。
const DEFAULT_ARTICLE_PATH = "articles/two-pointer/002-left-right-pointer.md";
const DEFAULT_PROBLEM_BANK_PATH = "data/problem-bank.json";

// F1 walking-skeleton 的 demo 題號：left-right-pointer 不在 F2 DAG 中，故不透過 Concept.leetcode
// 取得題號，而是沿用 F1 原有的固定三題（R1）。F5/F7 起改由 Concept.leetcode 提供並套用 Overlay。
const DEMO_LEETCODE_IDS = [167, 125, 11];

// F1-local why/hint 常數表（demo 三題）。此為 Lesson 組裝內容、非題庫欄位（不違 FR-004）；
// F5/F7 起由 Overlay 取代（R1）。
const DEMO_PROBLEM_CONTENT: Record<number, { whyThisPattern: string; hint?: string }> = {
  167: {
    whyThisPattern: "陣列已排序，兩數之和的經典應用——直接用左右指標，不需要額外的雜湊表。",
    hint: "想想總和與 target 的大小關係，該移動哪一個指標？",
  },
  125: {
    whyThisPattern: "字串視為字元陣列，左右指標同時往中間夾，檢查兩端字元是否對稱。",
    hint: "先想清楚哪些字元要忽略（非英數字），大小寫要怎麼處理？",
  },
  11: {
    whyThisPattern: "左右指標往中間移動時，每次移動較短的那一側，才能保證不漏掉更大的面積。",
    hint: "面積 = 較短邊 × 寬度，怎麼移動指標才不會漏掉更大的解？",
  },
};

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

  const { bank, loadViolations } = loadProblemBank(problemBankPath);
  const bankErrors = loadViolations.filter((v) => v.severity === "error");
  if (bankErrors.length > 0) {
    throw new Error(`題庫載入失敗：${bankErrors.map((v) => v.message).join("; ")}`);
  }
  const problemMetas = getProblemsForConcept(plan.conceptId, DEMO_LEETCODE_IDS, bank);
  const problems: Problem[] = problemMetas.map((meta) => {
    const content = DEMO_PROBLEM_CONTENT[meta.id];
    return {
      id: meta.id,
      title: meta.title,
      url: meta.url,
      difficulty: meta.difficulty,
      whyThisPattern: content?.whyThisPattern ?? "",
      hint: content?.hint,
    };
  });

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
