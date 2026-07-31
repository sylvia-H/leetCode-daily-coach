import { describe, expect, it } from "vitest";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";
import { asConcept } from "../helpers/lesson.js";
import { findConceptInAllTracks, sessionIndexOfConcept } from "../helpers/real-schedule.js";

describe("compile（真實素材，US1 MVP）", () => {
  const deps = loadCompilerDeps();
  // MUST NOT 硬編 sessionIndex：三軌節奏不同（rhythm / maxLevel，spec §13.5），同一 index 在不同 Track
  // 早已不是同一課——原本寫死的 4 在 foundation 是 mental-model-variables、在 interviewReady 是
  // tracing-execution-flow。改為先選定 Concept，再逐軌查出它各自的 sessionIndex。
  const sharedConceptId = findConceptInAllTracks(deps, true);

  it("同一 (track, sessionIndex) 連續呼叫產出逐欄位相同的 Lesson（determinism）", () => {
    const a = compile("foundation", 4, deps);
    const b = compile("foundation", 4, deps);
    expect(a).toEqual(b);
  });

  it("只有 track 不同時，concept 教材與 path 完全相同（Track 不決定內容）", () => {
    const ia = sessionIndexOfConcept(deps, "foundation", sharedConceptId);
    const ib = sessionIndexOfConcept(deps, "interviewReady", sharedConceptId);
    const a = asConcept(compile("foundation", ia, deps));
    const b = asConcept(compile("interviewReady", ib, deps));
    // 教材正文三軌共用（憲章 VI）；problems MUST NOT 在此斷言相等——難度帶本就是 Track 分歧的維度
    // 之一（spec §13.5），InterviewMastery 用 Medium+Hard 而另兩軌用 Easy+Medium。
    expect(a.concept).toEqual(b.concept);
    expect(a.path).toEqual(b.path);
    expect(a.track).toBe("foundation");
    expect(b.track).toBe("interviewReady");
  });

  it("組出的 Lesson 含正確的 sessionIndex / type / 題數", () => {
    const idx = sessionIndexOfConcept(deps, "foundation", sharedConceptId);
    const lesson = compile("foundation", idx, deps);
    expect(lesson.sessionIndex).toBe(idx);
    expect(lesson.type).toBe("concept");
    expect(lesson.problems.length).toBeGreaterThanOrEqual(1);
    expect(lesson.problems.length).toBeLessThanOrEqual(3);
  });

  it("sessionIndex 超出課表範圍時拋錯，不回傳半成品", () => {
    expect(() => compile("foundation", 999, deps)).toThrow();
  });

  it("不再依賴 F1 硬編 demo 題號（11/125/167 不應出現在真實素材編譯結果中）", () => {
    const lesson = compile("foundation", 4, deps);
    const ids = lesson.problems.map((p) => p.id);
    expect(ids).not.toContain(11);
    expect(ids).not.toContain(125);
    expect(ids).not.toContain(167);
  });
});
