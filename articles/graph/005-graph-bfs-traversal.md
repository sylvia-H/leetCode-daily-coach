---
id: graph-bfs-traversal
title: Graph BFS Traversal
module: graph
pattern_label: Breadth-First Search
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - Find shortest paths in unweighted graphs using BFS.
---
## Concept

Graph BFS Traversal 是一種逐層向外探索圖結構的演算法。相較於 Depth-First Search 傾向深入單一分支，Breadth-First Search 使用 Queue 資料結構，確保節點按照距離起點的步數由近到遠依序被造訪。這種特性使它成為求解未加權圖中最短路徑問題的核心工具。

## Thinking

在設計 Graph BFS 演算法時，首先需要初始化一個 Queue 用於儲存待處理的節點，以及一個 Set 或陣列用來記錄已經造訪過的節點，以防重複處理或陷入無限迴圈。接著將起點推入 Queue 並標記為已造訪。進入迴圈後，持續從 Queue 取出當前節點，檢查其所有鄰居節點。若鄰居節點尚未被造訪，則立即標記為已造訪並推入 Queue 中。透過這種層級推進的機制，可以確保每一個節點都在最短路徑的拍點上被精準觸及。

## Pattern Recognition

當題目要求尋找未加權圖中的最短路徑、處理多源點擴散模擬、或進行層級順序探索時，即可辨識出應採用 Breadth-First Search Pattern。例如在網格中尋找從起點到終點的最少移動步數，或模擬病毒與腐爛橘子在每一分鐘同時向四周擴散的過程，這些場景的本質都是以層級為單位的擴展，非常適合利用 Breadth-First Search 來建模。

## Common Mistakes

最常見的錯誤是在從 Queue 取出節點時才將其標記為已造訪，而不是在將節點推入 Queue 的瞬間進行標記。這種延遲標記的作法會導致同一個節點被不同的前置節點重複推入 Queue 中，造成嚴重的效能浪費甚至記憶體溢位。另一個常見問題是忽略了邊界條件，例如在圖結構可能包含環路或完全不連通時，未正確初始化造訪狀態追蹤。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表頂點總數，E 代表邊的總數。在最壞情況下，每個頂點與每條邊都會被訪問一次。空間複雜度為 O(V)，主要取決於 Queue 在同一時間內最多可能儲存的頂點數量，特別是在圖形呈樹狀向外廣泛擴張時。

## Digest

Graph BFS Traversal 是一種以層級為單位的圖形走訪演算法。透過 Queue 資料結構，演算法能夠確保從起點出發，依序訪問距離為 1、2、3... 的所有節點。這項特性使其在尋找未加權圖的最短路徑時具有決定性的優勢。在實作時，務必在將節點加入 Queue 的當下就標記為已造訪，以避免重複計算。此外，程式語言的選擇至關重要：TypeScript 需要避免使用 Array.shift()，Python 則必須使用 collections.deque，才能確保整體時間複雜度維持在高效的 O(V + E)。掌握此核心 Pattern，將能輕鬆應對各類廣度優先擴散與最短路徑的 LeetCode 題目。

## TypeScript Tip

在 TypeScript 中實作 Graph BFS 時，頻繁的陣列操作是效能殺手。若直接對陣列使用 shift()，會使每次取出節點的成本高達 O(N)，導致整體時間複雜度劣化為 O(V^2)。

```typescript
function solveQueue(items: number[]): number[] {
  const queue: number[] = [];
  let head = 0;
  for (const item of items) {
    queue.push(item);
  }
  const result: number[] = [];
  while (head < queue.length) {
    result.push(queue[head++]);
  }
  if (result.length !== 2) throw new Error("assertion failed");
  return result;
}
solveQueue([1, 2]);
```

## Python Tip

Python 開發者在處理 Graph BFS 時，切記匯入 collections.deque。原生串列的 pop(0) 在面對大型佇列時會造成嚴重的效能瓶頸。

```python
from collections import deque

def process_queue(items: list[int]) -> list[int]:
    q = deque(items)
    res = []
    while q:
        res.append(q.popleft())
    assert len(res) == 2, "assertion failed"
    return res

process_queue([1, 2])
```

## TypeScript Corner

在 TypeScript 中實作 Queue 時，切勿直接使用陣列的 shift() 方法，因為這會導致每次移除前端元素時都需要搬移其餘元素，將效能降至 O(N)。正確的做法是實作雙指標佇列或使用自定義的鏈結串列節點來維持 O(1) 的彈出效能。

```typescript
class QueueNode<T> {
  constructor(public val: T, public next: QueueNode<T> | null = null) {}
}

class CustomQueue<T> {
  private head: QueueNode<T> | null = null;
  private tail: QueueNode<T> | null = null;
  private size = 0;

  push(val: T): void {
    const node = new QueueNode(val);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.size++;
  }

  pop(): T | null {
    if (!this.head) return null;
    const val = this.head.val;
    this.head = this.head.next;
    if (!this.head) this.tail = null;
    this.size--;
    return val;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }
}

const q = new CustomQueue<number>();
q.push(10);
const val = q.pop();
if (val !== 10) throw new Error("assertion failed");
```

## Python Corner

在 Python 中，絕對不要使用標準的 list.pop(0) 來模擬 Queue，因為這會觸發整串元素的記憶體搬移，導致時間複雜度劣化為 O(N)。標準函式庫中的 collections.deque 是最佳選擇，其 append() 與 popleft() 皆能在 O(1) 時間內完成。

```python
from collections import deque

def bfs_traverse(start: int) -> list[int]:
    queue = deque([start])
    visited = {start}
    result = []
    
    while queue:
        curr = queue.popleft()
        result.append(curr)
        # 假設固定鄰居
        for neighbor in [curr + 1]:
            if neighbor <= 2 and neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                
    return result

res = bfs_traverse(1)
assert res == [1, 2], "assertion failed"
```

## Takeaway

使用 Queue 與正確的造訪標記時機，確保 O(V + E) 效能，是掌握 Graph BFS 的核心要領。

## Tomorrow Preview

明天我們將探討 Graph DFS Traversal 與回溯法的進階應用，學習如何深入探索圖形的所有可能路徑與組合解空間。

## Today's Challenge

- **994** · 腐爛橘子的擴散過程完全符合多源點同時進行的層級擴展特性，每一分鐘的蔓延相當於 BFS 的一層，最少分鐘數即為最短路徑。
  - Hint: 將所有初始腐爛的橘子座標同時加入 Queue 作為起點，並記錄當前的擴散層數。
