---
id: binary-search-lower-bound
title: Binary Search Lower Bound
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 20
exit_criteria:
  - '能在 nums[mid] >= target 時正確判斷 lower bound 的條件。'
---
## Concept

Lower bound 的定義：在已排序陣列中，**第一個滿足 nums[i] >= target 的索引**；所有元素都小於 target 時，答案是 n。這一個定義同時回答三種常見問法：target 存在時，它是 target 第一次出現的位置；不存在時，它是插入 target 後仍保持排序的位置；不論存在與否，它都是第一個不小於 target 的元素所在。與標準二分「命中就回傳」的本質差異在答案的性質：標準二分找的是「任何一個等於 target 的索引」，重複值時命中哪一個取決於切點，結果不唯一；lower bound 找的是一條**分界線**——線的左邊全部小於 target、線上與線右全部大於等於 target。排序保證這條線存在且唯一，所以答案永遠唯一，這正是它能處理重複元素的原因。

## Thinking

沿用昨天半開區間那一套慣例：區間 [left, right)、迴圈條件 `left < right`、更新用 right = mid 與 left = mid + 1——三者成套，不混搭。換掉的是迴圈不變式的內容：**[0, left) 內全部 < target，[right, n) 內全部 >= target**，分界線永遠被夾在 left 與 right 之間。初始 left = 0、right = n，兩段都是空集合，不變式自動成立。每輪比較 nums[mid]：若 nums[mid] >= target，由排序可知 mid 右邊也全部 >= target，分界線在 mid 或更左——right = mid，注意**不是 mid - 1**：mid 本身可能就是答案，多減 1 會把候選砍掉；若 nums[mid] < target，mid 與其左全部 < target，分界線至少在 mid + 1——left = mid + 1。關鍵轉念是**等於 target 也不回傳**：等於只證明「答案不在 mid 右邊」，不證明 mid 是第一個，所以照樣收右界、繼續往左找。終止時 left == right，兩段描述在同一點會合：左邊全小於、從這點起全不小於——這一點就是答案。也不會無窮迴圈：`left < right` 時向下取整保證 mid < right，right = mid 至少縮 1；left = mid + 1 也至少縮 1。

## Pattern Recognition

直接訊號：題目出現 first position、first occurrence、lower bound、smallest index such that，或明說含重複元素而要最左邊那個。隱含訊號：要求「插入位置」——lower bound 天生就是插入點。更一般的形式：把 nums[i] >= target 換成任何「前段全為否、後段全為是」的單調條件，同一套模板就能找出第一個「是」；lower bound 是這個一般形最常用的特例。

## Common Mistakes

一、命中就回傳：nums = [3, 3, 3] 找 3，標準二分第一輪 mid = 1 直接回 1，但第一次出現在索引 0。二、right 誤寫成 mid - 1：nums = [2, 3] 找 3——mid = 1、nums[1] >= 3 → right = 0，迴圈結束回 0，但正解是 1，候選被多減的那個 1 砍掉了。三、慣例混搭：半開區間卻寫 `left <= right`——nums = [3] 找 3，right = mid 後區間停在 [0, 0]，`0 <= 0` 仍成立，無窮迴圈；回想第一課：區間定義、迴圈條件、更新方式三者必須成套。四、忘了答案可能是 n：nums = [1, 2] 找 5 回傳 2，直接拿去索引就越界；判斷「找到了沒」要先檢查回傳值小於 n，再比對該位置元素是否等於 target。

## Complexity

每輪比較一次、區間砍半，時間 O(log n)；只用 left、right、mid 三個變數，空間 O(1)。與標準二分同階——「命中不停手、繼續逼邊界」沒有增加漸進成本，只是把終點從「任一命中」改成「最左分界」。找一段重複值的起訖位置也只是兩次二分，仍是 O(log n)。

## Digest

拿 nums = [1, 2, 3, 3, 3, 5] 找 3：left = 0、right = 6，mid = 3、nums[3] = 3 >= 3 → right = 3（命中不回傳，往左）；mid = 1、nums[1] = 2 < 3 → left = 2；mid = 2、nums[2] = 3 >= 3 → right = 2；left == right = 2，答案是 2——三個 3 裡最左的那個。公式：半開區間 [left, right) ＋ `while (left < right)`；nums[mid] >= target → right = mid（保留候選），否則 left = mid + 1；出迴圈時 left 即「第一個 >= target 的索引」，全陣列都小於 target 時是 n，同時就是合法插入位置。

## TypeScript Tip

right = mid 保留候選、left = mid + 1 排除確定不可能的；回傳值可能是 n，拿來索引前要先檢查。

```typescript
import assert from "node:assert";

function lowerBound(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid]! >= target) right = mid;
    else left = mid + 1;
  }
  return left;
}

const a = [1, 2, 3, 3, 3, 5];
assert.strictEqual(lowerBound(a, 3), 2); // 重複值取最左
assert.strictEqual(lowerBound(a, 4), 5); // 不存在：插入位置
assert.strictEqual(lowerBound(a, 0), 0); // 小於全部
assert.strictEqual(lowerBound(a, 9), 6); // 大於全部：回 n
```

## Python Tip

標準庫的 bisect_left 就是 lower bound；自己實作一次，再拿它交叉驗證四種輸入。

```python
from bisect import bisect_left

def lower_bound(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)
    while left < right:
        mid = (left + right) // 2
        if nums[mid] >= target:
            right = mid
        else:
            left = mid + 1
    return left

a = [1, 2, 3, 3, 3, 5]
for t in (0, 3, 4, 9):
    assert lower_bound(a, t) == bisect_left(a, t)
assert lower_bound(a, 3) == 2  # 最左的 3
assert lower_bound([], 7) == 0  # 空陣列
```

## Takeaway

lower bound 找第一個 nums[i] >= target：大於等於就 right = mid 保留候選、小於就 left = mid + 1，會合點即分界線。

## Tomorrow Preview

明天是今天的鏡像：upper bound 找第一個**嚴格大於** target 的位置。程式碼與今天只差判斷式那一行的一個等號，卻讓等於 target 的元素從「保留」變成「跳過」；兩者相減，還能直接算出 target 的出現次數。

## Today's Challenge

- **34** · 找 starting position 就是 lower bound 原樣落地：第一個 >= target 的位置加存在性檢查。
  - Hint: lb = lowerBound(nums, target)；lb == n 或 nums[lb] != target 回 [-1, -1]；右界可用 lowerBound(nums, target + 1) - 1。
