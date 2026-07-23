// 測試輔助：組 GenerateInput 的各項輸入（ProblemBank / TrackParamsFile / Overlay），供 F4 生成器測試
// 在記憶體中組情境。graph 沿用 tests/helpers/curriculum.ts 的 buildGraph（不重寫任何驗證/生成規則）。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadCurriculum } from "../../src/compiler/curriculum.js";
import { loadProblemBank } from "../../src/compiler/problem.js";
import { parseTrackOverlay, parseTrackParamsFile } from "../../src/compiler/schedule-schema.js";
import type { GenerateInput } from "../../src/compiler/schedule-generator.js";
import { TRACK_FILE_NAME } from "../../src/compiler/schedule-generator.js";
import type { ProblemBank, ProblemMeta } from "../../src/types/problem.js";
import type {
  SessionType,
  Track,
} from "../../src/types/lesson.js";
import type {
  TrackOverlay,
  TrackParam,
  TrackParamsFile,
} from "../../src/types/schedule.js";

export const TRACK_IDS: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

export const DEFAULT_RHYTHM: SessionType[] = [
  "concept",
  "concept",
  "practice",
  "review",
  "challenge",
  "concept",
  "rest",
];

/** 由簡化規格建 in-memory ProblemBank（不經 zod，模擬 loadProblemBank 的產物）。 */
export function buildBank(metas: ProblemMeta[]): ProblemBank {
  const byId = new Map<number, ProblemMeta>();
  for (const meta of metas) byId.set(meta.id, meta);
  const byPattern = new Map<string, ProblemMeta[]>();
  const sorted = [...byId.values()].sort((a, b) => a.id - b.id);
  for (const meta of sorted) {
    for (const pattern of meta.patterns) {
      const list = byPattern.get(pattern);
      if (list) list.push(meta);
      else byPattern.set(pattern, [meta]);
    }
  }
  return { byId, byPattern };
}

export function makeProblem(overrides: Partial<ProblemMeta> & { id: number; difficulty: ProblemMeta["difficulty"] }): ProblemMeta {
  return {
    slug: `problem-${overrides.id}`,
    title: `Problem ${overrides.id}`,
    url: `https://leetcode.com/problems/problem-${overrides.id}/`,
    patterns: ["array"],
    ...overrides,
  };
}

export function makeTrackParam(overrides: Partial<TrackParam> = {}): TrackParam {
  return {
    targetLevel: "easy",
    maxLevel: 15,
    problemDifficulties: ["Easy", "Medium", "Hard"],
    challengeDifficulty: "Easy",
    rhythm: DEFAULT_RHYTHM,
    ...overrides,
  };
}

export function makeParamsFile(overrides: Partial<Record<Track, Partial<TrackParam>>> = {}): TrackParamsFile {
  return {
    version: 1,
    tracks: {
      foundation: makeTrackParam(overrides.foundation),
      interviewReady: makeTrackParam(overrides.interviewReady),
      interviewMastery: makeTrackParam(overrides.interviewMastery),
    },
  };
}

export function emptyOverlay(track: Track): TrackOverlay {
  return { track, byConcept: {} };
}

export function makeOverlays(overrides: Partial<Record<Track, TrackOverlay>> = {}): Record<Track, TrackOverlay> {
  return {
    foundation: overrides.foundation ?? emptyOverlay("foundation"),
    interviewReady: overrides.interviewReady ?? emptyOverlay("interviewReady"),
    interviewMastery: overrides.interviewMastery ?? emptyOverlay("interviewMastery"),
  };
}

/** 載入真實 repo stub（F2 5 Concept + F3 seed 題庫 + 本 Feature track-params/overlays）組 GenerateInput（R9）。 */
export function loadRealGenerateInput(): GenerateInput {
  const { graph } = loadCurriculum({
    modulesPath: join(process.cwd(), "curriculum", "modules.json"),
    conceptsDir: join(process.cwd(), "concepts"),
  });
  const { bank } = loadProblemBank(join(process.cwd(), "data", "problem-bank.json"));
  const paramsRaw = JSON.parse(
    readFileSync(join(process.cwd(), "curriculum", "track-params.json"), "utf-8"),
  ) as unknown;
  const modules = graph.modules.map((m) => ({ id: m.id, level: m.level }));
  const { file: params } = parseTrackParamsFile(paramsRaw, modules);
  if (!params) throw new Error("測試輔助：curriculum/track-params.json 未通過 zod 驗證");

  const overlays = {} as Record<Track, TrackOverlay>;
  for (const track of TRACK_IDS) {
    const overlayRaw = JSON.parse(
      readFileSync(join(process.cwd(), "overlays", TRACK_FILE_NAME[track]), "utf-8"),
    ) as unknown;
    const { overlay } = parseTrackOverlay(overlayRaw, track);
    if (!overlay) throw new Error(`測試輔助：overlays/${TRACK_FILE_NAME[track]} 未通過 zod 驗證`);
    overlays[track] = overlay;
  }

  return { graph, bank, params, overlays };
}
