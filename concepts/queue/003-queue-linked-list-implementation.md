---
id: queue-linked-list-implementation
title: Queue Linked List Implementation
module: queue
topic: queue
difficulty: medium
estimated_minutes: 15
pattern_label: FIFO Queue
complexity_label: O(1) / O(n)
prerequisite:
  - queue-array-implementation
next:
  - queue-circular-buffer
learning_goal:
  - >-
    Implement a queue using singly linked list pointers to achieve O(1) enqueue
    and dequeue operations.
exit_criteria:
  - Maintain head and tail pointers correctly during push and pop.
  - Handle edge cases like an empty queue or single-element queue.
leetcode: []
tags:
  - queue
  - linked-list
  - implementation
---

## Author Hints

- 核心觀念：Keep track of both front and rear nodes to ensure constant time operations at both ends.
- Pattern 辨識線索：Need guaranteed O(1) queue operations without costly array resizing or shifting.
- Thinking：Enqueue adds to the tail pointer; dequeue removes from the head pointer.
- Common Mistakes：Failing to update the tail pointer when the queue becomes empty.
- TypeScript 重點：Manage node references carefully to avoid memory leaks.
- Python 重點：Use a simple Node class with value and next pointers.
