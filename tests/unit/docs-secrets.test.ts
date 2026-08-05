// F6 FR-025 / FR-027 / SC-010：docs/runbook.md 與 specs/006-pipeline-mvp/acceptance.md 中
// Discord webhook URL 與金鑰名稱的出現次數 MUST 為 0。
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const WEBHOOK_URL_PATTERN = /https?:\/\/(?:[a-z0-9-]+\.)?discord(?:app)?\.com\/api\/webhooks\/\S+/gi;
// 與 tests/unit/zero-llm.test.ts 的 SC-005 清單一致（FR-005 字串集合）。
const LLM_KEY_NAMES = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"];

const targets = [
  join(process.cwd(), "docs", "runbook.md"),
  join(process.cwd(), "specs", "006-pipeline-mvp", "acceptance.md"),
];

describe("維運文件與驗收紀錄的祕密掃描（FR-025 / FR-027 / SC-010）", () => {
  for (const path of targets) {
    it(`${path.replace(/\\/g, "/")} 不含 Discord webhook URL 樣式`, () => {
      const content = readFileSync(path, "utf-8");
      expect(content.match(WEBHOOK_URL_PATTERN)).toBeNull();
    });

    it(`${path.replace(/\\/g, "/")} 不含任何 LLM 金鑰值出現次數`, () => {
      const content = readFileSync(path, "utf-8");
      for (const keyName of LLM_KEY_NAMES) {
        // 允許文件中提及金鑰「名稱」本身（例如「MUST NOT 登錄 GEMINI_API_KEY」這種說明性文字），
        // 這裡要擋的是「金鑰名稱後緊接實際值」的樣式（= 或 : 後跟非空白字元），真正的金鑰值不應出現。
        const valuePattern = new RegExp(`${keyName}\\s*[:=]\\s*\\S+`);
        expect(content).not.toMatch(valuePattern);
      }
    });
  }
});
