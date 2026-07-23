import { pathToFileURL } from "node:url";
import { compile, loadCompilerDeps, type CompilerDeps } from "./compiler/lesson.js";
import { type Config, type EnvLike, loadConfig, parseWebhooks, TRACK_ORDER } from "./config.js";
import { createWebhookClient, type WebhookClient } from "./discord/webhook-client.js";
import { checkBudget, type BudgetReport } from "./renderer/budget.js";
import { render } from "./renderer/discord.js";
import { renderAlert } from "./renderer/alert.js";
import { advance, type AppState, load as loadState, save as saveState } from "./state/state-store.js";
import type { Lesson, RenderedMessage, Track } from "./types/lesson.js";
import { toTaipeiDateString } from "./util/taipei-date.js";

export type PushTrack = (track: Track, config: Config, state: AppState) => Promise<Lesson>;

interface CompiledPush {
  lesson: Lesson;
  messages: RenderedMessage[];
  reports: BudgetReport[];
}

// 純粹的 compile + render + checkBudget，**不因超限而拋錯**——DRY_RUN 需要在超限時仍完整輸出
// 逐項明細（US4 Scenario 2），超限與否由呼叫方決定如何處置。
function compileLesson(track: Track, state: AppState, deps: CompilerDeps): CompiledPush {
  const sessionIndex = state.tracks[track]?.currentSessionIndex ?? 1;
  const lesson = compile(track, sessionIndex, deps);
  const messages = render(lesson);
  const reports = messages.map((message) => checkBudget(message));
  return { lesson, messages, reports };
}

async function defaultPushTrack(track: Track, config: Config, state: AppState, deps: CompilerDeps): Promise<Lesson> {
  const { lesson, messages, reports } = compileLesson(track, state, deps);
  const overIndex = reports.findIndex((report) => !report.ok);
  if (overIndex >= 0) {
    const overItems = reports
      .flatMap((report, i) =>
        report.items.filter((item) => item.over).map((item) => `msg${i + 1}:${item.name}(${item.length}/${item.limit})`),
      )
      .join(", ");
    throw new Error(`字元預算超限：${overItems}`);
  }

  const client = createWebhookClient(config.webhooks);
  // §14.5 對呼叫端的要求：render 回傳多則時 MUST 依序 post。
  for (const message of messages) {
    await client.post(track, message.embeds);
  }
  return lesson;
}

// US4：預覽模式輸出——完整 embeds（格式化 JSON）與 BudgetReport 逐項明細，逐則訊息各自輸出。
function printDryRunPreview(track: Track, messages: RenderedMessage[], reports: BudgetReport[]): void {
  messages.forEach((message, i) => {
    const label = messages.length > 1 ? `${track} (${i + 1}/${messages.length})` : track;
    console.log(`${label}: dry-run preview`);
    console.log(JSON.stringify(message.embeds, null, 2));
    console.log(`${label}: budget report`);
    for (const item of reports[i]!.items) {
      console.log(`  ${item.name}: ${item.length}/${item.limit}${item.over ? " (OVER)" : ""}`);
    }
  });
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

  // 課程素材（DAG / 題庫 / 三份課表 / 三份 Overlay）為全部 Track 共用的基礎，載入失敗屬全域性失敗
  // （任何 Track 皆無法在缺少完整素材下編譯），故與 config / state 載入失敗同樣處置。
  let deps: CompilerDeps;
  try {
    deps = loadCompilerDeps();
  } catch (err) {
    const reason = `課程素材載入失敗：${(err as Error).message}`;
    console.error(reason);
    await sendGlobalAlert(client, config.enabledTracks[0] as Track, reason);
    return 1;
  }

  const pushTrack: PushTrack = options.pushTrack ?? ((t, c, s) => defaultPushTrack(t, c, s, deps));

  let anyFailed = false;

  for (const track of config.enabledTracks) {
    const trackState = state.tracks[track];
    // `lastPushAt` 為 null 或可解析的 ISO 字串，此不變式由 loadState() 的欄位驗證保證（違反者為全域
    // 失敗，已在迴圈之前中止）；故此處的 Intl 格式化不會因 Invalid Date 丟出 RangeError。
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
        const { messages, reports } = compileLesson(track, state, deps);
        printDryRunPreview(track, messages, reports);
        continue;
      }

      const lesson = await pushTrack(track, config, state);
      advance(state, track, lesson, new Date());
      console.log(`${track}: pushed`);
    } catch (err) {
      anyFailed = true;
      const reason = (err as Error).message;
      console.error(`${track}: failed: ${reason}`);
      // 預覽模式 MUST 完全不推播（cli-contract.md §3）——告警也是一次推播，故 DRY_RUN 下只留日誌。
      if (!config.dryRun) {
        try {
          await client.post(track, renderAlert(track, reason));
        } catch (alertErr) {
          console.error(`alert-failed: ${track}: ${(alertErr as Error).message}`);
        }
      }
    }
  }

  if (!config.dryRun) {
    // 存檔失敗屬核心步驟失敗：MUST 發紅色告警並以非零 exit code 結束（憲章 XV「Fail loud」），
    // MUST NOT 讓例外逸出 run() 變成無告警的 unhandled rejection。
    try {
      saveState(config.stateFile, state);
    } catch (err) {
      const reason = `狀態存檔失敗（${config.stateFile}）：${(err as Error).message}`;
      console.error(reason);
      await sendGlobalAlert(client, config.enabledTracks[0] as Track, reason);
      return 1;
    }
  }

  return anyFailed ? 1 : 0;
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  const exitCode = await run(process.env);
  process.exit(exitCode);
}
