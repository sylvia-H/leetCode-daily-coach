import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  checkCodeBlocks,
  extractCodeBlocks,
  findSectionsWithoutCode,
  hasAssertion,
  withTempDir,
  type CodeBlock,
  type CodeExecutor,
  type ExecResult,
} from "../../scripts/run-code-blocks.js";
import { makeArticleMarkdown } from "../helpers/compiler.js";

function fakeExecutor(overrides: Partial<CodeExecutor> = {}): CodeExecutor {
  const ok: ExecResult = { ok: true };
  return {
    runTypeScript: overrides.runTypeScript ?? (async () => ok),
    runPython: overrides.runPython ?? (async () => ok),
  };
}

describe("extractCodeBlocks（抽出 TypeScript/Python Tip 的 fenced code blocks）", () => {
  it("正確抽出兩個目標區塊各自的程式碼與語言標籤", () => {
    const markdown = makeArticleMarkdown({
      id: "c1",
      tsTip: "```typescript\nif (1 + 1 !== 2) throw new Error('bad');\n```",
      pyTip: "```python\nassert 1 + 1 == 2\n```",
    });
    const blocks = extractCodeBlocks(markdown);
    const sections = blocks.map((b) => b.section);
    expect(sections).toEqual(["TypeScript Tip", "Python Tip"]);
    for (const b of blocks) {
      expect(b.lang).toBe(b.section.startsWith("TypeScript") ? "typescript" : "python");
    }
  });

  it("非目標區塊（如 Digest）內的 fenced code 不被抽出", () => {
    const markdown = makeArticleMarkdown({ id: "c1", digest: "```js\nconst x = 1;\n```" });
    const blocks = extractCodeBlocks(markdown);
    expect(blocks.some((b) => b.code.includes("const x = 1"))).toBe(false);
  });
});

describe("hasAssertion（缺斷言判準，R6）", () => {
  it("TypeScript：含 throw → 通過", () => {
    expect(hasAssertion("typescript", "if (!cond) throw new Error('x');")).toBe(true);
  });
  it("TypeScript：含 node:assert → 通過", () => {
    expect(hasAssertion("typescript", "import assert from 'node:assert'; assert(true);")).toBe(true);
  });
  it("TypeScript：無 throw/assert → 不通過", () => {
    expect(hasAssertion("typescript", "const x = 1 + 1; console.log(x);")).toBe(false);
  });
  it("TypeScript：只有 console.assert → 不通過（Node 下不 throw、exit 0，不算有效斷言）", () => {
    expect(hasAssertion("typescript", "const x = 1 + 1;\nconsole.assert(x === 3, 'boom');")).toBe(false);
  });
  it("TypeScript：裸 assert( 呼叫 → 通過", () => {
    expect(hasAssertion("typescript", "assert(1 + 1 === 2);")).toBe(true);
  });
  it("Python：含 assert → 通過", () => {
    expect(hasAssertion("python", "assert 1 + 1 == 2")).toBe(true);
  });
  it("Python：無 assert → 不通過", () => {
    expect(hasAssertion("python", "print(1 + 1)")).toBe(false);
  });
});

describe("checkCodeBlocks（純邏輯，executor 注入替身）", () => {
  it("缺斷言 → missing-assertion，不呼叫 executor", async () => {
    const blocks: CodeBlock[] = [{ section: "TypeScript Tip", lang: "typescript", code: "const x = 1;" }];
    let called = false;
    const executor = fakeExecutor({ runTypeScript: async () => ((called = true), { ok: true }) });
    const results = await checkCodeBlocks(blocks, executor);
    expect(results).toEqual([{ section: "TypeScript Tip", lang: "typescript", ok: false, reason: "missing-assertion" }]);
    expect(called).toBe(false);
  });

  it("編譯/型別檢查失敗 → execution-failed，攜帶 detail", async () => {
    const blocks: CodeBlock[] = [{ section: "TypeScript Tip", lang: "typescript", code: "throw new Error('x'); const y: number = 'oops';" }];
    const executor = fakeExecutor({ runTypeScript: async () => ({ ok: false, detail: "TS2322: type mismatch" }) });
    const results = await checkCodeBlocks(blocks, executor);
    expect(results).toEqual([
      { section: "TypeScript Tip", lang: "typescript", ok: false, reason: "execution-failed", detail: "TS2322: type mismatch" },
    ]);
  });

  it("斷言失敗（執行期）→ execution-failed", async () => {
    const blocks: CodeBlock[] = [{ section: "Python Tip", lang: "python", code: "assert 1 == 2" }];
    const executor = fakeExecutor({ runPython: async () => ({ ok: false, detail: "AssertionError" }) });
    const results = await checkCodeBlocks(blocks, executor);
    expect(results[0]).toMatchObject({ ok: false, reason: "execution-failed" });
  });

  it("正確（含斷言、編譯與執行皆通過）→ 通過", async () => {
    const blocks: CodeBlock[] = [
      { section: "TypeScript Tip", lang: "typescript", code: "if (1 + 1 !== 2) throw new Error('bad');" },
      { section: "Python Tip", lang: "python", code: "assert 1 + 1 == 2" },
    ];
    const results = await checkCodeBlocks(blocks, fakeExecutor());
    expect(results.every((r) => r.ok)).toBe(true);
  });
});

describe("withTempDir（暫存資源清理，R6）", () => {
  it("fn 正常回傳後，暫存目錄已被清理", () => {
    let capturedDir = "";
    const result = withTempDir("run-code-blocks-test-", (dir) => {
      capturedDir = dir;
      expect(existsSync(dir)).toBe(true);
      return 42;
    });
    expect(result).toBe(42);
    expect(existsSync(capturedDir)).toBe(false);
  });

  it("fn 拋錯時，暫存目錄仍被清理（finally）", () => {
    let capturedDir = "";
    expect(() =>
      withTempDir("run-code-blocks-test-", (dir) => {
        capturedDir = dir;
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(existsSync(capturedDir)).toBe(false);
  });
});

describe("findSectionsWithoutCode（擋真空通過：區塊在、fence 不在）", () => {
  // 實測：Stage 2 產出的第一篇文章把語言區塊的程式碼寫成單行純文字（無 fence），
  // extractCodeBlocks 抽到 0 個區塊 → checkCodeBlocks 無失敗可報 → 生成期與 CI 雙雙回報通過。
  // 一個會回報綠燈的失效 Gate，比沒有 Gate 更危險。
  function article(sections: Record<string, string>): string {
    const body = Object.entries(sections)
      .map(([name, content]) => `## ${name}\n\n${content}\n`)
      .join("\n");
    return `---\nid: x\n---\n${body}`;
  }

  it("區塊存在但無 fenced code block → 具名列出該區塊", () => {
    const md = article({
      "TypeScript Tip": "function f() { throw new Error('x'); } f();",
      "Python Tip": "def f(): assert True",
    });
    expect(findSectionsWithoutCode(md)).toEqual(["TypeScript Tip", "Python Tip"]);
  });

  it("區塊有合法 fenced code block → 不列入", () => {
    const md = article({
      "TypeScript Tip": "```typescript\nthrow new Error('x');\n```",
      "Python Tip": "```python\nassert True\n```",
    });
    expect(findSectionsWithoutCode(md)).toEqual([]);
  });

  it("fence 存在但內容為空 → 仍列為缺失（空 block 等於沒有可測程式碼）", () => {
    expect(findSectionsWithoutCode(article({ "TypeScript Tip": "```typescript\n\n```" }))).toEqual([
      "TypeScript Tip",
    ]);
  });

  it("區塊本身不存在 → 不屬本函式職責，不列入（由 §10 固定區塊解析負責）", () => {
    expect(findSectionsWithoutCode(article({ Concept: "純文字" }))).toEqual([]);
  });
});
