---
id: binary-search-core-concept
title: Binary Search Core Concept
module: binary-search
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
estimated_minutes: 15
exit_criteria:
  - Can explain why time complexity is logarithmic.
  - Can identify sorted array precondition.
---
## Concept

Binary Search 解決的問題：在已排序的陣列裡找目標值。線性掃描逐一檢查要 O(n)；二分搜尋每輪只比較一個元素，卻能把搜尋範圍砍半。憑什麼？憑排序帶來的單調性：陣列由小到大排好後，nums[mid] 這一次比較的結果能代言整個半邊——若 target 大於 nums[mid]，則 mid 以左每個元素都不大於 nums[mid]、更小於 target，整個左半（連同 mid）可以一次安全排除，一個都不會冤枉；反向亦然。這就是它與線性掃描的本質差異：線性掃描一次比較只排除一個元素，二分搜尋一次比較排除一半。前提也由此而來：**陣列必須已排序**。沒有單調性，「大於中點就往右」的推論不成立，被丟掉的半邊完全可能藏著目標——程式不會報錯，只會安靜地回傳找不到。

## Thinking

本課採閉區間慣例：[left, right] 的意義是迴圈不變式「**target 若存在，必在此區間內**」。初始 left = 0、right = n - 1 涵蓋全陣列，不變式顯然成立。迴圈條件 `while (left <= right)`：區間非空就還有候選。每輪取 mid = left + Math.floor((right - left) / 2)（Python 用 //；除法必須向下取整，否則索引出現小數）。三向比較：命中回傳 mid；target 較大則 left = mid + 1；較小則 right = mid - 1。+1 與 -1 不是裝飾——mid 已比過、確定不是答案，把它留在區間裡，區間就可能不縮小：區間只剩一格時 mid == left == right，寫成 left = mid 會原地踏步、無窮迴圈。有了 +1 / -1，加上 left ≤ mid ≤ right 恆成立，每輪區間長度至少減 1，必然終止。迴圈結束時 left > right、區間已空，配上不變式即可斷言 target 不存在，回傳 -1。邊界慣例不只這一種：半開區間 [left, right) 搭配 `left < right` 與 right = mid 同樣正確，關鍵是「區間定義、迴圈條件、更新方式」三者必須成套，之後的課會把各套慣例分別練熟。

## Pattern Recognition

訊號：資料已排序（或具單調性）且要找特定元素或邊界；更廣義的訊號是存在一個單調判斷——某條件在某個分界點之前全為否、之後全為是，就能對條件做二分。資料量大到 O(n) 掃描太慢是明確提示。反訊號：資料未排序——先排序要 O(n log n)，只查一次不如直接線性掃，查很多次才值得先排序；鏈結串列——沒有 O(1) 隨機存取（回想陣列記憶體布局那一課），跳到 mid 本身就要 O(n)，砍半省下的比較被走訪成本吃光。

## Common Mistakes

一、忘記前提：對未排序陣列照跑不會當機，只會把可能藏著目標的半邊安靜丟掉、回傳錯誤結果——比會爆炸的錯誤更難抓。二、mid 不取整：JavaScript 的 / 是浮點除法，(left + right) / 2 會算出 2.5 這種索引，nums[2.5] 讀到 undefined，必須 Math.floor。三、更新不排除 mid：left = mid 或 right = mid 搭配閉區間，在區間縮到一兩格時原地踏步——nums = [5] 找 7：mid = 0、7 > 5、left = mid 永遠是 0，無窮迴圈。四、慣例混搭：閉區間卻寫 `left < right`，區間剩一格就跳出，漏驗最後一個候選——nums = [5] 找 5 會錯回 -1。

## Complexity

每輪比較一次、區間砍半：n → n/2 → n/4 → …，砍 k 次剩 n / 2^k，剩 1 時 k = log2(n)，所以最多約 log2(n) + 1 次比較，時間 O(log n)。體感對照：10 億筆資料約 30 次比較就見分曉，線性掃描最壞要 10 億次。迭代版只用 left、right、mid 三個變數，空間 O(1)；遞迴版會多出 O(log n) 的呼叫堆疊。

## Digest

拿 nums = [-1, 0, 3, 5, 9, 12] 找 9：left = 0、right = 5，mid = 2、nums[2] = 3 < 9 → left = 3；mid = 4、nums[4] = 9 命中——兩次比較收工。公式：閉區間不變式「target 若存在必在 [left, right]」＋ `while (left <= right)` ＋比較後 left = mid + 1 或 right = mid - 1；區間每輪至少縮 1、實際砍半，區間空了就能斷言不存在。一切建立在排序給的單調性上：一次比較代言整個半邊，10 億筆約 30 次比較，這就是 O(log n) 的體感。

## TypeScript Tip

開啟 `noUncheckedIndexedAccess` 後 nums[mid] 的型別是 `number | undefined`，先用 `!` 收斂再比較。

```typescript
import assert from "node:assert";

function binarySearch(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const value = nums[mid]!;
    if (value === target) return mid;
    if (value < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

const nums = [-1, 0, 3, 5, 9, 12];
assert.strictEqual(binarySearch(nums, 9), 4);
assert.strictEqual(binarySearch(nums, -1), 0); // 目標在左邊界
assert.strictEqual(binarySearch(nums, 12), 5); // 目標在右邊界
assert.strictEqual(binarySearch(nums, 2), -1); // 目標不存在
assert.strictEqual(binarySearch([5], 5), 0); // 單元素
```

## Python Tip

Python 的 // 直接向下取整；left + (right - left) // 2 這種寫法是為定長整數語言防溢位養成的習慣，Python 整數不溢位但值得沿用。最後一個 assert 示範前提被破壞時的安靜失敗。

```python
def binary_search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

nums = [-1, 0, 3, 5, 9, 12]
assert binary_search(nums, 9) == 4
assert binary_search(nums, -1) == 0
assert binary_search(nums, 2) == -1
assert binary_search([5], 5) == 0
# 未排序示範：3 明明存在（索引 0），卻被安靜丟掉
assert binary_search([3, 1, 2], 3) == -1
```

## Takeaway

排序給單調性，一次比較安全排除一半；閉區間、left <= right、mid ± 1 三者成套，區間空即不存在——O(log n)。

## Tomorrow Preview

明天把今天用的閉區間模板 [left, right] 練到反射級：`left <= right` 的等號為何不能少、區間縮到單一元素時發生什麼事、迴圈終止時 left 與 right 各停在哪裡。

## Today's Challenge

- **704** · 標準的已排序陣列找目標值，本課閉區間模板的原樣落地。
  - Hint: left = 0、right = n - 1、`while (left <= right)`；比較後用 mid ± 1 收縮，出迴圈回 -1。
- **34** · 找目標值的起訖位置——命中後不能停手，還要繼續逼出邊界，是「砍半」觀念的直接延伸。
  - Hint: 跑兩次二分：找左界時命中也把 right 收到 mid - 1、找右界時命中把 left 推到 mid + 1，各自記下最後一次命中的位置；全程未命中就回 [-1, -1]。
