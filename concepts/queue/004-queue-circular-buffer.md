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
  - '用環狀陣列搭配 head、tail 與模數運算，實作固定大小的佇列。'
exit_criteria:
  - '能用模數運算讓陣列索引繞回開頭。'
  - '能區分 circular buffer 的滿與空兩種狀態。'
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
