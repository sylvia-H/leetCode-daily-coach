import { describe, expect, it } from "vitest";
import { renderAlert, renderCompletionNotice } from "../../src/renderer/alert.js";

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
