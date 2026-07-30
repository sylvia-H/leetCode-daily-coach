// F7 LLM 呼叫層（R1、FR-021/022/025）：@google/genai 的單一封裝出口。
// 只在 scripts/lib/ 出現（憲章 VIII）；src/ MUST NOT import 本檔或 @google/genai（tests/unit/no-llm-in-src.test.ts 守）。
// 建構期讀 GEMINI_API_KEY，缺即 fail-fast；所有呼叫走 Throttle（R3），只送公開資料（FR-021）。
import { GoogleGenAI } from "@google/genai";
import { Throttle, resolveRpmLimit } from "./throttle.js";

/** 憲章 v1.0.1 釘死的模型 id；MUST NOT 改用其他（可能付費）型號。 */
export const GEMINI_MODEL = "gemini-3.1-flash-lite";

/** `@google/genai` 中本檔實際使用的最小介面（供測試以假物件替身，避免直接 mock SDK 模組）。 */
export interface GenAiLike {
  models: {
    generateContent: (args: { model: string; contents: string }) => Promise<{ text?: string }>;
  };
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("missing-api-key：缺少 GEMINI_API_KEY，MUST fail-fast（憲章 VIII / FR-025）");
    this.name = "MissingApiKeyError";
  }
}

export class EmptyLlmResponseError extends Error {
  constructor() {
    super("llm-empty-response：Gemini 回應無文字內容");
    this.name = "EmptyLlmResponseError";
  }
}

export interface LlmClientDeps {
  genAI: GenAiLike;
  throttle: Throttle;
}

/** 單一 LLM 呼叫出口：模型釘死、全部呼叫走節流/退避（R3）。只送公開資料，不夾帶題目描述等機密（FR-021）。 */
export class LlmClient {
  constructor(private readonly deps: LlmClientDeps) {}

  async generate(prompt: string): Promise<string> {
    return this.deps.throttle.schedule(async () => {
      const response = await this.deps.genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
      if (typeof response.text !== "string" || response.text.length === 0) {
        throw new EmptyLlmResponseError();
      }
      return response.text;
    });
  }
}

export interface CreateLlmClientOptions {
  /** 測試替身注入點：預設建構真實 `GoogleGenAI`。 */
  genAiFactory?: (apiKey: string) => GenAiLike;
  throttle?: Throttle;
}

/** 缺 `GEMINI_API_KEY` 即 throw（建構期 fail-fast，不待第一次呼叫才爆）。 */
export function createLlmClient(
  env: Record<string, string | undefined>,
  options: CreateLlmClientOptions = {},
): LlmClient {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new MissingApiKeyError();
  }
  const factory = options.genAiFactory ?? ((key: string) => new GoogleGenAI({ apiKey: key }) as unknown as GenAiLike);
  const genAI = factory(apiKey);
  const throttle = options.throttle ?? new Throttle({ rpmLimit: resolveRpmLimit(env) });
  return new LlmClient({ genAI, throttle });
}
