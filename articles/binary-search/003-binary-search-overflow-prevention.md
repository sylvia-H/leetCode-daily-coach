---
id: binary-search-overflow-prevention
title: Binary Search Overflow Prevention
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - >-
    Use mid = left + Math.floor((right - left) / 2) instead of (left + right) /
    2.
---
## Concept

在進行 Binary Search 時，計算中間點 (mid) 的傳統寫法 (left + right) / 2 隱含著整數溢位 (Integer Overflow) 的風險。當資料規模極大，導致 left 與 right 的總和超過程式語言中整數型別的最大限制時，會產生未定義行為或負數結果。為了確保演算法的正確性與穩健性，必須採用防溢位的中間點計算公式：left + Math.floor((right - left) / 2) 或等效的位元運算。

## Thinking

當面對陣列規模極大或輸入範圍達到資料型別邊界的 Binary Search 問題時，思考的核心在於如何安全地取得區間中點。若直接相加兩個大型索引，極易破壞數值邊界。因此，分析過程應當轉移至計算兩者的距離（right - left），將其除以 2 後再加回起始點 left，從根本上避開大數相加的溢位風險，確保索引指引始終精準指向正確位置。

## Pattern Recognition

當題目具備以下特徵時，即可辨識出需要特別防範整數溢位的 Binary Search Pattern：1. 陣列或搜尋範圍極大，數值可能接近資料型別上限。2. 使用強型別且固定位寬整數的語言（如 C++, Java, TypeScript）。3. 演算法核心高度依賴重複的中間點精確定位。只要符合這些條件，就必須套用防溢位公式以確保程式碼品質。

## Common Mistakes

最常見的錯誤是沿用直覺式寫法 (left + right) / 2，忽略了動態範圍擴大時可能帶來的溢位危機。在某些動態型別語言中，雖然不會立即拋出溢位錯誤，但若直接移植至嚴格型別環境則會引發編譯或執行期異常。此外，在實作除法時未妥善處理向下取整（Floor Division），也容易導致在處理負數或奇數長度區間時陷入無窮迴圈。

## Complexity

Time Complexity: O(log n)，因為每次迭代或遞迴都將搜尋範圍減半。Space Complexity: O(1)，僅使用常數空間來儲存指針變數。

## Digest

本單元聚焦於 Binary Search 的基礎防禦機制：整數溢位預防。在傳統實作中，(left + right) / 2 面臨著數值超出上限的風險。透過數學等價轉換，改寫為 left + (right - left) // 2，我們能夠在不改變區間中點語意的同時，徹底消除大數相加的隱患。無論在強型別的 TypeScript 還是動態型別的 Python 中，養成這種防禦性編程習慣都是成為專業工程師的重要基石。

## TypeScript Tip

```typescript
function binarySearchOverflowPrevention(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
const idx = binarySearchOverflowPrevention([1, 3, 5, 7], 5);
if (idx !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
def binary_search_overflow_prevention(nums: list[int], target: int) -> int:
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

idx = binary_search_overflow_prevention([1, 3, 5, 7], 5)
assert idx == 2, "assertion failed"
```

## Takeaway

安全計算中點公式 left + (right - left) // 2 是編寫穩健 Binary Search 的核心防線，能有效避免整數溢位。

## Tomorrow Preview

明天的課程將深入探討 Binary Search 在尋找左側邊界與右側邊界（Lower Bound 與 Upper Bound）時的條件判斷細節與迴圈終止條件的設計藝術。

## Today's Challenge

- **374** · 此題需要透過 API 猜測數字，範圍可能達到整數邊界，使用安全的 mid 計算可確保過程萬無一失。
  - Hint: 注意 API 給定的範圍上下限，計算中間點時務必套用防溢位公式。
- **33** · 旋轉排序陣列的搜尋過程涉及複雜的邊界判斷與多次中點計算，嚴謹的中間點公式能防止極端索引造成溢位。
  - Hint: 先判斷哪一部分是有序的，再配合安全的 mid 計算來縮小搜尋區間。
