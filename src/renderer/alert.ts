import type { DiscordEmbed, Track } from "../types/lesson.js";

const ALERT_COLOR = 15158332;

export function renderAlert(track: Track | null, reason: string): DiscordEmbed[] {
  const label = track ?? "全域";
  return [
    {
      title: `⚠️ 推播失敗 · ${label}`,
      description: reason,
      color: ALERT_COLOR,
    },
  ];
}
