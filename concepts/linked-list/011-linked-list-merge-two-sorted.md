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
  - 使用指標比較，將兩個已排序的 linked list 合併成單一排序串鏈。
exit_criteria:
  - 能比較兩個串列的 head，並將較小的節點接到結果串列的尾端
  - 能在其中一個串列先耗盡時處理剩餘節點
leetcode:
  - 21
  - 23
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
- 題號 23 為何適合此 Pattern：此題將雙指標合併的觀念擴展至多個已排序鏈結串列，常搭配最小堆積進行高效合併。
