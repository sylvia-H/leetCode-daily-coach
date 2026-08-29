---
id: graph-dfs-traversal
title: Graph DFS Traversal
module: graph
pattern_label: Depth-First Search
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - Avoid infinite loops on cyclic graphs by using a visited set.
---
## Concept

Graph DFS Traversal 是一種用於遍歷或搜尋圖形資料結構的演算法。其核心思想是沿著每個分支盡可能深地進行探索，直到到達終點或無法繼續前進時才進行回溯（Backtracking）。這種策略確保了能夠深入圖形的每一個角落，非常適合用於尋找連通分量、路徑存在性判定或窮舉所有可能的走法。

## Thinking

在設計 Graph DFS Traversal 時，我們需要透過遞迴或疊代的方式來造訪節點。由於圖形可能包含環（Cycles），為了避免陷入無限迴圈，我們必須維護一個已造訪集合（Visited Set）。演算法的邏輯如下：首先將當前節點標記為已造訪，接著疊代該節點的所有鄰居節點；如果鄰居節點尚未被造訪，則遞迴呼叫 DFS 函式深入探索。當所有分支都被遍歷後，遞迴會自動回溯到上一層。

## Pattern Recognition

當題目要求我們在圖形、二維網格或隱式圖中進行窮舉搜尋、尋找所有連通分量（Connected Components）、確認兩點之間是否存在路徑，或是探索所有可能狀態時，我們應該立即聯想到 Depth-First Search Pattern。這類問題通常不需要尋找最短路徑，而是著重於「是否能到達」或是「所有的可能性」。

## Common Mistakes

最常見的錯誤是在遞迴呼叫時遺漏將節點標記為已造訪的步驟，導致程式在處理帶有環的圖形時陷入無限遞迴，最終引發堆疊溢位（Stack Overflow）。另一個常見錯誤是將 visited 檢查寫在遞迴函式內部卻忘記在進入前標記，或者在多重連通分量的圖形中，沒有從所有未造訪的節點啟動 DFS，導致部分孤立的子圖被遺漏。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表節點總數（Vertices），E 代表邊總數（Edges），因為每個節點和每條邊在最壞情況下都會被訪問一次。空間複雜度為 O(V)，主要取決於遞迴呼叫堆疊（Call Stack）的最大深度以及已造訪集合所佔用的記憶體空間。

## Digest

Graph DFS Traversal 是一種基礎且強大的圖形遍歷演算法。本篇課程詳細介紹了 DFS 的核心觀念、遞迴實作方式以及時間與空間複雜度分析。透過維護 visited 集合，我們能夠有效防範無限迴圈的發生。掌握此 Pattern 後，我們將能輕鬆應對諸如島嶼數量、連通分量搜尋等經典 LeetCode 題目。

## TypeScript Tip

```typescript
function hasPath(graph: number[][], start: number, target: number): boolean {
  const visited = new Set<number>();
  function dfs(curr: number): boolean {
    if (curr === target) return true;
    visited.add(curr);
    for (const next of graph[curr]) {
      if (!visited.has(next)) {
        if (dfs(next)) return true;
      }
    }
    return false;
  }
  const result = dfs(start);
  if (result !== true) throw new Error("Assertion failed");
  return result;
}
hasPath([[1], [2], []], 0, 2);
```

## Python Tip

```python
def has_path(graph: list[list[int]], start: int, target: int) -> bool:
    visited = set()
    def dfs(curr: int) -> bool:
        if curr == target:
            return True
        visited.add(curr)
        for next_node in graph[curr]:
            if next_node not in visited:
                if dfs(next_node):
                    return True
        return False
    result = dfs(start)
    assert result is True, "Assertion failed"
    return result
has_path([[1], [2], []], 0, 2)
```

## Takeaway

掌握 DFS 遍歷的核心在於記錄 visited 狀態與遞迴回溯，O(V + E) 的複雜度是圖形演算法的基礎。

## Tomorrow Preview

明天我們將探討 Graph BFS Traversal，學習如何使用佇列（Queue）進行層序遍歷，並掌握其在尋找無權重圖最短路徑上的應用。

## Today's Challenge

- **200** · 題號 200 要求計算二維網格中陸地的島嶼數量。使用 DFS 可以從任何一個未訪問過的陸地格子出發，將相連的所有陸地格子完整遍歷並標記，藉此找出一個完整的連通分量。
  - Hint: 遍歷整個網格，當遇到 '1' 時啟動 DFS 將相鄰的 '1' 轉為 '0' 或標記為已訪問，並將島嶼計數器加一。
