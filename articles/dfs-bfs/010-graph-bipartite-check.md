---
id: graph-bipartite-check
title: 二分圖判定
module: dfs-bfs
pattern_label: Bipartite Graph
complexity_label: O(V + E) / O(V)
estimated_minutes: 20
exit_criteria:
  - 能用兩種顏色對圖進行交替著色
  - 能理解相鄰節點顏色相同即代表無法構成二分圖
---
## Concept

二分圖判定（Graph Bipartite Check）是一種圖論演算法，核心目標在於判斷給定的無向圖是否能夠將所有節點分割成兩個獨立的集合，使得圖中的每一條邊所連接的兩個節點都不屬於同一個集合。在實作上，這等價於利用兩種不同的顏色對圖中的節點進行交替著色（Coloring），確保相鄰節點永遠具有不同的顏色。如果在著色過程中發現兩個相鄰的節點被賦予了相同的顏色，則代表該圖無法被構成二分圖。

## Thinking

在處理二分圖判定問題時，我們通常會從任一未被訪問過的節點開始，將其賦予初始顏色（例如顏色 0），隨後透過廣度優先搜尋（BFS）或深度優先搜尋（DFS）走訪其所有相鄰節點。對於每一個相鄰節點，如果它尚未被著色，我們就賦予它與當前節點相反的顏色（例如 1 - current_color）；如果該相鄰節點已經被著色，我們則檢查其顏色是否與當前節點相衝突。若發現衝突，即可直接斷定該圖不是二分圖。此外，考量到圖可能包含多個不相連的獨立分量（Connected Components），我們必須確保迴圈會遍歷每一個節點，以防漏掉任何未訪問的子圖。

## Pattern Recognition

當題目要求將一組元素分成兩個互斥的群組、檢查是否存在衝突的兩兩關係，或是判斷圖中是否包含奇數長度的環（Odd-length Cycle）時，即可高度識別此 Pattern。二分圖的充分必要條件即為圖中不包含奇數長度的環。如果題目情境涉及互相排斥的關係配置、分組指派、或社交網絡中的敵對關係判定，通常都可以直接對應到 Bipartite Graph 的著色法架構。

## Common Mistakes

最常見的錯誤是忽略了圖的非完全連通性。許多初學者在寫程式碼時僅從節點 0 開始進行單次 BFS 或 DFS，導致圖中其他獨立分量（Connected Components）未被檢查到，從而漏掉潛在的衝突。另一個常見的錯誤是沒有正確初始化顏色狀態陣列，將未造訪節點與顏色 0 混淆，導致演算法陷入無限迴圈或產生錯誤的顏色衝突判斷。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表節點數量，E 代表邊的數量，因為每個節點與每一條邊在 BFS 或 DFS 走訪過程中最多被處理一次。空間複雜度為 O(V)，主要取決於儲存節點顏色狀態的陣列或雜湊表，以及在最壞情況下佇列或遞迴呼叫堆疊所佔用的記憶體空間。

## Digest

今日重點摘要：二分圖判定（Graph Bipartite Check）核心在於使用著色法（Coloring）。透過 BFS 或 DFS 將相鄰節點塗上相反顏色，若相鄰節點顏色衝突則代表非二分圖。必須注意非完全連通圖需遍歷所有節點，時間複雜度為 O(V + E)。

## TypeScript Tip

```typescript
function checkTypeScriptTip(): void {
  const colors: Map<number, number> = new Map();
  colors.set(0, 1);
  if (colors.get(0) !== 1) throw new Error("assertion failed");
}
checkTypeScriptTip();
```

## Python Tip

```python
def check_python_tip() -> None:
    colors: dict[int, int] = {}
    colors[0] = 1
    assert colors.get(0) == 1, "assertion failed"
check_python_tip()
```

## TypeScript Corner

```typescript
function isBipartite(graph: number[][]): boolean {
  const n = graph.length;
  const colors = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (colors[i] !== -1) continue;
    const queue: number[] = [i];
    colors[i] = 0;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const neighbor of graph[curr]) {
        if (colors[neighbor] === -1) {
          colors[neighbor] = 1 - colors[curr];
          queue.push(neighbor);
        } else if (colors[neighbor] === colors[curr]) {
          return false;
        }
      }
    }
  }
  return true;
}
const testGraph = [[1, 3], [0, 2], [1, 3], [0, 2]];
if (!isBipartite(testGraph)) throw new Error("assertion failed");
```

## Python Corner

```python
def isBipartite(graph: list[list[int]]) -> bool:
    n = len(graph)
    colors = [-1] * n
    for i in range(n):
        if colors[i] != -1:
            continue
        queue = [i]
        colors[i] = 0
        while queue:
            curr = queue.pop(0)
            for neighbor in graph[curr]:
                if colors[neighbor] == -1:
                    colors[neighbor] = 1 - colors[curr]
                    queue.append(neighbor)
                elif colors[neighbor] == colors[curr]:
                    return False
    return True

test_graph = [[1, 3], [0, 2], [1, 3], [0, 2]]
assert isBipartite(test_graph), "assertion failed"
```

## Takeaway

二分圖判定首重著色交替與獨立分量檢查，時間複雜度 O(V + E)。

## Tomorrow Preview

明天我們將探討拓撲排序（Topological Sort）與有向無環圖（DAG）的應用，學習如何處理具有相依關係的任務排程問題。

## Today's Challenge

- **785** · 題號 785 是判斷給定無向圖是否為二分圖的標準應用題，直接對應著色法核心邏輯。
  - Hint: 使用陣列記錄每個節點的顏色（-1, 0, 1），並記得處理不連通的圖。
- **886** · 題號 886 將互相不喜歡的人建模為邊，需要透過二分圖著色法判定是否能分成兩組互不衝突的群體。
  - Hint: 先建立鄰接表表示仇恨關係，再對每個節點執行 BFS 著色檢查。
