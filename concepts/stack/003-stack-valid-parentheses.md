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
  - 使用 stack 匹配括號等巢狀結構。
exit_criteria:
  - 能用 stack 針對開啟與閉合符號寫出匹配演算法。
  - 能處理未匹配的閉合符號或殘留的開啟符號等邊界情況。
leetcode:
  - 20
  - 32
  - 921
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
- 題號 32 為何適合此 Pattern：使用堆疊來追蹤括號與其對應的長度，屬於括號匹配 Pattern 的進階應用。
- 題號 921 為何適合此 Pattern：利用堆疊或計數概念來判斷最少需要補齊多少括號，呼應括號匹配的 Pattern。
