// 替身邊界的守門測試（SC-006 機驗；contracts/e2e-harness.md §1）：掃描 tests/e2e/** 全部原始碼，
// 斷言不含 pushTrack 字樣。本測試 MUST 置於 tests/unit/——若放進 tests/e2e/ 會落入自己的掃描範圍
// 而自我命中，必然紅燈。
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

describe("tests/e2e/** 替身邊界守門（SC-006）", () => {
  it("掃描到的檔案數 > 0 且全部原始碼不含 pushTrack 字樣", () => {
    const e2eDir = join(process.cwd(), "tests", "e2e");
    const files = listTsFiles(e2eDir);
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      expect(content, `${file} MUST NOT 出現 pushTrack 字樣（唯一允許的替身是全域 fetch）`).not.toMatch(
        /pushTrack/,
      );
    }
  });
});
