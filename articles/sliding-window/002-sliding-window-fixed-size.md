---
id: sliding-window-fixed-size
title: Fixed-Size Sliding Window
module: sliding-window
pattern_label: Fixed-Size Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能寫出初始化第一個大小為 k 的視窗的迴圈結構。
  - 能在 O(n) 時間內正確地將視窗滑過陣列其餘部分。
---
## Concept

Fixed-Size Sliding Window 處理「長度固定為 k 的連續 subarray」問題：維護一個長度恆為 k 的閉區間視窗，左右兩端同步前進。暴力解對 n - k + 1 個起點各掃 k 個元素，O(n * k)；固定視窗滑動時只做兩件事——把新進右端的元素加入狀態、把離開左端的元素從狀態扣除——每步 O(1)，整體 O(n)。邊界慣例與字串課的視窗完全一致：視窗是閉區間 `[left, right]`，兩端元素都在窗內，長度恆為 `right - left + 1 = k`；每輪先納入右端，再移出左端。

## Thinking

程式分兩階段。第一階段初始化：用一個迴圈加總索引 0 到 k - 1，建出第一個完整視窗——這也是第一個可以記錄答案的時刻。第二階段滑動：讓 i 從 k 走到 n - 1，每輪 `sum += nums[i] - nums[i - k]`，更新後的視窗是 `[i - k + 1, i]`。正確性用迴圈不變式說清楚：「每輪更新後，sum 恰等於視窗 `[i - k + 1, i]` 內元素的總和」——初始迴圈建立它，之後每輪一加一減，改動的恰好是新舊視窗的差集，中間 k - 1 個共享元素的貢獻原封不動，不變式由歸納法維持成立。這個結構等價於字串課的單迴圈寫法（每輪先納入 `s[right]`，right >= k 時移出 `s[right - k]`，right == k - 1 起開始記錄），只是把「移出」的條件攤開成兩段迴圈。差一陷阱集中在移出的索引：該扣的是 `nums[i - k]`；`nums[i - k + 1]` 是新視窗的左端、還在窗內，扣它就錯了。

## Pattern Recognition

題目把長度講死，就是固定視窗的訊號：「長度為 k 的子陣列」的最大平均值、總和、符合條件的個數；或「以每個位置為中心、半徑 k 的區間」——那其實是長度 2k + 1 的固定視窗。搭配的狀態必須能增量更新：總和、計數、頻率表都可以。若題目問的是「最長／最短」而長度不固定、收縮時機由條件決定，那是下一課可變視窗的守備範圍。

## Common Mistakes

以下錯誤都能跑、不拋錯，只會安靜給錯答案。一、移出索引差一：寫成 `sum += nums[i] - nums[i - k + 1]`，在 `nums = [1, 2, 3]`、k = 2 上第二個視窗算出 3 + 3 - 2 = 4（正確是 5）——被扣掉的 2 其實還在窗內。二、初始視窗少建一格：初始迴圈只跑到 k - 2，同一個例子初始 sum = 1，之後每個視窗都少算一個元素，得到 `[1, 3]` 而非 `[3, 5]`。三、沒擋 `n < k`：Python 的 `sum(nums[:k])` 在 `nums = [1, 2]`、k = 3 時不報錯、安靜加完整個陣列得 3，把不完整的視窗當成答案；TypeScript 則視寫法而定——`nums[i]` 讀到 `undefined` 使總和變成 NaN，或 `?? 0` 把缺格當 0——同樣不會拋錯。

## Complexity

時間 O(n)：初始迴圈做 k 次加法，滑動迴圈 n - k 輪、每輪一加一減——每個元素恰好被加入一次、至多被扣除一次，合計至多 2n 次 O(1) 運算。空間 O(1)：只需要總和與最佳值等常數個變數，與 n、k 無關。

## Digest

固定視窗長度恆為 k：先用迴圈加總索引 0 到 k - 1 建出第一個視窗，再讓 i 從 k 走到尾，每輪 `sum += nums[i] - nums[i - k]`，視窗變成閉區間 `[i - k + 1, i]`。不變式「sum 恆等於當前視窗總和」由一加一減維持：中間 k - 1 個共享元素動都不動。實例：`nums = [1, 2, 3]`、k = 2，初始 sum = 3，滑動時加 3 減 1 得 5；扣錯成 `nums[i - k + 1]` 會得 4。三個必檢邊界：`n < k` 要先擋掉（Python 切片與 JS 索引都不報錯，只會安靜算錯）；移出的是 `nums[i - k]` 不是 `nums[i - k + 1]`；平均值判斷改寫成 `sum >= threshold * k` 的整數比較，連除法都省下。

## TypeScript Tip

`noUncheckedIndexedAccess` 下索引存取用 `?? 0` 收斂型別；先擋 `n < k` 再初始化：

```typescript
import assert from "node:assert";
function maxWindowSum(nums: number[], k: number): number | null {
  if (nums.length < k) return null;
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i] ?? 0;
  let best = sum;
  for (let i = k; i < nums.length; i++) {
    sum += (nums[i] ?? 0) - (nums[i - k] ?? 0);
    best = Math.max(best, sum);
  }
  return best;
}
assert(maxWindowSum([1, 12, -5, -6, 50, 3], 4) === 51);
assert(maxWindowSum([2, 4], 2) === 6);
assert(maxWindowSum([5], 1) === 5);
assert(maxWindowSum([1, 2], 3) === null);
```

## Python Tip

「平均 >= threshold」改寫成整數比較 `total >= threshold * k`，滑動時一加一減：

```python
def count_qualified(nums: list[int], k: int, threshold: int) -> int:
    if len(nums) < k:
        return 0
    target = threshold * k
    total = sum(nums[:k])
    count = 1 if total >= target else 0
    for i in range(k, len(nums)):
        total += nums[i] - nums[i - k]
        if total >= target:
            count += 1
    return count

assert count_qualified([2, 2, 2, 2, 5, 5, 2, 8], 3, 4) == 3
assert count_qualified([7, 7], 2, 7) == 1
assert count_qualified([5], 1, 5) == 1
assert count_qualified([1, 2], 3, 1) == 0
```

## Takeaway

先建好第一個大小為 k 的視窗，之後每輪加 `nums[i]`、減 `nums[i - k]`，O(n) 掃完所有定長子陣列。

## Tomorrow Preview

明天進入 Variable-Size Sliding Window 的擴張階段：視窗長度不再固定，右端逐格納入新元素、狀態隨之成長，學會判斷視窗該擴張到何時。

## Today's Challenge

- **643** · 求長度恰為 k 的連續子陣列最大平均值：長度給死、狀態是可增量更新的總和，是固定視窗的原型題。
  - Hint: 全程維護視窗總和取最大值，最後才除以 k；逐窗做除法既多餘又引入浮點。
- **1343** · 計算長度為 k 且平均值大於等於門檻的子陣列個數，每滑一格做一次 O(1) 判斷。
  - Hint: 把「平均 >= threshold」改寫成整數比較 `sum >= threshold * k`，滑動時一加一減即可。
- **2090** · 求每個位置半徑為 k 的子陣列平均值，本質是長度 2k + 1 的固定視窗加上整數除法。
  - Hint: 前 k 個與後 k 個位置沒有完整半徑，結果填 -1；其餘位置以視窗總和整除 2k + 1。
