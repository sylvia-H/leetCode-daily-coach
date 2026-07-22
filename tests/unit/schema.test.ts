import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { parseConceptFrontmatter, parseModules } from "../../src/compiler/schema.js";
import type { ViolationRule } from "../../src/types/curriculum.js";
import { validModules } from "../helpers/curriculum.js";

const BAD_DIR = join(process.cwd(), "tests", "fixtures", "curriculum", "bad-frontmatter");

function frontmatterOf(file: string): Record<string, unknown> {
  const raw = readFileSync(join(BAD_DIR, file), "utf-8");
  return matter(raw).data as Record<string, unknown>;
}

function rulesFor(file: string): ViolationRule[] {
  const { violations } = parseConceptFrontmatter(frontmatterOf(file), file);
  return violations.map((v) => v.rule);
}

describe("conceptFrontmatterSchema（§10.1 / SC-003）", () => {
  it("合法 frontmatter 通過、0 violation、回傳解析結果", () => {
    const { frontmatter, violations } = parseConceptFrontmatter(frontmatterOf("valid.md"), "valid.md");
    expect(violations).toHaveLength(0);
    expect(frontmatter?.id).toBe("valid-concept");
    expect(frontmatter?.difficulty).toBe("easy");
    expect(frontmatter?.estimated_minutes).toBe(10);
  });

  it("缺 pattern_label → schema-missing-field，且指名欄位", () => {
    const { violations } = parseConceptFrontmatter(frontmatterOf("missing-pattern-label.md"), "x");
    const v = violations.find((v) => v.field?.includes("pattern_label"));
    expect(v?.rule).toBe("schema-missing-field");
  });

  it("difficulty 值域錯（hard）→ schema-type", () => {
    expect(rulesFor("bad-difficulty.md")).toContain("schema-type");
  });

  it("estimated_minutes 非正整數 → schema-type", () => {
    const { violations } = parseConceptFrontmatter(frontmatterOf("bad-estimated-minutes.md"), "x");
    const v = violations.find((v) => v.field?.includes("estimated_minutes"));
    expect(v?.rule).toBe("schema-type");
  });

  it("id 非 kebab-case → schema-id-format", () => {
    const { violations } = parseConceptFrontmatter(frontmatterOf("bad-id.md"), "x");
    const v = violations.find((v) => v.field === "id");
    expect(v?.rule).toBe("schema-id-format");
  });

  it("leetcode 含非正整數 → leetcode-format", () => {
    const { violations } = parseConceptFrontmatter(frontmatterOf("bad-leetcode.md"), "x");
    const v = violations.find((v) => v.field?.startsWith("leetcode"));
    expect(v?.rule).toBe("leetcode-format");
  });

  it("每個 bad-frontmatter fixture（除 valid）皆至少產生一筆 violation", () => {
    const files = readdirSync(BAD_DIR).filter((f) => f.endsWith(".md") && f !== "valid.md");
    for (const f of files) {
      expect(rulesFor(f).length, `${f} 應報錯`).toBeGreaterThan(0);
    }
  });
});

describe("modulesSchema（M1–M7 / contracts/modules-schema.md）", () => {
  it("合法 16-Module 骨架通過、0 violation", () => {
    const { skeleton, violations } = parseModules(validModules());
    expect(violations).toHaveLength(0);
    expect(skeleton?.modules).toHaveLength(16);
  });

  it("M1 version 非整數 → schema-type", () => {
    const bad = { ...validModules(), version: 1.5 };
    const rules = parseModules(bad).violations.map((v) => v.rule);
    expect(rules).toContain("schema-type");
  });

  it("M2 modules 長度非 16 → skeleton-shape（非 granularity-range）", () => {
    const bad = validModules();
    bad.modules = bad.modules.slice(0, 15);
    const rules = parseModules(bad).violations.map((v) => v.rule);
    expect(rules).toContain("skeleton-shape");
    expect(rules).not.toContain("granularity-range");
  });

  it("M3 id 非 kebab-case → schema-id-format", () => {
    const bad = validModules();
    bad.modules[1] = { ...bad.modules[1]!, id: "Bad_Id", topics: [{ id: "Bad_Id", title: "X" }] };
    const rules = parseModules(bad).violations.map((v) => v.rule);
    expect(rules).toContain("schema-id-format");
  });

  it("M4 topic.id 跨 Module 重複 → duplicate-id", () => {
    const bad = validModules();
    // 讓 module[2] 的主 topic 撞 module[1] 的 topic id
    bad.modules[2] = { ...bad.modules[2]!, topics: [{ id: bad.modules[1]!.id, title: "Dup" }] };
    const rules = parseModules(bad).violations.map((v) => v.rule);
    expect(rules).toContain("duplicate-id");
  });

  it("M5 level ≠ 陣列索引 → skeleton-shape", () => {
    const bad = validModules();
    bad.modules[3] = { ...bad.modules[3]!, level: 9 };
    const rules = parseModules(bad).violations.map((v) => v.rule);
    expect(rules).toContain("skeleton-shape");
  });

  it("M6 某 module 無任何 topic → skeleton-shape", () => {
    const bad = validModules();
    bad.modules[4] = { ...bad.modules[4]!, topics: [] };
    const rules = parseModules(bad).violations.map((v) => v.rule);
    expect(rules).toContain("skeleton-shape");
  });

  it("M7 title 為空 → skeleton-shape", () => {
    const bad = validModules();
    bad.modules[5] = { ...bad.modules[5]!, title: "" };
    const rules = parseModules(bad).violations.map((v) => v.rule);
    expect(rules).toContain("skeleton-shape");
  });

  it("module.id 與其主 topic.id 同名（如 array）MUST NOT 觸發 duplicate-id（FR-002 識別空間分離）", () => {
    const { violations } = parseModules(validModules());
    expect(violations.filter((v) => v.rule === "duplicate-id")).toHaveLength(0);
  });
});
