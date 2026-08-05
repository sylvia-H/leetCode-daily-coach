---
id: binary-search-rotated-array
title: Binary Search in Rotated Sorted Array
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 25
exit_criteria:
  - 'Determine sorted half using nums[left] <= nums[mid].'
  - Check if target falls within the sorted half range.
---
## Concept

Binary Search in Rotated Sorted Array 是針對一個原本經過排序但隨後在未知樞紐點進行旋轉的陣列進行高效搜尋的演算法。其核心原理在於：當我們將一個排序陣列進行旋轉後，如果從中間（mid）切開，陣列的左右兩半中，必定至少有一半是保持嚴格遞增的完全排序狀態。這項特性讓我們能夠繼續利用標準 Binary Search 的對半分割精神，在 $O(\log n)$ 的時間複雜度內定位目標值。

## Thinking

在處理這類旋轉排序陣列時，思維模式必須從『尋找全域中點』轉變成『識別哪一個半部是正規排序的』。首先，初始化左右指針 `left` 與 `right`。在每一次迴圈中計算出中點 `mid`。接著檢查 `nums[left] <= nums[mid]` 來判斷左半部是否有序。若成立，代表左半部是正常的遞增區間，此時再檢查目標值 `target` 是否落在此區間的範圍內（即 `nums[left] <= target && target < nums[mid]`）。如果在，則將 `right` 移動到 `mid - 1` 以縮小至左半部搜尋；否則捨棄左半部，將 `left` 移動到 `mid + 1`。反之，若左半部無序，則代表右半部必定有序，採用相同的邏輯判斷目標值是否落在右半部的範圍內，進而調整指針。重複此過程直到找到目標值或指針交錯。

## Pattern Recognition

當題目給定一個原本排序好但經過旋轉的陣列，且要求在 $O(\log n)$ 的時間複雜度內尋找特定元素、最小值或特定條件時，即可立即辨識出此 Pattern。其外在特徵包含：陣列局部有序、存在未知旋轉點、且暗示著需要修改傳統 Binary Search 的條件判斷式。若題目提及不能使用線性搜尋，或者暗示時間複雜度必須優於 $O(n)$，通常就是此類 Binary Search 變形題的強烈訊號。

## Common Mistakes

最常見的錯誤在於邊界條件的處理失誤。開發者在判斷目標值是否落於有序半部時，經常忽略等號的處理，導致當 `target` 剛好等於邊界值時程式碼進入錯誤的分支。另一個常見錯誤是混淆了嚴格不等式（`<` 與 `<=`），在處理重複元素或邊界交界時引發無限迴圈或索引超界例外。此外，當陣列包含重複元素時，若未妥善處理 `nums[left] === nums[mid] && nums[mid] === nums[right]` 的情況，會導致無法正確辨識有序半部，進而退化為 $O(n)$ 的線性掃描。

## Complexity

Time Complexity: O(log n)。因為每次迴圈都會將搜尋範圍減半，與標準 Binary Search 相同。Space Complexity: O(1)。僅使用常數級別的指針變數，不需要額外的儲存空間。

## Digest

Binary Search in Rotated Sorted Array 是 Binary Search 的進階應用。核心精神在於：旋轉後的陣列從中點切開，必定有一半是完全排序的。透過比較 `nums[left]` 與 `nums[mid]` 可以精準識別出哪一半維持正規排序，接著判斷 target 是否落在此排序區間內，藉此決定指針的移動方向。在實作時，必須特別注意等號的包含範圍與邊界條件，以防範無限迴圈或漏掉邊界值。

## TypeScript Tip

```typescript
function findMin(nums: number[]): number {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return nums[left];
}
const minVal = findMin([3, 4, 5, 1, 2]);
if (minVal !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
def find_min(nums: list[int]) -> int:
    left, right = 0, len(nums) - 1
    while left < right:
        mid = (left + right) // 2
        if nums[mid] > nums[right]:
            left = mid + 1
        else:
            right = mid
    return nums[left]

min_val = find_min([3, 4, 5, 1, 2])
assert min_val == 1, "assertion failed"
```

## TypeScript Corner

```typescript
function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }
  return -1;
}
const result = search([4, 5, 6, 7, 0, 1, 2], 0);
if (result !== 4) throw new Error("assertion failed");
```

## Python Corner

```python
def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1

result = search([4, 5, 6, 7, 0, 1, 2], 0)
assert result == 4, "assertion failed"
```

## Takeaway

掌握旋轉陣列的二分搜尋關鍵在於『先辨識有序半部，再檢查範圍』，嚴格維護邊界條件即可達成 O(log n) 高效解法。

## Tomorrow Preview

明天我們將探討尋找旋轉排序陣列中最小值的變形應用，學習如何在包含重複元素的陣列中處理邊界退化問題。

## Today's Challenge

- **33** · 此題為標準的旋轉排序陣列搜尋問題，完全符合透過辨識有序半部來套用 Binary Search 的核心 Pattern。
  - Hint: 先確認左半部或右半部何者有序，再檢查 target 是否落在該有序區間內。
- **153** · 此題為旋轉排序陣列的最小值尋找變形題，透過比較 mid 與 right 元素可以有效收斂搜尋範圍並找出旋轉樞紐點。
  - Hint: 當 nums[mid] > nums[right] 時，最小值必定在右半部，否則在左半部包含 mid。
