import { pathToFileURL } from "node:url";
import { compile, loadCompilerDeps, type CompilerDeps } from "./compiler/lesson.js";
import { type Config, type EnvLike, loadConfig, parseBool, parseWebhooks, TRACK_ORDER } from "./config.js";
import {
  createWebhookClient,
  type WebhookClient,
  type WebhookClientOptions,
} from "./discord/webhook-client.js";
import { checkBudget, type BudgetReport } from "./renderer/budget.js";
import { render } from "./renderer/discord.js";
import { redactWebhookUrls, renderAlert, renderCompletionNotice } from "./renderer/alert.js";
import {
  advance,
  type AppState,
  clearCompleted,
  load as loadState,
  markCompleted,
  save as saveState,
} from "./state/state-store.js";
import type { Lesson, RenderedMessage, Track } from "./types/lesson.js";
import { toTaipeiDateString } from "./util/taipei-date.js";

// 推播一個 Track 的注入點。webhook client 由 run() 統一建立並注入預設實作，故此處不再需要 config。
export type PushTrack = (track: Track, state: AppState) => Promise<Lesson>;

interface CompiledPush {
  lesson: Lesson;
  messages: RenderedMessage[];
  reports: BudgetReport[];
}

// 註解中的需求編號一律標明所屬 Feature（`F1 FR-020`、`F6 FR-022`…）：F1 與 F6 的 FR / US / research
// 編號空間各自獨立且已實際碰撞（例：F1 FR-020＝日期 guard，F6 FR-020＝告警自身失敗），不標會誤導。
//
// 純粹的 compile + render + checkBudget，**不因超限而拋錯**——DRY_RUN 需要在超限時仍完整輸出
// 逐項明細（F1 US4 Scenario 2），超限與否由呼叫方決定如何處置。
function compileLesson(track: Track, state: AppState, deps: CompilerDeps): CompiledPush {
  const sessionIndex = state.tracks[track]?.currentSessionIndex ?? 1;
  const lesson = compile(track, sessionIndex, deps);
  const messages = render(lesson);
  const reports = messages.map((message) => checkBudget(message));
  return { lesson, messages, reports };
}

// F6 R1：完課判定的資料來源是課表本身（已載入的 deps.schedules[track]），MUST NOT 靠捕捉 compile()
// 拋出的「超出課表範圍」錯誤字串做控制流——那樣會把錯誤訊息當控制流，且無法區分「課表中間缺號」
// （仍是該軌失敗）與「真的走完課表」（完課）。
//
// 空課表（`sessions: []`）MUST 判為該軌失敗、MUST NOT 判為完課：`reduce` 的初始值 0 會讓任何
// `currentSessionIndex ≥ 1` 都「超出最大 sessionIndex」，於是課表產物異常會靜默走進完課分支——發完課
// 通知、寫 completedAt、exit 0，且修好課表後仍需人工清除 completedAt 才會恢復。空課表是生成物異常
// （同「課表中間缺號」），一律 fail loud。
function maxSessionIndex(track: Track, deps: CompilerDeps): number {
  const { sessions } = deps.schedules[track];
  if (sessions.length === 0) {
    throw new Error(`${track} 的課表為空（0 個 Session）：屬課表產物異常，MUST NOT 判為完課`);
  }
  return sessions.reduce((max, s) => Math.max(max, s.sessionIndex), 0);
}

/**
 * 多則訊息推播到一半失敗：前段已公開發出，後段沒有。Discord webhook 無法撤回、也沒有 idempotency
 * key，故唯一能避免「補跑重貼前段」的做法是照常前進 state，同時發紅色告警 + 非零 exit code
 * 讓缺漏的後段被人看見（憲章 XV Fail loud）。
 */
export class PartialPushError extends Error {
  constructor(
    readonly lesson: Lesson,
    readonly postedCount: number,
    readonly totalCount: number,
    cause: Error,
  ) {
    super(
      `推播中斷於第 ${postedCount + 1}/${totalCount} 則（前 ${postedCount} 則已送出）：${cause.message}` +
        `；本課進度已前進、不會補推（F6 FR-012）`,
      { cause },
    );
    this.name = "PartialPushError";
  }
}

async function defaultPushTrack(
  track: Track,
  state: AppState,
  deps: CompilerDeps,
  client: WebhookClient,
): Promise<Lesson> {
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

  // §14.5 對呼叫端的要求：render 回傳多則時 MUST 依序 post。
  for (const [index, message] of messages.entries()) {
    try {
      await client.post(track, message.embeds);
    } catch (err) {
      // 已有訊息落到頻道上時，MUST 讓呼叫方知道這是「部分推播」而非「完全沒推」——兩者對 state 的
      // 處置相反：後者不前進（漏跑不跳課），前者若不前進，補跑 cron 會把已發出的前段再貼一次。
      if (index > 0) {
        throw new PartialPushError(lesson, index, messages.length, err as Error);
      }
      throw err;
    }
  }
  return lesson;
}

// F1 US4：預覽模式輸出——完整 embeds（格式化 JSON）與 BudgetReport 逐項明細，逐則訊息各自輸出。
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
    console.error(`alert-failed: 全域: ${redactWebhookUrls((alertErr as Error).message)}`);
  }
}

export interface RunOptions {
  pushTrack?: PushTrack;
  /** **測試 seam**：重試策略的注入點（測試以此關閉真實等待與 jitter）；正式執行 MUST 留空。 */
  webhookOptions?: WebhookClientOptions;
}

export async function run(env: EnvLike, options: RunOptions = {}): Promise<number> {
  const webhooks = parseWebhooks(env);
  const firstConfiguredTrack = TRACK_ORDER.find((track) => webhooks[track]);

  // F6 FR-009 修復：預覽模式下 MUST NOT 發送任何通知（含全域告警）——通知本身也是一次推播。此處
  // config 尚未（或可能未）載入成功，dryRun 旗標 MUST 直接由 env 讀取，不能等 config.dryRun。
  const previewOnly = parseBool(env.DRY_RUN);

  let config: Config;
  try {
    config = loadConfig(env);
  } catch (err) {
    // F6 FR-025a：執行記錄輸出 MUST 先經遮蔽再印出——底層例外訊息可能夾帶完整 webhook URL，
    // 而實機驗收紀錄所附的 Actions 連結指向的是完整 log，log 洩漏等同驗收紀錄洩漏金鑰。
    const reason = redactWebhookUrls((err as Error).message);
    console.error(reason);
    if (!previewOnly && firstConfiguredTrack) {
      const client = createWebhookClient(webhooks, options.webhookOptions);
      await sendGlobalAlert(client, firstConfiguredTrack, reason);
    }
    return 1;
  }

  const client = createWebhookClient(config.webhooks, options.webhookOptions);

  let state: AppState;
  try {
    state = loadState(config.stateFile, config.enabledTracks);
  } catch (err) {
    const reason = redactWebhookUrls((err as Error).message);
    console.error(reason);
    if (!config.dryRun) {
      await sendGlobalAlert(client, config.enabledTracks[0] as Track, reason);
    }
    return 1;
  }

  // 課程素材（DAG / 題庫 / 三份課表 / 三份 Overlay）為全部 Track 共用的基礎，載入失敗屬全域性失敗
  // （任何 Track 皆無法在缺少完整素材下編譯），故與 config / state 載入失敗同樣處置。
  let deps: CompilerDeps;
  try {
    deps = loadCompilerDeps();
  } catch (err) {
    const reason = `課程素材載入失敗：${redactWebhookUrls((err as Error).message)}`;
    console.error(reason);
    if (!config.dryRun) {
      await sendGlobalAlert(client, config.enabledTracks[0] as Track, reason);
    }
    return 1;
  }

  const pushTrack: PushTrack = options.pushTrack ?? ((t, s) => defaultPushTrack(t, s, deps, client));

  let anyFailed = false;

  for (const track of config.enabledTracks) {
    const trackState = state.tracks[track];
    // `lastPushAt` 為 null 或可解析的 ISO 字串，此不變式由 loadState() 的欄位驗證保證（違反者為全域
    // 失敗，已在迴圈之前中止）；故此處的 Intl 格式化不會因 Invalid Date 丟出 RangeError。
    const alreadyPushedToday =
      trackState?.lastPushAt !== null &&
      trackState?.lastPushAt !== undefined &&
      toTaipeiDateString(new Date(trackState.lastPushAt)) === toTaipeiDateString(new Date());

    // per-track idempotency guard（F1 FR-020）：置於逐 Track 流程最前。
    // 略過條件為 dryRun || force（F1 research R9）——DRY_RUN 與 FORCE 同時開啟時以 DRY_RUN 為準。
    if (alreadyPushedToday && !config.dryRun && !config.force) {
      console.log(`${track}: skipped (already pushed today)`);
      continue;
    }

    try {
      // F6 完課檢查（R1）：置於 per-track guard 之後、compileLesson 之前。FORCE MUST NOT 繞過完課跳過
      // （F6 R4）——此檢查完全不看 config.force，故無論是否強制皆會先擋下已完課的 Track。
      const currentSessionIndex = trackState?.currentSessionIndex ?? 1;
      const maxIndex = maxSessionIndex(track, deps);
      const isBeyondSchedule = currentSessionIndex > maxIndex;
      let isCompleted = trackState?.completedAt !== null && trackState?.completedAt !== undefined;

      // F6 FR-022b：完課狀態的自動解除。已記錄 completedAt 但進度仍落在目前課表範圍內 ⇒ 課表在完課後
      // 被延長（例：F7 課綱由 13 課展開為約 180 課），此時完課狀態已違反不變式「completedAt 非空 ⇒
      // currentSessionIndex 超出課表最大 sessionIndex」。不解除的話三軌會在課綱擴充後無限期靜默跳過，
      // 且不發任何訊號。解除只刪 completedAt、不動其餘欄位，該軌當次即照常從既有進度續推。
      if (isCompleted && !isBeyondSchedule) {
        if (config.dryRun) {
          // 預覽模式 MUST NOT 寫入狀態（F1 FR-021）：只輸出日誌，其後照常走預覽路徑。
          console.log(`${track}: would clear completion (dry-run, schedule extended to ${maxIndex})`);
        } else {
          clearCompleted(state, track);
          console.log(`${track}: completion cleared (schedule extended to ${maxIndex})`);
        }
        isCompleted = false;
      }

      if (config.dryRun) {
        // 預覽模式：compile + render + checkBudget 之後、post 之前 continue（F1 research R9）；
        // 不推播、不寫入狀態（F1 FR-021）；即使超限仍完整輸出逐項明細，不因此視為失敗
        // （F1 US4 Scenario 2）。完課的兩種情境同樣只輸出日誌、不發送、不寫狀態（F6 R4）。
        if (isCompleted) {
          console.log(`${track}: completed (skipped, dry-run)`);
          continue;
        }
        if (isBeyondSchedule) {
          console.log(`${track}: would send completion notice (dry-run)`);
          continue;
        }
        const { messages, reports } = compileLesson(track, state, deps);
        printDryRunPreview(track, messages, reports);
        continue;
      }

      if (isCompleted) {
        console.log(`${track}: skipped (completed)`);
        continue;
      }

      if (isBeyondSchedule) {
        // 通知發送失敗會拋出並落入下方 catch：視為該軌失敗（紅色告警 + exit 1），MUST NOT 寫
        // completedAt（F6 FR-019c／state-schema.md §2）——下次執行會重試發送。
        await client.post(track, renderCompletionNotice(track));
        markCompleted(state, track, new Date());
        console.log(`${track}: completed`);
        continue;
      }

      const lesson = await pushTrack(track, state);
      advance(state, track, lesson, new Date());
      console.log(`${track}: pushed`);
    } catch (err) {
      anyFailed = true;
      const reason = redactWebhookUrls((err as Error).message);
      console.error(`${track}: failed: ${reason}`);
      // 部分推播：state 照常前進，避免補跑 cron 重發已送出的前段（詳見 PartialPushError）。
      if (err instanceof PartialPushError) {
        advance(state, track, err.lesson, new Date());
        console.error(
          `${track}: partial push: 已送出 ${err.postedCount}/${err.totalCount} 則，state 仍前進以避免重複推播`,
        );
      }
      // 預覽模式 MUST 完全不推播（F1 cli-contract.md §3）——告警也是一次推播，故 DRY_RUN 下只留日誌。
      if (!config.dryRun) {
        try {
          await client.post(track, renderAlert(track, reason));
        } catch (alertErr) {
          console.error(`alert-failed: ${track}: ${redactWebhookUrls((alertErr as Error).message)}`);
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
      const reason = `狀態存檔失敗（${config.stateFile}）：${redactWebhookUrls((err as Error).message)}`;
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
