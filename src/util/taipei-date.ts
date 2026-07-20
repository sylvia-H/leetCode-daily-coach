// 純函式，不讀系統時鐘：以 IANA 時區資料庫換算，不手動位移 +8（research R2）。
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Taipei",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toTaipeiDateString(date: Date): string {
  return formatter.format(date);
}
