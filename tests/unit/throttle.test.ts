import { describe, expect, it } from "vitest";
import { DEFAULT_MAX_RETRIES, Throttle, ThrottleExhaustedError, resolveRpmLimit } from "../../scripts/lib/throttle.js";

/** 假時鐘：sleep(ms) 立即 resolve 並把虛擬時間往前推 ms、記錄呼叫序，供斷言節流/退避間隔而不需真等待。 */
function fakeClock() {
  let virtualNow = 0;
  const sleeps: number[] = [];
  return {
    now: () => virtualNow,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      virtualNow += ms;
    },
    sleeps,
  };
}

function retryableError(status = 429): Error & { status: number } {
  return Object.assign(new Error("rate limited"), { status });
}

describe("Throttle（scripts/lib/throttle.ts，R3 / FR-017/018）", () => {
  it("RPM 節流：兩次呼叫的最小間隔 = 60000 / rpmLimit", async () => {
    const clock = fakeClock();
    const throttle = new Throttle({ rpmLimit: 60, now: clock.now, sleep: clock.sleep, random: () => 0 });

    await throttle.schedule(async () => "a");
    await throttle.schedule(async () => "b");
    await throttle.schedule(async () => "c");

    // 首次呼叫不需等待；後續每次至少間隔 1000ms（60000/60）
    expect(clock.sleeps[0]).toBe(1000);
    expect(clock.sleeps[1]).toBe(1000);
  });

  it("不需等待時 schedule 不呼叫 sleep（首次呼叫即時執行）", async () => {
    const clock = fakeClock();
    const throttle = new Throttle({ rpmLimit: 10, now: clock.now, sleep: clock.sleep });
    await throttle.schedule(async () => "ok");
    expect(clock.sleeps).toHaveLength(0);
  });

  it("退避成長：429 連續失敗 → 延遲依 base * 2^(attempt-1) 成長（random 固定為 1 時無縮減）", async () => {
    const clock = fakeClock();
    const throttle = new Throttle({
      rpmLimit: Infinity, // 節流間隔精確為 0，只觀察退避 sleep
      baseDelayMs: 1000,
      maxDelayMs: 60000,
      maxRetries: 4,
      now: clock.now,
      sleep: clock.sleep,
      random: () => 1, // 全抖動封頂：jitter = 滿延遲，成長曲線可斷言
      isRetryable: () => true,
    });

    let calls = 0;
    await expect(
      throttle.schedule(async () => {
        calls++;
        throw retryableError();
      }),
    ).rejects.toThrow(ThrottleExhaustedError);

    expect(calls).toBe(5); // 首次 + 4 次重試
    expect(clock.sleeps).toEqual([1000, 2000, 4000, 8000]);
  });

  it("退避延遲封頂於 maxDelayMs", async () => {
    const clock = fakeClock();
    const throttle = new Throttle({
      rpmLimit: Infinity,
      baseDelayMs: 1000,
      maxDelayMs: 3000,
      maxRetries: 3,
      now: clock.now,
      sleep: clock.sleep,
      random: () => 1,
      isRetryable: () => true,
    });

    await expect(
      throttle.schedule(async () => {
        throw retryableError();
      }),
    ).rejects.toThrow(ThrottleExhaustedError);

    // 1000, 2000, 4000→封頂 3000
    expect(clock.sleeps).toEqual([1000, 2000, 3000]);
  });

  it("jitter 邊界：random() = 0 時延遲為 0（全抖動下限）", async () => {
    const clock = fakeClock();
    const throttle = new Throttle({
      rpmLimit: Infinity,
      baseDelayMs: 1000,
      maxRetries: 2,
      now: clock.now,
      sleep: clock.sleep,
      random: () => 0,
      isRetryable: () => true,
    });

    await expect(
      throttle.schedule(async () => {
        throw retryableError();
      }),
    ).rejects.toThrow(ThrottleExhaustedError);

    expect(clock.sleeps).toEqual([0, 0]);
  });

  it("非 429/5xx（如 400）立即失敗，不進退避、不呼叫 sleep", async () => {
    const clock = fakeClock();
    const throttle = new Throttle({ now: clock.now, sleep: clock.sleep });
    let calls = 0;

    await expect(
      throttle.schedule(async () => {
        calls++;
        throw retryableError(400);
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(calls).toBe(1);
    expect(clock.sleeps).toHaveLength(0);
  });

  it("耗盡後拋出可辨識的 ThrottleExhaustedError，攜帶嘗試次數與原始錯誤", async () => {
    const clock = fakeClock();
    const throttle = new Throttle({
      rpmLimit: Infinity,
      maxRetries: 2,
      now: clock.now,
      sleep: clock.sleep,
      random: () => 0,
      isRetryable: () => true,
    });
    const original = retryableError(503);

    const err = await throttle
      .schedule(async () => {
        throw original;
      })
      .catch((e) => e as ThrottleExhaustedError);

    expect(err).toBeInstanceOf(ThrottleExhaustedError);
    expect(err.attempts).toBe(2);
    expect(err.lastError).toBe(original);
  });

  it("預設重試上限為 6 次", () => {
    expect(DEFAULT_MAX_RETRIES).toBe(6);
  });

  it("resolveRpmLimit：缺省或非正數回退預設值 10，合法值覆寫", () => {
    expect(resolveRpmLimit({})).toBe(10);
    expect(resolveRpmLimit({ RPM_LIMIT: "0" })).toBe(10);
    expect(resolveRpmLimit({ RPM_LIMIT: "-5" })).toBe(10);
    expect(resolveRpmLimit({ RPM_LIMIT: "not-a-number" })).toBe(10);
    expect(resolveRpmLimit({ RPM_LIMIT: "15" })).toBe(15);
  });
});
