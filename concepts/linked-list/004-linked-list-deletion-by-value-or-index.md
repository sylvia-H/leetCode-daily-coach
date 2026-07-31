---
id: linked-list-deletion-by-value-or-index
title: Linked List Deletion by Value or Index
module: linked-list
topic: linked-list
difficulty: easy
estimated_minutes: 20
pattern_label: Pointer Manipulation
complexity_label: O(n) / O(1)
prerequisite:
  - linked-list-insertion-head-tail
next:
  - linked-list-dummy-head-pattern
learning_goal:
  - >-
    Understand how to bypass a target node by adjusting the previous node's next
    pointer.
exit_criteria:
  - 'Can remove a node from the middle, head, or tail of a list'
  - Can correctly deallocate or bypass the target node reference
leetcode:
  - 237
  - 203
tags:
  - linked-list
  - deletion
  - pointers
---

## Author Hints

- 核心觀念：To delete a node, you must stop at its predecessor and point predecessor.next to target.next.
- Pattern 辨識線索：Problems requiring filtering out specific values or removing elements at given positions.
- Thinking：Keep track of the previous node so that prev.next can bridge across the node being deleted.
- Common Mistakes：Failing to handle the edge case where the head node itself needs to be deleted.
- TypeScript 重點：Check that prev and prev.next exist before attempting pointer reassignment.
- Python 重點：Watch out for off-by-one errors when tracking index positions.
- 題號 237 為何適合此 Pattern：Deletes a node given only access to that node by copying the next node's value and bypassing it.
- 題號 203 為何適合此 Pattern：Removes all elements with a specific value, requiring careful predecessor tracking.
