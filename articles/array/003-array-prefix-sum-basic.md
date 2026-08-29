---
id: array-prefix-sum-basic
title: Basic Prefix Sum Construction
module: array
pattern_label: Prefix Sum
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能獨立推導並實作前綴和的遞迴關係式
  - 理解空間換取時間的概念
---
## Concept

Basic Prefix Sum Construction 是一種透過預先計算陣列累積總和來優化範圍查詢效率的演算法技巧。前綴和陣列 P[i] 定義為原陣列 A 從索引 0 到 i 的所有元素總和。透過這種預處理機制，任何子陣列的區間總和查詢都可以從原本的線性時間複雜度降低至常數時間。

## Thinking

當面對需要重複計算子陣列總和的問題時，直接暴力求解會導致時間複雜度過高。我們可以定義遞迴關係式 P[i] = P[i-1] + A[i]，並透過一次線性掃描預先算好所有前綴。這樣一來，任意區間 [i, j] 的總和就可以透過 P[j] - P[i-1] 在 O(1) 的時間內計算出來，真正做到空間換取時間。

## Pattern Recognition

當題目要求頻繁計算陣列中某個區間的總和，或是涉及連續子陣列的加總查詢時，通常就是 Prefix Sum 這個 Pattern 的辨識線索。

## Common Mistakes

常見的錯誤包含沒有妥善處理陣列索引對齊的問題，例如在處理區間邊界時忘記將起始索引減一，或是忽略了空陣列的邊界條件，導致程式發生索引超出範圍的例外錯誤。

## Complexity

Time Complexity: O(n), Space Complexity: O(n)

## Digest

本單元介紹了 Basic Prefix Sum Construction 的核心概念。我們學習到如何透過 O(n) 的前處理時間來建立前綴和陣列，並將後續的區間查詢優化至 O(1)。這項技巧是處理陣列區間問題的基石，透過空間換取時間的概念，大幅提升程式的執行效率。

## TypeScript Tip

```typescript
function getSubarraySum(prefix: number[], left: number, right: number): number {
  if (left === 0) return prefix[right];
  const sum = prefix[right] - prefix[left - 1];
  if (typeof sum !== "number") throw new Error("assertion failed");
  return sum;
}
const p = [1, 3, 6, 10];
if (getSubarraySum(p, 1, 2) !== 5) throw new Error("assertion failed");
```

## Python Tip

```python
def get_subarray_sum(prefix: list[int], left: int, right: int) -> int:
    if left == 0:
        return prefix[right]
    res = prefix[right] - prefix[left - 1]
    assert isinstance(res, int), "assertion failed"
    return res


p = [1, 3, 6, 10]
assert get_subarray_sum(p, 1, 2) == 5, "assertion failed"
```

## Takeaway

透過預先計算前綴和，將多次區間查詢從 O(n) 優化至 O(1)，掌握 P[i] = P[i-1] + A[i] 遞迴關係式是關鍵。

## Tomorrow Preview

明天我們將探討 2D Prefix Sum 的建構與應用，學習如何將一維的前綴和概念擴展到二維矩陣中，以解決子矩陣的範圍查詢問題。

## Today's Challenge

- **1480** · 此題為一維陣列的經典前綴和累加練習，完美對應 Basic Prefix Sum Construction 的核心定義。
  - Hint: 宣告一個相同長度的陣列，依序將當前元素與前一個前綴和相加。
- **560** · 結合前綴和與雜湊表，透過查詢歷史前綴和在線性時間內找出和為目標值的子陣列數量。
  - Hint: 利用 P[j] - P[i] = k 的數學關係，配合雜湊表記錄每個前綴和出現的次數。
