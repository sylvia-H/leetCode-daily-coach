---
id: sliding-window-fixed-size
title: Fixed-Size Sliding Window
module: sliding-window
pattern_label: Fixed-Size Sliding Window
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - Can write the loop structure to initialize the first window of size k.
  - Can correctly slide the window across the rest of the array in O(n) time.
---
## Concept

Fixed-Size Sliding Window 是一種常見的陣列與字串處理技巧。其核心觀念在於維持一個長度固定為 k 的視窗，並在陣列上同步移動左、右邊界，以逐步計算子陣列或子字串的統計數據。相較於每次都重新計算整個視窗範圍的暴力解法，固定大小的滑動視窗利用前一次計算的結果，在移除視窗左端元素的同時加入視窗右端的新元素，將時間複雜度從 O(n * k) 顯著優化至 O(n)。

## Thinking

當我們需要處理固定長度 k 的子陣列問題時，思考的邏輯通常分為兩個階段：首先是初始化第一個視窗，計算從索引 0 到 k - 1 的元素總和或其他指標；接著是進入迴圈，讓視窗向右滑動。在每次滑動時，我們將新進入視窗右側的元素加入統計值中，並將離開視窗左側的舊元素從統計值中扣除。這樣的增量更新機制能夠確保每個元素只被存取常數次，從而達到線性時間複雜度。

## Pattern Recognition

辨識 Fixed-Size Sliding Window 的主要線索在於題目明確要求尋找「固定長度 k」的子陣列（Subarray）或子字串（Substring）。當問題牽涉到長度限制為定值的最大平均值、總和、計數或特定條件符合次數時，且資料結構為線性排列，便可高度懷疑應採用此 Pattern。

## Common Mistakes

最常見的錯誤發生在處理初始視窗邊界索引時的 off-by-one 誤差，例如將迴圈的起始點或終點設定錯誤，導致漏掉部分元素或引發陣列索引超出範圍的例外。此外，未能在進入迴圈前妥善處理陣列長度小於 k 的邊界條件，也是導致程式碼崩潰的主因之一。

## Complexity

時間複雜度為 O(n)，因為每個元素最多被進出視窗各一次；空間複雜度為 O(1)，只需要常數額外的變數來儲存當前視窗的總和或統計狀態。

## Digest

Fixed-Size Sliding Window 是處理固定長度子陣列與子字串問題的標準解法。本單元深入解析如何透過維護一個長度為 k 的視窗，在 O(n) 時間內完成資料的滑動與統計。透過初始化第一個視窗並利用增量更新（加入右端、扣除左端），我們能有效避免重複計算。文章涵蓋了模式辨識線索、常見的邊界條件錯誤防範，以及複雜度分析，幫助你在面對各類定長區間最佳化問題時游刃有餘。

## TypeScript Tip

```typescript
function countSubarrays(nums: number[], k: number, threshold: number): number {
    let currentSum = 0;
    let count = 0;
    for (let i = 0; i < k; i++) {
        currentSum += nums[i];
    }
    if (currentSum / k >= threshold) count++;
    for (let i = k; i < nums.length; i++) {
        currentSum += nums[i] - nums[i - k];
        if (currentSum / k >= threshold) count++;
    }
    return count;
}
const ans = countSubarrays([2, 2, 2, 2, 5, 5, 2, 8], 3, 4);
if (ans !== 3) throw new Error("assertion failed");
```

## Python Tip

```python
def count_subarrays(nums: list[int], k: int, threshold: int) -> int:
    current_sum = sum(nums[:k])
    count = 1 if current_sum / k >= threshold else 0
    for i in range(k, len(nums)):
        current_sum += nums[i] - nums[i - k]
        if current_sum / k >= threshold:
            count += 1
    return count

ans = count_subarrays([2, 2, 2, 2, 5, 5, 2, 8], 3, 4)
assert ans == 3, "assertion failed"
```

## TypeScript Corner

```typescript
function findMaxAverage(nums: number[], k: number): number {
    let currentSum = 0;
    for (let i = 0; i < k; i++) {
        currentSum += nums[i];
    }
    let maxSum = currentSum;
    for (let i = k; i < nums.length; i++) {
        currentSum += nums[i] - nums[i - k];
        if (currentSum > maxSum) {
            maxSum = currentSum;
        }
    }
    return maxSum / k;
}
const result = findMaxAverage([1, 12, -5, -6, 50, 3], 4);
if (Math.abs(result - 12.75) > 1e-5) throw new Error("assertion failed");
```

## Python Corner

```python
def find_max_average(nums: list[int], k: int) -> float:
    current_sum = sum(nums[:k])
    max_sum = current_sum
    for i in range(k, len(nums)):
        current_sum += nums[i] - nums[i - k]
        if current_sum > max_sum:
            max_sum = current_sum
    return max_sum / k

result = find_max_average([1, 12, -5, -6, 50, 3], 4)
assert abs(result - 12.75) < 1e-5, "assertion failed"
```

## Takeaway

掌握固定長度滑動視窗的初始化與增量更新邏輯，以 O(n) 時間解決定長子陣列問題。

## Tomorrow Preview

明天我們將探討 Dynamic-Size Sliding Window（動態大小滑動視窗），學習當視窗長度不再固定、需根據條件動態擴展與收縮時的處理策略。

## Today's Challenge

- **643** · 要求尋找長度為 k 的連續子陣列的最大平均值，完全符合 Fixed-Size Sliding Window 的定義。
  - Hint: 先計算前 k 個元素的總和作為初始視窗，然後逐一滑動並更新總和。
- **1343** · 需要計算長度為 k 且平均值大於或等於閾值的子陣列數量。
  - Hint: 可以透過比較視窗總和與閾值乘以 k 的大小，避免浮點數除法誤差。
- **2090** · 計算半徑為 k 的子陣列平均值，實質上就是長度為 2k + 1 的固定視窗問題。
  - Hint: 注意視窗總長度為 2k + 1，並妥善處理邊界中心無法形成完整半徑的元素。
