---
id: queue-bfs-level-order-traversal
title: Queue BFS Level Order Traversal
module: queue
pattern_label: Breadth-First Search
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - Process nodes level by level using queue size snapshots.
  - Store child nodes into the queue for subsequent levels.
---
## Concept

Queue BFS Level Order Traversal 是一種使用佇列（Queue）結構以廣度優先搜尋（Breadth-First Search, BFS）策略進行樹狀或圖狀結構逐層遍歷的核心演算法。此方法的核心思想在於確保距離根節點（Root Node）較近的節點能夠優先被造訪與處理，進而實現由上至下、由左至右的層級順序展開。

## Thinking

在進行 Level Order Traversal 時，首要的思考邏輯是透過佇列（Queue）的先進先出（First-In-First-Out, FIFO）特性來保存即將被處理的節點。為了將每一層的節點明確分組，必須在進入每一層的迴圈初期，先記錄當前佇列的長度（即該層的節點總數），並以此固定大小進行迴圈迭代。在此過程中，將當前節點的左右子節點依序推入佇列中，以便在處理完當前層級後，自然接續下一層的處理。

## Pattern Recognition

當題目明確要求進行逐層遍歷（Level-by-level traversal）、計算二元樹的最大深度（Maximum Depth）、或是尋找無權圖（Unweighted Graph）中的最短路徑（Shortest Distance）時，應立即聯想並採用 Breadth-First Search Pattern。

## Common Mistakes

最常見的錯誤是在進入內層迴圈時，未事先將當前的佇列長度（Queue Size）快照保存，而是直接使用動態變化的 queue.length 或 len(queue) 作為終止條件，這會導致同一層中新加入的子節點被誤算入當前層級，造成分層錯亂與邏輯失敗。

## Complexity

Time Complexity: O(n), where n is the number of nodes, since every node is pushed and popped from the queue exactly once.
Space Complexity: O(n), as the queue may hold up to the maximum width of the tree at the last level.

## Digest

Queue BFS Level Order Traversal 是掌握樹與圖結構遍歷的基石。透過維持一個 Queue 並在迴圈開始前鎖定當前層級的大小，我們能夠完美地將節點按層分組。這項技巧不僅應用於二元樹的層序遍歷，也是解決最短路徑問題的核心方法。在實作上，務必注意佇列操作的效能，並嚴格遵循快照 Queue Size 的思考模式以避免分層邏輯出錯。

## TypeScript Tip

```typescript
import { strict as assert } from "node:assert";

function sumQueue(queue: number[]): number {
  let total = 0;
  while (queue.length > 0) {
    const val = queue.shift();
    if (val !== undefined) {
      total += val;
    }
  }
  return total;
}

const total = sumQueue([1, 2, 3]);
assert.equal(total, 6, "assertion failed");
```

## Python Tip

```python
from collections import deque

def sum_queue(items: list[int]) -> int:
    queue = deque(items)
    total = 0
    while queue:
        total += queue.popleft()
    return total

result = sum_queue([1, 2, 3])
assert result == 6, "assertion failed"
```

## Takeaway

掌握 Queue BFS 核心在於善用 Queue 的 FIFO 特性，並透過鎖定每層 Size 實作精確的層序分組與遍歷。

## Tomorrow Preview

明天我們將探討 Depth-First Search (DFS) 的遞迴與迭代實作，並比較其與 BFS 在空間複雜度上的差異。

## Today's Challenge

- **102** · 此題為標準的二元樹層序遍歷，完美對應 Queue BFS 需將節點按層分組的 Pattern 要求。
  - Hint: 在每一層迴圈開始前，記錄當前 queue.length 作為該層的節點數量上限。
- **104** · 透過層序遍歷逐層遞進，每遍歷完一層便將深度計數加一，是經典且直觀的 BFS 應用題。
  - Hint: 每完成一個 levelSize 的迴圈迭代，即代表樹的深度增加 1。
