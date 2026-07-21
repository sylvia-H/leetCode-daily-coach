import { readFileSync } from "node:fs";
import type { Problem } from "../types/lesson.js";

interface ProblemBankFile {
  problems: Problem[];
  conceptProblems: Record<string, number[]>;
}

// 題數 1～3 的唯一權威守門點（FR-003b）：查無對應、對應題號不存在、題數 0 或 >3 皆在此拋出
// 可辨識且指名成因的錯誤。renderer/budget.ts 的 problems.count 僅為 defense-in-depth，
// MUST NOT 另立一套題數錯誤（見 contracts/discord-embed-contract.md §2「題數的責任歸屬」）。
export function getProblemsForConcept(conceptId: string, problemBankPath: string): Problem[] {
  const raw = readFileSync(problemBankPath, "utf-8");
  const bank = JSON.parse(raw) as ProblemBankFile;

  const ids = bank.conceptProblems[conceptId];
  if (!ids || ids.length === 0) {
    throw new Error(`題目資料不一致：找不到 concept「${conceptId}」對應的題目`);
  }
  if (ids.length > 3) {
    throw new Error(`題目資料不一致：concept「${conceptId}」對應題數為 ${ids.length}，超過上限 3 題`);
  }

  const byId = new Map(bank.problems.map((problem) => [problem.id, problem]));
  const problems: Problem[] = [];
  for (const id of ids) {
    const problem = byId.get(id);
    if (!problem) {
      throw new Error(`題目資料不一致：concept「${conceptId}」對應的題號 ${id} 在題庫中不存在`);
    }
    problems.push(problem);
  }

  return problems;
}
