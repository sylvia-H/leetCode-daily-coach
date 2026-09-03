---
id: backtracking-permutation-basics
title: Backtracking Permutation Basics
module: backtracking
pattern_label: State Tracking Permutation
complexity_label: O(n!) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能使用 visited 陣列或 set 追蹤哪些元素目前已包含在路徑中。
  - 能生成全部 n! 種排列。
---
## Concept

昨天的 Combination Sum II 與更早的子集課，遞迴都帶一個 `start` 只往後挑：因為順序不重要，`[1, 2]` 與 `[2, 1]` 是同一個答案，把每個答案釘在「索引遞增」這一種寫法上就不會重複。排列（Permutation）把這個前提拿掉——順序就是答案的一部分，`[1, 2]` 與 `[2, 1]` 是兩筆不同的結果，而 `[2, 1]` 在只往後挑的樹裡永遠生不出來。所以排列樹在**每一層都從索引 0 掃到 n − 1**，唯一的限制是「這個元素還沒在 `path` 裡」。追蹤這件事的工具是與 `nums` 等長的布林陣列 `used`：`used[i]` 為 `true` 代表 `nums[i]` 目前在 `path` 中。它就是圖 DFS 的 visited，但和第一課說的一樣，離開節點時必須撤銷。

不變式有兩條：進入 `bt` 時，`path` 是根到此節點的選擇序列，且 `used[i]` 為 `true` 若且唯若 `nums[i]` 在 `path` 中；`bt` 返回時，`path` 與 `used` 都與進入時完全相同。正確性由它推出。每條根到葉的路徑是一串**互不相同的索引**（`used` 擋掉重選），長度到 n 就是 n 個索引各用一次，即一個排列；反過來任何排列都走得到——要選它的第 k 個元素時，那個索引還沒被用，`used` 不會擋。元素相異時，不同的索引序列給出不同的值序列，所以 n! 片葉子與 n! 種排列一一對應，不多不漏。

## Thinking

用 `[1, 2, 3]` 走一遍。根層 i = 0 選 1，`used = [T, F, F]`；下一層掃 0..2，0 被擋，選 2，再選 3，`path` 長度到 3，收下 `[1, 2, 3]`。返回時 pop 3、`used[2] = false`；那層迴圈到底，再 pop 2、`used[1] = false`，回到選了 1 的那層，i 推到 2：選 3，下一層唯一沒用過的是 2，收下 `[1, 3, 2]`。同樣撤回到根，i = 1 選 2，得到 `[2, 1, 3]`、`[2, 3, 1]`；i = 2 選 3，得到 `[3, 1, 2]`、`[3, 2, 1]`。六片葉子，順序就是 DFS 順序：輸入已排序時，輸出恰是字典序。

兩個實作決定值得說清楚。第一，**葉節點才收集**——子集樹每個節點都是答案，排列樹只有長度到 n 的節點才是，中途的 `[1, 2]` 不是排列。第二，**`used` 按索引而不按值**：`nums` 相異時兩者等價，但明天輸入會有重複值，「這個值用過了」和「這一格用過了」就分開了，今天先養成按索引標記的習慣。Python 用 `num not in path` 也能判斷，但那是 O(n) 的線性掃描，`used[i]` 是 O(1)。

## Pattern Recognition

題目問「所有排列」「所有安排方式」「所有順序」，或答案是一串**必須用完所有元素、且順序有意義**的序列，就是這棵樹。判斷口訣：交換答案裡兩個元素的位置，會不會變成另一個答案？會，就是排列，每層從頭掃＋`used`；不會，就是子集或組合，帶 `start` 只往後挑。答案數量是 n! 量級也是線索——題目給的 n 通常很小（46 題 n ≤ 6），這正是暗示你可以放心窮舉。

## Common Mistakes

以下結果都以本篇 Tip 的程式對 `[1, 2, 3]` 實測。第一，**返回時忘了把 `used[i]` 改回 `false`**（pop 有做）：只得到 `[1, 2, 3]` 一筆——第一片葉子用掉三個索引後全部被永久標記，之後每層迴圈都無東西可選。第二，**忘了 pop 但有撤銷 `used`**：也只有一筆——第一片葉子之後 `path` 再也回不到長度 2，後面 push 進來的長度直接跳到 4、5，永遠等不到「恰等於 n」。第三，**把子集的迴圈原樣搬來**（`i` 從 `start` 起、遞迴傳 `i + 1`）：同樣只有 `[1, 2, 3]` 一筆，索引只能遞增。第四，**用值的 Set 代替按索引的 `used`**：相異輸入結果正確，但 `[1, 1, 2]` 得到 0 筆——第二個 1 永遠被當成「已用」，`path` 到不了長度 3。第五，`res.push(path)` 存參考：六筆全是 `[]`。

## Complexity

葉節點 n! 個；節點總數是 n!/(n − k)! 對 k 加總，約 e · n!（n = 3 為 16 次呼叫，n = 4 為 65 次）。每個節點掃 n 個索引、每片葉拷貝 O(n)，總時間 O(n · n!)；課程標籤的 O(n!) 指的是葉數。額外空間 O(n)：`path`、`used` 各 n 格，遞迴深度 n；輸出本身的 O(n · n!) 不計入。

## Digest

排列樹與子集樹的差別只有一件事：順序有意義，所以每層都從索引 0 掃到底，不帶 `start`；用與 `nums` 等長的 `used` 擋掉已在 `path` 裡的元素，葉節點（長度等於 n）才收集拷貝。不變式：進入時 `used[i]` 為 `true` 若且唯若 `nums[i]` 在 `path` 中，返回時 `path` 與 `used` 都還原——所以 pop 與 `used[i] = false` 缺一不可，少任何一個對 `[1, 2, 3]` 都只剩 1 筆。正確性：每條根到葉的路徑是 n 個互不相同的索引，元素相異時就是一個排列，且每個排列恰走到一次。`used` 按索引而非按值標記，明天處理重複值時才接得上。時間 O(n · n!)（約 e · n! 個節點），額外空間 O(n)。

## TypeScript Tip

測資比對完整內容與順序：漏 pop、漏 `used[i] = false`、改成 `start` 往後挑，都會被抓到。

```typescript
import { strict as assert } from 'node:assert';

function permute(nums: number[]): number[][] {
  const res: number[][] = [];
  const path: number[] = [];
  const used = nums.map(() => false);
  const bt = (): void => {
    if (path.length === nums.length) { res.push([...path]); return; } // 葉才收集
    for (let i = 0; i < nums.length; i++) { // 每層都從 0 掃
      if (used[i]) continue;
      used[i] = true; path.push(nums[i]!);
      bt();
      path.pop(); used[i] = false; // 兩個都要還原
    }
  };
  bt();
  return res;
}

assert.deepEqual(permute([1, 2, 3]),
  [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]);
assert.deepEqual(permute([]), [[]]);
```

## Python Tip

`itertools.permutations` 依索引順序輸出，與這棵 DFS 樹的葉節點順序一致，可拿來對照。

```python
from itertools import permutations

def permute(nums: list[int]) -> list[list[int]]:
    res: list[list[int]] = []
    path: list[int] = []
    used = [False] * len(nums)

    def bt() -> None:
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            path.append(nums[i])
            bt()
            path.pop()
            used[i] = False

    bt()
    return res

assert permute([1, 2, 3]) == [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]
assert permute([3, 1, 2]) == [list(p) for p in permutations([3, 1, 2])]
```

## Takeaway

排列樹每層從索引 0 掃到底，靠 `used[i]` 擋掉已在 `path` 的元素；返回時 pop 與 `used[i] = false` 缺一不可。

## Tomorrow Preview

明天輸入會有重複值，例如 `[1, 1, 2]`：今天這棵樹把兩個 1 當成不同個體，六片葉子只有三種不同的排列。明天在同一份程式上加排序與一條「前一個相同元素尚未被使用就跳過」的條件，只留下不重複的排列。

## Today's Challenge

- **46** · 元素保證相異，正是今天這棵樹的乾淨版本：不需要任何去重，只靠 `used` 擋重選；n ≤ 6，n! 窮舉綽綽有餘。
  - Hint: `used` 與 `nums` 等長；每層 i 從 0 掃到底，`used[i]` 為真就跳過；`path` 長度等於 n 時 push 一份拷貝；遞迴回來後 pop 並把 `used[i]` 設回 false。
