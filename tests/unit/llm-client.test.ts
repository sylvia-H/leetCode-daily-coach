import { describe, expect, it, vi } from "vitest";
import {
  GEMINI_MODEL,
  MissingApiKeyError,
  createLlmClient,
  type GenAiLike,
} from "../../scripts/lib/llm-client.js";
import { Throttle } from "../../scripts/lib/throttle.js";

function fakeGenAi(generateContent: GenAiLike["models"]["generateContent"]): GenAiLike {
  return { models: { generateContent } };
}

describe("createLlmClient（scripts/lib/llm-client.ts，R1 / FR-021/022/025）", () => {
  it("缺 GEMINI_API_KEY → 建構期即 throw MissingApiKeyError（fail-fast）", () => {
    expect(() => createLlmClient({})).toThrow(MissingApiKeyError);
    expect(() => createLlmClient({ GEMINI_API_KEY: "" })).toThrow(MissingApiKeyError);
    expect(() => createLlmClient({ GEMINI_API_KEY: "   " })).toThrow(MissingApiKeyError);
  });

  it("有金鑰即成功建構，不拋錯", () => {
    const factory = vi.fn(() => fakeGenAi(async () => ({ text: "ok" })));
    expect(() => createLlmClient({ GEMINI_API_KEY: "key" }, { genAiFactory: factory })).not.toThrow();
    expect(factory).toHaveBeenCalledWith("key");
  });

  it("模型 id 釘死為 gemini-3.5-flash-lite，每次呼叫皆帶入", async () => {
    const generateContent = vi.fn(async () => ({ text: "hello" }));
    const client = createLlmClient(
      { GEMINI_API_KEY: "key" },
      { genAiFactory: () => fakeGenAi(generateContent), throttle: new Throttle() },
    );
    await client.generate("some prompt");
    expect(generateContent).toHaveBeenCalledWith({ model: GEMINI_MODEL, contents: "some prompt" });
    expect(GEMINI_MODEL).toBe("gemini-3.5-flash-lite");
  });

  it("呼叫確實經過 throttle：schedule 被呼叫、節流間隔生效", async () => {
    const generateContent = vi.fn(async () => ({ text: "ok" }));
    const throttle = new Throttle({ rpmLimit: Infinity });
    const scheduleSpy = vi.spyOn(throttle, "schedule");
    const client = createLlmClient(
      { GEMINI_API_KEY: "key" },
      { genAiFactory: () => fakeGenAi(generateContent), throttle },
    );

    await client.generate("p1");
    await client.generate("p2");

    expect(scheduleSpy).toHaveBeenCalledTimes(2);
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("回應無文字內容 → 拋出 EmptyLlmResponseError（經 throttle 傳遞）", async () => {
    const client = createLlmClient(
      { GEMINI_API_KEY: "key" },
      { genAiFactory: () => fakeGenAi(async () => ({})), throttle: new Throttle({ rpmLimit: Infinity, maxRetries: 0 }) },
    );
    await expect(client.generate("p")).rejects.toThrow("llm-empty-response");
  });
});
