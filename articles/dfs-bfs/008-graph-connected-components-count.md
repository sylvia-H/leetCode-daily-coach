---
id: graph-connected-components-count
title: 圖形連通分量計算
module: dfs-bfs
pattern_label: Connected Components
complexity_label: O(V + E) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能寫出外層迴圈配合內部 DFS/BFS 計算連通分量的樣板
  - 理解如何透過計數器追蹤獨立群組
---
## Concept

圖形連通分量計算（Connected Components）是指在一個無向圖中，找出所有互相連通的節點子集。如果圖中存在多個彼此沒有邊相連的獨立子圖，每一個子圖就被稱為一個「連通分量」。透過走訪所有未造訪的節點，每啟動一次全新的深度優先搜尋或廣度優先搜尋，就代表發現一個新的獨立連通分量。這種技術是圖論基礎中的核心，廣泛應用於社交網路社群發現、影像處理中的物件標記以及網路連線狀態分析。

## Thinking

當我們需要計算圖中的連通分量時，核心思維是利用外層迴圈遍歷圖中的每一個節點。由於圖可能包含多個不相交的子圖，單單從某一個節點出發進行搜尋無法保證走訪整張圖。因此，外層迴圈會依序檢查每個節點是否已經被標記為「已造訪」。如果某個節點尚未被造訪，這意味著我們發現了一個全新且尚未探索過的連通分量。此時，我們將計數器加一，並立即啟動內部搜尋（如 DFS 或 BFS），將與該節點連通的所有節點全部標記為已造訪。這樣一來，外層迴圈配合內部搜尋的架構就能夠完美且不重複地統計出所有的連通分量數量。

## Pattern Recognition

辨識此 Pattern 的關鍵線索在於題目詢問「共有幾個獨立群組」、「省份總數」、「島嶼數量」或「相連元件個數」。當問題要求將一堆互相連接的實體歸類為不同的集合，且不要求尋找最短路徑，而是著重於整張圖的結構劃分與群組統計時，這就是標準的 Connected Components 問題。常見的變體包括二維網格圖（Grid）中的上下左右相連格子，或是以鄰接表（Adjacency List）表示的無向圖。

## Common Mistakes

初學者在實現連通分量計算時，最常犯的錯誤是漏掉孤立節點（即度數為 0 的節點）。有些實作只從指定的起點開始搜尋，忽略了外層迴圈全面檢查的重要性。另一個常見錯誤是狀態標記不及時，導致內部搜尋陷入無限迴圈或重複訪問已經處理過的節點。在二維網格的題目中，常常忘記檢查邊界條件或是在遞迴過程中發生堆疊溢位（Stack Overflow），這些都是需要特別注意的陷阱。

## Complexity

時間複雜度為 O(V + E)，其中 V 代表頂點數量，E 代表邊的數量。每一個頂點與每一條邊在整個搜尋過程中最多被訪問一次。空間複雜度為 O(V)，主要取決於儲存造訪狀態的資料結構（如 Set 或 boolean 陣列）以及遞迴呼叫堆疊或佇列所需的最大空間。

## Digest

今天我們深入學習了圖形連通分量計算的核心觀念。透過外層迴圈確保每一個節點都被檢查，並在遇到未造訪節點時啟動內部搜尋，我們能夠系統化地找出所有獨立群組。掌握此 Pattern 後，無論面對鄰接表或是網格圖的群組統計，都能夠迎刃而解。

## TypeScript Tip

```typescript
function validateGraphState(n: number, visitedSize: number): void {
  const isValid = visitedSize <= n;
  if (!isValid) throw new Error("Visited size exceeds total nodes");
}
validateGraphState(5, 5);
```

## Python Tip

```python
def validate_graph_state(n: int, visited_size: int) -> None:
    is_valid = visited_size <= n
    assert is_valid, "Visited size exceeds total nodes"


validate_graph_state(5, 5)
```

## Takeaway

外層迴圈檢查未造訪節點，內部 DFS 或 BFS 標記整塊連通分量，這是解決圖形獨立群組統計問題的不變鐵律。

## Tomorrow Preview

明天我們將進一步探討圖論中的進階主題：使用並查集（Disjoint Set Union, DSU）來動態維護與查詢連通分量。相較於傳統的 DFS 與 BFS，DSU 在處理動態加邊的連通性問題時表現更為優異，是面試中應對複雜圖論題目的重要武器。

## Today's Challenge

- **323** · 本題要求計算無向圖中連通分量的數量，是此 Pattern 的標準教科書級別應用，完美契合外層迴圈搭配深度優先搜尋的架構。
  - Hint: 先將邊轉換為鄰接表，接著利用迴圈搭配 Set 或布林陣列追蹤造訪狀態。
- **2668** · 此題作為圖形連通分量的基礎練習，考練對於節點遍歷與狀態追蹤的掌握度，非常適合用來鞏固基本功。
  - Hint: 注意邊界條件以及孤立節點的處理方式。
