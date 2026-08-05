---
id: dfs-bfs-core-concept-introduction
title: DFS / BFS 核心觀念介紹
module: dfs-bfs
pattern_label: Graph Search Basics
complexity_label: O(V + E) / O(V)
estimated_minutes: 10
exit_criteria:
  - 能用自己的話解釋 DFS 與 BFS 的走訪順序差異
  - 能辨識何時該用 DFS 何時該用 BFS
---
## Concept

DFS 與 BFS 是圖形與樹狀結構走訪的兩大基礎策略，分別模擬盲目深入與層層擴散。深度優先搜尋 (DFS) 傾向於沿著路徑一路走到盡頭，再回溯尋找未造訪的分支；廣度優先搜尋 (BFS) 則是以同心圓的方式由近及遠，逐層擴展搜尋範圍。兩者在處理複雜關聯時扮演關鍵角色，是解決圖論問題的基石。

## Thinking

在面對圖形搜尋問題時，首先要釐清問題本質：如果題目要求尋找最短路徑（在權重相等的情況下），或是需要逐層探索鄰近節點，通常優先選擇 BFS；如果問題要求窮舉所有可能路徑、深度檢索、或是探索整個連通圖的結構，則適合選擇 DFS。透過狀態空間樹或鄰接關係的抽象化，可以將具體業務邏輯轉化為標準的圖走訪問題。

## Pattern Recognition

當題目要求遍歷所有節點、尋找路徑、檢查圖的連通性、尋找連通塊數量，或是在迷宮與狀態空間中尋找解時，即為圖形搜尋問題。觀察輸入結構是否為節點與邊的集合、樹狀結構、或隱含的狀態轉換圖，即可確認應套用 Graph Search Basics Pattern。

## Common Mistakes

常見錯誤包括將圖形搜尋與一般陣列線性掃描混淆，忽略了圖中可能存在環 (Cycle)，導致程式陷入無窮迴圈。另一個常見錯誤是在實作 DFS 或 BFS 時，漏掉記錄已造訪節點 (Visited Set)，造成重複拜訪與效能低落。此外，未正確處理非完全連通圖（即圖含有多個不相連的分支）也是初學者常犯的疏忽。

## Complexity

時間複雜度為 O(V + E)，其中 V 為節點數量，E 為邊的數量，因為每個節點與每條邊在走訪過程中最多被訪問常數次。空間複雜度為 O(V)，主要取決於遞呼叫堆疊 (Call Stack) 的最大深度（針對 DFS）或是佇列 (Queue) 中同時存在的節點數量（針對 BFS）。

## Digest

本單元介紹 DFS 與 BFS 核心觀念。DFS 透過遞迴或堆疊深入走訪，適合窮舉路徑；BFS 藉由佇列層層擴散，適合尋找最短路徑。兩者時間複雜度皆為 O(V + E)，空間複雜度為 O(V)。實作時務必注意防止環狀結構造成無窮迴圈，並確實維護已造訪節點集合。

## TypeScript Tip

```typescript
function createGraph(): Map<string, string[]> {
  const g = new Map<string, string[]>();
  g.set("A", ["B", "C"]);
  g.set("B", []);
  g.set("C", []);
  if (g.size !== 3) throw new Error("assertion failed");
  return g;
}
createGraph();
```

## Python Tip

```python
def create_graph() -> dict[str, list[str]]:
    g: dict[str, list[str]] = {"A": ["B", "C"], "B": [], "C": []}
    assert len(g) == 3, "assertion failed"
    return g

create_graph()
```

## TypeScript Corner

```typescript
function dfsGraph(graph: Map<number, number[]>, start: number): number[] {
  const visited = new Set<number>();
  const result: number[] = [];
  function traverse(node: number) {
    if (visited.has(node)) return;
    visited.add(node);
    result.push(node);
    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      traverse(neighbor);
    }
  }
  traverse(start);
  if (result.length !== 3) throw new Error("assertion failed");
  return result;
}
const testGraph = new Map<number, number[]>([[1, [2]], [2, [3]], [3, []]]);
dfsGraph(testGraph, 1);
```

## Python Corner

```python
def bfs_graph(graph: dict[int, list[int]], start: int) -> list[int]:
    from collections import deque
    visited = set([start])
    queue = deque([start])
    result = []
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    assert len(result) == 3, "assertion failed"
    return result

test_graph = {1: [2, 3], 2: [], 3: []}
bfs_graph(test_graph, 1)
```

## Takeaway

掌握 DFS 深入與 BFS 廣度特性，善用 Visited Set 避免重複與迴圈，時間空間複雜度均為 O(V + E) 與 O(V)。

## Tomorrow Preview

明天我們將探討圖形搜尋在實際 LeetCode 題目中的應用，深入解析如何利用 DFS 與 BFS 解決島嶼數量與二元樹層次走訪等經典難題。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
