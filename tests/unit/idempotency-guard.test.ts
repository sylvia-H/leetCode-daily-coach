import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { run } from "../../src/main.js";
import type { ConceptLesson } from "../../src/types/lesson.js";

import { makeConceptLesson, makeLessonConcept } from "../helpers/lesson.js";

function makeLesson(overrides: Partial<ConceptLesson> = {}): ConceptLesson {
  return makeConceptLesson({
    color: 1,
    concept: makeLessonConcept({
      id: "left-right-pointer",
      title: "Left-Right Pointer",
      digest: "d",
      tsTip: "t",
      pyTip: "p",
      takeaway: "tk",
      exitCriteria: ["c1"],
      patternLabel: "Two Pointer",
      complexityLabel: "O(n)",
      estimatedMinutes: 15,
      articlePath: "articles/x.md",
    }),
    ...overrides,
  });
}

function writeState(stateFile: string, lastPushAt: string | null): void {
  writeFileSync(
    stateFile,
    JSON.stringify({
      tracks: {
        foundation: {
          currentSessionIndex: 1,
          lastPushAt,
          completedConceptIds: [],
          history: [],
        },
      },
    }),
  );
}

describe("per-track idempotency guard", () => {
  let dir: string;
  let stateFile: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "idempotency-"));
    stateFile = join(dir, "state.json");
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 204 }));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const env = () => ({
    DISCORD_WEBHOOK_URL_FOUNDATION: "https://discord.com/api/webhooks/1/aaa",
    STATE_FILE: stateFile,
  });

  it("lastPushAt 的台北日 == 今天 → 跳過該 Track 且不視為失敗（exit 0）", async () => {
    writeState(stateFile, new Date().toISOString());
    const pushTrack = vi.fn();

    const exitCode = await run(env(), { pushTrack });

    expect(pushTrack).not.toHaveBeenCalled();
    expect(exitCode).toBe(0);
  });

  it("lastPushAt 為昨天 → 正常推播", async () => {
    const yesterday = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();
    writeState(stateFile, yesterday);
    const pushTrack = vi.fn().mockResolvedValue(makeLesson());

    const exitCode = await run(env(), { pushTrack });

    expect(pushTrack).toHaveBeenCalledTimes(1);
    expect(exitCode).toBe(0);
  });

  it("lastPushAt 為 null（新 Track）→ 放行", async () => {
    writeState(stateFile, null);
    const pushTrack = vi.fn().mockResolvedValue(makeLesson());

    const exitCode = await run(env(), { pushTrack });

    expect(pushTrack).toHaveBeenCalledTimes(1);
    expect(exitCode).toBe(0);
  });

  it("FORCE=true 時繞過 guard，即使今天已推播過仍照常寫入狀態（FR-021）", async () => {
    writeState(stateFile, new Date().toISOString());
    const pushTrack = vi.fn().mockResolvedValue(makeLesson());

    const exitCode = await run({ ...env(), FORCE: "true" }, { pushTrack });

    expect(pushTrack).toHaveBeenCalledTimes(1);
    expect(exitCode).toBe(0);
  });
});
