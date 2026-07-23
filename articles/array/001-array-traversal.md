<!-- F5 stub fixture Article：F7 內容產線上線後由生成物取代（FR-027、research R8） -->
---
id: array-traversal
title: Array Traversal
module: array
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
estimated_minutes: 12
exit_criteria:
  - 能用一次迴圈求極值 / 總和
  - 能說明為何是 O(n)
---

## Concept

線性走訪（Linear Scan）是最基本的陣列操作模式：從頭到尾走過每個元素一次，邊走邊維護一個累積狀態
（總和、最大值、出現次數……）。幾乎所有陣列題型都是從這個基礎上疊加技巧。

## Thinking

走訪時心裡要清楚兩件事：這一輪要「讀」哪個元素，以及要「更新」哪個累積變數。只要能想清楚這兩點，
線性走訪幾乎不會出錯。

## Pattern Recognition

題目要求「找出最大 / 最小值」「計算總和 / 平均」「數出符合條件的元素個數」，且不要求排序或配對，
通常一次線性走訪就能解決，時間複雜度 `O(n)`。

## Common Mistakes

常見錯誤是把累積變數的初始值設錯（例如求最大值卻從 0 開始，遇到全負數陣列就出錯），或是在迴圈內
不小心又巢狀走訪一次陣列，把 `O(n)` 意外寫成 `O(n^2)`。

## Complexity

單一迴圈走訪 n 個元素，時間複雜度 `O(n)`；只用固定數量的變數記錄狀態，額外空間 `O(1)`。

## Digest

線性走訪：用一次迴圈從頭到尾看過陣列，邊走邊更新一個或多個累積變數。時間 `O(n)`、空間 `O(1)`。
這是後續 Two Pointer、Sliding Window 等技巧的共同基礎。

## TypeScript Tip

```typescript
function maxOf(nums: number[]): number {
  let max = nums[0]!;
  for (const x of nums) {
    if (x > max) max = x;
  }
  return max;
}
```

## Python Tip

```python
def max_of(nums: list[int]) -> int:
    best = nums[0]
    for x in nums:
        if x > best:
            best = x
    return best
```

## TypeScript Corner

```typescript
function removeDuplicatesFromSorted(nums: number[]): number {
  if (nums.length === 0) return 0;
  let writeIndex = 1;
  for (let readIndex = 1; readIndex < nums.length; readIndex++) {
    if (nums[readIndex] !== nums[writeIndex - 1]) {
      nums[writeIndex] = nums[readIndex]!;
      writeIndex++;
    }
  }
  return writeIndex;
}
```

這裡已經預告了下一課「就地操作」的寫入指標（write pointer）概念，但本課只需專注於「走訪」本身。

## Python Corner

```python
def remove_duplicates_from_sorted(nums: list[int]) -> int:
    if not nums:
        return 0
    write_index = 1
    for read_index in range(1, len(nums)):
        if nums[read_index] != nums[write_index - 1]:
            nums[write_index] = nums[read_index]
            write_index += 1
    return write_index
```

## Takeaway

一次迴圈、邊走邊記，是所有陣列技巧的起點。

## Tomorrow Preview

明天進入 In-place Operations：學會用「寫入指標」在原陣列上就地修改，不額外配置空間。

## Today's Challenge

- **1** · 最經典的線性走訪暖身題：邊走訪邊用雜湊表記錄「還差多少會湊到 target」，一次掃完。
  - Hint: 走訪到每個元素時，先查表再插入，可以避免用到同一個元素兩次。
- **26** · 陣列已排序，重複元素必定相鄰，一次走訪配合寫入指標就能去除重複。
  - Hint: 讀取指標往前走，寫入指標只在遇到新數值時才前進。
- **27** · 走訪陣列並判斷每個元素是否等於目標值，決定要不要保留，是線性走訪的直接應用。
  - Hint: 想想如何只用一次走訪同時完成「檢查」與「覆寫」。
