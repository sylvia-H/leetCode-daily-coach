---
id: dp-memoization-top-down
title: Top-Down DP with Memoization
module: dynamic-programming
pattern_label: Memoization
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能夠在遞迴函式中加入快取檢查與更新邏輯
  - 能正確初始化快取陣列的大小與預設值
---
## Concept

Top-Down DP with Memoization 是一種結合遞迴與快取機制的演算法設計策略。當我們面對具有重疊子問題特性的問題時，直接使用純遞迴往往會導致指數級別的時間複雜度。透過在遞迴過程中建立一個記憶化表格（Memoization Table），將已經計算過的中間結果儲存起來，當再次遇到相同的子問題時便能以 O(1) 的時間直接取回，從而將整體時間複雜度大幅降低至線性或多項式等級。這種方法保持了直觀的自頂向下思考模式，同時兼顧了效能。

## Thinking

在著手設計 Top-Down DP 解決方案時，首先需要明確定義遞迴函式的數學意義與輸入參數。接著，務必優先撰寫 Base Case 以防止無限遞迴並處理邊界條件。在進行複雜的分支遞迴呼叫之前，必須先檢查快取表格中是否已經存在該狀態的計算結果，若存在則直接返回。若快取中沒有該結果，則執行標準的遞迴計算邏輯，並在將結果返回給呼叫方前，確實寫入快取表格中，確保後續相同的子問題不再重複計算。

## Pattern Recognition

當問題滿足兩個核心特徵時，即可高度懷疑適用 Memoization 策略：第一是最佳子結構（Optimal Substructure），即大問題的最優解可以由小問題的最優解組合而成；第二是重疊子問題（Overlapping Subproblems），即在遞迴樹的展開過程中，會多次重複計算相同的子節點狀態。如果在繪製遞迴樹時發現大量的節點分支重複出現，這就是採用 Memoization 的強烈辨識線索。

## Common Mistakes

最常見的失誤在於快取陣列或物件的初始化階段。若陣列大小配置錯誤或預設值設定不當（例如將未計算的狀態誤設為 0 而非 -1），會導致程式無法正確判斷該狀態是否已經被計算過，進而引發無窮遞迴或返回錯誤的計算結果。此外，未能在遞迴進入點第一時間檢查快取，或者在遞迴返回前遺漏寫入快取動作，也會使記憶化機制形同虛設。

## Complexity

時間複雜度為 O(n)，因為每個狀態在快取機制的保護下只會被計算一次；空間複雜度為 O(n)，主要取決於遞迴呼叫的調用棧深度以及用來儲存狀態的快取表格大小。

## Digest

Top-Down DP with Memoization 結合了遞迴的直觀性與快取的效率。核心在於定義狀態、處理 Base Case、檢查快取並更新快取。能有效解決重疊子問題，將指數級別的時間複雜度降為線性。撰寫時需注意快取表格的初始化與邊界條件。

## TypeScript Tip

```typescript
function fib(n: number): number {
  const cache = new Map<number, number>();
  function helper(x: number): number {
    if (x <= 1) return x;
    if (cache.has(x)) return cache.get(x)!;
    const res = helper(x - 1) + helper(x - 2);
    cache.set(x, res);
    return res;
  }
  const ans = helper(n);
  if (ans !== 5) throw new Error("assertion failed");
  return ans;
}
fib(5);
```

## Python Tip

```python
def fib(n: int) -> int:
    memo = {}
    def helper(x: int) -> int:
        if x <= 1:
            return x
        if x in memo:
            return memo[x]
        memo[x] = helper(x - 1) + helper(x - 2)
        return memo[x]
    
    ans = helper(n)
    assert ans == 5, "assertion failed"
    return ans

fib(5)
```

## TypeScript Corner

```typescript
function climbStairs(n: number): number {
  const memo: number[] = new Array(n + 1).fill(-1);
  function dp(i: number): number {
    if (i <= 2) return i;
    if (memo[i] !== -1) return memo[i];
    memo[i] = dp(i - 1) + dp(i - 2);
    return memo[i];
  }
  const result = dp(n);
  if (result !== 3) throw new Error("assertion failed");
  return result;
}
climbStairs(3);
```

## Python Corner

```python
import functools

def climb_stairs(n: int) -> int:
    @functools.cache
    def dp(i: int) -> int:
        if i <= 2:
            return i
        return dp(i - 1) + dp(i - 2)
    
    result = dp(n)
    assert result == 3, "assertion failed"
    return result

climb_stairs(3)
```

## Takeaway

Memoization 讓遞迴不再重複計算，透過快取將時間複雜度從指數級降為線性，是動態規劃的重要基石。

## Tomorrow Preview

明天我們將探討 Bottom-Up DP（動態規劃的迭代實作方式），學習如何透過迴圈消除遞迴調用帶來的額外棧空間開銷，進一步優化空間複雜度。

## Today's Challenge

- **509** · 費波那契數列具有標準的重疊子問題特性，直接遞迴會產生大量重複計算，非常適合使用 Top-Down DP 進行優化。
  - Hint: 注意處理 n 等於 0 與 1 的 Base Case，並使用陣列記錄已計算過的值。
- **70** · 爬樓梯問題的每一步都可以轉化為子問題的組合，遞迴樹中存在大量重複造訪的高度狀態，符合 Memoization 的應用情境。
  - Hint: 當前階數的合法方法數等於前一階與前兩階方法數的總和。
- **198** · 打家劫舍問題在每個房屋決策時會衍生出重疊的子問題結構，透過記憶化遞迴可以有效避開重複的狀態搜尋。
  - Hint: 狀態定義為考慮前 i 間房屋能偷竊到的最高金額，遞迴時比較偷取當前房屋與否的最大值。
