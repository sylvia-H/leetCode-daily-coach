---
id: bfs-queue-level-order
title: BFS 與佇列層級走訪
module: dfs-bfs
pattern_label: BFS Queue
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能用 Queue 寫出逐層向外擴散的 BFS 迴圈
  - 理解先進先出（FIFO）在層級搜尋中的角色
---
## Concept

廣度優先搜尋（BFS, Breadth-First Search）是一種圖形與樹狀結構的走訪演算法，其核心思想是由近及遠、逐層向外擴散。與深度優先搜尋（DFS）一頭鑽到底的策略不同，BFS 優先造訪距離起點最近的所有鄰近節點，才會繼續前往下一層。為了實現這種先進先出（FIFO, First-In-First-Out）的特性，演算法必須藉由佇列（Queue）資料結構來顯式管理待處理的節點序列。在處理圖的走訪、最短路徑問題或樹的層級結構時，BFS 是最自然且最有效率的標準解法。

## Thinking

當面臨需要尋找最短路徑或按層級處理節點的問題時，思考流程應當直覺地導向 BFS。首先，必須初始化一個 Queue 資料結構，並將搜尋的起始節點放入其中。同時，應建立一個記錄已造訪節點的集合（Visited Set）或陣列，避免重複走訪與陷入無限迴圈。接著進入主迴圈，條件為 Queue 尚有剩餘節點。在每次迴圈中，從 Queue 的前端取出一個節點進行處理，並檢視其所有相鄰節點。對於每一個未曾造訪的鄰居，標記為已造訪後放入 Queue 的尾端。透過這種持續的入隊與出隊操作，節點便會自然地依照距離起點的步數由近到遠被依序處理。

## Pattern Recognition

辨識 BFS 樣板的線索通常具備幾個特徵：第一，題目明確要求「按層級（Level-order）」處理節點，例如二元樹的層序走訪。第二，題目尋找「未帶權重的最短路徑」或「最少步數到達目標」。第三，問題本質屬於圖的擴散、狀態轉換或連通塊搜尋。當看見這些關鍵字時，應立即聯想到使用 Queue 搭配迴圈的 BFS 架構，而非遞歸或 Stack。

## Common Mistakes

初學者在實作 BFS 時最常犯的錯誤，是混淆了 Queue 的先進先出（FIFO）特性與 Stack 的後進先出（LIFO）特性。若誤用 Stack 或是寫出遞歸呼叫，會導致走訪順序變成深度優先，無法正確取得最短路徑或層級結構。另一個常見錯誤是遺漏了「已造訪（Visited）」的標記機制，這在有環的圖形結構中會造成無限迴圈，甚至引發記憶體耗盡錯誤。此外，在處理層級結構時，未能在每層開始前記錄當前 Queue 的長度，導致無法區分不同層級的節點。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表頂點（Vertex）數量，E 代表邊（Edge）數量。每一個頂點都會被進出 Queue 各一次，每一條邊也會被檢查一次。空間複雜度為 O(V)，在最壞情況下，例如完全二元樹的底層或是高度對稱的圖，Queue 中會同時存放大量的節點，其佔用的記憶體空間與圖中的最大寬度成正比。

## Digest

本日課程深入探討了廣度優先搜尋（BFS）的核心觀念與 Queue 的應用。BFS 透過先進先出的特性，確保搜尋過程是由近及遠、逐層向外擴散。在圖論與樹狀結構中，這是尋找最短路徑與層級走訪的最佳策略。我們學習了標準的樣板架構，包含初始化 Queue、處理節點、將未造訪鄰居入隊等步驟。同時分析了時間與空間複雜度，並提醒開發者注意常見的迴圈與標記陷阱。

## TypeScript Tip

```typescript
import assert from "node:assert";

class Queue<T> {
  private items: Map<number, T> = new Map();
  private head: number = 0;
  private tail: number = 0;

  enqueue(item: T): void {
    this.items.set(this.tail, item);
    this.tail++;
  }

  dequeue(): T | undefined {
    if (this.head === this.tail) return undefined;
    const item = this.items.get(this.head);
    this.items.delete(this.head);
    this.head++;
    return item;
  }

  size(): number {
    return this.tail - this.head;
  }
}

const q = new Queue<number>();
q.enqueue(10);
assert.strictEqual(q.dequeue(), 10);
```

## Python Tip

```python
from collections import deque

# 使用 collections.deque 確保 popleft 與 append 操作均為 O(1)
queue = deque([1, 2, 3])
queue.append(4)
val = queue.popleft()

assert val == 1, "assertion failed"
assert len(queue) == 3, "assertion failed"
```

## Takeaway

BFS 以 Queue 實現逐層搜尋，時間 O(V+E)，空間 O(V)，是尋找最短路徑與層級結構的核心工具。

## Tomorrow Preview

明天將探討圖論中的深度優先搜尋（DFS）與回溯法（Backtracking），學習如何深入探索每個分支並在適時回溯時重置狀態，理解 DFS 與 BFS 在應用場景上的本質差異。

## Today's Challenge

- **102** · 題目要求回傳二元樹每一層的節點數值，標準的 Queue 層級走訪能夠完美區分並收集各層節點。
  - Hint: 在進入每層迴圈前先記錄當前 Queue 的長度，以此長度作為該層節點的迭代次數。
