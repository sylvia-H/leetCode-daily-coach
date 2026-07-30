---
id: binary-search-overflow-prevention
title: Binary Search Overflow Prevention
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 15
pattern_label: Binary Search
complexity_label: O(log n) / O(1)
prerequisite:
  - binary-search-inclusive-bounds
next:
  - binary-search-exclusive-bounds
learning_goal:
  - >-
    Prevent integer overflow when calculating mid in languages with fixed-width
    integers.
exit_criteria:
  - >-
    Use mid = left + Math.floor((right - left) / 2) instead of (left + right) /
    2.
leetcode:
  - 374
  - 33
tags:
  - binary-search
  - math
---

## Author Hints

- 核心觀念：Calculate midpoint safely as left + (right - left) // 2.
- Pattern 辨識線索：Large input constraints where left + right could exceed integer limits.
- Thinking：Avoid direct addition of two large indices.
- Common Mistakes：Writing (left + right) / 2 and risking overflow.
- TypeScript 重點：Essential for strict type environments or very large arrays.
- Python 重點：Python handles large ints automatically, but it is good practice.
- 題號 374 為何適合此 Pattern：Helps practice safe midpoint calculation.
- 題號 33 為何適合此 Pattern：旋轉排序陣列的搜尋需要嚴謹的中間點計算來避免溢位。
