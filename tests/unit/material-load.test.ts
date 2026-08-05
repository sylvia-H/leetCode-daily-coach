// F8 素材載入語意（FR-014、contracts/material-schema.md §2）：三種降級情境（整檔缺席 / 陣列為空 /
// 缺某 Topic 的 key）皆回傳 undefined 或省略、不失敗；壞檔／不符 schema 一律 fail loud，
// MUST NOT 降級為缺席（沿用 F5 loadOptionalMaterial 的既有語意）。
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadCompilerDeps } from "../../src/compiler/lesson.js";
import { selectEncouragement, selectReflectionQuestion } from "../../src/compiler/material.js";
import { makeGraph, makeSchedule } from "../helpers/compiler.js";

describe("素材載入：整檔缺席（情境 1）", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "material-load-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("reflection-bank.json 不存在 ⇒ deps.reflectionBank 缺席，不失敗", () => {
    const deps = loadCompilerDeps({ reflectionBankPath: join(dir, "missing.json") });
    expect(deps.reflectionBank).toBeUndefined();
  });

  it("encouragement.json 不存在 ⇒ deps.encouragement 缺席，不失敗", () => {
    const deps = loadCompilerDeps({ encouragementPath: join(dir, "missing.json") });
    expect(deps.encouragement).toBeUndefined();
  });
});

describe("素材載入：壞檔／不符 schema ⇒ fail loud（MUST NOT 降級為缺席）", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "material-load-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("非合法 JSON ⇒ throw 具名錯誤", () => {
    const path = join(dir, "reflection-bank.json");
    writeFileSync(path, "{ not json");
    expect(() => loadCompilerDeps({ reflectionBankPath: path })).toThrow(/reflection bank 壞檔/);
  });

  it("version 錯誤 ⇒ throw（schema 不符）", () => {
    const path = join(dir, "reflection-bank.json");
    writeFileSync(path, JSON.stringify({ version: 2, byTopic: {} }));
    expect(() => loadCompilerDeps({ reflectionBankPath: path })).toThrow(/reflection bank 壞檔/);
  });

  it("byTopic 陣列含空字串 ⇒ throw（每則 MUST 為非空字串）", () => {
    const path = join(dir, "reflection-bank.json");
    writeFileSync(path, JSON.stringify({ version: 1, byTopic: { array: [""] } }));
    expect(() => loadCompilerDeps({ reflectionBankPath: path })).toThrow(/reflection bank 壞檔/);
  });

  it("encouragement 缺 quotes 欄位 ⇒ throw", () => {
    const path = join(dir, "encouragement.json");
    writeFileSync(path, JSON.stringify({ version: 1 }));
    expect(() => loadCompilerDeps({ encouragementPath: path })).toThrow(/encouragement 壞檔/);
  });

  it("byTopic 陣列本身為空集合 ⇒ 合法（schema MUST NOT 用 min(1)，與 FR-014 降級路徑相容）", () => {
    const path = join(dir, "reflection-bank.json");
    writeFileSync(path, JSON.stringify({ version: 1, byTopic: { array: [] } }));
    const deps = loadCompilerDeps({ reflectionBankPath: path });
    expect(deps.reflectionBank).toEqual({ version: 1, byTopic: { array: [] } });
  });

  it("quotes 陣列本身為空集合 ⇒ 合法", () => {
    const path = join(dir, "encouragement.json");
    writeFileSync(path, JSON.stringify({ version: 1, quotes: [] }));
    const deps = loadCompilerDeps({ encouragementPath: path });
    expect(deps.encouragement).toEqual({ version: 1, quotes: [] });
  });
});

describe("素材選取：陣列為空／缺 Topic key ⇒ 選取層省略（情境 2、3）", () => {
  const graph = makeGraph([
    { id: "c0", topic: "test-topic", localOrder: 1 },
    { id: "c1", topic: "test-topic", localOrder: 2 },
  ]);
  const schedule = makeSchedule("foundation", [
    { sessionIndex: 1, type: "concept", conceptId: "c0" },
    { sessionIndex: 2, type: "concept", conceptId: "c1" },
    { sessionIndex: 3, type: "review", reviewRange: [1, 2] },
  ]);

  it("情境 2：檔在但該 Topic 的陣列為空集合 ⇒ selectReflectionQuestion 回傳 undefined", () => {
    const q = selectReflectionQuestion({
      bank: { version: 1, byTopic: { "test-topic": [] } },
      schedule,
      graph,
      track: "foundation",
      sessionIndex: 3,
    });
    expect(q).toBeUndefined();
  });

  it("情境 3：檔在但缺該 Topic 的 key ⇒ selectReflectionQuestion 回傳 undefined", () => {
    const q = selectReflectionQuestion({
      bank: { version: 1, byTopic: {} },
      schedule,
      graph,
      track: "foundation",
      sessionIndex: 3,
    });
    expect(q).toBeUndefined();
  });

  it("語錄池為空陣列 ⇒ selectEncouragement 回傳 undefined", () => {
    const e = selectEncouragement({
      pool: { version: 1, quotes: [] },
      schedule,
      track: "foundation",
      sessionIndex: 3,
    });
    expect(e).toBeUndefined();
  });
});
