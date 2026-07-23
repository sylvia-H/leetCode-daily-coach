import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function listTsFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...listTsFiles(full));
    else if (entry.endsWith(".ts")) files.push(full);
  }
  return files;
}

// FR-029、SC-009：F1 臨時債清償確認——硬編課表、demo 常數與孤兒 Article 皆不得殘留（含改名搬家）。
describe("F1 臨時債清償（SC-009）", () => {
  const forbiddenSymbols = ["SESSION_PLANS", "getPathLabels", "DEMO_LEETCODE_IDS", "DEMO_PROBLEM_CONTENT"];

  it("src/** 不含任一項 F1 硬編符號", () => {
    const files = listTsFiles(join(process.cwd(), "src"));
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      for (const symbol of forbiddenSymbols) {
        expect(content, `${file} 不得含有 ${symbol}`).not.toMatch(new RegExp(symbol));
      }
    }
  });

  it("孤兒 Article articles/two-pointer/002-left-right-pointer.md 已移除（research R8）", () => {
    const path = join(process.cwd(), "articles", "two-pointer", "002-left-right-pointer.md");
    let exists = true;
    try {
      statSync(path);
    } catch {
      exists = false;
    }
    expect(exists).toBe(false);
  });
});
