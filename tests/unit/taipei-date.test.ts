import { describe, expect, it } from "vitest";
import { toTaipeiDateString } from "../../src/util/taipei-date.js";

describe("toTaipeiDateString", () => {
  it("UTC 23:59:59（台北時間）仍屬同一日", () => {
    expect(toTaipeiDateString(new Date("2026-07-19T15:59:59Z"))).toBe("2026-07-19");
  });

  it("跨日翻轉點：UTC 16:00:00 對應台北次日 00:00:00", () => {
    expect(toTaipeiDateString(new Date("2026-07-19T16:00:00Z"))).toBe("2026-07-20");
  });

  it("每日 cron 的 22:07Z 對應台北次日（排程情境）", () => {
    expect(toTaipeiDateString(new Date("2026-07-19T22:07:00Z"))).toBe("2026-07-20");
  });

  it("每日 cron 的 22:37Z（補跑）同樣對應台北次日", () => {
    expect(toTaipeiDateString(new Date("2026-07-19T22:37:00Z"))).toBe("2026-07-20");
  });

  it("是純函式，不讀系統時鐘（相同輸入恆得相同輸出）", () => {
    const date = new Date("2026-01-01T00:00:00Z");
    expect(toTaipeiDateString(date)).toBe(toTaipeiDateString(date));
  });
});
