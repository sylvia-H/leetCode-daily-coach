import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/main.js";
import { load, save } from "../../src/state/state-store.js";
import type { Lesson } from "../../src/types/lesson.js";

function makeLesson(): Lesson {
  return {
    sessionIndex: 1,
    type: "concept",
    track: "foundation",
    concept: {
      id: "left-right-pointer",
      title: "Left-Right Pointer",
      moduleColor: 1,
      digest: "d",
      tsTip: "t",
      pyTip: "p",
      takeaway: "tk",
      exitCriteria: ["c1"],
      patternLabel: "Two Pointer",
      complexityLabel: "O(n)",
      estimatedMinutes: 15,
      articlePath: "articles/x.md",
    },
    problems: [],
    path: { current: "Left-Right Pointer" },
  };
}

describe("save — 序列化格式", () => {
  let dir: string;
  let stateFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "state-save-"));
    stateFile = join(dir, "state.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("以 2 空格縮排序列化，且結尾有換行", () => {
    const state = load(stateFile, ["foundation"]);
    save(stateFile, state);

    const raw = readFileSync(stateFile, "utf-8");
    expect(raw.endsWith("\n")).toBe(true);
    expect(raw).toContain('  "tracks"');
  });

  it("Track 鍵順序固定為 foundation → interviewReady → interviewMastery", () => {
    const state = load(stateFile, ["interviewMastery", "foundation", "interviewReady"]);
    save(stateFile, state);

    const raw = readFileSync(stateFile, "utf-8");
    const order = ["foundation", "interviewReady", "interviewMastery"].map((t) => raw.indexOf(`"${t}"`));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("只寫檔，不包含任何 git 相關副作用", () => {
    const state = load(stateFile, ["foundation"]);
    expect(() => save(stateFile, state)).not.toThrow();
    expect(existsSync(join(dir, ".git"))).toBe(false);
  });
});

describe("save — 全部 Track 處理完只呼叫一次（FR-016）與部分成功仍存檔（憲章 XV）", () => {
  let dir: string;
  let stateFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "state-save-run-"));
    stateFile = join(dir, "state.json");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("兩個 Track（一敗一成）處理完後，state.json 只反映一次寫檔結果：成功者前進、失敗者不變", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchMock);

    const exitCode = await run(
      {
        DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
        DISCORD_WEBHOOK_URL_INTERVIEW_READY: "https://discord.com/api/webhooks/2/bbb",
        STATE_FILE: stateFile,
      },
      {
        pushTrack: async (track) => {
          if (track === "foundation") {
            throw new Error("推播失敗：HTTP 500");
          }
          return makeLesson();
        },
      },
    );

    expect(exitCode).toBe(1);
    const saved = JSON.parse(readFileSync(stateFile, "utf-8")) as {
      tracks: Record<string, { currentSessionIndex: number }>;
    };
    expect(saved.tracks.foundation?.currentSessionIndex).toBe(1);
    expect(saved.tracks.interviewReady?.currentSessionIndex).toBe(2);
  });
});
