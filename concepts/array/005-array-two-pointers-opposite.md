---
id: array-two-pointers-opposite
title: Two Pointers from Opposite Ends
module: array
topic: array
difficulty: easy
estimated_minutes: 15
pattern_label: Two Pointers
complexity_label: O(n) / O(1)
prerequisite:
  - array-linear-scan
  - conditional-branching-logic
  - array-range-sum-query
next:
  - array-two-pointers-sliding
  - hash-table-complement-lookup
  - string-two-pointers-opposite
  - two-pointer-boats-to-save-people
  - two-pointer-three-sum-basic
  - two-pointer-container-water
  - two-pointer-sort-array-by-parity
learning_goal:
  - 掌握使用左右雙指標從兩端向中間收斂的解題技巧
exit_criteria:
  - 能清楚判斷指標相遇或交錯的迴圈終止條件
  - 能針對排序陣列或對稱結構進行指標移動
leetcode:
  - 344
  - 977
  - 15
tags:
  - array
  - two-pointers
---

## Author Hints

- 核心觀念：使用左右兩個指標分別指向陣列頭尾，根據條件向內移動直到相遇。
- Pattern 辨識線索：題目涉及對稱性、反轉、或已排序陣列的尋找配對。
- Thinking：left = 0, right = n - 1，在 while left < right 迴圈中根據條件移動指標。
- Common Mistakes：迴圈條件誤用 <= 導致重複處理同一個元素或交叉錯亂。
- TypeScript 重點：在 TypeScript 中交換元素可使用解構賦值 [arr[l], arr[r]] = [arr[r], arr[l]]。
- Python 重點：Python 同樣支援簡潔的元素交換語法。
- 題號 344 為何適合此 Pattern：字元陣列反轉最經典的左右雙指標對向移動應用。
- 題號 977 為何適合此 Pattern：已排序但含正負數的陣列，平方後最大值必在兩端，適合用雙指標從兩頭往中間填入新陣列。
- 題號 15 為何適合此 Pattern：排序後利用雙指標從兩端向中間夾擠，是解決三數之和的最佳示範。
