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
  - 利用數學上的指標定位，找出 linked list 環的確切起始節點。
exit_criteria:
  - 能在相遇後將其中一個指標重設回 head，並讓兩者以速度 1 前進，找到入環節點
  - 能說明相遇距離背後的數學證明
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
