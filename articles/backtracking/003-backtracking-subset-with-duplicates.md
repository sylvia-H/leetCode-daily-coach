---
id: backtracking-subset-with-duplicates
title: Backtracking Subset with Duplicates
module: backtracking
pattern_label: Duplicate Skip Pattern
complexity_label: O(2^n) / O(n)
estimated_minutes: 20
exit_criteria:
  - >-
    Can correctly identify when an element is a duplicate within the same tree
    level.
  - Can implement sorting and skipping logic cleanly.
---
## Concept

Backtracking Subset with Duplicates 是處理含有重複元素的集合時，生成所有不重複子集的核心技術。當輸入陣列中包含重複數字，而題目要求輸出的子集不能重複時，若直接使用標準的 Backtracking 組合生成方式，會產生大量結構相同但元素來源索引不同的重複子集。為了根治這個問題，必須引入 Duplicate Skip Pattern，透過預先排序與同層級跳過機制（Duplicate Skip Pattern），確保相同的元素在同一個遞迴深度下只被選擇一次。

## Thinking

在設計帶有重複元素的 Subsets 演算法時，核心思考邏輯在於如何避免在同一層遞迴中重複使用數值相同的元素。首先必須將輸入陣列進行排序，使相同的元素緊鄰排列。在遞迴迴圈中迭代選擇元素時，檢查當前元素是否與前一個元素相同。若 `i > startIndex` 且 `nums[i] == nums[i-1]`，則代表此元素在當前層級已經被前一個相同的元素代表探索過了，因此可以直接跳過（continue）。這樣做能夠確保我們只會走訪「首次出現」該數值的路徑，從而精準地排除所有重複的子集分支。

## Pattern Recognition

當題目具備以下特徵時，即可明確辨識出應使用 Backtracking Subset with Duplicates Pattern：第一，輸入的陣列或集合包含重複的數字；第二，要求的輸出結果為所有可能的子集或組合，且結果集內部不能包含重複的組合（Unique Subsets）；第三，問題本質需要窮舉所有的選擇可能性，但又必須在生成過程中進行剪枝以去除對稱的重複狀態。

## Common Mistakes

最常見的錯誤是搞錯跳過重複元素的層級條件，將「同層級跳過」誤寫成「跨層級跳過」。如果在遞迴時錯誤地限制了不同深度的相同元素（例如限制整個分支不能包含重複值，而非僅限制同一個遞迴調用層級中的相鄰重複值），將會導致正確的合法多重實例子集（例如包含多個相同數值的子集，視題目要求而定）被錯誤地剪除。另一個常見錯誤是忘記在演算法啟動前對輸入陣列進行排序，導致相鄰元素判斷失效。

## Complexity

時間複雜度為 O(2^n)，其中 n 是輸入陣列的長度，因為在最壞情況下（所有元素皆不重複）會生成 2^n 個子集，且排序需要 O(n log n) 的時間。空間複雜度為 O(n)，主要取決於遞迴呼叫堆疊的最大深度以及儲存當前路徑所需的記憶體空間。

## Digest

本單元聚焦於 Backtracking Subset with Duplicates。當輸入集合包含重複元素而輸出結果不可重複時，必須透過排序與同層級跳過機制（Duplicate Skip Pattern）來避免生成對稱的重複子集。在 TypeScript 與 Python 的實作中，關鍵在於迴圈內透過 `i > startIndex` 檢查當前元素是否與前一個元素相等，若相等則跳過。此 Pattern 能有效將時間複雜度控制在 O(2^n)，並確保解題的正確性與效能。

## TypeScript Tip

```typescript
import assert from "node:assert";

function verifyUniqueSubsets(): void {
  const nums = [1, 2, 2];
  nums.sort((a, b) => a - b);
  const results = new Set<string>();
  
  function backtrack(start: number, current: number[]) {
    results.add(JSON.stringify(current));
    for (let i = start; i < nums.length; i++) {
      if (i > start && nums[i] === nums[i - 1]) continue;
      current.push(nums[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  assert.strictEqual(results.size, 6);
}

verifyUniqueSubsets();
```

## Python Tip

```python
import json

def verify_unique_subsets() -> None:
    nums = [1, 2, 2]
    nums.sort()
    results = set()
    
    def backtrack(start: int, current: list[int]) -> None:
        results.add(json.dumps(current))
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue
            current.append(nums[i])
            backtrack(i + 1, current)
            current.pop()
            
    backtrack(0, [])
    assert len(results) == 6

verify_unique_subsets()
```

## TypeScript Corner

```typescript
function subsetsWithDup(nums: number[]): number[][] {
  nums.sort((a, b) => a - b);
  const result: number[][] = [];
  
  function backtrack(startIndex: number, path: number[]): void {
    result.push([...path]);
    for (let i = startIndex; i < nums.length; i++) {
      if (i > startIndex && nums[i] === nums[i - 1]) {
        continue;
      }
      path.push(nums[i]);
      backtrack(i + 1, path);
      path.pop();
    }
  }
  
  backtrack(0, []);
  return result;
}

const res = subsetsWithDup([1, 2, 2]);
if (res.length !== 6) throw new Error("assertion failed");
```

## Python Corner

```python
def subsets_with_dup(nums: list[int]) -> list[list[int]]:
    nums.sort()
    result: list[list[int]] = []
    
    def backtrack(start_index: int, path: list[int]) -> None:
        result.append(path[:])
        for i in range(start_index, len(nums)):
            if i > start_index and nums[i] == nums[i - 1]:
                continue
            path.append(nums[i])
            backtrack(i + 1, path)
            path.pop()
            
    backtrack(0, [])
    return result

res = subsets_with_dup([1, 2, 2])
assert len(res) == 6, "assertion failed"
```

## Takeaway

排序陣列並在同層級迴圈中檢查 i > startIndex 且 nums[i] == nums[i-1]，是解決重複子集問題的黃金法則。

## Tomorrow Preview

明天我們將深入探討 Backtracking Combination Sum 系列的變化題型，學習如何在允許重複選取同一個元素的情況下求解特定總和，並掌握動態邊界與剪枝的最佳化技巧。

## Today's Challenge

- **90** · 題目要求尋找含有重複數字的整數集合的所有不重複子集，完美對應 Duplicate Skip Pattern 的核心應用場景。
  - Hint: 務必先對輸入陣列進行排序，並在遞迴迴圈中透過 i > startIndex 與 nums[i] == nums[i-1] 來正確略過同層重複分支。
