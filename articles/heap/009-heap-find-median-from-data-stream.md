---
id: heap-find-median-from-data-stream
title: Find Median from Data Stream
module: heap
pattern_label: Two Heaps Balance
complexity_label: O(log n) insert / O(1) median / O(n) space
estimated_minutes: 30
exit_criteria:
  - 能維持兩個 heap 之間的平衡，使兩者的根能直接給出中位數。
---
## Concept

Find Median from Data Stream 使用 Two Heaps Balance 策略，將資料串流拆分為上下兩半。小的一半存放在 Max-Heap 中，大的一半存放在 Min-Heap 中。透過維持兩個 Heap 的大小平衡（大小差不超過 1），我們可以在 O(log n) 時間內插入新元素，並在 O(1) 時間內取得中位數。此結構非常適合需要動態追蹤串流資料分位數（Percentiles）或中位數的場景。

## Thinking

當面對動態資料串流並需要持續查詢中位數時，直覺的排序法每次插入需要 O(n log n)，效率太低。改用 Two Heaps 的思考方式是：如果我們將資料對半切，中位數必定落在兩個半邊的交界處。因此，我們使用一個 Max-Heap 儲存較小的半邊（其根節點為該半邊的最大值），以及一個 Min-Heap 儲存較大的半邊（其根節點為該半邊的最小值）。每次插入時，先將數字放入 Max-Heap，接著將 Max-Heap 的最大值彈出並放入 Min-Heap，若此時 Min-Heap 的大小超過 Max-Heap，則將 Min-Heap 的最小值彈回 Max-Heap，藉此嚴格維持兩個 Heap 的大小不變或 Max-Heap 多一個元素。

## Pattern Recognition

當題目要求在資料串流（Data Stream）中持續新增資料，並且頻繁查詢「中位數（Median）」、「第 k 大元素」或「動態百分位數（Percentiles）」時，應立刻聯想到 Two Heaps Balance 模式。這類問題的特徵是資料不斷流入，且我們不需要保留完整的排序陣列，只需要關注資料的分界點。

## Common Mistakes

最常見的錯誤是沒有確實維護大小平衡（Size Invariant），導致一邊的 Heap 過大而無法正確透過根節點計算中位數。另一個常見錯誤是在實作時忽略了奇數與偶數總資料量時的中位數計算方式：當總數為奇數時，中位數為較大 Heap 的根節點；當總數為偶數時，中位數為兩者根節點的平均值。

## Complexity

時間複雜度：每次插入元素（addNum）需經過 Heap 的調整，時間複雜度為 O(log n)；查詢中位數（findMedian）僅需取兩個 Heap 的根節點，時間複雜度為 O(1)。空間複雜度：O(n)，用於儲存資料串流中的所有元素。

## Digest

Find Median from Data Stream 是使用 Two Heaps Balance 的經典題型。我們透過一個 Max-Heap 儲存較小的一半資料，另一個 Min-Heap 儲存較大的一半資料，巧妙地將資料流分割。維持兩個 Heap 的大小平衡是核心關鍵，使得我們能在 O(1) 時間內取得中位數，並在 O(log n) 時間內完成資料的動態插入。無論是在演習面試還是實際的高頻交易、即時監控系統中，這種雙堆積的架構都扮演著極為重要的角色。

## TypeScript Tip

```typescript
// TypeScript 中標準函式庫未內建 Heap，實務上可自行實作 PriorityQueue 或簡化排序。
// 以下展示透過陣列模擬並加上斷言檢查
const stream: number[] = [1, 2, 3];
const median = stream[1];
if (median !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
import heapq
# Python 預設為 min-heap，模擬 max-heap 時須對所有存入值取負號。
h = []
heapq.heappush(h, -5)
max_val = -heapq.heappop(h)
assert max_val == 5, "assertion failed"
```

## Takeaway

運用 Two Heaps Balance 策略，將資料流分為大小兩半，就能以 O(log n) 插入與 O(1) 中位數查詢完美解決動態中位數問題。

## Tomorrow Preview

明天我們將探討 Sliding Window Maximum，學習如何使用 Monotonic Queue 在滑動視窗中以 O(n) 時間尋找最大值，延續對資料串流與高效結構的深入應用。

## Today's Challenge

- **295** · 必須在資料持續流進的同時動態追蹤中位數，Two Heaps Balance 是唯一能同時達成 O(log n) 插入與 O(1) 查詢的最佳解答。
  - Hint: 將資料對半拆分，利用 Max-Heap 裝小的一半，Min-Heap 裝大的一半，並維持兩者大小平衡。
