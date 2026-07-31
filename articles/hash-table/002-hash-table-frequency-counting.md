---
id: hash-table-frequency-counting
title: Frequency Counting with Hash Map
module: hash-table
pattern_label: Frequency Map
complexity_label: O(n) / O(n)
estimated_minutes: 10
exit_criteria:
  - Can build a frequency map from an array
  - Can iterate through map entries to find maximum or matching frequencies
---
## Concept

Frequency Counting with Hash Map 是一種透過雜湊表（Hash Map）來統計資料集合中各元素出現次數的核心演算法技巧。在處理陣列、字串或清單時，我們常需要得知特定元素出現了幾次，藉此判斷是否重複、尋找最常出現的元素，或是驗證數量是否符合特定條件。透過將元素作為鍵（Key）、出現次數作為值（Value），我們能在常數時間內完成頻率的查詢與更新，將原本可能需要平方級時間的暴力解法降至線性時間。

## Thinking

當面臨需要計算、比較或統計集合中元素數量的問題時，我們的思考流程應直接導向 Frequency Map。首先，初始化一個空的雜湊表來記錄各元素的對應次數。接著，遍歷整個資料集合一次；在每次迭代中，檢查當前元素是否已存在於雜湊表中。若尚未存在，則將其設為初始計數（通常為 1）；若已存在，則將其計數遞增。遍歷結束後，這個雜湊表即完整包含了所有元素的出現頻率分佈，後續只需針對此雜湊表進行迴圈檢索或條件判斷即可解決問題。

## Pattern Recognition

辨識此 Pattern 的關鍵線索在於題目敘述中出現尋找重複項目、計算出現次數、判斷是否包含足夠數量的字元，或是尋找頻率最高、唯一出現的元素。例如題目要求「找出第一個不重複的字元」、「檢查字串 A 是否能由字串 B 的字元組成」，或是「依據元素出現頻率進行排序」，這些情境皆高度契合 Frequency Map 的應用場景。

## Common Mistakes

最常見的錯誤在於處理新鍵值時，忘記正確初始化計數為 0 或 1。在許多程式語言中，直接對未定義的鍵進行數值遞增會導致型別錯誤（如 undefined 加上數字變成 NaN）。此外，開發者常在遍歷雜湊表時同時修改其結構，導致迭代器失效或邏輯錯亂。另一個常見盲點是忽略了大寫與小寫字母或特殊字元的差異，導致計數結果不準確。

## Complexity

Time Complexity: O(n)，其中 n 為資料集合的長度，因為我們只需完整遍歷集合一次即可建立完整的頻率對映，雜湊表的鍵值插入與查找在平均狀況下皆為 O(1) 時間。Space Complexity: O(u)，其中 u 為集合中唯一元素的數量，用以儲存雜湊表的鍵值對。

## Digest

Frequency Counting with Hash Map 是處理計數與頻率統計問題的基石。核心概念是利用雜湊表將元素映射至其出現次數。透過單次遍歷集合並動態更新計數，我們能將時間複雜度優化至 O(n)。在 TypeScript 中，需注意使用 map.get(key) || 0 來防範未初始化造成的 NaN 問題；在 Python 中則可直接運用 collections.Counter 簡化程式碼。此 Pattern 廣泛應用於字串檢索、驗證與排序等各類 LeetCode 題目中。

## TypeScript Tip

```typescript
function getCharFrequency(s: string): Map<string, number> {
  const freq = new Map<string, number>();
  for (const char of s) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  return freq;
}
const freqMap = getCharFrequency("leetcode");
if (freqMap.get("e") !== 3) throw new Error("assertion failed");
```

## Python Tip

```python
from collections import Counter

def get_char_frequency(s: str) -> Counter:
    return Counter(s)

freq_map = get_char_frequency("leetcode")
assert freq_map["e"] == 3, "assertion failed"
```

## TypeScript Corner

```typescript
function countFrequencies(nums: number[]): Map<number, number> {
  const freqMap = new Map<number, number>();
  for (const num of nums) {
    freqMap.set(num, (freqMap.get(num) || 0) + 1);
  }
  return freqMap;
}
const result = countFrequencies([1, 2, 2, 3, 3, 3]);
if (result.get(3) !== 3) throw new Error("assertion failed");
```

## Python Corner

```python
from collections import Counter

def count_frequencies(nums: list[int]) -> dict[int, int]:
    return dict(Counter(nums))

result = count_frequencies([1, 2, 2, 3, 3, 3])
assert result[3] == 3, "assertion failed"
```

## Takeaway

以元素為鍵、次數為值建立雜湊表，單次遍歷即可完成 O(n) 的高效頻率統計。

## Tomorrow Preview

明天我們將探討 Two Pointers Pattern，學習如何在排序或未排序陣列中利用雙指標移動來有效降低搜尋與配對的時間複雜度。

## Today's Challenge

- **387** · 必須先統計字串中每個字元的出現頻率，才能找出第一個頻率為 1 的唯一字元。
  - Hint: 建立頻率雜湊表後，再次遍歷字串並檢查第一個計數為 1 的字元索引。
- **383** · 需統計 magazine 中的可用字元頻率，並與 ransomNote 所需的字元數量進行比對。
  - Hint: 統計 magazine 頻率後，逐一扣除 ransomNote 的字元需求，若小於 0 則代表無法組成。
- **451** · 透過頻率雜湊表統計字元出現次數後，必須依據頻率數值進行降序排序與重建字串。
  - Hint: 建立頻率對映後，將字元依據對應的次數排序並重新組合成結果字串。
