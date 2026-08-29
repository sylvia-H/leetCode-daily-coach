---
id: binary-search-matrix-search
title: Binary Search 2D Matrix
module: binary-search
topic: binary-search
difficulty: medium
estimated_minutes: 20
pattern_label: Binary Search
complexity_label: O(log(m * n)) / O(1)
prerequisite:
  - binary-search-find-minimum-rotated
next: []
learning_goal:
  - '利用座標映射，在概念上把 2D 矩陣攤平成 1D 陣列。'
exit_criteria:
  - '能用 row = mid / cols 與 col = mid % cols 把 1D 索引轉換成 2D 座標。'
leetcode:
  - 74
tags:
  - binary-search
  - matrix
---

## Author Hints

- 核心觀念：Treat a sorted 2D matrix as a flattened 1D array via arithmetic mapping.
- Pattern 辨識線索：Matrix where rows and columns maintain sorted order properties.
- Thinking：Map mid index to matrix[mid / cols][mid % cols] for standard binary search.
- Common Mistakes：Mixing up row and column dimensions during division and modulo.
- TypeScript 重點：Ensure column count is non-zero before division.
- Python 重點：Use integer division for row index calculation.
- 題號 74 為何適合此 Pattern：A 2D matrix that can be treated as a single sorted array.
