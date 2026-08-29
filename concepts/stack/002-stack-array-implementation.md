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
  - 使用動態陣列實作基本的 stack，並分析其時間複雜度。
exit_criteria:
  - 能用陣列實作 push、pop、top 與 isEmpty 操作。
  - 理解為何在陣列尾端進行 push/pop 是攤銷 O(1)。
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
