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
  - 使用 dummy sentinel 節點，消除涉及修改 head 的邊界情況。
exit_criteria:
  - 能初始化一個指向實際 head 的 dummy 節點
  - 能一致地回傳 dummy.next 作為修改後的串列 head
leetcode:
  - 203
  - 83
  - 2
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
- 題號 2 為何適合此 Pattern：在處理兩數相加時，使用虛擬頭節點能極大化簡化進位與新節點串接的邊界條件。
