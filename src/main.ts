import { pathToFileURL } from "node:url";
import { compile } from "./compiler/lesson.js";
import { type Config, type EnvLike, loadConfig, parseWebhooks, TRACK_ORDER } from "./config.js";
import { createWebhookClient, type WebhookClient } from "./discord/webhook-client.js";
import { checkBudget, type BudgetReport } from "./renderer/budget.js";
import { render } from "./renderer/discord.js";
import { renderAlert } from "./renderer/alert.js";
import { advance, type AppState, load as loadState, save as saveState } from "./state/state-store.js";
import type { DiscordEmbed, Lesson, Track } from "./types/lesson.js";
import { toTaipeiDateString } from "./util/taipei-date.js";

export type PushTrack = (track: Track, config: Config, state: AppState) => Promise<Lesson>;

interface CompiledPush {
  lesson: Lesson;
  embeds: DiscordEmbed[];
  report: BudgetReport;
}

// 純粹的 compile + render + checkBudget，**不因超限而拋錯**——DRY_RUN 需要在超限時仍完整輸出
// 逐項明細（US4 Scenario 2），超限與否由呼叫方決定如何處置。
function compileLesson(track: Track, state: AppState): CompiledPush {
  const sessionIndex = state.tracks[track]?.currentSessionIndex ?? 1;
  const lesson = compile(track, sessionIndex);
  const embeds = render(lesson);
  const report = checkBudget(embeds);
  return { lesson, embeds, report };
}

async function defaultPushTrack(track: Track, config: Config, state: AppState): Promise<Lesson> {
  const { lesson, embeds, report } = compileLesson(track, state);
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

// US4：預覽模式輸出——完整 embeds（格式化 JSON）與 BudgetReport 逐項明細
// （§14.5 每一個預算項目：名稱 / 實際字元數 / 上限 / 是否超限）。
function printDryRunPreview(track: Track, embeds: DiscordEmbed[], report: BudgetReport): void {
  console.log(`${track}: dry-run preview`);
  console.log(JSON.stringify(embeds, null, 2));
  console.log(`${track}: budget report`);
  for (const item of report.items) {
    console.log(`  ${item.name}: ${item.length}/${item.limit}${item.over ? " (OVER)" : ""}`);
  }
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
    const trackState = state.tracks[track];
    const alreadyPushedToday =
      trackState?.lastPushAt !== null &&
      trackState?.lastPushAt !== undefined &&
      toTaipeiDateString(new Date(trackState.lastPushAt)) === toTaipeiDateString(new Date());

    // per-track idempotency guard（FR-020）：置於逐 Track 流程最前。
    // 略過條件為 dryRun || force（research R9）——DRY_RUN 與 FORCE 同時開啟時以 DRY_RUN 為準。
    if (alreadyPushedToday && !config.dryRun && !config.force) {
      console.log(`${track}: skipped (already pushed today)`);
      continue;
    }

    try {
      if (config.dryRun) {
        // 預覽模式：compile + render + checkBudget 之後、post 之前 continue（research R9）；
        // 不推播、不寫入狀態（FR-021）；即使超限仍完整輸出逐項明細，不因此視為失敗（US4 Scenario 2）。
        const { embeds, report } = compileLesson(track, state);
        printDryRunPreview(track, embeds, report);
        continue;
      }

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

  if (!config.dryRun) {
    saveState(config.stateFile, state);
  }

  return anyFailed ? 1 : 0;
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const exitCode = await run(process.env);
  process.exit(exitCode);
}
