---
id: backtracking-core-concept-introduction
title: Backtracking Core Concept Introduction
module: backtracking
pattern_label: Decision Tree Exploration
complexity_label: O(2^n) / O(n)
estimated_minutes: 15
exit_criteria:
  - Can explain the choice-explore-unchoose pattern.
  - Can trace how states are modified and restored.
---
## Concept

Backtracking 是一種透過遞迴尋找問題解答的演算法技術。它會逐步建構解答，每次只處理一個部分，並在任何時間點發現目前的解答無法滿足問題條件時，立即捨棄（回溯）該路徑。這種方法系統性地走訪隱含的決策樹，探索所有可能的解空間。

## Thinking

將問題視覺化為一棵樹，其中每個節點代表一個部分狀態（partial state），而樹枝則代表用來擴展狀態的合法選擇。當我們從根節點出發進行深度優先搜尋（DFS）時，核心的運作模式可以總結為三個步驟：選擇（choice）、探索（explore）以及取消選擇（unchoose）。在每一個決策點，我們做出選擇，遞迴深入下一層狀態，當遞迴返回時，必須撤銷該選擇，以恢復到原本的狀態，藉此確保後續的分支不會受到污染。

## Pattern Recognition

當問題要求找出所有可能的組合（combinations）、排列（permutations）、子集（subsets），或需要驗證是否存在任何一條路徑可以達到合法的組態時，即可辨識出應使用 Backtracking Pattern。這類問題通常無法透過單純的迴圈直接解決，必須透過窮舉與剪枝來尋找答案。

## Common Mistakes

最常見的錯誤是在遞迴呼叫返回後，忘記執行狀態的還原操作（即忘記 unchoose）。這會導致狀態在不同的分支之間發生混淆或累積錯誤，進而產生不正確的結果。此外，在傳遞陣列或物件時，若不小心傳遞了參考而未建立新的拷貝，也會導致全域狀態遭到破壞。

## Complexity

時間複雜度通常為 O(2^n) 或 O(n!)，取決於決策樹的寬度與深度；空間複雜度為 O(n)，主要由遞迴呼叫堆疊（call stack）的深度以及暫存目前路徑的記憶體空間所決定。

## Digest

Backtracking 核心在於 choice-explore-unchoose 的循環，透過隱含決策樹的 DFS 走訪尋找所有合法解。掌握狀態的修改與還原是避免污染的關鍵。

## TypeScript Tip

```typescript
function solve(nums: number[]): number[] {
  const path: number[] = [];
  path.push(nums[0]);
  const val = path.pop() ?? 0;
  if (val !== 1) throw new Error("assertion failed");
  return [val];
}
if (solve([1, 2])[0] !== 1) throw new Error("assertion failed");
```

## Python Tip

```python
def solve(nums: list[int]) -> list[int]:
    path = []
    path.append(nums[0])
    val = path.pop()
    assert val == 1, "assertion failed"
    return [val]

assert solve([1, 2]) == [1], "assertion failed"
```

## TypeScript Corner

```typescript
function backtrack(start: number, path: number[], nums: number[], result: number[][]): void {
  result.push([...path]);
  for (let i = start; i < nums.length; i++) {
    path.push(nums[i]);
    backtrack(i + 1, path, nums, result);
    path.pop();
  }
}
const res: number[][] = [];
backtrack(0, [], [1, 2], res);
if (res.length !== 4) throw new Error("assertion failed");
```

## Python Corner

```python
def backtrack(start: int, path: list[int], nums: list[int], result: list[list[int]]) -> None:
    result.append(list(path))
    for i in range(start, len(nums)):
        path.append(nums[i])
        backtrack(i + 1, path, nums, result)
        path.pop()

res = []
backtrack(0, [], [1, 2], res)
assert len(res) == 4, "assertion failed"
```

## Takeaway

Backtracking 本質是帶有狀態還原機制的 DFS，牢記 choice-explore-unchoose 即可破解多數組合搜尋問題。

## Tomorrow Preview

明天我們將探討 Backtracking 的進階應用與剪枝優化技巧（Pruning），學習如何在走訪決策樹的過程中提前排除無效分支，大幅提升程式執行效能。

## Today's Challenge

- **78** · Subsets 問題要求找出所有的子集，這需要針對每個元素做出「包含」或「不包含」的二元決策，剛好對應到 Backtracking 的決策樹模型。
  - Hint: 利用索引值記錄目前考慮到的元素位置，並在遞迴前後分別執行 push 與 pop 操作。
