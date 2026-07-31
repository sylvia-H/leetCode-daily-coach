---
id: backtracking-permutation-basics
title: Backtracking Permutation Basics
module: backtracking
pattern_label: State Tracking Permutation
complexity_label: O(n!) / O(n)
estimated_minutes: 20
exit_criteria:
  - >-
    Can use a visited array or set to track which elements are currently
    included in the path.
  - Can generate all n! permutations.
---
## Concept

在排列（Permutation）問題中，元素的順序至關重要。與子集（Subset）問題不同，子集問題透過索引的推進來避免重複計算，而排列問題在每一個位置都可以從整個陣列中挑選任何尚未被訪問過的元素。因此，對於長度為 n 的陣列，我們需要產生總共 n! 種不同的排列組合。透過狀態追蹤（State Tracking），我們在遞迴過程中記錄哪些元素已經被使用過，確保每個元素在單一路徑中只被使用一次，並在回溯時正確重置狀態，以探索其他可能的排列順序。

## Thinking

當我們在建構排列時，我們無法像子集問題那樣單純依賴一個 start 索引來向前推進，因為順序不同會被視為不同的解（例如 [1, 2] 與 [2, 1]）。因此，在每一層遞迴中，我們都必須從陣列的第一個元素開始掃描，並透過一個布林陣列 visited 來標記當前路徑中哪些元素已經被選用。如果該元素已經被訪問過，我們就跳過它；如果尚未被訪問，我們就將其加入當前路徑，將其 visited 狀態設為 true，並遞迴進入下一層。當路徑長度等於原陣列長度時，代表找到一個完整的排列，將其加入結果集中。遞迴結束後，必須進行回溯（Backtracking），將元素從路徑中移除，並把 visited 狀態恢復為 false，以便後續的迴圈使用。

## Pattern Recognition

當題目要求尋找一個集合的所有可能排列順序（Permutations）、所有可能的安排方式，或是當順序會影響最終結果時，這就是典型的 State Tracking Permutation 模式。辨識的關鍵線索在於：輸出結果的數量通常為階乘級別（n!），且每個子組合都需要包含原集合中的所有元素，只是順序互異。相較於組合（Combination）或子集（Subset）問題只關注選取的元素本身，排列問題更關注元素被選取的先後順序。

## Common Mistakes

最常見的錯誤是在遞迴返回時，忘記重置 visited 標記或是忘記將元素從當前暫存路徑中彈出（Pop）。在回溯演算法中，狀態的「選擇」與「取消選擇」必須完全對稱；如果遺漏了取消選擇的步驟，visited 陣列將會永久保留錯誤的狀態，導致後續的遞迴路徑無法正確存取這些元素，進而產生不完整或甚至空白的結果集。

## Complexity

時間複雜度為 O(n!)，因為長度為 n 的相異元素總共有 n! 種排列組合，我們必須走訪每一種可能。空間複雜度為 O(n)，主要取決於遞迴呼叫堆疊（Call Stack）的最大深度以及儲存當前路徑與 visited 陣列所需的額外空間。

## Digest

本單元探討 Backtracking Permutation Basics。在處理排列問題時，順序至關重要，我們無法像子集問題那樣只靠索引向前推進。演算法核心在於每一層遞迴都從頭掃描陣列，並使用 visited 陣列追蹤哪些元素已被使用。透過嚴謹的狀態選擇與回溯重置，我們能夠產生所有 n! 種可能的排列組合。掌握這個基礎模式，是解決更複雜的回溯與剪枝題目的重要基石。

## TypeScript Tip

```typescript
function permuteTip(nums: number[]): number[][] {
  const res: number[][] = [];
  const visited = new Set<number>();

  function dfs(path: number[]) {
    if (path.length === nums.length) {
      res.push([...path]);
      return;
    }
    for (const num of nums) {
      if (visited.has(num)) continue;
      visited.add(num);
      path.push(num);
      dfs(path);
      path.pop();
      visited.delete(num);
    }
  }

  dfs([]);
  return res;
}

if (permuteTip([1]).length !== 1) throw new Error("Tip test failed");
```

## Python Tip

```python
def permute_tip(nums: list[int]) -> list[list[int]]:
    import itertools
    # 驗證觀念的標準庫實作對比
    res = [list(p) for p in itertools.permutations(nums)]
    assert len(res) == len(nums) * (len(nums) - 1) or len(nums) <= 1
    return res

assert len(permute_tip([1, 2])) == 2, "Tip test failed"
```

## TypeScript Corner

```typescript
function permute(nums: number[]): number[][] {
  const result: number[][] = [];
  const visited: boolean[] = new Array(nums.length).fill(false);
  
  function backtrack(path: number[]) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (visited[i]) continue;
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

const output = permute([1, 2]);
if (output.length !== 2) throw new Error("Assertion failed");
```

## Python Corner

```python
def permute(nums: list[int]) -> list[list[int]]:
    result = []
    visited = [False] * len(nums)
    
    def backtrack(path: list[int]):
        if len(path) == len(nums):
            result.append(path[:])
            return
        for i in range(len(nums)):
            if visited[i]:
                continue
            visited[i] = True
            path.append(nums[i])
            backtrack(path)
            path.pop()
            visited[i] = False
            
    backtrack([])
    return result

output = permute([1, 2])
assert len(output) == 2, "Assertion failed"
```

## Takeaway

排列問題重順序，visited 狀態追蹤不可少；遞迴選取要重置，階乘複雜度記心頭。

## Tomorrow Preview

明天我們將探討「Permutations II」，學習當輸入陣列中包含重複元素時，如何透過適當的排序與剪枝條件（Pruning）來避免產生重複的排列結果，進一步提升回溯演算法的效率。

## Today's Challenge

- **46** · 此題要求給定一個沒有重複數字的陣列，返回其所有可能的排列組合，完全符合 State Tracking Permutation 的核心定義。
  - Hint: 利用長度與 nums 相同的 visited 陣列來記錄每個元素在當前路徑中是否已被選取。
