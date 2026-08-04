// F8 SC-005 / A4（contracts/schedule-revision.md §4）：課表重跑（移除 rest 槽、跳過無題槽、
// review 選題）MUST NOT 改變任一 Track 涵蓋的 Concept 集合與引入順序。
//
// 比對基準固定為 F7 併入 develop 的 merge commit db3f594（spec SC-005 明訂）。因 CI 的
// actions/checkout 預設 fetch-depth=1，測試執行時未必能 `git show db3f594:...`（淺層 clone
// 不含該歷史 commit），故基準以「一次性腳本輸出」的形式固化為本檔旁的 fixture（而非測試期動態
// 讀 git 歷史）——fixture 內容即 `git show db3f594:schedules/{track}.json` 的
// `sessions.filter(type === "concept").map(conceptId)`，quickstart.md §2.2 記錄了重製步驟。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TrackSchedule } from "../../src/types/schedule.js";

const FIXTURE_PATH = join(process.cwd(), "tests", "fixtures", "f7-concept-order.json");
const f7ConceptOrder = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8")) as Record<string, string[]>;

const SCHEDULE_FILES: Record<string, string> = {
  foundation: "foundation.json",
  "interview-ready": "interview-ready.json",
  "interview-mastery": "interview-mastery.json",
};

function conceptOrderOf(schedule: TrackSchedule): string[] {
  return schedule.sessions.filter((s) => s.type === "concept").map((s) => s.conceptId!);
}

describe("課表重跑後 Concept 集合與引入順序不變（SC-005 / A4）", () => {
  for (const [key, filename] of Object.entries(SCHEDULE_FILES)) {
    it(`${key}：新課表的 concept Session 序列與 F7 基準（db3f594）100% 相同`, () => {
      const raw = JSON.parse(readFileSync(join(process.cwd(), "schedules", filename), "utf-8")) as TrackSchedule;
      expect(conceptOrderOf(raw)).toEqual(f7ConceptOrder[key]);
    });
  }
});
