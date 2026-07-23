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

  it("全樹掃描含 src/compiler/gate.ts 與 src/compiler/overlay.ts（F5 憲章 VIII 回歸守衛）", () => {
    const files = listTsFiles(join(process.cwd(), "src"));
    const normalized = files.map((f) => f.replace(/\\/g, "/"));
    expect(normalized.some((f) => f.endsWith("src/compiler/gate.ts"))).toBe(true);
    expect(normalized.some((f) => f.endsWith("src/compiler/overlay.ts"))).toBe(true);
  });

  it("scripts/validate.ts 不含 @google/genai import（F5 內容 Gate 入口零 LLM）", () => {
    const content = readFileSync(join(process.cwd(), "scripts", "validate.ts"), "utf-8");
    expect(content).not.toMatch(/@google\/genai/);
  });

  it(".github/workflows/daily.yml 不含 GEMINI_API_KEY 字串", () => {
    const workflowPath = join(process.cwd(), ".github", "workflows", "daily.yml");
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).not.toMatch(/GEMINI_API_KEY/);
  });
});

describe("內容 Gate 可在無任何環境變數與 API key 下執行（SC-007 自動化把關）", () => {
  it("scripts/validate.ts 完全不讀取 process.env（無 webhook、無 GEMINI_API_KEY 依賴）", () => {
    const content = readFileSync(join(process.cwd(), "scripts", "validate.ts"), "utf-8");
    expect(content).not.toMatch(/process\.env/);
  });

  it("src/compiler/gate.ts 完全不讀取 process.env", () => {
    const content = readFileSync(join(process.cwd(), "src", "compiler", "gate.ts"), "utf-8");
    expect(content).not.toMatch(/process\.env/);
  });

  it("src/compiler/lesson.ts（loadCompilerDeps 所在檔）不讀取任何 webhook／API key 環境變數", () => {
    const content = readFileSync(join(process.cwd(), "src", "compiler", "lesson.ts"), "utf-8");
    expect(content).not.toMatch(/DISCORD_WEBHOOK_URL|GEMINI_API_KEY/);
  });
});
