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

Two Pointers from Opposite Ends（對向雙指標）是處理陣列與字串的經典技巧：左指標 left 從索引 0 出發、右指標 right 從索引 n - 1 出發，兩者依據題目條件逐步向中間靠攏，直到相遇或交錯為止。它的威力來自一個關鍵性質——**每比較一次兩端，就能安全地淘汰其中一端**。以已排序陣列找兩數之和為例：若 `nums[left] + nums[right]` 小於目標值，代表 `nums[left]` 即使配上目前範圍內最大的 `nums[right]` 都不夠大，那它配上範圍內任何其他元素更不可能達標，因此 left 可以放心右移、永不回頭。正是這個「淘汰有依據」的論證，讓原本需要巢狀迴圈枚舉所有配對的 O(n^2) 暴力解，降為每個元素最多被訪問一次的 O(n)。

## Thinking

實作骨架是：`left = 0`、`right = n - 1`，在 `while (left < right)` 迴圈中依條件擇一移動。每輪迭代比較兩端後三選一：符合目標就記錄答案（或交換元素）並移動指標；總和太小就 `left++`；太大就 `right--`。整個過程維持一條迴圈不變式：**若答案存在，必落在 [left, right] 區間內**——每次移動指標都附帶上面那個淘汰論證，保證丟掉的位置不可能是答案的一部分。終止條件要依語意選擇：找「一對元素」用 `left < right`，因為 left 與 right 指向同一元素時已無法構成一對；但若每個位置都要被處理（例如比較兩端平方值、由結果陣列尾端往前逐格回填），就必須用 `left <= right`，否則正中央那一格會被漏掉。

## Pattern Recognition

看到以下特徵時，優先考慮對向雙指標：一、題目涉及對稱性——反轉陣列或字串、回文檢查，左右位置天然成對；二、資料已排序（或可先排序），且要找滿足特定和、差或條件的元素配對，排序提供的單調性正是淘汰論證的依據；三、比較兩端的極端值就能決定指標往哪邊走，例如兩端平方值取大者、兩端高度取矮者。反過來說，若資料未排序又不能排序、或區間需要同向滑動，就不是這個 Pattern 的守備範圍。

## Common Mistakes

第一個常犯錯誤是迴圈條件一律寫 `<=`：在交換類題目中，left 與 right 相等時交換同一個元素雖無害卻多做一步，而在配對類題目中則會把「自己配自己」當成合法解。反之，回填類題目誤用 `<` 會漏掉正中央的元素——條件的選擇必須回到「相遇的那一格需不需要處理」來判斷。第二是遺漏排序前置條件：淘汰論證完全建立在單調性上，對未排序陣列移動指標形同瞎猜。第三是去重處理不完整：陣列含重複值時，找到一組解後必須讓指標跨過所有相同數值，否則會回報重複的組合。

## Complexity

時間複雜度為 O(n)：每輪迭代至少有一個指標向內移動一步，而兩指標合計的移動總量不超過 n，因此迴圈至多執行 n 輪。空間複雜度為 O(1)，全程只用到兩個指標與常數個暫存變數。

## Digest

對向雙指標讓 left 與 right 從兩端向中間夾擠，核心論證是：靠排序或對稱性保證「每次比較兩端就能安全淘汰一端」，因此每個元素最多被訪問一次，把 O(n^2) 的配對枚舉壓到 O(n) 時間、O(1) 空間。實作時掌握三件事：初始化在兩端；迴圈不變式「答案必在 [left, right] 內」；終止條件依「相遇那格要不要處理」選 `<` 或 `<=`。反轉、回文、有序配對搜尋都是它的主場。

## TypeScript Tip

以「已排序陣列的平方由大到小回填」為例：絕對值最大者必在兩端，從結果陣列尾端往前填。注意 `noUncheckedIndexedAccess` 下索引存取要用 `!` 收斂型別。

```typescript
import assert from "node:assert";
function sortedSquares(nums: number[]): number[] {
  const result = new Array<number>(nums.length);
  let left = 0;
  let right = nums.length - 1;
  for (let i = nums.length - 1; i >= 0; i--) {
    const l = nums[left]! ** 2;
    const r = nums[right]! ** 2;
    if (l > r) {
      result[i] = l;
      left++;
    } else {
      result[i] = r;
      right--;
    }
  }
  return result;
}
assert.deepStrictEqual(sortedSquares([-4, -1, 0, 3, 10]), [0, 1, 9, 16, 100]);
```

## Python Tip

同一題的 Python 寫法：`left, right = 0, len(nums) - 1` 的多重指派讓初始化一行完成，迴圈以索引 i 從尾端倒著走，天然對應「由大到小回填」。

```python
def sorted_squares(nums: list[int]) -> list[int]:
    result = [0] * len(nums)
    left, right = 0, len(nums) - 1
    for i in range(len(nums) - 1, -1, -1):
        lv, rv = nums[left] ** 2, nums[right] ** 2
        if lv > rv:
            result[i] = lv
            left += 1
        else:
            result[i] = rv
            right -= 1
    return result

assert sorted_squares([-4, -1, 0, 3, 10]) == [0, 1, 9, 16, 100]
```

## Takeaway

對向雙指標靠排序或對稱性保證「每次比較兩端就能安全淘汰一端」，以 O(n) 時間、O(1) 空間收斂到答案。

## Tomorrow Preview

明天進入 Sliding Window Fixed Size：改讓左右邊界保持固定間距、同向滑動，用 O(1) 的增量更新處理「固定長度 k 的子陣列」統計問題，是雙指標家族的另一個重要分支。

## Today's Challenge

- **344** · 字元陣列反轉具有完全對稱性：位置 i 與 n - 1 - i 天然成對，左右指標邊交換邊向內推進即可原地完成，是對向雙指標最直觀的應用。
  - Hint: left 與 right 交換字元後各自向內一步，left 與 right 相遇即停——正中央的字元不需要交換。
- **977** · 已排序但含負數的陣列平方後，最大值必落在最左或最右端，比較兩端平方值、從結果陣列尾端往前回填，正是「比較極端值決定指標移動」的示範。
  - Hint: 這題每個位置都要被填入，迴圈條件用 left <= right，否則會漏掉正中央的元素。
- **15** · 排序後固定一個數，剩下的就化為「有序陣列中找兩數之和」，左右指標依總和大小向內夾擠，並示範找到解後如何跨過重複值去重。
  - Hint: 外層固定 nums[i] 時若與前一個值相同直接跳過；內層找到解後，left 與 right 也要各自跨過相同數值。
