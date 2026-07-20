import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { load } from "../../src/state/state-store.js";

describe("state-store load", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "state-load-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("檔案不存在時回傳空 tracks 並自動補建已啟用 Track，不報錯", () => {
    const stateFile = join(dir, "state.json");
    const state = load(stateFile, ["foundation"]);
    expect(state.tracks.foundation).toEqual({
      currentSessionIndex: 1,
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    });
  });

  it("缺少已啟用 Track 時自動補建初始值（FR-015）", () => {
    const stateFile = join(dir, "state.json");
    writeFileSync(
      stateFile,
      JSON.stringify({
        tracks: {
          foundation: {
            currentSessionIndex: 5,
            lastPushAt: "2026-07-19T22:07:00Z",
            completedConceptIds: ["left-right-pointer"],
            history: [],
          },
        },
      }),
    );

    const state = load(stateFile, ["foundation", "interviewReady"]);
    expect(state.tracks.foundation?.currentSessionIndex).toBe(5);
    expect(state.tracks.interviewReady).toEqual({
      currentSessionIndex: 1,
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    });
  });

  it("含未啟用 Track 的資料原樣保留", () => {
    const stateFile = join(dir, "state.json");
    writeFileSync(
      stateFile,
      JSON.stringify({
        tracks: {
          interviewMastery: {
            currentSessionIndex: 9,
            lastPushAt: "2026-07-01T00:00:00Z",
            completedConceptIds: [],
            history: [],
          },
        },
      }),
    );

    const state = load(stateFile, ["foundation"]);
    expect(state.tracks.interviewMastery?.currentSessionIndex).toBe(9);
    expect(state.tracks.foundation).toBeDefined();
  });

  it("JSON 損毀時拋錯，且原檔內容未被改動", () => {
    const stateFile = join(dir, "state.json");
    const broken = "{ this is not json";
    writeFileSync(stateFile, broken);

    expect(() => load(stateFile, ["foundation"])).toThrow();

    expect(readFileSync(stateFile, "utf-8")).toBe(broken);
  });
});
