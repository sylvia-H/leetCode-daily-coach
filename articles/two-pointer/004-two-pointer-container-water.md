---
id: two-pointer-container-water
title: Container With Most Water
module: two-pointer
pattern_label: Two Pointers - Greedy Shrinking
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 理解為什麼總是移動高度較小的指標是正確的貪婪選擇
  - 能夠正確計算每次移動時的容量並更新最大值
---
## Concept

Container WithMost Water 是一道經典的貪婪策略與相向雙指標應用題。問題核心在於給定一組非負整數陣列代表座標高度，尋找兩條垂直線使得它們與x軸共同構成的容器能夠容納最多的水。由於容器的容量由兩端高度的最小值決定，且受到兩者之間的距離所限制，我們無法透過暴力檢索所有組合來達成高效解法，因此需要透過雙指標從兩側向內收斂，在線性時間內找出最佳解。

## Thinking

思考此問題的切入點在於觀察容器面積的計算方式：面積等於兩端指標距離乘以兩者之中較小的高度。因此，我們可以初始化兩個指標，一個指向陣列最左端 left=0，另一個指向最右端 right=n-1。在每一次迴圈中，計算當前指標所夾出的容器面積，並將其與全域最大面積進行比較與更新。接著，我們必須決定哪一個指標應該移動：由於面積受限於較短的那一端，若移動較高的指標，其高度不可能增加，且寬度必定縮減，因此絕對無法得到更大的面積。相反地，唯有移動較短的指標，才有機會在下一輪遇到更高的新板子，從而彌補寬度縮小的損失。這就是貪婪策略的核心邏輯。

## Pattern Recognition

當題目要求在陣列或序列中尋找符合特定條件的兩端邊界、配對、區間最大值，且該條件具有單調性或可透過局部最佳解推導全域最佳解的特徵時，通常適用 Two Pointers - Greedy Shrinking 模式。此題的關鍵辨識線索在於需要找出由兩條邊界組成的最大區域或容器容量，且每次移動的方向可以透過大小比較明確決定。

## Common Mistakes

初學者最常見的錯誤是誤以為移動較高的指標有機會得到更大面積，或者在迴圈中同時移動左右兩個指標。另一種常見錯誤則是搞錯寬度的計算方式，誤用固定常數或是未將索引差值正確對應到幾何距離。此外，指標交錯的條件控制不當也容易造成無窮迴圈或越界存取。

## Complexity

時間複雜度為 O(n)，因為左右指標從兩端出發向中間移動，整個陣列僅被掃描一次；空間複雜度為 O(1)，僅需常數級別的變數來儲存指標與最大面積。

## Digest

Container With Most Water 是一道經典的貪婪策略與相向雙指標應用題。容量由寬度乘以兩者較小高度決定，核心策略是每次必定移動較短的那端以尋求更高板子的可能。時間複雜度為 O(n)，空間複雜度為 O(1)。實作時需注意迴圈終止條件與指標更新邏輯。

## TypeScript Tip

```typescript
function maxAreaTip(height: number[]): number {
  let left = 0, right = height.length - 1, maxVal = 0;
  while (left < right) {
    maxVal = Math.max(maxVal, (right - left) * Math.min(height[left], height[right]));
    height[left] < height[right] ? left++ : right--;
  }
  if (maxVal !== 49) throw new Error("assertion failed");
  return maxVal;
}
maxAreaTip([1, 8, 6, 2, 5, 4, 8, 3, 7]);
```

## Python Tip

```python
def max_area_tip(height: list[int]) -> int:
    left, right, max_val = 0, len(height) - 1, 0
    while left < right:
        max_val = max(max_val, (right - left) * min(height[left], height[right]))
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    assert max_val == 49, "assertion failed"
    return max_val

max_area_tip([1, 8, 6, 2, 5, 4, 8, 3, 7])
```

## TypeScript Corner

```typescript
function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let maxWater = 0;
  while (left < right) {
    const currentWidth = right - left;
    const currentHeight = Math.min(height[left], height[right]);
    const currentArea = currentWidth * currentHeight;
    if (currentArea > maxWater) {
      maxWater = currentArea;
    }
    if (height[left] < height[right]) {
      left++;
    } else {
      right--;
    }
  }
  if (maxWater !== 49) throw new Error("assertion failed");
  return maxWater;
}
maxArea([1, 8, 6, 2, 5, 4, 8, 3, 7]);
```

## Python Corner

```python
def max_area(height: list[int]) -> int:
    left = 0
    right = len(height) - 1
    max_water = 0
    while left < right:
        current_width = right - left
        current_height = min(height[left], height[right])
        current_area = current_width * current_height
        if current_area > max_water:
            max_water = current_area
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    assert max_water == 49, "assertion failed"
    return max_water

max_area([1, 8, 6, 2, 5, 4, 8, 3, 7])
```

## Takeaway

相向雙指標搭配貪婪策略，每次移動高度較小的指標，能以 O(n) 時間高效求解容器最大面積。

## Tomorrow Preview

明天我們將探討三數之和（3Sum）問題，學習如何將雙指標技巧應用於排序後的陣列中，以處理多重指標與去除重複解的複雜情境。

## Today's Challenge

- **11** · 本題即為 Container With Most Water 的標準題目，完美體現雙指標夾擊與貪婪收縮的核心策略。
  - Hint: 設置左右指標於兩端，每次計算當前面積後移動高度較小的指標。
- **344** · 利用左右雙指標向內收斂的對稱操作來反轉字元陣列，是掌握相向雙指標基礎的好題。
  - Hint: 交換左右指標所指向的元素，然後讓左指標遞增、右指標遞減直至相遇。
