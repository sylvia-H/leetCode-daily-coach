---
id: two-pointer-three-sum-basic
title: Three Sum Basic Logic
module: two-pointer
pattern_label: Two Pointers - Sorting & Opposite
complexity_label: O(n^2) / O(1)
estimated_minutes: 15
exit_criteria:
  - 能夠正確在排序後的陣列中避開重複組合
  - 理解為何外層迴圈配合內層雙指標能達到 O(n^2) 複雜度
---
## Concept

Three Sum 基礎邏輯的核心在於透過排序陣列，將原本複雜的三維搜尋空間降維為固定一個基準元素後進行相向雙指標搜尋。當面對尋找三個元素組合以滿足特定總和的題目時，暴力解法往往需要 O(n^3) 的時間複雜度，這在數據規模較大時會導致效能瓶頸。透過先將陣列排序，我們能夠以 O(n^2) 的時間複雜度高效解決問題。此技術不僅是處理陣列搜尋的基石，也是多數指針操作與邊界控制的經典範例。

## Thinking

在處理這類問題時，首先需要將整個數字陣列進行遞增排序。排序完成後，我們透過一個外層迴圈巡迴陣列，每次固定一個元素作為基準值。接著，在基準值的右側區域設定兩個指標，分別為指向左側起點的 left 指標與指向結尾的 right 指標。透過比對基準值與左右指標所指向元素的總和，若總和過小則將 left 往右移動以增加總和，若總和過大則將 right 往左移動以減少總和。在移動指標的過程中，必須額外注意跳過重複的數值，以確保最終產生的組合不會重複。

## Pattern Recognition

當題目要求在一個陣列中尋找多個元素的組合（通常為三個元素），且其總和需符合特定條件（例如等於 0 或給定的目標值），這就是典型的 Two Pointers 結合 Sorting 的 Pattern。辨識的線索包含：陣列未排序、要求輸出不重複的組合、且問題可以拆解為固定一個或兩個變數後，利用相向雙指標線性掃描剩餘空間。

## Common Mistakes

最常見的錯誤在於忽略了重複元素的處理。當找到一組符合條件的答案後，若沒有將 left 與 right 指標移動到下一個不同的數值，會導致同一組答案被重複計算。此外，外層的基準元素若遇到相同數值時未進行跳過，也會產生重複的結果。另一個常見錯誤是在 JavaScript 中使用預設的陣列 sort() 方法時，未傳入正確的數值比較函式，導致排序結果不符合預期。

## Complexity

時間複雜度為 O(n^2)。其中外層迴圈需要花費 O(n) 的時間巡迴每個元素，而在每次迭代中，內層的雙指標掃描最多需要花費 O(n) 的時間。兩者相乘使得整體時間複雜度為 O(n^2)。空間複雜度方面，若使用原地排序則為 O(1)，若計入排序演算法本身所需的堆疊空間，則依語言實現而定，通常在迭代過程中僅使用常數額外空間。

## Digest

Three Sum 基礎邏輯是將複雜的多數組和問題透過排序與相向雙指標降維的經典範例。透過固定基準點並利用左右夾擊，我們能將 O(n^3) 的暴力解法優化至 O(n^2)。文章詳細探討了排序的必要性、指標的移動邏輯、重複值的過濾機制，並提供了 TypeScript 與 Python 的完整實作與斷言驗證，幫助開發者紮實掌握陣列搜尋的核心技巧。

## TypeScript Tip

```typescript
function validateSorted(nums: number[]): void {
  const sorted = [...nums].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] < sorted[i - 1]) throw new Error("assertion failed");
  }
}
validateSorted([3, 1, 4, 1, 5]);
```

## Python Tip

```python
def validate_sorted(nums: list[int]) -> None:
    sorted_nums = sorted(nums)
    for i in range(1, len(sorted_nums)):
        assert sorted_nums[i] >= sorted_nums[i - 1], "assertion failed"

validate_sorted([3, 1, 4, 1, 5])
```

## Takeaway

排序結合相向雙指標是解決多數組和問題的核心模式，正確處理重複值與邊界條件是確保演算法正確性的關鍵。

## Tomorrow Preview

明天我們將探討 Two Pointers 延伸應用的進階變體，學習如何在面對更大規模資料或不同約束條件時，靈活調整雙指標的移動策略與終止條件。

## Today's Challenge

- **15** · 此題要求尋找三個元素總和為 0 的所有不重複組合，完美對應排序後使用相向雙指標的 Three Sum 基礎邏輯。
  - Hint: 先將陣列排序，外層巡迴固定一個數字，內層使用 left 與 right 指標進行夾擊，並注意跳過重複值。
- **1** · 兩數之和的基礎邏輯與 Three Sum 概念相通，可視為 Three Sum 的簡化版本，透過雙指標或雜湊表尋找目標組合。
  - Hint: 可以透過排序搭配相向雙指標來尋找兩數相加等於目標值的組合。
