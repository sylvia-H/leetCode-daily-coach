---
id: bfs-shortest-path-unweighted
title: 未加權圖的最短路徑
module: dfs-bfs
pattern_label: Shortest Path BFS
complexity_label: O(V + E) / O(V)
estimated_minutes: 20
exit_criteria:
  - 能計算從起點到終點的最小邊數或步數
  - 理解為什麼 BFS 在邊權均等時必然找到最短路徑
---
## Concept

未加權圖的最短路徑問題的核心在於利用廣度優先搜尋的擴散特性，保證首次抵達目標節點時所走過的路徑為最短路徑。在邊權均等的圖中，搜尋會以起點為中心向外逐層擴展，確保每一層的節點都在相同的步數內被造訪。這種特性使得廣度優先搜尋成為求解最小步數或最短距離問題的標準方法。

## Thinking

在處理未加權圖的最短路徑時，核心思考邏輯在於使用佇列來維護當前要造訪的節點，並同時記錄起點到該節點的距離或步數。當我們從佇列中彈出一個節點時，檢查其相鄰節點。若該相鄰節點尚未被造訪，則將其標記為已造訪，更新其距離，並推入佇列中。一旦我們在擴展過程中抵達目標節點，即可立即回傳當前的距離，因為廣度優先搜尋的性質保證了這是第一次也是最短的一次抵達。

## Pattern Recognition

當題目要求尋找「最少步數」、「最短距離」、「最小轉換次數」且每一步的消耗均等時，這就是典型的 Shortest Path BFS 模式。辨識線索包括圖的邊權均為 1、需要從起點擴散尋找終點，或是二元樹中尋找根節點到最近葉子節點的距離等。

## Common Mistakes

最常見的錯誤是在非最短路徑問題中誤用深度優先搜尋來尋找最短距離，這會導致需要遍歷所有可能的路徑才能找到最小值，時間複雜度呈指數級成長。另一個常見錯誤是忘記記錄已造訪的節點，導致圖中存在環時程式碼陷入無窮迴圈。

## Complexity

時間複雜度為 O(V + E)，其中 V 為節點數量，E 為邊的數量，因為每個節點和邊都會被造訪一次。空間複雜度為 O(V)，主要取決於佇列與造訪記錄在最壞情況下儲存的節點數量。

## Digest

未加權圖的最短路徑問題利用廣度優先搜尋的逐層擴散特性，確保首次抵達目標時即為最短路徑。時間與空間複雜度皆為 O(V + E) 與 O(V)。常見錯誤為誤用深度優先搜尋或忘記記錄造訪狀態。

## TypeScript Tip

使用 TypeScript 實作 BFS 時，宣告明確的型別能有效避免型別錯誤。
```typescript
function bfsDistance(graph: number[][], start: number): number[] {
  const dist: number[] = new Array(graph.length).fill(-1);
  const queue: number[] = [start];
  dist[start] = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const neighbor of graph[curr]) {
      if (dist[neighbor] === -1) {
        dist[neighbor] = dist[curr] + 1;
        queue.push(neighbor);
      }
    }
  }
  return dist;
}
const graph = [[1], [0, 2], [1]];
const d = bfsDistance(graph, 0);
if (d[2] !== 2) throw new Error("assertion failed");
```

## Python Tip

在 Python 中使用 deque 進行 BFS 佇列操作時，popleft 的時間複雜度為 O(1)，能確保效能。
```python
from collections import deque

def bfs_distance(graph: list[list[int]], start: int) -> list[int]:
    dist = [-1] * len(graph)
    queue = deque([start])
    dist[start] = 0
    while queue:
        curr = queue.popleft()
        for neighbor in graph[curr]:
            if dist[neighbor] == -1:
                dist[neighbor] = dist[curr] + 1
                queue.append(neighbor)
    return dist

graph = [[1], [0, 2], [1]]
d = bfs_distance(graph, 0)
assert d[2] == 2, "assertion failed"
```

## TypeScript Corner

在 TypeScript 中實作時，可以使用 Map 或陣列來記錄節點的造訪狀態與距離，並使用陣列模擬 Queue 的操作。
```typescript
function shortestPathLength(adjList: number[][], start: number, target: number): number {
  const queue: [number, number][] = [[start, 0]];
  const visited = new Set<number>([start]);
  while (queue.length > 0) {
    const [curr, dist] = queue.shift()!;
    if (curr === target) return dist;
    for (const neighbor of adjList[curr]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, dist + 1]);
      }
    }
  }
  return -1;
}
const testAdj = [[1, 2], [3], [3], []];
const result = shortestPathLength(testAdj, 0, 3);
if (result !== 2) throw new Error("assertion failed");
```

## Python Corner

在 Python 中實作時，可以使用 collections.deque 作為高效能的佇列，並使用字典或串列記錄距離。
```python
from collections import deque

def shortest_path_length(adj_list: list[list[int]], start: int, target: int) -> int:
    queue = deque([(start, 0)])
    visited = {start}
    while queue:
        curr, dist = queue.popleft()
        if curr == target:
            return dist
        for neighbor in adj_list[curr]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
    return -1

test_adj = [[1, 2], [3], [3], []]
result = shortest_path_length(test_adj, 0, 3)
assert result == 2, "assertion failed"
```

## Takeaway

掌握 Shortest Path BFS 核心概念：在邊權均等圖中利用層次擴散保證首次抵達即最短路徑。

## Tomorrow Preview

明天我們將探討加權圖的最短路徑問題，學習如何在邊權不相等的圖中利用優先佇列來求解最短路徑。

## Today's Challenge

- **111** · 尋找二元樹的最小深度即是計算根節點到最近葉子節點的最短路徑，使用 BFS 可以保證一旦遇到葉子節點即可回傳深度。
  - Hint: 使用佇列記錄節點與當前深度，當遇到左右子節點皆為空的節點時即為最近的葉子節點。
- **127** · 在未加權的單字圖中使用 BFS 尋找從起點單字到終點單字的最短轉換序列長度，每一步轉換代表一條權重為 1 的邊。
  - Hint: 將每個單字的每個字元進行 26 種可能字元的替換，並檢查是否在單字字典中，以此建構圖的相鄰關係。
