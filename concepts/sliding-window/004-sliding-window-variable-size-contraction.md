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
  - 精通左指標的收縮階段，以恢復視窗合法性或最佳化視窗大小。
exit_criteria:
  - 能寫出在限制被違反時，從左側收縮視窗的內層 while 迴圈。
  - 能在收縮過程中正確更新全域最佳結果（最大或最小長度）。
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
