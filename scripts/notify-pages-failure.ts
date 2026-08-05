// FR-017 通知的發送邊界（workflow-integration.md §4.2）：renderPagesFailureNotice() 只回傳
// embeds、本身不具發送能力；由 daily.yml 的 `pages` job 在 `if: failure()` 時以
// `npx tsx scripts/notify-pages-failure.ts` 呼叫。MUST NOT 讀 state.json、MUST NOT 呼叫
// buildSite()、MUST NOT 呼叫任何 GitHub API——職責僅為「送出一則固定通知」。
import { pathToFileURL } from "node:url";
import { parseWebhooks, TRACK_ORDER, type EnvLike } from "../src/config.js";
import { renderPagesFailureNotice } from "../src/renderer/alert.js";

export async function notifyPagesFailure(env: EnvLike): Promise<void> {
  const webhooks = parseWebhooks(env);
  const track = TRACK_ORDER.find((t) => webhooks[t]);
  if (!track) {
    console.log("notify-pages-failure: 無任何已設定的 webhook，略過發送");
    return;
  }

  const url = webhooks[track]!;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: renderPagesFailureNotice() }),
    });
    if (!response.ok) {
      throw new Error(`webhook 回應 HTTP ${response.status}`);
    }
    console.log(`notify-pages-failure: 已通知 ${track}`);
  } catch (err) {
    // job 已是 continue-on-error：發送失敗只記本機日誌，MUST NOT 讓通知失敗製造第二層雜訊。
    console.error(`notify-pages-failure: 發送失敗（${track}）：${(err as Error).message}`);
  }
}

const isMainModule = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  await notifyPagesFailure(process.env);
  process.exit(0);
}
