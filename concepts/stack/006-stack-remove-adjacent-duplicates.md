---
id: stack-remove-adjacent-duplicates
title: Stack Remove Adjacent Duplicates
module: stack
topic: stack
difficulty: easy
estimated_minutes: 15
pattern_label: Duplicate Elimination
complexity_label: O(n) / O(n)
prerequisite:
  - stack-array-implementation
  - string-linear-scan
  - stack-evaluate-reverse-polish-notation
next:
  - stack-daily-temperatures
learning_goal:
  - Use a stack to filter out adjacent matching elements dynamically.
exit_criteria:
  - Can compare current element with stack top to remove duplicates.
  - Can reconstruct the resulting string from the stack.
leetcode:
  - 1047
  - 1209
tags:
  - stack
  - string
---

## Author Hints

- 核心觀念：If the current character matches the top of the stack, pop it; otherwise, push the character.
- Pattern 辨識線索：Problems requiring cancellation of adjacent identical elements.
- Thinking：Build the final sequence by filtering out pairs as they form.
- Common Mistakes：Reversing the stack order incorrectly when converting back to a string.
- TypeScript 重點：Accumulate characters in an array and join them at the end.
- Python 重點：Use a list as a stack and ''.join(stack) to return the result.
- 題號 1047 為何適合此 Pattern：Adjacent matching characters cancel each other out like a LIFO sequence.
- 題號 1209 為何適合此 Pattern：使用堆疊記錄字元與連續出現次數，是相鄰重複消除 Pattern 的中等難度擴充。
