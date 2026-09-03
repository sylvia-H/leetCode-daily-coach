---
id: stack-evaluate-reverse-polish-notation
title: Stack Evaluate Reverse Polish Notation
module: stack
topic: stack
difficulty: medium
estimated_minutes: 20
pattern_label: Expression Evaluation
complexity_label: O(n) / O(n)
prerequisite:
  - stack-array-implementation
  - stack-asteroid-collision
next:
  - stack-remove-adjacent-duplicates
learning_goal:
  - 使用 stack 存放運算元，對 postfix 運算式求值。
exit_criteria:
  - 能將運算元推入 stack，並將運算子套用到 stack 頂端的兩個元素。
  - 理解 postfix 表示法中運算子優先順序的處理方式。
leetcode:
  - 150
tags:
  - stack
  - math
---

## Author Hints

- 核心觀念：Push numbers onto the stack, and when an operator is reached, pop two numbers, compute, and push the result.
- Pattern 辨識線索：Postfix or prefix expression evaluation where operators immediately follow or precede their operands.
- Thinking：Treat the stack as a holder for waiting operands until their operator arrives.
- Common Mistakes：Mixing up the order of operands when popping for non-commutative operations like division and subtraction.
- TypeScript 重點：Be careful with integer division truncation towards zero in JavaScript/TypeScript.
- Python 重點：Python integer division (//) floors towards negative infinity, so truncation towards zero requires int(a / b).
- 題號 150 為何適合此 Pattern：RPN naturally maps to pushing operands and consuming them with operators.
