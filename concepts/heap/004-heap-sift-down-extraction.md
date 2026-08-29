---
id: heap-sift-down-extraction
title: Heap Extraction and Sift-Down Operation
module: heap
topic: heap
difficulty: medium
estimated_minutes: 25
pattern_label: Percolate Down
complexity_label: O(log n) time / O(1) space
prerequisite:
  - heap-sift-up-insertion
next:
  - heapify-linear-time-construction
learning_goal:
  - 從 heap 移除根元素，並使用 sift-down 恢復 heap property。
exit_criteria:
  - 能將根與最後一個元素交換、pop 出來，並對新的根執行 sift down。
leetcode:
  - 215
tags:
  - heap
  - sift-down
---

## Author Hints

- 核心觀念：Replace root with the last leaf, shrink array, and bubble the element down by swapping with the smaller/larger child.
- Pattern 辨識線索：Extracting extreme values from a collection repeatedly.
- Thinking：Compare with both children and swap with the most extreme child.
- Common Mistakes：Failing to check if children exist before comparing indices.
- TypeScript 重點：Guard against out-of-bounds child indices when the tree is incomplete.
- Python 重點：Carefully manage conditional checks for left and right children.
- 題號 215 為何適合此 Pattern：Finding the kth largest element can be solved by maintaining a min-heap of size k using extraction.
