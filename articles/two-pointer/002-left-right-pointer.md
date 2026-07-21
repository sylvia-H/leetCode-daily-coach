<!-- F1 手寫種子內容；F7 內容產線上線後由生成物取代 -->
---
id: left-right-pointer
title: Left-Right Pointer
module: two-pointer
pattern_label: Two Pointer
complexity_label: O(n) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能描述左右指標的移動條件
  - 能辨識「已排序 + 找一對」的適用時機
  - 能分析時間 / 空間複雜度
  - 能完成至少一題 Easy
---

## Concept

給定一個已排序（或具有單調性質）的陣列，若需要在其中找出一組滿足特定條件的元素配對
（例如兩數之和等於目標值），與其對每一對元素做 O(n²) 的暴力枚舉，不如維護兩個指標
`left` 與 `right`，分別從陣列的頭與尾出發，依目前總和與目標值的關係決定移動哪一個指標，
直到兩指標相遇為止。這就是 **Left-Right Pointer**——雙指標由兩端向中間夾擠。

## Thinking

直覺來自「排序」帶來的單調性：陣列排序後，若目前 `nums[left] + nums[right]` 太小，
代表需要更大的值，因此把 `left` 右移；若太大，則把 `right` 左移。每一次移動都排除了
一整批不可能成立的組合（因為陣列已排序，移動後的搜尋方向是單調的），因此整個搜尋空間
只需線性掃過一次，不必兩兩枚舉。

## Pattern Recognition

看到以下特徵時，應該優先考慮 Left-Right Pointer：

- 陣列（或字串）**已排序**，或排序後不影響答案
- 要找「一對」或「一段區間」滿足某個和 / 差 / 乘積條件
- 暴力解是 O(n²)，但題目規模需要 O(n) 或 O(n log n)

## Common Mistakes

- 忘記正確設定迴圈終止條件（`left < right` 或 `left <= right`，依情境而定）
- 誤以為所有「雙指標」都是同向移動——Left-Right Pointer 是**相向**移動，
  與 Fast-Slow Pointer 的同向不同速語意不同
- 找到答案後忘記同時移動兩個指標以跳過重複值（去重情境常見）

## Complexity

- **時間複雜度 O(n)**：每次迴圈至少移動一個指標一步，最多移動 n 次。
- **空間複雜度 O(1)**：只需要兩個額外的指標變數，不需要額外的資料結構。

## TypeScript Corner

```ts
function twoSumSorted(nums: number[], target: number): [number, number] {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}
```

TypeScript 的陣列存取本身不會做邊界檢查，`left`、`right` 的初始值與終止條件務必手動驗證，
避免 off-by-one。搭配 `noUncheckedIndexedAccess` 開啟時，`nums[left]` 的型別會是
`number | undefined`，可再加上非 null 斷言或明確處理。

## Python Corner

```py
def two_sum_sorted(nums: list[int], target: int) -> tuple[int, int]:
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return left, right
        if total < target:
            left += 1
        else:
            right -= 1
    return -1, -1
```

Python 的序列切片與負索引雖然方便，但在雙指標情境下直接用索引變數操作，
可讀性與效能都優於重複切片（切片會產生新的 list 複本）。

## Today's Challenge

今日題目由題庫依此 Concept 的對應關係帶入（見系統推播訊息的 Today's Challenge 區塊），
此處不重複列出題號與連結，避免與程式讀取的資料來源出現兩份不同步的副本。

## Tomorrow Preview

明天將學習 **Fast-Slow Pointer**（快慢指標）：與今天「首尾相向夾擠」不同，
快慢指標是「同向、不同速度前進」，常用於環狀偵測、尋找鏈結串列中點等情境。

## Digest

排序後的陣列要找「一組符合條件的配對」時，與其用雙層迴圈 O(n²) 暴力枚舉，不如讓兩個
指標 `left` / `right` 從頭尾出發、往中間夾。依目前總和與目標值的關係，決定移動哪一個
指標——每移動一步就排除一整批不可能成立的組合。**特徵**：陣列已排序（或可排序）、
要找一對元素滿足某條件、需要 O(n) 解法。這是 **Two Pointer** 家族中最基礎的一種。

## TypeScript Tip

```ts
function twoSumSorted(nums: number[], target: number): [number, number] {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    sum < target ? left++ : right--;
  }
  return [-1, -1];
}
```
左右指標往中間夾，時間複雜度 O(n)、空間複雜度 O(1)。

## Python Tip

```py
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return left, right
        left += (total < target)
        right -= (total >= target)
    return -1, -1
```
`left < right` 是終止條件，記得處理「找不到答案」的情況。

## Takeaway

排序 + 找一對 → 先想左右指標。
