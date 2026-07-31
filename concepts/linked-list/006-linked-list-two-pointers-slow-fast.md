---
id: linked-list-two-pointers-slow-fast
title: 'Linked List Two Pointers: Slow and Fast'
module: linked-list
topic: linked-list
difficulty: medium
estimated_minutes: 25
pattern_label: Slow and Fast Pointers
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-dummy-head-pattern
next:
  - linked-list-cycle-detection-floyd
learning_goal:
  - >-
    Master the offset traversal technique using two pointers moving at different
    speeds.
exit_criteria:
  - Can find the middle node of a linked list in a single pass
  - Can find the kth node from the end using an offset gap
leetcode:
  - 876
  - 19
tags:
  - linked-list
  - two-pointers
  - slow-fast
---

## Author Hints

- 核心觀念：Moving a fast pointer twice as fast as a slow pointer allows finding midpoints or maintaining fixed-distance windows.
- Pattern 辨識線索：Problems asking for the middle element, removing the nth node from the end, or detecting structural offsets.
- Thinking：Advance fast by n steps first, then move slow and fast together until fast hits the tail.
- Common Mistakes：Off-by-one errors when calculating the exact step count for the offset gap.
- TypeScript 重點：Check nullability on fast and fast.next during movement loops.
- Python 重點：Use simultaneous pointer assignment in loops where appropriate.
- 題號 876 為何適合此 Pattern：Classic slow and fast pointer setup where fast reaches the end when slow reaches the middle.
- 題號 19 為何適合此 Pattern：Maintains an n-step gap between fast and slow pointers to locate the target node from the end.
