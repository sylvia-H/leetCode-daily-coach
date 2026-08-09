// SC-007／site-build-contract.md §2：buildSite() 為純函式，同一 SiteBuildInput 呼叫 100 次
// MUST 得到逐 byte 相同的 SiteOutput（沿用 F8 100 次重複編譯的既有驗證模式）。
import { describe, expect, it } from "vitest";
import { buildSite, type SiteBuildInput } from "../../src/pages/site.js";
import type { AppState } from "../../src/state/state-store.js";
import { makeArticleMarkdown, makeCompilerDeps, makeProblem } from "../../tests/helpers/compiler.js";

const BASE_URL = "https://example.github.io/leetcode-daily-coach";

function makeInput(): SiteBuildInput {
  const deps = makeCompilerDeps({
    concepts: [
      { id: "concept-a", title: "Concept A", localOrder: 1, leetcode: [1] },
      { id: "concept-b", title: "Concept B", localOrder: 2, prerequisite: ["concept-a"], leetcode: [] },
    ],
    problems: [makeProblem({ id: 1, title: "Problem One" })],
    schedules: {
      foundation: [
        { sessionIndex: 1, type: "concept", conceptId: "concept-a", problemIds: [1] },
        { sessionIndex: 2, type: "concept", conceptId: "concept-b" },
        { sessionIndex: 3, type: "review", reviewRange: [1, 2] },
      ],
      interviewReady: [],
      interviewMastery: [],
    },
    articles: {
      "articles/test-topic/001-concept-a.md": makeArticleMarkdown({
        id: "concept-a",
        title: "Concept A",
        challenge: [{ id: 1, why: "why 1" }],
      }),
      "articles/test-topic/002-concept-b.md": makeArticleMarkdown({ id: "concept-b", title: "Concept B" }),
    },
  });

  const state: AppState = {
    tracks: {
      foundation: {
        currentSessionIndex: 3,
        lastPushAt: "2026-08-02T00:00:00.000Z",
        completedConceptIds: ["concept-a", "concept-b"],
        history: [
          { sessionIndex: 1, conceptId: "concept-a", pushedAt: "2026-08-01T00:00:00.000Z" },
          { sessionIndex: 2, conceptId: "concept-b", pushedAt: "2026-08-02T00:00:00.000Z" },
        ],
      },
      interviewReady: {
        currentSessionIndex: 1,
        lastPushAt: null,
        completedConceptIds: [],
        history: [],
      },
    },
  };

  return { deps, state, enabledTracks: ["foundation", "interviewReady"], baseUrl: BASE_URL };
}

function serializeOutput(output: Map<string, string>): string {
  return JSON.stringify([...output.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

describe("buildSite determinism（SC-007）", () => {
  it("同一 SiteBuildInput 連續呼叫 100 次，SiteOutput 全部鍵值逐 byte 相同", () => {
    const input = makeInput();
    const baseline = serializeOutput(buildSite(input));
    for (let i = 0; i < 100; i++) {
      expect(serializeOutput(buildSite(input))).toBe(baseline);
    }
  });

  it("輸出至少含 index.html／articles/*.html／feed.xml／per-track feed", () => {
    const output = buildSite(makeInput());
    expect(output.has("index.html")).toBe(true);
    expect(output.has("articles/concept-a.html")).toBe(true);
    expect(output.has("articles/concept-b.html")).toBe(true);
    expect(output.has("feed.xml")).toBe(true);
    expect(output.has("feed-foundation.xml")).toBe(true);
    expect(output.has("feed-interview-ready.xml")).toBe(true);
  });
});

describe("buildSite — F11 quiz 頁（pages-quiz.md §2／§4）", () => {
  const quizItem = {
    stem: "題幹",
    options: ["a", "b", "c", "d"] as [string, string, string, string],
    answerIndex: 0 as const,
    explanation: ["結論", "1", "2", "3", "4"] as [string, string, string, string, string],
  };

  function makeInputWithQuizBank() {
    const base = makeInput();
    // 額外加入一個未解鎖的 Concept（concept-c），驗證範圍限 unlockedIds（research R7）。
    base.deps.graph.concepts.set("concept-c", {
      ...base.deps.graph.concepts.get("concept-a")!,
      id: "concept-c",
      title: "Concept C",
      localOrder: 3,
    });
    base.deps.graph.ordinalOf.set("concept-c", { moduleIndex: 0, topicIndex: 0, localOrder: 3, id: "concept-c" });
    base.deps.quizBank = {
      version: 1,
      byConcept: {
        "concept-a": [quizItem, quizItem, quizItem],
        "concept-b": [], // 已解鎖但題庫為空 ⇒ 不產出 quiz 頁
        "concept-c": [quizItem, quizItem, quizItem], // 未解鎖 ⇒ 不產出 quiz 頁
      },
    };
    return base;
  }

  it("quiz/*.html 只對 unlockedIds 且題庫非空的 Concept 產出", () => {
    const output = buildSite(makeInputWithQuizBank());
    expect(output.has("quiz/concept-a.html")).toBe(true);
    expect(output.has("quiz/concept-b.html")).toBe(false);
    expect(output.has("quiz/concept-c.html")).toBe(false);
  });

  it("quizBank 缺席時完全不產出任何 quiz/*.html", () => {
    const output = buildSite(makeInput());
    expect([...output.keys()].some((k) => k.startsWith("quiz/"))).toBe(false);
  });

  it("同一 SiteBuildInput 連續呼叫 100 次，quiz/*.html byte-identical", () => {
    const input = makeInputWithQuizBank();
    const baseline = serializeOutput(buildSite(input));
    for (let i = 0; i < 100; i++) {
      expect(serializeOutput(buildSite(input))).toBe(baseline);
    }
  });
});
