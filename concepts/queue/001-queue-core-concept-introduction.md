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
  - '理解先進先出（FIFO）原則，以及元素如何從尾端進入、從前端離開。'
exit_criteria:
  - '能在腦中追蹤 enqueue 與 dequeue 的操作過程。'
  - '能理解為何佇列被用於保持順序的處理。'
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
