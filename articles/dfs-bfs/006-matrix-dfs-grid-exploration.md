---
id: matrix-dfs-grid-exploration
title: 二維網格的 DFS 探索
module: dfs-bfs
pattern_label: Grid DFS
complexity_label: O(R * C) / O(R * C)
estimated_minutes: 20
exit_criteria:
  - '能利用方向陣列（dx, dy）簡化網格鄰居的尋找'
  - 能正確處理網格邊界檢查（Boundary Check）
---
## Concept

二維網格的 DFS 探索（Grid DFS Exploration）是一種將矩陣視為隱式圖形（Implicit Graph）並進行深度優先搜尋的圖論演算法應用。在二維網格中，每個格子（Cell）代表一個節點，而上下左右相鄰的格子則代表節點之間的邊。透過方向陣列（Direction Array）的輔助，我們可以系統性地造訪網格中的每一個位置，常用於解決島嶼計算、區域連通性分析與迷宮路徑尋找等問題。

## Thinking

設計二維網格的 DFS 遞迴函式時，核心思維在於定義明確的狀態與邊界條件。首先，遞迴函式通常接收當前格子的座標 (r, c)。在進入函式後，必須優先進行邊界檢查（Boundary Check）與造訪狀態檢查（Visited Check），若當前座標超出矩陣範圍、或是該格子已經被造訪過、亦或是該格子不符合題目要求的條件（例如遇到障礙物或海水），則直接返回。通過初步檢查後，將當前格子標記為已造訪，接著利用迴圈遍歷方向陣列，分別對四個相鄰方向遞迴呼叫 DFS 函式。這種設計確保了演算法能夠完整走訪所有連通的節點而不會陷入無限迴圈。

## Pattern Recognition

當題目具備以下特徵時，即可高度識別並套用 Grid DFS 模式：第一，給定一個二維陣列、矩陣、地圖或網格；第二，要求尋找連通區域、計算島嶼數量或最大面積、或是探討區域的邊界與周長；第三，問題可以透過局部擴散（從一個點出發，擴散到上下左右相鄰點）來求解。此時通常需要搭配一個與原網格相同大小的二維布林陣列來記錄造訪狀態，或是直接修改原網格資料來避免重複計算。

## Common Mistakes

最常見的錯誤是在遞迴過程中忘記檢查陣列越界（Row or Column out of bounds），當遞迴嘗試存取超出矩陣範圍的座標時，會引發 Runtime Error（例如 Index Out of Bounds）。第二個常見錯誤是沒有正確記錄已造訪的格子，導致遞迴在互相相鄰的節點之間來回呼叫，最終引發 Stack Overflow。此外，在初始化二維造訪陣列時，若使用錯誤的語法（例如在 Python 中乘法運算子作用於可變物件或型別誤判）會導致狀態追蹤失效。

## Complexity

時間複雜度為 O(R * C)，其中 R 為矩陣的列數（Rows），C 為矩陣的行數（Columns）。在最壞情況下，DFS 會造訪網格中的每一個格子恰好一次。空間複雜度為 O(R * C)，主要取決於二維造訪陣列（Visited Array）所佔用的記憶體空間，以及在最壞遞迴深度達到整張地圖展開時的系統呼叫堆疊（Call Stack）開銷。

## Digest

今日重點聚焦於二維網格的 DFS 探索技巧。我們學習到如何將矩陣視為隱式圖形，並透過方向陣列（Direction Array）來簡化上下左右相鄰節點的巡訪邏輯。文章深入剖析了邊界檢查與造訪狀態追蹤的重要性，並點出常見的越界錯誤與記憶體配置陷阱。透過 TypeScript 與 Python 的實作範例，掌握了島嶼計數問題的完整解答流程。

## TypeScript Tip

在 TypeScript 中定義方向陣列時，建議使用雙維度常數陣列，並利用解構賦值（Destructuring Assignment）取得行列偏移量，使程式碼具備極佳的可讀性與型別安全。
```typescript
const DIRECTIONS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];
function isValid(r: number, c: number, rows: number, cols: number): boolean {
  const valid = r >= 0 && r < rows && c >= 0 && c < cols;
  if (typeof valid !== "boolean") throw new Error("Type assertion failed");
  return valid;
}
if (!isValid(0, 0, 5, 5)) throw new Error("Assertion failed");
```

## Python Tip

在 Python 中初始化二維陣列時，必須使用列表生成式配合正確的乘法運算子，例如 [[False] * cols for _ in range(rows)]，絕對不能寫成 [[False * cols]] 這種錯誤形式，以避免型別混淆與淺拷貝參考問題。
```python
rows, cols = 3, 3
visited = [[False] * cols for _ in range(rows)]
assert len(visited) == rows and len(visited[0]) == cols, "Dimension mismatch"
assert all(not cell for row in visited for cell in row), "Initial state must be False"
```

## Takeaway

掌握方向陣列與嚴格的邊界檢查，是解決所有二維網格圖論搜尋問題的不二法門。

## Tomorrow Preview

明天我們將探討圖論中的廣度優先搜尋（BFS）在二維網格上的應用，學習如何使用 Queue 資料結構來計算最短路徑與層級擴散問題。

## Today's Challenge

- **695** · 島嶼的最大面積需要透過 DFS 遍歷每個連通區塊，並在遞迴返回時累加當前區塊的面積計數。
  - Hint: 在 DFS 函式中回傳當前格子及其相鄰陸地的有效面積總和（若越界或遇水則回傳 0）。
- **463** · 使用遞迴 DFS 在二維網格上探訪相鄰的陸地格子，當遇到邊界或水域時即可累積計算周長邊。
  - Hint: 當探索方向超出網格邊界或遇到水域（0）時，代表此方向對周長貢獻 1 個單位。
