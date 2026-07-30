---
id: stack-next-greater-element-ii
title: Stack Next Greater Element II
module: stack
topic: stack
difficulty: medium
estimated_minutes: 20
pattern_label: Circular Monotonic Stack
complexity_label: O(n) / O(n)
prerequisite:
  - stack-daily-temperatures
next:
  - stack-online-stock-span
learning_goal:
  - Apply monotonic stack techniques to circular arrays by iterating twice.
exit_criteria:
  - Can simulate circular array traversal using modulo indexing.
  - Can find next greater elements across array wrap-arounds.
leetcode:
  - 503
tags:
  - stack
  - monotonic-stack
  - circular-array
---

## Author Hints

- 核心觀念：Iterate through the array twice from right to left (or use modulo) to handle circular next greater queries.
- Pattern 辨識線索：Next greater element problems where the array is circular.
- Thinking：Pretend the array is concatenated with itself to give elements at the end a chance to look at the beginning.
- Common Mistakes：Forgetting to use modulo arithmetic for index wrapping.
- TypeScript 重點：Use 2 * n - 1 down to 0 loops with i % n for index access.
- Python 重點：Looping through range(2 * n - 1, -1, -1) handles the circular sweep cleanly.
- 題號 503 為何適合此 Pattern：Circular nature requires wrapping around the array using a monotonic stack.
