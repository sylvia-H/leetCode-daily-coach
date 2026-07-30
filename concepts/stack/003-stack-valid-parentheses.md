---
id: stack-valid-parentheses
title: Stack Valid Parentheses
module: stack
topic: stack
difficulty: easy
estimated_minutes: 15
pattern_label: Bracket Matching
complexity_label: O(n) / O(n)
prerequisite:
  - stack-array-implementation
  - string-linear-scan
next:
  - stack-asteroid-collision
learning_goal:
  - Use a stack to match nested structures like parentheses and brackets.
exit_criteria:
  - Can write a matching algorithm using a stack for open and close symbols.
  - Can handle edge cases like unmatched closing or leftover opening symbols.
leetcode:
  - 20
tags:
  - stack
  - string
---

## Author Hints

- 核心觀念：Push open brackets onto the stack and pop them when matching closing brackets appear.
- Pattern 辨識線索：Nested or paired symbols that must close in reverse order of appearance.
- Thinking：Iterate through the string, pushing open brackets, and check stack top for matches upon encountering closing brackets.
- Common Mistakes：Failing to check if the stack is empty before popping.
- TypeScript 重點：Use a map or switch statement to verify bracket pairs.
- Python 重點：Use a dictionary for matching closing to opening brackets.
- 題號 20 為何適合此 Pattern：Classic LIFO application for validating nested bracket pairs.
