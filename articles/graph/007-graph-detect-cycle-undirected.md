---
id: graph-detect-cycle-undirected
title: Graph Detect Cycle in Undirected Graph
module: graph
pattern_label: Cycle Detection
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能辨識是否有已造訪的鄰居不是目前節點的直接父節點。
---
## Concept

在無向圖（Undirected Graph）中檢測環（Cycle Detection）是圖論中的基礎問題。當我們走訪圖的節點時，若遇到一個已經訪問過的節點，且該節點不是當前節點的直接父節點（Parent），則代表圖中存在一個環。

## Thinking

當我們使用 DFS 走訪無向圖時，因為邊是雙向的，所以當我們從節點 A 移動到節點 B 後，節點 B 的鄰居中必然會包含節點 A。如果不加追蹤，我們很容易誤將返回節點 A 的這條邊判定為環。因此，在遞迴呼叫 DFS 時，我們必須額外傳遞當前節點的父節點索引。當我們檢查某個鄰居節點時，若該鄰居已被訪問過且不等於父節點，即代表找到環。

## Pattern Recognition

當題目要求判斷一個無向圖是否為一棵有效的樹（Valid Tree）、或者是否包含任何循環結構時，即為典型的 Cycle Detection 問題。其核心特徵在於圖的邊沒有方向性，走訪時需要特別排除回溯到父節點的情況。

## Common Mistakes

最常見的錯誤是直接使用標準的 visited 集合來判斷是否遇到已訪問節點，而忽略了無向圖的雙向邊特性，導致將回到父節點的邊誤判為環。

## Complexity

時間複雜度為 O(V + E)，其中 V 為節點數量，E 為邊數量。空間複雜度為 O(V)，主要取決於遞迴呼叫堆疊以及 visited 集合所佔用的記憶體空間。

## Digest

本篇重點在於學習如何在無向圖中檢測環。因為無向圖的邊具備雙向性，在利用 DFS 進行走訪時，必須透過 parent 參數來記錄來源節點，避免將回溯邊誤判為環。時間與空間複雜度皆為 O(V + E) 與 O(V)。

## TypeScript Tip

```typescript
function check(n: number, edges: number[][]): boolean {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const visited = new Set<number>();
  function dfs(curr: number, parent: number): boolean {
    visited.add(curr);
    for (const neighbor of adj[curr]) {
      if (neighbor === parent) continue;
      if (visited.has(neighbor)) return true;
      if (dfs(neighbor, curr)) return true;
    }
    return false;
  }
  return dfs(0, -1);
}
if (!check(3, [[0, 1], [1, 2], [2, 0]])) throw new Error("err");
```

## Python Tip

```python
def check(n: int, edges: list[list[int]]) -> bool:
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    visited = set()
    def dfs(curr: int, parent: int) -> bool:
        visited.add(curr)
        for neighbor in adj[curr]:
            if neighbor == parent:
                continue
            if neighbor in visited:
                return True
            if dfs(neighbor, curr):
                return True
        return False
    return dfs(0, -1)
assert check(3, [[0, 1], [1, 2], [2, 0]]) == True
```

## Takeaway

無向圖檢測環的核心在於利用 parent 參數排除回溯邊，確保只有真正的迴圈會被識別出來。

## Tomorrow Preview

明天我們將探討有向圖（Directed Graph）中的環檢測，有向圖由於邊具備方向性，不能簡單使用 parent 追蹤，必須引入拜訪狀態（如三色標記法）來處理。

## Today's Challenge

- **261** · Graph Valid Tree 問題要求判斷給定的無向圖是否為一棵樹，這等同於檢查圖是否完全連通且不包含任何環，完美契合本篇的 Cycle Detection Pattern。
  - Hint: 除了檢測環之外，還要確認所有節點最終都被訪問到（即圖是連通的）。
