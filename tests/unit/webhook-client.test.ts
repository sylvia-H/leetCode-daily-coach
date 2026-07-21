import { afterEach, describe, expect, it, vi } from "vitest";
import { createWebhookClient } from "../../src/discord/webhook-client.js";
import type { DiscordEmbed } from "../../src/types/lesson.js";

const SAMPLE_EMBEDS: DiscordEmbed[] = [{ title: "t", description: "d" }];

describe("webhook-client post", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POST 到對應 Track 的 webhook，帶正確的 URL / Content-Type / body", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const client = createWebhookClient({ foundation: "https://discord.com/api/webhooks/1/aaa" });
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

    const client = createWebhookClient({ foundation: "https://discord.com/api/webhooks/1/aaa" });
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
});
