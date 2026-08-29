---
id: backtracking-subset-generation
title: Backtracking Subset Generation
module: backtracking
pattern_label: Include/Exclude Choice Pattern
complexity_label: O(2^n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 能寫出子集生成的遞迴函式，且不遺漏任何組合。
  - 能在每個節點或葉節點正確收集結果。
---
## Concept

Backtracking Subset Generation 是一種用於找出集合所有可能子集的核心演算法架構。在此模式中，我們透過遞迴遍歷每一個元素，並在每個節點對當前元素做出二元選擇：包含（Include）或排除（Exclude）。藉由這種系統性的決策樹展開，我們能夠窮舉出長度從零到整數陣列長度的所有組合，形成完整的 Power Set。

## Thinking

在設計 Backtracking Subset Generation 的思考流程時，我們將狀態表示為一個遞迴函式。該函式接收目前的索引位置 index 與已選擇的路徑 path。在每一個遞迴層級中，我們有兩種主要的分支選擇：第一種是選擇將目前的元素加入 path 中，並遞迴處理下一個索引；第二種是將該元素從 path 中移除（即回溯），並跳過該元素遞迴處理下一個索引。另一種常見的實作觀點則是從當前索引開始，向後迭代選擇每一個未被造訪的元素作為子集的延伸，這種增量式組合建構同樣符合 Include/Exclude 的本質。

## Pattern Recognition

當題目要求列出給定集合的「所有子集」、「冪集」或任何不限長度、允許空集合且需蒐集所有有效組合的搜尋問題時，通常可以辨識出這是 Backtracking Subset Generation 的套用情境。其特徵在於輸出結果的數量通常為指數級規模 O(2^n)，且決策樹的深度對應至輸入陣列的大小 n。

## Common Mistakes

最常見的錯誤是在將暫時路徑 path 收集至結果陣列時，直接傳入了原始的參考，而非建立新的複本。由於 JavaScript 與 Python 的陣列都是透過參考傳遞，當遞迴不斷進行與回溯時，原本已經加入結果的陣列會因為後續的 pop 或 mutate 操作而被污染，導致最終輸出結果中所有的子集都變成空陣列或不正確的重複狀態。

## Complexity

時間複雜度為 O(2^n * n)，其中 2^n 代表總共有 2^n 個子集需要生成，而每次將子集複製到結果集所需的時間為 O(n)。空間複雜度為 O(n)，主要取決於遞迴呼叫堆疊的最大深度以及儲存當前路徑所需的暫時空間。

## Digest

Backtracking Subset Generation 透過 Include/Exclude 的決策邏輯，系統性地探索集合的所有子集。掌握遞迴樹的展開、狀態的正確恢復（回溯），以及在節點處正確複製資料結構，是解開這類問題的關鍵。

## TypeScript Tip

```typescript
function subsetsTip(nums: number[]): number[][] {
  const res: number[][] = [];
  const path: number[] = [];
  function dfs(index: number) {
    if (index === nums.length) {
      res.push([...path]);
      return;
    }
    path.push(nums[index]);
    dfs(index + 1);
    path.pop();
    dfs(index + 1);
  }
  dfs(0);
  if (res.length !== 2) throw new Error("assertion failed");
  return res;
}
subsetsTip([1]);
```

## Python Tip

```python
def subsets_tip(nums: list[int]) -> list[list[int]]:
    res = []
    path = []
    def dfs(index: int):
        if index == len(nums):
            res.append(list(path))
            return
        path.append(nums[index])
        dfs(index + 1)
        path.pop()
        dfs(index + 1)
    dfs(0)
    assert len(res) == 2, "assertion failed"
    return res
subsets_tip([1])
```

## Takeaway

透過二元選擇與狀態復原，掌握子集生成的遞迴框架，並切記蒐集結果時務必建立陣列複本。

## Tomorrow Preview

明天我們將探討 Permutations（排列問題），學習當元素的順序影響結果時，如何利用狀態標記陣列或交換法來生成所有可能的排列組合。

## Today's Challenge

- **78** · 標準的 Subsets 問題，完美對應每個元素要或不要加入子集的 Include/Exclude 選擇模式。
  - Hint: 在每個遞迴層級中，將當前路徑加入結果，並向後巡訪所有可能的起始點。
- **90** · 包含重複元素的子集生成問題，需要在基礎的 Backtracking 框架上加入排序與略過相同元素的剪枝邏輯。
  - Hint: 先將陣列排序，若發現當前元素與前一個元素相同且前一個元素未被選取，則跳過以避免重複結果。
