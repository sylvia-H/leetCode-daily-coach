import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

describe("零 LLM 憲章驗證（憲章 VIII、SC-008）", () => {
  it("src/** 的原始碼不含 @google/genai import", () => {
    const srcDir = join(process.cwd(), "src");
    const files = listTsFiles(srcDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      expect(content, `${file} MUST NOT import @google/genai`).not.toMatch(/@google\/genai/);
    }
  });

  it(".github/workflows/daily.yml 不含 GEMINI_API_KEY 字串", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "daily.yml");
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).not.toMatch(/GEMINI_API_KEY/);
  });
});
