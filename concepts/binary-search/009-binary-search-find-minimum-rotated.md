---
id: binary-search-find-minimum-rotated
title: Find Minimum in Rotated Sorted Array
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 20
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - binary-search-rotated-duplicates
next:
  - binary-search-matrix-search
learning_goal:
  - '定位旋轉排序陣列中的轉折點（最小元素）。'
exit_criteria:
  - '能比較 mid 元素與最右端元素，以決定搜尋方向。'
leetcode:
  - 153
tags:
  - binary-search
  - pivot
---

## Author Hints

- 核心觀念：If nums[mid] > nums[right], the minimum is in the right half; otherwise in the left half.
- Pattern 辨識線索：Finding the rotation pivot or minimum value.
- Thinking：Compare mid against right boundary instead of target value.
- Common Mistakes：Comparing mid against left instead of right.
- TypeScript 重點：Keep right = mid when nums[mid] < nums[right].
- Python 重點：Ensure loop terminates when left == right.
- 題號 153 為何適合此 Pattern：Finding the minimum value requires comparing against the right boundary.
