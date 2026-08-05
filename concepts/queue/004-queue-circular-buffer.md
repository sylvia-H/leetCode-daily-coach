---
id: queue-circular-buffer
title: Queue Circular Buffer
module: queue
topic: queue
difficulty: medium
estimated_minutes: 20
pattern_label: FIFO Queue
complexity_label: O(1) / O(n)
prerequisite:
  - queue-linked-list-implementation
next:
  - queue-using-stacks
learning_goal:
  - >-
    Implement a fixed-size queue using a circular array with head, tail, and
    modulo arithmetic.
exit_criteria:
  - Use modulo arithmetic to wrap around array indices.
  - Distinguish between full and empty states in a circular buffer.
leetcode:
  - 622
tags:
  - queue
  - array
  - design
---

## Author Hints

- 核心觀念：Reuse array slots by wrapping indices around using modulo operators.
- Pattern 辨識線索：Design a data structure with fixed maximum capacity and O(1) operations.
- Thinking：Advance head and tail pointers using (index + 1) % capacity.
- Common Mistakes：Off-by-one errors when checking if the queue is full versus empty.
- TypeScript 重點：Ensure fixed array allocation in initialization.
- Python 重點：Preallocate a fixed-size list for better memory control.
- 題號 622 為何適合此 Pattern：Direct application of designing a circular queue with fixed capacity.
