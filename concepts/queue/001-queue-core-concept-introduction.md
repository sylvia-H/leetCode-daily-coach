---
id: queue-core-concept-introduction
title: Queue Core Concept Introduction
module: queue
topic: queue
difficulty: easy
estimated_minutes: 10
pattern_label: FIFO Queue
complexity_label: O(1) / O(n)
prerequisite:
  - stack-core-concept-introduction
next:
  - queue-array-implementation
  - queue-using-stacks
  - stack-using-queues
  - queue-bfs-level-order-traversal
  - queue-sliding-window-maximum
learning_goal:
  - >-
    Understand the First-In, First-Out (FIFO) principle and how elements enter
    from the rear and leave from the front.
exit_criteria:
  - Can trace enqueue and dequeue operations mentally.
  - Understand why queues are used for order-preserving processing.
leetcode: []
tags:
  - queue
  - fifo
  - fundamentals
---

## Author Hints

- 核心觀念：Queue models a waiting line where the first person in line is the first one served.
- Pattern 辨識線索：Tasks or data that must be processed in chronological order of arrival.
- Thinking：Visualize a pipe where items enter one end and exit the other without changing relative order.
- Common Mistakes：Confusing FIFO with LIFO (Stack).
- TypeScript 重點：Think of Array push/shift as conceptual enqueue/dequeue.
- Python 重點：Think of append/popleft as conceptual enqueue/dequeue.
