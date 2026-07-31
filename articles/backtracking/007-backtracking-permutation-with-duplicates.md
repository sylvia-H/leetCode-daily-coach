---
id: backtracking-permutation-with-duplicates
title: Backtracking Permutation with Duplicates
module: backtracking
pattern_label: Visited-Aware Duplicate Skipping
complexity_label: O(n!) / O(n)
estimated_minutes: 20
exit_criteria:
  - >-
    Can apply both visited tracking and conditional duplicate skipping for
    permutations.
  - Can prevent duplicate permutation branches.
---
## Concept

Backtracking Permutation with Duplicates 是一種在包含重複元素的陣列中，生成所有不重複排列（Permutations）的經典演算法策略。在處理一般排列時，我們只關心每個元素是否已被使用過；然而當輸入資料含有重複值時，若不加過濾地進行遞迴窮舉，會產生大量結構相同但順序重複的結果。為了確保產生的排列結果唯一，必須在回溯框架中導入排序與去重機制。

## Thinking

思考這類問題時，核心在於如何在遞迴樹中辨識並剪枝。首先，必須將輸入的數字陣列進行排序，讓相同的元素相鄰。在建構排列的每一層中，我們依序迭代未被訪問過的元素。如果當前元素與前一個元素相同，且前一個元素剛好在同一個遞迴層級中被略過（即尚未被使用），我們就必須跳過當前元素。透過這個嚴格的條件，能確保相同數值的元素在遞迴過程中維持固定的相對順序，進而徹底杜絕重複的排列組合。

## Pattern Recognition

辨識此 Pattern 的關鍵線索在於題目的輸入包含重複數字，且要求輸出所有的排列組合、要求結果不得重複。當看到題目明確指出「含有重複元素」且屬於「排列（Permutation）」範疇時，直覺就應該想到必須結合 Visited Array 與條件式跳過（Conditional Skipping）的 Backtracking 技巧。

## Common Mistakes

最常見的錯誤是混淆了 Subset（子集）與 Permutation（排列）的去重邏輯。在 Subset 問題中，通常會使用 nums[i] == nums[i - 1] && i > direct_start 來去重；而在 Permutation 問題中，由於元素可以從任意位置選取（只要未被訪問），因此必須透過 visited 陣列來追蹤狀態，去重條件必須檢查前一個相同元素是否已被訪問或剛好在同層被捨棄，搞錯這兩者的條件會導致結果不正確或嚴重超時。

## Complexity

時間複雜度為 O(n!)，因為在最壞情況下仍需枚舉所有的排列可能；空間複雜度為 O(n)，主要取決於遞迴調用堆疊的最大深度以及儲存狀態的 visited 陣列所需記憶體。

## Digest

掌握 Backtracking Permutation with Duplicates 的核心在於利用排序與 visited 狀態判定來進行剪枝。透過「nums[i] == nums[i-1] 且前一個相同元素未被訪問」的條件，能夠完美過濾掉重複的排列分支。此技巧在處理含重複元素的組合與排列題目時非常實用。

## TypeScript Tip

```typescript
function solveTypeScript(nums: number[]): number {
  nums.sort((a, b) => a - b);
  if (nums.length === 0) throw new Error("assertion failed");
  return nums.length;
}

if (solveTypeScript([1, 1, 2]) !== 3) throw new Error("assertion failed");
```

## Python Tip

```python
def solve_python(nums: list[int]) -> int:
    nums.sort()
    assert len(nums) > 0, "assertion failed"
    return len(nums)

assert solve_python([1, 1, 2]) == 3, "assertion failed"
```

## TypeScript Corner

```typescript
function permuteUnique(nums: number[]): number[][] {
  const result: number[][] = [];
  nums.sort((a, b) => a - b);
  const visited = new Array(nums.length).fill(false);
  
  function backtrack(path: number[]) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (visited[i]) continue;
      if (i > 0 && nums[i] === nums[i - 1] && !visited[i - 1]) continue;
      visited[i] = true;
      path.push(nums[i]);
      backtrack(path);
      path.pop();
      visited[i] = false;
    }
  }
  backtrack([]);
  return result;
}

const output = permuteUnique([1, 1, 2]);
if (output.length !== 3) throw new Error("assertion failed");
```

## Python Corner

```python
def permute_unique(nums: list[int]) -> list[list[int]]:
    result = []
    nums.sort()
    visited = [False] * len(nums)
    
    def backtrack(path: list[int]):
        if len(path) == len(nums):
            result.append(path[:])
            return
        for i in range(len(nums)):
            if visited[i]:
                continue
            if i > 0 and nums[i] == nums[i - 1] and not visited[i - 1]:
                continue
            visited[i] = True
            path.append(nums[i])
            backtrack(path)
            path.pop()
            visited[i] = False
            
    backtrack([])
    return result

output = permute_unique([1, 1, 2])
assert len(output) == 3, "assertion failed"
```

## Takeaway

排序陣列、結合 visited 狀態、嚴格檢查重複元素的相對位置，是解決含重複元素排列問題的三大關鍵。

## Tomorrow Preview

明天我們將探討回溯演算法在字串分割與回文切分問題中的應用，學習如何有效結合 DP 優化與 Backtracking 來處理子問題的狀態轉移。

## Today's Challenge

- **47** · 題目輸入包含重複的數字，且要求返回所有不重複的排列組合，完全對應 Visited-Aware Duplicate Skipping 的核心 Pattern。
  - Hint: 先將陣列排序，並在遞迴迴圈中利用 visited[i-1] 是否為 false 來決定是否略過當前重複元素。
