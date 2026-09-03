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
  - '用兩個 LIFO 堆疊模擬 FIFO 行為，並達到攤銷（amortized）O(1) 的時間複雜度。'
exit_criteria:
  - '能正確管理 input 與 output 兩個堆疊。'
  - '能理解為何攤銷分析能保證每次操作為 O(1)。'
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
