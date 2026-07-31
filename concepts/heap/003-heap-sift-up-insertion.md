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
  - Implement insertion into a heap and restore the heap property using sift-up.
exit_criteria:
  - Can trace how a newly added element bubbles up to its correct position.
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
