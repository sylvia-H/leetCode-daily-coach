import { describe, expect, it } from "vitest";
import { hashContent, rebuildManifest, shouldSkip } from "../../scripts/lib/checkpoint.js";

describe("resume（斷點續跑，FR-019 / SC-006）", () => {
  it("manifest 遺失時由掃描產物重建：已凍結者判定跳過，缺漏者判定續生成", () => {
    const conceptA = { id: "concept-a", skeletonContent: "skeleton A content v1" };
    const conceptB = { id: "concept-b", skeletonContent: "skeleton B content v1" };

    // 模擬中斷前的產線狀態：concept-a 已成功生成 Article 並凍結，concept-b 尚未處理（中斷點）。
    // manifest 本身遺失（例如清了 .cache/ 或換了機器），只能由掃描現存產物重建。
    const rebuilt = rebuildManifest([
      { conceptId: conceptA.id, skeletonContent: conceptA.skeletonContent, productExists: true },
      { conceptId: conceptB.id, skeletonContent: conceptB.skeletonContent, productExists: false },
    ]);

    const decisionA = shouldSkip({
      skeletonHash: hashContent(conceptA.skeletonContent),
      productExists: true,
      manifestEntry: rebuilt.concepts[conceptA.id],
    });
    const decisionB = shouldSkip({
      skeletonHash: hashContent(conceptB.skeletonContent),
      productExists: false,
      manifestEntry: rebuilt.concepts[conceptB.id],
    });

    expect(decisionA).toBe(true); // 已凍結 → 續跑時跳過，不重工
    expect(decisionB).toBe(false); // 缺漏 → 續跑只處理這篇
  });

  it("重建後的 manifest 不會因遺失而讓已凍結產物被誤判為缺漏", () => {
    const concepts = Array.from({ length: 5 }, (_, i) => ({
      conceptId: `concept-${i}`,
      skeletonContent: `skeleton content for concept ${i}`,
      productExists: i < 4, // 前 4 篇已凍結，第 5 篇為中斷點
    }));
    const rebuilt = rebuildManifest(concepts);

    const skipDecisions = concepts.map((c) =>
      shouldSkip({
        skeletonHash: hashContent(c.skeletonContent),
        productExists: c.productExists,
        manifestEntry: rebuilt.concepts[c.conceptId],
      }),
    );

    expect(skipDecisions).toEqual([true, true, true, true, false]);
  });
});
