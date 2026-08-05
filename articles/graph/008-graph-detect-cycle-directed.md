---
id: graph-detect-cycle-directed
title: Graph Detect Cycle in Directed Graph
module: graph
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - >-
    Distinguish between globally visited nodes and nodes currently in the
    recursion stack.
---
## Concept

在有向圖（Directed Graph）中，偵測圖形是否包含環（Cycle）是圖論演算法的核心議題之一。與無向圖不同，有向圖的邊具有明確的方向性。當我們從某個節點出發進行深度優先搜尋（DFS）時，若能沿著有向邊走回一個「目前正在遞迴堆疊中」的節點，即代表形成了環。這類問題在編譯器相依性分析、工作排程與死結（Deadlock）偵測中極為常見。

## Thinking

要在有向圖中正確偵測環，我們無法僅依賴單一的「已訪問（Visited）」集合。這是因為在有向圖中，交叉邊（Cross-edge）或指向已完全處理完畢節點的邊並不會構成環。因此，我們需要採用「三色標記法（3-State Coloring）」來精確追蹤每個節點的狀態：0 代表未訪問（Unvisited），1 代表正在訪問中（Visiting，即位於目前的遞迴堆疊上），2 代表已完全訪問完畢（Visited）。當 DFS 走訪某個節點的鄰居時，若鄰居的狀態為 1，代表我們遇到了祖先節點，即偵測到環；若鄰居的狀態為 0，則遞迴深入該鄰居。

## Pattern Recognition

當題目涉及「先決條件」、「依賴關係」、「課程安排」、「任務順序」等情境，且要求判斷是否可能發生死結或無法完成時，這通常就是尋找有向圖環偵測（Cycle Detection in Directed Graph）的強烈訊號。常見的特徵包含節點之間有方向性的限制，例如任務 A 必須在任務 B 之前完成。

## Common Mistakes

最常見的錯誤是使用無向圖的簡單 visited 集合來處理有向圖。在有向圖中，如果一條路徑已經訪問過某個節點並將其標記為 visited，但在另一條完全獨立的路徑中又碰到了這個節點，這並不代表有環。若沒有區分「正在遞迴堆疊中（Visiting）」與「已完全訪問（Visited）」，會導致演算法誤判並回報不存在的環。

## Complexity

時間複雜度為 O(V + E)，其中 V 為節點數量，E 為邊的數量。每一個節點和每一條邊在 DFS 過程中最多被訪問一次。空間複雜度為 O(V)，主要取決於遞迴呼叫堆疊以及儲存節點狀態的陣列或雜湊表所需的記憶體空間。

## Digest

有向圖的環偵測是圖論演習的基石。本篇重點在於三色標記法的概念，透過區分未訪問、訪問中、已訪問，解決了傳統拜訪集合在有向圖上的誤判問題。我們探討了 O(V + E) 的效能表現與實際應用。

## TypeScript Tip

```typescript
import assert from "node:assert";

function checkCycle(n: number, edges: number[][]): boolean {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    graph[u].push(v);
  }

  const states = new Uint8Array(n);
  function hasCycle(curr: number): boolean {
    if (states[curr] === 1) return true;
    if (states[curr] === 2) return false;

    states[curr] = 1;
    for (const next of graph[curr]) {
      if (hasCycle(next)) return true;
    }
    states[curr] = 2;
    return false;
  }

  for (let i = 0; i < n; i++) {
    if (states[i] === 0 && hasCycle(i)) {
      return true;
    }
  }
  return false;
}

assert.strictEqual(checkCycle(3, [[0, 1], [1, 2], [2, 0]]), true);
```

## Python Tip

```python
def check_cycle(n: int, edges: list[list[int]]) -> bool:
    graph = [[] for _ in range(n)]
    for u, v in edges:
        graph[u].append(v)

    states = [0] * n

    
    def has_cycle(curr: int) -> bool:
        if states[curr] == 1:
            return True
        if states[curr] == 2:
            return False

        states[curr] = 1
        for next_node in graph[curr]:
            if has_cycle(next_node):
                return True
        states[curr] = 2
        return False

    for i in range(n):
        if states[i] == 0 and has_cycle(i):
            return True
    return False


assert check_cycle(3, [[0, 1], [1, 2], [2, 0]]) == True
```

## TypeScript Corner

```typescript
import assert from "node:assert";

function canFinish(numCourses: number, prerequisites: number[][]): boolean {
  const adj: number[][] = Array.from({ length: numCourses }, () => []);
  for (const [dest, src] of prerequisites) {
    adj[src].push(dest);
  }

  const state: number = 0;
  const visiting: number = 1;
  const visited: number = 2;
  const states = new Uint8Array(numCourses);

  function dfs(node: number): boolean {
    if (states[node] === visiting) return true;
    if (states[node] === visited) return false;

    states[node] = visiting;
    for (const neighbor of adj[node]) {
      if (dfs(neighbor)) return true;
    }
    states[node] = visited;
    return false;
  }

  for (let i = 0; i < numCourses; i++) {
    if (states[i] === state) {
      if (dfs(i)) return false;
    }
  }
  return true;
}

assert.strictEqual(canFinish(2, [[1, 0]]), true);
assert.strictEqual(canFinish(2, [[1, 0], [0, 1]]), false);
```

## Python Corner

```python
import sys

sys.setrecursionlimit(2000)


def canFinish(numCourses: int, prerequisites: list[list[int]]) -> bool:
    adj = [[] for _ in range(numCourses)]
    for dest, src in prerequisites:
        adj[src].append(dest)

    states = [0] * numCourses

    def dfs(node: int) -> bool:
        if states[node] == 1:
            return True
        if states[node] == 2:
            return False

        states[node] = 1
        for neighbor in adj[node]:
            if dfs(neighbor):
                return True
        states[node] = 2
        return False

    for i in range(numCourses):
        if states[i] == 0:
            if dfs(i):
                return False
    return True


assert canFinish(2, [[1, 0]]) == True
assert canFinish(2, [[1, 0], [0, 1]]) == False
```

## Takeaway

有向圖環偵測的核心在於維護遞迴堆疊狀態，三色標記法能有效區分祖先節點與無關的已訪問節點。

## Tomorrow Preview

明天我們將探討拓樸排序（Topological Sort），學習如何在無環的有向圖（DAG）中排定節點的線性順序，並延伸應用於處理複雜的相依性排程問題。

## Today's Challenge

- **207** · 課程先決條件的驗證本質上就是檢查有向圖中是否存在環，若有環則無法完成所有課程。
  - Hint: 將課程視為節點，先決條件視為有向邊，使用三色標記法進行 DFS 即可。
