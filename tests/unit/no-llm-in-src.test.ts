// 憲章 VIII 守門（FR-023、SC-007）：`src/**` MUST NOT import `@google/genai`（或本檔以外的任何
// LLM SDK）。掃描原始碼文字而非 require 解析，讓「連字串裡都不該出現」的意圖更直白，也不因
// import 語法（動態 import()、re-export）而漏網。
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

describe("零 LLM Daily Runtime 守門（憲章 VIII / FR-023 / SC-007）", () => {
  it("src/** 內任何 .ts 檔皆不出現 @google/genai 字樣", () => {
    const offenders: string[] = [];
    for (const file of listFiles("src")) {
      const content = readFileSync(file, "utf-8");
      if (content.includes("@google/genai")) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});
