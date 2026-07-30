import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  type ConceptCheckpoint,
  emptyManifest,
  hashContent,
  loadManifest,
  rebuildManifest,
  saveManifest,
  shouldSkip,
  upsertConcept,
} from "../../scripts/lib/checkpoint.js";

function frozenEntry(hash: string): ConceptCheckpoint {
  return { skeletonHash: hash, skeletonFrozen: true, articleFrozen: true, gatePassed: true, needsHumanReview: false, regenCount: 0 };
}

describe("checkpoint（scripts/lib/checkpoint.ts，R4 / FR-019/020）", () => {
  describe("shouldSkip（純判斷）", () => {
    it("凍結且未變更（雜湊一致 + 產物存在 + 過 Gate）→ 跳過", () => {
      const hash = hashContent("skeleton v1");
      expect(shouldSkip({ skeletonHash: hash, productExists: true, manifestEntry: frozenEntry(hash) })).toBe(true);
    });

    it("雜湊不符（Skeleton 已變更）→ 不跳過（只重生該篇）", () => {
      const oldHash = hashContent("skeleton v1");
      const newHash = hashContent("skeleton v2");
      expect(shouldSkip({ skeletonHash: newHash, productExists: true, manifestEntry: frozenEntry(oldHash) })).toBe(false);
    });

    it("--force → 一律不跳過，即使雜湊一致", () => {
      const hash = hashContent("skeleton v1");
      expect(shouldSkip({ skeletonHash: hash, productExists: true, manifestEntry: frozenEntry(hash), force: true })).toBe(false);
    });

    it("產物不存在 → 不跳過", () => {
      const hash = hashContent("skeleton v1");
      expect(shouldSkip({ skeletonHash: hash, productExists: false, manifestEntry: frozenEntry(hash) })).toBe(false);
    });

    it("無 manifest 紀錄 → 不跳過", () => {
      const hash = hashContent("skeleton v1");
      expect(shouldSkip({ skeletonHash: hash, productExists: true })).toBe(false);
    });

    it("manifest 有紀錄但尚未過 Gate（gatePassed=false）→ 不跳過", () => {
      const hash = hashContent("skeleton v1");
      const entry = { ...frozenEntry(hash), gatePassed: false };
      expect(shouldSkip({ skeletonHash: hash, productExists: true, manifestEntry: entry })).toBe(false);
    });
  });

  describe("rebuildManifest（manifest 遺失時由掃描產物重建）", () => {
    it("依現存產物重建 checkpoint：雜湊重算、articleFrozen/gatePassed 依產物存在與否", () => {
      const manifest = rebuildManifest([
        { conceptId: "array-traversal", skeletonContent: "content-a", productExists: true },
        { conceptId: "in-place-operations", skeletonContent: "content-b", productExists: false },
      ]);
      expect(manifest.version).toBe(1);
      expect(manifest.concepts["array-traversal"]).toEqual({
        skeletonHash: hashContent("content-a"),
        skeletonFrozen: true,
        articleFrozen: true,
        gatePassed: true,
        needsHumanReview: false,
        regenCount: 0,
      });
      expect(manifest.concepts["in-place-operations"]?.articleFrozen).toBe(false);
      expect(manifest.concepts["in-place-operations"]?.gatePassed).toBe(false);
    });
  });

  describe("upsertConcept", () => {
    it("回傳新 manifest（不改動原物件），覆蓋指定 conceptId 的紀錄", () => {
      const original = emptyManifest();
      const hash = hashContent("x");
      const updated = upsertConcept(original, "array-traversal", frozenEntry(hash));
      expect(original.concepts).toEqual({});
      expect(updated.concepts["array-traversal"]).toEqual(frozenEntry(hash));
    });
  });

  describe("load/saveManifest（I/O 邊界）", () => {
    let dir: string;
    afterEach(() => {
      if (dir) rmSync(dir, { recursive: true, force: true });
    });

    it("manifest 檔不存在 → loadManifest 回傳空 manifest（不 throw）", () => {
      dir = mkdtempSync(join(tmpdir(), "checkpoint-test-"));
      const path = join(dir, "nonexistent.json");
      expect(loadManifest(path)).toEqual(emptyManifest());
    });

    it("manifest 檔損毀（壞 JSON）→ loadManifest 回傳空 manifest（容許重建，不 throw）", () => {
      dir = mkdtempSync(join(tmpdir(), "checkpoint-test-"));
      const path = join(dir, "manifest.json");
      writeFileSync(path, "{ not valid json", "utf-8");
      expect(loadManifest(path)).toEqual(emptyManifest());
    });

    it("saveManifest 寫出後 loadManifest 讀回相同內容（round-trip）", () => {
      dir = mkdtempSync(join(tmpdir(), "checkpoint-test-"));
      const path = join(dir, "nested", "content-manifest.json");
      const hash = hashContent("x");
      const manifest = upsertConcept(emptyManifest(), "array-traversal", frozenEntry(hash));
      saveManifest(manifest, path);
      expect(loadManifest(path)).toEqual(manifest);
    });
  });
});
