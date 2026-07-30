---
id: array-in-place-deduplication
title: In-Place Deduplication in Sorted Array
module: array
topic: array
difficulty: easy
estimated_minutes: 15
pattern_label: Fast-Slow Pointers
complexity_label: O(n) / O(1)
prerequisite:
  - array-in-place-removal
next:
  - array-move-zeroes
learning_goal:
  - 利用已排序陣列的特性進行原地去除重複元素
exit_criteria:
  - 能利用已排序的性質比較相鄰元素
  - 能正確維護不重複區間的寫入指標
leetcode:
  - 26
  - 80
tags:
  - array
  - two-pointers
  - sorted
---

## Author Hints

- 核心觀念：利用已排序陣列相同元素會相鄰的特性，用快慢指標挑選出獨一無二的元素。
- Pattern 辨識線索：已排序陣列原地去重（Remove Duplicates）。
- Thinking：slow 指向最後一個獨特元素的位置，fast 從 1 開始掃描，當 arr[fast] !== arr[slow] 時，slow++ 並將 arr[slow] = arr[fast]。
- Common Mistakes：忽略陣列為空或只有一個元素的邊界情況。
- TypeScript 重點：回傳值為去重後的有效長度 (slow + 1)。
- Python 重點：注意邏輯判斷時不要發生索引越界。
- 題號 26 為何適合此 Pattern：已排序陣列的原地去重，完美對應快慢指標法。
- 題號 80 為何適合此 Pattern：利用快慢指標在已排序陣列中進行更具彈性的原地去重複處理。
