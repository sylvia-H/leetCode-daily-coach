---
id: binary-search-rotated-array
title: Binary Search in Rotated Sorted Array
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 25
exit_criteria:
  - '能用 nums[left] <= nums[mid] 判斷哪一半已排序。'
  - 能檢查 target 是否落在已排序那一半的範圍內。
---
## Concept

旋轉排序陣列：把遞增排序的陣列在未知位置切一刀、前後段對調，例如 `[0,1,2,4,5,6,7]` 變成 `[4,5,6,7,0,1,2]`。全域單調性被破壞了——第一課「一次比較代言整個半邊」的推論不能直接套用。但注意：旋轉只切了一刀。從任何 mid 把區間切成 `[left..mid]` 與 `[mid..right]` 兩半，那一刀至多落在其中一半，另一半必定完整落在原本的遞增段裡、維持有序。這就是本課的支點：**每一輪至少有一半是有序的**，而有序半的值域有明確的兩端——最小值在左端、最大值在右端，端點比較就能回答「target 可不可能在這一半」，砍半的能力因此找回來。判半的工具是 `nums[left] <= nums[mid]`：若旋轉點落在左半內部，left 屬於前段（值大的那段）、mid 屬於後段，在**元素互異**的前提下前段每個值都嚴格大於後段每個值，必有 `nums[left] > nums[mid]`；逆否過來，`nums[left] <= nums[mid]` 成立就保證旋轉點不在左半、左半有序。

## Thinking

慣例整套沿用第一課：閉區間 `[left, right]`、`while (left <= right)`、更新一律 mid ± 1，不變式仍是「target 若存在，必在區間內」。每輪三步：一、`nums[mid]` 命中就回傳。二、判半：`nums[left] <= nums[mid]` 則左半有序，否則右半有序。等號不能省——區間縮到剩兩格時 mid 就是 left，靠等號才把單元素半邊正確視為有序。三、值域檢查：左半有序時，問 `nums[left] <= target && target < nums[mid]`；上界取嚴格小於，因為 mid 這一格剛比過、確定不是 target。成立就 `right = mid - 1` 收進左半；不成立就 `left = mid + 1` 丟掉左半。右半有序時鏡像處理：`nums[mid] < target && target <= nums[right]` 決定去留。這樣丟半為何安全？有序半的值全部落在兩端點之間，且另一半的值不是大於有序半上界、就是小於其下界（另一半是「接在 mid 之後的更大值＋開頭的低段」），兩半值域互不重疊——所以「在有序半值域內」與「只可能在另一半」是嚴格的二選一，每輪丟掉的半邊都被證明不含 target。區間每輪至少縮一格，必然終止；空了即可斷言不存在。

## Pattern Recognition

訊號：題目說「排序陣列在未知樞紐點旋轉」，又要求 O(log n)。找特定值、找最小值（也就是找旋轉點本身）都是同一族——後者不再與 target 比，改比 `nums[mid]` 與 `nums[right]`，鎖定無序的那一半。反向提醒：整套判半推論建立在**元素互異**上；題面若多說一句「可能包含重複元素」，`nums[left] <= nums[mid]` 的推論會出現破口，那是明天的主題。

## Common Mistakes

一、判半漏等號：寫成 `nums[left] < nums[mid]`，區間剩兩格時 mid 與 left 重合、條件恆假，誤入「右半有序」分支——`[3,1]` 找 1：mid = 0，被當成右半 `[3,1]` 有序，檢查 `3 < 1` 不成立而丟掉右半，錯回 -1。二、值域檢查漏下界等號：寫 `nums[left] < target`，target 恰等於 `nums[left]` 時被誤判不在左半——`[4,5,6,7,0,1,2]` 找 4 會一路往右、錯回 -1。三、不先判半就做端點值域檢查：無序半的值域斷在旋轉點、不連續，最大值在中間而非端點，端點夾不住其中的值，據此丟棄會把答案一起丟掉。四、對未排序陣列的教訓在此重演：判錯半不會當機，只會安靜回傳找不到，測試必須涵蓋旋轉點在頭、在尾與未旋轉的陣列。

## Complexity

判半比一次、值域檢查比兩次，都是 O(1) 的端點比較；每輪要嘛命中、要嘛把含 mid 的那一半整個丟掉，區間近乎減半，輪數約 log2(n)，時間 O(log n)。只用 left、right、mid 三個變數，空間 O(1)。

## Digest

拿 `[4,5,6,7,0,1,2]` 找 0：第一輪 mid = 3、`nums[3]` = 7，`4 <= 7` 判左半有序，0 不在 [4, 7) → `left = 4`。第二輪 mid = 5、`nums[5]` = 1，`nums[4]` = 0 且 `0 <= 1` 判左半有序，0 在 [0, 1) → `right = 4`。第三輪 mid = 4 命中。公式：閉區間、`left <= right`、mid ± 1 全套沿用，只是「跟 target 比大小」換成三步——命中即回；`nums[left] <= nums[mid]` 認出有序半；用有序半值域決定收哪半。支點是旋轉只切一刀：任何 mid 切開必有一半有序，兩半值域互不重疊，端點比較就能安全丟掉一半。

## TypeScript Tip

```typescript
import assert from "node:assert";

function search(nums: number[], target: number): number {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left]! <= nums[mid]!) {
      if (nums[left]! <= target && target < nums[mid]!) right = mid - 1;
      else left = mid + 1;
    } else if (nums[mid]! < target && target <= nums[right]!) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}

const a = [4, 5, 6, 7, 0, 1, 2];
assert(search(a, 0) === 4);
assert(search(a, 4) === 0); // 左界
assert(search(a, 3) === -1); // 不存在
assert(search([3, 1], 1) === 1); // mid 即 left
assert(search([1, 2, 3], 3) === 2); // 未旋轉
```

## Python Tip

鏈式比較讓值域檢查最貼近數學寫法。

```python
def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        if nums[left] <= nums[mid]:  # 左半有序
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        elif nums[mid] < target <= nums[right]:  # 右半有序
            left = mid + 1
        else:
            right = mid - 1
    return -1

assert search([5, 1, 2, 3, 4], 5) == 0   # 旋轉點緊貼開頭
assert search([2, 3, 4, 5, 1], 1) == 4   # 最小值在尾端
assert search([2, 3, 4, 5, 1], 2) == 0   # target 是左界
assert search([1], 1) == 0               # 單元素
assert search([5, 1, 2, 3, 4], 6) == -1  # 不存在
```

## Takeaway

旋轉只切一刀：任 mid 切開必有一半有序。先用 nums[left] <= nums[mid] 認出有序半，再用它的值域決定丟哪一半。

## Tomorrow Preview

明天把「元素互異」這個前提拿掉：重複值會讓 `nums[left] == nums[mid]` 時判不出哪一半有序。看這個破口如何把最壞情況拖成 O(n)，以及如何收縮邊界自保。

## Today's Challenge

- **33** · 旋轉排序陣列找目標值的原題：全域單調被破壞、局部單調還在，正是「判有序半＋值域檢查」的原樣落地。
  - Hint: 閉區間模板不變；每輪先用 `nums[left] <= nums[mid]` 認出有序半，target 在其值域內就收進去，否則搜另一半；區間空了回 -1。
- **153** · 找最小值＝定位旋轉點本身，同一個「有序半」觀察的變形：最小值必在含旋轉點的那一半（或就是 mid 自己）。
  - Hint: 改比 `nums[mid]` 與 `nums[right]`：大於表示斷點在右側，`left = mid + 1`；否則最小值在含 mid 的左側，`right = mid`——這組更新要換成 `while (left < right)` 的成套慣例。
