---
id: queue-array-implementation
title: Queue Array Implementation
module: queue
topic: queue
difficulty: easy
estimated_minutes: 15
pattern_label: FIFO Queue
complexity_label: O(n) / O(n)
prerequisite:
  - queue-core-concept-introduction
next:
  - queue-linked-list-implementation
learning_goal:
  - >-
    Implement a basic queue using a dynamic array and recognize the performance
    bottleneck of shifting elements.
exit_criteria:
  - Can write a basic queue class using an array.
  - Explain why shift() or pop(0) takes O(n) time complexity in standard arrays.
leetcode: []
tags:
  - queue
  - array
  - implementation
---

## Author Hints

- 核心觀念：Using a simple list or array to store queue elements, noting the cost of removing from the front.
- Pattern 辨識線索：Need to build a lightweight queue without external imports.
- Thinking：Enqueue at the end is fast, but dequeue from the front requires shifting elements down.
- Common Mistakes：Forgetting that removing from index 0 shifts the entire array in memory.
- TypeScript 重點：Array.prototype.shift() is O(n) time complexity.
- Python 重點：list.pop(0) is O(n) time complexity.
