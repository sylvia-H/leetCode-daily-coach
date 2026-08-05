---
id: binary-search-core-concept
title: Binary Search Core Concept
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - Can explain why time complexity is logarithmic.
  - Can identify sorted array precondition.
---
## Concept

Binary Search 是一種高效的演算法，專門用於在已排序的陣列中尋找特定的目標值。其核心原理是分治法，每次將搜尋區間減半。透過持續比較區間的中間元素與目標值，演算法能夠在每次迭代中排除掉一半不可能包含目標值的元素，從而將搜尋範圍快速縮小。

## Thinking

當我們面對一個已排序的陣列並需要尋找目標值時，直覺的線性搜尋需要 O(n) 的時間複雜度。為了提升效率，我們可以使用兩個指標（例如 left 與 right）來定義當前的搜尋區間。在每次迴圈中，我們計算中間索引 middle，並將 nums[middle] 與目標值進行比較。如果 middle 元素等於目標值，則直接回傳索引；如果目標值小於中間元素，代表目標值必然位於左半邊，我們將右側指標移動到 middle - 1；反之，若目標值大於中間元素，則將左側指標移動到 middle + 1。這個過程持續進行，直到找到目標值或搜尋區間為空。

## Pattern Recognition

當題目具備以下特徵時，通常可以辨識出應使用 Binary Search：第一，輸入的陣列或資料結構已經過排序（或可以透過某種方式轉換為有序狀態）；第二，題目要求尋找特定的元素、數值範圍或滿足某種單調性條件的極值；第三，若使用線性掃描的時間效率過低，且每次操作都能明確排除掉一半的無效搜尋空間。

## Common Mistakes

最常見的錯誤是忽略了前置條件，即陣列必須已經完成排序。如果在未排序的資料上直接套用 Binary Search，將會得到錯誤的結果。另一個常見問題是在計算中間索引 middle 時，沒有使用正確的數值捨去方式，導致在處理極端邊界時產生無限迴圈或浮點數索引錯誤。此外，指標的更新邏輯（如 left = middle + 1 或 right = middle - 1）若處理不當，也容易造成漏掉邊界元素或越界錯誤。

## Complexity

時間複雜度為 O(log n)，因為每次迭代都將搜尋空間減半；空間複雜度為 O(1)，只需要常數級別的變數來儲存指標。

## Digest

Binary Search 透過每次將搜尋空間減半的策略，將時間複雜度從 O(n) 大幅優化至 O(log n)。本單元介紹了標準的 Binary Search 核心概念、指標更新邏輯以及時間與空間複雜度分析，為後續處理更複雜的搜尋問題奠定扎實的基礎。

## TypeScript Tip

```typescript
function safeMidpoint(left: number, right: number): number {
  return Math.floor(left + (right - left) / 2);
}
const mid = safeMidpoint(0, 10);
if (mid !== 5) throw new Error("assertion failed");
```

## Python Tip

```python
def safe_midpoint(left: int, right: int) -> int:
  return left + (right - left) // 2

mid = safe_midpoint(0, 10)
assert mid == 5, "assertion failed"
```

## TypeScript Corner

```typescript
function binarySearch(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}
const result = binarySearch([1, 3, 5, 7, 9], 5);
if (result !== 2) throw new Error("assertion failed");
```

## Python Corner

```python
def binary_search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

result = binary_search([1, 3, 5, 7, 9], 5)
assert result == 2, "assertion failed"
```

## Takeaway

Binary Search 的核心在於利用排序特性每次排除一半無條件解，確保時間複雜度達到 O(log n)。

## Tomorrow Preview

明天我們將探討 Binary Search 的變體應用，學習如何在包含重複元素的陣列中尋找邊界條件，並進一步掌握更複雜的搜尋空間劃分技巧。

## Today's Challenge

- **704** · 此題為標準的已排序陣列搜尋問題，完全符合 Binary Search 的前置條件與核心分治策略。
  - Hint: 注意迴圈條件應使用 left <= right，並利用整數除法計算中間索引。
- **34** · 需要在排序陣列中尋找目標值的左右邊界，可透過兩次 Binary Search 分別找出起始與結束位置。
  - Hint: 當找到目標值時不要停下，而是繼續往左或往右搜尋以找出極端邊界。
