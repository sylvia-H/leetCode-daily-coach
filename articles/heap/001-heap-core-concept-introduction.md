---
id: heap-core-concept-introduction
title: Heap and Priority Queue Core Concept
module: heap
pattern_label: Heap / Priority Queue
complexity_label: O(log n) / O(n)
estimated_minutes: 15
exit_criteria:
  - Can explain the difference between min-heap and max-heap properties.
---
## Concept

Heap and Priority Queue 核心概念是理解這種以完全二元樹（Complete Binary Tree）為基礎的資料結構。Heap 分為兩種：Max-Heap 要求任一節點的值大於或等於其子節點；Min-Heap 則要求任一節點的值小於或等於其子節點。透過這種結構，我們能夠以 O(1) 的時間複雜度取得最值（最大值或最小值），並以 O(log n) 的時間複雜度進行插入與刪除操作。Priority Queue 則是基於 Heap 實作的抽象資料型態，確保每次取出的元素都具有最高的優先權。

## Thinking

當我們在思考 Heap 相關問題時，必須視覺化樹狀結構，但同時要切記 Heap 僅保證父節點與子節點之間的大小關係，並不保證整個陣列完全排序。例如在 Max-Heap 中，根節點必定是最大值，但右子樹的所有元素不見得小於左子樹的所有元素。我們利用陣列來儲存 Complete Binary Tree，透過固定的索引運算（例如索引 i 的左子節點為 2*i + 1，右子節點為 2*i + 2）在記憶體中連續配置，以達到極佳的快取區域性與空間效率。

## Pattern Recognition

辨識是否需要使用 Heap 或 Priority Queue 的核心線索在於：當問題需要動態地、頻繁地存取當前資料集中的最小值或最大值，而資料集又會不斷有新元素加入或舊元素移除時，就是標準的 Heap 應用場景。常見的情境包含即時串流資料的中位數維護、合併多個已排序的串列、以及 Top K 元素的尋找。相較於每次都重新排序（O(n log n)），Heap 維護最值的時間複雜度為 O(log n)，效率更高。

## Common Mistakes

最常見的錯誤是假設 Heap 是一個完全排序好的陣列，因而嘗試直接用二分搜尋法搜尋任意元素。另一個常見誤區是混淆 Min-Heap 與 Max-Heap 的性質，導致在自訂比較函式時寫反條件。此外，開發者常誤以為 Priority Queue 等同於標準 Queue，忽略了 Priority Queue 每次出隊的是優先權最高而非最早進入的元素。

## Complexity

時間複雜度：插入與刪除（extract-max / extract-min）操作皆為 O(log n)，而取得最值（peek）為 O(1)，將一個無序陣列建構成 Heap（Heapify）的時間複雜度為 O(n)。空間複雜度為 O(n)，用於儲存樹狀節點的陣列。

## Digest

本篇探討 Heap 與 Priority Queue 的底層核心觀念，涵蓋 Min-Heap 與 Max-Heap 的結構性質、時間與空間複雜度分析，以及在演變過程中的常見迷思。我們理解到 Heap 本質上是透過完全二元樹維持局部有序，而非全域排序，並學會辨識何時該使用它來處理動態最值查詢問題。

## TypeScript Tip

在 TypeScript 中若不想自行實作複雜的 Heap，建議在允許使用第三方套件的環境下選擇效能優良的套件；若需手動實作，務必注意陣列索引的邊界條件與交換邏輯。
```typescript
function testHeapTip(): void {
  const queue: number[] = [1, 2, 3];
  const last = queue.pop();
  if (last !== 3) throw new Error("assertion failed");
}
testHeapTip();
```

## Python Tip

Python 的 heapq 預設為 Min-Heap。若需要 Max-Heap 的效果，常見的技巧是將數值取負數後再進行推入與彈出操作。
```python
import heapq

def max_heap_trick() -> int:
    max_heap = []
    heapq.heappush(max_heap, -5)
    heapq.heappush(max_heap, -10)
    largest = -heapq.heappop(max_heap)
    assert largest == 10, "assertion failed"
    return largest

max_heap_trick()
```

## TypeScript Corner

TypeScript 本身沒有內建的 Heap 或 Priority Queue 類別，因此開發者通常需要自行實作陣列基礎的二元堆積，或透過第三方套件處理。
```typescript
class MinHeap {
  private heap: number[] = [];
  
  public push(val: number): void {
    this.heap.push(val);
    this.bubbleUp(this.heap.length - 1);
  }
  
  public pop(): number | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.bubbleDown(0);
    }
    return top;
  }
  
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent] <= this.heap[index]) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }
  
  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let smallest = index;
      
      if (left < length && this.heap[left] < this.heap[smallest]) smallest = left;
      if (right < length && this.heap[right] < this.heap[smallest]) smallest = right;
      if (smallest === index) break;
      
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

const minHeap = new MinHeap();
minHeap.push(5);
minHeap.push(3);
const val = minHeap.pop();
if (val !== 3) throw new Error("assertion failed");
```

## Python Corner

Python 標準庫提供了 heapq 模組，預設實作 Min-Heap，直接運作於標準串列之上。
```python
import heapq

def solve_heap() -> int:
    nums = [5, 3, 8, 1]
    heapq.heapify(nums)
    smallest = heapq.heappop(nums)
    heapq.heappush(nums, 2)
    current_min = nums[0]
    assert smallest == 1, "assertion failed"
    assert current_min == 2, "assertion failed"
    return current_min

solve_heap()
```

## Takeaway

Heap 以 O(log n) 維護動態最值，支援高效率的即時資料處理。

## Tomorrow Preview

明天我們將探討 Heap 的進階應用與經典題型，學會如何運用雙 Heap 解決動態資料流的中位數問題，並深入分析 Top K 演化題目的最佳解法。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
