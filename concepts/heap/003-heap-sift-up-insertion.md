---
id: heap-sift-up-insertion
title: Heap Insertion and Sift-Up Operation
module: heap
topic: heap
difficulty: easy
estimated_minutes: 20
pattern_label: Percolate Up
complexity_label: O(log n) time / O(1) space
prerequisite:
  - heap-array-representation
next:
  - heap-sift-down-extraction
learning_goal:
  - 實作 heap 的插入操作，並使用 sift-up 恢復 heap property。
exit_criteria:
  - 能追蹤新加入的元素如何向上冒泡到正確位置。
leetcode: []
tags:
  - heap
  - sift-up
---

## Author Hints

- 核心觀念：Insert the new element at the end of the array, then compare and swap with its parent iteratively until the heap property is restored.
- Pattern 辨識線索：Adding elements dynamically while maintaining order constraints.
- Thinking：Check the parent relationship at each step until reaching the root or a valid parent.
- Common Mistakes：Forgetting to stop when the root is reached (index 0).
- TypeScript 重點：Maintain array bounds during swap operations.
- Python 重點：Use simultaneous assignment or temporary variables for clean swaps.
