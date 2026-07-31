---
id: heapify-linear-time-construction
title: Linear Time Heap Construction (Heapify)
module: heap
topic: heap
difficulty: medium
estimated_minutes: 25
pattern_label: Bottom-up Heapify
complexity_label: O(n) time / O(1) space
prerequisite:
  - heap-sift-down-extraction
next:
  - heap-kth-largest-element
learning_goal:
  - >-
    Build a heap from an arbitrary array in O(n) time by starting from the last
    non-leaf node.
exit_criteria:
  - Can explain why bottom-up heap construction is O(n) instead of O(n log n).
leetcode: []
tags:
  - heap
  - heapify
---

## Author Hints

- 核心觀念：Start from the last non-leaf node and run sift-down in reverse order down to the root.
- Pattern 辨識線索：Converting an unordered list into a heap efficiently without individual insertions.
- Thinking：Identify the first parent node index and iterate backwards to index 0.
- Common Mistakes：Starting heapify from index 0 instead of the last non-leaf node.
- TypeScript 重點：Loop backwards from Math.floor(n / 2) - 1.
- Python 重點：Use range(n // 2 - 1, -1, -1) for reverse traversal.
