---
id: hash-table-concept-introduction
title: Introduction to Hash Table and Key-Value Mapping
module: hash-table
topic: hash-table
difficulty: easy
estimated_minutes: 10
pattern_label: Hash Map
complexity_label: O(1) / O(n)
prerequisite:
  - array-memory-layout
next:
  - hash-table-frequency-counting
  - hash-table-complement-lookup
  - hash-table-existence-tracking
  - hash-table-design-lru-cache
  - string-ascii-representation
learning_goal:
  - >-
    Understand how key-value pairs are stored and retrieved using hash
    functions.
exit_criteria:
  - Can explain why average lookup time is O(1)
  - Can write a basic map insertion and retrieval
leetcode:
  - 1
  - 217
  - 128
tags:
  - hash-table
  - basics
---

## Author Hints

- 核心觀念：A hash table maps keys to values for fast O(1) average-time lookups.
- Pattern 辨識線索：Need to associate unique keys with values and perform frequent lookups.
- Thinking：Think of an array where indices can be arbitrary keys instead of contiguous integers.
- Common Mistakes：Assuming hash table operations are strictly O(1) in the worst case due to collisions.
- TypeScript 重點：Use Map objects in TypeScript instead of plain objects to avoid prototype pollution and support arbitrary key types.
- Python 重點：Use standard dictionary structures dict() for average O(1) lookups.
- 題號 1 為何適合此 Pattern：Two Sum uses a hash map to check for the complement in O(1) time.
- 題號 217 為何適合此 Pattern：Contains Duplicate utilizes hash sets to track seen elements efficiently.
- 題號 128 為何適合此 Pattern：利用雜湊表以 O(n) 時間尋找連續序列，展示了雜湊對映在快速查找上的核心應用。
