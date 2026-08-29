---
id: binary-search-upper-bound
title: Binary Search Upper Bound
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 20
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - binary-search-lower-bound
next:
  - binary-search-rotated-array
learning_goal:
  - '找出第一個嚴格大於 target 的元素。'
exit_criteria:
  - '能在 nums[mid] > target 時正確調整指標。'
leetcode:
  - 34
tags:
  - binary-search
  - bound
---

## Author Hints

- 核心觀念：When nums[mid] > target, move right to mid; when <= target, move left to mid + 1.
- Pattern 辨識線索：Finding range boundaries or upper limit indices.
- Thinking：Differentiate between strict greater than and greater than or equal to.
- Common Mistakes：Off-by-one errors in boundary adjustments.
- TypeScript 重點：Trace with duplicate elements to verify.
- Python 重點：Verify against empty or all-matching arrays.
- 題號 34 為何適合此 Pattern：Used alongside lower bound to find the upper range limit.
