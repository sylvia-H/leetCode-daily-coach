---
id: array-linear-scan
title: Array Linear Scan and Traversal
module: array
topic: array
difficulty: easy
estimated_minutes: 12
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
prerequisite:
  - array-memory-layout
  - loop-invariant-thinking
next:
  - array-prefix-sum-basic
  - array-two-pointers-opposite
  - array-in-place-removal
  - hash-table-frequency-counting
  - sliding-window-concept-intro
  - stack-asteroid-collision
  - stack-daily-temperatures
  - two-pointer-interval-merging-check
learning_goal:
  - 掌握透過迴圈依序走訪陣列中每個元素的基礎技巧
exit_criteria:
  - 能寫出安全走訪陣列邊界的迴圈
  - 能正確在走訪過程中累積狀態
leetcode:
  - 1480
  - 1929
  - 238
tags:
  - array
  - traversal
  - linear-scan
---

## Author Hints

- 核心觀念：線性掃描是逐一檢查陣列中每個元素的最基本操作，時間複雜度為 O(n)。
- Pattern 辨識線索：題目要求檢查所有元素或尋找特定條件的元素且未排序時。
- Thinking：設定迴圈從索引 0 到 n-1，每次迭代處理單一元素並維護必要變數。
- Common Mistakes：迴圈終止條件寫錯導致少算最後一個元素或發生 Off-by-one 錯誤。
- TypeScript 重點：善用 for...of 迴圈讓走訪程式碼更乾淨，若需索引改用传统 for 迴圈。
- Python 重點：優先使用 for x in arr 或 enumerate(arr) 進行 Pythonic 走訪。
- 題號 1480 為何適合此 Pattern：需要線性掃描陣列來累加前綴和。
- 題號 1929 為何適合此 Pattern：透過兩次線性掃描或直接走訪建構串接陣列。
- 題號 238 為何適合此 Pattern：透過兩次線性掃描分別計算左右兩側的乘積陣列，是經典的陣列線性掃描應用。
