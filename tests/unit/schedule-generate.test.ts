import { describe, expect, it } from "vitest";
import { generateAllSchedules, serializeSchedule, TRACKS } from "../../src/compiler/schedule-generator.js";
import { loadRealGenerateInput } from "../helpers/schedule.js";

describe("generateAllSchedules determinism（US1 / SC-001）", () => {
  it("同一 input 連續呼叫兩次，序列化字串完全相同", () => {
    const input = loadRealGenerateInput();
    const r1 = generateAllSchedules(input);
    const r2 = generateAllSchedules(input);
    for (const track of TRACKS) {
      expect(serializeSchedule(r2.schedules[track])).toBe(serializeSchedule(r1.schedules[track]));
    }
    expect(JSON.stringify(r2.violations)).toBe(JSON.stringify(r1.violations));
  });

  it("重複 100 次生成，輸出逐字元一致（determinism，無 Date/Math.random 依賴）", () => {
    const input = loadRealGenerateInput();
    const baseline = TRACKS.map((t) => serializeSchedule(generateAllSchedules(input).schedules[t]));
    for (let i = 0; i < 100; i++) {
      const result = TRACKS.map((t) => serializeSchedule(generateAllSchedules(input).schedules[t]));
      expect(result).toEqual(baseline);
    }
  });
});

describe("serializeSchedule canonical 序列化（US1 / R2）", () => {
  it("欄位序固定、2-space 縮排、檔尾 \\n、無 CRLF", () => {
    const input = loadRealGenerateInput();
    const { schedules } = generateAllSchedules(input);
    const text = serializeSchedule(schedules.foundation);
    expect(text.endsWith("\n")).toBe(true);
    expect(text).not.toMatch(/\r/);
    const parsed = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual(["track", "targetLevel", "sessions"]);
  });

  it("空 problemIds / 缺省 optional 欄位省略而非輸出 null 或 []", () => {
    const input = loadRealGenerateInput();
    const { schedules } = generateAllSchedules(input);
    const text = serializeSchedule(schedules.foundation);
    expect(text).not.toMatch(/null/);
    expect(text).not.toMatch(/"problemIds":\s*\[\]/);
  });
});
