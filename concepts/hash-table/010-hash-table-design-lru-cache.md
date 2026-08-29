---
id: hash-table-design-lru-cache
title: Hash Map with Doubly Linked List for O(1) Cache
module: hash-table
topic: hash-table
difficulty: medium
estimated_minutes: 20
pattern_label: HashMap + Doubly Linked List
complexity_label: O(1) / O(n)
prerequisite:
  - hash-table-concept-introduction
  - hash-table-longest-consecutive-sequence
next: []
learning_goal:
  - '結合 hash map 與 doubly linked list，設計 get 與 put 皆為 O(1) 的資料結構。'
exit_criteria:
  - '能說明為何單靠 hash map 不足以實作 LRU cache（需要順序性）'
  - '能使用 linked list 實作節點的搬移與淘汰'
leetcode:
  - 146
  - 460
tags:
  - hash-table
  - design
  - linked-list
---

## Author Hints

- 核心觀念：Combine a hash map for O(1) access with a doubly linked list for O(1) insertion and deletion order tracking.
- Pattern 辨識線索：Design data structure requiring O(1) get and put with capacity eviction policy (LRU/LFU).
- Thinking：Map stores key to list node pointers. List maintains recency order from head (most recent) to tail (least recent).
- Common Mistakes：Forgetting to update both the hash map and the linked list pointers during eviction or updates.
- TypeScript 重點：Implement explicit Node class with prev and next pointers for the doubly linked list.
- Python 重點：Create helper methods inside the class for adding and removing nodes from the linked list.
- 題號 146 為何適合此 Pattern：LRU Cache requires O(1) operations for both lookup and eviction order maintenance.
- 題號 460 為何適合此 Pattern：LFU Cache extends this pattern by tracking access frequencies with multiple linked lists.
