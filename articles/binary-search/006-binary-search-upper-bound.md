---
id: binary-search-upper-bound
title: Binary Search Upper Bound
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 'Correctly adjust pointers when nums[mid] > target.'
---
## Concept

Binary Search Upper Bound 是一種二分搜尋的變體演算法，其主要目的是在一個已排序的陣列中，尋找第一個「大於」目標值（target）的元素索引。相較於標準的二分搜尋法在找到目標值時即回傳，Upper Bound 尋找的是大於目標的極限位置，因此當 `nums[mid] > target` 時，我們不能直接回傳該索引，而是必須將右界收縮至 `mid`，繼續在左半邊尋找更小的符合條件之索引。這種演算法在處理範圍查詢（Range Queries）以及計算重複元素的頻率時扮演著不可或缺的角色。

## Thinking

在設計 Upper Bound 演算法時，核心思維在於處理等於目標值的情況。當我們計算出中間索引 `mid` 並比較 `nums[mid]` 與 `target` 時，若 `nums[mid] <= target`，代表此時的元素仍然小於或等於目標值，不可能是我們所尋找的「第一個大於目標的元素」，因此左界應當前進至 `mid + 1`；反之，若 `nums[mid] > target`，此時該元素有可能是我們要找的答案，但為了確保它是「第一個」，我們必須將右界收縮至 `mid`。透過這種區間不斷收縮的機制，最終 `left` 與 `right` 指標會交會於正確的上界位置。

## Pattern Recognition

當題目要求尋找「第一個大於某個值的元素」、「大於目標的最小索引」、或是計算某個數值在排序陣列中出現的區間範圍時，這就是明顯的 Binary Search Upper Bound Pattern。與傳統的 Binary Search 尋找精確匹配不同，此 Pattern 著重於邊界條件的處理與指標的收縮方向。若發現題目涉及區間左右端點的定位，且陣列已排序，通常都可以透過調整 Upper Bound 與 Lower Bound 的搭配來解決。

## Common Mistakes

最常見的錯誤在於指標更新時發生無窮迴圈，例如在 `nums[mid] > target` 時錯誤地寫成 `right = mid - 1`，這會導致跳過正確的大於元素。另一個常見錯誤是迴圈終止條件設定不當，導致當陣列中所有元素都小於或等於目標時，回傳的索引超出陣列範圍，或者沒有妥善處理陣列中存在重複元素時的邊界偏移問題。此外，將 `mid` 的計算寫錯導致溢位也是初學者常犯的技術失誤。

## Complexity

時間複雜度為 O(log n)，因為每一次迴圈都將搜尋範圍縮減一半。空間複雜度為 O(1)，僅使用常數級別的指標變數來儲存左右界與中間索引。

## Digest

本日重點學習 Binary Search Upper Bound 演算法，核心在於尋找陣列中第一個大於 target 的元素索引。透過當 nums[mid] <= target 時移動 left = mid + 1，以及 nums[mid] > target 時移動 right = mid，我們能夠精準定位上界。此技術是解決範圍查詢與多重複元素題目的關鍵基礎。

## TypeScript Tip

```typescript
// TypeScript 提示：使用半開區間 [left, right)
function upperBoundSafe(nums: number[], target: number): number {
  let l = 0, r = nums.length;
  while (l < r) {
    const m = Math.trunc((l + r) / 2);
    if (nums[m] <= target) l = m + 1;
    else r = m;
  }
  if (l !== 3) throw new Error("assertion failed");
  return l;
}
upperBoundSafe([1, 2, 2, 4], 2);
```

## Python Tip

```python
# Python 提示：利用 bisect 模組驗證自定義 Upper Bound 邏輯
import bisect

def verify_upper_bound(nums: list[int], target: int) -> int:
    expected = bisect.bisect_right(nums, target)
    return expected

res = verify_upper_bound([1, 2, 2, 4], 2)
assert res == 3, "assertion failed"
```

## Takeaway

掌握 Upper Bound 的關鍵在於：小於等於時向右逼近，大於時保留並向左收縮，迴圈結束時 left 即為解答。

## Tomorrow Preview

明天我們將探討 Search Insert Position 相關的衍生應用，學習如何在未找到精確匹配時正確地插入元素並維持排序結構。

## Today's Challenge

- **34** · 題號 34 需要找出陣列中目標值的起始與結束位置，其中結束位置的尋找正是透過 Upper Bound 配合 Lower Bound 來精準計算區間邊界。
  - Hint: 分別使用 Lower Bound 尋找第一個大於或等於目標的位置，以及 Upper Bound 尋找第一個大於目標的位置。
