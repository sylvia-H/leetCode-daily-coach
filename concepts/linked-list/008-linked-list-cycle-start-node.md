---
id: linked-list-cycle-start-node
title: Linked List Cycle Start Node
module: linked-list
topic: linked-list
difficulty: medium
estimated_minutes: 25
pattern_label: Mathematical Cycle Resolution
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-cycle-detection-floyd
next:
  - linked-list-reversal-iterative
learning_goal:
  - >-
    Find the exact node where a linked list cycle begins using mathematical
    pointer positioning.
exit_criteria:
  - >-
    Can reset one pointer to the head after collision and advance both at speed
    1 to find the entry node
  - Can explain the mathematical proof behind the meeting distance
leetcode:
  - 142
tags:
  - linked-list
  - cycle-detection
  - math
---

## Author Hints

- 核心觀念：Once slow and fast meet inside a cycle, resetting one pointer to the head and moving both at speed 1 will cause them to meet at the cycle start.
- Pattern 辨識線索：Finding the exact entry point of a loop in a linked list.
- Thinking：Detect collision point, reset pointer A to head, keep pointer B at meeting point, advance both by 1 until they meet.
- Common Mistakes：Failing to verify if a cycle actually exists before running the start-node finding logic.
- TypeScript 重點：Ensure type definitions account for guaranteed non-null collision outcomes.
- Python 重點：Clear variable reassignment makes the second phase concise.
- 題號 142 為何適合此 Pattern：Requires locating the exact node where the cycle begins after detection.
