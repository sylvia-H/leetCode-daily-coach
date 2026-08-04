// F7 斷點續跑 / 冪等（R4、FR-019/020、data-model.md §6）：`.cache/content-manifest.json`。
// manifest 為**加速快取、非真實來源**——遺失時可由掃描 concepts/** + articles/** 重建（真實來源是
// 凍結產物本身）。純判斷（shouldSkip/rebuildManifest/upsertConcept）與檔案 I/O（load/saveManifest、
// hashFile）分離，前者可在無檔案系統下單測。
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const MANIFEST_VERSION = 1;
export const DEFAULT_MANIFEST_PATH = ".cache/content-manifest.json";

export interface ConceptCheckpoint {
  skeletonHash: string;
  skeletonFrozen: boolean;
  articleFrozen: boolean;
  gatePassed: boolean;
  needsHumanReview: boolean;
  regenCount: number;
}

export interface Manifest {
  version: number;
  concepts: Record<string, ConceptCheckpoint>;
}

export function emptyManifest(): Manifest {
  return { version: MANIFEST_VERSION, concepts: {} };
}

/** Skeleton（或任意）內容的 sha256 雜湊，供冪等判斷（R4：以內容雜湊而非易失的 mtime）。 */
export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

/** I/O 邊界：讀檔並雜湊；供腳本入口直接對 Skeleton 路徑呼叫。 */
export function hashFile(path: string): string {
  return hashContent(readFileSync(path, "utf-8"));
}

/**
 * 讀取任意 JSON checkpoint 檔的不綁型別 helper（F8 research R11）：**遺失或損毀一律回 `undefined`**，
 * 供呼叫端區分「不可用」與「可用但無 entry」。`validate` 由呼叫端提供最小形狀驗證（例如頂層物件
 * 是否含期待的容器欄位），避免把損毀／不符預期形狀的檔案當成合法空結果。
 */
export function readJsonCheckpoint<T>(path: string, validate: (parsed: unknown) => parsed is T): T | undefined {
  if (!existsSync(path)) return undefined;
  try {
    const parsed: unknown = JSON.parse(readFileSync(path, "utf-8"));
    if (!validate(parsed)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

/**
 * 原子寫入任意 JSON checkpoint 檔（先寫同目錄暫存檔再 rename，F8 research R11）：批次每處理完一筆
 * 就存一次檔，若在 `writeFileSync` 寫到一半被 Ctrl-C／crash 打斷，就地覆蓋會留下半截 JSON，
 * 下次續跑時整份 checkpoint 不可用。
 */
export function writeJsonCheckpointAtomic(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  renameSync(tmp, path);
}

function isManifestShape(parsed: unknown): parsed is Manifest {
  return (
    typeof parsed === "object" &&
    parsed !== null &&
    typeof (parsed as Manifest).concepts === "object" &&
    (parsed as Manifest).concepts !== null
  );
}

/**
 * 讀取 manifest 檔；**遺失或損毀一律回 `undefined`**，讓呼叫端能區分兩者以外的第三種狀態消失：
 * 只有「讀得到且形狀合法」才回傳內容。
 *
 * 呼叫端 MUST 以此區分「manifest 不可用」與「manifest 可用但沒有任何 entry」——若把損毀當成
 * 空 manifest，`shouldSkip` 會對每一篇都判定「無 manifestEntry ⇒ 不跳過」，把全部已凍結 Article
 * 重新生成並覆蓋，違反 FR-019/020 的冪等承諾。損毀時正確做法是走 `rebuildManifest` 由現存產物反推。
 */
export function readManifestFile(path: string = DEFAULT_MANIFEST_PATH): Manifest | undefined {
  const parsed = readJsonCheckpoint(path, isManifestShape);
  if (!parsed) return undefined;
  return { version: parsed.version ?? MANIFEST_VERSION, concepts: parsed.concepts };
}

/** manifest 遺失 / 損毀時回傳空 manifest（非真實來源，容許重建），不 throw。 */
export function loadManifest(path: string = DEFAULT_MANIFEST_PATH): Manifest {
  return readManifestFile(path) ?? emptyManifest();
}

/**
 * 原子寫入（先寫同目錄暫存檔再 rename）：Stage 2 每處理完一篇就存一次檔，若在 `writeFileSync`
 * 寫到一半被 Ctrl-C／crash 打斷，就地覆蓋會留下半截 JSON，下次續跑時整份 manifest 不可用。
 */
export function saveManifest(manifest: Manifest, path: string = DEFAULT_MANIFEST_PATH): void {
  writeJsonCheckpointAtomic(path, manifest);
}

/** 覆蓋式寫入單一 Concept 的 checkpoint（immutable：回傳新 manifest，不就地改動）。 */
export function upsertConcept(manifest: Manifest, conceptId: string, entry: ConceptCheckpoint): Manifest {
  return { ...manifest, concepts: { ...manifest.concepts, [conceptId]: entry } };
}

export interface SkipDecisionInput {
  skeletonHash: string;
  /** 對應產物（Skeleton 本身於 Stage 1、Article 於 Stage 2）是否已存在於工作目錄。 */
  productExists: boolean;
  manifestEntry?: ConceptCheckpoint;
  /** `--force` 旗標：唯一覆蓋冪等的路徑（§20.4）。 */
  force?: boolean;
}

/**
 * 續跑跳過判斷（R4）：`--force` 一律不跳過；否則須「產物存在 + manifest 記錄的雜湊與現在一致
 * + 曾經凍結且過 Gate」才跳過。雜湊不符（Skeleton 已變更）⇒ 不跳過（只重生該篇，由呼叫端只處理
 * 這一個 conceptId 達成單篇隔離）。
 */
export function shouldSkip(input: SkipDecisionInput): boolean {
  if (input.force) return false;
  if (!input.productExists) return false;
  const entry = input.manifestEntry;
  if (!entry) return false;
  return entry.skeletonHash === input.skeletonHash && entry.articleFrozen && entry.gatePassed;
}

export interface ScannedConcept {
  conceptId: string;
  skeletonContent: string;
  /** 對應產物（Article）是否已存在。 */
  productExists: boolean;
}

/**
 * manifest 遺失/損毀時的重建路徑（R4）：由現存產物反推 checkpoint。既然產物已在工作目錄中，
 * 視為「曾經凍結且過 Gate」（真實來源是產物本身，不重新驗證）；`needsHumanReview`/`regenCount`
 * 無從復原，一律重置為 false/0（最壞情況只是續跑時多驗一次，不影響正確性）。
 */
export function rebuildManifest(entries: ScannedConcept[]): Manifest {
  const concepts: Record<string, ConceptCheckpoint> = {};
  for (const e of entries) {
    concepts[e.conceptId] = {
      skeletonHash: hashContent(e.skeletonContent),
      skeletonFrozen: true,
      articleFrozen: e.productExists,
      gatePassed: e.productExists,
      needsHumanReview: false,
      regenCount: 0,
    };
  }
  return { version: MANIFEST_VERSION, concepts };
}
