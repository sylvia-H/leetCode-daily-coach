---
id: binary-search-inclusive-bounds
title: Binary Search Inclusive Bounds
module: binary-search
topic: binary-search
difficulty: easy
estimated_minutes: 15
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - binary-search-core-concept
next:
  - binary-search-overflow-prevention
learning_goal:
  - '熟練閉區間 [left, right] 的指標設定與迴圈條件 left <= right。'
exit_criteria:
  - '能為閉區間正確初始化指標。'
  - '能使用正確的終止條件。'
leetcode:
  - 704
  - 34
tags:
  - binary-search
  - pointers
---

## Author Hints

- 核心觀念：Use left = 0 and right = n - 1 with while (left <= right).
- Pattern 辨識線索：Standard template for exact match search.
- Thinking：When left exceeds right, the search space is exhausted without a match.
- Common Mistakes：Using left < right which might miss the single element case.
- TypeScript 重點：Ensure loop condition handles equality correctly.
- Python 重點：Ensure while left <= right is properly bounded.
- 題號 704 為何適合此 Pattern：Fits the standard inclusive bounds template perfectly.
- 題號 34 為何適合此 Pattern：此題利用包含邊界的二分搜尋邏輯來尋找陣列中左右邊界。
