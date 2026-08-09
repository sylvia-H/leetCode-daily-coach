import type { Track } from "./types/lesson.js";

export const TRACK_ORDER: readonly Track[] = ["foundation", "interviewReady", "interviewMastery"];

const WEBHOOK_ENV_KEYS: Record<Track, string> = {
  foundation: "DISCORD_WEBHOOK_URL_FOUNDATION",
  interviewReady: "DISCORD_WEBHOOK_URL_INTERVIEW_READY",
  interviewMastery: "DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY",
};

export interface Config {
  webhooks: Partial<Record<Track, string>>;
  enabledTracks: Track[];
  stateFile: string;
  dryRun: boolean;
  force: boolean;
  /** F11 research R1：選填，缺席不影響既有 fail-fast 條件。缺席 ⇒ 小測連結全部省略（FR-012）。 */
  pagesBaseUrl?: string;
}

export function parseBool(v: string | undefined): boolean {
  return v?.trim().toLowerCase() === "true";
}

export type EnvLike = Record<string, string | undefined>;

export function parseWebhooks(env: EnvLike): Partial<Record<Track, string>> {
  const webhooks: Partial<Record<Track, string>> = {};
  for (const track of TRACK_ORDER) {
    const trimmed = env[WEBHOOK_ENV_KEYS[track]]?.trim();
    if (trimmed) {
      webhooks[track] = trimmed;
    }
  }
  return webhooks;
}

export function loadConfig(env: EnvLike): Config {
  const webhooks = parseWebhooks(env);
  const enabledTracks = TRACK_ORDER.filter((track) => webhooks[track]);

  if (enabledTracks.length === 0) {
    throw new Error(
      "設定錯誤：未設定任何 Track 的 webhook（DISCORD_WEBHOOK_URL_FOUNDATION / DISCORD_WEBHOOK_URL_INTERVIEW_READY / DISCORD_WEBHOOK_URL_INTERVIEW_MASTERY 皆未設定）",
    );
  }

  const stateFile = env.STATE_FILE?.trim();
  if (!stateFile) {
    throw new Error("設定錯誤：未設定 STATE_FILE");
  }

  const pagesBaseUrl = env.PAGES_BASE_URL?.trim() || undefined;

  return {
    webhooks,
    enabledTracks,
    stateFile,
    dryRun: parseBool(env.DRY_RUN),
    force: parseBool(env.FORCE),
    pagesBaseUrl,
  };
}
