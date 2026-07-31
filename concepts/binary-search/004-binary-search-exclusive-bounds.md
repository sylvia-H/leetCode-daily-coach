---
id: binary-search-exclusive-bounds
title: Binary Search Exclusive Bounds
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 20
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - binary-search-overflow-prevention
next:
  - binary-search-lower-bound
learning_goal:
  - >-
    Understand the [left, right) exclusive right bound pattern and while (left <
    right).
exit_criteria:
  - Configure pointers with right = n.
  - Update bounds correctly using right = mid.
leetcode:
  - 35
  - 34
tags:
  - binary-search
  - bounds
---

## Author Hints

- 核心觀念：Right boundary is outside the valid search space, initialized to n.
- Pattern 辨識線索：Useful when looking for insertion points or boundaries.
- Thinking：Loop runs while left < right, converging to the target boundary.
- Common Mistakes：Infinite loops caused by improper mid adjustment.
- TypeScript 重點：Be careful with right = mid vs right = mid - 1.
- Python 重點：Keep track of open vs closed interval semantics.
- 題號 35 為何適合此 Pattern：Can be solved elegantly using exclusive upper bounds for insertion.
- 題號 34 為何適合此 Pattern：此題可應用互斥邊界的二分搜尋策略尋找目標區間。
