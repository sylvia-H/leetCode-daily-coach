import { describe, expect, it } from "vitest";
import { parseTrackOverlay, parseTrackParamsFile } from "../../src/compiler/schedule-schema.js";
import { makeParamsFile, makeTrackParam } from "../helpers/schedule.js";

const MODULES = Array.from({ length: 16 }, (_, level) => ({ id: `module-${level}`, level }));

describe("parseTrackParamsFile（US1 / SC-008）", () => {
  it("合法樣本通過，回傳三 Track 的 TrackParam", () => {
    const { file, violations } = parseTrackParamsFile(makeParamsFile(), MODULES);
    expect(violations).toEqual([]);
    expect(file?.tracks.foundation.targetLevel).toBe("easy");
    expect(file?.tracks.interviewReady).toBeDefined();
    expect(file?.tracks.interviewMastery).toBeDefined();
  });

  it("缺必填欄位 → schema-missing-field", () => {
    const raw = { version: 1, tracks: { foundation: {}, interviewReady: makeTrackParam(), interviewMastery: makeTrackParam() } };
    const { file, violations } = parseTrackParamsFile(raw, MODULES);
    expect(file).toBeUndefined();
    expect(violations.some((v) => v.rule === "schema-missing-field")).toBe(true);
  });

  it("未知欄位（.strict）→ schema-type", () => {
    const raw = makeParamsFile() as unknown as Record<string, unknown>;
    (raw.tracks as Record<string, unknown>).foundation = {
      ...(raw.tracks as Record<string, Record<string, unknown>>).foundation,
      unknownField: "x",
    };
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "schema-type")).toBe(true);
  });

  it("targetLevel 非法 enum → schema-type", () => {
    const raw = makeParamsFile({ foundation: { targetLevel: "impossible" as never } });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "schema-type")).toBe(true);
  });

  it("maxLevel 超出 modules 範圍 → param-invalid", () => {
    const raw = makeParamsFile({ foundation: { maxLevel: 99 } });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("rhythm 長度非 7 → param-invalid", () => {
    const raw = makeParamsFile({ foundation: { rhythm: ["concept", "review", "rest"] } });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("rhythm 缺 review 或 rest → param-invalid", () => {
    const raw = makeParamsFile({
      foundation: { rhythm: ["concept", "concept", "concept", "concept", "concept", "concept", "concept"] },
    });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("rhythm 不含 concept 槽 → param-invalid（否則涵蓋佇列永不消耗，生成器無限迴圈）", () => {
    const raw = makeParamsFile({
      foundation: { rhythm: ["practice", "practice", "practice", "practice", "practice", "review", "rest"] },
    });
    const { file, violations } = parseTrackParamsFile(raw, MODULES);
    expect(file).toBeUndefined();
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("rhythm 的 practice 槽早於第一個 concept 槽 → param-invalid", () => {
    const raw = makeParamsFile({
      foundation: { rhythm: ["practice", "concept", "concept", "concept", "challenge", "review", "rest"] },
    });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("rhythm 的最後一個 review 早於最後一個 concept → param-invalid（該 concept 永不被複習）", () => {
    const raw = makeParamsFile({
      foundation: { rhythm: ["concept", "concept", "practice", "review", "challenge", "concept", "rest"] },
    });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("problemDifficulties 為空 → param-invalid", () => {
    const raw = makeParamsFile({ foundation: { problemDifficulties: [] } });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("moduleAllowlist 含不存在的 module id → param-invalid", () => {
    const raw = makeParamsFile({ foundation: { moduleAllowlist: ["no-such-module"] } });
    const { violations } = parseTrackParamsFile(raw, MODULES);
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });
});

describe("parseTrackOverlay（US1 / SC-008）", () => {
  it("合法樣本（空 byConcept）通過", () => {
    const { overlay, violations } = parseTrackOverlay({ track: "foundation", byConcept: {} }, "foundation");
    expect(violations).toEqual([]);
    expect(overlay?.track).toBe("foundation");
  });

  it("合法樣本（含 extraProblemIds/extraNotesMarkdown/challengeDifficulty）通過", () => {
    const { overlay, violations } = parseTrackOverlay(
      {
        track: "foundation",
        byConcept: {
          "array-traversal": { extraProblemIds: [1, 2], extraNotesMarkdown: "note", challengeDifficulty: "Easy" },
        },
      },
      "foundation",
    );
    expect(violations).toEqual([]);
    expect(overlay?.byConcept["array-traversal"]?.extraProblemIds).toEqual([1, 2]);
  });

  it("缺 track/byConcept → schema-missing-field", () => {
    const { violations } = parseTrackOverlay({}, "foundation");
    expect(violations.some((v) => v.rule === "schema-missing-field")).toBe(true);
  });

  it("未知欄位（.strict）→ schema-type", () => {
    const { violations } = parseTrackOverlay({ track: "foundation", byConcept: {}, extra: 1 }, "foundation");
    expect(violations.some((v) => v.rule === "schema-type")).toBe(true);
  });

  it("track 與檔名對應 Track 不符 → param-invalid", () => {
    const { violations } = parseTrackOverlay({ track: "interviewReady", byConcept: {} }, "foundation");
    expect(violations.some((v) => v.rule === "param-invalid")).toBe(true);
  });

  it("ConceptOverlay 型別錯（extraProblemIds 非陣列）→ schema-type", () => {
    const { violations } = parseTrackOverlay(
      { track: "foundation", byConcept: { c1: { extraProblemIds: "1" } } },
      "foundation",
    );
    expect(violations.some((v) => v.rule === "schema-type")).toBe(true);
  });

  it("ConceptOverlay challengeDifficulty 非法 enum → schema-type", () => {
    const { violations } = parseTrackOverlay(
      { track: "foundation", byConcept: { c1: { challengeDifficulty: "Impossible" } } },
      "foundation",
    );
    expect(violations.some((v) => v.rule === "schema-type")).toBe(true);
  });
});
