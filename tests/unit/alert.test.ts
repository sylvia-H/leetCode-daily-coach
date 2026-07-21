import { describe, expect, it } from "vitest";
import { renderAlert } from "../../src/renderer/alert.js";

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
