---
id: sliding-window-variable-size-contraction
title: 'Variable-Size Sliding Window: Contraction Phase'
module: sliding-window
topic: sliding-window
difficulty: medium
estimated_minutes: 20
pattern_label: Variable Sliding Window
complexity_label: O(n) / O(k)
prerequisite:
  - sliding-window-variable-size-expansion
next:
  - sliding-window-longest-substring-no-repeat
  - sliding-window-max-consecutive-ones
  - sliding-window-minimum-window-substring
learning_goal:
  - >-
    Master the left pointer contraction phase to restore validity or optimize
    window size.
exit_criteria:
  - >-
    Can write the inner while-loop that shrinks the window from the left when a
    constraint is violated.
  - >-
    Can update the global optimal result (max or min length) correctly during
    contraction.
leetcode:
  - 209
tags:
  - sliding-window
  - two-pointers
---

## Author Hints

- 核心觀念：When the window violates constraints, increment the left pointer and remove elements until validity is restored.
- Pattern 辨識線索：Subarray problems requiring the minimal length satisfying a threshold sum or condition.
- Thinking：Use a while loop inside the right pointer loop to contract the left pointer as long as the condition holds.
- Common Mistakes：Forgetting to update the minimum length before or during the contraction loop.
- TypeScript 重點：Ensure inner while loop condition checks do not cause out-of-bounds errors.
- Python 重點：Carefully manage pointer increments to avoid infinite loops.
- 題號 209 為何適合此 Pattern：Requires finding the minimal length of a contiguous subarray whose sum is greater than or equal to target.
