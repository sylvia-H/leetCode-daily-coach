import { describe, expect, it } from "vitest";
import { loadConfig, parseBool } from "../../src/config.js";

describe("parseBool", () => {
  it("只有字串 true（不分大小寫、允許前後空白）才為真", () => {
    expect(parseBool("true")).toBe(true);
    expect(parseBool("TRUE")).toBe(true);
    expect(parseBool("  true  ")).toBe(true);
  });

  it("false / 空字串 / undefined 皆為假", () => {
    expect(parseBool("false")).toBe(false);
    expect(parseBool("")).toBe(false);
    expect(parseBool(undefined)).toBe(false);
    expect(parseBool("yes")).toBe(false);
  });
});

describe("loadConfig", () => {
  const baseEnv = {
    DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
    STATE_FILE: ".state/state.json",
  };

  it("三個 webhook 皆空時拋設定錯誤", () => {
    expect(() =>
      loadConfig({
        STATE_FILE: ".state/state.json",
      }),
    ).toThrow(/webhook/);
  });

  it("STATE_FILE 未設定時拋錯", () => {
    expect(() =>
      loadConfig({
        DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
      }),
    ).toThrow(/STATE_FILE/);
  });

  it("已啟用 Track 的順序恆為 foundation → interviewReady → interviewMastery", () => {
    const config = loadConfig({
      DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY: "https://discord.com/api/webhooks/3/ccc",
      DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
      DISCORD_WEBHOOK_URL_INTERVIEW_READY: "https://discord.com/api/webhooks/2/bbb",
      STATE_FILE: ".state/state.json",
    });
    expect(config.enabledTracks).toEqual(["foundation", "interviewReady", "interviewMastery"]);
  });

  it("只設定部分 webhook 時，enabledTracks 只含已設定者", () => {
    const config = loadConfig(baseEnv);
    expect(config.enabledTracks).toEqual(["foundation"]);
    expect(config.webhooks.foundation).toBe(baseEnv.DISCORD_WEBHOOK_URL_FOUNDATION);
  });

  it("只有空白字元的 webhook 視為未設定", () => {
    const config = loadConfig({
      ...baseEnv,
      DISCORD_WEBHOOK_URL_INTERVIEW_READY: "   ",
    });
    expect(config.enabledTracks).toEqual(["foundation"]);
  });

  it("DRY_RUN / FORCE 預設為 false，且採嚴格字串比對", () => {
    const config = loadConfig(baseEnv);
    expect(config.dryRun).toBe(false);
    expect(config.force).toBe(false);

    const configTrue = loadConfig({ ...baseEnv, DRY_RUN: "true", FORCE: "true" });
    expect(configTrue.dryRun).toBe(true);
    expect(configTrue.force).toBe(true);
  });
});
