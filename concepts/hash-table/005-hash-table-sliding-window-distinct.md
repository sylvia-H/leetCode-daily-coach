---
id: hash-table-sliding-window-distinct
title: Sliding Window with Hash Set for Distinct Elements
module: hash-table
topic: hash-table
difficulty: medium
estimated_minutes: 15
pattern_label: Sliding Window Set
complexity_label: O(n) / O(k)
prerequisite:
  - hash-table-existence-tracking
  - array-two-pointers-sliding
next:
  - hash-table-sliding-window-frequency
learning_goal:
  - '透過在 hash set 中新增與移除元素，維護一個由不重複元素組成的 Sliding Window。'
exit_criteria:
  - '能擴張視窗並將元素加入 set'
  - '能在出現重複時從左側收縮視窗並自 set 移除元素'
leetcode:
  - 3
  - 219
tags:
  - hash-table
  - sliding-window
---

## Author Hints

- 核心觀念：Combine sliding window pointers with a hash set to track elements currently inside the window.
- Pattern 辨識線索：Substring or subarray problems requiring all unique elements within a dynamic or fixed range.
- Thinking：Expand right pointer, if duplicate appears, increment left pointer and remove from set until valid.
- Common Mistakes：Forgetting to remove elements from the set when shrinking the window.
- TypeScript 重點：Manage window boundaries explicitly with two pointer variables.
- Python 重點：Use a while loop to shrink the left pointer until the duplicate is eliminated.
- 題號 3 為何適合此 Pattern：Longest Substring Without Repeating Characters uses a set to maintain the current window.
- 題號 219 為何適合此 Pattern：Contains Duplicate II uses a fixed sliding window of size k with a set.
