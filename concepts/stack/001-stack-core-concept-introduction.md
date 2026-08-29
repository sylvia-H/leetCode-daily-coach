---
id: stack-core-concept-introduction
title: Stack Core Concept Introduction
module: stack
topic: stack
difficulty: easy
estimated_minutes: 10
pattern_label: Last-In-First-Out (LIFO)
complexity_label: O(1) push/pop
prerequisite:
  - mental-model-variables
next:
  - stack-array-implementation
  - queue-core-concept-introduction
  - queue-using-stacks
  - stack-using-queues
learning_goal:
  - 理解 Last-In-First-Out 資料結構原理及其主要操作。
exit_criteria:
  - 能說明為何元素會以與加入相反的順序被取出。
  - 能手動追蹤 push 與 pop 操作。
leetcode: []
tags:
  - stack
  - fundamentals
---

## Author Hints

- 核心觀念：A stack is a linear collection that follows the LIFO order.
- Pattern 辨識線索：When the most recent item needs to be accessed and processed first.
- Thinking：Visualize a vertical stack of plates where you can only add or remove from the top.
- Common Mistakes：Confusing FIFO (queue) with LIFO (stack).
- TypeScript 重點：Use an array with push and pop methods to represent a stack in TypeScript.
- Python 重點：Use a list with append and pop methods to represent a stack in Python.
