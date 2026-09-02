---
id: backtracking-combination-sum-ii
title: Backtracking Combination Sum II
module: backtracking
pattern_label: Unique Combination Sum Pattern
complexity_label: O(2^n) / O(n)
estimated_minutes: 20
exit_criteria:
  - 能結合排序、同層跳過的重複檢查與目標值扣減。
  - 能確保每個組合都是唯一的。
---
## Concept

昨天的 Combination Sum 已經把骨架搭好：`dfs(start, rem, path)`，挑一個數就從 `rem` 扣掉，`rem === 0` 收集，排序後遇到 `cand[i] > rem` 就 break。今天只改兩個條件：每個索引只能用一次，且候選陣列含重複值，但輸出的組合仍須唯一。對應的改法也只有兩行。第一，遞迴改傳 `i + 1`——這是退回子集生成的原始寫法，昨天為了無限重用才改成 i。第二，加上同層跳過：`if (i > start && cand[i] === cand[i - 1]) continue`，與含重複元素的子集那一課一模一樣。排序在這裡身兼二職：讓 break 剪枝安全，也讓相同的值相鄰、跳過檢查才比得到。

## Thinking

先問「傳 i + 1 之後，重複從哪裡來」。候選 `[1, 1, 2]`、target 3：索引 0 的 1 配索引 2 的 2 得 [1, 2]，索引 1 的 1 配索引 2 的 2 也得 [1, 2]。兩條路徑用的索引不同、值卻相同，這是重複的唯一來源——同一層裡挑了「值相同、位置不同」的元素當下一個。
再問為什麼「同層只保留第一個」不會漏解。某一層從 start 起有 k 個相等的值 v 排在一起。挑第一個 v 之後，下一層的 start 落在第二個 v，於是「再挑一個 v、再挑一個 v……」都還走得到，「用 1 個到 k 個 v」全部涵蓋在第一個 v 的子樹裡。若在同一層改挑第二個 v，它之後只剩 k - 1 個 v 可用，能湊出的每一組都是第一個 v 的子樹已經產出的，全是重複。所以跳過同層第二個起的 v 不漏，也剛好把重複砍乾淨。
再問為什麼是 `i > start` 而不是 `i > 0`。跨層連著用相同的值是合法的：`[1, 1, 6]`、target 8 的正解 [1, 1, 6] 就需要索引 0 與索引 1 連用。索引 1 的 1 是在下一層以 `start = 1` 的身分被挑的，此時 `i === start`，不跳過；只有 `i > start`——它是這一層的第二個以上的候選且與前一個同值——才跳。迴圈不變式因此改寫：昨天是「path 的索引序列不遞減」，今天是「嚴格遞增」，再加一條「每一層裡，每個相異值最多被當作下一個元素一次」。以 `[10, 1, 2, 7, 6, 1, 5]`、target 8 排序後走一遍，整棵樹只呼叫 17 次 dfs，得到 [1, 1, 6]、[1, 2, 5]、[1, 7]、[2, 6]，每組恰好一次。

## Pattern Recognition

線索是三個條件同時出現：「每個元素只能用一次」對應 i + 1、「候選有重複值」對應排序加同層跳過、「總和等於 target」對應 rem 扣減與 break。任兩個的組合你都已經會了，今天只是把三個疊在一起。另一個訊號是輸出要求「不含重複組合」——在含重複值的輸入下，這句話幾乎就是在說「請用同層跳過」。用 Set 把結果字串化去重也能得到正確輸出，但它只在葉端擋掉重複，中間的重複子樹照樣走完。

## Common Mistakes

以下每一條都用本篇 Tip 的程式碼實測。第一，沿用昨天的 i：對 `[1, 2]`、target 2 會產出 [1, 1]，同一個索引被用了兩次。第二，跳過條件寫成 `i > 0`：對 `[1, 1]`、target 2 得到空陣列，正解 [1, 1] 被跨層誤殺；改拿 path 的最後一個值來比較也是同樣的錯，`[1, 1, 6]`、target 8 一樣輸出空陣列。第三，沒有同層跳過：對 `[1, 1, 2]`、target 3 得到 [1, 2] 兩次；對 `[2, 5, 2, 1, 2]`、target 5 得到 [1, 2, 2] 三次。第四，有跳過檢查卻沒排序：對 `[5, 2, 1, 2, 2]`、target 5 同時得到 [1, 2, 2] 與 [2, 1, 2]，相同的值不相鄰，跳過檢查根本比不到。第五，靠 Set 去重代替同層跳過：結果正確但代價不成比例——20 個 1、target 5 時，同層跳過只呼叫 6 次 dfs，Set 版呼叫 21,700 次。

## Complexity

時間 O(2^n)：每個索引最多用一次，每條路徑對應候選的一個子集，子集總數 2^n 是上界；排序的 O(n log n) 被指數項吸收。同層跳過與 break 只砍節點、不加節點，上界不變，實際節點數通常遠少於此。空間 O(n)：遞迴深度與 path 長度都不超過 n，結果集另計。

## Digest

在昨天的 `dfs(start, rem, path)` 骨架上只改兩行：遞迴傳 `i + 1`（每個索引只用一次），以及排序後的同層跳過 `if (i > start && cand[i] === cand[i - 1]) continue`。重複的唯一來源是同一層挑了值相同、位置不同的元素；挑第一個 v 之後下一層的 start 就落在第二個 v，用 1 到 k 個 v 的情形全在第一個 v 的子樹裡，所以同層跳過第二個起的 v 不漏也不重。條件是 `i > start` 而非 `i > 0`，因為跨層連用相同的值（如 [1, 1, 6]）是合法的。排序同時服務 break 剪枝與跳過檢查，沒排序兩者都失效。時間 O(2^n)、空間 O(n)。

## TypeScript Tip

輸入未排序且含兩個 1：改傳 `i` 會多出全 1 的組合，`i > 0` 會少掉 `1+1+6`，拿掉跳過則 `1+2+5` 與 `1+7` 各出現兩次。

```typescript
function combinationSum2(c: number[], target: number): number[][] {
  const cand = [...c].sort((a, b) => a - b);
  const res: number[][] = [];
  const dfs = (start: number, rem: number, path: number[]): void => {
    if (rem === 0) { res.push([...path]); return; }
    for (let i = start; i < cand.length; i++) {
      const v = cand[i]!;
      if (v > rem) break;
      if (i > start && v === cand[i - 1]) continue;
      path.push(v);
      dfs(i + 1, rem - v, path);
      path.pop();
    }
  };
  dfs(0, target, []);
  return res;
}
const got = combinationSum2([10, 1, 2, 7, 6, 1, 5], 8).map((p) => p.join("+")).sort();
if (got.join(" ") !== "1+1+6 1+2+5 1+7 2+6") throw new Error(got.join(" "));
```

## Python Tip

第二個斷言專門守 `i > start`：候選只有兩個 1、target 2，唯一解要跨層連用兩個 1，寫成 `i > 0` 會回傳空串列。

```python
def combination_sum2(c: list[int], target: int) -> list[list[int]]:
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
            if i > start and v == cand[i - 1]:
                continue
            path.append(v)
            dfs(i + 1, rem - v, path)
            path.pop()

    dfs(0, target, [])
    return res

assert combination_sum2([2, 5, 2, 1, 2], 5) == [[1, 2, 2], [5]]
assert combination_sum2([1, 1], 2) == [[1, 1]]
```

## Takeaway

昨天的骨架加兩行：傳 i + 1 讓每個索引只用一次，排序後 `i > start` 的同層跳過砍掉重複；跨層連用相同值仍合法。

## Tomorrow Preview

明天是 Backtracking Permutation Basics：當順序有意義時，不再只往後選，而是每一步走訪所有尚未使用的元素，用 visited 陣列或 set 追蹤哪些元素已在路徑中，生成全部 n! 種排列。

## Today's Challenge

- **40** · 三個條件同時出現：每個索引只能用一次、候選含重複值、輸出組合須唯一，是「i + 1、排序加同層跳過、rem 扣減」疊在一起的標準題。
  - Hint: 先排序；遞迴傳 `i + 1`；迴圈裡 `cand[i] > rem` 就 break，`i > start && cand[i] === cand[i - 1]` 就 continue；rem 歸零時複製 path 收集。
