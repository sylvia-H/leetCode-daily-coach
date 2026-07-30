---
id: array-in-place-removal
title: In-Place Element Removal with Fast-Slow Pointers
module: array
topic: array
difficulty: easy
estimated_minutes: 15
pattern_label: Fast-Slow Pointers
complexity_label: O(n) / O(1)
prerequisite:
  - array-linear-scan
  - problem-simplification-strategy
  - array-two-pointers-variable
next:
  - array-in-place-deduplication
learning_goal:
  - 學會使用快慢指標在原地移除陣列中指定元素
exit_criteria:
  - 能區分快指標（尋找有效元素）與慢指標（寫入位置）的職責
  - 能在不使用額外記憶體下完成陣列壓縮
leetcode:
  - 27
tags:
  - array
  - two-pointers
  - in-place
---

## Author Hints

- 核心觀念：快指標負責掃描整個陣列尋找非目標元素，慢指標負責指示下一個有效元素應填入的位置。
- Pattern 辨識線索：題目要求原地（In-place）移除陣列中的特定值，且不允許使用額外空間。
- Thinking：slow 從 0 開始，fast 掃描陣列，當 arr[fast] 不等於 val 時，將其賦值給 arr[slow] 並將 slow++。
- Common Mistakes：搞混快慢指標的更新時機，導致覆蓋掉尚未檢查的資料。
- TypeScript 重點：原地修改後記得回傳有效長度 slow。
- Python 重點：切記 Python 的 list 原地修改後，函式外也能直接看到變動。
- 題號 27 為何適合此 Pattern：移除指定元素並返回新長度，標準的快慢指標原地修改題。
