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

  it("全樹掃描含 src/compiler/problem.ts（F3 FR-012 回歸守衛：防未來重構漏掉此模組）", () => {
    const files = listTsFiles(join(process.cwd(), "src"));
    const normalized = files.map((f) => f.replace(/\\/g, "/"));
    expect(normalized.some((f) => f.endsWith("src/compiler/problem.ts"))).toBe(true);
  });

  it("全樹掃描含 src/compiler/schedule-generator.ts 與 schedule-schema.ts（F4 憲章 VIII 回歸守衛）", () => {
    const files = listTsFiles(join(process.cwd(), "src"));
    const normalized = files.map((f) => f.replace(/\\/g, "/"));
    expect(normalized.some((f) => f.endsWith("src/compiler/schedule-generator.ts"))).toBe(true);
    expect(normalized.some((f) => f.endsWith("src/compiler/schedule-schema.ts"))).toBe(true);
  });

  it(".github/workflows/daily.yml 不含 GEMINI_API_KEY 字串", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "daily.yml");
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).not.toMatch(/GEMINI_API_KEY/);
  });
});
