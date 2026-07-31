---
id: hash-table-longest-consecutive-sequence
title: Set-Based Sequence Building and Boundary Check
module: hash-table
pattern_label: Sequence Hash Set
complexity_label: O(n) / O(n)
estimated_minutes: 15
exit_criteria:
  - Can insert all array elements into a hash set
  - >-
    Can check if an element is the start of a sequence by verifying the absence
    of element - 1
---
## Concept

Set-Based Sequence Building and Boundary Check 是一種透過 Hash Set 在 O(n) 時間內尋找陣列中最長連續序列的演算法策略。在處理無序陣列的連續性問題時，傳統的排序方法需要 O(n log n) 時間，而利用 Hash Set 可以在 O(1) 的平均時間複雜度內完成元素存在性檢查。核心精神在於只從序列的起點開始計算長度，藉此避免重複走訪並確保整體時間複雜度維持在線性級別。

## Thinking

思考本題時，首先需要將所有陣列元素放入一個 Hash Set 中以提供 O(1) 的查詢效能。接著走訪 Hash Set 中的每個元素，判斷該元素是否為某個連續序列的起點。判斷方式為檢查該元素減去 1（num - 1）是否存在於 Set 中。若 num - 1 不存在，代表該元素是序列的開頭，此時便可透過一個內部迴圈不斷檢查 num + 1、num + 2 是否存在，並同步計算該連續序列的長度。若 num - 1 存在，則直接跳過該元素，因為它必然會在未來被包含在從起點出發的序列計算中。

## Pattern Recognition

當題目要求在未排序的陣列中尋找「最長連續元素序列」、「連續區間」或需要快速確認某個數值是否存在且要求時間複雜度優於 O(n log n) 時，即可辨識為 Sequence Hash Set Pattern。此 Pattern 的關鍵特徵在於利用 Set 的 O(1) 查找特性，並透過邊界檢查（Boundary Check）來過濾非起點元素，從而將暴力解法的 O(n^2) 降維至 O(n)。

## Common Mistakes

最常見的錯誤是未進行邊界檢查，直接對陣列中的每一個元素都啟動內部迴圈去向後計數。這會導致包含在其他序列內部的數字被重複作為起點計算，在最壞情況下（例如嚴格遞增陣列）會讓時間複雜度退化為 O(n^2)，無法通過高效能的測資。另一個錯誤是在 TypeScript 中直接對 Set 進行不合法的疊代操作或忽略了編譯器對目標環境的要求。

## Complexity

時間複雜度：O(n)。雖然有雙層迴圈的結構，但內部迴圈只會在當前元素是序列起點時才會觸發，且每個數字在整個執行過程中最多只會被訪問兩次（一次在主迴圈，一次在內部序列計數），因此總操作次數與 n 成正比。空間複雜度：O(n)。需要額外的 Hash Set 來儲存陣列中的所有唯一元素。

## Digest

本篇教材介紹了 Set-Based Sequence Building and Boundary Check 核心觀念。透過 Hash Set 儲存資料並藉由檢查 num - 1 是否存在來鎖定序列起點，我們成功將最長連續序列問題的時間複雜度壓制在 O(n)。文中詳細分析了為什麼這個邊界檢查能有效避免 O(n^2) 的效能陷阱，並提供了強型別的 TypeScript 與簡潔的 Python 實作範例。

## TypeScript Tip

```typescript
function checkDuplicate(nums: number[]): boolean {
 const seen = new Set<number>();
 for (const num of nums) {
 if (seen.has(num)) return true;
 seen.add(num);
 }
 if (checkDuplicate([1, 2, 3, 1]) !== true) throw new Error("assertion failed");
 return false;
}
checkDuplicate([1, 2, 3, 1]);
```

## Python Tip

```python
def check_duplicate(nums: list[int]) -> bool:
    seen = set()
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    assert check_duplicate([1, 2, 3, 1]) is True, "assertion failed"
    return False

check_duplicate([1, 2, 3, 1])
```

## TypeScript Corner

```typescript
function longestConsecutive(nums: number[]):
 number {
 if (nums.length === 0) return 0;
 const numSet = new Set<number>(nums);
 let longestStreak = 0;
 for (const num of Array.from(numSet)) {
 if (!numSet.has(num - 1)) {
 let currentNum = num;
 let currentStreak = 1;
 while (numSet.has(currentNum + 1)) {
 currentNum += 1;
 currentStreak += 1;
 }
 longestStreak = Math.max(longestStreak, currentStreak);
 }
 }
 if (longestStreak !== 4) throw new Error("assertion failed");
 return longestStreak;
}
const result = longestConsecutive([100, 4, 200, 1, 3, 2]);
console.log(result);
```

## Python Corner

```python
def longest_consecutive(nums: list[int]) -> int:
    if not nums:
        return 0
    num_set = set(nums)
    longest_streak = 0
    for num in num_set:
        if (num - 1) not in num_set:
            current_num = num
            current_streak = 1
            while (current_num + 1) in num_set:
                current_num += 1
                current_streak += 1
            longest_streak = max(longest_streak, current_streak)
    assert longest_streak == 4, "assertion failed"
    return longest_streak

result = longest_consecutive([100, 4, 200, 1, 3, 2])
print(result)
```

## Takeaway

利用 Hash Set 進行邊界檢查，只從序列起點開始計數，是達成 O(n) 連續序列搜尋的關鍵。

## Tomorrow Preview

明天的課程將進入 Two Pointers 與 Sliding Window 的進階應用，探討如何在維持線性時間複雜度的前提下處理字串或陣列的區間極值問題。

## Today's Challenge

- **128** · 本題為此 Pattern 的典型應用，要求在 O(n) 時間內找出無序陣列的最長連續序列，完全依賴 Set 查找與邊界檢查。
  - Hint: 將所有元素放入 Set，僅當 num - 1 不存在時才開始計算連續長度。
- **217** · 可用 Hash Set 快速檢驗元素是否重複，展示了 Set 資料結構在 O(n) 時間複雜度下的基本應用。
  - Hint: 利用 Set 的唯一性或在走訪時檢查元素是否已存在於 Set 中。
