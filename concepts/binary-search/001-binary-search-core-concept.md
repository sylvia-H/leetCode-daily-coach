---
id: binary-search-core-concept
title: Binary Search Core Concept
module: binary-search
topic: binary-search
difficulty: easy
estimated_minutes: 15
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - array-memory-layout
next:
  - binary-search-inclusive-bounds
learning_goal:
  - >-
    Understand the divide-and-conquer principle of halving the search space in a
    sorted array.
exit_criteria:
  - Can explain why time complexity is logarithmic.
  - Can identify sorted array precondition.
leetcode:
  - 704
  - 34
tags:
  - binary-search
  - array
---

## Author Hints

- 核心觀念：Repeatedly halve the search interval in a sorted array to locate the target.
- Pattern 辨識線索：Given a sorted array and a target to find, linear scan is too slow.
- Thinking：Check the middle element, discard half the array based on comparison.
- Common Mistakes：Forgetting that the array must be sorted first.
- TypeScript 重點：Use Math.floor for midpoint calculation to avoid fractional indices.
- Python 重點：Use integer division // for midpoint calculation.
- 題號 704 為何適合此 Pattern：A textbook example of standard binary search on a sorted array.
- 題號 34 為何適合此 Pattern：此題需要使用二分搜尋的核心觀念在排序陣列中尋找目標值的範圍。
