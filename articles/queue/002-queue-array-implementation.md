---
id: queue-array-implementation
title: Queue Array Implementation
module: queue
pattern_label: FIFO Queue
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - Can write a basic queue class using an array.
  - Explain why shift() or pop(0) takes O(n) time complexity in standard arrays.
---
## Concept

Queue Array Implementation 是一種使用線性動態陣列來實作先進先出（FIFO, First-In-First-Out）資料結構的基本方法。在電腦科學中，Queue 就像是排隊買票的隊伍：最先加入隊伍的元素會最先被移除。陣列實作的核心精神在於利用連續的記憶體空間儲存資料，並透過指標或陣列索引來追蹤隊伍的開頭與結尾。然而，當我們直接使用標準的動態陣列來模擬 Queue 時，會面臨一個致命的效能瓶頸：從陣列前端移除元素會導致後續所有元素必須在記憶體中進行位移。

## Thinking

在著手使用陣列實作 Queue 時，我們首先需要思考如何支援兩個最基本的作業：enqueue（將元素加入隊列尾端）以及 dequeue（從隊列前端移除元素）。在多數程式語言的動態陣列中，將元素推入尾端（例如 push 或 append）的時間複雜度為 O(1) 均攤時間。然而，當我們嘗試從陣列前端移除元素時，原本位於索引 0 的元素會被釋放，為了保持其他元素的連續性，其餘所有的元素都必須向前移動一個位置。這種物理上的記憶體搬移操作，導致 dequeue 的時間複雜度劣化為 O(n)，這在面對高頻率的佇列操作時會造成嚴重的效能低落。

## Pattern Recognition

當你在沒有額外匯入專用集合類別、或是僅能使用基礎陣列（Array / List）的環境下，需要實作一個輕量級的 FIFO 資料結構時，就會套用 Queue Array Implementation。辨識此 Pattern 的線索包含：問題明確要求先進先出的處理順序、資料規模相對較小、或是在教學與底層實作場景中探討資料結構的記憶體行為。如果發現演算法在迴圈中頻繁對陣列前端進行刪除操作，就必須警覺這可能隱含效能瓶頸。

## Common Mistakes

最常見的錯誤是忽略了陣列前端移除元素（例如 JavaScript 的 shift() 或 Python 的 pop(0)）背後隱含的 O(n) 效能代價。開發者往往誤以為所有的陣列基本操作都是 O(1)，因而忽略了記憶體位移的開銷。另一個常見的錯誤是手動維護索引時，沒有正確處理指標越界或記憶體浪費的問題，導致隨著 enqueue 與 dequeue 的進行，陣列佔用的記憶體空間不斷膨脹而無法有效回收。

## Complexity

Time Complexity: Enqueue 操作為 O(1)，Dequeue 操作使用基礎陣列移除前端時為 O(n)。Space Complexity: O(n)，其中 n 為佇列中儲存的元素數量。

## Digest

Queue Array Implementation 帶領我們深入理解線性資料結構在記憶體中的物理排列。使用動態陣列實作 Queue 時，雖然尾端新增很有效率，但前端移除卻伴隨著記憶體位移的沉重代價。掌握這個原理，能幫助你在面對高效能需求時，選擇正確的底層資料結構。

## TypeScript Tip

```typescript
class OptimizedQueue<T> {
  private items: { [key: number]: T } = {};
  private head: number = 0;
  private tail: number = 0;

  enqueue(item: T): void {
    this.items[this.tail++] = item;
  }

  dequeue(): T | undefined {
    if (this.head === this.tail) return undefined;
    const item = this.items[this.head];
    delete this.items[this.head];
    this.head++;
    return item;
  }
}

const optQueue = new OptimizedQueue<string>();
optQueue.enqueue("a");
if (optQueue.dequeue() !== "a") throw new Error("assertion failed");
```

## Python Tip

```python
from collections import deque

# 在 Python 中若需要高效的 Queue，應避免使用 list.pop(0)
# 建議使用 collections.deque，其底層實作支援 O(1) 的左右兩端操作

queue = deque([1, 2, 3])
queue.append(4)
val = queue.popleft()
assert val == 1, "assertion failed"
assert len(queue) == 3, "assertion failed"
```

## TypeScript Corner

```typescript
class ArrayQueue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  size(): number {
    return this.items.length;
  }
}

const queue = new ArrayQueue<number>();
queue.enqueue(10);
queue.enqueue(20);
if (queue.dequeue() !== 10) throw new Error("assertion failed");
if (queue.size() !== 1) throw new Error("assertion failed");
```

## Python Corner

```python
class ArrayQueue:
    def __init__(self):
        self.items = []

    def enqueue(self, item):
        self.items.append(item)

    def dequeue(self):
        if not self.is_empty():
            return self.items.pop(0)
        return None

    def is_empty(self):
        return len(self.items) == 0

    def size(self):
        return len(self.items)

queue = ArrayQueue()
queue.enqueue(10)
queue.enqueue(20)
assert queue.dequeue() == 10, "assertion failed"
assert queue.size() == 1, "assertion failed"
```

## Takeaway

理解陣列實作 Queue 的瓶頸在於記憶體位移，切勿在高效能場景中直接使用 shift() 或 pop(0)。

## Tomorrow Preview

明天的課程將進一步探討如何利用雙向鏈結串列（Doubly Linked List）或是環形緩衝區（Circular Buffer）來優化 Queue 的實作，將 dequeue 的時間複雜度從 O(n) 降低至 O(1)，徹底解決陣列位移帶來的效能痛點。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
