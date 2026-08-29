// D1 迴歸測試（specs/012-content-regeneration/pipeline-defects.md）：Stage 2 的 Tomorrow Preview
// 必須由 Skeleton `next` 決定，而非由模型自行發明。
//
// 這是一組**內容契約**測試：驗證 prompt 真的把後繼 Concept 與對應規則送進去了。少了它，
// 有人日後重構 prompt 時把這段拿掉，缺陷會無聲重現——而該缺陷本身沒有任何機械 Gate 擋得住
// （教材只要 Tomorrow Preview 非空即通過），實測 14 篇中 13 篇因此寫錯。
import { describe, expect, it } from "vitest";
import { buildStage2Prompt, type Stage2PromptInput } from "../../scripts/lib/prompts/stage2-content.js";
import { buildSelfCheckPrompt } from "../../scripts/lib/prompts/self-check.js";

function input(overrides: Partial<Stage2PromptInput> = {}): Stage2PromptInput {
  return {
    conceptId: "hash-table-concept-introduction",
    title: "Hash Table Concept Introduction",
    patternLabel: "Key-Value Mapping",
    complexityLabel: "O(1) / O(n)",
    learningGoal: ["理解雜湊表的平均 O(1) 查詢"],
    exitCriteria: ["能說明碰撞與負載因子的關係"],
    authorHints: "- 核心觀念：雜湊函式把 key 映射到桶位。",
    candidateProblems: [{ id: 1 }],
    nextConcepts: [],
    ...overrides,
  };
}

const WITH_NEXT = [
  { id: "hash-table-frequency-counting", title: "Frequency Counting with Hash Map", patternLabel: "Counting" },
  { id: "hash-table-complement-lookup", title: "Complement Lookup", patternLabel: "Complement" },
];

describe("buildStage2Prompt — Tomorrow Preview 的依據（D1 迴歸）", () => {
  it("後繼非空時，prompt 逐一列出 id / title / Pattern", () => {
    const p = buildStage2Prompt(input({ nextConcepts: WITH_NEXT }));
    for (const n of WITH_NEXT) {
      expect(p).toContain(n.id);
      expect(p).toContain(n.title);
      expect(p).toContain(n.patternLabel);
    }
  });

  it("明示 tomorrowPreview MUST 只依後繼撰寫，MUST NOT 自行發明", () => {
    const p = buildStage2Prompt(input({ nextConcepts: WITH_NEXT }));
    expect(p).toContain("tomorrowPreview MUST 只依上方「後繼 Concept」撰寫");
    expect(p).toContain("MUST NOT 憑印象自行發明下一課主題");
  });

  it("明示不得預告更早出現過的主題（實測最常見的錯誤樣態）", () => {
    const p = buildStage2Prompt(input({ nextConcepts: WITH_NEXT }));
    expect(p).toContain("包含課程中更早出現過的主題");
  });

  it("後繼為空時標示「無後繼」並要求寫成收尾語、不得點名 Concept", () => {
    const p = buildStage2Prompt(input({ nextConcepts: [] }));
    expect(p).toContain("（無後繼——本 Concept 為該路徑終點）");
    expect(p).toContain("MUST NOT 點名任何 Concept");
  });

  it("後繼為空時，prompt 不會混入任何後繼條目行", () => {
    // 實測缺陷：array-move-zeroes 的 next 是空清單，舊教材仍預告了一門不存在的課。
    const p = buildStage2Prompt(input({ nextConcepts: [] }));
    expect(p).not.toContain("Pattern: Counting");
  });
});

describe("buildSelfCheckPrompt — 第 4 項檢查（D1 迴歸）", () => {
  const base = {
    conceptId: "c",
    title: "T",
    patternLabel: "P",
    complexityLabel: "O(1) / O(1)",
    articleMarkdown: "---\nid: c\n---\n## Concept\n內容",
  };

  it("把後繼 title 帶入審查提問", () => {
    const p = buildSelfCheckPrompt({ ...base, nextTitles: ["Frequency Counting with Hash Map"] });
    expect(p).toContain("Tomorrow Preview 是否與下列後繼 Concept 相符");
    expect(p).toContain("Frequency Counting with Hash Map");
    expect(p).toContain("四項檢查");
  });

  it("無後繼時要求檢查是否誤作承諾", () => {
    const p = buildSelfCheckPrompt({ ...base, nextTitles: [] });
    expect(p).toContain("無後繼");
    expect(p).toContain("不得點名任何 Concept");
  });
});
