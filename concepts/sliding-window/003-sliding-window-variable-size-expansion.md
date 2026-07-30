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
  - >-
    Master the right pointer expansion phase in variable-size sliding window
    problems.
exit_criteria:
  - >-
    Can write a loop that greedily expands the right pointer until a condition
    is met or violated.
  - >-
    Can update window state correctly upon incorporating a new element at the
    right pointer.
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
