// tests/e2e/** 的唯一允許替身：全域 fetch（contracts/e2e-harness.md §2）。
// 依呼叫順序記錄請求，MUST NOT 解讀或重組 embeds 內容——只原樣透傳 body.embeds 供斷言使用。
import { vi } from "vitest";
import type { DiscordEmbed } from "../../src/types/lesson.js";

export interface RecordedRequest {
  url: string;
  embeds: DiscordEmbed[];
}

export interface FetchRecorder {
  requests: RecordedRequest[];
  requestsFor(url: string): RecordedRequest[];
  /** 讓指定 URL 的請求固定失敗（US4）。status 省略 ⇒ 模擬網路層丟出。 */
  failFor(url: string, status?: number): void;
  install(): void;
}

interface FailureSpec {
  status?: number;
}

function makeResponse(ok: boolean, status: number): Response {
  return {
    ok,
    status,
    headers: { get: () => null },
  } as unknown as Response;
}

export function createFetchRecorder(): FetchRecorder {
  const requests: RecordedRequest[] = [];
  const failures = new Map<string, FailureSpec>();

  const fetchMock = vi.fn(async (input: unknown, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(init.body as string) as { embeds: DiscordEmbed[] }) : { embeds: [] };
    requests.push({ url, embeds: body.embeds });

    const failure = failures.get(url);
    if (failure) {
      if (failure.status === undefined) {
        throw new Error(`fetch-recorder: 模擬網路層失敗（${url}）`);
      }
      return makeResponse(false, failure.status);
    }

    return makeResponse(true, 204);
  });

  return {
    requests,
    requestsFor(url: string) {
      return requests.filter((r) => r.url === url);
    },
    failFor(url: string, status?: number) {
      failures.set(url, { status });
    },
    install() {
      vi.stubGlobal("fetch", fetchMock);
    },
  };
}
