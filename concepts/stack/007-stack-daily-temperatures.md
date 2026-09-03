---
id: stack-daily-temperatures
title: Stack Daily Temperatures
module: stack
topic: stack
difficulty: medium
estimated_minutes: 25
pattern_label: Monotonic Stack (Next Greater Element)
complexity_label: O(n) / O(n)
prerequisite:
  - stack-array-implementation
  - array-linear-scan
  - stack-remove-adjacent-duplicates
next:
  - stack-next-greater-element-ii
  - stack-online-stock-span
  - stack-sum-of-subarray-minimums
learning_goal:
  - 理解單調遞減 stack（Monotonic Stack）用於尋找 next greater element 的核心原理。
exit_criteria:
  - 能在 stack 中儲存索引，同時維持對應值的遞減順序。
  - 能在遇到更大的元素時，結算尚待處理的索引。
leetcode:
  - 739
tags:
  - stack
  - monotonic-stack
---

## Author Hints

- 核心觀念：Keep indices in a stack with decreasing corresponding values; pop and record distance when a warmer temperature appears.
- Pattern 辨識線索：Finding the next element that is strictly greater or smaller than the current element.
- Thinking：Scan from left to right, maintaining a monotonic stack of unresolved indices.
- Common Mistakes：Storing values instead of indices when positions/distances matter.
- TypeScript 重點：Store array indices in the stack to easily compute distance differences.
- Python 重點：Use a standard list to store indices and check stack[-1] conditions.
- 題號 739 為何適合此 Pattern：Requires finding the distance to the next higher value, a classic monotonic stack use case.
