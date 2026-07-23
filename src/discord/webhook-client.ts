import type { DiscordEmbed, Track } from "../types/lesson.js";

export interface WebhookClient {
  post(track: Track, embeds: DiscordEmbed[]): Promise<void>;
}

export interface WebhookClientOptions {
  /** 含首次嘗試在內的總次數上限。 */
  maxAttempts?: number;
  /** 注入點：測試以同步 stub 取代，避免真的等待。 */
  sleep?: (ms: number) => Promise<void>;
  /** 注入點：jitter 亂數來源，測試可固定。 */
  random?: () => number;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 8_000;
/** `Retry-After` 可能被上游設得很長；單次等待 MUST 有上限，否則一次推播會拖垮整個 run。 */
const MAX_RETRY_AFTER_MS = 30_000;

const defaultSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 可重試的失敗：暫時性網路錯誤、429（rate limit）與 5xx。
 * 4xx（非 429）代表請求本身有問題（webhook 已刪除、payload 違規），重試只會重複失敗。
 */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function parseRetryAfterMs(response: Response): number | undefined {
  const header = response.headers?.get?.("retry-after");
  if (!header) return undefined;
  const seconds = Number(header.trim());
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
}

export function createWebhookClient(
  webhooks: Partial<Record<Track, string>>,
  options: WebhookClientOptions = {},
): WebhookClient {
  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  return {
    async post(track, embeds) {
      const url = webhooks[track];
      if (!url) {
        throw new Error(`推播失敗：${track} 沒有設定的 webhook`);
      }

      let lastError: Error | undefined;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        let retryAfterMs: number | undefined;

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeds }),
          });

          if (response.ok) return;

          lastError = new Error(`推播失敗：${track} webhook 回應 HTTP ${response.status}`);
          if (!isRetryableStatus(response.status)) throw lastError;
          retryAfterMs = parseRetryAfterMs(response);
        } catch (err) {
          // fetch 本身丟出（DNS / 連線中斷 / socket timeout）視為暫時性；非可重試的 HTTP 狀態
          // 於上方已組出同一個 Error 實例並直接丟出，在此原樣往外送。
          const error = err as Error;
          if (error === lastError) throw error;
          lastError = error;
        }

        if (attempt === maxAttempts) break;
        // 指數退避 + jitter；上游明示 Retry-After 時以其為準（尊重 rate limit，避免被進一步限流）。
        const backoff = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS);
        const jitter = Math.floor(random() * (backoff / 4));
        await sleep(retryAfterMs ?? backoff + jitter);
      }

      throw new Error(
        `推播失敗：${track} 重試 ${maxAttempts} 次仍失敗（${lastError?.message ?? "未知原因"}）`,
        { cause: lastError },
      );
    },
  };
}
