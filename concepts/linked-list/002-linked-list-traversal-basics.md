---
id: linked-list-traversal-basics
title: Linked List Traversal Basics
module: linked-list
topic: linked-list
difficulty: easy
estimated_minutes: 15
pattern_label: Linear Scan
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-node-memory-model
next:
  - linked-list-insertion-head-tail
learning_goal:
  - 精通使用暫時指標安全走訪每個節點的標準走訪迴圈。
exit_criteria:
  - 能寫出以 current = current.next 前進且不遺失參照的 while 迴圈
  - 能正確處理空串列的情況
leetcode:
  - 876
  - 430
tags:
  - linked-list
  - traversal
  - linear-scan
---

## Author Hints

- 核心觀念：Iterate through a linked list by maintaining a current pointer that steps forward until reaching null.
- Pattern 辨識線索：Any problem requiring inspection or searching through all elements of a singly linked list.
- Thinking：Initialize current = head, then loop while current is not null, processing current.val before moving current = current.next.
- Common Mistakes：Advancing current twice in a single loop iteration or mutating the head pointer directly during traversal.
- TypeScript 重點：Ensure type guards or explicit checks ensure current is not null before accessing properties.
- Python 重點：A standard 'while curr:' loop handles traversal cleanly.
- 題號 876 為何適合此 Pattern：Requires traversing the entire list to count nodes or finding the middle via sequential scanning.
- 題號 430 為何適合此 Pattern：此題需要透過多層次的鏈結串列遍歷與指標追蹤，展現線性掃描的核心技巧。
