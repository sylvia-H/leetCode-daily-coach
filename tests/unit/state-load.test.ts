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

    // F6 FR-022／state-schema.md §1：completedAt 為選填欄位。
    it("completedAt 缺席或 null 皆視為未完課，載入成功", () => {
      const stateFile = join(dir, "state.json");
      writeTrack(stateFile, validTrack);
      expect(() => load(stateFile, ["foundation"])).not.toThrow();

      writeTrack(stateFile, { ...validTrack, completedAt: null });
      const state = load(stateFile, ["foundation"]);
      expect(state.tracks.foundation?.completedAt).toBeNull();
    });

    it("completedAt 非法值（無法解析的字串）視為欄位語意損毀，且原檔未被改動", () => {
      const stateFile = join(dir, "state.json");
      const raw = writeTrack(stateFile, { ...validTrack, completedAt: "not-a-date" });
      expect(() => load(stateFile, ["foundation"])).toThrow(/completedAt/);
      expect(readFileSync(stateFile, "utf-8")).toBe(raw);
    });

    it("completedAt 為合法 ISO 字串時正常載入", () => {
      const stateFile = join(dir, "state.json");
      writeTrack(stateFile, { ...validTrack, completedAt: "2026-08-06T22:07:12Z" });
      const state = load(stateFile, ["foundation"]);
      expect(state.tracks.foundation?.completedAt).toBe("2026-08-06T22:07:12Z");
    });

    // FR-033：向後相容——現行不含 completedAt 的 state.json 形狀 MUST 能直接載入成功且不需遷移。
    it("FR-033 向後相容：不含 completedAt 的既有 state.json 形狀載入成功", () => {
      const stateFile = join(dir, "state.json");
      writeTrack(stateFile, validTrack);
      const state = load(stateFile, ["foundation"]);
      expect(state.tracks.foundation).toEqual(validTrack);
      expect("completedAt" in (state.tracks.foundation as object)).toBe(false);
    });

    it("未啟用 Track 的 completedAt 原樣保留", () => {
      const stateFile = join(dir, "state.json");
      writeFileSync(
        stateFile,
        JSON.stringify({
          tracks: { interviewMastery: { ...validTrack, completedAt: "2026-08-06T22:07:12Z" } },
        }),
      );
      const state = load(stateFile, ["foundation"]);
      expect(state.tracks.interviewMastery?.completedAt).toBe("2026-08-06T22:07:12Z");
    });
  });

  // F6 FR-031（state-schema.md §4）：tracks 中出現不屬於三個已知 Track 的鍵 MUST 判為欄位語意損毀。
  describe("未知 Track 鍵（FR-031）視為全域失敗", () => {
    it("tracks 含未知鍵（如打錯字的 interviewready）時 load() 拋錯且錯誤訊息含該鍵名", () => {
      const stateFile = join(dir, "state.json");
      const raw = JSON.stringify({
        tracks: {
          interviewready: {
            currentSessionIndex: 1,
            lastPushAt: null,
            completedConceptIds: [],
            history: [],
          },
        },
      });
      writeFileSync(stateFile, raw);

      expect(() => load(stateFile, ["foundation"])).toThrow(/interviewready/);
      // 原檔未被覆寫（save() 未被呼叫）。
      expect(readFileSync(stateFile, "utf-8")).toBe(raw);
    });

    it("三個已知 Track 齊備時 MUST NOT 誤判為未知鍵", () => {
      const stateFile = join(dir, "state.json");
      writeFileSync(
        stateFile,
        JSON.stringify({
          tracks: {
            foundation: { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] },
            interviewReady: { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] },
            interviewMastery: { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] },
          },
        }),
      );
      expect(() => load(stateFile, ["foundation"])).not.toThrow();
    });

    it("FR-031 封閉清單邊界：清單以外的內容差異（例如多餘的頂層鍵）MUST NOT 判為損毀", () => {
      const stateFile = join(dir, "state.json");
      writeFileSync(
        stateFile,
        JSON.stringify({
          tracks: {
            foundation: { currentSessionIndex: 1, lastPushAt: null, completedConceptIds: [], history: [] },
          },
          // 頂層多餘的未知鍵：非本清單規範的對象，MUST NOT 觸發損毀判定。
          someExtraTopLevelField: "不影響載入",
        }),
      );
      expect(() => load(stateFile, ["foundation"])).not.toThrow();
    });
  });
});
