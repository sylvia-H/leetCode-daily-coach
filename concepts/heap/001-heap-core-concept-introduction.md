---
id: heap-core-concept-introduction
title: Heap and Priority Queue Core Concept
module: heap
topic: heap
difficulty: easy
estimated_minutes: 15
pattern_label: Heap / Priority Queue
complexity_label: O(log n) / O(n)
prerequisite:
  - tree-core-concept-introduction
next:
  - heap-array-representation
learning_goal:
  - 理解 heap property，以及 priority queue 與一般 queue 的差異。
exit_criteria:
  - 能說明 min-heap 與 max-heap 性質的差異。
leetcode: []
tags:
  - heap
  - priority-queue
  - fundamentals
---

## Author Hints

- 核心觀念：A heap is a specialized tree-based data structure that satisfies the heap property: in a max-heap, for any given node, its value is greater than or equal to its children.
- Pattern 辨識線索：Whenever you need dynamic access to the minimum or maximum element efficiently.
- Thinking：Visualize the tree structure and remember that it only guarantees parent-child ordering, not a fully sorted array.
- Common Mistakes：Assuming a heap is completely sorted from left to right like a binary search tree.
- TypeScript 重點：TypeScript does not have a built-in heap class, requiring a custom implementation or library.
- Python 重點：Python provides heapq module which implements a min-heap over standard lists.
