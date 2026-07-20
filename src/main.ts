import { compile } from "./compiler/lesson.js";
import { type Config, type EnvLike, loadConfig, parseWebhooks, TRACK_ORDER } from "./config.js";
import { createWebhookClient, type WebhookClient } from "./discord/webhook-client.js";
import { checkBudget } from "./renderer/budget.js";
import { render } from "./renderer/discord.js";
import { renderAlert } from "./renderer/alert.js";
import { advance, type AppState, load as loadState, save as saveState } from "./state/state-store.js";
import type { Lesson, Track } from "./types/lesson.js";

export type PushTrack = (track: Track, config: Config, state: AppState) => Promise<Lesson>;

async function defaultPushTrack(track: Track, config: Config, state: AppState): Promise<Lesson> {
  const sessionIndex = state.tracks[track]?.currentSessionIndex ?? 1;
  const lesson = compile(track, sessionIndex);
  const embeds = render(lesson);

  const report = checkBudget(embeds);
  if (!report.ok) {
    const overItems = report.items
      .filter((item) => item.over)
      .map((item) => `${item.name}(${item.length}/${item.limit})`)
      .join(", ");
    throw new Error(`字元預算超限：${overItems}`);
  }

  const client = createWebhookClient(config.webhooks);
  await client.post(track, embeds);
  return lesson;
}

async function sendGlobalAlert(client: WebhookClient, track: Track, reason: string): Promise<void> {
  try {
    await client.post(track, renderAlert(null, reason));
  } catch (alertErr) {
    console.error(`alert-failed: 全域: ${(alertErr as Error).message}`);
  }
}

export interface RunOptions {
  pushTrack?: PushTrack;
}

export async function run(env: EnvLike, options: RunOptions = {}): Promise<number> {
  const pushTrack = options.pushTrack ?? defaultPushTrack;

  const webhooks = parseWebhooks(env);
  const firstConfiguredTrack = TRACK_ORDER.find((track) => webhooks[track]);

  let config: Config;
  try {
    config = loadConfig(env);
  } catch (err) {
    const reason = (err as Error).message;
    console.error(reason);
    if (firstConfiguredTrack) {
      const client = createWebhookClient(webhooks);
      await sendGlobalAlert(client, firstConfiguredTrack, reason);
    }
    return 1;
  }

  const client = createWebhookClient(config.webhooks);

  let state: AppState;
  try {
    state = loadState(config.stateFile, config.enabledTracks);
  } catch (err) {
    const reason = (err as Error).message;
    console.error(reason);
    await sendGlobalAlert(client, config.enabledTracks[0] as Track, reason);
    return 1;
  }

  let anyFailed = false;

  for (const track of config.enabledTracks) {
    try {
      const lesson = await pushTrack(track, config, state);
      advance(state, track, lesson, new Date());
      console.log(`${track}: pushed`);
    } catch (err) {
      anyFailed = true;
      const reason = (err as Error).message;
      console.error(`${track}: failed: ${reason}`);
      try {
        await client.post(track, renderAlert(track, reason));
      } catch (alertErr) {
        console.error(`alert-failed: ${track}: ${(alertErr as Error).message}`);
      }
    }
  }

  saveState(config.stateFile, state);

  return anyFailed ? 1 : 0;
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;

if (isMainModule) {
  const exitCode = await run(process.env);
  process.exit(exitCode);
}
