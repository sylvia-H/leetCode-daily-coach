---
id: array-linear-scan
title: Array Linear Scan and Traversal
module: array
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
estimated_minutes: 12
exit_criteria:
  - 能寫出安全走訪陣列邊界的迴圈
  - 能正確在走訪過程中累積狀態
---
## Concept

Array Linear Scan and Traversal 是資料結構與演算法中最基礎的走訪技巧。透過循序漸進地檢查陣列中的每一個元素，開發者能夠對陣列資料進行讀取、條件過濾、狀態累積或轉換。這種技巧適用於未排序或任意順序的陣列，確保不會遺漏任何一個成員，是建構更複雜演算法的基石。

## Thinking

在面對 Array Linear Scan 問題時，思考的核心在於如何設定迴圈的邊界條件以及如何維護迭代過程中的狀態。首先必須確定陣列的長度 n，並建立從索引 0 到 n-1 的迭代機制。在每一次的迴圈迭代中，僅處理單一元素，並透過區域變數或累加器來記錄計算結果。確保迴圈不會發生超出邊界（Out of Bounds）的錯誤，並且在迴圈結束後正確返回累積的狀態或最終結果。

## Pattern Recognition

當題目要求檢查陣列中的所有元素、尋找符合特定條件的目標值、計算整體總和或前綴和，且陣列本身未經排序而無法使用 Binary Search 時，即可明確辨識出應採用 Linear Scan Pattern。

## Common Mistakes

最常見的錯誤在於迴圈終止條件設定錯誤，例如將索引範圍寫成小於等於 n 而導致 Index Out of Bounds 例外。另一個常見問題是在處理雙重迴圈或複雜索引對應時，未正確同步更新狀態變數，導致累加結果或最終輸出發生偏移。

## Complexity

時間複雜度為 O(n)，因為必須走訪陣列中的每個元素恰好一次；空間複雜度為 O(1)，若僅使用常數額外變數來維護狀態，則不需要額外的資料結構儲存空間。

## Digest

本單元聚焦於 Array Linear Scan and Traversal 的核心觀念與應用。線性掃描是逐一檢查陣列中每個元素的最基本操作，時間複雜度為 O(n)。透過正確設定迴圈邊界並在迭代過程中維護狀態變數，能夠有效解決各類前綴和、串接與乘積計算等問題。掌握此基礎技巧是解開更複雜陣列題目的重要前提。

## TypeScript Tip

```typescript
function tsTraversalDemo(nums: number[]): number[] {
  const result: number[] = [];
  for (const num of nums) {
    result.push(num * 2);
  }
  if (result[0] !== 2) throw new Error("assertion failed");
  return result;
}
tsTraversalDemo([1, 2, 3]);
```

## Python Tip

```python
def py_traversal_demo(nums: list[int]) -> list[int]:
    result = [num * 2 for num in nums]
    assert result[0] == 2, "assertion failed"
    return result

py_traversal_demo([1, 2, 3])
```

## TypeScript Corner

```typescript
function linearScanSum(nums: number[]): number {
  let total = 0;
  for (let i = 0; i < nums.length; i++) {
    total += nums[i];
  }
  if (total !== 15) throw new Error("assertion failed");
  return total;
}
linearScanSum([1, 2, 3, 4, 5]);
```

## Python Corner

```python
def linear_scan_sum(nums: list[int]) -> int:
    total = 0
    for num in nums:
        total += num
    assert total == 15, "assertion failed"
    return total

linear_scan_sum([1, 2, 3, 4, 5])
```

## Takeaway

線性掃描是陣列演算法的基石，透過正確的迴圈邊界控制與狀態累積，能在 O(n) 時間內安全處理所有元素。

## Tomorrow Preview

明天我們將深入探討 Two Pointers 技巧，學習如何在已排序或特定結構的陣列中，透過雙指標的移動來大幅降低搜尋與配對的時間複雜度。

## Today's Challenge

- **1480** · 需要透過線性掃描陣列中的每個元素，依序累加前綴和並建構出結果陣列。
  - Hint: 在走訪過程中維持一個累加變數，將當前元素與前一個累加和相加。
- **1929** · 需要走訪原陣列，並將元素依序複製兩次以建構出串接後的陣列。
  - Hint: 可以透過兩次線性掃描或直接利用陣列串接運算來完成。
- **238** · 需要透過兩次線性掃描，分別計算每個元素左側與右側所有元素的乘積。
  - Hint: 利用兩次迴圈，第一次由左至右計算前綴乘積，第二次由右至尾反向乘入後綴乘積。
