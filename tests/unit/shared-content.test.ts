import { describe, expect, it } from "vitest";
import { compile, loadCompilerDeps } from "../../src/compiler/lesson.js";
import { TRACK_ORDER } from "../../src/config.js";
import { asConcept } from "../helpers/lesson.js";
import { findConceptInAllTracks, sessionIndexOfConcept } from "../helpers/real-schedule.js";

describe("compile — 三軌共用同一份教材正文（US5、SC-005、憲章 VI）", () => {
  const deps = loadCompilerDeps();
  // MUST NOT 硬編 sessionIndex：三軌 rhythm / maxLevel 不同（spec §13.5），同一 index 早已不是同一課。
  const sharedConceptId = findConceptInAllTracks(deps);
  const indexOf = (track: (typeof TRACK_ORDER)[number]) => sessionIndexOfConcept(deps, track, sharedConceptId);

  it("同一 conceptId 於三個 Track 編譯，concept 的教材欄位全等", () => {
    const foundation = asConcept(compile("foundation", indexOf("foundation"), deps));
    const interviewReady = asConcept(compile("interviewReady", indexOf("interviewReady"), deps));
    const interviewMastery = asConcept(compile("interviewMastery", indexOf("interviewMastery"), deps));

    expect(foundation.concept.id).toBe(sharedConceptId);
    for (const other of [interviewReady, interviewMastery]) {
      expect(other.concept.id).toBe(sharedConceptId);
      expect(other.concept.digest).toBe(foundation.concept.digest);
      expect(other.concept.tsTip).toBe(foundation.concept.tsTip);
      expect(other.concept.pyTip).toBe(foundation.concept.pyTip);
      expect(other.concept.takeaway).toBe(foundation.concept.takeaway);
      expect(other.concept.exitCriteria).toEqual(foundation.concept.exitCriteria);
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

  // 本測試原本斷言「foundation 的 overlayNotes 有值」，那是 F1 / F5 種子 Overlay 帶 extraNotesMarkdown
  // 時代的假設。F7 正式產線生成的三份 Overlay **皆無任何 extraNotesMarkdown**，故該斷言在真實素材下
  // 恆不可能成立。**MUST NOT 為了讓它變綠而去改 overlays/ 生成物**（憲章 XIII：生成物不得手改）。
  //
  // 「Overlay 疊加不取代」的機制本身已由 tests/unit/overlay-apply.test.ts 以合成 Overlay 完整覆蓋
  // （5 項），本檔不重複；此處改守真實素材下**現在**該成立的不變式：無 Overlay 內容時
  // overlayNotes MUST 省略（而非空字串），且三軌 Digest 逐字相同。
  it("真實 Overlay 無 extraNotesMarkdown 時 overlayNotes 省略而非空字串，且三軌 Digest 一字未動", () => {
    const lessons = TRACK_ORDER.map((track) => asConcept(compile(track, indexOf(track), deps)));
    for (const lesson of lessons) {
      expect(lesson.overlayNotes).toBeUndefined();
      expect(lesson.overlayNotes).not.toBe("");
    }
    const digests = new Set(lessons.map((l) => l.concept.digest));
    expect(digests.size).toBe(1);
  });
});
