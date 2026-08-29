---
id: binary-search-inclusive-bounds
title: Binary Search Inclusive Bounds
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能為閉區間正確初始化指標。
  - 能使用正確的終止條件。
---
## Concept

Binary Search Inclusive Bounds 是二分搜尋中最經典的實作方式，採用閉區間 [left, right] 來定義搜尋範圍。在此模型中，指標初值分別設定為陣列的左右端點，即 left = 0 且 right = n - 1。迴圈條件使用 left <= right，並根據中間元素與目標值的比較結果來動態調整 left 或 right 的邊界。此方法適用於尋找特定數值或確定數值應該插入的位置。

## Thinking

當我們面對一個已排序的陣列並需要尋找特定元素時，直覺的線性搜尋時間複雜度為 O(n)。透過二分搜尋的包含邊界（Inclusive Bounds）邏輯，我們每次迭代都能將搜尋範圍縮減一半。在初始化 left = 0 與 right = n - 1 後，計算中間索引 mid = Math.floor(left + (right - left) / 2)。如果 nums[mid] 等於目標值，則直接回傳索引；若小於目標值，代表目標在右半部，將 left 更新為 mid + 1；若大於目標值，則將 right 更新為 mid - 1。當 left 超過 right 時，迴圈終止，代表搜尋空間已完全耗盡且未找到目標。

## Pattern Recognition

當題目明確指出輸入陣列為已排序（Sorted Array），且要求我們在對數時間複雜度 O(log n) 內尋找某個確切的數值、邊界或其存在性時，即可強烈識別出應使用 Binary Search Inclusive Bounds 模式。常見的特徵包含：陣列具備單調性（Monotonicity）、要求高效率查詢、且操作範圍受限於陣列邊界內。

## Common Mistakes

最常見的錯誤是在迴圈條件中使用 left < right 而非 left <= right，這會導致當搜尋區間只剩單一元素（即 left 等於 right）時直接跳過檢查，進而漏掉該元素的判斷。另一個常見失誤是更新邊界時寫成 left = mid 或 right = mid，這會造成當區間長度為 2 時陷入無限迴圈。此外，計算 mid 時若直接使用 (left + right) / 2，在某些程式語言中可能會面臨整數溢位（Integer Overflow）的問題。

## Complexity

時間複雜度為 O(log n)，因為每一次迭代均將搜尋範圍減半；空間複雜度為 O(1)，僅需常數等級的變數來儲存指標位置。

## Digest

Binary Search Inclusive Bounds 透過閉區間 [left, right] 與 left <= right 迴圈條件提供穩健的搜尋機制。初始化時 left 指向起點、right 指向終點，每次藉由 mid 調整邊界。TypeScript 與 Python 的實作皆須注意整數溢位防範與邊界更新的正確性（mid + 1 與 mid - 1），確保演算法在 O(log n) 內收斂。

## TypeScript Tip

```typescript
function binarySearchInclusive(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}
if (binarySearchInclusive([1, 3, 5, 7], 5) !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
def binary_search_inclusive(nums: list[int], target: int) -> int:
    left = 0
    right = len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

assert binary_search_inclusive([1, 3, 5, 7], 5) == 2, "assertion failed"
```

## Takeaway

掌握閉區間 [left, right]、while (left <= right) 迴圈條件，以及正確的 mid 計算與邊界更新，是寫出無瑕二分搜尋的關鍵。

## Tomorrow Preview

明日將探討 Binary Search 的另一種延伸變體：Exclusive Bounds 與半開區間 [left, right) 的應用場景，並學習如何處理尋找左側邊界與右側邊界的進階問題。

## Today's Challenge

- **704** · 此題為標準的已排序陣列單一數值精確搜尋，完全符合 Binary Search Inclusive Bounds 的模版與閉區間設計。
  - Hint: 注意初始化 right 為 nums.length - 1，並使用 left <= right 確保單一元素不會被遺漏。
- **34** · 此題要求尋找排序陣列中目標值的起始與結束位置，可透過延伸包含邊界的二分搜尋邏輯分別尋找左右邊界。
  - Hint: 當找到目標時不要立即停止，而是繼續向左或向右收縮邊界以尋找極端位置。
