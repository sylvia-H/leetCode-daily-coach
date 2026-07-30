---
id: stack-array-implementation
title: Stack Array Implementation
module: stack
topic: stack
difficulty: easy
estimated_minutes: 15
pattern_label: Dynamic Array Wrapper
complexity_label: O(1) amortized
prerequisite:
  - stack-core-concept-introduction
  - array-memory-layout
next:
  - stack-valid-parentheses
  - stack-asteroid-collision
  - stack-evaluate-reverse-polish-notation
  - stack-remove-adjacent-duplicates
  - stack-daily-temperatures
learning_goal:
  - >-
    Implement a basic stack using dynamic arrays and analyze its time
    complexity.
exit_criteria:
  - 'Can implement push, pop, top, and isEmpty operations using an array.'
  - Understand why push/pop at the end of an array is O(1) amortized.
leetcode:
  - 155
tags:
  - stack
  - implementation
---

## Author Hints

- 核心觀念：Wrapping array operations to restrict access to only the tail end.
- Pattern 辨識線索：Need to build a bounded or custom stack structure from scratch.
- Thinking：Keep track of the end of the array as the top of the stack.
- Common Mistakes：Inserting at the beginning of the array causing O(n) shifts.
- TypeScript 重點：TypeScript arrays natively support push and pop at the tail efficiently.
- Python 重點：Python lists support append and pop efficiently at the tail.
- 題號 155 為何適合此 Pattern：Requires implementing stack operations with min tracking.
