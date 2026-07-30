---
id: two-pointer-three-sum-basic
title: Three Sum Basic Logic
module: two-pointer
topic: two-pointer
difficulty: medium
estimated_minutes: 15
pattern_label: Two Pointers - Sorting & Opposite
complexity_label: O(n^2) / O(1)
prerequisite:
  - array-two-pointers-opposite
next:
  - two-pointer-three-sum-closest
  - two-pointer-four-sum-extension
learning_goal:
  - 學習如何將三數之和問題降維為固定一個數字後做相向雙指標搜尋
exit_criteria:
  - 能夠正確在排序後的陣列中避開重複組合
  - 理解為何外層迴圈配合內層雙指標能達到 O(n^2) 複雜度
leetcode:
  - 15
tags:
  - two-pointers
  - sorting
  - array
---

## Author Hints

- 核心觀念：排序陣列後，固定一個基準元素，將剩餘部分轉為兩端夾擠的雙指標經典問題。
- Pattern 辨識線索：題目要求找出三個元素的組合其總和符合特定條件（通常為 0）。
- Thinking：先排序；外層巡迴固定一個數 i，內層用 left = i + 1 與 right = n - 1 進行夾擊；注意跳過重複的基準與指標值以避免重複解。
- Common Mistakes：忘記在移動左右指標時過濾重複元素，導致答案包含重複組合。
- TypeScript 重點：注意 JavaScript 排序數字時必須提供比較函式 (a, b) => a - b。
- Python 重點：Python 中可利用排序後的陣列搭配 while 迴圈與條件判斷安全地跳過重複值。
- 題號 15 為何適合此 Pattern：經典的三數之和題目，完美展示排序結合相向雙指標的應用。
