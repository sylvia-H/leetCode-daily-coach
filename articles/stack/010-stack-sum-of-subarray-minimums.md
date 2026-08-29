---
id: stack-sum-of-subarray-minimums
title: Stack Sum of Subarray Minimums
module: stack
pattern_label: Monotonic Stack Boundary Extension
complexity_label: O(n) / O(n)
estimated_minutes: 25
exit_criteria:
  - 能判斷每個元素在維持最小值的前提下，向左與向右可延伸多遠。
  - 能利用邊界與 modulo 運算計算總貢獻。
---
## Concept

Stack Sum of Subarray Minimums 核心在於計算每一個陣列元素在所有子陣列中成為最小值的貢獻總和。透過維護一個單調遞增的 Monotonic Stack，我們可以高效率地尋找陣列中每個元素左側小於它的最近元素位置（Previous Less Element, PLE）以及右側小於或等於它的最近元素位置（Next Less Element, NLE），藉此精確界定該元素作為最小值所能擴展的最大區間範圍。

## Thinking

在處理 Sum of Subarray Minimums 這類問題時，直覺的暴力解法需要遍歷所有可能的子陣列，時間複雜度高達 O(n^2) 或 O(n^3)，無法應付大規模的輸入數據。因此，我們轉換思考角度：改為計算『每一個元素對答案的貢獻』。對於陣列中的某個元素 nums[i]，我們需要找出它向左能延伸多遠、向右能延伸多遠，使得 nums[i] 依然是該區間內的最小值。假設左邊界距離為 left[i]，右邊界距離為 right[i]，則以 nums[i] 作為最小值的子陣列總數為 (i - left[i]) * (right[i] - i)。透過 Monotonic Stack，我們可以在 O(n) 的時間內一次求出所有元素的左右邊界。

## Pattern Recognition

當題目要求計算『所有子陣列的最小值總和』或『所有子陣列的最大值總和』時，這通常是 Monotonic Stack Boundary Extension 模式的強烈信號。識別線索包括：1. 需要遍歷或加總所有 subarray 的極值。2. 每個元素的有效作用範圍取決於左右兩側第一個小於（或大於）它的元素。利用這個模式能將複雜的區間枚舉轉化為線性的元素貢獻計算。

## Common Mistakes

最常見的錯誤在於處理重複元素時發生重複計算（Double Counting）。當陣列中出現相同數值時，若左右邊界的條件設定不夠嚴謹（例如同時允許小於或等於），會導致同一個最小值被重複計算多次。標準的做法是：左側邊界尋找嚴格小於（<），右側邊界尋找小於或等於（<=），或者反之，藉此確保每個子陣列的最小值都被且僅被計算一次。此外，在處理模運算（Modulo Arithmetic）時，未在適當的步驟進行取模，或是乘法運算導致數值溢位，也是常見的陷阱。

## Complexity

Time Complexity: O(n) - 每個元素最多被推入 Stack 一次並彈出一次，整體遍歷為線性時間。

Space Complexity: O(n) - Stack 以及輔助的陣列（如左邊界、右邊界紀錄）在最壞情況下需要儲存與輸入規模成正比的資料。

## Digest

本篇探討 Stack Sum of Subarray Minimums 核心觀念：利用 Monotonic Stack 求解每個元素作為子陣列最小值時的左右邊界。透過邊界計算貢獻範圍，將原本 O(n^2) 的子陣列枚舉優化至 O(n) 線性時間。實作時務必注意處理重複元素的邊界條件，避免重複計算，並在乘法運算時注意模運算與型態溢位問題。

## TypeScript Tip

```typescript
// TypeScript 實作提示：處理大數乘法與模運算
function safeMultiplyAdd(ans: bigint, l: bigint, r: bigint, val: bigint, mod: bigint): bigint {
  const contribution = (l * r) % mod;
  return (ans + contribution * (val % mod)) % mod;
}
const testAns = safeMultiplyAdd(0n, 2n, 3n, 5n, 1000000007n);
if (testAns !== 30n) throw new Error("assertion failed");
```

## Python Tip

```python
# Python 實作提示：利用內建大整數特性與列表生成式初始化
def init_boundaries(n: int) -> tuple[list[int], list[int]]:
    left = [-1] * n
    right = [n] * n
    return left, right
l_arr, r_arr = init_boundaries(5)
assert len(l_arr) == 5 and r_arr[0] == 5, "assertion failed"
```

## Takeaway

掌握 Monotonic Stack 的邊界擴展模式，將子陣列極值問題轉化為每個元素的貢獻計算，並嚴謹處理重複元素的邊界條件。

## Tomorrow Preview

明天我們將探討 Stack Sum of Subarray Ranges，將視角從「最小值」延伸至「最大值與最小值的差值」，學習如何組合同時維護兩個 Monotonic Stack 的進階技巧。

## Today's Challenge

- **907** · 標準的求所有子陣列最小值總和問題，完美契合 Monotonic Stack 尋找左右最近小於邊界的模式。
  - Hint: 分別尋找左側第一個小於等於（或小於）當前元素的索引，以及右側第一個小於當前元素的索引。
