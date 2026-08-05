// FR-017／workflow-integration.md §4.2：發送邊界——依 TRACK_ORDER 選第一個已設定的 webhook；
// 三個皆未設定或發送失敗皆 exit 0（不影響 push job）。
import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyPagesFailure } from "../../scripts/notify-pages-failure.js";
import { renderPagesFailureNotice } from "../../src/renderer/alert.js";
import { createFetchRecorder } from "../helpers/fetch-recorder.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("notifyPagesFailure（FR-017）", () => {
  it("依 TRACK_ORDER 選出第一個已設定的 webhook 發送", async () => {
    const recorder = createFetchRecorder();
    recorder.install();
    const env = {
      DISCORD_WEBHOOK_URL_INTERVIEW_READY: "https://discord.com/api/webhooks/2/token",
      DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY: "https://discord.com/api/webhooks/3/token",
    };
    await notifyPagesFailure(env);
    expect(recorder.requests).toHaveLength(1);
    expect(recorder.requests[0]?.url).toBe("https://discord.com/api/webhooks/2/token");
  });

  it("foundation 已設定時優先選 foundation（TRACK_ORDER 順序）", async () => {
    const recorder = createFetchRecorder();
    recorder.install();
    const env = {
      DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/token",
      DISCORD_WEBHOOK_URL_INTERVIEW_READY: "https://discord.com/api/webhooks/2/token",
    };
    await notifyPagesFailure(env);
    expect(recorder.requests[0]?.url).toBe("https://discord.com/api/webhooks/1/token");
  });

  it("發送 body 為 { embeds: renderPagesFailureNotice() }", async () => {
    const recorder = createFetchRecorder();
    recorder.install();
    const env = { DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/token" };
    await notifyPagesFailure(env);
    expect(recorder.requests[0]?.embeds).toEqual(renderPagesFailureNotice());
  });

  it("三個 webhook 皆未設定時不發任何請求，且不拋出", async () => {
    const recorder = createFetchRecorder();
    recorder.install();
    await expect(notifyPagesFailure({})).resolves.toBeUndefined();
    expect(recorder.requests).toHaveLength(0);
  });

  it("fetch 拋錯時被 try/catch 吞下，不拋出至呼叫端", async () => {
    const recorder = createFetchRecorder();
    recorder.install();
    const env = { DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/token" };
    recorder.failFor("https://discord.com/api/webhooks/1/token");
    await expect(notifyPagesFailure(env)).resolves.toBeUndefined();
  });

  it("webhook 回應非 2xx 時同樣被吞下，不拋出至呼叫端", async () => {
    const recorder = createFetchRecorder();
    recorder.install();
    const env = { DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/token" };
    recorder.failFor("https://discord.com/api/webhooks/1/token", 500);
    await expect(notifyPagesFailure(env)).resolves.toBeUndefined();
  });
});
