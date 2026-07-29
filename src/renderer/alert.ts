import type { DiscordEmbed, Track } from "../types/lesson.js";

const ALERT_COLOR = 15158332;
// F6 R3：與紅色告警明確對比的完課通知顏色（0x2ECC71）。
const COMPLETION_COLOR = 3066993;

// F6 FR-019b（notice-contract.md §1.1、憲章 XIV）：Discord webhook URL 樣式遮蔽的唯一出口。
// 底層 fetch/undici 例外訊息可能夾帶完整請求 URL（webhook URL 等同頻道寫入憑證），MUST 為通知實作
// 的內建行為、MUST NOT 依賴呼叫端自律不帶入 URL，也 MUST NOT 依賴特定錯誤來源的訊息格式——故此處
// 直接比對「discord(app)?.com/api/webhooks/<id>/<token>」的 URL 樣式本身，與訊息其餘措辭無關。
const WEBHOOK_URL_PATTERN = /https?:\/\/(?:[a-z0-9-]+\.)?discord(?:app)?\.com\/api\/webhooks\/\S+/gi;

export function redactWebhookUrls(text: string): string {
  return text.replace(WEBHOOK_URL_PATTERN, "[redacted]");
}

export function renderAlert(track: Track | null, reason: string): DiscordEmbed[] {
  const label = track ?? "全域";
  return [
    {
      title: `⚠️ 推播失敗 · ${label}`,
      description: redactWebhookUrls(reason),
      color: ALERT_COLOR,
    },
  ];
}

// F6 FR-019a／R3：與 renderAlert 同檔的單一通知實作。不經過 Lesson Compiler / Renderer、不需要
// Lesson；純函式、不含時間戳（時間只寫入 state.completedAt，見憲章 XII）。
export function renderCompletionNotice(track: Track): DiscordEmbed[] {
  return [
    {
      title: `🎉 課程完成 · ${track}`,
      description:
        `本 Track 的課程已全部推播完畢，其後不再推播。\n` +
        `想重新開始，請依 runbook 編輯 state.json（調整 currentSessionIndex 並清除 completedAt）。`,
      color: COMPLETION_COLOR,
    },
  ];
}
