---
id: heap-top-k-frequent-elements
title: Top K Frequent Elements
module: heap
pattern_label: Frequency Heap
complexity_label: O(n log k) time / O(n) space
estimated_minutes: 25
exit_criteria:
  - 能使用 min-heap 取出頻率最高的 K 個元素。
---
## Concept

Top K Frequent Elements (id: heap-top-k-frequent-elements) 是一個結合雜湊表 (Hash Map) 與優先佇列 (Priority Queue) 的經典演算法模式。當我們需要在一組資料中找出出現頻率最高的前 K 個元素時，若直接進行全域排序 (Global Sorting)，其時間複雜度為 O(N log N)。然而，透過大小限制為 K 的最小堆積 (Min-Heap)，我們能將時間複雜度優化至 O(N log K)。此模式的核心精神在於利用雜湊表在 O(1) 時間內統計頻率，再利用最小堆積動態維護當前頻率最高的 K 個元素，當堆積大小超過 K 時即拋棄頻率最小的元素，從而達到高效過濾的效果。

## Thinking

在思考此類問題時，首要任務是釐清資料的結構與目標。資料本身是無序的陣列，且我們關心的是「頻率 (Frequency)」，而非元素本身的數值大小。因此，步驟一必須建立頻率對照表，將每個元素映射到其出現的次數。步驟二則是挑選前 K 個高頻元素。如果使用完整排序會浪費時間在處理不需要的資料上。此時「最小堆積 (Min-Heap)」即為最佳選擇：我們讓堆積的大小維持在 K，堆積頂端 (Top) 永遠是這 K 個元素中頻率最小的那一個。當我們遍歷新的元素及其頻率時，若其頻率大於堆積頂端的頻率，就將其放入堆積並彈出頂端元素。這樣一來，遍歷結束後，堆積內剩下的剛好就是頻率最高的前 K 個元素。

## Pattern Recognition

當題目出現以下特徵時，即可高度懷疑適用 Frequency Heap 模式：1. 尋找「前 K 個 (Top K)」或「最頻繁 (Most Frequent)」的元素。2. K 的數值通常小於或等於相異元素的總數。3. 需要在串流資料或大規模未排序資料中動態維護局部極值。辨識的關鍵在於將「排序所有元素」的思維轉換為「維護固定大小 K 的優先佇列」。與完全排序的 O(N log N) 相比，當 K 遠小於 N 時，O(N log K) 能夠帶來顯著的效能提升。

## Common Mistakes

此模式最常見的錯誤包含：第一，直接將原始元素放入堆積中進行排序，而沒有將「頻率 (Frequency)」作為排序的依據或主要權重，導致堆積根據元素數值而非出現次數來進行排序。第二，誤用最大堆積 (Max-Heap) 來尋找 Top K。雖然直覺上最大堆積能直接吐出最大值，但如果要維護前 K 大的元素，使用大小為 K 的最小堆積，每次踢掉最小值，反而是記憶體與效能最佳化的標準作法。第三，忽略了當頻率相同時的邊界條件處理，導致型別推斷錯誤或陣列解構異常。

## Complexity

O(n log k) time / O(n) space

## Digest

本篇探討 Top K Frequent Elements 的核心概念。我們學習了結合 Hash Map 進行頻率統計，並透過最小堆積在 O(N log K) 時間內選出最高頻的 K 個元素。透過辨識 Frequency Heap 的特徵，能有效避免全面排序帶來的效能浪費。

## TypeScript Tip

```typescript
import assert from 'node:assert';

// TypeScript 中若無原生 Heap，常使用 Map 統計後透過排序或實作 MinPriorityQueue
function quickTest(): void {
    const map = new Map<string, number>();
    map.set('apple', 5);
    assert.strictEqual(map.get('apple'), 5);
}

quickTest();
```

## Python Tip

```python
import heapq
from collections import Counter

# Python 的 heapq 預設為 Min-Heap，使用 Counter 可以極大幅度簡化頻率統計的程式碼
def py_tip_example():
    nums = [1, 2, 2, 3, 3, 3]
    counts = Counter(nums)
    top_two = counts.most_common(2)
    assert len(top_two) == 2

py_tip_example()
```

## Takeaway

運用 Hash Map 統計頻率，搭配大小為 K 的最小堆積，能將 Top K 問題的時間複雜度從 O(N log N) 壓低至 O(N log K)。

## Tomorrow Preview

明天我們將探討「Kth Largest Element in an Array」，深入解析如何利用 Quickselect 演算法在平均 O(N) 的時間內找出陣列中的第 K 大元素，並比較其與 Heap 模式在空間與時間複雜度上的權衡。

## Today's Challenge

- **347** · 本題直接對應 Frequency Heap 核心模式，要求在未排序陣列中找出出現頻率最高的前 K 個元素，非常適合使用雜湊表統計頻率後透過最小堆積維護。
  - Hint: 先使用雜湊表計算每個數字的出現次數，再建立一個大小為 k 的最小堆積來保留前 k 個高頻元素。
