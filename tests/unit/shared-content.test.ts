import { describe, expect, it } from "vitest";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";
import { TRACK_ORDER } from "../../src/config.js";

describe("compile — 三軌共用同一份教材正文（US5、SC-005、憲章 VI）", () => {
  const deps = loadCompilerDeps();

  it("同一 conceptId 於三個 Track 編譯，concept 的教材欄位全等", () => {
    const foundation = compile("foundation", 4, deps);
    const interviewReady = compile("interviewReady", 4, deps);
    const interviewMastery = compile("interviewMastery", 4, deps);

    for (const other of [interviewReady, interviewMastery]) {
      expect(other.concept?.digest).toBe(foundation.concept?.digest);
      expect(other.concept?.tsTip).toBe(foundation.concept?.tsTip);
      expect(other.concept?.pyTip).toBe(foundation.concept?.pyTip);
      expect(other.concept?.takeaway).toBe(foundation.concept?.takeaway);
      expect(other.concept?.exitCriteria).toEqual(foundation.concept?.exitCriteria);
    }
  });

  it("逐 Track 逐 Session：Lesson.problems 的題號序完全等於課表 problemIds", () => {
    for (const track of TRACK_ORDER) {
      for (const session of deps.schedules[track].sessions) {
        const lesson = compile(track, session.sessionIndex, deps);
        expect(lesson.problems.map((p) => p.id)).toEqual(session.problemIds ?? []);
      }
    }
  });

  it("foundation 的 overlayNotes 有值（來自 Overlay）而 interviewReady 無，且兩軌 Digest 一字未動", () => {
    const foundation = compile("foundation", 4, deps);
    const interviewReady = compile("interviewReady", 4, deps);
    expect(foundation.overlayNotes).toBeDefined();
    expect(interviewReady.overlayNotes).toBeUndefined();
    expect(foundation.concept?.digest).toBe(interviewReady.concept?.digest);
  });
});
