// F12（憲章 XVII 一次性重生例外）：重生工具的純邏輯單測。
// 涵蓋 scripts/gate-articles.ts 的引數解析與 scripts/merge-quiz-fragments.ts 的片段驗證，
// 並以靜態檢查守住兩支腳本的「執行守衛」——少了守衛，任何 import 都會真的跑起 Gate／寫入題庫。
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseArgs } from "../../scripts/gate-articles.js";
import { parseFragmentItems } from "../../scripts/merge-quiz-fragments.js";

function item(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    stem: "雜湊表的平均查詢複雜度為何？",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    answerIndex: 0,
    explanation: ["平均為 O(1)。", "雜湊函式直接定位桶位。", "O(log n) 是平衡樹。", "O(n) 是線性掃描。", "O(n log n) 是比較排序。"],
    ...overrides,
  };
}

describe("gate-articles parseArgs（F12 逐篇 Gate CLI）", () => {
  it("--only 以逗號分隔多個 conceptId", () => {
    expect(parseArgs(["--only", "a,b,c"])).toEqual({ ids: ["a", "b", "c"], all: false, skipQuiz: false });
  });

  it("--only=... 等號形式與空白形式等價", () => {
    expect(parseArgs(["--only=a,b"]).ids).toEqual(["a", "b"]);
  });

  it("過濾空項與前後空白（避免 'a,,b' 產生空字串 id 而誤報 unknown-concept）", () => {
    expect(parseArgs(["--only", " a , , b "]).ids).toEqual(["a", "b"]);
  });

  it("裸引數視為 conceptId", () => {
    expect(parseArgs(["a", "b"]).ids).toEqual(["a", "b"]);
  });

  it("--all 與 --skip-quiz 各自生效且不被當成 conceptId", () => {
    const r = parseArgs(["--all", "--skip-quiz"]);
    expect(r).toEqual({ ids: [], all: true, skipQuiz: true });
  });
});

describe("merge-quiz-fragments parseFragmentItems（F12 片段驗證）", () => {
  const CID = "hash-table-concept-introduction";

  it("合法片段回傳逐題資料", () => {
    const items = parseFragmentItems({ items: [item()] }, CID, "x.json");
    expect(items).toHaveLength(1);
    expect(items[0]!.answerIndex).toBe(0);
  });

  it("缺 items 欄位 ⇒ 具名為外層形狀錯誤", () => {
    expect(() => parseFragmentItems({ quiz: [] }, CID, "x.json")).toThrow(/片段外層形狀不符/);
  });

  it("多餘的頂層欄位 ⇒ strict schema 擋下（防 agent 夾帶自訂欄位靜默進入題庫）", () => {
    expect(() => parseFragmentItems({ items: [item()], note: "hi" }, CID, "x.json")).toThrow(/片段外層形狀不符/);
  });

  it("options 不是恰 4 個 ⇒ 題目 schema 錯誤", () => {
    expect(() => parseFragmentItems({ items: [item({ options: ["a", "b", "c"] })] }, CID, "x.json")).toThrow(
      /題目 schema 不符/,
    );
  });

  it("explanation 不是恰 5 段 ⇒ 題目 schema 錯誤（[0] 結論句 + 正解 + 三個錯項）", () => {
    expect(() => parseFragmentItems({ items: [item({ explanation: ["a", "b", "c", "d"] })] }, CID, "x.json")).toThrow(
      /題目 schema 不符/,
    );
  });

  it("answerIndex 超出 0..3 ⇒ 題目 schema 錯誤", () => {
    expect(() => parseFragmentItems({ items: [item({ answerIndex: 4 })] }, CID, "x.json")).toThrow(/題目 schema 不符/);
  });

  it("錯誤訊息帶入檔名標籤，便於在一批多檔中定位", () => {
    expect(() => parseFragmentItems({ items: [item({ answerIndex: 9 })] }, CID, "foo.json")).toThrow(/foo\.json/);
  });
});

describe("F12 腳本的執行守衛（MUST NOT 移除）", () => {
  // 少了守衛，任何 import（包含本測試檔）都會讓 CLI 的 main() 在 import 期間執行：
  // gate-articles 會跑起整套 Gate 並可能 process.exit，merge-quiz-fragments 會直接寫 data/quiz-bank.json。
  it.each([
    ["scripts/gate-articles.ts", "gate-articles.ts"],
    ["scripts/merge-quiz-fragments.ts", "merge-quiz-fragments.ts"],
  ])("%s 僅在被當作進入點時才執行 main()", (path, basename) => {
    const src = readFileSync(path, "utf-8");
    expect(src).toContain(`process.argv[1]?.endsWith("${basename}")`);
  });
});
