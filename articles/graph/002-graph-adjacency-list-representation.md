---
id: graph-adjacency-list-representation
title: Graph Adjacency List Representation
module: graph
pattern_label: Data Representation
complexity_label: O(V + E) / O(V + E)
estimated_minutes: 12
exit_criteria:
  - 能從邊的列表成功建立 adjacency list。
---
## Concept

Graph Adjacency List Representation 是一種用於在電腦記憶體中表達圖結構（Graph）的核心資料結構。圖由頂點（Vertices, V）與邊（Edges, E）組成，而 Adjacency List 的核心精神是將每一個頂點映射至一個包含其所有相鄰頂點的集合（Collection）。相較於使用二維陣列的 Adjacency Matrix，Adjacency List 僅儲存實際存在的邊，因此在邊數遠小於頂點平方數的 Sparse Graphs（稀疏圖）中，能大幅節省記憶體空間。在建構此結構時，通常會使用雜湊表（Hash Map）或動態陣列，以達到高效的節點查詢與鄰居遍歷。

## Thinking

當我們面對圖論相關問題時，首要任務是將題目給定的邊界條件轉換為程式碼可以操作的資料結構。思考的切入點在於識別圖的類型：首先確認圖是有向圖（Directed Graph）抑或無向圖（Undirected Graph）。若為無向圖，每當讀取到一條連接節點 A 與節點 B 的邊時，必須同時在 A 的鄰居列表加入 B，以及在 B 的鄰居列表加入 A。接著，確認節點的識別方式是用整數編號還是字串名稱，這決定了要使用陣列還是 Map 來作為主要的容器。最後，初始化一個空的容器，走訪輸入的邊列表（Edge List），並逐一將對應的鄰居關係寫入結構中。

## Pattern Recognition

識別 Graph Adjacency List Representation 的關鍵線索在於題目的輸入格式通常為一組邊的清單（Edge List），且圖的規模可能相當大、邊相對稀疏（Sparse）。當題目要求進行圖的走訪（如 Breadth-First Search 或 Depth-First Search）、路徑尋找、或是需要複製整個圖結構時，將原始的 Edge List 轉換為 Adjacency List 幾乎是標準的第一步。如果題目涉及頻繁地查詢某個頂點的鄰居，且記憶體空間有限，Adjacency List 往往是最佳的資料結構選擇。

## Common Mistakes

最常見的錯誤是在處理無向圖（Undirected Graph）時，遺漏了反向邊（Reverse Edge）的加入。開發者經常只寫了 `adj.get(u).push(v)`，卻忘記對稱地寫入 `adj.get(v).push(u)`，導致後續的圖遍歷無法完整走訪所有連通元件。另一個常見錯誤是未能在新增鄰居前，先檢查該頂點的儲存容器是否已經初始化，這在動態新增頂點時容易引發 Null Pointer 或 Undefined 相關的執行階段錯誤。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表頂點數量，E 代表邊的數量。我們需要走訪每一個頂點進行初始化，並走訪每一個邊將其加入對應的列表中。空間複雜度同為 O(V + E)，因為我們需要儲存所有的頂點以及它們之間的所有邊連接關係。

## Digest

今日重點摘要：Graph Adjacency List Representation 是處理稀疏圖的標準資料結構，透過 Map 或串列將每個頂點對應至其鄰居集合。建構時需特別注意有向圖與無向圖的邊處理差異。時間與空間複雜度均為 O(V + E)。掌握此結構是解開多數圖論演算法題目的穩固基石。

## TypeScript Tip

```typescript
import { strict as assert } from 'node:assert';

function getNeighbors(adj: Map<number, number[]>, node: number): number[] {
  return adj.get(node) ?? [];
}

const adj = new Map<number, number[]>([[1, [2, 3]]]);
assert.deepEqual(getNeighbors(adj, 1), [2, 3]);
assert.deepEqual(getNeighbors(adj, 99), []);
```

## Python Tip

```python
from collections import defaultdict

def get_neighbors(adj: dict[int, list[int]], node: int) -> list[int]:
    return adj.get(node, [])

adj = defaultdict(list, {1: [2, 3]})
assert get_neighbors(adj, 1) == [2, 3]
assert get_neighbors(adj, 99) == []
```

## Takeaway

Adjacency list maps vertices to neighbors, optimizing sparse graph memory and traversal with O(V + E) complexity.

## Tomorrow Preview

明天我們將探討 Graph Traversal 的核心技術：Breadth-First Search (BFS) 與 Depth-First Search (DFS)，並學習如何利用今天建立的 Adjacency List 在圖中進行系統性的走訪與搜尋。

## Today's Challenge

- **133** · Clone Graph 題目中的節點是以鄰居指標的圖結構呈現，必須透過走訪原圖並建立對應的 Adjacency 映射與複製節點，才能正確重建整張圖。
  - Hint: 使用雜湊表（Hash Map）記錄原圖節點到新圖複製節點的對應關係，避免在處理環狀結構時陷入無限迴圈。
