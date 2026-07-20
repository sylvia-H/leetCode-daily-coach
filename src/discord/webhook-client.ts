import type { DiscordEmbed, Track } from "../types/lesson.js";

export interface WebhookClient {
  post(track: Track, embeds: DiscordEmbed[]): Promise<void>;
}

export function createWebhookClient(webhooks: Partial<Record<Track, string>>): WebhookClient {
  return {
    async post(track, embeds) {
      const url = webhooks[track];
      if (!url) {
        throw new Error(`推播失敗：${track} 沒有設定的 webhook`);
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds }),
      });

      if (!response.ok) {
        throw new Error(`推播失敗：${track} webhook 回應 HTTP ${response.status}`);
      }
    },
  };
}
