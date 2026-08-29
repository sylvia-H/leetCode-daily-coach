---
id: graph-topological-sort-dfs
title: Graph Topological Sort DFS
module: graph
pattern_label: Topological Sort
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能在造訪完某節點的所有後代後，將該節點前插或推入結果列表。
---
## Concept

Topological Sort 是一種針對有向無環圖 (Directed Acyclic Graph, DAG) 進行節點排序的演算法，其核心目標是將圖中的所有節點排成一個線性序列，使得對於每一條從節點 u 到節點 v 的有向邊 (u, v)，節點 u 在序列中都排在節點 v 的前面。在基於深度優先搜尋 (DFS) 的實作中，我們利用後序遍歷 (Post-order Traversal) 的特性：當一個節點的所有鄰居都被拜訪完畢後，該節點才被加入到結果集合中。這確保了所有的相依前置條件 (Prerequisites) 都會先於依賴該條件的後續節點被處理。整個演算法的時間複雜度為 O(V + E)，空間複雜度為 O(V)，非常適合用於編譯器相依性解析、任務排程與課程先修規劃等場景。

## Thinking

在處理 Topological Sort 的 DFS 解法時，思考邏輯聚焦在如何追蹤每個節點的拜訪狀態以防止迴圈 (Cycles)，並決定節點的收集順序。我們需要維護一個訪問狀態陣列或雜湊表，通常有三種狀態：未訪問 (Unvisited)、訪問中 (Visiting)、已訪問 (Visited)。當我們遇到「訪問中」的節點時，代表圖中存在環 (Cycle)，此時無法完成 Topological Sort。當我們對一個節點完成所有鄰居的遞迴搜尋後，將該節點推入結果串列的末端或堆疊中。由於 DFS 是深入到最深層的葉節點後才回溯，最後將結果反轉 (Reverse) 或直接前置插入，即可得到正確的前後相依順序。

## Pattern Recognition

當題目涉及一組任務、課程或物件，且它們之間存在明確的相依性限制（例如：必須先完成 A 才能開始 B），並且整個系統可以被建模為一個有向圖時，這就是典型的 Topological Sort 問題。若題目同時要求檢測是否存在循環相依（例如死結或無法完成的課程組合），或者需要求出一個合法的執行順序，我們就可以優先考慮使用 DFS 或是 Kahn's Algorithm (BFS) 來解決。

## Common Mistakes

最常見的錯誤是忽略了循環相依 (Cycle Detection) 的檢查，導致遞迴進入無窮迴圈或產生錯誤的排序結果。在 DFS 中，必須嚴格區分「正在遞迴拜訪中」與「已經完全拜訪完畢」的節點狀態，僅僅使用一個布林值的 visited 陣列是不夠的，因為這無法辨識出正在形成 Back-edge 的祖先節點。另一個常見錯誤是在遞迴結束後忘記將結果序列進行反轉，導致前置條件被排在後續節點的後面，違反了拓撲排序的定義。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表節點數量，E 代表邊的數量。每一個節點和每一條邊在 DFS 過程中都剛好被訪問一次。空間複雜度為 O(V)，主要來自遞迴呼叫堆疊 (Call Stack)、訪問狀態記錄陣列以及儲存最終結果的線性結構。

## Digest

本篇全面解析了基於 DFS 的 Topological Sort 核心原理。我們學習了如何透過三態標記法來精準偵測圖中的環，並利用後序遍歷的特性取得正確的相依順序。掌握 O(V + E) 的時間複雜度分析與正確的狀態管理，是解決各類先修課程與任務排程問題的關鍵。

## TypeScript Tip

在 TypeScript 中實作 DFS 時，遞迴深度可能會受到呼叫堆疊大小的限制。對於節點數量龐大的圖，應注意 Call Stack Overflow 的風險。陣列的 reverse() 方法可以原地反轉結果，節省額外記憶體配置。
```typescript
function safeCheck(arr: number[]): void {
  if (!Array.isArray(arr)) throw new Error("Invalid array");
}
safeCheck([1, 2]);
```

## Python Tip

Python 預設的遞迴深度限制為 1000，當圖的深度超過此限制時會觸發 RecursionError。必要時可使用 sys.setrecursionlimit() 進行調整。切片語法 [::-1] 是反轉串列最簡潔且效能良好的方式。
```python
import sys

def check_limit() -> int:
    return sys.getrecursionlimit()

assert check_limit() > 0, "assertion failed"
```

## Takeaway

Topological Sort DFS 利用後序遍歷與三態拜訪記錄，在 O(V + E) 時間內安全解析 DAG 相依性並檢測迴圈。

## Tomorrow Preview

明天我們將深入探討 Topological Sort 的另一種主流實作方式：Kahn's Algorithm (BFS)。我們將學習如何利用入度 (In-degree) 陣列與佇列 (Queue) 來進行廣度優先的拓撲排序，並比較其與 DFS 解法在優缺點與應用場景上的差異。

## Today's Challenge

- **210** · 題目要求找出修完所有課程的正確順序，且課程之間存在先修條件限制，這正是標準的 DAG Topological Sort 問題。
  - Hint: 利用三種狀態（0: 未訪問, 1: 訪問中, 2: 已訪問）來進行 DFS，並在節點回溯時將其加入結果集，最後反轉輸出。
