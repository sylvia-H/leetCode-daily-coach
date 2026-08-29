---
id: graph-adjacency-matrix-representation
title: Graph Adjacency Matrix Representation
module: graph
pattern_label: Data Representation
complexity_label: O(V^2) / O(V^2)
estimated_minutes: 10
exit_criteria:
  - 能使用矩陣在 O(1) 時間內檢查邊是否存在。
---
## Concept

Graph Adjacency Matrix Representation 是一種將圖形結構儲存於二維陣列（2D Array）中的資料表示法。在此方法中，若頂點 i 與頂點 j 之間存在邊（Edge），則矩陣中的對應元素 matrix[i][j] 會被設為 1、權重數值或是布林值 true；反之，若無邊相連，則設為 0、false 或無窮大。這種方法透過空間的預先配置，換取在圖形操作時的高效能存取。

## Thinking

當我們需要建構 Graph Adjacency Matrix 時，首要步驟是確定圖形的頂點數量 V。接著，我們需要初始化一個大小為 V x V 的二維網格，並將所有初始值設為代表沒有邊的狀態（例如 0）。在處理無向圖（Undirected Graph）時，若頂點 u 與 v 之間有邊，我們必須同時設定 matrix[u][v] 與 matrix[v][u] 為相應的數值；若是帶權圖（Weighted Graph），則填入實際的邊權重而非單純的旗標。

## Pattern Recognition

此 Pattern 主要應用於密集圖（Dense Graphs），即圖中的邊數量接近頂點數平方（E ≈ V^2）的情況。當演算法需要頻繁且在 O(1) 的時間內判斷任意兩個頂點之間是否存在邊時，Adjacency Matrix 是最佳的選擇。常見於 Floyd-Warshall 演算法或頂點數量較小但查詢極度頻繁的圖形問題。

## Common Mistakes

最常見的錯誤是在處理極度稀疏圖（Sparse Graphs）時仍然採用 Adjacency Matrix，這會導致大量的記憶體浪費，空間複雜度高達 O(V^2)，而其中大部分的儲存空間皆為零或無窮大。另一個常見錯誤是在初始化二維陣列時，使用淺拷貝（Shallow Copy）導致多個列（Row）指向同一個記憶體位址，當修改某一列時意外影響到其他列。

## Complexity

Time Complexity: 初始化需要 O(V^2)，單次邊存在性查詢只需 O(1)。Space Complexity: 固定的 O(V^2)，用以儲存 V 乘 V 的二維矩陣。

## Digest

Graph Adjacency Matrix Representation 透過 V x V 的二維陣列儲存圖形結構，適用於密集圖並提供 O(1) 的邊查詢效能。

## TypeScript Tip

```typescript
function hasEdge(matrix: number[][], u: number, v: number): boolean {
  const exists = matrix[u][v] === 1;
  if (typeof exists !== "boolean") throw new Error("assertion failed");
  return exists;
}
const matrix = [[0, 1], [1, 0]];
if (!hasEdge(matrix, 0, 1)) throw new Error("assertion failed");
```

## Python Tip

```python
def has_edge(matrix: list[list[int]], u: int, v: int) -> bool:
    exists = matrix[u][v] == 1
    assert isinstance(exists, bool), "assertion failed"
    return exists

matrix = [[0, 1], [1, 0]]
assert has_edge(matrix, 0, 1) is True, "assertion failed"
```

## Takeaway

Adjacency Matrix 以 O(V^2) 空間換取 O(1) 邊查詢，專為密集圖設計。

## Tomorrow Preview

明天我們將探討 Graph Adjacency List Representation，學習如何使用鏈結串列或動態陣列來節省稀疏圖的記憶體空間。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
