---
id: graph-core-concept-introduction
title: Graph Core Concept Introduction
module: graph
pattern_label: Graph Modeling
complexity_label: O(V + E) / O(V + E)
estimated_minutes: 10
exit_criteria:
  - Distinguish between directed and undirected edges.
---
## Concept

Graph 是用於描述物件之間成對關係的資料結構，由頂點 (Vertices 或 Nodes) 與邊 (Edges) 組成。相較於線性結構 (如陣列與鏈結串列) 或階層結構 (如樹狀結構)，Graph 能夠表達更為複雜且任意的網路拓樸。在圖論中，邊可以是無向的 (Undirected，代表雙向關係) 或者是向的 (Directed，代表單向關係，通常帶有方向箭頭)，此外邊亦可賦予權重 (Weight) 以表示距離、成本或容量等數值。

## Thinking

當面對一個問題時，首要任務是識別實體 (Entities) 與其互動關係。我們必須將問題中的每個獨立個體抽象化為 Graph 中的 Vertex，並將個體之間的依附、聯絡或轉換關係抽象化為 Edge。接著需評估關係是否具備方向性 (Directed Graph vs Undirected Graph) 以及是否包含權重，以此決定適合的記憶體表示方式，例如相鄰串列 (Adjacency List) 或相鄰矩陣 (Adjacency Matrix)。

## Pattern Recognition

當問題描述涉及網路拓樸、複雜相依性、社交網路、地圖路線規劃、狀態機轉換、或是任何非階層式的多對多關係時，應立即聯想並套用 Graph Modeling。如果問題隱含著「從某個狀態出發，經過一系列轉換到達目標狀態」，這通常也是隱式圖論 (Implicit Graph) 的經典徵兆。

## Common Mistakes

初學者最常見的錯誤是將一般圖論結構與樹狀結構混淆，誤以為所有的 Graph 都像 Tree 一樣具有單一根節點、嚴格的階層性，且不存在迴圈 (Cycles)。在處理圖論時，必須隨時考慮節點可能具有多個父節點、可能存在環狀相依、甚至可能存在非連通圖 (Disconnected Graph) 的情況，若未妥善追蹤已訪問的節點，極易導致無限迴圈。

## Complexity

時間複雜度：建立圖結構通常需要 O(V + E)，其中 V 代表頂點數量，E 代表邊的數量。空間複雜度：使用 Adjacency List 表示時為 O(V + E)；若使用 Adjacency Matrix 則為 O(V^2)，適用於稠密圖 (Dense Graph)。

## Digest

Graph 核心觀念介紹了頂點與邊的基礎定義，幫助開發者掌握如何將真實世界的複雜關係建模為圖結構。透過明確區分有向圖與無向圖、理解迴圈與多父節點的可能性，我們能為後續的走訪與最短路徑演算法奠定堅實基礎。

## TypeScript Tip

```typescript
function validateGraphRepresentation(): void {
  const adjList: Map<number, number[]> = new Map();
  adjList.set(1, [2, 3]);
  adjList.set(2, [1]);
  adjList.set(3, [1]);
  
  if (!adjList.has(1) || adjList.get(1)?.length !== 2) {
    throw new Error('assertion failed');
  }
}

validateGraphRepresentation();
```

## Python Tip

```python
def validate_graph_representation() -> None:
    adj_list: dict[int, list[int]] = {
        1: [2, 3],
        2: [1],
        3: [1]
    }
    assert 1 in adj_list and len(adj_list[1]) == 2, 'assertion failed'

validate_graph_representation()
```

## TypeScript Corner

```typescript
interface GraphNode {
  id: string;
  neighbors: GraphNode[];
}

function createGraph(): GraphNode[] {
  const nodeA: GraphNode = { id: 'A', neighbors: [] };
  const nodeB: GraphNode = { id: 'B', neighbors: [] };
  nodeA.neighbors.push(nodeB);
  nodeB.neighbors.push(nodeA);
  return [nodeA, nodeB];
}

const graph = createGraph();
if (graph.length !== 2) throw new Error('assertion failed');
```

## Python Corner

```python
class GraphNode:
    def __init__(self, val: str):
        self.val = val
        self.neighbors: list['GraphNode'] = []

def create_graph() -> list[GraphNode]:
    node_a = GraphNode('A')
    node_b = GraphNode('B')
    node_a.neighbors.append(node_b)
    node_b.neighbors.append(node_a)
    return [node_a, node_b]

graph = create_graph()
assert len(graph) == 2, 'assertion failed'
```

## Takeaway

Graph 用於模型化多對多關係，核心在於正確識別 Vertices 與 Edges，並區分有向與無向圖。

## Tomorrow Preview

明天我們將深入探討 Graph 的兩種經典走訪演算法：Breadth-First Search (BFS) 與 Depth-First Search (DFS)，學習如何系統性地巡訪圖中的所有頂點。

## Today's Challenge

本篇為觀念課，沒有對應的 LeetCode 練習題。請把時間花在把上面的觀念想透。
