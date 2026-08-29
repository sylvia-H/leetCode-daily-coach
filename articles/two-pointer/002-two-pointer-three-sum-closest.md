---
id: two-pointer-three-sum-closest
title: Three Sum Closest Search
module: two-pointer
pattern_label: Two Pointers - Closest Tracking
complexity_label: O(n^2) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠在每次指標移動時精確計算與目標值的差值絕對值
  - 掌握如何根據當前總和與 target 的大小關係決定該移動 left 還是 right
---
## Concept

Three Sum Closest Search 是一種延伸自 Two Pointers 的搜尋策略。當問題不要求尋找完全相等的精確解，而是尋找與給定目標值（target）差距最小的總和時，此概念便能發揮功效。我們透過固定一個基準元素，並利用左右雙指標在剩餘的排序陣列中動態收斂，同時在過程中維護並更新全域的最接近狀態。

## Thinking

外層迴圈先將陣列排序，並固定一個基準數。內層則設立 left 與 right 指標分別指向基準數右側的開頭與結尾。在每次計算三數總和時，將其與 target 進行比較。若總和小於 target，代表需要更大的數，因此將 left 遞增；若總和大於 target，代表需要更小的數，因此將 right 遞減；若總和剛好等於 target，則代表找到完美解，可直接返回該總和。在整個走訪過程中，必須動態記錄並更新當前總和與 target 的最小絕對差值及其對應的總和。

## Pattern Recognition

當題目要求尋找『最接近某個數的總和』、『差值最小的組合』，且資料結構經過排序或可被排序時，即為 Two Pointers - Closest Tracking Pattern 的典型特徵。核心邏輯在於利用排序性質配合雙指標的單調性，避免暴力搜尋的 O(n^3) 時間複雜度。

## Common Mistakes

最常見的錯誤在於沒有在每次計算出總和時，同步更新全域的最接近變數。另一個常見失誤是忽略了當總和與 target 差距相等時的處理，或者在指標移動條件上邏輯錯亂，導致進入無限迴圈。此外，未將陣列先行排序就直接套用雙指標也是致命傷。

## Complexity

時間複雜度為 O(n^2)，其中外層迴圈需要 O(n) 次迭代，內層的雙指標搜尋在排序後需要 O(n) 時間；空間複雜度為 O(1) 或 O(n) 視排序演算法所需的堆疊空間而定。

## Digest

Three Sum Closest Search 是一種基於 Two Pointers 的策略，專門用來尋找最接近目標值的總和。透過陣列排序與雙指標的單調性，我們能在 O(n^2) 時間內走訪所有可能組合。在每次迭代中，動態計算當前總和與 target 的絕對差值，並與全域記錄的最小差值比較。若總和小則移動左指標，若大則移動右指標。此技巧的關鍵在於正確維護全域最接近變數，並妥善處理等於目標值的提早返回條件。

## TypeScript Tip

```typescript
function threeSumClosest(nums: number[], target: number): number {
  nums.sort((a, b) => a - b);
  let closest = nums[0] + nums[1] + nums[2];
  for (let i = 0; i < nums.length - 2; i++) {
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (Math.abs(s - target) < Math.abs(closest - target)) closest = s;
      if (s < target) l++;
      else if (s > target) r--;
      else return s;
    }
  }
  return closest;
}
if (threeSumClosest([0,0,0], 1) !== 0) throw new Error("Failed");
```

## Python Tip

```python
def threeSumClosest(nums: list[int], target: int) -> int:
    nums.sort()
    closest = nums[0] + nums[1] + nums[2]
    for i in range(len(nums) - 2):
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if abs(s - target) < abs(closest - target):
                closest = s
            if s < target:
                l += 1
            elif s > target:
                r -= 1
            else:
                return s
    return closest

assert threeSumClosest([0,0,0], 1) == 0
```

## Takeaway

掌握 Three Sum Closest Search 的關鍵在於排序、雙指標收斂，以及在迴圈中即時更新全域的最接近狀態與差值絕對值。

## Tomorrow Preview

明天我們將探討 Four Sum 問題，進一步擴展雙指標搜尋的維度，學習如何處理更高階的巢狀迴圈與剪枝優化技巧。

## Today's Challenge

- **16** · 本題要求找出最接近目標值的三個數字之和，完全符合 Two Pointers - Closest Tracking 的核心應用場景。
  - Hint: 先對陣列排序，固定一個數後用左右指標夾擠，並在每次計算總和時更新全域最接近的差值。
