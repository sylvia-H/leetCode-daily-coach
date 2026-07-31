---
id: heap-sift-up-insertion
title: Heap Insertion and Sift-Up Operation
module: heap
pattern_label: Percolate Up
complexity_label: O(log n) time / O(1) space
estimated_minutes: 20
exit_criteria:
  - Can trace how a newly added element bubbles up to its correct position.
---
## Concept

Heap Insertion and Sift-Up Operation 是建構與維護 Binary Heap（二元堆積）資料結構的核心演算法。當我們將一個新的元素加入 Heap 時，為了維持 Heap Property（堆積性質，例如 Max-Heap 中父節點大於等於子節點，Min-Heap 中父節點小於等於子節點），必須將新元素放置於底層的最右側空位（即陣列的尾端），隨後透過 Percolate Up（向上滲透）或 Sift-Up 操作，將該元素與其父節點進行比較與交換，直到滿足 Heap Property 或到達根節點為止。此機制確保了每次動態插入後，資料結構都能在 O(log n) 的時間內恢復平衡。

## Thinking

在思考如何實作 Heap Insertion 時，我們需要結合陣列表示法（Array-based Heap Representation）來定位節點。對於索引為 i 的節點，其父節點的索引為 Math.floor((i - 1) / 2)。思考流程如下：首先，將新元素推送至陣列結尾。此時新元素可能破壞了堆積性質。我們記錄當前元素的索引變數 currentIndex，並進入迴圈。在每一次迭代中，若 currentIndex 大於 0 且當前元素違反了堆積順序（例如在 Min-Heap 中小於父節點），我們就將其與父節點交換位置，並將 currentIndex 更新為父節點的索引。這個過程持續進行，直到 currentIndex 等於 0（到達根節點）或者父節點已經滿足堆積條件為止。這個不斷向上檢查與修正的過程，就是典型的 Percolate Up 模式。

## Pattern Recognition

當題目要求我們維護一個動態資料集，並且需要頻繁且高效地取得或移除極值（Maximum 或 Minimum）時，Heap 便是首選的資料結構。而「Percolate Up」這項 Pattern 的辨識線索在於：當資料以串流形式持續加入，或我們需要在每次新增元素後立即恢復某種順序限制（Order Constraints）時，我們就會在插入階段採用自底向上的 Sift-Up 操作。這種模式常見於 Priority Queue（優先佇列）的底層實作、即時資料流的中位數維護，以及 Dijkstra 演算法中節點距離的動態更新。

## Common Mistakes

在實作 Sift-Up 演算法時，常見的錯誤包括：第一，沒有正確處理邊界條件，導致索引小於 0 時發生陣列存取錯誤，或忘記在到達根節點（index 0）時終止迴圈；第二，計算父節點索引時未妥善處理整數除法，導致在某些語言中產生浮點數或錯誤的偏移量；第三，在進行元素交換時遺漏了暫存變數或未正確更新迴圈指標，造成無窮迴圈。此外，部分開發者會混淆 Max-Heap 與 Min-Heap 的比較條件，導致新元素無法正確上浮。

## Complexity

Time Complexity: O(log n)，其中 n 為 Heap 中的節點總數。因為完全二元樹的高度為 log n，Sift-Up 操作最多只需要從底層走到根節點，交換次數不會超過樹的高度。Space Complexity: O(1)，因為整個上浮與交換過程都是在原陣列（In-place）中進行，不需要額外的記憶體空間。

## Digest

Heap Insertion and Sift-Up Operation 是建構優先佇列的基礎。當我們將元素加入 Heap 時，必須先將其放於陣列結尾，接著透過 Percolate Up 模式不斷與父節點比較並交換，直到恢復堆積性質。此操作的時間複雜度為 O(log n)，空間複雜度為 O(1)。實作時務必注意根節點的終止條件與父節點索引的計算精確性。

## TypeScript Tip

在 TypeScript 中實作 Heap 時，陣列解構賦值（Array Destructuring）[a, b] = [b, a] 可以非常乾淨地完成變數交換。但務必確保迴圈條件包含 index > 0，並在每次交換後更新指標。
```typescript
function siftUp(heap: number[], index: number): void {
  while (index > 0) {
    const parent = Math.floor((index - 1) / 2);
    if (heap[index] >= heap[parent]) break;
    [heap[index], heap[parent]] = [heap[parent], heap[index]];
    index = parent;
  }
}
const testHeap = [5, 10, 3];
siftUp(testHeap, 2);
if (testHeap[0] !== 3) throw new Error("assertion failed");
```

## Python Tip

Python 的整數除法運算子 // 非常適合用來計算二元樹中父節點的索引（(index - 1) // 2）。同時，Python 原生支援的多重指定（Multiple Assignment）語法能讓元素交換變得極其簡潔。
```python
def sift_up(heap: list[int], index: int) -> None:
    while index > 0:
        parent = (index - 1) // 2
        if heap[index] >= heap[parent]:
            break
        heap[index], heap[parent] = heap[parent], heap[index]
        index = parent

test_heap = [5, 10, 3]
sift_up(test_heap, 2)
assert test_heap[0] == 3, "assertion failed"
```

## TypeScript Corner

```typescript
class MinHeap {
  private heap: number[] = [];

  public insert(val: number): void {
    this.heap.push(val);
    this.siftUp(this.heap.length - 1);
  }

  private siftUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index] < this.heap[parentIndex]) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  public getMin(): number {
    return this.heap[0];
  }
}

const minHeap = new MinHeap();
minHeap.insert(5);
minHeap.insert(3);
minHeap.insert(8);
if (minHeap.getMin() !== 3) throw new Error("assertion failed");
```

## Python Corner

```python
class MinHeap:
    def __init__(self) -> None:
        self.heap: list[int] = []

    def insert(self, val: int) -> None:
        self.heap.append(val)
        self._sift_up(len(self.heap) - 1)

    def _sift_up(self, index: int) -> None:
        while index > 0:
            parent_index = (index - 1) // 2
            if self.heap[index] < self.heap[parent_index]:
                self.heap[index], self.heap[parent_index] = self.heap[parent_index], self.heap[index]
                index = parent_index
            else:
                break

    def get_min(self) -> int:
        return self.heap[0]

min_heap = MinHeap()
min_heap.insert(5)
min_heap.insert(3)
min_heap.insert(8)
assert min_heap.get_min() == 3, "assertion failed"
```

## Takeaway

Heap Insertion 透過在陣列結尾新增元素並執行 Sift-Up，以 O(log n) 時間維持堆積性質。

## Tomorrow Preview

在掌握了 Heap Insertion 與 Sift-Up 操作之後，我們明天將探討相對應的 Heap Deletion 與 Sift-Down（也稱為 Percolate Down 或 Heapify）操作。我們將學習如何在移除堆積頂端元素（Root）後，利用對稱的向下調整機制維持堆積的完整性與高效能。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
