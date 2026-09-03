---
id: linked-list-insertion-head-tail
title: Linked List Insertion at Head and Tail
module: linked-list
topic: linked-list
difficulty: easy
estimated_minutes: 20
pattern_label: Pointer Manipulation
complexity_label: 'O(1) for head, O(n) or O(1) with tail / O(1)'
prerequisite:
  - linked-list-traversal-basics
next:
  - linked-list-deletion-by-value-or-index
learning_goal:
  - 學會如何重新接線指標，在 linked list 的開頭或結尾插入新節點。
exit_criteria:
  - 能藉由正確更新 head 指標，以 O(1) 時間在開頭插入節點
  - 能處理如插入初始為空的串列等邊界情況
leetcode:
  - 707
tags:
  - linked-list
  - insertion
  - pointers
---

## Author Hints

- 核心觀念：Insertion involves creating a new node and carefully reassigning the new node's next pointer before updating the list anchor.
- Pattern 辨識線索：Problems requiring building a linked list dynamically or implementing custom data structures.
- Thinking：For head insertion: newNode.next = head, then head = newNode. Always link the new node to the existing chain first to avoid losing references.
- Common Mistakes：Updating head before pointing the new node to the old head, which severs the rest of the list.
- TypeScript 重點：Carefully manage null references when the list is initially empty.
- Python 重點：Assign pointers in the correct sequential order to prevent data loss.
- 題號 707 為何適合此 Pattern：Requires implementing addAtHead, addAtTail, and addAtIndex operations explicitly.
