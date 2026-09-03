---
id: backtracking-combination-sum
title: Backtracking Combination Sum
module: backtracking
pattern_label: Reusable Elements Sum Pattern
complexity_label: O(2^(t/min)) / O(t/min)
estimated_minutes: 20
exit_criteria:
  - 能在遞迴過程中管理目標值的扣減。
  - 能把當前索引原樣傳回遞迴呼叫，以允許元素重複使用。
---
## Concept

子集生成給了我們一棵「只能往後選」的決策樹：`dfs(start, path)` 在 `start..n-1` 之間挑下一個元素，挑了索引 i 就用 `i + 1` 往下走。Combination Sum 在這棵樹上只改兩件事。第一，多帶一個剩餘目標 `rem`：每挑一個數就從 `rem` 扣掉它，`rem === 0` 才收集，不再像子集那樣在每個節點都收集。第二，同一個數可以無限次使用，所以往下遞迴時傳的是 i 而不是 i + 1——「下一個可以挑的仍然包含自己」。其餘完全沿用：迴圈起點由 `start` 決定，路徑用 push / pop 維護，答案在葉端複製一份。

## Thinking

先弄清楚傳 i 為什麼不會產生重複。一個組合本質上是多重集合，例如 {2, 2, 3}；在已排序、且候選彼此相異的前提下（本題正是如此），每個多重集合恰好對應一條「索引不遞減」的挑選序列 [0, 0, 1]——候選若含重複值，同一個多重集合會對應到多條序列，去重就得另外靠明天的同層跳過。傳 i 讓序列可以停在同一個索引，而 start 不會後退，所以序列永遠不遞減——[3, 2, 2] 這種順序根本走不到，因為挑了索引 1 之後迴圈起點就是 1，回不去索引 0。每個多重集合恰好被枚舉一次：不重複、也不漏。
接著是迴圈不變式。進入 `dfs(start, rem, path)` 時恆有三件事成立：path 的索引序列不遞減，且 path 非空時最後一個索引等於 start；`sum(path) + rem === target`；所有以 path 為前綴、之後只用索引 ≥ start 的元素湊出 target 的組合，都會在這棵子樹被找到。`rem === 0` 時 path 本身就是一組解，收集後直接返回——繼續往下只會讓總和超過目標，因為候選都是正整數。終止性也來自「正整數」：每往下一層 rem 至少減少 min(candidates)，深度不會超過 target / min。
剪枝：先把候選排序，迴圈裡遇到 `cand[i] > rem` 就 break。這是安全的，因為後面的候選只會更大，全都放不進去。用 `[2, 3, 6, 7]`、target 7 走一遍：挑 2（rem 5）→ 挑 2（rem 3）→ 挑 2（rem 1）→ 2 > 1 break；退回 rem 3 挑 3（rem 0）收集 [2, 2, 3]；一路退回頂層，start = 3 挑 7（rem 0）收集 [7]。整棵樹只呼叫 10 次 dfs。

## Pattern Recognition

線索是「每個數可以用無限多次」加上「列出所有總和等於 target 的組合」，且候選皆為正整數、彼此相異。看到「無限次」就把遞迴傳的索引從 i + 1 改成 i；看到「組合而非序列」就保留 start 只往後選。兩個反方向的線索要分清楚：若題目只問「有幾種」而不要求列出，那是 DP 的範圍（換零錢式的計數）；若順序不同就算不同答案，那是排列計數，也走 DP。回溯的價值在於「要列出每一組」——輸出本身就是指數級，枚舉才是正解。

## Common Mistakes

以下每一條都用本篇 Tip 的程式碼實測。第一，遞迴傳 `i + 1`：對 `[2, 3, 6, 7]`、target 7 只得到 [[7]]，[2, 2, 3] 消失，因為 2 用過一次就再也挑不到。第二，每層都從索引 0 開始挑：對 `[2, 3]`、target 5 會同時得到 [2, 3] 與 [3, 2]，組合變成排列。第三，沒排序卻用 break 剪枝：對 `[3, 2]`、target 2，第一個候選 3 > 2 立刻 break，連 2 都沒看，輸出空陣列而正解是 [[2]]；不排序就只能用 continue，但 continue 得掃完整個陣列。第四，完全沒有超額檢查（既不 break 也不判 `rem < 0`）：對 `[2]`、target 3，rem 走 3 → 1 → -1 → -3 永遠碰不到 0，直到堆疊溢位。第五，收集時寫 `res.push(path)` 而非複製：所有答案共用同一個陣列，回溯 pop 完後結果變成 [[], []]。

## Complexity

時間上界 O(2^(t/min))：t 是 target、min 是最小候選，每往下一層 rem 至少減 min，所以遞迴深度最多 t/min；每個節點的分支數不超過 n，粗略上界寫成指數形式。實際節點數遠小於上界，因為排序後的 break 會砍掉整段迴圈。空間 O(t/min)：遞迴堆疊與 path 的長度都不超過最大深度，結果集另計。

## Digest

Combination Sum 是子集生成的兩處改動：帶一個剩餘目標 `rem`，挑一個數就扣掉它，`rem === 0` 才收集；遞迴傳 i 而非 i + 1，讓同一個數可以無限次重用。正確性來自「索引序列不遞減」：候選彼此相異時，每個組合（多重集合）恰好對應一條不遞減的索引序列，start 不會後退，所以 [3, 2, 2] 這種順序走不到，不重複也不漏。終止性來自候選為正整數：每層 rem 至少減 min，深度最多 t/min。排序後遇到 `cand[i] > rem` 就 break，因為後面的候選只會更大；未排序就不能 break。收集時複製 path，否則所有答案共用同一個被 pop 空的陣列。時間 O(2^(t/min))、空間 O(t/min)。

## TypeScript Tip

輸入刻意不排序，斷言比對每組的元素順序：拿掉 `sort` 會得到 `3+2+2`，改傳 `i + 1` 只剩 `7`，忘記複製 path 會得到空字串。

```typescript
function combinationSum(c: number[], target: number): number[][] {
  const cand = [...c].sort((a, b) => a - b);
  const res: number[][] = [];
  const dfs = (start: number, rem: number, path: number[]): void => {
    if (rem === 0) { res.push([...path]); return; }
    for (let i = start; i < cand.length; i++) {
      const v = cand[i]!;
      if (v > rem) break;
      path.push(v);
      dfs(i, rem - v, path);
      path.pop();
    }
  };
  dfs(0, target, []);
  return res;
}
const got = combinationSum([7, 3, 2], 7).map((p) => p.join("+")).sort();
if (got.join(" ") !== "2+2+3 7") throw new Error(got.join(" "));
if (combinationSum([2], 1).length !== 0) throw new Error("expected no solution");
```

## Python Tip

輸入刻意不排序：`[3, 2, 5]`、target 8 的三組解各用了不同次數的重用（2 用四次、3 用兩次、5 用一次）；把 `dfs(i, ...)` 改成 `dfs(i + 1, ...)` 就只剩 `[3, 5]`，拿掉 `sorted` 則會漏掉 `[2, 3, 3]`。

```python
def combination_sum(c: list[int], target: int) -> list[list[int]]:
    cand = sorted(c)
    res: list[list[int]] = []

    def dfs(start: int, rem: int, path: list[int]) -> None:
        if rem == 0:
            res.append(path[:])
            return
        for i in range(start, len(cand)):
            v = cand[i]
            if v > rem:
                break
            path.append(v)
            dfs(i, rem - v, path)
            path.pop()

    dfs(0, target, [])
    return res

assert combination_sum([3, 2, 5], 8) == [[2, 2, 2, 2], [2, 3, 3], [3, 5]]
assert combination_sum([2], 1) == []
```

## Takeaway

挑一個數就從 rem 扣掉、歸零才收集；遞迴傳 i 讓數字可重用，start 不後退保證不重複，正整數保證會終止。

## Tomorrow Preview

明天是 Backtracking Combination Sum II：每個索引只能用一次、候選陣列又含重複值，要把今天的 rem 扣減、子集生成的 i + 1，以及含重複元素子集那一課的排序加同層跳過，三件事疊在一起，並確保每個組合都唯一。

## Today's Challenge

- **39** · 候選彼此相異且可無限次重用，是「遞迴傳 i」與「rem 扣減、歸零收集」的最純粹範本，沒有任何去重干擾。
  - Hint: 先排序；`dfs(start, rem, path)` 從 start 往後挑，挑了索引 i 就以 `rem - cand[i]` 遞迴到 `dfs(i, ...)`；`cand[i] > rem` 就 break；rem 歸零時複製 path 收集。
