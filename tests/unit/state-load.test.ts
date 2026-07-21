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

  // JSON 合法但欄位語意損毀 → 比照「JSON 解析失敗」視為全域失敗（cli-contract.md §4）。
  describe("欄位語意損毀（JSON 合法）視為全域失敗", () => {
    const writeTrack = (stateFile: string, trackState: unknown) => {
      const raw = JSON.stringify({ tracks: { foundation: trackState } });
      writeFileSync(stateFile, raw);
      return raw;
    };

    const validTrack = {
      currentSessionIndex: 1,
      lastPushAt: null,
      completedConceptIds: [],
      history: [],
    };

    it("currentSessionIndex 為字串時拋出指名該欄位的錯誤，且原檔未被改動", () => {
      const stateFile = join(dir, "state.json");
      // 未擋下時 advance() 會做 "3" + 1 === "31" 並寫回檔案，造成無聲的進度毀損。
      const raw = writeTrack(stateFile, { ...validTrack, currentSessionIndex: "3" });

      expect(() => load(stateFile, ["foundation"])).toThrow(/currentSessionIndex/);
      expect(readFileSync(stateFile, "utf-8")).toBe(raw);
    });

    it("currentSessionIndex 為 0 或非整數時拋錯", () => {
      const stateFile = join(dir, "state.json");
      writeTrack(stateFile, { ...validTrack, currentSessionIndex: 0 });
      expect(() => load(stateFile, ["foundation"])).toThrow(/currentSessionIndex/);

      writeTrack(stateFile, { ...validTrack, currentSessionIndex: 1.5 });
      expect(() => load(stateFile, ["foundation"])).toThrow(/currentSessionIndex/);
    });

    it("lastPushAt 不可解析時拋出指名該欄位的錯誤，且原檔未被改動", () => {
      const stateFile = join(dir, "state.json");
      // 未擋下時日期 guard 的 Intl 格式化會對 Invalid Date 丟 RangeError，且該處在 try 之外，
      // 會使整輪執行中止、失敗隔離完全失效。
      const raw = writeTrack(stateFile, { ...validTrack, lastPushAt: "2026-13-45T99:99:99Z" });

      expect(() => load(stateFile, ["foundation"])).toThrow(/lastPushAt/);
      expect(readFileSync(stateFile, "utf-8")).toBe(raw);
    });

    it("lastPushAt 為空字串或非日期文字時亦拋錯", () => {
      const stateFile = join(dir, "state.json");
      for (const bad of ["", "yesterday", "not-a-date"]) {
        writeTrack(stateFile, { ...validTrack, lastPushAt: bad });
        expect(() => load(stateFile, ["foundation"])).toThrow(/lastPushAt/);
      }
    });

    it("V8 可解析的寬鬆日期格式（如 '2026-07-20 06:07'）予以放行，不視為損毀", () => {
      const stateFile = join(dir, "state.json");
      writeTrack(stateFile, { ...validTrack, lastPushAt: "2026-07-20 06:07" });
      expect(() => load(stateFile, ["foundation"])).not.toThrow();
    });

    it("completedConceptIds / history 非陣列時拋出指名該欄位的錯誤", () => {
      const stateFile = join(dir, "state.json");
      writeTrack(stateFile, { ...validTrack, completedConceptIds: "left-right-pointer" });
      expect(() => load(stateFile, ["foundation"])).toThrow(/completedConceptIds/);

      writeTrack(stateFile, { ...validTrack, history: {} });
      expect(() => load(stateFile, ["foundation"])).toThrow(/history/);
    });

    it("未啟用 Track 的資料損毀時同樣視為全域失敗（它仍會被 save 重新序列化）", () => {
      const stateFile = join(dir, "state.json");
      writeFileSync(
        stateFile,
        JSON.stringify({ tracks: { interviewMastery: { ...validTrack, currentSessionIndex: "9" } } }),
      );

      expect(() => load(stateFile, ["foundation"])).toThrow(/interviewMastery/);
    });

    it("lastPushAt 為合法 ISO 字串或 null 時正常載入", () => {
      const stateFile = join(dir, "state.json");
      writeTrack(stateFile, { ...validTrack, lastPushAt: "2026-07-20T22:07:31Z" });
      expect(() => load(stateFile, ["foundation"])).not.toThrow();

      writeTrack(stateFile, validTrack);
      expect(() => load(stateFile, ["foundation"])).not.toThrow();
    });

    it("最外層或 tracks 非物件時拋錯", () => {
      const stateFile = join(dir, "state.json");
      writeFileSync(stateFile, "null");
      expect(() => load(stateFile, ["foundation"])).toThrow(/最外層/);

      writeFileSync(stateFile, JSON.stringify({ tracks: [] }));
      expect(() => load(stateFile, ["foundation"])).toThrow(/tracks/);
    });
  });
});
