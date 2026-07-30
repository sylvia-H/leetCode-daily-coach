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

Two Pointers from Opposite Ends 是一種經典且高效率的陣列與字串處理技巧。其核心概念是利用兩個指標分別指向資料結構的起始端與末端（通常稱為 left 與 right），並根據特定的邏輯條件，讓兩個指標同步或交替地向中間靠攏，直到相遇或交錯為止。這種方法能將原本需要巢狀迴圈進行的暴力搜查（Time Complexity 為 O(n^2)）優化為單一迴圈的線性掃描（Time Complexity 為 O(n)），同時維持空間複雜度為 O(1)。在實際應用中，此技巧非常適合處理已排序陣列的數值配對、字串反轉、回文檢查等問題。透過雙指標的對向移動，我們得以在不額外消耗空間的前提下，精準捕捉目標元素。

## Thinking

在著手設計 Two Pointers from Opposite Ends 的演算法時，思考路徑通常遵循幾個固定步驟：首先，初始化兩個指標，左指標 left 設為陣列起始索引 0，右指標 right 設為陣列末端索引 n - 1。其次，確立迴圈的執行條件，通常為 while (left < right)，這確保了指標在相遇前會持續運作。在迴圈內部，根據當前 left 與 right 所指向的元素值與題目要求的條件進行比較。若條件達成，則記錄結果或執行相應操作；若未達成，則依據資料的單調性（例如已排序陣列）決定要將 left 往右移（增大總和或調整狀態）還是將 right 往左移（減小總和或調整狀態）。最後，當指標交錯或相遇時迴圈結束，返回最終結果。這種思維的核心在於利用資料的規律性來主動排除不可能的選項，從而大幅減少運算次數。

## Pattern Recognition

要辨識一個問題是否適合採用 Two Pointers from Opposite Ends，可以從幾個關鍵特徵著手：第一，題目給定的資料結構具備順序性，例如已排序的陣列（Sorted Array），或是具有對稱性質的結構如字串與陣列。第二，題目的目標往往涉及「尋找一對或多個元素」，其總和、差值、乘積符合某種特定條件，例如 Two Sum 的變體、三數之和等。第三，問題要求原地（In-place）修改或反轉資料，且不希望使用額外的記憶體空間。若你在題目中看到「已排序」、「尋找配對」、「兩端向內夾擠」、「回文」或「反轉」等關鍵字，且效能要求達到 O(n) 時間與 O(1) 空間，這幾乎就是 Two Pointers from Opposite Ends 的強烈訊號。

## Common Mistakes

開發者在實作 Two Pointers from Opposite Ends 時，最常犯的錯誤之一是迴圈終止條件設定錯誤。例如誤用 while (left <= right) 而非 while (left < right)，導致當 left 與 right 指向同一個元素時重複進行處理或引發邏輯衝突。另一個常見錯誤是在處理複雜條件（如去重或多重指標）時，指標的移動邏輯不夠嚴謹，導致某些邊界條件下的元素被漏掉，或者陷入無限迴圈。此外，未先確認輸入陣列是否已經排序就直接套用左右雙指標邏輯，也是新手常犯的盲點。最後，在處理元素交換時，若沒有妥善處理暫存變數或語言特有的語法，容易引發指標越界或資料覆蓋錯誤。

## Complexity

Time Complexity: O(n) - 左右指標從兩端出發，每次迴圈至少移動一個指標，最多遍歷陣列一次。Space Complexity: O(1) - 僅使用常數級別的額外變數來儲存指標位置，不隨輸入規模增長。

## Digest

Two Pointers from Opposite Ends 是一種高效率的演算法模式，專門用於處理已排序陣列或對稱結構的搜尋與配對問題。核心思想是利用 left 與 right 兩個指標從兩端向中央夾擠，將 O(n^2) 的暴力搜尋降為 O(n) 的線性掃描。實作時需注意迴圈終止條件必須是 left < right，以避免重複計算或指標交錯。在 TypeScript 與 Python 中，指標的移動與元素的交換都有極為簡潔的語法支援。透過掌握 LeetCode 344、977 與 15 等經典題型，你將能靈活運用此技巧解決各類數值與字串夾擠問題。

## TypeScript Tip

```typescript
function sortSquares(nums: number[]): number[] {
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
const res = sortSquares([-4, -1, 0, 3, 10]);
if (res[4] !== 100) throw new Error("assertion failed");
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
assert res[-1] == 100, "assertion failed"
```

## TypeScript Corner

```typescript
function reverseString(s: string[]): void {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    const temp = s[left];
    s[left] = s[right];
    s[right] = temp;
    left++;
    right--;
  }
}
const arr = ["h", "e", "l", "l", "o"];
reverseString(arr);
if (arr.join("") !== "olleh") throw new Error("assertion failed");
```

## Python Corner

```python
def reverse_string(s: list[str]) -> None:
    left, right = 0, len(s) - 1
    while left < right:
        s[left], s[right] = s[right], s[left]
        left += 1
        right -= 1

arr = ["h", "e", "l", "l", "o"]
reverse_string(arr)
assert "".join(arr) == "olleh", "assertion failed"
```

## Takeaway

左右雙指標從兩端向中間夾擠，是解決已排序陣列與對稱結構問題的利器，能將時間複雜度有效優化至線性等級。

## Tomorrow Preview

明天我們將探討 Two Pointers 的另一個重要變體：Same Direction Two Pointers（同向雙指標）。這個技巧通常用於陣列的原地移除、過濾、或尋找特定子陣列範圍，透過快慢指標的配合，同樣能達到極高的執行效率，敬請期待。

## Today's Challenge

- **344** · 字元陣列的反轉操作具備完美的對稱性，使用左右指標分別指向頭尾並進行元素交換，是最直接且符合 O(1) 空間限制的經典應用。
  - Hint: 初始化 left = 0 與 right = s.length - 1，在 while 迴圈中交換兩者字元並將指標向內移動。
- **977** · 已排序的含負數陣列在平方後，最大值必然落在陣列的最左端或最右端，利用雙指標從兩端比較並將較大值填入新陣列的尾端，完美契合此 Pattern。
  - Hint: 準備一個與原陣列等長的新陣列，用雙指標比較兩端平方值，從新陣列的最右側開始向前填入。
- **15** · 三數之和在陣列排序後，可以固定一個數，並利用左右雙指標在剩餘區間內尋找另外兩個數，將尋找配對的複雜度由立方降至平方。
  - Hint: 先將陣列排序，外層迴圈固定一個數字，內層使用左右雙指標向中間夾擠並注意略過重複元素。
