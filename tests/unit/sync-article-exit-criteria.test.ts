// F12（憲章 XVII-2-2 (ii)）：Article frontmatter 的 `exit_criteria` MUST 逐字複製自 Skeleton。
// 本測試釘死同步器的三件事——(1) 一致時 MUST NOT 產生 diff（冪等，避免無謂的整檔改寫）；
// (2) 不一致時只換 `exit_criteria`，其餘 frontmatter 欄位與正文 MUST 原樣保留；
// (3) MUST 保留各檔原有行尾（工作樹混用 LF / CRLF，正規化會產生與同步無關的整檔 diff）。
import { describe, expect, it } from "vitest";
import matter from "gray-matter";
import { syncExitCriteria } from "../../scripts/sync-article-exit-criteria.js";

const BODY = ["## Concept", "", "內文一", "", "## Takeaway", "", "重點", ""].join("\n");

function makeArticle(exitCriteria: string[], eol: "\n" | "\r\n" = "\n"): string {
  const md = matter.stringify(BODY, {
    id: "demo-concept",
    title: "Demo Concept",
    module: "demo",
    pattern_label: "Demo Pattern",
    complexity_label: "O(n) / O(1)",
    estimated_minutes: 15,
    exit_criteria: exitCriteria,
  });
  return eol === "\r\n" ? md.replace(/\r?\n/g, "\r\n") : md;
}

describe("syncExitCriteria", () => {
  it("完全一致時回傳 undefined（冪等，不產生無謂 diff）", () => {
    const ec = ["能說明為何時間複雜度是 O(log n)", "能指出已排序陣列這個前提"];
    expect(syncExitCriteria(makeArticle(ec), [...ec])).toBeUndefined();
  });

  it("內容不同時改寫，且只動 exit_criteria", () => {
    const before = ["Can explain why time complexity is logarithmic."];
    const after = ["能說明為何時間複雜度是對數級 O(log n)"];
    const out = syncExitCriteria(makeArticle(before), after);
    expect(out).toBeDefined();

    const parsed = matter(out!);
    expect(parsed.data.exit_criteria).toEqual(after);
    // 其餘欄位與正文原樣保留
    expect(parsed.data.id).toBe("demo-concept");
    expect(parsed.data.title).toBe("Demo Concept");
    expect(parsed.data.pattern_label).toBe("Demo Pattern");
    expect(parsed.data.complexity_label).toBe("O(n) / O(1)");
    expect(parsed.data.estimated_minutes).toBe(15);
    expect(parsed.content.trim()).toBe(BODY.trim());
  });

  it("條數不同時也會改寫（MUST NOT 只比對第一條）", () => {
    const out = syncExitCriteria(makeArticle(["甲", "乙"]), ["甲"]);
    expect(out).toBeDefined();
    expect(matter(out!).data.exit_criteria).toEqual(["甲"]);
  });

  it("順序不同視為不一致（逐字逐位比對）", () => {
    const out = syncExitCriteria(makeArticle(["甲", "乙"]), ["乙", "甲"]);
    expect(out).toBeDefined();
    expect(matter(out!).data.exit_criteria).toEqual(["乙", "甲"]);
  });

  it("CRLF 檔案 MUST 保留 CRLF", () => {
    const out = syncExitCriteria(makeArticle(["舊"], "\r\n"), ["新"]);
    expect(out).toBeDefined();
    expect(out!.includes("\r\n")).toBe(true);
    // 不得殘留裸 LF（除 CRLF 內的那個 LF 以外）
    expect(/(?<!\r)\n/.test(out!)).toBe(false);
  });

  it("LF 檔案 MUST NOT 被轉成 CRLF", () => {
    const out = syncExitCriteria(makeArticle(["舊"], "\n"), ["新"]);
    expect(out).toBeDefined();
    expect(out!.includes("\r")).toBe(false);
  });
});
