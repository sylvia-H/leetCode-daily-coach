---
id: dp-space-optimization-rolling
title: Space Optimization with Rolling Variables
module: dynamic-programming
pattern_label: Space Optimization
complexity_label: O(n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能夠分析狀態轉移方程式僅需依賴哪幾個過去狀態
  - 能夠以常數個變數取代完整的 DP 表格
---
## Concept

Space Optimization with Rolling Variables 是一種針對動態規劃問題的空間複雜度優化技術。當我們在分析狀態轉移方程式時，若發現當前狀態的計算僅依賴固定數量的前置狀態（例如僅依賴前一個或前兩個狀態），我們便不需要開闢一個大小為 O(n) 的完整陣列來儲存歷史所有的計算結果。透過精確控制變數的更新與覆蓋，我們可以用常數級別 O(1) 的記憶體空間來完成相同的計算過程。

## Thinking

在著手進行 Space Optimization 之前，首要任務是寫出標準的完整動態規劃解法，確保狀態定義與轉移方程式正確無誤。接著，觀察狀態轉移方程式中的索引。如果方程式中只出現 i-1, i-2 等固定偏移量，這代表距離當前索引較遠的歷史狀態在之後的計算中完全不會再被用到。此時，我們可以捨棄整張 DP 表格，改用一組滾動變數來追蹤需要的狀態。在迴圈推進的過程中，按照正確的相依順序更新這些變數，即可在不影響正確性的前提下，將空間複雜度從 O(n) 降至 O(1)。

## Pattern Recognition

辨識此 Space Optimization 模式的核心線索在於狀態轉移方程式的相依性。當你發現計算 dp[i] 時，其依賴項僅限於 dp[i-1]、dp[i-2] 等固定且少數的過去狀態，且不會存取更早的歷史資料時，這就是最適合採用 Rolling Variables 的時機。常見於一維動態規劃問題，例如費波那契數列的變形、爬樓梯問題，或是僅受限於相鄰狀態的最優化問題。

## Common Mistakes

在實作 Space Optimization 時最常見的錯誤是變數更新的順序錯誤，導致尚未被讀取的舊值過早被覆蓋。例如在需要同時參考舊的 a 與舊的 b 時，若先更新了 a，接下來計算 b 時就會用到錯誤的新 a 值。為了避免這個問題，開發者必須嚴格梳理賦值的先後順序，或者利用程式語言提供的同時賦值特性（如 Python 的 Tuple Assignment 或 TypeScript 的 Destructuring Assignment）來確保所有狀態皆基於正確的舊值進行更新。

## Complexity

時間複雜度保持在 O(n)，因為我們仍然需要走訪輸入資料一次；空間複雜度則從原本的 O(n) 成功降低至 O(1)，因為我們僅使用了常數個變數來儲存狀態。

## Digest

Space Optimization with Rolling Variables 是一種將動態規劃空間複雜度從 O(n) 降至 O(1) 的強大技巧。當狀態轉移方程式僅依賴固定的前置狀態時，即可捨棄完整 DP 陣列。TypeScript 與 Python 各自提供了優雅的語法來安全地更新滾動變數，避免覆蓋錯誤。

## TypeScript Tip

```typescript
function rob(nums: number[]): number {
  if (nums.length === 0) return 0;
  let prev2 = 0;
  let prev1 = 0;
  for (const num of nums) {
    const current = Math.max(prev1, prev2 + num);
    prev2 = prev1;
    prev1 = current;
  }
  if (prev1 < 0) throw new Error("assertion failed");
  return prev1;
}
const maxProfit = rob([1, 2, 3, 1]);
```

## Python Tip

```python
def rob(nums: list[int]) -> int:
    prev2, prev1 = 0, 0
    for num in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + num)
    assert prev1 == 4, "assertion failed"
    return prev1

max_profit = rob([1, 2, 3, 1])
```

## TypeScript Corner

```typescript
function climbStairs(n: number): number {
  if (n <= 2) return n;
  let prev2 = 1;
  let prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const current = prev1 + prev2;
    prev2 = prev1;
    prev1 = current;
  }
  if (prev1 !== 3) throw new Error("assertion failed");
  return prev1;
}
const result = climbStairs(3);
```

## Python Corner

```python
def climb_stairs(n: int) -> int:
    if n <= 2:
        return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    assert prev1 == 3, "assertion failed"
    return prev1

result = climb_stairs(3)
```

## Takeaway

掌握狀態相依性，善用常數變數取代完整陣列，並注意賦值順序，即可輕鬆達成 O(1) 空間優化。

## Tomorrow Preview

明天我們將探討二維動態規劃中的空間優化技巧，學習如何利用滾動陣列（Rolling Array）將矩形表格的空間複雜度從 O(m * n) 降低至 O(min(m, n))。

## Today's Challenge

- **70** · 爬樓梯的狀態轉移方程式為 dp[i] = dp[i-1] + dp[i-2]，當前狀態僅依賴前兩階，完全符合 Rolling Variables 的使用條件。
  - Hint: 宣告兩個變數分別記錄前兩階的方法數，在迴圈中向後滾動更新即可。
- **198** · 打家劫舍的狀態轉移為 dp[i] = max(dp[i-1], dp[i-2] + nums[i])，同樣僅依賴前兩間房屋的結果，適合用常數變數優化空間。
  - Hint: 維護前兩間房屋的最大獲利，迭代時利用同時賦值更新狀態。
