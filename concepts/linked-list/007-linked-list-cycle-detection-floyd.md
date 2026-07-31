---
id: linked-list-cycle-detection-floyd
title: Linked List Cycle Detection (Floyd's Algorithm)
module: linked-list
topic: linked-list
difficulty: medium
estimated_minutes: 25
pattern_label: Cycle Detection
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-two-pointers-slow-fast
next:
  - linked-list-cycle-start-node
learning_goal:
  - >-
    Detect cycles in a linked list using constant extra space with tortoise and
    hare pointers.
exit_criteria:
  - Can implement Floyd's cycle-finding algorithm correctly
  - >-
    Can explain why slow and fast pointers are guaranteed to meet if a cycle
    exists
leetcode:
  - 141
  - 142
tags:
  - linked-list
  - cycle-detection
  - floyd
---

## Author Hints

- 核心觀念：If a cycle exists, a fast pointer moving 2 steps at a time will eventually meet the slow pointer moving 1 step at a time.
- Pattern 辨識線索：Problems mentioning cycles, loops, or endless traversal paths in linked structures.
- Thinking：Initialize slow and fast at head. Loop while fast and fast.next are not null, moving slow by 1 and fast by 2. If they collide, a cycle exists.
- Common Mistakes：Forgetting to check fast.next before checking fast.next.next, causing null pointer exceptions.
- TypeScript 重點：Ensure strict null checks on fast pointer jumps.
- Python 重點：Keep loop conditions robust against linear terminal lists.
- 題號 141 為何適合此 Pattern：Direct application of Floyd's tortoise and hare algorithm to detect circular references.
- 題號 142 為何適合此 Pattern：此題進一步在Floyd循環偵測的基礎上，找出環的起始點，加深指標追蹤的應用。
