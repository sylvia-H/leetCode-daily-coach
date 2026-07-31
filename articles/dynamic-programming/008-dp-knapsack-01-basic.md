---
id: dp-knapsack-01-basic
title: 0/1 Knapsack Basic Pattern
module: dynamic-programming
pattern_label: 0/1 Knapsack
complexity_label: O(N*W) / O(W)
estimated_minutes: 25
exit_criteria:
  - 能夠理解每個物品只能選一次的限制下的狀態轉移
  - 能夠解釋為什麼一維空間優化時容量迴圈必須由大到小反向進行
---
## Concept

0/1 Knapsack Basic Pattern 是動態規劃中最經典的基礎模型之一。在此模型中，我們面對一組具有特定重量與價值的物品，以及一個有容量上限的背包。每個物品只有兩種選擇：『放入背包』或是『不放入背包』，且每種物品僅能使用一次，這正是 0/1 名稱的由來。透過建構二維或一維的狀態陣列，我們能夠系統化地求解在不超過容量限制的前提下所能獲得的最大價值，或是判斷是否能剛好填滿特定容量。

## Thinking

在思考 0/1 Knapsack 狀態轉移時，我們通常定義 dp[w] 代表容量為 w 的背包所能裝載的最大價值。對於第 i 個物品，其重量為 weight[i]，價值為 value[i]，當我們考慮是否將它放入容量為 w 的背包時，狀態轉移方程式為 dp[w] = max(dp[w], dp[w - weight[i]] + value[i])。這個方程式的核心邏輯在於：如果不選第 i 個物品，最大價值維持為 dp[w]；如果選擇放入第 i 個物品，則背包必須預留出 weight[i] 的空間，總價值等於剩餘容量 w - weight[i] 的最大價值加上當前物品的價值 value[i]。透過不斷更新這個最佳解，最終即可求得目標容量下的解答。

## Pattern Recognition

當題目具備以下特徵時，即可高機率辨識出 0/1 Knapsack Pattern：第一，給定一組物品，每個物品有固定的代價（重量）與效益（價值）；第二，存在一個硬性的資源上限（總容量）；第三，每個物品只能選擇採用一次，無法重複選取。常見的變體包含判斷能否剛好組成特定總和，或是求取資源限制下的最大獲益。當看到尋找子集總和或資源分配最佳化的問題敘述時，應立即聯想到此 Pattern。

## Common Mistakes

最常見的錯誤發生在進行一維空間優化時，將背包容量的迴圈寫成正向遞增（由左至右）。由於 0/1 Knapsack 要求每個物品只能使用一次，如果容量迴圈由左至右更新，當前狀態會用到已經被當前物品更新過的小容量狀態（相當於同一個物品被使用了多次），這會將 0/1 背包誤變成完全背包。正確的做法是容量迴圈必須由右至左（由大到小）進行反向更新，確保在更新 dp[w] 時，用到的 dp[w - weight[i]] 仍然是上一輪尚未納入當前物品時的舊資料。

## Complexity

O(N * W) / O(W)

## Digest

0/1 Knapsack Basic Pattern 是動態規劃的基石。每個物品只有放入與不放入兩種選擇，且限制使用一次。核心狀態轉移方程式為 dp[w] = max(dp[w], dp[w - weight[i]] + value[i])。在空間優化上，一維陣列的容量迴圈必須採取由右至左的逆向更新，以防止同一個物品被重複計算。掌握此 pattern 不僅能解決經典背包問題，更能延伸至子集分割、目標和等各類組合優化題型。

## TypeScript Tip

```typescript
function canPartitionSubset(nums: number[]): boolean {
  const sum = nums.reduce((acc, val) => acc + val, 0);
  if (sum % 2 !== 0) return false;
  const target = sum / 2;
  const dp = new Array(target + 1).fill(false);
  dp[0] = true;
  for (const num of nums) {
    for (let i = target; i >= num; i--) {
      dp[i] = dp[i] || dp[i - num];
    }
  }
  return dp[target];
}
const result = canPartitionSubset([1, 5, 11, 5]);
if (!result) throw new Error("assertion failed: should be partitionable");
```

## Python Tip

```python
def find_target_sum_ways(nums: list[int], target: int) -> int:
    total_sum = sum(nums)
    if (total_sum < abs(target) or (total_sum + target) % 2 != 0):
        return 0
    subset_sum = (total_sum + target) // 2
    dp = [0] * (subset_sum + 1)
    dp[0] = 1
    for num in nums:
        for i in range(subset_sum, num - 1, -1):
            dp[i] += dp[i - num]
    return dp[subset_sum]

ways = find_target_sum_ways([1, 1, 1, 1, 1], 3)
assert ways == 5, "assertion failed: expected 5 ways"
```

## TypeScript Corner

```typescript
function knapsack01(weights: number[], values: number[], capacity: number): number {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    const v = values[i];
    for (let currentCapacity = capacity; currentCapacity >= w; currentCapacity--) {
      dp[currentCapacity] = Math.max(dp[currentCapacity], dp[currentCapacity - w] + v);
    }
  }
  return dp[capacity];
}
const maxVal = knapsack01([1, 3, 4, 5], [1, 4, 5, 7], 7);
if (maxVal !== 9) throw new Error("assertion failed: expected maximum value 9");
```

## Python Corner

```python
def knapsack_01(weights: list[int], values: list[int], capacity: int) -> int:
    dp = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        for current_capacity in range(capacity, w - 1, -1):
            dp[current_capacity] = max(dp[current_capacity], dp[current_capacity - w] + v)
    return dp[capacity]

max_val = knapsack_01([1, 3, 4, 5], [1, 4, 5, 7], 7)
assert max_val == 9, "assertion failed: expected maximum value 9"
```

## Takeaway

0/1 Knapsack 核心在於『選或不選』與『逆向迴圈』，確保物品不重複使用，並透過空間優化將維度降至一維。

## Tomorrow Preview

明天我們將進一步探討 0/1 Knapsack 的進階變體：Bounded Knapsack 與 Unbounded Knapsack（完全背包問題），學習當物品數量無限或是有限制時的狀態轉移優化技巧。

## Today's Challenge

- **416** · 本題要求判斷是否能將陣列分割成兩個子集且元素和相等，這等同於尋找是否存在一個子集的元素和剛好等於總和的一半，完全對應 0/1 Knapsack 的容量填滿模型。
  - Hint: 先計算所有元素的總和，若總和為奇數則直接回傳 false。若為偶數，則將目標和設為總和的一半，轉化為容量等於該目標值的 0/1 背包問題。
- **494** · 本題要求透過賦予正負號來達成特定目標和，數學上可推導為將陣列劃分為兩個子集 P 與 N，使得 P 的總和減去 N 的總和等於目標值，進而轉換為尋找特定子集總和的 0/1 背包變體問題。
  - Hint: 利用數學代換將問題轉化為：尋找子集和等於 (sum + target) / 2 的組合數問題，再套用 0/1 Knapsack 的累加狀態轉移。
