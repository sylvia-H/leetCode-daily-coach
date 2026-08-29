---
id: binary-search-inclusive-bounds
title: Binary Search Inclusive Bounds
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能為閉區間正確初始化指標。
  - 能使用正確的終止條件。
---
## Concept

上一課的結尾留了一句話：**區間定義、迴圈條件、更新方式三者必須成套**。今天把第一套慣例——閉區間 `[left, right]`——練到反射級。閉區間的意思是兩端都算數：left 與 right 都指向「還沒被檢查、仍可能是答案」的真實元素。整套寫法都從這一句不變式推出來。初始化 `left = 0`、`right = n - 1`：兩端都是有效索引，恰好讓「target 若存在，必在此區間內」涵蓋全陣列。迴圈條件 `while (left <= right)`：這不是背出來的，它是「閉區間非空」的直譯——`[left, right]` 只要 left 不超過 right 就至少含一個元素，等號成立時恰剩一個。更新方式 `left = mid + 1` 或 `right = mid - 1`：mid 這一輪已經比較過、確定不是答案，必須踢出區間。三行程式碼不用背，背的是那句不變式；不變式在，三行就推得出來。

## Thinking

上一課結尾預告的三個問題，逐一回答。第一，`<=` 的等號為何不能少？left == right 時，區間恰好還剩一個未檢查的候選；寫成 `<` 等於在還有候選時提前退場。反例沿用上一課的：`nums = [5]` 找 5——left = right = 0，`left < right` 不成立，迴圈一次都沒跑就回 -1，目標明明就在眼前。這不是單元素陣列的特例：任何搜尋只要收斂到最後一格都會踩到——`nums = [1, 3, 5]` 找 5，left 推進到 2 與 right 重合，用 `<` 就漏驗 `nums[2]`。第二，區間縮到單一元素時發生什麼事？mid == left == right，三向比較後只有兩種結局：命中回傳，或 left 變成 right + 1（或 right 變成 left - 1），區間變空、迴圈自然結束。第三，終止時 left 與 right 停在哪？兩者交錯：left == right + 1。而且 left 有明確語意——此刻 left 左邊的元素全都小於 target、right 右邊的全都大於 target，所以 left 正是 target 該插入的位置。這個位置之後的課會大量使用。

## Pattern Recognition

閉區間這一套最順手的場景：找確切目標、找到就能立刻回傳——三向比較裡有 `return mid` 這個提前出口，跟「兩端都是候選、逐步排除」的語意天生匹配。訊號：已排序陣列，問「存在嗎、在哪裡」。找邊界的題（目標值的起訖位置）閉區間也做得到：命中時不停手，記下位置後繼續往同一側收縮。反過來，若題目要的是「第一個滿足條件的位置」、且答案可能落在陣列外一格，另一套半開區間慣例會更自然——之後的課再對照。

## Common Mistakes

一、閉區間配 `left < right`：漏驗最後一格，`nums = [5]` 找 5 錯回 -1。等號是閉區間定義的一部分，不是可有可無的裝飾。二、更新寫成 `left = mid` 或 `right = mid`：mid 沒被踢出區間，剩一格時 mid == left，原地踏步成無窮迴圈——`nums = [5]` 找 7 就掛。三、right 初始化成 n：閉區間右端必須是真實索引 n - 1；設成 n，當 target 大於所有元素時 left 會推進到 n，等號讓迴圈再跑一輪、mid 算到 n——`nums[n]` 在 Python 直接 IndexError；在 JavaScript 則讀到 undefined，任何比較都是 false、只會走 `right = mid - 1`，多白跑幾輪後答案仍正確。一個直接爆、一個安靜做白工——失效形式不同，但兩種都不該寫出來。四、混搭：從別套慣例撿來半句，`right = n` 配 `<=`、或 `mid ± 1` 配 `<`。判準永遠一樣：先寫下你的區間定義，其餘兩件由它推出，成套採用、成套更換。

## Complexity

時間 O(log n)：每輪比較一次、區間至少砍半，10 億筆約 30 次比較（第一課算過這筆帳）。等號讓迴圈在最後一格多跑一輪，那只是常數一次比較，量級不變。空間 O(1)：迭代版只用 left、right、mid 三個變數。

## Digest

閉區間成套三件組：`left = 0`、`right = n - 1`｜`while (left <= right)`｜`left = mid + 1` / `right = mid - 1`——全部由不變式「target 若存在必在 [left, right] 內、兩端皆候選」推出。等號守住最後一格：`nums = [5]` 找 5，left = right = 0，等號讓迴圈跑這最後一輪、命中回 0；寫 `<` 就錯回 -1。終止時 left == right + 1 交錯，且 left 恰是 target 的插入點：`nums = [1, 3, 5]` 找 4，left 推到 2、right 收到 1，迴圈結束，4 就該插在索引 2。

## TypeScript Tip

閉區間也能找邊界：命中不停手，記下位置後把 right 收到 mid - 1，繼續向左逼出第一次出現的位置。

```typescript
import assert from "node:assert";

function findFirst(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  let found = -1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const value = nums[mid]!;
    if (value === target) {
      found = mid;
      right = mid - 1; // 命中不停手，繼續向左逼
    } else if (value < target) left = mid + 1;
    else right = mid - 1;
  }
  return found;
}

const nums = [1, 2, 2, 2, 3];
assert.strictEqual(findFirst(nums, 2), 1);
assert.strictEqual(findFirst(nums, 3), 4); // 目標在右邊界
assert.strictEqual(findFirst([5], 5), 0); // 最後一格靠等號守住
assert.strictEqual(findFirst(nums, 4), -1);
```

## Python Tip

迴圈結束時 left == right + 1，且 left 就是插入點——把它一併回傳，親手驗證終止狀態的語意。

```python
def search(nums: list[int], target: int) -> tuple[int, int]:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid, mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1, left  # 沒找到：left 停在插入點，right 停在 left - 1

assert search([1, 3, 5], 5) == (2, 2)
assert search([1, 3, 5], 4) == (-1, 2)  # 4 應插在索引 2
assert search([1, 3, 5], 0) == (-1, 0)  # 比所有元素小，插在開頭
assert search([1, 3, 5], 7) == (-1, 3)  # 比所有元素大，插在結尾 n
assert search([5], 5) == (0, 0)
```

## Takeaway

閉區間成套：right = n - 1、`left <= right`、mid ± 1；等號守住最後一格，終止時 left == right + 1。

## Tomorrow Preview

明天處理 mid 計算的隱患：在固定寬度整數的語言裡，`left + right` 這一步可能溢位。學會 `left + (right - left) / 2` 的防溢位寫法，弄清楚它為何數學等價、哪些場景是真風險。

## Today's Challenge

- **704** · 標準已排序陣列找目標值，今天的閉區間三件組原樣落地，練到不用思考就寫對。
  - Hint: right = n - 1、`while (left <= right)`、mid ± 1 收縮；出迴圈即可斷言不存在，回 -1。
- **34** · 找目標的起訖位置：閉區間也能找邊界——命中不停手，記錄後繼續向同側收縮。
  - Hint: 跑兩次：找左界時命中仍收 right = mid - 1，找右界時命中仍推 left = mid + 1，各自記下最後一次命中；全程未命中回 [-1, -1]。
