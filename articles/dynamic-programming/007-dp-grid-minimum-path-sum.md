---
id: dp-grid-minimum-path-sum
title: Grid Minimum Path Sum
module: dynamic-programming
pattern_label: Optimization Grid DP
complexity_label: O(m*n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能夠結合格子的權重與前置狀態的極值
  - 能正確處理第一列與第一欄的累積總和初始化
---
## Concept

Grid Minimum Path Sum 是一種在二維網格中尋找從起點到終點具有最小權重總和路徑的動態規劃技巧。當我們面對需要在網格中進行有方向性的移動，且每一步都帶有成本或權重，並要求最終累積總和達到極值時，Grid Minimum Path Sum 便是核心的解題手法。透過將大問題拆解為子問題，我們可以利用狀態轉移方程式逐步推導出到達每一個格子的最佳解。

## Thinking

思考 Grid Minimum Path Sum 時，我們通常從問題的邊界條件與狀態轉移出發。以二維網格為例，到達任意格子 (i, j) 的最小路徑和，取決於它是從上方格子 (i-1, j) 移動過來，還是從左方格子 (i, j-1) 移動過來。因此，狀態轉移方程式可表示為 dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])。為了節省空間，我們可以使用一維陣列進行滾動更新，將空間複雜度從 O(m * n) 降低至 O(n)，此時的狀態轉移為 dp[j] = grid[i][j] + min(dp[j], dp[j-1])，其中 dp[j] 代表上一列的狀態，而 dp[j-1] 代表當前列剛剛更新過的左方狀態。

## Pattern Recognition

辨識 Optimization Grid DP 的線索主要包含三個特徵：第一，問題給定一個二維矩陣或類似結構的網格；第二，移動方向受到限制，通常只能向右或向下；第三，目標是求出路徑上的數值總和最大值或最小值。當同時滿足這三點時，即可高度確信此題屬於 Grid Minimum Path Sum 的應用範圍。

## Common Mistakes

常見的錯誤主要發生在邊界條件的初始化階段。開發者常因忽略第一列只能從左方而來、第一欄只能從上方而來，而導致狀態轉移時發生陣列索引越界或取錯初始值。此外，在使用一維陣列滾動更新時，若更新順序錯誤或沒有正確保留前一列的值，也會導致計算結果失真。在處理累加總和時，必須確保起始點的數值被正確納入。

## Complexity

時間複雜度為 O(m * n)，其中 m 為網格的列數，n 為網格的行數，因為我們需要走訪網格中的每一個格子一次。空間複雜度在優化後可降至 O(n)，僅需使用一個長度為 n 的一維陣列來儲存當前列或上一列的狀態。

## Digest

Grid Minimum Path Sum 核心在於結合當前格子的權重與前置狀態的極值。透過優化狀態轉移方程式，我們能夠在二維網格中有效率地求解最小路徑和，並將空間複雜度精簡至一維。

## TypeScript Tip

```typescript
function solveGrid(grid: number[][]): number {
  const n = grid[0].length;
  const dp: number[] = new Array(n).fill(0);
  dp[0] = grid[0][0];
  for(let j = 1; j < n; j++) dp[j] = dp[j-1] + grid[0][j];
  const result = dp[n-1];
  if (result !== 12) throw new Error("assertion failed");
  return result;
}
solveGrid([[3, 4, 5]]);
```

## Python Tip

```python
def solve_grid(grid: list[list[int]]) -> int:
    n = len(grid[0])
    dp = [0] * n
    dp[0] = grid[0][0]
    for j in range(1, n):
        dp[j] = dp[j-1] + grid[0][j]
    result = dp[-1]
    assert result == 12, "assertion failed"
    return result
solve_grid([[3, 4, 5]])
```

## TypeScript Corner

```typescript
function minPathSum(grid: number[][]): number {
  const m = grid.length;
  const n = grid[0].length;
  const dp: number[] = new Array(n).fill(0);
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (i === 0 && j === 0) {
        dp[j] = grid[i][j];
      } else if (i === 0) {
        dp[j] = dp[j - 1] + grid[i][j];
      } else if (j === 0) {
        dp[j] = dp[j] + grid[i][j];
      } else {
        dp[j] = Math.min(dp[j], dp[j - 1]) + grid[i][j];
      }
    }
  }
  const result = dp[n - 1];
  if (result !== 7) throw new Error("assertion failed");
  return result;
}

minPathSum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]);
```

## Python Corner

```python
def minPathSum(grid: list[list[int]]) -> int:
    m = len(grid)
    n = len(grid[0])
    dp = [0] * n
    
    for i in range(m):
        for j in range(n):
            if i == 0 and j == 0:
                dp[j] = grid[i][j]
            elif i == 0:
                dp[j] = dp[j - 1] + grid[i][j]
            elif j == 0:
                dp[j] = dp[j] + grid[i][j]
            else:
                dp[j] = min(dp[j], dp[j - 1]) + grid[i][j]
                
    result = dp[n - 1]
    assert result == 7, "assertion failed"
    return result

minPathSum([[1, 3, 1], [1, 5, 1], [4, 2, 1]])
```

## Takeaway

掌握網格動態規劃的邊界初始化與一維滾動陣列技巧，是解決矩陣極值路徑問題的關鍵。

## Tomorrow Preview

明天我們將探討字串動態規劃中的 Edit Distance 問題，學習如何在字串轉換過程中計算最小的操作成本。

## Today's Challenge

- **64** · 典型的二維網格最小路徑和問題，完美符合從左上到右下的最佳化結構。
  - Hint: 注意第一列與第一欄只能單向累積的初始化特性。
- **120** · 三角形結構的網格動態規劃，每一層的相鄰元素對應到底層的轉移關係。
  - Hint: 可以從底向上計算以避免複雜的邊界處理。
