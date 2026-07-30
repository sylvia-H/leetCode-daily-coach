// F7 產線韌性層（R3、FR-017/018）：RPM 節流 + 429/5xx 指數退避 + 全抖動 jitter。
// 純邏輯排程器：時鐘（now）與等待（sleep）皆以注入參數表示，供 vitest 假時鐘單測而不需真等待。
// 只在 scripts/lib/ 出現（憲章 VIII 純度界線）；本檔不 import @google/genai、不做任何 I/O。

export const DEFAULT_RPM_LIMIT = 10;
export const DEFAULT_MAX_RETRIES = 6;
export const DEFAULT_BASE_DELAY_MS = 1000;
export const DEFAULT_MAX_DELAY_MS = 60000;

/** 429/5xx/暫時性錯誤才重試；非暫時性 4xx（如 400/401/403/404）MUST 直接失敗（FR-018）。 */
export function defaultIsRetryable(error: unknown): boolean {
  const status = (error as { status?: number } | null | undefined)?.status;
  if (status === undefined) return false;
  return status === 429 || (status >= 500 && status < 600);
}

/** 退避重試耗盡（該次呼叫最終失敗）；`cause` 保留最後一次的原始錯誤供上層記錄。 */
export class ThrottleExhaustedError extends Error {
  constructor(
    public readonly attempts: number,
    public readonly lastError: unknown,
  ) {
    super(`throttle-exhausted：重試 ${attempts} 次後仍失敗：${(lastError as Error)?.message ?? String(lastError)}`);
    this.name = "ThrottleExhaustedError";
  }
}

export interface ThrottleOptions {
  /** 每分鐘呼叫上限；最小呼叫間隔 = 60000 / rpmLimit（R3）。 */
  rpmLimit?: number;
  /** 429/5xx 重試上限（不含首次呼叫）。 */
  maxRetries?: number;
  /** 指數退避基準延遲（ms）。 */
  baseDelayMs?: number;
  /** 指數退避延遲上限（ms），超過即封頂。 */
  maxDelayMs?: number;
  /** 判斷錯誤是否應觸發退避重試；預設只認 429/5xx。 */
  isRetryable?: (error: unknown) => boolean;
  /** 注入時鐘（測試用假時鐘）；預設 Date.now。 */
  now?: () => number;
  /** 注入等待（測試用假時鐘，立即 resolve 並記錄毫秒數）；預設真實 setTimeout。 */
  sleep?: (ms: number) => Promise<void>;
  /** 注入亂數源（jitter）；預設 Math.random。 */
  random?: () => number;
}

function realSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 由環境變數解析 RPM 上限；缺省或非正數皆回退預設值（FR-017）。純函式，不直接讀
 * `process.env`——由呼叫端決定要傳入的 env-like 物件，維持本檔可測、無隱性副作用。
 */
export function resolveRpmLimit(env: Record<string, string | undefined>): number {
  const raw = env.RPM_LIMIT?.trim();
  if (!raw) return DEFAULT_RPM_LIMIT;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_RPM_LIMIT;
}

/** RPM 節流 + 退避重試排程器。單一實例序列化其下全部呼叫的最小間隔（R3：串行優於併發）。 */
export class Throttle {
  private readonly intervalMs: number;
  private nextSlot: number | undefined;
  private readonly opts: Required<ThrottleOptions>;

  constructor(options: ThrottleOptions = {}) {
    this.opts = {
      rpmLimit: options.rpmLimit ?? DEFAULT_RPM_LIMIT,
      maxRetries: options.maxRetries ?? DEFAULT_MAX_RETRIES,
      baseDelayMs: options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS,
      maxDelayMs: options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
      isRetryable: options.isRetryable ?? defaultIsRetryable,
      now: options.now ?? Date.now,
      sleep: options.sleep ?? realSleep,
      random: options.random ?? Math.random,
    };
    this.intervalMs = 60_000 / this.opts.rpmLimit;
  }

  private async waitForSlot(): Promise<void> {
    const now = this.opts.now();
    const earliest = this.nextSlot === undefined ? now : Math.max(now, this.nextSlot);
    const wait = earliest - now;
    this.nextSlot = earliest + this.intervalMs;
    if (wait > 0) await this.opts.sleep(wait);
  }

  /** 退避延遲（封頂前，含 jitter）：base * 2^(attempt-1)，封頂 maxDelayMs，全抖動 × random()。 */
  private backoffDelay(attempt: number): number {
    const raw = this.opts.baseDelayMs * 2 ** (attempt - 1);
    const capped = Math.min(raw, this.opts.maxDelayMs);
    return capped * this.opts.random();
  }

  /**
   * 依 RPM 節流呼叫 fn；429/5xx（或自訂 isRetryable）失敗時指數退避＋jitter 重試，
   * 上限 `maxRetries` 次。非暫時性錯誤直接拋出（不進退避）。重試耗盡拋 `ThrottleExhaustedError`。
   */
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0;
    for (;;) {
      await this.waitForSlot();
      try {
        return await fn();
      } catch (err) {
        if (!this.opts.isRetryable(err)) throw err;
        attempt += 1;
        if (attempt > this.opts.maxRetries) {
          throw new ThrottleExhaustedError(attempt - 1, err);
        }
        await this.opts.sleep(this.backoffDelay(attempt));
      }
    }
  }
}
