---
id: stack-online-stock-span
title: Stack Online Stock Span
module: stack
topic: stack
difficulty: medium
estimated_minutes: 20
pattern_label: Monotonic Stack with Accumulation
complexity_label: O(1) amortized
prerequisite:
  - stack-daily-temperatures
  - stack-next-greater-element-ii
next:
  - stack-sum-of-subarray-minimums
learning_goal:
  - >-
    Use a monotonic stack to calculate spans or cumulative counts of smaller
    elements.
exit_criteria:
  - 'Can store pairs of (value, span) in a monotonic stack.'
  - Can aggregate counts of consecutive smaller elements efficiently.
leetcode:
  - 901
tags:
  - stack
  - monotonic-stack
  - design
---

## Author Hints

- 核心觀念：Maintain a monotonic decreasing stack of price-span pairs to accumulate counts dynamically.
- Pattern 辨識線索：Online queries asking for the number of consecutive previous days with values less than or equal to current.
- Thinking：Pop smaller or equal elements and accumulate their spans before pushing the current value and total span.
- Common Mistakes：Failing to accumulate the span correctly when multiple smaller elements are popped.
- TypeScript 重點：Design a class with a next method retaining stack state across calls.
- Python 重點：Design a class with an internal stack initialized in __init__.
- 題號 901 為何適合此 Pattern：Online stream queries matching consecutive smaller or equal elements.
