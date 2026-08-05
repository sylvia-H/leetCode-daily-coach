// F7 LLM 呼叫層（R1、FR-021/022/025）：@google/genai 的單一封裝出口。
// 只在 scripts/lib/ 出現（憲章 VIII）；src/ MUST NOT import 本檔或 @google/genai（tests/unit/no-llm-in-src.test.ts 守）。
// 建構期讀 GEMINI_API_KEY，缺即 fail-fast；所有呼叫走 Throttle（R3），只送公開資料（FR-021）。
import { GoogleGenAI } from "@google/genai";
import { Throttle, resolveRpmLimit } from "./throttle.js";

/** 憲章 v1.0.2 釘死的模型 id；MUST NOT 改用其他（可能付費）型號。 */
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

/**
 * 結構化輸出（structured output）的回應 schema：OpenAPI 3.0 子集，對應 `@google/genai` 的 `Schema`。
 *
 * 為何自行宣告而不直接用 SDK 的 `Schema` 型別：SDK 的 `type` 欄位是**字串 enum**（`Type.STRING`…），
 * 直接使用會逼呼叫端（`scripts/lib/prompts/**`）為了一個型別而 **runtime import** `@google/genai`，
 * 破壞那些模組「純字串組裝、不碰 SDK / 不做 I/O」的定位。string enum 在 runtime 就是那些字串字面值，
 * 故以字面值聯集宣告在語意與線上行為完全等價，且與既有 `GenAiLike`「手寫最小介面」的設計一致：
 * SDK 型別只在本檔的邊界轉換處出現一次。
 */
export interface ResponseSchema {
  type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  description?: string;
  /** 僅可用於 `type: "STRING"`；把值域釘死在列舉內（例：difficulty 只能 easy/medium）。 */
  enum?: string[];
  items?: ResponseSchema;
  properties?: Record<string, ResponseSchema>;
  required?: string[];
  propertyOrdering?: string[];
  /**
   * 陣列長度上下限。**MUST 為字串**（如 `"10"` 而非 `10`）——OpenAPI Schema 的 int64 欄位依 proto
   * 慣例以字串序列化，SDK 的 `Schema.minItems` / `maxItems` 型別即為 `string`。
   *
   * ⚠️ **只能用在 items 結構單純的陣列**（如 `INTEGER` 陣列）。對 items 為複雜 OBJECT 的陣列加上
   * 任何長度約束，整個請求會被 API 以 **400 `INVALID_ARGUMENT`** 拒收（實測 2026-07-30，
   * gemini-3.5-flash-lite）——推定是約束解碼的狀態機複雜度上限。詳細實測證據與替代做法見
   * `scripts/lib/prompts/stage1-curriculum.ts` 的 `buildStage1ResponseSchema` docblock。
   */
  minItems?: string;
  maxItems?: string;
  minimum?: number;
  maximum?: number;
}

/** `@google/genai` 中本檔實際使用的最小介面（供測試以假物件替身，避免直接 mock SDK 模組）。 */
export interface GenAiLike {
  models: {
    generateContent: (args: {
      model: string;
      contents: string;
      config?: { responseMimeType: string; responseSchema: ResponseSchema };
    }) => Promise<{ text?: string }>;
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

  /**
   * 呼叫模型取回文字。傳入 `responseSchema` 即啟用**結構化輸出**：由 API 層保證回應是合法 JSON
   * 且符合 schema（型別 / 必填 / enum / 陣列長度），而非靠 prompt 指示詞請 LLM 自律。
   *
   * 為何重要：實測 Stage 1 起草時，LLM 手寫 JSON 會穩定產出「未跳脫字元」「minus sign 後無數字」
   * 等語法錯誤，以及 schema 外的列舉值（`difficulty: "hard"`），每一次都讓整個 Topic 的草稿作廢重試，
   * 白白消耗免費層額度。把這些約束交給 API 強制，是唯一能從源頭消滅該類失敗的做法（FR-017/018 同精神）。
   *
   * 未傳 schema 時**不帶 `config`**（維持純文字輸出）：Stage 2 全文展開輸出的是 Markdown 而非 JSON，
   * 不該被 `application/json` 的 mimetype 綁住。
   */
  async generate(prompt: string, responseSchema?: ResponseSchema): Promise<string> {
    return this.deps.throttle.schedule(async () => {
      const response = await this.deps.genAI.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        ...(responseSchema ? { config: { responseMimeType: "application/json", responseSchema } } : {}),
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
