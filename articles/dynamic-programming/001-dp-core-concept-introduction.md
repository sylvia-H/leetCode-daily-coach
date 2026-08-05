---
id: dp-core-concept-introduction
title: Dynamic Programming Core Concept Introduction
module: dynamic-programming
pattern_label: Overlapping Subproblems
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能夠辨識何時遞迴呼叫存在重複計算
  - 能夠手動畫出呼叫樹並找出重疊
---
## Concept

動態規劃是將複雜的大問題拆解為數個重疊的子問題，並透過儲存子問題的解來避免重複計算的優化技巧。在動態規劃的核心思維中，我們透過狀態轉移方程式來描述問題之間的數學關係，並利用記憶化搜尋或迭代填表的方式，將原本指數級成長的計算複雜度降低至多項式時間。本單元將介紹動態規劃的基礎觀念與 Overlapping Subproblems 的辨識方法。

## Thinking

面對這類最佳化或計數問題時，思考的標準路徑是先建立數學遞迴關係式。首先，定義狀態以明確表示子問題代表的意義；接著，找出狀態轉移方程式，也就是如何從較小的子問題推導出當前問題的解；最後，確認遞迴的終止條件。透過繪製遞迴呼叫樹，我們可以直觀地觀察到相同的子問題被重複計算了多次，這正是啟發我們引入記憶化陣列或表格的關鍵時刻。

## Pattern Recognition

當題目要求尋找第 n 項數值、最佳解（最大值、最小值）或是計算所有可能的方法總數，且問題可以被分解為結構相同的子問題時，即可辨識出 Overlapping Subproblems 的 Pattern。如果直接使用純遞迴求解會導致執行時間超時（Time Limit Exceeded），且呼叫樹中存在大量重複節點，這就是使用動態規劃的最佳訊號。

## Common Mistakes

初學者最常見的錯誤是混淆遞迴的終止條件與狀態轉移方程式，導致遞迴無法正確終止或產生無窮迴圈。另一個常見誤區是未妥善處理邊界條件，例如陣列索引超出範圍。此外，過度依賴自頂向下的記憶化遞迴而忽略了自底向上的迭代實作，可能在呼叫層數過深時引發堆疊溢位（Stack Overflow）問題。

## Complexity

時間複雜度：O(n)，因為每個子問題僅被計算一次並儲存起來；空間複雜度：O(n)，用於儲存記憶化陣列或遞迴呼叫堆疊的開銷。

## Digest

動態規劃是解決複雜問題的核心演算法之一。本單元探討了 Overlapping Subproblems 的基本概念，學習如何透過繪製呼叫樹來辨識重複計算，並介紹了記憶化搜尋的基本技巧。透過將子問題的結果快取，我們能大幅提升程式執行效能。在 TypeScript 中我們善用 Map 來實作記憶化，而在 Python 中則利用 lru_cache 裝飾器簡化流程。掌握這些基礎後，我們能夠順利解決費波那契數列、爬樓梯與打家劫舍等經典動態規劃題目。

## TypeScript Tip

```typescript
function fib(n: number, memo: number[] = []): number {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}
const result = fib(5);
if (result !== 5) throw new Error("Assertion failed");
```

## Python Tip

```python
def fib(n: int) -> int:
    if n <= 1:
        return n
    memo = [0] * (n + 1)
    memo[1] = 1
    for i in range(2, n + 1):
        memo[i] = memo[i - 1] + memo[i - 2]
    return memo[n]

result = fib(5)
assert result == 5, "Assertion failed"
```

## TypeScript Corner

```typescript
function climbStairs(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 2) return n;
  if (memo.has(n)) return memo.get(n)!;
  const result = climbStairs(n - 1, memo) + climbStairs(n - 2, memo);
  memo.set(n, result);
  return result;
}
const ans = climbStairs(3);
if (ans !== 3) throw new Error("Assertion failed");
```

## Python Corner

```python
from functools import lru_cache

@lru_cache(maxsize=None)
def climb_stairs(n: int) -> int:
    if n <= 2:
        return n
    return climb_stairs(n - 1) + climb_stairs(n - 2)

ans = climb_stairs(3)
assert ans == 3, "Assertion failed"
```

## Takeaway

動態規劃透過儲存重疊子問題的解來優化效能，將指數級複雜度降為線性複雜度。

## Tomorrow Preview

明天我們將深入探討最佳子結構（Optimal Substructure）與狀態轉移方程式的完整建構過程，並學習如何從自頂向下的記憶化轉化為自底向上的動態規劃表格填表法。

## Today's Challenge

- **509** · 費波那契數列直接展示了遞迴呼叫中的大量重複子問題，是理解 Overlapping Subproblems 的最佳範例。
  - Hint: 注意當 n 變大時純遞迴的時間複雜度會暴增，請使用快取陣列儲存已計算過的值。
- **70** · 爬樓梯問題展現了如何將問題拆解為前兩項的組合，其數學結構與費波那契數列完全相同。
  - Hint: 到達第 n 階的方法數等於到達第 n-1 階與第 n-2 階的方法數總和。
- **198** · 打家劫舍透過加入選擇性（偷或不偷），展示了如何建立狀態轉移方程式來求解最佳解。
  - Hint: 對於每一間房屋，你必須決定是偷取當前房屋加上前兩間的累積金額，還是保留前一間房屋的累積金額。
