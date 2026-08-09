// F11 quiz/{conceptId}.html 視圖組裝與 render（pages-quiz.md §3）：<details> 結構存在、
// HTML entity escape、同一 Concept 多題依宣告序呈現不重排。
import { describe, expect, it } from "vitest";
import { buildQuizPageView, renderQuizPage } from "../../src/pages/quiz-page.js";
import type { QuizItem } from "../../src/compiler/quiz.js";
import { makeGraph } from "../helpers/compiler.js";

function makeItem(overrides: Partial<QuizItem> = {}): QuizItem {
  return {
    stem: "題幹",
    options: ["選項A", "選項B", "選項C", "選項D"],
    answerIndex: 0,
    explanation: ["結論", "正解說明", "選2說明", "選3說明", "選4說明"],
    ...overrides,
  };
}

describe("buildQuizPageView（pages-quiz.md §3）", () => {
  it("組裝出 conceptId／title 與逐題 answerLabel（0-based index → 字母）", () => {
    const graph = makeGraph([{ id: "two-pointer", title: "Two Pointer" }]);
    const node = graph.concepts.get("two-pointer")!;
    const view = buildQuizPageView(node, [makeItem({ answerIndex: 2 })]);
    expect(view.conceptId).toBe("two-pointer");
    expect(view.title).toBe("Two Pointer");
    expect(view.items[0]?.answerLabel).toBe("C");
  });

  it("同一 Concept 多題依宣告序呈現，不重排", () => {
    const graph = makeGraph([{ id: "c" }]);
    const node = graph.concepts.get("c")!;
    const items = [makeItem({ stem: "第一題" }), makeItem({ stem: "第二題" }), makeItem({ stem: "第三題" })];
    const view = buildQuizPageView(node, items);
    expect(view.items.map((i) => i.stem)).toEqual(["第一題", "第二題", "第三題"]);
  });

  it("完整 5 段 explanation 全數帶入（Pages 用，區別於 Discord 只用 [0]）", () => {
    const graph = makeGraph([{ id: "c" }]);
    const node = graph.concepts.get("c")!;
    const view = buildQuizPageView(node, [makeItem()]);
    expect(view.items[0]?.explanation).toEqual(["結論", "正解說明", "選2說明", "選3說明", "選4說明"]);
  });
});

describe("renderQuizPage（pages-quiz.md §3）", () => {
  it("正解與詳解以 <details><summary> 包裹，且題幹／選項在 <summary> 前明碼呈現", () => {
    const graph = makeGraph([{ id: "c", title: "Two Pointer" }]);
    const node = graph.concepts.get("c")!;
    const view = buildQuizPageView(node, [makeItem()]);
    const html = renderQuizPage(view);
    expect(html).toContain("<details>");
    expect(html).toContain("<summary>顯示解答</summary>");
    expect(html).toContain("題幹");
    expect(html).toContain("A. 選項A");
    // 題幹於 <details> 之前出現
    expect(html.indexOf("題幹")).toBeLessThan(html.indexOf("<details>"));
  });

  it("<details> 展開內容含正解代號與完整 5 段 explanation", () => {
    const graph = makeGraph([{ id: "c" }]);
    const node = graph.concepts.get("c")!;
    const view = buildQuizPageView(node, [makeItem({ answerIndex: 1 })]);
    const html = renderQuizPage(view);
    expect(html).toContain("正解：B");
    expect(html).toContain("結論");
    expect(html).toContain("正解說明");
    expect(html).toContain("選2說明");
    expect(html).toContain("選3說明");
    expect(html).toContain("選4說明");
  });

  it("動態文字（題幹／選項／explanation）經 HTML entity escape", () => {
    const graph = makeGraph([{ id: "c" }]);
    const node = graph.concepts.get("c")!;
    const view = buildQuizPageView(node, [
      makeItem({ stem: "<script>alert(1)</script>", options: ["<b>x</b>", "y", "z", "w"] }),
    ]);
    const html = renderQuizPage(view);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<b>x</b>");
  });

  it("頁面 MUST NOT 內嵌任何 <script> 標籤（site-build-contract.md §3）", () => {
    const graph = makeGraph([{ id: "c" }]);
    const node = graph.concepts.get("c")!;
    const view = buildQuizPageView(node, [makeItem()]);
    const html = renderQuizPage(view);
    expect(html).not.toContain("<script");
  });

  it("為合法的 HTML5 文件（含 <!doctype html>），沿用既有 renderPage() 外殼", () => {
    const graph = makeGraph([{ id: "c" }]);
    const node = graph.concepts.get("c")!;
    const view = buildQuizPageView(node, [makeItem()]);
    const html = renderQuizPage(view);
    expect(html.trim().toLowerCase().startsWith("<!doctype html>")).toBe(true);
  });

  it("純函式：同輸入呼叫兩次得到逐字元相同的輸出", () => {
    const graph = makeGraph([{ id: "c" }]);
    const node = graph.concepts.get("c")!;
    const view = buildQuizPageView(node, [makeItem()]);
    expect(renderQuizPage(view)).toBe(renderQuizPage(view));
  });
});
