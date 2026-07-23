import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadTrackOverlay } from "../../src/compiler/overlay.js";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";

describe("loadTrackOverlay — 缺席 vs 壞檔（US5、contracts/lesson-contract.md §1）", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "overlay-load-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("overlay 檔不存在 ⇒ 視為空 Overlay，不失敗", () => {
    const overlay = loadTrackOverlay("foundation", dir);
    expect(overlay).toEqual({ track: "foundation", byConcept: {} });
  });

  it("overlay 檔存在但不符 schema（track 欄位不符）⇒ fail loud", () => {
    writeFileSync(join(dir, "foundation.json"), JSON.stringify({ track: "interviewReady", byConcept: {} }));
    expect(() => loadTrackOverlay("foundation", dir)).toThrow(/overlay 載入失敗/);
  });

  it("overlay 檔存在但不是合法 JSON ⇒ fail loud", () => {
    writeFileSync(join(dir, "foundation.json"), "{ not json");
    expect(() => loadTrackOverlay("foundation", dir)).toThrow(/overlay 載入失敗/);
  });

  it("overlay 檔存在且合法 ⇒ 正常載入", () => {
    writeFileSync(
      join(dir, "foundation.json"),
      JSON.stringify({ track: "foundation", byConcept: { x: { extraNotesMarkdown: "note" } } }),
    );
    const overlay = loadTrackOverlay("foundation", dir);
    expect(overlay.byConcept.x?.extraNotesMarkdown).toBe("note");
  });
});

describe("loadCompilerDeps — F8 素材缺席 vs 壞檔的相同對照（research R7、FR-031）", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "f8-load-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("data/reflection-bank.json 不存在 ⇒ deps.reflectionBank 缺席，不失敗", () => {
    const deps = loadCompilerDeps({ reflectionBankPath: join(dir, "does-not-exist.json") });
    expect(deps.reflectionBank).toBeUndefined();
  });

  it("data/reflection-bank.json 存在但不是合法 JSON ⇒ fail loud", () => {
    const path = join(dir, "reflection-bank.json");
    writeFileSync(path, "{ not json");
    expect(() => loadCompilerDeps({ reflectionBankPath: path })).toThrow(/reflection bank 壞檔/);
  });

  it("data/encouragement.json 不存在 ⇒ deps.encouragement 缺席，不失敗", () => {
    const deps = loadCompilerDeps({ encouragementPath: join(dir, "does-not-exist.json") });
    expect(deps.encouragement).toBeUndefined();
  });

  it("data/encouragement.json 存在但不是合法 JSON ⇒ fail loud", () => {
    const path = join(dir, "encouragement.json");
    writeFileSync(path, "{ not json");
    expect(() => loadCompilerDeps({ encouragementPath: path })).toThrow(/encouragement 壞檔/);
  });

  it("兩者皆存在且合法 JSON 時正常載入為 unknown 值", () => {
    const reflectionPath = join(dir, "reflection-bank.json");
    const encouragementPath = join(dir, "encouragement.json");
    writeFileSync(reflectionPath, JSON.stringify({ foo: "bar" }));
    writeFileSync(encouragementPath, JSON.stringify(["加油"]));
    const deps = loadCompilerDeps({ reflectionBankPath: reflectionPath, encouragementPath });
    expect(deps.reflectionBank).toEqual({ foo: "bar" });
    expect(deps.encouragement).toEqual(["加油"]);
  });
});
