---
id: binary-search-upper-bound
title: Binary Search Upper Bound
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 20
exit_criteria:
  - '能在 nums[mid] > target 時正確調整指標。'
---
## Concept

Upper bound 的定義：在已排序陣列中，**第一個滿足 nums[i] > target 的索引**；所有元素都不大於 target 時，答案是 n。它與昨天的 lower bound 是一對鏡像，程式碼的差別**只有收右界的判斷式那一行**：lower bound 寫 `nums[mid] >= target` 才 right = mid，upper bound 寫 `nums[mid] > target` 才 right = mid。少掉的那個等號，決定了等於 target 的元素站在分界線哪一側：用 >=，等值被視為候選、右界收下來壓住它，分界線落在等值區的**左端**；用 >，等值被視為不合格、左界推過它，分界線落在等值區**右端的下一格**。於是兩條分界線恰好框住所有等於 target 的元素：[lowerBound, upperBound) 就是 target 佔據的區間，upperBound - lowerBound 就是出現次數，不必線性去數。

## Thinking

模板與昨天完全同一套：[left, right)、`left < right`、right = mid 與 left = mid + 1，只有不變式的內容跟著那一行改變：**[0, left) 內全部 <= target，[right, n) 內全部 > target**。每輪比較：nums[mid] <= target——注意等於也走這條——mid 不可能是「第一個嚴格大於」，left = mid + 1，等值被歸到左段丟下，這正是那一個等號造成的行為分歧；nums[mid] > target 則 mid 可能是答案，right = mid 保留。終止時 left == right，即第一個嚴格大於 target 的位置。用它取「target 最後一次出現的位置」：就是 upperBound - 1，但**必須先確認 target 存在**（lowerBound 小於 upperBound），否則兩者相等、減 1 會指到不相干的元素。另一個實用恆等式：整數陣列上 upperBound(target) 等於 lowerBound(target + 1)——昨天 Hint 用的正是這一點，今天起可以直接寫 upper bound，不必繞道。

## Pattern Recognition

直接訊號：first element greater than、strictly greater、「大於 target 的最小索引」。成對訊號：要「起訖位置」「出現次數」「等值區段的右端」時，lower 與 upper bound 幾乎總是成對出場——左端用 >=、右端用 >。Python 標準庫把這一對取名為 bisect_left 與 bisect_right，名字說的就是等值時各靠哪一側。

## Common Mistakes

一、把 > 手滑寫成 >=：整支函式退化成 lower bound——nums = [1, 3, 3, 5] 找 3，upper bound 應回 3，寫錯會回 1；兩個結果都「看起來像邊界」，不對拍很難發現。二、nums[mid] > target 時寫 right = mid - 1：nums = [2, 3] 找 2——mid = 1、nums[1] > 2 → right = 0，回 0，但正解是 1；與昨天同一種病：把可能的答案砍掉了。三、誤解回傳值：upperBound 指向最後一個等值元素的**下一格**，不是它本身；且全陣列 <= target 時回 n——nums = [2, 2] 找 2 回 2，直接索引就越界。四、漏掉「不存在」：nums = [1, 5] 找 3，lowerBound 與 upperBound 都是 1，次數為 0；不檢查就回報起訖 [1, 0]，是空區間卻被當成有效答案。

## Complexity

單次 upper bound 與 lower bound 相同：每輪砍半、時間 O(log n)，三個變數、空間 O(1)。合起來解「起訖位置」是兩次獨立二分，O(log n) 加 O(log n) 仍是 O(log n)；對照線性掃描找兩端的 O(n)，在重複值極多的長陣列上差距最明顯。

## Digest

同一個例子 nums = [1, 2, 3, 3, 3, 5] 找 3：昨天 lower bound 收在 2；今天 upper bound——left = 0、right = 6，mid = 3、nums[3] = 3 <= 3 → left = 4（等值被推過去）；mid = 5、nums[5] = 5 > 3 → right = 5；mid = 4、nums[4] = 3 <= 3 → left = 5；left == right = 5。5 - 2 = 3，恰是三個 3 的個數。整份程式碼與 lower bound 只差判斷式一行：>= 改成 >，等值元素就從「保留在右段」變成「排除到左段」，分界線從等值區左端移到右端下一格。

## TypeScript Tip

與昨天的 lowerBound 逐行對照，唯一不同的是判斷式那一行；回傳值減 1 之前先確認 target 存在。

```typescript
import assert from "node:assert";

function upperBound(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid]! > target) right = mid; // lower bound 在這行用 >=
    else left = mid + 1;
  }
  return left;
}

const a = [1, 2, 3, 3, 3, 5];
assert.strictEqual(upperBound(a, 3), 5); // 跳過全部的 3
assert.strictEqual(upperBound(a, 4), 5); // 不存在
assert.strictEqual(upperBound(a, 0), 0); // 小於全部
assert.strictEqual(upperBound(a, 9), 6); // 大於全部：回 n
```

## Python Tip

bisect_right 就是 upper bound；拿它交叉驗證，並特別驗空陣列與「全部等於 target」。

```python
from bisect import bisect_right

def upper_bound(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)
    while left < right:
        mid = (left + right) // 2
        if nums[mid] > target:  # lower bound 在這行用 >=
            right = mid
        else:
            left = mid + 1
    return left

a = [1, 2, 3, 3, 3, 5]
for t in (0, 3, 4, 9):
    assert upper_bound(a, t) == bisect_right(a, t)
assert upper_bound([], 7) == 0  # 空陣列
assert upper_bound([2, 2], 2) == 2  # 全部等於 target：回 n
```

## Takeaway

upper bound 與 lower bound 只差判斷式的一個等號：> 讓等值被左界推過，回傳第一個嚴格大於 target 的位置。

## Tomorrow Preview

明天離開整齊的排序陣列：旋轉過的排序陣列（如 [4, 5, 6, 7, 0, 1, 2]）單調性斷成兩截，nums[mid] 一次比較還能代言半邊嗎？關鍵觀察是每輪至少有一半仍然有序——判斷哪一半有序，就知道往哪邊收。

## Today's Challenge

- **34** · ending position 正是 upperBound - 1；與昨天的 lowerBound 湊成一對，同一題今天可以完整收工。
  - Hint: 左界 = lowerBound(nums, target)、右界 = upperBound(nums, target) - 1；兩個 bound 相等表示 target 不存在，回 [-1, -1]。
