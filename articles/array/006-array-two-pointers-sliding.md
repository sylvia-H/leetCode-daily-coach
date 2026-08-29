---
id: array-two-pointers-sliding
title: Sliding Window Fixed Size
module: array
pattern_label: Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能正確建立第一個視窗並在視窗移動時只做 O(1) 的增量更新
  - 能正確控制視窗邊界不超出陣列範圍
---
## Concept

Sliding Window Fixed Size（固定大小滑動視窗）處理的是「在長度固定為 k 的所有子陣列中求極值或統計量」這類問題。暴力解對每個起點都重算一次 k 個元素的總和，時間複雜度是 O(n * k)；但仔細觀察會發現，相鄰兩個視窗其實共享了 k - 1 個元素——視窗右移一格時，**只有一個元素離開、一個元素進入，其餘完全不變**。滑動視窗正是把這個觀察變成演算法：花 O(k) 建立第一個視窗的狀態後，每次右移只做「減去離開者、加上進入者」的 O(1) 增量更新。更新的正確性由等式 `sum(i) = sum(i - 1) - nums[i - k] + nums[i]` 保證：新舊視窗的差異恰好就是這一出一進，重算共享部分純屬浪費。

## Thinking

實作分成兩個階段。第一階段建立初始視窗：累加前 k 個元素（索引 0 到 k - 1），把結果記為當前狀態，同時作為目前最佳解的初始值。第二階段滑動：讓索引 i 從 k 走到 n - 1，每一輪代表視窗右端推進到 i。此時要先弄清楚視窗的座標——右端在 i 的視窗涵蓋 `[i - k + 1, i]`，所以**離開的元素是索引 i - k**，這個換算是邊界正確的關鍵。每輪執行 `sum += nums[i] - nums[i - k]` 後，立刻與全域最佳解比較更新。另一個實務要點：求「最大平均值」時應全程比較總和，最後才除以 k——因為每個視窗的長度同為 k，總和大小關係與平均值完全一致，提早做除法只會引入浮點誤差。

## Pattern Recognition

出現以下線索時，可直接鎖定固定大小滑動視窗：一、輸入是陣列或字串等線性結構；二、題目明確給定子陣列或子字串的長度 k，要求在所有長度恰為 k 的區間中求最大值、最小值、平均值或符合條件的計數；三、暴力解會對重疊區間重複計算。它與對向雙指標的區別在於：這裡左右邊界保持固定間距、朝同一方向前進，而非從兩端向內夾擠；與可變視窗的區別則是長度恆為 k，不需依條件伸縮。

## Common Mistakes

最常見的錯誤有四類。其一，換算離開元素的索引時算錯：右端在 i 時離開的是 i - k，寫成 i - k + 1 或 i - k - 1 都會讓狀態從此失真，且這種累積偏差不會拋出例外，只會默默給出錯誤答案。其二，增量更新只做一半——只加新元素忘了減舊元素（或相反），效果等同視窗不斷變長。其三，迴圈邊界錯誤：滑動迴圈應在 i 達到 n 時停止，共產生 n - k + 1 個視窗，多寫或少寫一輪都會越界或漏掉最後一個視窗。其四，把 k 與索引混淆，例如初始視窗誤累加到索引 k，讓視窗實際長度變成 k + 1。

## Complexity

時間複雜度為 O(n)：建立初始視窗花 O(k)，其後 n - k 次滑動各花 O(1)，合計 O(n)。空間複雜度為 O(1)，只需維護視窗狀態與最佳解兩個變數；若題目要求視窗內更複雜的統計（如字元頻率），空間才會隨之上升。

## Digest

固定大小滑動視窗的核心是一個觀察：相鄰視窗共享 k - 1 個元素，右移一格只有一出一進。因此以 O(k) 建立第一個視窗後，每次滑動只做 `sum += nums[i] - nums[i - k]` 的 O(1) 增量更新，就把 O(n * k) 暴力解壓到 O(n)。實作時鎖住兩個座標事實：右端在 i 的視窗涵蓋 [i - k + 1, i]、離開的元素是 nums[i - k]；求平均值時先比總和、最後才除以 k，可避免浮點誤差。

## TypeScript Tip

以「長度為 k 的子陣列最大總和」為例。注意 `noUncheckedIndexedAccess` 開啟時，索引存取要用 `!` 收斂掉 `undefined`。

```typescript
import assert from "node:assert";
function maxWindowSum(nums: number[], k: number): number {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i]!;
  let best = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i]! - nums[i - k]!;
    best = Math.max(best, sum);
  }
  return best;
}
assert.strictEqual(maxWindowSum([1, 12, -5, -6, 50, 3], 4), 51);
```

## Python Tip

Python 可用切片加 `sum()` 一行建立初始視窗；`max()` 讓最佳解更新保持簡潔。

```python
def max_window_sum(nums: list[int], k: int) -> int:
    window = sum(nums[:k])
    best = window
    for i in range(k, len(nums)):
        window += nums[i] - nums[i - k]
        best = max(best, window)
    return best

assert max_window_sum([1, 12, -5, -6, 50, 3], 4) == 51
```

## Takeaway

相鄰視窗只差一出一進：O(k) 建立首個視窗後，每次滑動只做 O(1) 增量更新，O(n * k) 即壓為 O(n)。

## Tomorrow Preview

明天進入 Sliding Window Variable Size（可變大小滑動視窗）：當題目不再給定長度 k，視窗需要依條件動態擴張與收縮時，如何用 right 擴張、left 收縮的架構找出最短或最長的合法子陣列。

## Today's Challenge

- **643** · 找長度恰為 k 的子陣列最大平均數，是固定視窗的標準題；同長度下平均值與總和大小關係一致，全程比較總和即可。
  - Hint: 先累加前 k 個元素作為初始視窗，之後每輪 sum += nums[i] - nums[i - k]，最後才把最佳總和除以 k。
- **1052** · 祕技持續固定 k 分鐘，等同在「生氣時段才有的挽回量」上找長度為 k 的最大視窗，示範固定視窗與基礎值拆分的組合。
  - Hint: 老闆不生氣時段的顧客先全部計入基礎值，再用長度 k 的視窗找生氣時段可額外挽回的最大顧客數。
- **1456** · 在長度為 k 的子字串中求母音數最大值，示範視窗狀態不限於總和——任何可增量維護的計數都適用。
  - Hint: 進入視窗的字元是母音就 +1，離開的是母音就 -1，維護當前視窗的母音計數即可。
