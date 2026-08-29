---
id: sliding-window-concept-intro
title: Sliding Window Core Concept
module: sliding-window
pattern_label: Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能說明為何每個 subarray 都從頭重新計算會導致重複的工作。
  - 能追蹤加入新元素與移除舊元素如何更新視窗狀態。
---
## Concept

處理「連續 subarray / substring」的統計問題時，暴力解對每個起點都重新計算整段區間：長度 n 的陣列有 O(n) 個起點，每段平均掃 O(n) 個元素，合計 O(n^2)。但相鄰兩段幾乎完全重疊——區間 `[0..3]` 與 `[1..4]` 共享三個元素，重算等於把同一個元素數了很多次。Sliding Window 的核心就是不重算重疊部分：把當前區間視為閉區間 `[left, right]` 的視窗（兩端元素都在窗內，長度為 `right - left + 1`），並維護一份能增量更新的狀態（總和、字元頻率等）。右端前進時把 `nums[right]` 納入狀態，左端前進時把 `nums[left]` 的貢獻從狀態中扣除，兩個動作各只花 O(1)，不必重新掃描窗內其餘元素。

## Thinking

為什麼整體是 O(n)？關鍵是攤銷論證：left 與 right 都只向右前進、從不回頭，所以每個元素至多被 right 納入一次、被 left 移出一次——全程的狀態更新至多 2n 次，每次 O(1)，總計 O(n)。就算某一輪左端連續移出好幾個元素（內層 while），那些成本記在「被移出的元素」頭上，而每個元素一生只能被移出一次，總帳仍不超過 2n。這就是攤銷分析：單輪最壞可能 O(n)，攤平到整趟執行後平均每輪 O(1)。設計時依序回答三個問題：一、答案能否由「以每個 right 結尾的視窗」覆蓋？二、視窗狀態是什麼？它必須同時支援 O(1) 的「加入一個元素」與「移除一個元素」。三、左端何時前進？固定長度的視窗在長度超過 k 時移出一格；可變長度的視窗在違反約束時收縮到恢復合法，合法後記錄 `right - left + 1`。

## Pattern Recognition

三個訊號同時出現時優先考慮 Sliding Window：題目問的是連續區間（subarray / substring，而非可跳著選的 subsequence）；要判斷的性質可用能增量維護的統計量表示（總和、計數、頻率）；期望複雜度是線性。反向檢查暴力解也有效：雙重迴圈裡內層計算與上一輪高度重疊、且 left 不需要回溯，就是可滑動的徵兆。它其實是 Linear Scan 的升級——同樣單趟由左往右，只是掃描時多帶著一段有狀態的區間。注意狀態必須「可逆」：總和移除元素只要減回去，但視窗最大值在移除元素後無法還原（見下方錯誤三），單一變數就不夠用。

## Common Mistakes

以下錯誤都不會拋錯，只會安靜給錯答案。一、右端加了、左端忘了扣：只加不減時「視窗總和」其實是前綴和——`nums = [1, 2, 3]`、k = 2，第二個視窗 `[2, 3]` 應得 5，卻得到 1 + 2 + 3 = 6。二、長度寫成 `right - left`：閉區間 `[0, 2]` 含三個元素，`right - left` 算出 2，所有答案都少 1。三、狀態不可逆卻硬滑：想用一個變數維護視窗最大值，窗 `[5, 1]` 的 max 是 5，滑到 `[1, 2]` 時寫 `max(5, 2)` 仍得 5，但真正的 max 是 2——移出的 5 扣不掉，得重掃視窗或改用更進階的結構。

## Complexity

O(n) / O(1)。時間：每個元素至多被納入一次、移出一次，狀態更新合計至多 2n 次，每次 O(1)。空間：以總和這類數值當狀態時只需常數個變數；若狀態是字元頻率表，空間隨字元集大小成長。

## Digest

Sliding Window 把「連續區間統計」的暴力 O(n^2) 壓到 O(n)：以閉區間 `[left, right]` 表示視窗，維護可增量更新的狀態——右端納入 `nums[right]`、左端扣除 `nums[left]`，各 O(1)，長度恆為 `right - left + 1`。正確性靠不重算重疊：`[0..3]` 滑到 `[1..4]` 只動兩端，中間共享的元素原封不動。效率靠攤銷論證：兩個指標只單向前進，每個元素至多進出視窗各一次，全程更新至多 2n 次。實例：`nums = [1, 2, 3]`、k = 2，初始窗 `[1, 2]` 和為 3，滑動時加 3 減 1 得 5，不必重加 `[2, 3]`；若忘記扣除左端貢獻，會得到前綴和 6 而安靜算錯。

## TypeScript Tip

滑動更新與暴力重算必須逐窗相等；任何一行增量更新寫錯，`deepStrictEqual` 都會失敗：

```typescript
import assert from "node:assert";
function windowSums(nums: number[], k: number): number[] {
  const res: number[] = [];
  let sum = 0;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right] ?? 0;
    if (right >= k) sum -= nums[right - k] ?? 0;
    if (right >= k - 1) res.push(sum);
  }
  return res;
}
const nums = [3, -1, 4, 1, 5];
const brute: number[] = [];
for (let i = 0; i + 3 <= nums.length; i++)
  brute.push(nums.slice(i, i + 3).reduce((a, b) => a + b, 0));
assert.deepStrictEqual(windowSums(nums, 3), brute);
assert.deepStrictEqual(windowSums([7], 1), [7]);
```

## Python Tip

拿暴力重算當對照組驗證滑動版；`k = 1` 與「視窗大小等於陣列長度」是最容易差一的邊界：

```python
def window_sums(nums: list[int], k: int) -> list[int]:
    res = []
    total = 0
    for right, x in enumerate(nums):
        total += x
        if right >= k:
            total -= nums[right - k]
        if right >= k - 1:
            res.append(total)
    return res

nums = [3, -1, 4, 1, 5]
brute = [sum(nums[i:i + 3]) for i in range(len(nums) - 2)]
assert window_sums(nums, 3) == brute
assert window_sums([7], 1) == [7]
assert window_sums([2, 4], 2) == [6]
```

## Takeaway

視窗兩端指標只單向前進，每個元素至多納入一次、移出一次，O(1) 狀態轉移把連續區間問題壓到 O(n)。

## Tomorrow Preview

明天進入 Fixed-Size Sliding Window：視窗長度固定為 k，先建好第一個完整視窗，再以「加入右端、移出左端」逐格滑過整個陣列。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請試著向自己重建攤銷論證：為什麼內層收縮迴圈不會讓整體複雜度退回 O(n^2)？
