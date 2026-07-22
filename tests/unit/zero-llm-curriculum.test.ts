import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadCurriculum, validateCurriculum } from "../../src/compiler/curriculum.js";
import { buildGraph } from "../helpers/curriculum.js";

const SRC = join(process.cwd(), "src", "compiler");

describe("F2 compiler 零 LLM 與純函式守衛（憲章 VIII / IX / FR-024）", () => {
  it("schema.ts 與 curriculum.ts 原始碼不含 @google/genai", () => {
    for (const f of ["schema.ts", "curriculum.ts"]) {
      const content = readFileSync(join(SRC, f), "utf-8");
      expect(content, `${f} MUST NOT import @google/genai`).not.toMatch(/@google\/genai/);
    }
  });

  it("curriculum.ts / schema.ts 無 process.exit（副作用只在 scripts/ 入口，FR-024）", () => {
    for (const f of ["schema.ts", "curriculum.ts"]) {
      const content = readFileSync(join(SRC, f), "utf-8");
      expect(content, `${f} MUST NOT 呼叫 process.exit`).not.toMatch(/process\.exit\s*\(/);
    }
  });

  it("validateCurriculum 被 import 並呼叫時無副作用（回傳結果、不終止行程）", () => {
    expect(typeof validateCurriculum).toBe("function");
    expect(typeof loadCurriculum).toBe("function");
    const result = validateCurriculum(
      buildGraph([{ id: "start", module: "programming-mindset", topic: "programming-mindset", localOrder: 1, prerequisite: [] }]),
    );
    expect(result).toHaveProperty("ok");
    expect(result).toHaveProperty("violations");
  });
});
