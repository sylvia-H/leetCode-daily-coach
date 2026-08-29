---
id: heap-kth-largest-element
title: Finding Kth Element with Heap
module: heap
pattern_label: Bounded Priority Queue
complexity_label: O(n log k) time / O(k) space
estimated_minutes: 20
exit_criteria:
  - Can maintain a heap of size k to keep track of extreme values.
---
## Concept

使用 Bounded Priority Queue 尋找第 K 個最大或最小的元素是資料結構中的經典技巧。當我們面對一個未排序的串流或陣列，需要找出第 K 大的元素時，如果將整個資料結構進行完整排序，時間複雜度會是 O(n log n)，這在資料量極大或即時串流處理時效率不佳。透過維持一個大小固定為 k 的 Min-Heap（最小堆積），我們可以在 O(n log k) 的時間複雜度內完成任務。核心作法是：遍歷所有元素，當 Heap 的大小小於 k 時，直接將元素推入 Heap；當 Heap 的大小達到 k 時，將當前元素與 Heap 的根節點（目前第 K 大的候選者）進行比較。如果當前元素大於根節點，則將根節點彈出（Pop），並將當前元素推入（Push）。這樣一來，Heap 中永遠只會保留當前掃描過所有元素中最大的 k 個元素，而這 k 個元素中的最小值（即根節點）就是我們要找的第 K 大元素。這種 bounded 策略避免了維護完整排序的昂貴開銷，將空間複雜度精準控制在 O(k)。

## Thinking

在處理這類問題時，思考的切入點通常是：我是否需要記住所有的元素？答案是否定的。如果我們要求的是第 K 大的元素，那麼小於這 k 個最大元素的其餘資料其實都是不需要被完整追蹤的雜訊。因此，資料結構的選擇自然導向 Priority Queue。具體步驟為：第一，初始化一個空的 Min-Heap。第二，迭代輸入的數值集合。第三，將每個數值放入 Heap 中，並透過條件判斷確保 Heap 的長度不超過 k。如果長度超過 k，就必須移除堆積頂端的最小元素。第四，當迭代結束時，Heap 的頂端元素就是全局的第 K 大元素。這個思考過程的關鍵在於『反向思考』：利用 Min-Heap 來過濾掉比前 K 大還要小的元素，留下門檻值在根節點，完美契合串流資料（Streaming Data）與大型陣列的查詢需求。

## Pattern Recognition

當題目明確要求在未排序的陣列、資料流或動態資料集中尋找『第 K 大（Kth Largest）』或『第 K 小（Kth Smallest）』的元素時，這就是 Bounded Priority Queue 的強烈訊號。與其將整個陣列排序 O(n log n)，維護一個大小為 k 的 Heap 可以將時間複雜度降為 O(n log k)。辨識此 Pattern 的另一個特徵是：資料是持續流入的（Streaming），或者資料量非常龐大（n 遠大於 k），導致無法一次性將所有資料載入記憶體進行全局排序。此時，藉由限制 Heap 的大小上限為 k，我們便能以極低的空間代價解決原本看似需要大量記憶體的極值尋找問題。

## Common Mistakes

開發者在實作時最常犯的錯誤是：誤用 Max-Heap 來尋找第 K 大的元素。直覺上，大家可能會覺得『最大』就要用 Max-Heap。然而，如果使用完整的 Max-Heap 儲存所有元素，每次彈出最大值會把真正的第 K 大元素過早丟棄，無法有效率地保留局部極值。正確的做法是使用 Min-Heap 且大小限制為 k：利用 Min-Heap 的特性將較小的元素沈在根部並隨時淘汰，最終留在 Heap 頂端的剛好就是第 K 大的元素。另一個常見錯誤是忘記在每次插入新元素後檢查並維護 Heap 的大小，導致 Heap 的體積膨脹到與輸入陣列相同大小，失去限制容量以優化效能的意義。

## Complexity

Time Complexity: O(n log k)，其中 n 是陣列或串流中的元素總數，k 是需要尋找的極值排名。因為我們隨時維持 Heap 的大小不超過 k，每一次插入與彈出操作的時間複雜度為 O(log k)，總共執行 n 次。Space Complexity: O(k)，因為 Heap 內最多只會儲存 k 個元素，空間消耗與輸入規模 n 無關，僅取決於參數 k 的大小。

## Digest

本篇教材深入探討 Bounded Priority Queue 樣板，針對尋找第 K 大或第 K 小元素的經典場景進行解構。我們學習了如何利用大小固定為 k 的 Min-Heap 來過濾掉不必要的資料，將時間複雜度從全局排序的 O(n log n) 優化至 O(n log k)，同時將空間複雜度壓低至 O(k)。透過明確的步驟拆解與常見陷阱避雷，開發者能更穩健地處理資料流與大規模陣列的極值查詢。

## TypeScript Tip

```typescript
import assert from "node:assert";

function solveWithBoundedHeap(nums: number[], k: number): number {
  const heap: number[] = [];
  for (const num of nums) {
    heap.push(num);
    heap.sort((a, b) => a - b);
    if (heap.length > k) {
      heap.shift();
    }
  }
  const ans = heap[0];
  assert.strictEqual(ans, 5);
  return ans;
}

solveWithBoundedHeap([3, 2, 1, 5, 6, 4], 2);
```

## Python Tip

```python
import heapq

def solve_with_nlargest(nums: list[int], k: int) -> int:
    # Python 的 heapq 模組提供了便捷的 nlargest 封裝
    # 但在演習面試時，手動維護大小為 k 的 min_heap 更能展現基本功
    top_k = heapq.nlargest(k, nums)
    result = top_k[-1]
    assert result == 5, "assertion failed"
    return result

solve_with_nlargest([3, 2, 1, 5, 6, 4], 2)
```

## Takeaway

固定大小的 Min-Heap 是解決 Kth 極值問題的利器，維持 O(n log k) 時間與 O(k) 空間的平衡。

## Tomorrow Preview

明天我們將探討 Two Pointers 技巧在區間與滑動視窗問題中的應用，學習如何有效率地在線性時間內縮減搜尋空間，敬請期待。

## Today's Challenge

- **215** · 題目要求在未排序陣列中尋找第 K 大的元素，利用大小為 k 的 Min-Heap 可以完美的將時間複雜度控制在 O(n log k)，且根節點即為答案。
  - Hint: 遍歷陣列，維持一個容量為 k 的最小堆積，當元素大於堆積頂端時進行置換。
- **703** · 串流資料持續動態加入，每次加入後都需要即時查詢第 K 大的分數。Bounded Priority Queue 能夠在每次插入時維持固定大小的 Heap，確保動態查詢的高效性。
  - Hint: 在建構子中初始化 Min-Heap 並限制大小，add 方法中持續進行 push 與 pop 維護。
