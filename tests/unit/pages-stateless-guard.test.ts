// FR-014 守門：發佈階段（src/pages/**）MUST 為完全 stateless——不得出現 node:fs／fs 的 import，
// 也不得出現 writeFileSync／readFileSync 等檔案 I/O 呼叫（比照既有 no-llm-in-src.test.ts 的
// 守門測試模式，site-build-contract.md §7）。
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function listFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".ts")) out.push(full);
    }
  };
  walk(dir);
  return out;
}

const FORBIDDEN_PATTERNS = [
  /from\s+["']node:fs["']/,
  /from\s+["']fs["']/,
  /require\(\s*["']node:fs["']\s*\)/,
  /require\(\s*["']fs["']\s*\)/,
  /\bwriteFileSync\b/,
  /\breadFileSync\b/,
  /\bmkdirSync\b/,
];

describe("Pages 發佈階段 stateless 守門（FR-014／site-build-contract.md §7）", () => {
  it("src/pages/** 內任何 .ts 檔皆不出現檔案 I/O import 或呼叫", () => {
    const offenders: string[] = [];
    for (const file of listFiles("src/pages")) {
      const content = readFileSync(file, "utf-8");
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          offenders.push(`${file}（命中：${pattern}）`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
