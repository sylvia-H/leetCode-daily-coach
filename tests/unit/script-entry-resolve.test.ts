// Smoke test：scripts/ 以 createRequire 解析的 CLI 進入點，升級相依後仍須解析得到實際存在的檔案。
//
// 為何需要：這些解析都在模組頂層執行，一旦套件的 `exports` 收緊（例如 vitest 4 拿掉 `"./*"`），
// 整支腳本在 import 階段就 ERR_PACKAGE_PATH_NOT_EXPORTED，而 CI 的單元測試照樣全綠——
// `verify:phase` 就這樣在 vitest 2 → 4 時靜默失效。直接 import 腳本本身的常數，檢查的是實際程式的解析結果，
// 不是另抄一份路徑字串。
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TSC_ENTRY, TSX_ENTRY } from "../../scripts/run-code-blocks.js";
import { resolveBinEntry, TSX, VITEST } from "../../scripts/verify-phase.js";

describe("scripts 的 CLI 進入點解析（相依升級 smoke test）", () => {
  it.each([
    ["run-code-blocks.ts 的 typescript/bin/tsc", TSC_ENTRY],
    ["run-code-blocks.ts 的 tsx/cli", TSX_ENTRY],
    ["verify-phase.ts 的 tsx/cli", TSX],
    ["verify-phase.ts 的 vitest 進入點", VITEST],
  ])("%s 解析成實際存在的檔案", (_label, entry) => {
    expect(existsSync(entry)).toBe(true);
  });

  it("套件沒有對應的 bin 時明確報錯，不回傳不存在的路徑", () => {
    expect(() => resolveBinEntry("vitest", "no-such-bin")).toThrow(/bin\.no-such-bin/);
  });
});
