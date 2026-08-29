---
id: two-pointer-trapping-rain-water
title: Trapping Rain Water Optimization
module: two-pointer
pattern_label: Two Pointers - Boundary Tracking
complexity_label: O(n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 能夠推導出為何只要較低側有最大高度保證，即可直接計算當前格子的積水量
  - 理解 O(1) 空間複雜度的雙指標解法相較於 Prefix Max 陣列的優勢
---
## Concept

Trapping Rain Water Optimization 透過 Two Pointers 技巧，旨在以 O(n) 的時間複雜度與 O(1) 的空間複雜度解決不規則高度柱子間的積水計算問題。傳統的 Prefix Max 解法需要額外建立兩個陣列來分別儲存每個位置左右兩側的最大高度，這會消耗 O(n) 的額外空間。而 Two Pointers 則透過動態維護左右邊界的歷史最大高度 (leftMax 與 rightMax)，在指標向內移動的過程中即時計算積水量，從而省去了額外的記憶體開銷。

## Thinking

在解決 Trapping Rain Water 問題時，直覺的想法是針對每一個柱子，找出其左側的最大高度與右側的最大高度，取兩者中的較小值減去當前柱子的高度即為該位置的積水量。然而，我們不需要預先計算出所有位置的左右最大高度。利用 Two Pointers 技巧，我們設置 left 與 right 雙指標分別指向陣列的頭尾，並維護 leftMax 與 rightMax。由於木桶效應，積水量由較短的那一側決定。如果 leftMax < rightMax，代表左側的上限較低，此時即使右側有更高或未知的柱子，當前左側位置的積水量已經完全由 leftMax 決定。因此，我們可以直接計算左側指標所在位置的積水，更新 leftMax，然後將 left 指標向右推進；反之則處理右側，確保演算法能以單迴圈 O(n) 完成。

## Pattern Recognition

當題目要求計算陣列中基於兩側極值邊界所產生的區間容量、容器盛水量，或是需要同時滿足高效時間與常數空間複雜度的區間掃描問題時，高度對應的 Pattern 即為 Two Pointers - Boundary Tracking。此模式的關鍵特徵在於：當前元素的計算結果受限於左右兩側的極值，且兩側極值的大小關係允許我們從外向內安全地單向收斂。

## Common Mistakes

常見的錯誤在於混淆了當前柱子的高度與歷史最大高度（leftMax / rightMax）的比較關係。有些實作會直接拿當前 left 指子與 right 指子所指向的柱子高度進行比較，而非比較它們各自累積的歷史最大高度，這會導致水量的計算邏輯失效。另一個常見錯誤是忽略了當前柱子高度大於歷史最大高度時，應該更新最大高度而不是計算負值的積水。

## Complexity

Time Complexity: O(n)，其中 n 為陣列長度。左右雙指標從兩端向中間掃描，每個元素最多被訪問一次。Space Complexity: O(1)，僅使用固定的幾個變數（left, right, leftMax, rightMax, totalWater）來維護狀態，不需要額外陣列。

## Digest

Trapping Rain Water Optimization 透過 Two Pointers 技巧，在 O(n) 時間與 O(1) 空間內解決雨水收集量計算。核心概念在於利用左右雙指標與歷史最大高度 (leftMax, rightMax) 動態決定較低一側的積水並向內推進。常見錯誤包括混淆當前高度與歷史最大高度。透過本單元，您將學會如何省去傳統 Prefix Max 陣列的額外空間開銷，掌握高效的邊界追蹤模式。

## TypeScript Tip

```typescript
// 在 TypeScript 中使用明確的型別定義與嚴謹的迴圈邊界
function trapOptimized(height: number[]): number {
  let l = 0, r = height.length - 1;
  let lMax = 0, rMax = 0;
  let ans = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lMax = Math.max(lMax, height[l]);
      ans += lMax - height[l];
      l++;
    } else {
      rMax = Math.max(rMax, height[r]);
      ans += rMax - height[r];
      r--;
    }
  }
  return ans;
}
const testVal = trapOptimized([4, 2, 0, 3, 2, 5]);
if (testVal !== 9) throw new Error("Test failed");
```

## Python Tip

```python
# 在 Python 中利用簡潔的賦值與條件判斷撰寫高效的雙指標邏輯
def trap_optimized(height: list[int]) -> int:
    if not height:
        return 0
    l, r = 0, len(height) - 1
    l_max, r_max = 0, 0
    ans = 0
    while l < r:
        if height[l] < height[r]:
            l_max = max(l_max, height[l])
            ans += l_max - height[l]
            l += 1
        else:
            r_max = max(r_max, height[r])
            ans += r_max - height[r]
            r -= 1
    return ans

assert trap_optimized([4, 2, 0, 3, 2, 5]) == 9, "Test failed"
```

## Takeaway

掌握 Two Pointers 配合歷史最大高度的動態維護技巧，能在 O(1) 空間內高效解決複雜的區間邊界計算問題。

## Tomorrow Preview

明天我們將探討 Container With Most Water 題目，學習如何運用類似的雙指標概念，在動態收斂過程中尋找面積最大化的容器組合。

## Today's Challenge

- **42** · 本題需要根據左右兩側的極值邊界來計算每個位置的積水量，透過 Two Pointers 技巧能夠在單一迴圈內同時完成左右最大值的追蹤與容量計算，完美符合 Boundary Tracking 的核心模式。
  - Hint: 維護 leftMax 與 rightMax 變數，每次選擇較低的那一側向內推進並計算當前格子的積水。
