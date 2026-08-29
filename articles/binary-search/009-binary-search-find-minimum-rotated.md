---
id: binary-search-find-minimum-rotated
title: Find Minimum in Rotated Sorted Array
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能比較 mid 元素與最右端元素，以決定搜尋方向。
---
## Concept

在經過旋轉的排序陣列（Rotated Sorted Array）中尋找最小值，是經典的 Binary Search 變體應用。原本嚴格遞增的陣列在某個未知樞紐點（Pivot）進行了循環位移，導致陣列被分割為兩個各自遞增的區段。核心思維在於利用二分搜尋的特性，透過將中間元素 nums[mid] 與右側邊界元素 nums[right] 進行比較，判斷最小值究竟落於左半部或右半部，進而將搜尋範圍每次減半，達成 O(log n) 的高效時間複雜度。

## Thinking

面對這類在旋轉陣列中尋找特定屬性的問題，傳統的 Binary Search 尋找精確 Target 值邏輯不再適用，因為我們無法單純依據 nums[mid] 與 Target 的大小關係來決定移動 left 或 right。此處的思考轉折在於：我們需要將 nums[mid] 與右側邊界 nums[right] 做比較來評估區間的特性。如果 nums[mid] > nums[right]，代表最小值必定落在 mid 的右側（因為右半部發生了「斷崖式」的數值下降，最小值隱藏其中）；反之，如果 nums[mid] <= nums[right]，則代表右半部是正常遞增的，最小值必然落在 mid 的左側或就是 mid 本身。因此，右側邊界成為了我們決定搜尋方向的關鍵參考點。

## Pattern Recognition

當題目要求在一個原本排序但經過旋轉的陣列中，尋找如最小值、旋轉點、或特定條件下的分界點時，應立即聯想到 Binary Search Pattern。辨識線索包含：陣列局部有序但整體包含旋轉、時間複雜度要求嚴格小於 O(n)（通常為 O(log n)），且每次操作必須能捨棄一半的無效搜尋區間。此時不與 Target 比較，而是改與邊界元素（通常是 right）比較，是此 Pattern 的核心標誌。

## Common Mistakes

最常見的錯誤是將 nums[mid] 與左側邊界 nums[left] 進行比較。在旋轉陣列中，與 left 比較往往會引入過多複雜的邊界條件判斷，導致邏輯漏洞百出。另一個常見失誤是在處理指針收縮時，誤將 right 設為 mid - 1。當 nums[mid] < nums[right] 時，mid 本身極有可能就是我們要找的最小值，若將 right 設為 mid - 1，會直接將最小值排除在搜尋範圍外，導致答案錯誤。正確的做法是讓 right = mid，保留 mid 參與後續的搜尋。

## Complexity

Time Complexity: O(log n)，因為每一次迭代或遞迴都將搜尋空間減半。Space Complexity: O(1)，僅使用常數級別的指針變數，不需額外配置線性記憶體。

## Digest

尋找旋轉排序陣列的最小值是 Binary Search 的進階應用。核心在於捨棄與 Target 的比較，改為比對 nums[mid] 與 nums[right]。當 nums[mid] > nums[right] 時，代表最小值在右半部，令 left = mid + 1；當 nums[mid] <= nums[right] 時，代表最小值在左半部或就是 mid 本身，令 right = mid。迴圈終止條件為 left === right，此時指針即指向最小值。此方法時間複雜度 O(log n)，空間複雜度 O(1)。實作時務必注意指針收縮的邊界處理，避免遺漏正確答案。

## TypeScript Tip

```typescript
function findMinSafe(nums: number[]): number {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return nums[left];
}
const val = findMinSafe([4, 5, 6, 7, 0, 1, 2]);
if (val !== 0) throw new Error("TypeScript tip assertion failed");
```

## Python Tip

```python
def find_min_safe(nums: list[int]) -> int:
    left, right = 0, len(nums) - 1
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] > nums[right]:
            left = mid + 1
        else:
            right = mid
    return nums[left]

val = find_min_safe([4, 5, 6, 7, 0, 1, 2])
assert val == 0, "Python tip assertion failed"
```

## Takeaway

掌握 Binary Search 應用於旋轉陣列的關鍵在於『比較 mid 與 right』而非 Target，並且在 nums[mid] <= nums[right] 時必須保留 mid（即 right = mid），才能正確定位最小值。

## Tomorrow Preview

明天我們將探討如何在此基礎上延伸，處理包含重複元素的旋轉排序陣列尋找問題。當陣列中允許重複數字出現時，nums[mid] 與 nums[right] 相等的情況將破壞原本的單調性判定，我們必須引入額外的處理邏輯來確保最差時間複雜度的控制。

## Today's Challenge

- **153** · 題號 153 要求在無重複元素的旋轉排序陣列中尋找最小值，完全符合本篇教學之 Binary Search 核心 Pattern，透過比較 mid 與 right 元素即可在 O(log n) 時間內找出旋轉點。
  - Hint: 注意當 nums[mid] 小於或等於 nums[right] 時，right 應該直接等於 mid，而不是 mid - 1。
