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
  - >-
    Understand the Last-In-First-Out data structure principle and its primary
    operations.
exit_criteria:
  - Can explain why elements are retrieved in reverse order of insertion.
  - Can trace push and pop operations manually.
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
