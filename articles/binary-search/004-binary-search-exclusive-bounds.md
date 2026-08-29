---
id: binary-search-exclusive-bounds
title: Binary Search Exclusive Bounds
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 20
exit_criteria:
  - 能以 right = n 設定指標。
  - 能用 right = mid 正確更新邊界。
---
## Concept

第一課說過：**區間定義、迴圈條件、更新方式三者必須成套**。前兩課練熟了閉區間那一套，今天換第二套：半開區間 `[left, right)`——left 在區間內、right 不在，未檢查的候選是 left 到 right - 1。同樣從區間定義推出全套。初始化 `left = 0`、`right = n`：right 本來就不指向候選，設成 n 剛好讓區間涵蓋整個陣列，還多一個妙處——當答案是「位置」時，n（插入到最尾端）也是合法答案，閉區間的 right = n - 1 裝不下它，半開的 right = n 天然容納。迴圈條件 `while (left < right)`：半開區間非空的直譯是 left 嚴格小於 right，left == right 時區間是空的，該停了。更新方式：排除 mid 時照樣 `left = mid + 1`（left 這側是閉的，必須跨過 mid）；要「保留 mid 當候選答案、只排除它右邊」時，寫 `right = mid` 就夠——right 本來就不在區間內，mid 成為新的開邊界，既不會再被比較，又留在答案的候選名單上。這正是半開慣例的看家本領：找邊界。

## Thinking

用插入位置問題走一遍：已排序 `nums = [1, 3, 5, 6]`，找 target 該插入的索引。先改寫問法：找**第一個大於等於 target 的位置**——它就是插入點，而答案範圍是 0 到 n（都比 target 小就插在最尾端）。不變式：left 左邊的位置都已確定小於 target；right 與它右邊的位置都已確定大於等於 target；夾在中間的 [left, right) 尚未判定。每輪比較 `nums[mid]`：若 `nums[mid] >= target`，mid 本身可能就是答案，但「它大於等於 target」這件事已經確定、不需再比——`right = mid` 一步到位，把 mid 右邊全排除、又讓 mid 以開邊界的身分留在候選席；若 `nums[mid] < target`，mid 確定不是答案，`left = mid + 1`。終止時 left == right，兩個已確定區在此會合，這個位置就是答案：target = 2 收斂到 1、target = 7 收斂到 4（即 n）。為何 `right = mid` 不會死迴圈？上一課留下的紅利：向下取整讓 mid 偏左，left < right 時 mid 必定小於 right，所以這步至少縮 1；`left = mid + 1` 也至少縮 1，必然終止。對照閉區間（同一套語彙）：閉區間終止是**交錯**（left == right + 1），答案靠 return 或變數帶出；半開終止是**重合**（left == right），指標停的位置本身就是答案。

## Pattern Recognition

訊號：題目要的是「位置」而不是「有沒有」——插入點、第一個滿足條件的元素、區間的起訖；尤其當答案可能是 n（落在陣列外一格）時，半開的 right = n 讓它不需任何特判。反之，找確切值、找到就回傳的題，閉區間的 `return mid` 更直接。兩套都是完備的，同一題往往兩種都能解（今天的挑戰就有一題在閉區間那課解過），差別在哪套的語意跟題目貼得近。真正的大忌只有一個：混搭。

## Common Mistakes

每一條都給反例。一、半開配 `left <= right`：`nums = [5]` 找 7 的插入點——left 推到 1 與 right 重合，等號讓迴圈多跑一輪，mid = 1 讀 `nums[1]`：Python 拋 IndexError，JavaScript 安靜讀到 undefined。半開的等號不是「多檢查一格」，是「區間已空還硬跑」。二、該 `right = mid` 時寫成 `right = mid - 1`：`nums = [3, 5]` 找 4 的插入點（正解 1）——mid = 1、`nums[1] = 5 >= 4`，1 正是答案候選，寫 mid - 1 把它踢出，最後錯回 0。三、right 初始化成 n - 1（拿閉區間的初始化配半開的其餘部分）：`nums = [3, 5]` 找 9 的插入點應為 2，但區間從頭就不含 2，永遠回不了正解。四、`left = mid`：`nums = [3, 5]` 找 4——right 收到 1 之後 mid = 0、`nums[0] = 3 < 4`，left = mid 停在 0，死迴圈。口訣：left 這側是閉的，排除必 +1；right 這側本來就開，保留候選直接 = mid。

## Complexity

時間 O(log n)：`right = mid` 與 `left = mid + 1` 都讓未判定區至少縮 1、實際上每輪砍半；空間 O(1)。與閉區間同量級——選哪套是語意問題，不是效能問題。

## Digest

兩套慣例對照著記：閉區間 `[left, right]`——right = n - 1、`left <= right`、`mid ± 1`、終止交錯 left == right + 1；半開 `[left, right)`——right = n、`left < right`、`right = mid` / `left = mid + 1`、終止重合 left == right，指標位置即答案。實例：`[1, 3, 5, 6]` 找 2 的插入點——mid = 2 比到 5 >= 2 收 right = 2，mid = 1 比到 3 >= 2 收 right = 1，mid = 0 比到 1 < 2 推 left = 1，重合在 1 收工；找 7 則一路 left = mid + 1 推到 4（= n），這個答案只有 right = n 的半開裝得下。口訣：慣例成套，混搭必爆。

## TypeScript Tip

半開模板解插入位置：right 從 n 起跑，`right = mid` 保留候選，終止時 left 即答案——插入點是 n 的情況不需特判。

```typescript
import assert from "node:assert";

function searchInsert(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length; // 半開 [left, right)：right = n
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid]! >= target) right = mid; // mid 留在候選席
    else left = mid + 1;
  }
  return left; // 終止時 left === right，即插入點
}

const nums = [1, 3, 5, 6];
assert.strictEqual(searchInsert(nums, 5), 2);
assert.strictEqual(searchInsert(nums, 2), 1);
assert.strictEqual(searchInsert(nums, 7), 4); // 插入點是 n，半開天然容納
assert.strictEqual(searchInsert(nums, 0), 0);
assert.strictEqual(searchInsert([5], 5), 0);
```

## Python Tip

標準庫的 `bisect_left` 用的正是半開慣例——自己寫一遍，再拿它交叉驗證；空陣列時 left == right == 0，迴圈自然不進。

```python
from bisect import bisect_left

def search_insert(nums: list[int], target: int) -> int:
    left, right = 0, len(nums)  # 半開 [left, right)
    while left < right:
        mid = left + (right - left) // 2
        if nums[mid] >= target:
            right = mid
        else:
            left = mid + 1
    return left

nums = [1, 3, 5, 6]
for target in (0, 1, 2, 5, 6, 7):
    assert search_insert(nums, target) == bisect_left(nums, target)
assert search_insert([], 3) == 0  # 空陣列不進迴圈，插入點為 0
```

## Takeaway

半開成套：right = n、`left < right`、`right = mid` 保留候選；終止重合，left 停的位置就是答案。

## Tomorrow Preview

明天把今天的收斂手法抽象成通用工具：lower bound——「第一個大於等於 target 的位置」，一支函式統一回答存在性、首次出現位置與插入點。

## Today's Challenge

- **35** · 半開模板的原樣落地：right = n、`nums[mid] >= target` 就收 right = mid，終止的 left 即插入點。
  - Hint: 把題目改讀成「找第一個大於等於 target 的位置」；找到與否都回 left，不需分支。
- **34** · 閉區間那課解過一次，今天用半開再解：起訖位置本質是兩個邊界的收斂。
  - Hint: 左界即「第一個 >= target 的位置」，再驗證該位置的值是否真是 target；右界可找「第一個 > target 的位置」再減一。
