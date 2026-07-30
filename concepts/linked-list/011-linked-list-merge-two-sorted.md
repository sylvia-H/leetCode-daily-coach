---
id: linked-list-merge-two-sorted
title: Merge Two Sorted Linked Lists
module: linked-list
topic: linked-list
difficulty: easy
estimated_minutes: 20
pattern_label: Two-Pointer Merge
complexity_label: O(n + m) / O(1)
prerequisite:
  - linked-list-reversal-recursive
next:
  - linked-list-palindrome-check
learning_goal:
  - >-
    Merge two sorted linked lists into a single sorted chain using pointer
    comparison.
exit_criteria:
  - Can compare heads of two lists and attach the smaller node to a result tail
  - Can handle remaining nodes when one list exhausts before the other
leetcode:
  - 21
tags:
  - linked-list
  - merge
  - sorting
---

## Author Hints

- 核心觀念：Use a dummy head and compare the current nodes of list1 and list2, appending the smaller one to the result chain.
- Pattern 辨識線索：Combining two sorted sequences into a single sorted linked structure.
- Thinking：Loop while both lists have nodes, attach min to tail pointer, and attach the remaining non-empty list at the end.
- Common Mistakes：Forgetting to attach the remainder of the unfinished list after the main comparison loop.
- TypeScript 重點：Maintain tail pointer to append new nodes efficiently in O(1) per step.
- Python 重點：Direct pointer attachment avoids manual garbage collection concerns.
- 題號 21 為何適合此 Pattern：Direct merging of two sorted linked lists using a sentinel dummy head.
