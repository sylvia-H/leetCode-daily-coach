---
id: queue-using-stacks
title: Implement Queue using Stacks
module: queue
topic: queue
difficulty: easy
estimated_minutes: 15
pattern_label: Stack-to-Queue Transformation
complexity_label: O(1) amortized / O(n)
prerequisite:
  - queue-core-concept-introduction
  - stack-core-concept-introduction
  - queue-circular-buffer
next:
  - stack-using-queues
learning_goal:
  - >-
    Simulate FIFO behavior using two LIFO stacks with amortized O(1) time
    complexity.
exit_criteria:
  - Manage input and output stacks correctly.
  - Understand why amortized analysis guarantees O(1) per operation.
leetcode:
  - 232
tags:
  - queue
  - stack
  - amortized
---

## Author Hints

- 核心觀念：Pour elements from an input stack to an output stack to reverse order and achieve FIFO.
- Pattern 辨識線索：Need queue behavior but only stack operations are allowed.
- Thinking：Push to inStack; when outStack is empty, pop all from inStack and push to outStack.
- Common Mistakes：Transferring elements from inStack to outStack when outStack is not empty.
- TypeScript 重點：Use two arrays acting as push/pop stacks.
- Python 重點：Use two standard Python lists.
- 題號 232 為何適合此 Pattern：Classic problem requiring two stacks to simulate queue behavior.
