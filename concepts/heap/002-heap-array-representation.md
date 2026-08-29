---
id: heap-array-representation
title: Array Representation of Binary Heap
module: heap
topic: heap
difficulty: easy
estimated_minutes: 15
pattern_label: Array-based Tree Indexing
complexity_label: O(1) index access / O(n) space
prerequisite:
  - heap-core-concept-introduction
next:
  - heap-sift-up-insertion
learning_goal:
  - 使用索引公式，將 complete binary heap 映射到一維陣列。
exit_criteria:
  - 能對任意索引 i 正確計算左子節點、右子節點與父節點的索引。
leetcode: []
tags:
  - heap
  - array-indexing
---

## Author Hints

- 核心觀念：A complete binary tree can be efficiently stored in a flat array where left child is 2i+1, right child is 2i+2, and parent is (i-1)//2.
- Pattern 辨識線索：Translating pointer-based tree logic into linear array indices for memory efficiency.
- Thinking：Verify index bounds and whether 0-based or 1-based indexing is being used.
- Common Mistakes：Mixing up 0-indexed and 1-indexed formula variations.
- TypeScript 重點：Array push and pop operations manage the size dynamically.
- Python 重點：List indexing makes math straightforward with integer division.
