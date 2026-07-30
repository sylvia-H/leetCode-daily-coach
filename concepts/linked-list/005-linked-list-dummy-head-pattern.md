---
id: linked-list-dummy-head-pattern
title: Linked List Dummy Head Pattern
module: linked-list
topic: linked-list
difficulty: easy
estimated_minutes: 15
pattern_label: Sentinel Node
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-deletion-by-value-or-index
next:
  - linked-list-two-pointers-slow-fast
learning_goal:
  - >-
    Use a dummy sentinel node to eliminate edge cases involving head
    modifications.
exit_criteria:
  - Can initialize a dummy node pointing to the real head
  - Can return dummy.next consistently as the modified list head
leetcode:
  - 203
  - 83
tags:
  - linked-list
  - dummy-head
  - sentinel
---

## Author Hints

- 核心觀念：A dummy head provides a permanent predecessor to the actual head, simplifying insertion and deletion code at the beginning of the list.
- Pattern 辨識線索：Any linked list operation where the head node might be deleted, replaced, or inserted into.
- Thinking：Create let dummy = new ListNode(0, head), perform operations starting from dummy, and return dummy..
- Common Mistakes：Returning the dummy node itself instead of dummy.next at the end of the function.
- TypeScript 重點：Initialize dummy cleanly with optional initial value and head reference.
- Python 重點：Dummy = ListNode(0), dummy.next = head is the standard idiom.
- 題號 203 為何適合此 Pattern：Simplifies removal when the target value appears at the very head of the list.
- 題號 83 為何適合此 Pattern：Removes duplicates from a sorted list cleanly using standard traversal.
