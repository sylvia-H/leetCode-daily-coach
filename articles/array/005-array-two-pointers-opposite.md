---
id: array-two-pointers-opposite
title: Two Pointers from Opposite Ends
module: array
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能清楚判斷指標相遇或交錯的迴圈終止條件
  - 能針對排序陣列或對稱結構進行指標移動
---
## Concept

Two Pointers from Opposite Ends 是一種經典的陣列與字串處理技巧，核心概念是利用左右兩個指標分別初始化在資料結構的兩端（通常為索引 0 與 n - 1），並依據特定邏輯讓兩者逐步向中間靠攏，直到彼此相遇或交錯。這種方法能夠將原本需要巢狀迴圈進行暴力搜尋的時間複雜度，有效降低至線性時間，特別適用於處理具有對稱性、反轉需求或已排序的序列問題。

## Thinking

在著手設計演算法時，首先應將左指標 left 設定為 0，右指標 right 設定為 n - 1。接著使用 while left < right 作為迴圈的終止條件，確保指標在相遇之前持續執行。在每次迭代中，依據題目條件評估左右指標所指向的元素：若符合目標則採取對應動作（例如記錄答案或進行元素交換），若未符合則根據排序性質或大小關係，決定移動左指標（left++）或右指標（right--）。這種單向收斂的特性確保了每個元素最多被訪問一次。

## Pattern Recognition

當題目具備以下特徵時，高度適宜採用 Two Pointers from Opposite Ends：第一，題目涉及陣列或字串的對稱性檢查、反轉操作；第二，資料結構已經過排序，且需要尋找符合特定和或差值的元素配對（如 Two Sum 的變體）；第三，透過比較兩端的極端值（如最大值與最小值）能夠明確指引指標移動的方向。

## Common Mistakes

最常見的錯誤是在設定迴圈條件時誤用 <= 替代 <，這會導致當 left 與 right 指向同一個元素時重複處理，甚至在某些邏輯中引發無限迴圈或陣列越界。另一個常見錯誤是未能在指標移動時正確處理邊界條件，或是在需要排序的題目中遺漏了先決條件，導致雙指標的移動方向失去了數學依據。

## Complexity

時間複雜度為 O(n)，因為左右指標在整個過程中最多遍歷陣列一次；空間複雜度為 O(1)，僅需常數級別的額外變數來儲存指標位置。

## Digest

本篇全面解析了 Two Pointers from Opposite Ends 的核心原理與應用場景。透過左右指標從兩端向中央夾擊的機制，我們能夠有效避開不必要的巢狀迴圈，將複雜度壓制在 O(n)。在實作時，務必嚴格掌握 while left < right 的終止條件，並根據題目需求精準控制指標的移動邏輯。無論是字串反轉、有序陣列的平方整理，或是複雜的數值組合搜尋，雙指標皆展現出極高的效能與簡潔性。掌握此 Pattern 後，將能奠定處理線性資料結構的扎實基礎。

## TypeScript Tip

```typescript
function sortedSquares(nums: number[]): number[] {
  const n = nums.length;
  const result = new Array(n);
  let left = 0;
  let right = n - 1;
  let index = n - 1;
  while (left <= right) {
    const leftVal = nums[left] ** 2;
    const rightVal = nums[right] ** 2;
    if (leftVal > rightVal) {
      result[index] = leftVal;
      left++;
    } else {
      result[index] = rightVal;
      right--;
    }
    index--;
  }
  return result;
}
const res = sortedSquares([-4, -1, 0, 3, 10]);
if (res[4] !== 100) throw new Error("Assertion failed");
```

## Python Tip

```python
def sorted_squares(nums: list[int]) -> list[int]:
    n = len(nums)
    result = [0] * n
    left, right = 0, n - 1
    index = n - 1
    while left <= right:
        left_val = nums[left] ** 2
        right_val = nums[right] ** 2
        if left_val > right_val:
            result[index] = left_val
            left += 1
        else:
            result[index] = right_val
            right -= 1
        index -= 1
    return result

res = sorted_squares([-4, -1, 0, 3, 10])
assert res[-1] == 100, "Assertion failed"
```

## Takeaway

左右雙指標以 O(n) 時間與 O(1) 空間化解對稱與排序搜尋難題，掌握相遇條件與指標移動是關鍵。

## Tomorrow Preview

明天的課程將進一步探討同向雙指標（Two Pointers in the Same Direction，又稱快慢指標 Fast and Slow Pointers），學習如何在單一掃描中處理陣列去重、移除指定元素以及尋找環狀結構等進階應用。

## Today's Challenge

- **344** · 字元陣列的反轉操作具有完全的對稱性，利用左右指標從頭尾兩端同時向內推進並交換元素，是最直觀且高效的對向雙指標應用。
  - Hint: 設定 left = 0 與 right = s.length - 1，在迴圈中交換兩者字元後讓 left 遞增、right 遞減。
- **977** · 已排序陣列經過平方後，絕對值最大的元素必然落在陣列的最左側或最右側，適合使用對向雙指標比較兩端大小，並從結果陣列的尾端向前填入。
  - Hint: 利用左右指標分別指向原陣列頭尾，比較平方值大小後將較大者填入新陣列的最後方，並移動對應指標。
- **15** · 三數之和在固定一個數字後，其餘兩個數字的尋找可轉化為已排序陣列中的兩數之和問題，利用雙指標從兩端向中間夾擠能有效找出所有不重複的組合。
  - Hint: 先將陣列排序，外層迴圈固定一個數，內層則利用左右雙指標在剩餘區間內尋找和為目標值的配對。
