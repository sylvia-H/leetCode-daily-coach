---
id: hash-table-complement-lookup
title: Complement Lookup for Pair Finding
module: hash-table
topic: hash-table
difficulty: easy
estimated_minutes: 15
pattern_label: Complement Hash
complexity_label: O(n) / O(n)
prerequisite:
  - hash-table-concept-introduction
  - array-two-pointers-opposite
  - hash-table-frequency-counting
next:
  - hash-table-existence-tracking
learning_goal:
  - >-
    Find target pairs or relationships by checking for their mathematical
    complements in a hash map.
exit_criteria:
  - 'Can identify the complement condition (e.g., target - current)'
  - Can retrieve past elements during a single linear scan
leetcode:
  - 1
  - 1679
tags:
  - hash-table
  - two-sum
---

## Author Hints

- 核心觀念：As you iterate, check if the complement of the current element already exists in the map.
- Pattern 辨識線索：Looking for two elements that sum up to a specific target value.
- Thinking：Compute target - current_value and check if it is already stored in the hash map.
- Common Mistakes：Adding all elements to the map before checking, causing self-matching issues.
- TypeScript 重點：Check existence with map.has() before adding the current element to avoid using an element with itself.
- Python 重點：Check in dict during iteration rather than pre-populating.
- 題號 1 為何適合此 Pattern：Two Sum checks if target - nums[i] is already in the map.
- 題號 1679 為何適合此 Pattern：Max Number of K-Sum Pairs can be solved using hash map complement counts.
