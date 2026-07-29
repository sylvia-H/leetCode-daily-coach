import { describe, expect, it } from "vitest";
import { redactWebhookUrls, renderAlert, renderCompletionNotice } from "../../src/renderer/alert.js";

describe("renderAlert", () => {
  it("為純函式，回傳單一紅色告警 embed", () => {
    const embeds = renderAlert("foundation", "推播失敗：HTTP 500");
    expect(embeds).toHaveLength(1);
    expect(embeds[0]?.color).toBe(15158332);
    expect(embeds[0]?.title).toBe("⚠️ 推播失敗 · foundation");
    expect(embeds[0]?.description).toContain("推播失敗：HTTP 500");
  });

  it("輸出不含 webhook URL 或其他機密字樣", () => {
    const embeds = renderAlert("foundation", "推播失敗：HTTP 500");
    const serialized = JSON.stringify(embeds);
    expect(serialized).not.toMatch(/discord\.com\/api\/webhooks/);
  });

  it("track 為 null（全域性失敗）時 title 為「全域」，其餘結構與 Track 版本一致", () => {
    const globalAlert = renderAlert(null, "未設定 STATE_FILE");
    expect(globalAlert).toHaveLength(1);
    expect(globalAlert[0]?.title).toBe("⚠️ 推播失敗 · 全域");
    expect(globalAlert[0]?.color).toBe(15158332);
    expect(globalAlert[0]?.description).toContain("未設定 STATE_FILE");
  });

  it("同樣輸入連續呼叫回傳逐欄位相同的結果", () => {
    const a = renderAlert("interviewReady", "reason X");
    const b = renderAlert("interviewReady", "reason X");
    expect(a).toEqual(b);
  });

  // F6 FR-019b（notice-contract.md §1.1、憲章 XIV）：webhook URL 遮蔽為通知實作的內建行為。
  it("reason 內含完整 webhook URL 時，產出的 embeds 文字中 URL 出現次數為 0", () => {
    const reasonWithUrl =
      "推播失敗：foundation 重試 3 次仍失敗（fetch failed: https://discord.com/api/webhooks/123456/abcDEF-ghi_JKL）";
    const embeds = renderAlert("foundation", reasonWithUrl);
    const serialized = JSON.stringify(embeds);
    expect(serialized).not.toMatch(/discord(?:app)?\.com\/api\/webhooks/);
    expect(embeds[0]?.description).toContain("[redacted]");
  });

  it("全域告警（track 為 null）的 reason 同樣被遮蔽", () => {
    const reasonWithUrl = "狀態存檔失敗：https://discordapp.com/api/webhooks/999/token";
    const embeds = renderAlert(null, reasonWithUrl);
    expect(JSON.stringify(embeds)).not.toMatch(/discordapp\.com\/api\/webhooks/);
  });

  // §14.5：Discord 對單一 embed 的 description 硬限為 4,096。告警不經過 checkBudget，而 reason
  // 長度無上限（例：素材載入失敗會把全部 violation 串成一條）；超限時 Discord 回 400 且不可重試，
  // 告警等於發不出去——故截斷 MUST 由通知實作自行負責。
  it("超長 reason 被截斷至 4,096 字元以內並標示已截斷", () => {
    const embeds = renderAlert("foundation", "違規".repeat(5000));
    const description = embeds[0]!.description!;
    expect(Array.from(description).length).toBeLessThanOrEqual(4096);
    expect(description).toContain("已截斷");
    expect(description.startsWith("違規違規")).toBe(true);
  });

  it("恰好 4,096 字元的 reason 原樣保留（邊界為「大於才截斷」）", () => {
    const exact = "a".repeat(4096);
    expect(renderAlert("foundation", exact)[0]?.description).toBe(exact);
  });

  it("超長且夾帶 webhook URL 時，截斷後仍不含 URL（遮蔽先於截斷）", () => {
    const reason = `${"x".repeat(4090)} https://discord.com/api/webhooks/123/token-abc`;
    const description = renderAlert(null, reason)[0]!.description!;
    expect(Array.from(description).length).toBeLessThanOrEqual(4096);
    expect(description).not.toMatch(/discord(?:app)?\.com\/api\/webhooks/);
  });

  it("截斷不會切斷 surrogate pair（以 code point 計長）", () => {
    const description = renderAlert("foundation", "🎉".repeat(5000))[0]!.description!;
    expect(Array.from(description).length).toBeLessThanOrEqual(4096);
    expect(description).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });
});

describe("redactWebhookUrls", () => {
  it("純函式：同輸入 → 同輸出", () => {
    const text = "含 https://discord.com/api/webhooks/1/aaa 的訊息";
    expect(redactWebhookUrls(text)).toBe(redactWebhookUrls(text));
  });

  it("把 webhook URL 樣式替換為 [redacted]，非 URL 文字不受影響", () => {
    const text = "推播失敗：foundation webhook 回應 HTTP 500（url=https://discord.com/api/webhooks/123/token-abc）";
    const redacted = redactWebhookUrls(text);
    expect(redacted).not.toMatch(/discord\.com\/api\/webhooks/);
    expect(redacted).toContain("[redacted]");
    expect(redacted).toContain("推播失敗：foundation webhook 回應 HTTP 500");
  });

  it("不含 webhook URL 的文字原樣不變", () => {
    const text = "字元預算超限：msg1:digest(950/900)";
    expect(redactWebhookUrls(text)).toBe(text);
  });

  it("同一字串中出現多個 webhook URL 時全部遮蔽", () => {
    const text = "a=https://discord.com/api/webhooks/1/aaa b=https://discordapp.com/api/webhooks/2/bbb";
    const redacted = redactWebhookUrls(text);
    expect(redacted.match(/\[redacted\]/g)).toHaveLength(2);
    expect(redacted).not.toMatch(/discord(?:app)?\.com\/api\/webhooks/);
  });
});

// F6 FR-019a／R3：與 renderAlert 同檔的單一通知實作，notice-contract.md §2。
describe("renderCompletionNotice", () => {
  it("純函式：同一 track → deep-equal 的 embeds（無時間戳、無隨機）", () => {
    const a = renderCompletionNotice("foundation");
    const b = renderCompletionNotice("foundation");
    expect(a).toEqual(b);
  });

  it("恰好 1 個 embed，顏色為 3066993（綠），總長遠低於 6,000", () => {
    const embeds = renderCompletionNotice("foundation");
    expect(embeds).toHaveLength(1);
    expect(embeds[0]?.color).toBe(3066993);
    const serializedLength = JSON.stringify(embeds).length;
    expect(serializedLength).toBeLessThan(6000);
  });

  it("標題含 Track 名稱，內文告知課程已推播完畢、其後不再推播", () => {
    const embeds = renderCompletionNotice("interviewMastery");
    expect(embeds[0]?.title).toBe("🎉 課程完成 · interviewMastery");
    expect(embeds[0]?.description).toContain("已全部推播完畢");
    expect(embeds[0]?.description).toContain("不再推播");
  });

  // FR-019b 要求遮蔽適用於「全部」通知種類；完課通知無自由文字參數，此斷言屬空成立，但讓該推論
  // 被機器記錄下來——日後若為完課通知加上任何動態文字即會紅燈。
  it("embeds 文字中 webhook URL 與檔案系統路徑的出現次數為 0", () => {
    const serialized = JSON.stringify(renderCompletionNotice("foundation"));
    expect(serialized).not.toMatch(/discord\.com\/api\/webhooks/);
    expect(serialized).not.toMatch(/[A-Za-z]:\\|\/(home|Users)\//);
  });
});
