---
id: backtracking-permutation-with-duplicates
title: Backtracking Permutation with Duplicates
module: backtracking
pattern_label: Visited-Aware Duplicate Skipping
complexity_label: O(n!) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能對排列同時套用 visited 追蹤與條件式的重複跳過。
  - 能防止產生重複的排列分支。
---
## Concept

昨天的排列樹是按**索引**分支的：`used[i]` 記的是「第 i 格用掉了沒」，兩個值相等的格子在它眼裡是兩個不同的個體。所以對 `[1, 1, 2]` 它照樣長出 6 片葉子，`[1, 1, 2]`、`[1, 2, 1]`、`[2, 1, 1]` 各出現兩次——兩個 1 互換位置，值序列相同、索引序列不同。題目要的是不重複的**值序列**。今天的增量只有兩件事，其餘全部沿用昨天：先排序讓相等的值相鄰，再在迴圈裡多一條跳過條件 `i > 0 && nums[i] === nums[i - 1] && !used[i - 1]`。

它的意思是：一群相等的值，只准**按索引順序**依次進入 `path`。要選第 i 格時，若前一格值相同卻還沒被用，代表你想越過前一格先用這一格——這種選法產生的值序列，「前一格先用」的分支已經產生過，直接剪掉。反之若 `used[i - 1]` 為 `true`，前一格已在 `path` 裡，這一格是合法的「下一個相同值」。

正確性：把「相等值按索引遞增順序使用」當成每個值序列**唯一的標準索引寫法**。不重複——兩條索引序列若值序列相同、索引序列不同，其中必有某群相等值不是按索引順序用的，它第一次越過前一格時就被條件擋掉，所以每個值序列最多留下一條路徑。不漏——標準寫法每一步選第 i 格時，同群更小的索引都已在 `path` 裡：i 是該群第一格時值與前一格不同，否則 `used[i - 1]` 為 `true`，兩種情形條件都不成立，這條路一路暢通。合起來：葉節點與不重複的排列一一對應。新的不變式是：`path` 中任何一群相等值，其索引嚴格遞增。

## Thinking

用 `[1, 1, 2]` 走一遍，索引 0、1 都是 1。根層 i = 0 選第一個 1；回來後 i = 1，`nums[1] === nums[0]` 且 `used[0]` 已還原為 `false`，跳過；i = 2 選 2。選了第一個 1 之後那層：i = 1 時 `used[0]` 為 `true`，允許，往下得到 `[1, 1, 2]`；i = 2 選 2，再選第二個 1（`used[0]` 仍為 `true`）得到 `[1, 2, 1]`。根層選 2 之後：i = 0 選 1，再 i = 1 得 `[2, 1, 1]`；i = 1 在這層被擋。三片葉子、九次呼叫，沒有一條死路。

對照子集去重那一課：那裡的條件是 `i > start && nums[i] === nums[i - 1]`，「同一層剛被撤銷」由 `start` 界定；排列沒有 `start`，每層都從 0 掃，於是改用 `used[i - 1]` 判斷前一格是「在上面某層被用掉」還是「就在這一層剛被撤銷」。兩個條件形狀相似，問的問題不同——這正是這一課要拆開的東西。

順帶一提，在同樣先排序的前提下，把條件反過來寫成 `used[i - 1]`（前一格已用才跳）**同樣正確**、輸出順序也相同，它強制的是索引遞減的標準寫法；差別在剪枝時機：`[1, 1, 2]` 要 12 次呼叫且出現死路，八個 1 更要 2781 次對 9 次。教材採用 `!used[i - 1]`。

## Pattern Recognition

線索是「輸入含重複值」加上「回傳所有**不重複**的排列」。更廣的辨識法：凡是回溯樹的葉子會因為「相等的東西互換」而重複出現，就在分支時釘死相等元素的使用順序，而不是生完再用 Set 過濾——後者對 8 個 1 仍會走完 8! 片葉子，前者只走 9 個節點。含重複字母的字串重排也是同一招。

## Common Mistakes

以下結果都以本篇 Tip 的程式實測。第一，**只寫 `nums[i] === nums[i - 1]` 就跳、不看 `used[i - 1]`**：`[1, 1, 2]` 得到 0 筆——第二個 1 在任何層都被擋，`path` 到不了長度 3。第二，**忘了排序**：`[1, 2, 1]` 得到 6 筆，兩個 1 不相鄰，條件從未觸發。第三，**改看 `path` 最後一個元素**（`path[path.length - 1] === nums[i]` 就跳）：`[1, 1, 2]` 得到 `[1, 2, 1]` 兩次，`[1, 1, 2]` 與 `[2, 1, 1]` 全沒了——相等值相鄰的排列被誤殺，不相鄰的重複反而沒擋。第四，**沿用按值的 Set 當 visited**：`[1, 1, 2]` 得到 0 筆，兩個 1 被視為同一個值，`path` 永遠湊不到 3 個。第五，**生完再靠 Set 去重**：結果正確，但沒有剪掉任何分支，8 個相同元素要走完 8! 片葉子才吐出 1 筆。

## Complexity

排序 O(n log n)。剪枝後的樹沒有死路，葉數是 n! 除以各重複值出現次數的階乘乘積（`[1, 1, 2, 2]` 為 24 / (2 · 2) = 6）；每個節點掃 n 格、每片葉拷貝 O(n)，最壞（全相異）仍是 O(n · n!)，全相同時只剩 n + 1 個節點。額外空間 O(n)：`path`、`used` 與遞迴深度。

## Digest

昨天的排列樹按索引分支，遇到 `[1, 1, 2]` 會把三種排列各生兩次。今天只加兩件事：先排序讓相等值相鄰，再在迴圈裡加 `i > 0 && nums[i] === nums[i - 1] && !used[i - 1]` 就跳過。意思是一群相等的值只准按索引順序進入 `path`：前一格值相同卻還沒用，代表你想越過它，這條分支的值序列已由「前一格先用」的分支產生過。正確性：以「相等值按索引遞增使用」作為每個值序列唯一的標準索引寫法，非標準的走法在第一次越過前一格時被擋（不重複），標準走法每一步的前一格若與它同值就必定已被使用，條件不觸發（不漏）。與子集去重的差別：那裡用 `start` 判斷同層，排列沒有 `start`，改用 `used[i - 1]`。反寫成 `used[i - 1]` 也正確，只是剪枝較晚。葉數為 n! 除以各重複次數階乘之積，額外空間 O(n)。

## TypeScript Tip

測資 `[1, 2, 1]` 未排序，能同時抓到漏排序（6 筆）與漏 `!used[i - 1]`（0 筆）。

```typescript
import { strict as assert } from 'node:assert';

function permuteUnique(nums: number[]): number[][] {
  nums = [...nums].sort((a, b) => a - b);
  const res: number[][] = [];
  const path: number[] = [];
  const used = nums.map(() => false);
  const bt = (): void => {
    if (path.length === nums.length) { res.push([...path]); return; }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      if (i > 0 && nums[i] === nums[i - 1] && !used[i - 1]) continue; // 今天的增量
      used[i] = true; path.push(nums[i]!);
      bt();
      path.pop(); used[i] = false;
    }
  };
  bt();
  return res;
}

assert.deepEqual(permuteUnique([1, 2, 1]), [[1, 1, 2], [1, 2, 1], [2, 1, 1]]);
```

## Python Tip

`not used[i - 1]` 是關鍵；反寫成 `used[i - 1]` 仍正確但剪枝較晚。

```python
def permute_unique(nums: list[int]) -> list[list[int]]:
    nums = sorted(nums)
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
            if i > 0 and nums[i] == nums[i - 1] and not used[i - 1]:
                continue
            used[i] = True
            path.append(nums[i])
            bt()
            path.pop()
            used[i] = False

    bt()
    return res

assert permute_unique([1, 2, 1]) == [[1, 1, 2], [1, 2, 1], [2, 1, 1]]
assert permute_unique([1, 1, 1]) == [[1, 1, 1]]
```

## Takeaway

排序後加一條 `nums[i] == nums[i-1] and not used[i-1]` 就跳過：相等值只按索引順序使用，每個不重複排列恰生成一次。

## Tomorrow Preview

明天離開陣列、改切字串：在每個可能的切點把字串分成片段，用 Backtracking 探索所有切法，並把「這一段是不是回文」當成剪枝條件，只往合法的切分往下走。

## Today's Challenge

- **47** · 輸入含重複值、要求不重複的排列，正是今天這條跳過條件的原題；與昨天的差別只有排序與那一行 `!used[i - 1]`。
  - Hint: 先排序；每層 i 從 0 掃，`used[i]` 為真跳過，`i > 0 && nums[i] == nums[i-1] && !used[i-1]` 也跳過；其餘同昨天：葉節點 push 拷貝，返回時 pop 並還原 `used[i]`。
