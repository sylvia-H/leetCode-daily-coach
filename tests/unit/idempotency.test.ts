import { describe, expect, it } from "vitest";
import { emptyManifest, hashContent, shouldSkip, upsertConcept, type ConceptCheckpoint } from "../../scripts/lib/checkpoint.js";

function frozenEntry(hash: string): ConceptCheckpoint {
  return { skeletonHash: hash, skeletonFrozen: true, articleFrozen: true, gatePassed: true, needsHumanReview: false, regenCount: 1 };
}

describe("idempotency（FR-020 / SC-006）", () => {
  it("Skeleton 未變更 → 0 次重生（跳過）", () => {
    const hash = hashContent("skeleton-v1");
    const manifest = upsertConcept(emptyManifest(), "c1", frozenEntry(hash));
    expect(shouldSkip({ skeletonHash: hash, productExists: true, manifestEntry: manifest.concepts.c1 })).toBe(true);
  });

  it("--force → 即使 Skeleton 未變更也重生（force 是唯一覆蓋冪等的路徑，§20.4）", () => {
    const hash = hashContent("skeleton-v1");
    const manifest = upsertConcept(emptyManifest(), "c1", frozenEntry(hash));
    expect(
      shouldSkip({ skeletonHash: hash, productExists: true, manifestEntry: manifest.concepts.c1, force: true }),
    ).toBe(false);
  });

  it("Skeleton 變更（雜湊不符）→ 只重生該篇，其餘未變更者仍跳過（單篇隔離）", () => {
    const hashV1 = hashContent("skeleton-v1");
    const hashV2 = hashContent("skeleton-v2-手動修訂過的內容");

    let manifest = upsertConcept(emptyManifest(), "unchanged", frozenEntry(hashV1));
    manifest = upsertConcept(manifest, "changed", frozenEntry(hashV1));

    const unchangedSkip = shouldSkip({
      skeletonHash: hashV1,
      productExists: true,
      manifestEntry: manifest.concepts.unchanged,
    });
    // "changed" 的 Skeleton 內容已變動：現在算出的雜湊（hashV2）與 manifest 記錄的 hashV1 不符
    const changedSkip = shouldSkip({
      skeletonHash: hashV2,
      productExists: true,
      manifestEntry: manifest.concepts.changed,
    });

    expect(unchangedSkip).toBe(true);
    expect(changedSkip).toBe(false);
  });
});
