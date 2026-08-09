// F11 題庫產線斷點續跑／冪等（data-model.md §10、FR-015）：`.cache/quiz-manifest.json`。
// Concept 為續跑單位（research R6）。manifest 為**加速快取、非真實來源**——遺失時可由現存
// data/quiz-bank.json 反推重建（真實來源是該檔本身）。復用 scripts/lib/checkpoint.ts 的原子寫入
// 與讀檔 helper，不重寫。
import { readJsonCheckpoint, writeJsonCheckpointAtomic } from "./checkpoint.js";

export const QUIZ_MANIFEST_VERSION = 1;
export const DEFAULT_QUIZ_MANIFEST_PATH = ".cache/quiz-manifest.json";

export interface QuizConceptCheckpoint {
  /** Concept Skeleton 內容雜湊（FR-015；hashFile(node.skeletonPath)）。 */
  skeletonHash: string;
  frozen: boolean;
  gatePassed: boolean;
  needsHumanReview: boolean;
  /** 本次生成實際嘗試輪數（初次 + 補生成，上限 3，FR-013a）。 */
  regenCount: number;
  /** 最終存活題數（供人工快速掃視題數分布是否偏低，非 SC-010 的正式量測來源）。 */
  itemCount: number;
  /**
   * **每一個失敗輪次**的判準名稱，依輪次順序（一輪同時命中多條則以 `+` 串接）。
   *
   * **為何記錄「全部失敗輪」而非只記最後一次**：免費層額度主要不是被最終失敗的 Concept 吃掉，
   * 而是被「最後有成功、但中間白跑了一兩輪」的 Concept 吃掉（實測 2026-08-07：37 個已凍結
   * Concept 中 19 個 regenCount ≥ 2）。只記最後一次會看不到這塊，而它正是最大的一塊。
   * 故成功的 Concept 也 MUST 記錄其失敗輪次。`failureRules.length` 即該 Concept 的白跑輪數。
   *
   * **用途純為觀測**（批次末統計「額度花在哪條判準上」），MUST NOT 參與 `shouldSkipQuizConcept`
   * 的跳過判斷——那會讓觀測欄位變成行為欄位，manifest 一旦格式演進就改變產線行為。
   * 舊 manifest 無此欄位 ⇒ `undefined`，MUST 容忍。
   */
  failureRules?: string[];
}

export interface QuizManifest {
  version: number;
  /** key = conceptId。 */
  concepts: Record<string, QuizConceptCheckpoint>;
}

export function emptyQuizManifest(): QuizManifest {
  return { version: QUIZ_MANIFEST_VERSION, concepts: {} };
}

function isQuizManifestShape(parsed: unknown): parsed is QuizManifest {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as QuizManifest).concepts === "object" &&
    (parsed as QuizManifest).concepts !== null
  );
}

/** 讀取 manifest 檔；遺失或損毀一律回 undefined（同 F7/F8 既有語意）。 */
export function readQuizManifestFile(path: string = DEFAULT_QUIZ_MANIFEST_PATH): QuizManifest | undefined {
  const parsed = readJsonCheckpoint(path, isQuizManifestShape);
  if (!parsed) return undefined;
  return { version: parsed.version ?? QUIZ_MANIFEST_VERSION, concepts: parsed.concepts };
}

export function saveQuizManifest(manifest: QuizManifest, path: string = DEFAULT_QUIZ_MANIFEST_PATH): void {
  writeJsonCheckpointAtomic(path, manifest);
}

export function upsertQuizConcept(
  manifest: QuizManifest,
  conceptId: string,
  entry: QuizConceptCheckpoint,
): QuizManifest {
  return { ...manifest, concepts: { ...manifest.concepts, [conceptId]: entry } };
}

export interface QuizSkipDecisionInput {
  skeletonHash: string;
  /** 該 Concept 是否已存在於 quiz-bank.json 且題目非空。 */
  conceptExistsInFile: boolean;
  manifestEntry?: QuizConceptCheckpoint;
  /** `--force` 旗標：唯一覆蓋冪等的路徑。 */
  force?: boolean;
}

/**
 * 續跑跳過判斷（沿用 F7/F8 shouldSkip 語意）：`--force` 一律不跳；否則須「該 Concept 已存在於
 * quiz-bank.json + skeletonHash 相符 + frozen && gatePassed」才跳過。
 */
export function shouldSkipQuizConcept(input: QuizSkipDecisionInput): boolean {
  if (input.force) return false;
  if (!input.conceptExistsInFile) return false;
  const entry = input.manifestEntry;
  if (!entry) return false;
  return entry.skeletonHash === input.skeletonHash && entry.frozen && entry.gatePassed;
}

export interface ScannedQuizConcept {
  conceptId: string;
  skeletonHash: string;
  conceptExistsInFile: boolean;
  itemCount: number;
}

/**
 * manifest 遺失／損毀時的重建路徑：由現存 quiz-bank.json 反推 checkpoint（既有 Concept 視為已凍結
 * 且過 Gate），MUST NOT 降級為空 manifest 後覆蓋全部題庫（data-model.md §10）。`needsHumanReview` /
 * `regenCount` 無從復原，一律重置為 false/0（同 F7/F8 既有 rebuildManifest 精神）。
 */
export function rebuildQuizManifest(entries: ScannedQuizConcept[]): QuizManifest {
  const concepts: Record<string, QuizConceptCheckpoint> = {};
  for (const e of entries) {
    concepts[e.conceptId] = {
      skeletonHash: e.skeletonHash,
      frozen: e.conceptExistsInFile,
      gatePassed: e.conceptExistsInFile,
      needsHumanReview: false,
      regenCount: 0,
      itemCount: e.itemCount,
    };
  }
  return { version: QUIZ_MANIFEST_VERSION, concepts };
}
