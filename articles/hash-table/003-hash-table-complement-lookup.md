---
id: hash-table-complement-lookup
title: Complement Lookup for Pair Finding
module: hash-table
pattern_label: Complement Hash
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - 'Can identify the complement condition (e.g., target - current)'
  - Can retrieve past elements during a single linear scan
---
## Concept

Complement Lookup for Pair Finding 透過雜湊表補數查詢技巧，的核心在於尋找陣列或集合中是否包含兩個相加（或滿足特定數學關係）等於目標值的元素。相較於兩層迴圈帶來的 O(n^2) 時間複雜度，此技巧利用單次線性掃描搭配 Hash Map，在迭代的同時即時查詢當前元素的數學補數（Complement）是否已經存在於結構中。這種以空間換取時間的策略，是陣列搜尋與配對問題中最經典且高效的優化手段。

## Thinking

在處理兩數相加或尋找特定數值關係的題目時，直覺的暴力解法會使用雙重迴圈遍歷所有可能的組合。然而，這種做法在資料規模較大時效能會顯著劣化。透過 Complement Hash 的思維，我們可以將雙迴圈降維成單迴圈：當我們巡訪到陣列中的某個元素 current_value 時，所要尋找的另一半便由數學關係決定，例如在 Two Sum 中即為 target - current_value。此時，我們不需要預先將所有元素放入 Hash Map，而是邊遍歷、邊查詢、邊記錄，如此便能在 O(n) 的時間內捕捉到符合條件的數對。

## Pattern Recognition

當題目明確要求尋找兩個元素，其總和、差值或其他數學關係等於某個特定 target 時，通常就是 Complement Hash 的辨識線索。若題目允許重複使用元素或限制只能使用一次，則會影響 Hash Map 建立與查詢的先後順序。常見的特徵包含：尋找加總等於 target 的索引、計算符合特定條件的無序數對數量，或是處理陣列中具備對稱關係的數值尋找。

## Common Mistakes

最常見的錯誤是在迭代之前，就把所有的元素一口氣全部加入 Hash Map 中。這樣做會導致自我配對（Self-Matching）的問題，例如當 target 為 6 且陣列中剛好有一個 3 時，程式可能會誤判找到自己。另一個常見的迷思是誤用排序法搭配雙指標來處理本質上需要動態維護的 Hash Map 題目，忽略了空間複雜度與時間複雜度的取捨。

## Complexity

時間複雜度為 O(n)，因為我們僅需對資料進行單次線性掃描，且 Hash Map 的查詢與插入操作在平均情況下均為 O(1)。空間複雜度為 O(n)，用於在最壞情況下將所有元素及其索引或計數儲存在 Hash Map 中。

## Digest

Complement Lookup 是一種利用 Hash Map 進行 O(n) 單次線性掃描的經典解題技巧。核心概念在於當遍歷至當前元素時，立即計算其數學補數並檢查是否已存在於雜湊表中。這能有效避免雙層迴圈帶來的效能瓶頸。實作時務必注意『先查詢、後寫入』的順序，以防範元素與自身配對的盲點。

## TypeScript Tip

```typescript
function checkComplement(nums: number[], target: number): boolean {
  const seen = new Set<number>();
  for (const num of nums) {
    const complement = target - num;
    if (seen.has(complement)) {
      return true;
    }
    seen.add(num);
  }
  return false;
}
if (!checkComplement([1, 2, 3, 4], 7)) throw new Error("assertion failed");
```

## Python Tip

```python
def check_complement(nums: list[int], target: int) -> bool:
    seen = set()
    for num in nums:
        complement = target - num
        if complement in seen:
            return True
        seen.add(num)
    return False

assert check_complement([1, 2, 3, 4], 7) is True, "assertion failed"
```

## Takeaway

掌握 Complement Hash 的『邊遍歷邊查詢』原則，用 O(n) 時間與空間換取高效能，杜絕自我配對。

## Tomorrow Preview

明天我們將探討 Sliding Window 技巧，學習如何在連續子陣列或子字串的問題中維持動態視窗，進一步優化連續區間的求解效能。

## Today's Challenge

- **1** · 需要在一維陣列中尋找兩個數值相加等於給定 target 的元素索引，完全符合 Complement Hash 的單次線性掃描與補數查詢特徵。
  - Hint: 在迴圈中先計算 target - nums[i]，檢查 Map 內是否存在該補數，若無再將當前元素與索引存入 Map。
- **1679** · 要求找出陣列中總和等於 k 且互不重複的最大數對數量，可以使用類似頻率統計的 Hash Map 補數查詢來動態匹配。
  - Hint: 維護每個數值的剩餘次數，當遇到補數且次數大於零時即可成對，否則將當前數值的計數加一。
