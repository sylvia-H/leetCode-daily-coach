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
  - '用動態陣列實作基本佇列，並認識搬移元素造成的效能瓶頸。'
exit_criteria:
  - '能用陣列寫出基本的佇列 class。'
  - '能說明為何在一般陣列上 shift() 或 pop(0) 的時間複雜度是 O(n)。'
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
