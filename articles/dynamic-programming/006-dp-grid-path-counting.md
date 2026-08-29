---
id: dp-grid-path-counting
title: Grid Path Counting
module: dynamic-programming
pattern_label: 2D Grid DP
complexity_label: O(m*n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能夠處理二維網格的邊界初始化（第一列與第一欄）
  - 能夠寫出從上方與左方轉移而來的狀態方程式
---
## Concept

Grid Path Counting 是一種應用於二維網格上的動態規劃方法。當問題要求計算從起點移動到終點的方法總數，且每一步的移動方向受限（通常僅能向右或向下移動）時，我們即可利用此觀念建立狀態轉移方程式。到達任意格子 (i, j) 的路徑數量，等於從上方格子 (i-1, j) 與左方格子 (i, j-1) 到達該處的方法數總和。這奠定了二維矩陣動態規劃的基礎，並可透過空間優化技術將記憶體複雜度由二維降低至一維。

## Thinking

在設計演算法時，首先定義狀態代表的意義。設 dp[i][j] 為到達網格中座標 (i, j) 的獨特路徑數量。根據移動規則，我們有轉移方程式：dp[i][j] = dp[i-1][j] + dp[i][j-1]。為了處理邊界條件，第一列與第一欄的格子通常只有一種到達方式（全部設為 1，直到遇到障礙物）。若題目包含障礙物，則當網格該位置為障礙物時，dp[i][j] 直接設為 0。為進一步優化空間複雜度，我們可以觀察到每一行的狀態僅依賴於當前行與上一行的數值，因此能將二維陣列壓縮為一維滾動陣列，方程式簡化為 dp[j] = dp[j] + dp[j-1]。此時從左到右更新狀態即可正確取得前方的累加結果。

## Pattern Recognition

辨識 Grid Path Counting 的關鍵線索包含：問題發生在二維矩陣或網格空間中；移動方向嚴格受限（如僅能向下或向右）；目標是求取「所有可能的路徑總數」或「達成某種條件的最優路徑組合」。如果題目同時引入了障礙物或動態阻擋條件，則往往需要結合狀態初始化與條件判斷來進行動態規劃。這類特徵明確指出該問題可透過遞推關係式分解為重疊子問題。

## Common Mistakes

最常見的錯誤在於處理邊界條件與障礙物初始化時發生索引越界，或是未將障礙物所在位置的狀態正確歸零。當使用一維陣列優化空間時，若迴圈方向錯誤（例如由右至左更新而非由左至右），會導致讀取到已被覆蓋的錯誤當前行數據。此外，若網格尺寸為零或起點本身即為障礙物，未在程式碼開頭進行預先檢查，將導致後續的轉移邏輯產生非預期的結果。

## Complexity

時間複雜度為 O(m * n)，其中 m 為網格列數，n 為網格行數，因為我們必須走訪矩陣中的每一個格子一次。空間複雜度若使用完整二維陣列為 O(m * n)，但在應用一維滾動陣列優化後，空間複雜度可降低至 O(n)。

## Digest

今日重點聚焦於 Grid Path Counting 的核心原理。到達任意格子的路徑數等於其上方與左方格子方法數的加總。在實作上，我們能夠利用一維滾動陣列將空間複雜度從 O(m * n) 降至 O(n)，並妥善處理邊界條件與障礙物初始化，為後續的二維動態規劃題型打下穩固基礎。

## TypeScript Tip

```typescript
function uniquePathsWithObstacles(obstacleGrid: number[][]): number {
  const m = obstacleGrid.length;
  const n = obstacleGrid[0].length;
  const dp: number[] = new Array(n).fill(0);
  dp[0] = obstacleGrid[0][0] === 0 ? 1 : 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (obstacleGrid[i][j] === 1) {
        dp[j] = 0;
      } else if (j > 0) {
        dp[j] += dp[j - 1];
      }
    }
  }
  return dp[n - 1];
}
const testGrid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];
if (uniquePathsWithObstacles(testGrid) !== 2) throw new Error("assertion failed");
```

## Python Tip

```python
def uniquePathsWithObstacles(obstacleGrid: list[list[int]]) -> int:
    if not obstacleGrid or obstacleGrid[0][0] == 1:
        return 0
    m, n = len(obstacleGrid), len(obstacleGrid[0])
    dp = [0] * n
    dp[0] = 1
    for i in range(m):
        for j in range(n):
            if obstacleGrid[i][j] == 1:
                dp[j] = 0
            elif j > 0:
                dp[j] += dp[j - 1]
    return dp[-1]


assert uniquePathsWithObstacles([[0, 0, 0], [0, 1, 0], [0, 0, 0]]) == 2
```

## Takeaway

網格路徑計數的關鍵在於狀態轉移方程式 dp[j] += dp[j-1]，並透過一維陣列優化空間，同時務必妥善初始化邊界與障礙物。

## Tomorrow Preview

明天我們將探討如何將 Grid Path Counting 的觀念延伸至帶有權重的路徑最佳化問題，學習如何計算二維網格中的最小路徑和。

## Today's Challenge

- **62** · 此題為標準的 Grid Path Counting，要求計算從左上角走到右下角的獨特路徑總數，完美對應二維網格動態規劃與一維狀態壓縮。
  - Hint: 第一列與第一欄的格子初始化為 1，其餘格子利用上方與左方相加。
- **63** · 此題在網格中加入了障礙物限制，必須在狀態轉移過程中檢查並將障礙物位置的方法數歸零，考練邊界與條件處理。
  - Hint: 若遇到障礙物則將該位置的 dp 值設為 0，注意起點本身為障礙物的例外情況。
