// F8 SC-001 / SC-012 可追溯性驗收（T064，contracts/schedule-revision.md §4 A5/A6）：對三份**真實**
// 課表統計 Challenge 段省略（review-no-problem）的 review Session，確認 100% 落在該週涵蓋 Concept
// 全無題目的情境且皆有具名 warning；problemIds 為空的 practice / challenge Session 數為 0。
import { describe, expect, it } from "vitest";
import { generateAllSchedules } from "../../src/compiler/schedule-generator.js";
import { loadCurriculum } from "../../src/compiler/curriculum.js";
import { loadProblemBank } from "../../src/compiler/problem.js";
import { parseTrackOverlay, parseTrackParamsFile } from "../../src/compiler/schedule-schema.js";
import { TRACK_FILE_NAME } from "../../src/compiler/schedule-generator.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Track } from "../../src/types/lesson.js";
import type { TrackOverlay } from "../../src/types/schedule.js";

const TRACKS: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

function loadRealInput() {
  const { graph } = loadCurriculum({
    modulesPath: join(process.cwd(), "curriculum", "modules.json"),
    conceptsDir: join(process.cwd(), "concepts"),
  });
  const { bank } = loadProblemBank(join(process.cwd(), "data", "problem-bank.json"));
  const paramsRaw = JSON.parse(readFileSync(join(process.cwd(), "curriculum", "track-params.json"), "utf-8")) as unknown;
  const modules = graph.modules.map((m) => ({ id: m.id, level: m.level }));
  const { file: params } = parseTrackParamsFile(paramsRaw, modules);
  if (!params) throw new Error("fixture 失效：curriculum/track-params.json 未通過 zod 驗證");
  const overlays = {} as Record<Track, TrackOverlay>;
  for (const track of TRACKS) {
    const raw = JSON.parse(readFileSync(join(process.cwd(), "overlays", TRACK_FILE_NAME[track]), "utf-8")) as unknown;
    const { overlay } = parseTrackOverlay(raw, track);
    if (!overlay) throw new Error(`fixture 失效：overlays/${TRACK_FILE_NAME[track]} 未通過 zod 驗證`);
    overlays[track] = overlay;
  }
  return { graph, bank, params, overlays };
}

describe("SC-012：三份真實課表中 problemIds 為空的 practice / challenge Session 數為 0", () => {
  const { schedules } = generateAllSchedules(loadRealInput());
  for (const track of TRACKS) {
    it(`${track}：零空槽`, () => {
      const bad = schedules[track].sessions.filter(
        (s) => (s.type === "practice" || s.type === "challenge") && !(s.problemIds && s.problemIds.length > 0),
      );
      expect(bad).toEqual([]);
    });
  }
});

describe("SC-001：Challenge 段省略（review-no-problem）100% 對應「該週涵蓋 Concept 全無題目」，且每筆皆有具名 warning", () => {
  const input = loadRealInput();
  const { schedules, violations } = generateAllSchedules(input);

  for (const track of TRACKS) {
    it(`${track}：每個 review-no-problem 對應的 review Session 之 reviewRange 內全部 concept Session 皆無題`, () => {
      const trackWarnings = violations.filter((v) => v.rule === "review-no-problem" && v.subject.startsWith(`${track}:`));
      const reviewSessions = schedules[track].sessions.filter((s) => s.type === "review");

      for (const warning of trackWarnings) {
        const sessionIndex = Number(warning.subject.split("session-")[1]);
        const review = reviewSessions.find((s) => s.sessionIndex === sessionIndex);
        expect(review, `warning 指向的 review Session #${sessionIndex} 必須存在`).toBeDefined();
        const [start, end] = review!.reviewRange!;
        const weekConcepts = schedules[track].sessions.filter(
          (s) => s.type === "concept" && s.sessionIndex >= start && s.sessionIndex <= end,
        );
        const allEmpty = weekConcepts.every((s) => !(s.problemIds && s.problemIds.length > 0));
        expect(allEmpty, `review #${sessionIndex} 涵蓋的 concept Session 應全數無題目`).toBe(true);
      }

      // 反向：凡是「該週涵蓋的 concept 全無題目」的 review，必有對應 warning（無漏記）。
      for (const review of reviewSessions) {
        const [start, end] = review.reviewRange!;
        const weekConcepts = schedules[track].sessions.filter(
          (s) => s.type === "concept" && s.sessionIndex >= start && s.sessionIndex <= end,
        );
        const allEmpty = weekConcepts.length > 0 && weekConcepts.every((s) => !(s.problemIds && s.problemIds.length > 0));
        const hasWarning = trackWarnings.some((w) => w.subject === `${track}:session-${review.sessionIndex}`);
        if (allEmpty) {
          expect(hasWarning, `review #${review.sessionIndex} 涵蓋 Concept 全無題目卻缺 review-no-problem warning`).toBe(true);
        }
      }
    });
  }

  it("三軌 review-no-problem 筆數符合預期落點（Foundation 4／InterviewReady 3／InterviewMastery 3，docs/spec.md §13.5）", () => {
    const counts = Object.fromEntries(
      TRACKS.map((track) => [track, violations.filter((v) => v.rule === "review-no-problem" && v.subject.startsWith(`${track}:`)).length]),
    );
    expect(counts).toEqual({ foundation: 4, interviewReady: 3, interviewMastery: 3 });
  });
});
