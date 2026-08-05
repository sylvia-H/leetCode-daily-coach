// research R8／data-model.md §2 不變式：解鎖集合 = 三個已知 Track（state.tracks 中存在者，不限
// enabledTracks）completedConceptIds 的聯集；且對同一批遞增輸入單調（已解鎖不會變回未解鎖）。
import { describe, expect, it } from "vitest";
import { computeUnlockedConceptIds } from "../../src/pages/curriculum-view.js";
import type { AppState, TrackState } from "../../src/state/state-store.js";

function makeTrackState(overrides: Partial<TrackState> = {}): TrackState {
  return {
    currentSessionIndex: 1,
    lastPushAt: null,
    completedConceptIds: [],
    history: [],
    ...overrides,
  };
}

describe("computeUnlockedConceptIds（research R8）", () => {
  it("回傳三個已知 Track completedConceptIds 的聯集", () => {
    const state: AppState = {
      tracks: {
        foundation: makeTrackState({ completedConceptIds: ["a", "b"] }),
        interviewReady: makeTrackState({ completedConceptIds: ["b", "c"] }),
        interviewMastery: makeTrackState({ completedConceptIds: [] }),
      },
    };
    expect(computeUnlockedConceptIds(state)).toEqual(new Set(["a", "b", "c"]));
  });

  it("不限 enabledTracks——只存在於 state 但目前已停用的 Track 仍計入聯集", () => {
    const state: AppState = {
      tracks: {
        foundation: makeTrackState({ completedConceptIds: ["x"] }),
      },
    };
    expect(computeUnlockedConceptIds(state)).toEqual(new Set(["x"]));
  });

  it("state.tracks 為空物件時回傳空集合", () => {
    const state: AppState = { tracks: {} };
    expect(computeUnlockedConceptIds(state)).toEqual(new Set());
  });

  it("聯集對遞增輸入單調：追加 completedConceptIds 後，既有已解鎖項目不會消失", () => {
    const before: AppState = {
      tracks: { foundation: makeTrackState({ completedConceptIds: ["a"] }) },
    };
    const after: AppState = {
      tracks: { foundation: makeTrackState({ completedConceptIds: ["a", "b"] }) },
    };
    const beforeSet = computeUnlockedConceptIds(before);
    const afterSet = computeUnlockedConceptIds(after);
    for (const id of beforeSet) {
      expect(afterSet.has(id)).toBe(true);
    }
  });

  it("純函式：同輸入呼叫兩次回傳等價集合", () => {
    const state: AppState = {
      tracks: { foundation: makeTrackState({ completedConceptIds: ["a", "b"] }) },
    };
    expect(computeUnlockedConceptIds(state)).toEqual(computeUnlockedConceptIds(state));
  });
});
