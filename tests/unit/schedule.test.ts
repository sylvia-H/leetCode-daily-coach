import { describe, expect, it } from "vitest";
import { getSessionPlan, loadAllSchedules, loadTrackSchedule } from "../../src/compiler/schedule.js";
import type { TrackSchedule } from "../../src/types/schedule.js";

describe("loadTrackSchedule / loadAllSchedules", () => {
  it("讀取真實 schedules/foundation.json 並保留 sessions 內容", () => {
    const schedule = loadTrackSchedule("foundation", "schedules");
    expect(schedule.track).toBe("foundation");
    expect(schedule.sessions.length).toBeGreaterThan(0);
  });

  it("loadAllSchedules 回傳三個 Track 各自的課表", () => {
    const schedules = loadAllSchedules("schedules");
    expect(schedules.foundation.track).toBe("foundation");
    expect(schedules.interviewReady.track).toBe("interviewReady");
    expect(schedules.interviewMastery.track).toBe("interviewMastery");
  });

  it("課表檔不存在時拋出可辨識的錯誤", () => {
    expect(() => loadTrackSchedule("foundation", "tests/fixtures/does-not-exist")).toThrow(/課表載入失敗/);
  });
});

describe("getSessionPlan", () => {
  const schedule: TrackSchedule = {
    track: "foundation",
    targetLevel: "easy",
    sessions: [
      { sessionIndex: 1, type: "concept", conceptId: "a" },
      { sessionIndex: 2, type: "concept", conceptId: "b" },
      { sessionIndex: 3, type: "rest" },
    ],
  };

  it("依 sessionIndex 找到對應的 SessionPlan", () => {
    expect(getSessionPlan("foundation", 1, schedule).conceptId).toBe("a");
    expect(getSessionPlan("foundation", 3, schedule).type).toBe("rest");
  });

  it("sessionIndex 超出課表長度時拋出含 track / sessionIndex / 課表長度的錯誤", () => {
    expect(() => getSessionPlan("foundation", 4, schedule)).toThrow(/foundation/);
    expect(() => getSessionPlan("foundation", 4, schedule)).toThrow(/sessionIndex=4/);
    expect(() => getSessionPlan("foundation", 4, schedule)).toThrow(/課表長度=3/);
  });

  it("sessionIndex 為 0 / 負數 / 非整數時同樣拋出可辨識的錯誤", () => {
    expect(() => getSessionPlan("foundation", 0, schedule)).toThrow();
    expect(() => getSessionPlan("foundation", -1, schedule)).toThrow();
    expect(() => getSessionPlan("foundation", 1.5, schedule)).toThrow();
  });
});
