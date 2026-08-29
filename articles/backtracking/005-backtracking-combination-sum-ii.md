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

Combination Sum II 的核心在於「元素僅能使用一次」以及「候選陣列中含有重複元素，但產出的組合必須唯一」。相較於 Combination Sum I，本問題增加了兩個約束條件：第一，每個數字在每個組合中只能被選用一次，因此遞迴時必須傳入下一索引 i + 1；第二，輸入陣列可能包含重複數值，若不進行處理，會產生重複的組合結果。為了解決重複問題，必須先對輸入陣列進行排序，並在同一遞迴層級中略過相鄰的重複元素，確保相同數值的元素不會在同一個位置重複展開搜尋。

## Thinking

思考這類問題時，首先要掌握 Backtracking 的三個核心要素：選擇、遞迴與撤銷選擇。因為要求得所有和為 target 的組合，我們使用一個暫存陣列記錄目前的組合路徑。當路徑總和等於 target 時，將其加入結果集；若總和超過 target，則提前終止搜尋。為了確保組合的唯一性，必須在遞迴前將輸入陣列排序。在迴圈遍歷候選元素時，若發現當前元素與前一個元素相同，且該元素並非當前遞迴層級的第一個選擇（即 i > start），則直接跳過此迴圈，以避免重複計算。

## Pattern Recognition

當題目要求在含有重複元素的集合中，找出所有「不重複」且符合特定總和（target）的組合，且每個元素只能使用一次時，這就是典型的 Unique Combination Sum Pattern。辨識線索包含：目標總和、元素不可重複使用、輸入陣列含重複值、輸出結果必須去重。此時必須聯想到「排序 + 層級去重（Level-skip Duplicate Check）+ 索引前進（i + 1）」的樣板架構。

## Common Mistakes

最常見的錯誤是混淆了 Combination Sum I 與 Combination Sum II 的使用規則。在 Combination Sum I 中，元素可以重複使用，因此遞迴時傳入的是 i；而在本題中元素只能使用一次，若錯誤傳入 i 會導致無限遞迴或重複選用。另一個常見錯誤是漏掉排序步驟，或是在遞迴中沒有正確實作同層級的重複略過條件（if (i > start && nums[i] === nums[i-1]) continue），導致最終結果包含重複的組合。

## Complexity

時間複雜度為 O(2^n)，其中 n 為候選陣列的長度，因為在最壞情況下，每個元素都有選取與不選取兩種狀態。空間複雜度為 O(n)，主要取決於遞迴呼叫堆疊的深度以及儲存當前路徑所需的空間。

## Digest

Combination Sum II 結合了目標總和追蹤與元素去重邏輯。核心在於：1. 排序輸入陣列以利剪枝與去重。2. 遞迴時傳入 i + 1 確保每個元素僅用一次。3. 透過 i > start 檢查同層級重複值並跳過，確保結果唯一。掌握此架構能輕鬆應對多數子集與組合類的去重問題。

## TypeScript Tip

```typescript
// TypeScript 提示：利用條件判斷與嚴格型別確保遞迴安全
function validateSum(nums: number[], target: number): boolean {
  const total = nums.reduce((acc, curr) => acc + curr, 0);
  return total <= target;
}
if (!validateSum([1, 2], 5)) throw new Error("Tip test failed");
```

## Python Tip

```python
# Python 提示：使用切片或列表操作維護狀態
def quick_check(nums: list[int]) -> bool:
    return all(x > 0 for x in nums)
assert quick_check([1, 2, 3]), "Tip test failed"
```

## Takeaway

排序為去重之本，i + 1 確保單次使用，層級剪枝杜絕重複組合。

## Tomorrow Preview

明天我們將探討經典的 Permutations 題型，學習當元素順序會影響結果時，如何利用狀態標記陣列（Used Array）來產生所有可能的排列組合。

## Today's Challenge

- **40** · 符合 Unique Combination Sum Pattern，必須在含有重複元素的候選陣列中找出所有不重複且總和等於 target 的組合，且每個元素僅能使用一次。
  - Hint: 記得先對陣列排序，並在迴圈中使用 i > start 檢查並略過相鄰的重複元素。
