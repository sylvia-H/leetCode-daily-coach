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

旋轉排序陣列是把嚴格遞增的陣列在某處切開、前後對調的結果：[0,1,2,4,5,6,7] 旋轉後成 [4,5,6,7,0,1,2]。前後兩段各自遞增，中間有一個「斷崖」——全陣列唯一比前一個元素小的位置，它就是最小值，也是原始排序的起點。本課要在 O(log n) 內找到它。與前兩課不同，這次沒有 target 可比：要找的是一個位置性質（轉折點），不是給定的值。二分搜尋仍然適用，關鍵是換比較基準——拿 nums[mid] 與最右端 nums[right] 比。若 nums[mid] > nums[right]：有序區段不會中途變小，所以斷崖必在 mid 右側，最小值落在 (mid, right]。若 nums[mid] < nums[right]：反過來想，假如斷崖在 mid 右側，mid 會落在數值較高的前段、right 落在較低的後段，必有 nums[mid] > nums[right]——如今不成立，故斷崖在 [left, mid] 內。無論哪種情況，一次比較都安全砍掉約一半。

## Thinking

換了基準，就要照第一課的口訣「區間定義、迴圈條件、更新方式三者成套」重新配一套。區間定義：不變式是「最小值必在 [left, right] 內」。更新方式：nums[mid] > nums[right] 時，mid 被 nums[right] 比了下去，確定不是最小值，可放心 left = mid + 1；nums[mid] < nums[right] 時，mid 仍可能就是答案，只能收到 right = mid，不能減一。因為 right = mid 不排除 mid，迴圈條件就不能沿用 left <= right——區間剩一格時 mid == right，right = mid 原地踏步、無窮迴圈；改用 while (left < right)，終止時 left == right，剩下的唯一候選由不變式保證就是最小值。終止性：mid 向下取整，left < right 時必有 mid < right，於是 left = mid + 1 至少前進一格、right = mid 至少後退一格，區間每輪必縮。最後一個疑問：nums[mid] == nums[right] 呢？不會發生——迴圈內 mid < right 恆成立，而本課陣列無重複元素，不同位置必不同值。這正是上一課重複元素造成判斷模糊的反面。

## Pattern Recognition

訊號：陣列「排序後被旋轉」且要找最小值、轉折點或旋轉量（轉折點索引即旋轉步數）；要求 O(log n)；題目沒給 target。更廣義地看，這是第一課說的單調判斷：以「nums[i] <= 最右端元素」為條件，轉折點之前全為否、之後全為是，找最小值就是找第一個「是」——與 lower bound 的「找第一個成立位置」是同一件事，只是判斷從「與 target 比」換成「與右端比」。反訊號：若陣列含重複元素，nums[mid] == nums[right] 時無法判斷方向，需要上一課的逐步收縮，最壞退化成 O(n)。

## Common Mistakes

一、改拿 nums[left] 當基準：未旋轉的 [1,2,3,4,5] 立刻出錯——nums[mid] = 3 > nums[left] = 1，若據此認定最小值在右半，就把答案 1 丟了。與右端比沒有這個問題：未旋轉時右端是最大值，nums[mid] < nums[right] 會正確把搜尋收向左。二、right = mid - 1：[3,1,2] 中 mid = 1、nums[1] = 1 < nums[2] = 2，減一把 right 收到 0，最小值 1 被排除，錯回 3——mid 沒有被任何證據排除，它可能就是答案。三、慣例混搭：用了 right = mid 卻保留 left <= right，區間剩一格時原地打轉成無窮迴圈；三者成套，不能各取一半。

## Complexity

每輪把區間至少砍半（mid 取中點，走 left = mid + 1 或 right = mid），k 輪後剩約 n / 2^k 個候選，時間 O(log n)。與找 target 的版本不同，這裡沒有提前命中的出口，固定收斂到區間剩一格，但輪數同樣是對數級。空間 O(1)，只用 left、right、mid 三個變數。

## Digest

拿 [4,5,6,7,0,1,2] 走一遍：left = 0、right = 6，mid = 3，nums[3] = 7 > nums[6] = 2，斷崖在右 → left = 4；mid = 5，nums[5] = 1 < nums[6] = 2 → right = 5；mid = 4，nums[4] = 0 < nums[5] = 1 → right = 4；left == right = 4，答案 nums[4] = 0。公式：不變式「最小值必在 [left, right]」＋ while (left < right) ＋ nums[mid] > nums[right] 則 left = mid + 1、否則 right = mid。與右端比而非與 target 比；right = mid 保住可能是答案的 mid，left == right 時收工。未旋轉的 [1,2,3,4,5] 同樣適用：每輪都走 right = mid，自然收向最左端的最小值。

## TypeScript Tip

`noUncheckedIndexedAccess` 下 nums[mid] 是 `number | undefined`，用 `!` 收斂；比較基準是 nums[right]。

```typescript
import assert from "node:assert";

function findMin(nums: number[]): number {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid]! > nums[right]!) left = mid + 1;
    else right = mid;
  }
  return nums[left]!;
}

assert.strictEqual(findMin([4, 5, 6, 7, 0, 1, 2]), 0);
assert.strictEqual(findMin([1, 2, 3, 4, 5]), 1); // 未旋轉
assert.strictEqual(findMin([3, 1, 2]), 1); // 最小值恰在 mid
assert.strictEqual(findMin([2, 1]), 1);
assert.strictEqual(findMin([7]), 7); // 單一元素
```

## Python Tip

`//` 向下取整保證迴圈內 mid < right，right = mid 必定縮小區間，left == right 時自然終止。

```python
def find_min(nums: list[int]) -> int:
    left, right = 0, len(nums) - 1
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] > nums[right]:
            left = mid + 1
        else:
            right = mid
    return nums[left]

assert find_min([4, 5, 6, 7, 0, 1, 2]) == 0
assert find_min([1, 2, 3, 4, 5]) == 1  # 未旋轉
assert find_min([3, 1, 2]) == 1  # 最小值恰在 mid
assert find_min([2, 1]) == 1
assert find_min([7]) == 7  # 單一元素
```

## Takeaway

找旋轉陣列最小值：與 nums[right] 比而非與 target 比；大於則 left = mid + 1，否則 right = mid，left == right 即答案。

## Tomorrow Preview

明天把二分搜尋從一維推廣到二維：當矩陣每一列遞增、且每一列的開頭接續上一列的結尾，整個矩陣逐列讀起來就是一條排好序的一維陣列。我們會用座標映射（row = mid / cols、col = mid % cols）在不攤平、不複製資料的前提下，直接套用標準模板。

## Today's Challenge

- **153** · 無重複元素的旋轉排序陣列找最小值，本課「與右端比較」模板的原樣落地；沒有 target 可比，正是它與找目標值題型的分水嶺。
  - Hint: while (left < right)；nums[mid] > nums[right] 則 left = mid + 1，否則 right = mid；出迴圈回傳 nums[left]。
