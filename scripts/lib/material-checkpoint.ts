// F8 素材產線斷點續跑 / 冪等（research R11、data-model.md §9）：`.cache/material-manifest.json`。
// 批次為唯一有意義的續跑單位（一次 LLM 呼叫產出一個 Topic 的 6 則問題，或整個語錄池單批），
// 中斷只會發生在批與批之間。manifest 為**加速快取、非真實來源**——遺失時可由現存素材檔反推重建
// （真實來源是 data/reflection-bank.json / data/encouragement.json 本身）。復用 scripts/lib/checkpoint.ts
// 的原子寫入與讀檔 helper（不重寫，避免「寫到一半被 Ctrl-C 留下半截 JSON」的教訓在第二個 manifest 重演）。
import { readJsonCheckpoint, writeJsonCheckpointAtomic } from "./checkpoint.js";

export const MATERIAL_MANIFEST_VERSION = 1;
export const DEFAULT_MATERIAL_MANIFEST_PATH = ".cache/material-manifest.json";

/** 固定 key：語錄池為單批，非依 topicId 分批。 */
export const ENCOURAGEMENT_BATCH_KEY = "encouragement";

export interface MaterialBatchCheckpoint {
  /** 該批生成輸入的 sha256（topicId + title + prompt 版本常數；語錄池為 prompt 版本常數 + 目標則數）。 */
  inputHash: string;
  frozen: boolean;
  gatePassed: boolean;
  needsHumanReview: boolean;
  regenCount: number;
}

export interface MaterialManifest {
  version: number;
  /** key = topicId，或固定值 "encouragement"。 */
  batches: Record<string, MaterialBatchCheckpoint>;
}

export function emptyMaterialManifest(): MaterialManifest {
  return { version: MATERIAL_MANIFEST_VERSION, batches: {} };
}

function isMaterialManifestShape(parsed: unknown): parsed is MaterialManifest {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as MaterialManifest).batches === "object" &&
    (parsed as MaterialManifest).batches !== null
  );
}

/** 讀取 manifest 檔；遺失或損毀一律回 undefined（同 F7 readManifestFile 的語意，data-model.md §9）。 */
export function readMaterialManifestFile(
  path: string = DEFAULT_MATERIAL_MANIFEST_PATH,
): MaterialManifest | undefined {
  const parsed = readJsonCheckpoint(path, isMaterialManifestShape);
  if (!parsed) return undefined;
  return { version: parsed.version ?? MATERIAL_MANIFEST_VERSION, batches: parsed.batches };
}

export function saveMaterialManifest(
  manifest: MaterialManifest,
  path: string = DEFAULT_MATERIAL_MANIFEST_PATH,
): void {
  writeJsonCheckpointAtomic(path, manifest);
}

export function upsertBatch(
  manifest: MaterialManifest,
  key: string,
  entry: MaterialBatchCheckpoint,
): MaterialManifest {
  return { ...manifest, batches: { ...manifest.batches, [key]: entry } };
}

export interface MaterialSkipDecisionInput {
  inputHash: string;
  /** 該批對應的素材是否已存在於素材檔（Reflection：byTopic[topicId] 非空；Encouragement：quotes 非空）。 */
  batchExistsInFile: boolean;
  manifestEntry?: MaterialBatchCheckpoint;
  /** `--force` 旗標：唯一覆蓋冪等的路徑。 */
  force?: boolean;
}

/**
 * 續跑跳過判斷（沿用 F7 `shouldSkip` 語意）：`--force` 一律不跳；否則須「該批已存在於素材檔
 * + `inputHash` 相符 + `frozen && gatePassed`」才跳過。
 */
export function shouldSkipBatch(input: MaterialSkipDecisionInput): boolean {
  if (input.force) return false;
  if (!input.batchExistsInFile) return false;
  const entry = input.manifestEntry;
  if (!entry) return false;
  return entry.inputHash === input.inputHash && entry.frozen && entry.gatePassed;
}

export interface ScannedMaterialBatch {
  key: string;
  inputHash: string;
  /** 該批對應的素材是否已存在於素材檔。 */
  batchExistsInFile: boolean;
}

/**
 * manifest 遺失/損毀時的重建路徑：由現存素材檔反推 checkpoint（既有批次視為已凍結且過 Gate，
 * MUST NOT 降級為空 manifest 後覆蓋全部素材，data-model.md §9）。`needsHumanReview` / `regenCount`
 * 無從復原，一律重置為 false/0（最壞情況只是續跑時多驗一次，不影響正確性，同 F7 rebuildManifest）。
 */
export function rebuildMaterialManifest(entries: ScannedMaterialBatch[]): MaterialManifest {
  const batches: Record<string, MaterialBatchCheckpoint> = {};
  for (const e of entries) {
    batches[e.key] = {
      inputHash: e.inputHash,
      frozen: e.batchExistsInFile,
      gatePassed: e.batchExistsInFile,
      needsHumanReview: false,
      regenCount: 0,
    };
  }
  return { version: MATERIAL_MANIFEST_VERSION, batches };
}
