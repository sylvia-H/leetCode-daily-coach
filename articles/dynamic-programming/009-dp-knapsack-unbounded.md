---
id: dp-knapsack-unbounded
title: Unbounded Knapsack Pattern
module: dynamic-programming
pattern_label: Unbounded Knapsack
complexity_label: O(N*W) / O(W)
estimated_minutes: 20
exit_criteria:
  - 能夠辨識物品可重複使用的背包情境
  - 能夠說明為什麼完全背包的一維空間優化需要正向迴圈
---
## Concept

Unbounded Knapsack Pattern 是動態規劃中處理物品可以被無限次選取的一類經典問題。與 0/1 背包問題最大的不同在於，當我們決策要放入某個物品時，該物品在後續的狀態中仍然可以被選擇，這使得狀態轉移方程在容量的更新方向上有所轉變。掌握此 Pattern 的關鍵在於理解一維陣列優化時為何必須採用正向迴圈，因為這允許較小的容量狀態在同一次疊代中被更新後，直接影響並回饋給較大的容量狀態。

## Thinking

在思考 Unbounded Knapsack 類型的題目時，我們首先需要確立問題的狀態定義。通常我們定義 dp[w] 為湊成容量或金額 w 時的最佳解，例如最少需要的物品數量或總組合數。接著進行狀態轉移：對於每一個物品，我們考慮是否將其納入背包。若考慮求最少硬幣數，轉移方程為 dp[w] = min(dp[w], dp[w - coin] + 1)；若考慮求組合總數，則是累加狀態 dp[w] += dp[w - coin]。透過這種方式，我們將大問題拆解為依賴較小容量的最佳子問題。

## Pattern Recognition

當題目具備以下特徵時，即可高度懷疑適用 Unbounded Knapsack Pattern：第一，給定一組物品或硬幣，且每種物品或硬幣的數量是無限的；第二，目標是求出湊成特定總量（如金額、重量）的最少／最多元素數量，或是求出湊成該總量的所有組合總數。經典代表如 Coin Change 與 Coin Change II，明確指出硬幣數量無限且可重複使用。

## Common Mistakes

最常見的錯誤是將 0/1 背包的反向迴圈（由右至左）誤用於 Unbounded Knapsack 問題。在 0/1 背包中，反向迴圈是為了確保每個物品只能被使用一次；但在 Unbounded Knapsack 中，若使用反向迴圈會導致較大容量的狀態無法重複利用當前物品的更新結果，從而遺漏物品被多次選取的可能性。另一個常見錯誤是未正確初始化邊界條件，例如求最小值時未將不可達的狀態設為無限大，導致最小值計算出錯。

## Complexity

O(N*W) / O(W)

## Digest

Unbounded Knapsack Pattern 解決了物品可無限次選取的最佳化與計數問題。核心在於狀態轉移時利用已經包含當前物品的較小容量狀態。實作時，容量迴圈必須由左至右正向走訪，以確保同一個物品能被重複選取。與 0/1 背包的反向迴圈形成鮮明對比。

## TypeScript Tip

```typescript
import assert from "node:assert";

function solve(): number {
  const dp: number[] = [0, Infinity, Infinity];
  const coin = 1;
  for (let w = coin; w < dp.length; w++) {
    dp[w] = Math.min(dp[w], dp[w - coin] + 1);
  }
  assert.strictEqual(dp[2], 2);
  return dp[2];
}

solve();
```

## Python Tip

```python
def solve() -> int:
    dp = [1, 0, 0]
    coin = 1
    for w in range(coin, len(dp)):
        dp[w] += dp[w - coin]
    assert dp[2] == 1
    return dp[2]

solve()
```

## Takeaway

完全背包靠正向迴圈，物品重複選取不求難。

## Tomorrow Preview

明天我們將探討完全背包的進階變體與多重背包問題，學習當物品數量有限制時，如何透過二進位拆分與單調佇列進行複雜度優化。

## Today's Challenge

- **322** · 硬幣數量無限且要求湊成目標金額的最少硬幣數，完全符合 Unbounded Knapsack 的定義與轉移結構。
  - Hint: 初始化 dp 陣列為 Infinity，並確保容量迴圈由左至右正向執行。
- **518** · 硬幣數量無限且要求計算湊成目標金額的組合總數，是經典的完全背包計數問題。
  - Hint: 外層走訪硬幣、內層由左至右更新金額，累加所有可能的組合數。
