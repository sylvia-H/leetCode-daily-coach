---
id: sliding-window-variable-size-expansion
title: 'Variable-Size Sliding Window: Expansion Phase'
module: sliding-window
topic: sliding-window
difficulty: easy
estimated_minutes: 15
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(k)
prerequisite:
  - sliding-window-fixed-size
next:
  - sliding-window-variable-size-contraction
  - queue-sliding-window-maximum
learning_goal:
  - 精通變動長度 Sliding Window 問題中右指標的擴張階段。
exit_criteria:
  - 能寫出貪婪地擴張右指標的迴圈，直到條件滿足或被違反為止。
  - 能在右指標納入新元素時正確更新視窗狀態。
leetcode: []
tags:
  - sliding-window
  - two-pointers
---

## Author Hints

- 核心觀念：Expand the right boundary of the window to include more elements until the current window satisfies or violates the problem constraint.
- Pattern 辨識線索：The problem asks for the longest or shortest subarray/substring satisfying a condition, where window size is not fixed.
- Thinking：Iterate with the right pointer through the array, incorporating each element into the current window state.
- Common Mistakes：Failing to update the window state metrics before checking validity.
- TypeScript 重點：Keep tracking variables updated in tandem with the right pointer advancement.
- Python 重點：Use standard loops over the iterable while keeping track of indices.
