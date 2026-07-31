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
  - Evaluate postfix expressions using a stack for operands.
exit_criteria:
  - Can push operands and apply operators to the top two stack elements.
  - Understand operator precedence handling in postfix notation.
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
