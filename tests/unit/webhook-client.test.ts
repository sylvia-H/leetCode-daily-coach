import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebhookClient, type WebhookClientOptions } from "../../src/discord/webhook-client.js";
import type { DiscordEmbed } from "../../src/types/lesson.js";

const SAMPLE_EMBEDS: DiscordEmbed[] = [{ title: "t", description: "d" }];

// 測試一律注入 sleep / random：重試的等待時間不該讓測試變慢，jitter 也不該讓斷言變不確定。
function fastOptions(sleeps: number[] = []): WebhookClientOptions {
  return {
    sleep: async (ms: number) => {
      sleeps.push(ms);
    },
    random: () => 0,
  };
}

describe("webhook-client post", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POST 到對應 Track 的 webhook，帶正確的 URL / Content-Type / body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const client = createWebhookClient({ foundation: "https://discord.com/api/webhooks/1/aaa" }, fastOptions());
    await client.post("foundation", SAMPLE_EMBEDS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://discord.com/api/webhooks/1/aaa");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ embeds: SAMPLE_EMBEDS });
  });

  it("回應非 2xx 時拋錯，訊息含 HTTP 狀態碼與 Track 名稱，不含 URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    const client = createWebhookClient({ foundation: "https://discord.com/api/webhooks/1/aaa" }, fastOptions());
    await expect(client.post("foundation", SAMPLE_EMBEDS)).rejects.toThrow(/foundation.*500/);

    try {
      await client.post("foundation", SAMPLE_EMBEDS);
    } catch (err) {
      expect((err as Error).message).not.toMatch(/discord\.com\/api\/webhooks/);
    }
  });

  it("track 沒有對應的 webhook 時拋錯", async () => {
    const client = createWebhookClient({});
    await expect(client.post("foundation", SAMPLE_EMBEDS)).rejects.toThrow(/foundation/);
  });

  it("5xx 之後重試成功 ⇒ 不拋錯，且只重試到成功為止", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const sleeps: number[] = [];
    const client = createWebhookClient({ foundation: "https://x" }, fastOptions(sleeps));
    await client.post("foundation", SAMPLE_EMBEDS);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleeps).toEqual([1000]);
  });

  it("fetch 本身丟出（網路錯誤）亦重試", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("socket hang up"))
      .mockResolvedValueOnce({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const client = createWebhookClient({ foundation: "https://x" }, fastOptions());
    await client.post("foundation", SAMPLE_EMBEDS);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("429 依 Retry-After 標頭決定等待時間", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429, headers: { get: () => "2" } })
      .mockResolvedValueOnce({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const sleeps: number[] = [];
    const client = createWebhookClient({ foundation: "https://x" }, fastOptions(sleeps));
    await client.post("foundation", SAMPLE_EMBEDS);

    expect(sleeps).toEqual([2000]);
  });

  it("4xx（非 429）不重試 ⇒ 只呼叫一次即拋錯", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal("fetch", fetchMock);

    const client = createWebhookClient({ foundation: "https://x" }, fastOptions());
    await expect(client.post("foundation", SAMPLE_EMBEDS)).rejects.toThrow(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("重試次數用盡 ⇒ 拋錯且嘗試次數等於 maxAttempts", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    const client = createWebhookClient({ foundation: "https://x" }, { ...fastOptions(), maxAttempts: 3 });
    await expect(client.post("foundation", SAMPLE_EMBEDS)).rejects.toThrow(/重試 3 次/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
