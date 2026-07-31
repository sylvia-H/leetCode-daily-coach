---
id: heap-merge-k-sorted-lists
title: Merge K Sorted Lists
module: heap
topic: heap
difficulty: medium
estimated_minutes: 30
pattern_label: Multi-way Merge
complexity_label: O(N log k) time / O(k) space
prerequisite:
  - heap-top-k-frequent-elements
next:
  - heap-find-median-from-data-stream
learning_goal:
  - >-
    Use a min-heap to merge multiple sorted iterators or linked lists
    efficiently.
exit_criteria:
  - >-
    Can maintain one active node per list in a heap and push its successor upon
    extraction.
leetcode:
  - 23
tags:
  - heap
  - linked-list
  - merge
---

## Author Hints

- 核心觀念：Initialize a heap with the head nodes of k lists, then repeatedly extract the minimum and push its next node.
- Pattern 辨識線索：Merging multiple already-sorted sequences into a single sorted sequence.
- Thinking：Keep track of node pointers and push the next element from the extracted list.
- Common Mistakes：Forgetting to push the next node into the heap after extracting the current minimum.
- TypeScript 重點：Custom comparator needed if node values are tied or objects are compared.
- Python 重點：Handle object comparisons in heapq by storing tuples or implementing custom __lt__.
- 題號 23 為何適合此 Pattern：A min-heap holding current heads of k lists allows finding the global minimum in O(log k) time.
