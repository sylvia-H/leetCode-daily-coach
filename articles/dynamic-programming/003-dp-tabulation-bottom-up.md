---
id: dp-tabulation-bottom-up
title: Bottom-Up DP with Tabulation
module: dynamic-programming
pattern_label: Tabulation
complexity_label: O(n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能夠決定表格的維度與初始狀態
  - 能夠正確寫出迴圈順序來填滿表格
---
## Concept

Bottom-Up DP with Tabulation 是一種迭代式的動態規劃方法。有別於 Top-Down 搭配 Memoization 的遞迴思維，Tabulation 從問題的最基礎狀態（Base Case）出發，透過迴圈由小到大、由底向上逐步填滿表格，直到計算出目標狀態為止。這種方法完全消除了遞迴呼叫帶來的額外記憶體與函式堆疊負擔。

## Thinking

思考 Bottom-Up DP 時，我們首先需要建立一個用來儲存狀態的 DP 陣列。接著，明確定義陣列中每個索引代表的意義，並設定好基礎狀態（Base Case）。然後，設計一個迴圈由小到大迭代更新狀態，最後回傳對應的目標狀態。

## Pattern Recognition

當遇到需要求最佳解、總方法數，且問題可以分解為重疊子問題，而狀態轉移依賴先前已知的小狀態且順序明確時，即可辨識出應使用 Tabulation Pattern。

## Common Mistakes

最常見的錯誤是在使用迴圈填表時，沒有注意迴圈邊界條件，導致索引超出陣列範圍而引發陣列溢位。此外，基礎狀態設定錯誤或遺漏也會導致後續計算全部失準。

## Complexity

時間複雜度為 O(n)，因為我們通常需要一個迴圈走訪輸入規模 n；空間複雜度為 O(n)（若未進一步做空間優化，需建立大小為 n 的 DP 陣列）。

## Digest

Bottom-Up DP with Tabulation 核心在於由小到大迭代填表。本單元帶領大家掌握狀態定義、基礎狀態設定與迴圈順序，透過明確的表格建立過程消弭遞迴負擔。在實作上，必須嚴格注意迴圈邊界與陣列初始化，確保狀態轉移正確無誤。

## TypeScript Tip

```typescript
function createTable(n: number): number[] {
  const dp = new Array<number>(n).fill(0);
  if (dp.length !== n) throw new Error("assertion failed");
  return dp;
}
if (createTable(5).length !== 5) throw new Error("assertion failed");
```

## Python Tip

```python
def create_table(n: int) -> list[int]:
    dp = [0] * n
    assert len(dp) == n, "assertion failed"
    return dp

assert len(create_table(5)) == 5, "assertion failed"
```

## TypeScript Corner

```typescript
function climbStairs(n: number): number {
  if (n <= 2) return n;
  const dp: number[] = new Array(n + 1);
  dp[1] = 1;
  dp[2] = 2;
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  if (dp[n] <= 0) throw new Error("assertion failed");
  return dp[n];
}
if (climbStairs(3) !== 3) throw new Error("assertion failed");
```

## Python Corner

```python
def climbStairs(n: int) -> int:
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    dp[2] = 2
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    assert dp[n] > 0, "assertion failed"
    return dp[n]

assert climbStairs(3) == 3, "assertion failed"
```

## Takeaway

由底向上填表，消弭遞迴負擔，精準掌握邊界與迭代順序。

## Tomorrow Preview

明天我們將探討如何對 Tabulation 進行空間優化（Space Optimization），透過僅保留少數幾個變數來替代整個 DP 陣列，將空間複雜度從 O(n) 降低至 O(1)。

## Today's Challenge

- **70** · 爬樓梯問題的第 n 階方法數完全依賴前兩階的和，非常適合使用 Tabulation 進行狀態迭代。
  - Hint: 設定 dp[1] = 1 與 dp[2] = 2 為 Base Case，迴圈從 3 迭代到 n。
- **746** · 最小花費爬樓梯需要透過累加之前的最小花費來決定當前狀態，完美符合由底向上填表的邏輯。
  - Hint: 狀態定義為到達第 i 階所需的最小花費，注意起點可以從 0 或 1 開始。
- **198** · 打家劫舍問題中，不能偷相鄰房屋，當前最大金額取決於前一間或前兩間加當前房屋的選擇，完全契合 Tabulation。
  - Hint: dp[i] = max(dp[i-1], dp[i-2] + nums[i])。
