---
id: dfs-visited-state-management
title: DFS 已造訪狀態管理
module: dfs-bfs
pattern_label: Visited Tracking
complexity_label: O(V) / O(V)
estimated_minutes: 15
exit_criteria:
  - 能在圖形有環的情況下正確使用 visited 陣列或集合
  - 理解在進入節點前與離開節點時標記狀態的時機差異
---
## Concept

在圖形與網格搜尋中，DFS 已造訪狀態管理（Visited Tracking）是確保演算法正確終止並避免陷入無限迴圈的核心機制。由於圖形結構可能包含環（Cycles），若無適當的狀態記錄，深度優先搜尋會重複造訪相同的節點，導致堆疊溢位（Stack Overflow）或執行時間無限延伸。透過資料結構（如 Hash Set 或布林陣列）追蹤每個節點的造訪狀態，我們能確保每個節點與邊僅被處理一次，維持演算法的線性時間複雜度。

## Thinking

當面對圖形或矩陣遍歷問題時，思考的起點在於識別狀態空間與轉移條件。在進入遞迴函式或處理特定節點的瞬間，我們必須立即將該節點標記為已造訪。這種即時標記的策略可防止後續的鄰居節點在迴圈中再次將當前節點加入處理佇列或遞迴呼叫中。此外，我們必須釐清狀態標記的時機：對於多數基礎走訪與連通分量計算，在進入節點時標記即可；對於需要尋找所有簡單路徑的回溯（Backtracking）問題，則可能需要在離開節點時進行狀態重置（Unvisiting）。

## Pattern Recognition

當題目涉及網格（Grid）、有向圖（Directed Graph）或無向圖（Undirected Graph）的遍歷、連通分量計算、路徑搜尋或區域擴散時，即可明確辨識出 Visited Tracking 的 Pattern。若題目要求找出所有可能路徑、計算島嶼數量、或是判斷是否存在環，通常都離不開造訪狀態的管理。

## Common Mistakes

最常見的錯誤是在將節點加入鄰居清單或準備遞迴時才進行標記，而不是在「進入」節點的當下立即標記。這會導致同一個節點在不同分支中被重複加入待處理清單，造成效能劣化甚至無限迴圈。另一個常見錯誤是在需要回溯的場景中忘記在遞迴返回時清除已造訪狀態，導致合法路徑被錯誤排除。

## Complexity

時間複雜度為 O(V)，其中 V 為節點總數（或網格中的格子總數），因為每個節點僅會被造訪與標記一次。空間複雜度為 O(V)，主要取決於遞迴呼叫堆疊的最大深度以及儲存已造訪狀態所需的 Hash Set 或陣列空間。

## Digest

今日重點聚焦於 DFS 中的 Visited Tracking Pattern。我們學習到圖形走訪必須嚴格管理節點的造訪狀態，以防範因環狀結構導致的無限遞迴。透過在進入節點時立即標記，我們能確保演算法以 O(V) 的時間效率正確執行。TypeScript 使用 Set<number> 或 Set<string>，Python 則使用 set() 達成常數時間的查詢與更新。掌握此基礎，能為後續更複雜的圖論演算法打下穩固根基。

## TypeScript Tip

```typescript
function hasValidVisit(grid: number[][]): boolean {
    const visited = new Set<string>();
    const key = (r: number, c: number) => `${r},${c}`;
    visited.add(key(0, 0));
    if (!visited.has(key(0, 0))) throw new Error("assertion failed");
    return true;
}
hasValidVisit([[0]]);
```

## Python Tip

```python
def has_valid_visit(grid: list[list[int]]) -> bool:
    visited = set()
    key = (0, 0)
    visited.add(key)
    assert key in visited, "assertion failed"
    return True
has_valid_visit([[0]])
```

## Takeaway

Visited Tracking 是圖形走訪的靈魂，即時標記、正確選擇資料結構，是確保演算法終止與效能的關鍵。

## Tomorrow Preview

明天我們將深入探討圖論中的進階主題：使用拓撲排序（Topological Sort）解決依賴關係問題，並學習如何結合入度表與佇列來偵測有向圖中的環。

## Today's Challenge

- **733** · 著色問題需要在二維網格中向四個方向擴散，精準記錄已填色的像素座標可避免重複處理與無限迴圈。
  - Hint: 在更新像素顏色的同時，將當前座標加入 visited 集合或直接比對原顏色以避免重複造訪。
- **130** · 需要在網格邊界上利用 DFS 走訪與狀態標記，以區分出與邊界相連的 O 區域以及被 X 完全包圍的內部區域。
  - Hint: 先從邊界的 O 開始進行 DFS，將所有可連通的 O 標記為特殊狀態，最後再掃描整個網格進行轉換。
