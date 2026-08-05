---
id: stack-using-queues
title: Implement Stack using Queues
module: queue
topic: queue
difficulty: easy
estimated_minutes: 15
pattern_label: Queue-to-Stack Transformation
complexity_label: O(n) push / O(1) pop
prerequisite:
  - queue-core-concept-introduction
  - stack-core-concept-introduction
  - queue-using-stacks
next:
  - queue-bfs-level-order-traversal
learning_goal:
  - Simulate LIFO behavior using queues by rotating elements during push or pop.
exit_criteria:
  - Reorder queue elements so the newest element stays at the front.
  - Analyze the time trade-off between costly push vs costly pop.
leetcode:
  - 225
tags:
  - stack
  - queue
  - design
---

## Author Hints

- 核心觀念：Rotate newly added elements to the front of the queue to maintain LIFO order.
- Pattern 辨識線索：Need stack behavior using only queue interfaces.
- Thinking：When pushing a new element, push it and then rotate all previous elements behind it.
- Common Mistakes：Mixing up queue directions during rotation.
- TypeScript 重點：Use queue push and shift methods carefully.
- Python 重點：Use collections.deque for efficient rotations.
- 題號 225 為何適合此 Pattern：Direct implementation of stack semantics using queue operations.
