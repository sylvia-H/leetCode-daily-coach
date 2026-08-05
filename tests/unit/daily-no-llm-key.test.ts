// 憲章 VIII 守門（FR-022 / SC-007）：daily.yml MUST NOT 出現任何 LLM 金鑰名稱——每日 runtime
// 零 LLM，連 env 名稱都不該提及，避免日後有人「順手」在 daily.yml 加一行 secret 就悄悄破戒。
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const LLM_KEY_PATTERNS = [/GEMINI/, /GOOGLE_API_KEY/, /OPENAI/, /ANTHROPIC/, /_API_KEY/];

describe("daily.yml 零 LLM 金鑰守門（憲章 VIII / FR-022 / SC-007）", () => {
  it("daily.yml 內容不含任何 LLM 金鑰名稱", () => {
    const content = readFileSync(".github/workflows/daily.yml", "utf-8");
    for (const pattern of LLM_KEY_PATTERNS) {
      expect(content).not.toMatch(pattern);
    }
  });
});
